import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newGame,command,step} from '../src/simulation.js';
import {BALANCE as B,LAYOUTS,tableCost,tableSeat} from '../src/config.js';
import {encode,decode,validateSave} from '../src/storage.js';

const tick=(s,seconds,pausedPlayer=true)=>{for(let n=0;n<Math.ceil(seconds/.05);n++)step(s,.05,{pausedPlayer});};
const at=(s,id,seconds=.7)=>{Object.assign(s.player,LAYOUTS[s.floor].find(st=>st.id===id).pad,{action:'',progress:0});tick(s,seconds,false);};
function setup(floor){const s=newGame();s.money=100000;for(let f=1;f<=floor;f++)command(s,{type:'floor',floor:f});command(s,{type:'visit',floor});command(s,{type:'product',id:['controller','tower','snack2','snack3'][floor]});return s;}
function until(s,fn,limit=60){for(let i=0;i<limit*20;i++){if(fn())return;step(s,.05,{pausedPlayer:true});}assert.fail('Lifecycle did not progress');}

for(let f=0;f<4;f++)test(`floor ${f+1}: stack, serve, pay, seat, eat, then manual cleanup`,()=>{
  const s=setup(f);assert.ok(command(s,{type:'table',id:0}).ok);tick(s,19);const fs=s.floors[f],c=fs.customers[0];s.player.bag=[...c.needs];const cash=s.money;
  at(s,'counter',2);assert.equal(s.money,cash);assert.ok(c.delivered.every(v=>!v));
  at(s,'stack',B.actionTime*c.needs.length+.1);assert.equal(s.money,cash);assert.ok(c.delivered.every(v=>!v));assert.equal(fs.counter[c.needs[0]],c.needs.length);
  at(s,'counter',1.4);assert.ok(c.paid);assert.equal(c.state,'toTable');assert.equal(s.money,cash+5*Math.floor(c.needs.reduce((sum,item)=>sum+B.prices[item],0)*1.2));assert.equal(fs.tables[0].state,'reserved');
  until(s,()=>c.state==='dining');assert.equal(fs.tables[0].state,'occupied');assert.deepEqual({x:c.x,y:c.y},tableSeat(0));
  const timer=c.timer;at(s,'table0',.7);assert.equal(fs.tables[0].state,'occupied');assert.ok(c.timer<timer&&c.timer>0);assert.equal(fs.tables[0].customer,c.id);
  until(s,()=>fs.tables[0].state==='dirty');assert.equal(c.state,'leaving');const paid=s.money;tick(s,3);assert.equal(fs.tables[0].state,'dirty');assert.equal(s.money,paid);
  at(s,'table0');assert.equal(fs.tables[0].state,'free');assert.equal(s.money,paid);assert.equal(fs.served,1);assert.ok(validateSave(s));
});

test('table purchases are atomic, independent per floor, limited to six and persistent',()=>{
  const s=setup(3);for(let f=0;f<4;f++)for(let i=0;i<6;i++){const cash=s.money;assert.ok(command(s,{type:'table',floor:f,id:i}).ok);assert.equal(s.money,cash-tableCost(f,i));assert.equal(command(s,{type:'table',floor:f,id:i}).ok,false);}
  assert.equal(command(s,{type:'table',id:6}).ok,false);assert.ok(decode(encode(s)).floors.every(f=>f.tables.every(t=>t.owned)));assert.ok(s.floors.every(f=>Object.values(f.upgrades).every(n=>n===0)));
  const poor=setup(0);poor.money=0;const before=structuredClone(poor);assert.equal(command(poor,{type:'table',id:0}).ok,false);assert.deepEqual(poor,before);
});

test('paid customers wait for dirty tables without double payment or premature reuse',()=>{
  const s=setup(0);command(s,{type:'table',id:0});const fs=s.floors[0];fs.tables[0].state='dirty';tick(s,19);s.player.bag=['controller'];at(s,'stack');at(s,'counter',1.4);const c=fs.customers[0],cash=s.money;
  assert.equal(c.state,'waitingTable');tick(s,7);assert.equal(c.state,'waitingTable');assert.equal(fs.tables[0].state,'dirty');assert.equal(s.money,cash);
  const loaded=decode(encode(s));assert.equal(loaded.floors[0].customers[0].state,'waitingTable');at(loaded,'table0');tick(loaded,.1);assert.equal(loaded.floors[0].tables[0].state,'reserved');assert.equal(loaded.money,cash);
});

for(let f=0;f<4;f++)test(`floor ${f+1}: employees automatically serve and clean after eating`,()=>{
  const s=setup(f);command(s,{type:'table',id:0});command(s,{type:'hire',id:f*5,floor:f});const seen=new Set();
  for(let i=0;i<5000;i++){step(s,.05,{pausedPlayer:true});seen.add(s.floors[f].tables[0].state);}
  for(const state of ['reserved','occupied','dirty','free'])assert.ok(seen.has(state),state);assert.ok(s.floors[f].served>=3);assert.ok(validateSave(s));
});

test('real schema-three save migrates balances, employee cargo, old dining tables and counter stock',()=>{
  const old=JSON.parse(readFileSync(new URL('../artifacts/3d-upgrade/comparison-state.json',import.meta.url)));old.floors[1].unlocked=true;old.floors[1].tables[0].state='dirty';const cash=old.money,cargo=[...old.player.bag],counter=old.floors[0].counter.controller;
  const s=decode(JSON.stringify(old));assert.equal(s.version,4);assert.equal(s.money,cash);assert.deepEqual(s.player.bag,cargo);assert.equal(s.floors[0].counter.controller,counter);assert.equal(s.employees.length,old.employees.length);
  assert.deepEqual(s.floors.map(f=>f.tables.filter(t=>t.owned).length),[0,2,0,0]);assert.equal(s.floors[1].tables[0].state,'dirty');assert.equal(s.floors[2].products.snack2,false);assert.ok(validateSave(s));
});

test('unfinished legacy dining orders retain delivered food and collect their bill only once',()=>{
  const old=JSON.parse(readFileSync(new URL('../artifacts/3d-upgrade/comparison-state.json',import.meta.url)));old.floors[1].unlocked=true;old.floors[1].products={tower:true,handheld:true,wine:true};old.floors[1].section=true;
  const c={...structuredClone(old.floors[0].customers[0]),id:old.nextId++,state:'dining',needs:['tower','wine'],delivered:[true,true],paid:false,table:0,machine:null,x:3.4,y:4.7,path:[],pathKey:'',timer:3};old.floors[1].customers=[c];old.floors[1].tables[0]={state:'occupied',customer:c.id};
  const s=decode(JSON.stringify(old)),diner=s.floors[1].customers[0];assert.equal(diner.state,'payment');assert.deepEqual(diner.delivered,[true,true]);assert.equal(s.floors[1].tables[0].owned,true);
  command(s,{type:'visit',floor:1});const revenue=s.floors[1].revenue,stock=structuredClone(s.floors[1].stock);tick(s,12);at(s,'counter',1.4);assert.equal(s.floors[1].revenue,revenue+60);assert.deepEqual(s.floors[1].stock,stock);at(s,'counter',2);assert.equal(s.floors[1].revenue,revenue+60);assert.ok(validateSave(s));
});
