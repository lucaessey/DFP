import test from 'node:test';
import assert from 'node:assert/strict';
import {bounded,readJSON} from '../src/people/network.js';

test('deadline includes stalled authentication and releases the caller',async()=>{
  await assert.rejects(bounded(()=>new Promise(()=>{}),{ms:20}),{code:'timeout'});
});
test('cancelled reads cannot finish after the private view closes',async()=>{
  const controller=new AbortController();
  const request=bounded(()=>new Promise(()=>{}),{signal:controller.signal});
  controller.abort();await assert.rejects(request,{name:'AbortError'});
  let started=false;await assert.rejects(bounded(()=>{started=true;},{signal:controller.signal}),{name:'AbortError'});assert.equal(started,false);
});
test('a deadline also cancels a stalled response body',async t=>{
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:()=>new Promise(()=>{})}));
  await assert.rejects(bounded(signal=>readJSON('https://example.invalid/',{signal}),{ms:20}),{code:'timeout'});
});
test('network and malformed response errors never expose a Firebase token URL',async t=>{
  const url='https://example.invalid/?auth=private-token';
  const mock=t.mock.method(globalThis,'fetch',async()=>{throw Error(url);});
  await assert.rejects(readJSON(url),e=>e.code==='network'&&!e.message.includes('private-token'));
  mock.mock.mockImplementation(async()=>({ok:true,json:async()=>{throw Error(url);}}));
  await assert.rejects(readJSON(url),e=>e.code==='response'&&!e.message.includes('private-token'));
});
