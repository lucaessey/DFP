import {databaseURL,useEmulators} from './config.js';
import {readJSON} from './network.js';
import {CommentError,requestKey} from '../../shared/comments.js';
import {submissionIdentity,submissionChanges,moderationChanges,recordResult,serverTime} from '../../shared/manual-comments.js';

// Only Firebase ID tokens go to this project's database. Never log these URLs.
export async function databaseRequest(path,token,signal,{patch,query}={}){
  const url=new URL(`${databaseURL}/peopleComments${path?'/'+path:''}.json`);
  if(useEmulators)url.searchParams.set('ns','demo-dfp-comments-default-rtdb');
  if(token)url.searchParams.set('auth',token);
  for(const [key,value] of Object.entries(query||{}))url.searchParams.set(key,value);
  return readJSON(url,{signal,...(patch?{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(patch)}:{})});
}
export async function writeComment(path,input,user,signal){
  const token=await user.getIdToken(path.startsWith('/owner/'));signal.throwIfAborted();
  const read=(key,query)=>databaseRequest(key,token,signal,{query}),write=patch=>databaseRequest('',token,signal,{patch});
  if(path==='/comments'){
    const identity=await submissionIdentity(input,user.uid);signal.throwIfAborted();
    const receiptPath=`receipts/${user.uid}/${identity.requestId}`;
    const confirmed=receipt=>{
      if(!receipt)return null;
      if(receipt.fingerprint!==identity.fingerprint||receipt.id!==identity.id)throw new CommentError('request-conflict','This request was already used. Edit your draft before sending it again.',409);
      return recordResult(receipt);
    };
    const existing=confirmed(await read(receiptPath));if(existing)return existing;
    const limits=await read(`submissionLimits/${user.uid}`);
    try{await write(submissionChanges(identity,user.uid,limits));}
    catch(error){
      // Concurrent/lost-response retries may already have committed. Never create a new ID.
      signal.throwIfAborted();const receipt=confirmed(await read(receiptPath));if(receipt)return receipt;
      if(error.status===401||error.status===403)throw new CommentError('submission-denied','Your comment was not confirmed. Wait 30 seconds and retry. If this continues, feedback setup needs attention; your draft is saved.',error.status);
      throw error;
    }
    const receipt=confirmed(await read(receiptPath));
    if(!receipt)throw new CommentError('receipt','Firebase did not confirm receipt. Your draft is saved; please retry.',503);
    return receipt;
  }
  if(!/^[a-f0-9]{48}$/.test(input.id||''))throw new CommentError('comment','Comment not found.',404);
  requestKey(input.requestId);
  if(path==='/report'){
    const key=`reports/${input.id}/${user.uid}`;
    if(!await read(key))await write({[key]:{createdAt:serverTime()}});
    return {status:'reported'};
  }
  if(path!=='/owner/action')throw new CommentError('route','This action is unavailable.',404);
  const key=`internal/records/${input.id}`,old=await read(key),patch=moderationChanges(old,input);
  if(patch)try{await write(patch);}catch(error){
    signal.throwIfAborted();const latest=await read(key);
    if(latest?.actionId===input.requestId&&latest.lastAction===input.action)return recordResult(latest);
    if(error.status===401||error.status===403)throw new CommentError('changed','This comment changed or access expired. Refresh before trying again.',409);
    throw error;
  }
  return recordResult(patch?patch[key]:old);
}
