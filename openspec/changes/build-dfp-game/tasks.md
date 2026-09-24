# Tasks

## 1. Foundation and takeout
- [x] 1.1 Establish app modules, configurable balance, deterministic state, movement and collision/pathfinding; verify movement and repeatability tests.
- [x] 1.2 Implement preparation, frying, carrying, queues, drinks and payment on floor one; verify complete service-loop tests.
- [x] 1.3 Render an original isometric room with character animation and keyboard/touch controls; verify rendered desktop and phone gameplay.

## 2. Economy, employees and saves
- [x] 2.1 Implement atomic purchases, progression and exactly-once bonus calculation; verify insufficient-funds, duplicate and reward tests.
- [x] 2.2 Implement 20 unique hires, 12-per-floor assignments, visible worker AI and safe transfers; verify limits, retained upgrades and automated service tests.
- [x] 2.3 Implement five combined player upgrades per floor and three employee upgrades per category; verify allowance tests and UI counters.
- [x] 2.4 Implement versioned local saves, validation, migration, backup recovery and interrupted transaction persistence; verify save tests.

## 3. Additional floors
- [x] 3.1 Implement greeting, seating, two console meals, wine, dining, payment, departure and cleanup; verify a full dining lifecycle.
- [x] 3.2 Implement merchandise stock, carrying, shelf replenishment, browsing, checkout and keychains; verify a full shop lifecycle and no drinks.
- [x] 3.3 Implement arcade queues, animated play, quarters and VR dodge game; verify collection and exactly-once minigame rewards.
- [x] 3.4 Simulate employee work on all unlocked floors during active play with no closed-app accrual; verify off-screen income and restart stability.

## 4. Interface and polish
- [x] 4.1 Implement four persistent tabs, floor unlock views, staffing management, upgrades and separate settings; verify all navigation and assignment controls.
- [x] 4.2 Implement five original outfit previews, unlock/equip flow and persistence; verify changed character appearance after reload.
- [x] 4.3 Implement playable tutorial, synthesized sound, action feedback and responsive safe-area layouts; inspect portrait and landscape screenshots and touch input.
- [x] 4.4 Add a physical trash can on every floor with automatic player disposal and feedback; verify disposal on all floors and no employee cargo loss.
- [x] 4.5 Split takeout counter stacking from middle-circle service for players and employees, with visible piles and save migration; verify stacking alone does not serve and direct carrying alone cannot serve.
- [x] 4.6 Increase takeout drink demand to a configurable 80% after unlocking, including untouched waiting orders; verify deterministic demand and preserve started orders.
- [x] 4.7 Require separate paid unlocks for every food, drink, merchandise item, arcade machine and VR; lower base income, prevent bootstrap dead ends, and migrate existing ownership; verify rule tests and product-menu browser purchases.

## 5. PWA and verification
- [x] 5.1 Implement manifest, suitable icons, complete asset caching and installation guidance; verify production build and offline browser reload.
- [x] 5.2 Implement user-controlled service-worker updates and save-preserving reload; verify a real new-build update in the browser.
- [x] 5.3 Run full automated suite, inspect playable UI, fix failures, and document device-test limitations; deliver verification report with passing checks and honest exclusions.
- [x] 5.4 Deliver launch/build/controls documentation and validate current OpenSpec artifacts with strict CLI validation; keep change unarchived. Initial local-only delivery preceded the later publication authorization in section 8.

## 6. Authorized 3D presentation upgrade
- [x] 6.1 Review official visual references, capture a comparable baseline, and introduce a reusable procedural 3D renderer with lighting, low walls, camera follow and accessible station picking.
- [x] 6.2 Implement a blended character rig, all five outfits and matching previews, grounded crowd motion, visible carried stacks and interaction effects; demonstrate the full takeout loop with player and employee.
- [x] 6.3 Apply the visual target to dining, gift shop and arcade with seating/eating, restocking, animated screens, quarters and VR furniture.
- [x] 6.4 Add persistent reduced-effects settings, honor reduced motion and mute, preserve old saves and ensure all 3D assets work offline.
- [x] 6.5 Verify gameplay, touch, all floors, context recovery, saves, offline updates and animation independence; measure actual performance and optimize against the available environment.
- [x] 6.6 Deliver comparable screenshots, a short gameplay recording, local preview and a concise report with measured results and remaining device limitations; validate updated OpenSpec artifacts.

## 7. Counter service and expanded seating on every floor
- [x] 7.1 Expand all four rooms with six individually purchasable tables and a clear Tables menu; retain free navigation and touch/camera access throughout the larger space.
- [x] 7.2 Require separate counter stacking and middle-circle food service on every floor. Convert fine dining to counter payment before seating; retain shop and arcade activities and add separately unlocked snack counters there.
- [x] 7.3 Send paid food customers to owned clean tables, animate eating, and mark tables dirty only after eating finishes. Support manual and employee cleanup; occupied tables cannot be cleaned or reused.
- [x] 7.4 Migrate existing saves without losing money, ownership, staff, upgrades or delivered goods; preserve the two previously available dining tables and dirty tables.
- [x] 7.5 Verify purchases, counter restrictions, payment-before-eating, occupied-table protection, cleanup, worker automation, migration, expanded navigation, mobile UI and offline play; update evidence and documentation.

## 8. Authorized GitHub Pages publication
- [x] 8.1 Support /DFP/ assets, manifest and scoped offline caches while preserving root-path localhost development; verify a real paid order, table ownership, offline reload and phone input against the Pages build.
- [x] 8.2 Publish the reviewed game to the public lucaessey/DFP repository using a tested GitHub Actions workflow; enable Pages and confirm the public HTTPS response. Attempt isolated live-browser verification and record device restrictions. Deployment and HTTP 200 succeeded; Microsoft Family Safety blocked live Edge verification, as documented in DEPLOYMENT.md. Both local production paths passed browser checks.

## 9. Post-publication gameplay fixes
- [x] 9.1 Keep walking characters facing travel direction between fixed ticks, face seated characters/chairs toward tables, and anchor the stopped player against crowd offsets.
- [x] 9.2 Increase earned payouts by 20%, carrying saved fractional bonuses into whole dollars without replay or changes to unlock costs.
- [x] 9.3 Stop manual movement on release/cancellation, clear movement on focus loss and menus, and add explicit cancellation for station/area trips.
- [x] 9.4 Rebuild the first-floor pickup station as an open warming tray; replace floating words with accessible action and order icons while retaining useful UI.
- [x] 9.5 Verify controls, animation, earnings, all-floor gameplay and offline updates, then publish the fixes through the existing GitHub Pages workflow. All 54 unit tests, 18 gameplay browser checks, 9 control checks and 5 Pages-build checks passed; deployment 35946360379 succeeded.

## 10. Orders of one to three items
- [x] 10.1 Generate one to three unlocked items, including repeats and drinks within the limit, while preserving partial orders on unlock and reload.
- [x] 10.2 Support complete multi-item shop baskets, summed checkout payments and employee carrying trips on every floor.
- [x] 10.3 Verify partial fulfillment, repeated units, all-floor employees, browser service and offline persistence. 66 unit tests, 18 gameplay browser checks and 5 Pages-build checks passed.
- [ ] 10.4 Publish the update through the existing GitHub Pages workflow.
