import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
const production='http://127.0.0.1:4174/DFP/',emulator='http://127.0.0.1:4188/';
const out='artifacts/people-domain';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),contexts=[],checks=[],errors=[];
const seed=newGame();seed.money=1000;seed.settings.sound=false;for(const type of ['basement','computer','email'])command(seed,{type});
const saved=encode(seed),pass=s=>{checks.push(s);console.log('PASS',s);};
async function open(url){
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});contexts.push(context);
 await context.addInitScript(data=>{if(window!==window.top||sessionStorage.seeded)return;localStorage.setItem('dfp.save',data);sessionStorage.seeded='1';},saved);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await page.locator('#game').waitFor();return page;
}
async function signin(p){await p.locator('[data-action="settings"]').tap();await p.locator('[data-action="producer-signin"]').tap();}
const tap=(p,a)=>p.locator(`[data-people="${a}"]`).tap();
const balance=p=>p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data).money);
async function computer(p){await p.locator('[data-tab="elevator"]').tap();await p.locator('[data-action="basement-visit"]').tap();await p.locator('#lounge-computer').tap();}
try{
 const p=await open(production);let requests=[],release;const gate=new Promise(r=>release=r);
 // Intercept the real SDK's production request. No real email is sent and no quota is consumed.
 await p.route('**/identitytoolkit.googleapis.com/**',async route=>{
   if(!route.request().url().includes('/accounts:sendOobCode'))return route.abort();
   requests.push(route.request().postDataJSON());await gate;
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({email:'lucaessey@gmail.com'})});
 });
 await signin(p);await Promise.all([p.waitForRequest('**/accounts:sendOobCode*'),p.locator('[data-people="send-link"]').evaluate(b=>{b.click();b.click();})]);
 assert.equal(await p.getByText(/Firebase accepted the email request/).count(),0);release();
 await p.getByText(/Firebase accepted the email request/).waitFor();assert.equal(requests.length,1);
 assert.equal(requests[0].continueUrl,'https://www.deepfriedpixels.com/DFP/');assert.equal(requests[0].canHandleCodeInApp,true);assert.equal(requests[0].requestType,'EMAIL_SIGNIN');
 assert.equal(new URL(requests[0].continueUrl).search,'');assert.equal(await balance(p),seed.money);
 pass('Production SDK sends one email request returning to https://www.deepfriedpixels.com/DFP/ and waits for confirmation');
 const denied=await open(production);await denied.route('**/identitytoolkit.googleapis.com/**',route=>route.request().url().includes('/accounts:sendOobCode')?route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:400,message:'UNAUTHORIZED_DOMAIN'}})}):route.abort());
 await signin(denied);await tap(denied,'send-link');await denied.getByText(/This website is not authorized/).waitFor();
 assert.match(await denied.locator('.producer-signin .people-status').textContent(),/deepfriedpixels.com and www.deepfriedpixels.com/);
 assert.equal(await denied.locator('[data-people="open-producer"]').count(),0);assert.equal(await balance(denied),seed.money);
 await denied.screenshot({path:`${out}/domain-setup.png`});pass('Missing domain authorization explains exact setup without granting access or changing progress');
 const sender=await open(emulator);await signin(sender);await tap(sender,'send-link');await sender.getByText(/Firebase accepted the email request/).waitFor();
 const data=await (await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-dfp-comments/oobCodes')).json();
 const mail=data.oobCodes.filter(m=>m.email==='lucaessey@gmail.com').at(-1),link=new URL(emulator);link.search=new URL(mail.oobLink).search;
 const receiver=await open(emulator);await receiver.goto(link.href);await receiver.locator('#producer-email').waitFor();
 assert.equal(await receiver.locator('#producer-email').inputValue(),'');assert.equal(new URL(receiver.url()).search,'');
 await receiver.locator('#producer-email').fill('other@example.com');await tap(receiver,'complete-link');await receiver.getByText(/Enter the producer email/).waitFor();assert.equal(await receiver.locator('[data-people="open-producer"]').count(),0);
 await receiver.locator('#producer-email').fill('lucaessey@gmail.com');await tap(receiver,'complete-link');await receiver.getByText(/Producer verified/).waitFor();
 assert.equal(await balance(receiver),seed.money);await receiver.locator('#producer-link-close').tap();await computer(receiver);await receiver.locator('[data-computer="producer"]').waitFor();
 await receiver.reload();await computer(receiver);await receiver.locator('[data-computer="producer"]').waitFor();assert.equal(await balance(receiver),seed.money);
 pass('Auth emulator: another browser confirms the owner email, rejects a wrong email, restores Producer after reload and preserves progress');
 assert.deepEqual(errors,[]);writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors,productionContinueURL:requests[0].continueUrl,realEmailsSent:0},null,2));
}finally{await Promise.all(contexts.map(c=>c.close()));await browser.close();}
