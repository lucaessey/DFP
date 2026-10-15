import * as T from 'three';
import {ball,capsule,group,food} from './scene-assets.js';
import {EYE_HEIGHT} from './first-person.js';

// A separate viewmodel pass keeps every item shape below the main sight line.
export class FirstPersonView{
 constructor(){
  this.camera=new T.PerspectiveCamera(70,1,.035,110);this.camera.rotation.order='YXZ';
  this.scene=new T.Scene();this.hudCamera=new T.OrthographicCamera(-1,1,1,-1,.01,20);this.hudCamera.position.set(0,0,5);
  this.scene.add(new T.HemisphereLight('#fff5df','#566b79',2.8));const light=new T.DirectionalLight('#fff4df',3);light.position.set(-2,4,5);this.scene.add(light);
  this.hands=group(this.scene);this.goods=group(this.scene);this.key='';
  for(const side of [-1,1]){const hand=group(this.hands,side*.76,-.86,0);hand.rotation.z=side*-.35;capsule(hand,'#2cbeb4',0,-.16,0,.20,.3,.19);capsule(hand,'#15191f',0,.02,0,.16,.25,.17);ball(hand,'#15191f',0,.15,.04,.24,.22,.20);ball(hand,'#15191f',-side*.10,.10,.07,.10,.14,.13);}
 }
 update(s,actor,width,height){
  this.camera.aspect=width/height;this.camera.fov=Math.min(70,T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(50))/this.camera.aspect)));this.camera.position.set(actor.x,EYE_HEIGHT,actor.y);this.camera.rotation.set(s.view.pitch,s.view.yaw,0,'YXZ');this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
  const bag=actor.bag??[],key=bag.slice(0,3).join('/');if(key!==this.key){this.goods.clear();this.key=key;for(const [i,kind]of bag.slice(0,3).entries()){const holder=group(this.goods,.70,-.79+i*.125,.2),m=food(kind);const bounds=new T.Box3().setFromObject(m),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const scale=Math.min(.29/Math.max(size.x,.01),.12/Math.max(size.y,.01),.24/Math.max(size.z,.01));m.scale.setScalar(scale);m.position.copy(center).multiplyScalar(-scale);holder.add(m);}}
  for(const model of [...this.hands.children,...this.goods.children])model.scale.x=1/Math.max(.65,width/height);
  // Keep the center 60% of the view unobstructed, even on narrow portrait screens.
  this.count=bag.length;this.represented=Math.min(3,bag.length);const pulse=s.settings.reducedMotion?0:actor.action?Math.sin((s.time??s.story.clock)*4)*.012:0;this.hands.position.y=pulse;this.goods.position.y=pulse;
 }
 render(gl){const clear=gl.autoClear,reset=gl.info.autoReset;gl.autoClear=false;gl.info.autoReset=false;gl.clearDepth();gl.render(this.scene,this.hudCamera);gl.autoClear=clear;gl.info.autoReset=reset;}
 diagnostics(){return {mode:'first-person',eyeHeight:EYE_HEIGHT,fov:this.camera.fov,near:this.camera.near,position:this.camera.position.toArray(),yaw:this.camera.rotation.y,pitch:this.camera.rotation.x,roll:this.camera.rotation.z,quantity:this.count,representativeItems:this.represented,handOffset:this.hands.position.y};}
}
