import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {character,STICKMAN} from '../src/scene-assets.js';
import {animateCharacter} from '../src/animation.js';
import {itemDelta} from '../src/character-motion.js';
import {newGame} from '../src/simulation.js';
import {OUTFITS,LAYOUTS,tableSeat} from '../src/config.js';
import {COLLISIONS} from '../src/navigation.js';

test('customers visibly keep each delivered unit while waiting, then release it onto their table',()=>{
 const s=newGame(),a={...s.player,purpose:'food',state:'waiting',table:null,needs:['controller','drink'],delivered:[false,false]},m=character(OUTFITS[0],0,'customer');
 animateCharacter(m,a,a,s,.05,0);a.delivered[0]=true;let result=animateCharacter(m,a,a,s,.05,.05);assert.deepEqual(result.delivered,['controller']);assert.equal(m.bagKey,'controller');
 a.delivered[1]=true;a.state='payment';animateCharacter(m,a,a,s,.05,.1);assert.equal(m.bagKey,'controller,drink');
 a.state='toTable';a.table=0;animateCharacter(m,a,a,s,.05,.15);a.state='dining';Object.assign(a,tableSeat(0));result=animateCharacter(m,a,a,s,.05,.2);assert.deepEqual(result.removed,['controller','drink']);assert.equal(m.bagModels.length,0);assert.deepEqual(a.delivered,[true,true]);
});

test('every outfit uses the same stickman joints and shared rounded geometry',()=>{
  const geometryIds=new Set();
  for(const outfit of OUTFITS){const m=character(outfit);assert.equal(m.root.userData.style,'stickman');for(const key of ['arms','elbows','hands','legs','knees','feet'])assert.equal(m[key].length,2);
    m.root.traverse(o=>{if(o.isMesh)geometryIds.add(o.geometry.uuid);});
    assert.ok(m.head.children.some(o=>o.isMesh&&o.scale.x>=.65));
  }
  assert.ok(geometryIds.size<=8,'Outfits must reuse primitive geometries');
});

test('all roles and outfits share a featureless charcoal base with thick connected limbs',()=>{
  for(const outfit of [...OUTFITS,{id:'staff',color:'#72a599',hat:'#fff5df'},{id:'guest',color:'#dc8ca3'}]){
    const m=character(outfit,0,outfit.id==='staff'?'staff':outfit.id==='guest'?'customer':'player'),head=m.root.getObjectByName('featureless-head');
    assert.equal(head.material.color.getHexString(),'15191f');assert.equal(head.material.roughness,.46);assert.ok(head.scale.y>head.scale.x);
    assert.equal(m.head.children.filter(n=>n.isMesh&&n.name!=='featureless-head'&&n.material===head.material).length,0,'No facial features');
    for(const name of ['upper-arm','forearm','elbow','thigh','shin','knee','mitten','rounded-foot']){
      const part=m.root.getObjectByName(name);assert.ok(part);assert.equal(part.material,head.material);assert.ok(part.scale.x>=.18);
    }
  }
  const uniform=character(OUTFITS[0]);assert.ok(uniform.root.getObjectByName('cap-crown'));assert.ok(uniform.root.getObjectByName('cap-brim'));assert.ok(uniform.root.getObjectByName('collar'));
});

test('every outfit supports carrying, sitting, working and celebration without invalid joint transforms',()=>{
  for(const outfit of OUTFITS)for(const pose of ['idle','walk','carry','fry','drink','shelf','machine0','table0','sit','celebrate']){
    const state=newGame();state.floor=pose==='shelf'?2:pose==='machine0'?3:0;const a=state.player,m=character(outfit);Object.assign(a,{x:18,y:6});
    if(pose==='carry')a.bag=['controller','drink','controller'];
    if(pose==='sit')Object.assign(a,{...tableSeat(0),purpose:'food',state:'dining',table:0,needs:['controller'],delivered:[true]});
    const station=LAYOUTS[state.floor].find(s=>s.id===pose);if(station)Object.assign(a,{...station.pad,action:pose,progress:.5});
    for(let frame=0;frame<90;frame++){if(pose==='walk'){a.x+=.025;a.moving=true;}if(pose==='celebrate'&&frame===75)m.celebrate=1;animateCharacter(m,a,a,state,1/60,frame/60);}
    m.root.updateMatrixWorld(true);m.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite),`${outfit.id}/${pose}`));
    if(pose==='carry'){assert.equal(m.bagModels.length,3);const headBox=new T.Box3().setFromObject(m.root.getObjectByName('featureless-head'));for(const mesh of m.bagModels)assert.ok(!headBox.intersectsBox(new T.Box3().setFromObject(mesh)),`${outfit.id}: goods intersect head`);}
    if(pose==='sit')assert.ok(m.sit>.99);
    if(pose==='celebrate')assert.equal(m.motion,'celebrate');
  }
});

