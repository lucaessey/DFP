import {STORY_SOLIDS,EVENT_SOLIDS} from './story-data.js';
export const storyDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function storyWorld(type='outside'){return {width:type==='outside'?34:20,depth:type==='outside'?28:16,solids:type==='outside'?STORY_SOLIDS:EVENT_SOLIDS[type]||[]};}
export function storyWalkable(type,x,y,r=.32){
 const w=storyWorld(type);return Number.isFinite(x)&&Number.isFinite(y)&&x>r+.1&&y>r+.1&&x<w.width-r-.1&&y<w.depth-r-.1&&!w.solids.some(o=>x>o.x-r&&x<o.x+o.w+r&&y>o.y-r&&y<o.y+o.d+r);
}
const grids=new Map();
export function storyPath(type,from,to,r=.32){
 if(!storyWalkable(type,to.x,to.y,r))return [];
 const world=storyWorld(type),cols=world.width*2+1,rows=world.depth*2+1,key=`${type}/${r}`;
 if(!grids.has(key))grids.set(key,Uint8Array.from({length:cols*rows},(_,i)=>storyWalkable(type,(i%cols)/2,Math.floor(i/cols)/2,r)?1:0));
 const grid=grids.get(key),cell=p=>{let score=Infinity,best=-1;for(let i=0;i<grid.length;i++)if(grid[i]){const d=((i%cols)/2-p.x)**2+(Math.floor(i/cols)/2-p.y)**2;if(d<score){score=d;best=i;}}return best;};
 const start=cell(from),end=cell(to),prev=new Int32Array(grid.length).fill(-2),queue=[start];prev[start]=-1;
 for(let j=0;j<queue.length;j++){const k=queue[j];if(k===end)break;for(const next of [k-1,k+1,k-cols,k+cols])if(next>=0&&next<grid.length&&grid[next]&&prev[next]===-2){prev[next]=k;queue.push(next);}}
 if(prev[end]===-2)return [];const path=[{x:to.x,y:to.y}];for(let k=end;k!==start;k=prev[k])path.unshift({x:(k%cols)/2,y:Math.floor(k/cols)/2});return path;
}
export function storyMove(actor,type,dx,dy){const x=actor.x,y=actor.y;if(storyWalkable(type,x+dx,y))actor.x+=dx;if(storyWalkable(type,actor.x,y+dy))actor.y+=dy;actor.moving=storyDistance(actor,{x,y})>.001;}
export function storyFollow(actor,type,target,dt,speed=4.2,r=.32){
 const key=`${target.x.toFixed(1)},${target.y.toFixed(1)}`;
 if(actor.pathKey!==key||!actor.path?.length){actor.path=storyPath(type,actor,target,r);actor.pathKey=key;}
 while(actor.path.length&&storyDistance(actor,actor.path[0])<.08)actor.path.shift();
 const next=actor.path[0];if(!next){actor.moving=false;return;}const d=storyDistance(actor,next),n=Math.min(d,speed*dt);storyMove(actor,type,(next.x-actor.x)/d*n,(next.y-actor.y)/d*n);
}
