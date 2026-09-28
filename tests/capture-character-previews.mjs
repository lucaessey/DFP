import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const root=process.env.DFP_DEV_URL||'http://localhost:8080',out=process.env.DFP_EVIDENCE_DIR||'artifacts/stickman';mkdirSync(out,{recursive:true});
const b=await chromium.launch({channel:'msedge',headless:true});
try{const p=await b.newPage({viewport:{width:1280,height:980}});await p.goto(`${root}/tests/character-preview.html`);await p.waitForFunction(()=>window.previewReady);await p.screenshot({path:`${out}/character-study.png`,fullPage:true});
await p.goto(`${root}/${out}/index.html`);const video=p.locator('video');await video.scrollIntoViewIfNeeded();await video.evaluate(v=>new Promise(resolve=>{if(v.readyState>=1)resolve();else v.addEventListener('loadedmetadata',resolve,{once:true});}));const duration=await video.evaluate(v=>v.duration);
const frames=[];for(const proportion of [.2,.5,.8]){const time=duration*proportion;await video.evaluate((v,t)=>new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=t;}),time);await video.screenshot({path:`${out}/recording-${Math.round(proportion*100)}.png`});frames.push(time);}
writeFileSync(`${out}/recording.json`,JSON.stringify({durationSeconds:duration,inspectedSeconds:frames},null,2));console.log('Captured character views and recording frames',JSON.stringify({duration,frames}));
}finally{await b.close();}
