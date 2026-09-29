import {firebaseConfig,useEmulators} from './config.js';
let creating;
export async function createAuth(){
  if(!creating)creating=initialize().catch(error=>{creating=null;throw error;});
  return creating;
}
async function initialize(){
  const [{initializeApp},sdk]=await Promise.all([import('firebase/app'),import('firebase/auth')]);
  const app=initializeApp(useEmulators?{...firebaseConfig,projectId:'demo-dfp-comments',apiKey:'demo-key'}:firebaseConfig,'dfp-comments');
  const auth=sdk.initializeAuth(app,{persistence:[sdk.indexedDBLocalPersistence,sdk.browserLocalPersistence]});
  if(useEmulators)sdk.connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
  await auth.authStateReady();
  let anonymous;
  return {
    get user(){return auth.currentUser;},
    listen:fn=>sdk.onAuthStateChanged(auth,fn),
    anonymous:()=>anonymous||=(sdk.signInAnonymously(auth).finally(()=>{anonymous=null;})),
    send:(email,url)=>sdk.sendSignInLinkToEmail(auth,email,{url,handleCodeInApp:true}),
    complete:(email,link)=>sdk.signInWithEmailLink(auth,email,link),
    isLink:link=>sdk.isSignInWithEmailLink(auth,link),
    logout:()=>sdk.signOut(auth)
  };
}
