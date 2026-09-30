import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command,step} from '../src/simulation.js';
import {encode} from '../src/storage.js';
import {FLOORS,PRODUCTS,OUTFITS,LAYOUTS} from '../src/config.js';
import {ensureSecurityRound} from '../src/security.js';
const base=process.env.DFP_TEST_URL||'http://127.0.0.1:4173/',out='artifacts/expansion';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];let context,page;
const advance=ms=>page.clock.runFor(ms),press=sel=>page.locator(sel).press('Enter');
const snap=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
function seed(f,highest=10){const s=newGame();s.money=1000000;s.settings.sound=false;for(let i=1;i<=highest;i++)command(s,{type:'floor',floor:i});for(const p of PRODUCTS)if(p.floor<=highest)command(s,{type:'product',floor:p.floor,id:p.id});if(f!==10)for(let i=0;i<6;i++)command(s,{type:'table',floor:f,id:i});command(s,{type:'visit',floor:f});command(s,{type:'pet-buy',id:'camera'});s.floors.forEach(fs=>fs.arrival=100);return s;}
async function open(s,viewport={width:1280,height:960},touch=false){await context?.close();context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});await context.addInitScript(data=>{if(!sessionStorage.seeded){localStorage.setItem('dfp.save',data);sessionStorage.seeded='1';}},encode(s));page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(base);await page.locator('[data-tab="home"]').waitFor();await advance(200);}
try{
 for(let f=4;f<11;f++){
  const s=seed(f);s.floors[f].arrival=0;for(let i=0;i<3;i++)command(s,{type:'hire',floor:f,id:f*5+i});
  for(let n=0;n<3000;n++){step(s,.05,{pausedPlayer:true});if(n>1400&&(f===10?s.floors[f].activity.factory.delivery?.timer>1:s.floors[f].customers.filter(c=>c.state==='dining').length>=2))break;}
  s.player.x=20;s.player.y=7;
  if(f===7){command(s,{type:'umbrella',id:0});s.floors[f].activity.weather=42;}
  await open(s);await advance(700);const d=await page.locator('#game').evaluate(c=>c.dfpDiagnostics());assert.equal(d.floor,f);assert.equal(d.pet.models,1);await page.screenshot({path:`${out}/floor-${f+1}-final.png`});
  if(f===9){assert.ok(d.positions.some(p=>p.key.startsWith('guest-')));}
 }
 checks.push('Final production build renders all seven busy rooms, including cinema, rain/umbrellas, guest pets and a loaded delivery cart');
 for(let f=4;f<11;f++){
  const s=seed(f,f);command(s,{type:'hire',floor:f,id:f*5});s.floors[f].arrival=0;for(let n=0;n<800;n++)step(s,.05,{pausedPlayer:true});command(s,{type:'visit',floor:0});s.player.x=7;s.player.y=10;ensureSecurityRound(s);s.basement.security.round.remaining=1;
  await open(s,{width:390,height:844},true);const before=await snap();await page.locator('#pet-security-mobile').tap();await advance(1500);
  assert.equal(await page.locator('#security-floor').textContent(),`${f+1} · ${FLOORS[f].name}`);assert.equal((await page.locator('#security-canvas').evaluate(c=>c.dfpDiagnostics())).floor,f);assert.equal((await snap()).basement.security.round.phase,'active');
  await press('[data-person="robber"]');await advance(100);assert.equal((await snap()).basement.security.rewards-before.basement.security.rewards,100);assert.match(await page.locator('#security-feedback').textContent(),/Caught!.*100/);
  await page.screenshot({path:`${out}/security-${f+1}.png`});await press('[data-action="security-exit"]');await advance(100);const returned=await snap();assert.equal(returned.floor,0);assert.equal(returned.player.x,before.player.x);assert.equal(returned.player.y,before.player.y);const remaining=returned.basement.security.round.remaining;await advance(1800);assert.equal((await snap()).basement.security.round.remaining,remaining);
 }
 checks.push('Phone security monitors each highest new floor, catches award exactly $100 remotely, Back preserves position, and closed encounters pause');
 const s=seed(4);s.pets.equipped=null;Object.assign(s.player,LAYOUTS[4].find(st=>st.id==='icecream').pad);await open(s,{width:390,height:844},true);await advance(800);await page.locator('[data-tab="outfits"]').tap();const stopped=await snap();assert.ok(stopped.player.bag.includes('icecream'));await advance(1500);assert.deepEqual((await snap()).player.bag,stopped.player.bag);
 await page.reload();await page.locator('[data-tab="home"]').waitFor();assert.deepEqual((await snap()).player.bag,stopped.player.bag);await press('[data-tab="outfits"]');
 for(const outfit of OUTFITS){if((await snap()).outfit!==outfit.id){await press(`[data-action="outfit"][data-id="${outfit.id}"]`);await advance(150);assert.equal((await snap()).outfit,outfit.id);}}
 await press('[data-tab="home"]');await press('#business-help');assert.ok(await page.locator('[data-action="business-job"]').count()>10);await page.screenshot({path:`${out}/phone-business-guide.png`});await press('[data-action="close"]');await press('[data-tab="employees"]');assert.equal(await page.locator('.roster-tabs button').count(),11);await press('[data-action="filter"][data-floor="10"]');assert.equal(await page.locator('.employee-card').count(),5);await press('[data-action="hire"][data-id="50"]');await page.locator('[data-assign="50"]').selectOption('4');await advance(200);assert.equal((await snap()).employees.find(e=>e.id===50).floor,4);await page.screenshot({path:`${out}/phone-staff.png`});
 await press('[data-tab="home"]');await page.setViewportSize({width:844,height:390});await advance(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);for(const tab of await page.locator('[data-tab]').all()){const b=await tab.boundingBox();assert.ok(b.y>=0&&b.y+b.height<=391);}await page.screenshot({path:`${out}/final-landscape.png`});
 checks.push('Touch guide, eleven staff filters, factory hire/transfer, every outfit, interrupted preparation and carried-goods reload pass; landscape tabs fit');
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await advance(200);await press('[data-tab="pets"]');const saved=await snap();await context.setOffline(true);await page.reload();await page.locator('[data-tab="home"]').waitFor();assert.equal((await snap()).money,saved.money);assert.deepEqual((await snap()).outfits,saved.outfits);assert.deepEqual((await snap()).player.bag,saved.player.bag);await press('[data-tab="elevator"]');assert.equal(await page.locator('.floor-card').count(),12);await press('[data-action="visit"][data-floor="10"]');await advance(500);assert.equal((await page.locator('#game').evaluate(c=>c.dfpDiagnostics())).floor,10);checks.push('Final production service worker reloads offline and opens the factory while preserving saved purchases and carried goods');
 assert.deepEqual(errors,[]);
}finally{writeFileSync(`${out}/final-browser-report.json`,JSON.stringify({checks,errors},null,2));await context?.close();await browser.close();}
console.log(JSON.stringify({checks,errors},null,2));
