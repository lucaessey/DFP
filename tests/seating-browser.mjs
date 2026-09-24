import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command,step} from '../src/simulation.js';
import {encode} from '../src/storage.js';
import {tableCost} from '../src/config.js';
const out='artifacts/3d-upgrade';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge'}),checks=[],errors=[];
try{
  for(let floor=0;floor<4;floor++){
    const s=newGame();s.money=10000;for(let f=1;f<=floor;f++)command(s,{type:'floor',floor:f});command(s,{type:'visit',floor});const food=['controller','tower','snack2','snack3'][floor];command(s,{type:'product',id:food});s.floors[0].stock.controller=5;
    for(let i=0;i<380;i++)step(s,.05,{pausedPlayer:true});
    const viewport=floor===0?{width:390,height:844}:{width:1440,height:900},context=await browser.newContext({viewport,hasTouch:floor===0});await context.addInitScript(d=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('dfp.save',d);sessionStorage.setItem('seeded','1');}},encode(s));
    const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto('http://127.0.0.1:4173');await p.locator('#tables-button').waitFor();await p.clock.runFor(300);
    const snapshot=()=>p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
    async function until(test,label,max=120){for(let i=0;i<max;i++){const state=await snapshot();if(test(state))return state;await p.clock.runFor(250);}throw Error(`Floor ${floor+1}: ${label}`);}
    async function go(id,test,label=id){await p.locator(`[data-station="${id}"]`).click();return until(test,label);}
    const balance=(await snapshot()).money;await p.locator('#tables-button').click();await p.locator('[data-action="buy-table"][data-id="0"]').click();assert.equal((await snapshot()).money,balance-tableCost(floor,0));await p.locator('[data-action="close"]').click();
    await go(floor===0?'pickup':food,s=>s.player.bag.includes(food));const cash=(await snapshot()).money;
    await go('counter',s=>s.player.action==='counter');await p.clock.runFor(1200);assert.equal((await snapshot()).money,cash);assert.equal((await snapshot()).floors[floor].served,0);
    await go('stack',s=>s.floors[floor].counter[food]>0);assert.equal((await snapshot()).money,cash);await go('counter',s=>s.floors[floor].served===1);
    const paid=await snapshot();assert.ok(paid.floors[floor].customers[0].paid);assert.equal(paid.floors[floor].tables[0].state,'reserved');
    await p.locator('#tables-button').click();await p.locator('[data-action="walk-table"][data-id="0"]').click();await until(s=>s.player.action==='table0','walk to dining wing');
    await until(s=>s.floors[floor].tables[0].state==='occupied','guest eats');await p.clock.runFor(750);assert.equal((await snapshot()).floors[floor].tables[0].state,'occupied');await p.screenshot({path:`${out}/seating-floor-${floor+1}.png`});
    await until(s=>s.floors[floor].tables[0].state==='free','automatic cleanup after meal');const cleaned=await snapshot();assert.equal(cleaned.money,paid.money);
    await p.reload();await p.clock.runFor(600);assert.equal((await snapshot()).floors[floor].tables[0].owned,true);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(floor===0){await p.locator('#tables-button').tap();await p.screenshot({path:`${out}/phone-table-shop.png`});await p.locator('[data-action="close"]').tap();await p.locator('#area-button').tap();await until(s=>s.player.x<8,'return to kitchen');}
    checks.push(`Floor ${floor+1}: table purchase, required stack/serve, payment before seating, eating blocks cleanup, cleanup after eating, reload ownership`);console.log('PASS',checks.at(-1));await context.close();
  }
  assert.deepEqual(errors,[]);writeFileSync(`${out}/seating-browser.json`,JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
