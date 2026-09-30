import {customerCounter} from './config.js';
import * as T from 'three';
import {BALANCE as B,LAYOUTS,tableSeat} from './config.js';
import {walkable} from './navigation.js';
import {food,STICKMAN as R} from './scene-assets.js';
import {carryLayout} from './world-motion.js';

export const damp=(a,b,rate,dt)=>a+(b-a)*(1-Math.exp(-rate*dt));
export const angleTowards=(a,b,dt)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*(1-Math.exp(-12*dt));
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const down=new T.Vector3(0,-1,0),direction=new T.Vector3(),bend=new T.Vector3(),joint=new T.Vector3(),lower=new T.Vector3(),inverse=new T.Quaternion();
const desired=new T.Vector3();
export function itemDelta(before,after){const remaining=[...before],added=[];for(const item of after){const i=remaining.indexOf(item);if(i<0)added.push(item);else remaining.splice(i,1);}return {added,removed:remaining};}

function armPose(model,index,point,dt,reduced){
  const arm=model.arms[index],elbow=model.elbows[index],hand=model.hands[index],target=model.handTargets[index];
  target.lerp(point,reduced?1:1-Math.exp(-18*dt));direction.copy(target).sub(arm.position);
  const distance=clamp(direction.length(),.045,R.upperArm+R.forearm-.004);direction.normalize();
  bend.set(index?.4:-.4,-1,-.15).addScaledVector(direction,-bend.dot(direction)).normalize();
  const along=(R.upperArm**2-R.forearm**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,R.upperArm**2-along**2));
  joint.copy(direction).multiplyScalar(along).addScaledVector(bend,height);
  arm.quaternion.setFromUnitVectors(down,lower.copy(joint).normalize());
  inverse.copy(arm.quaternion).invert();lower.copy(direction).multiplyScalar(distance).sub(joint).normalize().applyQuaternion(inverse);
  elbow.quaternion.setFromUnitVectors(down,lower);
  hand.quaternion.copy(arm.quaternion).multiply(elbow.quaternion).invert();
}

function legPose(model,index,footY,footZ,sit,dt,reduced){
  const leg=model.legs[index],knee=model.knees[index],foot=model.feet[index];
  footY=footY*(1-sit)+R.footHeight*sit;footZ=footZ*(1-sit)+.33*sit;
  const dy=model.hips.position.y-footY,distance=clamp(Math.hypot(dy,footZ),.02,R.thigh+R.shin-.0001);
  const hip=-Math.atan2(footZ,dy)-Math.acos(clamp((R.thigh**2+distance**2-R.shin**2)/(2*R.thigh*distance),-1,1));
  const bendAngle=Math.PI-Math.acos(clamp((R.thigh**2+R.shin**2-distance**2)/(2*R.thigh*R.shin),-1,1));
  const hipTarget=hip,kneeTarget=bendAngle;
  leg.rotation.x=reduced?hipTarget:damp(leg.rotation.x,hipTarget,26,dt);knee.rotation.x=reduced?kneeTarget:damp(knee.rotation.x,kneeTarget,26,dt);
  foot.rotation.x=-leg.rotation.x-knee.rotation.x;
}

function frontClearance(floor,x,z,angle,limit,radius,canWalk=walkable){
  const sx=Math.sin(angle),sz=Math.cos(angle);let clear=0;
  for(let d=.05;d<=limit+.001;d+=.05){if(!canWalk(floor,x+sx*d,z+sz*d,radius))break;clear=d;}
  return clear;
}

