import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command} from '../src/simulation.js';
import {PRODUCTS,LAYOUTS} from '../src/config.js';
import {food} from '../src/scene-assets.js';
import {Group} from 'three';
import {stationCue,carryLayout,collectionPoint,updateStationMotion} from '../src/world-motion.js';

function opened(){const s=newGame();s.money=100000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});return s;}
const station=(f,id)=>LAYOUTS[f].find(s=>s.id===id);
function fixture(id){return {st:station(0,id),open:true,pad:new Group(),body:new Group(),goods:new Group(),detail:new Group(),parts:[new Group()],steam:[new Group()],bubbles:[new Group()],lights:[],pour:new Group(),stream:new Group(),fill:new Group()};}

test('equipment cues distinguish locked, idle, working, ready and blocked without changing saved state',()=>{
 const s=newGame(),fry=station(0,'fry');assert.equal(stationCue(s,0,fry).state,'locked');command(s,{type:'product',id:'controller'});
 assert.equal(stationCue(s,0,fry).state,'idle');s.floors[0].stock.raw=3;assert.equal(stationCue(s,0,fry).state,'ready');
 s.floors[0].cooking=true;s.floors[0].fry=1.2;assert.equal(stationCue(s,0,fry).state,'working');assert.equal(stationCue(s,0,fry).progress,.5);
 s.floors[0].cooking=false;s.floors[0].stock.controller=18;assert.equal(stationCue(s,0,fry).state,'blocked');
 const before=JSON.stringify(s);for(const st of LAYOUTS[0])stationCue(s,0,st);assert.equal(JSON.stringify(s),before);
});

test('maximum capacity has two bounded columns, four visible goods and the exact quantity',()=>{
 for(let count=0;count<=8;count++){const items=Array(count).fill('tower'),plan=carryLayout(items);assert.equal(plan.quantity,count);assert.equal(plan.parts.length,Math.min(4,count));assert.ok(plan.height<.86);assert.deepEqual(items,Array(count).fill('tower'));}
 const mixed=carryLayout(['controller','wine','controller','wine','controller']);assert.equal(mixed.columns,2);assert.equal(mixed.overflow,true);
});

test('every collection animation starts at its actual station, with a safe fallback',()=>{
 for(let f=0;f<4;f++)for(const st of LAYOUTS[f].filter(s=>['counter','checkout','arcade','vr'].includes(s.kind))){const p=collectionPoint(f,st.pad.x,st.pad.y);assert.equal(p.station,st.id);assert.ok([p.x,p.y,p.z].every(Number.isFinite));}
 assert.deepEqual(collectionPoint(0,25,16),{x:25,y:.9,z:16,station:null});
});

test('new furniture settles once and remains still; reduced motion resolves the same final pose',()=>{
 const s=opened(),d=fixture('drink'),before=JSON.stringify(s);d.buildAge=0;
 updateStationMotion(d,s,.15,.15,false,false);assert.ok(d.body.scale.x<1);assert.ok(d.body.position.y<0);
 for(let i=0;i<40;i++)updateStationMotion(d,s,.05,i*.05,false,false);
 assert.equal(d.buildAge,undefined);assert.equal(d.body.scale.x,1);assert.equal(d.body.position.y,0);
 d.buildAge=0;updateStationMotion(d,s,.15,3,true,false);assert.equal(d.body.scale.x,1);assert.equal(d.body.position.y,0);assert.equal(JSON.stringify(s),before);
});

test('drink fill, placed food and fryer effects stay cosmetic and stop in reduced motion',()=>{
 const s=opened(),d=fixture('drink');s.player.action='drink';s.player.progress=.4;
 const item=food('drink');Object.assign(item.userData,{born:0,restY:1.2,restScale:.72});d.goods.add(item);
 const before=JSON.stringify(s);updateStationMotion(d,s,.05,1,false,false);assert.ok(d.fill.scale.y>0&&d.fill.scale.y<.19);assert.equal(d.stream.visible,true);assert.ok(item.position.y>1.2);
 updateStationMotion(d,s,.05,1,true,false);assert.equal(d.stream.visible,false);assert.equal(item.position.y,1.2);assert.equal(item.scale.x,.72);
 s.floors[0].cooking=true;const fryer=fixture('fry');updateStationMotion(fryer,s,.05,1,false,false);assert.ok(fryer.steam.some(p=>p.visible));updateStationMotion(fryer,s,.05,2,true,false);assert.ok(fryer.steam.every(p=>!p.visible));s.floors[0].cooking=false;
 assert.equal(JSON.stringify(s),before);
});

test('pending bill visuals reflect receipt state without awarding, collecting or replaying money',()=>{
 const s=opened(),d=fixture('counter');s.floors[0].customers=[{purpose:'food',state:'payment',paid:false,needs:['controller'],delivered:[true]}];const before=JSON.stringify(s);
 updateStationMotion(d,s,.05,1,false,false);assert.equal(d.bills.filter(b=>b.visible).length,1);assert.ok(d.cashAge>=1,'An existing saved bill must not replay its arrival');
 for(let i=0;i<20;i++)updateStationMotion(d,s,.05,i*.05,false,false);assert.equal(JSON.stringify(s),before);
 s.floors[0].customers[0].paid=true;updateStationMotion(d,s,.05,2,false,false);assert.ok(d.bills.every(b=>!b.visible));
});
