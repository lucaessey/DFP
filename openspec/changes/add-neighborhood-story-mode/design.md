# Design

## Context

The game uses a fixed-step business simulation, version-10 local checksum saves, a separate basement computer view, and procedural Three.js characters/pets. Eleven floors and their customers share one saved object. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:** Preserve business state by suspending it in place, provide deterministic testable campaign logic and reusable competitions, and keep the added world readable on phones.

**Non-Goals:** External email, networking, billing, new services, money rewards, business rebalancing, or publication.

## Decisions

- Add version-11 `story` state. The business step returns immediately while story is active; story uses its own clock, actor, pet, inventory and event state. Copying and restoring full business snapshots was rejected because stale snapshots could overwrite legitimate regular-play progress.
- Route a dedicated Inbox through ComputerView callbacks. DFP's neighborhood door returns to the actual computer Inbox. Existing reviews and online applications keep their routes.
- Define sequential chapter objectives and nine total competitions in data. Locations and dialogue unlock events; the challenge requires a physical return to DFP. Victory IDs are unique and additive; results are committed synchronously before presentation.
- Use one outdoor map and a separate compact arena layout per event type. Reuse rounded character/pet models, lighting, touch movement and elevated follow-camera conventions. Use a small grid pathfinder for scenery and pet recovery. No procedural scene requires external assets.
- Cooking uses three recipe orders, two collected ingredients per dish, a preparation station and delivery counter. Serving uses three guests with seating, ordered meals, eating and cleaning. Racing follows ordered destinations with telegraphed moving hazards. Food fights use free aimed throws, moving rivals, telegraphed projectiles, dodge cooldowns and harmless stuns. Final versions tighten targets while remaining achievable at fixed basic speed. Display all thresholds, rival cadence, tie behavior and retry tips before play.
- Separate live pause (same event resumes) from reload interruption (restart offer). Normalize only during decode, never while serializing or making backups. Completing a campaign disables active mode and records the concluding email; no monetary reward exists to duplicate.
- Keep the story overlay independent of normal floor coordinates. Navigating away pauses the story, allowing existing navigation and purchases to work. A saved active campaign reopens its proper view, with an explicit event restart after reload.

## Risks / Trade-offs

- [Scope of five chapters] → Reuse four robust event engines with unique chapter briefs, exploration, recipes/routes and a final series; verify every required event.
- [Hidden business updates] → Guard the simulation centrally, test byte-equivalent business snapshots through story actions, and gate security monitoring.
- [Interrupted saves] → Strict story validation and version migration; unfinished event restart cannot erase completed wins.
- [Small screen crowding] → Collapsible objective details, scrollable event briefs/results, large action buttons and bounded camera zoom; inspect both phone orientations.
- [Mobile graphics load] → Shared geometry/materials, one visible scene, limited NPCs/projectiles, capped pixel ratio and reduced motion.

## Migration Plan

Version-10 saves gain a fresh unstarted story and move to version 11. Older migrations run first. Future-version and backup protections remain. Build and test offline before user review; do not publish. A rollback must retain the newer save file rather than allowing old code to overwrite it.
