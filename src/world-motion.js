import {serviceItems,serviceCustomers,customerCounter} from './config.js';
import {BALANCE as B,LAYOUTS,stationOpen,stationPrice} from './config.js';
import {capacity} from './simulation.js';
import {food,group,material} from './scene-assets.js';

export const clamp01=n=>Math.max(0,Math.min(1,n));
export const smooth=n=>{n=clamp01(n);return n*n*(3-2*n);};
export const landing=n=>n>=1?0:Math.sin(clamp01(n)*Math.PI)*.10;
const statusColors={locked:'#b9a6c7',idle:'#b49bdb',working:'#ffbd32',ready:'#65d777',blocked:'#ed8761'};

// Derived presentation state. No commands, writes to saved state, or reward callbacks.
export function stationCue(state,f,st){
 const fs=state.floors[f],actors=[...(state.floor===f?[state.player]:[]),...state.employees.filter(a=>a.floor===f)],workers=actors.filter(a=>a.action===st.id&&!a.moving),worker=workers.find(a=>a.progress>0)||workers[0];
 const result={state:'idle',progress:clamp01((worker?.progress||0)/B.actionTime),worker,amount:0,afford:clamp01(state.money/Math.max(1,stationPrice(st)))};
 if(!stationOpen(state,f,st))return {...result,state:'locked'};
 if(st.kind==='table'){const t=fs.tables[Number(st.id.slice(5))];return {...result,state:t.state==='dirty'?(worker?'working':'ready'):['occupied','reserved'].includes(t.state)?'working':'idle'};}
 if(st.kind==='arcade'){const m=fs.machines[Number(st.id.at(-1))];return {...result,state:m.quarters?'ready':m.customer?'working':'idle',amount:m.quarters};}
 if(st.kind==='vr')return {...result,state:state.floor===f&&state.vr?(state.vr.done?'ready':'working'):'idle',progress:state.vr?clamp01(state.vr.time/B.vrTime):0};
 if(st.kind==='fryer')return {...result,state:fs.cooking?'working':fs.stock.controller>=B.stockCap||worker&&!fs.stock.raw?'blocked':fs.stock.raw?'ready':'idle',progress:fs.cooking?1-fs.fry/B.fryTime:0};
 if(st.kind==='pickup')return {...result,state:worker&&worker.bag.length>=capacity(state,worker,f)?'blocked':fs.stock.controller?'ready':worker?'blocked':'idle',amount:fs.stock.controller};
 if(st.kind==='counter'){const c=serviceCustomers(fs,f,st.id)[0];return {...result,state:c?.state==='payment'?'ready':c?(c.needs.some((n,i)=>!c.delivered[i]&&serviceItems(f,st.id).includes(n)&&fs.counter[n])?'working':'blocked'):'idle'};}
 if(st.kind==='checkout')return {...result,state:fs.customers.some(c=>c.state==='checkout')?'ready':'idle'};
 if(st.kind==='shelf'||st.kind==='keyShelf'){const item=st.kind==='shelf'?'souvenir':'keychain',amount=fs.shelves[item];return {...result,state:worker?.bag.includes(item)&&amount<B.stockCap?'working':amount?'ready':worker?'blocked':'idle',amount};}
 if(st.kind==='stack'){const total=serviceItems(f,st.id).reduce((n,k)=>n+fs.counter[k],0),canPlace=worker?.bag.some(k=>serviceItems(f,st.id).includes(k)&&fs.counter[k]<B.stockCap);return {...result,state:canPlace?'working':worker?.bag.length?'blocked':total?'ready':'idle',amount:total};}
 if(st.kind==='trash')return {...result,state:worker?.bag.length?'working':'idle'};
 const full=st.kind==='prep'?fs.stock.raw>=B.stockCap:worker&&worker.bag.length>=capacity(state,worker,f);
 return {...result,state:full?'blocked':worker?'working':'idle'};
}

export function carryLayout(items){
 const visible=items.slice(0,4),columns=items.length>2?2:1,heights=[0,0];
 const parts=visible.map((kind,i)=>{const col=i%columns,p={kind,x:columns===2?(col?.245:-.245):0,y:heights[col],scale:.72};heights[col]+=(['drink','tower','wine','souvenir','milkshake','smoothie','popcorn','icecream','sealedbox','ingredient'].includes(kind)?.59:.22)*.72;return p;});
 return {parts,columns,height:Math.max(...heights),quantity:items.length,overflow:items.length>4};
}

