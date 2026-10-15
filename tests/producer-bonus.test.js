import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/simulation.js';
import {encode,decode,validateSave} from '../src/storage.js';
import {beginBonus,payBonus,bonusWait,bonusChanges,confirmBonus,PRODUCER_COOLDOWN} from '../shared/producer-bonus.js';
const id='claim-12345678901234567890',receipt={id,amount:1000,claimedAt:1700000000000};
test('producer grants exactly $1000 once, independent of upgrades, pets and sales statistics',()=>{
 const s=newGame();s.money=150;s.pets.owned.push('camera');s.pets.equipped='camera';s.floors[0].upgrades.profit=5;
 beginBonus(s,()=>true,id);assert.equal(payBonus(s,()=>true,receipt),true);
 assert.equal(s.money,1150);assert.equal(s.earned,0);assert.equal(s.floors[0].revenue,0);
 assert.equal(payBonus(s,()=>true,receipt),false);assert.equal(s.money,1150);
 const loaded=decode(encode(s));assert.equal(payBonus(loaded,()=>true,receipt),false);assert.equal(loaded.money,1150);
});
test('pending receipts survive reload; failed saves never leave unsaved cash in memory',()=>{
 const s=newGame(),balance=s.money;assert.throws(()=>beginBonus(s,()=>false,id),/could not be saved/);assert.equal(s.producerBonus.pending,null);
 beginBonus(s,()=>true,id);const reloaded=decode(encode(s));
 assert.equal(beginBonus(reloaded,()=>true,'different-123456789012345'),id);
 assert.throws(()=>payBonus(reloaded,()=>false,receipt),/Retry to recover/);assert.equal(reloaded.money,balance);assert.equal(reloaded.producerBonus.pending,id);
 assert.equal(payBonus(reloaded,()=>true,receipt),true);assert.equal(reloaded.money,balance+1000);
});
test('old saves migrate additively; malformed receipts and unexpected claims fail closed',()=>{
 const s=newGame();s.money=876;delete s.producerBonus;const loaded=decode(encode(s));
 assert.equal(loaded.money,876);assert.deepEqual(loaded.producerBonus,{pending:null,paid:null});
 assert.throws(()=>payBonus(loaded,()=>true,receipt),/different claim/);
 beginBonus(loaded,()=>true,id);assert.throws(()=>payBonus(loaded,()=>true,{...receipt,amount:5000}),/invalid/);
 assert.equal(loaded.money,876);loaded.producerBonus.pending={};assert.equal(validateSave(loaded),false);
});
test('cooldown boundaries use five minutes and never create automatic payments',()=>{
 assert.equal(PRODUCER_COOLDOWN,300000);assert.equal(bonusWait(null),0);
 for(const elapsed of [0,1,299999,300000,300001])assert.equal(bonusWait(receipt,receipt.claimedAt+elapsed),Math.max(0,300000-elapsed));
 assert.deepEqual(bonusChanges(id),{limit:{id,claimedAt:{'.sv':'timestamp'}},['receipts/'+id]:{id,amount:1000,claimedAt:{'.sv':'timestamp'}}});
});
test('lost response and retry resolve the same immutable server receipt',async()=>{
 let saved=null,writes=0;
 const request=async(path,patch)=>{if(patch){writes++;saved=receipt;throw Error('Lost response');}return saved;};
 assert.deepEqual(await confirmBonus(request,id),receipt);assert.deepEqual(await confirmBonus(request,id),receipt);assert.equal(writes,1);
});
test('unconfirmed or malformed server response never grants cash',async()=>{
 const s=newGame(),before=s.money;beginBonus(s,()=>true,id);
 await assert.rejects(()=>confirmBonus(async(path,patch)=>{if(patch)throw Error('Denied');return null;},id),/Denied/);
 await assert.rejects(()=>confirmBonus(async()=>({...receipt,amount:5000}),id),/invalid/);
 assert.equal(s.money,before);assert.equal(s.producerBonus.pending,id);
});
