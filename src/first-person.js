// Perspective is presentation state, separate from upgrades and inventory.
export const EXPLORER='explorer';
export const EYE_HEIGHT=1.615;
export const MAX_PITCH=Math.PI*.36;
export const firstPerson=s=>s.outfit===EXPLORER;
export const newView=()=>({yaw:0,pitch:-.08,lounge:{x:8.8,y:8.4}});
export function validView(v){return !!v&&Number.isFinite(v.yaw)&&Math.abs(v.yaw)<=Math.PI&&Number.isFinite(v.pitch)&&Math.abs(v.pitch)<=MAX_PITCH&&Number.isFinite(v.lounge?.x)&&v.lounge.x>=.3&&v.lounge.x<=11.7&&Number.isFinite(v.lounge?.y)&&v.lounge.y>=.3&&v.lounge.y<=9.7;}
export function turnView(view,dx,dy){view.yaw=Math.atan2(Math.sin(view.yaw-dx*.003),Math.cos(view.yaw-dx*.003));view.pitch=Math.max(-MAX_PITCH,Math.min(MAX_PITCH,view.pitch-dy*.003));}
export function movementDirection(s,x=0,y=0){
 let dx=x+y,dy=y-x;
 if(firstPerson(s)){const c=Math.cos(s.view.yaw),n=Math.sin(s.view.yaw);dx=x*c+y*n;dy=-x*n+y*c;}
 const length=Math.max(1,Math.hypot(dx,dy));return {x:dx/length,y:dy/length};
}
export function petInView(p,player,yaw){const dx=p.x-player.x,dy=p.y-player.y;return -Math.sin(yaw)*dx-Math.cos(yaw)*dy>-.1&&Math.abs(Math.cos(yaw)*dx-Math.sin(yaw)*dy)<.95;}
export function loungeObstacles(s){const f=s.basement.furniture;return [
 ...(f.tv?[{x:6,y:1.7,w:3.55,d:1}]:[]),...(f.couch?[{x:6,y:6.6,w:4.15,d:1.85}]:[]),
 ...(f.plant1?[{x:2,y:3,w:1.15,d:1.15}]:[]),...(f.plant2?[{x:10,y:6.4,w:1.15,d:1.15}]:[]),
 ...(s.basement.computer.owned?[{x:2.2,y:7.5,w:2.85,d:1.6}]:[]),...(s.basement.security.owned?[{x:10,y:1.8,w:1,d:.7}]:[])
 ];}
export function loungeWalkable(s,x,y,r=.3){return x>=r&&x<=12-r&&y>=r&&y<=10-r&&!loungeObstacles(s).some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(y-o.y)<o.d/2+r);}
export function recoverLounge(s){const p=s.view.lounge;if(loungeWalkable(s,p.x,p.y))return;let best=null,dist=Infinity;for(let x=.5;x<12;x+=.5)for(let y=.5;y<10;y+=.5){const d=Math.hypot(x-p.x,y-p.y);if(d<dist&&loungeWalkable(s,x,y)){best={x,y};dist=d;}}Object.assign(p,best??{x:8.8,y:8.4});}
export function moveLounge(s,x,y,dt,speed){recoverLounge(s);const p=s.view.lounge,d=movementDirection(s,x,y),dx=d.x*speed*dt,dy=d.y*speed*dt;const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.1));for(let i=0;i<steps;i++){if(loungeWalkable(s,p.x+dx/steps,p.y))p.x+=dx/steps;if(loungeWalkable(s,p.x,p.y+dy/steps))p.y+=dy/steps;}}
