import {CommentError,validateComment,requestKey} from './comments.js';

export const serverTime=()=>({'.sv':'timestamp'});
export async function hash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export const recordResult=record=>({id:record.id,status:record.status});
export function commentChanges(record,previous){
  const patch={},view=status=>({published:'public',producer:'private',pending:'pending'}[status]);
  if(previous)for(const name of [view(previous.status),previous.status==='published'?'ownerPublic':null].filter(Boolean))for(const stars of ['all',previous.rating])patch[`${name}/${stars}/${previous.sortKey}`]=null;
  const publicRow={id:record.id,text:record.text,rating:record.rating,createdAt:record.createdAt};
  const privateRow={...publicRow,audience:record.audience,status:record.status,read:!!record.read,revision:record.revision,reason:record.reason||'',reported:!!record.reported};
  if(view(record.status))for(const stars of ['all',record.rating])patch[`${view(record.status)}/${stars}/${record.sortKey}`]=record.status==='published'?publicRow:privateRow;
  if(record.status==='published')for(const stars of ['all',record.rating])patch[`ownerPublic/${stars}/${record.sortKey}`]=privateRow;
  patch[`internal/records/${record.id}`]=record;
  return patch;
}
export async function submissionIdentity(input,uid){
  const value=validateComment(input),requestId=requestKey(input.requestId);
  return {value,requestId,id:(await hash(uid+'\n'+requestId)).slice(0,48),fingerprint:await hash(JSON.stringify(value))};
}
export function submissionChanges(identity,uid,oldLimits,now=Date.now()){
  const {id,value,requestId,fingerprint}=identity,old=oldLimits||{};
  if(old.lastAt>now-30000)throw new CommentError('rate-limit','Please wait 30 seconds between comments. Your draft is saved.',429);
  const hourReset=!old.hourStart||old.hourStart<=now-3600000,dayReset=!old.dayStart||old.dayStart<=now-86400000;
  const limits={lastId:id,lastAt:serverTime(),hourStart:hourReset?serverTime():old.hourStart,hourCount:hourReset?1:old.hourCount+1,dayStart:dayReset?serverTime():old.dayStart,dayCount:dayReset?1:old.dayCount+1};
  if(limits.hourCount>6||limits.dayCount>20)throw new CommentError('rate-limit','You have reached the feedback limit. Please try again later; your draft is saved.',429);
  const record={...value,id,uid,requestId,fingerprint,status:value.audience==='producer'?'producer':'pending',createdAt:serverTime(),requestedAt:now,sortKey:`${now}_${id}`,revision:1,read:false,reason:value.audience==='producer'?'Private feedback.':'Waiting for the producer to review.',reported:false};
  return {...commentChanges(record),[`receipts/${uid}/${requestId}`]:{id,fingerprint,status:record.status,createdAt:serverTime()},[`submissionLimits/${uid}`]:limits};
}
export function moderationChanges(old,input){
  requestKey(input.requestId);
  if(!old)throw new CommentError('comment','This comment is unavailable.',404);
  if(old.actionId===input.requestId&&old.lastAction===input.action)return null;
  if(old.revision!==input.revision)throw new CommentError('changed','This comment changed. Refresh before taking action.',409);
  const record={...old,read:!!old.read,reported:!!old.reported,revision:old.revision+1,updatedAt:serverTime(),actionId:input.requestId,lastAction:input.action};
  if(input.action==='read'&&old.status==='producer')record.read=true;
  else if(input.action==='approve'&&old.status==='pending'){record.status=old.audience==='producer'?'producer':'published';record.reason='Approved by the producer.';}
  else if(input.action==='reject'&&old.status==='pending'){record.status='rejected';record.reason='The producer did not approve this comment.';}
  else if(input.action==='hide'&&old.status==='published'){record.status='hidden';record.reason='Hidden by the producer.';}
  else throw new CommentError('changed','This action is no longer available. Refresh the comments.',409);
  return commentChanges(record,old);
}
