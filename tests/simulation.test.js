import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, command, step, collectPayment, workerGoal, capacity, startVR, vrInput, stepVR } from '../src/simulation.js';
import { BALANCE as B, FLOORS, LAYOUTS, ROSTER, PRODUCTS } from '../src/config.js';
import { findPath, walkable, distance } from '../src/navigation.js';
import { validateSave, encode, decode, loadGame, saveGame, SAVE_KEY, BACKUP_KEY } from '../src/storage.js';

const tick = (s, seconds, input = {pausedPlayer:true}) => { for(let i=0;i<seconds/B.step;i++)step(s,B.step,input); };
function rich(products=true) { const s=newGame(); s.money=100000; for(let i=1;i<4;i++)assert.ok(command(s,{type:'floor',floor:i}).ok); if(products)for(const p of PRODUCTS)assert.ok(command(s,{type:'product',floor:p.floor,id:p.id}).ok); return s; }
function at(s,f,id,seconds=1) { if(s.floor!==f)command(s,{type:'visit',floor:f}); const p=LAYOUTS[f].find(st=>st.id===id).pad; Object.assign(s.player,p,{action:'',progress:0}); tick(s,seconds,{}); }
const memory = () => { const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}; };

test('fresh game and every station path are valid and accessible',()=>{
  const s=newGame();assert.ok(validateSave(s));assert.equal(s.money,120);
  for(let f=0;f<4;f++)for(const st of LAYOUTS[f]){assert.ok(walkable(f,st.pad.x,st.pad.y),`${f} ${st.id} pad`);assert.ok(findPath(f,s.player,st.pad).length,`${f} ${st.id} path`);}
});
test('keyboard direction moves screen-right and collision prevents crossing furniture',()=>{
  const s=newGame();const old={...s.player};tick(s,1,{x:1});assert.ok(s.player.x>old.x&&s.player.y<old.y);
  Object.assign(s.player,{x:2,y:2.2});tick(s,4,{x:1,y:-1});assert.ok(walkable(0,s.player.x,s.player.y));
});
test('fixed-step simulation is deterministic and rejects unbounded time',()=>{
  const a=newGame(),b=newGame();tick(a,60);tick(b,60);assert.deepEqual(a,b);assert.throws(()=>step(a,4000));
});
test('player completes takeout production, pickup, service, and one payment',()=>{
  const s=newGame();command(s,{type:'product',id:'controller'});at(s,0,'prep');assert.ok(s.floors[0].stock.raw>0);at(s,0,'fry');tick(s,3);at(s,0,'pickup');assert.ok(s.player.bag.includes('controller'));
  tick(s,10);at(s,0,'counter',2);assert.equal(s.served,0);assert.ok(s.player.bag.includes('controller'));at(s,0,'stack');assert.equal(s.served,0);assert.equal(s.floors[0].counter.controller,1);at(s,0,'counter',3);assert.equal(s.served,1);assert.equal(s.money,71);assert.equal(s.tutorial,5);assert.ok(validateSave(s));
});
test('drink orders require both goods and pay their sum once',()=>{
  const s=rich();command(s,{type:'section',floor:0});tick(s,20);const c=s.floors[0].customers[0];c.needs=['controller','drink'];c.delivered=[false,false];
  s.player.bag=['controller'];at(s,0,'stack');at(s,0,'counter');assert.equal(c.state,'waiting');assert.deepEqual(c.delivered,[true,false]);
  s.player.bag=['drink'];at(s,0,'stack');const before=s.money;at(s,0,'counter',2);assert.equal(s.money-before,4);assert.ok(c.paid);assert.equal(c.state,'leaving');
});
test('drinks occur near 80 percent and unlocking refreshes only untouched orders',()=>{
  const s=rich(false);command(s,{type:'product',id:'controller'});tick(s,20);const started=s.floors[0].customers[0];started.delivered[0]=true;command(s,{type:'section',floor:0});assert.deepEqual(started.needs,['controller']);assert.ok(s.floors[0].customers.slice(1).some(c=>c.needs.includes('drink')));
  let drinks=0;for(let i=0;i<1000;i++){s.floors[0].customers=[];s.floors[0].arrival=0;step(s,.05,{pausedPlayer:true});if(s.floors[0].customers[0].needs.includes('drink'))drinks++;}assert.ok(drinks>750&&drinks<850,`drink frequency ${drinks}/1000`);
});
test('existing saves gain empty counter stacks without losing progress',()=>{
  const s=newGame();s.version=2;s.money=543;s.served=7;s.tutorial=4;s.floors.forEach(f=>delete f.counter);const restored=decode(JSON.stringify(s));assert.equal(restored.money,543);assert.equal(restored.served,7);assert.equal(restored.tutorial,5);assert.ok(Object.values(restored.floors[0].counter).every(n=>n===0));
});
test('insufficient funds reject every purchase without mutations',()=>{
  const s=newGame();s.money=0;
  for(const c of [{type:'floor',floor:1},{type:'hire',id:0},{type:'upgrade',category:'speed'},{type:'section'},{type:'outfit',id:'chef'}]){const old=structuredClone(s);assert.equal(command(s,c).ok,false);assert.deepEqual(s,old);}
});
test('floor progression is sequential and unlocks cannot be purchased twice',()=>{
  const s=newGame();s.money=10000;assert.equal(command(s,{type:'floor',floor:2}).ok,false);assert.ok(command(s,{type:'floor',floor:1}).ok);const cash=s.money;assert.equal(command(s,{type:'floor',floor:1}).ok,false);assert.equal(s.money,cash);
});
test('transaction tokens prevent duplicate charges even after serialization',()=>{
  const s=newGame();s.money=500;assert.ok(command(s,{type:'upgrade',category:'speed',token:'one'}).ok);const restored=decode(encode(s));assert.equal(command(restored,{type:'upgrade',category:'speed',token:'one'}).ok,false);assert.equal(restored.money,410);assert.equal(restored.floors[0].upgrades.speed,1);
});
test('exactly 20 unique hires, five per origin, one assignment each',()=>{
  const s=rich();for(const def of ROSTER)assert.ok(command(s,{type:'hire',id:def.id,floor:def.origin}).ok);
  assert.equal(s.employees.length,20);for(let f=0;f<4;f++)assert.equal(s.employees.filter(e=>e.floor===f).length,5);
  const cash=s.money;assert.equal(command(s,{type:'hire',id:0}).ok,false);assert.equal(command(s,{type:'hire',id:20}).ok,false);assert.equal(s.money,cash);
});
test('assignment rejects a thirteenth employee and a locked destination',()=>{
  const s=rich();for(const def of ROSTER)command(s,{type:'hire',id:def.id,floor:def.origin});for(let id=5;id<12;id++)assert.ok(command(s,{type:'assign',id,floor:0}).ok);
  assert.equal(s.employees.filter(e=>e.floor===0).length,12);assert.equal(command(s,{type:'assign',id:12,floor:0}).ok,false);assert.equal(s.employees.find(e=>e.id===12).floor,2);
  const a=newGame();a.money=500;command(a,{type:'hire',id:0});assert.equal(command(a,{type:'assign',id:0,floor:1}).ok,false);
});
test('transfers return undelivered goods, preserve upgrades and customer service',()=>{
  const s=rich();command(s,{type:'hire',id:0});command(s,{type:'upgrade',id:0,category:'profit'});const e=s.employees[0];e.bag=['controller','drink'];e.action='counter';e.progress=.5;tick(s,1);const customers=structuredClone(s.floors[0].customers),cash=s.money;
  assert.ok(command(s,{type:'assign',id:0,floor:1}).ok);assert.equal(e.upgrades.profit,1);assert.equal(e.bag.length,0);assert.equal(e.action,'');assert.equal(s.floors[0].stock.controller,1);assert.equal(s.money,cash);assert.deepEqual(s.floors[0].customers,customers);
});
test('player upgrades permit five combined purchases independently per floor',()=>{
  const s=rich();for(const category of ['speed','capacity','profit','speed','profit'])assert.ok(command(s,{type:'upgrade',category}).ok);
  assert.equal(command(s,{type:'upgrade',category:'capacity'}).ok,false);assert.ok(command(s,{type:'upgrade',category:'capacity',floor:1}).ok);assert.equal(capacity(s,s.player,0),4);assert.equal(s.floors[1].upgrades.capacity,1);
});
test('employee cap is three per category and independent of player allowance',()=>{
  const s=rich();command(s,{type:'hire',id:0});for(const category of ['speed','capacity','profit']){for(let i=0;i<3;i++)assert.ok(command(s,{type:'upgrade',id:0,category}).ok);assert.equal(command(s,{type:'upgrade',id:0,category}).ok,false);}assert.equal(s.floors[0].upgrades.profit,0);
});
test('profit bonuses add against the base and receipts cannot pay twice',()=>{
  const s=rich();s.floors[0].upgrades.profit=1;const actor={x:4,y:4,upgrades:{profit:2}},receipt={paid:false};const before=s.money;
  assert.equal(collectPayment(s,0,actor,100,receipt),180);assert.equal(collectPayment(s,0,actor,100,receipt),0);assert.equal(s.money-before,180);
  assert.equal(collectPayment(s,0,s.player,100,{paid:false}),144);
});
test('outfits unlock only on eligible floors and persist equipped selection',()=>{
  const s=newGame();s.money=1000;assert.equal(command(s,{type:'outfit',id:'formal'}).ok,false);assert.ok(command(s,{type:'outfit',id:'chef'}).ok);assert.equal(decode(encode(s)).outfit,'chef');const cash=s.money;command(s,{type:'outfit',id:'chef'});assert.equal(s.money,cash);
});
test('dining exposes every lifecycle state and tables require cleaning',()=>{
  const s=rich();command(s,{type:'visit',floor:1});command(s,{type:'hire',id:5,floor:1});command(s,{type:'table',floor:1,id:0});const states=new Set(),tableStates=new Set(),meals=new Set();
  for(let i=0;i<8000;i++){step(s,.05,{pausedPlayer:true});s.floors[1].customers.forEach(c=>{states.add(c.state);meals.add(c.needs[0]);});s.floors[1].tables.forEach(t=>tableStates.add(t.state));}
  for(const state of ['waiting','toTable','dining','payment','leaving'])assert.ok(states.has(state),state);
  assert.ok(tableStates.has('dirty'));assert.ok(tableStates.has('free'));assert.ok(meals.has('tower')&&meals.has('handheld'));assert.ok(s.floors[1].served>10);assert.ok(validateSave(s));
});
test('shop restocks, browses and checks out both souvenir and keychains with no drinks',()=>{
  const s=rich();command(s,{type:'section',floor:2});command(s,{type:'hire',id:10,floor:2});const items=new Set();for(let i=0;i<8000;i++){step(s,.05,{pausedPlayer:true});s.floors[2].customers.forEach(c=>{if(c.paid)items.add(c.needs[0]);});}
  assert.ok(items.has('souvenir')&&items.has('keychain'));assert.ok(s.floors[2].served>10);assert.ok(!LAYOUTS[2].some(st=>['wine','drinks','drink'].includes(st.kind)));assert.ok(validateSave(s));
});
test('arcade accumulates quarters before collection and workers collect them',()=>{
  const s=rich();tick(s,80);const before=s.floors[3].machines.reduce((n,m)=>n+m.quarters,0);assert.ok(before>0);assert.equal(s.floors[3].revenue,0);
  command(s,{type:'hire',id:15,floor:3});tick(s,80);assert.ok(s.floors[3].revenue>=18);assert.ok(validateSave(s));
});
test('VR requires unlock and proximity, has lane controls and pays one reward',()=>{
  const s=rich();command(s,{type:'visit',floor:3});assert.equal(startVR(s),false);command(s,{type:'section',floor:3});Object.assign(s.player,LAYOUTS[3].find(st=>st.id==='vr').pad);assert.ok(startVR(s));assert.equal(startVR(s),false);vrInput(s,-1);assert.equal(s.vr.lane,0);const before=s.money;for(let i=0;i<600;i++)stepVR(s,.05);assert.ok(s.vr.done&&s.vr.paid);assert.equal(s.money-before,s.vr.reward);const after=s.money;stepVR(s,.05);assert.equal(s.money,after);assert.ok(validateSave(s));
});
test('all floors have functional trash without employee disposal or payment',()=>{
  for(let f=0;f<4;f++){const s=rich();command(s,{type:'visit',floor:f});s.player.bag=['controller','drink'];const before=s.money;at(s,f,'trash',2);assert.equal(s.player.bag.length,0);assert.equal(s.money,before);assert.ok(s.events.some(e=>e.kind==='trash'));command(s,{type:'hire',id:f*5,floor:f});const e=s.employees[0];Object.assign(e,LAYOUTS[f].find(st=>st.id==='trash').pad);e.bag=['controller'];tick(s,.7);assert.ok(e.bag.includes('controller'));}
});
test('employees continue off-screen but closed time never accrues',()=>{
  const s=rich();command(s,{type:'hire',id:0,floor:0});command(s,{type:'visit',floor:3});tick(s,100);assert.ok(s.floors[0].revenue>0);const encoded=encode(s),restored=decode(encoded);assert.equal(restored.money,s.money);assert.equal(restored.time,s.time);
});
test('save validation rejects impossible balances, rosters, states and upgrades',()=>{
  for(const corrupt of [s=>s.money=-1,s=>s.money=Infinity,s=>s.floors[0].upgrades.speed=6,s=>s.floors[0].customers=[{id:1}],s=>s.player.bag=['unknown'],s=>s.floor=3,s=>s.floors[0].stock.raw=NaN]){const s=newGame();corrupt(s);assert.equal(validateSave(s),false);assert.throws(()=>encode(s));}
});
test('version-one migration adds defaults and unknown future saves are preserved',()=>{
  const s=newGame();s.version=1;delete s.settings;delete s.outfits;delete s.outfit;const migrated=decode(JSON.stringify(s));assert.equal(migrated.version,4);assert.equal(migrated.outfit,'uniform');
  const storage=memory();const future=JSON.stringify({version:99});storage.setItem(SAVE_KEY,future);const result=loadGame(storage);assert.equal(result.writable,false);assert.equal(storage.getItem(SAVE_KEY),future);
});
test('corrupt primary recovers valid backup without overwriting it',()=>{
  const storage=memory(),s=newGame();saveGame(storage,s);s.money=150;saveGame(storage,s);storage.setItem(SAVE_KEY,'invalid');const loaded=loadGame(storage);assert.equal(loaded.state.money,120);assert.match(loaded.warning,/backup/);assert.ok(saveGame(storage,loaded.state).ok);assert.ok(decode(storage.getItem(BACKUP_KEY)));
});
test('storage errors are reported and checksum detects tampered snapshots',()=>{
  const s=newGame();const raw=JSON.parse(encode(s));raw.data=raw.data.replace('120','999');assert.throws(()=>decode(JSON.stringify(raw)),/Checksum/);
  const broken={getItem(){throw Error('blocked')},setItem(){throw Error('full')}};assert.equal(saveGame(broken,s).ok,false);assert.equal(loadGame(broken).writable,false);
});
test('interrupted saved payments and purchases do not replay after reload',()=>{
  const storage=memory(),s=newGame();const receipt={paid:false};collectPayment(s,0,s.player,100,receipt);command(s,{type:'hire',id:0,token:'hire-0'});saveGame(storage,s);const resumed=loadGame(storage).state;assert.equal(resumed.money,140);assert.equal(resumed.employees.length,1);assert.equal(command(resumed,{type:'hire',id:0,token:'hire-0'}).ok,false);
});
