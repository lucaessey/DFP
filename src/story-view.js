import './story.css';
import {StoryRenderer} from './story-renderer.js';
import {STORY_CHAPTERS,STORY_PLACES,STORY_OBJECTIVES,RECIPES,INGREDIENTS,EVENT_SPOTS,eventRules} from './story-data.js';
import {storyObjective,currentStoryActor,storyScene,storyVisit,startStoryEvent,storyEventAction,continueStory,storyTick,pauseStory,resumeStory,leaveStoryComputer} from './story.js';
import {storyDistance,storyWalkable} from './story-navigation.js';

const button=(action,label,id='',disabled=false)=>`<button data-story="${action}" data-id="${id}" ${disabled?'disabled':''}>${label}</button>`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export class StoryView{
 constructor(state,{save,regular,computer,allowed}){
  Object.assign(this,{state,save,regular,computer,allowed,opened:false,modal:null,target:null,lastSave:0,lastUI:0,keys:new Set(),joy:{x:0,y:0},focused:true});
  this.root=document.createElement('section');this.root.id='story-view';this.root.hidden=true;this.root.setAttribute('aria-label','Story Mode');
  this.root.innerHTML=`<header class="story-header"><div><span class="story-kicker">DFP · NEIGHBORHOOD STORIES</span><h2 id="story-chapter"></h2></div><div>${button('pause','Pause')}${button('regular','Return to Regular Play')}</div></header><div class="story-objective"><div><b id="story-objective"></b><small id="story-score"></small></div><div>${button('guide','Go to objective')}${button('home','DFP / Inbox')}</div></div><div class="story-scene"><canvas id="story-canvas" tabindex="0" aria-label="3D neighborhood. Move with WASD, arrows or joystick. E to interact; F to throw; Space to dodge."></canvas><div id="story-markers"></div><div id="story-message" role="status" aria-live="polite"></div><div id="story-modal" hidden></div></div><footer class="story-controls"><div id="story-joystick" aria-label="Story movement joystick" role="slider" tabindex="0"><span></span><small>MOVE</small></div><div class="story-actions"><div id="story-route"></div><div id="story-context"></div><small id="story-inventory"></small></div></footer>`;
  document.querySelector('#app').append(this.root);this.canvas=this.root.querySelector('canvas');this.dialog=this.root.querySelector('#story-modal');
  this.root.addEventListener('click',e=>{const b=e.target.closest('[data-story]');if(b&&!b.disabled)this.action(b.dataset.story,b.dataset.id);});
  this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0||this.modal||!this.allowed())return;this.canvas.focus({preventScroll:true});const p=this.renderer.pick(e.clientX,e.clientY);if(!p)return;if(this.state.story.event?.type==='fight'){const e=this.state.story.event;e.aim={x:Math.max(.5,Math.min(19.5,p.x)),y:Math.max(.5,Math.min(15.5,p.y))};this.save();}else if(storyWalkable(storyScene(this.state.story),p.x,p.y)){this.target=p;this.pointer=e.pointerId;this.canvas.setPointerCapture(e.pointerId);}});
  this.canvas.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer){const p=this.renderer.pick(e.clientX,e.clientY);if(p&&storyWalkable(storyScene(this.state.story),p.x,p.y))this.target=p;}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(type,e=>{if(e.pointerId===this.pointer){this.pointer=null;this.stop();}});
  const joy=this.root.querySelector('#story-joystick');const move=e=>{const r=joy.getBoundingClientRect(),x=e.clientX-r.x-r.width/2,y=e.clientY-r.y-r.height/2,n=Math.max(30,Math.hypot(x,y));this.joy={x:x/n,y:y/n};joy.querySelector('span').style.transform=`translate(${x/n*24}px,${y/n*24}px)`;};
  joy.addEventListener('pointerdown',e=>{if(this.modal||!this.allowed()||this.joyPointer!==undefined)return;this.stop();this.joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);move(e);});joy.addEventListener('pointermove',e=>{if(e.pointerId===this.joyPointer)move(e);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{if(e.pointerId===this.joyPointer){this.joyPointer=undefined;this.stop();}});
  window.addEventListener('keydown',e=>{if(!this.opened||!this.allowed()||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(k==='escape'){e.preventDefault();this.action(this.modal==='pause'?'unpause':'pause');return;}if(this.modal)return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();this.keys.add(k);this.target=null;}if(!e.repeat&&['e','f',' '].includes(k)){e.preventDefault();this.action(k==='e'?'interact':k==='f'?'throw':'dodge');}});
  window.addEventListener('keyup',e=>{this.keys.delete(e.key.toLowerCase());});
  window.addEventListener('blur',()=>{this.focused=false;this.stop();if(this.opened)this.save();});window.addEventListener('focus',()=>{this.focused=true;});
  document.addEventListener('visibilitychange',()=>{this.stop();if(this.opened)this.save();});
 }
 open(){if(!this.state.story.started)return;this.opened=true;this.root.hidden=false;this.renderer??=new StoryRenderer(this.canvas);this.stop();this.modal=null;this.dialog.hidden=true;this.update();if(this.state.story.restart)this.showModal('restart');else if(this.state.story.event?.status!=='running'&&this.state.story.event)this.showModal('result');this.canvas.focus({preventScroll:true});}
 hide(){this.opened=false;this.root.hidden=true;this.stop();}
 stop(){this.target=null;this.keys.clear();this.joy={x:0,y:0};this.root.querySelector('#story-joystick span').style.transform='';const a=currentStoryActor(this.state.story);a.moving=false;a.path=[];a.pathKey='';}
 tell(message){if(message)this.root.querySelector('#story-message').textContent=message;}
 showModal(kind,body){
  this.stop();this.modal=kind;const st=this.state.story,e=st.event,o=e?STORY_OBJECTIVES.find(o=>o.id===e.id):storyObjective(st);this.dialog.hidden=false;
  let content='';
  if(kind==='brief'){const r=eventRules(o);content=`<span class="story-kicker">FREE SUPPLIES · NO UPGRADES REQUIRED</span><h2>${o.title}</h2><p>${r.text}</p><p><b>${r.limit} seconds.</b> ${r.tip}</p><p>Use WASD / arrows or the joystick. Station buttons walk you there; use the action button when nearby. Pausing stops the timer.</p>${button('begin','Begin competition')}${button('close-modal','Keep exploring')}`;}
  if(kind==='pause')content=`<h2>A little breather.</h2><p>Story timers and regular businesses are paused. Your progress is safe.</p>${button('unpause','Continue Story')}${button('regular','Pause Story / Return to Regular Play')}`;
  if(kind==='dialogue')content=`<span class="story-kicker">NEIGHBORHOOD CONVERSATION</span><h2>A clue worth keeping.</h2><p>${escape(body)}</p>${button('close-modal','Got it · Continue')}`;
  if(kind==='restart')content=`<h2>Your competition was interrupted.</h2><p>Restart ${o.title} for free. All ${st.wins.length} earlier victories and neighborhood clues are saved.</p>${button('begin','Restart event · Free')}${button('regular','Return to Regular Play')}`;
  if(kind==='result'){
   const won=e.status==='won',r=eventRules(o),finalWins=st.wins.filter(w=>w.id.startsWith('final-'));content=`<span class="story-kicker">${won?'VICTORY SAVED':'FREE RETRY · NOTHING LOST'}</span><h2>${st.complete?'The neighborhood comes home!':won?'A very crispy victory.':'Another round? You’ve got this.'}</h2><p>${escape(e.result.reason)}</p><div class="story-results"><b>YOU ${e.type==='race'?`${e.result.elapsed.toFixed(1)}s`:e.score}</b><b>RIVAL ${e.type==='race'?`${r.rival}s`:e.rival}</b><span>${st.wins.length} / 9 victories</span></div>${st.complete?`<p>Romaine lowers the salad tongs. “All right, DFP. Your crunch has character.” Pip waves a napkin flag. “There’s room for both kitchens!” The crowd heads back to DFP, laughing and making lunch plans.</p><h3>Final series · ${finalWins.length} / 4 wins</h3><ul>${finalWins.map(w=>`<li>${STORY_OBJECTIVES.find(o=>o.id===w.id).title}: ${w.id==='final-race'?w.elapsed.toFixed(1)+'s':w.score+' points'} · WON</li>`).join('')}</ul><p>A concluding email is waiting in Inbox. Your regular customers are returning.</p>`:`<p>${r.tip}</p>`}${button(won?'continue':'begin',st.complete?'Celebrate · Return to DFP':won?'Continue Story':'Retry · Free')}${button('regular','Return to Regular Play')}`;
  }
  this.dialog.innerHTML=`<article class="story-dialog" role="dialog" aria-modal="true">${content}</article>`;this.dialog.querySelector('button')?.focus({preventScroll:true});this.save();
 }
 nearest(){const st=this.state.story,a=currentStoryActor(st);let entries=Object.entries(STORY_PLACES);if(st.event){const type=st.event.type;entries=Object.entries(EVENT_SPOTS).filter(([id])=>type==='cook'?['batter','pixel','leaf','berry','prep','serve'].includes(id):type==='serve'?id==='pantry'||id.startsWith('table'):type==='race'?id===`checkpoint${st.event.checkpoint}`:false);}return entries.map(([id,p])=>({id,...p,distance:storyDistance(a,p)})).sort((a,b)=>a.distance-b.distance)[0];}
 action(action,id){
  if(!this.allowed())return;const s=this.state,st=s.story,e=st.event;
  if(action==='regular'){pauseStory(s);this.save();this.hide();this.regular();return;}
  if(action==='pause'){this.showModal('pause');return;}
  if(action==='unpause'||action==='close-modal'){this.modal=null;this.dialog.hidden=true;this.stop();this.canvas.focus({preventScroll:true});return;}
  if(action==='begin'){const result=startStoryEvent(s);if(result.ok){this.modal=null;this.dialog.hidden=true;this.stop();this.tell('Go! Free supplies, fair rules, all yours.');}else this.tell(result.message);this.save();this.update();return;}
  if(action==='continue'){continueStory(s);this.save();if(st.complete){this.hide();this.regular();return;}this.modal=null;this.dialog.hidden=true;this.stop();this.update();return;}
  if(this.modal)return;
  if(action==='guide'||action==='home'||action==='walk'){
   const p=action==='home'?(e?null:STORY_PLACES.dfp):action==='guide'?(e?null:STORY_PLACES[storyObjective(st)?.place]):EVENT_SPOTS[id];
   if(p){this.stop();this.target=p;this.tell(`Walking to ${p.name}. Press E or the action button when you arrive.`);}return;
  }
  if(action==='aim'){if(e?.type==='fight'){e.aim={x:e.rivalActor.x,y:e.rivalActor.y};this.tell('Aim set at the rival. Throw now or lead with a tap.');}return;}
  if(action==='interact'){
   const near=this.nearest();if(!near||near.distance>1.65){this.tell('Walk closer to the marked location.');return;}
   if(!e){const o=storyObjective(st),result=storyVisit(s,near.id);if(result.ok&&near.id==='dfp'){this.save();this.hide();this.computer();return;}if(result.ok&&o?.kind==='event'&&near.id==='arena')this.showModal('brief');else if(result.message)this.showModal('dialogue',result.message);}
   else if(e.type==='cook'&&['batter','pixel','leaf','berry'].includes(near.id))this.tell(storyEventAction(s,'ingredient',near.id).message);
   else if(e.type==='cook'&&near.id==='serve')this.tell(storyEventAction(s,'deliver').message);
   else if(e.type==='serve'&&near.id.startsWith('table'))this.tell(storyEventAction(s,'table',near.id.slice(5)).message);
   else this.tell('Choose the recipe, meal, or parcel below.');
  }else this.tell(storyEventAction(s,action,id).message);
  this.save();this.update();if(st.event&&st.event.status!=='running')this.showModal('result');
 }
 update(){
  if(!this.opened)return;const st=this.state.story,e=st.event,o=storyObjective(st),def=e?STORY_OBJECTIVES.find(o=>o.id===e.id):o,near=this.nearest();
  this.root.querySelector('#story-chapter').textContent=st.complete?'The Crunch Cup · Complete':`${(def?.chapter??0)+1} / 5 · ${STORY_CHAPTERS[def?.chapter??0]}`;
  this.root.querySelector('#story-objective').textContent=e?def.title:o?.title||'The neighborhood is yours.';
  this.root.querySelector('#story-score').textContent=e?`${Math.max(0,Math.ceil(eventRules(def).limit-e.elapsed-e.penalty))}s · You ${e.score} / Rival ${e.type==='race'?`${eventRules(def).rival}s`:e.rival} · ${e.type==='fight'?`${4-e.rival} splats left`:e.type==='race'?`+${e.penalty}s penalties`:''}`:`Next: ${STORY_PLACES[o?.place]?.name||'DFP'} · ${st.wins.length} / 9 wins · Businesses paused`;
  this.root.querySelector('[data-story="guide"]').hidden=!!e;this.root.querySelector('[data-story="home"]').hidden=!!e;
  let context='',inventory='',routes='';
  if(!e){context=button('interact',near?.id==='dfp'?'Enter DFP / Computer':near?.id==='arena'&&o?.kind==='event'?'Competition briefing':`Talk · ${near?.name||'neighbor'}`,'',!near||near.distance>1.65);inventory='WASD / arrows · E interact · hold the floor to walk';}
  else{
   const spots=Object.entries(EVENT_SPOTS).filter(([id])=>e.type==='cook'?['batter','pixel','leaf','berry','prep','serve'].includes(id):e.type==='serve'?id==='pantry'||id.startsWith('table'):e.type==='race'?id===`checkpoint${e.checkpoint}`:false);routes=spots.map(([id,p])=>button('walk',p.name,id)).join('');
   if(e.type==='fight'){context=button('aim','Aim at rival')+button('throw','Throw · F','',e.throwCooldown>0||e.stun>0)+button('dodge',e.dodgeCooldown>0?'Dodge charging':'Dodge · Space','',e.dodgeCooldown>0);inventory=`Land ${eventRules(def).target} splats. Tap arena to aim. Orange ring = incoming!`;}
   else if(near?.distance<1.65){
    if(e.type==='cook'&&near.id==='prep')context=RECIPES.map(r=>button('prepare',r.name,r.id,!!e.cooking||!!e.dish)).join('');
    else if(e.type==='serve'&&near.id==='pantry')context=RECIPES.map(r=>button('meal',r.name,r.id,!!e.dish)).join('');
    else if(e.type==='race')context=[0,1,2].map(i=>button('parcel',`${EVENT_SPOTS[`checkpoint${i}`].name} parcel`,i)).join('');
    else context=button('interact',e.type==='serve'?e.tables[Number(near.id.slice(5))]?.state==='waiting'?'Seat guest':e.tables[Number(near.id.slice(5))]?.state==='dirty'?'Clean table':e.tables[Number(near.id.slice(5))]?.state==='eating'?'Eating · please wait':'Serve order':near.id==='serve'?'Deliver dish':`Collect ${near.name}`);
   }else context='<span class="story-walk-hint">Walk to a station to interact.</span>';
   if(e.type==='cook'){const r=RECIPES[e.orders[Math.min(e.delivered,2)]];inventory=`Order ${Math.min(3,e.delivered+1)}/3: ${r.name} = ${r.ingredients.map(i=>INGREDIENTS[i]).join(' + ')}. Tray: ${e.dish?RECIPES.find(r=>r.id===e.dish).name:e.cooking?'Cooking…':e.inventory.map(i=>INGREDIENTS[i]).join(', ')||'empty'}`;context+=button('clear','Clear tray');}
   if(e.type==='serve'){inventory=e.tables.map((t,i)=>`${EVENT_SPOTS[`table${i}`].name}: ${RECIPES[t.recipe].name} (${t.state})`).join(' · ');inventory+=` · Carrying: ${e.dish?RECIPES.find(r=>r.id===e.dish).name:'nothing'}`;context+=button('clear','Clear tray');}
   if(e.type==='race')inventory=`Next: ${EVENT_SPOTS[`checkpoint${Math.min(2,e.checkpoint)}`].name}. Carts add 2 seconds. Complete all 3; ties retry.`;
  }
  for(const [id,content]of [['story-context',context],['story-route',routes]]){const el=this.root.querySelector(`#${id}`);if(el.innerHTML!==content)el.innerHTML=content;}
  this.root.querySelector('#story-inventory').textContent=inventory;
 }
 tick(dt){
  if(!this.opened)return;const st=this.state.story;
  const blocked=!this.allowed()||!this.focused||document.hidden||!!this.modal;
  storyTick(this.state,Math.min(.1,Math.max(.0001,dt)),{paused:blocked,x:this.joy.x+(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0),y:this.joy.y+(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0),target:this.target});
  if(this.target&&storyDistance(currentStoryActor(st),this.target)<.15)this.target=null;
  if(st.event&&st.event.status!=='running'&&!this.modal)this.showModal('result');
  this.renderer.draw(this.state,blocked?0:Math.min(dt,.1));
  this.lastUI+=dt;if(this.lastUI>.1){this.update();this.lastUI=0;}this.lastSave+=dt;if(this.lastSave>2){this.save();this.lastSave=0;}
  const target=st.event?.type==='fight'?{...st.event.rivalActor,name:'Romaine · Aim + Throw'}:st.event?.type==='race'?EVENT_SPOTS[`checkpoint${Math.min(2,st.event.checkpoint)}`]:!st.event?STORY_PLACES[storyObjective(st)?.place]:null;
  const layer=this.root.querySelector('#story-markers');if(target){const p=this.renderer.project(target,2),r=this.canvas.getBoundingClientRect();layer.textContent=target.name;layer.style.left=`${Math.max(70,Math.min(r.width-70,p.x))}px`;layer.style.top=`${Math.max(16,Math.min(r.height-40,p.y))}px`;layer.hidden=false;}else layer.hidden=true;
 }
}
