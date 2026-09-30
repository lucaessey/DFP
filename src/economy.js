import {BALANCE as B} from './config.js';
import {petBonus} from './pets.js';

// Quote the old whole-dollar receipt first, retaining its rounding and carry.
// Only the final collected amount receives the new multiplier.
export function paymentQuote(state, floor, actor, base, petEligible=true) {
  const fs=state.floors[floor];
  const petLevels=petEligible&&actor.id===undefined?petBonus(state,'profitLevels'):0;
  const subtotal=Math.round(base*(1+B.playerProfitBonus*(fs.upgrades.profit+petLevels)+(actor.upgrades?.profit||0)*B.employeeProfitBonus));
  const cents=(fs.bonusCents??0)+subtotal*B.earningsBoostPercent;
  const ordinary=(subtotal+Math.floor(cents/100))*B.earningsMultiplier;
  const percent=petEligible&&actor.id===undefined?petBonus(state,'income'):0;
  const petCents=(state.pets?.incomeCents??0)+ordinary*percent;
  return {amount:ordinary+(percent?Math.floor(petCents/100):0),bonusCents:cents%100,petCents:percent?petCents%100:state.pets?.incomeCents??0};
}
