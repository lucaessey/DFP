export const PRODUCER_BONUS = 1000;
export const PRODUCER_COOLDOWN = 300000;
const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(id);
export const newProducerBonus = () => ({pending:null, paid:null});
export const validProducerBonus = value => !!value && ['pending','paid'].every(k => value[k] === null || validId(value[k]));
export const validBonusReceipt = (value,id) => !!value && validId(id) && value.id === id && value.amount === PRODUCER_BONUS && Number.isSafeInteger(value.claimedAt) && value.claimedAt > 0;
export const bonusWait = (limit,now=Date.now()) => limit ? Math.max(0,limit.claimedAt + PRODUCER_COOLDOWN - now) : 0;
export function bonusChanges(id) {
  if(!validId(id))throw Error('Invalid claim ID');
  const claimedAt={'.sv':'timestamp'};
  return {limit:{id,claimedAt},[`receipts/${id}`]:{id,claimedAt,amount:PRODUCER_BONUS}};
}
// The caller supplies an authenticated, bounded transport. Never retry with a new ID.
export async function confirmBonus(request,id,signal) {
  const receipt=async()=>{
    const value=await request(`receipts/${id}`);
    if(value&&!validBonusReceipt(value,id))throw Error('The cash receipt was invalid. No money was added.');
    return value;
  };
  const old=await receipt();if(old)return old;
  try{await request('',bonusChanges(id));}
  catch(error){signal?.throwIfAborted();const saved=await receipt();if(saved)return saved;throw error;}
  const saved=await receipt();
  if(!saved)throw Error('The cash claim was not confirmed. Retry to check it.');
  return saved;
}
export function beginBonus(state,save,id) {
  state.producerBonus ??= newProducerBonus();
  if(state.producerBonus.pending)return state.producerBonus.pending;
  if(!validId(id)||id===state.producerBonus.paid)throw Error('Please retry with a new claim.');
  state.producerBonus.pending=id;
  if(!save()){state.producerBonus.pending=null;throw Error('Your game could not be saved. Fix device storage before claiming cash.');}
  return id;
}
export function payBonus(state,save,receipt) {
  const bonus=state.producerBonus;
  if(!validBonusReceipt(receipt,receipt?.id))throw Error('The cash receipt was invalid. No money was added.');
  if(bonus?.paid===receipt.id)return false;
  if(bonus?.pending!==receipt.id)throw Error('This receipt belongs to a different claim.');
  if(state.money+PRODUCER_BONUS>1e12)throw Error('Your game balance is at its limit. Spend some cash before recovering this claim.');
  const previous={...bonus},money=state.money,revision=state.revision;
  state.money+=PRODUCER_BONUS;state.revision++;
  state.producerBonus={pending:null,paid:receipt.id};
  if(!save()){
    state.money=money;state.revision=revision;state.producerBonus=previous;
    throw Error('Cash was confirmed but could not be saved. Retry to recover the same $1,000.');
  }
  return true;
}
