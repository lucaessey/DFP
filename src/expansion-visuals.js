import {EXPANSION,EXPANSION_ITEMS} from './expansion-config.js';
import {box,ball,cylinder,shape,group,lettering,food,material,mergeStatic} from './scene-assets.js';

// Food silhouettes are immutable: share one merged geometry set per item type.
// Stacks and hand transfers clone transforms only, keeping busy rooms inexpensive.
const foodModels=new Map();
export function expansionFood(kind){
  if(!EXPANSION_ITEMS.includes(kind))return null;
  if(foodModels.has(kind))return foodModels.get(kind).clone();
  const g=group();
  if(kind==='waffle'){
    box(g,'#e8a53e',0,.12,0,.64,.22,.4);for(const x of [-.24,.24])ball(g,'#efb546',x,.1,.18,.28,.2,.36);
    for(let x=-.22;x<.3;x+=.11)for(let z=-.12;z<.2;z+=.11)box(g,'#9f6432',x,.24,z,.055,.015,.055);
    box(g,'#ffe68c',.07,.27,.03,.16,.04,.16);
  }else if(kind==='icecream'){
    cylinder(g,'#eca661',0,.13,0,.3,.23);for(const [i,c]of ['#ff90c0','#fff0b8','#9ae0d8'].entries())box(g,c,(i-1)*.07,.29+i*.13,0,.3,.26,.3);ball(g,'#e44666',0,.63,0,.08);
  }else if(kind==='cake'){
    box(g,'#e8b372',0,.2,0,.54,.38,.35);box(g,'#bc667e',0,.26,0,.55,.07,.36);box(g,'#fff0df',0,.42,0,.58,.07,.39);box(g,'#8c70bf',0,.46,0,.22,.035,.17);for(const x of [-.2,.2])ball(g,'#e66da5',x,.49,.05,.08);
  }else if(['milkshake','smoothie'].includes(kind)){
    cylinder(g,kind==='milkshake'?'#f5aacd':'#a6de75',0,.23,0,.3,.44);cylinder(g,'#fff9df',0,.46,0,.34,.055);ball(g,'#fff6d8',0,.51,0,.25,.12,.25);box(g,'#8758ad',.07,.63,0,.035,.3,.035);
  }else if(['popcorn','esnack'].includes(kind)){
    box(g,'#eb6e71',0,.18,0,.32,.35,.28);for(const x of [-.1,.1])box(g,'#fff4c3',x,.18,.147,.05,.3,.015);for(let i=0;i<7;i++)ball(g,'#ffe9a1',(i%3-1)*.1,.37+(i%2)*.055,(Math.floor(i/3)-1)*.09,.14);
  }else if(['robotmeal','terracemeal','cafemeal'].includes(kind)){
    cylinder(g,'#fff6d4',0,.03,0,.62,.045);box(g,kind==='robotmeal'?'#82e0db':kind==='terracemeal'?'#bb724e':'#f0c06f',0,.17,0,.33,.26,.3);for(const x of [-.19,.19])ball(g,'#81b86c',x,.13,.04,.14);box(g,'#f6d76b',0,.32,0,.25,.03,.24);
  }else if(kind==='treat'){
    box(g,'#e2b06c',0,.075,0,.39,.13,.12);for(const x of [-.21,.21])for(const z of [-.065,.065])ball(g,'#e2b06c',x,.075,z,.15);
  }else if(kind==='ingredient'){
    box(g,'#e7d8b5',0,.24,0,.4,.46,.34);box(g,'#68ab8e',0,.25,.181,.28,.2,.02);box(g,'#ac9873',0,.48,0,.43,.04,.36);
  }else if(kind==='factorysnack'){
    box(g,'#edbb5c',0,.12,0,.52,.19,.27);for(const x of [-.15,0,.15])box(g,'#9e6641',x,.224,0,.035,.02,.22);
  }else if(kind==='sealedbox'){
    box(g,'#c99963',0,.26,0,.62,.5,.48);box(g,'#ffe0a0',0,.52,0,.14,.025,.49);box(g,'#e97152',0,.25,.25,.25,.18,.02);
  }
  const merged=mergeStatic(g);merged.userData={};foodModels.set(kind,merged);return merged.clone();
}
const unitCounter=(base,st,c)=>{const x=st.x+st.w/2,z=st.y+st.d/2;box(base,c,x,.57,z,st.w,1.04,st.d);box(base,'#fff0cd',x,1.13,z,st.w+.1,.12,st.d+.08);};
const chair=(p,x,z,c)=>{box(p,'#4a455e',x,.22,z,.48,.4,.48);box(p,c,x,.5,z,.74,.18,.76);box(p,c,x-.28,.85,z,.2,.67,.76);for(const dz of [-.4,.4])box(p,c,x,.71,z+dz,.62,.18,.12);};
export function expansionRoom(base,dynamic,state,f){
  if(f<4)return;
  const def=EXPANSION[f-4];
  lettering(base,def.short.toUpperCase()+' / DFP',5.5,2.3,.04,5,'#fff6de',def.color);
  if(f===4||f===7){box(base,'#ecd4f3',11.8,.04,4.7,4.7,.02,8.6);lettering(base,state.floors[f].section?def.section.toUpperCase():'LOCKED · '+def.section.toUpperCase(),11.8,1.8,.06,3.8,'#604578','#edd7f5');}
  if(f===5){
    box(base,'#51416a',23,2.5,.12,8,4,.3);box(base,'#122c4b',23,2.55,.31,7.4,3.3,.04);
    lettering(base,'PIXEL VOYAGERS',23,4.05,.36,5,'#ffe690','#122c4b');
    const screen=group(dynamic);screen.userData.screen=true;for(let i=0;i<8;i++)box(screen,['#ffce69','#65cfdc','#dca0f2'][i%3],20+i*.8,1.5+i%3*.65,.38,.3,.3,.025,false,true);dynamic.userData.movie=screen;const ship=group(dynamic,23,2.2,.43);box(ship,'#89e2e2',0,0,0,1.2,.32,.07);box(ship,'#ffc164',-.5,-.22,0,.3,.3,.07);box(ship,'#ffc164',-.5,.22,0,.3,.3,.07);box(ship,'#fff5d1',.32,0,.04,.25,.18,.02);dynamic.userData.ship=ship;
  }
  if(f===7){
    for(let i=0;i<12;i++){const height=1+(i*7%5)*.5;box(base,i%2?'#91a1bc':'#8a91b4',i*2.6,-.2+height/2,-2,1.8,height,1.3);for(let y=.5;y<height;y+=.6)box(base,'#ffdfa0',i*2.6,y,-1.32,.65,.2,.025,false,true);}
    lettering(base,'DFP · ABOVE THE CITY',21,2.3,.15,5,'#ebffb9','#688473');
    const rain=group(dynamic);dynamic.userData.rain=rain;for(let i=0;i<40;i++)box(rain,'#a9cde4',1+(i*6.13)%26,1+(i*.43)%4,1+(i*4.7)%16,.025,.36,.025);
  }
  if(f===8)lettering(base,'DFP PIXEL CUP',22,2.2,.1,5,'#a9fff0','#5d5bac');
  if(f===10){
    // Recessed belts are flush with the floor, so the aisle stays walkable.
    box(base,'#736b6d',13,.06,2.2,6.5,.06,.85);box(base,'#d8a54f',13,.098,1.74,6.7,.025,.08);box(base,'#d8a54f',13,.098,2.66,6.7,.025,.08);
    for(let x=10;x<16.5;x+=.38)box(base,'#a5a0a0',x,.106,2.2,.12,.03,.7);
    const item=food('factorysnack');dynamic.add(item);dynamic.userData.beltItem=item;
  }
}
export function expansionStation(base,detail,data,state,f){
  if(f<4)return false;
  const {st,open}=data,x=st.x+st.w/2,z=st.y+st.d/2,c=open?EXPANSION[f-4].color:'#b9a9c4';
  if(st.auxiliary||['trash','counter','stack'].includes(st.kind))return false;
  if(st.kind==='table'){
    if(!open)return false;
    const i=Number(st.id.slice(5)),t=state.floors[f].tables[i];
    if(f===5||f===8){
      const premium=state.floors[f].section&&i>=3,color=premium?'#e8bc58':c;const seating=group(base,st.x-.6,0,z);chair(seating,0,0,color);if(f===5)seating.rotation.y=Math.PI/2;if(premium)seating.scale.set(1.18,1.08,1.18);if(premium)box(base,'#e9c685',x,.05,z,3.4,.03,2.5);
      if(f===5){box(base,color,x,.35,z,1.1,.13,.8);cylinder(base,'#554662',x,.63,z,.25,.48);cylinder(base,'#eaa746',x,.93,z,.72,.09);lettering(base,premium?'VIP':'SEAT '+(i+1),x,1.05,z+.43,.85,'#fff8d6',c);}
      else{box(base,'#403f65',x,.51,z,1.7,1,.95);box(base,'#9788d0',x,1.05,z,1.85,.12,1.1);box(base,'#343450',x+.32,1.51,z,.17,.81,1);const screen=box(detail,'#89eddc',x+.22,1.54,z,.025,.59,.8,false,true);data.pcScreen=screen;box(base,'#74b7db',x-.35,1.15,z,.35,.035,.6);}
      return true;
    }
    if(f===7&&state.floors[f].activity.umbrellas[i]){
      const u=group(detail,x,0,z);cylinder(u,'#695878',0,1.5,0,.08,3);shape(u,'cone',i%2?'#fdc981':'#b4d9a4',0,3,0,2.4,.55,2.4);data.umbrella=u;
    }
    if(f===9){
      cylinder(base,'#d09070',st.x-.2,.12,z+.65,.4,.17);data.water=cylinder(detail,'#81c6e2',st.x-.2,.22,z+.65,.32,.025);
      const paws=group(detail);for(let j=0;j<4;j++){const px=st.x-.65+j*.24,pz=z+1.1+(j%2)*.14;ball(paws,'#b2957c',px,.07,pz,.12,.025,.1);for(const k of [-1,0,1])ball(paws,'#b2957c',px+k*.05,.07,pz-.09,.05,.02,.05);}data.paws=paws;
    }
    return false;
  }
  if(st.kind==='playground'){
    box(base,'#99bf6c',x,.12,z,st.w,.18,st.d);for(const dx of [-1,1])for(const dz of [-1,1])box(base,'#f3c27c',x+dx*(st.w/2-.1),.5,z+dz*(st.d/2-.1),.14,.8,.14);
    shape(base,'ring','#db8fb8',x,.8,z,1.2,1.2,1.2);box(base,'#ad83cb',x-.9,.4,z+.5,.7,.5,.7);lettering(base,'PET PLAY',x,1.4,z-1.4,2,'#fff6d1',c);return true;
  }
  if(st.kind==='delivery'){
    const cart=group(detail,x,0,z);box(cart,'#6dbeb9',0,.55,0,3,.6,1.5);box(cart,'#e8d5a1',0,.9,0,2.9,.08,1.4);for(const dx of [-1,1])for(const dz of [-.6,.6])ball(cart,'#42485b',dx,.22,dz,.38);box(cart,'#4d7781',1.45,1,0,.12,1.1,1.5);data.cart=cart;return true;
  }
  if(st.kind==='belt'){box(base,c,x,.6,z-.15,1.05,1.18,.55);box(base,'#98edc9',x,1.23,z-.15,.6,.04,.35);lettering(base,'BELT CONTROL',x,1.55,z-.18,2,'#fff4dc',c);return true;}
  unitCounter(base,st,c);
  lettering(base,st.name,x,1.75,z-.57,Math.min(2.3,st.w),'#fff5d5',c);
  if(st.kind==='prepare'){
    if(st.id==='waffle'){box(base,'#655473',x,1.23,z,1.25,.18,.78);const lid=group(detail,x,1.29,z-.36);box(lid,'#80648a',0,.05,.32,1.25,.12,.7);data.lid=lid;}
    else if(st.id==='icecream'){box(base,'#88d5d5',x,1.27,z,1.5,.26,.86);for(let i=0;i<3;i++)box(base,['#f897be','#a9dcc4','#ffe59f'][i],x-.46+i*.46,1.43,z,.4,.05,.64);const scoop=group(detail,x,1.5,z);cylinder(scoop,'#ebf4ed',0,.12,0,.055,.35);ball(scoop,'#faaaCE',0,-.04,0,.26);data.scoop=scoop;}
    else if(st.id==='cake'){box(base,'#7e5996',x,1.42,z,.95,.57,.8);box(base,'#392d4f',x,1.46,z+.42,.66,.28,.02);const cake=food('cake');cake.position.set(x,1.2,z+.35);detail.add(cake);data.parts.push(cake);}
    else if(['milkshake','smoothie'].includes(st.id)){cylinder(base,'#f6e0be',x,1.37,z,.52,.46);box(base,'#786195',x,1.15,z,.68,.13,.55);data.stream=cylinder(detail,st.id==='milkshake'?'#f5a1c1':'#a7d778',x,1.47,z+.32,.04,.36);}
    else if(st.id==='popcorn'){box(base,'#e6848b',x,1.58,z,1.1,.88,.85);box(base,'#fff1b5',x,1.5,z+.43,.8,.48,.02);for(let i=0;i<5;i++)ball(base,'#ffe595',x+(i%3-1)*.2,1.52+Math.floor(i/3)*.18,z+.45,.18);}
    else{const meal=food(st.item);meal.position.set(x,1.2,z);detail.add(meal);data.parts.push(meal);}
  }
  if(st.kind==='robot'||st.kind==='processor'){
    box(base,'#72b9ba',x,1.35,z,1.15,.45,.85);box(base,'#244854',x,1.56,z+.44,.58,.2,.025);const arm=group(detail,x-.45,1.5,z);cylinder(arm,'#dedddb',0,.22,0,.23,.5);box(arm,'#75969f',.32,.45,0,.65,.19,.2);ball(arm,'#ffcd6c',.63,.4,0,.2);data.robotArm=arm;
    data.faultLight=ball(detail,'#f4786f',x+.52,1.76,z,.19);const tossed=food(f===6?'robotmeal':'factorysnack');detail.add(tossed);data.toss=tossed;
  }
  if(['robotPickup','factoryPickup','packer','seal'].includes(st.kind)){box(base,'#b5cad0',x,1.22,z,st.w-.2,.14,st.d-.14);if(st.kind==='seal'){data.sealer=box(detail,'#68717f',x,1.75,z,.2,.7,.25);}}
  if(st.kind==='supply'){for(let i=0;i<3;i++){const bag=food('ingredient');bag.position.set(x-.6+i*.6,1.19,z);base.add(bag);}}
  if(['admit','host','usher'].includes(st.kind)){box(base,'#60557f',x,1.35,z,.6,.38,.4);box(base,'#a4e3ca',x,1.43,z+.21,.43,.2,.02);}
  if(st.kind==='charger'){for(const dx of [-.5,0,.5])box(detail,'#bbf287',x+dx,1.4,z,.24,.5,.42,false,true);}
  if(st.kind==='premium'){shape(base,'cone','#f4d46b',x,1.54,z,.65,.55,.65);cylinder(base,'#fff0a8',x,1.24,z,.7,.1);}
  if(st.kind==='water'){cylinder(base,'#8dbbd2',x,1.44,z,.55,.53);data.stream=cylinder(detail,'#8dcfe1',x,1.36,z+.4,.035,.26);}
  return true;
}

