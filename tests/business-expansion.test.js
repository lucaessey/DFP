import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step,workerGoal,capacity,speed,collectPayment,petTasks} from '../src/simulation.js';
import {FLOORS,PRODUCTS,ROSTER,LAYOUTS,ITEMS,WORLD,tableSeat,tableApproach,tableCost,BALANCE as B} from '../src/config.js';
import {EXPANSION_ITEMS,EXPANSION_PRICES} from '../src/expansion-config.js';
import {validateSave,encode,decode,saveGame,loadGame} from '../src/storage.js';
import {distance,findPath,walkable} from '../src/navigation.js';
import {highestFloor,ensureSecurityRound,securityTick,securitySelect} from '../src/security.js';
import {paymentQuote} from '../src/economy.js';
import {newFollower,followPet} from '../src/pet-follower.js';
const tick=(s,seconds,input={pausedPlayer:true})=>{for(let i=0;i<Math.round(seconds*20);i++)step(s,.05,input);};
function rich(f=4,sections=true){const s=newGame();s.money=1000000;for(let i=1;i<FLOORS.length;i++)assert.ok(command(s,{type:'floor',floor:i}).ok);for(const p of PRODUCTS)if(!p.section||sections)assert.ok(command(s,{type:'product',floor:p.floor,id:p.id}).ok,JSON.stringify(p));command(s,{type:'visit',floor:f});for(const fs of s.floors)fs.arrival=100;return s;}
function at(s,id,seconds=.7){const st=LAYOUTS[s.floor].find(st=>st.id===id);assert.ok(st,id);Object.assign(s.player,st.pad,{action:'',progress:0});tick(s,seconds,{});}
function one(s,f){const fs=s.floors[f];fs.arrival=0;step(s,.05,{pausedPlayer:true});fs.arrival=100;return fs.customers.at(-1);}
function runPlayer(s,until,seconds=300){for(let n=0;n<seconds*20;n++){if(until())return;const goal=workerGoal(s,s.floor,s.player),st=LAYOUTS[s.floor].find(st=>st.id===goal);step(s,.05,st?{target:st.pad}:{pausedPlayer:true});}assert.fail(`Player job did not complete: ${workerGoal(s,s.floor,s.player)}`);}

