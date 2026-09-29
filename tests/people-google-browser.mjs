import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
const url='http://127.0.0.1:4187',out='artifacts/people-google';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[],contexts=[];let p;
const pass=name=>{checks.push(name);console.log('PASS',name);};
const s=newGame();s.money=1000;for(const type of ['basement','computer','email'])command(s,{type});
async function open(viewport={width:390,height:844}){
  const c=await browser.newContext({viewport,hasTouch:true});contexts.push(c);
  // The emulator's optional remote styling can delay its inline event handlers.
  await c.route(/^https:\/\/(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,r=>r.abort());
  await c.addInitScript(data=>{if(window!==window.top||sessionStorage.getItem('google-seed'))return;localStorage.setItem('dfp.save',data);localStorage.setItem('dfp.producer.resendAfter',String(Date.now()+300000));sessionStorage.setItem('google-seed','1');},encode(s));
  const page=await c.newPage();p=page;page.on('pageerror',()=>errors.push('Uncaught browser error'));await page.goto(url);return page;
}
async function signin(page){await page.locator('[data-action="settings"]').tap();await page.locator('[data-action="producer-signin"]').tap();}
async function popup(page){const next=page.waitForEvent('popup');await page.locator('[data-people="google-signin"]').tap();return next;}
async function choose(window,email){await window.waitForLoadState('load');await window.getByRole('button',{name:'Add new account'}).click();await window.locator('#email-input').fill(email);await window.locator('#display-name-input').fill('Local test');await window.locator('#sign-in').click();}
async function computer(page){await page.locator('[data-tab="elevator"]').tap();await page.locator('[data-action="basement-visit"]').tap();await page.locator('#lounge-computer').tap();}
try{
  const page=await open();let emails=0;page.on('request',r=>{if(r.url().includes('accounts:sendOobCode'))emails++;});await signin(page);
  assert.ok(await page.locator('[data-people="send-link"]').isDisabled());await page.locator('[data-people="google-signin"]').waitFor();
  const cancelled=await popup(page);await cancelled.close();await page.getByText(/Google sign-in was cancelled/).waitFor();assert.ok(await page.locator('[data-people="google-signin"]').isEnabled());assert.equal(await page.locator('[data-people="open-producer"]').count(),0);pass('Cancelling Google sign-in restores controls and grants no access');
  const other=await popup(page);await choose(other,'different-owner@gmail.com');await page.getByText(/Other Google accounts cannot open Producer/).waitFor();assert.equal(await page.locator('[data-people="open-producer"]').count(),0);assert.equal(await page.locator('[data-people="signout"]').count(),0);pass('A different Google account is denied and signed out of the attempted Producer flow');
  const owner=await popup(page);assert.ok(await page.locator('[data-people="google-signin"]').isDisabled());await choose(owner,'lucaessey@gmail.com');await page.getByText(/Producer verified/).waitFor();assert.equal(emails,0);await page.screenshot({path:out+'/google-verified-phone.png'});pass('The Google owner is verified with real emulator authentication and protected reads, even during email cooldown and without a moderation backend');
  await page.locator('#producer-link-close').tap();await computer(page);await page.locator('[data-computer="producer"]').tap();await page.locator('.people-service-notice').waitFor();await page.reload();await computer(page);await page.locator('[data-computer="producer"]').waitFor();assert.equal(await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data).money),s.money);pass('Google session and Producer app restore after reload without changing purchases or balance');
  await page.locator('[data-computer="producer-signin"]').tap();await page.locator('[data-people="signout"]').tap();await page.getByText(/Signed out/).waitFor();await page.reload();await computer(page);assert.equal(await page.locator('[data-computer="producer"]').count(),0);pass('Google sign-out persists and removes private access');
  await page.locator('[data-computer="producer-signin"]').tap();await page.setViewportSize({width:844,height:390});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:out+'/google-signin-landscape.png'});await page.evaluate(()=>navigator.serviceWorker.ready);await page.context().setOffline(true);await page.reload();await computer(page);await page.locator('[data-computer="producer-signin"]').tap();assert.ok(await page.locator('[data-people="google-signin"]').isDisabled());assert.equal(await page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data).money),s.money);pass('Phone layouts fit; offline reload preserves the game and disables online sign-in');
  const blocked=await open();await blocked.addInitScript(()=>{window.open=()=>null;});await blocked.reload();await signin(blocked);await blocked.locator('[data-people="google-signin"]').tap();await blocked.getByText(/Allow pop-ups for this site/).waitFor();assert.ok(await blocked.locator('[data-people="google-signin"]').isEnabled());assert.equal(await blocked.locator('[data-people="open-producer"]').count(),0);pass('A blocked popup reports actionable help and allows retry without granting access');
  assert.deepEqual(errors,[]);
}catch(e){await p?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}
finally{writeFileSync(out+'/report.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));await Promise.all(contexts.map(c=>c.close()));await browser.close();}
