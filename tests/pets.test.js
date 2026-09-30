import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {PETS,newPets,petAbilities,petBonus} from '../src/pets.js';
import {newGame,command,step,speed,capacity,collectPayment,petTasks,startVR,stepVR} from '../src/simulation.js';
import {encode,decode,validateSave} from '../src/storage.js';
import {paymentQuote} from '../src/economy.js';
import {BALANCE as B,PRODUCTS,LAYOUTS,FLOOR_FOODS,customerQueue,checkoutQueue} from '../src/config.js';
import {walkable,distance,followPath} from '../src/navigation.js';
import {newFollower,followPet,safePetPoint,behindPlayer} from '../src/pet-follower.js';
import {petModel,animatePet} from '../src/pet-models.js';
import {FURNITURE,ensureSecurityRound,securityTick,securitySelect} from '../src/security.js';
const buy=(s,id)=>assert.ok(command(s,{type:'pet-buy',id}).ok);
const tick=(s,t,pausedPlayer=false)=>{for(let i=0;i<t*20;i++)step(s,.05,{pausedPlayer});};
function ready(f=0){const s=newGame();s.money=100000;for(let i=1;i<4;i++)command(s,{type:'floor',floor:i});for(const p of PRODUCTS)command(s,{type:'product',id:p.id,floor:p.floor});command(s,{type:'visit',floor:f});for(const fs of s.floors)fs.arrival=100;return s;}
function customer(s,needs,state='waiting'){const fs=s.floors[s.floor];fs.arrival=0;step(s,.05,{pausedPlayer:true});const c=fs.customers[0];Object.assign(c,{needs,delivered:needs.map(()=>state==='payment'),state,purpose:'food',paid:false});Object.assign(c,customerQueue(fs,s.floor,c));fs.arrival=100;return c;}
function near(s,id,offset=1){const st=LAYOUTS[s.floor].find(v=>v.id===id);Object.assign(s.player,{x:st.pad.x+offset,y:st.pad.y,action:'',progress:0});return st;}

