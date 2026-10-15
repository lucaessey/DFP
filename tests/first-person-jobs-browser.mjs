import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command,step,workerGoal} from '../src/simulation.js';
import {encode} from '../src/storage.js';
import {PRODUCTS,FLOORS} from '../src/config.js';
const base=process.env.DFP_TEST_URL||'http://127.0.0.1:4173/',out='artifacts/first-person/jobs';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];let context,page;
const advance=ms=>page.clock.runFor(ms),press=sel=>page.locator(sel).press('Enter'),snap=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
async function open(s){await context?.close();context=await browser.newContext({viewport:{width:1080,height:800}});await context.addInitScript(data=>{localStorage.setItem('dfp.save',data);window.requestAnimationFrame=cb=>setTimeout(()=>cb(performance.now()),100);},encode(s));page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(base);await advance(200);}
function ready(f){const s=newGame();s.money=1000000;s.settings.sound=false;s.settings.reducedEffects=true;for(let i=1;i<11;i++)command(s,{type:'floor',floor:i});for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});for(let i=0;i<6&&f!==10;i++)command(s,{type:'table',floor:f,id:i});command(s,{type:'visit',floor:f});command(s,{type:'outfit',id:'explorer'});s.floors.forEach(fs=>fs.arrival=100);s.floors[f].arrival=0;for(let i=0;i<400;i++)step(s,.05,{pausedPlayer:true});s.floors[f].arrival=100;return s;}
try{
 for(let f=0;f<FLOORS.length;f++){
  const s=ready(f);await open(s);console.log('START floor',f+1);let lastGoal=null,done=false;
  for(let elapsed=0;elapsed<260000;elapsed+=1000){const current=await snap();if(current.floors[f].revenue>s.floors[f].revenue){done=true;break;}const goal=workerGoal(current,f,current.player);if(goal&&goal!==lastGoal){await press('#business-help');await press(`[data-action="business-job"][data-station="${goal}"]`);lastGoal=goal;}await advance(1000);}
  assert.ok(done,`Player completes paid job on floor ${f+1}`);const played=await snap();assert.equal(played.outfit,'explorer');const d=await page.locator('#game').evaluate(c=>c.dfpDiagnostics());assert.equal(d.view.mode,'first-person');await page.screenshot({path:`${out}/floor-${f+1}-player.png`});
  for(let i=0;i<3;i++)command(played,{type:'hire',floor:f,id:f*5+i});played.floors[f].arrival=0;await open(played);await advance(90000);const staffed=await snap();assert.ok(staffed.floors[f].revenue>played.floors[f].revenue,`Employees earn on ${f+1}`);await page.screenshot({path:`${out}/floor-${f+1}-staff.png`});checks.push(`Floor ${f+1}: player completed a paid job through work buttons; employees then earned additional revenue`);console.log('PASS',checks.at(-1));
 }
 assert.deepEqual(errors,[]);
}catch(e){await page?.screenshot({path:`${out}/failure.png`});throw e;}
finally{writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2));await context?.close();await browser.close();}
