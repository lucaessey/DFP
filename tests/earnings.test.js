import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,collectPayment,command,step,startVR,stepVR} from '../src/simulation.js';
import {LAYOUTS} from '../src/config.js';
import {encode,decode,validateSave} from '../src/storage.js';
import {readFileSync} from 'node:fs';
import {paymentQuote} from '../src/economy.js';

test('all payout values and upgrade combinations equal exactly five times recorded previous-version receipts',()=>{
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/previous-payouts.json',import.meta.url)));
  for(let floor=0;floor<4;floor++)for(const [base,playerProfit,staffProfit,carry,oldPaid,nextCarry] of fixture.samples){
    const s=newGame();s.floors[floor].upgrades.profit=playerProfit;s.floors[floor].bonusCents=carry;const actor={upgrades:{profit:staffProfit}},receipt={paid:false},before=s.money;
    const saved=structuredClone(s),quote=paymentQuote(s,floor,actor,base);assert.deepEqual(s,saved);assert.equal(quote.amount,oldPaid*5);
    assert.equal(collectPayment(s,floor,actor,base,receipt),oldPaid*5);assert.equal(s.money-before,oldPaid*5);assert.equal(s.floors[floor].bonusCents,nextCarry);assert.equal(s.events.at(-1).text,`+$${oldPaid*5}`);
    assert.equal(collectPayment(s,floor,actor,base,receipt),0);assert.equal(s.money-before,oldPaid*5);
  }
});

test('small sales get five times the previous payout across reloads without duplicate bonuses',()=>{
  let state=newGame();const start=state.money;
  for(let i=0;i<4;i++)assert.equal(collectPayment(state,0,state.player,1,{paid:false}),5);
  assert.equal(state.floors[0].bonusCents,80);
  state=decode(encode(state));const receipt={paid:false};
  assert.equal(collectPayment(state,0,state.player,1,receipt),10);
  const paid=encode(state);assert.equal(collectPayment(state,0,state.player,1,receipt),0);assert.equal(encode(state),paid);
  for(let i=5;i<100;i++)collectPayment(state,0,state.player,1,{paid:false});
  assert.equal(state.money-start,600);assert.equal(state.earned,600);assert.equal(state.floors[0].revenue,600);assert.equal(state.floors[0].bonusCents,0);
});

test('older saves keep progress and bonus remainders must be whole cents below a dollar',()=>{
  const state=newGame();state.money=987;const loaded=decode(encode(state));assert.equal(loaded.money,987);
  assert.equal(collectPayment(loaded,0,loaded.player,5,{paid:false}),30);
  for(const invalid of [-1,100,.5,NaN]){loaded.floors[0].bonusCents=invalid;assert.equal(validateSave(loaded),false);}
});

test('arcade and VR use the shared multiplier once, including employee bonuses and reloads',()=>{
  for(const employee of [false,true]){
    let s=newGame();s.money=100000;for(let floor=1;floor<4;floor++)command(s,{type:'floor',floor});command(s,{type:'visit',floor:3});command(s,{type:'product',id:'machine0'});s.floors[3].upgrades.profit=1;s.floors[3].machines[0].quarters=9;
    let actor=s.player;if(employee){command(s,{type:'hire',id:15});actor=s.employees[0];actor.upgrades.profit=2;}Object.assign(actor,LAYOUTS[3].find(st=>st.id==='machine0').pad);const cash=s.money;
    for(let i=0;i<14;i++)step(s,.05,{pausedPlayer:employee});assert.equal(s.money-cash,employee?80:65);assert.equal(s.floors[3].machines[0].quarters,0);
    s=decode(encode(s));for(let i=0;i<40;i++)step(s,.05,{pausedPlayer:employee});assert.equal(s.money-cash,employee?80:65);
  }
  let s=newGame();s.money=100000;for(let floor=1;floor<4;floor++)command(s,{type:'floor',floor});command(s,{type:'visit',floor:3});command(s,{type:'product',id:'vr'});s.floors[3].upgrades.profit=1;Object.assign(s.player,LAYOUTS[3].find(st=>st.id==='vr').pad);assert.ok(startVR(s));Object.assign(s.vr,{time:24.95,score:6});const cash=s.money;
  stepVR(s,.05);assert.equal(s.vr.reward,65);assert.equal(s.money-cash,65);s=decode(encode(s));stepVR(s,.05);assert.equal(s.money-cash,65);
});