test('catalogue contains 31 distinct fully modelled pets, exact descriptions and increasing $20–$5555 prices',()=>{
 assert.equal(PETS.length,31);assert.equal(new Set(PETS.map(p=>p.id)).size,31);assert.equal(PETS[0].price,20);assert.equal(PETS.at(-1).price,5555);
 for(const [i,p]of PETS.entries()){if(i)assert.ok(p.price>PETS[i-1].price);assert.ok(petAbilities(p).length);const m=petModel(p);assert.equal(m.root.userData.petId,p.id);let count=0;m.root.traverse(o=>{if(o.isMesh)count++;});assert.ok(count>6&&count<65,`${p.name}: ${count} parts`);const bounds=new T.Box3().setFromObject(m.root);assert.ok(bounds.max.y<2&&bounds.min.y>-.08,p.name);assert.ok(bounds.max.x-bounds.min.x<2.5);animatePet(m,.05,1,true,false,3);const y=m.body.position.y;animatePet(m,.05,1.2,true,false,3);assert.notEqual(m.body.position.y,y,p.name);animatePet(m,.05,2,true,true,3);assert.equal(m.body.rotation.z,0);}
});
test('all prices deduct once, preserve ownership across reload and reject poor, duplicate and unowned equipment',()=>{
 for(const p of PETS){let s=ready();s.money=p.price-1;const before=encode(s);assert.equal(command(s,{type:'pet-buy',id:p.id}).ok,false);assert.equal(encode(s),before);s.money=p.price;buy(s,p.id);assert.equal(s.money,0);assert.equal(s.pets.equipped,p.id);s=decode(encode(s));assert.deepEqual(s.pets.owned,[p.id]);assert.equal(command(s,{type:'pet-buy',id:p.id}).ok,false);assert.equal(s.money,0);assert.equal(command(s,{type:'pet-equip',id:'fake'}).ok,false);command(s,{type:'pet-unequip'});assert.equal(s.pets.equipped,null);assert.equal(command(s,{type:'pet-equip',id:p.id}).cost,0);}
 const s=newGame();s.money=55;assert.equal(command(s,{type:'pet-buy',id:'chick'}).ok,false);s.money=70;buy(s,'chick');assert.equal(s.money,50);
});
test('schema-six migration preserves all progress, starts empty, validates pet data and protects newer saves',()=>{
 const old=ready();command(old,{type:'hire',id:0});command(old,{type:'outfit',id:'chef'});old.floors=old.floors.slice(0,4);old.version=6;delete old.pets;const before=structuredClone(old),s=decode(JSON.stringify(old));assert.equal(s.version,10);assert.deepEqual(s.pets,newPets());for(const key of ['money','floors','basement','player','employees','outfit','outfits'])assert.deepEqual(key==='floors'?s[key].slice(0,4):s[key],before[key]);
 for(const mutate of [p=>p.owned=['fake'],p=>p.owned=['cat','cat'],p=>p.equipped='cat',p=>p.incomeCents=100,p=>p.cooldowns.cash=-1]){const t=structuredClone(s);mutate(t.pets);assert.equal(validateSave(t),false);}assert.throws(()=>decode(JSON.stringify({...s,version:11})),/FUTURE_VERSION/);
});
test('each equipped passive bonus is exact, independent of permanent upgrades and never affects employees',()=>{
 for(const p of PETS){let s=ready();s.floors[0].upgrades={speed:2,capacity:2,profit:1};command(s,{type:'hire',id:0});const e=s.employees[0];e.upgrades={speed:2,capacity:2,profit:2};const upgrades=structuredClone(s.floors[0].upgrades),staffSpeed=speed(s,e,0),staffCap=capacity(s,e,0),staffPay=paymentQuote(s,0,e,100).amount;buy(s,p.id);assert.equal(speed(s,s.player,0),B.speed*(1+B.playerSpeedBonus*(2+(p.abilities.speedLevels||0)))*(1+(p.abilities.speed||0)/100));assert.equal(capacity(s,s.player,0),5+(p.abilities.capacity||0));assert.equal(speed(s,e,0),staffSpeed);assert.equal(capacity(s,e,0),staffCap);assert.equal(paymentQuote(s,0,e,100).amount,staffPay);s=decode(encode(s));command(s,{type:'pet-unequip'});command(s,{type:'pet-equip',id:p.id});assert.deepEqual(s.floors[0].upgrades,upgrades);assert.equal(petBonus(s,'speed'),p.abilities.speed||0);command(s,{type:'pet-unequip'});assert.equal(capacity(s,s.player,0),5);assert.equal(speed(s,s.player,0),B.speed*1.3);}
});
test('all income pets add exactly their percent once after upgrades with remainder, pure previews and reloads',()=>{
 for(const p of PETS.filter(p=>p.abilities.income)){let s=ready(),ordinary=ready();s.floors[0].upgrades.profit=ordinary.floors[0].upgrades.profit=3;buy(s,p.id);let extra=0,base=0;
  for(let i=0;i<100;i++){const raw=1+i%8,before=encode(s),quote=paymentQuote(s,0,s.player,raw);assert.equal(encode(s),before);const receipt={paid:false};const amount=collectPayment(s,0,s.player,raw,receipt);assert.equal(amount,quote.amount);assert.equal(s.events.at(-1).text,`+$${amount}`);assert.equal(collectPayment(s,0,s.player,raw,receipt),0);extra+=amount;base+=collectPayment(ordinary,0,ordinary.player,raw,{paid:false});s=decode(encode(s));}
  assert.equal(extra,base+Math.floor(base*p.abilities.income/100));assert.equal(s.pets.incomeCents,(base*p.abilities.income)%100);
 }
});
test('capacity reduction preserves all eleven goods and blocks pickup until capacity is available',()=>{
 let s=ready(1);s.floors[1].upgrades.capacity=5;buy(s,'whale');s.player.bag=Array(11).fill('tower');command(s,{type:'pet-unequip'});s=decode(encode(s));assert.equal(s.player.bag.length,11);near(s,'tower',0);tick(s,2);assert.equal(s.player.bag.length,11);s.player.bag.length=7;tick(s,.8);assert.equal(s.player.bag.length,8);
});
test('every prep pet accelerates player food and drink work and nearby fryer by its exact rate',()=>{
 for(const p of PETS.filter(p=>p.abilities.prep)){const s=ready(1);buy(s,p.id);near(s,'wine',0);step(s,.05);assert.ok(Math.abs(s.player.progress-.05*(1+p.abilities.prep/100))<1e-10);command(s,{type:'hire',id:5,floor:1});const e=s.employees[0];Object.assign(e,LAYOUTS[1].find(st=>st.id==='wine').pad,{action:'wine',progress:0});assert.equal(e.upgrades.speed,0);
  command(s,{type:'visit',floor:0});near(s,'fry',1);s.floors[0].cooking=true;s.floors[0].fry=2;step(s,.05);assert.ok(Math.abs(s.floors[0].fry-(2-.05*(1+p.abilities.prep/100)))<1e-10);s.floors[0].fry=2;step(s,.05,{pausedPlayer:true});assert.equal(s.floors[0].fry,1.95);s.player.x=20;s.floors[0].fry=2;step(s,.05);assert.equal(s.floors[0].fry,1.95);
 }
});
for(const f of [0,1,2,3])test(`floor ${f+1}: service consumes one stacked item and cash only collects an earned completed bill`,()=>{
 let s=ready(f),item=FLOOR_FOODS[f][0],c=customer(s,[item,item]);buy(s,'octopus');near(s,'counter');s.floors[f].counter[item]=2;const cash=s.money;petTasks(s,.05);assert.deepEqual(c.delivered,[true,false]);assert.equal(s.floors[f].counter[item],1);assert.equal(s.money,cash);petTasks(s,.05);assert.deepEqual(c.delivered,[true,false]);s=decode(encode(s));c=s.floors[f].customers[0];buy(s,'manta');petTasks(s,.05);assert.deepEqual(c.delivered,[true,false]);s.pets.cooldowns.serve=0;petTasks(s,.05);assert.ok(c.delivered.every(Boolean));assert.equal(c.state,'payment');buy(s,'mouse');const earned=paymentQuote(s,f,s.player,B.prices[item]*2).amount,before=s.money;petTasks(s,.05);assert.equal(s.money,before+earned);assert.ok(c.paid);const loaded=decode(encode(s));petTasks(loaded,.05);assert.equal(loaded.money,s.money);
});
test('cash collects gift checkout and arcade piles, honors each pet range/cooldown and never manufactures cash',()=>{
 for(const p of PETS.filter(p=>p.abilities.cash)){const s=ready(3);buy(s,p.id);const st=near(s,'machine0',p.abilities.cash[0]+.1);s.floors[3].machines[0].quarters=9;petTasks(s,.05);assert.equal(s.floors[3].machines[0].quarters,9);Object.assign(s.player,{x:st.pad.x+1,y:st.pad.y});const before=s.money;petTasks(s,.05);assert.equal(s.floors[3].machines[0].quarters,0);assert.ok(s.money>before);assert.equal(s.pets.cooldowns.cash,p.abilities.cash[1]);const money=s.money;petTasks(s,.05);assert.equal(s.money,money);}
 const s=ready(2);buy(s,'mouse');const c=customer(s,['souvenir'],'payment');Object.assign(c,{state:'checkout',purpose:'shop',...checkoutQueue()});near(s,'checkout');const before=s.money;petTasks(s,.05);assert.ok(c.paid);assert.equal(s.money-before,30);
});
test('clean helpers only clean purchased dirty tables after meals, never occupied tables or locked sections',()=>{
 for(const p of PETS.filter(p=>p.abilities.clean)){const s=ready();buy(s,p.id);command(s,{type:'table',id:0});near(s,'table0');const t=s.floors[0].tables[0];t.state='occupied';petTasks(s,.05);assert.equal(t.state,'occupied');t.state='dirty';petTasks(s,.05);assert.equal(t.state,'free');assert.equal(s.pets.cooldowns.clean,p.abilities.clean[1]);}
 const s=ready();buy(s,'octopus');s.floors[0].section=false;s.floors[0].products.drink=false;const c=customer(s,['drink']);s.floors[0].counter.drink=2;near(s,'drinkCounter');petTasks(s,.05);assert.equal(c.delivered[0],false);
});
test('helper cooldowns and pauses survive unequip, switching, floor changes and reload',()=>{
 let s=ready(3);buy(s,'mouse');s.floors[3].machines[0].quarters=3;near(s,'machine0');petTasks(s,.05);const cooldown=s.pets.cooldowns.cash;command(s,{type:'pet-unequip'});petTasks(s,1);assert.equal(s.pets.cooldowns.cash,cooldown);buy(s,'whale');s=decode(encode(s));assert.equal(s.pets.cooldowns.cash,cooldown);petTasks(s,1,false);assert.equal(s.pets.cooldowns.cash,cooldown);command(s,{type:'visit',floor:0});assert.equal(s.pets.cooldowns.cash,cooldown);petTasks(s,.05);assert.equal(s.pets.cooldowns.cash,cooldown-.05);
});
test('pet income leaves VR and exact security +15/-5 payouts unchanged',()=>{
 const s=ready(3);buy(s,'whale');near(s,'vr',0);assert.ok(startVR(s));s.vr.time=24.95;s.vr.score=4;const quote=paymentQuote(s,3,s.player,B.vrBaseReward+4,false);stepVR(s,.05);assert.equal(s.vr.reward,quote.amount);
 command(s,{type:'basement'});command(s,{type:'computer'});for(const p of FURNITURE)command(s,{type:'furniture',id:p.id});command(s,{type:'security'});ensureSecurityRound(s);for(let i=0;i<601&&s.basement.security.round.phase==='waiting';i++)securityTick(s,.05,true);const r=s.basement.security.round,money=s.money;assert.equal(securitySelect(s,{roundId:r.id,person:'robber',watching:true}).amount,15);assert.equal(s.money,money+15);for(let i=0;i<801;i++)securityTick(s,.05,true);assert.ok(s.basement.security.penalties>=5);assert.equal(s.basement.security.penalties%5,0);
});
test('followers route safely on all floors, avoid people, recover and transfer with no gameplay changes',()=>{
 for(let f=0;f<4;f++){const player={x:7,y:8},actors=[player,{x:6,y:8},{x:8,y:8}],p=newFollower(f,{x:4,y:4},actors);for(let i=0;i<500;i++){followPet(p,f,player,actors,.05);assert.ok(walkable(f,p.x,p.y));}assert.ok(distance(p,player)<1.8);assert.ok(distance(p,player)>.7);p.stuck=3.1;followPet(p,f,player,actors,.05);assert.equal(p.recovered,1);assert.ok(walkable(f,p.x,p.y,.2));followPet(p,(f+1)%4,{x:20,y:7},[],.05);assert.equal(p.floor,(f+1)%4);assert.ok(distance(p,{x:20,y:7})<2);const safe=safePetPoint(f,{x:1.7,y:3.5},[]);assert.ok(walkable(f,safe.x,safe.y,.2));}
});

