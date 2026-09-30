import * as T from 'three';
import {ball,box,shape,group} from './scene-assets.js';

const shadowGeometry=new T.PlaneGeometry(1.25,1.05),shadowData=new Uint8Array(24*24*4);
for(let y=0;y<24;y++)for(let x=0;x<24;x++){const i=(y*24+x)*4,d=Math.hypot((x-11.5)/11.5,(y-11.5)/11.5);shadowData.set([43,46,62,Math.round(Math.max(0,1-d)**2*85)],i);}
const shadowTexture=new T.DataTexture(shadowData,24,24);shadowTexture.needsUpdate=true;
const shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
export function petModel(p){
 const root=new T.Group(),body=group(root),legs=[],wings=[],tails=[],c=p.color,a=p.accent,dark='#344454';
 const orb=(col,x,y,z,w,h=w,depth=w)=>ball(body,col,x,y,z,w,h,depth);
 const cube=(col,x,y,z,w,h,depth)=>box(body,col,x,y,z,w,h,depth);
 const cone=(col,x,y,z,w,h)=>shape(body,'cone',col,x,y,z,w,h,w);
 const eyes=(y=.76,z=.43,spread=.18)=>{for(const side of [-1,1]){orb(dark,side*spread,y,z,.095,.125,.065);orb('#ffffff',side*spread-.018,y+.023,z+.025,.028);}};
 const feet=(four=true,col=c)=>{for(const z of four?[-.25,.25]:[.1])for(const x of [-.27,.27]){const leg=group(body,x,.23,z);ball(leg,col,0,-.09,.03,.24,.28,.3);legs.push(leg);}};
 const ear=(x,y,z,long=false,col=c)=>{const e=orb(col,x,y,z,long?.25:.3,long?.67:.33,.2);e.rotation.z=-Math.sign(x)*.17;return e;};
 const tail=(col,x,y,z,w,h,depth)=>{const t=orb(col,x,y,z,w,h,depth);tails.push(t);return t;};
 const quad=()=>{orb(c,0,.43,-.04,.69,.59,.92);orb(c,0,.77,.31,.65,.6,.59);feet();eyes(.83,.59);};
 const wing=(side,col,w=.8)=>{const g=group(body,side*.3,.65,0);const m=ball(g,col,side*w*.37,0,-.04,w,.13,.6);m.rotation.z=side*.14;wings.push(g);return g;};
 switch(p.id){
 case 'chick':orb(c,0,.5,0,.77,.83,.68);orb(c,0,.91,.15,.54);feet(false,a);orb(a,0,.82,.49,.24,.13,.27);eyes(.99,.39);for(const x of [-.38,.38])orb(c,x,.57,0,.18,.37,.33);cone(c,0,1.2,.07,.15,.2);break;
 case 'bunny':quad();ear(-.18,1.23,.25,true);ear(.18,1.23,.25,true);orb(a,-.18,1.23,.37,.11,.45,.04);orb(a,.18,1.23,.37,.11,.45,.04);tail('#ffffff',0,.48,-.53,.32,.32,.32);orb(a,0,.71,.62,.1);break;
 case 'cat':quad();cone(c,-.23,1.08,.27,.32,.43);cone(c,.23,1.08,.27,.32,.43);tail(c,.25,.67,-.53,.2,.8,.22).rotation.z=-.6;orb(a,0,.68,.57,.35,.22,.13);break;
 case 'dog':quad();ear(-.37,.74,.25,true,a);ear(.37,.74,.25,true,a);orb(a,0,.67,.65,.4,.27,.34);orb(dark,0,.75,.82,.15);tail(c,0,.54,-.58,.18,.45,.22).rotation.x=-.8;break;
 case 'turtle':orb(c,0,.27,0,.91,.4,1);orb(a,0,.5,-.12,.85,.64,.88);for(const x of [-.2,.2])for(const z of [-.3,0])orb(c,x,.72,z,.25,.07,.26);orb(c,0,.39,.52,.43,.4,.4);feet();eyes(.47,.7,.11);break;
 case 'hedgehog':orb(c,0,.46,-.09,.84,.64,.85);for(let i=0;i<9;i++){const ang=i*2.4;const k=cone(a,Math.cos(ang)*.3,.74+(i%2)*.08,Math.sin(ang)*.27-.12,.22,.35);k.rotation.z=Math.cos(ang)*.55;}orb(a,0,.5,.43,.49,.43,.48);feet();eyes(.6,.62,.12);orb(dark,0,.44,.71,.12);break;
 case 'frog':orb(c,0,.41,0,.9,.63,.72);for(const x of [-.3,.3]){orb(c,x,.78,.26,.38);orb('#fff9db',x,.8,.41,.24);orb(dark,x,.82,.52,.1);orb(c,x*1.5,.22,-.15,.45,.3,.48);}feet(false);orb(a,0,.34,.33,.48,.24,.1);break;
 case 'mouse':quad();ear(-.33,1.05,.25,false,a).scale.set(.47,.47,.16);ear(.33,1.05,.25,false,a).scale.set(.47,.47,.16);orb(a,0,.71,.64,.13);tail(a,.12,.32,-.69,.14,.14,.68).rotation.y=.4;break;
 case 'penguin':orb(c,0,.62,0,.77,1.03,.68);orb(a,0,.53,.3,.57,.73,.14);feet(false,'#f8ac59');eyes(.89,.31);orb('#f8ac59',0,.73,.4,.2,.12,.23);for(const x of [-.4,.4])orb(c,x,.57,-.02,.17,.57,.3).rotation.z=-Math.sign(x)*.25;break;
 case 'fox':quad();cone(c,-.23,1.12,.21,.34,.5);cone(c,.23,1.12,.21,.34,.5);orb(a,0,.69,.62,.44,.3,.32);orb(dark,0,.73,.79,.12);tail(c,-.38,.52,-.47,.48,.46,.9).rotation.y=-.65;orb(a,-.66,.57,-.69,.35,.34,.36);break;
 case 'slime':cube(c,0,.35,0,.95,.65,.84);cube(c,0,.7,0,.66,.34,.6);cube(a,-.22,.76,-.14,.21,.2,.22);eyes(.51,.43,.21);for(const x of [-.36,.36])orb(c,x,.12,.24,.34,.2,.34);break;
 case 'bee':orb(c,0,.61,0,.8,.62,.95);for(const z of [-.25,0])cube(a,0,.64,z,.77,.54,.12);orb(c,0,.73,.37,.6);eyes(.81,.64);for(const x of [-.18,.18]){cone(a,x,1.04,.3,.07,.3);orb(a,x,1.19,.3,.1);}wing(-1,'#e0f5ff',.65);wing(1,'#e0f5ff',.65);break;
 case 'otter':quad();orb(a,0,.61,.6,.43,.27,.11);tail(c,0,.19,-.64,.5,.13,.73);for(const x of [-.26,.26])for(const y of [.6,.69])cube(dark,x,y,.62,.23,.022,.035);ear(-.23,1,.2);ear(.23,1,.2);break;
 case 'panda':orb(c,0,.52,0,.9,.8,.72);orb(c,0,.95,.13,.82,.69,.64);feet(false,a);ear(-.31,1.27,.11,false,a);ear(.31,1.27,.11,false,a);for(const x of [-.19,.19])orb(a,x,1,.42,.28,.27,.08);eyes(1.02,.47);for(const x of [-.44,.44])orb(a,x,.6,.09,.25,.45,.31);orb(a,0,.85,.47,.15);break;
 case 'robot':cube(c,0,.48,0,.76,.54,.9);cube(c,0,.85,.35,.72,.56,.58);cube(a,0,.9,.655,.59,.26,.05);for(const x of [-.17,.17])cube('#9fffd2',x,.91,.69,.11,.08,.03);feet(true,a);cone(a,0,1.29,.25,.07,.35);orb('#ffd94d',0,1.48,.25,.15);tail(a,0,.57,-.56,.16,.18,.4);cube('#ffe6a1',0,.61,.04,.35,.09,.38);break;
 case 'bat':orb(c,0,.63,0,.58,.74,.5);cone(c,-.19,1.06,.04,.26,.42);cone(c,.19,1.06,.04,.26,.42);eyes(.77,.25,.13);for(const side of [-1,1]){const g=wing(side,a,1.05);for(let i=0;i<3;i++)ball(g,c,side*(.22+i*.22),-.02,-.23+i*.05,.17,.15,.24);}feet(false);break;
 case 'octopus':orb(c,0,.73,0,.9,.85,.81);eyes(.85,.4,.21);for(let i=0;i<8;i++){const t=i*Math.PI/4,arm=tail(c,Math.sin(t)*.43,.18,Math.cos(t)*.43,.28,.24,.5);arm.rotation.y=t;}orb(a,-.24,.49,.38,.12);orb(a,.24,.49,.38,.12);break;
 case 'raccoon':quad();ear(-.27,1.04,.22);ear(.27,1.04,.22);cube(a,0,.84,.56,.57,.23,.08);eyes(.84,.62);tail(c,0,.37,-.68,.29,.29,.8);for(const z of [-.49,-.71,-.92])cube(a,0,.4,z,.3,.28,.1);break;
 case 'controller':cube(c,0,.53,0,1.13,.47,.54);for(const x of [-.45,.45])orb(c,x,.32,.11,.46,.52,.5);cube(a,-.29,.77,.05,.1,.04,.31);cube(a,-.29,.77,.05,.31,.04,.1);for(const [x,z]of [[.25,-.07],[.39,.07]])orb(a,x,.78,z,.12,.08,.12);eyes(.56,.29,.15);feet(false,a);break;
 case 'axolotl':quad();for(const side of [-1,1])for(let i=0;i<3;i++){const g=orb(a,side*.43,.6+i*.17,.27,.36,.12,.14);g.rotation.z=side*(i-1)*.55;}tail(c,0,.4,-.64,.23,.39,.7);break;
 case 'dragon':orb(c,0,.53,-.1,.73,.75,.72);orb(c,0,.98,.27,.6,.61,.65);orb(c,0,.89,.63,.51,.32,.44);feet();cone('#ffeab0',-.2,1.34,.16,.14,.35);cone('#ffeab0',.2,1.34,.16,.14,.35);eyes(1.07,.54);wing(-1,a,.65);wing(1,a,.65);tail(c,0,.29,-.71,.23,.23,.79);for(const z of [-.35,-.65,-.92])cone(a,0,.51,z,.19,.27);break;
 case 'jellyfish':orb(c,0,.98,0,1,.64,.9);orb(a,0,.79,0,.9,.17,.81);eyes(1,.43,.21);for(let i=0;i<6;i++){const t=i*Math.PI/3;tail(a,Math.sin(t)*.29,.39,Math.cos(t)*.29,.11,.67,.12);}break;
 case 'camera':
  cube(a,0,.25,-.03,.72,.22,.7);cube(dark,0,.52,-.13,.15,.43,.18);
  cube(c,0,.86,.02,.86,.54,1.02);cube(c,0,1.16,.1,1.02,.1,1.22);
  cube(dark,0,.86,.545,.7,.41,.06);orb(a,0,.87,.59,.36,.36,.15);orb(dark,0,.87,.68,.23,.23,.06);orb('#c8fbff',-.055,.925,.716,.075,.075,.02);
  orb('#f87d75',.27,1.01,.59,.075);cube(dark,-.33,1.27,-.3,.045,.25,.045);orb(a,-.33,1.42,-.3,.1);
  for(const x of [-.39,.39])for(const z of [-.23,.23])orb(dark,x,.16,z,.17,.29,.29);
  for(const z of [-.26,-.08,.1])cube(a,.438,.87,z,.02,.18,.055);
  break;
 case 'crab':orb(c,0,.45,0,1,.56,.72);for(const x of [-.22,.22]){orb(c,x,.81,.21,.1,.4,.1);orb(dark,x,.98,.21,.12);}for(const side of [-1,1]){for(let i=0;i<3;i++){const l=orb(c,side*.57,.22,-.28+i*.25,.55,.12,.13);l.rotation.z=side*.3;legs.push(l);}orb(c,side*.66,.65,.37,.41,.47,.36);orb(a,side*.83,.8,.47,.19,.28,.22);}break;
 case 'unicorn':orb(c,0,.43,-.04,.69,.59,.92);feet();orb(c,0,.84,.23,.4,.73,.42);orb(c,0,1.1,.4,.48,.52,.56);eyes(1.16,.66,.14);cone(a,0,1.51,.33,.17,.5);for(let i=0;i<4;i++)orb(['#ed91bd','#9ad8de','#b2df7a','#fbd27e'][i],0,1.25-i*.13,.05,.3,.3,.27);tail('#e59ac8',0,.48,-.61,.24,.6,.28);break;
 case 'dino':orb(c,0,.57,-.04,.75,.87,.66);orb(c,0,1.07,.32,.65,.58,.7);orb(c,0,1.01,.63,.62,.4,.41);eyes(1.2,.52,.23);feet(false);for(const side of [-1,1])orb(c,side*.37,.65,.21,.17,.3,.2);tail(c,0,.28,-.64,.37,.3,.88);for(const z of [-.1,-.4,-.7])cone(a,0,.87+z*.6,z,.26,.37);break;
 case 'owl':orb(c,0,.65,0,.9,1.05,.66);for(const x of [-.22,.22]){orb(a,x,.86,.31,.44,.49,.15);orb(dark,x,.88,.41,.16,.2,.06);cone(c,x*1.3,1.21,0,.31,.25);}orb(a,0,.69,.42,.13,.18,.16);wing(-1,c,.44);wing(1,c,.44);feet(false,a);break;
 case 'cloud':for(const [x,y,w]of [[-.36,.63,.63],[0,.83,.82],[.37,.61,.67],[0,.45,.8]])orb(c,x,y,0,w,w*.8,.65);eyes(.77,.37,.2);for(const x of [-.34,0,.34])tail(a,x,.15,.04,.14,.29,.14);for(let i=0;i<3;i++)tail(['#ed91bd','#ffc859','#93d6b0'][i],.05+i*.13,.52,-.53,.1,.1,.7);break;
 case 'manta':orb(c,0,.54,.07,.53,.32,1.03);for(const side of [-1,1]){const g=wing(side,c,1.0);ball(g,a,side*.47,.065,0,.13,.04,.13);}tail(c,0,.55,-.9,.09,.07,1);eyes(.6,.56,.15);break;
 case 'phoenix':orb(c,0,.65,0,.56,.85,.61);orb(c,0,1.08,.12,.43);eyes(1.11,.31,.12);orb(a,0,.96,.39,.15,.1,.25);wing(-1,c,.82);wing(1,c,.82);for(let i=-1;i<=1;i++){cone(a,i*.13,1.37,.03,.14,.34);tail(a,i*.2,.44,-.62,.21,.15,.95).rotation.y=-i*.24;}feet(false,a);break;
 case 'whale':orb(c,0,.64,.02,1.02,.72,1.3);orb('#dedaf4',0,.4,.25,.76,.21,.8);eyes(.75,.58,.29);for(const side of [-1,1])orb(c,side*.6,.48,.08,.4,.15,.57);tail(c,0,.64,-.81,.29,.25,.62);for(const side of [-1,1])orb(c,side*.23,.68,-1.08,.63,.16,.39);for(const x of [-.19,0,.19])cone(a,x,1.19,.05,.2,.32+(x===0?.12:0));break;
 }
 const contact=new T.Mesh(shadowGeometry,shadowMaterial);contact.rotation.x=-Math.PI/2;contact.position.y=.025;root.add(contact);
 root.userData.petId=p.id;
 const bounds=new T.Box3().setFromObject(body),clearance=Math.max(.38,Math.max(Math.abs(bounds.min.x),bounds.max.x,Math.abs(bounds.min.z),bounds.max.z)*.7+.04);
 return {root,body,legs,wings,tails,contact,clearance,definition:p,phase:0,reaction:0};
}
export function animatePet(m,dt,time,moving=false,reduced=false,velocity=0){
 const style=m.definition.motion,float=style==='float';m.phase+=dt*(moving?Math.max(3,velocity*5):2);m.reaction=Math.max(0,m.reaction-dt);
 const swing=Math.sin(m.phase),walk=moving?1:0,react=m.reaction>0?Math.sin(m.reaction*14)*.07:0;
 m.body.position.y=float?.25:0;m.body.rotation.set(0,0,0);m.body.scale.set(1,1,1);
 if(!reduced){m.body.position.y+=(float?.035*Math.sin(time*2):style==='hop'&&moving?Math.abs(swing)*.13:Math.abs(swing)*.025*walk)+Math.abs(react);m.body.rotation.z=style==='waddle'?swing*.065*walk:react*.6;m.body.rotation.x=style==='roll'?swing*.1*walk:0;m.body.scale.y=1+Math.sin(time*2.1)*.012+(style==='hop'?swing*.045*walk:0);}
 m.legs.forEach((leg,i)=>{leg.rotation.x=reduced?0:Math.sin(m.phase+(i%2)*Math.PI)*.35*walk;});
 m.wings.forEach((wing,i)=>{wing.rotation.z=reduced?0:Math.sin(time*(m.definition.id==='bee'?16:5))*.24*(i?1:-1);});
 m.tails.forEach((tail,i)=>{tail.rotation.x=reduced?0:Math.sin(time*3+i)*.06;});
 m.contact.scale.setScalar(float?.8:1);
}
