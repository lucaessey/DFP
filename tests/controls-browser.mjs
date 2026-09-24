import {chromium} from '@playwright/test';
import * as T from 'three';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command} from '../src/simulation.js';
import {encode} from '../src/storage.js';

const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
mkdirSync('test-results',{recursive:true});
let context,page;
async function launch(phone=false){
  if(context)await context.close();
  context=await browser.newContext({viewport:phone?{width:390,height:844}:{width:1440,height:900},hasTouch:phone,isMobile:phone});
  const state=newGame();state.money=1000;command(state,{type:'product',id:'controller'});command(state,{type:'product',id:'drink'});state.floors[0].stock.controller=6;
  await context.addInitScript(data=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('dfp.save',data);sessionStorage.setItem('seeded','yes');}},encode(state));
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.clock.install();await page.goto(process.env.DFP_TEST_URL||'http://127.0.0.1:4173/');await page.locator('#tables-button').waitFor();await page.clock.runFor(300);
}
const player=()=>page.locator('#game').evaluate(canvas=>canvas.dfpDiagnostics().positions.find(p=>p.key==='player'));
async function stopped(label){
  await page.clock.runFor(50);const before=await player();await page.clock.runFor(2500);const after=await player();
  assert.equal(after.x,before.x,label);assert.equal(after.y,before.y,label);assert.equal(after.walk,0,label);checks.push(label);
}
async function groundPoint(x,z){
  const box=await page.locator('#game').boundingBox(),position=await page.locator('#game').evaluate(c=>c.dfpDiagnostics().camera);
  const width=Math.max(box.width<500?14.8:18.6,13.7*box.width/box.height),height=width*box.height/box.width;
  const camera=new T.OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,80);camera.position.fromArray(position);camera.lookAt(position[0]-13,.4,position[2]-16);camera.updateMatrixWorld();
  const point=new T.Vector3(x,0,z).project(camera);return{x:box.x+(point.x*.5+.5)*box.width,y:box.y+(-point.y*.5+.5)*box.height};
}
try{
  await launch();
  let before=await player();await page.keyboard.down('d');await page.clock.runFor(650);await page.keyboard.up('d');assert.ok((await player()).x>before.x+.2);await stopped('Keyboard release stops the player and walking animation');
  await launch();const point=await groundPoint(8,5);before=await player();await page.mouse.move(point.x,point.y);await page.mouse.down();await page.clock.runFor(700);await page.mouse.up();assert.ok((await player()).x>before.x+.2);await stopped('Holding the floor moves; mouse release stops immediately');
  await page.locator('#area-button').click();await page.clock.runFor(600);await page.locator('#stop-movement').click();await stopped('The stop button cancels explicit station/area walking');
  await page.locator('#area-button').click();await page.clock.runFor(300);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await stopped('Losing window focus cancels automatic movement');
  await page.keyboard.down('a');await page.clock.runFor(200);await page.locator('[data-action="settings"]').click();await page.keyboard.up('a');await page.locator('[data-action="close"]').click();await stopped('Closing a menu does not resume old movement');
  await launch();before=await player();await page.locator('[data-station="pickup"]').focus();await page.keyboard.press('Enter');await page.clock.runFor(600);assert.ok(Math.hypot((await player()).x-before.x,(await player()).y-before.y)>.2);await page.locator('#stop-movement').click();await stopped('Keyboard activation of station icons works and remains cancellable');
  assert.ok(await page.locator('[data-station]').evaluateAll(buttons=>buttons.every(b=>b.textContent===''&&b.getAttribute('aria-label')&&b.querySelector('svg'))));
  assert.equal(await page.locator('#floor-guide').isVisible(),false);assert.equal(await page.locator('.movement-hint').isVisible(),false);assert.equal(await page.locator('.player-label').count(),0);
  assert.equal(await page.locator('.order-bubble').evaluateAll(labels=>labels.some(label=>/[A-Za-z]/.test(label.textContent))),false);
  checks.push('Floating words are replaced with accessible action/order icons; useful menus remain');
  await launch();await page.screenshot({path:'test-results/controls-desktop.png'});
  await launch(true);const joy=await page.locator('#joystick').boundingBox(),cdp=await context.newCDPSession(page);
  async function touchMove(){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:joy.x+joy.width/2,y:joy.y+joy.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:joy.x+joy.width/2+30,y:joy.y+joy.height/2}]});await page.clock.runFor(500);}
  before=await player();await touchMove();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok((await player()).x>before.x+.1);await stopped('Real joystick touch release stops movement');
  await touchMove();await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await stopped('Cancelled joystick touches stop movement');
  await page.screenshot({path:'test-results/controls-phone.png'});
  assert.deepEqual(errors,[]);writeFileSync('test-results/controls-report.json',JSON.stringify({checks,errors},null,2));checks.forEach(check=>console.log('PASS',check));
}finally{if(context)await context.close();await browser.close();}
