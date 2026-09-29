import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
const noAPI='http://127.0.0.1:4187',withAPI='http://127.0.0.1:4186',api='http://127.0.0.1:8787',auth='http://127.0.0.1:9099',db='http://127.0.0.1:9000',out='artifacts/people-repair';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),contexts=[],checks=[],errors=[];
const pass=name=>{checks.push(name);console.log('PASS',name);};
const seed=newGame();seed.money=1000;for(const type of ['basement','computer','email'])command(seed,{type});
const initial=encode(seed);let current;
async function page(url=noAPI,fresh=false){
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});contexts.push(context);
  if(!fresh)await context.addInitScript(data=>{if(window!==window.top||sessionStorage.getItem('repair-seed'))return;localStorage.setItem('dfp.save',data);sessionStorage.setItem('repair-seed','1');},initial);
  const p=await context.newPage();current=p;p.on('pageerror',()=>errors.push('Uncaught browser error'));await p.goto(url);await p.locator('#game').waitFor();return p;
}
const tap=(p,action)=>p.locator(`[data-people="${action}"]`).first().tap();
async function computer(p){await p.locator('[data-tab="elevator"]').tap();await p.locator('[data-action="basement-visit"]').tap();await p.locator('#lounge-computer').tap();}
async function form(p){await computer(p);await p.locator('[data-computer="email"]').tap();await p.locator('[data-computer="people"]').tap();await tap(p,'add');}
async function fill(p,text='Good game.',audience='everyone'){await p.locator('#comment-text').fill(text);await p.locator('#comment-rating').selectOption('4');await p.locator('#comment-audience').selectOption(audience);if(audience==='producer')await p.locator('[name="acknowledged"]').check();}
const submit=p=>p.locator('#people-form [type="submit"]').tap();
const saved=p=>p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
const draft=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('dfp.peopleComments.draft')));
try{
  const fresh=await page(noAPI,true);await fresh.waitForFunction(()=>localStorage.getItem('dfp.save'));const old=await saved(fresh);
  await fresh.locator('[data-action="settings"]').tap();await fresh.locator('[data-action="producer-signin"]').tap();
  assert.ok(await fresh.locator('[data-people="send-link"]').isEnabled());assert.equal((await saved(fresh)).money,old.money);assert.equal((await saved(fresh)).basement.unlocked,false);
  pass('Settings sign-in is reachable without buying the basement or connecting a comments backend');
  let sends=0,release;const blocked=new Promise(resolve=>release=resolve);
  await fresh.route('**/accounts:sendOobCode*',async route=>{sends++;await blocked;await route.continue();});
  await Promise.all([fresh.waitForRequest('**/accounts:sendOobCode*'),tap(fresh,'send-link')]);
  assert.ok(await fresh.locator('[data-people="send-link"]').isDisabled());assert.equal(await fresh.getByText(/Sign-in email sent/).count(),0);
  release();await fresh.getByText(/Sign-in email sent/).waitFor();assert.equal(sends,1);
  pass('Unconfigured frontend requests Firebase email once and reports success only after confirmation');
  const mail=(await (await fetch(auth+'/emulator/v1/projects/demo-dfp-comments/oobCodes')).json()).oobCodes.filter(x=>x.email==='lucaessey@gmail.com').at(-1);
  const link=new URL(noAPI);link.search=new URL(mail.oobLink).search;
  const owner=await page();await owner.goto(link.href);await owner.locator('#producer-email').fill('lucaessey@gmail.com');await tap(owner,'complete-link');await owner.getByText(/Producer verified/).waitFor();await owner.locator('#producer-link-close').tap();
  await computer(owner);await owner.locator('[data-computer="producer"]').tap();await owner.locator('.people-status').filter({hasNotText:'Loading comments…'}).waitFor();
  assert.match(await owner.locator('.people-service-notice').textContent(),/read your inbox/);assert.equal(await owner.locator('.people-results [data-people]:enabled').count(),0);
  await owner.screenshot({path:out+'/owner-without-backend-phone.png'});
  await owner.reload();await computer(owner);await owner.locator('[data-computer="producer"]').waitFor();await owner.locator('[data-computer="producer"]').tap();
  pass('Email-link completion and owner inbox reads work without the API; a reload restores the verified session');
  await tap(owner,'signout');await owner.getByText(/Signed out/).waitFor();await owner.reload();await computer(owner);assert.equal(await owner.locator('[data-computer="producer"]').count(),0);
  pass('Explicit sign-out persists across reload and removes private access');
  const ordinary=await page();await ordinary.evaluate(()=>{localStorage.setItem('dfp.producer.email','lucaessey@gmail.com');localStorage.setItem('producer','true');localStorage.setItem('owner','true');});await form(ordinary);
  await fill(ordinary,'Please add more tables.','producer');assert.ok(await ordinary.locator('#people-form [type="submit"]').isDisabled());assert.match(await ordinary.locator('.people-status').textContent(),/moderation service is not connected/);assert.equal(await ordinary.locator('.people-receipt').count(),0);
  const beforeDraft=await draft(ordinary);await ordinary.evaluate(()=>navigator.serviceWorker.ready);await ordinary.context().setOffline(true);await ordinary.reload();await form(ordinary);assert.equal((await draft(ordinary)).requestId,beforeDraft.requestId);assert.equal(await ordinary.locator('#comment-text').inputValue(),'Please add more tables.');assert.equal((await saved(ordinary)).money,seed.money);assert.equal(await ordinary.locator('[data-computer="producer"]').count(),0);
  pass('Missing moderation cannot publish; offline reload preserves draft, request ID, purchases and balance; local owner flags grant no access');
  const playerToken=await (await fetch(auth+'/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({returnSecureToken:true})})).json();
  for(const area of ['private','pending','ownerPublic']){
    const target=new URL(`${db}/peopleComments/${area}/all.json`);target.search=new URLSearchParams({ns:'demo-dfp-comments-default-rtdb',orderBy:'"$key"',limitToLast:'21',auth:playerToken.idToken});
    assert.equal((await fetch(target)).status,401);
  }
  pass('Direct database requests by an ordinary authenticated player are denied for all private views');
  const retry=await page(withAPI);await form(retry);await fill(retry,'Good game.');
  await retry.route('**/accounts:signUp*',r=>r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:400,message:'OPERATION_NOT_ALLOWED'}})}));
  await submit(retry);await retry.getByText(/Player sign-in failed/).waitFor();assert.ok(await retry.locator('#people-form [type="submit"]').isEnabled());assert.equal(await retry.locator('#comment-text').inputValue(),'Good game.');await retry.unroute('**/accounts:signUp*');
  pass('Disabled anonymous authentication produces a useful error and preserves the form for retry');
  const requestId=(await draft(retry)).requestId;let requests=0;
  await retry.route(api+'/comments',async route=>{requests++;await route.fetch();await route.abort('failed');});
  await submit(retry);await retry.getByText(/Connection failed/).waitFor();assert.equal((await draft(retry)).requestId,requestId);assert.equal(await retry.locator('.people-receipt').count(),0);assert.ok(await retry.locator('#people-form [type="submit"]').isEnabled());
  await retry.unroute(api+'/comments');await submit(retry);await retry.locator('.people-receipt').waitFor();assert.equal(await retry.locator('.people-receipt h2').textContent(),'Published');assert.equal(requests,1);
  const records=await (await fetch(db+'/peopleComments/internal/records.json?ns=demo-dfp-comments-default-rtdb',{headers:{authorization:'Bearer owner'}})).json();
  const crypto=await import('node:crypto');const matching=Object.values(records).filter(r=>crypto.createHash('sha256').update(r.uid+'\n'+requestId).digest('hex').slice(0,48)===r.id);assert.equal(matching.length,1);
  pass('A committed submission with a lost response retries under the same ID and creates exactly one published record');
  const timeout=await page(withAPI);await form(timeout);await fill(timeout,'Please add more games.');let stalled;
  await timeout.route(api+'/comments',route=>{stalled=route;});await submit(timeout);await timeout.getByText(/No confirmation received/).waitFor({timeout:22000});assert.equal(await timeout.locator('#comment-text').inputValue(),'Please add more games.');assert.ok(await timeout.locator('#people-form [type="submit"]').isEnabled());assert.equal(await timeout.locator('.people-receipt').count(),0);await stalled.abort().catch(()=>{});await timeout.unroute(api+'/comments');
  await timeout.route(api+'/comments',r=>r.fulfill({contentType:'application/json',body:'{}'}));await submit(timeout);await timeout.getByText(/did not confirm receipt/).waitFor();assert.equal(await timeout.locator('.people-receipt').count(),0);await timeout.unroute(api+'/comments');await submit(timeout);await timeout.locator('.people-receipt').waitFor();
  pass('Stalled and invalid responses release loading controls without losing the draft or claiming success; a later retry succeeds');
  assert.deepEqual(errors,[]);
}catch(e){await current?.screenshot({path:out+'/repair-failure.png'}).catch(()=>{});throw e;}
finally{writeFileSync(out+'/repair-report.json',JSON.stringify({date:new Date().toISOString(),checks,errors},null,2));await Promise.all(contexts.map(c=>c.close()));await browser.close();}
