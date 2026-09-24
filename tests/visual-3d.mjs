import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {newGame,command,step} from '../src/simulation.js';
import {encode,decode} from '../src/storage.js';
import {PRODUCTS} from '../src/config.js';

const URL=process.env.DFP_TEST_URL||'http://127.0.0.1:4173',out='artifacts/3d-upgrade';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const comparison=decode(readFileSync(`${out}/comparison-state.json`,'utf8')),errors=[],checks=[],performance=[];
let context,page;
async function launch(state,viewport={width:1440,height:900},record=false){
  if(context)await context.close();context=await browser.newContext({viewport,deviceScaleFactor:viewport.width<500?2:1,hasTouch:viewport.width<500,recordVideo:record?{dir:`${out}/video`,size:viewport}:undefined});
  await context.addInitScript(data=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('dfp.save',data);sessionStorage.setItem('seeded','1');}},encode(state));
  page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(URL);await page.locator('[data-station]').first().waitFor();return page;
}
function allFloors(){const s=newGame();s.money=100000;for(let floor=1;floor<4;floor++)command(s,{type:'floor',floor});for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});return s;}
async function snapshot(){return page.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));}
async function until(predicate,label,limit=40000){const start=Date.now();while(Date.now()-start<limit){if(predicate(await snapshot()))return;await page.waitForTimeout(200);}throw Error(`Timed out: ${label}`);}
async function benchmark(name){
  await page.waitForTimeout(1800);
  const stats=await page.evaluate(async()=>{
    const intervals=[];let prev=performance.now();const start=prev;
    await new Promise(resolve=>{function sample(){const now=performance.now();intervals.push(now-prev);prev=now;if(now-start>=5000)resolve();else requestAnimationFrame(sample);}requestAnimationFrame(sample);});
    const d=document.querySelector('#game').dfpDiagnostics(),gl=document.querySelector('#game').getContext('webgl2'),debug=gl.getExtension('WEBGL_debug_renderer_info');
    const sorted=intervals.slice(3).sort((a,b)=>a-b),render=d.renderMs.slice(-200).sort((a,b)=>a-b);
    return{fps:1000/(sorted.reduce((a,b)=>a+b)/sorted.length),frameMedianMs:sorted[Math.floor(sorted.length*.5)],frameP95Ms:sorted[Math.floor(sorted.length*.95)],cpuRenderP95Ms:render[Math.floor(render.length*.95)],drawCalls:d.calls,triangles:d.triangles,actors:d.actors,geometries:d.geometries,textures:d.textures,pixelRatio:d.pixelRatio,gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'unavailable',userAgent:navigator.userAgent};
  });performance.push({name,...stats});console.log(name,stats.fps.toFixed(1),'FPS, p95',stats.frameP95Ms.toFixed(1),'ms');
}
try{
  if(process.argv.includes('--record')){
    const s=newGame();s.money=600;command(s,{type:'product',id:'controller'});await launch(s,{width:1280,height:800},true);
    await page.locator('#tables-button').click();await page.locator('[data-action="buy-table"][data-id="0"]').click();await page.locator('[data-action="close"]').click();
    const go=async(id,test)=>{await page.locator(`[data-station="${id}"]`).click();await until(test,id);};
    await go('prep',s=>s.tutorial>=1);await until(s=>s.floors[0].customers.length>0,'first customer');const orderCount=(await snapshot()).floors[0].customers[0].needs.length;await go('fry',s=>s.floors[0].stock.controller>=orderCount);await go('pickup',s=>s.player.bag.length>=orderCount);await go('stack',s=>s.floors[0].counter.controller>=orderCount);await go('counter',s=>s.served>0);
    await page.locator('#tables-button').click();await page.locator('[data-action="walk-table"][data-id="0"]').click();await until(s=>s.player.action==='table0','walk to the table');await until(s=>s.floors[0].tables[0].state==='free','eat and clean');
    await page.locator('[data-tab="employees"]').click();await page.locator('[data-action="hire"][data-id="0"]').click();await page.locator('[data-tab="home"]').click();await page.keyboard.down('d');await page.waitForTimeout(700);await page.keyboard.up('d');
    await page.locator('#area-button').click();const served=(await snapshot()).served;await until(s=>s.served>served,'employee order',60000);await page.waitForTimeout(1800);
    const video=page.video();await context.close();context=null;copyFileSync(await video.path(),`${out}/gameplay.webm`);console.log('Recorded player loop and employee service');
  }else{
    for(const [name,viewport]of[['desktop',{width:1440,height:900}],['phone',{width:390,height:844}]]){
      await launch(comparison,viewport);await page.clock.install();await page.clock.runFor(300);await page.screenshot({path:`${out}/after-${name}.png`});
      assert.equal(await page.locator('#game').evaluate(c=>c.dfpDiagnostics().engine),'Three.js WebGL');
    }
    checks.push('Actual WebGL renders the same saved scene at desktop and phone sizes');
    for(let floor=1;floor<4;floor++){
      const s=allFloors();command(s,{type:'visit',floor});for(let i=0;i<4;i++)command(s,{type:'table',floor,id:i});for(let i=0;i<2;i++)command(s,{type:'hire',id:floor*5+i,floor});for(let i=0;i<950;i++)step(s,.05,{});
      if(floor===2){s.floors[2].shelves.souvenir=6;s.floors[2].shelves.keychain=6;}
      await launch(s);await page.clock.install();await page.clock.runFor(300);await page.screenshot({path:`${out}/floor-${floor+1}.png`});
    }
    await page.locator('[data-tab="outfits"]').click();await page.waitForTimeout(300);await page.screenshot({path:`${out}/outfits.png`});checks.push('All four themed floors and five 3D outfit previews captured');
    await launch(comparison);await benchmark('Desktop takeout · standard');
    await page.locator('[data-action="settings"]').click();await page.locator('[data-action="effects"]').click();await page.locator('[data-action="motion"]').click();await page.locator('[data-action="sound"]').click();await page.locator('[data-action="close"]').click();await page.reload();
    const prefs=(await snapshot()).settings;assert.deepEqual(prefs,{sound:false,reducedMotion:true,reducedEffects:true});await benchmark('Desktop takeout · reduced effects and motion');checks.push('Reduced effects, reduced motion and mute persist on reload');
    await page.evaluate(async()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await page.locator('[data-station="prep"]').waitFor();assert.equal((await snapshot()).settings.reducedEffects,true);await page.screenshot({path:`${out}/reduced-effects-offline.png`});await context.setOffline(false);checks.push('All 3D code and preferences load offline');
    const before=(await snapshot()).money;
    await page.locator('#game').evaluate(c=>{c.testLossExtension=c.getContext('webgl2').getExtension('WEBGL_lose_context');c.testLossExtension.loseContext();});await page.waitForTimeout(300);assert.ok(await page.locator('#game').evaluate(c=>c.dfpDiagnostics().contextLost));
    await page.locator('#game').evaluate(c=>{c.testLossExtension.restoreContext();delete c.testLossExtension;});await page.waitForTimeout(1500);assert.equal(await page.locator('#game').evaluate(c=>c.dfpDiagnostics().contextLost),false);assert.ok((await snapshot()).money>=before);checks.push('WebGL context restores without lost progress or renderer errors');
    const crowded=allFloors();for(let id=0;id<12;id++)command(crowded,{type:'hire',id,floor:0});for(let i=0;i<1200;i++)step(crowded,.05,{});await launch(crowded);await benchmark('Desktop takeout · 12 employees');await page.screenshot({path:`${out}/crowded.png`});
    const standard=JSON.parse(JSON.stringify(comparison));await launch(standard,{width:390,height:844});await benchmark('Phone viewport · standard (desktop GPU)');
    standard.settings.reducedEffects=true;await launch(standard,{width:390,height:844});await benchmark('Phone viewport · reduced effects (desktop GPU)');
    assert.deepEqual(errors,[]);checks.push('No uncaught browser errors');
    writeFileSync(`${out}/performance.json`,JSON.stringify({date:new Date().toISOString(),browser:'Microsoft Edge headless; real animation frames; 5 second samples after warmup',limitations:'Phone viewport uses the same desktop GPU. This is not a physical Android/iOS benchmark.',samples:performance},null,2));
    writeFileSync(`${out}/visual-checks.json`,JSON.stringify({checks,errors},null,2));
  }
}finally{if(context)await context.close();await browser.close();}