test('eleven named businesses, 55 hires and the complete new cost table',()=>{
 assert.equal(FLOORS.length,11);assert.equal(ROSTER.length,55);assert.deepEqual(FLOORS.slice(4).map(f=>f.cost),[5000,8000,12000,18000,26000,36000,50000]);
 assert.deepEqual(FLOORS.slice(4).map(f=>f.sectionCost),[1400,2200,3000,4000,5500,7000,9000]);
 assert.deepEqual(PRODUCTS.filter(p=>p.floor>=4).map(p=>p.cost),[400,500,650,1400,600,450,2200,900,3000,1100,4000,1400,650,5500,1000,600,7000,1500,1200,9000]);
 for(let f=4;f<11;f++){const staff=ROSTER.filter(e=>e.origin===f);assert.equal(staff.length,5);assert.deepEqual(staff.map(e=>e.cost),Array.from({length:5},(_,i)=>100+f*85+i*65));}
});
test('every station, seating approach, entrance and companion route is accessible',()=>{
 for(let f=4;f<11;f++){for(const st of LAYOUTS[f]){assert.ok(walkable(f,st.pad.x,st.pad.y),`${f+1}/${st.id} pad`);assert.ok(findPath(f,WORLD.kitchen,st.pad).length,`${f+1}/${st.id} route`);const path=findPath(f,WORLD.entrance,st.pad,.4);assert.ok(path.length,`${f+1}/${st.id} companion route`);}
  for(let i=0;i<6&&f!==10;i++)assert.ok(findPath(f,WORLD.entrance,tableApproach(i)).length);
 }
});
test('new costs charge once, reject poor players, preserve section locks and survive reload',()=>{
 let s=rich(4,false);for(let f=4;f<11;f++){const p=PRODUCTS.find(p=>p.floor===f&&p.section);s.money=p.cost-1;const before=encode(s);assert.equal(command(s,{type:'section',floor:f}).ok,false);assert.equal(encode(s),before);s.money=p.cost;assert.equal(command(s,{type:'section',floor:f,token:`section-${f}`}).cost,p.cost);s=decode(encode(s));assert.equal(s.money,0);assert.equal(command(s,{type:'section',floor:f}).ok,false);assert.ok(s.floors[f].section);}
});
test('legacy version nine migrates every old field and appends seven locked floors',()=>{
 const s=rich(3);s.floors=s.floors.slice(0,4);s.version=9;s.money=18791;command(s,{type:'hire',id:5,floor:1});s.employees[0].upgrades={speed:3,capacity:2,profit:1};command(s,{type:'pet-buy',id:'camera'});command(s,{type:'outfit',id:'chef'});s.player.bag=['controller','wine'];s.floors[0].stock.controller=7;
 for(const fs of s.floors){for(const item of EXPANSION_ITEMS){delete fs.stock[item];delete fs.counter[item];}}
 const before=structuredClone(s),restored=decode(JSON.stringify(s));assert.equal(restored.version,10);for(const key of ['money','earned','served','player','employees','outfits','outfit','pets','basement','transactions'])assert.deepEqual(restored[key],before[key],key);
 for(let f=0;f<4;f++){const expected=structuredClone(before.floors[f]);for(const item of EXPANSION_ITEMS){expected.stock[item]=0;expected.counter[item]=0;}assert.deepEqual(restored.floors[f],expected);}
 assert.ok(restored.floors.slice(4).every(fs=>!fs.unlocked&&!fs.section&&!Object.values(fs.products).some(Boolean)&&fs.revenue===0));assert.equal(decode(encode(restored)).money,before.money);
});
test('new saved timers, receipts, ownership and malformed activity are validated',()=>{
 const s=rich(10);for(const mutate of [a=>a.robot.input=7,a=>a.robot.timer=NaN,a=>a.factory.hopper=-1,a=>a.factory.delivery={id:3,timer:0,paid:true},a=>a.weather=56,a=>a.umbrellas[0]='yes',a=>a.water[0]=4]){const bad=structuredClone(s);mutate(bad.floors[10].activity);assert.equal(validateSave(bad),false);}
 const bad=structuredClone(s);bad.player.cold=[NaN];assert.equal(validateSave(bad),false);
});
for(let f=4;f<11;f++)test(`floor ${f+1}: player traverses real routes and completes its business cycle`,()=>{
 const s=rich(f);if(f!==10)command(s,{type:'table',id:0});one(s,f);runPlayer(s,()=>s.floors[f].served>=1);assert.ok(s.floors[f].revenue>0);assert.ok(validateSave(s));const after=decode(encode(s));assert.equal(after.money,s.money);assert.equal(after.floors[f].served,s.floors[f].served);
});
for(let f=4;f<11;f++)test(`floor ${f+1}: five employees complete actual jobs, clean, and retain valid saves`,()=>{
 const s=rich(f);if(f!==10)for(let i=0;i<6;i++)command(s,{type:'table',id:i});for(let i=0;i<5;i++)command(s,{type:'hire',floor:f,id:f*5+i});s.floors[f].arrival=0;
 const actions=new Set();for(let n=0;n<10000;n++){step(s,.05,{pausedPlayer:true});for(const e of s.employees)actions.add(e.action);if(n%500===0)assert.ok(validateSave(s),`Save at ${n*.05}s`);}
 assert.ok(s.floors[f].served>=5,`${s.floors[f].served} completed`);assert.ok(s.floors[f].revenue>0);assert.ok(actions.has(f===10?'delivery':f===4||f===6?'counter':'table0'));if(f===5||f===8)assert.ok(actions.has('usher'));assert.ok(validateSave(decode(encode(s))));
});
test('dessert ice cream allows 30 active seconds, shows warnings, melts and never pays',()=>{
 let s=rich(4);at(s,'icecream');assert.equal(s.player.bag[0],'icecream');const money=s.money;tick(s,20);assert.ok(s.player.cold[0]<11&&s.player.cold[0]>9);s=decode(encode(s));tick(s,8);assert.ok(s.player.bag.includes('icecream'));tick(s,3);assert.equal(s.player.bag.length,0);assert.equal(s.money,money);assert.ok(s.events.some(e=>e.kind==='melt'));at(s,'icecream');at(s,'stack');tick(s,40);assert.equal(s.floors[4].counter.icecream,1);
});
test('milkshakes and smoothies never appear in orders before section purchase',()=>{
 const s=rich(4,false);command(s,{type:'table',floor:7,id:0});for(const f of [4,7])for(let n=0;n<100;n++){s.floors[f].customers=[];const c=one(s,f);assert.ok(!c.needs.includes(f===4?'milkshake':'smoothie'));}assert.ok(command(s,{type:'section',floor:7}).ok);s.floors[7].customers=[];assert.ok(one(s,7).needs.includes('smoothie'));
});
test('tickets and popcorn have separate exactly-once receipts including reload',()=>{
 let s=rich(5);command(s,{type:'table',id:3});const c=one(s,5);tick(s,20);const before=s.money;at(s,'admit');assert.equal(s.money-before,95); // 16 base with retained whole-dollar 20% carry
 assert.ok(c.receipts.admission.paid);assert.equal(c.receipts.food.paid,false);const ticket=s.money;at(s,'admit');assert.equal(s.money,ticket);s=decode(encode(s));at(s,'usher');tick(s,10);at(s,'popcorn');const guest=s.floors[5].customers.find(v=>v.id===c.id);at(s,'table3');assert.ok(guest.receipts.food.paid);const cash=s.money;at(s,'table3');assert.equal(s.money,cash);
});
test('robots require ingredients, fault and recover free; charging improves both intervals',()=>{
 const s=rich(6,false),r=s.floors[6].activity.robot;tick(s,10);assert.equal(s.floors[6].stock.robotmeal,0);for(let i=0;i<4;i++){at(s,'ingredients');at(s,'robot');tick(s,5);}assert.equal(r.batches,4);assert.equal(r.fault,true);const cash=s.money;at(s,'robot');assert.equal(r.fault,false);assert.equal(s.money,cash);command(s,{type:'section'});at(s,'ingredients');at(s,'robot');assert.ok(r.timer<=2.5);tick(s,3);assert.equal(r.fault,false);assert.equal(r.batches,5);
});
test('rooftop umbrella purchases are permanent, half-speed rain only affects uncovered guests',()=>{
 const s=rich(7);command(s,{type:'table',id:0});const before=s.money;assert.equal(command(s,{type:'umbrella',id:0}).cost,300);assert.equal(s.money,before-300);assert.equal(command(s,{type:'umbrella',id:0}).ok,false);assert.ok(decode(encode(s)).floors[7].activity.umbrellas[0]);const c=one(s,7);runPlayer(s,()=>c.state==='dining');s.floors[7].activity.weather=41;c.timer=6;tick(s,1);assert.ok(Math.abs(c.timer-5)<1e-7);s.floors[7].activity.umbrellas[0]=false;c.timer=6;tick(s,1);assert.ok(Math.abs(c.timer-5.5)<1e-7);assert.equal(s.floors[6].activity.weather,0);
});
test('esports faults pause sessions until free repair; admission pays once',()=>{
 const s=rich(8);command(s,{type:'table',id:0});const c=one(s,8);runPlayer(s,()=>c.fault);const cash=s.money,timer=c.timer;tick(s,12);assert.equal(c.timer,timer);at(s,'table0');assert.equal(c.fault,false);assert.equal(c.faultDone,true);assert.equal(s.money,cash);runPlayer(s,()=>s.floors[8].served>0);assert.equal(c.receipts.admission.paid,true);
});
test('café requires fresh water, pays playground separately and leaves cleanable paw prints',()=>{
 const s=rich(9);command(s,{type:'table',id:0});const c=one(s,9);runPlayer(s,()=>c.state==='dining');s.floors[9].activity.water[0]=0;const timer=c.timer;tick(s,10);assert.equal(c.timer,timer);at(s,'water');runPlayer(s,()=>c.state==='playing');assert.equal(s.floors[9].tables[0].state,'dirty');assert.ok(c.receipts.food.paid);assert.equal(c.receipts.play.paid,false);runPlayer(s,()=>s.floors[9].served>0);assert.ok(c.receipts.play.paid);
});
test('factory conserves ingredients and snacks; belts move inventory, never mint it',()=>{
 const s=rich(10),fs=s.floors[10],v=fs.activity.factory;tick(s,20);assert.equal(fs.stock.factorysnack+v.hopper,0);for(let i=0;i<3;i++){at(s,'ingredients');at(s,'processor');tick(s,4);}tick(s,3);assert.equal(fs.stock.factorysnack+v.hopper,3);assert.equal(v.hopper,3);at(s,'seal');assert.equal(v.hopper,0);assert.deepEqual(s.player.bag,['sealedbox']);at(s,'delivery');assert.equal(v.delivery.paid,false);assert.equal(s.player.bag.length,0);let copy=decode(encode(s));tick(copy,5);const before=copy.money;at(copy,'delivery');assert.equal(copy.money-before,180);const after=copy.money;copy=decode(encode(copy));at(copy,'delivery',2);assert.equal(copy.money,after);assert.equal(copy.floors[10].activity.factory.completed,1);
});
test('factory manual packing works without belts and returning cargo loses no inventory',()=>{
 const s=rich(10,false),fs=s.floors[10];for(let i=0;i<3;i++){at(s,'ingredients');at(s,'processor');tick(s,4);at(s,'factoryPickup');at(s,'packer');}assert.equal(fs.activity.factory.hopper,3);at(s,'seal');command(s,{type:'visit',floor:9});assert.equal(fs.stock.sealedbox,1);command(s,{type:'visit',floor:10});at(s,'seal');at(s,'delivery');tick(s,5);at(s,'delivery');assert.equal(fs.activity.factory.completed,1);
});
test('all new ordinary earnings apply player/employee bonuses once; fixed security stays separate',()=>{
 for(const [item,base] of Object.entries(EXPANSION_PRICES)){const s=rich(4);s.floors[4].upgrades.profit=2;command(s,{type:'pet-buy',id:'camera'});command(s,{type:'hire',id:20,floor:4});const e=s.employees[0];e.upgrades.profit=3;for(const a of [s.player,e]){const quote=paymentQuote(s,4,a,base).amount,r={paid:false},before=s.money;assert.equal(collectPayment(s,4,a,base,r),quote,item);assert.equal(collectPayment(s,4,a,base,r),0);assert.equal(s.money-before,quote);}}
});
test('all new highest floors have security targets with unchanged remote and normal catch amounts',()=>{
 const s=newGame();s.money=1000000;command(s,{type:'pet-buy',id:'camera'});for(let f=1;f<11;f++){command(s,{type:'floor',floor:f});if(f<4)continue;ensureSecurityRound(s);s.basement.security.round.remaining=.05;securityTick(s,.05,true);securityTick(s,3,true);const r=s.basement.security.round;assert.equal(highestFloor(s),f);assert.equal(r.floor,f);assert.equal(r.robber.bag.length,1);assert.ok(validateSave(s));const money=s.money;assert.equal(securitySelect(s,{roundId:r.id,person:'robber',watching:true,remote:true}).amount,100);assert.equal(s.money,money+100);assert.equal(securitySelect(s,{roundId:r.id,person:'robber',watching:true}).ok,false);}
});
test('companions follow on every new floor and switching never stacks passive bonuses',()=>{
 const s=rich();command(s,{type:'pet-buy',id:'camera'});for(let f=4;f<11;f++){command(s,{type:'visit',floor:f});const speedWith=speed(s,s.player,f);assert.equal(capacity(s,s.player,f),8);const p=newFollower(f,s.player);Object.assign(s.player,{x:20,y:15});for(let n=0;n<200;n++)followPet(p,f,s.player,[],.05);assert.ok(distance(p,s.player)<3);assert.ok(walkable(f,p.x,p.y,.38));command(s,{type:'pet-unequip'});assert.equal(capacity(s,s.player,f),3);command(s,{type:'pet-equip',id:'camera'});assert.equal(speed(s,s.player,f),speedWith);}
});
test('helper pets collect delivery and table payments, serve available food and clean only finished places',()=>{
 const s=rich(10);command(s,{type:'pet-buy',id:'whale'});s.floors[10].activity.factory.delivery={id:s.nextId++,timer:0,paid:false};Object.assign(s.player,LAYOUTS[10].find(st=>st.id==='delivery').pad);const money=s.money;petTasks(s,.05);assert.ok(s.money>money);assert.equal(s.floors[10].activity.factory.delivery,null);
 command(s,{type:'visit',floor:7});command(s,{type:'pet-buy',id:'owl'});command(s,{type:'table',id:0});const c=one(s,7);runPlayer(s,()=>c.state==='service');s.player.bag=[...c.needs];Object.assign(s.player,LAYOUTS[7].find(st=>st.id==='table0').pad);s.pets.cooldowns.serve=0;petTasks(s,.05);assert.ok(c.delivered.some(Boolean));assert.equal(s.floors[7].tables[0].state,'occupied');
});
test('every new floor retains five personal purchases, preparation pet effects and transfer upgrades',()=>{
 const s=rich();for(let f=4;f<11;f++){for(const category of ['speed','capacity','profit','speed','profit'])assert.ok(command(s,{type:'upgrade',floor:f,category}).ok);assert.equal(command(s,{type:'upgrade',floor:f,category:'speed'}).ok,false);}
 command(s,{type:'hire',id:50,floor:10});const e=s.employees[0];for(const category of ['speed','capacity','profit'])for(let n=0;n<3;n++)assert.ok(command(s,{type:'upgrade',floor:10,id:50,category}).ok);const upgrades=structuredClone(e.upgrades);e.bag=['ingredient'];command(s,{type:'assign',id:50,floor:4});assert.deepEqual(e.upgrades,upgrades);assert.equal(s.floors[10].stock.ingredient,1);assert.deepEqual(e.bag,[]);
 command(s,{type:'pet-buy',id:'phoenix'});for(const [floor,station] of [[4,'waffle'],[5,'popcorn'],[7,'terracemeal'],[8,'esnack'],[9,'cafemeal']]){command(s,{type:'visit',floor});at(s,station,.5);assert.equal(s.player.bag.length,1);const without=rich(floor);at(without,station,.5);assert.equal(without.player.bag.length,0);}
});
