import * as T from 'three';
import {Renderer} from './renderer.js';
import {ComputerView} from './computer-view.js';
import {COMPUTER_PRICE} from './computer.js';
import {box,ball,cylinder,group,lettering,character} from './scene-assets.js';
import {FLOORS,OUTFITS} from './config.js';
import {BASEMENT_PRICE,SECURITY_PRICE,FURNITURE,furnished,highestFloor,ensureSecurityRound,securitySelect} from './security.js';

const price=n=>`${n<0?'−':''}$${Math.abs(n).toLocaleString('en-US')}`;
export function basementCard(s,visiting){return `<article class="floor-card basement-card ${s.basement.unlocked?'':'locked'}"><div class="floor-illustration"><span class="floor-number">B1</span><span class="basement-emblem">⌂</span><span class="floor-card-badge">${s.basement.unlocked?'YOUR LOUNGE':'LOCKED · AVAILABLE FROM THE START'}</span></div><div class="floor-card-body"><h2>The Basement</h2><p>A comfy little lounge. A watchful eye upstairs.</p><div class="floor-detail">Independent of upper floors · ${s.basement.security.owned?'Security ready':'Furnish your space'}</div><button class="dark-button" data-action="${s.basement.unlocked?'basement-visit':'basement-buy'}">${s.basement.unlocked?(visiting?'Back to the lounge':'Visit basement'):`Unlock basement · ${price(BASEMENT_PRICE)}`}</button></div></article>`;}

