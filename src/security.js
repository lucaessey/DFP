import {LAYOUTS,WORLD} from './config.js';
import {followPath} from './navigation.js';
import {newComputer,validateComputer} from './computer.js';

export const BASEMENT_PRICE=200, SECURITY_PRICE=150;
export const FURNITURE=[
 {id:'tv',name:'TV',cost:50,x:6,y:1.7},
 {id:'couch',name:'Couch',cost:100,x:6,y:6.6},
 {id:'plant1',name:'Plant one',cost:15,x:2,y:3},
 {id:'plant2',name:'Plant two',cost:15,x:10,y:6.4},
];
export const newBasement=()=>({unlocked:false,computer:newComputer(),furniture:Object.fromEntries(FURNITURE.map(p=>[p.id,false])),security:{owned:false,seed:81927,nextId:1,round:null,catches:0,escapes:0,wrong:0,rewards:0,penalties:0,result:null}});
export const furnished=s=>FURNITURE.every(p=>s.basement.furniture[p.id]);
export const highestFloor=s=>s.floors.reduce((last,f,i)=>f.unlocked?i:last,0);
function random(sec){sec.seed=(Math.imul(1664525,sec.seed)+1013904223)>>>0;return sec.seed/4294967296;}
function nextRound(sec){sec.round={id:sec.nextId++,phase:'waiting',remaining:1+Math.floor(random(sec)*30),floor:0,robber:null,selected:[]};}
export function ensureSecurityRound(s){if(!s.basement.security.owned)return false;if(!s.basement.security.round){nextRound(s.basement.security);s.revision++;}return true;}
function stationFor(f){return LAYOUTS[f].find(p=>p.id===['pickup','tower','shelf','machine1'][f]);}
export function robberActor(f){const st=stationFor(f);return {x:st.pad.x+.7,y:st.pad.y+1.4,bag:[],action:'',progress:0,path:[],pathKey:'',moving:false,facing:1};}
function adjust(s,amount,kind){
 const sec=s.basement.security;
 // Security has fixed dollar amounts and never calls the restaurant profit quote.
 s.money+=amount;if(amount>0){s.earned+=amount;sec.rewards+=amount;}else sec.penalties-=amount;
 sec[kind]++;sec.result={id:sec.nextId+sec.catches+sec.escapes+sec.wrong,kind,amount};s.revision++;
}
export function securityTick(s,dt,watching=false){
 if(!watching||!s.basement.unlocked||!s.basement.security.owned)return;
 ensureSecurityRound(s);const sec=s.basement.security,r=sec.round,f=highestFloor(s);
 if(r.floor!==f){r.floor=f;if(r.robber)r.robber=robberActor(f);s.revision++;}
 r.remaining=Math.max(0,r.remaining-dt);
 if(r.phase==='waiting'){
  if(r.remaining<=1e-8){r.phase='active';r.remaining=10;r.robber=robberActor(f);s.revision++;}
 }else{
  const a=r.robber,st=stationFor(f),age=10-r.remaining;
  followPath(a,f,st.pad,dt,1.25);a.action='';a.bag=age>2?[['controller','tower','souvenir','quarter'][f]]:[];
  if(r.remaining<=1e-8){adjust(s,-5,'escapes');nextRound(sec);}
 }
}
export function securitySelect(s,{roundId,person,watching}){
 const sec=s.basement.security,r=sec.round;
 if(!watching||!sec.owned||!r||roundId!==r.id)return {ok:false};
 if(person==='robber'){
  if(r.phase!=='active'||!r.robber)return {ok:false};
  adjust(s,15,'catches');nextRound(sec);return {ok:true,amount:15,message:'Caught! +$15'};
 }
 const f=highestFloor(s),valid=s.employees.some(e=>e.floor===f&&person===`staff-${e.id}`)||s.floors[f].customers.some(c=>person===`guest-${c.id}`);
 if(!valid||r.selected.includes(person))return {ok:false};
 r.selected.push(person);adjust(s,-5,'wrong');return {ok:true,amount:-5,message:'Innocent guest or employee. −$5'};
}
export function validateBasement(b){
 const int=(n,min=0,max=1e12)=>Number.isInteger(n)&&n>=min&&n<=max;
 if(!b||typeof b.unlocked!=='boolean'||!validateComputer(b.computer,b.unlocked)||!b.furniture||!FURNITURE.every(p=>typeof b.furniture[p.id]==='boolean'))return false;
 const sec=b.security;if(!sec||typeof sec.owned!=='boolean'||!int(sec.seed,0,4294967295)||!int(sec.nextId,1)||!['catches','escapes','wrong','rewards','penalties'].every(k=>int(sec[k])))return false;
 if(!b.unlocked&&(sec.owned||FURNITURE.some(p=>b.furniture[p.id])))return false;
 if(sec.owned&&!FURNITURE.every(p=>b.furniture[p.id]))return false;
 if(sec.rewards!==sec.catches*15||sec.penalties!==(sec.escapes+sec.wrong)*5)return false;
 if(sec.result!==null&&(!sec.result||!int(sec.result.id)||!['catches','escapes','wrong'].includes(sec.result.kind)||sec.result.amount!==(sec.result.kind==='catches'?15:-5)))return false;
 const r=sec.round;if(r===null)return true;
 if(!sec.owned||!int(r.id,1,sec.nextId-1)||!['waiting','active'].includes(r.phase)||!Number.isFinite(r.remaining)||r.remaining<0||r.remaining>(r.phase==='waiting'?30:10)||!int(r.floor,0,3)||!Array.isArray(r.selected)||r.selected.length>1000||r.selected.some(k=>typeof k!=='string'||!/^staff-\d+$|^guest-\d+$/.test(k))||new Set(r.selected).size!==r.selected.length)return false;
 if(r.phase==='waiting')return r.robber===null;
 const a=r.robber;return !!a&&Number.isFinite(a.x)&&a.x>=0&&a.x<=WORLD.width&&Number.isFinite(a.y)&&a.y>=0&&a.y<=WORLD.depth&&Array.isArray(a.bag)&&a.bag.length<=1&&a.bag.every(v=>['controller','tower','souvenir','quarter'].includes(v))&&Array.isArray(a.path)&&a.path.length<=500&&a.path.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))&&typeof a.pathKey==='string';
}
