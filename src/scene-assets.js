import * as T from 'three';
import {DECOR} from './config.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FLOORS, LAYOUTS, WORLD, stationOpen } from './config.js';

// Shared, original procedural assets. No model, font or texture downloads.
const geometries = {
  box: new RoundedBoxGeometry(1, 1, 1, 2, .08),
  block: new T.BoxGeometry(1,1,1),
  sphere: new T.SphereGeometry(.5, 12, 8),
  cylinder: new T.CylinderGeometry(.5, .5, 1, 16),
  cone: new T.ConeGeometry(.5, 1, 10),
  ring: new T.TorusGeometry(.45, .028, 6, 32),
};
const materials = new Map(), signs = new Map();
const signGeometry=new T.PlaneGeometry(1,1);
export function material(color, metal = false, glow = false) {
  const key = `${color}/${metal}/${glow}`;
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness: metal ? .35 : .78, metalness: metal ? .3 : 0, emissive: glow ? color : '#000000', emissiveIntensity: glow ? .5 : 0 }));
  return materials.get(key);
}
export function shape(parent, kind, color, x, y, z, sx=1, sy=1, sz=1, metal=false, glow=false) {
  const mesh = new T.Mesh(geometries[kind], material(color, metal, glow));
  mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); mesh.castShadow=true; mesh.receiveShadow=true; parent.add(mesh); return mesh;
}
export const box = (p,c,x,y,z,w,h,d,metal=false,glow=false) => shape(p,'box',c,x,y,z,w,h,d,metal,glow);
export const ball = (p,c,x,y,z,w,h=w,d=w) => shape(p,'sphere',c,x,y,z,w,h,d);
export const cylinder = (p,c,x,y,z,w,h,d=w,metal=false) => shape(p,'cylinder',c,x,y,z,w,h,d,metal);
export function ring(p,c,x,y,z,scale=1) { const m=shape(p,'ring',c,x,y,z,scale,scale,scale);m.rotation.x=-Math.PI/2;m.castShadow=false;return m; }
export function group(parent,x=0,y=0,z=0) {const g=new T.Group();g.position.set(x,y,z);parent?.add(g);return g;}

export function lettering(parent,text,x,y,z,width=2,color='#fff4d9',bg='#31544f') {
  const key=`${text}/${color}/${bg}`;
  if(!signs.has(key)) {
    const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');
    ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 60px Trebuchet MS, sans-serif';ctx.fillText(text,256,67,470);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;signs.set(key,new T.MeshBasicMaterial({map,toneMapped:false}));
  }
  const mesh=new T.Mesh(signGeometry,signs.get(key));mesh.scale.set(width,width/4,1);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}

// Merge immutable room surfaces once. Dynamic rigs and inventory stay separate.
export function mergeStatic(source) {
  source.updateMatrixWorld(true);const buckets=new Map();
  source.traverse(o=>{if(o.isMesh){const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,parts:[]});const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);buckets.get(key).parts.push(geo);}});
  const result=new T.Group();result.userData.owned=[];
  for(const {material:mat,parts} of buckets.values()) {const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;result.add(mesh);result.userData.owned.push(geo);}
  return result;
}

