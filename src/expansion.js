import {BALANCE as B,LAYOUTS,WORLD,tableSeat,tableApproach,serviceQueue,stationOpen} from './config.js';
import {distance,followPath} from './navigation.js';

export const newActivity=()=>({robot:{input:0,timer:0,batches:0,fault:false},factory:{input:0,timer:0,hopper:0,belt:0,delivery:null,completed:0},weather:0,water:[3,3,3,3,3,3],umbrellas:[false,false,false,false,false,false]});
export function validateActivity(a){
  const num=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max,int=(n,max)=>Number.isInteger(n)&&num(n,max);
  if(!a||!a.robot||!a.factory||!num(a.weather,55)||!Array.isArray(a.water)||a.water.length!==6||!a.water.every(n=>int(n,3))||!Array.isArray(a.umbrellas)||a.umbrellas.length!==6||!a.umbrellas.every(n=>typeof n==='boolean'))return false;
  const r=a.robot,v=a.factory,d=v.delivery;
  return int(r.input,6)&&num(r.timer,4)&&int(r.batches,1e12)&&typeof r.fault==='boolean'&&int(v.input,6)&&num(v.timer,3)&&int(v.hopper,18)&&num(v.belt,2)&&int(v.completed,1e12)&&(d===null||d&&int(d.id,1e12)&&num(d.timer,4)&&d.paid===false);
}
const sessionFloor=f=>f===5||f===8;
const tableFloor=f=>f===7||f===9;
const missing=c=>c.needs.find((item,i)=>!c.delivered[i]);
const stBy=(f,id)=>LAYOUTS[f].find(st=>st.id===id);
const waiting=(fs,c)=>serviceQueue(fs.customers.filter(v=>v.state==='waiting').indexOf(c));
const freeSeat=fs=>fs.tables.findIndex(t=>t.owned&&t.state==='free');
const receipt=()=>({paid:false});
function finish(s,f,c,h){c.state='leaving';c.timer=0;c.moving=false;if(!c.counted){c.counted=true;s.served++;s.floors[f].served++;}h.changed(s);}
function dirty(s,f,c){const t=s.floors[f].tables[c.table];t.state='dirty';t.customer=null;Object.assign(c,tableApproach(c.table));c.path=[];c.pathKey='';}
function reserve(fs,c,i){c.table=i;c.premium=fs.section&&i>=3;const t=fs.tables[i];t.state='reserved';t.customer=c.id;t.meal=c.needs[0]??null;c.path=[];c.pathKey='';}
function customer(s,purpose,needs){return {id:s.nextId++,state:'waiting',purpose,needs,delivered:needs.map(()=>false),paid:false,counted:false,timer:0,...WORLD.entrance,color:s.nextId%6,table:null,machine:null,path:[],pathKey:'',moving:false,facing:1,bag:[],receipts:{admission:receipt(),food:receipt(),play:receipt()},fault:false,faultDone:false,premium:false,playReady:false};}
export function expansionSpawn(s,f,h){
  const fs=s.floors[f];let c;
  if(f===10)return;
  if(f===4){const items=['waffle','icecream','cake'].filter(id=>fs.products[id]);if(!items.length)return;c=customer(s,'food',h.order(s,items,fs.section?'milkshake':null));}
  if(f===6){if(!fs.products.robotmeal)return;c=customer(s,'food',h.order(s,['robotmeal']));}
  if(sessionFloor(f)){if(!fs.products[f===5?'tickets':'admission']||!fs.tables.some(t=>t.owned))return;const item=f===5?'popcorn':'esnack';c=customer(s,f===5?'movie':'esports',fs.products[item]?[item]:[]);}
  if(tableFloor(f)){const item=f===7?'terracemeal':'cafemeal';if(!fs.products[item]||!fs.tables.some(t=>t.owned))return;const needs=[item];if(f===7&&fs.section)needs.push('smoothie');if(f===9&&fs.products.treat)needs.push('treat');c=customer(s,f===7?'terrace':'cafe',needs);}
  if(c)fs.customers.push(c);
}
export function expansionStatus(s,f,st){
  const fs=s.floors[f],a=fs.activity;
  if(st.kind==='prepare')return st.id==='icecream'?'30s in your hands · counter keeps it cold':'Prepare one · carry to your guest';
  if(st.kind==='admit')return 'Sell one ticket when a clean seat is available';
  if(st.kind==='usher')return 'Guide a ticketed guest to their seat';
  if(st.kind==='host')return 'Seat the next waiting party';
  if(st.kind==='supply')return 'Pick up one ingredient';
  if(st.kind==='robot')return a.robot.fault?'ROBOT FAULT · stand here to repair free':a.robot.timer?`Cooking · ${Math.ceil(a.robot.timer)}s`:`Load ingredients · ${a.robot.input} waiting`;
  if(st.kind==='robotPickup')return `${fs.stock.robotmeal} meals ready`;
  if(st.kind==='charger')return '2.5s cooking · fault every 8 batches instead of 4';
  if(st.kind==='premium')return f===5?'Seats 4–6 now earn double ticket money':'Desks 4–6 now earn double admission';
  if(st.kind==='water')return `Refill bowls · ${a.water.join(' / ')} drinks left`;
  if(st.kind==='playground')return 'Six-second visits · collect when pets finish playing';
  if(st.kind==='processor')return `Load ingredient · ${a.factory.input} waiting${a.factory.timer?' · processing':''}`;
  if(st.kind==='factoryPickup')return `${fs.stock.factorysnack} finished snacks`;
  if(st.kind==='packer')return `${a.factory.hopper} snacks packed · three per box`;
  if(st.kind==='seal')return `${fs.stock.sealedbox} sealed boxes · pack 3 then seal here`;
  if(st.kind==='delivery')return a.factory.delivery?(a.factory.delivery.timer>0?`Delivering · ${Math.ceil(a.factory.delivery.timer)}s`:'Delivery complete · collect payment'):'Load one sealed box';
  if(st.kind==='belt')return 'Moves one real snack into packing every 2 seconds';
  if(st.kind==='table'&&(sessionFloor(f)||tableFloor(f))){const i=Number(st.id.slice(5)),t=fs.tables[i],c=fs.customers.find(c=>c.id===t.customer);return t.state==='dirty'?'Clean seat / spills before the next guest':c?.fault?'PC FAULT · repair free':c?.state==='service'?`Deliver ${missing(c)??'water'}`:c?.state==='payment'?'Collect meal payment':c?.state==='dining'?`${sessionFloor(f)?'Session':'Eating'} · ${Math.ceil(c.timer)}s`:t.state==='reserved'?'Guest on the way':'Ready for a guest';}
  return null;
}
function transfer(s,f,a,item,h,limited=false){const before=a.bag.length;h.collect(s,f,a,item,limited);if(item==='icecream'&&a.bag.length>before){a.cold??=[];a.cold.push(30);}}
export function expansionInteract(s,f,a,st,h){
  const fs=s.floors[f],act=fs.activity;
  if(st.kind==='prepare'){transfer(s,f,a,st.item,h);return true;}
  if(f===7&&st.id==='drinkCounter'){if(fs.counter.smoothie>0&&a.bag.length<h.capacity(s,a,f)){fs.counter.smoothie--;a.bag.push('smoothie');h.changed(s);}return true;}
  if(st.kind==='supply'){transfer(s,f,a,'ingredient',h);return true;}
  if(st.kind==='robot'){
    const r=act.robot;if(r.fault){r.fault=false;h.emit(s,'Robot rebooted!','clean',{floor:f,x:a.x,y:a.y});}
    else if(r.input<6&&h.take(a,'ingredient'))r.input++;
    h.changed(s);return true;
  }
  if(st.kind==='robotPickup'){transfer(s,f,a,'robotmeal',h,true);return true;}
  if(['charger','premium','belt'].includes(st.kind))return true;
  if(st.kind==='admit'||st.kind==='host'){
    const c=fs.customers.find(c=>c.state==='waiting'),i=freeSeat(fs);if(!c||i<0||distance(c,waiting(fs,c))>.65)return true;
    reserve(fs,c,i);
    if(st.kind==='admit'){const base=f===5?(c.premium?B.prices.vipticket:B.prices.ticket):(c.premium?B.prices.stageentry:B.prices.admission);h.pay(s,f,a,base,c.receipts.admission);c.state='ordering';}
    else c.state='toTable';h.changed(s);return true;
  }
  if(st.kind==='usher'){const c=fs.customers.find(c=>c.state==='ordering');if(c){c.state='toTable';c.path=[];c.pathKey='';h.changed(s);}return true;}
  if(st.kind==='table'&&(sessionFloor(f)||tableFloor(f))){
    const i=Number(st.id.slice(5)),t=fs.tables[i],c=fs.customers.find(c=>c.id===t.customer);
    if(t.state==='dirty')return false; // shared cleaning interaction
    if(!c||!['service','dining','payment'].includes(c.state))return true;
    if(c.fault){c.fault=false;c.faultDone=true;h.changed(s);h.emit(s,'PC back online!','clean',{floor:f,x:a.x,y:a.y});return true;}
    if(c.state==='payment'){
      h.pay(s,f,a,c.needs.reduce((n,item)=>n+B.prices[item],0),c.receipts.food);c.paid=true;dirty(s,f,c);
      if(f===9&&fs.section){c.state='playing';c.timer=6;}else finish(s,f,c,h);return true;
    }
    const index=c.delivered.findIndex((v,i)=>!v&&a.bag.includes(c.needs[i]));
    if(index>=0){const item=c.needs[index];h.take(a,item);c.delivered[index]=true;
      if(sessionFloor(f))h.pay(s,f,a,B.prices[item],c.receipts.food);
      if(c.delivered.every(Boolean)&&tableFloor(f)){c.state='dining';c.timer=B.diningTime;}
      h.changed(s);
    }
    return true;
  }
  if(st.kind==='water'){const i=act.water.findIndex(n=>n<3);if(i>=0){act.water[i]=3;h.changed(s);h.emit(s,'Fresh water!','clean',{floor:f,x:a.x,y:a.y});}return true;}
  if(st.kind==='playground'){const c=fs.customers.find(c=>c.state==='playing'&&c.playReady);if(c){h.pay(s,f,a,B.prices.playvisit,c.receipts.play);finish(s,f,c,h);}return true;}
  if(st.kind==='processor'){if(act.factory.input<6&&h.take(a,'ingredient')){act.factory.input++;h.changed(s);}return true;}
  if(st.kind==='factoryPickup'){transfer(s,f,a,'factorysnack',h,true);return true;}
  if(st.kind==='packer'){if(act.factory.hopper<18&&h.take(a,'factorysnack')){act.factory.hopper++;h.changed(s);}return true;}
  if(st.kind==='seal'){
    if(fs.stock.sealedbox===0&&act.factory.hopper>=3){act.factory.hopper-=3;fs.stock.sealedbox++;h.changed(s);}
    transfer(s,f,a,'sealedbox',h,true);return true;
  }
  if(st.kind==='delivery'){
    const d=act.factory.delivery;
    if(d){if(d.timer===0&&!d.paid){h.pay(s,f,a,B.prices.delivery,d);act.factory.completed++;fs.served++;s.served++;act.factory.delivery=null;h.changed(s);}}
    else if(h.take(a,'sealedbox')){act.factory.delivery={id:s.nextId++,timer:4,paid:false};h.changed(s);}return true;
  }
  return false;
}
export function expansionGoal(s,f,a,h){
  const fs=s.floors[f],act=fs.activity;
  if(f===10){const v=act.factory;
    if(v.delivery?.timer===0)return 'delivery';
    if(a.bag.includes('sealedbox'))return v.delivery?null:'delivery';
    if(a.bag.includes('factorysnack'))return fs.products.packing?'packer':null;
    if(fs.products.packing&&(fs.stock.sealedbox>0||v.hopper>=3)&&a.bag.length<h.capacity(s,a,f))return 'seal';
    if(fs.products.packing&&fs.stock.factorysnack>0)return 'factoryPickup';
    if(a.bag.includes('ingredient'))return v.input<6?'processor':null;
    if(fs.products.processor&&v.input<3&&fs.stock.factorysnack<18)return 'ingredients';return null;
  }
  if(sessionFloor(f)||tableFloor(f)){
    const dirty=fs.tables.findIndex(t=>t.owned&&t.state==='dirty');if(dirty>=0)return 'table'+dirty;
    if(f===9&&act.water.some(n=>n===0))return 'water';
    const fault=fs.customers.find(c=>c.fault);if(fault)return 'table'+fault.table;
    const owed=fs.customers.find(c=>c.state==='payment');if(owed)return 'table'+owed.table;
    if(f===9&&fs.customers.some(c=>c.playReady&&c.state==='playing'))return 'playground';
    const c=fs.customers.find(c=>['service','dining'].includes(c.state)&&missing(c));
    if(c){const item=missing(c);if(a.bag.includes(item))return 'table'+c.table;if(f===7&&item==='smoothie'&&fs.counter.smoothie>0)return 'drinkCounter';if(a.bag.length>=h.capacity(s,a,f))h.returnBag(s,a,f);return item;}
    if(fs.customers.some(c=>c.state==='ordering'))return 'usher';
    if(fs.customers.some(c=>c.state==='waiting')&&freeSeat(fs)>=0)return sessionFloor(f)?'admit':'host';
    if(f===9&&act.water.some(n=>n<3))return 'water';return null;
  }
  if(f===6){
    if(act.robot.fault)return 'robot';
    if(a.bag.includes('ingredient'))return act.robot.input<6?'robot':null;
    if(fs.stock.robotmeal>0&&!a.bag.length)return 'robotPickup';
    if(fs.products.robotmeal&&act.robot.input<2&&fs.stock.robotmeal<6&&!a.bag.includes('robotmeal'))return 'ingredients';
  }
  return undefined; // use the original counter worker for dessert/robot service
}
export function expansionTick(s,f,dt,h){
  const fs=s.floors[f],act=fs.activity;
  for(const c of fs.customers)if(c.reaction>0)c.reaction=Math.max(0,c.reaction-dt);
  if(f===7)act.weather=(act.weather+dt)%55;
  if(f===4)for(const a of [s.floor===f?s.player:null,...s.employees.filter(e=>e.floor===f)].filter(Boolean)){
    const count=a.bag.filter(i=>i==='icecream').length;a.cold=(a.cold??[]).slice(-count||Infinity);while(a.cold.length<count)a.cold.push(30);
    if(!count){a.cold=[];continue;}
    for(let i=a.cold.length-1;i>=0;i--){a.cold[i]=Math.max(0,a.cold[i]-dt);if(a.cold[i]===0){h.take(a,'icecream');a.cold.splice(i,1);h.changed(s);h.emit(s,'Oops! Ice cream became a puddle. Grab another scoop!','melt',{floor:f,x:a.x,y:a.y});const guest=fs.customers.find(c=>c.state==='waiting');if(guest)guest.reaction=3;}}
  }
  if(f===6){const r=act.robot;
    if(!r.fault&&r.timer===0&&r.input>0&&fs.stock.robotmeal<B.stockCap){r.input--;r.timer=fs.section?2.5:4;h.changed(s);}
    if(r.timer>0&&!r.fault){r.timer=Math.max(0,r.timer-dt);if(r.timer===0){fs.stock.robotmeal++;r.batches++;r.fault=r.batches%(fs.section?8:4)===0;h.changed(s);}}
  }
  if(f===10){const v=act.factory;
    if(v.timer===0&&v.input>0&&fs.stock.factorysnack<B.stockCap){v.input--;v.timer=3;h.changed(s);}
    if(v.timer>0){v.timer=Math.max(0,v.timer-dt);if(v.timer===0){fs.stock.factorysnack++;h.changed(s);}}
    if(fs.section&&fs.products.packing){v.belt+=dt;if(v.belt>=2){v.belt=0;if(fs.stock.factorysnack>0&&v.hopper<18){fs.stock.factorysnack--;v.hopper++;h.changed(s);}}}
    if(v.delivery)v.delivery.timer=Math.max(0,v.delivery.timer-dt);
  }
  if(!sessionFloor(f)&&!tableFloor(f))return;
  for(const c of fs.customers){
    c.moving=false;
    if(c.state==='leaving'){followPath(c,f,WORLD.entrance,dt,2.8);c.timer+=dt;continue;}
    if(c.state==='waiting'){followPath(c,f,waiting(fs,c),dt,2.2);continue;}
    if(c.state==='ordering'){followPath(c,f,{x:11,y:11.8+c.table*.6},dt,2.2);continue;}
    if(c.state==='toTable'){const dest=tableApproach(c.table);followPath(c,f,dest,dt,2.2);if(distance(c,dest)<.2){Object.assign(c,tableSeat(c.table));c.state=sessionFloor(f)?'dining':'service';c.timer=f===5?14:f===8?(c.premium?24:16):6;c.path=[];c.pathKey='';c.moving=false;fs.tables[c.table].state='occupied';h.changed(s);}continue;}
    if(c.state==='dining'){
      if(f===8&&c.timer<=8&&!c.faultDone)c.fault=true;
      if(c.fault||f===9&&fs.products.treat&&act.water[c.table]===0)continue;
      const rate=f===7&&act.weather>=40&&!act.umbrellas[c.table]?0.5:1;
      c.timer=Math.max(0,c.timer-dt*rate);
      if(c.timer===0){if(sessionFloor(f)){dirty(s,f,c);finish(s,f,c,h);}else{if(f===9&&fs.products.treat)act.water[c.table]--;c.state='payment';h.changed(s);}}continue;
    }
    if(c.state==='playing'&&f===9){const dest={x:12.8,y:14};followPath(c,f,dest,dt,2.2);if(distance(c,dest)<.3){c.timer=Math.max(0,c.timer-dt);if(c.timer===0)c.playReady=true;}}
  }
  fs.customers=fs.customers.filter(c=>c.state!=='leaving'||c.timer<20&&(c.timer<1||distance(c,WORLD.entrance)>.3));
}
export function expansionPet(s,f,a,st,kind,h){
  const fs=s.floors[f];
  if(kind==='cash'&&st.kind==='delivery'&&fs.activity.factory.delivery?.timer===0){expansionInteract(s,f,a,st,h);return true;}
  if(kind==='cash'&&st.kind==='playground'&&fs.customers.some(c=>c.state==='playing'&&c.playReady)){expansionInteract(s,f,a,st,h);return true;}
  if(st.kind!=='table'||(!sessionFloor(f)&&!tableFloor(f)))return false;
  const c=fs.customers.find(c=>c.id===fs.tables[Number(st.id.slice(5))].customer);
  if(kind==='cash'&&c?.state==='payment'){expansionInteract(s,f,a,st,h);return true;}
  if(kind==='serve'&&c&&!c.fault&&['service','dining'].includes(c.state)&&c.needs.some((item,i)=>!c.delivered[i]&&a.bag.includes(item))){expansionInteract(s,f,a,st,h);return true;}
  return false;
}
