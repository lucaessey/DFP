import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step} from '../src/simulation.js';
import {encode,decode} from '../src/storage.js';
import {OUTFITS,tableSeat} from '../src/config.js';
import {character} from '../src/scene-assets.js';
import {animateCharacter,crowdTargets,separateCrowd,visualWalkable,angleTowards} from '../src/animation.js';

test('saves retain progress and gain optional reduced-effects preferences safely',()=>{
  const state=newGame();state.money=900;command(state,{type:'product',id:'controller'});command(state,{type:'hire',id:0});delete state.settings.reducedEffects;
  const loaded=decode(encode(state));assert.equal(loaded.settings.reducedEffects,false);assert.deepEqual({...loaded,settings:state.settings},state);
  loaded.settings.reducedEffects=true;assert.equal(decode(encode(loaded)).settings.reducedEffects,true);
  loaded.settings.reducedEffects='yes';assert.throws(()=>encode(loaded));
});

test('animation, floor interruption and outfit recreation never mutate game transactions',()=>{
  const state=newGame();state.money=1000;command(state,{type:'product',id:'controller'});command(state,{type:'hire',id:0});
  let model=character(OUTFITS[0]);
  for(let i=0;i<500;i++){
    step(state,.05,{x:i<30?1:0,y:0});const before=structuredClone(state);
    if(i%100===0)model=character(OUTFITS[(i/100)%5]);
    animateCharacter(model,state.player,{x:state.player.x,y:state.player.y},state,1/60,state.time);
    assert.deepEqual(state,before);
  }
});

test('crowded workstations use distinct walkable visual slots without relocating saved actors',()=>{
  for(let floor=0;floor<4;floor++){
    const entries=Array.from({length:13},(_,order)=>({order,actor:{x:6,y:6,bag:[]},rig:character(OUTFITS[0])}));
    const before=entries.map(e=>({...e.actor}));crowdTargets(entries,floor);
    for(const e of entries){assert.ok(visualWalkable(floor,e.target.x,e.target.y,e.actor));e.rig.root.position.set(e.target.x,0,e.target.y);}
    separateCrowd(entries,floor);
    for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++)assert.ok(Math.hypot(entries[i].target.x-entries[j].target.x,entries[i].target.y-entries[j].target.y)>.60);
    assert.deepEqual(entries.map(e=>e.actor),before);
  }
});

test('reduced motion removes idle and carry bounce but retains grounded action poses',()=>{
  const state=newGame();state.settings.reducedMotion=true;state.player.bag=['controller'];const m=character(OUTFITS[0]);
  animateCharacter(m,state.player,{x:6,y:4.6},state,.016,5);const y=m.carry.position.y;
  animateCharacter(m,state.player,{x:6,y:4.6},state,.016,20);assert.equal(m.carry.position.y,y);assert.equal(m.head.rotation.z,0);assert.equal(m.bagModels.length,1);
  assert.ok(Math.abs(angleTowards(Math.PI-.05,-Math.PI+.05,.1)-Math.PI)<.06);
});

test('walking faces the travel direction between simulation ticks on every floor',()=>{
  for(let floor=0;floor<4;floor++)for(const [dx,dy] of [[.1,0],[-.1,0],[0,.1],[0,-.1]]){
    const state=newGame();state.floor=floor;
    const actor={x:6,y:10,moving:true,state:'waiting',purpose:'food',bag:[],needs:[],delivered:[]};
    const model=character(OUTFITS[0],0,'customer');
    animateCharacter(model,actor,actor,state,1/60,0);
    for(let frame=0;frame<90;frame++){
      actor.moving=frame%9>=3; // Include the brief pause when a path waypoint is removed.
      if(actor.moving&&frame%3===0){actor.x+=dx;actor.y+=dy;}
      animateCharacter(model,actor,actor,state,1/60,frame/60);
    }
    const direction=Math.atan2(dx,dy);
    assert.ok(Math.cos(model.angle-direction)>.999,`floor ${floor}, direction ${direction}: ${model.angle}`);
  }
});

test('a stopped player stays anchored while nearby people separate',()=>{
  const state=newGame(),actor=state.player;actor.x=6;actor.y=6;
  const player=character(OUTFITS[0]);animateCharacter(player,actor,actor,state,.05,0);
  actor.x+=.2;actor.moving=true;animateCharacter(player,actor,actor,state,.05,.05);
  actor.moving=false;animateCharacter(player,actor,actor,state,.016,.066);
  assert.equal(player.root.position.x,actor.x);assert.equal(player.walk,0);
  const guest=character(OUTFITS[0],1,'customer');guest.root.position.copy(player.root.position);
  separateCrowd([{role:'player',actor,rig:player},{role:'customer',actor:{x:actor.x,y:actor.y},rig:guest}],0);
  assert.equal(player.root.position.x,actor.x);assert.equal(player.root.position.z,actor.y);
  assert.ok(guest.root.position.distanceTo(player.root.position)>.55);
});

test('expanded dining seats stay anchored on their own chairs despite chair collision footprints',()=>{
  for(let floor=0;floor<4;floor++){
    const state=newGame();state.floor=floor;const actor={...tableSeat(0),purpose:'food',state:'dining',table:0,needs:['controller'],delivered:[true],bag:[],moving:false};
    const rig=character(OUTFITS[0],0,'customer'),entries=[{order:0,role:'customer',actor,rig}];crowdTargets(entries,floor);
    assert.deepEqual(entries[0].target,tableSeat(0));animateCharacter(rig,actor,entries[0].target,state,.1,0);assert.equal(rig.root.position.x,actor.x);assert.equal(rig.root.position.z,actor.y);
  }
});