class LoungeRenderer{
 constructor(canvas){
  this.canvas=canvas;this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-8,8,6,-6,.1,60);this.gl=new T.WebGLRenderer({canvas,antialias:true,alpha:true});this.gl.outputColorSpace=T.SRGBColorSpace;this.gl.toneMapping=T.ACESFilmicToneMapping;this.gl.toneMappingExposure=1.18;this.gl.shadowMap.enabled=true;this.gl.shadowMap.type=T.PCFSoftShadowMap;
  this.scene.add(new T.HemisphereLight('#fff8e7','#bda1cb',2.4));const sun=new T.DirectionalLight('#fff0d3',3.4);sun.position.set(-3,15,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16});sun.shadow.normalBias=.04;this.scene.add(sun);
  box(this.scene,'#eed7b9',6,-.2,5,12.2,.4,10.2);for(let x=0;x<12;x+=2)for(let z=0;z<10;z+=2)box(this.scene,(x+z)%4?'#ffe0ac':'#fff0d4',x+1,.015,z+1,1.985,.04,1.985);
  box(this.scene,'#caaddd',6,.55,0,12.2,1.1,.2);box(this.scene,'#caaddd',0,.55,5,.2,1.1,10.2);box(this.scene,'#ffc04b',6,1.13,0,12.3,.1,.26);box(this.scene,'#ffc04b',0,1.13,5,.26,.1,10.3);
  box(this.scene,'#ccace7',6,.057,4.5,6.2,.04,6.6);box(this.scene,'#ebdafa',6,.08,4.5,5.8,.02,6.2);lettering(this.scene,'THE DOWNSTAIRS CLUB',6,1.8,.1,4.7,'#754996','#fff2d2');
  this.objects=new Map();this.known=null;this.last=0;this.lost=false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;});canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.last=0;});
  canvas.dfpDiagnostics=()=>({furniture:[...this.objects].filter(([id])=>id!=='system').map(([id,o])=>({id,building:o.age<.6})),security:this.objects.has('system'),calls:this.gl.info.render.calls});
 }
 object(id){
  const def=FURNITURE.find(p=>p.id===id),g=group(this.scene,def?.x??(id==='computer'?2.2:10),.0,def?.y??(id==='computer'?7.5:1.8));
  if(id==='computer'){
   box(g,'#76528f',0,1.05,0,2.7,.23,1.5);box(g,'#f1cb94',0,1.2,0,2.85,.12,1.6);for(const x of [-1.05,1.05])for(const z of [-.52,.52])box(g,'#594463',x,.52,z,.21,1.02,.21);
   box(g,'#244653',0,1.31,-.22,.95,.12,.63);box(g,'#45bdc4',0,1.39,-.22,.83,.13,.53);box(g,'#244653',0,1.68,-.28,.29,.65,.24);box(g,'#56cfd0',0,1.7,-.15,.22,.61,.12);
   box(g,'#244653',0,2.19,-.28,2.11,1.47,.39);box(g,'#4fced0',0,2.22,-.065,1.95,1.3,.12);box(g,'#244653',0,2.24,.012,1.7,1.03,.04);box(g,'#d2f0ff',0,2.24,.04,1.57,.89,.025);
   for(const [i,col] of ['#f7d774','#fffae8','#b5a0e9'].entries())box(g,col,(i-1)*.45,2.24,.065,.36,.36,.025);ball(g,'#ecfa92',.77,1.7,.08,.08,.08,.04);
   box(g,'#244653',-.1,1.29,.45,1.6,.09,.43);box(g,'#85dad9',-.1,1.35,.45,1.5,.04,.36);for(let x=0;x<8;x++)for(let z=0;z<2;z++)box(g,'#ecf8ef',-.72+x*.17,1.38,.36+z*.16,.11,.035,.1);ball(g,'#55cbd1',1,1.34,.46,.26,.16,.38);
  }else if(id==='tv'){
   box(g,'#875ab1',0,.48,0,3.4,.9,.9);box(g,'#fff0d0',0,.96,0,3.55,.1,1.0);box(g,'#594067',0,1.7,-.02,2.8,1.5,.22);box(g,'#b8dbd3',0,1.7,.11,2.5,1.23,.045);lettering(g,'PIXEL TV',0,1.72,.15,1.5,'#b6ffb5','#496b77');cylinder(g,'#ffb440',1.2,1.09,.23,.13,.05);
  }else if(id==='couch'){
   box(g,'#784eaa',0,.45,0,3.7,.65,1.6);box(g,'#a879ce',0,1.0,.65,3.7,1.05,.4);for(const x of [-1.75,1.75])box(g,'#9566bf',x,.88,0,.42,.95,1.85);
   for(const x of [-1.05,0,1.05])box(g,'#c099e1',x,.84,-.17,1,.29,1.2);for(const x of [-1.4,1.4])ball(g,'#ffcb61',x,1.1,.22,.6,.6,.22);
   for(const x of [-1.4,1.4])for(const z of [-.5,.5])cylinder(g,'#63405f',x,.2,z,.15,.36);
  }else if(id.startsWith('plant')){
   cylinder(g,'#ec9e63',0,.35,0,.85,.7);cylinder(g,'#fff0c7',0,.71,0,.9,.12);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=ball(g,i%2?'#85b77f':'#619574',Math.cos(a)*.22,1.02+(i%2)*.25,Math.sin(a)*.22,.28,.85,.32);leaf.rotation.z=Math.cos(a)*.4;}
  }else{box(g,'#74539a',0,.7,0,1,.95,.7);box(g,'#84edac',0,1.22,0,.78,.08,.48);lettering(g,'SECURE',0,.8,.36,.8,'#cbffd7','#74539a');}
  return g;
 }
 draw(s){
  if(this.lost)return;const b=this.canvas.getBoundingClientRect();if(!b.width||!b.height)return;const now=performance.now(),dt=this.last?Math.min(.1,(now-this.last)/1000):0;this.last=now;
  const ratio=s.settings.reducedEffects?1:Math.min(1.5,devicePixelRatio||1);if(this.width!==b.width||this.height!==b.height||ratio!==this.gl.getPixelRatio()){this.width=b.width;this.height=b.height;this.gl.setPixelRatio(ratio);this.gl.setSize(b.width,b.height,false);}this.gl.shadowMap.enabled=!s.settings.reducedEffects;
  const owned={...s.basement.furniture,system:s.basement.security.owned,computer:s.basement.computer.owned};for(const [id,yes]of Object.entries(owned))if(yes&&!this.objects.has(id)){this.objects.set(id,{mesh:this.object(id),age:this.known?0:1});}this.known=owned;
  for(const o of this.objects.values()){o.age+=dt;const t=Math.min(1,o.age/.6),rise=s.settings.reducedMotion?1:1-(1-t)**3;const scale=s.settings.reducedMotion?1:.8+.2*rise+.035*Math.sin(t*Math.PI);o.mesh.scale.setScalar(scale);o.mesh.position.y=-.25*(1-rise);}
  if(this.look!==s.outfit){if(this.actor){this.scene.remove(this.actor.root);this.actor.contact.material.dispose();}this.actor=character(OUTFITS.find(o=>o.id===s.outfit));this.actor.root.position.set(8.8,0,8.4);this.actor.rig.rotation.y=-2.3;this.scene.add(this.actor.root);this.look=s.outfit;}
  this.actor.torso.scale.y=s.settings.reducedMotion?1:1+Math.sin(now*.0018)*.012;
  const aspect=b.width/b.height,w=Math.max(15,11.7*aspect);Object.assign(this.camera,{left:-w/2,right:w/2,top:w/aspect/2,bottom:-w/aspect/2});this.camera.position.set(17,16,20);this.camera.lookAt(6,.45,4.5);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();this.gl.render(this.scene,this.camera);
 }
 project(x,z,y=0){const p=new T.Vector3(x,y,z).project(this.camera),r=this.canvas.getBoundingClientRect();return{x:(p.x*.5+.5)*r.width,y:(-.5*p.y+.5)*r.height};}
}

