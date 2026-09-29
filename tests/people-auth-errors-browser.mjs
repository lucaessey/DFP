import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const context=await browser.newContext();const s=newGame();s.money=500;command(s,{type:'basement'});command(s,{type:'computer'});
 await context.addInitScript(data=>{if(!sessionStorage.getItem('seed')){localStorage.setItem('dfp.save',data);sessionStorage.setItem('seed','1');}},encode(s));const p=await context.newPage();
 await p.route('**/accounts:sendOobCode*',r=>r.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:{code:400,message:'TOO_MANY_ATTEMPTS_TRY_LATER'}})}));
 await p.goto('http://127.0.0.1:4188');await p.locator('[data-tab="elevator"]').click();await p.locator('[data-action="basement-visit"]').click();await p.locator('#lounge-computer').click();await p.locator('[data-computer="producer-signin"]').click();await p.locator('[data-people="send-link"]').click();await p.getByText(/email limit has been reached/).waitFor();assert.equal(await p.locator('[data-computer="producer"]').count(),0);assert.ok(await p.locator('[data-people="send-link"]').isDisabled());console.log('PASS failed email send shows the free-plan quota error, keeps cooldown and grants no access');
 await p.reload();await p.locator('[data-tab="elevator"]').click();await p.locator('[data-action="basement-visit"]').click();await p.locator('#lounge-computer').click();await p.locator('[data-computer="producer-signin"]').click();assert.ok(await p.locator('[data-people="send-link"]').isDisabled());console.log('PASS reload retains resend cooldown without modifying game progress');
 await p.goto('http://127.0.0.1:4188/?mode=signIn&oobCode=invalid-expired-test-code&apiKey=demo-key');await p.locator('#producer-email').fill('lucaessey@gmail.com');await p.locator('[data-people="complete-link"]').click();await p.getByText(/expired, already used/).waitFor();assert.ok(!p.url().includes('oobCode'));assert.equal(await p.locator('[data-computer="producer"]').count(),0);console.log('PASS invalid/expired email-link completion is rejected and strips the code from the address bar');
 await p.goto('http://127.0.0.1:4188/?mode=signIn&oobCode=malformed-link');await p.locator('#producer-email').fill('lucaessey@gmail.com');await p.locator('[data-people="complete-link"]').click();await p.getByText(/This link cannot be used/).waitFor();assert.equal(await p.locator('[data-people="complete-link"]').count(),0);assert.ok(await p.locator('[data-people="send-link"]').isVisible());console.log('PASS malformed link exits completion mode and restores the resend option');
 await context.close();
}finally{await browser.close();}
