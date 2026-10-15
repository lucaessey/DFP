# Design

## Context

DFP uses Three.js renderers for business floors, Story Mode and a static basement lounge. The business and story simulations convert screen-relative input into isometric world movement. Outfits already have permanent purchases and transaction guards. Save version 11 validates outfit IDs; computer/security views are independent overlays.

## Goals / Non-Goals

**Goals:** Share camera/control behavior across scenes; keep presentation out of economic and inventory calculations; reuse existing navigation and purchasing.

**Non-Goals:** New services, new economic bonuses, changing the security camera, deploying, or rebuilding the game engine.

## Decisions

- Add an Explorer outfit to the existing catalog and a version-12 view record (yaw, pitch and separate lounge actor position). Use one remembered look across scenes and overlays. Avoid storing angles on economic actors or adding a second inventory.
- Share pure horizontal-input helpers and an eye-level perspective renderer helper. Preserve each orthographic camera for immediate restoration and security. Use a short near plane and existing collision clearance; keep the camera at the collision-tested actor center.
- Render compact hands/items in a separate low-corner viewmodel pass so large item geometry cannot obscure the central scene. Limit representative items, display actual quantity and disable incidental movement for reduced motion.
- Share explicit pointer-lock and right-touch look controls, with scene-specific active predicates. Release and clear movement on overlays, focus loss and outfit changes; do not capture menu gestures.
- Keep business/story paths and automatic work unchanged. Add lounge movement with furniture-aware boundaries because the original lounge has no movable actor. Persist lounge position separately to preserve the upstairs position.
- Cull behind-camera world indicators; retain accessible controls and exact carry/HUD indicators. Favor pet following points behind the view while keeping collision recovery.
- Reuse procedural clothing/food geometry and the existing PWA runtime cache. No downloaded assets or new dependencies.

## Risks / Trade-offs

- [Eye-level furniture visibility differs from overhead] → Inspect all floor themes and story scenes; preserve clear controls and collision margins, adjust visual clipping if observed.
- [Pointer lock support differs by browser] → Explicit user gesture, useful fallback right-drag look, Escape release and tests in the available browser.
- [Touch gestures compete with work buttons] → Separate look region below interactive UI and ignore all interactive targets.
- [Lounge purchase places furniture over a saved position] → Recover to a safe nearby point only when collision requires it.

## Migration Plan

Migrate version 11 by adding default look and lounge position; preserve all original fields. Validate finite bounded view state and new outfit ownership. Keep prior backup/protected-future-save handling. Build and inspect locally; publishing requires the user's separate request.
