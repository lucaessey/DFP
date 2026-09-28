# Basement lounge and security

Implemented and verified September 27, 2026.

## How to play

Open **Elevator → The Basement**. It costs **$200** from the beginning, independent of food and upper-floor unlocks. The existing four navigation tabs remain.

| Purchase | Price | Requirement |
| --- | ---: | --- |
| Basement | $200 | Sufficient money |
| TV | $50 | Basement |
| Couch | $100 | Basement |
| Plant one | $15 | Basement |
| Plant two | $15 | Basement |
| Security system | $150 | All four furnishings |

The lounge uses original procedural 3D furniture, the approved character base, soft lighting and purchase placement animations. The couch faces the TV; plants occupy separate corners. The checklist shows each requirement. Owned items cannot be charged again.

After installing security, tap the TV. The feed renders the **actual highest unlocked above-ground floor**, including its current products, furniture, customers, employees and activity. Opening a higher floor automatically changes the monitored floor. Workstation, service and dining camera buttons, zoom controls and keyboard arrows help inspect the room; phone person targets are enlarged and overlapping targets resolve to the nearest visible body center. The camera remains fixed when viewing a zone. Bottom navigation and an explicit Exit button stay available; Escape also exits.

Each encounter starts with a random integer wait of **1–30 seconds**, followed by one robber and a **10-second** catch window. Look for reaching, stolen goods, a dark outfit and a sack. Catching pays exactly **$15**; choosing an innocent person or letting the robber escape costs exactly **$5**. A wrong selection keeps the encounter running. Restaurant profit upgrades, fractional bonuses and the fivefold earnings multiplier do not affect security amounts. Full penalties may take the balance below zero; free navigation and earning remain available, while purchases still require sufficient funds.

Closing monitoring, opening another panel, losing focus, backgrounding or reloading pauses the saved wait/encounter. Return to the TV to resume it. No real-world elapsed time is used, and monitoring never starts automatically on reload. Round ids and saved charged selections prevent duplicate rewards and repeated charges for the same person in a round. Presentation does not award money or alter purchases.

Schema five preserves previous balances, floors, tables, inventory, upgrades, employees, assignments and outfits. Older saves gain an empty basement. Older clients recognize the newer schema as unsupported and cannot overwrite it. All models, materials and animations are local and cached in production; reduced-motion and reduced-effects settings continue to apply.

## Actual verification

| Check | Result |
| --- | --- |
| `npm test` | **109 passed**, 0 failed. Nine new tests cover independent access, all prices/prerequisites, insufficient funds, duplicate charges, 500 encounter cycles covering every wait value from 1 to 30, ten-second escape timing, fixed rewards/penalties with upgrades, reload idempotency, pause/resume, highest-floor changes and schema migration. |
| `node tests/security-browser.mjs` | **13 passed**, 0 browser errors. Covers purchases through the UI, furniture reveal, ownership reload, complete encounters on all four actual floors, portrait and landscape targeting, full bottom navigation, wrong-person/escape feedback, keyboard controls, focus pause, simulated visibility events, unlocking a higher floor mid-session and offline monitoring. |
| `node tests/browser.mjs` | **18 passed**, 0 browser errors. Existing restaurant, dining, shopping, arcade/VR, staffing, outfits, trash, touch, saves, offline reload and service-worker update remain functional. |
| `node tests/pages-browser.mjs` | **5 passed**, 0 browser errors against the local `/DFP/` production build: scoped assets/manifest/worker, paid order, table purchase, offline reload and phone controls. |
| Root and Pages builds | Passed. Approximately 670 KB minified main JavaScript / 184 KB gzip; Vite retains its bundle-size advisory. No external runtime assets were introduced. |
| OpenSpec | Strict validation passed; all 70 tasks complete. The existing change remains unarchived. |

The first browser checks exposed a test reading an autosave before the next save interval, and visual inspection found landscape camera/nav clipping. The test now snapshots at the explicit save boundary; the security camera and basement landscape layout were corrected and all four floors rechecked in both orientations. Screenshots were inspected for lounge placement, legibility, camera coverage and visible theft on all four floors.

Browser verification uses isolated Microsoft Edge/Chromium profiles and emulated phone viewports/touch. Background handling was verified with focus events and a simulated visibility-change event; physical iOS/Android backgrounding and installation were not tested. The player's browser saves were not modified. Live public-origin browser access remains blocked here by Microsoft Family Safety; publication is verified through GitHub Actions and the equivalent `/DFP/` build is tested locally.

With the local server running, open [the screenshot gallery](http://localhost:8080/artifacts/basement/index.html). Images and the JSON browser report are local, ignored verification artifacts in `artifacts/basement/`; they are not shipped in the game.

## Basement price follow-up

Basement access now costs $200. The shared price drives both the Elevator label and actual deduction; existing ownership and balances are preserved without a refund or additional charge. Reverification passed all 109 unit tests and 13 basement browser checks, including the displayed $200 offer, rejection at $199, exact-price purchase, persistence, duplicate protection and offline reload. Root and Pages builds and strict OpenSpec validation passed.
