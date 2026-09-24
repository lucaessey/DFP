import './style.css';
import './vr.css';
import './world.css';
import { BALANCE as B, FLOORS, LAYOUTS, OUTFITS, ROSTER, UPGRADE_TYPES, PRODUCTS, tableCost, floorCount, upgradeCount, playerUpgradeCost, employeeUpgradeCost } from './config.js';
import { step, command, capacity, stationStatus, startVR, vrInput } from './simulation.js';
import { loadGame, saveGame, SAVE_KEY, BACKUP_KEY } from './storage.js';
import { Renderer, drawPortrait } from './renderer.js';
import { icon } from './icons.js';
import { Sound } from './audio.js';

const loaded = loadGame(localStorage), state = loaded.state, sound = new Sound();
try { if (!localStorage.getItem(SAVE_KEY) && !localStorage.getItem(BACKUP_KEY)) state.settings.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { state.settings.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches; }
let writable = loaded.writable, activeTab = 'home', filterFloor = 0, target = null, paused = false, last = 0, accumulator = 0, lastSave = 0, lastRevision = -1, lastUI = 0, installPrompt = null, registration = null, offlineReady = false, updateReady = false, saveWarning = loaded.warning, lockBlocked = false;
const keys = new Set(), joystick = { x: 0, y: 0 }, app = document.querySelector('#app');
let sessionReady = !navigator.locks;
const money = n => '$' + Math.floor(n).toLocaleString('en-US');
const html = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
app.innerHTML = `
  <header class="topbar"><a class="brand" href="#" aria-label="DFP Home"><span class="brand-mark">${icon('controller')}</span><span class="brand-word">DFP<span>DEEP FRIED PIXELS</span></span></a><div class="top-tagline">Good food. <span>Great pixels.</span></div><div class="header-actions"><div class="balance"><span class="coin-icon">${icon('coin')}</span><span><small>YOUR BALANCE</small><strong id="balance"></strong></span></div><button class="icon-button" data-action="settings" aria-label="Settings">${icon('gear')}</button></div></header>
  <main id="main"><section id="home-view" class="home-view"><aside class="left-rail"><div class="live-label"><i></i> OPEN FOR BUSINESS</div><span class="eyebrow" id="floor-eyebrow"></span><h1 id="floor-title"></h1><p id="floor-description"></p><div class="floor-chip">${icon('elevator')}<span id="floor-chip"></span><span class="chip-dot">●</span></div><div class="mission card"><div class="card-overline">YOUR NEXT LITTLE WIN ${icon('star')}</div><h2 id="mission-title"></h2><p id="mission-text"></p><div class="progress-track"><span id="mission-progress"></span></div><div class="mission-meta"><span id="mission-count"></span><button class="text-button" data-action="mission">Let's go ${icon('arrow')}</button></div></div><div class="tip"><span>✦</span><p>A little hustle.<br>A whole lot of crunch.</p></div></aside>
  <section class="play-area" aria-label="Restaurant gameplay"><div class="scene-top"><span class="scene-badge"><i></i> <span id="scene-name">THE TAKEOUT</span></span><span class="scene-stats">${icon('people')} <b id="customer-count">0</b> guests</span></div><canvas id="game" tabindex="0" aria-label="Isometric restaurant. Move with WASD, arrow keys, joystick, or tap a station." role="img"></canvas><div class="floor-guide" id="floor-guide"></div><div class="scene-bottom"><div class="carry-badge">${icon('bag')}<span id="carry-label"></span></div><div class="movement-hint"><kbd>W</kbd><span class="key-row"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span><span>to move <em>or click a station</em></span></div><button class="small-button upgrade-mobile" data-action="upgrades">${icon('bolt')} Upgrade</button></div><div id="joystick" role="slider" aria-label="Movement joystick" tabindex="0"><div id="joystick-knob">${icon('controller')}</div></div></section>
  <aside class="right-rail"><div class="shift-card card"><div class="card-overline">LOOK AT YOU GROW ${icon('up')}</div><h2>This little empire.</h2><div class="stat-line"><span>Happy customers</span><strong id="served-count">0</strong></div><div class="stat-line"><span>Floor earnings</span><strong id="floor-earnings">$0</strong></div><div class="stat-line"><span>Your team</span><strong id="team-count">0 / 12</strong></div><button class="outline-button" data-action="employees">${icon('people')} Meet your team ${icon('arrow')}</button></div><div class="upgrade-card card"><div class="upgrade-card-icon">${icon('bolt')}</div><h2>A little extra oomph.</h2><p>Faster feet. Bigger stacks.<br>Even better tips.</p><button class="dark-button" data-action="upgrades">Upgrade yourself ${icon('arrow')}</button><span id="upgrade-allowance"></span></div><div class="next-floor-card"><span id="next-floor-icon">${icon('wine')}</span><div><small>UP NEXT</small><b id="next-floor-name">Pixel & Pour</b><span id="next-floor-price">Unlock for $650</span></div><button class="icon-button" data-action="elevator" aria-label="View floors">${icon('arrow')}</button></div></aside></section><section id="panel-view" class="panel-view" hidden></section></main>
  <footer class="bottom-shell"><div class="save-status"><i id="save-dot"></i><span id="save-status">Saved on this device</span></div><nav class="bottom-nav" aria-label="Main navigation">${[['elevator','elevator','Elevator'],['home','home','Home'],['outfits','shirt','Outfits'],['employees','people','Employees']].map(([id,i,label]) => `<button data-tab="${id}" class="nav-tab ${id === 'home' ? 'active' : ''}" aria-current="${id === 'home' ? 'page' : 'false'}">${icon(i)}<span>${label}</span>${id === 'home' ? '<i></i>' : ''}</button>`).join('')}</nav><div class="made-with">FRESHLY FRIED. <span>ALWAYS PLAYFUL.</span></div></footer>
  <div id="toast" role="status" aria-live="polite"></div><dialog id="dialog"><div id="dialog-content"></div></dialog><div id="session-block" hidden><div class="card"><h2>DFP is open in another tab.</h2><p>Keep playing there, or close that tab and reload this one.</p><button class="dark-button" data-action="reload">Reload DFP</button></div></div>`;
const canvas = document.querySelector('#game'), renderer = new Renderer(canvas), dialog = document.querySelector('#dialog');
renderer.onCue=kind=>sound.play(kind,state.settings.sound);
let toastTimer;
function toast(message) { const t = document.querySelector('#toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3500); }
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
  if (!result.ok) { toast(result.message); return false; }
  save(); sound.play('purchase', state.settings.sound); renderPanel(); refreshHome();
  if(c.type!=='visit')renderer.feedback({text:c.type==='hire'?'Welcome to DFP!':c.type==='product'||c.type==='floor'?'Unlocked!':c.type==='upgrade'?'Upgraded!':c.type==='table'?'New table!':'Looking good!',kind:'purchase',floor:state.floor,x:state.player.x,y:state.player.y},state.time);
  toast(c.type === 'visit' ? `Welcome to ${FLOORS[state.floor].name}` : c.type === 'assign' ? 'Transferred safely. Upgrades kept.' : c.type === 'hire' ? `${ROSTER[c.id].name} is on the team!` : c.type === 'outfit' ? 'Looking good. Outfit equipped!' : 'A little upgrade. A big difference.');
  return true;
}
function tutorial() {
  if(!state.floors[0].products.controller)return ['Your first menu item.','Unlock Crispy Controller for $50 to open your kitchen.','menu'];
  return [
    ['Let’s make something crispy.', 'Walk to PREP. Stay in the ring to shape your first batch.', 'prep'],
    ['Time for a golden glow.', 'Walk to FRY to start the fryer. A batch takes a moment.', 'fry'],
    ['Stack ’em up.', 'Walk to PICK UP and collect a freshly fried controller.', 'pickup'],
    ['Make a tasty little stack.', 'Walk to STACK FOOD to unload onto the counter.', 'stack'],
    ['Your first happy customer.', 'Stand in the middle SERVE circle to hand out food and collect payment.', 'counter'],
    ['Build your little dream team.', 'Hire your first helper. They’ll keep the kitchen moving.', null],
  ][state.tutorial];
}
function refreshHome() {
  const f = FLOORS[state.floor], fs = state.floors[state.floor], t = tutorial();
  document.querySelector('#balance').textContent = money(state.money);
  document.querySelector('#floor-eyebrow').textContent = f.eyebrow;
  document.querySelector('#floor-title').textContent = f.name + '.';
  document.querySelector('#floor-description').textContent = f.description;
  document.querySelector('#floor-chip').textContent = `Floor ${state.floor + 1} of 4`;
  document.querySelector('#scene-name').textContent = f.short.toUpperCase();
  document.querySelector('#customer-count').textContent = fs.customers.filter(c => c.state !== 'leaving').length;
  document.querySelector('#carry-label').textContent = `${state.player.bag.length} / ${capacity(state, state.player, state.floor)} carried`;
  document.querySelector('#served-count').textContent = fs.served;
  document.querySelector('#floor-earnings').textContent = money(fs.revenue);
  document.querySelector('#team-count').textContent = `${floorCount(state, state.floor)} / 12`;
  document.querySelector('#upgrade-allowance').textContent = `${upgradeCount(fs.upgrades)}/5 upgrades purchased on this floor`;
  const early = state.tutorial < 5 && state.floor === 0, next = FLOORS.find(f => !state.floors[f.id].unlocked);
  document.querySelector('#mission-title').textContent = early ? t[0] : !state.employees.length ? 'Build your little dream team.' : next ? 'Next stop, new possibilities.' : 'Make every floor yours.';
  document.querySelector('#mission-text').textContent = early ? t[1] : !state.employees.length ? 'Hire your first helper. They’ll keep the kitchen moving.' : next ? `Save ${money(next.cost)} to open ${next.name}. Your helpers keep earning while you explore.` : 'Grow your team, unlock every section, and find your favorite outfit.';
  document.querySelector('#mission-progress').style.width = `${early ? state.tutorial * 20 : next ? Math.min(100, state.money / next.cost * 100) : 100}%`;
  document.querySelector('#mission-count').textContent = early ? `${state.tutorial} / 5 first steps` : next ? `${money(state.money)} / ${money(next.cost)}` : 'All four floors open';
  document.querySelector('#next-floor-name').textContent = next?.name || 'The whole DFP family';
  document.querySelector('#next-floor-price').textContent = next ? `Unlock for ${money(next.cost)}` : 'Four floors. Endless possibilities.';
  document.querySelector('#next-floor-icon').innerHTML = icon(next?.icon || 'star');
  const guide = document.querySelector('#floor-guide');
  const current = LAYOUTS[state.floor].find(st => st.id === state.player.action);
  guide.textContent = early ? t[1] : current ? `${current.name} · ${stationStatus(state, state.floor, current)}` : state.floor === 1 ? 'Collect meals → stack food → SERVE → tables → clean' : state.floor === 2 ? 'Collect stock → fill shelves → serve checkout' : state.floor === 3 ? 'Let guests play. Walk to a machine to collect quarters.' : 'Prep → fry → pick up → stack food → serve.';
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
  tablesButton.innerHTML=`${icon('people')} Tables <b>${fs.tables.filter(t=>t.owned).length}/6</b>`;
  let areaButton=document.querySelector('#area-button');if(!areaButton){areaButton=document.createElement('button');areaButton.id='area-button';areaButton.dataset.action='area';areaButton.className='small-button';document.querySelector('.play-area').append(areaButton);}
  areaButton.textContent=state.player.x>11?'← Kitchen':'Dining area →';
}
function selectTab(tab) {
  activeTab = tab; target = null; keys.clear(); joystick.x = joystick.y = 0;
  document.querySelector('#home-view').hidden = tab !== 'home'; document.querySelector('#panel-view').hidden = tab === 'home';
  document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); b.setAttribute('aria-current', b.dataset.tab === tab ? 'page' : 'false'); });
  if (tab === 'employees') filterFloor = state.floor;
  renderPanel(); refreshHome();
}
function panelHeading(eyebrow, title, description) { return `<div class="panel-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div><span class="panel-decor">✦</span></div>`; }
function renderPanel() {
  if (activeTab === 'home') return;
  const panel = document.querySelector('#panel-view');
  if (activeTab === 'elevator') {
    panel.innerHTML = panelHeading('A LITTLE HIGHER, A LITTLE HAPPIER', 'Going up?', 'Four floors. Four ways to make someone’s day.') + `<div class="floor-grid">${FLOORS.map(f => { const fs = state.floors[f.id], current = state.floor === f.id; return `<article class="floor-card ${fs.unlocked ? '' : 'locked'}" style="--accent:${f.color};--pale:${f.pale}"><div class="floor-illustration"><span class="floor-number">0${f.id + 1}</span><span class="floor-art">${icon(f.icon)}</span><span class="floor-card-badge">${current ? 'YOU ARE HERE' : fs.unlocked ? 'OPEN FOR BUSINESS' : 'ROOM TO GROW'}</span></div><div class="floor-card-body"><h2>${f.name}</h2><p>${f.description}</p><div class="floor-detail">${fs.unlocked ? `${floorCount(state,f.id)} / 12 employees · ${money(fs.revenue)} earned` : f.id > 0 && !state.floors[f.id - 1].unlocked ? `Open floor ${f.id} first` : 'Ready for your next chapter'}</div><button class="${current ? 'outline-button' : 'dark-button'}" data-action="${fs.unlocked ? 'visit' : 'unlock-floor'}" data-floor="${f.id}" ${!fs.unlocked && !state.floors[f.id - 1]?.unlocked ? 'disabled' : ''}>${current ? 'Back to your restaurant' : fs.unlocked ? 'Visit floor' : `Unlock · ${money(f.cost)}`} ${icon(fs.unlocked ? 'arrow' : 'lock')}</button></div></article>`; }).join('')}</div><p class="panel-note">${icon('people')} Your assigned team keeps working on every open floor while you play.</p>`;
  }
  if (activeTab === 'outfits') {
    panel.innerHTML = panelHeading('A FRESH LOOK FOR EVERY FLOOR', 'Wear your flavor.', 'All style. All earned in-game. Find a look that feels like you.') + `<div class="outfit-grid">${OUTFITS.map(o => { const owned = state.outfits.includes(o.id), equipped = state.outfit === o.id, open = state.floors[o.floor].unlocked; return `<article class="outfit-card ${equipped ? 'equipped' : ''}"><div class="outfit-preview" style="--outfit:${o.color}"><span class="outfit-badge">${equipped ? 'EQUIPPED' : owned ? 'IN YOUR WARDROBE' : `FLOOR ${o.floor + 1}`}</span><canvas width="160" height="150" data-outfit="${o.id}" aria-label="${o.subtitle} preview"></canvas></div><div class="outfit-body"><small>${o.subtitle}</small><h2>${o.name}</h2><button class="${equipped ? 'outline-button' : 'dark-button'}" data-action="outfit" data-id="${o.id}" ${equipped || !open ? 'disabled' : ''}>${equipped ? 'Looking good' : !open ? `Unlock floor ${o.floor + 1}` : owned ? 'Wear this' : `Unlock · ${money(o.price)}`} ${icon(equipped ? 'check' : open ? 'shirt' : 'lock')}</button></div></article>`; }).join('')}</div>`;
    panel.querySelectorAll('[data-outfit]').forEach(c => drawPortrait(c, OUTFITS.find(o => o.id === c.dataset.outfit)));
  }
  if (activeTab === 'employees') {
    panel.innerHTML = panelHeading('MANY HANDS. MORE HAPPY CUSTOMERS.', 'Your dream team.', `${state.employees.length} / 20 hired. Five unique faces from every floor.`) + `<div class="roster-tabs">${FLOORS.map(f => `<button class="${filterFloor === f.id ? 'selected' : ''}" data-action="filter" data-floor="${f.id}">${icon(f.icon)} ${f.short}<span>${floorCount(state,f.id)} / 12 working</span></button>`).join('')}</div><p class="roster-note">Hires from ${FLOORS[filterFloor].name}. Assign them to any open floor. Each skill has 3 upgrades.</p><div class="employee-grid">${ROSTER.filter(e => e.origin === filterFloor).map(def => { const e = state.employees.find(e => e.id === def.id), open = state.floors[def.origin].unlocked; return `<article class="employee-card"><div class="employee-header"><div class="employee-avatar" style="background:${def.color}33;color:${def.color}">${icon('people')}</div><div><h2>${def.name}</h2><span>${e ? 'All-rounder · on the job' : 'All-rounder · ready to help'}</span></div>${e ? '<span class="working-dot"></span>' : ''}</div>${e ? `<label class="assignment-label">WORKING ON<select data-assign="${e.id}" aria-label="Assign ${def.name} to floor">${FLOORS.map(f => `<option value="${f.id}" ${f.id === e.floor ? 'selected' : ''} ${!state.floors[f.id].unlocked ? 'disabled' : ''}>${f.id + 1} · ${f.name} (${floorCount(state,f.id)}/12)</option>`).join('')}</select></label><div class="employee-upgrades">${UPGRADE_TYPES.map(k => `<button data-action="employee-upgrade" data-id="${e.id}" data-category="${k}" ${e.upgrades[k] >= 3 ? 'disabled' : ''}><span>${icon(k === 'speed' ? 'bolt' : k === 'capacity' ? 'bag' : 'coin')} ${k}<b>${e.upgrades[k]}/3</b></span><small>${e.upgrades[k] >= 3 ? 'MAXED' : money(employeeUpgradeCost(e,k)) + ' +'}</small></button>`).join('')}</div>` : `<p>Preps, carries, serves, and collects.<br>One very useful pair of hands.</p><button class="dark-button" data-action="hire" data-id="${def.id}" ${!open ? 'disabled' : ''}>${open ? `Hire · ${money(def.cost)}` : `Unlock floor ${def.origin + 1}`} ${icon(open ? 'people' : 'lock')}</button>`}</article>`; }).join('')}</div><p class="panel-note">${icon('bag')} Transfers return carried stock to the previous floor. Skills always stay with the employee.</p>`;
  }
}
function showDialog(content) { document.querySelector('#dialog-content').innerHTML = `<button class="dialog-close icon-button" data-action="close" aria-label="Close">${icon('close')}</button>${content}`; target = null; keys.clear(); joystick.x = joystick.y = 0; dialog.showModal(); }
function upgradesDialog() {
  const f = state.floor, fs = state.floors[f], used = upgradeCount(fs.upgrades);
  showDialog(`<span class="eyebrow">A LITTLE EXTRA OOMPH</span><h2>Make it your superpower.</h2><p>Upgrades apply to ${FLOORS[f].name}.</p><div class="allowance"><b>${used}/5</b> upgrades purchased <span>${'●'.repeat(used)}${'○'.repeat(5-used)}</span></div><div class="upgrade-options">${UPGRADE_TYPES.map(k => `<button data-action="player-upgrade" data-category="${k}" ${used >= 5 ? 'disabled' : ''}><span class="upgrade-symbol">${icon(k === 'speed' ? 'bolt' : k === 'capacity' ? 'bag' : 'coin')}</span><span><b>${k === 'speed' ? 'Faster feet' : k === 'capacity' ? 'Bigger stacks' : 'Better earnings'}</b><small>${k === 'speed' ? '+15% movement speed' : k === 'capacity' ? '+1 carrying capacity' : '+20% of base income'} · Lv. ${fs.upgrades[k]}</small></span><strong>${used >= 5 ? 'MAX' : money(playerUpgradeCost(state,f))}</strong></button>`).join('')}</div>${!fs.section ? `<div class="section-unlock"><h3>A little room to grow.</h3><p>Open the ${FLOORS[f].section.toLowerCase()}.</p><button class="dark-button" data-action="section">Unlock ${FLOORS[f].section} · ${money(FLOORS[f].sectionCost)}</button></div>` : ''}<p class="fine-print">5 purchases combined across all three skills per floor. Employee profit adds +15% per level to the same base payment; bonuses apply once.</p>`);
}
function settingsDialog() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  showDialog(`<span class="eyebrow">YOUR LITTLE CORNER</span><h2>Make yourself at home.</h2><div class="setting-row"><span>${icon('sound')} Kitchen sounds</span><button data-action="sound" class="toggle ${state.settings.sound ? 'on' : ''}" aria-label="Toggle sound" aria-pressed="${state.settings.sound}"></button></div><div class="setting-row"><span>${icon('star')} Reduced motion</span><button data-action="motion" class="toggle ${state.settings.reducedMotion ? 'on' : ''}" aria-label="Toggle reduced motion" aria-pressed="${state.settings.reducedMotion}"></button></div><div class="setting-row"><span>${icon('bolt')} Reduced effects</span><button data-action="effects" class="toggle ${state.settings.reducedEffects ? 'on' : ''}" aria-label="Toggle reduced effects" aria-pressed="${!!state.settings.reducedEffects}"></button></div><p class="fine-print">Lighter shadows and fewer effects for smoother play.</p><div class="settings-section"><h3>A home on your home screen.</h3><p>${ios ? 'In Safari, tap Share, then Add to Home Screen.' : installPrompt ? 'Install DFP for its own window and easy access.' : 'Use your browser’s Install app or Add to Home Screen menu when available. Installation requires HTTPS or localhost.'}</p><button class="outline-button" data-action="install">${icon('download')} ${installPrompt ? 'Install DFP' : 'Installation guidance'}</button><p class="offline-status">${offlineReady ? '● Ready to play offline' : import.meta.env.DEV ? 'Development preview · offline mode is available in the production build.' : 'Downloading the ingredients for offline play…'}</p>${updateReady ? '<button class="dark-button" data-action="update">Save & update DFP</button>' : ''}</div><div class="settings-section"><h3>Saved right here.</h3><p>Progress is device-local, in this browser. Clearing browser data removes it. There are no accounts or cloud saves. Your team earns only while the game is active.</p>${saveWarning ? `<p class="warning-text">${html(saveWarning)}</p>` : ''}<button class="outline-button" data-action="export">${icon('download')} Export local save</button></div><p class="fine-print">DFP · Deep Fried Pixels · v1.0<br>Original art and sound. Always freshly fried.</p>`);
}
function menuDialog() {
  const f=state.floor,fs=state.floors[f];
  showDialog(`<span class="eyebrow">BUILD YOUR MENU, ONE ITEM AT A TIME</span><h2>Something worth unlocking.</h2><p>Every product starts here. ${FLOORS[f].name}.</p><div class="product-list">${PRODUCTS.filter(p=>p.floor===f).map(p=>`<article><span class="product-symbol">${icon(p.icon)}</span><div><h3>${p.name}</h3><p>${p.description}</p><small>${B.prices[p.id]?`Earn $${B.prices[p.id]} per sale before upgrades`:p.id==='vr'?`Earn $${B.vrBaseReward} + $${B.vrDodgeReward} per dodge`:`Earn $${B.quarters} per completed play`}</small></div><button class="${fs.products[p.id]?'outline-button':'dark-button'}" data-action="product" data-id="${p.id}" ${fs.products[p.id]?'disabled':''}>${fs.products[p.id]?'Open':money(p.cost)}</button></article>`).join('')}</div><p class="fine-print">Your starting cash covers your first controller unlock. Guests only order items you have opened.</p>`);
}
function tablesDialog(){
  const fs=state.floors[state.floor];
  showDialog(`<span class="eyebrow">ROOM FOR EVERYONE</span><h2>A seat at your table.</h2><p>Guests pay at SERVE, then take their food to a clean table. Clean up only after they finish eating. Without tables, orders are takeaway.</p><div class="table-shop">${fs.tables.map((t,i)=>`<article><div><h3>Table ${i+1}</h3><p>${!t.owned?'A new place to sit':{free:'Clean and ready',reserved:'Guest on the way',occupied:'Eating · cleanup waits',dirty:'Finished eating · needs cleaning'}[t.state]}</p></div><button class="${t.owned?'outline-button':'dark-button'}" data-action="${t.owned?'walk-table':'buy-table'}" data-id="${i}">${t.owned?t.state==='dirty'?'Go clean':'Go to table':`Buy · ${money(tableCost(state.floor,i))}`}</button></article>`).join('')}</div><p class="fine-print">${fs.tables.filter(t=>t.owned).length}/6 tables owned on this floor. Table purchases are separate from your five player upgrades.</p>`);
}
function vrDialog(resume = false) {
  if (!resume && !startVR(state)) return toast('Walk to the VR playground first.');
  showDialog(`<div class="vr-header"><span class="eyebrow">THE VR PLAYGROUND</span><h2>Pixel Run</h2><p>Pick a lane. Dodge the pixels. Keep your three lives.</p></div><div class="vr-stats"><span id="vr-lives"></span><b id="vr-time"></b><span id="vr-score"></span></div><div class="vr-field" id="vr-field"><div class="vr-horizon">DFP / VIRTUAL PLAYGROUND</div><div class="vr-runner" id="vr-runner">${icon('controller')}</div><div id="vr-obstacles"></div></div><div class="vr-controls"><button data-action="vr-left" aria-label="Move left in Pixel Run">←</button><span>← → or A / D<br>Touch a button to switch lanes</span><button data-action="vr-right" aria-label="Move right in Pixel Run">→</button></div><div id="vr-result" hidden></div><p class="fine-print">${B.vrTime} seconds · $${B.vrBaseReward} + $${B.vrDodgeReward} per dodge, before your floor profit bonus.<br>Leaving a run forfeits its reward. No headset needed.</p>`);
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
  if (['employees','elevator'].includes(action)) selectTab(action);
  if (action === 'settings') settingsDialog();
  if (action === 'upgrades') upgradesDialog();
  if (action === 'menu') menuDialog();
  if (action === 'station') { const st=LAYOUTS[state.floor].find(s=>s.id===button.dataset.station);if(st){if(st.kind==='table'&&!state.floors[state.floor].tables[Number(st.id.slice(5))].owned)tablesDialog();else if(st.product&&!state.floors[state.floor].products[st.product])menuDialog();else target={...st.pad};} }
  if(action==='tables')tablesDialog();
  if(action==='buy-table'){act({type:'table',id:Number(id)});dialog.close();tablesDialog();}
  if(action==='walk-table'){dialog.close();target={...LAYOUTS[state.floor].find(st=>st.id===`table${id}`).pad};}
  if(action==='area')target=state.player.x>11?{x:6,y:5}:{x:16,y:7.4};
  if (action === 'product') { act({type:'product',id});dialog.close();menuDialog(); }
  if (action === 'close') dialog.close();
  if (action === 'return-stock') act({type:'return-stock'});
  if (action === 'vr-start') vrDialog();
  if (action === 'vr-left' || action === 'vr-right') vrInput(state,action==='vr-left'?-1:1);
  if (action === 'vr-retry') { dialog.classList.remove('vr-dialog'); dialog.close(); vrDialog(); }
  if (action === 'visit' && act({ type: 'visit', floor: f })) selectTab('home');
  if (action === 'unlock-floor') act({ type: 'floor', floor: f });
  if (action === 'hire') act({ type: 'hire', id: Number(id), floor: state.floor });
  if (action === 'employee-upgrade') act({ type: 'upgrade', id: Number(id), category });
  if (action === 'filter') { filterFloor = f; renderPanel(); }
  if (action === 'outfit') act({ type: 'outfit', id });
  if (action === 'player-upgrade') { act({ type: 'upgrade', category }); upgradesDialogRefresh(); }
  if (action === 'section') { act({ type: 'section' }); upgradesDialogRefresh(); }
  if (['sound','motion','effects'].includes(action)) { const setting={sound:'sound',motion:'reducedMotion',effects:'reducedEffects'}[action];state.settings[setting]=!state.settings[setting];save();dialog.close();settingsDialog(); }
  if (action === 'mission') { if (state.tutorial < 5 && state.floor === 0) {if(tutorial()[2]==='menu')menuDialog();else target = LAYOUTS[0].find(st => st.id === tutorial()[2]).pad;} else selectTab(!state.employees.length ? 'employees' : 'elevator'); }
  if (action === 'install') { if (installPrompt) { installPrompt.prompt(); installPrompt = null; } else toast(iosInstallText()); }
  if (action === 'export') { const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(BACKUP_KEY) || JSON.stringify(state); const url = URL.createObjectURL(new Blob([raw], {type:'application/json'})); const a = document.createElement('a'); a.href = url; a.download = 'dfp-local-save.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  if (action === 'update' && save()) registration?.waiting?.postMessage({ type: 'ACTIVATE' });
  if (action === 'reload') location.reload();
});
function iosInstallText() { return /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Safari → Share → Add to Home Screen' : 'Browser menu → Install DFP / Add to Home Screen. Try the production preview if unavailable.'; }
function upgradesDialogRefresh() { dialog.close(); upgradesDialog(); }
app.addEventListener('change', event => { if (event.target.matches('[data-assign]')) { act({ type: 'assign', id: Number(event.target.dataset.assign), floor: Number(event.target.value) }); renderPanel(); } });
document.querySelector('.brand').addEventListener('click', e => { e.preventDefault(); selectTab('home'); });
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
dialog.addEventListener('close',()=>{if(dialog.classList.contains('vr-dialog')){dialog.classList.remove('vr-dialog');if(state.vr&&!state.vr.done){state.vr=null;save();}}});
canvas.addEventListener('pointerdown', e => { if (lockBlocked) return; sound.unlock(); const picked = renderer.pick(e.clientX, e.clientY); if (picked.locked) { if(picked.station?.startsWith('table'))tablesDialog();else menuDialog(); return; } target = picked; canvas.focus({preventScroll:true}); });
window.addEventListener('keydown', e => { if (dialog.open && state.vr && document.querySelector('#vr-field')) { if(['arrowleft','a','arrowright','d'].includes(e.key.toLowerCase())){e.preventDefault();if(!e.repeat)vrInput(state,['a','arrowleft'].includes(e.key.toLowerCase())?-1:1);}return;} if (dialog.open || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) { e.preventDefault(); keys.add(e.key.toLowerCase()); target = null; sound.unlock(); } });
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => { keys.clear(); joystick.x = joystick.y = 0; });
const joy = document.querySelector('#joystick'), knob = document.querySelector('#joystick-knob'); let joyPointer = null;
function joyMove(e) { const r = joy.getBoundingClientRect(), x = e.clientX-r.left-r.width/2, y = e.clientY-r.top-r.height/2, d = Math.max(1,Math.hypot(x,y)/34); joystick.x=x/d/34; joystick.y=y/d/34; knob.style.transform=`translate(${x/d}px,${y/d}px)`; target=null; }
joy.addEventListener('pointerdown', e => { joyPointer=e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); sound.unlock(); });
joy.addEventListener('pointermove', e => { if(e.pointerId===joyPointer) joyMove(e); });
const releaseJoy = () => { joyPointer=null; joystick.x=joystick.y=0; knob.style.transform=''; };
joy.addEventListener('pointerup',releaseJoy); joy.addEventListener('pointercancel',releaseJoy); joy.addEventListener('lostpointercapture',releaseJoy);
document.addEventListener('visibilitychange', () => { paused=document.hidden; last=0; accumulator=0; keys.clear(); releaseJoy(); save(); });
window.addEventListener('pagehide',save);
function frame(timestamp) {
  const delta = last ? Math.min((timestamp-last)/1000,0.2) : 0; last=timestamp;
  if (!paused && !lockBlocked && sessionReady) {
    accumulator += delta;
    while(accumulator>=B.step) {
      const x=joystick.x + (keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0), y=joystick.y+(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      step(state,B.step,{x:activeTab==='home'&&!dialog.open?x:0,y:activeTab==='home'&&!dialog.open?y:0,target:activeTab==='home'&&!dialog.open?target:null,pausedPlayer:activeTab!=='home'||dialog.open});
      if(target&&Math.hypot(state.player.x-target.x,state.player.y-target.y)<0.12)target=null;
      accumulator-=B.step;
    }
    for(const event of state.events.splice(0)) {renderer.feedback(event,state.time);sound.play(event.kind,state.settings.sound);if(event.kind==='trash')toast(event.text);}
    if(state.revision!==lastRevision || state.time-lastSave>2)save();
  }
  if(activeTab==='home'&&!paused)renderer.draw(state,state.time);
  refreshVR();
  if(timestamp-lastUI>200){refreshHome();lastUI=timestamp;}
  requestAnimationFrame(frame);
}
if(navigator.locks) navigator.locks.request('dfp-session',{ifAvailable:true},lock=>{if(!lock){lockBlocked=true;document.querySelector('#session-block').hidden=false;return;}sessionReady=true;return new Promise(()=>{});});
else window.addEventListener('storage', e=>{if(e.key===SAVE_KEY){lockBlocked=true;document.querySelector('#session-block').hidden=false;}});
window.addEventListener('beforeinstallprompt', e=>{e.preventDefault();installPrompt=e;});
if('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {scope:import.meta.env.BASE_URL}).then(async reg=>{
    registration=reg;
    await navigator.serviceWorker.ready; offlineReady=true;
    updateReady=!!reg.waiting;
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){updateReady=true;toast('A fresh batch is ready. Update in Settings.');}});});
  }).catch(()=>{saveWarning='Offline download did not finish. Stay online and reload to try again.';});
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!reloading&&updateReady){reloading=true;location.reload();}});
}
refreshHome(); requestAnimationFrame(frame); if(loaded.warning)toast(loaded.warning);
if(state.vr&&!state.vr.done)vrDialog(true);