export function expansionMotion(data,state,time,reduced){
  const f=state.floor,fs=state.floors[f],a=fs.activity;if(!a)return;
  const {st}=data,x=st.x+st.w/2,z=st.y+st.d/2,working=data.cue?.state==='working',wave=reduced?0:Math.sin(time*5);
  if(data.lid)data.lid.rotation.x=working?-.4-Math.max(0,wave)*.6:0;
  if(data.scoop){data.scoop.position.y=1.5+(working?wave*.18:0);data.scoop.rotation.z=working?wave*.4:0;}
  if(data.stream)data.stream.visible=working;
  if(data.robotArm){const fault=f===6&&a.robot.fault,run=f===6?a.robot.timer>0:a.factory.timer>0;data.robotArm.rotation.z=fault?wave*.6:run?wave*.25:0;data.faultLight.material=material(fault?'#ff554f':'#a1e086',false,true);data.faultLight.scale.setScalar(fault&&!reduced?.17+.05*Math.sin(time*9):.19);data.toss.visible=fault&&!reduced;data.toss.position.set(x+Math.sin(time*3)*.8,1.6+Math.abs(Math.sin(time*3))*1.1,z+.4);}
  if(data.sealer)data.sealer.position.y=1.75+(working?wave*.15:0);
  if(data.cart){const d=a.factory.delivery;const progress=d?.timer>0&&!reduced?Math.sin((4-d.timer)/4*Math.PI):0;data.cart.position.x=x+progress*4;data.cart.position.z=z+progress*3.5;data.goods.position.set(progress*4,0,progress*3.5);data.cart.rotation.y=progress*.25;}
  if(data.umbrella)data.umbrella.scale.setScalar(reduced?1:.98+.02*Math.sin(Math.min(a.weather/2,1)*Math.PI/2));
  if(data.pcScreen){const c=fs.customers.find(c=>c.id===fs.tables[Number(st.id.slice(5))].customer);data.pcScreen.material=material(c?.fault?'#ff6a74':c?.state==='dining'?'#71ead5':'#9b94bf',false,true);data.pcScreen.scale.y=.59+(c?.state==='dining'&&!reduced?wave*.035:0);}
  if(data.water){data.water.visible=a.water[Number(st.id.slice(5))]>0;data.paws.visible=fs.tables[Number(st.id.slice(5))].state==='dirty';}
}
export function expansionWorldMotion(world,state,time,reduced){
  const dynamic=world.children[1],u=dynamic?.userData,fs=state.floors[state.floor];if(!u)return;
  if(u.movie){const running=fs.customers.some(c=>c.state==='dining');u.movie.children.forEach((pixel,i)=>{pixel.position.x=20+i*.8+(running&&!reduced?Math.sin(time*(.7+i*.04)+i)*.32:0);pixel.rotation.z=running&&!reduced?time*.3:0;});}
  if(u.ship){const running=fs.customers.some(c=>c.state==='dining');u.ship.position.x=23+(running&&!reduced?Math.sin(time*.6)*1.8:0);u.ship.position.y=2.4+(running&&!reduced?Math.sin(time*.9)*.6:0);u.ship.rotation.z=running&&!reduced?Math.sin(time*.7)*.2:0;}
  if(u.rain){u.rain.visible=fs.activity.weather>=40;u.rain.children.forEach((drop,i)=>{drop.position.y=reduced?2:4-((time*4+i*.37)%4);});}
  if(u.beltItem){u.beltItem.visible=fs.section&&fs.products.packing&&fs.stock.factorysnack>0&&fs.activity.factory.hopper<18;u.beltItem.position.set(10+fs.activity.factory.belt/2*6,.23,2.2);u.beltItem.scale.setScalar(.7);}
}
export function guestPet(){
  const root=group();box(root,'#e4b583',0,.35,0,.4,.36,.65);box(root,'#f2c897',0,.55,.32,.4,.38,.36);for(const side of [-1,1]){box(root,'#ae815f',side*.2,.58,.3,.12,.32,.19);for(const z of [-.2,.22])box(root,'#b99168',side*.15,.13,z,.11,.26,.14);}ball(root,'#272b32',0,.57,.51,.1);const tail=box(root,'#f0c495',0,.48,-.42,.11,.3,.11);tail.rotation.x=-.5;return mergeStatic(root);
}
