import * as T from 'three';
import { LAYOUTS, OUTFITS, ROSTER, WORLD, FLOOR_FOODS } from './config.js';
import { stationStatus } from './simulation.js';
import { room, character, food, shape, disposeRoom } from './scene-assets.js';
import { animateCharacter, crowdTargets, separateCrowd, damp } from './animation.js';
import { icon } from './icons.js';
import {collectionPoint,updateStationMotion,smooth,landing} from './world-motion.js';

const itemNames={controller:'Controller',drink:'Drink',tower:'Tower',handheld:'Handheld',wine:'Wine',souvenir:'DFP bag',keychain:'Keychain',snack2:'Shop Crunch',snack3:'Arcade Crunch'},v=new T.Vector3();
const stationIcons={prep:'prep',fryer:'fry',pickup:'pickup',drinks:'wine',wine:'wine',tower:'controller',handheld:'controller',snack:'controller',counter:'serve',stack:'stack',trash:'trash',table:'table',stock:'bag',keyStock:'gift',shelf:'gift',keyShelf:'gift',checkout:'coin',arcade:'arcade',vr:'arcade'};
export class Renderer {
  constructor(canvas) {
    this.canvas=canvas;this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-10,10,10,-10,.1,80);
    this.gl=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    this.gl.setClearColor('#eaf0df',0);this.gl.outputColorSpace=T.SRGBColorSpace;this.gl.toneMapping=T.ACESFilmicToneMapping;this.gl.toneMappingExposure=1.35;this.gl.shadowMap.enabled=true;this.gl.shadowMap.type=T.PCFSoftShadowMap;
    this.scene.add(new T.HemisphereLight('#fff8e7','#cfabc5',2.4));
    this.sun=new T.DirectionalLight('#fff1d3',3.4);this.sun.position.set(-3,22,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:.5,far:55});this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.0003;this.sun.target.position.set(WORLD.width/2,0,WORLD.depth/2);this.scene.add(this.sun,this.sun.target);
    this.actors=new Map();this.labels=new Map();this.customerLabels=new Map();this.quantityLabels=new Map();this.effects=[];this.particles=[];this.transfers=[];this.floor=-1;this.roomKey='';this.last=0;this.follow={x:6,z:5};this.samples=[];this.renderSamples=[];
    this.layer=document.createElement('div');this.layer.className='world-ui';this.layer.setAttribute('aria-label','Workstations');canvas.parentElement.append(this.layer);this.ray=new T.Raycaster();this.ground=new T.Plane(new T.Vector3(0,1,0),0);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;canvas.parentElement.classList.add('graphics-paused');});
    canvas.addEventListener('webglcontextrestored',()=>{this.contextLost=false;canvas.parentElement.classList.remove('graphics-paused');this.last=0;});
    // Read-only telemetry permits real performance checks without game cheats.
    canvas.dfpDiagnostics=()=>({engine:'Three.js WebGL',style:'stickman',floor:this.floor,calls:this.gl.info.render.calls,triangles:this.gl.info.render.triangles,geometries:this.gl.info.memory.geometries,textures:this.gl.info.memory.textures,frames:[...this.samples],renderMs:[...this.renderSamples],pixelRatio:this.gl.getPixelRatio(),actors:this.actors.size,particles:this.particles.length,transfers:this.transfers.length,contextLost:!!this.contextLost,transferKinds:this.transfers.map(t=>t.kind),stations:this.world?[...this.world.userData.stations].map(([id,d])=>({id,state:d.cue?.state,progress:d.cue?.progress,building:d.buildAge!==undefined,scale:d.body.scale.x,y:d.body.position.y,pending:d.pending||0,fill:d.fill?.scale.y,pouring:!!d.stream?.visible,inventory:d.goods.children.length})):[],positions:[...this.actors].map(([key,m])=>({key,x:m.root.position.x,y:m.root.position.z,rotation:m.angle,walk:m.walk,bag:m.bagKey,sit:m.sit,motion:m.motion,celebrate:m.celebrate,phase:m.phase,visibleGoods:m.bagModels.length,quantity:m.visibleQuantity,carryHeight:m.carry.userData.height||0,handTargets:m.handTargets.map(p=>p.toArray())})),camera:this.camera.position.toArray()});
  }
  resize(state) {
    const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return false;const ratio=state.settings.reducedEffects?1:Math.min(1.65,devicePixelRatio||1);
    if(this.width!==r.width||this.height!==r.height||ratio!==this.gl.getPixelRatio()){this.width=r.width;this.height=r.height;this.gl.setPixelRatio(ratio);this.gl.setSize(r.width,r.height,false);}
    this.gl.shadowMap.enabled=!state.settings.reducedEffects;const aspect=r.width/r.height,width=Math.max(r.width<500?14.8:18.6,13.7*aspect),height=width/aspect;
    Object.assign(this.camera,{left:-width/2,right:width/2,top:height/2,bottom:-height/2});this.camera.updateProjectionMatrix();return true;
  }
  rebuild(state) {
    const key=`${state.floor}/${JSON.stringify(state.floors[state.floor].products)}/${state.floors[state.floor].tables.map(t=>t.owned)}`;if(key===this.roomKey)return;
    const prior=this.floor===state.floor?new Map([...this.world.userData.stations].map(([id,d])=>[id,{open:d.open,buildAge:d.buildAge}])):null;
    this.scene.remove(this.world);disposeRoom(this.world);this.world=room(state,state.floor);this.scene.add(this.world);this.roomKey=key;
    if(prior)for(const [id,data]of this.world.userData.stations)if(data.open&&(!prior.get(id)?.open||prior.get(id)?.buildAge!==undefined))data.buildAge=prior.get(id)?.buildAge??-1;
    for(const label of this.labels.values())label.remove();this.labels.clear();
    for(const st of LAYOUTS[state.floor]){const button=document.createElement('button');button.className='station-label';button.dataset.station=st.id;button.dataset.action='station';button.dataset.floor=state.floor;this.layer.append(button);this.labels.set(st.id,button);}
    if(this.floor!==state.floor){for(const m of this.actors.values()){this.scene.remove(m.root);m.contact.material.dispose();}this.actors.clear();for(const el of [...this.customerLabels.values(),...this.quantityLabels.values()])el.remove();this.customerLabels.clear();this.quantityLabels.clear();this.clearEffects();this.follow={x:6,z:5};}this.floor=state.floor;
    this.gl.toneMappingExposure=state.floor===3?1.05:1.18;this.sun.color.set(state.floor===1?'#ffe7cd':state.floor===3?'#ece1ff':'#fff1dc');this.canvas.parentElement.style.background=state.floor===3?'radial-gradient(ellipse at center,#e7d4f0,#fae7dd)':'radial-gradient(ellipse at center,#fff0d8,#f8dbcb)';
  }
  p(x,z,y=0) {v.set(x,y,z).project(this.camera);return{x:(v.x*.5+.5)*this.width,y:(-v.y*.5+.5)*this.height};}
  place(el,x,z,height=0,dy=0) {const p=this.p(x,z,height);el.style.left=`${p.x+this.canvas.offsetLeft}px`;el.style.top=`${p.y+this.canvas.offsetTop+dy}px`;}
  placeEarning(effect,age,obstacles){
    const point=this.p(effect.x,effect.z,1.9+(this.reducedMotion?0:age*.4)),w=effect.el.getBoundingClientRect().width||70,h=32;
    const x=Math.max(w/2+8,Math.min(this.width-w/2-8,point.x))+this.canvas.offsetLeft;let chosen=null;
    for(const offset of [0,-36,36,-72,72,-108,108]){const y=point.y+this.canvas.offsetTop+offset;if(y<h+8||y>this.height-12)continue;if(!obstacles.some(o=>x+w/2>o.x&&x-w/2<o.x+o.w&&y>o.y&&y-h<o.y+o.h)){chosen=y;break;}}
    effect.el.hidden=chosen===null;if(chosen!==null){effect.el.style.left=`${x}px`;effect.el.style.top=`${chosen}px`;obstacles.push({x:x-w/2,y:chosen-h,w,h});}
  }
  pick(clientX,clientY) {
    const r=this.canvas.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),this.camera);const hit=this.ray.ray.intersectPlane(this.ground,new T.Vector3());if(!hit)return{x:6,y:5};
    const st=LAYOUTS[this.floor].find(s=>Math.hypot(s.pad.x-hit.x,s.pad.y-hit.z)<.7);return st?{...st.pad,station:st.id,locked:!this.world.userData.stations.get(st.id).open}:{x:Math.max(.4,Math.min(WORLD.width-.4,hit.x)),y:Math.max(.4,Math.min(WORLD.depth-.4,hit.z))};
  }
  feedback(event,time) {
    if(event.kind!=='money'){if(event.kind==='purchase')this.celebrateNext=event.floor;if(event.floor===undefined||event.floor===this.floor)this.burst(event.x??6,event.y??5,'#a5dcaf',4);return;}
    if(event.floor!==undefined&&event.floor!==this.floor)return;const el=document.createElement('span');el.className=`world-feedback ${event.kind==='money'?'money-feedback':''}`;el.textContent=event.text;this.layer.append(el);
    this.effects.push({el,x:event.x??6,z:event.y??5,time,kind:event.kind});if(this.effects.length>10)this.effects.shift().el.remove();if(!this.reducedMotion)this.burst(event.x??6,event.y??5,event.kind==='money'?'#f5ca5b':'#a5dcaf',event.kind==='money'?6:4);
    const collector=[...this.actors.values()].find(m=>m.previous&&Math.hypot(m.previous.x-event.x,m.previous.y-event.y)<.15);
    const point=collectionPoint(this.floor,event.x,event.y),data=this.world.userData.stations.get(point.station);if(data)data.flash=.45;
    if(collector){collector.react=1;collector.root.updateMatrixWorld(true);const hand=collector.hands[1].getWorldPosition(new T.Vector3());this.transfer('cash',new T.Vector3(point.x,point.y,point.z),hand,null,collector);}
  }
  burst(x,z,color,count=3) {if(this.reducedMotion)return;const cap=this.reducedEffects?8:28;for(let i=0;i<count&&this.particles.length<cap;i++){const mesh=shape(this.scene,'sphere',color,x,.8,z,.09,.09,.09);mesh.castShadow=false;const a=i*2.4;this.particles.push({mesh,life:.6,vx:Math.cos(a)*.8,vz:Math.sin(a)*.8,vy:1.2+i*.1});}}
  transfer(kind,from,to,owner,collector) {if(this.reducedMotion||this.transfers.length>7)return;const mesh=food(kind);mesh.scale.setScalar(kind==='cash'?.95:.65);mesh.position.copy(from);this.scene.add(mesh);this.transfers.push({mesh,kind,from,to,owner,collector,token:owner?.transferToken,age:0});}
  clearEffects(){for(const e of this.effects)e.el.remove();this.effects=[];for(const p of this.particles)this.scene.remove(p.mesh);this.particles=[];for(const t of this.transfers)this.scene.remove(t.mesh);this.transfers=[];}
  inventory(data,key,items) {if(data.inventoryKey===key)return;const initial=!data.inventoryKey;data.inventoryKey=key;const old=data.itemModels||new Map(),next=new Map();for(const {kind,x,y,z,scale=1} of items){const id=[kind,x,y,z,scale].join('/');let mesh=old.get(id);if(!mesh){mesh=food(kind);mesh.position.set(x,y,z);mesh.scale.setScalar(scale);mesh.userData.restY=y;mesh.userData.restScale=scale;if(!initial&&!this.reducedMotion){mesh.userData.born=-.32;mesh.visible=false;}data.goods.add(mesh);}next.set(id,mesh);}for(const [id,m]of old)if(!next.has(id))data.goods.remove(m);data.itemModels=next;}
  stations(state,time,dt) {
    const fs=state.floors[state.floor],placed=[];
    for(const [id,data] of this.world.userData.stations) {
      const {st,open}=data,label=this.labels.get(id),active=state.player.action===id,dirty=st.kind==='table'&&fs.tables[Number(id.slice(5))].state==='dirty';
      const cue=updateStationMotion(data,state,dt,time,this.reducedMotion,this.reducedEffects);label.dataset.state=cue.state;label.style.setProperty('--unlock-fill',`${cue.afford*100}%`);label.style.setProperty('--work-fill',`${cue.progress*100}%`);
      const symbol=!open?'lock':dirty?'clean':stationIcons[st.kind]||'bag';if(label.dataset.icon!==symbol){label.innerHTML=icon(symbol);label.dataset.icon=symbol;}
      label.classList.toggle('locked',!open);label.classList.toggle('at-station',active);label.setAttribute('aria-label',`${st.name}: ${stationStatus(state,state.floor,st)} · ${cue.state}`);
      const projected=this.p(st.pad.x,st.pad.y),w=44,h=44;
      label.hidden=projected.x<8||projected.x>this.width-8||projected.y<20||projected.y>this.height-20;
      let shift=12;if(!label.hidden){for(const delta of [12,36,-12,60,-36,84,-60,108,-84]){const y=projected.y+delta;if(y<h/2||y>this.height-h/2)continue;if(!placed.some(r=>Math.abs(r.x-projected.x)<(r.w+w)/2&&Math.abs(r.y-y)<(r.h+h)/2+2)){shift=delta;break;}}placed.push({x:projected.x,y:projected.y+shift,w,h});}
      this.place(label,st.pad.x,st.pad.y,0,shift);label.style.setProperty('--stem-height',`${Math.max(0,Math.abs(shift)-10)}px`);label.style.setProperty('--stem-top',shift<0?'calc(50% + 9px)':`calc(50% - ${shift}px)`);
      data.pad.scale.setScalar((id==='counter'?1.25:1)*(active&&!this.reducedMotion?1+Math.sin(time*4)*.045:1));
      const items=[],x=st.x+st.w/2,z=st.y+st.d/2;
      if(id==='pickup')for(let i=0;i<Math.min(6,fs.stock.controller);i++)items.push({kind:'controller',x:x+(i%3-1)*.5,y:1.205,z:z+(Math.floor(i/3)-.5)*.36,scale:.7});
      if(id==='stack')FLOOR_FOODS[state.floor].forEach((kind,k)=>{for(let i=0;i<Math.min(4,fs.counter[kind]);i++)items.push({kind,x:st.x+.25+k*.7,y:1.15+i*(['controller','snack2','snack3','handheld'].includes(kind)?.18:.43),z,scale:.82});});
      if(id==='shelf'||id==='keyShelf'){const kind=id==='shelf'?'souvenir':'keychain';for(let i=0;i<Math.min(8,fs.shelves[kind]);i++)items.push({kind,x:st.x+.4+(i%4)*.52,y:.27+Math.floor(i/4)*.56,z,scale:.85});}
      if(st.kind==='arcade'){const m=fs.machines[Number(id.at(-1))];for(let i=0;i<Math.min(8,m.quarters);i++)items.push({kind:'quarter',x:x+.5,y:.15+i*.055,z:z+.69});data.screens.forEach((pixel,i)=>{pixel.position.y=1.32+Math.floor(i/3)*.27+(!this.reducedMotion&&m.customer?Math.sin(time*3+i)*.055:0);});}
      if(st.kind==='table'){const t=fs.tables[Number(id.slice(5))],c=fs.customers.find(c=>c.id===t.customer);if(c?.state==='dining')for(let i=0;i<c.needs.length;i++)if(c.delivered[i])items.push({kind:c.needs[i],x:x-.3+i*.54,y:1.11,z,scale:.72});if(t.state==='dirty')items.push({kind:'raw',x:x-.36,y:1.12,z,scale:.38});label.classList.toggle('dirty-table',dirty);}
      this.inventory(data,JSON.stringify(items),items);
      if(id==='pickup'&&data.lastCount!==undefined&&fs.stock.controller>data.lastCount){const fry=LAYOUTS[0].find(s=>s.id==='fry');for(let i=0;i<Math.min(3,fs.stock.controller-data.lastCount);i++)this.transfer('controller',new T.Vector3(fry.x+1,1.4,fry.y+.6),new T.Vector3(x+(i-1)*.4,1.21,z));}
      if(id==='pickup')data.lastCount=fs.stock.controller;
    }
  }
  people(state,dt,time) {
    const entries=[{key:'player',actor:state.player,outfit:OUTFITS.find(o=>o.id===state.outfit),role:'player',variation:0}];
    for(const a of state.employees.filter(a=>a.floor===state.floor))entries.push({key:`staff-${a.id}`,actor:a,outfit:{id:'staff',color:ROSTER[a.id].color,hat:'#fff5df',pants:'#345957'},role:'staff',variation:a.id+1});
    for(const a of state.floors[state.floor].customers)entries.push({key:`guest-${a.id}`,actor:a,outfit:{id:'guest',color:['#dc8ca3','#7db2cc','#eac768','#85b38e','#a591cf','#db9470'][a.color],pants:'#51636a'},role:'customer',variation:a.color});
    const keys=new Set(entries.map(e=>e.key));for(const [key,m] of this.actors)if(!keys.has(key)){this.scene.remove(m.root);m.contact.material.dispose();this.actors.delete(key);this.customerLabels.get(key)?.remove();this.customerLabels.delete(key);this.quantityLabels.get(key)?.remove();this.quantityLabels.delete(key);}
    entries.forEach((e,i)=>{e.order=i;const look=JSON.stringify(e.outfit);let m=this.actors.get(e.key);if(m?.look!==look){if(m){this.scene.remove(m.root);m.contact.material.dispose();}m=character(e.outfit,e.variation,e.role);m.look=look;m.key=e.key;this.actors.set(e.key,m);this.scene.add(m.root);}e.rig=m;});crowdTargets(entries,state.floor);
    for(const e of entries){
      if(e.role==='player'&&this.celebrateNext===state.floor&&!document.querySelector('dialog[open]')){e.rig.celebrate=1.05;this.celebrateNext=null;}
      const {interaction,received,added,removed,delivered}=animateCharacter(e.rig,e.actor,e.target,state,dt,time);
      if(interaction){this.burst(e.rig.root.position.x,e.rig.root.position.z,received?'#f6d476':'#fff0bd',2);if(e.role==='player')this.onCue?.('pickup');}
      const st=LAYOUTS[state.floor].find(s=>s.id===e.actor.action);e.rig.root.updateMatrixWorld(true);
      const held=e.rig.carry.getWorldPosition(new T.Vector3());
      if(e.rig.visibleQuantity>1){let quantity=this.quantityLabels.get(e.key);if(!quantity){quantity=document.createElement('span');quantity.className='quantity-badge';this.layer.append(quantity);this.quantityLabels.set(e.key,quantity);}quantity.hidden=false;quantity.textContent=`×${e.rig.visibleQuantity}`;quantity.setAttribute('aria-label',`${e.rig.visibleQuantity} carried items`);this.place(quantity,held.x,held.z,held.y+(e.rig.carry.userData.height||0)+.16);}else if(this.quantityLabels.has(e.key))this.quantityLabels.get(e.key).hidden=true;
      const surface=s=>new T.Vector3(Math.max(s.x-.08,Math.min(s.x+s.w+.08,e.rig.root.position.x)),1.24,Math.max(s.y-.08,Math.min(s.y+s.d+.08,e.rig.root.position.z)));
      for(const item of added){const source=st||(e.actor.purpose==='shop'?LAYOUTS[2].find(s=>s.id===(item==='keychain'?'keyShelf':'shelf')):null);if(source)this.transfer(item,surface(source),held.clone(),e.rig);}
      const destination=st||(e.actor.purpose==='food'&&e.actor.state==='dining'?LAYOUTS[state.floor].find(s=>s.id==='table'+e.actor.table):null);
      if(destination)for(const item of removed)this.transfer(item,held.clone(),surface(destination),e.rig);
      if(e.actor.purpose==='food')for(const item of delivered)this.transfer(item,surface(LAYOUTS[state.floor].find(s=>s.id==='counter')),held.clone(),e.rig);
      if(e.role==='customer'){let label=this.customerLabels.get(e.key);if(!label){label=document.createElement('span');label.className='order-bubble';this.layer.append(label);this.customerLabels.set(e.key,label);}
        const a=e.actor,needs=(a.needs||[]).filter((n,i)=>!a.delivered[i]),text=a.state==='leaving'?'♥':a.state==='dining'?'Enjoying!':a.state==='payment'?'$':a.state==='playing'?'PLAY':a.state==='toTable'?'Table time':a.state==='waitingTable'?'Need a clean table':a.state==='seating'?'This way':needs.map(n=>itemNames[n]).join(' + ');
        if(label.dataset.text!==text){label.dataset.text=text;label.setAttribute('aria-label',text);const stateIcon={leaving:'heart',dining:'serve',payment:'coin',playing:'arcade',toTable:'table',waitingTable:'clock',seating:'arrow'}[a.state];label.innerHTML=stateIcon?icon(stateIcon):needs.map(n=>`<span class="need-icon">${icon(n==='drink'||n==='wine'?'wine':n==='souvenir'||n==='keychain'?'gift':'controller')}</span>`).join('');}
        const queue=state.floors[state.floor].customers.filter(c=>c.state!=='leaving');
        label.hidden=!text||(a.state==='browsing'&&state.floor===2)||(state.floor===0&&queue.indexOf(a)>2)||(state.floor===1&&a.state==='waiting'&&queue.indexOf(a)>0);label.classList.toggle('happy',a.state==='leaving'||a.state==='dining');this.place(label,e.rig.root.position.x,e.rig.root.position.z,2.08,-2-(e.order%2)*9);}
    }
    separateCrowd(entries,state.floor);
    const occupied=[...this.labels.values()].filter(el=>!el.hidden).map(el=>({x:parseFloat(el.style.left)-this.canvas.offsetLeft,y:parseFloat(el.style.top)-this.canvas.offsetTop,w:44,h:44}));
    for(const e of entries)if(e.role==='customer'){
      const label=this.customerLabels.get(e.key);if(label.hidden)continue;const p=this.p(e.rig.root.position.x,e.rig.root.position.z,2.08),w=Math.min(100,(label.textContent.length||3)*5+18),h=20;
      let dy=-12-(e.order%2)*9;for(const offset of [dy,dy-22,dy-44,dy-66]){if(!occupied.some(r=>Math.abs(r.x-p.x)<(r.w+w)/2+2&&Math.abs(r.y-(p.y+offset))<(r.h+h)/2+2)){dy=offset;break;}}
      occupied.push({x:p.x,y:p.y+dy,w,h});this.place(label,e.rig.root.position.x,e.rig.root.position.z,2.08,dy+10);
    }
  }
  draw(state,time) {
    if(this.contextLost||!this.resize(state))return;const now=performance.now(),dt=this.last?Math.max(0,Math.min(.1,(now-this.last)/1000)):1/60;
    if(this.last){this.samples.push(now-this.last);if(this.samples.length>600)this.samples.shift();}this.last=now;this.reducedMotion=state.settings.reducedMotion;this.reducedEffects=state.settings.reducedEffects;this.rebuild(state);
    const bounds=WORLD.camera,focusX=this.reducedMotion?5+Math.round((state.player.x-5)/6)*6:state.player.x,focusY=this.reducedMotion?4+Math.round((state.player.y-4)/5)*5:state.player.y;
    const tx=Math.max(bounds.minX,Math.min(bounds.maxX,focusX)),tz=Math.max(bounds.minY,Math.min(bounds.maxY,focusY));
    this.follow.x=this.reducedMotion?tx:damp(this.follow.x,tx,3,dt);this.follow.z=this.reducedMotion?tz:damp(this.follow.z,tz,3,dt);this.camera.position.set(this.follow.x+13,18,this.follow.z+16);this.camera.lookAt(this.follow.x,.4,this.follow.z);this.camera.updateMatrixWorld();this.stations(state,time,dt);this.people(state,dt,time);
    const canvasBounds=this.canvas.parentElement.getBoundingClientRect(),obstacles=this.effects.length?[...this.canvas.parentElement.querySelectorAll('button:not([hidden]),.scene-top,.scene-bottom,#joystick')].filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return{x:r.left-canvasBounds.left,y:r.top-canvasBounds.top,w:r.width,h:r.height};}):[];
    for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i],age=time-e.time;if(age>1.4){e.el.remove();this.effects.splice(i,1);continue;}this.placeEarning(e,age,obstacles);e.el.style.opacity=String(Math.min(1,(1.4-age)*3));}
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;if(p.life<=0||this.reducedMotion){this.scene.remove(p.mesh);this.particles.splice(i,1);continue;}p.vy-=dt*3;p.mesh.position.x+=p.vx*dt;p.mesh.position.z+=p.vz*dt;p.mesh.position.y+=p.vy*dt;p.mesh.scale.setScalar(.1*p.life/.6);}
    for(let i=this.transfers.length-1;i>=0;i--){const t=this.transfers[i];t.age+=dt;const cash=t.kind==='cash';if(t.collector&&this.actors.get(t.collector.key)===t.collector)t.collector.hands[1].getWorldPosition(t.to);const progress=Math.max(0,Math.min(1,(t.age-(cash?.28:0))/(cash?.5:.32))),p=smooth(progress);t.mesh.position.lerpVectors(t.from,t.to,p);t.mesh.position.y+=cash&&t.age<.28?landing(t.age/.28):Math.sin(p*Math.PI)*.20;if(cash)t.mesh.scale.setScalar(t.age<.14?.95*(.65+.35*smooth(t.age/.14)):.95);if(progress>=1||this.reducedMotion||t.owner&&(this.actors.get(t.owner.key)!==t.owner||t.token!==t.owner.transferToken)){this.scene.remove(t.mesh);this.transfers.splice(i,1);}}
    const start=performance.now();this.gl.render(this.scene,this.camera);this.renderSamples.push(performance.now()-start);if(this.renderSamples.length>600)this.renderSamples.shift();
  }
}

let portraitRenderer;const portraits=new Map();
export function drawPortrait(canvas,outfit) {
  if(!portraits.has(outfit.id)){portraitRenderer??=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});portraitRenderer.setSize(320,300);portraitRenderer.setClearColor('#ffffff',0);portraitRenderer.toneMapping=T.ACESFilmicToneMapping;portraitRenderer.toneMappingExposure=1.4;
    const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff6e6','#9aac9c',2.8));const light=new T.DirectionalLight('#fff6df',3);light.position.set(-3,5,5);scene.add(light);const model=character(outfit);model.rig.rotation.y=.35;model.arms[0].rotation.x=-.2;model.arms[1].rotation.x=-.3;scene.add(model.root);
    const camera=new T.OrthographicCamera(-1.25,1.25,1.18,-1.18,.1,15);camera.position.set(2.2,2.1,5);camera.lookAt(0,1,0);portraitRenderer.render(scene,camera);portraits.set(outfit.id,portraitRenderer.domElement.toDataURL());model.contact.material.dispose();}
  const img=new Image();img.onload=()=>canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);img.src=portraits.get(outfit.id);
}