export function food(kind) {
  const g=new T.Group();
  if(['controller','raw','keychain','snack2','snack3'].includes(kind)) {
    const c=kind==='raw'?'#f0d49a':'#eab04c';
    box(g,c,0,.09,0,.64,.18,.3);const l=box(g,c,-.23,.065,.14,.22,.18,.32);l.rotation.y=-.3;const r=box(g,c,.23,.065,.14,.22,.18,.32);r.rotation.y=.3;
    box(g,'#8b552d',-.17,.195,0,.04,.018,.13);box(g,'#8b552d',-.17,.195,0,.13,.018,.04);
    cylinder(g,'#bd7432',.16,.195,-.03,.06,.02);cylinder(g,'#bd7432',.24,.195,.035,.06,.02);
    if(kind==='keychain'){g.scale.setScalar(.58);ring(g,'#e2bd65',0,.04,-.34,.4);}
  } else if(kind==='drink') {
    cylinder(g,'#f58b4c',0,.22,0,.25,.42);cylinder(g,'#fff7df',0,.44,0,.29,.04);box(g,'#fff5db',.035,.55,0,.035,.25,.035);box(g,'#fff3c8',0,.25,.128,.14,.14,.025);
  } else if(kind==='wine') {
    cylinder(g,'#d7e5df',0,.025,0,.23,.035);cylinder(g,'#dae7e0',0,.17,0,.035,.29);ball(g,'#e2eee6',0,.35,0,.25,.3,.25);cylinder(g,'#983c63',0,.43,0,.22,.035);
  } else if(kind==='tower') {
    box(g,'#71a344',0,.25,0,.28,.5,.29);cylinder(g,'#284a36',0,.507,0,.18,.01);ball(g,'#d3fa83',.09,.13,.151,.025);
  } else if(kind==='handheld') {
    box(g,'#293f50',0,.1,0,.55,.15,.3);box(g,'#73d8ce',0,.183,0,.33,.018,.2);box(g,'#ed7960',-.3,.1,0,.14,.17,.32);box(g,'#63a7d6',.3,.1,0,.14,.17,.32);ball(g,'#344b53',-.3,.193,.02,.035);
  } else if(kind==='quarter') {
    cylinder(g,'#f2c855',0,.04,0,.27,.06, .27,true);cylinder(g,'#ffe297',0,.076,0,.2,.012);box(g,'#b68d3c',0,.085,0,.025,.015,.12);
  } else {
    box(g,'#ffb67d',0,.23,0,.4,.46,.33);box(g,'#fff0ce',0,.25,.173,.27,.24,.02);lettering(g,'DFP',0,.25,.19,.25,'#925839','#fff0ce');ring(g,'#a8613e',0,.45,0,.33).rotation.x=0;
  }
  return g;
}

function plant(p,x,z,c='#c98964') {
  cylinder(p,c,x,.26,z,.5,.5);cylinder(p,'#71563c',x,.51,z,.42,.035);
  for(let i=0;i<5;i++){const a=i*2.4;const leaf=ball(p,i%2?'#5f9e76':'#7bbf87',x+Math.cos(a)*.14,.8+(i%2)*.12,z+Math.sin(a)*.14,.23,.62,.2);leaf.rotation.z=Math.cos(a)*.4;}
}
function legs(p,x,z,w,d,height,color='#3a5c55') {for(const dx of [-1,1])for(const dz of [-1,1])box(p,color,x+dx*(w/2-.16),height/2,z+dz*(d/2-.16),.13,height,.13);}
function counter(p,st,c,top='#fff1d4') {const x=st.x+st.w/2,z=st.y+st.d/2;box(p,'#47665d',x,.14,z,st.w-.12,.25,st.d-.12);box(p,c,x,.58,z,st.w,.82,st.d);box(p,top,x,1.025,z,st.w+.08,.14,st.d+.08);box(p,'#fff1d4',x,.52,z+st.d/2+.008,st.w-.28,.075,.025);}
function chair(p,x,z,angle=0,color='#658b74') {const g=group(p,x,0,z);g.rotation.y=angle;legs(g,0,0,.6,.6,.46,'#86644c');box(g,color,0,.49,0,.62,.14,.62);box(g,color,0,.87,-.25,.62,.64,.13);}
function plate(p,x,y,z) {cylinder(p,'#e1ded0',x,y,z,.57,.045);cylinder(p,'#fffbed',x,y+.028,z,.46,.02);}
function register(p,x,z,c='#315850') {box(p,c,x,1.11,z,.45,.18,.38);const m=box(p,c,x,1.34,z-.1,.43,.36,.09);m.rotation.x=-.18;const screen=box(p,'#a9e5ca',x,1.35,z-.041,.33,.22,.025,false,true);screen.rotation.x=-.18;}