test('walking and sitting keep shoes above the floor; gait advances only with movement',()=>{
  const state=newGame(),m=character(OUTFITS[0]),a=state.player,p=new T.Vector3();Object.assign(a,{x:18,y:6});
  for(let i=0;i<240;i++){
    a.moving=i<120;if(a.moving)a.x+=.035;
    animateCharacter(m,a,a,state,1/60,i/60);m.root.updateMatrixWorld(true);
    for(const foot of m.feet){foot.getWorldPosition(p);assert.ok(p.y-.06>=.017,`Shoe through floor: ${p.y}`);}
  }
  const phase=m.travelPhase;animateCharacter(m,a,a,state,.1,20);assert.equal(m.travelPhase,phase);assert.equal(m.walk,0);
  const guest={...tableSeat(0),purpose:'food',state:'dining',table:0,needs:['tower'],delivered:[true],bag:[],moving:false};const diner=character(OUTFITS[0],1,'customer');
  for(let i=0;i<100;i++)animateCharacter(diner,guest,guest,state,1/60,i/60);
  diner.root.updateMatrixWorld(true);assert.ok(diner.sit>.99);for(const foot of diner.feet){foot.getWorldPosition(p);assert.ok(p.y>=.075&&p.y<.12,'Seated shoes must stay on the floor');}
  assert.ok(Math.abs(diner.hips.position.y-(STICKMAN.hipHeight-.125))<.02);
});

test('inventory visual deltas preserve repeats and resolve immediately when interrupted',()=>{
  assert.deepEqual(itemDelta(['controller','controller'],['controller','drink']),{added:['drink'],removed:['controller']});
  const state=newGame(),a=state.player,m=character(OUTFITS[0]);Object.assign(a,{...LAYOUTS[0].find(s=>s.id==='pickup').pad,action:'pickup'});
  animateCharacter(m,a,a,state,.05,0);a.bag.push('controller');const before=structuredClone(state),result=animateCharacter(m,a,a,state,.05,.05);
  assert.deepEqual(result.added,['controller']);assert.ok(m.reveal>0);const token=m.transferToken;a.moving=true;a.action='';animateCharacter(m,a,a,state,.05,.1);
  assert.ok(m.transferToken>token);assert.ok(m.bagModels.every(mesh=>mesh.visible));assert.deepEqual(state.player.bag,before.player.bag);assert.equal(state.money,before.money);
  state.settings.reducedMotion=true;m.celebrate=1;animateCharacter(m,a,a,state,.05,100);assert.equal(m.celebrate,0);assert.equal(m.head.rotation.z,0);assert.equal(m.carry.rotation.x,0);
});

test('all work pads keep hands and carried goods outside solid furniture',()=>{
  const point=new T.Vector3();
  for(let f=0;f<4;f++)for(const st of LAYOUTS[f].filter(s=>s.kind!=='table')){
    const state=newGame();state.floor=f;state.settings.reducedMotion=true;const a=state.player;Object.assign(a,{...st.pad,action:st.id,progress:.5,bag:['controller','drink']});const m=character(OUTFITS[0]);
    for(let i=0;i<60;i++)animateCharacter(m,a,a,state,1/60,i/60);m.root.updateMatrixWorld(true);
    for(const hand of m.hands){hand.getWorldPosition(point);assert.ok(!COLLISIONS[f].some(o=>point.x>o.x&&point.x<o.x+o.w&&point.z>o.y&&point.z<o.y+o.d),`${f}/${st.id}: hand in furniture`);}
    const bounds=new T.Box3().setFromObject(m.carry);
    for(const o of COLLISIONS[f])assert.ok(bounds.max.x<=o.x||bounds.min.x>=o.x+o.w||bounds.max.z<=o.y||bounds.min.z>=o.y+o.d,`${f}/${st.id}: carried food in furniture`);
  }
});

test('frying, pouring, stocking, collecting and cleaning have distinct blended targets',()=>{
  const poses=[];
  for(const [f,id] of [[0,'fry'],[0,'drink'],[2,'shelf'],[3,'machine0'],[1,'table0']]){
    const state=newGame();state.floor=f;state.settings.reducedMotion=true;const a=state.player;Object.assign(a,{...LAYOUTS[f].find(s=>s.id===id).pad,action:id,progress:.5});const m=character(OUTFITS[0]);
    const before=structuredClone(state);for(let i=0;i<60;i++)animateCharacter(m,a,a,state,1/60,i/60);assert.deepEqual(state,before);poses.push(JSON.stringify(m.handTargets.map(p=>p.toArray())));
  }
  assert.equal(new Set(poses).size,5);
});
