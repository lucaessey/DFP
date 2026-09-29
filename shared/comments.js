export const OWNER_EMAIL = 'lucaessey@gmail.com';
export const COMMENT_LIMIT = 500;
export const PAGE_SIZE = 20;
export const PRIVATE_WARNING = 'Only the game’s producer will see this comment. Choose Everyone to share it with all players.';
export const PUBLIC_WARNING = 'This comment will be visible to all players after it passes the language check.';
export const COMMENT_STATES = {published:'Published',producer:'Sent to Producer',pending:'Awaiting Review',rejected:'Rejected',hidden:'Hidden'};
export class CommentError extends Error {
  constructor(code,message,status=400){super(message);this.code=code;this.status=status;}
}
export function validateComment(input){
  if(!input||typeof input.text!=='string')throw new CommentError('text','Write a comment first.');
  const text=input.text.normalize('NFC').trim();
  if(!text||!text.replace(/[\p{Z}\p{C}]/gu,''))throw new CommentError('text','Write a comment, not just spaces.');
  if([...text].length>COMMENT_LIMIT)throw new CommentError('length','Keep your comment to 500 characters.');
  if(!Number.isInteger(input.rating)||input.rating<1||input.rating>5)throw new CommentError('rating','Choose 1, 2, 3, 4, or 5 stars.');
  if(!['producer','everyone'].includes(input.audience))throw new CommentError('audience','Choose Producer or Everyone.');
  if(input.audience==='producer'&&input.acknowledged!==true)throw new CommentError('acknowledgement','Confirm that only the producer will see your comment.');
  return {text,rating:input.rating,audience:input.audience,acknowledged:input.audience==='producer'};
}
export function requestKey(value){
  if(typeof value!=='string'||! /^[a-zA-Z0-9_-]{16,80}$/.test(value))throw new CommentError('request-id','A valid request identifier is required.');
  return value;
}
export function parseFilter(search){
  const stars=search.get('stars')||'all',cursor=search.get('before')||null;
  if(!/^(all|[1-5])$/.test(stars))throw new CommentError('rating','Choose All Stars or 1–5 stars.');
  if(cursor&&!/^\d{13}_[a-f0-9]{48}$/.test(cursor))throw new CommentError('cursor','This page marker is invalid. Refresh the comments.');
  return {stars,cursor};
}
export function ownerClaims(claims){
  return claims?.email===OWNER_EMAIL&&claims.email_verified===true&&['password','google.com'].includes(claims.firebase?.sign_in_provider);
}
export function commentPage(data,cursor){
  const entries=Object.entries(data||{}),rows=entries.filter(([key])=>!cursor||key<cursor).sort(([a],[b])=>b.localeCompare(a));
  const page=rows.slice(0,PAGE_SIZE);
  return {comments:page.map(([key,value])=>({...value,key})),next:entries.length>PAGE_SIZE&&page.length?page.at(-1)[0]:null};
}
export function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
