import {CommentError,OWNER_EMAIL,ownerClaims,validateComment} from '../../shared/comments.js';
import {commentsAPI,returnURL} from './config.js';
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
    if(!this.initializing)this.initializing=import('./auth.js').then(m=>m.createAuth()).then(auth=>{this.auth=auth;auth.listen(user=>{this.revoke(user?'':this.message);this.checkOwner();});return auth;}).catch(()=>{this.initializing=null;throw new CommentError('auth','Sign-in could not start. Check your connection.',503);});
    return this.initializing;
  }
  async api(path,{body,authenticated=false,owner=false,signal}={}){
    if(!this.configured)throw new CommentError('setup','People Comments are not connected yet. Your draft stays on this device.',503);
    if(!navigator.onLine)throw new CommentError('offline','Posting and loading comments require an internet connection.',503);
    const headers={'content-type':'application/json'};
    if(authenticated||owner){const auth=await this.init();if(!auth.user){if(owner)throw new CommentError('forbidden','Producer sign-in is required.',403);await auth.anonymous();}headers.authorization=`Bearer ${await auth.user.getIdToken(owner)}`;}
    let response;
    try{response=await fetch(commentsAPI+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});}catch(error){if(error.name==='AbortError')throw error;throw new CommentError('network','No confirmation received. Retry this draft to check safely.',503);}
    const data=await response.json();if(!response.ok){if(owner&&(response.status===401||response.status===403))this.revoke(data.message);throw new CommentError(data.error||'server',data.message||'Please try again.',response.status);}return data;
  }
  async checkOwner(){
    const epoch=this.generation;if(this.signingOut||!this.auth?.user||!this.configured||!navigator.onLine||document.hidden)return false;
    try{const token=await this.auth.user.getIdTokenResult();if(!ownerClaims(token.claims))return false;const response=await this.api('/owner/session',{owner:true});if(epoch!==this.generation||!navigator.onLine||document.hidden)return false;this.owner=response.owner===true;this.emit();return this.owner;}catch{if(epoch===this.generation)this.revoke();return false;}
  }
  async sendLink(){
    if(!navigator.onLine)throw new CommentError('offline','Connect to the internet to request a sign-in email.');
    if(!this.configured)throw new CommentError('setup','Producer sign-in will be available when People Comments is connected.');
    if(this.cooldown)throw new CommentError('cooldown','Please wait five minutes between sign-in emails.');
    // Reserve the cooldown before sending, so a timeout does not consume the daily quota repeatedly.
    safeSet(COOLDOWN,String(Date.now()+300000));
    try{const auth=await this.init();await auth.send(OWNER_EMAIL,returnURL);safeSet(EMAIL,OWNER_EMAIL);this.message='Sign-in email sent. Check your inbox. Firebase’s free plan allows five sign-in emails per day.';this.emit();}
    catch(e){throw new CommentError('email',authMessage(e));}
  }
  async completeLink(email){
    if(email!==OWNER_EMAIL)throw new CommentError('email','Enter the producer email address that received the link.');
    if(!this.link)throw new CommentError('link','Open the newest sign-in link from your email.');
    if(!navigator.onLine)throw new CommentError('offline','Connect to finish sign-in.');
    try{const auth=await this.init();if(!auth.isLink(this.link))throw new Error('link');await auth.complete(email,this.link);this.link=null;safeRemove(EMAIL);await this.checkOwner();this.message=this.owner?'Producer verified. Open your computer to use the Producer app.':'Email verified. Producer access awaits a connected, authorized comments service.';this.emit();}
    catch(e){throw new CommentError('email',authMessage(e));}
  }
  get rememberedEmail(){return safeGet(EMAIL)===OWNER_EMAIL?OWNER_EMAIL:'';}
  async signOut(){this.signingOut=true;this.revoke('Signing out. Private comments have been cleared.');try{const auth=await this.init();await auth.logout();safeRemove(EMAIL);this.revoke('Signed out. Private comments have been cleared.');}finally{this.signingOut=false;}}
  loadDraft(){try{const d=JSON.parse(safeGet(DRAFT));if(d&&typeof d.text==='string'&&[...d.text].length<=500&&typeof d.requestId==='string')return d;}catch{}return {text:'',rating:0,audience:'',acknowledged:false,requestId:crypto.randomUUID()};}
  saveDraft(draft){return safeSet(DRAFT,JSON.stringify(draft));}
  clearDraft(){safeRemove(DRAFT);}
  async submit(draft,signal){const value=validateComment(draft);return this.api('/comments',{body:{...value,requestId:draft.requestId},authenticated:true,signal});}
}
export function authMessage(e){
  const code=e?.code||'';
  if(/expired-action-code|invalid-action-code|invalid-email|invalid-credential/.test(code))return 'This link is expired, already used, or does not match the email. Request a new link.';
  if(/too-many-requests|quota-exceeded/.test(code))return 'Firebase’s email limit has been reached. Try again later; the free plan allows five sign-in emails per day.';
  if(/operation-not-allowed|unauthorized-domain|invalid-continue-uri/.test(code))return 'Producer email sign-in is not configured for this site yet.';
  return 'Sign-in could not be completed. Check your connection or request a new link.';
}
export const commentsClient=new CommentsClient();
