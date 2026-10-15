import {ownerClaims,CommentError} from '../../shared/comments.js';
import {beginBonus,payBonus,confirmBonus,bonusWait} from '../../shared/producer-bonus.js';
import {databaseURL,useEmulators} from './config.js';
import {bounded,readJSON} from './network.js';

export class ProducerBonus {
  constructor(client,computer,onChange){
    Object.assign(this,{client,computer,onChange,busy:false,known:false,limit:null,message:'',recoverable:false});
  }
  get wait(){return bonusWait(this.limit);}
  async session(signal){
    const c=this.client,epoch=c.generation;
    if(!c.owner||c.signedOut||!navigator.onLine)throw Error('Connect and sign in as the producer to claim cash.');
    const auth=await c.init(),identity=await auth.user?.getIdTokenResult(true);
    signal.throwIfAborted();
    const current=()=>c.owner&&!c.signedOut&&c.generation===epoch&&navigator.onLine&&auth.user?.uid===identity?.claims.sub;
    if(!identity||!ownerClaims(identity.claims)||!current())throw Error('Producer access changed. Sign in again before claiming.');
    const request=async(path,patch)=>{
      if(!current())throw Error('Producer access changed. Sign in again before claiming.');
      const url=new URL(`${databaseURL}/producerRewards${path?'/'+path:''}.json`);
      url.searchParams.set('auth',identity.token);
      if(useEmulators)url.searchParams.set('ns','demo-dfp-comments-default-rtdb');
      try{return await readJSON(url,{signal,...(patch?{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(patch)}:{})});}
      catch(e){
        if(signal.aborted)throw signal.reason;
        if(e.status===401||e.status===403)throw new CommentError('bonus-denied','Cash claim unavailable. Refresh its status; the five-minute wait or Producer setup may need attention.',e.status);
        throw Error('Cash could not be confirmed. Check your connection and retry the same claim.');
      }
    };
    return {request,current};
  }
  async refresh(){
    if(this.busy)return;this.busy=true;this.known=false;this.message='Checking cash availability…';this.onChange();
    try{await bounded(async signal=>{
      const {request,current}=await this.session(signal);
      const limit=await request('limit');
      const id=this.computer.state.producerBonus?.pending;
      const receipt=id?await request(`receipts/${id}`):null;
      if(!current())return;
      this.limit=limit;this.known=true;this.recoverable=!!receipt;this.message='';
    },{message:'Cash status timed out. Check your connection and retry.'});}
    catch(e){this.message=e.message;}
    finally{this.busy=false;this.onChange();}
  }
  async claim(){
    if(this.busy||!this.known||(!this.recoverable&&this.wait>0))return;
    this.busy=true;this.message='Confirming your $1,000…';this.onChange();
    try{await bounded(async signal=>{
      const {request,current}=await this.session(signal);
      const state=this.computer.state;
      // Save first, including on recovery: the existing game tab lock must permit writes.
      if(!this.computer.save())throw Error('Your game cannot be saved in this tab. Open the active game and retry.');
      const id=beginBonus(state,()=>this.computer.save(),crypto.randomUUID());
      const receipt=await confirmBonus(request,id,signal);
      signal.throwIfAborted();if(!current())throw Error('Sign in again to recover your confirmed cash claim.');
      const paid=payBonus(state,()=>this.computer.save(),receipt);
      this.limit=receipt;this.recoverable=false;this.known=true;
      this.message=paid?'Added $1,000 to your game.':'This $1,000 was already added.';
      this.computer.update();
    },{message:'Cash confirmation timed out. Retry to recover the same claim.'});}
    catch(e){this.known=false;this.message=e.message;}
    finally{this.busy=false;this.onChange();}
  }
}
