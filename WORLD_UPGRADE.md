# DFP world and motion revision — 2026-09-27

## Implemented

All four floors now use chunky purple station bodies, cream work surfaces, peach/cream floor zones and yellow-orange trim. The elevated diagonal camera, expanded 28×18 layouts, distinct floor attractions and approved rounded charcoal characters remain. Furniture keeps its collision footprint. Static surfaces are merged per station, so newly purchased objects can rise and settle without moving the surrounding floor or walls.

The user supplied the [Pizza Ready gallery](https://kotaku.com/games/pizza-ready/gallery/1) as the reference. Its high diagonal view, dark featureless characters, compact colorful props, clear floor zones and green cash were visually inspected. DFP keeps the written purple/orange palette and original procedural assets; no reference image or model is packaged in the game. Front, side, back and carrying previews show the shared base and all five outfits.

Food follows short arcs from production into hands and from hands onto counters, shelves and tables. Customers visibly retain partially delivered orders. Placed goods settle with a small bounce. Carried stacks show at most four models in two columns, with the exact quantity badge for larger loads; inventory capacity is unchanged. Dispensers visibly pour and fill, fryers bubble/steam, food trays move, checkout responds, arcade screens and quarters show use, and VR lights reflect session state. Icons, color and accessible descriptions distinguish locked, idle, working, ready and blocked stations.

Uncollected bills appear as bright green bundles. Payment events pop and move a bundle toward the collecting character while updating the real balance immediately. Small earnings labels avoid visible touch controls. Unlock affordability indicators, restrained furniture reveals, purchase celebrations, rounded buttons, dialog transitions and selected navigation give clear feedback. Repeated purchases within one menu retain every pending reveal.

## Preserved

The simulation, economy and save format are unchanged: fivefold gameplay income, one-third table prices, all other costs, four floors, upgrades, staffing limits/assignments, outfits and controls. Presentation reads committed state and cannot pay, consume stock or finish a customer job. Reloads seed visual baselines; stale transfers cancel on interrupted actions, floor/outfit changes or reduced motion. The player's real browser save was never replaced by test fixtures.

All geometry/materials are local and reused. Effects are bounded to eight transfers and 28 particles (eight with reduced effects). Reduced motion removes decorative arcs, bounces, construction movement and UI transitions; reduced effects also disables shadows and lowers pixel density. The complete production bundle is precached for offline play.

## Actual verification

| Check | Result |
| --- | --- |
| Node unit tests | **89 passed**, including exact payouts/bonuses, navigation, save recovery, staffing, all five outfits, grounded rigs, furniture clearance, interrupted cargo, partial customer deliveries and pure world effects |
| Main production browser suite | **18 passed**: full takeout, dining, merchandise, arcade/VR, staff, outfits, trash, touch, reload, offline and actual service-worker update |
| Seating browser suite | **4 passed**, one complete stack/serve/pay/seat/eat/clean loop per floor; rerun after the final customer-transfer change |
| Employee/outfit browser suite | **6 passed**: paid employee work on all four floors with simultaneous staff on other floors, every outfit while carrying, reload and reduced-motion interruption |
| New world browser suite | **4 passed**: multiple purchase reveals without replay; green cash/+$5/HUD matching one payment and avoiding controls; drink filling and cancellation; bounded eight-item carrying and corrupt-primary backup recovery |
| Controls and camera | **9 control checks**, **24 phone boundary frames**, **16 expanded-layout checks** across desktop, portrait and landscape, including touch release and 36 layout screenshots |
| Visual/offline/context checks | **6 passed**, including all-floor WebGL rendering, retained preferences, offline models and WebGL context restoration without lost progress |
| Local GitHub Pages build | **5 passed** at `/DFP/`: render, manifest/icons/worker scope, paid order/table purchase, offline reload and phone table-shop touch |
| Build/specs | Root and `/DFP/` builds passed; strict OpenSpec validation passed |

All browser suites reported no uncaught errors. Screenshots were inspected on all four floors, in dining areas, while carrying, and in portrait UI. A **43.32-second recording** covers the player production/service/dining/cleanup loop and subsequent employee service. Frames at 8.664, 21.660 and 34.656 seconds were inspected. Character front/side/back/carrying and all-outfit previews were also inspected against the supplied reference's visual direction.

## Measured performance and limits

Microsoft Edge 154 headless, AMD Radeon 760M; real animation frames, five-second samples after warmup, with no parallel test browsers during measurement:

| Scene | Mean FPS | Frame p95 | CPU render p95 |
| --- | ---: | ---: | ---: |
| Desktop, standard | 86.8 | 16.3 ms | 7.5 ms |
| Desktop, reduced motion/effects | 122.8 | 13.0 ms | 3.6 ms |
| Desktop, 12 employees / 19 actors | 64.6 | 19.7 ms | 9.6 ms |
| Phone viewport, standard | 103.8 | 17.8 ms | 9.1 ms |
| Phone viewport, reduced effects | 147.3 | 10.0 ms | 3.1 ms |

These are desktop-GPU samples, not physical Android/iOS measurements or a guaranteed frame rate. Physical mobile performance, installation and platform suspension remain untested. The crowded sample renders 1,166 calls / 293,750 triangles including shadows; reduced effects is available for slower devices. Vite reports its existing bundle-size advisory (Three.js plus game: about 177 KB gzip).

The public GitHub Pages address was blocked by Microsoft Family Safety in this environment during the earlier verification. This restriction was not bypassed. Public publication is checked through the GitHub deployment workflow; rendering, gameplay, worker scope and offline behavior are tested against the equivalent local `/DFP/` production build.

## Evidence and reproduction

Play locally at **http://localhost:8080/**. Open **http://localhost:8080/artifacts/world-upgrade/index.html** for before/after views, all floors, the character study, carrying/seating, cash and the gameplay recording. Generated images, video and JSON reports are local ignored artifacts; they are not bundled in the public game. Source tests regenerate them.

```powershell
npm test
npm run build
npm run spec:validate
# With a production preview running on 4185:
$env:DFP_TEST_URL='http://127.0.0.1:4185'
$env:DFP_EVIDENCE_DIR='artifacts/world-upgrade'
node tests/browser.mjs
# The worker-update test builds a test revision. Restore the normal bundle:
npm run build
node tests/seating-browser.mjs
node tests/characters-browser.mjs
node tests/world-browser.mjs
node tests/controls-browser.mjs
node tests/camera-browser.mjs
node tests/expanded-browser.mjs
$env:DFP_COMPARISON='artifacts/stickman/scene.json'
node tests/visual-3d.mjs
node tests/visual-3d.mjs --record
node tests/capture-character-previews.mjs
npm run build:pages
# With the Pages preview running on 4184:
$env:DFP_TEST_URL='http://127.0.0.1:4184/DFP/'
node tests/pages-browser.mjs
```

The comparison fixture is local evidence from the character checkpoint; the tracked `artifacts/3d-upgrade/comparison-state.json` is also accepted by the visual script. The OpenSpec change remains unarchived. Publication status is recorded after the deployment completes.
