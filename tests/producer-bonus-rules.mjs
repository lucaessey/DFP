import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,get,update,remove} from 'firebase/database';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {bonusChanges} from '../shared/producer-bonus.js';
const env=await initializeTestEnvironment({projectId:'demo-dfp-comments',database:{host:'127.0.0.1',port:9000,rules:readFileSync('firebase/database.rules.json','utf8')}});
const claims={email:'lucaessey@gmail.com',email_verified:true,firebase:{sign_in_provider:'google.com'}};
const owner=env.authenticatedContext('owner',claims).database();
const second=env.authenticatedContext('owner-another-device',claims).database();
const forbidden=[env.unauthenticatedContext(),env.authenticatedContext('anon'),env.authenticatedContext('other',{...claims,email:'other@example.com'}),env.authenticatedContext('unverified',{...claims,email_verified:false}),env.authenticatedContext('custom',{...claims,firebase:{sign_in_provider:'custom'}})].map(c=>c.database());
const write=(db,id)=>update(ref(db,'producerRewards'),bonusChanges(id));
const id=()=>crypto.randomUUID();let n=0;const pass=s=>console.log('PASS',++n,s);
try{
 await env.clearDatabase();
 for(const db of forbidden){await assertFails(write(db,id()));await assertFails(get(ref(db,'producerRewards/limit')));}
 pass('Public, ordinary, different, unverified and custom-provider accounts cannot read or claim');
 const first=id();await assertSucceeds(write(owner,first));
 const receipt=(await get(ref(owner,'producerRewards/receipts/'+first))).val();assert.equal(receipt.amount,1000);assert.ok(Math.abs(Date.now()-receipt.claimedAt)<10000);
 for(const db of forbidden)await assertFails(get(ref(db,'producerRewards/receipts/'+first)));
 await assertFails(write(owner,id()));await assertFails(write(second,id()));await assertFails(write(owner,first));
 await assertFails(remove(ref(owner,'producerRewards/limit')));await assertFails(remove(ref(owner,'producerRewards/receipts/'+first)));
 pass('First claim pays exactly $1000 with server time; repeats, another device, deletion and replay are denied');
 // Move the disposable fixture near the boundary, never the production database.
 await env.withSecurityRulesDisabled(c=>update(ref(c.database(),'producerRewards/limit'),{claimedAt:Date.now()-299000}));
 await assertFails(write(owner,id()));
 await env.withSecurityRulesDisabled(c=>update(ref(c.database(),'producerRewards/limit'),{claimedAt:Date.now()-300000}));
 const next=id();await assertSucceeds(write(owner,next));pass('Before five minutes is denied; at/after five minutes is allowed');
 await env.withSecurityRulesDisabled(c=>update(ref(c.database(),'producerRewards/limit'),{claimedAt:Date.now()-300000}));
 const races=await Promise.allSettled([write(owner,id()),write(second,id())]);assert.equal(races.filter(r=>r.status==='fulfilled').length,1);pass('Two concurrent owner sessions produce only one accepted claim');
 for(const kind of ['amount','past','future','receiptOnly','limitOnly','extra','twoReceipts']){
   await env.withSecurityRulesDisabled(c=>update(ref(c.database(),'producerRewards/limit'),{claimedAt:Date.now()-300000}));
   const key=id(),patch=bonusChanges(key),r=patch['receipts/'+key];
   if(kind==='amount')r.amount=5000;if(kind==='past')r.claimedAt=patch.limit.claimedAt=Date.now()-600000;
   if(kind==='future')r.claimedAt=patch.limit.claimedAt=Date.now()+600000;
   if(kind==='receiptOnly')delete patch.limit;if(kind==='limitOnly')delete patch['receipts/'+key];
   if(kind==='extra')r.extra=true;if(kind==='twoReceipts'){const extra=id();patch['receipts/'+extra]={...r,id:extra};}
   await assertFails(update(ref(owner,'producerRewards'),patch));
 }
 await assertFails(set(ref(owner,'producerRewards/receipts/'+first),{...receipt,amount:2000}));
 await assertFails(get(ref(owner,'producerRewards')));
 pass('Forged amounts/times, incomplete writes, extra fields/receipts, receipt edits and broad reads fail');
 console.log(`${n} producer rules groups passed.`);
}finally{await env.cleanup();}
