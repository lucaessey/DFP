import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
import {STORY_OBJECTIVES,STORY_PLACES,EVENT_SPOTS,RECIPES} from '../src/story-data.js';
const base=process.env.DFP_TEST_URL||'http://127.0.0.1:4173/',out='artifacts/story';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];let context,page;
const press=sel=>page.locator(sel).press('Enter');const button=(action,id)=>`[data-story="${action}"]${id===undefined?'':`[data-id="${id}"]`}`;
const advance=ms=>page.clock.runFor(ms),snap=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
function ready(){const s=newGame();s.money=20000;for(const c of [{type:'basement'},{type:'computer'},{type:'email'},{type:'pet-buy',id:'dog'},{type:'outfit',id:'chef'}])command(s,c);s.settings.sound=false;s.player.bag=['controller','drink'];return s;}
async function open(s,viewport={width:1360,height:900},touch=false){await context?.close();context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});await context.addInitScript(data=>{if(!sessionStorage.seeded){localStorage.setItem('dfp.save',data);sessionStorage.seeded='1';}},encode(s));page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(base);await advance(150);}
async function inbox(){await press('[data-tab="elevator"]');await press('[data-action="basement-visit"]');await press('#lounge-computer');await press('[data-computer="email"]');await press('[data-computer="story-inbox"]');}
async function waitAt(p){for(let i=0;i<70;i++){await advance(300);const a=await page.locator('#story-canvas').evaluate(c=>c.dfpDiagnostics().actor);if(Math.hypot(a.x-p.x,a.y-p.y)<.15){await advance(150);return;}}throw new Error(`Did not reach ${JSON.stringify(p)}; ${await page.locator('#story-message').textContent()}`);}
async function objective(){const s=await snap(),o=STORY_OBJECTIVES[s.story.index];await press(button('guide'));await waitAt(STORY_PLACES[o.place]);await press(button('interact'));return o;}
async function walk(id){await press(button('walk',id));await waitAt(EVENT_SPOTS[id]);}
async function cook(){let e=(await snap()).story.event;for(const n of e.orders){const r=RECIPES[n];for(const i of r.ingredients){await walk(i);await press(button('interact'));}await walk('prep');await press(button('prepare',r.id));await advance(2600);await walk('serve');await press(button('interact'));}}
async function serve(){const e=(await snap()).story.event;for(let i=0;i<3;i++){await walk(`table${i}`);await press(button('interact'));await walk('pantry');await press(button('meal',RECIPES[e.orders[i]].id));await walk(`table${i}`);await press(button('interact'));await advance(4200);await press(button('interact'));}}
async function race(){for(let i=0;i<3;i++){await walk(`checkpoint${i}`);await press(button('parcel',String(i)));}}
async function fight(){
 await page.keyboard.down('w');await page.keyboard.down('a');await advance(1450);await page.keyboard.up('w');await page.keyboard.up('a');
 for(let i=0;i<100;i++){
  if(await page.locator('#story-modal').isVisible())break;
  if(await page.locator(button('dodge')).isEnabled())await press(button('dodge'));
  await press(button('aim'));if(await page.locator(button('throw')).isEnabled())await press(button('throw'));await advance(700);
 }
}
async function competition(){await press(button('begin'));await advance(150);const e=(await snap()).story.event;await ({cook,serve,race,fight})[e.type]();await advance(100);await page.locator('#story-modal').waitFor({state:'visible'});const s=await snap();assert.equal(s.story.event.status,'won',`${e.id}: ${JSON.stringify(s.story.event.result)}`);await page.screenshot({path:`${out}/${e.id}.png`});checks.push(`UI victory: ${e.id}`);console.log(`PASS ${e.id}`);await press(button('continue'));await advance(100);}
try{
 const s=ready();assert.ok(s.basement.computer.email);await open(s);await inbox();assert.match(await page.locator('#computer-screen').textContent(),/Would you like to start Story Mode/);await press('#computer-screen [data-computer="desktop"]');assert.equal((await snap()).story.started,false);await press('[data-computer="email"]');await press('[data-computer="story-inbox"]');await press('[data-computer="story-start"]');await page.screenshot({path:`${out}/inbox.png`});assert.match(await page.locator('#computer-screen').textContent(),/Our customers crossed the road/);checks.push('Purchased Inbox start/decline flow and original apps retained');
 await press('[data-computer="story-resume"]');await advance(250);const baseline=await snap();await page.screenshot({path:`${out}/neighborhood.png`});
 await page.keyboard.down('d');await advance(300);await page.keyboard.up('d');await advance(100);const stopped=await page.locator('#story-canvas').evaluate(c=>c.dfpDiagnostics().actor);await advance(500);assert.deepEqual(await page.locator('#story-canvas').evaluate(c=>c.dfpDiagnostics().actor),stopped);checks.push('Keyboard release stops movement');
 await press(button('pause'));const paused=await snap();await advance(4000);assert.equal((await snap()).story.clock,paused.story.clock);await press(button('unpause'));checks.push('Pause menu freezes story timers');
 while(!(await snap()).story.complete){
  const s=await snap(),o=STORY_OBJECTIVES[s.story.index];console.log(`OBJECTIVE ${o.id}`);
  if(o.kind==='talk'){await objective();await press(button('close-modal'));}
  else if(o.kind==='mail'){await objective();await press('[data-computer="story-challenge"]');assert.match(await page.locator('#computer-screen').textContent(),/Lettuce begin/);await press('[data-computer="story-resume"]');await advance(150);}
  else{await objective();await competition();}
 }
 const completed=await snap();assert.equal(completed.story.wins.length,9);assert.equal(completed.story.active,false);for(const key of ['money','earned','employees','pets'])assert.deepEqual(completed[key],baseline[key],key);checks.push('Whole five-chapter campaign completed through UI; regular possessions and business state preserved');
 await inbox();assert.match(await page.locator('#computer-screen').textContent(),/Welcome back, lunch crowd/);checks.push('Concluding email available after finale');
 assert.deepEqual(errors,[]);
}catch(e){await page?.screenshot({path:`${out}/failure.png`});writeFileSync(`${out}/failure.txt`,`${e.stack}\n${JSON.stringify(await snap(),null,2)}`);throw e;}
finally{writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2));await context?.close();await browser.close();}
console.log(JSON.stringify({checks,errors},null,2));
