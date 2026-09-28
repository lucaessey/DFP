import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {newGame,command,step} from '../src/simulation.js';
import {OUTFITS,PRODUCTS} from '../src/config.js';
import {encode} from '../src/storage.js';

const url=process.env.DFP_TEST_URL||'http://127.0.0.1:4185',out=process.env.DFP_EVIDENCE_DIR||'artifacts/stickman';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),checks=[],errors=[];
function seed(){const s=newGame();s.money=100000;for(let f=1;f<4;f++)command(s,{type:'floor',floor:f});for(const p of PRODUCTS)command(s,{type:'product',floor:p.floor,id:p.id});return s;}
async function launch(s){const c=await browser.newContext({viewport:{width:1440,height:900}});await c.addInitScript(d=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('dfp.save',d);sessionStorage.setItem('seeded','1');}},encode(s));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(url);await p.locator('#game').waitFor();await p.clock.runFor(300);return {c,p};}
const snapshot=p=>p.evaluate(()=>JSON.parse(JSON.parse(localStorage.getItem('dfp.save')).data));
const diagnostics=p=>p.locator('#game').evaluate(c=>c.dfpDiagnostics());
try{
 for(let floor=0;floor<(process.argv.includes('--outfits-only')?0:4);floor++){
  const s=seed();for(let f=0;f<4;f++){for(let i=0;i<2;i++)command(s,{type:'hire',floor:f,id:f*5+i});for(let i=0;i<2;i++)command(s,{type:'table',floor:f,id:i});}for(let i=0;i<1600;i++)step(s,.05,{pausedPlayer:true});command(s,{type:'visit',floor});
  const {c,p}=await launch(s),before=await snapshot(p),poses=new Set(),bags=new Set();let earned=false;
  for(let i=0;i<160;i++){await p.clock.runFor(250);const d=await diagnostics(p);assert.ok(d.transfers<=8);for(const a of d.positions.filter(a=>a.key.startsWith('staff'))){poses.add(a.motion);if(a.bag)bags.add(a.bag);}if((await snapshot(p)).floors[floor].revenue>before.floors[floor].revenue&&i>32){earned=true;break;}}
  assert.ok(earned,`Floor ${floor+1}: employee completes a paying job`);assert.ok(poses.has('walk'));assert.ok([...poses].some(p=>!['idle','walk','greet'].includes(p)),`Floor ${floor+1}: work animation`);
  await p.screenshot({path:`${out}/employees-floor-${floor+1}.png`});checks.push({floor:floor+1,employeePoses:[...poses],carried:[...bags],revenueGained:(await snapshot(p)).floors[floor].revenue-before.floors[floor].revenue});console.log('PASS employee work, visual inventory and final payment on floor',floor+1);await c.close();
 }
 const s=seed();s.player.bag=['controller','drink'];s.player.x=7;s.player.y=6;
 for(const outfit of OUTFITS)command(s,{type:'outfit',id:outfit.id});command(s,{type:'outfit',id:'uniform'});
 const {c,p}=await launch(s),before=await snapshot(p);
 await p.screenshot({path:`${out}/in-game-carrying.png`});
 for(const outfit of [...OUTFITS.slice(1),OUTFITS[0]]){await p.locator('[data-tab="outfits"]').click();await p.locator(`[data-action="outfit"][data-id="${outfit.id}"]`).click();await p.locator('[data-tab="home"]').click();await p.clock.runFor(400);const after=await snapshot(p);assert.equal(after.outfit,outfit.id);assert.deepEqual(after.player.bag,before.player.bag);assert.equal(after.money,before.money);assert.equal((await diagnostics(p)).positions.find(a=>a.key==='player').bag,'controller,drink');}
 await p.reload();await p.clock.runFor(400);assert.deepEqual((await snapshot(p)).player.bag,before.player.bag);assert.equal((await snapshot(p)).money,before.money);checks.push('Every outfit equips while carrying and survives reload without losing goods or changing money');
 await p.locator('[data-action="settings"]').click();await p.locator('[data-action="motion"]').click();await p.locator('[data-action="close"]').click();await p.clock.runFor(200);assert.equal((await diagnostics(p)).transfers,0);assert.deepEqual((await snapshot(p)).player.bag,before.player.bag);checks.push('Reduced motion interrupts decorative transfers and retains inventory');
 await c.close();assert.deepEqual(errors,[]);writeFileSync(`${out}/${process.argv.includes('--outfits-only')?'outfits-browser':'characters-browser'}.json`,JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
