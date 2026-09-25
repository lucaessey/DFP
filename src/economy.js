import {BALANCE as B} from './config.js';

// Quote the old whole-dollar receipt first, retaining its rounding and carry.
// Only the final collected amount receives the new multiplier.
export function paymentQuote(state, floor, actor, base) {
  const fs=state.floors[floor];
  const subtotal=Math.round(base*(1+B.playerProfitBonus*fs.upgrades.profit+(actor.upgrades?.profit||0)*B.employeeProfitBonus));
  const cents=(fs.bonusCents??0)+subtotal*B.earningsBoostPercent;
  return {amount:(subtotal+Math.floor(cents/100))*B.earningsMultiplier,bonusCents:cents%100};
}
