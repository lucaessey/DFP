// Local test harness only. Production worker/index.js never imports emulator authentication.
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {decodeJwt,decodeProtectedHeader} from 'jose';
import {FirebaseStore,requireOwner} from '../worker/firebase.js';
import {CommentService,SpamLimits} from '../worker/core.js';
import {createHandler} from '../worker/api.js';
import {CommentError} from '../shared/comments.js';
const db=new FirebaseStore({base:'http://127.0.0.1:9000',namespace:'demo-dfp-comments-default-rtdb',token:async()=> 'owner'});
const rulesResponse=await fetch('http://127.0.0.1:9000/.settings/rules.json?ns=demo-dfp-comments-default-rtdb',{method:'PUT',headers:{authorization:'Bearer owner','content-type':'application/json'},body:readFileSync(new URL('../firebase/database.rules.json',import.meta.url),'utf8')});
if(!rulesResponse.ok)throw new Error('Start the local Firebase emulators before the test API.');
const values=new Map(),storage={get:async k=>values.get(k),put:async v=>Object.entries(v).forEach(([k,x])=>values.set(k,x))};
const service=new CommentService({db,limits:new SpamLimits(storage)});let queue=Promise.resolve();
const lookup=async(token)=>{
  const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:lookup?key=demo-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
  const data=await r.json();if(!r.ok||!data.users?.[0])throw new CommentError('unauthorized','Test session invalid.',401);return data.users[0];
};
const handler=createHandler({
  origins:['http://127.0.0.1:4186','http://localhost:4186','http://127.0.0.1:8087'],service,
  authenticate:async token=>{const claims=decodeJwt(token);if(decodeProtectedHeader(token).alg!=='none'||claims.aud!=='demo-dfp-comments'||claims.iss!=='https://securetoken.google.com/demo-dfp-comments'||claims.exp<Date.now()/1000)throw new CommentError('unauthorized','Test token invalid.',401);const user=await lookup(token);return {...claims,uid:user.localId,owner:false};},
  authorizeOwner:(identity,token)=>requireOwner(identity,token,{FIREBASE_WEB_API_KEY:'demo-key'},{fetcher:async()=>Response.json({users:[await lookup(token)]})}),
  ipIdentity:async()=> 'local-emulator-hash',
  mutate:(method,body,identity)=>{const next=queue.catch(()=>{}).then(()=>service[method](body,identity));queue=next;return next;}
});
http.createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const r=await handler(new Request('http://127.0.0.1:8787'+req.url,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}));res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));}catch{res.writeHead(500);res.end('Local test service error');}}).listen(8787,'127.0.0.1',()=>console.log('Emulator-only comments API ready at http://127.0.0.1:8787'));
