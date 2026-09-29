import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,command,step} from '../src/simulation.js';
import {COMPUTER_GAMES,EMAIL_CATEGORIES,newComputer} from '../src/computer.js';
import {FURNITURE,ensureSecurityRound,securityTick,securitySelect} from '../src/security.js';
import {encode,decode,validateSave} from '../src/storage.js';
const ownComputer=()=>{const s=newGame();s.money=200;assert.ok(command(s,{type:'basement'}).ok);s.money=100;assert.equal(command(s,{type:'computer'}).cost,100);return s;};
test('computer needs basement and exactly $100; every app requires computer and rejects insufficient or duplicate purchases',()=>{
 let s=newGame();s.money=1000;assert.equal(command(s,{type:'computer'}).ok,false);command(s,{type:'basement'});
 for(const c of [{type:'email'},...COMPUTER_GAMES.map(g=>({type:'computer-game',id:g.id}))])assert.equal(command(s,c).ok,false);
 s.money=99;const old=encode(s);assert.equal(command(s,{type:'computer'}).ok,false);assert.equal(encode(s),old);s.money=100;assert.equal(command(s,{type:'computer',token:'pc'}).cost,100);assert.equal(s.money,0);
 s=decode(encode(s));for(const c of [{type:'computer'}, {type:'computer',token:'pc'}])assert.equal(command(s,c).ok,false);assert.equal(s.money,0);
 for(const c of [{type:'email'},...COMPUTER_GAMES.map(g=>({type:'computer-game',id:g.id}))]){
  s.money=49;const before=encode(s);assert.equal(command(s,c).ok,false);assert.equal(encode(s),before);s.money=50;assert.equal(command(s,{...c,token:`buy-${c.id||c.type}`}).cost,50);assert.equal(s.money,0);s=decode(encode(s));const paid=encode(s);assert.equal(command(s,c).ok,false);assert.equal(command(s,{...c,token:`buy-${c.id||c.type}`}).ok,false);assert.equal(encode(s),paid);
 }
 const saved=encode(s);assert.equal(command(s,{type:'computer-game',id:'https://unexpected.example/'}).ok,false);assert.equal(encode(s),saved);
});
test('security still costs $150 and needs every furnishing plus access to the computer',()=>{
 const s=newGame();s.money=10000;command(s,{type:'basement'});for(const p of FURNITURE)command(s,{type:'furniture',id:p.id});assert.equal(command(s,{type:'security'}).ok,false);command(s,{type:'computer'});
 for(const p of FURNITURE){s.basement.furniture[p.id]=false;const money=s.money;assert.equal(command(s,{type:'security'}).ok,false);assert.equal(s.money,money);s.basement.furniture[p.id]=true;}
 s.money=149;assert.equal(command(s,{type:'security'}).ok,false);s.money=150;assert.equal(command(s,{type:'security'}).cost,150);assert.equal(s.money,0);
});
test('schema-five security migrates intact, with no new charges, lost timers or replayed catch',()=>{
 const s=ownComputer();s.money=10000;for(const p of FURNITURE)command(s,{type:'furniture',id:p.id});command(s,{type:'security'});command(s,{type:'hire',id:0});ensureSecurityRound(s);securityTick(s,s.basement.security.round.remaining,true);securityTick(s,2,true);
 const before=structuredClone(s);s.version=5;delete s.basement.computer;let migrated=decode(JSON.stringify(s));assert.equal(migrated.version,7);assert.deepEqual(migrated.basement.computer,newComputer());assert.deepEqual(migrated.basement.security,before.basement.security);assert.deepEqual(migrated.floors,before.floors);assert.deepEqual(migrated.employees,before.employees);assert.equal(migrated.money,before.money);assert.equal(command(migrated,{type:'security'}).ok,false);
 const round=migrated.basement.security.round.id;assert.equal(command(migrated,{type:'computer'}).cost,100);const money=migrated.money;assert.equal(securitySelect(migrated,{roundId:round,person:'robber',watching:true}).amount,15);migrated=decode(encode(migrated));assert.equal(securitySelect(migrated,{roundId:round,person:'robber',watching:true}).ok,false);assert.equal(migrated.money,money+15);
});
test('email and game ownership survives reload while security stays paused during other activities',()=>{
 let s=ownComputer();s.money=10000;for(const p of FURNITURE)command(s,{type:'furniture',id:p.id});command(s,{type:'security'});ensureSecurityRound(s);securityTick(s,s.basement.security.round.remaining,true);securityTick(s,4,true);const sec=structuredClone(s.basement.security);
 command(s,{type:'email'});for(const g of COMPUTER_GAMES)command(s,{type:'computer-game',id:g.id});for(let i=0;i<800;i++)step(s,.05,{pausedPlayer:true,monitoring:false});assert.deepEqual(s.basement.security,sec);s=decode(encode(s));assert.deepEqual(s.basement.security,sec);assert.ok(s.basement.computer.email);assert.ok(COMPUTER_GAMES.every(g=>s.basement.computer.games[g.id]));
});
test('catalog has exactly the three approved HTTPS URLs; fictional email has distinct complete categories',()=>{
 assert.deepEqual(COMPUTER_GAMES.map(g=>[g.name,g.cost,g.url]),[['Boggle',50,'https://lucaessey.github.io/Boggle/'],['Wordventure',50,'https://lucaessey.github.io/wordventure/'],['Snake',50,'https://lucaessey.github.io/phaser-snake/']]);assert.deepEqual(EMAIL_CATEGORIES.map(c=>c.name),['Good Comments','Bad Reviews']);const messages=EMAIL_CATEGORIES.flatMap(c=>c.messages);assert.equal(new Set(messages.map(m=>m.body)).size,messages.length);for(const cat of EMAIL_CATEGORIES){assert.ok(cat.messages.length>=20);assert.ok(cat.messages.every(m=>m.from&&m.subject&&m.body.length>30));}
});
test('invalid app ownership is rejected and future saves remain protected',()=>{
 for(const damage of [s=>s.basement.computer.owned=true,s=>s.basement.computer.email=true,s=>s.basement.computer.games.boggle=true,s=>s.basement.computer.games.snake='owned',s=>delete s.basement.computer]){const s=newGame();damage(s);assert.equal(validateSave(s),false);}
 const s=ownComputer();assert.throws(()=>decode(JSON.stringify({...s,version:8})),/FUTURE_VERSION/);
});
