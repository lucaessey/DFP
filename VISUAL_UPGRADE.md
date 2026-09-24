# DFP 3D and dining upgrade — 23 September 2026

DFP now uses real Three.js geometry and articulated characters on all four floors. Every floor also has separate STACK FOOD and middle SERVE circles, plus a larger dining wing with six individually purchasable tables.

## Play and evidence

- [Local game](http://127.0.0.1:5173/)
- [Before/after screenshot and video gallery](http://127.0.0.1:5173/artifacts/3d-upgrade/index.html)
- [37-second gameplay recording](artifacts/3d-upgrade/gameplay.webm): table purchase, preparation, carrying, stacking, serving, dining, cleanup and an employee completing work. The recording is silent.
- [Phone table menu](artifacts/3d-upgrade/phone-table-shop.png) and [expanded dining area](artifacts/3d-upgrade/seating-floor-2.png)
- [Raw performance data](artifacts/3d-upgrade/performance.json), [visual checks](artifacts/3d-upgrade/visual-checks.json), [four-floor dining checks](artifacts/3d-upgrade/seating-browser.json)

The original and upgraded takeout screenshots use the same saved scene and viewport sizes, with comparable elevated cameras. Reference study used the official Supercent [Pizza Ready App Store screenshots](https://apps.apple.com/us/app/pizza-ready/id6450917563): elevated views, chunky figures, readable work areas and carried stacks. All DFP geometry, outfits, lettering and effects are original procedural assets; no reference game assets were copied.

## What changed

Characters have connected body parts, bent knees, turning, walking, carrying, reaching, serving, eating and cleaning poses. All five outfits have matching full-body previews. Food stacks have visible height, drinks and meals transfer to customers, and workers perform visible jobs. The four rooms have themed furniture, low walls, shadows, animated arcade screens and a camera that follows into the dining wing.

Rendering and animation do not modify the simulation. Geometry and materials are reused, static surfaces are merged, particles are capped, and one directional light supplies the shadow pass. Reduced effects disables that shadow pass, lowers pixel density and limits effects while retaining contact shadows. Reduced motion uses steady area views and suppresses decorative movement. Mute and both visual preferences persist and work offline.

Food customers now pay once at the counter, reserve a clean owned table, walk there, sit and eat, then leave the table dirty. Only dirty tables can be cleaned, by the player or an employee. Customers wait when all owned tables are busy or dirty; without any owned tables they take their food away. Tables are bought separately from player upgrades. The gift shop and arcade retain their original activities and gain separately unlocked snacks using the same counter and dining flow.

Save schema 4 preserves money, product ownership, staff, upgrades, outfits and carried goods. The two previously available fine-dining tables remain owned. Migration preserves dirty tables and already-delivered meal components without replaying payment. New snack products remain locked. Verification used isolated browser profiles and did not alter the player's actual save.

## Measured performance

Measurements used headless Microsoft Edge 153 on Windows with an AMD Radeon 760M through ANGLE/D3D11. Each sample used real animation frames for five seconds after 1.8 seconds of warmup. Desktop viewport: 1440×900. Phone viewport: 390×844 on the same desktop GPU. CPU render time measures JavaScript submission work, not GPU completion.

| Scene | Average FPS | 95th percentile frame | 95th percentile CPU render | Draw calls |
| --- | ---: | ---: | ---: | ---: |
| Desktop, standard | 60.0 | 17.8 ms | 2.8 ms | 547 |
| Desktop, reduced effects and motion | 60.0 | 17.4 ms | 1.7 ms | 256 |
| Desktop, 12 employees / 16 visible actors | 60.0 | 18.1 ms | 3.1 ms | 922 |
| Phone viewport, standard | 60.0 | 17.5 ms | 2.9 ms | 555 |
| Phone viewport, reduced effects | 60.0 | 17.4 ms | 1.5 ms | 288 |

Normal rendering caps device pixel ratio at 1.65; reduced effects uses 1. These short samples establish performance on the available computer, not sustained physical-phone performance or a thermal/battery guarantee.

## Verification and limits

- 50 unit and simulation tests passed, including animation independence, all-floor counter service, table purchases, payment before eating, occupied-table protection, waiting customers, worker cleanup and legacy-save migration.
- 18 main browser scenarios passed, including touch controls, all floors, product purchases, staffing, outfits, VR, trash, offline reload and a real service-worker update.
- Four additional browser scenarios passed: actual table purchase, counter service, eating, cleanup and ownership after reload on every floor. The first floor was exercised using phone touch input.
- All floor screenshots and outfit previews were captured. Settings persistence, offline 3D rendering and deliberate WebGL context loss/recovery passed without uncaught browser errors.

No physical Android or iOS device was available. Native installation, Safari behavior, low-end device performance, heat and battery use still need device testing. Audio executed without errors but was not physically auditioned. Crowd separation and animations are presentation features, not a full rigid-body physics simulation. Saves remain local to each browser origin; ports 5173 and 4173 have separate progress.

This visual verification preceded the subsequent request to publish the game. See [DEPLOYMENT.md](DEPLOYMENT.md) for publication details. The OpenSpec change remains unarchived.
