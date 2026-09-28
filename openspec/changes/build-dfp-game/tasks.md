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
- [x] 10.4 Publish the update through the existing GitHub Pages workflow. Deployment 35950309271 succeeded for commit 6d5487a.

## 11. Fivefold earnings and spacious floors
- [x] 11.1 Apply exactly five times current collected payouts across all sources and actors; synchronize previews and effects while preserving costs and saved money.
- [x] 11.2 Expand all four floor layouts and space stations, tables, queues, shelves and attractions; update collision, navigation, indicators and cameras.
- [x] 11.3 Migrate saved actor positions and paths safely without changing progress or replaying earnings.
- [x] 11.4 Verify equivalent payouts, upgrades, all-floor navigation and lifecycles, portrait/landscape touch, offline updates and all four rendered floors; record actual results and publish. 75 unit tests and 72 browser checks passed; deployment 36197104454 published commit 986ffa2.

## 12. Lower table prices
- [x] 12.1 Reduce all table prices to one-third, rounded to whole dollars; synchronize displays and purchases, retain saved ownership and balances, and verify all four floors. All 75 unit tests and all 24 browser table offers/purchases passed, including reload preservation; Pages build and strict OpenSpec validation passed. All 49 tasks are complete.

## 13. Stickman characters and casual animation
- [x] 13.1 Create an original shared 3D rig with a featureless oval charcoal head, thick black rounded limbs, mitten hands, red collared shirt/cap, role clothing colors and all five recognizable outfits/previews.
- [x] 13.2 Blend grounded distance-driven walking, idle, turns, carrying, job-specific reaches, customer seating/eating/departure and purchase celebrations; respect reduced motion.
- [x] 13.3 Keep visual transfers and interruptions independent of inventory, payment and customer state; prevent visible furniture intersections and reuse model resources.
- [x] 13.4 Verify unchanged gameplay/saves, all-floor jobs, outfits, interruption, touch/orientation, offline assets and actual rendering performance. See CHARACTER_UPGRADE.md for 82 passing unit tests, browser results and desktop-GPU measurements.
- [x] 13.5 Inspect and capture all four floors and a gameplay clip, document actual results and publish the verified update. Reference comparison, local inspection, fresh 43.32-second recording, report and both builds are complete. Commit 2d3367b passed GitHub tests/build and deployed successfully in run 36365552695.
- [x] 13.6 Provide front/side/back base previews and in-game carrying evidence; compare proportions and materials against the supplied Pizza Ready gallery. The dark featureless head, compact bright shirt/cap, rounded limbs and carrying pose were inspected against the reference; preserve the approved DFP base and original assets.

## 14. Cohesive casual world and event animation
- [x] 14.1 Restyle all four floors with chunky peach/cream, purple and yellow-orange props, consistent lighting and unchanged clear layouts/characters.
- [x] 14.2 Animate production, filling, pickup/delivery, bounded carried stacks and landing/settling using committed state only.
- [x] 14.3 Add bright green payment bundles, pop/collection motion and clear immediate currency feedback without duplicate payouts or replay.
- [x] 14.4 Distinguish equipment states; animate fryers, dispensers, checkout, arcade and VR; reveal purchased stations/tables with restrained construction and clear unlock progress.
- [x] 14.5 Update rounded UI, selection, tap/panel transitions and success/failure feedback; preserve immediate controls, four tabs, safe areas and reduced motion.
- [x] 14.6 Verify all-floor player/staff loops, interruptions, touch/camera, clipping, saves/recovery, offline updates and performance; deliver screenshots, gameplay recording and honest limitations. Completed: 89 unit tests, all listed browser suites, 43.32-second gameplay recording and measured performance; see WORLD_UPGRADE.md.

## 15. Separate drinks sections and halve table prices
- [x] 15.1 Separate food and drinks on floors one/two with distinct production, stacking/service counters, queues, signs/colors and reachable interaction/navigation areas.
- [x] 15.2 Present locked drinks boundaries and an explicit Unlock Drinks Section label, price and purchase control; retain $180/$220 unlocks, atomic charging, demand/staff gating, permanent ownership and reveal animation.
- [x] 15.3 Halve the currently released table prices once, rounded to whole dollars, sharing displayed and charged prices and preserving owned tables/balances.
- [x] 15.4 Migrate changed layout positions/paths safely, retaining pending orders, stored goods, drink unlocks, outfits, staffing and upgrades; verify player/employee mixed-order flows, all-floor tables, touch, saves and offline builds. Passed 100 unit tests and 64 browser checks; see DRINKS_SECTIONS.md and the local screenshot gallery. All 65 tasks are complete; keep this change unarchived.

## 16. Basement lounge and security minigame
- [x] 16.1 Add independent basement/furniture/security purchases, affordability and duplicate protection, prerequisite checks and compatible saved progress.
- [x] 16.2 Implement saved random waits, a single ten-second robber, fixed rewards/penalties, idempotent selections and pause/resume without away-time events.
- [x] 16.3 Add Elevator access and a chunky 3D lounge with visible furniture, placement/TV activation effects and the four existing navigation tabs.
- [x] 16.4 Render interactive live footage of the highest unlocked floor, recognizable theft, accessible person targeting, status/feedback and clear exit on mobile/desktop.
- [x] 16.5 Verify purchases, prerequisites, all monitored floors, timing/results, interruptions, migration, touch/keyboard and offline play; inspect screenshots and document actual results. Passed 109 unit tests and 36 browser checks; see BASEMENT_SECURITY.md and the local basement gallery. All 70 tasks complete; keep the change unarchived.

- [x] 16.6 Reduce basement access to $200 in the shared displayed/charged price; update documentation and verify affordability, persistence and duplicate protection. Passed 109 unit tests, 13 basement browser checks, both production builds and strict OpenSpec validation; all 71 tasks complete, keep unarchived.

## 17. Basement computer and apps
- [x] 17.1 Add $100 computer, $50 email and three $50 game purchases with ownership validation, exact charges and schema-six migration retaining existing security.
- [x] 17.2 Add original 3D desk/computer and responsive desktop, move security access off the TV and retain prerequisites, clocks and return controls.
- [x] 17.3 Add two fictional email categories with at least ten original messages each, inbox/detail navigation and no gameplay effects.
- [x] 17.4 Embed the three fixed game URLs with protected parent navigation, loading/retry/offline behavior, persistent returns and audio teardown.
- [x] 17.5 Verify purchases, migration, desktop/mobile apps, security pauses, external embedding/input/focus, offline saves and screenshots; document actual limitations. Implementation verified: 115 unit tests and 55 browser checks, both production builds and strict validation; see COMPUTER.md. All 76 tasks complete; keep unarchived.
- [x] 17.6 Expand Email to 20 Good Comments and 20 Bad Reviews, rename the complaints category throughout the UI, keep preview counts current, and verify inbox navigation and offline availability without changing ownership or money. Passed 115 unit tests, 12 computer browser checks, both production builds and strict validation; see COMPUTER.md. All 77 tasks complete; keep unarchived.
