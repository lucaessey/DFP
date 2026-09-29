import {CommentError,validateComment,requestKey,PAGE_SIZE} from '../shared/comments.js';
import {moderate} from './moderation.js';

export async function digest(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
const timestamp=()=>({'.sv':'timestamp'});
const viewFor=status=>({published:'public',producer:'private',pending:'pending'}[status]);
function projection(record){
  const publicFields={id:record.id,text:record.text,rating:record.rating,createdAt:record.createdAt};
  return record.status==='published'?publicFields:{...publicFields,audience:record.audience,status:record.status,read:!!record.read,revision:record.revision,reason:record.reason,reported:!!record.reported};
}
function changes(record,previous){
  const patch={};
  if(previous?.status==='published')for(const stars of ['all',String(previous.rating)])patch[`ownerPublic/${stars}/${previous.sortKey}`]=null;
  if(record.status==='published')for(const stars of ['all',String(record.rating)])patch[`ownerPublic/${stars}/${record.sortKey}`]={...projection(record),audience:record.audience,status:record.status,revision:record.revision};
  if(previous&&viewFor(previous.status))for(const stars of ['all',String(previous.rating)])patch[`${viewFor(previous.status)}/${stars}/${previous.sortKey}`]=null;
  if(viewFor(record.status))for(const stars of ['all',String(record.rating)])patch[`${viewFor(record.status)}/${stars}/${record.sortKey}`]=projection(record);
  patch[`internal/records/${record.id}`]=record;
  return patch;
}
const result=r=>({id:r.id,status:r.status,reason:r.status==='rejected'?r.reason:undefined});
export class CommentService {
  constructor({db,limits,now=()=>Date.now(),classify=moderate}){Object.assign(this,{db,limits,now,classify});}
  async list(view,{stars,cursor}){
    const data=await this.db.list(`${view}/${stars}`,PAGE_SIZE+1,cursor);
    const rows=Object.entries(data||{}).filter(([key])=>!cursor||key<cursor).sort(([a],[b])=>b.localeCompare(a));
    const page=rows.slice(0,PAGE_SIZE);
    return {comments:page.map(([key,value])=>({...value,key})),next:Object.keys(data||{}).length>PAGE_SIZE&&page.length?page.at(-1)[0]:null};
  }
  async submit(input,identity){
    const value=validateComment(input),key=requestKey(input.requestId);
    const id=(await digest(identity.uid+'\n'+key)).slice(0,48),fingerprint=await digest(JSON.stringify(value));
    const previous=await this.db.get(`internal/records/${id}`);
    if(previous){if(previous.fingerprint!==fingerprint)throw new CommentError('request-conflict','This request already belongs to a different comment.',409);return result(previous);}
    await this.limits.consume(identity,'submit',this.now());
    let check;try{check=await this.classify(value.text);}catch{check=null;}
    if(!check||!['allow','reject','review'].includes(check.decision))check={decision:'review',reason:'Language checking is unavailable. A producer will review this privately.',version:1};
    const status=check.decision==='reject'?'rejected':check.decision==='review'?'pending':value.audience==='everyone'?'published':'producer';
    const record={...value,id,uid:identity.uid,fingerprint,status,createdAt:timestamp(),sortKey:`${this.now().toString().padStart(13,'0')}_${id}`,revision:1,read:false,reason:check.reason,moderationVersion:check.version||1,actions:{}};
    await this.db.patch(changes(record));return result(record);
  }
  async act(input,identity){
    const {id,action}=input;requestKey(input.requestId);
    if(!/^[a-f0-9]{48}$/.test(id||''))throw new CommentError('comment','Comment not found.',404);
    if(!['approve','reject','hide','read','report'].includes(action))throw new CommentError('action','Unknown action.');
    if(action!=='report'&&!identity.owner)throw new CommentError('forbidden','Producer access is required.',403);
    const old=await this.db.get(`internal/records/${id}`);
    if(!old||(action==='report'&&old.status!=='published'&&!old.reports?.[await digest(identity.uid)]))throw new CommentError('comment','Comment not found.',404);
    const actionId=await digest(identity.uid+'\n'+input.requestId),fingerprint=await digest(JSON.stringify({id,action,revision:input.revision??null}));
    if(old.actions?.[actionId]){if(old.actions[actionId]!==fingerprint)throw new CommentError('request-conflict','Request was already used.',409);return action==='report'?{status:'reported'}:result(old);}
    const record=structuredClone(old);record.actions||={};
    if(action==='report'){
      const reporter=await digest(identity.uid);
      if(record.reports?.[reporter])return {status:'reported'};
      await this.limits.consume(identity,'report',this.now());
      record.reports={...record.reports,[reporter]:timestamp()};record.reported=true;record.status='pending';record.reason='Reported by a player. Please review before republishing.';
    }else{
      if(input.revision!==old.revision)throw new CommentError('changed','This comment changed. Refresh before taking action.',409);
      if(action==='read'&&old.status==='producer')record.read=true;
      else if(action==='approve'&&old.status==='pending'){record.status=old.audience==='producer'?'producer':'published';record.reason='Approved by the producer.';}
      else if(action==='reject'&&old.status==='pending'){record.status='rejected';record.reason='The producer did not approve this comment.';}
      else if(action==='hide'&&old.status==='published'){record.status='hidden';record.reason='Hidden by the producer.';}
      else throw new CommentError('changed','This action is no longer available. Refresh the comments.',409);
    }
    record.revision++;record.updatedAt=timestamp();record.actions[actionId]=fingerprint;
    await this.db.patch(changes(record,old));return action==='report'?{status:'reported'}:result(record);
  }
}

// Persisted rolling buckets in the coordinator, not an isolate-local Map.
export class SpamLimits {
  constructor(storage){this.storage=storage;}
  async consume(identity,action,now){
    const specs=[{key:`uid:${action}:${identity.uid}`,hour:action==='submit'?6:10,day:action==='submit'?20:30,cooldown:action==='submit'?30000:3000},{key:`ip:${action}:${identity.ip}`,hour:action==='submit'?25:60,day:action==='submit'?80:150,cooldown:0}];
    const updates={};for(const s of specs){const old=await this.storage.get(s.key)||[],times=old.filter(t=>t>now-86400000);if(times.length>=s.day||times.filter(t=>t>now-3600000).length>=s.hour||(times.length&&now-times.at(-1)<s.cooldown))throw new CommentError('rate-limit','Please wait before sending more feedback.',429);updates[s.key]=[...times,now];}
    await this.storage.put(updates);
  }
}
