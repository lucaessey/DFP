import { LAYOUTS, tableSeat } from './config.js';
import { walkable } from './navigation.js';
import { food } from './scene-assets.js';

export const damp = (a,b,rate,dt) => a+(b-a)*(1-Math.exp(-rate*dt));
export function angleTowards(a,b,dt) {return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-12*dt));}

export function visualWalkable(floor,x,y,actor) {
  if(actor?.state==='dining'&&actor.table!==null){const seat=tableSeat(actor.table);if(Math.hypot(x-seat.x,y-seat.y)<.12)return true;}
  return walkable(floor,x,y,.3);
}

// Offsets belong exclusively to presentation. They never mutate saved actors or
// affect proximity checks, stock, timers or rewards.
export function crowdTargets(entries,floor) {
  const placed=[];
  for(const entry of entries) {
    const a=entry.actor;let chosen={x:a.x,y:a.y},best=Infinity;
    const valid=(x,y)=>visualWalkable(floor,x,y,a)&&placed.every(p=>Math.hypot(p.x-x,p.y-y)>.61);
    if(entry.role!=='player'&&!valid(a.x,a.y)) {
      for(let r=.16;r<=2.01;r+=.16)for(let i=0;i<20;i++) {
        const angle=i*Math.PI/10+(entry.order%3)*.21,x=a.x+Math.cos(angle)*r,y=a.y+Math.sin(angle)*r;
        if(!valid(x,y))continue;
        const previous=entry.rig?.root.position,score=r+(previous?Math.hypot(x-previous.x,y-previous.z)*.25:0);
        if(score<best){best=score;chosen={x,y};}
      }
    }
    placed.push(chosen);entry.target=chosen;
  }
  return entries;
}

export function separateCrowd(entries,floor) {
  for(let pass=0;pass<4;pass++)for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++) {
    const a=entries[i],b=entries[j],p=a.rig.root.position,q=b.rig.root.position;
    const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d>=.56)continue;
    const ux=d>.001?dx/d:Math.cos(i+j),uz=d>.001?dz/d:Math.sin(i+j),anchored=e=>e.role==='player'||e.rig.sit>.7,amount=(.565-d)/(anchored(a)||anchored(b)?1:2);
    for(const [entry,pos,sign] of [[a,p,-1],[b,q,1]]) {if(anchored(entry))continue;const x=pos.x+ux*amount*sign,y=pos.z+uz*amount*sign;if(visualWalkable(floor,x,y,entry.actor)){pos.x=x;pos.z=y;}}
  }
}

