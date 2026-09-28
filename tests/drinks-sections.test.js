import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step,workerGoal} from '../src/simulation.js';
import {LAYOUTS,FLOORS,tableCost,customerQueue,drinkQueue,serviceQueue,customerCounter,LAYOUT_VERSION} from '../src/config.js';
import {walkable,distance} from '../src/navigation.js';
import {encode,decode} from '../src/storage.js';

const tick=(s,n,pausedPlayer=true)=>{for(let i=0;i<n*20;i++)step(s,.05,{pausedPlayer});};
const at=(s,id,n=.7)=>{Object.assign(s.player,LAYOUTS[s.floor].find(st=>st.id===id).pad,{action:'',progress:0});tick(s,n,false);};
function setup(f){const s=newGame();s.money=100000;if(f)command(s,{type:'floor',floor:f});command(s,{type:'visit',floor:f});command(s,{type:'product',id:f?'tower':'controller'});return s;}

for(const f of [0,1]){
 test(`floor ${f+1}: locked section cannot receive drink demand or employee work`,()=>{
  const s=setup(f);command(s,{type:'hire',id:f*5});const fs=s.floors[f],drink=f?'wine':'drink',jobs=new Set();
  for(let i=0;i<3600;i++){step(s,.05,{pausedPlayer:true});jobs.add(workerGoal(s,f,s.employees[0]));assert.ok(fs.customers.every(c=>!c.needs.includes(drink)));assert.ok(![drink,'drinkStack','drinkCounter'].includes(s.employees[0].action));}
  assert.equal(fs.section,false);assert.ok(fs.revenue>0,'Food-only orders remain fulfillable');assert.ok(!jobs.has(drink));
 });
 test(`floor ${f+1}: one atomic section purchase enables all equipment and survives reload`,()=>{
  let s=setup(f);const price=FLOORS[f].sectionCost,drink=f?'wine':'drink';s.money=price-1;const before=encode(s);assert.equal(command(s,{type:'section'}).ok,false);assert.equal(encode(s),before);
  s.money=price+77;assert.equal(command(s,{type:'section',token:'open-drinks'}).cost,price);assert.equal(s.money,77);s=decode(encode(s));assert.equal(s.floors[f].section,true);assert.equal(s.floors[f].products[drink],true);
  for(const request of [{type:'section',token:'open-drinks'},{type:'section'},{type:'product',id:drink}])assert.equal(command(s,request).ok,false);
  assert.equal(s.money,77);assert.ok(LAYOUTS[f].filter(st=>st.product===drink).length===3);
 });
 test(`floor ${f+1}: mixed order uses two separate stacks and queues and one final payment`,()=>{
  let s=setup(f);command(s,{type:'section'});tick(s,1.25);let c=s.floors[f].customers[0];const meal=f?'tower':'controller',drink=f?'wine':'drink';Object.assign(c,{...serviceQueue(0,f),needs:[meal,drink,drink],delivered:[false,false,false],path:[],pathKey:''});s.floors[f].customers=[c];s.floors[f].arrival=100;s.player.bag=[meal,drink,drink];const cash=s.money;
  at(s,'stack',2.1);assert.deepEqual(s.player.bag,[drink,drink]);at(s,'counter');assert.deepEqual(c.delivered,[true,false,false]);assert.equal(s.money,cash);assert.equal(customerCounter(f,c),'drinkCounter');
  at(s,'drinkStack',1.4);assert.equal(s.player.bag.length,0);tick(s,10);assert.ok(distance(c,drinkQueue())<.1);assert.equal(customerQueue(s.floors[f],f,c).x,drinkQueue().x);
  s=decode(encode(s));c=s.floors[f].customers[0];at(s,'drinkCounter',.7);assert.equal(c.state,'payment');assert.equal(s.money,cash);at(s,'drinkCounter',.7);assert.equal(c.paid,true);const paid=s.money;assert.ok(paid>cash);s=decode(encode(s));at(s,'drinkCounter',2);at(s,'counter',2);assert.equal(s.money,paid);
 });
 test(`floor ${f+1}: old unlocked saves retain inventory, partial orders, assignments and purchases`,()=>{
  const s=setup(f);command(s,{type:'section'});command(s,{type:'hire',id:f*5});command(s,{type:'table',id:0});command(s,{type:'outfit',id:'chef'});tick(s,1);const fs=s.floors[f],c=fs.customers[0],drink=f?'wine':'drink';c.delivered[0]=true;fs.counter[drink]=3;s.player.bag=[drink];s.player.x=12;s.player.y=6.5;s.employees[0].bag=[drink];s.employees[0].upgrades.profit=2;s.layoutVersion=2;
  const loaded=decode(encode(s));assert.equal(loaded.layoutVersion,LAYOUT_VERSION);assert.equal(loaded.money,s.money);assert.equal(loaded.outfit,'chef');assert.ok(loaded.floors[f].section);assert.ok(loaded.floors[f].tables[0].owned);assert.equal(loaded.floors[f].counter[drink],3);assert.deepEqual(loaded.floors[f].customers[0].delivered,c.delivered);assert.deepEqual(loaded.player.bag,[drink]);assert.equal(loaded.employees[0].floor,f);assert.equal(loaded.employees[0].upgrades.profit,2);assert.ok(walkable(f,loaded.player.x,loaded.player.y));assert.deepEqual(decode(encode(loaded)),loaded);
 });
 test(`floor ${f+1}: an old complete unpaid bill moves to drinks without consuming goods again`,()=>{
  let s=setup(f);command(s,{type:'section'});tick(s,1.25);const meal=f?'tower':'controller',drink=f?'wine':'drink',c=s.floors[f].customers[0];
  Object.assign(c,{...serviceQueue(0,f),needs:[meal,drink],delivered:[true,true],state:'payment',path:[],pathKey:''});s.floors[f].customers=[c];s.floors[f].arrival=100;s.layoutVersion=2;
  const cash=s.money;s=decode(encode(s));tick(s,10);assert.ok(distance(s.floors[f].customers[0],drinkQueue())<.1);
  at(s,'drinkCounter');assert.equal(s.money-cash,f?60:20);assert.ok(Object.values(s.floors[f].counter).every(n=>n===0));
  s=decode(encode(s));at(s,'drinkCounter',2);assert.equal(s.money-cash,f?60:20);
 });
}
test('all table offers halve the released prices once, independent of save reloads',()=>{
 const released=[[20,38,57,75,93,112],[33,52,70,88,107,125],[47,65,83,102,120,138],[60,78,97,115,133,152]],s=setup(0);const before=encode(s);for(let f=0;f<4;f++)for(let i=0;i<6;i++){const expected=Math.round(released[f][i]/2);assert.equal(tableCost(f,i),expected);assert.equal(LAYOUTS[f].find(st=>st.id==='table'+i).tableCost,expected);}assert.equal(encode(decode(encode(s))),before);
});
