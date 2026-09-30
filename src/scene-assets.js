import {expansionFood,expansionRoom,expansionStation} from './expansion-visuals.js';
import {EXPANSION} from './expansion-config.js';
import * as T from 'three';
import {isDrink,serviceQueue,drinkQueue} from './config.js';
import {DECOR} from './config.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FLOORS, LAYOUTS, WORLD, stationOpen } from './config.js';

// Shared, original procedural assets. No model, font or texture downloads.
const geometries = {
  box: new RoundedBoxGeometry(1, 1, 1, 2, .08),
  block: new T.BoxGeometry(1,1,1),
  sphere: new T.SphereGeometry(.5, 12, 8),
  head: new T.SphereGeometry(.5, 24, 16),
  cap: new T.SphereGeometry(.5, 16, 8, 0, Math.PI*2, 0, Math.PI/2),
  capsule: new T.CapsuleGeometry(.5, 1, 4, 12),
  cylinder: new T.CylinderGeometry(.5, .5, 1, 16),
  cup: new T.CylinderGeometry(.5,.4,1,12,1,true),
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
export const capsule = (p,c,x,y,z,w,h,d=w) => shape(p,'capsule',c,x,y,z,w,h/2,d);
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
  const expanded=expansionFood(kind);if(expanded)return expanded;
  const g=new T.Group();
  if(kind==='cash'){
    box(g,'#39c949',0,.075,0,.55,.15,.32);box(g,'#9af14d',0,.157,0,.55,.025,.32);
    box(g,'#fff0a5',0,.175,0,.12,.025,.33);for(const x of [-.17,.17])cylinder(g,'#249744',x,.176,0,.08,.012);
  }else if(['controller','raw','keychain','snack2','snack3'].includes(kind)) {
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
function legs(p,x,z,w,d,height,color='#665086') {for(const dx of [-1,1])for(const dz of [-1,1])box(p,color,x+dx*(w/2-.16),height/2,z+dz*(d/2-.16),.20,height,.20);}
function counter(p,st,c,top='#ffe7b9') {const x=st.x+st.w/2,z=st.y+st.d/2;box(p,'#594376',x,.14,z,st.w-.12,.25,st.d-.12);box(p,c,x,.58,z,st.w,.82,st.d);box(p,top,x,1.015,z,st.w+.08,.17,st.d+.08);box(p,'#ffb937',x,.79,z+st.d/2+.016,st.w-.12,.14,.05);}
function chair(p,x,z,angle=0,color='#9e78ca') {const g=group(p,x,0,z);g.rotation.y=angle;legs(g,0,0,.6,.6,.46,'#694f8d');box(g,color,0,.49,0,.62,.14,.62);box(g,color,0,.87,-.25,.62,.64,.17);}
function plate(p,x,y,z) {cylinder(p,'#e1ded0',x,y,z,.57,.045);cylinder(p,'#fffbed',x,y+.028,z,.46,.02);}
function register(p,x,z,c='#644783') {const g=group(p,x,0,z);box(g,c,0,1.12,0,.50,.20,.43);const m=box(g,c,0,1.35,-.1,.46,.37,.11);m.rotation.x=-.18;const screen=box(g,'#8feb9b',0,1.36,-.031,.34,.23,.026,false,true);screen.rotation.x=-.18;return g;}

export const WORLD_PALETTES=[
  {floor:'#ffe0bd',tile:'#ffdfbd',alternate:'#ffe6c9',wall:'#d89682',accent:'#8757c1',trim:'#ffb629'},
  {floor:'#ffd3af',tile:'#ffe4c7',alternate:'#ffe9d4',wall:'#bc879e',accent:'#9a63b2',trim:'#f5b63e'},
  {floor:'#ffddbd',tile:'#ffe8d0',alternate:'#ffdfc1',wall:'#b395c6',accent:'#8a67bd',trim:'#ffb839'},
  {floor:'#e9c8d8',tile:'#ffdfc3',alternate:'#f8d9d1',wall:'#8d74b6',accent:'#7752b1',trim:'#ffd049'},
];

WORLD_PALETTES.push(...EXPANSION.map(f=>({floor:f.pale,tile:'#fff0db',alternate:f.pale,wall:f.color,accent:f.color,trim:'#ffd271'})));
export function room(state,floor) {
  const root=new T.Group(),dynamic=new T.Group(),base=new T.Group(),palette=WORLD_PALETTES[floor],accent=palette.accent;
  const W=WORLD.width,D=WORLD.depth;
  box(base,palette.floor,W/2,-.22,D/2,W+.35,.42,D+.35);
  for(let x=0;x<W;x+=2)for(let z=0;z<D;z+=2)shape(base,'block',x>=WORLD.diningStart?'#ffcf96':(x+z)%4?palette.tile:palette.alternate,x+1,.005,z+1,1.992,.04,1.992);
  if(floor<2){
    const unlocked=state.floors[floor].section,color=unlocked?'#c7adeb':'#e8d6ab';
    box(base,unlocked?'#e3cff5':'#eee3ca',11.8,.04,4.7,4.7,.018,8.6);
    for(let z=.5;z<9;z+=.6)for(const x of [9.45,14.15])box(base,color,x,.06,z,.10,.02,.35);
    for(let x=9.5;x<14.2;x+=.6)for(const z of [.5,9])box(base,color,x,.06,z,.35,.02,.10);
    lettering(base,unlocked?'DRINKS':'DRINKS · LOCKED',11.8,1.6,.08,2.5,'#67488d','#eadcf6');
    for(let i=0;i<6;i++){const a=serviceQueue(i,floor),b=drinkQueue(i);ring(base,'#e9bf88',a.x,.055,a.y,.38);if(unlocked)ring(base,'#c8a1df',b.x,.055,b.y,.38);}
  }
  box(base,palette.wall,W/2,.4,-.08,W+.3,.8,.22);box(base,palette.wall,-.08,.4,D/2,.22,.8,D+.3);
  box(base,palette.trim,W/2,.84,-.08,W+.4,.11,.27);box(base,palette.trim,-.08,.84,D/2,.27,.11,D+.35);
  box(base,accent,WORLD.diningStart,.04,D/2,.12,.04,D);lettering(base,floor===5?'NOW SHOWING':floor===8?'PIXEL CUP':floor===10?'PACK & DELIVER':'THE DINING ROOM',21,1.25,.05,4,'#426451','#fff0d1');
  // Open entrance in the near wall: no tall walls between camera and jobs.
  box(base,palette.wall,(WORLD.entrance.x-.8)/2,.14,D+.05,WORLD.entrance.x-.8,.28,.14);box(base,palette.wall,W-.3,.14,D+.05,.6,.28,.14);
  box(base,'#4b6e60',WORLD.entrance.x,.055,D-.25,1.25,.05,.45);
  for(const x of [WORLD.entrance.x-.7,WORLD.entrance.x+.7])box(base,'#fff4db',x,.68,D+.08,.11,1.36,.11);
  box(base,accent,WORLD.entrance.x,1.39,D+.08,1.6,.2,.15);lettering(base,'WELCOME',WORLD.entrance.x,1.4,D+.17,1.37);
  // Wall menu and broad awnings are intentionally behind the workstations.
  box(base,'#fff2d7',5.8,1.6,-.05,3.4,.72,.16);lettering(base,floor<2?'FOOD · DFP':FLOORS[floor].name.toUpperCase(),5.8,1.6,.05,3.2,'#355951','#fff2d7');
  for(const p of DECOR)plant(base,p.x,p.y);
  if(floor===0)for(const x of [1.7,4.8,7.9]) {for(let i=0;i<6;i++){const aw=box(base,i%2?'#fff1ce':'#ffb52b',x-.94+i*.38,1.78,.12,.39,.09,.78);aw.rotation.x=.13;} }
  if(floor===1){for(let x=1;x<12;x+=2)box(base,'#c8a771',x,.46,.026,.035,.6,.025);}
  expansionRoom(base,dynamic,state,floor);
  const stations=new Map();
  for(const st of LAYOUTS[floor]) {
    const x=st.x+st.w/2,z=st.y+st.d/2,open=stationOpen(state,floor,st),c=open?accent:'#b9a9c4',base=new T.Group();
    const detail=group(dynamic),goods=group(detail);const pad=ring(detail,open?(st.id==='counter'?'#f08b47':'#78af95'):'#b8beb3',st.pad.x,.055,st.pad.y,st.id==='counter'?1.25:1);
    stations.set(st.id,{st,detail,goods,pad,open,source:base,inventoryKey:'',screens:[],steam:[],bubbles:[],lights:[],parts:[],age:0});
    const data=stations.get(st.id);
    if(expansionStation(base,detail,data,state,floor))continue;
    if(isDrink(st.product)&&!open){box(base,'#cdbd9f',x,.07,z,st.w,.10,st.d);box(base,'#fff0c5',x,.13,z,.45,.04,.09);box(base,'#fff0c5',x,.13,z,.09,.04,.45);continue;}
    if(st.auxiliary) {box(base,'#c07942',x,1.115,z,1.1,.04,.73);lettering(base,'STACK',x,1.14,st.y+st.d+.025,.8,'#fff4d8','#bc753d');continue;}
    if(st.kind==='trash') {box(base,'#52786c',x,.38,z,.62,.74,.62);box(base,'#b6c9b7',x,.79,z,.68,.12,.68);box(base,'#284e47',x,.853,z,.39,.02,.35);lettering(base,'BIN',x,.42,z+.321,.42);continue;}
    if(st.kind==='table') {
      if(!open){box(base,'#cbbf9f',x,.04,z,st.w+.8,.04,st.d+.5);box(base,'#eee4c8',x,.07,z,st.w+.68,.035,st.d+.38);box(base,'#c4b38d',x,.1,z,.5,.025,.09);box(base,'#c4b38d',x,.1,z,.09,.025,.5);continue;}
      cylinder(base,accent,x,.46,z,.48,.87);box(base,accent,x,.08,z,1.1,.13,.85);box(base,'#f7ab35',x,.91,z,st.w,.14,st.d);box(base,'#ffeabf',x,1.0,z,st.w+.015,.07,st.d+.015);
      chair(base,st.x-.6,z,Math.PI/2);chair(base,st.x+st.w+.52,z,-Math.PI/2);
      plate(base,x-.36,1.06,z);plate(base,x+.43,1.06,z);cylinder(base,'#d4a460',x,1.17,z-.44,.12,.28);ball(base,'#ffda8b',x,1.35,z-.44,.075,.14,.075);
      const glass=food('wine');glass.position.set(x+.42,1.08,z-.47);glass.scale.setScalar(.65);base.add(glass);continue;
    }
    if(['shelf','keyShelf'].includes(st.kind)) {
      box(base,c,x,.65,st.y+.12,st.w,1.3,.15);for(const y of [.22,.78,1.34])box(base,'#fff1d5',x,y,z,st.w+.06,.1,st.d);
      for(const dx of [-1,1])box(base,c,x+dx*(st.w/2-.06),.66,z,.19,1.4,st.d);
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
      for(const dx of [-1,1]){box(base,'#684ca0',x+dx*1.08,1.03,z+.15,.28,2.03,.34);data.lights.push(box(detail,'#b2ff64',x+dx*1.08,1.03,z+.336,.10,1.84,.032,false,true));}
      box(base,'#544b77',x,2.05,z+.15,2.5,.24,.3);lettering(base,'PIXEL RUN · VR',x,2.08,z+.32,2.12,'#e2fdc6','#544b77');
      cylinder(base,'#3e3d60',x,.58,z,.45,1.0);box(base,'#d4dce8',x,1.18,z,.63,.3,.4);box(base,'#303851',x,1.18,z+.22,.5,.2,.08);continue;
    }
    counter(base,st,c);
    if(st.kind==='prep') {box(base,'#cd9b66',x,1.13,z,.95,.075,.66);const dough=food('raw');dough.position.set(x,1.17,z);detail.add(dough);data.parts.push(dough);box(base,'#e9c591',x+.65,1.2,z,.13,.15,.5);}
    if(st.kind==='fryer') {
      box(base,'#8da49d',x,1.2,z,1.55,.24,.95,true);for(const dx of [-.4,.4]){box(base,'#626c48',x+dx,1.329,z,.59,.025,.61);box(base,'#e7bd57',x+dx,1.348,z,.48,.018,.5);box(base,'#465f58',x+dx,1.38,z+.5,.12,.08,.48);}
      for(let i=0;i<5;i++){const puff=ball(detail,'#fff6dc',x+(i%2?-.36:.36),1.55+i*.15,z,.12);puff.castShadow=false;data.steam.push(puff);}
      for(let i=0;i<6;i++){const bubble=ball(detail,'#ffe28b',x+(i%2?-.36:.36),1.38,z+(i%3-1)*.16,.09,.05,.09);data.bubbles.push(bubble);}
      const basket=group(detail,x,1.37,z);for(const dx of [-.4,.4])box(basket,'#eebd4f',dx,0,0,.47,.045,.46);data.parts.push(basket);
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
    if(st.kind==='drinks'||st.kind==='wine') {box(base,st.kind==='wine'?'#a25d9b':'#ffb72c',x,1.43,z,.86,.75,.8);box(base,'#fff3d6',x,1.64,z+.41,.64,.17,.035);for(const dx of [-.22,.22]){box(base,'#785093',x+dx,1.49,z+.49,.10,.15,.14);cylinder(base,'#ddc6ed',x+dx,1.09,z+.5,.26,.04);}
      const pour=group(detail);shape(pour,'cup','#fff5db',x-.22,1.225,z+.5,.26,.22,.26);cylinder(pour,'#fff5db',x-.22,1.115,z+.5,.22,.025);
      const liquid=st.kind==='wine'?'#af3677':'#fb9440';data.fill=cylinder(pour,liquid,x-.22,1.125,z+.5,.21,.01);data.stream=cylinder(pour,liquid,x-.22,1.395,z+.5,.045,.16);data.pour=pour;
      if(st.kind==='wine')for(const dx of [-.45,0,.45])cylinder(base,'#75508c',x+dx,1.5,z-.2,.15,.7);}
    if(st.kind==='tower'||st.kind==='handheld') {plate(base,x,1.11,z);const meal=food(st.kind);meal.position.set(x,1.15,z);detail.add(meal);data.parts.push(meal);box(base,'#785195',x+.7,1.31,z-.3,.29,.44,.26);}
    if(st.kind==='snack'){box(base,'#b98044',x,1.12,z,1,.07,.7);const snack=food(st.id);snack.position.set(x,1.17,z);detail.add(snack);data.parts.push(snack);lettering(base,'CRUNCH',x,1.56,z-.38,1.12,'#fff2ce',c);}
    if(['counter','checkout','host'].includes(st.kind))data.register=register(detail,st.kind==='counter'?x+Math.min(1.55,st.w/2-.4):x,z);
    if(st.kind==='counter') {lettering(base,'DFP',x, .6,z+st.d/2+.04,1.15,'#fff3d7','#f47b45');box(base,'#b8d5bf',x,1.11,z,1.1,.035,.7);}
    if(['stock','keyStock'].includes(st.kind)){for(let i=0;i<3;i++){const item=food(st.kind==='stock'?'souvenir':'keychain');item.position.set(x-.7+i*.7,1.12,z);base.add(item);}lettering(base,'DFP / STOCK',x,.63,z+st.d/2+.03,1.35,'#fff6df','#6295b0');}
  }
  for(const data of stations.values()){const {st,source}=data;const x=st.x+st.w/2,z=st.y+st.d/2;source.position.set(-x,0,-z);data.body=mergeStatic(source);data.body.position.set(x,0,z);dynamic.add(data.body);delete data.source;}
  const merged=mergeStatic(base);root.add(merged,dynamic);root.userData={stations,merged};return root;
}

export const STICKMAN=Object.freeze({hipHeight:.785,thigh:.34,shin:.40,footHeight:.08,stride:.88,shoulder:.295,upperArm:.26,forearm:.25});
const charcoal='#15191f';
const bodyMaterial=new T.MeshStandardMaterial({color:charcoal,roughness:.46,metalness:0});
function bodyPart(mesh,name){mesh.material=bodyMaterial;mesh.name=name;return mesh;}
const shadowData=new Uint8Array(32*32*4);
for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,d=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);shadowData.set([40,65,51,Math.round(Math.max(0,1-d)**1.5*75)],i);}
const shadowTexture=new T.DataTexture(shadowData,32,32);shadowTexture.needsUpdate=true;shadowTexture.magFilter=T.LinearFilter;shadowTexture.minFilter=T.LinearFilter;
const shadowGeometry=new T.PlaneGeometry(.94,.94);
export function character(outfit,variation=0,role='player') {
  const root=new T.Group(),rig=group(root),skin=charcoal;
  root.name='DFP stickman';rig.name='shared-stickman-rig';root.userData.style='stickman';
  const hips=group(rig,0,STICKMAN.hipHeight,0),torso=group(hips,0,.20,0);
  bodyPart(capsule(hips,skin,0,-.015,0,.34,.20,.27),'pelvis');
  capsule(torso,outfit.color,0,.10,0,.44,.56,.32).name='shirt';
  bodyPart(capsule(torso,skin,0,.36,0,.18,.17),'neck');
  // Folded collar tabs are interchangeable clothing, never face detail.
  for(const side of [-1,1]){const collar=box(torso,outfit.color,side*.066,.315,.156,.12,.13,.05);collar.rotation.z=side*.40;collar.rotation.x=-.25;collar.name='collar';}
  if(['chef','staff'].includes(outfit.id)){
    box(torso,'#fff4dc',0,.025,.17,.30,.35,.04);box(torso,role==='staff'?outfit.color:'#e98b3e',0,.045,.196,.16,.06,.018);
  }
  if(outfit.id==='formal'){box(torso,'#fff4df',0,.19,.17,.14,.25,.026);box(torso,'#ddaa53',0,.17,.19,.048,.19,.018);}
  if(outfit.id==='retro'){box(torso,'#ffe7a2',0,.09,.173,.23,.13,.025);for(const x of [-.065,.065])ball(torso,'#526d94',x,.09,.19,.045);}
  if(outfit.id==='neon'){for(const x of [-.15,.15])capsule(torso,'#c4f97b',x,.08,.14,.036,.35,.028);}
  const head=group(torso,0,.63,0);bodyPart(shape(head,'head',skin,0,0,0,.68,.74,.66),'featureless-head');
  if(outfit.id==='chef'){
    cylinder(head,'#fff8eb',0,.31,0,.53,.18);for(const x of [-.16,0,.16])ball(head,'#fffaf0',x,.45,0,.32,.30,.33);
  }else if(outfit.id==='neon'){
    const band=shape(head,'ring','#bafd72',0,.035,0,.75,.75,.75);band.rotation.z=Math.PI/2;
    for(const x of [-.35,.35])capsule(head,'#bafd72',x,0,0,.15,.28,.20);
  }else if(outfit.hat){
    const hat=group(head);hat.rotation.y=outfit.id==='retro'?Math.PI:0;
    if(role!=='staff')shape(hat,'cap',outfit.hat,0,.205,-.012,.72,.55,.71).name='cap-crown';
    cylinder(hat,outfit.hat,0,.205,-.012,.72,.052,.71);
    ball(hat,outfit.hat,0,.19,.31,.60,.062,.48).name='cap-brim';
  }else if(role==='customer'&&variation%3===0){
    // A collar band varies customers without marking the featureless face.
    cylinder(torso,outfit.color,0,.32,0,.31,.065);
  }
  if(role==='customer'&&variation%3===1)cylinder(torso,'#fff0c9',0,.30,0,.29,.08);
  const arms=[],elbows=[],hands=[];
  for(const side of [-1,1]){
    const arm=group(torso,side*STICKMAN.shoulder,.24,0);bodyPart(capsule(arm,skin,0,-.13,0,.18,.32),'upper-arm');
    capsule(arm,outfit.color,0,-.045,0,.23,.19,.24).name='short-sleeve';
    const elbow=group(arm,0,-STICKMAN.upperArm,0);bodyPart(capsule(elbow,skin,0,-.12,0,.18,.29),'forearm');
    bodyPart(ball(elbow,skin,0,0,0,.18),'elbow');
    const hand=group(elbow,0,-STICKMAN.forearm,0);bodyPart(ball(hand,skin,0,0,0,.23,.23,.225),'mitten');
    arms.push(arm);elbows.push(elbow);hands.push(hand);
  }
  const legs=[],knees=[],feet=[];
  for(const side of [-1,1]){
    const leg=group(hips,side*.13,0,0);bodyPart(capsule(leg,skin,0,-STICKMAN.thigh/2,0,.19,STICKMAN.thigh+.05),'thigh');
    const knee=group(leg,0,-STICKMAN.thigh,0);bodyPart(capsule(knee,skin,0,-STICKMAN.shin/2,0,.18,STICKMAN.shin+.04),'shin');
    bodyPart(ball(knee,skin,0,0,0,.185),'knee');
    const foot=group(knee,0,-STICKMAN.shin,0);bodyPart(ball(foot,skin,0,0,.06,.22,.12,.30),'rounded-foot');
    legs.push(leg);knees.push(knee);feet.push(foot);
  }
  const carry=group(torso,0,.31,.46);const tray=box(carry,'#f8e6ba',0,-.025,0,.75,.045,.49);tray.visible=false;
  const tools={spatula:group(hands[1]),pitcher:group(hands[1]),cloth:group(hands[1])};
  capsule(tools.spatula,'#607b7c',0,.12,.035,.035,.28);box(tools.spatula,'#a9c1bd',0,.28,.035,.13,.14,.025);
  cylinder(tools.pitcher,'#f3f5dc',0,.09,.015,.17,.23);box(tools.pitcher,'#78baba',0,.12,.108,.14,.12,.025);
  box(tools.cloth,'#a9e7bd',0,-.04,.05,.23,.04,.18);Object.values(tools).forEach(tool=>{tool.visible=false;});
  // A stable contact shadow remains available even in reduced effects.
  const contact=new T.Mesh(shadowGeometry,new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.037;root.add(contact);
  if(role==='player')ring(root,'#f3934d',0,.052,0,.84);
  return {root,rig,hips,torso,head,arms,elbows,hands,legs,knees,feet,carry,tray,contact,tools,bagKey:'',bagModels:[],angle:0,phase:0,travelPhase:0,walk:0,work:0,sit:0,react:0,celebrate:0,greet:0,role,variation,previous:null,handTargets:[new T.Vector3(-.27,-.25,0),new T.Vector3(.27,-.25,0)],motion:'idle'};
}

export function disposeRoom(root) {root?.userData.merged?.userData.owned.forEach(g=>g.dispose());for(const d of root?.userData.stations?.values()||[])d.body.userData.owned.forEach(g=>g.dispose());}
