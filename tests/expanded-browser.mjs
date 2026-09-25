import {chromium} from '@playwright/test';
import * as T from 'three';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command,step} from '../src/simulation.js';
import {PRODUCTS,BALANCE as B,WORLD} from '../src/config.js';
import {paymentQuote} from '../src/economy.js';
import {encode} from '../src/storage.js';

const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[],frames=[];
mkdirSync('test-results/expanded',{recursive:true});
const seed=newGame();seed.money=1000000;
for(let f=1;f<4;f++)command(seed,{type:'floor',floor:f});
for(const p of PRODUCTS)command(seed,{type:'product',floor:p.floor,id:p.id});
for(let f=0;f<4;f++){for(let i=0;i<6;i++)command(seed,{type:'table',floor:f,id:i});for(let i=0;i<2;i++)command(seed,{type:'hire',floor:f,id:f*5+i});}
for(let i=0;i<1600;i++)step(seed,.05,{pausedPlayer:true});
for(let f=0;f<4;f++)assert.ok(seed.floors[f].revenue>0,`Floor ${f+1} workers must earn`);
try{
  for(const [mode,viewport] of [['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]])for(let floor=0;floor<4;floor++){
    const state=structuredClone(seed);command(state,{type:'visit',floor});
    const context=await browser.newContext({viewport,isMobile:mode!=='desktop',hasTouch:mode!=='desktop'});
    await context.addInitScript(data=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('dfp.save',data);sessionStorage.setItem('seeded','yes');}},encode(state));
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto('http://127.0.0.1:4173/');await page.locator('#tables-button').waitFor();await page.clock.runFor(1000);
    const livePlayer=()=>page.locator('#game').evaluate(c=>c.dfpDiagnostics().positions.find(p=>p.key==='player'));
    const snapshot=()=>page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
    const press=async selector=>mode==='desktop'?page.locator(selector).click():page.locator(selector).tap();
    async function until(predicate,label){for(let i=0;i<100;i++){if(predicate(await snapshot()))return;await page.clock.runFor(250);}throw Error(`${mode} floor ${floor+1}: ${label}`);}
    async function framing(area){
      const box=await page.locator('#game').boundingBox(),d=await page.locator('#game').evaluate(c=>c.dfpDiagnostics()),player=d.positions.find(p=>p.key==='player');
      const width=Math.max(box.width<500?14.8:18.6,13.7*box.width/box.height),height=width*box.height/box.width,camera=new T.OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,80);camera.position.fromArray(d.camera);camera.lookAt(d.camera[0]-13,.4,d.camera[2]-16);camera.updateMatrixWorld();
      const foot=new T.Vector3(player.x,0,player.y).project(camera),head=new T.Vector3(player.x,1.65,player.y).project(camera),pixels=(head.y-foot.y)*box.height/2;
      assert.ok(Math.abs(foot.x)<.92&&Math.abs(foot.y)<.94&&Math.abs(head.y)<.98,`Player clipped in ${mode} ${area}`);assert.ok(pixels>=20,`Character too small: ${pixels}px`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await page.locator('[data-tab]').count(),4);frames.push({floor:floor+1,mode,area,characterHeight:Math.round(pixels),calls:d.calls});
      await page.screenshot({path:`test-results/expanded/${mode}-floor-${floor+1}-${area}.png`,fullPage:true});
    }
    if(mode==='desktop'){
      await press('#menu-button');const current=await snapshot();
      for(const product of PRODUCTS.filter(p=>p.floor===floor)){
        const raw=B.prices[product.id]??(product.id==='vr'?B.vrBaseReward:B.quarters),expected=paymentQuote(current,floor,current.player,raw).amount;
        const row=page.locator('.product-list article').filter({has:page.locator(`[data-id="${product.id}"]`)});assert.ok((await row.locator('small').textContent()).includes(`$${expected.toLocaleString('en-US')}`));
      }
      await press('[data-action="close"]');checks.push(`Floor ${floor+1}: all earnings previews use actual collection amounts`);
    }
    await framing('work');await press('#area-button');await until(s=>Math.hypot(s.player.x-WORLD.dining.x,s.player.y-WORLD.dining.y)<.3,'reach expanded dining area');await page.clock.runFor(800);await framing('dining');
    await press('#tables-button');await press('[data-action="walk-table"][data-id="5"]');await until(s=>s.player.action==='table5','reach farthest table');await page.clock.runFor(600);await framing('far-table');
    if(mode!=='desktop'){
      const joy=await page.locator('#joystick').boundingBox(),cdp=await context.newCDPSession(page),before=await livePlayer();
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:joy.x+joy.width/2,y:joy.y+joy.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:joy.x+joy.width/2-27,y:joy.y+joy.height/2}]});await page.clock.runFor(400);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.clock.runFor(250);const stopped=await livePlayer();assert.ok(Math.hypot(stopped.x-before.x,stopped.y-before.y)>.1);await page.clock.runFor(500);assert.equal((await livePlayer()).x,stopped.x);assert.equal((await livePlayer()).y,stopped.y);
    }
    await press('[data-tab="elevator"]');await press(`[data-action="visit"][data-floor="${floor}"]`);assert.equal((await snapshot()).floor,floor);
    await page.reload();await page.clock.runFor(500);assert.ok((await snapshot()).floors[floor].tables.every(t=>t.owned));assert.equal((await snapshot()).employees.length,8);
    checks.push(`${mode} floor ${floor+1}: work, dining, far-table framing, navigation, Elevator and saved progress${mode==='desktop'?'':', real touch movement and release'}`);console.log('PASS',checks.at(-1));await context.close();
  }
  assert.deepEqual(errors,[]);writeFileSync('test-results/expanded/report.json',JSON.stringify({checks,frames,errors},null,2));
}finally{await browser.close();}
