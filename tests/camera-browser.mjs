import {chromium} from '@playwright/test';
import * as T from 'three';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';

const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
mkdirSync('test-results',{recursive:true});
try{
  for(const [mode,viewport] of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
    const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{const seed=sessionStorage.getItem('camera-seed');if(seed){localStorage.setItem('dfp.save',seed);sessionStorage.removeItem('camera-seed');}});await page.clock.install();await page.goto('http://127.0.0.1:4173/');await page.locator('#game').waitFor();
    for(const reducedMotion of [false,true])for(const [i,[x,y]] of [[.4,.4],[27.6,.4],[.4,17.6],[27.6,17.6],[14,2],[14,17.6]].entries()){
      const state=newGame();state.money=100000;for(let f=1;f<4;f++)command(state,{type:'floor',floor:f});command(state,{type:'visit',floor:i%4});state.settings.reducedMotion=reducedMotion;Object.assign(state.player,{x,y});
      await page.evaluate(data=>sessionStorage.setItem('camera-seed',data),encode(state));await page.reload();await page.locator('#game').waitFor();await page.clock.runFor(2400);
      const box=await page.locator('#game').boundingBox(),d=await page.locator('#game').evaluate(c=>c.dfpDiagnostics()),p=d.positions.find(a=>a.key==='player');
      assert.equal(d.floor,i%4);assert.ok(Math.hypot(p.x-x,p.y-y)<.15,'Saved boundary position must actually load');
      const width=Math.max(box.width<500?14.8:18.6,13.7*box.width/box.height),height=width*box.height/box.width,camera=new T.OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,80);
      camera.position.fromArray(d.camera);camera.lookAt(d.camera[0]-13,.4,d.camera[2]-16);camera.updateMatrixWorld();
      for(const h of [0,1.65]){const v=new T.Vector3(p.x,h,p.y).project(camera);assert.ok(Math.abs(v.x)<.92&&Math.abs(v.y)<.94,`${mode} reduced=${reducedMotion} position ${x},${y}: ${v.toArray()}`);}
      checks.push(`${mode}, reduced motion ${reducedMotion}, floor ${i%4+1}, boundary ${x}/${y}: player fully framed`);
    }
    await page.screenshot({path:`test-results/camera-${mode}.png`});await context.close();
  }
  assert.deepEqual(errors,[]);writeFileSync('test-results/camera-report.json',JSON.stringify({checks,errors},null,2));console.log(`PASS ${checks.length} phone boundary frames, including reduced motion`);
}finally{await browser.close();}
