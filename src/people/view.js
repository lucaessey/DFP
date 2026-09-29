import {commentsClient as client} from './client.js';
import {OWNER_EMAIL,PRIVATE_WARNING,PUBLIC_WARNING,COMMENT_STATES,escapeHTML as esc} from '../../shared/comments.js';
import './people.css';
const button=(action,text,extra='')=>`<button class="computer-button" data-people="${action}" ${extra}>${text}</button>`;
const options=(selected,items)=>items.map(([value,label])=>`<option value="${value}" ${String(selected)===String(value)?'selected':''}>${label}</option>`).join('');
const starsOptions=[['all','All Stars'],...[1,2,3,4,5].map(n=>[n,`${n} Star${n===1?'':'s'}`])];
export class PeopleView {
  constructor(computer){
    this.computer=computer;this.screen=computer.screen;this.epoch=0;this.rows=[];this.audience='everyone';this.stars='all';this.cursor=null;this.busy=false;
    computer.root.addEventListener('click',e=>{const b=e.target.closest('[data-people]');if(b&&!b.disabled){e.preventDefault();this.action(b.dataset.people,b.dataset.id);}});
    computer.root.addEventListener('submit',e=>{if(e.target.id==='people-form'){e.preventDefault();this.submit();}});
    computer.root.addEventListener('input',e=>{if(e.target.closest('#people-form'))this.readDraft();});
    computer.root.addEventListener('change',e=>{
      if(e.target.id==='people-audience'||e.target.id==='people-stars'){this.audience=this.screen.querySelector('#people-audience').value;this.stars=this.screen.querySelector('#people-stars').value;this.load(true);}
      if(e.target.name==='audience'){this.readDraft();this.form();}
    });
    client.subscribe(()=>{
      if(!client.owner&&this.mode==='producer'){
        this.close();this.computer.navigate('producer-signin');
      }else if(this.mode==='producer-signin')this.signin();
      if(computer.opened&&computer.page==='desktop')computer.navigate('desktop');
    });
    window.addEventListener('offline',()=>{if(this.mode==='people'){this.abort?.abort();this.rows=[];this.renderFeed('You’re offline. Connect to load current player comments.');}else if(this.mode==='add-comment')this.form();});
    window.addEventListener('online',()=>{if(this.mode==='add-comment')this.form();});
  }
  close(){if(this.mode==='producer')this.screen.replaceChildren();this.epoch++;this.abort?.abort();this.abort=null;this.rows=[];this.mode=null;this.busy=false;clearTimeout(this.resendTimer);}
  show(mode){
    this.close();this.mode=mode;
    if(mode==='producer-signin'){this.signin();client.init().then(()=>client.checkOwner()).catch(()=>{});return;}
    if(mode==='add-comment'){this.draft=client.loadDraft();return this.form();}
    if(mode==='producer'&&!client.owner)return this.computer.navigate('producer-signin');
    this.audience=mode==='producer'?'producer':'everyone';this.stars='all';this.load(true);
  }
  async load(reset){
    if(reset){this.epoch++;this.abort?.abort();this.rows=[];this.cursor=null;}
    const epoch=this.epoch;this.busy=true;this.abort=new AbortController();this.renderFeed('Loading comments…');
    if(this.mode==='people'&&this.audience==='producer'){this.busy=false;return this.renderFeed();}
    const owner=this.mode==='producer';
    if(owner&&!client.owner)return this.computer.navigate('producer-signin');
    const search=new URLSearchParams({stars:this.stars});if(this.cursor)search.set('before',this.cursor);if(owner)search.set('audience',this.audience);
    try{
      const data=await client.api((owner?'/owner/comments?':'/comments?')+search,{owner,signal:this.abort.signal});
      if(epoch!==this.epoch||(owner&&!client.owner))return;
      this.rows.push(...data.comments);this.cursor=data.next;this.busy=false;this.renderFeed();
    }catch(e){if(epoch!==this.epoch||e.name==='AbortError')return;this.busy=false;this.renderFeed(e.message);}
  }
  renderFeed(message=''){
    const owner=this.mode==='producer';
    this.screen.classList.add('people-screen');
    const choices=owner?[['producer','Private Producer'],['everyone','Public Everyone'],['pending','Awaiting Moderation']]:[['everyone','Everyone'],['producer','Producer']];
    this.screen.innerHTML=`<section class="people-pane"><header class="people-heading"><span class="computer-kicker">${owner?'PRODUCER INBOX':'REAL PLAYER FEEDBACK'}</span><h2>${owner?'Your players. Your inbox.':'People Comments'}</h2><p>${owner?'Private feedback stays private, even after approval.':'Player submissions, separate from DFP’s fictional reviews.'}</p><div class="people-filters"><label>Audience<select id="people-audience">${options(this.audience,choices)}</select></label><label>Rating<select id="people-stars">${options(this.stars,starsOptions)}</select></label>${button('refresh','Refresh',this.busy?'disabled':'')}${owner?button('signout','Sign out'):''}</div></header><div class="people-scroll" tabindex="0"><p class="people-status" role="status">${esc(message)}</p><div class="people-results"></div>${this.cursor?button('more','Load more',this.busy?'disabled':''):''}</div><footer class="people-bottom">${owner?'<small>Private data is cleared when you leave, sign out or go offline.</small>':`${button('add','Add Comment')}<small>Automatic checks can miss things. Report comments that need review.</small>`}</footer></section>`;
    const results=this.screen.querySelector('.people-results');
    if(!client.configured){const notice=document.createElement('p');notice.className='people-service-notice';notice.textContent=owner?'You can read your inbox. Posting and moderation actions need the comments service to be connected.':'Posting is not available yet. Your drafts stay on this device until the moderation service is connected.';this.screen.querySelector('.people-heading').append(notice);}
    if(!owner&&this.audience==='producer'){results.innerHTML=`<div class="computer-card"><h3>A private note for the producer.</h3><p>${PRIVATE_WARNING}</p><p>You cannot browse private feedback from other players.</p>${button('add-private','Send private feedback')}</div>`;return;}
    if(!message&&!this.rows.length)results.innerHTML='<div class="people-empty">No comments in this view yet.</div>';
    for(const row of this.rows){
      const card=document.createElement('article');card.className='computer-card people-comment';
      const date=Number.isFinite(row.createdAt)?new Date(row.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'Date unavailable';
      card.innerHTML=`<div class="people-comment-meta"><span class="people-stars" aria-label="${row.rating} out of 5 stars">${'★'.repeat(row.rating)}${'☆'.repeat(5-row.rating)}</span><time>${esc(date)}</time></div><p class="people-text">${esc(row.text)}</p>${owner?`<small>${esc(row.audience==='producer'?'Private · Producer':'Public audience · Everyone')}${row.read?' · Read':''}${row.reported?' · Reported':''}</small>${row.reason?`<p class="people-reason">${esc(row.reason)}</p>`:''}`:''}<div class="people-actions">${owner?(this.audience==='pending'?button('approve',row.audience==='producer'?'Approve privately':'Approve for Everyone',`data-id="${row.id}"`)+button('reject','Reject',`data-id="${row.id}"`):this.audience==='producer'?button('read',row.read?'Read':'Mark as read',`data-id="${row.id}" ${row.read?'disabled':''}`):button('hide','Hide comment',`data-id="${row.id}"`)):button('report','Report',`data-id="${row.id}"`)}</div>`;
      results.append(card);
    }
    if(!client.configured)results.querySelectorAll('[data-people]').forEach(b=>b.disabled=true);
  }
  form(){
    this.screen.classList.remove('people-screen');this.draft||=client.loadDraft();const d=this.draft;
    this.screen.innerHTML=`<div class="people-form-wrap">${button('back','← Back to People Comments')}<span class="computer-kicker">YOUR FEEDBACK</span><h2>Add Comment</h2><p>Tell us about your time at DFP. Criticism and low ratings are welcome.</p><form id="people-form"><fieldset ${this.busy?'disabled':''}><label for="comment-text">Comment</label><textarea id="comment-text" name="text" rows="5" required aria-describedby="comment-allowance">${esc(d.text)}</textarea><div id="comment-allowance" class="people-allowance" aria-live="polite">${500-[...d.text].length} characters remaining</div><label for="comment-rating">Star rating</label><select id="comment-rating" name="rating" required>${options(d.rating,[[0,'Choose a rating'],...[1,2,3,4,5].map(n=>[n,`${n} Star${n===1?'':'s'}`])])}</select><label for="comment-audience">Who can see it?</label><select id="comment-audience" name="audience" required>${options(d.audience,[['','Choose an audience'],['producer','Producer'],['everyone','Everyone']])}</select><div class="people-privacy" role="note">${d.audience==='producer'?PRIVATE_WARNING:d.audience==='everyone'?PUBLIC_WARNING:'Choose who should receive your comment.'}</div>${d.audience==='producer'?`<label class="people-ack"><input type="checkbox" name="acknowledged" ${d.acknowledged?'checked':''} required> I understand that this feedback is private to the producer.</label>`:''}<p class="people-status" role="status">${esc(this.formMessage||(!navigator.onLine?'You’re offline. Your draft is saved here; connect to submit.':!client.configured?'Comments cannot be sent yet: the moderation service is not connected. You can keep a draft here.':''))}</p><div class="people-actions"><button class="computer-button primary" type="submit" ${!navigator.onLine||!client.configured?'disabled':''}>${this.busy?'Sending…':'Submit'}</button>${button('back','Cancel')}${button('discard','Discard draft')}</div></fieldset></form><p class="people-draft-note">Drafts stay on this device until sent or discarded. Discard private drafts on shared devices.</p></div>`;
    this.screen.querySelector('#comment-text').addEventListener('input',e=>{if([...e.target.value].length>500)e.target.value=[...e.target.value].slice(0,500).join('');this.readDraft();});
  }
  readDraft(){
    const f=this.screen.querySelector('#people-form');if(!f)return;
    const next={text:f.elements.text.value,rating:Number(f.elements.rating.value),audience:f.elements.audience.value,acknowledged:!!f.elements.acknowledged?.checked};
    if(next.audience!==this.draft.audience)next.acknowledged=false;
    const changed=['text','rating','audience','acknowledged'].some(k=>next[k]!==this.draft[k]);
    this.draft={...next,requestId:changed?crypto.randomUUID():this.draft.requestId};
    const saved=client.saveDraft(this.draft);const allowance=this.screen.querySelector('#comment-allowance');if(allowance)allowance.textContent=`${500-[...next.text].length} characters remaining`;
    if(!saved)this.screen.querySelector('.people-draft-note').textContent='This browser could not save the draft. Keep this screen open until you send it.';
  }
  async submit(){
    if(this.busy)return;this.readDraft();const epoch=this.epoch,submittedId=this.draft.requestId;this.busy=true;this.formMessage='Sending…';this.form();
    try{
      const result=await client.submit(this.draft);
      if(result.status!=='rejected'&&client.loadDraft().requestId===submittedId)client.clearDraft();
      if(epoch!==this.epoch)return;this.busy=false;
      if(result.status==='rejected'){this.formMessage=`Rejected. ${result.reason}`;this.draft.requestId=crypto.randomUUID();client.saveDraft(this.draft);this.form();}
      else this.screen.innerHTML=`<article class="computer-card people-receipt"><span class="computer-kicker">FEEDBACK RECEIVED</span><h2>${esc(COMMENT_STATES[result.status]||'Received')}</h2><p>${result.status==='published'?'Your comment is now visible to everyone.':result.status==='pending'?'Your comment is private while the producer reviews it. Its chosen audience will be preserved.':'Your private feedback was sent to the producer.'}</p>${button('back','Back to People Comments')}</article>`;
    }catch(e){if(epoch!==this.epoch)return;this.busy=false;this.formMessage=e.message;this.form();}
  }
  signin(){
    clearTimeout(this.resendTimer);this.screen.classList.remove('people-screen');
    this.signinEmail=this.screen.querySelector('#producer-email')?.value??this.signinEmail??client.rememberedEmail;
    this.screen.innerHTML=`<article class="computer-card producer-signin"><span class="computer-kicker">FOR THE GAME’S PRODUCER</span><h2>Producer Sign-in</h2><p>Private feedback requires a verified email sign-in. Typing an email alone never unlocks the Producer app.</p><p class="people-status" role="status">${esc(this.signinMessage||client.message)}</p>${client.link?`<label for="producer-email">Confirm the email that received this link</label><input id="producer-email" type="email" autocomplete="email" value="${esc(this.signinEmail)}" placeholder="Producer email">${button('complete-link',this.authBusy?'Verifying…':'Complete sign-in',this.authBusy||!navigator.onLine?'disabled':'')}`:`<p>Use your verified <b>${OWNER_EMAIL}</b> Google account to sign in without waiting for an email.</p>${button('google-signin',this.authBusy?'Signing in…':'Sign in with Google',this.authBusy||!client.auth||!navigator.onLine?'disabled':'')}<p>Or request an email link for <b>${OWNER_EMAIL}</b>.</p>${button('send-link',client.cooldown?`Resend in ${Math.ceil(client.cooldown/60000)} min`:'Send sign-in email',client.cooldown||this.authBusy||!navigator.onLine?'disabled':'')}<p class="fine-print">The email resend timer limits requests; it does not confirm delivery. Five sign-in emails per day on the free plan. Google sign-in does not send an email.</p>`}${!client.configured?'<p>Firebase sign-in and protected inbox reading are available. Posting and moderation still need the comments service.</p>':''}${client.owner?button('open-producer','Open Producer'):client.auth?.user&&!client.auth.user.isAnonymous?button('check-session','Check session'):''}${client.auth?.user&&!client.auth.user.isAnonymous?button('signout','Sign out'):''}</article>`;
    if(client.cooldown)this.resendTimer=setTimeout(()=>{if(this.mode==='producer-signin')this.signin();},Math.min(client.cooldown+50,60000));
  }
  async action(action,id){
    if(action==='back'){this.formMessage='';return this.computer.navigate('people');}
    if(action==='add'||action==='add-private'){
      if(action==='add-private'){const d=client.loadDraft();d.audience='producer';d.acknowledged=false;d.requestId=crypto.randomUUID();client.saveDraft(d);}
      return this.computer.navigate('add-comment');
    }
    if(action==='discard'){client.clearDraft();this.draft=client.loadDraft();this.formMessage='Draft discarded.';return this.form();}
    if(action==='refresh'||action==='more')return this.load(action==='refresh');
    if(action==='open-producer')return this.computer.navigate('producer');
    if(action==='check-session'){this.signinMessage='Checking your saved session…';this.signin();await client.checkOwner();this.signinMessage=client.owner?'Producer verified. Open your computer to use the Producer app.':client.message;return this.signin();}
    if(action==='google-signin'||action==='send-link'||action==='complete-link'||action==='signout'){
      if(this.authBusy)return;this.authBusy=true;const epoch=this.epoch;
      const email=this.screen.querySelector('#producer-email')?.value.trim();
      this.signinMessage=action==='google-signin'?'Choose your Google account in the sign-in window…':action==='send-link'?'Sending sign-in email…':action==='signout'?'Signing out…':'Verifying sign-in…';if(this.mode==='producer-signin')this.signin();
      try{if(action==='google-signin')await client.signInGoogle();else if(action==='send-link')await client.sendLink();else if(action==='complete-link')await client.completeLink(email);else await client.signOut();this.signinMessage=client.message;}
      catch(e){this.signinMessage=e.message;}finally{this.authBusy=false;if(this.mode==='producer-signin')this.signin();}
      return;
    }
    if(['report','read','approve','reject','hide'].includes(action)){
      if(this.busy)return;const row=this.rows.find(r=>r.id===id);if(!row)return;const epoch=this.epoch;this.busy=true;
      this.screen.querySelectorAll('select,[data-people]:not([data-people="signout"])').forEach(b=>b.disabled=true);
      const body={id,action,requestId:row.actionRequest?.action===action?row.actionRequest.id:crypto.randomUUID(),...(action==='report'?{}:{revision:row.revision})};row.actionRequest={action,id:body.requestId};
      try{await client.api(action==='report'?'/report':'/owner/action',{body,authenticated:true,owner:action!=='report',signal:this.abort?.signal});if(epoch!==this.epoch)return;this.busy=false;await this.load(true);if(action==='report')this.screen.querySelector('.people-status').textContent='Reported. The comment is private while the producer reviews it.';}
      catch(e){if(epoch!==this.epoch)return;this.busy=false;this.renderFeed(e.message);}
    }
  }
}

// A link may open on a device without the basement purchase. Complete authentication without altering game progress.
export function mountSignInCompletion(force=false){
  if((!force&&!client.link)||document.querySelector('.producer-link-overlay'))return;
  const root=document.createElement('section');root.className='producer-link-overlay';root.setAttribute('aria-label','Complete producer sign-in');
  root.innerHTML='<div class="computer-shell"><button class="computer-button" id="producer-link-close">Back to DFP</button><div class="computer-screen"></div></div>';
  document.querySelector('#app').append(root);
  const view=new PeopleView({root,screen:root.querySelector('.computer-screen'),navigate:()=>{view.close();root.remove();},opened:false});view.show('producer-signin');
  root.querySelector('#producer-link-close').onclick=()=>{view.close();root.remove();};
}
