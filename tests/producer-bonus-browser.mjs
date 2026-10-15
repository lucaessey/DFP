import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
const url='http://127.0.0.1:4188',out='artifacts/producer-bonus';mkdirSync(out,{recursive:true});
const ns='demo-dfp-comments-default-rtdb',database='http://127.0.0.1:9000/producerRewards';
const browser=await chromium.launch({channel:'msedge',headless:true}),contexts=[],checks=[],errors=[];let current;
const seed=newGame();seed.money=10000;seed.settings.sound=false;for(const type of ['basement','computer','email'])command(seed,{type});
const saved=encode(seed),balance=seed.money,pass=s=>{checks.push(s);console.log('PASS',s);};
async function admin(path='',options={}){const r=await fetch(`${database}${path?'/'+path:''}.json?ns=${ns}`,{headers:{authorization:'Bearer owner','content-type':'application/json'},...options});assert.ok(r.ok);return r.json();}
const read=p=>p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
async function open(){
 const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});contexts.push(c);
 await c.addInitScript(data=>{if(window!==window.top||sessionStorage.seeded)return;localStorage.setItem('dfp.save',data);sessionStorage.seeded='1';},saved);
 const p=await c.newPage();current=p;p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.locator('#game').waitFor();return p;
}
async function computer(p){await p.locator('[data-tab="elevator"]').tap();await p.locator('[data-action="basement-visit"]').tap();await p.locator('#lounge-computer').tap();}
async function producer(p){await p.locator('[data-computer="producer"]').waitFor();await p.locator('[data-computer="producer"]').tap();await p.locator('[data-people="claim-bonus"]').filter({hasText:/Claim|Recover|Retry/}).waitFor();}
async function refresh(p){await p.locator('[data-computer="desktop"]').tap();await producer(p);}
async function ownerSession(){
 const p=await open();await computer(p);await p.locator('[data-computer="producer-signin"]').tap();await p.locator('[data-people="send-link"]').tap();await p.getByText(/Firebase accepted the email request/).waitFor();
 const data=await (await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-dfp-comments/oobCodes')).json();
 const mail=data.oobCodes.filter(x=>x.email==='lucaessey@gmail.com').at(-1),link=new URL(url);link.search=new URL(mail.oobLink).search;
 await p.goto(link.href);await p.locator('#producer-email').fill('lucaessey@gmail.com');await p.locator('[data-people="complete-link"]').tap();await p.getByText(/Producer verified/).waitFor();
 await p.locator('#producer-link-close').tap();await computer(p);await producer(p);return p;
}
try{
 await admin('',{method:'DELETE'}); // Only disposable local emulator data.
 const ordinary=await open();await computer(ordinary);assert.equal(await ordinary.locator('[data-computer="producer"]').count(),0);
 await ordinary.locator('[data-computer="email"]').tap();await ordinary.locator('[data-computer="people"]').tap();assert.equal(await ordinary.locator('[data-people="claim-bonus"]').count(),0);pass('Ordinary player has no Producer app or cash claim');
 const p=await ownerSession();let writes=0;p.on('request',r=>{if(r.method()==='PATCH'&&r.url().includes('/producerRewards.json'))writes++;});
 await p.locator('[data-people="claim-bonus"]').evaluate(b=>{b.click();b.click();b.click();});
 await p.getByText('Added $1,000 to your game.',{exact:true}).waitFor();assert.equal((await read(p)).money,balance+1000);assert.equal(writes,1);
 assert.ok(await p.locator('[data-people="claim-bonus"]').isDisabled());assert.match(await p.locator('[data-people="claim-bonus"]').textContent(),/Claim in [45]:/);
 await p.screenshot({path:`${out}/producer-phone.png`});pass('Verified producer rapid taps make one request and add exactly $1000 with a disabled countdown');
 await p.reload();await computer(p);await producer(p);assert.equal((await read(p)).money,balance+1000);assert.ok(await p.locator('[data-people="claim-bonus"]').isDisabled());
 const second=await ownerSession();assert.ok(await second.locator('[data-people="claim-bonus"]').isDisabled());assert.equal((await read(second)).money,balance);pass('Reload restores money/session/cooldown; a separate device session cannot claim again');
 // Advancing only the display clock cannot advance the Firebase server's cooldown.
 await p.clock.install();await p.clock.setFixedTime(new Date(Date.now()+600000));await p.clock.runFor(1100);
 await p.locator('[data-people="claim-bonus"]').tap();await p.clock.runFor(200);
 await p.getByText(/Cash claim unavailable/).waitFor();assert.equal((await read(p)).money,balance+1000);assert.equal(Object.keys(await admin('receipts')).length,1);
 await p.clock.setSystemTime(new Date());await p.clock.resume();pass('Fast-forwarding the browser clock is rejected by server rules and grants no cash');
 await admin('limit',{method:'PATCH',body:JSON.stringify({claimedAt:Date.now()-300001})});await refresh(p);
 await p.locator('[data-people="claim-bonus"]').tap();await p.getByText('Added $1,000 to your game.',{exact:true}).waitFor();assert.equal((await read(p)).money,balance+2000);pass('After the server cooldown expires a manual claim adds exactly another $1000');
 await admin('limit',{method:'PATCH',body:JSON.stringify({claimedAt:Date.now()-300001})});await refresh(p);
 let committed=false;
 await p.route('**/producerRewards.json?**',async route=>{if(route.request().method()==='PATCH'){await route.fetch();committed=true;return route.abort('failed');}return route.continue();});
 await p.route('**/producerRewards/receipts/**',route=>committed?route.abort('failed'):route.continue());
 await p.locator('[data-people="claim-bonus"]').tap();await p.getByText(/Cash could not be confirmed/).waitFor();assert.equal((await read(p)).money,balance+2000);assert.ok((await read(p)).producerBonus.pending);
 await p.unrouteAll({behavior:'wait'});await p.reload();await computer(p);await producer(p);
 assert.equal(await p.locator('[data-people="claim-bonus"]').textContent(),'Recover $1,000');
 const count=Object.keys(await admin('receipts')).length;await p.locator('[data-people="claim-bonus"]').tap();await p.getByText('Added $1,000 to your game.',{exact:true}).waitFor();
 assert.equal((await read(p)).money,balance+3000);assert.equal(Object.keys(await admin('receipts')).length,count);pass('Lost confirmation preserves pending claim; reload recovers the original receipt without another server payout');
 await p.setViewportSize({width:844,height:390});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.locator('[data-people="claim-bonus"]').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/producer-landscape.png`});
 await p.setViewportSize({width:1360,height:900});await p.screenshot({path:`${out}/producer-desktop.png`});pass('Touch controls and claim card fit phone portrait, landscape and desktop');
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.context().setOffline(true);await p.getByText('Producer Sign-in',{exact:true}).last().waitFor();assert.equal(await p.locator('[data-people="claim-bonus"]').count(),0);
 await p.locator('[data-computer="dfp"]').tap();await p.reload();await p.locator('#game').waitFor();assert.equal((await read(p)).money,balance+3000);assert.ok((await read(p)).basement.computer.owned);
 await p.context().setOffline(false);await computer(p);await producer(p);await p.locator('[data-people="signout"]').tap();await p.getByText(/Signed out/).waitFor();assert.equal(await p.locator('[data-people="claim-bonus"]').count(),0);pass('Offline and sign-out remove claiming; offline game reload preserves purchases and claimed balance');
 assert.deepEqual(errors,[]);writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2));console.log(`${checks.length} browser groups passed.`);
}catch(e){await current?.screenshot({path:`${out}/failure.png`}).catch(()=>{});throw e;}
finally{await Promise.all(contexts.map(c=>c.close()));await browser.close();}
