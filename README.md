# DFP — Deep Fried Pixels

A mobile-first, original 3D restaurant management game. Four floors, visible autonomous employees, outfits, and a playable VR arcade. No accounts, ads, purchases, or external runtime services.

**[Play DFP](https://lucaessey.github.io/DFP/)** — free in your browser. Progress saves on your device. The public site and localhost have separate saves.

## Run locally

Requires Node.js 22.12+ (tested with Node 24) and npm.

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. Keep the terminal running. Development mode reloads automatically when files change. Device-local saves are retained across code updates.

## Production and offline mode

```powershell
npm run build
npm run preview
```

Open **http://127.0.0.1:4173/**. The production build registers the offline service worker. Wait for **Settings → Ready to play offline** before disconnecting. The `dist/` directory contains the complete static app for an HTTPS host at the origin root.

Development and production preview use different origins/ports, so their local saves are separate. Do not expect progress from port 5173 to appear on port 4173.

For installation, use your browser's Install app menu. On iPhone/iPad, use Safari → Share → Add to Home Screen. An HTTPS address or localhost is required for service workers. An ordinary LAN HTTP address on a phone will not provide production PWA installation/offline support.

## GitHub Pages

The public address is **https://lucaessey.github.io/DFP/**. `.github/workflows/pages.yml` tests and builds the game when `main` is pushed, then deploys only `dist-pages/` through GitHub Pages. It can also be run manually from the repository's Actions tab. Repository Settings → Pages uses **GitHub Actions** as its source.

To check the same `/DFP/` release locally:

```powershell
npm run build:pages
npm run preview:pages
# In another terminal:
npm run test:pages
```

Open **http://127.0.0.1:4174/DFP/**. The manifest, icons, scripts, styles and offline cache use the `/DFP/` path. The worker is scoped to this game. Development at port 5173 continues to work at `/`.

## Play

- **Move:** WASD or arrow keys; drag the on-screen joystick on phones. Click/tap a station label or floor to walk there. Stand inside a marked ring to work automatically.
- **Unlock products:** use **Unlock items** on every floor. All food, drinks, merchandise, arcade cabinets, and VR start locked on a new game. Unlock Crispy Controller for $50 first. Guests only order products you have opened.
- **Takeout:** PREP → FRY → PICK UP → **STACK FOOD**. Unload onto the marked counter spot, then stand in the separate middle **SERVE** circle to give the waiting customer food from that stack and collect payment. Unlock the drinks bar to add drinks to about 80% of orders. Drinks use the same stack-and-serve flow.
- **Fine dining:** collect the requested Pixel Tower or Pocket Crunch meal and wine, unload at **STACK FOOD**, then stand in the middle **SERVE** circle. Guests pay there before taking their food to a purchased table.
- **Gift shop:** carry stock from the stockroom to shelves; guests browse and take items; work at CHECKOUT to collect payment. Unlock the miniature-keychain shop for another product. The separately unlocked Shop Crunch snack counter uses STACK FOOD → SERVE → tables.
- **Arcade:** guests play the three machines. Collect the visible quarters from their rings. One quarter is worth one spending dollar before profit upgrades. Unlock VR, walk into its ring, and start Pixel Run. Use left/right arrows, A/D, or its touch buttons to dodge for up to 25 seconds. Leaving early forfeits the run's reward. No headset or tickets. Arcade Crunch snacks use the separate STACK FOOD and SERVE circles.
- **Trash:** every floor has a TRASH can. Stand in its ring to discard carried items one at a time. Discarding pays nothing. Leave the ring to stop. “Return carried stock” safely puts it back in the floor's stock instead.

**Tables on every floor:** use **Tables** to buy up to six tables, or choose an owned table to walk there. First tables cost $60/$100/$140/$180 by floor; each later table costs $55 more. **Dining area →** walks to the expanded seating wing; **← Kitchen** returns. Paid food guests reserve a clean table, sit and eat, then leave it dirty. Stand at its ring to clean, or let an employee do it. Occupied tables cannot be cleaned. If all owned tables are busy or dirty, paid guests wait; if no tables are owned, food is takeaway. Table purchases do not use player upgrade allowances.

**Elevator, Home, Outfits, Employees** are the four bottom tabs. Settings is the gear button. On small screens, the Upgrade button is in the gameplay area.

You start with $120. The first helper costs $100. Floor unlocks cost $650, $1,600, and $3,000, in order. Employees continue working on other unlocked floors while the application is active. There are no closed-app or background catch-up earnings.

Base payouts follow the requested harder economy:

| Sale | Base payout |
| --- | ---: |
| Fried controller | $1 |
| Takeout drink | $3 |
| Either console meal | $6 |
| Wine | $4 |
| DFP souvenir | $5 |
| Mini keychain | $3 |
| Shop Crunch snack | $3 |
| Arcade Crunch snack | $4 |
| Arcade play | 3 quarters = $3 |
| VR run | $3 + $1 per dodge |

Customers pay for their combined order once. Product unlock prices and every payout are configurable in `src/config.js`. Existing opened items are preserved when older saves migrate to the new product-unlock system.

Each floor supplies five unique hires to a shared 20-person roster. Transfer employees to any unlocked floor, up to 12 working on one floor. Transfers preserve upgrades and return undelivered cargo safely to the previous floor.

Buy **five player upgrades total per floor**, divided between speed, capacity, and profit. Each employee separately supports **three upgrades per category**. Earnings are:

```text
round(base payment × (1 + 0.20 × floor player profit level
                        + 0.15 × collecting employee profit level))
```

The employee term is zero when the player collects. Bonuses are applied once, at collection. Outfits are cosmetic and bought with earned game money.

## Saves and updates

Saves are **device-local to this browser and origin**, not cloud-synced. Clearing browser data deletes progress. The app stores a versioned, validated snapshot and a backup, migrates earlier formats through schema 4, and preserves unknown future saves. Settings offers save export for safekeeping; this first version does not include a save-import UI.

Discrete purchases/payments save immediately; movement and unfinished work save at least every two simulated seconds and on page hiding. A storage error is reported in Settings. A second tab is blocked from writing to the same save. Invalid primary data can recover from its valid backup. A newer app download never clears localStorage. When an update is ready, use **Settings → Save & update DFP**.

## 3D presentation

Procedural Three.js models include articulated characters, five outfits, carried stacks, original controller food, themed furniture and a smoothly following camera. All geometry, lettering and sound are generated locally and cached in the production build. Settings includes **Reduced effects** (lower pixel density, contact shadows and fewer particles) and **Reduced motion** (steady area views and reduced decorative animation). A WebGL 2 capable browser is required.

See [the screenshot and gameplay gallery](http://127.0.0.1:5173/artifacts/3d-upgrade/index.html) while the dev server runs, and [VISUAL_UPGRADE.md](VISUAL_UPGRADE.md) for measured performance and verification.

## Verify

```powershell
npm test
npm run build
npm run spec:validate
# With npm run preview active in another terminal:
npm run test:browser
node tests/seating-browser.mjs
node tests/visual-3d.mjs
# Optional: record the real player/employee loop
node tests/visual-3d.mjs --record
```

Browser tests use installed Microsoft Edge by default, in a separate headless profile with isolated saves. Set `DFP_BROWSER=chrome` to use Chrome, or install an appropriate Playwright browser and adapt the launch channel. The browser suite records screenshots and a JSON report in `test-results/`; its update check rebuilds `dist/` with a test revision. Run `npm run build` afterward for the normal release build.

See [VERIFICATION.md](VERIFICATION.md) for results and device-test limitations.

## Project layout

- `src/config.js`: adjustable economy, timings, layouts, employee roster, outfits.
- `src/simulation.js`: deterministic gameplay, workers, transactions, all floor rules and VR.
- `src/navigation.js`: collision and shared grid pathfinding.
- `src/renderer.js`: Three.js scene, camera, projected labels, effects and diagnostics.
- `src/scene-assets.js`: reusable original 3D geometry, furniture, food and character rigs.
- `src/animation.js`: independent blended poses and visual crowd separation.
- `src/main.js`, `src/style.css`, `src/vr.css`: input and responsive interface.
- `src/storage.js`: version validation, migration, checksum, backup and recovery.
- `src/audio.js`: original synthesized sound effects.
- `vite.config.js`: complete versioned production precache and update worker.
- `scripts/generate-icons.mjs`: original app icon generation (`npm run icons`).
- `openspec/changes/build-dfp-game/`: proposal, specifications, design and tracked tasks.

OpenSpec 1.13.1 is pinned. Use `npm run openspec -- <command>` for the project CLI. The change is intentionally **not archived**.
