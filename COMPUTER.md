# Pixel Desk: basement computer

Implemented and verified September 27, 2026 (local time).

## Playing

Basement access remains **$200**, as reconfirmed by the user. Buy the **$100 computer** in the basement, then tap its turquoise monitor. The original 3D desk, matching stand, dark rounded frame and pale-blue desktop follow the written reference approved by the user.

| App / purchase | Price | Behavior |
| --- | ---: | --- |
| Computer | $100 | Permanent desk/computer after the basement unlock |
| Security | $150 | Requires computer, TV ($50), couch ($100), and both $15 plants |
| Email | $50 | Permanent fictional inbox: 20 Good Comments and 20 Bad Reviews |
| Boggle | $50 | Permanent access to https://lucaessey.github.io/Boggle/ |
| Wordventure | $50 | Permanent access to https://lucaessey.github.io/wordventure/ |
| Snake | $50 | Permanent access to https://lucaessey.github.io/phaser-snake/ |

Security now opens through the computer. The TV remains a furnishing and requirement. Existing security purchases are retained without a second $150 charge; the computer is a separate new $100 purchase. Security continues monitoring the highest unlocked floor, with saved random 1–30-second waits, one ten-second robber, fixed +$15 catches and −$5 penalties. Leaving security for any other app pauses its encounter.

Every screen has **Back to DFP**. Apps and games have **Back to Computer**. Email offers categories, selectable inbox messages and return navigation; reading it has no money or progression effects. Existing employees still work during active DFP sessions.

The three original external games appear inside a titled frame. Loading, timeout, retry, offline and “Blank or blocked?” help controls are outside the frame. Leaving or backgrounding removes the game frame to stop its session and audio. Each game keeps its own graphics, rules and sound settings. External game progress may reset when its window closes; DFP ownership remains saved.

## Saves, embedding and offline

Schema six stores computer, email and three game ownership flags. Migration from schema five retains the complete security record, balance, floors, staff, upgrades, outfits, goods and remaining encounter time. Earlier migrations and future-version protection remain. Ownership and transaction checks reject repeat purchases and insufficient funds without mutation; presentation cannot charge or reward money.

The physical lounge, desktop, all 40 emails and security remain bundled and cached for offline use. External game ownership survives offline reload; launches display a connection message when offline. DFP does not promise to cache those separately hosted games.

Only the three specified URLs can be launched. The iframe sandbox allows scripts, browser storage, forms and pointer lock, while excluding top-navigation, popups and fullscreen. Both cross-origin and same-origin fixture tests confirmed ordinary attempts to navigate the top-level DFP page are blocked. The games are trusted user-selected sites: scripts plus same-origin storage are necessary for Snake, so same-host Pages games are **not** an isolation boundary against intentionally hostile code. DFP exposes no purchase or payment API to embedded messages. Normal game use was verified to preserve DFP’s saved balance and ownership.

An iframe load event cannot reliably distinguish every remote error page or framing refusal. The UI therefore says the window opened, retains a visible help control, and provides retry/back states for error, timeout, offline and user-reported blank/blocked content. It never labels an onload event as verified gameplay.

## Original computer feature verification (September 27)

| Check | Result |
| --- | --- |
| `npm test` | **115 passed**, zero failures. Exact prices, insufficient funds, prerequisites, duplicate/reloaded charges, schema-five migration, retained security outcomes, pause behavior, catalog URLs and mail content included. |
| `node tests/computer-browser.mjs` | **12 passed**, zero uncaught errors. Computer model, purchases, all 22 messages, migration, portrait/landscape, controlled frame input/navigation, frame disposal, timeout/retry, offline local apps, unavailable external games and same-origin navigation blocking. |
| `node tests/computer-live-browser.mjs` | **7 passed**, zero external errors in the final run. All three real remote pages returned HTTP 200 with no `X-Frame-Options` or CSP framing restrictions. Boggle’s board accepted dragging/tapping; Wordventure accepted APPLE through mixed touch/keyboard input and submitted it; Snake started and its actual direction changed using keyboard and touch swipes. All three resized in portrait and landscape and returned without changing DFP money/purchases. |
| `node tests/security-browser.mjs` | **13 passed**, zero uncaught errors. All four actual monitored floors, existing timers/rewards/penalties, new computer entry, keyboard/touch, pause/reload, floor changes and offline monitoring. |
| `node tests/browser.mjs` | **18 passed**, zero uncaught errors. Existing food, drinks, staff, tables, shop, arcade, VR, outfits, controls, saves, offline reload and an actual service-worker update. |
| `node tests/pages-browser.mjs` | **5 passed**, zero uncaught errors, against the local `/DFP/` production build. Scoped assets/manifest/worker, paid order/table, offline reload and phone controls. |
| Production builds / OpenSpec | Root and `/DFP/` builds passed. Strict OpenSpec validation passed. Main JavaScript approximately 687 KB minified / 190 KB gzip; Vite retains its existing size advisory. |

**Total: 115 unit tests and 55 browser checks.** Screenshots of the model, desktop, inbox, store and actual games were inspected. The original storage-free iframe broke Snake and disabled Wordventure’s service-worker registration; enabling the trusted games’ browser storage resolved both. The mobile computer initially overlapped the navigation bar; its safe bottom space was corrected. The isolated save-seeding test helper was limited to the parent frame after it attempted to seed sandboxed frames.

Tests use isolated Edge/Chromium profiles and emulated phone viewports/touch, without modifying the player’s browser saves. Snake’s built-in solo, slow-speed settings were used in the isolated input test to avoid random rival collisions; the shipped game is unmodified. Snake applies turns on a movement tick and can restart its own round when resizing; its native letterboxing is retained. Native iOS/Android installation and backgrounding were not physically tested. Audio verification covers frame disposal and accessible game controls, not a subjective listening test. Remote game behavior may change independently of DFP.

Open the [local screenshot gallery](http://localhost:8080/artifacts/computer/index.html). Images and JSON reports are local ignored verification artifacts in `artifacts/computer/`, not deployed game assets.

## Review expansion (September 28, 2026)

Added 18 fictional reviews, for 20 Good Comments and 20 Bad Reviews. Renamed the former Funny Complaints category in the purchase preview, category card, inbox heading and return navigation. The preview derives its names and total from the catalog. Existing notes and category IDs remain intact; existing Email owners receive the additions without another purchase or save migration.

Verification for this update: **115 unit tests and 12 computer browser checks passed**, with no uncaught browser errors. The browser opened every one of the 40 messages and returned to its inbox, checked the locked purchase preview and category names, and confirmed reading leaves money and the paused security encounter unchanged. New messages in both categories were opened after an offline reload. Portrait and landscape touch navigation reached the last new Bad Review; refreshed desktop and phone screenshots were inspected. Root and `/DFP/` production builds and strict OpenSpec validation passed. Phone checks use emulated Edge/Chromium viewports, not physical devices. The broader original feature results above were not all rerun for this content update.
