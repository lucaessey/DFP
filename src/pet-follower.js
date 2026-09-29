import {distance,nearestWalkable,walkable,followPath,move} from './navigation.js';
// The fixed camera looks from +X/+Y. Avoid resting in the player's screen silhouette.
export function behindPlayer(p,player){const dx=p.x-player.x,dy=p.y-player.y;return 13*dx+16*dy<0&&Math.abs(16*dx-13*dy)/Math.hypot(13,16)<.65;}
export function safePetPoint(floor,player,actors=[],radius=.38){
 let best=null,score=Infinity;
 for(const gap of [Math.max(1.15,radius+.45),1.8,2.4])for(let i=0;i<12;i++){const angle=i*Math.PI/6,p={x:player.x+Math.cos(angle)*gap,y:player.y+Math.sin(angle)*gap};if(!walkable(floor,p.x,p.y,radius+.02))continue;
  const crowded=actors.reduce((n,a)=>n+Math.max(0,radius+.35-distance(a,p))*8,0),v=crowded+gap+(i===11?0:.2)+(behindPlayer(p,player)?3:0);if(v<score){score=v;best=p;}}
 return best??nearestWalkable(floor,player);
}
export function newFollower(floor,player,actors=[],radius=.38){return {...safePetPoint(floor,player,actors,radius),radius,floor,path:[],pathKey:'',moving:false,stuck:0,repath:0,angle:0,recovered:0};}
export function followPet(p,floor,player,actors,dt){
 const gap=distance(p,player),radius=p.radius??.38;
 if(p.floor!==floor||gap>9||p.stuck>3||!walkable(floor,p.x,p.y,radius)){const count=p.recovered+1;Object.assign(p,newFollower(floor,player,actors,radius),{recovered:count});return;}
 const before={x:p.x,y:p.y};p.repath-=dt;
 if(gap>Math.max(1.65,radius+.9)||behindPlayer(p,player)||actors.some(a=>distance(a,p)<radius+.26)){
  if(p.repath<=0||!p.target){p.target=safePetPoint(floor,player,actors,radius);p.repath=.4;}
  followPath(p,floor,p.target,dt,gap>4?6:4.2,radius);
 }else p.moving=false;
 for(const a of actors){const d=distance(a,p);if(d<radius+.26&&d>.001)move(p,(p.x-a.x)/d*dt*.6,(p.y-a.y)/d*dt*.6,floor,radius);}
 const traveled=distance(before,p);p.velocity=dt?traveled/dt:0;p.moving=traveled>.001;p.stuck=gap>2&&traveled<.002?p.stuck+dt:0;
 if(traveled>.001){const target=Math.atan2(p.x-before.x,p.y-before.y),diff=Math.atan2(Math.sin(target-p.angle),Math.cos(target-p.angle));p.angle+=diff*(1-Math.exp(-dt*10));}
}
