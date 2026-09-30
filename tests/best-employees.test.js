import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,bestEmployeeAssignments} from '../src/simulation.js';
import {FLOORS,ROSTER,ITEMS,WORLD,upgradeCount} from '../src/config.js';
import {encode,decode,validateSave} from '../src/storage.js';

function team(count=55){const s=newGame();s.money=1000000;for(let f=1;f<FLOORS.length;f++)command(s,{type:'floor',floor:f});for(const e of ROSTER.slice(0,count))assert.ok(command(s,{type:'hire',id:e.id,floor:e.origin}).ok);s.money=0;return s;}
const ids=(s,f)=>s.employees.filter(e=>e.floor===f).map(e=>e.id).sort((a,b)=>a-b);
const cargo=s=>Object.fromEntries(ITEMS.map(item=>[item,s.floors.reduce((n,f)=>n+f.stock[item],0)+s.employees.reduce((n,e)=>n+e.bag.filter(v=>v===item).length,0)]));

test('fill uses all owned staff when fewer than twelve, targets selected floor and is free',()=>{
 const s=team(4),upgrades=s.employees.map(e=>({...e.upgrades}));const before=encode(s);assert.equal(bestEmployeeAssignments(s,10).length,4);assert.equal(encode(s),before);
 assert.deepEqual(command(s,{type:'fill-best',floor:10}),{ok:true,cost:0});assert.deepEqual(ids(s,10),[0,1,2,3]);assert.equal(s.floor,0);assert.equal(s.money,0);assert.equal(s.employees.length,4);assert.deepEqual(s.employees.map(e=>e.upgrades),upgrades);assert.ok(validateSave(s));
});
test('best team is twelve highest total upgrades rather than hire price or home floor',()=>{
 const s=team();for(const e of s.employees.slice(10,22))e.upgrades={speed:3,capacity:3,profit:3};
 s.employees[54].upgrades={speed:3,capacity:2,profit:3};command(s,{type:'fill-best',floor:0});assert.deepEqual(ids(s,0),Array.from({length:12},(_,i)=>i+10));assert.equal(s.employees.length,55);for(let f=0;f<11;f++)assert.ok(ids(s,f).length<=12);assert.ok(validateSave(s));
});
test('full floors exchange staff without exceeding capacity or unassigning anyone',()=>{
 const s=team(24);s.employees.forEach((e,i)=>{e.floor=i<12?0:1;e.upgrades=i<12?{speed:0,capacity:0,profit:0}:{speed:2,capacity:1,profit:3};});
 assert.ok(validateSave(s));assert.ok(command(s,{type:'fill-best',floor:0}).ok);assert.deepEqual(ids(s,0),Array.from({length:12},(_,i)=>i+12));assert.deepEqual(ids(s,1),Array.from({length:12},(_,i)=>i));assert.ok(validateSave(s));
});
test('ties retain existing staff and use stable employee ID for remaining places',()=>{
 const s=team();command(s,{type:'fill-best',floor:10});assert.deepEqual(ids(s,10),[0,1,2,3,4,5,6,50,51,52,53,54]);const before=encode(s);
 assert.equal(command(s,{type:'fill-best',floor:10}).ok,false);assert.equal(encode(s),before);
 const reordered=team();reordered.employees.reverse();command(reordered,{type:'fill-best',floor:10});assert.deepEqual(ids(reordered,10),ids(s,10));
});
test('moved cargo returns once to its source; upgrades, customers, receipts and unmoved work remain',()=>{
 const s=team(14);s.employees.forEach((e,i)=>{e.floor=i<12?0:1;e.upgrades={speed:i>=11?3:0,capacity:0,profit:0};e.bag=[i>=12?'icecream':'controller'];e.cold=i>=12?[12]:[];e.action='counter';e.progress=.4;e.moving=true;e.path=[{x:7,y:6}];e.pathKey='7,6';});
 const before=structuredClone(s),inventory=cargo(s),plan=bestEmployeeAssignments(s,0),moved=new Set(plan.map(p=>p.id));
 assert.ok(command(s,{type:'fill-best',floor:0,token:'fill-once'}).ok);assert.deepEqual(cargo(s),inventory);assert.equal(s.floors[1].stock.icecream,2);assert.equal(s.floors[0].stock.controller,2);
 for(const e of s.employees){const old=before.employees.find(v=>v.id===e.id);assert.deepEqual(e.upgrades,old.upgrades);if(moved.has(e.id)){assert.deepEqual(e.bag,[]);assert.deepEqual(e.cold,[]);assert.equal(e.action,'');assert.equal(e.progress,0);assert.equal(e.moving,false);assert.deepEqual(e.path,[]);assert.deepEqual({x:e.x,y:e.y},WORLD.kitchen);}else assert.deepEqual(e,old);}
 for(let f=0;f<11;f++){assert.deepEqual(s.floors[f].customers,before.floors[f].customers);assert.equal(s.floors[f].revenue,before.floors[f].revenue);}assert.equal(s.earned,before.earned);assert.equal(s.money,before.money);
 const restored=decode(encode(s)),saved=encode(restored);assert.deepEqual(restored.employees,s.employees);assert.equal(command(restored,{type:'fill-best',floor:0,token:'fill-once'}).ok,false);assert.equal(command(restored,{type:'fill-best',floor:0}).ok,false);assert.equal(encode(restored),saved);
});
test('locked floors, invalid destinations and no owned employees cannot mutate progress',()=>{
 const s=newGame();for(const floor of [0,1,-1,11,1.5]){const before=encode(s);assert.equal(command(s,{type:'fill-best',floor}).ok,false);assert.equal(encode(s),before);}
 s.money=500;command(s,{type:'hire',id:0});const before=encode(s);assert.equal(command(s,{type:'fill-best',floor:1}).ok,false);assert.equal(encode(s),before);
});
test('repeated fills across all eleven floors preserve staff, caps, goods and best totals',()=>{
 const s=team();s.employees.forEach((e,i)=>{e.upgrades={speed:i%4,capacity:Math.floor(i/4)%4,profit:Math.floor(i/16)%4};e.bag=['ingredient'];});const inventory=cargo(s),levels=s.employees.map(e=>[e.id,{...e.upgrades}]);
 for(let f=0;f<11;f++){assert.ok(command(s,{type:'fill-best',floor:f}).ok);const selected=s.employees.filter(e=>e.floor===f),others=s.employees.filter(e=>e.floor!==f);assert.equal(selected.length,12);assert.ok(Math.min(...selected.map(e=>upgradeCount(e.upgrades)))>=Math.max(...others.map(e=>upgradeCount(e.upgrades))));assert.equal(new Set(s.employees.map(e=>e.id)).size,55);for(let j=0;j<11;j++)assert.ok(ids(s,j).length<=12);assert.deepEqual(cargo(s),inventory);assert.deepEqual(s.employees.map(e=>[e.id,e.upgrades]),levels);assert.ok(validateSave(decode(encode(s))));}
});
