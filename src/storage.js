import { newGame } from './simulation.js';
import { ITEMS, OUTFITS, UPGRADE_TYPES, PRODUCTS, BALANCE, WORLD, TABLE_COUNT, upgradeCount } from './config.js';
export const SAVE_KEY = 'dfp.save';
export const BACKUP_KEY = 'dfp.backup';
const finite = (n, min = 0, max = 1e12) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const integer = (n, min = 0, max = 1e12) => Number.isInteger(n) && finite(n, min, max);
const uValid = (u, cap) => u && UPGRADE_TYPES.every(k => integer(u[k], 0, cap));
const point = p => p && finite(p.x, 0, WORLD.width) && finite(p.y, 0, WORLD.depth);
const actorValid = a => point(a) && Array.isArray(a.bag) && a.bag.length <= 8 && a.bag.every(v => ITEMS.includes(v)) && typeof a.action === 'string' && finite(a.progress, 0, 1) && Array.isArray(a.path) && a.path.length <= 500 && a.path.every(point) && typeof a.pathKey === 'string';
export function validateSave(s) {
  if (!s || s.version !== 4 || !integer(s.money) || !integer(s.earned) || !integer(s.served) || !finite(s.time) || !integer(s.seed, 0, 4294967295) || !integer(s.nextId, 1) || !integer(s.revision)) return false;
  if (!integer(s.floor, 0, 3) || !actorValid(s.player) || !Array.isArray(s.floors) || s.floors.length !== 4) return false;
  if (!integer(s.tutorial, 0, 5) || !s.settings || typeof s.settings.sound !== 'boolean' || typeof s.settings.reducedMotion !== 'boolean') return false;
  if (s.settings.reducedEffects !== undefined && typeof s.settings.reducedEffects !== 'boolean') return false;
  if (!Array.isArray(s.transactions) || s.transactions.length > 128 || !s.transactions.every(t => typeof t === 'string' && t.length < 100)) return false;
  if (!Array.isArray(s.outfits) || !s.outfits.includes('uniform') || new Set(s.outfits).size !== s.outfits.length || !s.outfits.every(id => OUTFITS.some(o => o.id === id)) || !s.outfits.includes(s.outfit)) return false;
  if (!Array.isArray(s.employees) || s.employees.length > 20 || new Set(s.employees.map(e => e.id)).size !== s.employees.length) return false;
  const customerIds = new Set();
  for (let i = 0; i < 4; i++) {
    const f = s.floors[i];
    if (!f || typeof f.unlocked !== 'boolean' || typeof f.section !== 'boolean' || !uValid(f.upgrades, 5) || upgradeCount(f.upgrades) > 5 || !f.stock || !['raw', ...ITEMS].every(k => integer(f.stock[k], 0, 100000))) return false;
    if (!finite(f.fry, 0, 100) || typeof f.cooking !== 'boolean' || !finite(f.arrival, -1e8, 100) || !integer(f.revenue) || !integer(f.served)) return false;
    if (f.unlocked && i > 0 && !s.floors[i - 1].unlocked) return false;
    if (!f.shelves || !integer(f.shelves.souvenir, 0, 100000) || !integer(f.shelves.keychain, 0, 100000)) return false;
    if (!f.counter || !ITEMS.every(k=>integer(f.counter[k],0,100000))) return false;
    if(!f.products||!PRODUCTS.filter(p=>p.floor===i).every(p=>typeof f.products[p.id]==='boolean'))return false;
    if(f.section!==f.products[PRODUCTS.find(p=>p.floor===i&&p.section).id])return false;
    if (!Array.isArray(f.customers) || f.customers.length > 30) return false;
    for (const c of f.customers) {
      if (!integer(c.id, 1, s.nextId - 1) || customerIds.has(c.id) || !point(c) || !['waiting','waitingTable','toTable','seating','ordering','service','dining','payment','leaving','browsing','checkout','playing'].includes(c.state)||!['food','shop','arcade'].includes(c.purpose)||typeof c.counted!=='boolean') return false;
      if (!Array.isArray(c.needs) || c.needs.length > 3 || !c.needs.every(n => ITEMS.includes(n)) || !Array.isArray(c.delivered) || c.needs.length !== c.delivered.length || !c.delivered.every(d => typeof d === 'boolean') || typeof c.paid !== 'boolean' || !finite(c.timer)) return false;
      if (!Array.isArray(c.path) || c.path.length > 500 || !c.path.every(point) || typeof c.pathKey !== 'string' || !Array.isArray(c.bag)) return false;
      if (c.table !== null && !integer(c.table, 0, TABLE_COUNT-1) || c.machine !== null && !integer(c.machine, 0, 2)) return false;
      customerIds.add(c.id);
    }
    if (!Array.isArray(f.tables)||f.tables.length!==TABLE_COUNT||!f.tables.every((t,index)=>typeof t.owned==='boolean'&&['free','reserved','occupied','dirty'].includes(t.state)&&(t.owned||t.state==='free')&&(t.meal===null||ITEMS.includes(t.meal))&&(['reserved','occupied'].includes(t.state)?f.customers.some(c=>c.id===t.customer&&c.table===index&&['toTable','dining'].includes(c.state)):t.customer===null)))return false;
    if (!Array.isArray(f.machines) || f.machines.length !== 3 || !f.machines.every(m => integer(m.quarters) && finite(m.timer) && (m.customer === null || f.customers.some(c => c.id === m.customer)))) return false;
    if (s.employees.filter(e => e.floor === i).length > BALANCE.floorStaffCap) return false;
  }
  if (!s.floors[0].unlocked || !s.floors[s.floor].unlocked) return false;
  for (const e of s.employees) if (!integer(e.id, 0, 19) || !integer(e.floor, 0, 3) || !s.floors[e.floor].unlocked || !s.floors[Math.floor(e.id / 5)].unlocked || !actorValid(e) || !uValid(e.upgrades, 3)) return false;
  if (s.vr !== null && (!s.vr || !integer(s.vr.id, 1) || !integer(s.vr.lane, 0, 2) || !finite(s.vr.time, 0, 26) || !integer(s.vr.lives, 0, 3) || !integer(s.vr.score) || typeof s.vr.done !== 'boolean' || typeof s.vr.paid !== 'boolean' || !finite(s.vr.spawn) || !Array.isArray(s.vr.obstacles) || !s.vr.obstacles.every(o => integer(o.lane, 0, 2) && finite(o.y, -1, 2)))) return false;
  return true;
}
export function migrate(s) {
  if (s?.version === 1) {
    // Version one used this same world model, before preferences and outfit persistence.
    const base = newGame();
    s = { ...base, ...s, version: 2, settings: { ...base.settings, ...s.settings }, outfits: s.outfits ?? ['uniform'], outfit: s.outfit ?? 'uniform', transactions: s.transactions ?? [], vr: s.vr ?? null };
  }
  if(s?.version===2&&Array.isArray(s.floors)&&s.floors.length===4&&s.floors.every(f=>f&&typeof f==='object')){
    const oldCounter=s.floors[0].counter===undefined;
    for(const floor of s.floors)if(floor.counter===undefined)floor.counter={controller:0,drink:0};
    if(oldCounter&&s.tutorial===4&&s.served>0)s.tutorial=5;
    for(let i=0;i<4;i++){
      const floor=s.floors[i];
      floor.products??=Object.fromEntries(PRODUCTS.filter(p=>p.floor===i).map(p=>[p.id,p.id.startsWith('snack')?false:p.section?!!floor.section:!!floor.unlocked]));
      floor.section=!!floor.products[PRODUCTS.find(p=>p.floor===i&&p.section).id];
    }
    s.version=3;
  }
  if(s?.version===3&&Array.isArray(s.floors)&&s.floors.length===4&&s.floors.every(f=>f?.stock&&f.counter&&f.products&&Array.isArray(f.tables)&&Array.isArray(f.customers))){
    for(let f=0;f<4;f++){
      const fs=s.floors[f];for(const id of ITEMS){if(fs.stock[id]===undefined)fs.stock[id]=0;if(fs.counter[id]===undefined)fs.counter[id]=0;}
      for(const p of PRODUCTS.filter(p=>p.floor===f))if(fs.products[p.id]===undefined)fs.products[p.id]=false;
      const old=fs.tables;fs.tables=Array.from({length:TABLE_COUNT},(_,i)=>({owned:old[i]?.owned??(f===1&&i<2),state:old[i]?.state==='dirty'?'dirty':'free',customer:null,meal:old[i]?.meal??null}));
      for(const c of fs.customers){c.purpose=f<2?'food':f===2?'shop':'arcade';c.counted=c.state==='leaving';
        if(f===1&&c.state!=='leaving'){c.state=c.delivered.every(Boolean)?'payment':'waiting';c.x=4.8;c.y=8.7;c.timer=0;c.table=null;c.path=[];c.pathKey='';}
      }
    }
    s.player.path=[];s.player.pathKey='';for(const e of s.employees){e.path=[];e.pathKey='';}s.version=4;
  }
  if (!validateSave(s)) throw new Error('Invalid save data');
  s.settings.reducedEffects ??= false;
  s.events = []; return s;
}
export function checksum(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
export function encode(s) { if (!validateSave(s)) throw new Error('Save failed validation'); const data = JSON.stringify({ ...s, events: [] }); return JSON.stringify({ data, checksum: checksum(data) }); }
export function decode(raw) {
  const envelope = JSON.parse(raw); let data = envelope;
  if (typeof envelope.data === 'string') { if (checksum(envelope.data) !== envelope.checksum) throw new Error('Checksum mismatch'); data = JSON.parse(envelope.data); }
  if (data?.version > 4) throw new Error('FUTURE_VERSION');
  return migrate(data);
}
export function loadGame(storage) {
  let raw, backup;
  try { raw = storage.getItem(SAVE_KEY); backup = storage.getItem(BACKUP_KEY); }
  catch { return { state: newGame(), warning: 'Device storage is unavailable. Progress cannot be saved.', writable: false }; }
  if (raw) {
    try { return { state: decode(raw), warning: '', writable: true }; }
    catch (e) { if (e.message === 'FUTURE_VERSION') return { state: newGame(), warning: 'This save needs a newer DFP version. Your save is preserved; this session cannot overwrite it.', writable: false }; }
  }
  if (backup) {
    try { return { state: decode(backup), warning: 'Progress recovered from your backup save.', writable: true }; }
    catch (e) { if (e.message === 'FUTURE_VERSION') return { state: newGame(), warning: 'A newer backup save is preserved. Update DFP to continue.', writable: false }; }
  }
  return { state: newGame(), warning: raw || backup ? 'Saved data could not be read. Original data is preserved; export it in Settings.' : '', writable: !(raw || backup) };
}
export function saveGame(storage, state) {
  try {
    const data = encode(state), previous = storage.getItem(SAVE_KEY);
    if (previous) { try { decode(previous); storage.setItem(BACKUP_KEY, previous); } catch { /* Keep valid backup when primary is corrupt. */ } }
    storage.setItem(SAVE_KEY, data);
    return { ok: true };
  } catch (error) { return { ok: false, error: `Progress could not be saved: ${error.message}` }; }
}
