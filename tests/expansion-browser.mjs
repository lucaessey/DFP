import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command,step,workerGoal} from '../src/simulation.js';
import {encode} from '../src/storage.js';
import {FLOORS,PRODUCTS,LAYOUTS} from '../src/config.js';
const base=process.env.DFP_TEST_URL||'http://127.0.0.1:4173/',out='artifacts/expansion';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],checks=[],metrics=[];let context,page;
const advance=ms=>page.clock.runFor(ms),press=sel=>page.locator(sel).press('Enter');
function rich(f=4){const s=newGame();s.money=1000000;for(let i=1;i<FLOORS.length;i++)assert.ok(command(s,{type:'floor',floor:i}).ok);for(const p of PRODUCTS)assert.ok(command(s,{type:'product',floor:p.floor,id:p.id}).ok);for(let i=0;i<6&&f!==10;i++)command(s,{type:'table',floor:f,id:i});command(s,{type:'visit',floor:f});command(s,{type:'pet-buy',id:'camera'});s.floors.forEach(fs=>fs.arrival=100);return s;}
async function open(s,viewport={width:1440,height:1000},touch=false){await context?.close();context=await browser.newContext({viewport,hasTouch:touch,isMobile:touch});await context.addInitScript(data=>{if(!sessionStorage.seeded){localStorage.setItem('dfp.save',data);sessionStorage.seeded='1';}},encode(s));page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(base);await page.locator('[data-tab="elevator"]').waitFor();await advance(500);}
const snap=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
try{
 for(let f=4;f<FLOORS.length;f++){
  const s=rich(f);s.floors[f].arrival=0;command(s,{type:'hire',floor:f,id:f*5});for(let n=0;n<800;n++)step(s,.05,{pausedPlayer:true});
  if(f===7){command(s,{type:'umbrella',id:0});s.floors[f].activity.weather=42;}
  await open(s);await advance(1000);const d=await page.locator('#game').evaluate(c=>c.dfpDiagnostics());assert.equal(d.floor,f);assert.equal(d.pet.id,'camera');metrics.push({floor:f+1,calls:d.calls,triangles:d.triangles});
  await page.screenshot({path:`${out}/floor-${f+1}-work.png`});await press('#area-button');await advance(8500);await page.screenshot({path:`${out}/floor-${f+1}-guests.png`});checks.push(`Floor ${f+1} renders work and guest/packing areas with a companion`);
 }
 await open(rich(),{width:390,height:844},true);await page.locator('[data-tab="elevator"]').tap();await advance(200);
 const names=await page.locator('.floor-card h2').allTextContents();assert.equal(names.length,12);assert.match(names[0],/basement/i);assert.deepEqual(names.slice(1),FLOORS.map(f=>f.name));await page.screenshot({path:`${out}/elevator-phone.png`});
 for(let f=0;f<FLOORS.length;f++){await press(`[data-action="visit"][data-floor="${f}"]`);await advance(100);assert.equal((await snap()).floor,f);await press('[data-tab="elevator"]');}
 checks.push('Basement first and all eleven floors reachable through the mobile elevator');
 await press('[data-action="visit"][data-floor="4"]');await advance(500);await page.screenshot({path:`${out}/dessert-phone.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:844,height:390});await advance(300);await page.screenshot({path:`${out}/dessert-landscape.png`});for(const tab of await page.locator('[data-tab]').all()){const b=await tab.boundingBox();assert.ok(b.y>=0&&b.y+b.height<=391);}
 checks.push('Phone portrait and landscape retain five accessible navigation tabs');

 for(let f=4;f<FLOORS.length;f++){
  const s=rich(f);s.pets.equipped=null;s.settings.reducedEffects=true;s.settings.sound=false;s.floors[f].arrival=0;
  for(let n=0;n<400;n++)step(s,.05,{pausedPlayer:true});s.floors[f].arrival=100;
  await open(s,{width:1080,height:800});let lastGoal=null,done=false;
  for(let t=0;t<260000;t+=1000){
   const current=await snap();if(current.floors[f].served>s.floors[f].served){done=true;break;}
   const goal=workerGoal(current,f,current.player);
   if(goal&&goal!==lastGoal){await press('#business-help');await press(`[data-action="business-job"][data-station="${goal}"]`);lastGoal=goal;}
   await advance(1000);
  }
  assert.ok(done,`Player completes floor ${f+1}`);const played=await snap();assert.ok(played.floors[f].revenue>s.floors[f].revenue);await page.screenshot({path:`${out}/floor-${f+1}-player-job.png`});
  // Continuing from the real player job preserves unfinished orders and carried goods.
  for(let i=0;i<3;i++)command(played,{type:'hire',floor:f,id:f*5+i});played.floors[f].arrival=0;
  await open(played,{width:1080,height:800});await advance(90000);const staffed=await snap();assert.ok(staffed.floors[f].served>played.floors[f].served,`Staff completes floor ${f+1}`);assert.ok(staffed.floors[f].revenue>played.floors[f].revenue);
  await press('#area-button');await advance(6000);await page.screenshot({path:`${out}/floor-${f+1}-active.png`});checks.push(`Floor ${f+1}: complete player job through visible controls, then three employees complete more work`);
 }
 await open(rich(10),{width:390,height:844},true);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await advance(500);const beforeOffline=await snap();await context.setOffline(true);await page.reload();await advance(500);assert.equal((await snap()).money,beforeOffline.money);assert.equal((await snap()).floor,10);assert.equal((await snap()).pets.equipped,'camera');await press('[data-tab="elevator"]');assert.equal(await page.locator('.floor-card').count(),12);await press('[data-action="visit"][data-floor="7"]');await advance(250);assert.equal((await page.locator('#game').evaluate(c=>c.dfpDiagnostics())).floor,7);checks.push('Production service worker reloads offline with all eleven floors, pets and saved money intact');await context.setOffline(false);
 assert.deepEqual(errors,[]);
}finally{writeFileSync(`${out}/browser-report.json`,JSON.stringify({checks,metrics,errors},null,2));await context?.close();await browser.close();}
console.log(JSON.stringify({checks,metrics,errors},null,2));