export function collectionPoint(f,x,z){
 const st=LAYOUTS[f].filter(s=>['counter','checkout','arcade','vr','table','delivery','admit','playground'].includes(s.kind)).sort((a,b)=>Math.hypot(a.pad.x-x,a.pad.y-z)-Math.hypot(b.pad.x-x,b.pad.y-z))[0];
 if(!st||Math.hypot(st.pad.x-x,st.pad.y-z)>1.5)return {x,y:.9,z,station:null};
 return {x:st.x+st.w/2+(st.kind==='counter'?1.25:st.kind==='arcade'?.45:0),y:st.kind==='arcade'?.3:1.17,z:st.y+st.d/2+(st.kind==='arcade'?.65:0),station:st.id};
}

export function updateStationMotion(data,state,dt,time,reduced,reducedEffects){
 const {st}=data,f=state.floor,fs=state.floors[f],cue=stationCue(state,f,st);data.cue=cue;
 data.pad.material=material(statusColors[cue.state]);
 if(data.buildAge!==undefined){
   if(data.buildAge<0){if(!document.querySelector('dialog[open]'))data.buildAge=0;}
   else{data.buildAge+=dt;const t=clamp01(data.buildAge/.6);data.body.position.y=reduced?0:-.24*(1-smooth(t));data.body.scale.setScalar(reduced?1:1-.16*(1-smooth(t))+.035*Math.sin(t*Math.PI));if(t===1){data.body.position.y=0;data.body.scale.setScalar(1);delete data.buildAge;}}
 }
 for(const mesh of data.goods.children){const u=mesh.userData;if(u.born===undefined)continue;u.born+=dt;mesh.visible=reduced||u.born>=0;const t=clamp01(u.born/.26),bounce=reduced?0:landing(t);mesh.position.y=u.restY+bounce;mesh.scale.setScalar(u.restScale*(1+(reduced?0:Math.sin(t*Math.PI)*.055)));if(t===1)delete u.born;}
 const active=cue.state==='working',x=st.x+st.w/2,z=st.y+st.d/2;
 data.steam.forEach((p,i)=>{p.visible=active&&!reduced&&!reducedEffects;if(p.visible){const phase=(time*.7+i*.2)%1;p.position.y=1.4+phase*.72;p.scale.setScalar(.07+phase*.13);p.position.x=x+(i%2?-.34:.34)+Math.sin(time+i)*.05;}});
 data.bubbles.forEach((p,i)=>{p.visible=active;p.scale.setScalar(reduced?.08:.06+.04*(.5+.5*Math.sin(time*9+i)));p.position.y=1.365+(reduced?0:Math.max(0,Math.sin(time*7+i))*.045);});
 data.parts.forEach(p=>{p.userData.restY??=p.position.y;p.position.y=p.userData.restY+(active&&!reduced?Math.sin(cue.progress*Math.PI)*.07:0);});
 if(data.pour){data.pour.visible=active;data.stream.visible=active&&(!reduced&&cue.progress>.12);const height=.19*(reduced?1:cue.progress);data.fill.scale.y=Math.max(.005,height);data.fill.position.y=1.12+height/2;}
 if(data.register){data.register.rotation.z=data.flash>0&&!reduced?Math.sin(data.flash*20)*.025:0;data.flash=Math.max(0,(data.flash||0)-dt);}
 data.lights.forEach((light,i)=>{light.visible=data.open;const running=cue.state==='working',finished=cue.state==='ready';light.material=material(finished?'#83f456':running?'#ffe060':'#b59dda',false,true);light.scale.y=1.84*(running&&!reduced?.84+Math.sin(time*5+i)*.16:1);});
 // Uncollected bills are a view of existing customer states, never a new balance.
 if(['counter','checkout'].includes(st.kind)){
   const pending=fs.customers.filter(c=>!c.paid&&(st.kind==='counter'?c.purpose==='food'&&c.state==='payment'&&customerCounter(f,c)===st.id:c.state==='checkout')).length;
   if(!data.cash){data.cash=group(data.detail);data.bills=Array.from({length:3},(_,i)=>{const b=food('cash');b.scale.setScalar(.8);b.position.set(x+(st.kind==='counter'?1.25:.45),1.12+i*.15,z+.1);data.cash.add(b);return b;});}
   if(data.pending!==undefined&&pending>data.pending)data.cashAge=0;data.pending=pending;data.cashAge=(data.cashAge??1)+dt;
   data.bills.forEach((b,i)=>{b.visible=i<Math.min(3,pending);b.position.y=1.12+i*.15+(reduced?0:landing(data.cashAge/.28));});
 }
 return cue;
}