export function animateCharacter(model,a,target,state,dt,time) {
  const reduced=state.settings.reducedMotion,floor=state.floor;
  if(!model.previous){model.root.position.set(target.x,0,target.y);model.previous={x:a.x,y:a.y,state:a.state,delivered:a.delivered?.filter(Boolean).length||0,bag:a.bag?.length||0};}
  const previous=model.previous,dx=a.x-previous.x,dz=a.y-previous.y,moved=Math.hypot(dx,dz);
  model.walk=model.role==='player'&&!a.moving?0:damp(model.walk,Math.min(5,moved/Math.max(dt,.001)),10,dt);model.phase+=model.walk*dt*6.6;
  let x=model.role==='player'?target.x:damp(model.root.position.x,target.x,17,dt),z=model.role==='player'?target.y:damp(model.root.position.z,target.y,17,dt);
  if(!visualWalkable(floor,x,z,a)){x=target.x;z=target.y;}
  model.root.position.set(x,0,z);
  const st=LAYOUTS[floor].find(s=>s.id===a.action),working=!!st&&!a.moving&&model.walk<.7;
  if(moved>.0001)model.heading=Math.atan2(dx,dz);
  let facing=model.angle;
  // Simulation runs at 20 Hz. Keep its last travel heading between render frames.
  if(a.moving||moved>.005||model.walk>.35)facing=model.heading??model.angle;
  else if(working)facing=Math.atan2(st.x+st.w/2-x,st.y+st.d/2-z);
  else if(a.purpose==='food'&&['waiting','payment'].includes(a.state))facing=Math.atan2(5-x,9-z);
  else if(a.state==='playing'||a.state==='checkout')facing=Math.PI;
  else if(a.state==='browsing')facing=0;
  const sitting=a.purpose==='food'&&a.table!==null&&a.table!==undefined&&a.state==='dining';
  if(sitting)facing=Math.PI/2;
  model.angle=reduced?facing:angleTowards(model.angle,facing,dt);model.rig.rotation.y=model.angle;model.sit=damp(model.sit,sitting?1:0,10,dt);
  const carryItems=a.purpose==='food'&&['toTable','waitingTable'].includes(a.state)?a.needs:a.bag||[],key=carryItems.join(',');
  if(key!==model.bagKey){for(const mesh of model.bagModels)model.carry.remove(mesh);const columns=carryItems.length>4?2:1,heights=[0,0];model.bagModels=carryItems.map((kind,i)=>{const column=i%columns,mesh=food(kind),height=['drink','tower','wine','souvenir'].includes(kind)?.59:.22;mesh.position.set(columns===2?(column? .29:-.29):0,heights[column],0);heights[column]+=height*.85;mesh.scale.setScalar(.85);model.carry.add(mesh);return mesh;});model.carry.userData.height=Math.max(...heights);model.tray.scale.x=columns===2?1.25:.76;model.bagKey=key;}
  model.tray.visible=carryItems.length>0;
  const received=(a.delivered?.filter(Boolean).length||0)>previous.delivered,interaction=carryItems.length!==previous.bag||received||a.state!==previous.state;
  if(interaction)model.react=1;model.react=Math.max(0,model.react-dt*2.3);model.work=damp(model.work,working||a.state==='playing'?1:0,12,dt);
  const stride=Math.min(1,model.walk/1.7),phase=model.phase,idle=reduced?0:Math.sin(time*2.4+a.x)*.012,bob=reduced?0:Math.abs(Math.sin(phase))*.035*stride;
  model.hips.position.y=.54+idle+bob-model.sit*.04;model.torso.rotation.x=damp(model.torso.rotation.x,working?.06:0,9,dt);model.head.rotation.z=reduced?0:Math.sin(model.react*Math.PI)*.10;
  for(let i=0;i<2;i++) {
    const sign=i?1:-1,leg=model.legs[i],arm=model.arms[i],swing=Math.sin(phase)*stride*.6*sign;
    leg.rotation.x=swing*(1-model.sit)-model.sit*1.15;leg.position.y=Math.max(0,Math.sin(phase)*sign)*stride*.07*(1-model.sit);model.knees[i].rotation.x=model.sit*1.15+Math.max(0,-swing)*.45*(1-model.sit);
    const beat=reduced?.5:(.5+.5*Math.sin((a.progress||0)/.65*Math.PI*2+i*.7));let armAngle=-swing*.75;
    if(carryItems.length)armAngle=-1.12;if(working)armAngle=-.85-beat*.55;
    if(a.action==='greet'&&working&&i===1)armAngle=-2.1-beat*.35;
    if(a.state==='playing')armAngle=-1.0+(reduced?0:Math.sin(time*9+i)*.16);
    if(sitting)armAngle=a.state==='dining'?-1.0-(reduced?0:Math.sin(time*3+i)*.45):-.35;
    if(received||model.react>.5)armAngle-=Math.sin(model.react*Math.PI)*.3;
    arm.rotation.x=damp(arm.rotation.x,armAngle,15,dt);arm.rotation.z=damp(arm.rotation.z,carryItems.length?sign*.16:sign*.04,12,dt);
    if(working&&st.kind==='table'&&!reduced)arm.rotation.z+=Math.sin(time*7+i)*.15;
  }
  model.carry.position.y=-.12+(reduced?0:Math.sin(phase-.3)*.015*stride+Math.sin(model.react*Math.PI)*.045);model.carry.rotation.x=reduced?0:Math.sin(phase)*.02*stride;model.contact.scale.setScalar(1-model.sit*.15);
  Object.assign(previous,{x:a.x,y:a.y,state:a.state,delivered:a.delivered?.filter(Boolean).length||0,bag:carryItems.length});return {interaction,received,working};
}
