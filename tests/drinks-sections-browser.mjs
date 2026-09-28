import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command,step} from '../src/simulation.js';
import {FLOORS,tableCost} from '../src/config.js';
import {encode} from '../src/storage.js';

const url=process.env.DFP_TEST_URL||'http://127.0.0.1:4185',out='artifacts/drinks-sections';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];let context,p;
function seed(f,open=false){const s=newGame();s.money=100000;for(let i=1;i<=f;i++)command(s,{type:'floor',floor:i});command(s,{type:'visit',floor:f});command(s,{type:'product',id:['controller','tower','snack2','snack3'][f]});if(open)command(s,{type:'section'});return s;}
async function launch(s,viewport={width:1440,height:900}){if(context)await context.close();context=await browser.newContext({viewport,hasTouch:true});await context.addInitScript(data=>{if(!sessionStorage.getItem('seed')){localStorage.setItem('dfp.save',data);sessionStorage.setItem('seed','1');}},encode(s));p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(url);await p.locator('[data-station]').first().waitFor();await p.clock.runFor(200);}
const snapshot=()=>p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
const diagnostic=()=>p.locator('#game').evaluate(c=>c.dfpDiagnostics());
async function until(test,label,max=200){for(let i=0;i<max;i++){if(test(await snapshot()))return;await p.clock.runFor(250);}throw Error(label);}
async function go(id,test){await p.locator(`[data-station="${id}"]`).tap();await until(test,id);}
const pass=label=>{checks.push(label);console.log('PASS',label);};
try{
 for(const floor of [0,1]){
  const price=FLOORS[floor].sectionCost,poor=seed(floor);poor.money=price-1;await launch(poor,{width:390,height:844});await p.locator('#drinks-section').tap();assert.match(await p.locator('#dialog-content').textContent(),new RegExp(`Unlock Drinks Section[\\s\\S]*\\$${price}`));await p.locator('[data-action="buy-drinks-section"]').tap();assert.equal((await snapshot()).money,price-1);assert.equal((await snapshot()).floors[floor].section,false);assert.equal(await p.locator('#toast').getAttribute('data-tone'),'error');await p.screenshot({path:out+'/unlock-offer-floor-'+(floor+1)+'.png'});await p.locator('[data-action="close"]').tap();await p.clock.runFor(250);await p.screenshot({path:`${out}/locked-floor-${floor+1}.png`});
  const rich=seed(floor);rich.money=price+111;await launch(rich,{width:390,height:844});await p.locator('#drinks-section').tap();await p.locator('[data-action="buy-drinks-section"]').tap();await p.clock.runFor(200);assert.equal((await snapshot()).money,111);assert.ok((await diagnostic()).stations.filter(st=>['drink','wine','drinkCounter','drinkStack'].includes(st.id)).every(st=>st.building));await p.clock.runFor(800);await p.screenshot({path:`${out}/opened-floor-${floor+1}.png`});await p.reload();await p.clock.runFor(300);assert.equal((await snapshot()).money,111);assert.ok((await snapshot()).floors[floor].section);assert.ok((await diagnostic()).stations.every(st=>!st.building));pass(`Floor ${floor+1}: explicit priced section control rejects insufficient funds, charges once, reveals equipment and reloads open`);

  const s=seed(floor,true),meal=floor?'tower':'controller',drink=floor?'wine':'drink';for(let i=0;i<380;i++)step(s,.05,{pausedPlayer:true});const customer=s.floors[floor].customers[0];Object.assign(customer,{needs:[meal,drink],delivered:[false,false]});s.floors[floor].customers=[customer];s.floors[floor].arrival=100;s.layoutVersion=2;
  await launch(s);const cash=(await snapshot()).money;assert.ok((await snapshot()).floors[floor].section);assert.equal((await snapshot()).layoutVersion,3);
  if(!floor){await go('prep',s=>s.floors[0].stock.raw>0);await go('fry',s=>s.floors[0].stock.controller>0);}
  await go(floor?'tower':'pickup',s=>s.player.bag.includes(meal));await go('stack',s=>s.floors[floor].counter[meal]>0);await go('counter',s=>s.floors[floor].customers[0].delivered[0]);assert.equal((await snapshot()).money,cash);assert.equal((await snapshot()).floors[floor].customers[0].delivered[1],false);
  await p.locator('#drinks-section').tap();await until(s=>s.player.bag.includes(drink),'prepare drink');await go('drinkStack',s=>s.floors[floor].counter[drink]>0);await go('drinkCounter',s=>s.floors[floor].served===1);assert.equal((await snapshot()).money-cash,floor?60:20);assert.ok((await snapshot()).floors[floor].customers[0].paid);await p.clock.runFor(250);await p.screenshot({path:`${out}/service-floor-${floor+1}.png`});const paid=(await snapshot()).money;await p.reload();await p.clock.runFor(1000);assert.equal((await snapshot()).money,paid);pass(`Floor ${floor+1}: old unlock preserved; player produces and serves food then drinks in separate queues; full bill pays once`);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.clock.runFor(200);await context.setOffline(true);await p.reload();await p.clock.runFor(300);assert.ok((await snapshot()).floors[floor].section);assert.equal((await snapshot()).money,paid);await p.locator('#drinks-section').tap();await p.clock.runFor(500);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await context.setOffline(false);pass(`Floor ${floor+1}: offline reload retains the section and payment and its control still works`);
 }
 for(let floor=0;floor<4;floor++){
  const s=seed(floor);await launch(s,{width:844,height:390});await p.locator('#tables-button').tap();let balance=(await snapshot()).money;
  for(let i=0;i<6;i++){const button=p.locator(`[data-action="buy-table"][data-id="${i}"]`),cost=tableCost(floor,i);assert.equal(await button.textContent(),`Buy · $${cost}`);await button.tap();balance-=cost;assert.equal((await snapshot()).money,balance);}
  await p.locator('[data-action="close"]').tap();await p.reload();await p.clock.runFor(250);assert.equal((await snapshot()).money,balance);assert.ok((await snapshot()).floors[floor].tables.every(t=>t.owned));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);pass(`Floor ${floor+1}: all six half-price table offers match deductions and reload ownership in landscape`);
 }
 assert.deepEqual(errors,[]);writeFileSync(`${out}/browser-report.json`,JSON.stringify({checks,errors},null,2));
}finally{if(context)await context.close();await browser.close();}
