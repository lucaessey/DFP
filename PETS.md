# DFP pet companions

The Pets paw tab sits alongside Elevator, Home, Outfits and Employees. All 30 pets use existing game money, have permanent ownership, and work without accounts or network services. A purchase equips that pet; switching owned pets and unequipping are free. The shop shows the current balance, exact abilities, Locked/Buy/Owned/Equipped states, cached thumbnails and one animated, rotatable preview. The existing $50 first-food reserve still applies.

The equipped companion follows through all four floors and appears beside the player in the basement. Shared geometry and materials support original rounded models, species-specific movement, idle motion, purchase/equip celebrations and helper reactions. Followers avoid furniture and crowds, favor visible side positions, catch up and recover safely when stuck. They never obstruct gameplay actors or control payments through animation.

## Price and ability table

Speed, carry, sales and preparation bonuses affect the player, separately from permanent upgrades. Sales adds the stated percentage once to the existing final ordinary payout, retaining fractional dollars until a later eligible receipt. It includes food, drinks, gifts and earned arcade cash; employee earnings, VR, computer games and fixed security rewards/penalties are unchanged.

Prep means increased **work rate**, not that percentage removed from duration. It affects player food/drink preparation and an active Takeout fryer within 3 world units while playing that floor.

Helper notation below is **radius in world units / cooldown in seconds**. Cash collects one existing earned payment or arcade pile; Serve transfers one already-stacked food/drink item; Clean clears one purchased dirty table after eating. Helpers work on the current above-ground floor during active play, using real stock and receipts with a reachable approach. They pause in menus, the basement, VR and the background. Cooldowns persist across switching and reloads. Serve is for food/drink counters, not gift shelving. Cash and Clean operate on all four floors.

| Pet | Price | Exact abilities |
|---|---:|---|
| Crumb Chick | $20 | Speed +5% |
| Mochi Bunny | $35 | Carry +1 |
| Biscuit Cat | $50 | Sales +5% |
| Pepper Pup | $70 | Speed +8% |
| Pesto Turtle | $90 | Prep +10% |
| Prickle | $120 | Carry +1; speed +5% |
| Lime Hopper | $150 | Speed +12% |
| Cheddar Mouse | $180 | Cash 2 / 12s |
| Sprinkles Penguin | $220 | Prep +15%; sales +5% |
| Ember Fox | $260 | Speed +15%; carry +1 |
| Pixel Slime | $300 | Carry +2 |
| Honey Byte | $350 | Prep +20% |
| Bubble Otter | $400 | Clean 2.5 / 18s |
| Bao Panda | $450 | Carry +2; sales +8% |
| Bolt Hound | $500 | Cash 2.5 / 10s; speed +10% |
| Plum Bat | $575 | Speed +18%; prep +15% |
| Inky Octo | $650 | Serve 2.5 / 14s |
| Bandit Raccoon | $725 | Cash 3 / 8s; sales +10% |
| Joypad Pal | $800 | Carry +2; prep +20% |
| Noodle Axolotl | $875 | Clean 3 / 14s; speed +12% |
| Toast Dragon | $950 | Prep +30%; sales +12% |
| Neon Jelly | $1,050 | Cash 3.5 / 8s; carry +2 |
| Captain Crab | $1,150 | Serve 3 / 12s; carry +1 |
| Sugarcorn | $1,250 | Speed +25%; sales +15% |
| Pickle Rex | $1,350 | Carry +3; prep +25% |
| Orbit Owl | $1,450 | Serve 3 / 10s; Clean 3 / 16s |
| Nimbus Puff | $1,550 | Speed +25%; Cash 3.5 / 6s |
| Star Manta | $1,700 | Sales +20%; Serve 3.5 / 10s |
| Saffron Phoenix | $1,850 | Prep +35%; Clean 3.5 / 10s; speed +15% |
| Cosmic Whale | $2,000 | Carry +3; sales +25%; Cash 4 / 6s |

## Saves, economy and offline behavior

Save version 7 adds owned IDs, one equipped ID, shared helper cooldowns and fractional pet income carry. Existing version-6 saves migrate with their balances, purchases, team, outfits and upgrades intact. Pet bonuses are derived from the current equipped ID and are never written into permanent upgrades. Unequipping a capacity pet preserves carried goods; new pickups wait until the bag is below the resulting capacity. Receipt guards prevent repeat payouts.

Models and animations are generated locally from bundled code. The PWA precaches that code, so ownership, gameplay, previews and purchases remain available offline after the production app has downloaded. Clearing browser storage still removes device-local progress, as before.

## Verification

Verified on 2026-09-29 using isolated test saves; the user's actual progress was not replaced.

- `npm test`: **150 passed, 0 failed**. Nineteen pet test groups cover the full catalogue, every passive bonus, upgrade interactions, fractional income and pure previews, insufficient/duplicate purchases, migration, all helper ranges/cooldowns, real inventory/payments, switching, occupied tables, fixed rewards, model clearance on every floor, safe following/recovery and keeping resting companions visible beside the player.
- `npm run test:pets:browser`: **11 passed, zero browser errors**. Production-build browser checks cover 320px touch purchasing, persistence, switching/unequip, offline reload, all 30 selected previews, desktop and landscape sizing, complete player jobs and following on each floor, employees working on every floor, basement transitions and reduced motion. Results and screenshots are written to `artifacts/pets/`.
- `npm run build`, `npm run build:pages` and `npm run spec:pets`: successful. The existing Vite main-bundle size advisory remains; it is not a build failure.
- Only one selected shop model animates; all 30 cards use cached still images. Measured selected previews use **10–22 draw calls** and **1,682–4,058 triangles**. These are renderer measurements, not a physical-phone FPS benchmark.

The final browser report is `artifacts/pets/report.json`; the screenshot gallery is `artifacts/pets/index.html`. `collection.png` shows all 30 original models. The gallery also includes phone shop, four-floor gameplay and basement screenshots. Local development remains available at `http://localhost:8080/`. Pushing to `main` starts the existing GitHub Pages workflow, which runs the tests and production build before deployment.

To repeat the browser checks: run `npm run build`, start `npm run preview -- --host 127.0.0.1 --port 4173`, then run `npm run test:pets:browser` in another terminal. `DFP_TEST_URL` can point the test at another local production preview. Tests seed only their own browser context and do not alter the normal browser's saves.
