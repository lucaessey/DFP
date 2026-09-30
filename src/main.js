import {StoryView} from './story-view.js';
import {pauseStory,resumeStory,leaveStoryComputer} from './story.js';
import {UMBRELLA_COST} from './expansion-config.js';
import './style.css';
import './vr.css';
import './world.css';
import './casual.css';
import './basement.css';
import './expansion.css';
import {BasementView,basementCard} from './basement-view.js';
import { BALANCE as B, FLOORS, LAYOUTS, OUTFITS, ROSTER, UPGRADE_TYPES, PRODUCTS, tableCost, floorCount, upgradeCount, playerUpgradeCost, employeeUpgradeCost } from './config.js';
import {paymentQuote} from './economy.js';
import {WORLD} from './config.js';
import { step, command, capacity, stationStatus, startVR, vrInput, bestEmployeeAssignments } from './simulation.js';
import { loadGame, saveGame, SAVE_KEY, BACKUP_KEY } from './storage.js';
import { Renderer, drawPortrait } from './renderer.js';
import { icon } from './icons.js';
import { Sound } from './audio.js';
import {PetShop} from './pet-shop.js';
import {petById,petSecurityAccess} from './pets.js';
import {mountSignInCompletion} from './people/view.js';

const loaded = loadGame(localStorage), state = loaded.state, sound = new Sound();
try { if (!localStorage.getItem(SAVE_KEY) && !localStorage.getItem(BACKUP_KEY)) state.settings.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { state.settings.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; }
let writable = loaded.writable, activeTab = 'home', filterFloor = 0, target = null, paused = false, last = 0, accumulator = 0, lastSave = 0, lastRevision = -1, lastUI = 0, installPrompt = null, registration = null, offlineReady = false, updateReady = false, saveWarning = loaded.warning, lockBlocked = false;
let inBasement=false;
let checkingUpdate=false,updateMessage='';
const keys = new Set(), joystick = { x: 0, y: 0 }, app = document.querySelector('#app');
let sessionReady = !navigator.locks;
const money = n => `${n<0?'−':''}$${Math.abs(Math.floor(n)).toLocaleString('en-US')}`;
const html = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
app.innerHTML = `
  <header class="topbar"><a class="brand" href="#" aria-label="DFP Home"><span class="brand-mark">${icon('controller')}</span><span class="brand-word">DFP<span>DEEP FRIED PIXELS</span></span></a><div class="top-tagline">Good food. <span>Great pixels.</span></div><div class="header-actions"><div class="balance"><span class="coin-icon">${icon('cash')}</span><span><small>YOUR BALANCE</small><strong id="balance"></strong></span></div><button class="icon-button" data-action="settings" aria-label="Settings">${icon('gear')}</button></div></header>
  <main id="main"><section id="home-view" class="home-view"><aside class="left-rail"><div class="live-label"><i></i> OPEN FOR BUSINESS</div><span class="eyebrow" id="floor-eyebrow"></span><h1 id="floor-title"></h1><p id="floor-description"></p><div class="floor-chip">${icon('elevator')}<span id="floor-chip"></span><span class="chip-dot">●</span></div><div class="mission card"><div class="card-overline">YOUR NEXT LITTLE WIN ${icon('star')}</div><h2 id="mission-title"></h2><p id="mission-text"></p><div class="progress-track"><span id="mission-progress"></span></div><div class="mission-meta"><span id="mission-count"></span><button class="text-button" data-action="mission">Let's go ${icon('arrow')}</button></div></div><div class="tip"><span>✦</span><p>A little hustle.<br>A whole lot of crunch.</p></div></aside>
  <section class="play-area" aria-label="Restaurant gameplay"><div class="scene-top"><span class="scene-badge"><i></i> <span id="scene-name">THE TAKEOUT</span></span><span class="scene-stats">${icon('people')} <b id="customer-count">0</b> guests</span></div><canvas id="game" tabindex="0" aria-label="Isometric restaurant. Move with WASD, arrow keys, joystick, or tap a station." role="img"></canvas><div class="floor-guide" id="floor-guide"></div><div class="scene-bottom"><div class="carry-badge">${icon('bag')}<span id="carry-label"></span></div><div class="movement-hint"><kbd>W</kbd><span class="key-row"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>to move <em>or click a station</em></span></div><button class="small-button upgrade-mobile" data-action="upgrades">${icon('bolt')} Upgrade</button></div><div id="joystick" role="slider" aria-label="Movement joystick" tabindex="0"><div id="joystick-knob">${icon('controller')}</div></div></section>
  <aside class="right-rail"><div class="shift-card card"><div class="card-overline">LOOK AT YOU GROW ${icon('up')}</div><h2>This little empire.</h2><div class="stat-line"><span>Happy customers</span><strong id="served-count">0</strong></div><div class="stat-line"><span>Floor earnings</span><strong id="floor-earnings">$0</strong></div><div class="stat-line"><span>Your team</span><strong id="team-count">0 / 12</strong></div><button class="outline-button" data-action="employees">${icon('people')} Meet your team ${icon('arrow')}</button></div><div class="upgrade-card card"><div class="upgrade-card-icon">${icon('bolt')}</div><h2>A little extra oomph.</h2><p>Faster feet. Bigger stacks.<br>Even better tips.</p><button class="dark-button" data-action="upgrades">Upgrade yourself ${icon('arrow')}</button><span id="upgrade-allowance"></span></div><div class="next-floor-card"><span id="next-floor-icon">${icon('wine')}</span><div><small>UP NEXT</small><b id="next-floor-name">Pixel & Pour</b><span id="next-floor-price">Unlock for $650</span></div><button class="icon-button" data-action="elevator" aria-label="View floors">${icon('arrow')}</button></div></aside></section><section id="panel-view" class="panel-view" hidden></section></main>
  <footer class="bottom-shell"><div class="save-status"><i id="save-dot"></i><span id="save-status">Saved on this device</span></div><nav class="bottom-nav" aria-label="Main navigation">${[['elevator','elevator','Elevator'],['home','home','Home'],['outfits','shirt','Outfits'],['employees','people','Employees'],['pets','paw','Pets']].map(([id,i,label]) => `<button data-tab="${id}" class="nav-tab ${id === 'home' ? 'active' : ''}" aria-current="${id === 'home' ? 'page' : 'false'}">${icon(i)}<span>${label}</span>${id === 'home' ? '<i></i>' : ''}</button>`).join('')}</nav><div class="made-with">FRESHLY FRIED. <span>ALWAYS PLAYFUL.</span></div></footer>
  <div id="toast" role="status" aria-live="polite"></div><dialog id="dialog"><div id="dialog-content"></div></dialog><div id="session-block" hidden><div class="card"><h2>DFP is open in another tab.</h2><p>Keep playing there, or close that tab and reload this one.</p><button class="dark-button" data-action="reload">Reload DFP</button></div></div>`;
const canvas = document.querySelector('#game'), renderer = new Renderer(canvas), dialog = document.querySelector('#dialog');
const basement=new BasementView(state,{purchase:act,save,notify:toast,watchAllowed:()=>!state.story.active&&!paused&&!lockBlocked&&sessionReady&&!dialog.open&&activeTab==='home'&&(inBasement||basement.remote)});
const petShop=new PetShop(state,act);
const storyView=new StoryView(state,{save,allowed:()=>!lockBlocked&&sessionReady&&!paused&&!dialog.open,regular:()=>{inBasement=false;selectTab('home');refreshHome();},computer:()=>{inBasement=true;activeTab='home';document.querySelector('#home-view').hidden=true;basement.show(true);basement.computer.open();basement.computer.navigate('story-inbox');}});
basement.computer.onStory=()=>{stopMovement();basement.computer.close();resumeStory(state);leaveStoryComputer(state);storyView.open();save();};
renderer.onCue=kind=>sound.play(kind,state.settings.sound);
mountSignInCompletion();
let toastTimer;
function toast(message,tone='info') { const t = document.querySelector('#toast'); t.textContent = message;t.dataset.tone=tone; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3500); }
function save() {
  if (!writable || lockBlocked || !sessionReady) return false;
  const result = saveGame(localStorage, state);
  if (!result.ok) { saveWarning = result.error; document.querySelector('#save-dot').classList.add('warning'); document.querySelector('#save-status').textContent = 'Save needs attention'; }
  else { lastRevision = state.revision; lastSave = state.time; }
  return result.ok;
}
function act(c) {
  if (lockBlocked) return;
  const result = command(state, { ...c, token: crypto.randomUUID() });
  if (!result.ok) { toast(result.message,'error'); return false; }
  save(); sound.play('purchase', state.settings.sound); renderPanel(); refreshHome();
  if(c.type!=='visit')renderer.feedback({text:c.type==='hire'?'Welcome to DFP!':c.type==='product'||c.type==='floor'?'Unlocked!':c.type==='upgrade'?'Upgraded!':c.type==='table'?'New table!':'Looking good!',kind:'purchase',floor:state.floor,x:state.player.x,y:state.player.y},state.time);
  toast(c.type==='fill-best'?`Best team assigned to ${FLOORS[c.floor].name}. ${floorCount(state,c.floor)} / ${B.floorStaffCap} employees.`:c.type==='pet-buy'?`${petById(c.id).name} is yours and equipped!`:c.type==='pet-equip'?`${petById(c.id).name} equipped!`:c.type==='pet-unequip'?'Pet unequipped. Your collection is safe.':c.type === 'visit' ? `Welcome to ${FLOORS[state.floor].name}` : c.type === 'assign' ? 'Transferred safely. Upgrades kept.' : c.type === 'hire' ? `${ROSTER[c.id].name} is on the team!` : c.type === 'outfit' ? 'Looking good. Outfit equipped!' : 'A little upgrade. A big difference.','success');
  return true;
}
function tutorial() {
  if(!state.floors[0].products.controller)return ['Your first menu item.','Unlock Crispy Controller for $50 to open your kitchen.','menu'];
  return [
    ['Let’s make something crispy.', 'Walk to PREP. Stay in the ring to shape your first batch.', 'prep'],
    ['Time for a golden glow.', 'Walk to FRY to start the fryer. A batch takes a moment.', 'fry'],
    ['Stack ’em up.', 'Walk to PICK UP and collect a freshly fried controller.', 'pickup'],
    ['Make a tasty little stack.', 'Walk to STACK FOOD to unload onto the counter.', 'stack'],
    ['Your first happy customer.', state.floors[0].section ? 'Serve food here, then stack and serve drinks in their own section. Collect the full payment there.' : 'Stand in the middle SERVE circle to hand out food and collect payment.', 'counter'],
    ['Build your little dream team.', 'Hire your first helper. They’ll keep the kitchen moving.', null],
  ][state.tutorial];
}
function refreshHome() {
  petShop.refresh();
  refreshPetSecurity();
  document.documentElement.dataset.motion=state.settings.reducedMotion?'reduced':'full';
  document.querySelectorAll('.unlock-progress').forEach(p=>{p.value=Math.min(state.money,Number(p.max));p.nextElementSibling.textContent=`${money(p.value)} / ${money(p.max)}`;});
  const f = FLOORS[state.floor], fs = state.floors[state.floor], t = tutorial();
  document.querySelector('#balance').textContent = money(state.money);
  document.querySelector('#floor-eyebrow').textContent = f.eyebrow;
  document.querySelector('#floor-title').textContent = f.name + '.';
  document.querySelector('#floor-description').textContent = f.description;
  document.querySelector('#floor-chip').textContent = `Floor ${state.floor + 1} of ${FLOORS.length}`;
  document.querySelector('#scene-name').textContent = f.short.toUpperCase();
  document.querySelector('#customer-count').textContent = fs.customers.filter(c => c.state !== 'leaving').length;
  let drinksSection=document.querySelector('#drinks-section');
  if(!drinksSection){drinksSection=document.createElement('button');drinksSection.id='drinks-section';drinksSection.dataset.action='drinks-section';drinksSection.className='small-button';document.querySelector('.play-area').append(drinksSection);}
  drinksSection.hidden=state.floor>1;
  if(state.floor<2){drinksSection.classList.toggle('section-locked',!fs.section);drinksSection.innerHTML=fs.section?`${icon('wine')} Drinks →`:`${icon('lock')}<span>Unlock Drinks Section<strong>${money(f.sectionCost)} · Buy</strong></span>`;}
  document.querySelector('#carry-label').textContent = `${state.player.bag.length} / ${capacity(state, state.player, state.floor)} carried`;
  document.querySelector('#served-count').textContent = fs.served;
  document.querySelector('#floor-earnings').textContent = money(fs.revenue);
  document.querySelector('#team-count').textContent = `${floorCount(state, state.floor)} / 12`;
  document.querySelector('#upgrade-allowance').textContent = `${upgradeCount(fs.upgrades)}/5 upgrades purchased on this floor`;
  const early = state.tutorial < 5 && state.floor === 0, next = FLOORS.find(f => !state.floors[f.id].unlocked);
  document.querySelector('#mission-title').textContent = early ? t[0] : !state.employees.length ? 'Build your little dream team.' : next ? 'Next stop, new possibilities.' : 'Make every floor yours.';
  document.querySelector('#mission-text').textContent = early ? t[1] : !state.employees.length ? 'Hire your first helper. They’ll keep the kitchen moving.' : next ? `Save ${money(next.cost)} to open ${next.name}. Your helpers keep earning while you explore.` : 'Grow your team, unlock every section, and find your favorite outfit.';
  document.querySelector('#mission-progress').style.width = `${early ? state.tutorial * 20 : next ? Math.min(100, state.money / next.cost * 100) : 100}%`;
  document.querySelector('#mission-count').textContent = early ? `${state.tutorial} / 5 first steps` : next ? `${money(state.money)} / ${money(next.cost)}` : `All ${FLOORS.length} floors open`;
  document.querySelector('#next-floor-name').textContent = next?.name || 'The whole DFP family';
  document.querySelector('#next-floor-price').textContent = next ? `Unlock for ${money(next.cost)}` : `${FLOORS.length} floors. Endless possibilities.`;
  document.querySelector('#next-floor-icon').innerHTML = icon(next?.icon || 'star');
  document.querySelector('.play-area').classList.toggle('expansion-floor',state.floor>=4);
  const guide = document.querySelector('#floor-guide');
  const current = LAYOUTS[state.floor].find(st => st.id === state.player.action);
  guide.textContent = early ? t[1] : current ? `${current.name} · ${stationStatus(state, state.floor, current)}` : f.guide ? f.guide : state.floor === 1 ? 'Collect meals → stack food → SERVE → tables → clean' : state.floor === 2 ? 'Collect stock → fill shelves → serve checkout' : state.floor === 3 ? 'Let guests play. Walk to a machine to collect quarters.' : 'Prep → fry → pick up → stack food → serve.';
  let vrButton = document.querySelector('#vr-start');
  if (!vrButton) { vrButton = document.createElement('button'); vrButton.id = 'vr-start'; vrButton.dataset.action = 'vr-start'; vrButton.className = 'dark-button'; vrButton.innerHTML = `${icon('arcade')} Play Pixel Run`; document.querySelector('.play-area').append(vrButton); }
  vrButton.hidden = !(state.floor === 3 && fs.section && current?.id === 'vr');
  let emptyButton = document.querySelector('#return-stock');
  if (!emptyButton) { emptyButton = document.createElement('button'); emptyButton.id='return-stock'; emptyButton.className='return-stock'; emptyButton.dataset.action='return-stock'; emptyButton.textContent='Return carried stock'; document.querySelector('.scene-bottom').append(emptyButton); }
  emptyButton.hidden = state.player.bag.length === 0;
  let menuButton=document.querySelector('#menu-button');
  if(!menuButton){menuButton=document.createElement('button');menuButton.id='menu-button';menuButton.dataset.action='menu';menuButton.className='small-button';document.querySelector('.play-area').append(menuButton);}
  const products=PRODUCTS.filter(p=>p.floor===state.floor),open=products.filter(p=>fs.products[p.id]).length;
  menuButton.innerHTML=`${icon('lock')} Unlock items <b>${open}/${products.length}</b>`;
  let tablesButton=document.querySelector('#tables-button');if(!tablesButton){tablesButton=document.createElement('button');tablesButton.id='tables-button';tablesButton.dataset.action='tables';tablesButton.className='small-button';document.querySelector('.play-area').append(tablesButton);}
  tablesButton.hidden=state.floor===10;
  tablesButton.innerHTML=`${icon('people')} ${state.floor===5?'Seats':state.floor===8?'Desks':'Tables'} <b>${fs.tables.filter(t=>t.owned).length}/6</b>`;
  let areaButton=document.querySelector('#area-button');if(!areaButton){areaButton=document.createElement('button');areaButton.id='area-button';areaButton.dataset.action='area';areaButton.className='small-button';document.querySelector('.play-area').append(areaButton);}
  areaButton.textContent=state.player.x>WORLD.diningStart?'← Workstations':state.floor===10?'Packing area →':'Seating area →';
  let status=document.querySelector('#business-status');if(!status){status=document.createElement('div');status.id='business-status';status.setAttribute('role','status');document.querySelector('.play-area').append(status);}
  const cold=state.player.cold?.length?Math.ceil(Math.min(...state.player.cold)):null;
  let help=document.querySelector('#business-help');if(!help){help=document.createElement('button');help.id='business-help';help.className='small-button';help.dataset.action='business-help';help.textContent='How to play';document.querySelector('.play-area').append(help);}help.hidden=state.floor<4;
  status.hidden=state.floor<4;status.textContent=state.floor===4?(cold!==null?`Ice cream: ${cold}s before melting${cold<=10?' · Stack it now!':''}`:'Ice cream stays cold on the counter') :state.floor===7?(fs.activity.weather>=40?'Rain · umbrellas protect covered tables':fs.activity.weather>=35?`Rain in ${Math.ceil(40-fs.activity.weather)}s`:'Clear skies') :state.floor===6?(fs.activity.robot.fault?'Robot fault · repair at the robot for free':'Robot online') :state.floor===10?`${fs.activity.factory.completed} deliveries · ${fs.activity.factory.hopper}/3 snacks to seal` :state.floor===8?`${fs.customers.filter(c=>c.fault).length} PCs need repair`:state.floor===9?'Fresh bowls, happy paws':'14-second movies · tickets and popcorn paid separately';
  let stopButton=document.querySelector('#stop-movement');if(!stopButton){stopButton=document.createElement('button');stopButton.id='stop-movement';stopButton.dataset.action='stop';stopButton.setAttribute('aria-label','Stop walking');stopButton.innerHTML=icon('stop');document.querySelector('.play-area').append(stopButton);}stopButton.hidden=!target||surfacePointer!==null;
}
function refreshPetSecurity(){
  const access=petSecurityAccess(state);
  document.querySelector('.play-area').classList.toggle('has-camera-pet',access.visible);
  for(const [id,anchor] of [['pet-security-shortcut','.upgrade-card'],['pet-security-mobile','.upgrade-mobile']]){
    let button=document.getElementById(id);
    if(!button){button=document.createElement('button');button.id=id;button.dataset.action='pet-security';button.className='outline-button pet-security-shortcut';document.querySelector(anchor).before(button);}
    button.hidden=!access.visible;button.title=access.message;button.setAttribute('aria-disabled',String(!access.ready));button.textContent=access.ready?'Security Camera':'Security Camera · Locked';
  }
}
function openPetSecurity(button){
  if(lockBlocked||!sessionReady||paused||dialog.open||activeTab!=='home'||inBasement||basement.monitoring)return;
  const access=petSecurityAccess(state);if(!access.ready){toast(access.message,'error');return;}
  stopMovement();
  // Keep the live player, floor and world camera in place; only the feed overlays them.
  basement.open({remote:true,onReturn:()=>{refreshHome();const source=button.getClientRects().length?button:document.querySelector('#pet-security-mobile').getClientRects().length?document.querySelector('#pet-security-mobile'):canvas;source.focus({preventScroll:true});}});
}
function selectTab(tab) {
  if(storyView.opened||state.story.active){pauseStory(state);storyView.hide();save();}
  activeTab = tab; stopMovement();
  document.querySelector('#home-view').hidden = tab !== 'home'||inBasement; document.querySelector('#panel-view').hidden = tab === 'home';basement.show(tab==='home'&&inBasement);
  document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'); });
  if (tab === 'employees') filterFloor = state.floor;
  renderPanel(); refreshHome();
}
function panelHeading(eyebrow, title, description) { return `<div class="panel-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div><span class="panel-decor">✦</span></div>`; }
function renderPanel() {
  if (activeTab === 'home') return;
  const panel = document.querySelector('#panel-view');
  panel.onclick=null;
  if(activeTab==='pets'){petShop.render(panel);return;}
  if (activeTab === 'elevator') {
    panel.innerHTML = panelHeading('A LITTLE HIGHER, A LITTLE HAPPIER', 'Going up?', `${FLOORS.length} businesses, and a cozy basement of your own.`) + `<div class="floor-grid">${basementCard(state,inBasement)}${FLOORS.map(f => { const fs = state.floors[f.id], current = !inBasement && state.floor === f.id; return `<article class="floor-card ${fs.unlocked ? '' : 'locked'}" style="--accent:${f.color};--pale:${f.pale}"><div class="floor-illustration"><span class="floor-number">${String(f.id + 1).padStart(2,'0')}</span><span class="floor-art">${icon(f.icon)}</span><span class="floor-card-badge">${current ? 'YOU ARE HERE' : fs.unlocked ? 'OPEN FOR BUSINESS' : 'ROOM TO GROW'}</span></div><div class="floor-card-body"><h2>${f.name}</h2><p>${f.description}</p><div class="floor-detail">${fs.unlocked ? `${floorCount(state,f.id)} / 12 employees · ${money(fs.revenue)} earned` : f.id > 0 && !state.floors[f.id - 1].unlocked ? `Open floor ${f.id} first` : 'Ready for your next chapter'}</div>${fs.unlocked?'':unlockProgress(f.cost,f.name)}<button class="${current ? 'outline-button' : 'dark-button'}" data-action="${fs.unlocked ? 'visit' : 'unlock-floor'}" data-floor="${f.id}" ${!fs.unlocked && !state.floors[f.id - 1]?.unlocked ? 'disabled' : ''}>${current ? 'Back to your restaurant' : fs.unlocked ? 'Visit floor' : `Unlock · ${money(f.cost)}`} ${icon(fs.unlocked ? 'arrow' : 'lock')}</button></div></article>`; }).join('')}</div><p class="panel-note">${icon('people')} Your assigned team keeps working on every open floor while you play.</p>`;
  }
  if (activeTab === 'outfits') {
    panel.innerHTML = panelHeading('A FRESH LOOK FOR EVERY FLOOR', 'Wear your flavor.', 'All style. All earned in-game. Find a look that feels like you.') + `<div class="outfit-grid">${OUTFITS.map(o => { const owned = state.outfits.includes(o.id), equipped = state.outfit === o.id, open = state.floors[o.floor].unlocked; return `<article class="outfit-card ${equipped ? 'equipped' : ''}"><div class="outfit-preview" style="--outfit:${o.color}"><span class="outfit-badge">${equipped ? 'EQUIPPED' : owned ? 'IN YOUR WARDROBE' : `FLOOR ${o.floor + 1}`}</span><canvas width="160" height="150" data-outfit="${o.id}" aria-label="${o.subtitle} preview"></canvas></div><div class="outfit-body"><small>${o.subtitle}</small><h2>${o.name}</h2><button class="${equipped ? 'outline-button' : 'dark-button'}" data-action="outfit" data-id="${o.id}" ${equipped || !open ? 'disabled' : ''}>${equipped ? 'Looking good' : !open ? `Unlock floor ${o.floor + 1}` : owned ? 'Wear this' : `Unlock · ${money(o.price)}`} ${icon(equipped ? 'check' : open ? 'shirt' : 'lock')}</button></div></article>`; }).join('')}</div>`;
    panel.querySelectorAll('[data-outfit]').forEach(c => drawPortrait(c, OUTFITS.find(o => o.id === c.dataset.outfit)));
  }
  if (activeTab === 'employees') {
    const destination=FLOORS[filterFloor],open=state.floors[filterFloor].unlocked,canFill=open&&bestEmployeeAssignments(state,filterFloor).length>0;
    const fillHint=!open?'Unlock this floor first.':!state.employees.length?'Hire an employee first.':!canFill?'Your best team is already here.':`Assign your best ${Math.min(B.floorStaffCap,state.employees.length)} owned employees here for free. Staff may transfer or swap with other floors.`;
    panel.innerHTML = panelHeading('MANY HANDS. MORE HAPPY CUSTOMERS.', 'Your dream team.', `${state.employees.length} / ${ROSTER.length} hired. Five unique faces from every floor.`) + `<div class="roster-tabs">${FLOORS.map(f => `<button class="${filterFloor === f.id ? 'selected' : ''}" data-action="filter" data-floor="${f.id}">${icon(f.icon)} ${f.short}<span>${floorCount(state,f.id)} / 12 working</span></button>`).join('')}</div><section class="staff-fill"><div><h2>Team for ${destination.name}</h2><p id="fill-best-hint">${fillHint}</p><small>Best = total speed, carrying and profit upgrades. Ties keep current staff.</small></div><button class="dark-button" data-action="fill-best" data-floor="${filterFloor}" aria-describedby="fill-best-hint" ${canFill?'':'disabled'}>${icon('people')} Fills with best</button></section><p class="roster-note">Hires from ${FLOORS[filterFloor].name}. Assign them to any open floor. Each skill has 3 upgrades.</p><div class="employee-grid">${ROSTER.filter(e => e.origin === filterFloor).map(def => { const e = state.employees.find(e => e.id === def.id), open = state.floors[def.origin].unlocked; return `<article class="employee-card"><div class="employee-header"><div class="employee-avatar" style="background:${def.color}33;color:${def.color}">${icon('people')}</div><div><h2>${def.name}</h2><span>${e ? 'All-rounder · on the job' : 'All-rounder · ready to help'}</span></div>${e ? '<span class="working-dot"></span>' : ''}</div>${e ? `<label class="assignment-label">WORKING ON<select data-assign="${e.id}" aria-label="Assign ${def.name} to floor">${FLOORS.map(f => `<option value="${f.id}" ${f.id === e.floor ? 'selected' : ''} ${!state.floors[f.id].unlocked ? 'disabled' : ''}>${f.id + 1} · ${f.name} (${floorCount(state,f.id)}/12)</option>`).join('')}</select></label><div class="employee-upgrades">${UPGRADE_TYPES.map(k => `<button data-action="employee-upgrade" data-id="${e.id}" data-category="${k}" ${e.upgrades[k] >= 3 ? 'disabled' : ''}><span>${icon(k === 'speed' ? 'bolt' : k === 'capacity' ? 'bag' : 'coin')} ${k}<b>${e.upgrades[k]}/3</b></span><small>${e.upgrades[k] >= 3 ? 'MAXED' : money(employeeUpgradeCost(e,k)) + ' +'}</small></button>`).join('')}</div>` : `<p>Preps, carries, serves, and collects.<br>One very useful pair of hands.</p><button class="dark-button" data-action="hire" data-id="${def.id}" ${!open ? 'disabled' : ''}>${open ? `Hire · ${money(def.cost)}` : `Unlock floor ${def.origin + 1}`} ${icon(open ? 'people' : 'lock')}</button>`}</article>`; }).join('')}</div><p class="panel-note">${icon('bag')} Transfers return carried stock to the previous floor. Skills always stay with the employee.</p>`;
    const tabs=panel.querySelector('.roster-tabs'),selected=tabs.querySelector('.selected');
    if(tabs.scrollWidth>tabs.clientWidth)tabs.scrollLeft=Math.max(0,selected.offsetLeft-tabs.offsetLeft-12);
  }
}
function showDialog(content) { document.querySelector('#dialog-content').innerHTML = `<button class="dialog-close icon-button" data-action="close" aria-label="Close">${icon('close')}</button>${content}`; stopMovement(); dialog.showModal(); }
function upgradesDialog() {
  const f = state.floor, fs = state.floors[f], used = upgradeCount(fs.upgrades);
  showDialog(`<span class="eyebrow">A LITTLE EXTRA OOMPH</span><h2>Make it your superpower.</h2><p>Upgrades apply to ${FLOORS[f].name}.</p><div class="allowance"><b>${used}/5</b> upgrades purchased <span>${'●'.repeat(used)}${'○'.repeat(5-used)}</span></div><div class="upgrade-options">${UPGRADE_TYPES.map(k => `<button data-action="player-upgrade" data-category="${k}" ${used >= 5 ? 'disabled' : ''}><span class="upgrade-symbol">${icon(k === 'speed' ? 'bolt' : k === 'capacity' ? 'bag' : 'coin')}</span><span><b>${k === 'speed' ? 'Faster feet' : k === 'capacity' ? 'Bigger stacks' : 'Better earnings'}</b><small>${k === 'speed' ? '+15% movement speed' : k === 'capacity' ? '+1 carrying capacity' : '+20% of base income'} · Lv. ${fs.upgrades[k]}</small></span><strong>${used >= 5 ? 'MAX' : money(playerUpgradeCost(state,f))}</strong></button>`).join('')}</div>${!fs.section ? `<div class="section-unlock"><h3>A little room to grow.</h3><p>Open the ${FLOORS[f].section.toLowerCase()}.</p><button class="dark-button" data-action="section">Unlock ${FLOORS[f].section} · ${money(FLOORS[f].sectionCost)}</button></div>` : ''}<p class="fine-print">5 purchases combined across all three skills per floor. Employee profit adds +15% per level to the same base payment; bonuses apply once.</p>`);
}
function settingsDialog() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  showDialog(`<span class="eyebrow">YOUR LITTLE CORNER</span><h2>Make yourself at home.</h2><div class="setting-row"><span>${icon('sound')} Kitchen sounds</span><button data-action="sound" class="toggle ${state.settings.sound ? 'on' : ''}" aria-label="Toggle sound" aria-pressed="${state.settings.sound}"></button></div><div class="setting-row"><span>${icon('star')} Reduced motion</span><button data-action="motion" class="toggle ${state.settings.reducedMotion ? 'on' : ''}" aria-label="Toggle reduced motion" aria-pressed="${state.settings.reducedMotion}"></button></div><div class="setting-row"><span>${icon('bolt')} Reduced effects</span><button data-action="effects" class="toggle ${state.settings.reducedEffects ? 'on' : ''}" aria-label="Toggle reduced effects" aria-pressed="${!!state.settings.reducedEffects}"></button></div><p class="fine-print">Lighter shadows and fewer effects for smoother play.</p><div class="settings-section"><h3>A home on your home screen.</h3><p>${ios ? 'In Safari, tap Share, then Add to Home Screen.' : installPrompt ? 'Install DFP for its own window and easy access.' : 'Use your browser’s Install app or Add to Home Screen menu when available. Installation requires HTTPS or localhost.'}</p><button class="outline-button" data-action="install">${icon('download')} ${installPrompt ? 'Install DFP' : 'Installation guidance'}</button><p class="offline-status">${offlineReady ? '● Ready to play offline' : import.meta.env.DEV ? 'Development preview · offline mode is available in the production build.' : 'Downloading the ingredients for offline play…'}</p><button class="outline-button" data-action="check-update" ${checkingUpdate?'disabled':''}>Check for updates</button><p id="game-update-status" role="status">${html(updateMessage)}</p><button class="dark-button" data-action="update" ${updateReady?'':'hidden'}>Save & update DFP</button></div><div class="settings-section"><h3>Producer account</h3><p>Verify your email to read private player feedback in the basement computer.</p><button class="outline-button" data-action="producer-signin">Producer Sign-in</button></div><div class="settings-section"><h3>Saved right here.</h3><p>Progress is device-local, in this browser. Clearing browser data removes it. Player feedback uses separate online accounts; gameplay has no cloud saves. Your team earns only while the game is active.</p>${saveWarning ? `<p class="warning-text">${html(saveWarning)}</p>` : ''}<button class="outline-button" data-action="export">${icon('download')} Export local save</button></div><p class="fine-print">DFP · Deep Fried Pixels · v1.0<br>Original art and sound. Always freshly fried.</p>`);
}
function updateStatus(){
  const status=document.querySelector('#game-update-status'),button=document.querySelector('[data-action="check-update"]'),activate=document.querySelector('[data-action="update"]');
  if(status)status.textContent=updateMessage;
  if(button)button.disabled=checkingUpdate;
  if(activate)activate.hidden=!updateReady;
}
async function checkGameUpdate(){
  if(checkingUpdate)return;
  if(!navigator.onLine){updateMessage='Connect to check for a new version. Your saved game stays here.';updateStatus();return;}
  if(!registration){updateMessage=import.meta.env.DEV?'Updates are available in the installed or published game.':'Offline setup is not ready yet. Try again after it finishes.';updateStatus();return;}
  checkingUpdate=true;updateMessage='Checking for updates…';updateStatus();
  let timer;
  try{
    await Promise.race([registration.update(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),15000);})]);
    updateReady=!!registration.waiting;
    updateMessage=updateReady?'A new version is ready. Save & update to use it.':registration.installing?'Downloading the new version…':'You have the latest version available.';
  }catch{updateMessage='The update check could not finish. Your saved game is safe; try again online.';}
  finally{clearTimeout(timer);checkingUpdate=false;updateStatus();}
}
function unlockProgress(cost,label){return `<div class="unlock-progress-wrap"><progress class="unlock-progress" max="${cost}" value="${Math.min(cost,state.money)}" aria-label="Progress toward ${html(label)}"></progress><small>${money(Math.min(cost,state.money))} / ${money(cost)}</small></div>`;}
function drinksDialog(){const f=FLOORS[state.floor];showDialog(`<span class="eyebrow">YOUR DRINKS AREA</span><h2>Unlock Drinks Section</h2><p>${state.floor===0?'Pixel Pop drinks':'House wine'} gets its own dispenser, stacking counter and service circle. Guests collect food first, then drinks, and pay once.</p>${unlockProgress(f.sectionCost,'drinks section')}<p>${state.floor===0?'Requires Crispy Controller.':'Requires Pixel Tower or Pocket Crunch.'}</p><button class="dark-button" data-action="buy-drinks-section">Unlock Drinks Section · ${money(f.sectionCost)}</button>`);}
function menuDialog() {
  const f=state.floor,fs=state.floors[f];
  showDialog(`<span class="eyebrow">BUILD YOUR MENU, ONE ITEM AT A TIME</span><h2>Something worth unlocking.</h2><p>Every product starts here. ${FLOORS[f].name}.</p><div class="product-list">${PRODUCTS.filter(p=>p.floor===f).map(p=>`<article><span class="product-symbol">${icon(p.icon)}</span><div><h3>${p.name}</h3><p>${p.description}</p><small>${B.prices[p.id]?`Next single-item sale: ${money(paymentQuote(state,f,state.player,B.prices[p.id]).amount)}`:p.id==='vr'?`Reward starts at ${money(paymentQuote(state,f,state.player,B.vrBaseReward,false).amount)}; grows with dodges`:f<4?`Next play collection: ${money(paymentQuote(state,f,state.player,B.quarters).amount)}`:p.id==='tickets'?`Ticket: ${money(paymentQuote(state,f,state.player,B.prices.ticket).amount)}`:p.id==='vip'?`VIP ticket: ${money(paymentQuote(state,f,state.player,B.prices.vipticket).amount)}`:p.id==='stage'?`Stage entry: ${money(paymentQuote(state,f,state.player,B.prices.stageentry).amount)}`:p.id==='playground'?`Visit: ${money(paymentQuote(state,f,state.player,B.prices.playvisit).amount)}`:p.id==='packing'?`Delivery: ${money(paymentQuote(state,f,state.player,B.prices.delivery).amount)}`:'Improves your production' }</small>${fs.products[p.id]?'':unlockProgress(p.cost,p.name)}</div><button class="${fs.products[p.id]?'outline-button':'dark-button'}" data-action="product" data-id="${p.id}" ${fs.products[p.id]?'disabled':''}>${fs.products[p.id]?'Open':money(p.cost)}</button></article>`).join('')}</div><p class="fine-print">Player previews include upgrades and fivefold earnings. The full order is paid once; small bonuses carry into later payments. Guests only order unlocked items.</p>`);
}
function tablesDialog(){
  const fs=state.floors[state.floor];if(state.floor===10)return;
  const seatWord=state.floor===5?'Seat':state.floor===8?'Desk':'Table';
  showDialog(`<span class="eyebrow">ROOM FOR EVERYONE</span><h2>A seat at your table.</h2><p>${FLOORS[state.floor].guide||'Guests pay at SERVE, then take their food to a clean table. Clean up only after they finish eating. Without tables, orders are takeaway.'}</p><div class="table-shop">${fs.tables.map((t,i)=>`<article><div><h3>${seatWord} ${i+1}</h3><p>${!t.owned?'A new place to sit':{free:'Clean and ready',reserved:'Guest on the way',occupied:'Eating · cleanup waits',dirty:'Finished eating · needs cleaning'}[t.state]}</p>${t.owned?'':unlockProgress(tableCost(state.floor,i),'table '+(i+1))}${state.floor===7&&t.owned?`<button class="outline-button umbrella-buy" data-action="umbrella" data-id="${i}" ${fs.activity.umbrellas[i]?'disabled':''}>${fs.activity.umbrellas[i]?'Umbrella owned':`Umbrella · ${money(UMBRELLA_COST)}`}</button>`:''}</div><button class="${t.owned?'outline-button':'dark-button'}" data-action="${t.owned?'walk-table':'buy-table'}" data-id="${i}">${t.owned?t.state==='dirty'?'Go clean':'Go to table':`Buy · ${money(tableCost(state.floor,i))}`}</button></article>`).join('')}</div><p class="fine-print">${fs.tables.filter(t=>t.owned).length}/6 tables owned on this floor. Table purchases are separate from your five player upgrades.</p>`);
}
function vrDialog(resume = false) {
  if (!resume && !startVR(state)) return toast('Walk to the VR playground first.');
  showDialog(`<div class="vr-header"><span class="eyebrow">THE VR PLAYGROUND</span><h2>Pixel Run</h2><p>Pick a lane. Dodge the pixels. Keep your three lives.</p></div><div class="vr-stats"><span id="vr-lives"></span><b id="vr-time"></b><span id="vr-score"></span></div><div class="vr-field" id="vr-field"><div class="vr-horizon">DFP / VIRTUAL PLAYGROUND</div><div class="vr-runner" id="vr-runner">${icon('controller')}</div><div id="vr-obstacles"></div></div><div class="vr-controls"><button data-action="vr-left" aria-label="Move left in Pixel Run">←</button><span>← → or A / D<br>Touch a button to switch lanes</span><button data-action="vr-right" aria-label="Move right in Pixel Run">→</button></div><div id="vr-result" hidden></div><p class="fine-print">${B.vrTime} seconds · Reward starts at ${money(paymentQuote(state,3,state.player,B.vrBaseReward,false).amount)} and grows with each dodge. Includes your floor bonus and fivefold earnings.<br>Leaving a run forfeits its reward. No headset needed.</p>`);
  dialog.classList.add('vr-dialog'); save();
}
function refreshVR() {
  const v=state.vr; if(!v || !document.querySelector('#vr-field') || !dialog.open)return;
  document.querySelector('#vr-lives').textContent='♥'.repeat(v.lives)+'♡'.repeat(3-v.lives);
  document.querySelector('#vr-time').textContent=`${Math.max(0,Math.ceil(B.vrTime-v.time))}s`;
  document.querySelector('#vr-score').textContent=`${v.score} dodged`;
  document.querySelector('#vr-runner').style.left=`${(v.lane+0.5)*100/3}%`;
  document.querySelector('#vr-obstacles').innerHTML=v.obstacles.map(o=>`<span class="vr-obstacle ${o.passed?'passed':''}" style="left:${(o.lane+0.5)*100/3}%;top:${o.y*100}%"></span>`).join('');
  if(v.done){const el=document.querySelector('#vr-result');el.hidden=false;if(!el.dataset.done){el.dataset.done='true';el.innerHTML=`<strong>${v.lives?'Nice moves!':'One more round?'}</strong><p>${money(v.reward)} earned · ${v.score} pixels dodged</p><button class="dark-button" data-action="vr-retry">Play again ${icon('arrow')}</button>`;}}
}
app.addEventListener('click', event => {
  sound.unlock(); const button = event.target.closest('button'); if (!button || button.disabled) return;
  if (button.dataset.tab) { selectTab(button.dataset.tab); return; }
  const { action, id, category } = button.dataset, f = Number(button.dataset.floor);
  if(action==='basement-buy')act({type:'basement'});
  if(action==='basement-visit'&&state.basement.unlocked){inBasement=true;selectTab('home');}
  if(action?.startsWith('basement-')||action?.startsWith('security-'))basement.action(action,id);
  if (['employees','elevator'].includes(action)) selectTab(action);
  if (action === 'settings') settingsDialog();
  if (action === 'upgrades') upgradesDialog();
  if (action === 'pet-security') openPetSecurity(button);
  if (action === 'menu') menuDialog();
  if(action==='business-help')showDialog(`<span class="eyebrow">YOUR BUSINESS GUIDE</span><h2>${FLOORS[state.floor].name}</h2><p>${FLOORS[state.floor].guide}</p><div class="business-jobs">${LAYOUTS[state.floor].map(st=>`<button class="outline-button" data-action="business-job" data-station="${st.id}">${st.name}<small>${stationStatus(state,state.floor,st)}</small></button>`).join('')}</div>`);
  if(action==='business-job'){const st=LAYOUTS[state.floor].find(st=>st.id===button.dataset.station);dialog.close();if(st.product&&!state.floors[state.floor].products[st.product])menuDialog();else target={...st.pad};}
  if(action==='drinks-section'){if(state.floor<2){if(state.floors[state.floor].section)target={...LAYOUTS[state.floor].find(st=>st.id===(state.floor===0?'drink':'wine')).pad};else drinksDialog();}}
  if(action==='buy-drinks-section'){if(state.floor<2&&act({type:'section'}))dialog.close();}
  if (action === 'station') { const st=LAYOUTS[state.floor].find(s=>s.id===button.dataset.station);if(st){if(st.kind==='table'&&!state.floors[state.floor].tables[Number(st.id.slice(5))].owned)tablesDialog();else if(st.product&&!state.floors[state.floor].products[st.product]){if(state.floor<2&&['drink','wine'].includes(st.product))drinksDialog();else menuDialog();}else target={...st.pad};} }
  if(action==='tables')tablesDialog();
  if(action==='umbrella'){act({type:'umbrella',id:Number(id)});dialog.close();tablesDialog();}
  if(action==='buy-table'){act({type:'table',id:Number(id)});dialog.close();tablesDialog();}
  if(action==='walk-table'){dialog.close();target={...LAYOUTS[state.floor].find(st=>st.id===`table${id}`).pad};}
  if(action==='area')target=state.player.x>WORLD.diningStart?{...WORLD.kitchen}:{...WORLD.dining};
  if(action==='stop')stopMovement();
  if (action === 'product') { act({type:'product',id});dialog.close();menuDialog(); }
  if (action === 'close') dialog.close();
  if (action === 'return-stock') act({type:'return-stock'});
  if (action === 'vr-start') vrDialog();
  if (action === 'vr-left' || action === 'vr-right') vrInput(state,action==='vr-left'?-1:1);
  if (action === 'vr-retry') { dialog.classList.remove('vr-dialog'); dialog.close(); vrDialog(); }
  if (action === 'visit' && act({ type: 'visit', floor: f })) {inBasement=false;selectTab('home');}
  if (action === 'unlock-floor') act({ type: 'floor', floor: f });
  if (action === 'hire') act({ type: 'hire', id: Number(id), floor: state.floor });
  if (action === 'employee-upgrade') act({ type: 'upgrade', id: Number(id), category });
  if (action === 'fill-best') act({type:'fill-best',floor:f});
  if (action === 'filter') { filterFloor = f; renderPanel(); }
  if (action === 'outfit') act({ type: 'outfit', id });
  if (action === 'player-upgrade') { act({ type: 'upgrade', category }); upgradesDialogRefresh(); }
  if (action === 'section') { act({ type: 'section' }); upgradesDialogRefresh(); }
  if (['sound','motion','effects'].includes(action)) { const setting={sound:'sound',motion:'reducedMotion',effects:'reducedEffects'}[action];state.settings[setting]=!state.settings[setting];save();dialog.close();settingsDialog(); }
  if (action === 'mission') { if (state.tutorial < 5 && state.floor === 0) {if(tutorial()[2]==='menu')menuDialog();else target = LAYOUTS[0].find(st => st.id === tutorial()[2]).pad;} else selectTab(!state.employees.length ? 'employees' : 'elevator'); }
  if (action === 'install') { if (installPrompt) { installPrompt.prompt(); installPrompt = null; } else toast(iosInstallText()); }
  if (action === 'export') { const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(BACKUP_KEY) || JSON.stringify(state); const url = URL.createObjectURL(new Blob([raw], {type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'dfp-local-save.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  if (action === 'update' && save()) registration?.waiting?.postMessage({ type: 'ACTIVATE' });
  if(action==='check-update')checkGameUpdate();
  if(action==='producer-signin'){dialog.close();stopMovement();mountSignInCompletion(true);}
  if (action === 'reload') location.reload();
});
function iosInstallText() { return /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Safari → Share → Add to Home Screen' : 'Browser menu → Install DFP / Add to Home Screen. Try the production preview if unavailable.'; }
function upgradesDialogRefresh() { dialog.close(); upgradesDialog(); }
app.addEventListener('change', event => { if (event.target.matches('[data-assign]')) { act({ type: 'assign', id: Number(event.target.dataset.assign), floor: Number(event.target.value) }); renderPanel(); } });
document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); selectTab('home'); });
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close',()=>{if(dialog.classList.contains('vr-dialog')){dialog.classList.remove('vr-dialog');if(state.vr&&!state.vr.done){state.vr=null;save();}}});
const joy = document.querySelector('#joystick'), knob = document.querySelector('#joystick-knob'); let joyPointer = null, surfacePointer = null;
function stopPath(){target=null;state.player.path=[];state.player.pathKey='';state.player.moving=false;}
function releaseJoy(){joyPointer=null;joystick.x=joystick.y=0;knob.style.transform='';}
function stopMovement(){stopPath();keys.clear();releaseJoy();surfacePointer=null;}
canvas.addEventListener('pointerdown', e => { if (lockBlocked||e.button!==0) return; stopMovement();sound.unlock();const picked=renderer.pick(e.clientX,e.clientY);if(picked.locked){if(picked.station?.startsWith('table'))tablesDialog();else if(state.floor<2&&['drink','wine','drinkStack','drinkCounter'].includes(picked.station))drinksDialog();else menuDialog();return;}surfacePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);target=picked;canvas.focus({preventScroll:true}); });
canvas.addEventListener('pointermove',e=>{if(e.pointerId===surfacePointer)target=renderer.pick(e.clientX,e.clientY);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===surfacePointer){surfacePointer=null;stopPath();}});
const movementKey=e=>({KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright'}[e.code]||e.key.toLowerCase());
window.addEventListener('keydown', e => {const key=movementKey(e);if(e.key==='Escape'){stopMovement();return;}if(dialog.open&&state.vr&&document.querySelector('#vr-field')){if(['arrowleft','a','arrowright','d'].includes(key)){e.preventDefault();if(!e.repeat)vrInput(state,['a','arrowleft'].includes(key)?-1:1);}return;}if(state.story.active||storyView.opened||basement.monitoring||inBasement||dialog.open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);target=null;state.player.path=[];state.player.pathKey="";surfacePointer=null;sound.unlock();}});
window.addEventListener('keyup',e=>{const key=movementKey(e);if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))return;keys.delete(key);if(!keys.size&&!joystick.x&&!joystick.y&&surfacePointer===null)stopPath();});
window.addEventListener('blur',stopMovement);
function joyMove(e) { const r = joy.getBoundingClientRect(), x = e.clientX-r.left-r.width/2, y = e.clientY-r.top-r.height/2, d = Math.max(1,Math.hypot(x,y)/34); joystick.x=x/d/34; joystick.y=y/d/34; knob.style.transform=`translate(${x/d}px,${y/d}px)`; target=null; }
joy.addEventListener('pointerdown', e => { if(joyPointer!==null)return;stopMovement();joyPointer=e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); sound.unlock(); });
joy.addEventListener('pointermove', e => { if(e.pointerId===joyPointer) joyMove(e); });
for(const type of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(type,e=>{if(e.pointerId===joyPointer){releaseJoy();stopPath();}});
document.addEventListener('visibilitychange', () => { paused=document.hidden; last=0; accumulator=0; stopMovement(); save(); });
window.addEventListener('pagehide',save);
function frame(timestamp) {
  const delta = last ? Math.min((timestamp-last)/1000,0.2) : 0; last=timestamp;
  if (!paused && !lockBlocked && sessionReady) {
    accumulator += delta;
    while(accumulator>=B.step) {
      const x=joystick.x + (keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0), y=joystick.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      const playing=activeTab==='home'&&!dialog.open&&!inBasement&&!basement.monitoring;
      step(state,B.step,{x:playing?x:0,y:playing?y:0,target:playing?target:null,pausedPlayer:!playing,monitoring:basement.watching});
      if(target&&Math.hypot(state.player.x-target.x,state.player.y-target.y)<0.12)target=null;
      accumulator-=B.step;
    }
    for(const event of state.events.splice(0)) {renderer.feedback(event,state.time);sound.play(event.kind,state.settings.sound);if(event.kind==='trash'||event.kind==='melt'&&event.floor===state.floor)toast(event.text);if(event.kind==='money'){document.querySelector('#balance').textContent=money(state.money);if(!state.settings.reducedMotion){const balance=document.querySelector('.balance');balance.getAnimations().forEach(a=>a.cancel());balance.animate([{transform:'scale(1)'},{transform:'scale(1.055)',offset:.35},{transform:'scale(1)'}],{duration:260,easing:'ease-out'});}}}
    if(state.revision!==lastRevision || state.time-lastSave>2)save();
  }
  if(storyView.opened){storyView.tick(delta);}
  if(activeTab==='home'&&!paused&&!storyView.opened){if(inBasement||basement.monitoring)basement.draw();else renderer.draw(state,state.time);}
  if(activeTab==='pets'&&!paused)petShop.draw(timestamp);
  refreshVR();
  if(timestamp-lastUI>200){refreshHome();lastUI=timestamp;}
  requestAnimationFrame(frame);
}
if(navigator.locks) navigator.locks.request('dfp-session',{ifAvailable:true},lock=>{if(!lock){lockBlocked=true;document.querySelector('#session-block').hidden=false;return;}sessionReady=true;return new Promise(()=>{});});
else window.addEventListener('storage', e=>{if(e.key===SAVE_KEY){lockBlocked=true;document.querySelector('#session-block').hidden=false;}});
window.addEventListener('beforeinstallprompt', e=>{e.preventDefault();installPrompt=e;});
if('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(async reg=>{
    registration=reg;
    updateReady=!!reg.waiting;
    const watch=()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){updateReady=true;updateMessage='A new version is ready. Save & update to use it.';updateStatus();toast('A fresh batch is ready. Update in Settings.');}});};
    reg.addEventListener('updatefound',watch);watch();updateStatus();
    await navigator.serviceWorker.ready; offlineReady=true;
  }).catch(()=>{saveWarning='Offline download did not finish. Stay online and reload to try again.';});
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading&&updateReady&&save()){reloading=true;location.reload();}});
}
refreshHome(); requestAnimationFrame(frame); if(loaded.warning)toast(loaded.warning);
if(state.vr&&!state.vr.done)vrDialog(true);

if(state.story.active){if(state.story.location==='computer'){inBasement=true;document.querySelector('#home-view').hidden=true;basement.show(true);basement.computer.open();basement.computer.navigate('story-inbox');}else storyView.open();}
