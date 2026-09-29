import {CommentError,parseFilter} from '../shared/comments.js';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
export async function readJSON(request){
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new CommentError('content-type','Send JSON.',415);
  if(Number(request.headers.get('content-length'))>8192)throw new CommentError('size','Request is too large.',413);
  const reader=request.body?.getReader();if(!reader)throw new CommentError('body','A request body is required.');
  let length=0,chunks=[];while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>8192){await reader.cancel();throw new CommentError('size','Request is too large.',413);}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new CommentError('json','Request could not be read.');}
}
export function createHandler({authenticate,authorizeOwner,service,mutate,origins,ipIdentity}){
  return async request=>{
    const origin=request.headers.get('origin'),allowed=origin&&origins.includes(origin);
    let response;
    try{
      if(origin&&!allowed)throw new CommentError('origin','This site is not allowed.',403);
      if(request.method==='OPTIONS')response=new Response(null,{status:204});
      else{
        const url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
        if(path==='/health'&&request.method==='GET')response=json({service:'DFP People Comments',connected:true});
        else if(path==='/comments'&&request.method==='GET')response=json(await service.list('public',parseFilter(url.searchParams)));
        else{
          const match=/^Bearer ([^\s]+)$/.exec(request.headers.get('authorization')||'');
          if(!match)throw new CommentError('unauthorized','Please sign in before continuing.',401);
          let identity=await authenticate(match[1]);
          if(path.startsWith('/owner/'))identity=await authorizeOwner(identity,match[1]);
          if(path==='/owner/session'&&request.method==='GET')response=json({owner:identity.owner===true});
          else if(path==='/owner/comments'&&request.method==='GET'){
            const view={producer:'private',everyone:'ownerPublic',pending:'pending'}[url.searchParams.get('audience')];
            if(!view)throw new CommentError('audience','Choose an inbox.');
            response=json(await service.list(view,parseFilter(url.searchParams)));
          }else if(path==='/comments'&&request.method==='POST'){
            identity.ip=await ipIdentity(request);response=json(await mutate('submit',await readJSON(request),identity));
          }else if((path==='/owner/action'||path==='/report')&&request.method==='POST'){
            const body=await readJSON(request);if(path==='/report'&&body.action!=='report')throw new CommentError('action','Use the report action.');
            identity.ip=await ipIdentity(request);response=json(await mutate('act',body,identity));
          }else throw new CommentError('not-found','Not found.',404);
        }
      }
    }catch(error){response=json({error:error instanceof CommentError?error.code:'unavailable',message:error instanceof CommentError?error.message:'Comments are temporarily unavailable. Please retry.'},error instanceof CommentError?error.status:503);}
    if(allowed){response.headers.set('access-control-allow-origin',origin);response.headers.set('vary','Origin');response.headers.set('access-control-allow-methods','GET, POST, OPTIONS');response.headers.set('access-control-allow-headers','Authorization, Content-Type');response.headers.set('access-control-max-age','600');}
    response.headers.set('cache-control','no-store');return response;
  };
}
