import {createRemoteJWKSet,jwtVerify,importPKCS8,SignJWT} from 'jose';
import {CommentError,OWNER_EMAIL,ownerClaims} from '../shared/comments.js';
export const PROJECT_ID='dfp-game-e2926';
export const DATABASE_URL='https://dfp-game-e2926-default-rtdb.firebaseio.com';
export const WORKER_AUTH={uid:'dfp-comments-worker',token:{comments_worker:true}};
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
let accessCache;
export async function verifyFirebaseToken(token,{keySet=keys,project=PROJECT_ID}={}){
  if(!token||token.length>8192)throw new CommentError('unauthorized','Please sign in again.',401);
  try{
    const {payload}=await jwtVerify(token,keySet,{algorithms:['RS256'],issuer:`https://securetoken.google.com/${project}`,audience:project,requiredClaims:['exp','iat','auth_time','sub']});
    if(typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128||!Number.isFinite(payload.auth_time)||payload.auth_time>Date.now()/1000+30||payload.iat>Date.now()/1000+30)throw new Error('claims');
    return {...payload,uid:payload.sub,owner:false};
  }catch{throw new CommentError('unauthorized','Your session could not be verified. Please sign in again.',401);}
}
export async function requireOwner(identity,token,env,{fetcher=fetch}={}){
  if(!ownerClaims(identity))throw new CommentError('forbidden','Only the verified producer can open this app.',403);
  const response=await fetcher(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token}),signal:AbortSignal.timeout(8000)});
  const data=await response.json(),user=data.users?.[0];
  if(!response.ok||!user||user.localId!==identity.uid||user.email!==OWNER_EMAIL||!user.emailVerified||user.disabled||Number(user.validSince||0)>identity.auth_time)throw new CommentError('forbidden','Producer authorization expired. Sign in again.',403);
  return {...identity,owner:true};
}
async function accessToken(env){
  if(accessCache&&accessCache.until>Date.now()+60000)return accessCache.token;
  let account;try{account=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);}catch{throw new CommentError('setup','Comments are not connected yet.',503);}
  if(account.project_id!==PROJECT_ID||typeof account.private_key!=='string'||!account.client_email?.endsWith(`@${PROJECT_ID}.iam.gserviceaccount.com`))throw new CommentError('setup','Comments service configuration needs attention.',503);
  const key=await importPKCS8(account.private_key,'RS256');
  const assertion=await new SignJWT({scope:'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email'}).setProtectedHeader({alg:'RS256'}).setIssuer(account.client_email).setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h').sign(key);
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw new CommentError('service','Comments are temporarily unavailable. Your draft is safe.',503);
  const data=await r.json();accessCache={token:data.access_token,until:Date.now()+Number(data.expires_in)*1000};return data.access_token;
}
export class FirebaseStore {
  constructor({base=DATABASE_URL,token,namespace,fetcher=fetch,authOverride=WORKER_AUTH}){Object.assign(this,{base,token,namespace,fetcher,authOverride});}
  async request(path,method='GET',body,query){
    const url=new URL(`${this.base}/peopleComments${path?'/'+path:''}.json`);
    if(this.namespace)url.searchParams.set('ns',this.namespace);
    // Enforce database revision validation even for privileged server requests.
    url.searchParams.set('auth_variable_override',JSON.stringify(this.authOverride));
    for(const [k,v] of Object.entries(query||{}))url.searchParams.set(k,JSON.stringify(v));
    const r=await this.fetcher(url,{method,headers:{authorization:`Bearer ${await this.token()}`,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
    if(!r.ok)throw new CommentError('storage','Comments could not be saved or loaded. Please retry.',503);
    return r.json();
  }
  get(path){return this.request(path);}
  patch(value){return this.request('','PATCH',value);}
  list(path,limit,cursor){return this.request(path,'GET',undefined,{orderBy:'$key',limitToLast:limit,...(cursor?{endAt:cursor}: {})});}
}
export const productionStore=env=>new FirebaseStore({token:()=>accessToken(env)});
