// The catalogue is the single source for prices, descriptions and gameplay effects.
const pet=(id,name,price,color,accent,motion,abilities)=>Object.freeze({id,name,price,color,accent,motion,abilities:Object.freeze(abilities)});
export const PETS=Object.freeze([
 pet('chick','Crumb Chick',20,'#ffd44d','#f68b38','waddle',{speed:5}),
 pet('bunny','Mochi Bunny',35,'#fff1d7','#f5a4bc','hop',{capacity:1}),
 pet('cat','Biscuit Cat',50,'#ecae80','#fff0d8','walk',{income:5}),
 pet('dog','Pepper Pup',70,'#bc8057','#66442f','walk',{speed:8}),
 pet('turtle','Pesto Turtle',90,'#88bf69','#376957','waddle',{prep:10}),
 pet('hedgehog','Prickle',120,'#9b79a9','#ffe2b2','walk',{capacity:1,speed:5}),
 pet('frog','Lime Hopper',150,'#ace94c','#f5ffe0','hop',{speed:12}),
 pet('mouse','Cheddar Mouse',180,'#f7bc4b','#ef96a8','walk',{cash:[2,12]}),
 pet('penguin','Sprinkles Penguin',220,'#589bd1','#fff4da','waddle',{prep:15,income:5}),
 pet('fox','Ember Fox',260,'#f4873f','#fff0cb','walk',{speed:15,capacity:1}),
 pet('slime','Pixel Slime',300,'#69deaa','#d8ff77','hop',{capacity:2}),
 pet('bee','Honey Byte',350,'#ffcd4a','#674466','float',{prep:20}),
 pet('otter','Bubble Otter',400,'#5ebeb7','#d7f1d5','walk',{clean:[2.5,18]}),
 pet('panda','Bao Panda',450,'#fff4db','#39474e','waddle',{capacity:2,income:8}),
 pet('robot','Bolt Hound',500,'#59d0d5','#445e8b','walk',{cash:[2.5,10],speed:10}),
 pet('bat','Plum Bat',575,'#af80dc','#71498f','float',{speed:18,prep:15}),
 pet('octopus','Inky Octo',650,'#ef927d','#fbc4bc','hop',{serve:[2.5,14]}),
 pet('raccoon','Bandit Raccoon',725,'#9eaaa7','#394851','walk',{cash:[3,8],income:10}),
 pet('controller','Joypad Pal',800,'#9873db','#67ded2','roll',{capacity:2,prep:20}),
 pet('axolotl','Noodle Axolotl',875,'#f7b3d0','#ea788d','walk',{clean:[3,14],speed:12}),
 pet('dragon','Toast Dragon',950,'#fda158','#87cac0','hop',{prep:30,income:12}),
 pet('jellyfish','Neon Jelly',1050,'#6bd5e4','#b49bea','float',{cash:[3.5,8],capacity:2}),
 pet('crab','Captain Crab',1150,'#ef7368','#ffcb85','walk',{serve:[3,12],capacity:1}),
 pet('unicorn','Sugarcorn',1250,'#d5b3eb','#ffd260','walk',{speed:25,income:15}),
 pet('dino','Pickle Rex',1350,'#86c86c','#d9ed79','walk',{capacity:3,prep:25}),
 pet('owl','Orbit Owl',1450,'#7c78b9','#f8d36e','float',{serve:[3,10],clean:[3,16]}),
 pet('cloud','Nimbus Puff',1550,'#fff8eb','#83caf0','float',{speed:25,cash:[3.5,6]}),
 pet('manta','Star Manta',1700,'#556cac','#a8e5f0','float',{income:20,serve:[3.5,10]}),
 pet('phoenix','Saffron Phoenix',1850,'#ffc14f','#ed7c63','float',{prep:35,clean:[3.5,10],speed:15}),
 pet('whale','Cosmic Whale',2000,'#afa1e6','#fff2b8','float',{capacity:3,income:25,cash:[4,6]}),
]);
export const petById=id=>PETS.find(p=>p.id===id);
export const newPets=()=>({owned:[],equipped:null,cooldowns:{cash:0,serve:0,clean:0},incomeCents:0});
export const equippedPet=s=>s.pets?.owned.includes(s.pets.equipped)?petById(s.pets.equipped):null;
export const petBonus=(s,key)=>equippedPet(s)?.abilities[key]??0;
export function petAbilities(p){
 const a=p.abilities,lines=[];
 if(a.speed)lines.push(`Player movement speed +${a.speed}%`);
 if(a.capacity)lines.push(`Player carrying capacity +${a.capacity} item${a.capacity===1?'':'s'}`);
 if(a.income)lines.push(`Ordinary player earnings +${a.income}% (food, drinks, gifts and arcade cash; excludes employees, VR and security)`);
 if(a.prep)lines.push(`Player food/drink preparation rate +${a.prep}%; active Takeout fryer +${a.prep}% within 3 units`);
 if(a.cash)lines.push(`Collect 1 earned payment or arcade cash pile within ${a.cash[0]} units every ${a.cash[1]}s (all four floors)`);
 if(a.serve)lines.push(`Serve 1 already-stacked food/drink item within ${a.serve[0]} units every ${a.serve[1]}s (food counters on all four floors)`);
 if(a.clean)lines.push(`Clean 1 dirty table within ${a.clean[0]} units every ${a.clean[1]}s (all four floors; after guests finish)`);
 return lines;
}
export function validatePets(p){return !!p&&Array.isArray(p.owned)&&p.owned.length<=PETS.length&&new Set(p.owned).size===p.owned.length&&p.owned.every(id=>petById(id))&&(p.equipped===null||p.owned.includes(p.equipped))&&Number.isInteger(p.incomeCents)&&p.incomeCents>=0&&p.incomeCents<100&&['cash','serve','clean'].every(k=>Number.isFinite(p.cooldowns?.[k])&&p.cooldowns[k]>=0&&p.cooldowns[k]<=60);}
export const preparationStation=st=>['prep','fryer','drinks','wine','tower','handheld','snack'].includes(st.kind);
