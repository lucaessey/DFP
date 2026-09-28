# Separate drinks sections and half-price tables

Verified September 27, 2026 in Microsoft Edge/Chromium with isolated test saves.

## Changes

- Takeout and Pixel & Pour have separate food and drinks production, stacking counters, service circles and customer queues. Cream food areas and marked lavender drinks areas identify the sections; station collisions, customer paths, employee jobs and goods/payment animations follow the new locations.
- New drinks areas have a striped locked boundary, construction placeholders and an explicit **Unlock Drinks Section** button showing $180/$220. Existing meal prerequisites remain. Failed or duplicate purchases do not charge; successful purchases reveal equipment and persist the unlock. Locked drinks cannot enter customer demand or employee jobs.
- Mixed orders receive food first, then drinks, and pay the complete bill once at the final counter before dining. Food-only orders still finish at the food counter.
- Tables cost half the previously released one-third prices, rounded to whole dollars (.5 rounds up). The fixed configuration formula is shared by offers and deductions, so loading a save cannot apply another reduction. Existing money and owned tables are unchanged.

| Floor | Table 1 | Table 2 | Table 3 | Table 4 | Table 5 | Table 6 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Takeout | $10 | $19 | $29 | $38 | $47 | $56 |
| Pixel & Pour | $17 | $26 | $35 | $44 | $54 | $63 |
| Gift Stop | $24 | $33 | $42 | $51 | $60 | $69 |
| Insert Coin | $30 | $39 | $49 | $58 | $67 | $76 |

Layout revision 3 clears obsolete paths and moves obstructed saved characters to clear ground. It retains previously unlocked drinks, partial deliveries, complete unpaid bills, paid receipts, inventories, balances, table ownership, employees/assignments, outfits and upgrades. Existing fivefold earnings and all other purchase costs remain unchanged. No closed-app earnings were added.

## Actual verification

| Check | Result |
| --- | --- |
| `npm test` | 100 passed, 0 failed. Includes every station pair and queue destination, locked demand/jobs, atomic purchases, migration, partially delivered and complete unpaid legacy orders, all 24 table prices, earnings/upgrades and animation isolation. |
| `tests/drinks-sections-browser.mjs` | 10 passed: insufficient funds, single deductions, equipment reveal, reload ownership, complete player service through both sections, old unlocked saves, offline reloads, and every table offer/purchase on all four floors. |
| `tests/browser.mjs` | 18 passed: all floor gameplay loops, staff, upgrades, outfits, three-item orders, dining/cleanup, VR, trash, touch, offline reload and an actual service-worker update retaining progress. |
| `tests/characters-browser.mjs` | 6 passed: employees completed paying jobs on all four floors, all five outfits retained carried goods, and reduced motion interrupted only decorative transfers. |
| `tests/controls-browser.mjs` | 9 passed: keyboard/mouse/touch release and cancellation, window blur, menus, station keyboard activation and useful UI. |
| `tests/expanded-browser.mjs` | 16 passed: earnings previews and all-floor work/dining/farthest-table framing, navigation, saves and touch. Captured 36 desktop/portrait/landscape views. |
| `tests/pages-browser.mjs` | 5 passed against the local `/DFP/` production build: scoped assets/manifest/worker, fresh paid order, reduced-price table purchase, offline reload and phone controls. |
| Root and `/DFP/` builds | Passed. Vite retains its advisory for the approximately 650 KB minified main bundle (178 KB gzip). |
| OpenSpec strict validation | Passed; the active `build-dfp-game` change remains unarchived. |

The browser checks reported no uncaught JavaScript errors. Screenshots of both new sections, locked purchase controls and employee/customer service were inspected; the aisles and service zones remain distinct and accessible. Phone checks use Chromium touch/viewport emulation, not physical iOS or Android devices.

The service-worker update test temporarily builds a test revision; normal production builds were restored afterward. Runtime geometry and signs are generated locally, and the new areas require no external assets. Live public-origin browser access is unavailable in this environment because of Microsoft Family Safety; deployment is checked through GitHub Actions and the equivalent `/DFP/` build is tested locally.

## Local evidence

With localhost:8080 running, open [the screenshot gallery](http://localhost:8080/artifacts/drinks-sections/index.html). Screenshots and JSON reports live in the ignored `artifacts/drinks-sections/` and `test-results/` directories; they are local verification artifacts, not deployed game assets. These checks do not touch the player's browser saves.
