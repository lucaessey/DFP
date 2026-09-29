import {icon} from './icons.js';
import {COMPUTER_GAMES,EMAIL_PRICE,EMAIL_CATEGORIES} from './computer.js';
import {FURNITURE,SECURITY_PRICE,furnished} from './security.js';
import './computer.css';
import {PeopleView} from './people/view.js';
import {commentsClient} from './people/client.js';

export class ComputerView {
 constructor(state,{purchase,save,openSecurity,closeSecurity,onClose}){
  Object.assign(this,{state,purchase,save,openSecurity,closeSecurity,onClose,opened:false,page:'desktop',game:null,frame:null,loadTimer:null});
  this.root=document.createElement('section');this.root.id='computer-view';this.root.hidden=true;this.root.setAttribute('aria-label','Basement computer');
  this.root.innerHTML=`<div class="computer-shell"><header class="computer-header"><div><span class="computer-brand">PIXEL DESK <i></i></span><h1 id="computer-title">Your little desktop.</h1></div><span id="computer-balance"></span><button data-computer="dfp" class="computer-button computer-exit">Back to DFP ${icon('close')}</button></header><nav class="computer-toolbar"><button data-computer="desktop" class="computer-button">${icon('home')} Back to Computer</button><span id="computer-location">DESKTOP</span></nav><div id="computer-screen" class="computer-screen" tabindex="-1"></div><footer class="computer-foot"><span>DFP · DOWNSTAIRS EDITION</span><span id="computer-connection"></span></footer></div>`;
  document.querySelector('#app').append(this.root);this.screen=this.root.querySelector('#computer-screen');this.people=new PeopleView(this);
  this.root.addEventListener('click',event=>{const b=event.target.closest('[data-computer]');if(b&&!b.disabled)this.action(b.dataset.computer,b.dataset.id);});
  window.addEventListener('keydown',e=>{if(!this.opened||this.page==='security'||e.key!=='Escape')return;e.preventDefault();this.page==='desktop'?this.close():this.navigate('desktop');});
  window.addEventListener('offline',()=>{if(this.game)this.gameError('You’re offline. Your game is still owned. Connect to the internet, then try again.');this.update();});
  window.addEventListener('online',()=>this.update());
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.game){this.gameError('Game paused while DFP was away. Relaunch to continue; your DFP purchases are saved.');this.save();}});
 }
 open(){if(!this.state.basement.computer.owned)return;this.opened=true;this.navigate('desktop');if(commentsClient.configured)commentsClient.init().then(()=>commentsClient.checkOwner()).catch(()=>{});}
 close(){if(!this.opened)return;this.people.close();this.closeSecurity();this.unloadGame();this.opened=false;this.root.hidden=true;this.save();this.onClose();}
 update(){
  this.root.querySelector('#computer-balance').textContent=`${this.state.money<0?'−':''}$${Math.abs(this.state.money).toLocaleString('en-US')}`;
  this.root.querySelector('#computer-connection').textContent=navigator.onLine?'● Local apps ready':'● Offline · local apps ready';
 }
 navigate(page,id){
  this.people.close();this.screen.classList.remove('people-screen');this.closeSecurity();this.unloadGame();this.page=page;this.root.hidden=false;this.root.classList.remove('playing');this.update();
  const c=this.state.basement.computer;
  const title={desktop:'Your little desktop.',security:'Security.',email:'You’ve got mail.',store:'A little play time.',inbox:'The inbox.',message:'A note for DFP.'}[page]||'Your little desktop.';
  this.root.querySelector('#computer-title').textContent=title;this.root.querySelector('#computer-location').textContent=page==='desktop'?'DESKTOP':page.toUpperCase();this.root.querySelector('[data-computer="desktop"]').hidden=page==='desktop';
  if(['people','producer','producer-signin','add-comment'].includes(page)){
   if(['people','add-comment'].includes(page)&&!c.email)return this.navigate('email');
   this.root.querySelector('#computer-title').textContent=page==='producer'?'Producer.':page==='producer-signin'?'Producer Sign-in.':'People Comments.';this.people.show(page);this.screen.scrollTop=0;return;
  }
  if(page==='desktop'){
   this.screen.innerHTML=`<div class="desktop-welcome"><span class="computer-kicker">HELLO, BOSS.</span><h2>A little work.<br>A little play.</h2><p>Your downstairs command center.</p></div><div class="desktop-apps"><button data-computer="security" class="desktop-app app-security">${icon('shield')}<strong>Security</strong><span>${this.state.basement.security.owned?'✓ Owned · Open cameras':`Locked · $${SECURITY_PRICE}`}</span></button><button data-computer="email" class="desktop-app app-email">${icon('email')}<strong>Email</strong><span>${c.email?'✓ Owned · Read inbox':`Locked · $${EMAIL_PRICE}`}</span></button><button data-computer="store" class="desktop-app app-store">${icon('controller')}<strong>Game Store</strong><span>${COMPUTER_GAMES.filter(g=>c.games[g.id]).length} / 3 games owned</span></button>${commentsClient.owner?`<button data-computer="producer" class="desktop-app app-producer">${icon('shield')}<strong>Producer</strong><span>Verified owner · Private inbox</span></button>`:''}</div><button class="producer-entry" data-computer="producer-signin">${commentsClient.owner?'Producer account':'Producer Sign-in'}</button><p class="computer-note">Security and your inbox work offline. Store games may need the internet.</p>`;
  }else if(page==='security'){
   this.screen.innerHTML=`<article class="computer-card security-setup">${icon('shield')}<h2>Your upstairs lookout.</h2><p>Furnish the lounge, then install security. Your camera follows the highest open floor.</p><ul id="security-requirements">${FURNITURE.map(p=>`<li class="${this.state.basement.furniture[p.id]?'complete':''}">${this.state.basement.furniture[p.id]?'✓':'○'} ${p.name}</li>`).join('')}</ul><button id="security-buy" data-computer="buy-security" class="computer-button primary" ${furnished(this.state)?'':'disabled'}>Buy security · $${SECURITY_PRICE}</button><p>${furnished(this.state)?'One permanent purchase. Catch +$15 · wrong person / escape −$5.':'Return to the lounge to buy the missing furnishings.'}</p></article>`;
  }else if(page==='email'){
   this.screen.innerHTML=c.email?`<div class="inbox-heading"><span class="computer-kicker">CUSTOMER POSTBOX</span><h2>Fresh from the floor.</h2><p>Fictional customer notes, just for fun.</p></div><div class="mail-categories">${EMAIL_CATEGORIES.map(cat=>`<button class="computer-card mail-category" data-computer="inbox" data-id="${cat.id}">${icon(cat.icon)}<strong>${cat.name}</strong><span>${cat.messages.length} messages ${icon('arrow')}</span></button>`).join('')}<button class="computer-card mail-category people-category" data-computer="people">${icon('people')}<strong>People Comments</strong><span>Real players · Internet required ${icon('arrow')}</span></button></div>`:`<article class="computer-card app-unlock">${icon('email')}<h2>A little customer mail.</h2><p>${EMAIL_CATEGORIES.map(cat=>cat.name).join(" and ")}. ${EMAIL_CATEGORIES.reduce((total,cat)=>total+cat.messages.length,0)} fictional notes with no effect on your money or progress.</p><button data-computer="buy-email" class="computer-button primary">Unlock Email · $${EMAIL_PRICE}</button><p>Pay once. Read whenever you like, even offline.</p></article>`;
  }else if(page==='store'){
   this.screen.innerHTML=`<div class="store-heading"><span class="computer-kicker">THE GAME SHELF</span><h2>Take a well-earned break.</h2><p>Permanent access. Each game stays in its own window.</p></div><div class="computer-games">${COMPUTER_GAMES.map(g=>`<article class="computer-card store-game"><div class="game-mark ${g.id}">${icon(g.icon)}</div><div><h3>${g.name}</h3><p>${g.description}</p><small>${c.games[g.id]?'✓ Owned · Internet may be required':`$${g.cost} · One-time purchase`}</small></div><button class="computer-button primary" data-computer="${c.games[g.id]?'play':'buy-game'}" data-id="${g.id}">${c.games[g.id]?'Play':`Buy · $${g.cost}`}</button></article>`).join('')}</div><p class="computer-note">These are separate games. Their own sound controls apply. Game progress may reset when the window closes.</p>`;
  }else if(page==='inbox'&&c.email){
   const cat=EMAIL_CATEGORIES.find(cat=>cat.id===id);if(!cat)return this.navigate('email');this.category=id;
   this.screen.innerHTML=`<button class="computer-button" data-computer="email">← All categories</button><div class="inbox-heading"><h2>${cat.name}</h2><p>${cat.subtitle}</p></div><div class="mail-list">${cat.messages.map(m=>`<button data-computer="message" data-id="${m.id}" class="mail-row">${icon('email')}<span><b>${m.subject}</b><small>From ${m.from} · DFP guest</small></span>${icon('arrow')}</button>`).join('')}</div>`;
  }else if(page==='message'&&c.email){
   const cat=EMAIL_CATEGORIES.find(cat=>cat.id===this.category),m=cat?.messages.find(m=>m.id===Number(id));if(!m)return this.navigate('email');
   this.screen.innerHTML=`<button class="computer-button" data-computer="inbox" data-id="${cat.id}">← Back to ${cat.name}</button><article class="computer-card mail-message"><span class="computer-kicker">FROM ${m.from.toUpperCase()} · DFP GUEST</span><h2>${m.subject}</h2><p>${m.body}</p><footer>Fictional customer feedback · No rewards or penalties</footer></article>`;
  }
  this.screen.scrollTop=0;this.screen.focus({preventScroll:true});
 }
 action(action,id){
  if(action==='dfp')return this.close();
  if(action==='security'){
   if(this.state.basement.security.owned){this.unloadGame();if(this.openSecurity()){this.page='security';this.root.hidden=true;}return;}
   return this.navigate('security');
  }
  if(action==='buy-security'){if(this.purchase({type:'security'}))this.action('security');return;}
  if(action==='buy-email'){if(this.purchase({type:'email'}))this.navigate('email');return;}
  if(action==='buy-game'){if(this.purchase({type:'computer-game',id}))this.navigate('store');return;}
  if(action==='play')return this.play(id);
  if(action==='retry')return this.play(this.game?.id);
  if(action==='help')return this.gameError('This game may be blocked, unavailable, or unable to run in an embedded window. Your purchase is safe. Try again, or return to your computer.');
  if(['desktop','email','store','inbox','message','people','producer','producer-signin','add-comment'].includes(action))this.navigate(action,id);
 }
 unloadGame(){clearTimeout(this.loadTimer);this.loadTimer=null;if(this.frame){this.frame.src='about:blank';this.frame.remove();this.frame=null;}this.game=null;}
 gameError(message){
  clearTimeout(this.loadTimer);this.loadTimer=null;if(this.frame){this.frame.remove();this.frame=null;}
  const area=this.screen.querySelector('#computer-game-area');if(!area)return;
  area.innerHTML=`<div class="game-unavailable" role="status">${icon('controller')}<h2>Let’s try that again.</h2><p></p><button class="computer-button primary" data-computer="retry">Retry game</button><button class="computer-button" data-computer="desktop">Back to Computer</button></div>`;
  area.querySelector('p').textContent=message;const status=this.screen.querySelector('#game-load-status');if(status)status.textContent='Game unavailable · ownership saved';
 }
 play(id){
  const game=COMPUTER_GAMES.find(g=>g.id===id);if(!game||!this.state.basement.computer.games[id])return;
  this.navigate('store');this.page='game';this.game=game;this.root.classList.add('playing');this.root.querySelector('#computer-title').textContent=game.name;this.root.querySelector('#computer-location').textContent='GAME WINDOW';
  this.screen.innerHTML=`<div class="game-window-status"><span id="game-load-status" role="status">Loading ${game.name}…</span><button class="computer-button" data-computer="help">Blank or blocked?</button></div><div id="computer-game-area"><div class="game-loading" role="status"><i></i>Opening ${game.name}…</div></div><p class="game-audio-note">Tap the game for keyboard focus. Use its own audio controls. Leaving closes its sound.</p>`;
  if(!navigator.onLine)return this.gameError('You’re offline. Your game is still owned. Connect to the internet, then try again.');
  const frame=document.createElement('iframe');this.frame=frame;frame.title=`${game.name} game`;frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-pointer-lock');frame.setAttribute('allow',"autoplay 'none'; camera 'none'; microphone 'none'; geolocation 'none'; fullscreen 'none'");frame.referrerPolicy='no-referrer';
  // Only the three user-selected, trusted game URLs are allowed. Storage is required by Snake.
  frame.addEventListener('load',()=>{if(this.frame!==frame)return;clearTimeout(this.loadTimer);this.loadTimer=null;this.screen.querySelector('.game-loading')?.remove();this.screen.querySelector('#game-load-status').textContent=`${game.name} window open · use “Blank or blocked?” if needed`;});
  frame.addEventListener('error',()=>{if(this.frame===frame)this.gameError('The game could not load. Check your connection and retry.');});
  frame.src=game.url;this.screen.querySelector('#computer-game-area').append(frame);
  this.loadTimer=setTimeout(()=>{if(this.frame===frame)this.gameError('The game is taking too long to load. It may be offline or blocking embedded play. Retry or return to the desktop.');},20000);
  this.save();
 }
}
