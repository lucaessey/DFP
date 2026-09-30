import * as T from 'three';
import {box,ball,cylinder,ring,group,lettering,character,food,mergeStatic} from './scene-assets.js';
import {animateStickman} from './character-motion.js';
import {OUTFITS} from './config.js';
import {equippedPet} from './pets.js';
import {petModel,animatePet} from './pet-models.js';
import {STORY_PLACES,EVENT_SPOTS,RECIPES} from './story-data.js';
import {currentStoryActor,storyScene,storyObjective,storyHazards,storyActor} from './story.js';
import {storyWorld,storyWalkable,storyFollow,storyDistance} from './story-navigation.js';

const v=new T.Vector3(),rivalOutfit={id:'chef',color:'#75bb69',hat:'#e6f0be',pants:'#15191f'};
function tree(g,x,z){cylinder(g,'#bd9061',x,.8,z,.3,1.6);ball(g,'#72b984',x,2,z,1.7,2,1.6);ball(g,'#9bcd80',x+.45,2.3,z-.1,1.2,1.3,1.2);}
function bench(g,x,z){box(g,'#cf9968',x,.55,z,2,.25,.7);box(g,'#dda675',x,1,z-.32,2,.8,.18);for(const dx of [-.7,.7])box(g,'#668b88',x+dx,.25,z,.15,.5,.65);}
function building(g,x,z,w,d,color,title){
 box(g,color,x,1.5,z,w,3,d);box(g,'#ffefc6',x,3,z,w+.2,.22,d+.15);
 box(g,'#63999b',x,1.2,z+d/2+.025,1.4,2.4,.08);box(g,'#d9f5e4',x,1.3,z+d/2+.07,1.1,1.9,.035);
 for(const dx of [-w*.32,w*.32]){box(g,'#fff0cf',x+dx,1.6,z+d/2+.06,1.65,1.5,.16);box(g,'#a4d9d1',x+dx,1.65,z+d/2+.16,1.45,1.15,.04);}
 lettering(g,title,x,2.65,z+d/2+.18,w*.85,'#fff9db','#43656b');
 for(let i=0;i<8;i++)box(g,i%2?'#fff0c7':color,x-w/2+(i+.5)*w/8,2.1,z+d/2+.55,w/8,.13,1.1);
}
function counter(g,x,z,name,color='#f1b876'){box(g,color,x,.6,z,2.3,1.2,1);box(g,'#fff1d0',x,1.25,z,2.5,.16,1.15);lettering(g,name,x,1.7,z+.2,2.3,'#fff5d5','#477174');}
function outside(){
 const g=group();box(g,'#c6d4ba',17,-.3,14,34,.6,28);
 box(g,'#f6e4c2',17,.02,14,33.8,.08,27.8);box(g,'#afbbb4',17,.09,14,34,.12,5);
 for(let x=1;x<34;x+=3)box(g,'#f5dc91',x,.16,14,1.5,.02,.1);
 for(let z=11.8;z<16.5;z+=.6)box(g,'#fff5da',12,.17,z,3.4,.025,.32);
 for(const z of [11.35,16.65])box(g,'#e7c6a4',17,.16,z,34,.24,.23);
 building(g,6,24.5,9,5,'#e9765c','DFP');
 // South-side DFP opens toward the street, so its readable entrance is on the north wall.
 box(g,'#e1f2ce',6,1.2,21.96,1.5,2.4,.12);lettering(g,'DFP · HOME',6,2.7,21.87,6,'#fff5da','#a7524c').rotation.y=Math.PI;
 building(g,6.5,2.8,11,4.5,'#91bd70','LEAF IT TO US');
 building(g,20.5,3.5,7,3,'#efb269','MISO’S MARKET');building(g,29,3.5,6,3,'#88bed0','DELIVERY');
 box(g,'#9acb8d',25,.14,23,15,.2,9);box(g,'#e8d7b0',24,.28,20,12,.1,2.3);box(g,'#eeddbb',25.5,.28,23,2,.1,8);
 for(const [x,z] of [[18,23],[31,21],[18,10],[31,11]])tree(g,x,z);
 bench(g,22,24);bench(g,28,25);
 cylinder(g,'#a4d7d2',22,.25,18.2,2,.35);cylinder(g,'#e8f6de',22,.6,18.2,.6,.65);ball(g,'#bce6ef',22,1.05,18.2,.7,.5,.7);
 box(g,'#efc775',23,.2,10.5,6,.25,2);for(const x of [20,26])cylinder(g,'#e69a72',x,2,10.5,.23,3.7);lettering(g,'THE CRUNCH CUP',23,3.5,10.5,6,'#615d55','#ffe5a1');
 for(let i=0;i<9;i++){const pennant=box(g,['#ef8c75','#b5d69c','#85c9d6'][i%3],20.3+i*.67,3.2,10.55,.42,.35,.04);pennant.rotation.z=.15;}
 for(const p of Object.values(STORY_PLACES))ring(g,p.color,p.x,.23,p.y,1.25);
 return mergeStatic(g);
}
function eventRoom(type){
 const g=group();box(g,'#eddcbf',10,-.22,8,20,.45,16);box(g,'#edc778',10,.015,8,19.8,.05,15.8);box(g,'#fff0d3',10,.055,8,18.8,.04,14.8);
 for(const x of [.2,19.8])box(g,'#82b9b5',x,.35,8,.3,.7,16);box(g,'#82b9b5',10,.35,.2,20,.7,.3);
 lettering(g,'NEIGHBORHOOD • CRUNCH CUP',10,2.8,.3,10,'#fff5d1','#60898b');
 if(type==='cook'){
  for(const [id,col] of [['batter','#f4c66c'],['pixel','#d09bd5'],['leaf','#96ca83'],['berry','#df91b4']]){const p=EVENT_SPOTS[id];counter(g,p.x,p.y-1.5,p.name,col);for(const dx of [-.55,0,.55])ball(g,col,p.x+dx,1.53,p.y-1.5,.4,.4,.4);}
  counter(g,7,6.5,'PREP','#df9870');counter(g,12,6.5,'SERVE','#8db5c9');cylinder(g,'#657577',7,1.42,6.5,1,.15);
 }else if(type==='serve'){
  counter(g,4,4.8,'FREE MEALS','#f0b269');for(let i=0;i<3;i++){const x=8+i*4;box(g,'#bd8b66',x,.68,9.1,2,1.2,1.1);box(g,'#fff1d5',x,1.32,9.1,2.2,.15,1.3);box(g,'#7eb8ae',x+1.5,.35,9.1,.6,.7,.65);box(g,'#7eb8ae',x+1.8,.9,9.1,.15,.85,.65);ring(g,'#d8bb77',x,.1,11,1);}
 }else if(type==='race'){
  for(const [i,col]of ['#efb371','#8bc897','#a7a4d4'].entries()){const p=EVENT_SPOTS[`checkpoint${i}`];ring(g,col,p.x,.15,p.y,1.8);lettering(g,`${i+1} · ${p.name}`,p.x,1.8,p.y-1,3,'#fff4d9','#557b7b');box(g,col,p.x, .4,p.y-1.3,1.7,.8,.6);}
  box(g,'#95c686',9,.4,7,4,.8,2);box(g,'#95c686',7.5,.4,11,3,.8,2);
  for(const [x,z]of [[6,5],[8,5],[10,5],[12,5],[15,7],[15,9],[15,11]])box(g,'#e6bf78',x,.08,z,.45,.05,.4);
 }else{
  box(g,'#c5dfaf',10,.06,8,18,.05,13);box(g,'#f8e6b5',10,.1,8,.15,.04,12);for(const x of [3,17])for(const z of [2,14])cylinder(g,'#e99772',x,.5,z,.65,1);
 }
 for(const [x,z]of [[1,1],[19,1]]){cylinder(g,'#dd956a',x,.4,z,.8,.8);ball(g,'#98c489',x,1.2,z,1.1,1.3,1.1);}
 return mergeStatic(g);
}
export class StoryRenderer{
 constructor(canvas){
  this.canvas=canvas;this.scene=new T.Scene();this.scene.background=new T.Color('#e8eedb');this.camera=new T.OrthographicCamera(-10,10,8,-8,.1,100);
  this.gl=new T.WebGLRenderer({canvas,antialias:true});this.gl.outputColorSpace=T.SRGBColorSpace;this.gl.toneMapping=T.ACESFilmicToneMapping;this.gl.toneMappingExposure=1.15;this.gl.shadowMap.enabled=true;this.gl.shadowMap.type=T.PCFSoftShadowMap;
  this.scene.add(new T.HemisphereLight('#fff3d9','#b8c4c6',2.7));const sun=new T.DirectionalLight('#fff0d5',3);sun.position.set(4,30,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,far:65});sun.shadow.normalBias=.04;sun.target.position.set(15,0,13);this.scene.add(sun,sun.target);
  this.rooms=new Map();this.rigs=new Map();this.dynamic=group(this.scene);this.mark=ring(this.scene,'#ffc940',0,.28,0,1.8);this.arrow=group(this.scene);this.focus={x:6,y:20};this.type=null;this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.lastTime=0;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});canvas.addEventListener('webglcontextrestored',()=>this.lost=false);
  canvas.dfpDiagnostics=()=>({scene:this.type,calls:this.gl.info.render.calls,characters:this.rigs.size,pet:this.pet?{id:this.pet.definition.id,x:this.follower.x,y:this.follower.y,recovered:this.recovered||0}:null,camera:{x:this.focus.x,y:this.focus.y},actor:this.playerPosition});
 }
 switch(type){
  if(this.type===type)return;if(this.room)this.scene.remove(this.room);if(!this.rooms.has(type))this.rooms.set(type,type==='outside'?outside():eventRoom(type));this.room=this.rooms.get(type);this.scene.add(this.room);this.type=type;for(const m of this.rigs.values())this.scene.remove(m.root);this.rigs.clear();this.follower=null;this.focus=null;
 }
 rig(id,outfit,role='customer',variation=0){let m=this.rigs.get(id);if(m?.outfit!==outfit.id){if(m)this.scene.remove(m.root);m=character(outfit,variation,role);m.outfit=outfit.id;this.rigs.set(id,m);this.scene.add(m.root);}m.root.visible=true;return m;}
 draw(s,dt){
  if(this.lost)return;const st=s.story,type=storyScene(st),a=currentStoryActor(st),e=st.event,time=st.clock,reduced=s.settings.reducedMotion;this.switch(type);this.playerPosition={x:a.x,y:a.y};
  const rect=this.canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;const ratio=Math.min(devicePixelRatio,1.7),w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);if(this.canvas.width!==w||this.canvas.height!==h){this.gl.setPixelRatio(ratio);this.gl.setSize(rect.width,rect.height,false);}
  const aspect=rect.width/rect.height,span=aspect<.8?13:aspect>1.8?12:15;this.camera.left=-span*aspect/2;this.camera.right=span*aspect/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.updateProjectionMatrix();
  this.focus??={x:a.x,y:a.y};const f=1-Math.exp(-8*dt);this.focus.x+=(a.x-this.focus.x)*f;this.focus.y+=(a.y-this.focus.y)*f;
  const world=storyWorld(type);this.focus.x=Math.max(3,Math.min(world.width-3,this.focus.x));this.focus.y=Math.max(3,Math.min(world.depth-3,this.focus.y));
  this.camera.position.set(this.focus.x+12,20,this.focus.y+12);this.camera.lookAt(this.focus.x,0,this.focus.y);
  const canWalk=(_,x,y,r=.2)=>storyWalkable(type,x,y,r),seat=i=>({x:9.5+i*4,y:9.1}),env={walkable:canWalk,layout:[{id:'story-prep',kind:'prepare',x:6,y:6,w:2,d:1}],seat,seatFacing:-Math.PI/2};
  for(const rig of this.rigs.values())rig.root.visible=false;
  const player=this.rig('player',OUTFITS.find(o=>o.id===s.outfit),'player');
  const visualActor=e?.type==='race'?{...a,bag:['souvenir']}:e?.cooking&&storyDistance(a,EVENT_SPOTS.prep)<1.6?{...a,action:'story-prep',progress:2.5-e.cooking.left}:a;
  animateStickman(player,visualActor,a,s,dt,time,canWalk,env);
  if(e?.type==='fight'){player.rig.rotation.y=Math.atan2(e.aim.x-a.x,e.aim.y-a.y);if(!reduced){if(e.dodge>0)player.torso.rotation.z=.2*Math.sin(e.dodge*12);if(e.stun>0)player.head.rotation.z=Math.sin(time*20)*.15;if(e.throwCooldown>.28)player.arms[1].rotation.x-=Math.sin((.65-e.throwCooldown)/.37*Math.PI)*1.2;}}
  if(st.complete)player.celebrate=1;
  if(type==='outside'){
   for(const [i,[id,p]]of Object.entries(STORY_PLACES).filter(([id])=>id!=='dfp').entries()){
    const npc={...storyActor(p.x+1.1,p.y-.25),state:'waiting',purpose:'story',table:null};const m=this.rig(id,id==='rival'||id==='cook'?rivalOutfit:{...OUTFITS[i%OUTFITS.length],id:`npc-${id}`,color:p.color},'customer',i);animateStickman(m,npc,npc,s,dt,time,canWalk,env);
   }
  }else{
   const m=this.rig('rival',rivalOutfit,'staff'),rivalActor=['cook','serve','race'].includes(e.type)?{...e.rivalActor,bag:e.type==='race'?['souvenir']:Math.floor(time)%4<2?['controller']:[]}:e.rivalActor;animateStickman(m,rivalActor,e.rivalActor,s,dt,time,canWalk,env);
   if(e.type==='fight'&&e.warning&&!reduced)m.arms[1].rotation.x-=Math.sin((1.1-e.warning.left)/1.1*Math.PI)*1.1;
   if(e.type==='serve')e.tables.forEach((t,i)=>{const sitting=['seated','eating','dirty'].includes(t.state),p=seat(i);const guest={...storyActor(sitting?p.x:t.state==='done'?18:8+i*4,sitting?p.y:t.state==='done'?13-i:12.5),state:sitting?'dining':t.state==='done'?'leaving':'waiting',purpose:'story',table:sitting?i:null,needs:[RECIPES[t.recipe].id],delivered:[t.state==='eating'],bag:[],moving:false};const rig=this.rig(`guest${i}`,OUTFITS[(i+2)%OUTFITS.length],'customer',i);animateStickman(rig,guest,guest,s,dt,time,()=>true,env);});
  }
  const pet=equippedPet(s);if(this.pet?.definition.id!==pet?.id){if(this.pet)this.scene.remove(this.pet.root);this.pet=pet?petModel(pet):null;if(this.pet)this.scene.add(this.pet.root);this.follower=null;}
  if(this.pet){
   const spawn=()=>{for(let r=1.1;r<3;r+=.4)for(let i=0;i<12;i++){const p={x:a.x+Math.cos(i*Math.PI/6)*r,y:a.y+Math.sin(i*Math.PI/6)*r};if(storyWalkable(type,p.x,p.y,.6))return {...storyActor(p.x,p.y)};}return storyActor(a.x,a.y);};
   this.follower??=spawn();if(storyDistance(this.follower,a)>8){this.follower=spawn();this.recovered=(this.recovered||0)+1;}
   const before={x:this.follower.x,y:this.follower.y};if(storyDistance(this.follower,a)>1.65){const d=storyDistance(this.follower,a),target={x:a.x+(this.follower.x-a.x)/d*1.3,y:a.y+(this.follower.y-a.y)/d*1.3};if(storyWalkable(type,target.x,target.y,.6))storyFollow(this.follower,type,target,dt,5.1,.6);}
   const moved=storyDistance(before,this.follower);this.pet.root.position.set(this.follower.x,0,this.follower.y);if(moved>.001)this.pet.root.rotation.y=Math.atan2(this.follower.x-before.x,this.follower.y-before.y);animatePet(this.pet,dt,time,moved>.001,reduced,moved/Math.max(.001,dt));
   this.stuck=moved<.001&&storyDistance(this.follower,a)>3?(this.stuck||0)+dt:0;if(this.stuck>2){this.follower=spawn();this.stuck=0;this.recovered=(this.recovered||0)+1;}
  }
  this.dynamic.clear();
  if(e?.type==='fight'){
   if(this.encounter!==e){this.encounter=e;this.lastScores=[e.score,e.rival];this.splats=[];}
   for(const [i,score]of [e.score,e.rival].entries())if(score!==this.lastScores[i]){const p=i?a:e.rivalActor;this.splats.push({x:p.x,y:p.y,born:time,color:i?'#88b964':'#efae51'});}
   this.lastScores=[e.score,e.rival];this.splats=this.splats.filter(p=>time-p.born<.8);
   for(const p of this.splats){const n=(time-p.born)/.8;for(let i=0;i<6;i++){const angle=i*Math.PI/3;ball(this.dynamic,p.color,p.x+Math.cos(angle)*n,.6+(reduced?0:Math.sin(n*Math.PI)*.6),p.y+Math.sin(angle)*n,.25*(1-n),.12*(1-n),.25*(1-n));}}
  }
  let target=type==='outside'?STORY_PLACES[storyObjective(st)?.place]:e?.type==='race'?EVENT_SPOTS[`checkpoint${Math.min(2,e.checkpoint)}`]:null;
  this.mark.visible=!!target;if(target){this.mark.position.set(target.x,.26,target.y);this.mark.scale.setScalar(reduced?1.8:1.8+Math.sin(time*3)*.08);}
  if(e){
   for(const p of e.projectiles)ball(this.dynamic,p.owner==='player'?'#efaf4f':'#81b964',p.x,.8,p.y,.36,.3,.36);
   if(e.warning)ring(this.dynamic,'#ee7952',e.warning.x,.2,e.warning.y,1.6);
   if(e.type==='fight')ring(this.dynamic,'#426f77',e.aim.x,.12,e.aim.y,.7);
   for(const h of storyHazards(e)){box(this.dynamic,'#ed9f5c',h.x,.48,h.y,1.05,.85,.8);for(const x of [-.4,.4])ball(this.dynamic,'#546b6a',h.x+x,.18,h.y,.3);}
   if(e.type==='serve')e.tables.forEach((t,i)=>{if(['eating','dirty'].includes(t.state)){if(t.state==='eating'){const dish=food(RECIPES[t.recipe].id);dish.position.set(8+i*4,1.44,9.1);this.dynamic.add(dish);}else for(let j=0;j<4;j++)ball(this.dynamic,'#b28657',7.5+i*4+j*.28,1.43,9.1+(j%2)*.18,.12,.04,.12);}});
   if(e.cooking){const dish=food(e.cooking.recipe);dish.position.set(7,1.5,6.5);this.dynamic.add(dish);}
  }
  this.gl.render(this.scene,this.camera);
 }
 pick(clientX,clientY){const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera({x:(clientX-r.left)/r.width*2-1,y:1-(clientY-r.top)/r.height*2},this.camera);if(!this.ray.ray.intersectPlane(this.plane,v))return null;return {x:v.x,y:v.z};}
 project(p,height=0){v.set(p.x,height,p.y).project(this.camera);const r=this.canvas.getBoundingClientRect();return {x:(v.x+1)*r.width/2,y:(1-v.y)*r.height/2};}
}
