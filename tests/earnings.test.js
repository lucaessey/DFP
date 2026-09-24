import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,collectPayment} from '../src/simulation.js';
import {encode,decode,validateSave} from '../src/storage.js';

test('small sales get the full 20 percent boost across reloads without duplicate bonuses',()=>{
  let state=newGame();const start=state.money;
  for(let i=0;i<4;i++)assert.equal(collectPayment(state,0,state.player,1,{paid:false}),1);
  assert.equal(state.floors[0].bonusCents,80);
  state=decode(encode(state));const receipt={paid:false};
  assert.equal(collectPayment(state,0,state.player,1,receipt),2);
  const paid=encode(state);assert.equal(collectPayment(state,0,state.player,1,receipt),0);assert.equal(encode(state),paid);
  for(let i=5;i<100;i++)collectPayment(state,0,state.player,1,{paid:false});
  assert.equal(state.money-start,120);assert.equal(state.earned,120);assert.equal(state.floors[0].revenue,120);assert.equal(state.floors[0].bonusCents,0);
});

test('older saves keep progress and bonus remainders must be whole cents below a dollar',()=>{
  const state=newGame();state.money=987;const loaded=decode(encode(state));assert.equal(loaded.money,987);
  assert.equal(collectPayment(loaded,0,loaded.player,5,{paid:false}),6);
  for(const invalid of [-1,100,.5,NaN]){loaded.floors[0].bonusCents=invalid;assert.equal(validateSave(loaded),false);}
});
