# Proposal

## Why
Create DFP — Deep Fried Pixels as a friendly, tactile restaurant-management game that can be played on a phone without a connection after installation. This is a new, independent project in an empty workspace; no other game's source or progress is involved.

## What Changes
- Build an original colorful 3D restaurant with a directly controlled character, automatic proximity interactions, touch joystick, and keyboard movement.
- Deliver four progressive floors: controller takeout, seated console-meal dining, DFP merchandise, and quarter-earning arcade with a playable VR dodging minigame.
- Add visible autonomous employees, floor-specific player upgrades, shared employee roster and transfers, cosmetic outfits, tutorial, and synthesized audio.
- Add a visible trash can to every floor, as requested during implementation, for discarding carried items.
- Require paid unlocks for all thirteen sellable products/arcade offerings, use the user's final $1 controller / $3 drink payouts with modest higher-floor prices, and increase takeout drink demand to 80%.
- Provide exactly Elevator, Home, Outfits, Employees as persistent bottom tabs, plus separate settings.
- Persist versioned local progress and deliver an installable offline PWA with update recovery.
- Add simulation and browser acceptance tests and local build instructions. Keep the change unarchived. The subsequent publication request authorizes GitHub Pages deployment.

## Capabilities

### New Capabilities
- `active-gameplay`: Movement, interaction, all four floor loops, tutorial, and VR game.
- `economy-staffing`: Progression, purchases, shared staff, upgrades, cosmetics, and earnings.
- `offline-interface`: Responsive navigation, settings, local saves, migration, installation, offline caching, and updates.

### Modified Capabilities
None. There is no existing game.

## Confirmed requirements and decisions
The attached user brief is the source of requirements. On 2026-09-21 the user explicitly approved: five unique hires per floor in a shared 20-person roster; transfers between unlocked floors with upgrades retained; 12 workers maximum per floor; floor-specific player upgrades with five total purchases per floor; gameplay-earned cosmetics; off-screen employee simulation during active sessions; no closed-app earnings; one collected quarter equals one spending dollar; and a touch/keyboard three-lane dodging VR minigame.

## Proposed implementation details
Use a deterministic fixed-step simulation, original procedural Three.js geometry, data-driven prices, and a small vanilla JavaScript UI. Use three upgrades per employee category (nine combined), independently of the player's allowance. Transfers immediately cancel unfulfilled work, return carried goods to the old floor's stock, and leave customer/table state intact. Adjustable balance values belong in configuration and may change without changing these rules.

The authorized presentation upgrade replaces the initial Canvas scene with real 3D models, blended character animation, restrained camera follow, contextual effects, and five matching 3D outfit previews. Preserve all prices, unlocks, rules and saved progress. Include reduced effects, reduced motion, offline models, measured performance, comparable screenshots and a gameplay recording. Official Pizza Ready screenshots are a reference for proportions and clarity; all DFP models remain original.

The subsequent September 23 request extends every floor with a separate food stacking pad, middle service circle, a larger dining wing and six purchasable tables. Customers pay before eating, and player/employee cleanup is permitted only after eating finishes. Gift-shop and arcade snacks complement their existing activities. Saves migrate to schema four while retaining earlier dining tables and already-delivered goods.

The user subsequently requested public publication at https://lucaessey.github.io/DFP/. Use the existing public lucaessey/DFP repository and GitHub Pages, with assets, manifest and service worker scoped to /DFP/. Preserve the localhost development address and verify the published game in a fresh browser profile.

## Impact
The post-publication feedback requests corrected character facing, a modest income increase, reliable movement stopping, a redesigned first-floor pickup station and fewer words over the game. The user confirmed hiding floating station names/instructions while retaining money, buttons and menus. Implement a 20% earnings boost with saved fractional carry, stable heading between simulation frames, direct-input release/cancellation, an open warming tray and accessible action icons; verify locally and update the existing GitHub Pages release.

Only this project is affected. New application source, tests, static assets, localStorage keys prefixed `dfp.`, and a same-origin service worker are introduced. Project-pinned OpenSpec and Vite are development dependencies. No external runtime services, accounts, advertising, purchases, or cloud saves.