export function room(state,floor) {
  const root=new T.Group(),dynamic=new T.Group(),base=new T.Group(),accent=FLOORS[floor].color;
  const palette=[['#f8edd7','#f1e3c5','#73a497'],['#eedec5','#e4cfac','#647e65'],['#ebedf0','#dfe6e9','#71a3be'],['#e2dced','#d4cce2','#61567f']][floor];
  const W=WORLD.width,D=WORLD.depth;
  box(base,'#96ac98',W/2,-.22,D/2,W+.35,.42,D+.35);
  for(let x=0;x<W;x++)for(let z=0;z<D;z++)shape(base,'block',x>=WORLD.diningStart?((x+z)%2?'#e7d5b3':'#f7e8c9'):palette[(x+z)%2],x+.5,.005,z+.5,.98,.04,.98);
  box(base,palette[2],W/2,.4,-.08,W+.3,.8,.18);box(base,palette[2],-.08,.4,D/2,.18,.8,D+.3);
  box(base,'#bad0b5',W/2,.84,-.08,W+.4,.085,.23);box(base,'#bad0b5',-.08,.84,D/2,.23,.085,D+.35);
  box(base,accent,WORLD.diningStart,.04,D/2,.12,.04,D);lettering(base,'THE DINING ROOM',21,1.25,.05,4,'#426451','#fff0d1');
  // Open entrance in the near wall: no tall walls between camera and jobs.
  box(base,palette[2],(WORLD.entrance.x-.8)/2,.14,D+.05,WORLD.entrance.x-.8,.28,.14);box(base,palette[2],W-.3,.14,D+.05,.6,.28,.14);
  box(base,'#4b6e60',WORLD.entrance.x,.055,D-.25,1.25,.05,.45);
  for(const x of [WORLD.entrance.x-.7,WORLD.entrance.x+.7])box(base,'#fff4db',x,.68,D+.08,.11,1.36,.11);
  box(base,accent,WORLD.entrance.x,1.39,D+.08,1.6,.2,.15);lettering(base,'WELCOME',WORLD.entrance.x,1.4,D+.17,1.37);
  // Wall menu and broad awnings are intentionally behind the workstations.
  box(base,'#fff2d7',5.8,1.6,-.05,3.4,.72,.16);lettering(base,floor===0?'DEEP FRIED PIXELS':FLOORS[floor].name.toUpperCase(),5.8,1.6,.05,3.2,'#355951','#fff2d7');
  for(const p of DECOR)plant(base,p.x,p.y);
  if(floor===0)for(const x of [2,6,10]) {for(let i=0;i<6;i++){const aw=box(base,i%2?'#fff1ce':'#f39461',x-.94+i*.38,1.78,.12,.39,.09,.78);aw.rotation.x=.13;} }
  if(floor===1){for(let x=1;x<12;x+=2)box(base,'#c8a771',x,.46,.026,.035,.6,.025);}
  const stations=new Map();
  for(const st of LAYOUTS[floor]) {
    const x=st.x+st.w/2,z=st.y+st.d/2,open=stationOpen(state,floor,st),c=open?accent:'#a6b4ae';
    const detail=group(dynamic),goods=group(detail);const pad=ring(detail,open?(st.id==='counter'?'#f08b47':'#78af95'):'#b8beb3',st.pad.x,.055,st.pad.y,st.id==='counter'?1.25:1);
    stations.set(st.id,{st,detail,goods,pad,open,inventoryKey:'',screens:[],steam:[]});
    const data=stations.get(st.id);
    if(st.auxiliary) {box(base,'#c07942',x,1.115,z,1.1,.04,.73);lettering(base,'STACK',x,1.14,st.y+st.d+.025,.8,'#fff4d8','#bc753d');continue;}
    if(st.kind==='trash') {box(base,'#52786c',x,.38,z,.62,.74,.62);box(base,'#b6c9b7',x,.79,z,.68,.12,.68);box(base,'#284e47',x,.853,z,.39,.02,.35);lettering(base,'BIN',x,.42,z+.321,.42);continue;}
    if(st.kind==='table') {
      if(!open){box(base,'#cbbf9f',x,.04,z,st.w+.8,.04,st.d+.5);box(base,'#eee4c8',x,.07,z,st.w+.68,.035,st.d+.38);box(base,'#c4b38d',x,.1,z,.5,.025,.09);box(base,'#c4b38d',x,.1,z,.09,.025,.5);continue;}
      legs(base,x,z,st.w,st.d,.87,'#88684e');box(base,'#ab805b',x,.91,z,st.w,.14,st.d);box(base,'#fff5df',x,1.0,z,st.w+.015,.07,st.d+.015);
      box(base,'#9bab80',x,1.043,z,.26,.015,st.d);chair(base,st.x-.6,z,Math.PI/2);chair(base,st.x+st.w+.52,z,-Math.PI/2);
      plate(base,x-.36,1.06,z);plate(base,x+.43,1.06,z);cylinder(base,'#d4a460',x,1.17,z-.44,.12,.28);ball(base,'#ffda8b',x,1.35,z-.44,.075,.14,.075);
      const glass=food('wine');glass.position.set(x+.42,1.08,z-.47);glass.scale.setScalar(.65);base.add(glass);continue;
    }
    if(['shelf','keyShelf'].includes(st.kind)) {
      box(base,c,x,.65,st.y+.12,st.w,1.3,.15);for(const y of [.22,.78,1.34])box(base,'#fff1d5',x,y,z,st.w+.06,.1,st.d);
      for(const dx of [-1,1])box(base,c,x+dx*(st.w/2-.04),.66,z,.13,1.4,st.d);
      lettering(base,st.id==='shelf'?'DFP GOODS':'TINY TREASURES',x,1.47,st.y+st.d+.013,st.w-.16,'#fff9e2',open?'#497e99':'#869a91');continue;
    }
    if(st.kind==='arcade') {
      const colors=['#8772be','#e09461','#56a6a9'],cab=open?colors[Number(st.id.at(-1))]:'#859395';
      box(base,cab,x,.56,z,1.35,1.1,1.25);box(base,cab,x,1.48,z-.27,1.35,1.05,.77);box(base,'#263f4a',x,1.48,z+.14,1.1,.73,.08);box(base,'#d8e698',x,1.0,z+.4,1.35,.13,.49);
      box(base,cab,x,2.07,z-.2,1.47,.22,.87);lettering(base,st.name,x,2.075,z+.25,1.28,'#ffffde',cab);
      for(const dx of [-.4,.4])box(base,open?'#bbedbc':'#98a49b',x+dx,1.45,z+.194,.035,.63,.026,false,open);
      cylinder(base,'#344757',x-.29,1.18,z+.38,.035,.24);ball(base,'#f27369',x-.29,1.32,z+.38,.13);
      for(const dx of [.12,.29])cylinder(base,dx===.12?'#f89872':'#7bd9c3',x+dx,1.085,z+.44,.095,.035);
      box(base,'#253c45',x,.48,z+.65,.3,.12,.03);
      if(open){box(detail,'#193c53',x,1.5,z+.197,.91,.56,.015,false,true);for(let i=0;i<6;i++){const pixel=box(detail,['#8feece','#ffdb71','#d3a4fb'][i%3],x-.33+(i%3)*.32,1.3+Math.floor(i/3)*.28,z+.21,.12,.12,.018,false,true);data.screens.push(pixel);}}continue;
    }
    if(st.kind==='vr') {
      box(base,'#726394',x,.07,z,st.w,.12,st.d);ring(base,open?'#b6f683':'#99a897',x,.145,z,1.65);
      for(const dx of [-1,1]){box(base,'#544b77',x+dx*1.08,1.03,z+.15,.22,2.03,.3);box(base,open?'#beed95':'#abb2a3',x+dx*1.08,1.03,z+.316,.07,1.84,.028,false,open);}
      box(base,'#544b77',x,2.05,z+.15,2.5,.24,.3);lettering(base,'PIXEL RUN · VR',x,2.08,z+.32,2.12,'#e2fdc6','#544b77');
      cylinder(base,'#3e3d60',x,.58,z,.45,1.0);box(base,'#d4dce8',x,1.18,z,.63,.3,.4);box(base,'#303851',x,1.18,z+.22,.5,.2,.08);continue;
    }
    counter(base,st,c);
    if(st.kind==='prep') {box(base,'#cd9b66',x,1.13,z,.95,.075,.66);const dough=food('raw');dough.position.set(x,1.17,z);base.add(dough);box(base,'#e9c591',x+.65,1.2,z,.13,.15,.5);}
    if(st.kind==='fryer') {
      box(base,'#8da49d',x,1.2,z,1.55,.24,.95,true);for(const dx of [-.4,.4]){box(base,'#626c48',x+dx,1.329,z,.59,.025,.61);box(base,'#e7bd57',x+dx,1.348,z,.48,.018,.5);box(base,'#465f58',x+dx,1.38,z+.5,.12,.08,.48);}
      for(let i=0;i<5;i++){const puff=ball(detail,'#fff6dc',x+(i%2?-.36:.36),1.55+i*.15,z,.12);puff.castShadow=false;data.steam.push(puff);}
    }
    if(st.kind==='pickup') {
      // Open warming tray: low rim and two rear lamps leave the food visible.
      box(base,'#b5c4bb',x,1.13,z,1.72,.075,.86,true);
      box(base,'#fff0d1',x,1.178,z,1.54,.026,.69);
      for(const dx of [-.84,.84])box(base,'#7e9a90',x+dx,1.19,z,.045,.13,.86,true);
      box(base,'#7e9a90',x,1.19,z-.42,1.72,.13,.045,true);
      for(const dx of [-.43,.43]) {
        cylinder(base,'#52786e',x+dx,1.45,z-.44,.07,.68,.07,true);
        box(base,'#52786e',x+dx,1.79,z-.23,.07,.07,.48,true);
        ball(base,'#52786e',x+dx,1.70,z-.03,.34,.17,.32);
        cylinder(base,'#ffe9ac',x+dx,1.62,z-.03,.30,.026,.30);
      }
    }
    if(st.kind==='drinks'||st.kind==='wine') {box(base,st.kind==='wine'?'#7b5964':'#f5c76c',x,1.43,z,.8,.75,.8);box(base,'#fff3d6',x,1.56,z+.41,.64,.24,.035);for(const dx of [-.22,.22]){box(base,'#386b62',x+dx,1.31,z+.49,.085,.15,.14);cylinder(base,'#c9d9cd',x+dx,1.09,z+.5,.2,.04);}if(st.kind==='wine')for(const dx of [-.45,0,.45])cylinder(base,'#536e4b',x+dx,1.5,z-.2,.15,.7);}
    if(st.kind==='tower'||st.kind==='handheld') {plate(base,x,1.11,z);const meal=food(st.kind);meal.position.set(x,1.15,z);base.add(meal);box(base,'#566e5b',x+.7,1.31,z-.3,.25,.44,.22);}
    if(st.kind==='snack'){box(base,'#b98044',x,1.12,z,1,.07,.7);const snack=food(st.id);snack.position.set(x,1.17,z);base.add(snack);lettering(base,'CRUNCH',x,1.56,z-.38,1.12,'#fff2ce',c);}
    if(['counter','checkout','host'].includes(st.kind))register(base,st.kind==='counter'?x+1.55:x,z);
    if(st.kind==='counter') {lettering(base,'DFP',x, .6,z+st.d/2+.04,1.15,'#fff3d7','#f47b45');box(base,'#b8d5bf',x,1.11,z,1.1,.035,.7);}
    if(['stock','keyStock'].includes(st.kind)){for(let i=0;i<3;i++){const item=food(st.kind==='stock'?'souvenir':'keychain');item.position.set(x-.7+i*.7,1.12,z);base.add(item);}lettering(base,'DFP / STOCK',x,.63,z+st.d/2+.03,1.35,'#fff6df','#6295b0');}
  }
  const merged=mergeStatic(base);root.add(merged,dynamic);root.userData={stations,merged};return root;
}

