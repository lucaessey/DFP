import {LAYOUTS,WORLD,DECOR} from './config.js';
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const COLLISIONS=LAYOUTS.map(layout=>[
  ...layout.filter(st=>!st.auxiliary),
  ...layout.filter(st=>st.kind==='table').flatMap(st=>[st.x-.6,st.x+st.w+.52].map(x=>({x:x-.4,y:st.y+st.d/2-.425,w:.8,d:.85}))),
  ...DECOR.map(p=>({x:p.x-p.r,y:p.y-p.r,w:p.r*2,d:p.r*2})),
]);
export function walkable(floor,x,y,radius=.2){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(x<.35||x>WORLD.width-.35||y<.35||y>WORLD.depth-.35)return false;
  return !COLLISIONS[floor].some(o=>x>o.x-radius&&x<o.x+o.w+radius&&y>o.y-radius&&y<o.y+o.d+radius);
}
export function nearestWalkable(floor,point){
  if(walkable(floor,point.x,point.y,.23))return {x:point.x,y:point.y};
  let best=null,score=Infinity;
  for(let x=.5;x<WORLD.width;x+=.5)for(let y=.5;y<WORLD.depth;y+=.5){const d=(x-point.x)**2+(y-point.y)**2;if(d<score&&walkable(floor,x,y,.23)){best={x,y};score=d;}}
  return best;
}
export function move(actor,dx,dy,floor){
  const x=actor.x,y=actor.y;
  if(walkable(floor,actor.x+dx,actor.y))actor.x+=dx;
  if(walkable(floor,actor.x,actor.y+dy))actor.y+=dy;
  actor.moving=Math.hypot(actor.x-x,actor.y-y)>.001;
  if(actor.moving)actor.facing=dx-dy>=0?1:-1;
}
const columns=WORLD.width*2+1,rows=WORLD.depth*2+1;
const grids=COLLISIONS.map((_,floor)=>Uint8Array.from({length:columns*rows},(_,key)=>walkable(floor,(key%columns)/2,Math.floor(key/columns)/2,.23)?1:0));
function cell(floor,p){
  const grid=grids[floor];let best=-1,score=Infinity;
  for(let key=0;key<grid.length;key++)if(grid[key]){const d=((key%columns)/2-p.x)**2+(Math.floor(key/columns)/2-p.y)**2;if(d<score){score=d;best=key;}}
  return best;
}
export function findPath(floor,from,to){
  if(!walkable(floor,to.x,to.y,.23))return [];
  const grid=grids[floor],start=cell(floor,from),dest=cell(floor,to),previous=new Int32Array(grid.length).fill(-2),queue=[start];previous[start]=-1;
  for(let i=0;i<queue.length;i++){
    const k=queue[i];if(k===dest)break;
    for(const next of [k+1,k+columns,k-1,k-columns])if(next>=0&&next<grid.length&&grid[next]&&previous[next]===-2){previous[next]=k;queue.push(next);}
  }
  if(previous[dest]===-2)return [];
  const path=[{...to}];
  for(let key=dest;key!==start;key=previous[key])path.unshift({x:(key%columns)/2,y:Math.floor(key/columns)/2});
  return path;
}
export function followPath(actor,floor,destination,dt,speed){
  const targetKey=`${destination.x},${destination.y}`;
  if(distance(actor,destination)<.08){actor.moving=false;actor.path=[];actor.pathKey=targetKey;return;}
  if(actor.pathKey!==targetKey||!actor.path?.length){actor.pathKey=targetKey;actor.path=findPath(floor,actor,destination);}
  while(actor.path.length&&distance(actor,actor.path[0])<.08)actor.path.shift();
  const next=actor.path[0];if(!next){actor.moving=false;return;}
  const d=distance(actor,next),amount=Math.min(speed*dt,d);move(actor,(next.x-actor.x)/d*amount,(next.y-actor.y)/d*amount,floor);
}
