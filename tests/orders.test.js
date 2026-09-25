import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step} from '../src/simulation.js';
import {BALANCE as B,LAYOUTS,serviceQueue,checkoutQueue} from '../src/config.js';
import {encode,decode,validateSave} from '../src/storage.js';

const tick=(s,seconds,pausedPlayer=true)=>{for(let i=0;i<Math.ceil(seconds/B.step);i++)step(s,B.step,{pausedPlayer});};
const at=(s,id,seconds=.7)=>{Object.assign(s.player,LAYOUTS[s.floor].find(st=>st.id===id).pad,{action:'',progress:0});tick(s,seconds,false);};
function setup(f,items){const s=newGame();s.money=100000;for(let i=1;i<=f;i++)command(s,{type:'floor',floor:i});command(s,{type:'visit',floor:f});for(const id of items)command(s,{type:'product',id});return s;}
function order(s,needs){const fs=s.floors[s.floor];fs.arrival=0;step(s,B.step,{pausedPlayer:true});const c=fs.customers[0];c.needs=[...needs];c.delivered=needs.map(()=>false);fs.arrival=100;return c;}
function until(s,predicate,seconds=150){for(let i=0;i<seconds/B.step;i++){if(predicate())return;step(s,B.step,{pausedPlayer:true});}assert.fail('Order did not progress');}

for(const [f,items] of [[0,['controller']],[1,['handheld']],[2,['snack2']],[3,['snack3']],[2,['souvenir','keychain']]])test(`floor ${f+1} ${items.join('/')}: generates one, two and three unlocked items`,()=>{
  const s=setup(f,items),sizes=new Set(),seen=new Set();
  for(let i=0;i<300;i++){const fs=s.floors[f];fs.customers=[];fs.arrival=0;step(s,B.step,{pausedPlayer:true});const c=fs.customers[0];assert.ok(c.needs.length>=1&&c.needs.length<=3);assert.equal(c.delivered.length,c.needs.length);assert.ok(c.delivered.every(v=>!v));for(const item of c.needs){assert.ok(items.includes(item));seen.add(item);}sizes.add(c.needs.length);}
  assert.deepEqual([...sizes].sort(),[1,2,3]);assert.deepEqual([...seen].sort(),[...items].sort());assert.ok(validateSave(s));
});

test('three-item food order consumes duplicates separately, resumes partial service and pays once',()=>{
  let s=setup(0,['controller','drink']);let c=order(s,['controller','controller','drink']);Object.assign(c,{...serviceQueue(),path:[],pathKey:''});const cash=s.money;
  s.floors[0].counter.controller=1;at(s,'counter',1.4);assert.deepEqual(c.delivered,[true,false,false]);assert.equal(s.money,cash);assert.equal(s.floors[0].counter.controller,0);
  s=decode(encode(s));c=s.floors[0].customers[0];s.player.bag=['controller','drink'];at(s,'counter');assert.deepEqual(c.delivered,[true,false,false]);
  at(s,'stack',1.4);assert.equal(s.money,cash);at(s,'counter',1.4);assert.deepEqual(c.delivered,[true,true,true]);assert.equal(s.money,cash+30);assert.equal(s.floors[0].served,1);assert.ok(c.paid);
  s=decode(encode(s));at(s,'counter',2);assert.equal(s.money,cash+30);assert.equal(s.floors[0].served,1);
});

test('unlocking drinks keeps untouched triple orders within the three-item limit',()=>{
  const s=setup(0,['controller']);tick(s,30);for(const c of s.floors[0].customers){c.needs=['controller','controller','controller'];c.delivered=[false,false,false];}
  const started=s.floors[0].customers[0];started.delivered[0]=true;command(s,{type:'product',id:'drink'});
  assert.deepEqual(started.needs,['controller','controller','controller']);assert.ok(s.floors[0].customers.some(c=>c.needs.includes('drink')));assert.ok(s.floors[0].customers.every(c=>c.needs.length===3&&c.delivered.length===3));assert.ok(validateSave(s));
});

for(const [f,items] of [[0,['controller','drink','drink']],[1,['tower','handheld','wine']],[2,['snack2','snack2','snack2']],[3,['snack3','snack3','snack3']]])test(`floor ${f+1}: an employee fulfills all three items across carrying trips`,()=>{
  const s=setup(f,[...new Set(items)]),c=order(s,items);command(s,{type:'hire',id:f*5,floor:f});const cash=s.money,subtotal=items.reduce((sum,item)=>sum+B.prices[item],0);
  until(s,()=>c.paid);assert.ok(c.delivered.every(Boolean));assert.equal(s.money,cash+5*(subtotal+Math.floor(subtotal*.2)));assert.equal(s.floors[f].served,1);assert.ok(validateSave(s));
});

test('mixed three-item shopping waits for each shelf and bills the whole basket once',()=>{
  let s=setup(2,['souvenir','keychain']);let c=order(s,['souvenir','keychain','souvenir']);s.floors[2].shelves.souvenir=1;const cash=s.money;
  until(s,()=>c.delivered[0]);tick(s,8);assert.deepEqual(c.delivered,[true,false,false]);assert.deepEqual(c.bag,['souvenir']);assert.equal(c.state,'browsing');assert.equal(s.money,cash);
  s=decode(encode(s));c=s.floors[2].customers[0];s.floors[2].shelves.keychain=1;s.floors[2].shelves.souvenir=1;
  until(s,()=>c.state==='checkout'&&Math.hypot(c.x-checkoutQueue().x,c.y-checkoutQueue().y)<.5);assert.deepEqual(c.bag,['souvenir','keychain','souvenir']);assert.ok(c.delivered.every(Boolean));assert.equal(s.money,cash);
  at(s,'checkout',.7);assert.ok(c.paid);assert.equal(s.money,cash+75);assert.equal(s.floors[2].served,1);s=decode(encode(s));at(s,'checkout',2);assert.equal(s.money,cash+75);
});
