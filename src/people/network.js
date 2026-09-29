import {CommentError} from '../../shared/comments.js';

// Include authentication and response parsing in the deadline, not just fetch headers.
export async function bounded(task,{signal,ms=15000,message='No confirmation received. Your draft is safe; retry to check its status.'}={}){
  const controller=new AbortController();
  const abort=()=>controller.abort(signal.reason);
  if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(new CommentError('timeout',message,503)),ms);
  let onAbort;
  try{
    const cancelled=new Promise((_,reject)=>{onAbort=()=>reject(controller.signal.reason);controller.signal.addEventListener('abort',onAbort,{once:true});});
    controller.signal.throwIfAborted();
    return await Promise.race([Promise.resolve().then(()=>task(controller.signal)),cancelled]);
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);controller.signal.removeEventListener('abort',onAbort);}
}

export async function readJSON(url,options={}){
  let response;
  try{response=await fetch(url,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',...options});}
  catch(error){if(options.signal?.aborted)throw options.signal.reason;throw new CommentError('network','Connection failed. Nothing was confirmed; your draft is safe. Please retry.',503);}
  let data;
  try{data=await response.json();}
  catch{if(options.signal?.aborted)throw options.signal.reason;throw new CommentError('response','The service returned an unreadable response. Your draft is safe; please retry.',503);}
  options.signal?.throwIfAborted();
  if(!response.ok)throw new CommentError(typeof data?.error==='string'?data.error:'service',data?.message||(response.status===401||response.status===403?'Access was denied. Sign in again to check your permissions.':'Comments are temporarily unavailable. Your draft is safe; please retry.'),response.status);
  return data;
}
