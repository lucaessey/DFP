import test from 'node:test';
import assert from 'node:assert/strict';
import {validateComment,ownerClaims,parseFilter,OWNER_EMAIL} from '../shared/comments.js';
import {moderate} from '../worker/moderation.js';
import {CommentService,SpamLimits} from '../worker/core.js';
import {createHandler} from '../worker/api.js';
import {verifyFirebaseToken,requireOwner} from '../worker/firebase.js';
import {generateKeyPair,SignJWT} from 'jose';

const input=(audience='everyone',text='This game is good.',rating=5)=>({text,audience,rating,acknowledged:audience==='producer',requestId:crypto.randomUUID()});
const who=(uid='player')=>({uid,ip:'hashed-ip',owner:false});
class MemoryStore {
  constructor(){this.data={};this.writes=0;}
  async get(path){return structuredClone(this.data[path]??null);}
  async patch(patch){this.writes++;for(const [key,value] of Object.entries(patch)){if(value===null)delete this.data[key];else this.data[key]=JSON.parse(JSON.stringify(value),(_,v)=>v?.['.sv']==='timestamp'?Date.now():v);}}
  async list(path,limit,cursor){return Object.fromEntries(Object.entries(this.data).filter(([key])=>key.startsWith(path+'/')).map(([key,v])=>[key.slice(path.length+1),v]).filter(([key])=>!cursor||key<=cursor).sort(([a],[b])=>a.localeCompare(b)).slice(-limit));}
}
function setup(options={}){const db=new MemoryStore(),memory=new Map(),storage={get:async k=>memory.get(k),put:async values=>Object.entries(values).forEach(([k,v])=>memory.set(k,v))};let now=1800000000000;return {db,memory,service:new CommentService({db,limits:options.limits||{consume:async()=>{}},now:()=>++now,...options}),storage};}
test('comments strictly validate both audiences, stars, whitespace, size and acknowledgement',()=>{
  for(const rating of [1,2,3,4,5])assert.equal(validateComment(input('everyone',' Good game! ',rating)).rating,rating);
  for(const rating of [0,6,1.5,'5',null,NaN])assert.throws(()=>validateComment({...input(),rating}));
  for(const text of ['', '  \n\t ', '\u200b\u200d','a'.repeat(501)])assert.throws(()=>validateComment(input('everyone',text)));
  assert.equal(validateComment(input('producer','a'.repeat(500))).text.length,500);
  assert.throws(()=>validateComment({...input('producer'),acknowledged:false}));
  for(const audience of ['real','funny','public','admin',null])assert.throws(()=>validateComment({...input(),audience}));
});
test('trusted language checks allow criticism and reject disguised abuse, with conservative review fallback',()=>{
  for(const text of ['This game is good.','The game is slow and the food is cold.','I do not like this game.','The prices are too expensive.'])assert.equal(moderate(text).decision,'allow',text);
  for(const text of ['f.u.c.k','sh1t','fuuuck','n1gg3r','I will kill you','I will hurt you','Go die','You are a stupid idiot','p0rn','f\u200bu\u200bc\u200bk'])assert.equal(moderate(text).decision,'reject',text);
  for(const text of ['Visit https://example.com','Quizzical confetti!','你好','<img src=x>'])assert.equal(moderate(text).decision,'review',text);
});
test('public projections contain no author, audience or moderation data; private/pending are separate',async()=>{
  const {db,service}=setup();const publicResult=await service.submit(input(),who());const privateResult=await service.submit(input('producer'),who());const pending=await service.submit(input('everyone','Quizzical confetti!'),who());
  const feed=await service.list('public',{stars:'all'});assert.equal(feed.comments.length,1);assert.equal(feed.comments[0].id,publicResult.id);assert.deepEqual(Object.keys(feed.comments[0]).sort(),['createdAt','id','key','rating','text']);
  assert.equal((await service.list('private',{stars:'all'})).comments[0].id,privateResult.id);assert.equal((await service.list('pending',{stars:'all'})).comments[0].id,pending.id);
  assert.ok(Object.keys(db.data).every(k=>!k.startsWith('public/')||!JSON.stringify(db.data[k]).includes('uid')));
});
test('duplicate requests bind payload and author and never repeat accepted or rejected writes',async()=>{
  const {service,db}=setup();const value=input();const first=await service.submit(value,who());assert.deepEqual(await service.submit(value,who()),first);assert.equal(db.writes,1);
  await assert.rejects(service.submit({...value,rating:1},who()),e=>e.status===409);
  const other=await service.submit(value,who('other'));assert.notEqual(other.id,first.id);
  const rejected=input('producer','fuck');assert.equal((await service.submit(rejected,who())).status,'rejected');const count=db.writes;await service.submit(rejected,who());assert.equal(db.writes,count);
});
test('moderation failure holds both audiences privately',async()=>{
  const {service}=setup({classify:()=>{throw new Error('offline');}});
  for(const audience of ['everyone','producer'])assert.equal((await service.submit(input(audience),who())).status,'pending');
  assert.equal((await service.list('public',{stars:'all'})).comments.length,0);
});
test('owner approval preserves private audience; read and approve/reject/hide retries are safe',async()=>{
  const {service,db}=setup();const privatePending=await service.submit(input('producer','Quizzical confetti!'),who());
  const approve={id:privatePending.id,action:'approve',requestId:crypto.randomUUID(),revision:1};
  await assert.rejects(service.act(approve,who()),e=>e.status===403);
  const owner={...who('owner'),owner:true};assert.equal((await service.act(approve,owner)).status,'producer');const writes=db.writes;await service.act(approve,owner);assert.equal(db.writes,writes);
  assert.equal((await service.list('public',{stars:'all'})).comments.length,0);
  await service.act({id:privatePending.id,action:'read',requestId:crypto.randomUUID(),revision:2},owner);assert.equal((await service.list('private',{stars:'all'})).comments[0].read,true);
  const pending=await service.submit(input('everyone','Quizzical confetti!'),who());const publicApprove={id:pending.id,action:'approve',requestId:crypto.randomUUID(),revision:1};await service.act(publicApprove,owner);
  await service.act({id:pending.id,action:'hide',requestId:crypto.randomUUID(),revision:2},owner);await service.act(publicApprove,owner);assert.equal((await service.list('public',{stars:'all'})).comments.length,0);
  await assert.rejects(service.act({...publicApprove,requestId:crypto.randomUUID()},owner),e=>e.status===409);
  const denied=await service.submit(input('producer','Quizzical confetti!'),who());
  const reject={id:denied.id,action:'reject',requestId:crypto.randomUUID(),revision:1};
  assert.equal((await service.act(reject,owner)).status,'rejected');
  const rejectedWrites=db.writes;assert.equal((await service.act(reject,owner)).status,'rejected');assert.equal(db.writes,rejectedWrites);
  assert.ok((await service.list('private',{stars:'all'})).comments.every(row=>row.id!==denied.id));
  assert.ok((await service.list('pending',{stars:'all'})).comments.every(row=>row.id!==denied.id));
});
test('reports hold only previously public comments and cannot expose private records',async()=>{
  const {service,db}=setup();const pub=await service.submit(input(),who());const report={id:pub.id,action:'report',requestId:crypto.randomUUID()};assert.deepEqual(await service.act(report,who('reporter')),{status:'reported'});const n=db.writes;await service.act(report,who('reporter'));assert.equal(db.writes,n);
  assert.equal((await service.list('public',{stars:'all'})).comments.length,0);assert.ok((await service.list('pending',{stars:'all'})).comments[0].reported);
  const priv=await service.submit(input('producer'),who());await assert.rejects(service.act({...report,id:priv.id},who('other')),e=>e.status===404);
});
test('bounded key pagination supports multiple complete pages and exact rating filters',async()=>{
  const {service}=setup();for(let n=0;n<65;n++)await service.submit(input('everyone','Good game.',n%5+1),who());
  const all=[];let cursor;do{const page=await service.list('public',{stars:'all',cursor});assert.ok(page.comments.length<=20);all.push(...page.comments);cursor=page.next;}while(cursor);
  assert.equal(all.length,65);assert.equal(new Set(all.map(r=>r.id)).size,65);assert.deepEqual(all.map(r=>r.key),all.map(r=>r.key).sort().reverse());
  const selected=await service.list('public',{stars:'2'});assert.equal(selected.comments.length,13);assert.ok(selected.comments.every(r=>r.rating===2));
  assert.throws(()=>parseFilter(new URLSearchParams({stars:'6'})));assert.throws(()=>parseFilter(new URLSearchParams({before:'../../private'})));
});
test('persisted spam limits enforce cooldown, hourly limits and hashed-IP limits across fresh instances',async()=>{
  const {storage}=setup();const one=new SpamLimits(storage);await one.consume(who(),'submit',1000000);await assert.rejects(new SpamLimits(storage).consume(who(),'submit',1000001),e=>e.status===429);
  for(let n=1;n<6;n++)await one.consume(who(),'submit',1000000+n*31000);await assert.rejects(one.consume(who(),'submit',1300000),e=>e.status===429);
  for(let n=0;n<25;n++)await one.consume({uid:'new'+n,ip:'second-ip'},'submit',2000000+n*31000);
  await assert.rejects(one.consume({uid:'new-more',ip:'second-ip'},'submit',3000000),e=>e.status===429);
});
test('API denies unauthenticated and unauthorized owner access and direct action escalation',async()=>{
  const {service}=setup();const handler=createHandler({service,origins:['http://localhost:8080'],authenticate:async token=>who(token),authorizeOwner:async identity=>{if(identity.uid!=='owner')throw Object.assign(new Error(),{});return {...identity,owner:true};},ipIdentity:async()=> 'ip',mutate:(method,body,id)=>service[method](body,id)});
  const req=(path,method='GET',body,token)=>new Request('http://localhost'+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});
  assert.equal((await handler(req('/owner/comments?audience=producer'))).status,401);
  assert.notEqual((await handler(req('/owner/comments?audience=producer','GET',null,'anon'))).status,200);
  assert.equal((await handler(req('/report','POST',{action:'approve'},'anon'))).status,400);
  assert.equal((await handler(new Request('http://localhost/comments',{headers:{origin:'https://evil.example'}}))).status,403);
  assert.equal((await handler(req('/comments','POST',input(),'anon'))).status,200);
  const publicData=await (await handler(req('/comments'))).json();assert.equal(publicData.comments.length,1);
});
test('Firebase tokens require signed RS256, correct project, expiry and valid subjects',async()=>{
  const {publicKey,privateKey}=await generateKeyPair('RS256'),now=Math.floor(Date.now()/1000);
  const signed=overrides=>new SignJWT({sub:'user',auth_time:now,iat:now,exp:now+300,iss:'https://securetoken.google.com/dfp-game-e2926',aud:'dfp-game-e2926',...overrides}).setProtectedHeader({alg:'RS256'}).sign(privateKey);
  assert.equal((await verifyFirebaseToken(await signed({}),{keySet:publicKey})).uid,'user');
  for(const props of [{aud:'other'},{iss:'evil'},{exp:now-20},{sub:''},{auth_time:now+3600}])await assert.rejects(verifyFirebaseToken(await signed(props),{keySet:publicKey}),e=>e.status===401);
  await assert.rejects(verifyFirebaseToken('eyJhbGciOiJub25lIn0.eyJzdWIiOiJvd25lciJ9.',{keySet:publicKey}),e=>e.status===401);
});
test('owner authorization verifies current email, email verification, provider, disabled and revoked sessions',async()=>{
  const claims={uid:'owner',email:OWNER_EMAIL,email_verified:true,auth_time:200,firebase:{sign_in_provider:'password'}};
  const account={localId:'owner',email:OWNER_EMAIL,emailVerified:true,validSince:'100'};
  const check=(identity=claims,patch={})=>requireOwner(identity,'token',{FIREBASE_WEB_API_KEY:'public-key'},{fetcher:async()=>Response.json({users:[{...account,...patch}]})});
  assert.equal((await check()).owner,true);
  for(const provider of ['password','google.com']){
    const identity={...claims,firebase:{sign_in_provider:provider}};
    assert.equal((await check(identity)).owner,true);
    for(const patch of [{email:'someone@example.com'},{email_verified:false},{firebase:{sign_in_provider:'anonymous'}},{firebase:{sign_in_provider:'custom'}},{firebase:{sign_in_provider:'facebook.com'}}]){assert.equal(ownerClaims({...identity,...patch}),false);await assert.rejects(check({...identity,...patch}),e=>e.status===403);}
    for(const patch of [{disabled:true},{emailVerified:false},{validSince:'201'},{localId:'other'},{email:'other@example.com'}])await assert.rejects(check(identity,patch),e=>e.status===403);
  }
});
