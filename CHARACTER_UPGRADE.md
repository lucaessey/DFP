# DFP character revision — 2026-09-27

## Design implemented

All roles share an original procedural 3D rig with a slightly oval, featureless charcoal head, thick rounded black limbs, mitten hands and rounded black feet. The default outfit has a red short-sleeved collared shirt and a curved red cap. Chef, formal, retro and neon outfits retain their identifiable accessories. Employees wear colored shirts, aprons and white visors; customers wear varied bright clothing. Geometry and materials are shared; no model or texture downloads are required.

The latest written character description supersedes the earlier thin stickman/dot-eye direction. The user subsequently supplied the [Pizza Ready gallery](https://kotaku.com/games/pizza-ready/gallery/1), which was visually inspected on 2026-09-27. Its dark featureless heads, compact bright shirts/caps, rounded limbs and forward carrying poses were compared with the front/side/back and in-game previews. The approved DFP base is retained; no reference asset was copied. The following results record the character-only checkpoint; see [WORLD_UPGRADE.md](WORLD_UPGRADE.md) for the current world revision and fresh verification.

## Motion and preservation

`src/character-motion.js` reads the simulation without changing inventory, money, timers or customer state. Actual travel drives the gait; two-segment limbs blend between carrying, reaching, frying, pouring, serving, shelf restocking, wiping and quarter collection. Customers greet, approach chairs, sit, eat, stand and leave. Successful purchases trigger short celebrations. A stopped player stays anchored immediately.

Inventory changes produce bounded visual transfers after the simulation commits. Moving, changing actions, switching outfits/floors or enabling reduced motion cancels stale visual effects and reveals committed cargo. Callbacks never complete a payment. Reduced motion removes decorative sway, bounce, head fidgets, celebrations and flying transfers while retaining essential action poses. Per-actor contact shadow materials are disposed when models are replaced; geometry and other materials remain shared.

The four room layouts, food, fivefold income, reduced table prices, product/purchase costs, staffing limits, upgrades, controls and save schema are preserved. Only the default outfit's appearance changed in economy configuration. Wider visual crowd spacing accommodates the thicker silhouettes without moving saved actors or changing navigation and service calculations.

## Actual verification

- 82 Node tests passed. Coverage includes economy, save/reload idempotency, staffing, all-floor navigation, common character geometry, featureless materials, all five outfits across ten poses, grounded feet, work-pad furniture clearance and interrupted inventory visuals.
- 18 production browser checks passed: complete player jobs in takeout, dining, merchandise and arcade/VR; staff hire/transfer; clothing; trash; touch; reload; offline play; and an actual service-worker version update preserving progress.
- Four additional seating checks passed, one per floor: buying a table, stacking/serving, payment before seating, eating before cleanup and ownership after reload.
- Nine control checks and 24 phone boundary checks passed, including keyboard/touch release, cancellation, reduced motion and camera framing.
- Sixteen expanded-layout checks passed across desktop, portrait and landscape, including all four floors, far tables, real touch release, UI earnings previews and saved staff assignments. 36 screenshots captured.
- Employee animation checks observed movement, work and a completed paying job on each of the four floors. All five outfits were subsequently equipped while carrying a controller and drink; inventory and balance remained unchanged across outfit changes and reload. The initial outfit test tried to click the already-equipped disabled button; its order was corrected and the outfit checks passed.
- Visual inspection covered all four rendered floors, dining/seating, all five outfit portraits, front/side/back model views and carrying. Procedural assets loaded offline; reduced preferences persisted; WebGL context loss/restoration recovered without lost progress or uncaught errors.

- Five local `/DFP/` production checks passed: WebGL startup, manifest/icons/worker scope, a fresh paid order/table purchase, offline reload retaining money and ownership, and phone table-shop touch.
- Captured a 42-second gameplay recording covering player production, carrying, service, dining/cleanup and employee service. Sample frames were inspected at 8.4, 21.0 and 33.6 seconds. Root and Pages builds and strict OpenSpec validation passed.

## Performance measured

Microsoft Edge 154 headless, AMD Radeon 760M, five-second animation-frame samples after warmup:

| Scene | Mean FPS | Frame p95 | CPU render p95 |
| --- | ---: | ---: | ---: |
| Desktop, standard | 172.9 | 7.8 ms | 2.8 ms |
| Desktop, reduced effects/motion | 179.8 | 6.4 ms | 1.5 ms |
| Desktop, 12 employees / 19 actors | 160.2 | 8.0 ms | 3.8 ms |
| Phone viewport, standard | 179.8 | 6.5 ms | 2.4 ms |
| Phone viewport, reduced effects | 180.0 | 6.3 ms | 1.0 ms |

Phone viewport samples use the same desktop GPU, not physical Android/iOS hardware. The crowded scene drew 1,098 calls and 305,822 triangles including shadows. Standard phone density is capped at 1.65; reduced effects uses density 1 and disables expensive shadows. Vite still reports its advisory for the bundled Three.js chunk (about 173 KB gzip).

## Reproduce and view evidence

The working dev game remains at `http://localhost:8080/`. Tests use isolated Edge contexts and synthetic saves; the user's browser progress was not replaced.

```powershell
npm test
npm run build
npm run spec:validate
# Start an available production preview port, e.g. 4185:
npm run preview -- --port 4185
# In a separate terminal:
$env:DFP_TEST_URL='http://127.0.0.1:4185'
node tests/browser.mjs
node tests/seating-browser.mjs
node tests/controls-browser.mjs
node tests/camera-browser.mjs
node tests/expanded-browser.mjs
node tests/characters-browser.mjs
```

`tests/browser.mjs` builds a test worker revision to verify updating; run `npm run build` again afterwards for the normal revision. The dev-only `tests/character-preview.html` renders reproducible front/side/back, carrying and outfit views. It is not part of the production game.

Ignored local evidence is in `artifacts/stickman/`: `character-study.png`, `in-game-carrying.png`, `before.png`, `after-desktop.png`, `after-phone.png`, `floor-2.png` through `floor-4.png`, `seating-floor-1.png` through `seating-floor-4.png`, employee views, `outfits.png`, `gameplay.webm`, `recording.json`, `performance.json`, `visual-checks.json` and `outfits-browser.json`. View the gallery at `http://localhost:8080/artifacts/stickman/index.html`. Other browser reports and camera/layout screenshots are under `test-results/`.

The reference comparison is complete. The current revision, publication status and expanded verification are recorded in WORLD_UPGRADE.md. The OpenSpec change remains unarchived.
