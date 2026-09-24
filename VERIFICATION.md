# Verification — 23 September 2026

The current implementation includes real 3D presentation, all four floors, physical trash cans, separate counter stacking and middle-circle food service on every floor, six purchasable tables per floor, cleanup after eating, 80% takeout drink demand, paid unlocks for all thirteen offerings, and the $1 controller / $3 drink economy.

## Completed checks

| Check | Result |
| --- | --- |
| `npm test` | 50 passed, 0 failed |
| `npm run test:browser` | 18 browser scenarios passed, 0 uncaught browser errors |
| `node tests/seating-browser.mjs` | 4 floor scenarios passed, including phone touch, 0 uncaught browser errors |
| `node tests/visual-3d.mjs` | 3D, outfits, preferences, offline rendering and context recovery passed |
| `npm run build` | Passed; final normal production build regenerated after the update test |
| `npm run spec:validate` | `build-dfp-game` passes strict OpenSpec validation |

The browser suite runs in a separate headless Microsoft Edge/Chromium profile. It never reads or changes the player's in-app-browser saves. Later-floor tests use explicit seeded fixtures so every mechanic can be exercised without grinding through progression. Game time is advanced through Playwright's browser clock; movement and actions still execute through the application's normal fixed-step loop.

## Automated rule coverage

- Deterministic simulation, bounded time steps, keyboard direction, collision, and reachable interaction pads.
- Complete takeout production and service; carrying alone cannot serve, stacking alone cannot pay, and the middle service ring hands out stocked food.
- Controller $1 / drink $3 payments; no payment until all needs are met; roughly 80% drink demand across 1,000 deterministic generated orders.
- All products initially locked; independent paid purchases; locked production/customer demand/machines blocked; first-product cash reserve prevents a fresh-game dead end.
- Five unique hires per floor, 20 overall, one assignment per employee, maximum 12 per destination, and rejection of invalid or duplicate hires.
- Safe cargo return on transfer, retained upgrades, and unchanged customer state.
- Five combined player upgrades per floor; three employee upgrades per category; insufficient funds and transaction replay protection.
- Additive profit calculation, exactly-once collection, outfit eligibility/equipping/persistence.
- All-floor food service: counter stacking → middle-circle service → one payment → table reservation → eating → dirty table → cleanup. Occupied tables cannot be cleaned, and waiting guests cannot replay payment.
- Six separate table purchases per floor, insufficient-funds and duplicate protection, no-table takeaway, waiting for clean seating, and employee service/cleanup on every floor.
- Merchandise and keychain stock, browsing, checkout and earnings; no drinks on the shop floor.
- Arcade play, accumulated quarters and employee collection; VR lane changes, unlock/proximity gates and one reward per run.
- Trash disposal on every floor with no refund or employee cargo loss.
- Active off-screen worker earnings and no closed-app catch-up.
- Save validation, checksums, v1/v2/v3-to-v4 migration, counter migration, previous product ownership preservation, grandfathered dining tables, already-delivered food preservation, backup recovery, unavailable storage, future-version preservation, and interrupted payments/purchases.
- Animation leaves simulation state unchanged; crowd presentation and reduced-motion behavior have direct coverage.

## Actual playable interface coverage

- Keyboard motion and stopping after release.
- First product unlock, then a full takeout order using clicks on rendered station labels; verified the actual $1 payment.
- Hiring, visible worker service, upgrade and floor reassignment through the interface.
- Purchases of every food, drink, merchandise item, arcade cabinet and VR offering through Unlock items.
- All four persistent navigation tabs.
- Outfit purchase, previews and equipped selection after reload.
- A complete fine-dining counter service including food and wine, payment before eating, and cleanup after eating.
- Table purchases and the complete stack/serve/eat/clean cycle on every floor; reload preserves ownership. A phone scenario uses actual touch events on rendered station labels.
- A manual shop stock-to-checkout cycle.
- Arcade quarter collection, VR keyboard controls and button controls, run completion and saved reward.
- Movement to each floor's rendered trash ring and actual disposal.
- Chromium touch events driving the joystick, plus touch navigation.
- Portrait 390×844 and landscape 844×390 layouts, inspected screenshots, no horizontal document overflow.
- Production offline reload with the network disabled, restored balance and floor navigation.
- A real second production build, waiting service worker, user-controlled Save & update, and preserved balance/selected floor after activation.

Screenshots were inspected for the desktop floors, wardrobe, employees, VR overlay, and phone layouts. Machine-readable browser results and screenshots are in `test-results/` (intentionally ignored by version control).

The [3D evidence gallery](http://127.0.0.1:5173/artifacts/3d-upgrade/index.html) includes comparable before/after screenshots, all four floors, five outfit previews, expanded seating, the mobile table menu and a 37-second gameplay recording. [VISUAL_UPGRADE.md](VISUAL_UPGRADE.md) documents the implementation and measured performance: approximately 60 FPS in five-second desktop and emulated-phone samples on the available Radeon 760M. These are not physical-phone measurements. Deliberate WebGL context loss/restoration, offline 3D rendering and preference persistence also passed.

The offline test found and fixed an actual cache-matching problem: Vite varies asset responses by Origin. The worker now uses `ignoreVary` for its same-origin cached assets, and the full offline and update scenarios pass.

## Limitations and unavailable device tests

- No physical iPhone, iPad or Android device was available. Touch and rotation were tested in Chromium emulation; native Safari/Android installation prompts, standalone chrome/safe-area behavior, battery use and low-end hardware performance still need device testing.
- Browser reload/closing and versioned recovery were exercised. Abrupt operating-system process termination during a storage write was not physically reproduced. Purchases/payments use a single synchronous validated snapshot write; unfinished movement may roll back by up to the two-second autosave interval.
- Audio synthesis is included and browser execution produced no errors; physical speaker playback was not auditioned.
- No end-to-end human balance study was performed. The very low payouts and expensive progression reflect the user's requested harder economy and remain configurable.
- Device-local saves have no cloud synchronization. Clearing the browser's origin data removes them. Save export is available; an import interface was not part of this version.

The initial verification was local. The subsequent user request authorizes publication to https://lucaessey.github.io/DFP/. The Pages build passed fresh-game service, table purchases, manifest/icon paths, scoped service-worker installation, offline reload with retained progress and phone touch checks. Publication results are recorded separately in [DEPLOYMENT.md](DEPLOYMENT.md). `build-dfp-game` remains unarchived.
