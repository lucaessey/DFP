import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step,newActor} from '../src/simulation.js';
import {LAYOUTS,WORLD,LAYOUT_VERSION,PRODUCTS,tableSeat,tableApproach,serviceQueue,checkoutQueue,shelfApproach,shopWaiting,tableWaiting,arcadeSeat,arcadeWaiting} from '../src/config.js';
import {findPath,followPath,walkable,distance} from '../src/navigation.js';
import {encode,decode} from '../src/storage.js';

for(let floor=0;floor<4;floor++)test(`expanded floor ${floor+1}: every station pair and customer destination is walkable`,()=>{
  assert.ok(WORLD.width*WORLD.depth>=22*14*1.6);
  const pads=LAYOUTS[floor].map(s=>s.pad);
  const destinations=[WORLD.entrance,WORLD.kitchen,WORLD.dining,...pads];
  for(let i=0;i<6;i++)destinations.push(serviceQueue(i),tableApproach(i),tableWaiting(i));
  if(floor===2){destinations.push(shelfApproach('souvenir'),shelfApproach('keychain'));for(let i=0;i<6;i++)destinations.push(checkoutQueue(i),shopWaiting(i));}
  if(floor===3){for(let i=0;i<3;i++)destinations.push(arcadeSeat(i));for(let i=0;i<6;i++)destinations.push(arcadeWaiting(i));}
  for(const from of pads)for(const to of destinations){
    assert.ok(walkable(floor,to.x,to.y,.23),JSON.stringify(to));
    const actor={...newActor(),...from};const path=findPath(floor,actor,to);assert.ok(path.length,`${JSON.stringify(from)} → ${JSON.stringify(to)}`);
    for(let t=0;t<1200&&distance(actor,to)>.1;t++){followPath(actor,floor,to,.05,2.3);assert.ok(walkable(floor,actor.x,actor.y));}
    assert.ok(distance(actor,to)<.1,`Blocked: ${JSON.stringify(from)} → ${JSON.stringify(to)} at ${actor.x},${actor.y}`);
  }
  for(let i=0;i<pads.length;i++)for(let j=i+1;j<pads.length;j++)assert.ok(distance(pads[i],pads[j])>1.4,'Work interaction circles must not overlap');
});

test('frequent work routes stay compact and table aisles accommodate passing',()=>{
  const trips=[[0,'prep','fry'],[0,'fry','pickup'],[0,'pickup','stack'],[0,'drink','stack'],[1,'tower','stack'],[1,'wine','stack'],[2,'stock','shelf'],[2,'keyStock','keyShelf'],[2,'shelf','checkout'],[2,'snack2','stack'],[3,'snack3','stack'],[3,'machine2','vr']];
  for(const [f,from,to] of trips){const a=LAYOUTS[f].find(s=>s.id===from).pad,b=LAYOUTS[f].find(s=>s.id===to).pad,path=[a,...findPath(f,a,b)];const length=path.slice(1).reduce((n,p,i)=>n+distance(path[i],p),0);assert.ok(length<=18,`${from} → ${to}: ${length}`);}
  assert.equal(tableSeat(1).x-tableSeat(0).x,6);assert.equal(tableSeat(2).y-tableSeat(0).y,4.5);
  for(let f=0;f<4;f++)for(const y of [4,8.5,13])assert.ok(walkable(f,20,y,.6));
});

test('old layout migration retains progress, cargo, paid meals and timers while repairing positions once',()=>{
  const s=newGame();s.money=100000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});command(s,{type:'table',id:0});command(s,{type:'hire',id:0});command(s,{type:'outfit',id:'chef'});
  for(let i=0;i<380;i++)step(s,.05,{pausedPlayer:true});const c=s.floors[0].customers[0];Object.assign(c,{x:12.8,y:3.45,state:'dining',table:0,needs:['controller'],delivered:[true],paid:true,counted:true,timer:3.5});Object.assign(s.floors[0].tables[0],{state:'occupied',customer:c.id,meal:'controller'});
  Object.assign(s.player,{x:10,y:1.5,bag:['controller','drink'],path:[{x:20,y:10}],pathKey:'20,10',moving:true});Object.assign(s.employees[0],{x:16.7,y:4,bag:['drink'],action:'drink',progress:.6});s.employees[0].upgrades.profit=2;s.floors[0].bonusCents=80;delete s.layoutVersion;
  const old=structuredClone(s),loaded=decode(encode(s));assert.equal(loaded.layoutVersion,LAYOUT_VERSION);assert.equal(loaded.money,old.money);assert.equal(loaded.earned,old.earned);assert.deepEqual(loaded.floors.map(f=>f.upgrades),old.floors.map(f=>f.upgrades));assert.equal(loaded.outfit,old.outfit);
  for(const [a,b,f] of [[loaded.player,old.player,0],[loaded.employees[0],old.employees[0],0]]){assert.ok(walkable(f,a.x,a.y,.23));assert.deepEqual(a.bag,b.bag);assert.deepEqual(a.path,[]);assert.equal(a.moving,false);assert.equal(a.action,'');}
  assert.equal(loaded.employees[0].floor,old.employees[0].floor);assert.deepEqual(loaded.employees[0].upgrades,old.employees[0].upgrades);assert.equal(loaded.floors[0].bonusCents,80);
  const diner=loaded.floors[0].customers.find(v=>v.id===c.id);assert.deepEqual({x:diner.x,y:diner.y},tableSeat(0));assert.equal(diner.timer,3.5);assert.equal(diner.paid,true);assert.deepEqual(diner.delivered,[true]);assert.deepEqual(decode(encode(loaded)),loaded);
  const cash=loaded.money;loaded.employees=[];for(let i=0;i<100;i++)step(loaded,.05,{pausedPlayer:true});assert.equal(loaded.money,cash);assert.equal(loaded.floors[0].tables[0].state,'dirty');
});
