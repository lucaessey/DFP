import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,get,query,orderByKey,limitToLast,endAt} from 'firebase/database';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {FirebaseStore} from '../worker/firebase.js';
import {CommentService} from '../worker/core.js';
const env=await initializeTestEnvironment({projectId:'demo-dfp-comments',database:{host:'127.0.0.1',port:9000,rules:readFileSync('firebase/database.rules.json','utf8')}});
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
try{
  const key='1800000000000_'+'a'.repeat(48),pub={id:'a'.repeat(48),text:'Good game.',rating:5,createdAt:1800000000000},priv={...pub,text:'Private test note.',audience:'producer',revision:1};
  await env.withSecurityRulesDisabled(async ctx=>{await set(ref(ctx.database(),'peopleComments'),{public:{all:{[key]:pub},5:{[key]:pub}},private:{all:{[key]:priv},5:{[key]:priv}},pending:{all:{[key]:priv},5:{[key]:priv}},ownerPublic:{all:{[key]:{...pub,revision:1}}},internal:{records:{secret:{uid:'author',text:'secret'}}}});});
  const no=env.unauthenticatedContext().database(),anon=env.authenticatedContext('anon',{firebase:{sign_in_provider:'anonymous'}}).database();
  const other=env.authenticatedContext('other',{email:'other@example.com',email_verified:true,firebase:{sign_in_provider:'password'}}).database();
  const unverified=env.authenticatedContext('unverified',{email:'lucaessey@gmail.com',email_verified:false,firebase:{sign_in_provider:'password'}}).database();
  const owner=env.authenticatedContext('owner',{email:'lucaessey@gmail.com',email_verified:true,firebase:{sign_in_provider:'password'}}).database();
  const read=(db,path,n=21)=>get(query(ref(db,'peopleComments/'+path),orderByKey(),limitToLast(n)));
  for(const db of [no,anon,other,unverified,owner]){const snapshot=await assertSucceeds(read(db,'public/all'));assert.equal(snapshot.size,1);assert.deepEqual(Object.keys(Object.values(snapshot.val())[0]).sort(),['createdAt','id','rating','text']);}
  pass('Public bounded reads expose only sanitized fields, without authentication');
  for(const db of [no,anon,other,unverified])for(const path of ['private/all','pending/all','ownerPublic/all','internal/records'])await assertFails(read(db,path));
  pass('Private, pending, owner-only metadata and internal data deny ordinary and unverified accounts');
  for(const path of ['private/all','private/5','pending/all','pending/5','ownerPublic/all'])await assertSucceeds(read(owner,path));
  await assertFails(read(owner,'internal/records'));pass('Verified owner reads only bounded authorized inboxes, not internal metadata');
  const googleOwner=env.authenticatedContext('google-owner',{email:'lucaessey@gmail.com',email_verified:true,firebase:{sign_in_provider:'google.com'}}).database();
  for(const path of ['private/all','private/5','pending/all','pending/5','ownerPublic/all'])await assertSucceeds(read(googleOwner,path));
  await assertFails(read(googleOwner,'internal/records'));
  for(const claims of [{email:'other@gmail.com',email_verified:true,firebase:{sign_in_provider:'google.com'}},{email:'lucaessey@gmail.com',email_verified:false,firebase:{sign_in_provider:'google.com'}},{email:'lucaessey@gmail.com',email_verified:true,firebase:{sign_in_provider:'custom'}}]){
    const otherIdentity=env.authenticatedContext('denied-google',claims).database();for(const path of ['private/all','pending/all','ownerPublic/all'])await assertFails(read(otherIdentity,path));
  }
  for(const path of ['public/all/new','private/all/new','pending/all/new','internal/admin'])await assertFails(set(ref(googleOwner,'peopleComments/'+path),pub));
  pass('Only the verified Google owner can read private inboxes; Google clients still cannot write or grant roles');
  for(const db of [no,anon,other,unverified,owner])for(const path of ['public/all/new','private/all/new','pending/all/new','internal/admin','ownerPublic/all/new'])await assertFails(set(ref(db,'peopleComments/'+path),pub));
  pass('All browser identities, including owner, are denied direct publication and privilege writes');
  for(const path of ['','public','private','pending','internal'])await assertFails(get(ref(anon,'peopleComments/'+path)));
  for(const path of ['public/all','private/all']){await assertFails(get(ref(owner,'peopleComments/'+path)));await assertFails(read(owner,path,22));}
  await assertFails(read(no,'public/6'));await assertFails(read(no,'public/real'));pass('Parent reads, unbounded downloads, invalid filters and legacy labels are denied');
  await assertSucceeds(get(query(ref(no,'peopleComments/public/5'),orderByKey(),endAt(key),limitToLast(21))));pass('Indexed exact-star cursor queries are allowed');
  const store=new FirebaseStore({base:'http://127.0.0.1:9000',namespace:'demo-dfp-comments',token:async()=> 'owner'});
  const patches=[],db={get:path=>store.get(path),list:(...args)=>store.list(...args),patch:async value=>{patches.push(structuredClone(value));return store.patch(value);}};
  const service=new CommentService({db,limits:{consume:async()=>{}},classify:()=>({decision:'review',reason:'Review.',version:1})});
  const identity={uid:'rules-author',ip:'test',owner:true},input={text:'Good game.',rating:4,audience:'everyone',requestId:'revision-test-request'};
  const submitted=await service.submit(input,identity),first=structuredClone(patches[0]);
  const recordPath=`internal/records/${submitted.id}`,old=await store.get(recordPath);
  // Simulate a timed-out create arriving after a successful retry with a different clock.
  const delayed=structuredClone(first),lateKey=`1800000000001_${submitted.id}`;
  delayed[recordPath].sortKey=lateKey;
  for(const path of Object.keys(delayed))if(path!==recordPath){delayed[path.replace(old.sortKey,lateKey)]=delayed[path];delete delayed[path];}
  await assert.rejects(store.patch(delayed),/could not be saved/);
  assert.equal(await store.get(`pending/all/${lateKey}`),null);
  assert.equal((await service.submit(input,identity)).id,submitted.id);
  pass('Limited-privilege server writes enforce one creation and atomically reject a delayed duplicate');
  await service.act({id:submitted.id,action:'approve',revision:1,requestId:'revision-approve-request'},identity);
  const approval=structuredClone(patches.at(-1));
  await service.act({id:submitted.id,action:'hide',revision:2,requestId:'revision-hide-request'},identity);
  await assert.rejects(store.patch(approval),/could not be saved/);
  assert.equal((await store.get(recordPath)).status,'hidden');
  assert.equal(await store.get(`public/all/${old.sortKey}`),null);
  pass('A late approval cannot overwrite a hide or restore its public projections');
  console.log(`${checks} rules checks passed.`);
}finally{await env.cleanup();}
