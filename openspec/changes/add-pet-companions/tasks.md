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
