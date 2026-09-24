import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { newGame, command } from '../src/simulation.js';
import { encode } from '../src/storage.js';
import { LAYOUTS, PRODUCTS } from '../src/config.js';

const URL = process.env.DFP_TEST_URL || 'http://127.0.0.1:4173';
mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({channel:process.env.DFP_BROWSER || 'msedge',headless:true});
const report=[], errors=[];
let context, page;
async function launch(state=newGame(),viewport={width:1440,height:900},touch=false){
  if(context)await context.close();
  context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});
  await context.addInitScript(({data})=>{if(!sessionStorage.getItem('dfp-test-seeded')){localStorage.setItem('dfp.save',data);sessionStorage.setItem('dfp-test-seeded','1');}},{data:encode(state)});
  page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.goto(URL);await page.locator('#floor-title').waitFor();await page.clock.runFor(500);
}
const snapshot=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
async function until(predicate,label,max=80){for(let i=0;i<max;i++){const s=await snapshot();if(predicate(s))return s;await page.clock.runFor(500);}throw Error(`Timed out: ${label}. ${JSON.stringify(await snapshot())}`);}
async function clickStation(floor,id){if(id.startsWith('table')){await page.locator('#tables-button').click();await page.locator(`[data-action="walk-table"][data-id="${id.slice(5)}"]`).click();}else await page.locator(`[data-station="${id}"]`).click();}
async function walk(floor,id,predicate,label=id){await clickStation(floor,id);return until(predicate,label);}
async function shot(name){await page.screenshot({path:`test-results/${name}.png`,fullPage:true});}
const pass=name=>{report.push({test:name,result:'pass'});console.log('PASS',name);};
const openAll=(products=true)=>{const s=newGame();s.money=100000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});if(products)for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});return s;};
try{
  await launch();
  const initial=await snapshot();await page.keyboard.down('d');await page.clock.runFor(700);await page.keyboard.up('d');await page.clock.runFor(2200);const moved=await snapshot();assert.ok(moved.player.x>initial.player.x);const stopped={x:moved.player.x,y:moved.player.y};await page.clock.runFor(2200);assert.deepEqual({x:(await snapshot()).player.x,y:(await snapshot()).player.y},stopped);pass('Keyboard movement and release');
  await page.locator('#menu-button').click();await page.locator('[data-action="product"][data-id="controller"]').click();await page.locator('[data-action="close"]').click();assert.equal((await snapshot()).money,70);pass('First product unlock through menu costs $50');
  await walk(0,'prep',s=>s.tutorial>=1);await walk(0,'fry',s=>s.tutorial>=2);await walk(0,'pickup',s=>s.player.bag.includes('controller'));
  await clickStation(0,'counter');await page.clock.runFor(8500);assert.equal((await snapshot()).served,0);
  await walk(0,'stack',s=>s.floors[0].counter.controller>0);assert.equal((await snapshot()).served,0);
  await walk(0,'counter',s=>s.served>=1);assert.equal((await snapshot()).money,71);await shot('desktop-takeout');pass('Takeout played through prep, fry, pickup, counter stacking and middle-circle service at $1');
  await launch(openAll());
  await page.locator('[data-tab="employees"]').click();await page.locator('[data-action="hire"][data-id="0"]').click();await until(s=>s.employees.length===1,'hire');await page.locator('[data-tab="home"]').click();const before=(await snapshot()).earned;await until(s=>s.earned>before,'visible employee service',180);pass('Employee hired through UI and automatically serves');
  await page.reload();await page.clock.runFor(1000);assert.equal((await snapshot()).employees.length,1);pass('Interrupted-session reload preserves purchases');

  await launch(openAll(false));
  for(let f=0;f<4;f++){await page.locator('[data-tab="elevator"]').click();await page.locator(`[data-action="visit"][data-floor="${f}"]`).click();await page.locator('#menu-button').click();for(const p of PRODUCTS.filter(p=>p.floor===f)){await page.locator(`[data-action="product"][data-id="${p.id}"]`).click();assert.ok((await snapshot()).floors[f].products[p.id]);}await page.locator('[data-action="close"]').click();}pass('Every floor product and arcade cabinet purchased separately through UI');
  await page.locator('[data-tab="elevator"]').click();await page.locator('[data-action="visit"][data-floor="0"]').click();
  assert.equal(await page.locator('[data-tab]').count(),4);for(const tab of ['elevator','outfits','employees','home']){await page.locator(`[data-tab="${tab}"]`).click();assert.equal(await page.locator(`[data-tab="${tab}"]`).getAttribute('aria-current'),'page');}pass('All four persistent navigation tabs');
  await page.locator('[data-tab="outfits"]').click();await page.locator('[data-action="outfit"][data-id="chef"]').click();await page.reload();await page.clock.runFor(500);assert.equal((await snapshot()).outfit,'chef');await page.locator('[data-tab="outfits"]').click();await shot('outfits');pass('Outfit purchase, visible preview and reload persistence');
  await page.locator('[data-tab="employees"]').click();await page.locator('[data-action="hire"][data-id="0"]').click();await page.locator('[data-action="employee-upgrade"][data-id="0"][data-category="speed"]').click();await page.locator('[data-assign="0"]').selectOption('1');await until(s=>s.employees[0]?.floor===1,'transfer');assert.equal((await snapshot()).employees[0].upgrades.speed,1);await shot('employees');pass('Employee upgrade and reassignment through the UI');

  const dining=openAll();command(dining,{type:'visit',floor:1});await launch(dining);
  await page.locator('#tables-button').click();await page.locator('[data-action="buy-table"][data-id="0"]').click();await page.locator('[data-action="close"]').click();await page.clock.runFor(18000);
  const diner=(await snapshot()).floors[1].customers.find(c=>c.purpose==='food'),meal=diner.needs[0];
  await walk(1,meal,s=>s.player.bag.includes(meal));await walk(1,'wine',s=>s.player.bag.includes('wine'));
  await clickStation(1,'counter');await page.clock.runFor(8000);assert.equal((await snapshot()).floors[1].served,0);
  await walk(1,'stack',s=>s.floors[1].counter[meal]>0&&s.floors[1].counter.wine>0);await walk(1,'counter',s=>s.floors[1].served>=1);
  await until(s=>s.floors[1].customers.find(c=>c.id===diner.id)?.state==='dining','paid diner sitting');await page.locator('#area-button').click();await page.clock.runFor(3000);await shot('desktop-dining');
  await until(s=>s.floors[1].tables[0].state==='dirty','meal finished');await walk(1,'table0',s=>s.floors[1].tables[0].state==='free');pass('Dining table purchased; food and wine stacked, served, paid before eating, then table cleaned');

  const shop=openAll();command(shop,{type:'visit',floor:2});command(shop,{type:'section',floor:2});await launch(shop);await page.clock.runFor(12000);const customer=(await snapshot()).floors[2].customers.find(c=>c.purpose==='shop'),item=customer.needs[0];
  await walk(2,item==='keychain'?'keyStock':'stock',s=>s.player.bag.includes(item));await walk(2,item==='keychain'?'keyShelf':'shelf',s=>s.floors[2].shelves[item]>0);await until(s=>s.floors[2].customers.some(c=>c.state==='checkout'),'customer browsing');await walk(2,'checkout',s=>s.floors[2].served>0);await shot('desktop-shop');pass('Gift shop played through stock, carrying, shelf restock, browsing and checkout');

  const arcade=openAll();command(arcade,{type:'visit',floor:3});command(arcade,{type:'section',floor:3});await launch(arcade);await until(s=>s.floors[3].machines.some(m=>m.quarters>0),'quarters from play');let index=(await snapshot()).floors[3].machines.findIndex(m=>m.quarters>0);await walk(3,`machine${index}`,s=>s.floors[3].revenue>0);await shot('desktop-arcade');
  await walk(3,'vr',s=>s.player.action==='vr');await page.locator('#vr-start').click();await page.keyboard.press('ArrowLeft');await page.clock.runFor(100);assert.equal(await page.locator('#vr-runner').evaluate(e=>e.style.left),'16.6667%');await page.locator('[data-action="vr-right"]').click();await page.clock.runFor(100);assert.equal(await page.locator('#vr-runner').evaluate(e=>e.style.left),'50%');await shot('vr-minigame');await page.clock.runFor(26000);assert.ok((await snapshot()).vr.done);const reward=(await snapshot()).vr.reward;assert.ok(reward>=3);await page.reload();await page.clock.runFor(500);assert.ok((await snapshot()).vr.paid);assert.equal((await snapshot()).vr.reward,reward);pass('Arcade quarters, VR keyboard/touch buttons, reward and reload');

  for(let f=0;f<4;f++){const trash=openAll();command(trash,{type:'visit',floor:f});trash.player.bag=[f===2?'souvenir':'controller'];await launch(trash);const old=trash.money;await walk(f,'trash',s=>s.player.bag.length===0);assert.equal((await snapshot()).money,old);}pass('Trash cans usable through rendered interaction rings on every floor');

  await launch(newGame(),{width:390,height:844},true);await shot('phone-portrait');
  const joy=await page.locator('#joystick').boundingBox(),touchSession=await context.newCDPSession(page);const prior=await snapshot();
  await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:joy.x+joy.width/2,y:joy.y+joy.height/2}]});await touchSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:joy.x+joy.width/2+30,y:joy.y+joy.height/2}]});await page.clock.runFor(900);await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(2200);assert.ok((await snapshot()).player.x>prior.player.x);pass('Real touch events drive the joystick');
  for(const tab of ['elevator','outfits','employees','home']){await page.locator(`[data-tab="${tab}"]`).tap();assert.equal(await page.locator(`[data-tab="${tab}"]`).getAttribute('aria-current'),'page');}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:844,height:390});await page.clock.runFor(300);await shot('phone-landscape');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('[data-tab="employees"]').tap();await shot('phone-landscape-employees');pass('Phone portrait/landscape layout and all touch navigation tabs');

  await launch(openAll());await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.clock.runFor(700);assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller));
  await page.locator('[data-action="settings"]').click();assert.ok((await page.locator('.offline-status').textContent()).includes('Ready'));await page.locator('[data-action="close"]').click();
  const saved=(await snapshot()).money;await context.setOffline(true);await page.reload();await page.clock.runFor(1000);assert.equal((await snapshot()).money,saved);await page.locator('[data-tab="elevator"]').click();await page.locator('[data-action="visit"][data-floor="3"]').click();assert.equal(await page.locator('#floor-title').textContent(),'Insert Coin.');pass('Production service-worker offline reload and floor navigation');await context.setOffline(false);
  const oldWorker=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return r.active.scriptURL;});assert.ok(oldWorker.endsWith('/sw.js'));
  execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--configLoader','native'],{env:{...process.env,DFP_BUILD_ID:'browser-update-verification'},stdio:'pipe'});
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  for(let i=0;i<30;i++){if(await page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration())?.waiting))break;await new Promise(r=>setTimeout(r,100));}
  assert.ok(await page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration())?.waiting));
  await page.locator('[data-action="settings"]').click();await page.locator('[data-action="update"]').waitFor();const updateMoney=(await snapshot()).money;await Promise.all([page.waitForEvent('load'),page.locator('[data-action="update"]').click()]);await page.clock.runFor(1000);assert.equal((await snapshot()).money,updateMoney);assert.equal((await snapshot()).floor,3);pass('New-build service-worker update preserves progress');
  await shot('production-final');
  assert.deepEqual(errors,[]);pass('No uncaught browser errors');
}catch(error){report.push({test:'failure',result:'fail',message:error.message});console.error(error);if(page)await shot('failure').catch(()=>{});process.exitCode=1;}
finally{writeFileSync('test-results/browser-report.json',JSON.stringify({browser:'Microsoft Edge / Chromium',date:new Date().toISOString(),tests:report,errors},null,2));await browser.close();}
