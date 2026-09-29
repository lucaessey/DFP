import {chromium} from '@playwright/test';
import fs from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
const auditURL=process.env.DFP_TEST_URL||'http://127.0.0.1:4185';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
const state=newGame();state.money=1000;command(state,{type:'basement'});command(state,{type:'computer'});command(state,{type:'email'});
const page=await context.newPage(),requests=[],failed=[],errors=[];
page.on('request',r=>{const u=new URL(r.url());if(/identitytoolkit|securetoken|firebaseio|workers\.dev/.test(u.hostname))requests.push({method:r.method(),host:u.hostname,path:u.pathname});});
page.on('requestfailed',r=>{const u=new URL(r.url());failed.push({host:u.hostname,path:u.pathname,reason:r.failure()?.errorText});});
page.on('pageerror',()=>errors.push('Uncaught browser error'));
await context.addInitScript(value=>{if(!sessionStorage.getItem('audit-seed')){localStorage.setItem('dfp.save',value);sessionStorage.setItem('audit-seed','1');}},encode(state));
try{
 await page.goto(auditURL);await page.locator('[data-tab="elevator"]').click();await page.locator('[data-action="basement-visit"]').click();await page.locator('#lounge-computer').click();await page.locator('[data-computer="producer-signin"]').click();
 const signin={disabled:await page.locator('[data-people="send-link"]').isDisabled(),text:await page.locator('.producer-signin').innerText()};await page.screenshot({path:'artifacts/people-repair/before-signin.png'});
 await page.locator('[data-computer="desktop"]').click();await page.locator('[data-computer="email"]').click();if(await page.locator('[data-computer="buy-email"]').count())await page.locator('[data-computer="buy-email"]').click();await page.locator('[data-computer="people"]').click();await page.locator('[data-people="add"]').click();
 await page.locator('#comment-text').fill('This game is good.');await page.locator('#comment-rating').selectOption('5');await page.locator('#comment-audience').selectOption('everyone');
 const comments={disabled:await page.locator('#people-form [type="submit"]').isDisabled(),text:await page.locator('#people-form .people-status').innerText()};await page.screenshot({path:'artifacts/people-repair/before-submit.png'});
 await page.evaluate(()=>navigator.serviceWorker.ready);const pwa=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {controller:!!navigator.serviceWorker.controller,waiting:!!r?.waiting,active:r?.active?.scriptURL};});
 const report={date:new Date().toISOString(),url:auditURL,signin,comments,requests,failed,errors,pwa};fs.writeFileSync('artifacts/people-repair/before-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
