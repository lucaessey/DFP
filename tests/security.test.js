import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step} from '../src/simulation.js';
import {FURNITURE,highestFloor,securityTick,securitySelect,ensureSecurityRound} from '../src/security.js';
import {encode,decode,validateSave} from '../src/storage.js';
const ready=()=>{const s=newGame();s.money=10000;command(s,{type:'basement'});for(const p of FURNITURE)command(s,{type:'furniture',id:p.id});command(s,{type:'security'});return s;};
const tick=(s,time,watch=true)=>{for(let i=0;i<Math.round(time*20);i++)securityTick(s,.05,watch);};
const active=s=>{ensureSecurityRound(s);tick(s,s.basement.security.round.remaining);assert.equal(s.basement.security.round.phase,'active');return s.basement.security.round;};

test('basement is a $200 purchase before food or upper floors, with atomic rejection and no repeated charge',()=>{
 let s=newGame();s.money=199;const old=encode(s);assert.equal(command(s,{type:'basement'}).ok,false);assert.equal(encode(s),old);s.money=200;assert.equal(command(s,{type:'basement',token:'basement'}).cost,200);assert.equal(s.money,0);assert.deepEqual(s.floors.map(f=>f.unlocked),[true,false,false,false]);assert.equal(s.floors[0].products.controller,false);s=decode(encode(s));assert.ok(s.basement.unlocked);assert.equal(command(s,{type:'basement',token:'basement'}).ok,false);assert.equal(command(s,{type:'basement'}).ok,false);assert.equal(s.money,0);
});
test('all furniture and security prices, each prerequisite, insufficient money and reload ownership',()=>{
 let s=newGame();s.money=1000;assert.equal(command(s,{type:'furniture',id:'tv'}).ok,false);command(s,{type:'basement'});
 for(const p of FURNITURE){assert.equal(command(s,{type:'security'}).ok,false);s.money=p.cost-1;const old=encode(s);assert.equal(command(s,{type:'furniture',id:p.id}).ok,false);assert.equal(encode(s),old);s.money=p.cost;assert.equal(command(s,{type:'furniture',id:p.id}).cost,p.cost);assert.equal(s.money,0);s=decode(encode(s));assert.ok(s.basement.furniture[p.id]);assert.equal(command(s,{type:'furniture',id:p.id}).ok,false);}
 s.money=149;assert.equal(command(s,{type:'security'}).ok,false);s.money=150;assert.equal(command(s,{type:'security'}).cost,150);assert.equal(s.money,0);s=decode(encode(s));assert.ok(s.basement.security.owned);assert.equal(command(s,{type:'security'}).ok,false);
});
test('security waits span the integer 1–30 range, then exactly one ten-second robber and a fresh wait',()=>{
 const s=ready(),waits=new Set();for(let i=0;i<500;i++){ensureSecurityRound(s);const r=s.basement.security.round;assert.ok(Number.isInteger(r.remaining)&&r.remaining>=1&&r.remaining<=30);waits.add(r.remaining);tick(s,r.remaining-.05);assert.equal(r.phase,'waiting');tick(s,.05);assert.equal(r.phase,'active');assert.equal(r.remaining,10);assert.ok(r.robber);tick(s,9.95);assert.equal(s.basement.security.round.id,r.id);tick(s,.05);assert.equal(s.basement.security.round.phase,'waiting');assert.equal(s.basement.security.round.robber,null);assert.ok(s.basement.security.round.id>r.id);}assert.equal(waits.size,30);assert.equal(s.basement.security.escapes,500);assert.equal(s.basement.security.penalties,2500);
});
test('catch pays exactly $15 with maximum upgrades and bonuses, once across double taps and reloads',()=>{
 let s=ready();s.floors[0].upgrades.profit=5;s.floors[0].bonusCents=80;command(s,{type:'hire',id:0});s.employees[0].upgrades.profit=3;const r=active(s),cash=s.money,earned=s.earned;
 assert.equal(securitySelect(s,{roundId:r.id,person:'robber',watching:true}).amount,15);assert.equal(s.money,cash+15);assert.equal(s.earned,earned+15);assert.equal(s.floors[0].bonusCents,80);assert.equal(s.floors[0].revenue,0);s=decode(encode(s));const saved=encode(s);assert.equal(securitySelect(s,{roundId:r.id,person:'robber',watching:true}).ok,false);assert.equal(encode(s),saved);
});
test('wrong-person and escape penalties are $5 each; duplicate selections and away taps cannot charge',()=>{
 let s=ready();command(s,{type:'hire',id:0});const r=active(s);tick(s,2);s.money=3;const time=r.remaining;
 assert.equal(securitySelect(s,{roundId:r.id,person:'staff-0',watching:false}).ok,false);assert.equal(s.money,3);
 assert.equal(securitySelect(s,{roundId:r.id,person:'staff-0',watching:true}).amount,-5);assert.equal(s.money,-2);assert.equal(r.remaining,time);assert.equal(r.phase,'active');s=decode(encode(s));assert.equal(securitySelect(s,{roundId:r.id,person:'staff-0',watching:true}).ok,false);tick(s,time);assert.equal(s.money,-7);assert.equal(s.basement.security.penalties,10);assert.ok(validateSave(s));assert.equal(command(s,{type:'furniture',id:'plant1'}).ok,false);assert.ok(command(s,{type:'visit',floor:0}).ok,'Free navigation remains available while repaying a penalty');
});
test('waiting and active clocks survive closure, background/no-input steps, reload and resumed monitoring',()=>{
 let s=ready();ensureSecurityRound(s);tick(s,.35);let sec=structuredClone(s.basement.security);for(let i=0;i<200;i++)step(s,.05,{pausedPlayer:true});assert.deepEqual(s.basement.security,sec);s=decode(encode(s));assert.deepEqual(s.basement.security,sec);active(s);tick(s,6);sec=structuredClone(s.basement.security);tick(s,120,false);assert.deepEqual(s.basement.security,sec);s=decode(encode(s));assert.deepEqual(s.basement.security,sec);tick(s,3.95);assert.equal(s.basement.security.round.phase,'active');tick(s,.05);assert.equal(s.basement.security.escapes,1);
});
test('highest-floor monitoring follows actual unlocks without changing selected floor or resetting active time',()=>{
 const s=ready();let r=active(s);tick(s,2);for(let f=1;f<4;f++){assert.ok(command(s,{type:'floor',floor:f}).ok);const before=r.remaining;securityTick(s,.05,true);r=s.basement.security.round;assert.equal(highestFloor(s),f);assert.equal(r.floor,f);assert.ok(Math.abs(r.remaining-(before-.05))<1e-8);assert.equal(s.floor,0);assert.ok(r.robber);}assert.equal(s.basement.security.catches,0);
});
test('schema-four saves gain an empty basement without altering prior progress; newer feature saves are protected',()=>{
 const s=newGame();s.money=12345;command(s,{type:'hire',id:0});command(s,{type:'outfit',id:'chef'});command(s,{type:'upgrade',category:'profit'});const before=structuredClone(s);s.version=4;delete s.basement;const loaded=decode(JSON.stringify(s));assert.equal(loaded.version,5);assert.deepEqual(loaded.floors,before.floors);assert.deepEqual(loaded.employees,before.employees);assert.equal(loaded.money,before.money);assert.equal(loaded.outfit,'chef');assert.equal(loaded.basement.unlocked,false);assert.equal(loaded.basement.security.round,null);assert.throws(()=>decode(JSON.stringify({...loaded,version:6})),/FUTURE_VERSION/);
});
test('invalid security ownership and forged rewards are rejected',()=>{
 for(const corrupt of [s=>s.basement.security.owned=true,s=>s.basement.furniture.tv=true,s=>s.basement.security.rewards=15,s=>s.basement.security.nextId=NaN]){const s=newGame();corrupt(s);assert.equal(validateSave(s),false);}
});
