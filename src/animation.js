import { tableSeat } from './config.js';
import { walkable } from './navigation.js';
import {animateStickman} from './character-motion.js';
export {damp,angleTowards} from './character-motion.js';


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
    const valid=(x,y)=>visualWalkable(floor,x,y,a)&&placed.every(p=>Math.hypot(p.x-x,p.y-y)>.82);
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
    const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d>=.78)continue;
    const ux=d>.001?dx/d:Math.cos(i+j),uz=d>.001?dz/d:Math.sin(i+j),anchored=e=>e.role==='player'||e.rig.sit>.7,amount=(.785-d)/(anchored(a)||anchored(b)?1:2);
    for(const [entry,pos,sign] of [[a,p,-1],[b,q,1]]) {if(anchored(entry))continue;const x=pos.x+ux*amount*sign,y=pos.z+uz*amount*sign;if(visualWalkable(floor,x,y,entry.actor)){pos.x=x;pos.z=y;}}
  }
}

export function animateCharacter(...args) {return animateStickman(...args,visualWalkable);}
