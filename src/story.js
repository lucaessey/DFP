import {STORY_OBJECTIVES,STORY_PLACES,STORY_EMAILS,RECIPES,EVENT_SPOTS,eventRules} from './story-data.js';
import {storyDistance,storyMove,storyFollow,storyWalkable} from './story-navigation.js';

export const storyActor=(x=6,y=20)=>({x,y,bag:[],action:'',progress:0,path:[],pathKey:'',moving:false,facing:1});
export const newStory=()=>({started:false,active:false,complete:false,index:0,clues:[],emails:[],wins:[],clock:0,actor:storyActor(),event:null,restart:null,location:'computer'});
export const storyEligible=s=>!!(s.basement?.computer?.owned&&s.basement.computer.email);
export const storyObjective=st=>STORY_OBJECTIVES[st.index]||null;
export const currentStoryActor=st=>st.event?.actor||st.actor;
export const storyScene=st=>st.event?.type||'outside';
const fail=message=>({ok:false,message}),ok=message=>({ok:true,message});
const changed=s=>{s.revision++;};
function advance(st){st.index++;}
export function startStory(s){if(!storyEligible(s))return fail('Own the basement computer and Email to start.');if(s.story.started)return resumeStory(s);Object.assign(s.story,{started:true,active:true,location:'computer',emails:['intro']});changed(s);return ok('Story started. Your businesses are safely paused.');}
export function pauseStory(s){if(!s.story.started)return fail('Start the story in Email first.');s.story.active=false;currentStoryActor(s.story).moving=false;changed(s);return ok('Regular play resumed. Story progress is saved.');}
export function resumeStory(s){if(!storyEligible(s)||!s.story.started||s.story.complete)return fail('Open Inbox to start or read your finished story.');s.story.active=true;changed(s);return ok('Story resumed.');}
export function storyVisit(s,id){
 const st=s.story,p=STORY_PLACES[id];if(!st.active||st.event||!p)return fail('Explore the neighborhood first.');
 if(storyDistance(st.actor,p)>1.65)return fail(`Walk to ${p.name} first.`);
 if(id==='dfp'){st.location='computer';changed(s);return ok('Back inside DFP. Your basement computer is ready.');}
 const o=storyObjective(st);if(o?.kind==='talk'&&o.place===id){if(!st.clues.includes(o.id))st.clues.push(o.id);advance(st);changed(s);return ok(o.body);}
 if(o?.kind==='event'&&id==='arena')return ok('The competition is ready. Read the briefing, then begin.');
 return ok(id==='rival'?'Romaine: “May the best lunch win. The arena is just down the street!”':'Your neighbors wave. Follow the gold objective marker for your next clue.');
}
export function sendChallenge(s){const st=s.story;if(!st.active||st.location!=='computer'||storyObjective(st)?.id!=='challenge')return fail('Investigate the rival, then return to your computer.');st.emails.push('challenge','reply');advance(st);changed(s);return ok('Challenge sent locally. Romaine has replied!');}
export function leaveStoryComputer(s){if(!s.story.active)return fail('Resume Story first.');s.story.location='outside';changed(s);return ok();}
export function startStoryEvent(s){
 const st=s.story,o=storyObjective(st);if(!st.active||o?.kind!=='event'||st.event?.status==='running')return fail('Complete the current objective first.');
 if(!st.restart&&(!st.event||st.event.status!=='lost')&&storyDistance(st.actor,STORY_PLACES.arena)>1.65)return fail('Walk to the Crunch Cup arena first.');
 const order=o.final?[2,0,1]:[0,1,2];
 st.event={id:o.id,type:o.type,status:'running',elapsed:0,score:0,rival:0,penalty:0,mistakes:0,actor:storyActor(10,13.5),inventory:[],dish:null,cooking:null,delivered:0,orders:order,tables:order.map(recipe=>({recipe,state:'waiting',timer:0})),checkpoint:0,stun:0,dodge:0,dodgeCooldown:0,throwCooldown:0,nextAttack:2,warning:null,projectiles:[],rivalActor:storyActor(10,4),aim:{x:10,y:4},result:null};
 st.restart=null;st.location='outside';changed(s);return ok('Free supplies ready. Good luck!');
}
function finish(s,won,reason){
 const st=s.story,e=st.event;if(!e||e.status!=='running')return;
 e.status=won?'won':'lost';e.actor.moving=false;e.result={won,reason,score:e.score,rival:e.rival,elapsed:e.elapsed+e.penalty};
 if(won&&!st.wins.some(w=>w.id===e.id)){
  st.wins.push({id:e.id,score:e.score,rival:e.rival,elapsed:e.elapsed+e.penalty});advance(st);
  if(st.index===STORY_OBJECTIVES.length){st.complete=true;if(!st.emails.includes('victory'))st.emails.push('victory');}
 }
 changed(s);
}
export function continueStory(s){const st=s.story;if(!st.event||st.event.status!=='won')return fail('Win this event to continue.');st.event=null;if(st.complete){st.active=false;st.location='computer';}changed(s);return ok(st.complete?'The neighborhood is back. DFP is open!':'Victory saved. Follow your next objective.');}
export function storyEventAction(s,action,id){
 const st=s.story,e=st.event;if(!st.active||!e||e.status!=='running')return fail('Start a competition first.');
 const rules=eventRules(STORY_OBJECTIVES.find(o=>o.id===e.id)),near=spot=>storyDistance(e.actor,EVENT_SPOTS[spot])<1.65;
 const mistake=text=>{e.mistakes++;e.score=Math.max(0,e.score-2);changed(s);return fail(text);};
 if(action==='clear'){e.inventory=[];e.dish=null;e.cooking=null;e.actor.bag=[];changed(s);return ok('Tray cleared. Free supplies are ready.');}
 if(e.type==='cook'){
  if(action==='ingredient') {if(!['batter','pixel','leaf','berry'].includes(id)||!near(id))return fail('Walk to that ingredient crate.');if(e.inventory.length>=2||e.dish||e.cooking)return fail('Carry two ingredients at a time. Clear the tray to start over.');e.inventory.push(id);e.actor.bag.push(id==='berry'?'drink':'controller');}
  else if(action==='prepare'){
   if(!near('prep'))return fail('Walk to PREP.');if(e.cooking||e.dish)return fail('Finish the dish already on your tray.');const recipe=RECIPES.find(r=>r.id===id);
   if(!recipe||e.inventory.slice().sort().join()!==recipe.ingredients.slice().sort().join())return mistake('Those ingredients do not match. Clear the tray and check the recipe card.');
   e.inventory=[];e.actor.bag=[];e.cooking={recipe:id,left:2.5};
  }else if(action==='deliver'){
   if(!near('serve'))return fail('Walk to SERVE.');if(!e.dish)return fail('Prepare a dish first.');if(e.dish!==RECIPES[e.orders[e.delivered]].id)return mistake('That is not the requested dish. Clear the tray and cook the current order.');
   e.dish=null;e.actor.bag=[];e.delivered++;e.score+=10;if(e.delivered===3)finish(s,e.score>=rules.target&&e.score>e.rival,'All three dishes delivered.');
  }else return fail('Choose an ingredient, recipe, or delivery.');
 }else if(e.type==='serve'){
  if(action==='meal'){if(!near('pantry'))return fail('Walk to Free Meals.');if(!RECIPES.some(r=>r.id===id)||e.dish)return fail('Deliver or clear your current tray first.');e.dish=id;e.actor.bag=[id];}
  else if(action==='table'){
   const i=Number(id),t=e.tables[i];if(!t||!near(`table${i}`))return fail('Walk to that guest.');
   if(t.state==='waiting')t.state='seated';
   else if(t.state==='seated'){if(!e.dish)return fail(`Bring ${RECIPES[t.recipe].name}.`);if(e.dish!==RECIPES[t.recipe].id)return mistake(`Wrong order. This guest wants ${RECIPES[t.recipe].name}.`);e.dish=null;e.actor.bag=[];t.state='eating';t.timer=4;e.score+=8;}
   else if(t.state==='eating')return fail('Let the guest finish eating before cleaning.');
   else if(t.state==='dirty'){t.state='done';e.score+=2;if(e.tables.every(t=>t.state==='done'))finish(s,e.score>=rules.target&&e.score>e.rival,'All three guests served and tables cleaned.');}
   else return fail('This guest is already finished.');
  }else return fail('Collect a meal or help a table.');
 }else if(e.type==='race'){
  if(action!=='parcel')return fail('Choose the parcel for the next destination.');
  if(!near(`checkpoint${e.checkpoint}`))return fail('Follow the next golden checkpoint.');
  if(Number(id)!==e.checkpoint){e.penalty+=2;e.mistakes++;changed(s);return fail('Wrong address: +2 seconds. Try the matching parcel.');}
  e.checkpoint++;e.score++;if(e.checkpoint===3){e.rival=rules.rival;finish(s,e.elapsed+e.penalty<rules.rival,'All parcels delivered. Lower time wins.');}
 }else if(e.type==='fight'){
  if(action==='dodge'){if(e.dodgeCooldown>0)return fail('Dodge is recharging.');e.dodge=.7;e.dodgeCooldown=2;e.stun=0;}
  else if(action==='throw'){if(e.throwCooldown>0||e.stun>0)return fail('Your throw is getting ready.');const dx=e.aim.x-e.actor.x,dy=e.aim.y-e.actor.y,n=Math.hypot(dx,dy);if(n<.01)return fail('Aim at the green rival.');e.projectiles.push({x:e.actor.x,y:e.actor.y,dx:dx/n*9,dy:dy/n*9,life:2.5,owner:'player'});e.throwCooldown=.65;}
  else return fail('Aim, throw or dodge.');
 }
 changed(s);return ok();
}
export function storyHazards(e){return e.type==='race'?[{x:9+Math.sin(e.elapsed*1.1)*4,y:4.9},{x:14.8,y:8.8+Math.sin(e.elapsed*1.35)*2.3}]:[];}
export function storyTick(s,dt,input={}){
 if(!Number.isFinite(dt)||dt<=0||dt>.25)throw new Error('Story requires a bounded step');
 const st=s.story;if(!st.active||input.paused||st.location==='computer'||st.restart)return;
 const e=st.event;if(e&&e.status!=='running')return;st.clock+=dt;
 const a=currentStoryActor(st),type=storyScene(st);a.moving=false;
 if(!e||e.stun<=0){if(input.x||input.y){const dx=(input.x||0)+(input.y||0),dy=(input.y||0)-(input.x||0),n=Math.max(1,Math.hypot(dx,dy));a.path=[];a.pathKey='';storyMove(a,type,dx/n*4.2*dt,dy/n*4.2*dt);}else if(input.target)storyFollow(a,type,input.target,dt);}
 if(!e)return;
 const o=STORY_OBJECTIVES.find(o=>o.id===e.id),rules=eventRules(o);e.elapsed+=dt;
 e.stun=Math.max(0,e.stun-dt);e.dodge=Math.max(0,e.dodge-dt);e.dodgeCooldown=Math.max(0,e.dodgeCooldown-dt);e.throwCooldown=Math.max(0,e.throwCooldown-dt);
 if(['cook','serve'].includes(e.type)){e.rival=Math.min(rules.rival,Math.floor(e.elapsed/(rules.limit/rules.rival)));e.rivalActor.x=16+Math.sin(e.elapsed*.8)*.6;e.rivalActor.y=6+Math.sin(e.elapsed*.6)*.5;e.rivalActor.moving=true;}
 if(e.cooking){e.cooking.left=Math.max(0,e.cooking.left-dt);if(e.cooking.left===0){e.dish=e.cooking.recipe;e.actor.bag=[e.dish];e.cooking=null;changed(s);}}
 if(e.type==='serve')for(const t of e.tables)if(t.state==='eating'){t.timer=Math.max(0,t.timer-dt);if(t.timer===0){t.state='dirty';changed(s);}}
 if(e.type==='race'){
  e.rival=Math.min(3,Math.floor(e.elapsed/(rules.rival/3)));e.rivalActor.x=4+(e.elapsed/rules.rival%1)*11;e.rivalActor.y=3.2;e.rivalActor.moving=true;
  if(e.stun===0&&storyHazards(e).some(h=>storyDistance(a,h)<.85)){e.penalty+=2;e.stun=1;e.mistakes++;changed(s);}
 }
 if(e.type==='fight'){
  e.rivalActor.x=10+Math.sin(e.elapsed*.65)*3;e.rivalActor.y=4+Math.sin(e.elapsed*.4)*.8;e.rivalActor.moving=true;
  if(e.warning){e.warning.left-=dt;if(e.warning.left<=0){const dx=e.warning.x-e.rivalActor.x,dy=e.warning.y-e.rivalActor.y,n=Math.max(.01,Math.hypot(dx,dy));e.projectiles.push({x:e.rivalActor.x,y:e.rivalActor.y,dx:dx/n*6,dy:dy/n*6,life:3,owner:'rival'});e.warning=null;e.nextAttack=2.5;}}
  else{e.nextAttack=Math.max(0,e.nextAttack-dt);if(e.nextAttack===0)e.warning={x:a.x,y:a.y,left:1.1};}
  for(const p of e.projectiles){p.x+=p.dx*dt;p.y+=p.dy*dt;p.life-=dt;const victim=p.owner==='player'?e.rivalActor:a;
   if(p.life>0&&storyDistance(p,victim)<.72){p.life=0;if(p.owner==='player'){e.score++;e.rivalActor.splat=.35;}else if(e.dodge===0&&e.stun===0){e.rival++;e.stun=.6;}changed(s);}
  }
  e.projectiles=e.projectiles.filter(p=>p.life>0&&p.x>0&&p.x<20&&p.y>0&&p.y<16);
  if(e.score>=rules.target&&e.rival<4)finish(s,true,'The neighborhood cheers for your spectacular splats!');else if(e.rival>=4)finish(s,false,'Four splats landed. Shake off the sauce and try again.');
 }
 if(e.status==='running'&&e.elapsed+e.penalty>=rules.limit)finish(s,false,'Time is up. Your previous victories are safe.');
}

