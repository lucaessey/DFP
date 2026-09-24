import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step} from '../src/simulation.js';
import {PRODUCTS,LAYOUTS,BALANCE} from '../src/config.js';
import {decode,validateSave} from '../src/storage.js';
const tick=(s,n=2)=>{for(let i=0;i<n*20;i++)step(s,.05);};
test('every product starts locked and no floor earns from locked inventory',()=>{
  const s=newGame();s.money=100000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});
  for(const p of PRODUCTS){assert.equal(s.floors[p.floor].products[p.id],false);const st=LAYOUTS[p.floor].find(st=>st.product===p.id);command(s,{type:'visit',floor:p.floor});Object.assign(s.player,st.pad);tick(s);assert.equal(s.player.bag.length,0);}
  assert.equal(s.earned,0);assert.ok(s.floors.every(f=>f.customers.length===0));assert.ok(s.floors[3].machines.every(m=>m.quarters===0));
});
test('all thirteen product unlocks charge once, respect funds and persist ownership',()=>{
  const s=newGame();s.money=100000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});
  for(const p of PRODUCTS){const before=s.money;assert.ok(command(s,{type:'product',floor:p.floor,id:p.id}).ok);assert.equal(s.money,before-p.cost);assert.equal(command(s,{type:'product',floor:p.floor,id:p.id}).ok,false);assert.equal(s.floors[p.floor].products[p.id],true);}
  assert.ok(validateSave(s));const broke=newGame();broke.money=0;assert.equal(command(broke,{type:'product',id:'controller'}).ok,false);
});
test('optional spending cannot trap a fresh player without the first product',()=>{
  const s=newGame();assert.equal(command(s,{type:'hire',id:0}).ok,false);assert.equal(command(s,{type:'upgrade',category:'speed'}).ok,false);assert.equal(command(s,{type:'outfit',id:'chef'}).ok,false);assert.equal(s.money,120);assert.ok(command(s,{type:'product',id:'controller'}).ok);assert.equal(s.money,70);tick(s,8);assert.ok(s.floors[0].customers.length>0);
});
test('guests order only unlocked meals and use only unlocked cabinets',()=>{
  const s=newGame();s.money=10000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});command(s,{type:'product',floor:1,id:'handheld'});command(s,{type:'product',floor:3,id:'machine1'});tick(s,40);
  assert.ok(s.floors[1].customers.every(c=>c.needs.length===1&&c.needs[0]==='handheld'));assert.equal(s.floors[3].machines[0].quarters,0);assert.equal(s.floors[3].machines[2].quarters,0);assert.ok(s.floors[3].machines[1].quarters>0);
});
test('version-two migration preserves previously available products and all balances',()=>{
  const s=newGame();s.version=2;s.money=678;s.floors[1].unlocked=true;s.floors[1].section=true;s.floors[0].section=true;s.floors.forEach(f=>delete f.products);const restored=decode(JSON.stringify(s));assert.equal(restored.version,4);assert.equal(restored.money,678);for(const id of ['controller','drink'])assert.ok(restored.floors[0].products[id]);for(const id of ['tower','handheld','wine'])assert.ok(restored.floors[1].products[id]);assert.equal(restored.floors[2].products.souvenir,false);
});
test('harder base earnings and more frequent drinks are explicit balance values',()=>{
  assert.equal(BALANCE.prices.controller,1);assert.equal(BALANCE.prices.drink,3);assert.equal(BALANCE.quarters,3);assert.equal(BALANCE.drinkOrderChance,.8);assert.equal(BALANCE.vrBaseReward,3);
});
