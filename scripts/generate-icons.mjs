// Original vector icon rasterized without any network assets.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc=buf=>{let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
function chunk(name,data){const type=Buffer.from(name),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([type,data])));return Buffer.concat([length,type,data,sum]);}
function icon(size,maskable=false){const rows=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const scale=maskable?.7:.82,px=(x/size-.5)/scale,py=(y/size-.5)/scale;let rgb=[241,139,80];const body=(Math.abs(px)<.28&&py>-.15&&py<.17)||(Math.hypot(px+.27,(py-.11)*.83)<.15)||(Math.hypot(px-.27,(py-.11)*.83)<.15);if(body)rgb=[255,244,214];if((Math.abs(px+.19)<.025&&py>-.095&&py<.08)||(Math.abs(py+.008)<.025&&px>-.275&&px<-.105)||Math.hypot(px-.18,py+.065)<.033||Math.hypot(px-.28,py-.04)<.033)rgb=[171,102,54];const i=y*(size*4+1)+1+x*4;rows[i]=rgb[0];rows[i+1]=rgb[1];rows[i+2]=rgb[2];rows[i+3]=255;}const head=Buffer.alloc(13);head.writeUInt32BE(size);head.writeUInt32BE(size,4);head[8]=8;head[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
for(const size of [192,512])writeFileSync(new URL(`../public/icon-${size}.png`,import.meta.url),icon(size));
writeFileSync(new URL('../public/icon-maskable.png',import.meta.url),icon(512,true));
