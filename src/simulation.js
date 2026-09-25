import { BALANCE as B, FLOORS, LAYOUTS, OUTFITS, ROSTER, UPGRADE_TYPES, PRODUCTS, ITEMS, WORLD, TABLE_COUNT, FLOOR_FOODS, tableCost, tableSeat, stationOpen, stationPrice, floorCount, upgradeCount, playerUpgradeCost, employeeUpgradeCost } from './config.js';
import { paymentQuote } from './economy.js';
import { LAYOUT_VERSION, serviceQueue, checkoutQueue, shopWaiting, shelfApproach, tableApproach, tableWaiting, arcadeSeat, arcadeWaiting } from './config.js';
import { distance, move, followPath } from './navigation.js';

const upgrades = () => ({ speed: 0, capacity: 0, profit: 0 });
export const newActor = () => ({ x: WORLD.kitchen.x, y: WORLD.kitchen.y, bag: [], action: '', progress: 0, path: [], pathKey: '', moving: false, facing: 1 });
export function newGame() {
  return { version: 4, layoutVersion: LAYOUT_VERSION, money: B.startCash, earned: 0, served: 0, time: 0, seed: 37042, nextId: 1, revision: 0, floor: 0,
    player: newActor(), employees: [], outfits: ['uniform'], outfit: 'uniform', tutorial: 0,
    settings: { sound: true, reducedMotion: false, reducedEffects: false }, transactions: [], events: [], vr: null,
    floors: FLOORS.map((f, i) => ({ unlocked: i === 0, section: false, products:Object.fromEntries(PRODUCTS.filter(p=>p.floor===i).map(p=>[p.id,false])), upgrades: upgrades(), stock: Object.fromEntries(['raw',...ITEMS].map(k=>[k,0])), counter:Object.fromEntries(ITEMS.map(k=>[k,0])), fry: 0, cooking: false, customers: [], arrival: i === 0 ? 0.2 : 1, revenue: 0, served: 0, shelves: { souvenir: 0, keychain: 0 }, tables: Array.from({length:TABLE_COUNT},()=>({owned:false,state:'free',customer:null,meal:null})), machines: [0, 1, 2].map(() => ({ customer: null, quarters: 0, timer: 0 })) })),
  };
}
function random(s) { s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0; return s.seed / 4294967296; }
export function capacity(s, actor, floor) { return actor.id === undefined ? B.capacity + s.floors[floor].upgrades.capacity : B.employeeCapacity + actor.upgrades.capacity; }
export function speed(s, actor, floor) { return actor.id === undefined ? B.speed * (1 + B.playerSpeedBonus * s.floors[floor].upgrades.speed) : B.employeeSpeed * (1 + B.employeeSpeedBonus * actor.upgrades.speed); }
export function emit(s, text, kind = 'info', pos) { s.events.push({ text, kind, floor: s.floor, ...pos }); if (s.events.length > 30) s.events.shift(); }
function changed(s) { s.revision++; }
function pay(s, floor, actor, base, receipt) {
  if (receipt.paid) return 0;
  const quote=paymentQuote(s,floor,actor,base),amount=quote.amount;
  s.floors[floor].bonusCents=quote.bonusCents;
  receipt.paid = true; s.money += amount; s.earned += amount; s.floors[floor].revenue += amount;
  changed(s); emit(s, `+$${amount}`, 'money', { x: actor.x, y: actor.y, floor }); return amount;
}
export { pay as collectPayment };
export function command(s, c) {
  const fail = message => ({ ok: false, message });
  if (c.token && s.transactions.includes(c.token)) return fail('Already completed');
  const f = c.floor ?? s.floor;
  if (!Number.isInteger(f) || !s.floors[f]) return fail('Unknown floor');
  const fs = s.floors[f]; let cost = 0, apply;
  switch (c.type) {
    case 'table': {
      const index=Number(c.id),table=fs.tables[index];
      if(!fs.unlocked||!Number.isInteger(index)||!table||table.owned)return fail('Table unavailable or already owned');
      cost=tableCost(f,index);apply=()=>{table.owned=true;};break;
    }
    case 'return-stock': apply = () => returnBag(s, s.player, s.floor); break;
    case 'floor':
      if (fs.unlocked) return fail('Floor already open');
      if (!s.floors[f - 1]?.unlocked) return fail('Open the previous floor first');
      cost = FLOORS[f].cost; apply = () => { fs.unlocked = true; }; break;
    case 'visit':
      if (!fs.unlocked) return fail('This floor is locked');
      apply = () => { returnBag(s, s.player, s.floor); s.floor = f; s.player = newActor(); s.vr = null; }; break;
    case 'section':
    case 'product': {
      const product=PRODUCTS.find(p=>p.floor===f&&(c.type==='section'?p.section:p.id===c.id));
      if(!product||!fs.unlocked||fs.products[product.id])return fail('Item unavailable or already unlocked');
      if(product.id==='wine'&&!fs.products.tower&&!fs.products.handheld)return fail('Unlock a console meal first');
      if(product.id==='drink'&&!fs.products.controller)return fail('Unlock Crispy Controller first');
      cost=product.cost;apply=()=>{fs.products[product.id]=true;if(product.section)fs.section=true;
        if(product.id==='drink')for(const customer of fs.customers)if(customer.state==='waiting'&&customer.delivered.every(v=>!v)&&!customer.needs.includes('drink')&&random(s)<B.drinkOrderChance){if(customer.needs.length<B.maxOrderItems){customer.needs.push('drink');customer.delivered.push(false);}else customer.needs[customer.needs.length-1]='drink';}
      };break;
    }
    case 'hire': {
      const def = ROSTER[c.id];
      if (!def || !s.floors[def.origin].unlocked) return fail('Unlock this employee’s home floor first');
      if (s.employees.some(e => e.id === c.id)) return fail('Already on your team');
      if (!fs.unlocked || floorCount(s, f) >= B.floorStaffCap) return fail('Floor has reached 12 employees');
      cost = def.cost; apply = () => s.employees.push({ ...newActor(), id: def.id, floor: f, upgrades: upgrades() }); break;
    }
    case 'assign': {
      const employee = s.employees.find(e => e.id === c.id);
      if (!employee || !fs.unlocked) return fail('Assignment unavailable');
      if (employee.floor === f) return fail('Already assigned here');
      if (floorCount(s, f) >= B.floorStaffCap) return fail('Floor has reached 12 employees');
      apply = () => { returnBag(s, employee, employee.floor); Object.assign(employee, newActor(), { floor: f }); }; break;
    }
    case 'upgrade': {
      if (!fs.unlocked || !UPGRADE_TYPES.includes(c.category)) return fail('Upgrade unavailable');
      const employee = c.id === undefined ? null : s.employees.find(e => e.id === c.id);
      if (c.id !== undefined && !employee) return fail('Hire this employee first');
      const u = employee ? employee.upgrades : fs.upgrades;
      if (employee ? u[c.category] >= B.employeeCap : upgradeCount(u) >= B.playerCap) return fail(employee ? 'Category fully upgraded' : 'All 5 floor upgrades purchased');
      cost = employee ? employeeUpgradeCost(employee, c.category) : playerUpgradeCost(s, f);
      apply = () => { u[c.category]++; }; break;
    }
    case 'outfit': {
      const outfit = OUTFITS.find(o => o.id === c.id);
      if (!outfit || !s.floors[outfit.floor].unlocked) return fail('Open the required floor first');
      if (!s.outfits.includes(c.id)) cost = outfit.price;
      apply = () => { if (!s.outfits.includes(c.id)) s.outfits.push(c.id); s.outfit = c.id; }; break;
    }
    default: return fail('Unknown action');
  }
  if (s.money < cost) return fail(`Need $${cost - s.money} more`);
  if(!s.floors[0].products.controller&&!(c.type==='product'&&c.id==='controller')&&cost>0&&s.money-cost<50)return fail('Keep $50 for your first Crispy Controller unlock');
  s.money -= cost; apply();
  if (c.token) { s.transactions.push(c.token); s.transactions = s.transactions.slice(-128); }
  changed(s); return { ok: true, cost };
}
function returnBag(s, a, f) { for (const item of a.bag) s.floors[f].stock[item]++; a.bag = []; }
function take(a, item) { const i = a.bag.indexOf(item); if (i < 0) return false; a.bag.splice(i, 1); return true; }
const missing = c => c.needs.filter((v, i) => !c.delivered[i]);
function recordSale(s,f,c){if(!c.counted){s.served++;s.floors[f].served++;c.counted=true;changed(s);}}
function leave(s, f, c) { c.state = 'leaving'; c.timer = 0;recordSale(s,f,c);changed(s); }
function seatAfterPurchase(s,f,c){
  const fs=s.floors[f];
  if(!fs.tables.some(t=>t.owned)){leave(s,f,c);return;}
  const i=fs.tables.findIndex(t=>t.owned&&t.state==='free');
  if(i<0){c.state='waitingTable';c.table=null;return;}
  fs.tables[i].state='reserved';fs.tables[i].customer=c.id;fs.tables[i].meal=c.needs[0];c.table=i;c.state='toTable';c.path=[];c.pathKey='';changed(s);
}
function collectItem(s, f, a, item, limited = false) {
  const fs = s.floors[f]; if (a.bag.length >= capacity(s, a, f)) return;
  if (limited && fs.stock[item] <= 0) return;
  if (fs.stock[item] > 0) fs.stock[item]--;
  a.bag.push(item); if (a.id === undefined && item === 'controller') s.tutorial = Math.max(s.tutorial, 3);
  changed(s);
}
function customerOrder(s, items, drink = null) {
  const needs=[items[Math.floor(random(s)*items.length)]];
  const withDrink=drink&&random(s)<B.drinkOrderChance;
  const count=withDrink?2+Math.floor(random(s)*(B.maxOrderItems-1)):1+Math.floor(random(s)*B.maxOrderItems);
  if(withDrink)needs.push(drink);
  const extras=withDrink?[...items,drink]:items;
  while(needs.length<count)needs.push(extras[Math.floor(random(s)*extras.length)]);
  return needs;
}
function spawnCustomer(s, f) {
  const fs = s.floors[f];let needs,purpose='food';
  if(f===0){if(!fs.products.controller)return;needs=customerOrder(s,['controller'],fs.products.drink?'drink':null);}
  if(f===1){const meals=['tower','handheld'].filter(id=>fs.products[id]);if(!meals.length)return;needs=customerOrder(s,meals,fs.products.wine?'wine':null);}
  if(f>=2){const activities=f===2?['souvenir','keychain'].filter(id=>fs.products[id]):['machine0','machine1','machine2'].filter(id=>fs.products[id]);
    if(fs.products[`snack${f}`]&&(!activities.length||random(s)<.45))needs=customerOrder(s,[`snack${f}`]);
    else{if(!activities.length)return;purpose=f===2?'shop':'arcade';needs=f===2?customerOrder(s,activities):[];}}
  fs.customers.push({id:s.nextId++,state:'waiting',purpose,needs,delivered:needs.map(()=>false),paid:false,counted:false,timer:0,...WORLD.entrance,color:Math.floor(random(s)*6),table:null,machine:null,path:[],pathKey:'',moving:false,facing:1,bag:[]});
}
export function stationStatus(s, f, st) {
  const fs = s.floors[f];
  if (!stationOpen(s,f,st)) return `Unlock · $${stationPrice(st)}`;
  if (st.kind === 'trash') return 'Discard carried items · no refund';
  if (st.id === 'prep') return `${fs.stock.raw} ready to fry`;
  if (st.id === 'fry') return fs.cooking ? `Frying ${Math.max(1, Math.ceil(fs.fry))}s` : 'Start a batch';
  if (st.id === 'pickup') return `${fs.stock.controller} ready`;
  if (st.id === 'stack') return `${FLOOR_FOODS[f].reduce((n,id)=>n+fs.counter[id],0)} items stacked`;
  if (st.id === 'counter') return 'Serve from the counter stack';
  if (st.kind === 'table') { const t = fs.tables[Number(st.id.slice(5))]; return ({ free: 'Clean · ready to seat',reserved:'Guest on the way',dirty:'Finished eating · clean here',occupied:'Eating · cannot clean yet' })[t.state]; }
  if (st.kind === 'arcade') {const quarters=fs.machines[Number(st.id.slice(-1))].quarters;return `${quarters} quarters · ${paymentQuote(s,f,s.player,quarters).amount} to collect`;}
  if (st.id === 'shelf') return `${fs.shelves.souvenir} on display`;
  if (st.id === 'keyShelf') return `${fs.shelves.keychain} on display`;
  if (st.kind === 'vr') return 'Walk here to play';
  return 'Stand on the ring';
}
function interact(s, f, a, st) {
  const fs = s.floors[f]; if (!stationOpen(s,f,st)) return;
  if(st.kind==='table'){
    const table=fs.tables[Number(st.id.slice(5))];
    if(table.state==='dirty'){table.state='free';table.customer=null;table.meal=null;changed(s);emit(s,'Sparkling clean!','clean',{x:st.pad.x,y:st.pad.y,floor:f});}return;
  }
  if (st.kind === 'trash') {
    if (a.id === undefined && a.bag.length) { const item = a.bag.shift(); changed(s); emit(s, `Discarded ${item}`, 'trash', { x: a.x, y: a.y, floor: f }); }
    return;
  }
  if(st.id==='stack'){
    const item=a.bag.find(item=>FLOOR_FOODS[f].includes(item)&&fs.counter[item]<B.stockCap);
    if(item&&take(a,item)){fs.counter[item]++;if(f===0&&a.id===undefined)s.tutorial=Math.max(s.tutorial,4);changed(s);}return;
  }
  if(st.id==='counter'){
    const c=fs.customers.find(c=>c.purpose==='food'&&['waiting','payment'].includes(c.state));
    if(c&&distance(c,serviceQueue())<.6){
      if(c.state==='payment'){pay(s,f,a,c.needs.reduce((n,v)=>n+B.prices[v],0),c);recordSale(s,f,c);seatAfterPurchase(s,f,c);if(f===0&&a.id===undefined)s.tutorial=Math.max(s.tutorial,5);}
      else{for(let i=0;i<c.needs.length;i++)if(!c.delivered[i]&&fs.counter[c.needs[i]]>0){fs.counter[c.needs[i]]--;c.delivered[i]=true;changed(s);}if(!missing(c).length){c.state='payment';changed(s);}}
    }return;
  }
  if(st.kind==='snack'){collectItem(s,f,a,st.id);return;}
  if (f === 0) {
    if(!fs.products.controller)return null;
    if (st.id === 'prep' && fs.stock.raw < B.stockCap) { fs.stock.raw += B.batch; if (a.id === undefined) s.tutorial = Math.max(s.tutorial, 1); }
    if (st.id === 'fry' && !fs.cooking && fs.stock.raw > 0 && fs.stock.controller < B.stockCap) { fs.stock.raw--; fs.fry = B.fryTime; fs.cooking = true; if (a.id === undefined) s.tutorial = Math.max(s.tutorial, 2); }
    if (st.id === 'pickup') collectItem(s, f, a, 'controller', true);
    if (st.id === 'drink') collectItem(s, f, a, 'drink');
  }
  if(f===1&&['tower','handheld','wine'].includes(st.id))collectItem(s,f,a,st.id);
  if (f === 2) {
    if (st.id === 'stock') collectItem(s, f, a, 'souvenir');
    if (st.id === 'keyStock') collectItem(s, f, a, 'keychain');
    if (st.id === 'shelf' || st.id === 'keyShelf') {
      const item = st.id === 'shelf' ? 'souvenir' : 'keychain';
      if (fs.shelves[item] < B.stockCap && take(a, item)) { fs.shelves[item]++; changed(s); }
    }
    if (st.id === 'checkout') {
      const c = fs.customers.find(c => c.state === 'checkout');
      if (c && !missing(c).length && distance(c,checkoutQueue()) < 0.7) { pay(s, f, a, c.needs.reduce((total,item)=>total+B.prices[item],0), c); leave(s, f, c); }
    }
  }
  if (f === 3) {
    if (st.kind === 'arcade') {
      const m = fs.machines[Number(st.id.slice(-1))];
      if (m.quarters > 0) { const amount = m.quarters; m.quarters = 0; pay(s, f, a, amount, { paid: false }); }
    }
  }
}
export function workerGoal(s, f, a) {
  const fs = s.floors[f];
  const shopDemand=f===2?fs.customers.find(c=>c.purpose==='shop'&&c.state==='browsing'&&fs.shelves[missing(c)[0]]===0):null;
  const dirty=fs.tables.findIndex(t=>t.owned&&t.state==='dirty');if(dirty>=0)return `table${dirty}`;
  if(f===2&&fs.customers.some(c=>c.state==='checkout'))return 'checkout';
  if(f===3){const richest=fs.machines.reduce((best,m,i)=>m.quarters>fs.machines[best].quarters?i:best,0);if(fs.machines[richest].quarters>0)return `machine${richest}`;}
  if(f>0){
    const food=fs.customers.find(c=>c.purpose==='food'&&['waiting','payment'].includes(c.state));
    const c=shopDemand&&food&&shopDemand.id<food.id?null:food;
    if(c?.state==='payment'||c&&missing(c).some(id=>fs.counter[id]>0))return 'counter';
    if(a.bag.some(id=>FLOOR_FOODS[f].includes(id)&&fs.counter[id]<B.stockCap))return 'stack';
    if(c){if(a.bag.length>=capacity(s,a,f))returnBag(s,a,f);return missing(c)[0]||'counter';}
    if(f===1)return null;
  }
  if (f === 0) {
    const c = fs.customers.find(c => ['waiting', 'payment'].includes(c.state));
    if (c?.state === 'payment' || (c && missing(c).some(item => fs.counter[item] > 0))) return 'counter';
    if (a.bag.some(item=>['controller','drink'].includes(item)&&fs.counter[item]<B.stockCap)) return 'stack';
    if (c && missing(c).includes('drink') && !a.bag.includes('drink')) return 'drink';
    if (fs.stock.controller > 0 && a.bag.length < capacity(s, a, f)) return 'pickup';
    if (fs.stock.raw === 0) return 'prep';
    if (!fs.cooking && fs.stock.controller < B.stockCap) return 'fry';
    return 'pickup';
  }
  if (f === 2) {
    if (fs.customers.some(c => c.state === 'checkout')) return 'checkout';
    if (a.bag.includes('souvenir') && fs.shelves.souvenir < B.stockCap) return 'shelf';
    if (a.bag.includes('keychain') && fs.shelves.keychain < B.stockCap) return 'keyShelf';
    const item=shopDemand&&missing(shopDemand)[0];
    if (item && !a.bag.includes(item)) return item === 'keychain' ? 'keyStock' : 'stock';
    if (fs.section && fs.shelves.keychain < 2 && !a.bag.includes('keychain')) return 'keyStock';
    if (fs.products.souvenir && fs.shelves.souvenir < 3 && !a.bag.includes('souvenir')) return 'stock';
    return null;
  }
  if (f === 3) {
    const richest = fs.machines.reduce((best, m, i) => m.quarters > fs.machines[best].quarters ? i : best, 0);
    return fs.machines[richest].quarters > 0 ? `machine${richest}` : null;
  }
  return null;
}
function workActor(s, f, a, dt, automatic) {
  if (automatic) {
    const goal = workerGoal(s, f, a), station = LAYOUTS[f].find(st => st.id === goal);
    if (station && distance(a, station.pad) > 0.28) followPath(a, f, station.pad, dt, speed(s, a, f));
    else a.moving = false;
  }
    const st = LAYOUTS[f].find(st => distance(a, st.pad) < 0.62 && stationOpen(s,f,st));
  if (!st) { a.action = ''; a.progress = 0; return; }
  if (a.action !== st.id) { a.action = st.id; a.progress = 0; }
  a.progress += dt;
  if (a.progress >= B.actionTime) { a.progress = 0; interact(s, f, a, st); }
}
function customersTick(s, f, dt) {
  const fs = s.floors[f];
  for (const c of fs.customers) {
    if (c.state === 'leaving') {
      followPath(c,f,WORLD.entrance,dt,2.8);c.timer+=dt;continue;
    }
    if(c.purpose==='food'){
      if(['waiting','payment'].includes(c.state)){
        const queue=fs.customers.filter(v=>v.purpose==='food'&&['waiting','payment'].includes(v.state)),index=queue.indexOf(c);
        followPath(c,f,serviceQueue(index),dt,2.2);
      }else if(c.state==='waitingTable'){
        seatAfterPurchase(s,f,c);
        if(c.state==='waitingTable'){const i=fs.customers.filter(v=>v.state==='waitingTable').indexOf(c);followPath(c,f,tableWaiting(i),dt,2.2);}
      }else if(c.state==='toTable'){
        const destination=tableApproach(c.table);followPath(c,f,destination,dt,2.2);
        if(distance(c,destination)<.2){Object.assign(c,tableSeat(c.table));c.state='dining';c.timer=B.diningTime;c.moving=false;c.path=[];fs.tables[c.table].state='occupied';changed(s);}
      }else if(c.state==='dining'){
        c.moving=false;c.timer=Math.max(0,c.timer-dt);
        if(c.timer<=0){const t=fs.tables[c.table];t.state='dirty';t.customer=null;Object.assign(c,tableApproach(c.table));leave(s,f,c);}
      }
      continue;
    }
    if (f === 2) {
      if (c.state === 'waiting') c.state = 'browsing';
      if (c.state === 'browsing') {
        const next=c.delivered.findIndex(delivered=>!delivered),type=c.needs[next];
        if(!type){c.state='checkout';c.timer=0;changed(s);continue;}
        const index=fs.customers.filter(v=>v.purpose==='shop'&&['waiting','browsing'].includes(v.state)&&missing(v)[0]===type).indexOf(c);
        const shelf=index===0?shelfApproach(type):shopWaiting(fs.customers.filter(v=>v.purpose==='shop'&&['waiting','browsing'].includes(v.state)).indexOf(c));
        followPath(c, f, shelf, dt, 2.2);
        if (index === 0 && distance(c, shelf) < 0.35 && fs.shelves[type] > 0) { c.timer += dt; if (c.timer > 1.5) { fs.shelves[type]--; c.bag.push(type); c.delivered[next] = true; if(!missing(c).length)c.state='checkout'; c.timer = 0; changed(s); } }
      } else if (c.state === 'checkout') {
        const index = fs.customers.filter(c => c.state === 'checkout').indexOf(c);
        followPath(c, f, checkoutQueue(index), dt, 2.2);
      }
    }
    if (f === 3) {
      if (c.state === 'waiting') {
        const index = fs.machines.findIndex((m,i) => m.customer === null && fs.products[`machine${i}`]);
        if (index >= 0) { fs.machines[index].customer = c.id; c.machine = index; c.state = 'seating'; }
        else { const q = fs.customers.filter(c => c.state === 'waiting').indexOf(c); followPath(c, f, arcadeWaiting(q), dt, 2.2); }
      }
      if (c.state === 'seating') {
        const destination = arcadeSeat(c.machine);
        followPath(c, f, destination, dt, 2.2);
        if (distance(c, destination) < 0.2) { c.state = 'playing'; c.timer = B.arcadeTime; c.moving = false; }
      } else if (c.state === 'playing') {
        c.timer -= dt;
        if (c.timer <= 0) { const m = fs.machines[c.machine]; m.quarters += B.quarters; m.customer = null; c.timer = 0; leave(s, f, c); }
      }
    }
  }
  fs.customers=fs.customers.filter(c=>c.state!=='leaving'||(c.timer<20&&(c.timer<1||distance(c,WORLD.entrance)>.3)));
}
export function startVR(s) {
  if (s.floor !== 3 || !s.floors[3].section || distance(s.player, LAYOUTS[3].find(st => st.id === 'vr').pad) > 0.9 || s.vr && !s.vr.done) return false;
  s.vr = { id: s.nextId++, lane: 1, time: 0, lives: 3, score: 0, spawn: 0, obstacles: [], done: false, paid: false, reward: 0 }; changed(s); return true;
}
export function vrInput(s, direction) { if (s.vr && !s.vr.done) s.vr.lane = Math.max(0, Math.min(2, s.vr.lane + Math.sign(direction))); }
export function stepVR(s, dt) {
  const v = s.vr; if (!v || v.done) return;
  v.time = Math.min(B.vrTime, v.time + dt); v.spawn += dt;
  if (v.spawn >= 1) { v.spawn = 0; v.obstacles.push({ lane: Math.floor(random(s) * 3), y: -0.1 }); }
  for (const o of v.obstacles) {
    o.y += dt * (0.4 + v.time * 0.003);
    if (!o.passed && o.y >= 0.83) { o.passed = true; if (o.lane === v.lane) v.lives = Math.max(0, v.lives - 1); else v.score++; }
  }
  v.obstacles = v.obstacles.filter(o => o.y < 1.15);
  if (v.lives <= 0 || v.time >= B.vrTime) { v.done = true; v.reward = pay(s, 3, s.player, B.vrBaseReward + v.score * B.vrDodgeReward, v); changed(s); }
}
export function step(s, dt = B.step, input = {}) {
  if (!Number.isFinite(dt) || dt <= 0 || dt > 0.25) throw new Error('Simulation requires a bounded fixed step');
  s.time += dt;
  if (s.vr && !s.vr.done) stepVR(s, dt);
  const a = s.player;
  a.moving = false;
  if (input.x || input.y) {
    a.path = []; a.pathKey = '';
    // Convert screen-space joystick/keyboard direction to isometric world direction.
    let dx = (input.x || 0) + (input.y || 0), dy = (input.y || 0) - (input.x || 0);
    const length = Math.hypot(dx, dy); dx /= Math.max(1, length); dy /= Math.max(1, length);
    move(a, dx * speed(s, a, s.floor) * dt, dy * speed(s, a, s.floor) * dt, s.floor);
  } else if (input.target) followPath(a, s.floor, input.target, dt, speed(s, a, s.floor));
  for (let f = 0; f < 4; f++) {
    const fs = s.floors[f]; if (!fs.unlocked) continue;
    fs.arrival -= dt;
    if (fs.arrival <= 0 && fs.customers.filter(c => c.state !== 'leaving').length < B.maxCustomers) { spawnCustomer(s, f); fs.arrival = B.arrivalTime + random(s) * 2; }
    if (fs.cooking) { fs.fry -= dt; if (fs.fry <= 0) { fs.cooking = false; fs.fry = 0; fs.stock.controller += B.batch; } }
    customersTick(s, f, dt);
    if (f === s.floor && !input.pausedPlayer) workActor(s, f, a, dt, false);
    for (const employee of s.employees.filter(e => e.floor === f)) workActor(s, f, employee, dt, true);
  }
}