const num=(n,max=1e9)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
const point=(p,w=34,h=28)=>p&&num(p.x,w)&&num(p.y,h);
const actor=a=>point(a)&&Array.isArray(a.bag)&&a.bag.length<=3&&a.bag.every(i=>RECIPES.some(r=>r.id===i))&&Array.isArray(a.path)&&a.path.length<4000&&a.path.every(p=>point(p))&&typeof a.pathKey==='string'&&typeof a.moving==='boolean';
export function validateStory(st){
 if(!st||!['started','active','complete'].every(k=>typeof st[k]==='boolean')||!Number.isInteger(st.index)||st.index<0||st.index>STORY_OBJECTIVES.length||!num(st.clock)||!actor(st.actor)||!['computer','outside'].includes(st.location))return false;
 if(!Array.isArray(st.clues)||new Set(st.clues).size!==st.clues.length||!st.clues.every(id=>STORY_OBJECTIVES.some(o=>o.id===id&&o.kind==='talk')))return false;
 if(!Array.isArray(st.emails)||new Set(st.emails).size!==st.emails.length||!st.emails.every(id=>Object.hasOwn(STORY_EMAILS,id)))return false;
 if(!Array.isArray(st.wins)||st.wins.length>9||new Set(st.wins.map(w=>w.id)).size!==st.wins.length||!st.wins.every(w=>STORY_OBJECTIVES.some(o=>o.id===w.id&&o.kind==='event')&&num(w.score,40)&&num(w.rival,65)&&num(w.elapsed,200)))return false;
 if((st.active||st.complete||st.index>0)&&!st.started||st.complete!==(st.index===STORY_OBJECTIVES.length))return false;
 for(const o of STORY_OBJECTIVES.slice(0,st.index)){if(o.kind==='event'&&!st.wins.some(w=>w.id===o.id)||o.kind==='talk'&&!st.clues.includes(o.id)||o.kind==='mail'&&!st.emails.includes('reply'))return false;}
 if(st.restart!==null&&st.restart!==storyObjective(st)?.id)return false;
 const e=st.event;if(e===null)return true;const o=STORY_OBJECTIVES.find(o=>o.id===e.id&&o.kind==='event');
 if(!o||o.type!==e.type||!['running','won','lost'].includes(e.status)||!actor(e.actor)||!actor(e.rivalActor)||!point(e.aim,20,16)||!['elapsed','score','rival','penalty','mistakes','delivered','checkpoint','stun','dodge','dodgeCooldown','throwCooldown','nextAttack'].every(k=>num(e[k],200)))return false;
 if(e.status==='won'?!st.wins.some(w=>w.id===e.id):e.id!==storyObjective(st)?.id)return false;
 if(!Array.isArray(e.inventory)||e.inventory.length>2||!e.inventory.every(i=>['batter','pixel','leaf','berry'].includes(i))||e.dish!==null&&!RECIPES.some(r=>r.id===e.dish)||e.cooking!==null&&(!RECIPES.some(r=>r.id===e.cooking.recipe)||!num(e.cooking.left,2.5)))return false;
 if(!Array.isArray(e.orders)||e.orders.length!==3||!e.orders.every(n=>Number.isInteger(n)&&n>=0&&n<3)||!Array.isArray(e.tables)||e.tables.length!==3||!e.tables.every(t=>Number.isInteger(t.recipe)&&t.recipe>=0&&t.recipe<3&&['waiting','seated','eating','dirty','done'].includes(t.state)&&num(t.timer,4)))return false;
 if(!Array.isArray(e.projectiles)||e.projectiles.length>32||!e.projectiles.every(p=>point(p,20,16)&&Number.isFinite(p.dx)&&Number.isFinite(p.dy)&&num(p.life,3)&&['player','rival'].includes(p.owner)))return false;
 return (e.warning===null||point(e.warning,20,16)&&num(e.warning.left,1.1))&&(e.result===null||typeof e.result.won==='boolean'&&typeof e.result.reason==='string'&&e.result.reason.length<300&&num(e.result.score,40)&&num(e.result.rival,65)&&num(e.result.elapsed,200));
}
export function recoverStory(st){
 if(st.event?.status==='running'){st.restart=st.event.id;st.event=null;}
 if(!storyWalkable('outside',st.actor.x,st.actor.y))st.actor=storyActor();
 st.actor.path=[];st.actor.pathKey='';st.actor.moving=false;
 return st;
}
