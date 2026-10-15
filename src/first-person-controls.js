import {firstPerson,turnView} from './first-person.js';
import './first-person.css';

export class FirstPersonControls{
 constructor(canvas,state,{active,stop,onLook}){
  Object.assign(this,{canvas,state,active,stop,onLook,pointer:null,wasActive:false});
  this.layer=document.createElement('div');this.layer.className='fp-controls';this.layer.hidden=true;
  this.layer.innerHTML='<div class="fp-look-zone" aria-label="Drag to look around"></div><span class="fp-crosshair" aria-hidden="true">·</span><button type="button" class="fp-look-button">Click to look around</button><span class="fp-look-hint">Drag right side to look</span><span class="fp-task"></span><span class="fp-carry" aria-live="off"></span>';
  canvas.parentElement.append(this.layer);this.zone=this.layer.querySelector('.fp-look-zone');this.button=this.layer.querySelector('button');
  this.button.addEventListener('click',()=>this.lock());
  canvas.addEventListener('click',()=>{if(this.enabled()&&!matchMedia('(pointer:coarse)').matches)this.lock();});
  const drag=e=>{if(!this.enabled()||this.pointer!==null||e.button!==0)return;e.preventDefault();this.pointer=e.pointerId;this.last={x:e.clientX,y:e.clientY};this.zone.setPointerCapture(e.pointerId);};
  this.zone.addEventListener('pointerdown',drag);
  this.zone.addEventListener('pointermove',e=>{if(e.pointerId!==this.pointer||!this.enabled()||document.pointerLockElement)return;this.look(e.clientX-this.last.x,e.clientY-this.last.y);this.last={x:e.clientX,y:e.clientY};});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.zone.addEventListener(type,e=>{if(e.pointerId===this.pointer)this.pointer=null;});
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&this.enabled())this.look(e.movementX,e.movementY);});
  document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&this.locked){this.stop();}this.locked=document.pointerLockElement===canvas;this.button.textContent=this.locked?'Esc · Release mouse':'Click to look around';});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.pointerLockElement===canvas){e.preventDefault();e.stopImmediatePropagation();this.release();this.stop();}},true);
  window.addEventListener('blur',()=>{this.release();this.stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.release();this.stop();}});
  // Stop before a menu button acts; do not steal its click or touch gesture.
  document.addEventListener('pointerdown',e=>{if(this.enabled()&&e.target.closest('button,input,textarea,select,a')&&!this.layer.contains(e.target)){this.release();this.stop();}},true);
 }
 enabled(){return firstPerson(this.state)&&this.active()&&!document.hidden;}
 look(dx,dy){turnView(this.state.view,dx,dy);this.layer.querySelector('.fp-look-hint').hidden=true;this.onLook?.();}
 async lock(){if(!this.enabled())return;this.canvas.focus({preventScroll:true});try{await this.canvas.requestPointerLock();}catch{this.button.textContent='Mouse look unavailable · drag right side';}}
 release(){this.pointer=null;if(document.pointerLockElement===this.canvas)document.exitPointerLock();}
 update(actor){const enabled=this.enabled();this.layer.hidden=!enabled;this.canvas.parentElement.classList.toggle('first-person',enabled);if(!enabled&&this.wasActive){this.release();this.stop();}this.wasActive=enabled;this.layer.querySelector('.fp-carry').textContent=actor?.bag?.length?`Carrying ×${actor.bag.length}`:'';}
}
