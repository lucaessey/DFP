import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step,speed,capacity} from '../src/simulation.js';
import {encode,decode,validateSave} from '../src/storage.js';
import {newView,firstPerson,movementDirection,turnView,MAX_PITCH,loungeWalkable,moveLounge,recoverLounge,petInView} from '../src/first-person.js';
import {FirstPersonView} from '../src/first-person-view.js';
import {OUTFITS,LAYOUTS} from '../src/config.js';
import {walkable,findPath,nearestWalkable} from '../src/navigation.js';
import {safePetPoint} from '../src/pet-follower.js';
import {startStory,storyTick} from '../src/story.js';
import {storyWalkable} from '../src/story-navigation.js';
import * as T from 'three';

const explorer=()=>{const s=newGame();s.money=5000;command(s,{type:'outfit',id:'explorer'});return s;};
test('Explorer costs exactly $1000 once, requires funds, persists and never changes stats or position',()=>{
 const poor=newGame(),before=structuredClone(poor);assert.equal(command(poor,{type:'outfit',id:'explorer'}).ok,false);assert.deepEqual(poor,before);
 const s=newGame();s.money=3000;s.player.bag=['controller','drink'];const a=structuredClone(s.player),v=speed(s,s.player,0),cap=capacity(s,s.player,0);
 assert.equal(command(s,{type:'outfit',id:'explorer',token:'purchase'}).ok,true);assert.equal(s.money,2000);command(s,{type:'outfit',id:'explorer',token:'purchase'});command(s,{type:'outfit',id:'explorer',token:'new-tap'});assert.equal(s.money,2000);assert.deepEqual(s.player,a);assert.equal(speed(s,s.player,0),v);assert.equal(capacity(s,s.player,0),cap);
 turnView(s.view,150,-80);const loaded=decode(encode(s));assert.deepEqual(loaded.view,s.view);assert.ok(firstPerson(loaded));command(loaded,{type:'outfit',id:'uniform'});assert.ok(!firstPerson(loaded));command(loaded,{type:'outfit',id:'explorer'});assert.equal(loaded.money,2000);assert.deepEqual(loaded.player,a);
});
test('Version 11 migration preserves every old field and validates look without accepting future saves',()=>{
 const s=newGame();s.version=11;delete s.view;s.money=4321;s.player.bag=['controller'];const copy=structuredClone(s),m=decode(JSON.stringify(s));assert.equal(m.version,12);assert.deepEqual(m.view,newView());for(const k of Object.keys(copy))if(k!=='version')assert.deepEqual(m[k],copy[k],k);
 for(const change of [v=>v.yaw=Infinity,v=>v.pitch=2,v=>v.lounge.x=-1]){const t=structuredClone(m);change(t.view);assert.equal(validateSave(t),false);}assert.throws(()=>decode(JSON.stringify({...m,version:13})),/FUTURE_VERSION/);
});
test('Heading-relative input keeps horizontal speed and pitch never changes movement or camera height',()=>{
 const s=explorer();for(const yaw of [0,Math.PI/2,-Math.PI/2,Math.PI])for(const pitch of [-MAX_PITCH,0,MAX_PITCH]){s.view.yaw=yaw;s.view.pitch=pitch;const d=movementDirection(s,0,-1);assert.ok(Math.abs(d.x+Math.sin(yaw))<1e-9);assert.ok(Math.abs(d.y+Math.cos(yaw))<1e-9);assert.ok(Math.abs(Math.hypot(...Object.values(movementDirection(s,1,1)))-1)<1e-9);}
 s.view.yaw=0;for(const pitch of [-MAX_PITCH,MAX_PITCH]){s.view.pitch=pitch;Object.assign(s.player,{x:12,y:14});const before=s.player.y;step(s,.1,{y:-1});assert.ok(Math.abs(before-s.player.y-speed(s,s.player,0)*.1)<1e-9);}
 turnView(s.view,1e6,-1e6);assert.ok(Math.abs(s.view.yaw)<=Math.PI);assert.equal(s.view.pitch,MAX_PITCH);
});
test('All eleven floors retain reachable stations and first-person collision boundaries',()=>{
 const s=explorer();for(let floor=0;floor<11;floor++){s.floor=floor;s.floors[floor].unlocked=true;for(const st of LAYOUTS[floor]){assert.ok(walkable(floor,st.pad.x,st.pad.y,.23),`${floor} ${st.id}`);assert.ok(findPath(floor,nearestWalkable(floor,{x:6.5,y:5.5}),st.pad).length,`${floor} ${st.id} route`);}Object.assign(s.player,nearestWalkable(floor,{x:12,y:14}));for(let i=0;i<150;i++){s.view.yaw=i*.3;step(s,.05,{y:-1,pausedPlayer:true});assert.ok(walkable(floor,s.player.x,s.player.y),`${floor} position`);}}
});
test('Lounge movement respects purchased furniture, boundaries and recovery without changing business position',()=>{
 const s=explorer(),original=structuredClone(s.player);s.basement.unlocked=true;s.basement.computer.owned=true;s.basement.security.owned=true;for(const key of Object.keys(s.basement.furniture))s.basement.furniture[key]=true;
 s.view.lounge={x:6,y:6.6};recoverLounge(s);assert.ok(loungeWalkable(s,s.view.lounge.x,s.view.lounge.y));for(let i=0;i<400;i++){s.view.yaw=i*.12;moveLounge(s,0,-1,.1,8);assert.ok(loungeWalkable(s,s.view.lounge.x,s.view.lounge.y));}assert.deepEqual(s.player,original);
});
test('Compact viewmodel stays outside center with 0, 3 and 13 goods and never modifies inventory',()=>{
 const s=explorer(),view=new FirstPersonView();for(const count of [0,3,13]){s.player.bag=Array.from({length:count},(_,i)=>['controller','drink','tower'][i%3]);const before=structuredClone(s.player.bag);view.update(s,s.player,390,650);assert.deepEqual(s.player.bag,before);assert.equal(view.count,count);assert.equal(view.goods.children.length,Math.min(count,3));for(const root of [view.hands,view.goods]){root.updateMatrixWorld(true);for(const m of root.children){const b=new T.Box3().setFromObject(m);assert.ok(b.max.y<-.3,'lower corners');assert.ok(b.min.x>.4||b.max.x<-.4,'center clear');}}assert.equal(view.camera.position.y,1.615);assert.equal(view.camera.rotation.z,0);}
 s.settings.reducedMotion=true;s.player.action='prep';view.update(s,s.player,900,500);assert.equal(view.hands.position.y,0);
});
test('First-person pet rest points prefer outside the forward sight line on every floor',()=>{for(let f=0;f<11;f++)for(const yaw of [0,1.5,-1.5,3]){const player=nearestWalkable(f,{x:12,y:14}),p=safePetPoint(f,player,[],.38,yaw);assert.ok(walkable(f,p.x,p.y,.4));assert.ok(!petInView(p,player,yaw));}});
test('Story movement uses the same heading with unchanged fixed speed and safe outdoor bounds',()=>{const s=explorer();s.basement.unlocked=true;s.basement.computer.owned=true;s.basement.computer.email=true;startStory(s);s.story.location='outside';s.story.paused=false;s.view.yaw=0;Object.assign(s.story.actor,{x:15,y:18});const y=s.story.actor.y;storyTick(s,.1,{y:-1});assert.ok(Math.abs(y-s.story.actor.y-.42)<1e-8);assert.ok(storyWalkable('outside',s.story.actor.x,s.story.actor.y));});
