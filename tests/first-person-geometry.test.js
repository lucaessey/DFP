import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {newGame,command} from '../src/simulation.js';
import {PRODUCTS,LAYOUTS} from '../src/config.js';
import {room,disposeRoom} from '../src/scene-assets.js';
import {walkable} from '../src/navigation.js';
import {EYE_HEIGHT} from '../src/first-person.js';

test('Actual floor geometry clears the eye-level near plane at every workstation and wall approach',()=>{
 // Text is irrelevant to this geometry audit; no browser/WebGL or network assets needed.
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
 const s=newGame();s.money=1e9;for(let f=1;f<11;f++)command(s,{type:'floor',floor:f});for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});
 const ray=new T.Raycaster(),directions=Array.from({length:16},(_,i)=>new T.Vector3(Math.sin(i*Math.PI/8),0,Math.cos(i*Math.PI/8))),failures=[];
 for(let f=0;f<11;f++){
  for(let i=0;i<6;i++)command(s,{type:'table',floor:f,id:i});const world=room(s,f);world.updateMatrixWorld(true);
  const points=[...LAYOUTS[f].map(st=>({...st.pad,name:st.id})),...[[.36,10],[27.64,10],[12,.36],[12,17.64]].filter(([x,y])=>walkable(f,x,y)).map(([x,y])=>({x,y,name:'wall'}))];
  for(const p of points)for(const direction of directions){ray.set(new T.Vector3(p.x,EYE_HEIGHT,p.y),direction);ray.near=0;ray.far=.08;const hits=ray.intersectObject(world,true).filter(h=>h.object.visible);if(hits.length)failures.push(`${f+1}/${p.name}: ${hits[0].distance.toFixed(3)}m`);}
  disposeRoom(world);
 }
 delete globalThis.document;assert.deepEqual(failures,[],'camera near plane must stay clear of furniture and walls');
});