export class BasementView{
 constructor(s,{purchase,save,notify,watchAllowed}){
  this.state=s;this.purchase=purchase;this.save=save;this.notify=notify;this.watchAllowed=watchAllowed;this.monitoring=false;this.focused=true;this.people=new Map();
  this.view=document.createElement('section');this.view.id='basement-view';this.view.hidden=true;this.view.innerHTML=`<div class="basement-heading"><div><span class="eyebrow">B1 · YOUR LITTLE HIDEAWAY</span><h1>The Basement.</h1><p>Make yourself comfortable. Keep an eye upstairs.</p></div><button class="outline-button" data-action="elevator">Elevator ↑</button></div><div class="basement-layout"><div class="lounge-scene"><canvas id="lounge-canvas" aria-label="3D basement lounge"></canvas><span id="lounge-tv" class="small-button">TV</span><button id="lounge-computer" class="small-button" data-action="basement-computer">Open computer</button></div><div class="basement-shop"><div id="furniture-shop"></div><section class="computer-purchase"><span class="eyebrow">YOUR DOWNSTAIRS DESKTOP</span><h2>Pixel Desk computer</h2><p>Security, customer mail and a little play time.</p><button class="computer-button" id="computer-buy" data-action="basement-computer-buy">Buy computer · $100</button><p id="computer-hint"></p></section></div></div>`;document.querySelector('#main').append(this.view);
  this.overlay=document.createElement('section');this.overlay.className='security-overlay';this.overlay.hidden=true;this.overlay.setAttribute('aria-label','Live security monitoring');this.overlay.innerHTML=`<header class="security-header"><div><span class="eyebrow">● DFP SECURITY · LIVE</span><h2 id="security-floor"></h2></div><strong id="security-balance"></strong><div class="security-returns"><button class="outline-button" data-action="security-exit" aria-label="Back to Computer">Back to Computer</button><button class="outline-button" data-action="security-dfp">Back to DFP</button></div></header><div class="security-info"><strong id="security-status"></strong><span>Catch +$15 · Wrong person / escape −$5</span></div><div class="security-feed"><canvas id="security-canvas" tabindex="0" aria-label="Live security footage. Click or tap the person stealing. Use arrow keys to pan."></canvas><div id="security-targets"></div><span class="camera-corner">CAM <b id="camera-number">1</b> · LIVE</span></div><div class="security-feedback" id="security-feedback" role="status" aria-live="polite">Look for a person taking goods and hiding them in a sack.</div><footer class="security-controls"><div><button data-action="security-camera" data-id="work" aria-pressed="true">Workstations</button><button data-action="security-camera" data-id="service" aria-pressed="false">Service</button><button data-action="security-camera" data-id="dining" aria-pressed="false">Dining</button></div><div><button data-action="security-zoom" data-id="out" aria-label="Zoom out">−</button><button data-action="security-zoom" data-id="in" aria-label="Zoom in">+</button></div></footer>`;document.querySelector('#app').append(this.overlay);
  this.computer=new ComputerView(s,{purchase,save,openSecurity:()=>this.open(),closeSecurity:()=>this.close(false),onClose:()=>this.view.querySelector('#lounge-computer').focus({preventScroll:true})});
  this.overlay.addEventListener('click',e=>{let b=e.target.closest('[data-person]');if(!b)return;
   // Enlarged phone targets can overlap; pick the nearest visible body center.
   if(e.detail){let closest=Infinity;for(const candidate of this.people.values()){if(candidate.disabled)continue;const rect=candidate.getBoundingClientRect(),d=Math.hypot(e.clientX-rect.x-rect.width/2,e.clientY-rect.y-rect.height/2);if(d<closest){closest=d;b=candidate;}}}
   const result=securitySelect(s,{roundId:Number(b.dataset.round),person:b.dataset.person,watching:this.watching});if(result.ok){this.save();this.update();}});
  window.addEventListener('blur',()=>{this.focused=false;if(this.monitoring)this.save();});window.addEventListener('focus',()=>{this.focused=true;});
  window.addEventListener('keydown',e=>{if(!this.monitoring)return;if(e.key==='Escape'){e.preventDefault();this.close();return;}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();const f=this.feed.securityFocus;if(e.key==='ArrowLeft')f.x=Math.max(3,f.x-1);if(e.key==='ArrowRight')f.x=Math.min(25,f.x+1);if(e.key==='ArrowUp')f.y=Math.max(2,f.y-1);if(e.key==='ArrowDown')f.y=Math.min(15,f.y+1);if(e.key==='+')this.zoom(1);if(e.key==='-')this.zoom(-1);}});
 }
 get watching(){return this.monitoring&&this.focused&&this.watchAllowed();}
 show(visible){this.view.hidden=!visible;if(!visible){this.computer.close();this.close(false);}else{this.lounge??=new LoungeRenderer(this.view.querySelector('canvas'));this.update();}}
 update(){
  const s=this.state,b=s.basement,key=JSON.stringify([b.furniture,b.security.owned,b.computer.owned]);this.computer.update();
  if(this.shopKey!==key){this.shopKey=key;this.view.querySelector('#furniture-shop').innerHTML=FURNITURE.map(p=>`<button class="furniture-offer ${b.furniture[p.id]?'owned':''}" data-action="basement-furniture" data-id="${p.id}" ${b.furniture[p.id]?'disabled':''}><span>${p.name}</span><b>${b.furniture[p.id]?'✓ Owned':price(p.cost)}</b></button>`).join('');const buy=this.view.querySelector('#computer-buy');buy.disabled=b.computer.owned;buy.textContent=b.computer.owned?'✓ Computer owned':`Buy computer · ${price(COMPUTER_PRICE)}`;this.view.querySelector('#computer-hint').textContent=b.computer.owned?'Tap the turquoise computer to open your desktop.':b.security.owned?'Your security system is already owned. Buy the computer to access its cameras.':'A permanent desk and computer for your lounge.';const tv=this.view.querySelector('#lounge-tv');tv.hidden=!b.furniture.tv;tv.textContent='TV · Lounge furnishing';this.view.querySelector('#lounge-computer').hidden=!b.computer.owned;}
  if(this.monitoring){const sec=b.security,r=sec.round;document.querySelector('#security-floor').textContent=`${highestFloor(s)+1} · ${FLOORS[highestFloor(s)].name}`;document.querySelector('#security-balance').textContent=price(s.money);const status=document.querySelector('#security-status');status.textContent=!this.watching?'Paused · your timer is safe':r?.phase==='active'?`Suspicious activity · ${Math.ceil(r.remaining)}s`:'All quiet · watching for unusual activity';status.dataset.phase=r?.phase||'waiting';
   if(sec.result&&this.resultId!==sec.result.id){this.resultId=sec.result.id;const msg={catches:'Caught! +$15',escapes:'Robber escaped. −$5',wrong:'That person was innocent. −$5'}[sec.result.kind];document.querySelector('#security-feedback').textContent=msg;document.querySelector('#security-feedback').dataset.kind=sec.result.kind;}
  }
 }
 open(){if(!this.state.basement.computer.owned||!this.state.basement.security.owned){this.notify('Buy all four furnishings, then install security.');return;}ensureSecurityRound(this.state);this.monitoring=true;this.overlay.hidden=false;this.overlay.classList.remove('tv-on');void this.overlay.offsetWidth;this.overlay.classList.add('tv-on');this.feed??=new Renderer(this.overlay.querySelector('canvas'),{security:true});this.feed.last=0;this.resultId=this.state.basement.security.result?.id;document.querySelector('#security-feedback').textContent='Look for reaching, stolen goods and a dark sack. Tap the person stealing.';this.save();this.update();this.overlay.querySelector('[data-action="security-exit"]').focus({preventScroll:true});return true;}
 close(toComputer=true){if(!this.monitoring)return;this.monitoring=false;this.overlay.hidden=true;this.save();if(toComputer&&this.computer.opened)this.computer.navigate('desktop');}
 zoom(direction){this.feed.securityZoom=Math.max(.85,Math.min(1.65,this.feed.securityZoom+direction*.2));}
 action(action,id){
  if(action==='basement-furniture')this.purchase({type:'furniture',id});
  if(action==='basement-computer-buy')this.purchase({type:'computer'});
  if(action==='basement-computer')this.computer.open();
  if(action==='security-dfp')this.computer.close();
  if(action==='security-exit')this.close();
  if(action==='security-zoom')this.zoom(id==='in'?1:-1);
  if(action==='security-camera'){const positions={work:{x:6,y:3.5},service:{x:8,y:10},dining:{x:20,y:8}};this.feed.securityFocus={...positions[id]};this.overlay.querySelectorAll('[data-action="security-camera"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===id)));document.querySelector('#camera-number').textContent=({work:1,service:2,dining:3})[id];}
  this.update();
 }
 draw(){
  const s=this.state;if(!this.view.hidden&&!this.monitoring&&!this.computer.opened){this.lounge.draw(s);const p=this.lounge.project(6,1.7,2.4),tv=this.view.querySelector('#lounge-tv');tv.style.left=`${p.x}px`;tv.style.top=`${p.y}px`;const cp=this.lounge.project(2.2,7.5,2.65),button=this.view.querySelector('#lounge-computer');button.style.left=`${cp.x}px`;button.style.top=`${cp.y}px`;}this.computer.update();
  if(!this.monitoring)return;const floor=highestFloor(s),r=s.basement.security.round,projection={...s,floor,player:{...s.player,action:'',moving:false,x:7.5,y:5},securityRound:r};
  this.feed.draw(projection,s.time);const visible=new Set();
  for(const [key,m]of this.feed.actors){const p=this.feed.p(m.root.position.x,m.root.position.z,1.15);if(p.x<20||p.y<32||p.x>this.feed.width-20||p.y>this.feed.height-32)continue;visible.add(key);let b=this.people.get(key);if(!b){b=document.createElement('button');b.className='security-person';b.dataset.person=key;b.setAttribute('aria-label',key==='robber'?'Person reaching for goods with a sack':key.startsWith('staff')?'Employee in the security footage':'Guest in the security footage');this.overlay.querySelector('#security-targets').append(b);this.people.set(key,b);}b.dataset.round=r?.id;b.style.left=`${p.x}px`;b.style.top=`${p.y}px`;b.disabled=!!r?.selected.includes(key);}
  for(const [key,b]of this.people)if(!visible.has(key)){b.remove();this.people.delete(key);}this.update();
 }
}