test('resting companions move out of the player silhouette when a safe side position is available',()=>{
 for(let floor=0;floor<4;floor++){
  const player={x:20.5,y:8},p=newFollower(floor,player,[player]);
  assert.equal(behindPlayer(p,player),false);
  Object.assign(p,{x:19.80875,y:6.80272});assert.ok(behindPlayer(p,player));
  for(let i=0;i<100;i++)followPet(p,floor,player,[player],.05);
  assert.equal(behindPlayer(p,player),false);assert.ok(walkable(floor,p.x,p.y,p.radius));assert.ok(distance(p,player)<2);
 }
});
test('all 31 body clearances stay outside furniture while following a player across each expanded floor',()=>{
 for(const def of PETS){const model=petModel(def);for(let floor=0;floor<4;floor++){
  const player={x:6.5,y:5.5,path:[],pathKey:''},p=newFollower(floor,player,[],model.clearance);
  for(let i=0;i<160;i++){followPath(player,floor,{x:20,y:7},.1,3);followPet(p,floor,player,[player],.1);assert.ok(walkable(floor,p.x,p.y,model.clearance),`${def.name} floor ${floor+1} clearance`);}
  assert.ok(distance(player,p)<2.6,`${def.name} floor ${floor+1} follows`);
 }}
});
test('each advertised service and cleaning cooldown prevents early repeat and expires at its stated time',()=>{
 for(const kind of ['serve','clean'])for(const def of PETS.filter(p=>p.abilities[kind])){
  const s=ready();buy(s,def.id);let c,t;
  if(kind==='serve'){c=customer(s,['controller','controller']);s.floors[0].counter.controller=2;near(s,'counter');}
  else{command(s,{type:'table',id:0});t=s.floors[0].tables[0];t.state='dirty';near(s,'table0');}
  petTasks(s,.05);if(t)t.state='dirty';const n=def.abilities[kind][1]*20;
  for(let i=0;i<n-1;i++)petTasks(s,.05);
  if(c)assert.deepEqual(c.delivered,[true,false]);else assert.equal(t.state,'dirty');
  petTasks(s,.05);if(c)assert.deepEqual(c.delivered,[true,true]);else assert.equal(t.state,'free');
 }
});