// All clocks, IK targets, carried meshes and gestures below are presentation only.
// This module never calls a command, writes an actor, or completes a transaction.
export function animateStickman(model,a,target,state,dt,time,validPosition,environment={}){
  const canWalk=environment.walkable||walkable,seatAt=environment.seat||tableSeat,layout=environment.layout||LAYOUTS[state.floor];
  dt=clamp(dt,0,.1);const reduced=state.settings.reducedMotion,floor=state.floor;
  const carryItems=a.purpose==='food'&&['waiting','payment','toTable','waitingTable'].includes(a.state)?a.needs.filter((_,i)=>a.delivered[i]):a.bag||[];
  if(!model.previous){model.root.position.set(target.x,0,target.y);model.previous={x:a.x,y:a.y,state:a.state,table:a.table,action:a.action,moving:a.moving,reduced,bag:[...carryItems],delivered:[...(a.delivered||[])]};model.transferToken=0;model.reveal=0;}
  const previous=model.previous,dx=a.x-previous.x,dz=a.y-previous.y,moved=Math.hypot(dx,dz),wasSitting=['dining','service','payment'].includes(previous.state)&&previous.table!==null;
  const sitting=a.table!==null&&a.table!==undefined&&['dining','service','payment'].includes(a.state);
  if(!reduced&&a.table!==null&&a.table!==undefined&&wasSitting!==sitting){
    const seat=seatAt(a.table);model.seatOrigin=seat;
    model.seatRoute=sitting?[{x:seat.x-.75,y:seat.y+.75},{x:seat.x,y:seat.y+.75},seat]:[{x:seat.x,y:seat.y+.75},{x:seat.x-.75,y:seat.y+.75}];
    model.standPause=sitting?0:.18;model.transferToken++;
  }
  if(reduced){model.seatRoute=null;model.standPause=0;}
  const interrupted=previous.action!==a.action||previous.reduced!==reduced||(!previous.moving&&a.moving);
  if(interrupted){model.transferToken++;model.reveal=0;model.celebrate=0;}
  const oldX=model.root.position.x,oldZ=model.root.position.z;
  let x=model.role==='player'?target.x:damp(model.root.position.x,target.x,17,dt),z=model.role==='player'?target.y:damp(model.root.position.z,target.y,17,dt);
  if(model.seatRoute?.length){
    model.standPause=Math.max(0,model.standPause-dt);const point=model.seatRoute[0],distance=Math.hypot(point.x-oldX,point.y-oldZ),amount=model.standPause?0:Math.min(1,dt*4.5/Math.max(.001,distance));
    x=oldX+(point.x-oldX)*amount;z=oldZ+(point.y-oldZ)*amount;if(distance<.06)model.seatRoute.shift();
  }else if(!validPosition(floor,x,z,a)){x=target.x;z=target.y;}
  model.root.position.set(x,0,z);
  const travel=model.role==='player'?moved:Math.hypot(x-oldX,z-oldZ);
  model.walk=model.role==='player'&&!a.moving?0:damp(model.walk,Math.min(5,travel/Math.max(dt,.001)),10,dt);
  // Accumulate actual visible travel; render frames cannot advance a stationary gait.
  if(travel<.65)model.travelPhase+=travel*Math.PI*2/R.stride;
  model.phase=damp(model.phase,model.travelPhase,24,dt);
  const st=layout.find(s=>s.id===a.action),working=!!st&&!a.moving&&model.walk<.7;
  if(model.role!=='player'&&travel>.0001)model.heading=Math.atan2(x-oldX,z-oldZ);
  else if(moved>.0001&&!wasSitting)model.heading=Math.atan2(dx,dz);
  let facing=model.angle;
  if(a.moving||moved>.005||model.walk>.35)facing=model.heading??model.angle;
  else if(working)facing=Math.atan2(st.x+st.w/2-x,st.y+st.d/2-z);
  else if(a.purpose==='food'&&['waiting','payment'].includes(a.state)){const serving=LAYOUTS[floor].find(st=>st.id===customerCounter(floor,a));facing=Math.atan2(serving.x+serving.w/2-x,serving.y+serving.d/2-z);}
  else if(['playing','checkout'].includes(a.state))facing=Math.PI;
  else if(a.state==='browsing')facing=0;
  const seated=sitting&&!model.seatRoute?.length;
  if(seated)facing=a.purpose==='movie'?Math.PI:(environment.seatFacing??Math.PI/2);
  model.angle=reduced?facing:angleTowards(model.angle,facing,dt);model.rig.rotation.y=model.angle;
  model.sit=reduced?(seated?1:0):damp(model.sit,seated?1:0,12,dt);
  const delta=itemDelta(previous.bag,carryItems),delivered=(a.needs||[]).filter((_,i)=>a.delivered?.[i]&&!previous.delivered[i]),received=delivered.length>0;
  const changed=delta.added.length+delta.removed.length>0,interaction=changed||received;
  if(interaction){model.react=1;model.transferToken++;}
  const key=carryItems.join(',');
  if(key!==model.bagKey){
    model.carry.remove(...model.bagModels);const plan=carryLayout(carryItems),incoming=[...delta.added];
    model.bagModels=plan.parts.map(({kind,x,y,scale})=>{const mesh=food(kind);
      mesh.position.set(x,y,0);mesh.scale.setScalar(scale);
      const added=incoming.indexOf(kind);mesh.userData.incoming=added>=0;if(added>=0)incoming.splice(added,1);model.carry.add(mesh);return mesh;
    });
    model.carry.userData.height=plan.height;model.tray.scale.x=plan.columns===2?1.35:1;model.bagKey=key;model.visibleQuantity=plan.quantity;
    model.reveal=delta.added.length&&!reduced&&working?.32:0;
  }
  model.reveal=Math.max(0,model.reveal-dt);for(const mesh of model.bagModels)mesh.visible=!mesh.userData.incoming||model.reveal===0;
  model.tray.visible=carryItems.length>0;
  model.react=Math.max(0,model.react-dt*3.8);model.work=damp(model.work,working?1:0,14,dt);
  if(model.role==='customer'&&!a.moving&&!carryItems.length&&['waiting','checkout','leaving'].includes(a.state)&&model.greeted!==a.state){model.greet=.7;model.greeted=a.state;}
  model.greet=Math.max(0,model.greet-dt);model.celebrate=Math.max(0,model.celebrate-dt);if(a.moving||carryItems.length||reduced)model.celebrate=0;
  const stride=clamp(model.walk/1.8),phase=model.phase,seed=model.variation*.73;
  const idle=reduced?0:Math.sin(time*2+seed)*.008*(1-stride),bounce=reduced?0:Math.cos(phase*2)*.012*stride;
  const cheer=model.celebrate>0?Math.sin(clamp((1.05-model.celebrate)/1.05)*Math.PI):0;
  model.hips.position.y=R.hipHeight+idle+bounce-model.sit*.125;
  model.torso.rotation.x=damp(model.torso.rotation.x,working&&!reduced?.045:0,14,dt);
  model.torso.rotation.z=reduced?0:Math.sin(time*1.7+seed)*.018*(1-stride)*(1-model.sit);
  const stretch=reduced?0:Math.sin(phase*2)*.012*stride+cheer*.025;
  model.torso.scale.set(1-stretch*.4,1+stretch,1-stretch*.4);
  model.head.rotation.z=reduced?0:Math.sin(time*1.3+seed)*.024*(1-stride)+Math.sin(model.react*Math.PI)*.045;
  const glance=reduced?0:Math.sin(time*.68+seed)**9*.16*(1-stride)*(1-model.work);
  model.head.rotation.y=damp(model.head.rotation.y,glance,5,dt);
  for(let i=0;i<2;i++){
    const u=((phase/(Math.PI*2)+i*.5)%1+1)%1,stance=u<.5;
    const footZ=(stance?.22-.88*u:-.22+.44*smooth((u-.5)*2))*stride;
    const lift=stance?0:Math.sin((u-.5)*Math.PI*2)*.105*stride;
    legPose(model,i,R.footHeight+lift,footZ,model.sit,dt,reduced);
  }
  // Correct any tiny IK/blending undershoot at the floor without moving the actor.
  model.rig.updateMatrixWorld(true);let lowest=Infinity;
  for(const foot of model.feet){foot.getWorldPosition(desired);lowest=Math.min(lowest,desired.y-.06);}
  if(lowest<.018)model.hips.position.y+=.018-lowest;
  const reach= Math.max(smooth(((a.progress||0)/B.actionTime-.2)/.8),model.react);
  model.tools.spatula.visible=working&&!cheer&&st.kind==='fryer';model.tools.pitcher.visible=working&&!cheer&&(['drinks','wine','water'].includes(st.kind)||['milkshake','smoothie'].includes(st.id));model.tools.cloth.visible=working&&!cheer&&st.kind==='table'&&state.floors[floor].tables[Number(st.id.slice(5))].state==='dirty';
  const clearance=frontClearance(floor,x,z,model.angle,.8,.32,canWalk);
  const carryDepth=Math.min(.46,Math.max(0,clearance-.3));
  model.carry.position.set(0,.31+(reduced?0:Math.sin(phase-.4)*.012*stride),carryDepth);
  model.carry.rotation.x=reduced?0:Math.sin(phase)*.018*stride;
  model.motion=seated&&model.sit>.8?'eat':sitting?'sit':model.sit>.08?'stand':stride>.12?'walk':working?st.kind:carryItems.length?'carry':'idle';
  for(let i=0;i<2;i++){
    const side=i?1:-1,wave=reduced?0:Math.sin(time*7+i)*.06;
    desired.set(side*.28,-.23,Math.sin(phase)*stride*.12*side);
    if(carryItems.length)desired.set(side*.26,.27,Math.max(.12,carryDepth-.045));
    if(working){
      desired.set(side*.23,.10+reach*.15,.22+reach*.24);
      if(st.kind==='fryer')desired.set(side*.22+(i?wave:0),.12+(i?reach*.16:0),.33+(i?wave:0));
      if((['drinks','wine','water'].includes(st.kind)||['milkshake','smoothie'].includes(st.id)))desired.set(side*.14,i?.41:.17,i?.31:.38);
      if(['counter','checkout','admit','host','usher','robot','processor','packer','seal','delivery','prepare'].includes(st.kind))desired.set(side*.22,.22,.29+reach*.18);
      if(['shelf','keyShelf'].includes(st.kind))desired.set(side*.20,.24+reach*.10,.27+reach*.19);
      if(st.kind==='table')desired.set(side*.18+(i?wave:0),.16,.38+wave);
      if(st.kind==='arcade')desired.set(side*.20,-.10+reach*.28,.23+reach*.20);
    }
    if(a.state==='playing')desired.set(side*.21,.16,.36+(reduced?0:Math.sin(time*8+i)*.035));
    if(seated){if(a.purpose==='esports'){desired.set(side*.18,.18+(reduced?0:Math.sin(time*7+i)*.025),.35);model.motion='gaming';}else if(a.purpose==='movie'&&!a.delivered.some(Boolean)){desired.set(side*.28,-.12,.22);model.motion='watching';}else desired.set(side*.18,.22+(i===0&&!reduced?(.5+.5*Math.sin(time*3))*.20:0),i===0?.28:.33);}
    if((!working||cheer>0)&&!carryItems.length&&i===1&&(model.greet>0||cheer>0)){desired.set(.36,.45+(reduced?0:cheer*.05),.10);model.motion=cheer?'celebrate':'greet';}
    // Retract a reaching hand when a wall/solid prop is close to its path.
    const handX=x+desired.x*Math.cos(model.angle)+desired.z*Math.sin(model.angle),handZ=z-desired.x*Math.sin(model.angle)+desired.z*Math.cos(model.angle);
    if(!sitting&&!canWalk(floor,handX,handZ,.13))desired.set(side*.13,-.12,.03);
    armPose(model,i,desired,dt,reduced);
    if(working&&['wine','drinks'].includes(st.kind)&&i===1&&!reduced)model.hands[i].rotation.z=-.45*reach;
  }
  model.contact.scale.setScalar(1-model.sit*.1);
  Object.assign(previous,{x:a.x,y:a.y,state:a.state,table:a.table,action:a.action,moving:a.moving,reduced,bag:[...carryItems],delivered:[...(a.delivered||[])]});
  return {interaction,received,working,...delta,delivered,interrupted};
}
