export const WORLD = Object.freeze({width:22,depth:14,entrance:{x:20.8,y:13.3}});
export const TABLE_COUNT=6;
export const tableCost=(floor,index)=>60+floor*40+index*55;
export const tableSeat=index=>({x:12.8+(index%2)*4.2,y:3.45+Math.floor(index/2)*3.4});
export const FLOOR_FOODS=[['controller','drink'],['tower','handheld','wine'],['snack2'],['snack3']];
export const BALANCE = Object.freeze({
  startCash: 120, step: 0.05, speed: 2.9, employeeSpeed: 2.3,
  capacity: 3, employeeCapacity: 2, playerCap: 5, employeeCap: 3,
  floorStaffCap: 12, playerSpeedBonus: 0.15, employeeSpeedBonus: 0.2,
  playerProfitBonus: 0.2, employeeProfitBonus: 0.15,
  earningsBoostPercent: 20,
  actionTime: 0.65, fryTime: 2.4, diningTime: 6, arcadeTime: 6,
  arrivalTime: 4.8, maxCustomers: 6, maxOrderItems: 3, batch: 3, stockCap: 18, drinkOrderChance: 0.8,
  prices: { controller: 1, drink: 3, tower: 6, handheld: 6, wine: 4, souvenir: 5, keychain: 3, snack2:3, snack3:4 },
  quarters: 3, vrTime: 25, vrBaseReward: 3, vrDodgeReward: 1,
});
export const FLOORS = [
  { id: 0, name: 'The Takeout', short: 'Takeout', eyebrow: 'HOT. CRISPY. PIXEL PERFECT.', description: 'Small bites. Big beginnings.', cost: 0, section: 'Drinks bar', sectionCost: 180, color: '#f47b45', pale: '#fce7d5', icon: 'controller' },
  { id: 1, name: 'Pixel & Pour', short: 'Fine dining', eyebrow: 'A LITTLE MORE REFINED.', description: 'Console cuisine, table for two.', cost: 650, section: 'Wine service', sectionCost: 220, color: '#658b74', pale: '#e2eade', icon: 'wine' },
  { id: 2, name: 'The Gift Stop', short: 'Gift shop', eyebrow: 'TAKE A LITTLE DFP HOME.', description: 'Good taste. Great souvenirs.', cost: 1600, section: 'Mini keychains', sectionCost: 500, color: '#6596b1', pale: '#e2edf2', icon: 'gift' },
  { id: 3, name: 'Insert Coin', short: 'Arcade', eyebrow: 'ONE MORE ROUND.', description: 'A new kind of high score.', cost: 3000, section: 'VR playground', sectionCost: 850, color: '#9d79c5', pale: '#eee4f5', icon: 'arcade' },
];
export const PRODUCTS = [
  {id:'controller',floor:0,name:'Crispy Controller',cost:50,description:'Open the prep, fryer, and pickup stations.',icon:'controller'},
  {id:'drink',floor:0,name:'Pixel Pop',cost:180,description:'Open the drinks bar. 80% of guests add a drink.',icon:'wine',section:true},
  {id:'tower',floor:1,name:'Pixel Tower',cost:140,description:'An edible green console, plated to perfection.',icon:'controller'},
  {id:'handheld',floor:1,name:'Pocket Crunch',cost:180,description:'A red-and-blue handheld meal.',icon:'controller'},
  {id:'wine',floor:1,name:'House wine',cost:220,description:'A popular pairing for console meals.',icon:'wine',section:true},
  {id:'souvenir',floor:2,name:'DFP souvenirs',cost:180,description:'Chicken buckets and controller keepsakes.',icon:'gift'},
  {id:'keychain',floor:2,name:'Mini keychains',cost:500,description:'Tiny, crispy souvenirs for every set of keys.',icon:'gift',section:true},
  {id:'machine0',floor:3,name:'Pixel Rush',cost:180,description:'Open your first quarter-earning cabinet.',icon:'arcade'},
  {id:'machine1',floor:3,name:'Cosmic Fry',cost:240,description:'Another machine, another high score.',icon:'arcade'},
  {id:'machine2',floor:3,name:'Byte Fight',cost:300,description:'The third cabinet in your arcade.',icon:'arcade'},
  {id:'vr',floor:3,name:'VR playground',cost:850,description:'Unlock the playable Pixel Run minigame.',icon:'arcade',section:true},
  {id:'snack2',floor:2,name:'Shop Crunch',cost:180,description:'Crispy controller snacks at the gift-shop food counter.',icon:'controller'},
  {id:'snack3',floor:3,name:'Arcade Crunch',cost:220,description:'A crispy controller snack between games.',icon:'controller'},
];
export const productOpen = (s,f,id) => !!s.floors[f].products[id];
export const stationOpen = (s,f,st) => st.kind==='table'?!!s.floors[f].tables[Number(st.id.slice(5))]?.owned:!st.product || productOpen(s,f,st.product);
export const stationPrice = st => st.tableCost??PRODUCTS.find(p=>p.id===st.product)?.cost??0;
const station = (id, name, x, y, w, d, kind, px = x + w / 2, py = y + d + 0.7, extra = {}) => ({ id, name, x, y, w, d, kind, pad: { x: px, y: py }, ...extra });
export const LAYOUTS = [
  [station('prep', 'PREP', 1, 0.7, 2, 1.2, 'prep'), station('fry', 'FRY', 4, 0.7, 2, 1.2, 'fryer'), station('pickup', 'PICK UP', 7, 0.7, 2, 1.2, 'pickup'), station('drink', 'DRINKS', 10, 2.5, 1.3, 1.7, 'drinks', 9.3, 3.4, { section: true }), station('counter', 'SERVE', 2.3, 7.1, 5, 1, 'counter', 4.8, 6.4)],
  [station('tower', 'PIXEL TOWER', 1, 0.7, 2, 1.2, 'tower'), station('handheld', 'POCKET CRUNCH', 4, 0.7, 2, 1.2, 'handheld'), station('wine', 'WINE', 8, 0.7, 2, 1.2, 'wine'), station('greet', 'GREET', 1, 7.2, 1.2, 1.1, 'host', 2.9, 7.5), station('table0', 'TABLE 01', 4, 4, 1.6, 1.4, 'table', 4.8, 6.1), station('table1', 'TABLE 02', 8, 4, 1.6, 1.4, 'table', 8.8, 6.1)],
  [station('stock', 'STOCKROOM', 1, 0.7, 2.5, 1.2, 'stock'), station('keyStock', 'KEYCHAINS', 7.5, 0.7, 2, 1.2, 'keyStock', 8.5, 2.6, { section: true }), station('shelf', 'DFP GOODS', 3, 4, 2.5, 1.2, 'shelf', 4.2, 5.9), station('keyShelf', 'MINI SHOP', 8, 4, 2, 1.2, 'keyShelf', 9, 5.9, { section: true }), station('checkout', 'CHECKOUT', 2, 7.6, 2.5, 1, 'checkout', 3.2, 6.9)],
  [station('machine0', 'PIXEL RUSH', 1, 1, 1.7, 1.5, 'arcade', 1.8, 3.2), station('machine1', 'COSMIC FRY', 4.1, 1, 1.7, 1.5, 'arcade', 4.9, 3.2), station('machine2', 'BYTE FIGHT', 7.2, 1, 1.7, 1.5, 'arcade', 8, 3.2), station('vr', 'VR PLAYGROUND', 7.6, 5.5, 2.6, 2.1, 'vr', 6.8, 6.5, { section: true })],
];
export const OUTFITS = [
  { id: 'uniform', name: 'The original', subtitle: 'DFP uniform', color: '#f57d46', hat: '#f57d46', pants: '#37595a', price: 0, floor: 0 },
  { id: 'chef', name: 'Yes, chef!', subtitle: 'Chef outfit', color: '#fff7e7', hat: '#fff7e7', pants: '#46565c', price: 100, floor: 0 },
  { id: 'formal', name: 'At your service', subtitle: 'Formal server', color: '#273c3e', hat: null, pants: '#263d3f', price: 220, floor: 1 },
  { id: 'retro', name: 'Player one', subtitle: 'Retro gamer', color: '#bc799d', hat: '#62a69e', pants: '#4e6092', price: 300, floor: 2 },
  { id: 'neon', name: 'After hours', subtitle: 'Neon arcade', color: '#615186', hat: '#bafd72', pants: '#383553', price: 400, floor: 3 },
];
const NAMES = ['Milo', 'Poppy', 'Jules', 'Remy', 'Bea', 'Olive', 'Felix', 'Cleo', 'Theo', 'Ivy', 'Kit', 'Sunny', 'Max', 'Lou', 'Coco', 'Nova', 'Ash', 'Juno', 'Lex', 'Ziggy'];
LAYOUTS[0].push(station('stack', 'STACK FOOD', 2.4, 7.1, 1.2, 1, 'stack', 2.9, 6.4, { auxiliary: true }));
for (const layout of LAYOUTS) layout.push(station('trash', 'TRASH', 0.7, 4.1, 0.7, 0.7, 'trash', 1.2, 5.55));
const stationProducts = [{prep:'controller',fry:'controller',pickup:'controller',drink:'drink'},{tower:'tower',handheld:'handheld',wine:'wine'},{stock:'souvenir',shelf:'souvenir',keyStock:'keychain',keyShelf:'keychain'},{machine0:'machine0',machine1:'machine1',machine2:'machine2',vr:'vr'}];
LAYOUTS.forEach((layout,f)=>layout.forEach(st=>{st.product=stationProducts[f][st.id];}));
for(let f=0;f<4;f++){
  LAYOUTS[f]=LAYOUTS[f].filter(st=>st.kind!=='table'&&st.id!=='greet');
  if(f>0){
    if(f===2){const checkout=LAYOUTS[f].find(st=>st.id==='checkout');Object.assign(checkout,{x:8.5,y:7.6,pad:{x:9.7,y:6.9}});}
    LAYOUTS[f].push(station('counter','SERVE',2.3,7.1,5,1,'counter',4.8,6.4),station('stack','STACK FOOD',2.4,7.1,1.2,1,'stack',2.9,6.4,{auxiliary:true}));
  }
  if(f>=2)LAYOUTS[f].push(station(`snack${f}`,'SNACKS',10.25,.7,1.3,1.2,'snack',10.9,2.6,{product:`snack${f}`}));
  for(let i=0;i<TABLE_COUNT;i++){const seat=tableSeat(i);LAYOUTS[f].push(station(`table${i}`,`TABLE ${String(i+1).padStart(2,'0')}`,seat.x+.6,seat.y-.75,1.8,1.5,'table',seat.x+1.5,seat.y+1.55,{tableCost:tableCost(f,i)}));}
}
export const ROSTER = NAMES.map((name, id) => ({ id, name, origin: Math.floor(id / 5), cost: 100 + Math.floor(id / 5) * 85 + (id % 5) * 65, color: ['#72a599', '#d68aaf', '#e9b950', '#729ec3', '#b98dce'][id % 5] }));
export const UPGRADE_TYPES = ['speed', 'capacity', 'profit'];
export const ITEMS = ['controller', 'drink', 'tower', 'handheld', 'wine', 'souvenir', 'keychain','snack2','snack3'];
export const floorCount = (s, floor) => s.employees.filter(e => e.floor === floor).length;
export const upgradeCount = (u) => u.speed + u.capacity + u.profit;
export const playerUpgradeCost = (s, f) => 90 + upgradeCount(s.floors[f].upgrades) * 65 + f * 30;
export const employeeUpgradeCost = (e, type) => 70 + e.upgrades[type] * 70;
