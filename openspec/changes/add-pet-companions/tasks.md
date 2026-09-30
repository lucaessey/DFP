# Tasks

## 1. Collection and durable ownership

- [x] 1.1 Implement every pet in the pre-implementation table and exact shared descriptions; test 30 unique IDs, endpoints and abilities.
- [x] 1.2 Add guarded purchase/equip/unequip commands and version-7 migration; test duplicate/insufficient purchases, reload, prior saves and extra carried goods.

## 2. Gameplay effects

- [x] 2.1 Integrate separate speed, capacity, income and preparation effects; test all catalogue bonuses, upgraded players, employee and fixed-reward exclusions and no stacking.
- [x] 2.2 Add bounded cash/service/clean helpers with saved shared cooldowns; test real stock/payment transitions, wrong floor/range/locked targets, occupied tables, switching and repeated collection.

## 3. Presentation

- [x] 3.1 Build all 30 distinct efficient procedural models with movement/idle/reaction animations; inspect a complete contact sheet and selected animated previews.
- [x] 3.2 Add collision-aware following and safe floor/basement placement; test furniture paths, crowd separation, recovery, transitions and reduced motion.
- [x] 3.3 Add the fifth navigation tab and responsive shop with one animated preview and cached thumbnails; test all states, money, exact descriptions and 320px/portrait/landscape/desktop controls.

## 4. Integration verification

- [x] 4.1 Run regression and pet-specific simulation tests, production build and strict OpenSpec validation; record actual results.
- [x] 4.2 Inspect complete jobs with equipped pets on all four floors and the basement; verify offline reload, saved purchases, switching and efficient preview rendering in browser tests and screenshots.
- [x] 4.3 Deliver the full collection table, implementation summary and evidence, leaving any unverified tasks unchecked.

Verification: `PETS.md` records the full table, 150 passing unit/regression tests, 11 passing production-browser checks, successful production/Pages builds and strict validation. `artifacts/pets/index.html` contains the inspected collection and gameplay screenshots; `report.json` records zero browser errors and measured preview costs. Physical-device FPS was not benchmarked. Publication uses the existing GitHub Pages workflow after pushing to `main`.

## 5. Security-camera pet extension

- [x] 5.1 Add Lens Buddy to the catalogue, exact descriptions, original camera model and shop; verify purchase/equip/persistence, five speed/profit upgrade bonuses, five carrying slots, version-8 migration and model behavior.
- [x] 5.2 Add the equipped-only shortcut above desktop/mobile personal upgrades without requiring basement purchases, a shared remote security feed, paused player work and direct Back/Escape return to unchanged gameplay; preserve ordinary computer navigation.
- [x] 5.3 Verify no-basement/unowned/unequipped cases, remote rewards and timing, return position/cargo, desktop/mobile layout, offline reload and ordinary computer return; run relevant regressions/build/spec checks and record evidence.
- [x] 5.4 Rebalance Lens Buddy to $5,555 with five temporary speed/profit upgrades and five carrying slots; verify prices, exact effects, descriptions and safe 13-item saves after unequipping.
- [x] 5.5 Pay exactly $100 only for catches made through the equipped pet shortcut above player upgrades; retain $15 computer catches and $5 penalties, update visible feedback, migrate historical totals safely, and test both entry routes/reload/duplicate inputs.

Camera extension and rebalance verification: 155 passing unit/regression tests, six passing focused browser checks with zero page errors, visually inspected model/desktop/phone/landscape evidence in `artifacts/camera-pet/`, successful production build and strict validation. See `PETS.md` for the confirmed $5,555 price, +5 speed/carry/profit upgrades, purchase-free remote security and version-8 save compatibility. Full 13-item bags survive switching/unequipping and reload without changing balances or permanent upgrades. Not published.

Shortcut reward verification: all 159 unit/regression tests and six focused browser checks passed, with zero page errors. The same equipped pet pays/displays $100 through the player-upgrade shortcut and $15 through the basement computer. Tests cover unchanged $5 penalties, inactive/unequipped denial, duplicate/reload rejection, mixed reward totals and version-8-to-9 migration without revaluing historical payments. Production build and both relevant strict OpenSpec checks passed. Screenshots `remote-catch-100.png` and `computer-catch-15.png` were inspected. Not published.
