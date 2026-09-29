import {DurableObject} from 'cloudflare:workers';
import {CommentService,SpamLimits} from './core.js';
import {createHandler} from './api.js';
import {productionStore,verifyFirebaseToken,requireOwner} from './firebase.js';
import {CommentError} from '../shared/comments.js';

export class CommentCoordinator extends DurableObject {
  async fetch(request){
    return this.ctx.blockConcurrencyWhile(async()=>{
      try{
        const {method,body,identity}=await request.json();
        if(!['submit','act'].includes(method))throw new CommentError('action','Unknown action.');
        const service=new CommentService({db:productionStore(this.env),limits:new SpamLimits(this.ctx.storage)});
        return Response.json(await service[method](body,identity));
      }catch(e){return Response.json({error:e instanceof CommentError?e.code:'unavailable',message:e instanceof CommentError?e.message:'Comments are temporarily unavailable.'},{status:e instanceof CommentError?e.status:503});}
    });
  }
}
export default {
  async fetch(request,env){
    if(!env.FIREBASE_SERVICE_ACCOUNT||!env.IP_HASH_SECRET||!env.FIREBASE_WEB_API_KEY||!env.COMMENT_COORDINATOR)return Response.json({error:'setup',message:'People Comments are not connected yet. Your draft stays on this device.'},{status:503,headers:{'cache-control':'no-store'}});
    const service=new CommentService({db:productionStore(env)});
    const handler=createHandler({
      origins:(env.ALLOWED_ORIGINS||'https://lucaessey.github.io').split(',').map(s=>s.trim()),
      authenticate:token=>verifyFirebaseToken(token),
      authorizeOwner:(identity,token)=>requireOwner(identity,token,env),service,
      ipIdentity:async req=>{
        const ip=req.headers.get('CF-Connecting-IP');if(!ip)throw new CommentError('network','Unable to verify connection.',503);
        const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.IP_HASH_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
        return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip)))].map(b=>b.toString(16).padStart(2,'0')).join('');
      },
      mutate:async(method,body,identity)=>{
        const coordinator=env.COMMENT_COORDINATOR.get(env.COMMENT_COORDINATOR.idFromName('dfp-comments-v1'));
        const r=await coordinator.fetch('https://coordinator.internal/',{method:'POST',body:JSON.stringify({method,body,identity})}),data=await r.json();
        if(!r.ok)throw new CommentError(data.error,data.message,r.status);return data;
      }
    });
    return handler(request);
  }
};
