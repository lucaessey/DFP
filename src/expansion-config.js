// Expansion data is independent of simulation and rendering.
export const EXPANSION = [
  {name:'Pixel Dessert Shop',short:'Desserts',cost:5000,section:'Milkshake Section',sectionCost:1400,sectionId:'milkshake',color:'#ef87b5',pale:'#ffdfed',icon:'cake',description:'Scoop, stack, serve. Keep it cool!',guide:'Prepare desserts → stack food → serve. Ice cream melts after 30 seconds in your hands; the counter keeps it cold.',foods:['waffle','icecream','cake','milkshake'],robbable:'icecream'},
  {name:'Gaming Movie Theater',short:'Theater',cost:8000,section:'VIP Theater',sectionCost:2200,sectionId:'vip',color:'#a477df',pale:'#eee1ff',icon:'movie',description:'A ticket to a pixel-sized adventure.',guide:'Buy seats → sell tickets → usher → deliver popcorn. Movies last 14 seconds; clean seats after the credits.',foods:['popcorn'],robbable:'popcorn'},
  {name:'Robot Kitchen',short:'Robots',cost:12000,section:'Robot Charging Station',sectionCost:3000,sectionId:'charging',color:'#54baba',pale:'#d7f5ee',icon:'robot',description:'Fresh food. A few loose screws.',guide:'Carry ingredients → load robot → collect meal → stack → serve. Repair flashing robots free. Charging makes cooking faster and faults rarer.',foods:['robotmeal'],robbable:'robotPickup'},
  {name:'Rooftop Restaurant',short:'Rooftop',cost:18000,section:'Smoothie Bar',sectionCost:4000,sectionId:'smoothie',color:'#7ba67a',pale:'#e1f0d8',icon:'sun',description:'Dinner above the neon skyline.',guide:'Buy tables → seat guests → deliver meals and smoothies → collect → clean. Umbrellas keep guests eating normally in rain.',foods:['terracemeal','smoothie'],robbable:'terracemeal'},
  {name:'Esports Arena',short:'Esports',cost:26000,section:'Tournament Stage',sectionCost:5500,sectionId:'stage',color:'#597cda',pale:'#dfe8ff',icon:'trophy',description:'Big plays, bright screens, fresh snacks.',guide:'Buy desks → admit players → usher → deliver snacks → fix flashing PCs → reset desks after a 16-second match (24 seconds on the Stage).',foods:['esnack'],robbable:'esnack'},
  {name:'Pixel Pet Café',short:'Pet café',cost:36000,section:'Pet Playground',sectionCost:7000,sectionId:'playground',color:'#d6a252',pale:'#fff0cf',icon:'paw',description:'Good food for people and their pals.',guide:'Buy tables → seat guests → deliver meals and treats. Refill water bowls, clean paw prints, and welcome pets to the playground.',foods:['cafemeal','treat'],robbable:'treat'},
  {name:'DFP Factory',short:'Factory',cost:50000,section:'Conveyor Belts',sectionCost:9000,sectionId:'belts',color:'#d69258',pale:'#ffead2',icon:'box',description:'From pixel ingredients to doorstep delivery.',guide:'Ingredients → processor → snacks → pack three → seal → load cart. Collect payment after its 4-second delivery. Belts move real snacks into packing.',foods:[],robbable:'factoryPickup'},
];
export const EXPANSION_PRODUCTS = [
  ['waffle',4,'Controller waffle iron',400],['icecream',4,'Pixel ice cream freezer',500],['cake',4,'Console cake oven',650],['milkshake',4,'Milkshake Section',1400,true],
  ['tickets',5,'Ticket booth & screen',600],['popcorn',5,'Popcorn stand',450],['vip',5,'VIP Theater',2200,true],
  ['robotmeal',6,'Robot cooker & ingredient supply',900],['charging',6,'Robot Charging Station',3000,true],
  ['terracemeal',7,'Terrace kitchen',1100],['smoothie',7,'Smoothie Bar',4000,true],
  ['admission',8,'Admission desk & PCs',1400],['esnack',8,'Tournament snack stand',650],['stage',8,'Tournament Stage',5500,true],
  ['cafemeal',9,'Café kitchen',1000],['treat',9,'Treat station & water bowls',600],['playground',9,'Pet Playground',7000,true],
  ['processor',10,'Ingredient supply & processor',1500],['packing',10,'Packing & delivery stations',1200],['belts',10,'Conveyor Belts',9000,true],
].map(([id,floor,name,cost,section=false])=>({id,floor,name,cost,section,icon:EXPANSION[floor-4].icon,description:section?EXPANSION[floor-4].guide:`Unlock ${name.toLowerCase()}.`}));
const REQUIREMENTS={milkshake:'Requires any dessert station.',vip:'Requires the ticket booth. Buy seats separately; seats 4–6 become larger VIP seats.',charging:'Requires the robot cooker. Cooking falls from 4s to 2.5s; faults every 8 batches instead of 4.',smoothie:'Requires the terrace kitchen.',stage:'Requires admission PCs. Buy desks separately; desks 4–6 run 24s competitions with double admission.',playground:'Requires the café kitchen. Visits last 6s and pay separately.',packing:'Requires the ingredient processor. Each box needs three actual snacks.',belts:'Requires the processor AND packing stations. Moves one actual snack every 2s.'};
for(const p of EXPANSION_PRODUCTS)if(REQUIREMENTS[p.id])p.description+=' '+REQUIREMENTS[p.id];
export const EXPANSION_PRICES={waffle:5,icecream:6,cake:9,milkshake:8,popcorn:5,ticket:8,vipticket:16,robotmeal:12,terracemeal:14,smoothie:9,admission:14,stageentry:28,esnack:7,cafemeal:12,treat:5,playvisit:9,delivery:30};
export const EXPANSION_ITEMS=['waffle','icecream','cake','milkshake','popcorn','robotmeal','ingredient','terracemeal','smoothie','esnack','cafemeal','treat','factorysnack','sealedbox'];
export const UMBRELLA_COST=300;
export function expansionLayouts(station,tableSeat,tableCost){
  const prep=(id,name,x,product=id,kind='prepare')=>station(id,name,x,1,2,1.2,kind,x+1,3.5,{product,item:id});
  return EXPANSION.map((def,index)=>{
    const f=index+4,rows=[];
    if(f===4)rows.push(prep('waffle','WAFFLES',.7),prep('icecream','ICE CREAM',3.8),prep('cake','CAKES',6.9));
    if(f===5||f===8){const p=f===5?'tickets':'admission';rows.push(station('admit',f===5?'TICKETS':'ADMISSION',2.5,8.5,5,1,'admit',5,7.5,{product:p}),station('usher','USHER',9,11,1,1,'usher',9.5,10,{product:p}),prep(f===5?'popcorn':'esnack',f===5?'POPCORN':'SNACKS',2),station(def.sectionId,def.section.toUpperCase(),10,1,3,1.2,'premium',11.5,3.5,{product:def.sectionId,section:true}));}
    if(f===6)rows.push(prep('ingredients','INGREDIENTS',.7,'robotmeal','supply'),prep('robot','ROBOT · LOAD / REPAIR',3.8,'robotmeal','robot'),prep('robotPickup','MEAL PICKUP',6.9,'robotmeal','robotPickup'),prep('charging','CHARGING',11,'charging','charger'));
    if(f===7||f===9)rows.push(prep(f===7?'terracemeal':'cafemeal',f===7?'TERRACE MEALS':'CAFÉ MEALS',1),station('host','SEAT GUESTS',2.5,8.5,5,1,'host',5,7.5));
    if(f===9)rows.push(prep('treat','PET TREATS',5),station('water','REFILL WATER',10,5,2,1,'water',11,7,{product:'treat'}),station('playground','PET PLAYGROUND',9,10,3.5,3,'playground',10.5,14,{product:'playground',section:true}));
    if(f===10)rows.push(prep('ingredients','INGREDIENTS',.7,'processor','supply'),prep('processor','PROCESSOR · LOAD',4,'processor','processor'),prep('factoryPickup','SNACK PICKUP',7.5,'processor','factoryPickup'),station('packer','PACK 3 SNACKS',16,3,2.5,1.5,'packer',17,5.5,{product:'packing'}),station('seal','SEAL / PICK UP BOX',21,3,2.5,1.5,'seal',22,5.5,{product:'packing'}),station('delivery','LOAD / COLLECT DELIVERY',20,11,4,2,'delivery',22,10,{product:'packing'}),station('belts','CONVEYOR BELTS',11,1,3,1.2,'belt',12.5,3.5,{product:'belts',section:true}));
    if(f===4||f===6)rows.push(station('counter','SERVE',2.5,8.5,5,1,'counter',5,7.5),station('stack','STACK FOOD',2.6,8.5,1.2,1,'stack',3,7.5,{auxiliary:true}));
    if(f===4||f===7){const product=f===4?'milkshake':'smoothie';rows.push(prep(product,product.toUpperCase(),11),station('drinkCounter',f===4?'SERVE SHAKES':'SMOOTHIE PICKUP',10,6,3.5,1,'counter',12.4,5.1,{product,section:true}),station('drinkStack','STOCK DRINKS',10.1,6,1.2,1,'stack',10.4,5.1,{product,section:true,auxiliary:true}));}
    rows.push(station('trash','TRASH',.7,5.2,.7,.7,'trash',1,6.5));
    if(f!==10)for(let i=0;i<6;i++){const seat=tableSeat(i);rows.push(station('table'+i,(f===5?'SEAT ':f===8?'PC ':'TABLE ')+(i+1),seat.x+.6,seat.y-.75,1.8,1.5,'table',seat.x+1.5,seat.y+1.5,{tableCost:tableCost(f,i),business:f}));}
    return rows;
  });
}
