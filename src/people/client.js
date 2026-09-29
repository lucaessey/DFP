import {CommentError,OWNER_EMAIL,ownerClaims,validateComment,parseFilter,commentPage,PAGE_SIZE} from '../../shared/comments.js';
import {commentsAPI,returnURL,databaseURL,useEmulators} from './config.js';
import {bounded,readJSON} from './network.js';
const DRAFT='dfp.peopleComments.draft',EMAIL='dfp.producer.email',COOLDOWN='dfp.producer.resendAfter';
const safeGet=key=>{try{return localStorage.getItem(key);}catch{return null;}};
const safeSet=(key,value)=>{try{localStorage.setItem(key,value);return true;}catch{return false;}};
const safeRemove=key=>{try{localStorage.removeItem(key);}catch{}};
export function captureSignInLink(){
  const url=new URL(location.href);if(url.searchParams.get('mode')!=='signIn'||!url.searchParams.has('oobCode'))return null;
  const link=url.href;history.replaceState(null,'',url.pathname+url.hash);return link;
}
export class CommentsClient {
  constructor(){this.owner=false;this.listeners=new Set();this.generation=0;this.link=captureSignInLink();this.message='';
    window.addEventListener('offline',()=>this.revoke('Private inbox closed while offline.'));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.revoke();else if(this.auth?.user)this.checkOwner();});
    window.addEventListener('online',()=>{if(this.auth?.user)this.checkOwner();});
  }
  get configured(){try{const url=new URL(commentsAPI);return url.protocol==='https:'||(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)&&['127.0.0.1','localhost'].includes(location.hostname));}catch{return false;}}
  get cooldown(){return Math.max(0,Number(safeGet(COOLDOWN)||0)-Date.now());}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
  emit(){for(const fn of this.listeners)fn();}
  revoke(message=''){this.generation++;this.owner=false;this.message=message;this.emit();}
  async init(){
    if(!this.initializing)this.initializing=import('./auth.js').then(m=>m.createAuth()).then(auth=>{this.auth=auth;auth.listen(user=>{this.revoke(user?'':this.message);if(user&&this.signedOut){auth.logout().catch(()=>{});return;}this.checkOwner();});return auth;}).catch(()=>{this.initializing=null;throw new CommentError('auth','Sign-in could not start. Check your connection.',503);});
    return this.initializing;
  }
  async api(path,{body,authenticated=false,owner=false,signal}={}){
    if(!navigator.onLine)throw new CommentError('offline','Posting and loading comments require an internet connection.',503);
    if(body&&!this.configured)throw new CommentError('setup','Comments cannot be sent yet because the moderation service is not connected. Your draft is saved on this device.',503);
    try{return await bounded(async requestSignal=>{
      if(!body)return this.readDatabase(path,requestSignal);
      const headers={'content-type':'application/json'};
      if(authenticated||owner){
        const auth=await this.init();requestSignal.throwIfAborted();
        if(!auth.user){if(owner)throw new CommentError('forbidden','Producer sign-in is required.',403);try{await auth.anonymous();}catch{throw new CommentError('auth','Player sign-in failed. Your comment has not been sent. Check your connection and retry.',503);}}
        requestSignal.throwIfAborted();headers.authorization=`Bearer ${await auth.user.getIdToken(owner)}`;
      }
      requestSignal.throwIfAborted();
      return readJSON(commentsAPI+path,{method:'POST',headers,body:JSON.stringify(body),signal:requestSignal});
    },{signal});}catch(error){if(owner&&(error.status===401||error.status===403))this.revoke(error.message);throw error;}
  }
  async readDatabase(path,signal){
    const route=new URL(path,'https://dfp.invalid'),session=route.pathname==='/owner/session';
    const owner=session||route.pathname==='/owner/comments';
    if(!owner&&route.pathname!=='/comments')throw new CommentError('route','This page is unavailable.',404);
    const {stars,cursor}=parseFilter(route.searchParams),view=owner?(session?'private':{producer:'private',everyone:'ownerPublic',pending:'pending'}[route.searchParams.get('audience')]):'public';
    if(!view)throw new CommentError('audience','Choose an inbox.');
    const url=new URL(`${databaseURL}/peopleComments/${view}/${session?'all':stars}.json`);
    if(useEmulators)url.searchParams.set('ns','demo-dfp-comments-default-rtdb');
    url.searchParams.set('orderBy',JSON.stringify('$key'));url.searchParams.set('limitToLast',String(session?1:PAGE_SIZE+1));
    if(cursor)url.searchParams.set('endAt',JSON.stringify(cursor));
    if(owner){
      const auth=await this.init();signal.throwIfAborted();
      if(this.signedOut||!auth.user)throw new CommentError('forbidden','Producer sign-in is required.',403);
      const identity=await auth.user.getIdTokenResult(true);signal.throwIfAborted();
      if(!ownerClaims(identity.claims))throw new CommentError('forbidden','Only the verified producer can open this app.',403);
      // RTDB's documented ID-token parameter. Never log this URL or raw fetch errors.
      url.searchParams.set('auth',identity.token);
    }
    const data=await readJSON(url,{signal});
    return session?{owner:true}:commentPage(data,cursor);
  }
  async checkOwner(){
    const epoch=this.generation;if(this.signingOut||this.signedOut||!this.auth?.user||!navigator.onLine||document.hidden)return false;
    if(this.checking?.epoch===epoch)return this.checking.promise;
    const promise=(async()=>{try{const token=await bounded(()=>this.auth.user.getIdTokenResult());if(!ownerClaims(token.claims))return false;const response=await this.api('/owner/session',{owner:true});if(epoch!==this.generation||this.signedOut||!navigator.onLine||document.hidden)return false;this.owner=response.owner===true;this.emit();return this.owner;}catch{if(epoch===this.generation)this.revoke('Your session could not be checked. Reconnect and try again.');return false;}})();
    this.checking={epoch,promise};try{return await promise;}finally{if(this.checking?.promise===promise)this.checking=null;}
  }
  async sendLink(){
    if(!navigator.onLine)throw new CommentError('offline','Connect to the internet to request a sign-in email.');
    if(this.sendingLink||this.cooldown)throw new CommentError('cooldown','Please wait five minutes between sign-in emails.');
    // Reserve the cooldown before sending, so a timeout does not consume the daily quota repeatedly.
    safeSet(COOLDOWN,String(Date.now()+300000));
    const operation=(async()=>{const auth=await this.init();await auth.send(OWNER_EMAIL,returnURL);})();this.sendingLink=operation;
    operation.finally(()=>{if(this.sendingLink===operation)this.sendingLink=null;}).catch(()=>{});
    try{await bounded(()=>operation,{message:'No email confirmation received. Check your inbox before requesting another link.'});safeSet(EMAIL,OWNER_EMAIL);this.message='Firebase accepted the email request. Check your inbox and Spam; delivery is not confirmed. You can also sign in with Google.';this.emit();}
    catch(e){throw new CommentError('email',authMessage(e));}
  }
  async signInGoogle(){
    if(!navigator.onLine)throw new CommentError('offline','Connect to sign in with Google.');
    if(this.googleInFlight||this.completingLink)throw new CommentError('busy','A sign-in is already in progress. Finish or close its window first.');
    this.signedOut=false;
    const operation=(async()=>{
      const auth=await this.init();if(this.signedOut)return;
      await auth.google();
      if(this.signedOut){await auth.logout();return;}
      const token=await auth.user.getIdTokenResult(true);
      if(!ownerClaims(token.claims)){await auth.logout();this.revoke();throw new CommentError('wrong-account',`Choose ${OWNER_EMAIL}. Other Google accounts cannot open Producer.`);}
      if(this.signedOut){await auth.logout();return;}
      await this.checkOwner();
      if(this.signedOut)return;
      this.message=this.owner?'Producer verified. Open your computer to use the Producer app.':'Google sign-in finished, but private access could not be checked. Reconnect and choose Check session.';this.emit();
    })();
    this.googleInFlight=operation;
    operation.finally(()=>{if(this.googleInFlight===operation)this.googleInFlight=null;}).catch(()=>{});
    try{await bounded(()=>operation,{ms:120000,message:'Google sign-in is still waiting. Finish or close the Google window before retrying.'});}
    catch(e){throw new CommentError('google',authMessage(e));}
  }
  async completeLink(email){
    if(email!==OWNER_EMAIL)throw new CommentError('email','Enter the producer email address that received the link.');
    if(!this.link)throw new CommentError('link','Open the newest sign-in link from your email.');
    if(!navigator.onLine)throw new CommentError('offline','Connect to finish sign-in.');
    if(this.completingLink||this.googleInFlight)throw new CommentError('busy','The previous sign-in is still being checked. Please wait.');
    this.signedOut=false;
    const operation=(async()=>{const auth=await this.init();if(!auth.isLink(this.link))throw new CommentError('link','This link cannot be used. Request a new link.');await auth.complete(email,this.link);if(this.signedOut){await auth.logout();return;}this.link=null;safeRemove(EMAIL);})();this.completingLink=operation;
    operation.finally(()=>{if(this.completingLink===operation)this.completingLink=null;}).catch(()=>{});
    try{await bounded(()=>operation,{message:'Sign-in has not finished. Check your connection; no access has been granted yet.'});if(this.signedOut)return;await this.checkOwner();this.message=this.owner?'Producer verified. Open your computer to use the Producer app.':'Email verified, but private access could not be checked. Reconnect and choose Check session.';this.emit();}
    catch(e){if(e.code==='link'||/expired-action-code|invalid-action-code|invalid-credential/.test(e.code||''))this.link=null;throw new CommentError('email',authMessage(e));}
  }
  get rememberedEmail(){return safeGet(EMAIL)===OWNER_EMAIL?OWNER_EMAIL:'';}
  async signOut(){this.signedOut=true;this.signingOut=true;this.revoke('Signing out. Private comments have been cleared.');try{await bounded(async()=>{const auth=await this.init();await auth.logout();});safeRemove(EMAIL);this.revoke('Signed out. Private comments have been cleared.');}finally{this.signingOut=false;}}
  loadDraft(){try{const d=JSON.parse(safeGet(DRAFT));if(d&&typeof d.text==='string'&&[...d.text].length<=500&&typeof d.requestId==='string')return d;}catch{}return {text:'',rating:0,audience:'',acknowledged:false,requestId:crypto.randomUUID()};}
  saveDraft(draft){return safeSet(DRAFT,JSON.stringify(draft));}
  clearDraft(){safeRemove(DRAFT);}
  async submit(draft,signal){
    const value=validateComment(draft),result=await this.api('/comments',{body:{...value,requestId:draft.requestId},authenticated:true,signal});
    if(!result||!/^[a-f0-9]{48}$/.test(result.id||'')||!['published','producer','pending','rejected','hidden'].includes(result.status))throw new CommentError('receipt','The service did not confirm receipt. Your draft is safe; please retry.',503);
    return result;
  }
}
export function authMessage(e){
  const code=e?.code||'';
  if(code==='timeout'||code==='link'||code==='wrong-account')return e.message;
  if(/popup-closed-by-user|cancelled-popup-request/.test(code))return 'Google sign-in was cancelled. No Producer access was granted. You can try again.';
  if(/popup-blocked/.test(code))return 'Allow pop-ups for this site, then choose Sign in with Google again.';
  if(/operation-not-supported-in-this-environment/.test(code))return 'Open DFP in Chrome, Edge or Safari to sign in with Google.';
  if(/expired-action-code|invalid-action-code|invalid-email|invalid-credential/.test(code))return 'This link is expired, already used, or does not match the email. Request a new link.';
  if(/too-many-requests|quota-exceeded/.test(code))return 'Firebase’s email limit has been reached. Try again later; the free plan allows five sign-in emails per day.';
  if(/operation-not-allowed|unauthorized-domain|invalid-continue-uri/.test(code))return 'Producer sign-in is not configured for this site yet.';
  if(/network-request-failed|web-storage-unsupported/.test(code))return 'Sign-in could not connect or save this session. Check your connection and browser storage settings, then retry.';
  return 'Sign-in could not be completed. Check your connection or request a new link.';
}
export const commentsClient=new CommentsClient();
