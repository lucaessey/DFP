import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,speed,capacity,collectPayment} from '../src/simulation.js';
import {petSecurityAccess,petById,petAbilities} from '../src/pets.js';
import {ensureSecurityRound,securityTick,securitySelect} from '../src/security.js';
import {encode,decode,validateSave} from '../src/storage.js';
import {paymentQuote} from '../src/economy.js';

const camera=()=>{const s=newGame();s.money=10000;assert.ok(command(s,{type:'pet-buy',id:'camera'}).ok);return s;};
const active=s=>{ensureSecurityRound(s);s.basement.security.round.remaining=.05;securityTick(s,.05,true);return s.basement.security.round;};
test('only the pet shortcut pays $100; computer catches stay $15 with the same equipped pet and profit upgrades',()=>{
 let s=camera();s.floors[0].upgrades.profit=5;const start=s.money;
 const first=active(s),result=securitySelect(s,{roundId:first.id,person:'robber',watching:true,remote:true});
 assert.equal(result.amount,100);assert.equal(result.message,'Caught! +$100');assert.equal(s.money,start+100);assert.equal(s.basement.security.remoteCatches,1);
 s=decode(encode(s));const saved=encode(s);assert.equal(securitySelect(s,{roundId:first.id,person:'robber',watching:true,remote:true}).ok,false);assert.equal(encode(s),saved);
 const second=active(s);assert.equal(securitySelect(s,{roundId:second.id,person:'robber',watching:true,remote:false}).amount,15);
 assert.equal(s.money,start+115);assert.equal(s.basement.security.rewards,115);assert.equal(s.basement.security.catches,2);assert.equal(s.basement.security.remoteCatches,1);
 s=decode(encode(s));assert.equal(s.money,start+115);assert.equal(s.basement.security.result.amount,15);
});
test('pet shortcut requires an equipped camera and active viewing; wrong taps and escapes still cost $5',()=>{
 const s=camera();command(s,{type:'hire',id:0});const r=active(s),start=s.money;
 assert.equal(securitySelect(s,{roundId:r.id,person:'robber',watching:false,remote:true}).ok,false);
 command(s,{type:'pet-unequip'});assert.equal(securitySelect(s,{roundId:r.id,person:'robber',watching:true,remote:true}).ok,false);assert.equal(s.money,start);
 command(s,{type:'pet-equip',id:'camera'});assert.equal(securitySelect(s,{roundId:r.id,person:'staff-0',watching:true,remote:true}).amount,-5);
 securityTick(s,r.remaining,true);assert.equal(s.money,start-10);assert.equal(s.basement.security.remoteCatches,0);assert.ok(validateSave(s));
});
test('version eight security history migrates without revaluing old catches or paying again',()=>{
 const old=camera();const round=active(old);securitySelect(old,{roundId:round.id,person:'robber',watching:true});old.version=8;delete old.basement.security.remoteCatches;
 const before=structuredClone(old),migrated=decode(JSON.stringify(old));assert.equal(migrated.version,9);assert.equal(migrated.money,before.money);assert.equal(migrated.earned,before.earned);
 assert.deepEqual(migrated.basement.security,{...before.basement.security,remoteCatches:0});assert.equal(migrated.basement.security.rewards,15);
 assert.equal(securitySelect(migrated,{roundId:round.id,person:'robber',watching:true,remote:true}).ok,false);assert.equal(migrated.money,before.money);
});
test('mixed security totals and catch feedback are validated consistently',()=>{
 const s=camera();const r=active(s);securitySelect(s,{roundId:r.id,person:'robber',watching:true,remote:true});assert.ok(validateSave(s));
 for(const change of [sec=>sec.remoteCatches=-1,sec=>sec.remoteCatches=2,sec=>sec.rewards=15,sec=>sec.result.amount=99]){const bad=structuredClone(s);change(bad.basement.security);assert.equal(validateSave(bad),false);}
});
test('camera costs $5555 and provides security without buying any basement content',()=>{
 const s=camera();assert.equal(s.money,4445);assert.ok(petSecurityAccess(s).ready);
 assert.equal(s.basement.unlocked,false);assert.equal(s.basement.computer.owned,false);assert.equal(s.basement.security.owned,false);
 const purchases=structuredClone(s.basement);assert.ok(ensureSecurityRound(s));s.basement.security.round.remaining=.05;
 securityTick(s,.05,true);const id=s.basement.security.round.id,cash=s.money;
 assert.equal(securitySelect(s,{roundId:id,person:'robber',watching:true}).amount,15);
 assert.equal(s.money,cash+15);assert.equal(securitySelect(s,{roundId:id,person:'robber',watching:true}).ok,false);
 const restored=decode(encode(s));assert.equal(restored.basement.unlocked,purchases.unlocked);assert.deepEqual(restored.basement.computer,purchases.computer);assert.deepEqual(restored.basement.furniture,purchases.furniture);assert.equal(restored.basement.security.owned,false);assert.equal(restored.basement.security.catches,1);
});
test('camera encounters pause on exit or unequip, survive reload and resume only with entitlement',()=>{
 let s=camera();ensureSecurityRound(s);s.basement.security.round.remaining=.05;securityTick(s,.05,true);securityTick(s,2,true);
 command(s,{type:'pet-unequip'});const round=structuredClone(s.basement.security.round),cash=s.money;
 assert.equal(petSecurityAccess(s).ready,false);assert.equal(ensureSecurityRound(s),false);securityTick(s,20,true);
 assert.deepEqual(s.basement.security.round,round);assert.equal(securitySelect(s,{roundId:round.id,person:'robber',watching:true}).ok,false);
 s=decode(encode(s));assert.ok(validateSave(s));assert.deepEqual(s.basement.security.round,round);assert.equal(s.money,cash);
 command(s,{type:'pet-equip',id:'camera'});securityTick(s,20,false);assert.deepEqual(s.basement.security.round,round);
 securityTick(s,round.remaining,true);assert.equal(s.money,cash-5);assert.equal(s.basement.security.escapes,1);
 const invalid=structuredClone(s);invalid.pets.owned=[];invalid.pets.equipped=null;assert.equal(validateSave(invalid),false);
});
test('camera bonuses equal five normal speed/profit upgrades and five slots without changing upgrade records',()=>{
 const s=camera(),reference=newGame();s.money=reference.money=100000;
 for(const state of [s,reference]){command(state,{type:'upgrade',category:'speed'});command(state,{type:'upgrade',category:'profit'});command(state,{type:'hire',id:0});}
 const upgrades=structuredClone(s.floors[0].upgrades),employeeSpeed=speed(reference,reference.employees[0],0),employeePay=paymentQuote(reference,0,reference.employees[0],100).amount;
 reference.floors[0].upgrades.speed+=5;reference.floors[0].upgrades.profit+=5;reference.floors[0].upgrades.capacity+=5;
 assert.equal(speed(s,s.player,0),speed(reference,reference.player,0));assert.equal(capacity(s,s.player,0),capacity(reference,reference.player,0));
 for(let i=0;i<20;i++){const base=1+i%7;assert.equal(collectPayment(s,0,s.player,base,{paid:false}),collectPayment(reference,0,reference.player,base,{paid:false}));}
 assert.equal(speed(s,s.employees[0],0),employeeSpeed);assert.equal(paymentQuote(s,0,s.employees[0],100).amount,employeePay);
 const without=newGame();without.floors[0].upgrades=structuredClone(upgrades);without.floors[0].bonusCents=s.floors[0].bonusCents;
 assert.equal(paymentQuote(s,0,s.player,100,false).amount,paymentQuote(without,0,without.player,100,false).amount);
 for(let i=0;i<3;i++){command(s,{type:'pet-unequip'});assert.equal(speed(s,s.player,0),speed(without,without.player,0));command(s,{type:'pet-equip',id:'camera'});assert.equal(speed(s,s.player,0),speed(reference,reference.player,0));}
 assert.deepEqual(s.floors[0].upgrades,upgrades);
});
test('camera descriptions match five upgrades and a full 13-item bag survives unequip and reload without charges',()=>{
 const lines=petAbilities(petById('camera')).join('\n');
 assert.match(lines,/\+5 temporary speed upgrades \(\+75%/);assert.match(lines,/capacity \+5 items/);assert.match(lines,/\+5 temporary profit upgrades \(\+100%/);
 const s=camera();s.floors[0].upgrades.capacity=5;assert.equal(capacity(s,s.player,0),13);
 s.player.bag=Array(13).fill('controller');const money=s.money;
 let restored=decode(encode(s));assert.equal(restored.money,money);assert.equal(restored.player.bag.length,13);assert.equal(restored.pets.equipped,'camera');
 command(restored,{type:'pet-unequip'});restored=decode(encode(restored));assert.equal(capacity(restored,restored.player,0),8);assert.equal(restored.player.bag.length,13);assert.equal(restored.money,money);
 assert.ok(command(restored,{type:'pet-equip',id:'camera'}).ok);assert.equal(restored.money,money);assert.equal(capacity(restored,restored.player,0),13);
 restored.player.bag.push('controller');assert.equal(validateSave(restored),false);
});
test('version seven migrates to nine with pet collection, money, cargo and all previous progress unchanged',()=>{
 const old=newGame();old.money=6000;command(old,{type:'pet-buy',id:'whale'});old.version=7;
 const migrated=decode(JSON.stringify(old));assert.equal(migrated.version,9);assert.deepEqual(migrated,{...old,version:9,events:[]});
});