const SKINS=['#e5ad7c','#bc7f58','#f0c6a0','#81593f','#d79b72','#b98967'];
const shadowData=new Uint8Array(32*32*4);
for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,d=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);shadowData.set([40,65,51,Math.round(Math.max(0,1-d)**1.5*75)],i);}
const shadowTexture=new T.DataTexture(shadowData,32,32);shadowTexture.needsUpdate=true;shadowTexture.magFilter=T.LinearFilter;shadowTexture.minFilter=T.LinearFilter;
const shadowGeometry=new T.PlaneGeometry(.94,.94);
export function character(outfit,variation=0,role='player') {
  const root=new T.Group(),rig=group(root),skin=SKINS[variation%SKINS.length];
  const hips=group(rig,0,.54,0),torso=group(hips,0,.24,0);
  box(torso,outfit.color,0,.07,0,.48,.56,.34);
  if(role!=='customer') {box(torso,'#fff0d3',0,-.005,.183,.3,.36,.03);box(torso,outfit.id==='neon'?'#bafd72':outfit.color,0,.025,.206,.21,.055,.018);}
  if(outfit.id==='formal'){box(torso,'#fcf3dd',0,.2,.185,.11,.2,.03);box(torso,'#dca962',0,.19,.21,.045,.17,.02);}
  const head=group(torso,0,.58,0);ball(head,skin,0,0,0,.58,.59,.53);ball(head,skin,-.29,-.025,0,.1,.13,.1);ball(head,skin,.29,-.025,0,.1,.13,.1);
  for(const x of [-.103,.103])ball(head,'#2b3d3c',x,.015,.253,.048,.063,.026);
  ball(head,skin,0,-.045,.284,.085,.07,.08);box(head,'#995e47',0,-.128,.247,.09,.022,.018);
  ball(head,['#503c33','#443534','#76523c'][variation%3],0,.18,-.04,.57,.27,.51);
  if(outfit.hat) {
    if(outfit.id==='chef') {cylinder(head,'#fff9eb',0,.3,0,.48,.17);for(const x of [-.15,0,.15])ball(head,'#fffdf3',x,.43,0,.32,.29,.34);}
    else {ball(head,outfit.hat,0,.23,0,.61,.26,.56);box(head,outfit.hat,0,.22,.27,.5,.055,.32);box(head,'#fff3d6',0,.292,.247,.13,.075,.02);}
  } else if(variation%2)ball(head,'#503c33',0,.3,-.12,.26,.25,.28);
  const arms=[];for(const side of [-1,1]){const arm=group(torso,side*.3,.23,0);box(arm,outfit.color,0,-.08,0,.18,.24,.21);ball(arm,skin,0,-.28,.016,.18,.27,.19);arms.push(arm);}
  const legs=[],knees=[];for(const side of [-1,1]){const leg=group(hips,side*.135,0,0);box(leg,outfit.pants,0,-.12,0,.19,.24,.22);const knee=group(leg,0,-.24,0);box(knee,outfit.pants,0,-.1,0,.18,.2,.22);box(knee,'#344a49',0,-.235,.045,.22,.13,.32);legs.push(leg);knees.push(knee);}
  const carry=group(torso,0,-.12,.54);const tray=box(carry,'#f8e6ba',0,-.035,0,.76,.055,.57);tray.visible=false;
  // A stable contact shadow remains available even in reduced effects.
  const contact=new T.Mesh(shadowGeometry,new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.037;root.add(contact);
  if(role==='player')ring(root,'#f3934d',0,.052,0,.84);
  return {root,rig,hips,torso,head,arms,legs,knees,carry,tray,contact,bagKey:'',bagModels:[],angle:0,phase:0,walk:0,work:0,sit:0,react:0,pose:0,role,previous:null};
}

export function disposeRoom(root) {root?.userData.merged?.userData.owned.forEach(g=>g.dispose());}
