// Original campaign content. All correspondence stays on this device.
export const STORY_CHAPTERS=['Across the Road','Cook-Off','Lunch Rush','Delivery Dash','Neighborhood Showdown'];
export const STORY_PLACES={
 dfp:{x:6,y:21,name:'DFP · basement computer',color:'#f1755c'},
 crossing:{x:12,y:15,name:'The crossing',color:'#ffd463'},
 rival:{x:7,y:7,name:'Leaf It to Us',color:'#89c977'},
 market:{x:20,y:7,name:'Miso’s market',color:'#ffb86a'},
 cook:{x:11,y:7,name:'Chef Romaine',color:'#a7d884'},
 plaza:{x:22,y:20,name:'Button Park',color:'#94d8cf'},
 host:{x:26,y:22,name:'Pip · neighborhood host',color:'#e5b9ec'},
 depot:{x:28,y:7,name:'Delivery depot',color:'#7ac6e1'},
 garden:{x:29,y:16,name:'Garden gate',color:'#80c58d'},
 arena:{x:23,y:12,name:'The Crunch Cup',color:'#e9b258'},
};
export const STORY_SOLIDS=[
 {x:1,y:22,w:9,d:5},{x:1,y:1,w:11,d:4.5},
 {x:17,y:2,w:7,d:3},{x:26,y:2,w:6,d:3},
 {x:18,y:22,w:2,d:3},{x:30,y:19,w:2,d:4},
 {x:17,y:9,w:2,d:2},{x:30,y:10,w:2,d:2},
];
const talk=(id,chapter,place,title,body)=>({id,chapter,place,title,body,kind:'talk'});
const event=(id,chapter,type,title,final=false)=>({id,chapter,place:'arena',title,kind:'event',type,final});
export const STORY_OBJECTIVES=[
 talk('crossing',0,'crossing','Follow the empty lunch trail','Bea, crossing guard: “All the lunch bags went THAT way. Even my whistle smells like cucumber. Use this crossing; the neighborhood carts stop for pedestrians.”'),
 talk('leaflet',0,'rival','Investigate the rival’s front door','Chef Romaine: “Welcome to Leaf It to Us! We bought the building opposite DFP. Our secret? Free samples and a neighborhood contest.” You find a Crunch Cup leaflet. DFP can win its customers back by showing up, not buying upgrades. Return to your basement computer and send a challenge.'),
 {id:'challenge',chapter:0,place:'dfp',kind:'mail',title:'Return to the computer · Send Challenge'},
 event('first-splat',0,'fight','The friendly first splat'),
 talk('recipe',1,'market','Ask Miso about neighborhood recipes','Miso: “My recipe cards survived three soup incidents. Golden Controller: batter + pixel bites. Garden Wrap: leaves + pixel bites. Berry Cup: leaves + berries. Take free supplies; the only thing I charge here is my phone.”'),
 talk('chef',1,'cook','Meet Chef Romaine','Romaine: “Collect the two ingredients, choose the matching recipe at PREP, wait for it to cook, then deliver at SERVE. Three accurate dishes beat my score. No upgrades needed. And no, shaking the pan does not make the clock faster.”'),
 event('cook-off',1,'cook','Neighborhood Cook-Off'),
 talk('preferences',2,'plaza','Ask the park guests what they like','June: “I’m here for Golden Controller.” Arlo: “Garden Wrap, please. My lettuce has a loyalty card.” Kit: “Berry Cup! The spoon is my tiny shovel.” Their orders will stay visible during the contest.'),
 talk('hospitality',2,'host','Learn Pip’s hosting routine','Pip: “Seat guests first, bring the right dish, let them finish, THEN clean. Cleaning somebody’s lunch while they eat is called stealing. Three clean, happy tables win the round.”'),
 event('lunch-rush',2,'serve','The Lunch Rush'),
 talk('route',3,'depot','Learn the delivery route','Dot, delivery captain: “Take the golden checkpoints in order: Market, Garden, Park. Use the route arrow and avoid the orange rolling carts. A bump costs a few seconds, never your parcel. Enter at the marker, then hand over the matching package.”'),
 talk('destination',3,'garden','Find the garden delivery gate','Fern: “Garden package here, park package at Button Park. The address matters! The rivals set up a friendly splat checkpoint after the race. Deliver first; defend the dignity of lunch afterward.”'),
 event('delivery-race',3,'race','Delivery Dash'),
 event('delivery-splat',3,'fight','The lunchbox ambush'),
 talk('final-meeting',4,'arena','Meet the neighborhood finalists','Romaine: “You cook, you host, you deliver. I concede your hat has excellent aerodynamics. One final series: cook, serve, race, splat. Each victory stays yours, even if the next round goes sideways.” Pip: “Nine events. One neighborhood. An unreasonable number of napkins.”'),
 event('final-cook',4,'cook','Final · Cook',true),
 event('final-serve',4,'serve','Final · Serve',true),
 event('final-race',4,'race','Final · Deliver',true),
 event('final-splat',4,'fight','Final · The Great Splat',true),
];
export const STORY_EMAILS={
 intro:{from:'Pip · Neighborhood Watch (the lunch kind)',subject:'Our customers crossed the road!',body:'Boss! Leaf It to Us, a very confident salad restaurant, bought the building across the road. Our regulars followed its free samples and Crunch Cup posters. The lunch line has vanished! Head outside, investigate their front door, and find out how DFP can enter. Your businesses and supplies are safely paused during this adventure. You can return to regular play whenever you like. P.S. I tried interrogating a crouton. It cracked.'},
 challenge:{from:'You · DFP',subject:'Challenge: crunch versus crunch',body:'Dear Chef Romaine, DFP accepts your neighborhood challenge. Our controllers are crispy, our aprons are clean-ish, and our customers deserve a great lunch. Meet us at the Crunch Cup. Friendly rules, free supplies, and absolutely no throwing the furniture. Signed, your neighbors across the road.'},
 reply:{from:'Chef Romaine · Leaf It to Us',subject:'Lettuce begin!',body:'Challenge accepted! We will cook, serve, deliver, and settle our disagreements with harmless food splats. First, a practice food fight at the Crunch Cup. Then earn the neighborhood’s votes one round at a time. Losing costs nothing; try again as often as you like. I have already polished my salad tongs.'},
 victory:{from:'The neighborhood',subject:'Welcome back, lunch crowd!',body:'DFP wins the Crunch Cup! Romaine has agreed that crispy controllers and crunchy salads can share a street. The customers are back, the delivery carts have stopped squeaking (briefly), and Pip has awarded everybody a commemorative napkin. Thanks for cooking, listening, and never giving up. Your businesses are open again. The end — and another beginning for DFP.'},
};
export const RECIPES=[
 {id:'controller',name:'Golden Controller',ingredients:['batter','pixel'],color:'#efb74a'},
 {id:'meal',name:'Garden Wrap',ingredients:['leaf','pixel'],color:'#8dcc79'},
 {id:'drink',name:'Berry Cup',ingredients:['leaf','berry'],color:'#d98bc1'},
];
export const INGREDIENTS={batter:'Golden batter',pixel:'Pixel bites',leaf:'Fresh leaves',berry:'Berries'};
export const EVENT_SPOTS={
 batter:{x:3,y:4,name:'Batter'},pixel:{x:7,y:4,name:'Pixel bites'},leaf:{x:11,y:4,name:'Leaves'},berry:{x:15,y:4,name:'Berries'},
 prep:{x:7,y:8,name:'PREP'},serve:{x:12,y:8,name:'SERVE'},pantry:{x:4,y:7,name:'Free meals'},
 table0:{x:8,y:11,name:'June'},table1:{x:12,y:11,name:'Arlo'},table2:{x:16,y:11,name:'Kit'},
 checkpoint0:{x:4,y:5,name:'Market'},checkpoint1:{x:15,y:5,name:'Garden'},checkpoint2:{x:15,y:12,name:'Park'},
};
export const EVENT_SOLIDS={
 cook:[{x:1.8,y:2,w:2.4,d:1},{x:5.8,y:2,w:2.4,d:1},{x:9.8,y:2,w:2.4,d:1},{x:13.8,y:2,w:2.4,d:1},{x:6,y:6,w:2,d:1},{x:11,y:6,w:2,d:1}],
 serve:[{x:2,y:4,w:4,d:1.5},...Array.from({length:3},(_,i)=>({x:7+i*4,y:8.6,w:2,d:1.1}))],
 race:[{x:7,y:6,w:4,d:2},{x:6,y:10,w:3,d:2}],fight:[],
};
export function eventRules(o){
 const rules={
  cook:{limit:o.final?85:100,target:24,rival:o.final?22:18,tip:'Read the recipe card. Collect exactly two ingredients, choose that recipe at PREP, then deliver the cooked dish. Clear the tray for a free fresh start.',text:'Deliver all 3 requested recipes. Each correct dish: +10. Wrong preparation or delivery: −2 (minimum 0). Win with 24+ points and all dishes delivered. Rival caps at '+(o.final?22:18)+'.'},
  serve:{limit:o.final?90:105,target:30,rival:o.final?28:24,tip:'Seat each guest, collect their exact meal at Free Meals, deliver, wait 4 seconds for eating, then clean. You may serve another table while they eat.',text:'Seat 3 guests, deliver their ordered meals (+8 each), then clean after eating (+2 each). Wrong delivery: −2. Win with 30 points and all 3 tables cleaned. Rival caps at '+(o.final?28:24)+'.'},
  race:{limit:o.final?55:65,target:3,rival:o.final?48:58,tip:'Follow the numbered markers in order. Stop beside each marker and choose its matching package. Orange carts cost 2 seconds on a bump. Use the wide aisles.',text:'Deliver Market, Garden, then Park parcels in order. Select the matching destination at each marker. Wrong destination or cart bump: +2 seconds. Beat the rival time of '+(o.final?48:58)+' seconds; ties require a free retry.'},
  fight:{limit:o.final?55:65,target:o.final?7:5,rival:4,tip:'Tap the green rival to aim, then Throw (F). Move away from the orange target before a splat lands, or use Dodge (Space). Lead a moving target slightly.',text:'Land '+(o.final?7:5)+' splats before taking 4 hits. Tap to aim, Throw / F (0.65s cooldown), Dodge / Space (2s cooldown; 0.7s protection). Orange targets warn 1.1s before rival throws. Reach the target score before time runs out. Ties are retries.'},
 };return rules[o.type];
}
