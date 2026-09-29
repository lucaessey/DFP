import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,get,update,query,orderByKey,limitToLast,endAt} from 'firebase/database';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {submissionIdentity,submissionChanges,commentChanges,moderationChanges} from '../shared/manual-comments.js';
const env=await initializeTestEnvironment({projectId:'demo-dfp-comments',database:{host:'127.0.0.1',port:9000,rules:readFileSync('firebase/database.rules.json','utf8')}});
const claims={email:'lucaessey@gmail.com',email_verified:true,firebase:{sign_in_provider:'google.com'}};
const owner=env.authenticatedContext('owner',claims).database(),anon=env.authenticatedContext('author',{firebase:{sign_in_provider:'anonymous'}}).database();
const no=env.unauthenticatedContext().database(),other=env.authenticatedContext('other',{email:'other@example.com',email_verified:true,firebase:{sign_in_provider:'google.com'}}).database();
const unverified=env.authenticatedContext('unverified',{...claims,email_verified:false}).database(),wrongProvider=env.authenticatedContext('wrong-provider',{...claims,firebase:{sign_in_provider:'custom'}}).database();
const write=(db,patch)=>update(ref(db,'peopleComments'),patch),read=(db,path)=>get(ref(db,'peopleComments/'+path));
const feed=(db,path,n=21,cursor)=>get(query(ref(db,'peopleComments/'+path),orderByKey(),...(cursor?[endAt(cursor)]:[]),limitToLast(n)));
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
const make=async(uid,audience='everyone',extra={})=>{const input={text:'The game needs more tables.',rating:1,audience,acknowledged:audience==='producer',requestId:crypto.randomUUID(),...extra},identity=await submissionIdentity(input,uid);return {input,identity,patch:submissionChanges(identity,uid,null)};};
try{
  await env.clearDatabase();
  const sample=await make('author');await assertSucceeds(write(anon,sample.patch));
  const record=(await read(owner,'internal/records/'+sample.identity.id)).val();
  assert.equal(record.status,'pending');assert.equal((await feed(no,'public/all')).val(),null);
  assert.equal((await feed(owner,'pending/1')).size,1);assert.ok(Number.isFinite(record.createdAt));
  pass('Ordinary anonymous player can submit critical one-star feedback; it stays private awaiting approval');
  for(const db of [no,anon,other,unverified,wrongProvider])for(const path of ['private/all','pending/all','ownerPublic/all','internal/records/'+record.id])await assertFails(path.startsWith('internal')?read(db,path):feed(db,path));
  for(const db of [no,anon,other,unverified,wrongProvider])for(const path of ['public/all/'+record.sortKey,'ownerPublic/all/'+record.sortKey])await assertFails(set(ref(db,'peopleComments/'+path),{id:record.id,text:record.text,rating:1,createdAt:record.createdAt}));
  for(const db of [anon,other,unverified,wrongProvider])await assertFails(write(db,moderationChanges(record,{action:'approve',revision:1,requestId:crypto.randomUUID()})));
  pass('Other, anonymous, unverified and wrong-provider accounts cannot read private data, publish, or approve');
  const receipt='receipts/author/'+sample.input.requestId;
  assert.deepEqual(Object.keys((await read(anon,receipt)).val()).sort(),['createdAt','fingerprint','id','status']);
  await assertFails(read(other,receipt));await assertFails(write(anon,sample.patch));
  assert.equal((await feed(owner,'pending/all')).size,1);
  const duplicate=await make('author');await assertFails(write(anon,duplicate.patch));
  await assertFails(set(ref(anon,'peopleComments/submissionLimits/author'),null));
  pass('Private receipt confirms one submission; repeat writes, immediate spam and quota deletion are denied');
  for(const mutation of [p=>{p['internal/records/'+record.id].status='published';},p=>{p['internal/records/'+record.id].rating=6;},p=>{p['internal/records/'+record.id].rating=1.5;},p=>{p['internal/records/'+record.id].text=' ';},p=>{p['internal/records/'+record.id].text='x'.repeat(501);},p=>{p['internal/records/'+record.id].uid='other';},p=>{p['internal/records/'+record.id].admin=true;}]){
    const p=structuredClone(sample.patch);mutation(p);await assertFails(write(other,p));
  }
  // Each validation attack uses a fresh author so a quota/duplicate failure cannot mask bad field rules.
  for(const [label,change] of Object.entries({rating:r=>r.rating=6,fraction:r=>r.rating=1.5,blank:r=>r.text=' \n ',length:r=>r.text='x'.repeat(501),extra:r=>r.admin=true,unapproved:r=>r.status='published',author:r=>r.uid='someone-else',ack:r=>r.acknowledged=false})){
    const uid='attack-'+label,db=env.authenticatedContext(uid).database(),s=await make(uid,'producer');
    const r=s.patch['internal/records/'+s.identity.id];change(r);
    const p={...s.patch,...Object.fromEntries(Object.entries(commentChanges(r)).map(([key,value])=>[key.replace('/1.5/','/1/'),value]))};await assertFails(write(db,p));
  }
  pass('Rules independently reject invalid fields, missing private acknowledgement, forged authors and publication bypasses');
  const privateSample=await make('private-author','producer',{text:'Please keep this suggestion private.',rating:4});
  const privateDB=env.authenticatedContext('private-author').database();await assertSucceeds(write(privateDB,privateSample.patch));
  const privateRecord=(await read(owner,'internal/records/'+privateSample.identity.id)).val();
  assert.equal((await feed(owner,'private/4')).size,1);await assertFails(feed(privateDB,'private/4'));
  await assertFails(write(owner,commentChanges({...privateRecord,audience:'everyone',status:'published',revision:2,updatedAt:{'.sv':'timestamp'},actionId:crypto.randomUUID()},privateRecord)));
  const marked=moderationChanges(privateRecord,{action:'read',revision:1,requestId:crypto.randomUUID()});await assertSucceeds(write(owner,marked));
  assert.equal((await feed(owner,'private/4')).val()[privateRecord.sortKey].read,true);
  pass('Producer feedback is private; marking read works, and even owner writes cannot change its audience to public');
  const approvalInput={action:'approve',revision:1,requestId:crypto.randomUUID()},approval=moderationChanges(record,approvalInput);
  await assertSucceeds(write(owner,approval));
  const published=(await read(owner,'internal/records/'+record.id)).val();
  assert.deepEqual(Object.keys((await feed(no,'public/1')).val()[record.sortKey]).sort(),['createdAt','id','rating','text']);
  assert.equal((await feed(owner,'pending/1')).val(),null);
  assert.equal(moderationChanges(published,approvalInput),null);
  pass('Verified owner approval atomically publishes sanitized content and removes pending copies; retry is idempotent');
  await assertSucceeds(write(other,{['reports/'+record.id+'/other']:{createdAt:{'.sv':'timestamp'}}}));
  await assertFails(read(anon,'reports/'+record.id+'/other'));
  const reported=await get(query(ref(owner,'peopleComments/reports/'+record.id),orderByKey(),limitToLast(1)));assert.equal(reported.size,1);
  assert.equal((await feed(no,'public/1')).size,1);
  await assertSucceeds(write(owner,moderationChanges(published,{action:'hide',revision:2,requestId:crypto.randomUUID()})));
  await assertFails(write(owner,approval));assert.equal((await feed(no,'public/1')).val(),null);
  pass('Reports stay private for owner review; hide removes publication and a delayed approval cannot restore it');
  const rejected=await make('reject-author');await write(env.authenticatedContext('reject-author').database(),rejected.patch);
  const rejectRecord=(await read(owner,'internal/records/'+rejected.identity.id)).val();await write(owner,moderationChanges(rejectRecord,{action:'reject',revision:1,requestId:crypto.randomUUID()}));
  assert.equal((await read(owner,'internal/records/'+rejectRecord.id)).val().status,'rejected');
  assert.equal((await feed(owner,'pending/all')).val(),null);pass('Reject removes a pending comment without ever publishing it');
  for(const path of ['','public','private','pending','internal','receipts'])await assertFails(read(anon,path));
  await assertFails(read(owner,'internal/records'));await assertFails(read(owner,'private/all'));await assertFails(feed(owner,'private/all',22));await assertFails(feed(no,'public/6'));
  await assertSucceeds(feed(no,'public/1',21,record.sortKey));pass('Broad reads and invalid/unbounded filters are denied; exact-star cursor queries remain valid');
  // Projections cannot add different text, extra metadata or a second key, even in the initial atomic write.
  for(const kind of ['text','metadata','alias','missing']){
    const uid='projection-'+kind,s=await make(uid),db=env.authenticatedContext(uid).database(),r=s.patch['internal/records/'+s.identity.id],key='pending/all/'+r.sortKey;
    if(kind==='text')s.patch[key].text='Other content';
    if(kind==='metadata')s.patch[key].email='private@example.com';
    if(kind==='alias'){s.patch['pending/all/9999999999999_'+s.identity.id]=s.patch[key];}
    if(kind==='missing')delete s.patch[key];
    await assertFails(write(db,s.patch));
  }
  pass('Atomic projections are required, match canonical content, omit extra fields, and cannot be duplicated under another key');
  const unicode=await make('unicode','everyone',{text:'😀'.repeat(500)});await assertSucceeds(write(env.authenticatedContext('unicode').database(),unicode.patch));pass('The server accepts the full 500-character limit including emoji');
  // Rate limits must also reject valid-looking writes from a modified client.
  for(const [label,counts] of [['hour',{hourCount:6,dayCount:6}],['day',{hourCount:1,dayCount:20}]]){
    const uid='quota-'+label,db=env.authenticatedContext(uid).database(),s=await make(uid),now=Date.now();
    await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'peopleComments/submissionLimits/'+uid),{lastId:'a'.repeat(48),lastAt:now-31000,hourStart:now-100000,dayStart:now-200000,...counts}));
    await assertFails(write(db,s.patch));
  }
  pass('Hourly and daily limits cannot be reset or bypassed by a modified client');
  // Existing Worker-format records lack new request fields and sometimes reported=false.
  const legacy={...record,id:'f'.repeat(48),sortKey:Date.now()+'_'+'f'.repeat(48),status:'pending',moderationVersion:1,reason:'Legacy review.'};delete legacy.requestId;delete legacy.requestedAt;delete legacy.reported;
  await env.withSecurityRulesDisabled(ctx=>update(ref(ctx.database(),'peopleComments'),commentChanges(legacy)));
  await assertSucceeds(write(owner,moderationChanges(legacy,{action:'approve',revision:1,requestId:crypto.randomUUID()})));
  assert.equal((await feed(no,'public/1')).size,1);
  pass('Previously saved pending records remain reviewable without changing their audience or content');
  console.log(`${checks} rules checks passed.`);
}finally{await env.cleanup();}
