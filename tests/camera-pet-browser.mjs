import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
import {FURNITURE,ensureSecurityRound} from '../src/security.js';
import {PRODUCTS} from '../src/config.js';

const url=process.env.DFP_TEST_URL||'http://127.0.0.1:4187/',out='artifacts/camera-pet';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
let context,page;
const pass=label=>{checks.push(label);console.log('PASS',label);};
const press=selector=>page.locator(selector).press('Enter');
const advance=ms=>page.clock.runFor(ms);
const snap=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
async function open(s,viewport={width:1440,height:1000}){
 await context?.close();context=await browser.newContext({viewport,hasTouch:true});
 await context.addInitScript(data=>{if(!sessionStorage.seed){localStorage.setItem('dfp.save',data);sessionStorage.seed='1';}},encode(s));
 page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(url);await page.locator('[data-tab="pets"]').waitFor();await advance(250);
}
function ready({pet=true,basement=false}={}){
 const s=newGame();s.money=100000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});
 if(pet)command(s,{type:'pet-buy',id:'camera'});
 if(basement){command(s,{type:'basement'});command(s,{type:'computer'});for(const item of FURNITURE)command(s,{type:'furniture',id:item.id});command(s,{type:'security'});}
 Object.assign(s.player,{x:12,y:15,bag:['controller','controller']});for(const fs of s.floors)fs.arrival=100;
 if(pet||basement){ensureSecurityRound(s);s.basement.security.round.remaining=1;}
 return s;
}
const place=s=>({floor:s.floor,x:s.player.x,y:s.player.y,bag:s.player.bag});
async function tap(selector){
 const b=await page.locator(selector).boundingBox();assert.ok(b);
 const point={x:b.x+b.width/2,y:b.y+b.height/2};
 assert.ok(await page.evaluate(({selector,point})=>!!document.elementFromPoint(point.x,point.y)?.closest(selector),{selector,point}),'Touch target is not covered');
 await page.touchscreen.tap(point.x,point.y);
}
async function assertAbove(shortcut,upgrades){
 const b=await page.locator(shortcut).boundingBox(),u=await page.locator(upgrades).boundingBox();
 assert.ok(b&&u);assert.ok(b.y+b.height<=u.y+1,'Security button must be above personal upgrades');assert.ok(b.x>=0&&b.x+b.width<=(await page.viewportSize()).width);
}
try{
 const shopping=ready({pet:false});shopping.money=6000;await open(shopping);
 assert.ok(await page.locator('#pet-security-shortcut').isHidden());await press('[data-tab="pets"]');await press('[data-pet-select="camera"]');await advance(350);
 assert.equal(await page.locator('.pet-card').count(),31);const description=await page.locator('.pet-selected-body').textContent();assert.match(description,/\$5,555/);assert.match(description,/No basement/);assert.match(description,/\+5 temporary speed upgrades \(\+75%/);assert.match(description,/capacity \+5 items/);assert.match(description,/\+5 temporary profit upgrades \(\+100%/);
 assert.equal(await page.locator('.pet-preview canvas').evaluate(c=>c.dfpDiagnostics().selected),'camera');await page.screenshot({path:`${out}/shop.png`});
 await press('[data-pet-card="camera"] [data-pet-command]');assert.equal((await snap()).money,445);assert.equal((await snap()).pets.equipped,'camera');await page.reload();await advance(250);assert.equal((await snap()).pets.equipped,'camera');
 pass('31-pet shop displays five speed/carry/profit upgrades, costs $5555 once, and preserves ownership/equipment after reload');

 await open(ready());await assertAbove('#pet-security-shortcut','.upgrade-card');await page.screenshot({path:`${out}/desktop-shortcut.png`});
 const before=await snap();await press('#pet-security-shortcut');await advance(1300);
 assert.ok(await page.locator('.security-overlay').isVisible());assert.equal(await page.locator('[data-action="security-exit"]').textContent(),'Back to Game');assert.ok(await page.locator('#computer-view').isHidden());assert.match(await page.locator('#security-floor').textContent(),/^4 ·/);
 assert.deepEqual(place(await snap()),place(before));assert.equal((await snap()).basement.unlocked,false);assert.equal((await snap()).basement.computer.owned,false);assert.equal((await snap()).basement.security.owned,false);
 assert.match(await page.locator('.security-info').textContent(),/Catch \+\$100/);await page.screenshot({path:`${out}/remote-security.png`});const money=(await snap()).money;await press('[data-person="robber"]');await advance(100);assert.equal((await snap()).money,money+100);assert.equal(await page.locator('#security-feedback').textContent(),'Caught! +$100');await page.screenshot({path:`${out}/remote-catch-100.png`});
 await press('[data-action="security-exit"]');assert.ok(await page.locator('.security-overlay').isHidden());assert.ok(await page.locator('#computer-view').isHidden());assert.deepEqual(place(await snap()),place(before));assert.equal(await page.evaluate(()=>document.activeElement.id),'pet-security-shortcut');
 const paused=structuredClone((await snap()).basement.security);await advance(2000);assert.deepEqual((await snap()).basement.security,paused);
 pass('Remote shortcut advertises and pays exactly $100 without basement purchases, then returns to original floor/position/cargo with timer paused');

 await press('#pet-security-shortcut');await advance(250);await page.keyboard.down('ArrowRight');await advance(500);await page.keyboard.up('ArrowRight');assert.deepEqual(place(await snap()),place(before));
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));const frozen=(await snap()).basement.security;await advance(3000);assert.deepEqual((await snap()).basement.security,frozen);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.keyboard.press('Escape');assert.ok(await page.locator('.security-overlay').isHidden());assert.ok(await page.locator('#computer-view').isHidden());assert.equal(await page.evaluate(()=>document.activeElement.id),'pet-security-shortcut');
 pass('Arrow keys pan security without moving the player, focus loss pauses the timer, and Escape returns focus directly to gameplay');

 for(const viewport of [{width:320,height:700},{width:390,height:844},{width:844,height:390}]){
  await page.setViewportSize(viewport);await advance(250);await assertAbove('#pet-security-mobile','.upgrade-mobile');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await tap('#pet-security-mobile');await advance(150);assert.ok(await page.locator('.security-overlay').isVisible());await tap('[data-action="security-exit"]');assert.deepEqual(place(await snap()),place(before));
  await page.screenshot({path:`${out}/shortcut-${viewport.width}.png`});
 }
 pass('320px, portrait and landscape touch controls put Security Camera above personal upgrades and return to the same spot');

 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await advance(300);await context.setOffline(true);await page.reload();await advance(300);await press('#pet-security-mobile');await advance(300);assert.ok(await page.locator('.security-overlay').isVisible());await page.keyboard.press('Escape');
 await press('[data-tab="pets"]');await press('.pet-remove');await press('[data-tab="home"]');assert.ok(await page.locator('#pet-security-mobile').isHidden());const stopped=(await snap()).basement.security;await page.reload();await advance(600);assert.deepEqual((await snap()).basement.security,stopped);assert.equal((await snap()).pets.equipped,null);assert.ok((await snap()).pets.owned.includes('camera'));
 pass('Offline reload supports remote security; unequipping hides the shortcut and preserves the paused encounter and permanent pet ownership');

 await open(ready({basement:true}));await press('#pet-security-shortcut');await advance(100);await press('[data-tab="elevator"]');assert.ok(await page.locator('.security-overlay').isHidden());
 await press('[data-action="basement-visit"]');await advance(300);await press('#lounge-computer');await press('[data-computer="security"]');await advance(200);
 assert.equal(await page.locator('[data-action="security-exit"]').textContent(),'Back to Computer');assert.match(await page.locator('.security-info').textContent(),/Catch \+\$15/);await advance(1300);const basementCash=(await snap()).money;await press('[data-person="robber"]');await advance(100);assert.equal((await snap()).money,basementCash+15);assert.equal(await page.locator('#security-feedback').textContent(),'Caught! +$15');await page.screenshot({path:`${out}/computer-catch-15.png`});await press('[data-action="security-exit"]');assert.ok(await page.locator('#computer-view').isVisible());
 pass('Leaving remote viewing clears its return context; computer security advertises and pays $15 with Lens Buddy equipped and returns to the desktop');
 assert.deepEqual(errors,[]);writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2));
}catch(e){await page?.screenshot({path:`${out}/failure.png`}).catch(()=>{});throw e;}finally{await context?.close();await browser.close();}
