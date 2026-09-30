# Proposal

## Why

DFP needs an optional, replay-safe neighborhood adventure alongside its existing eleven businesses. Players should investigate a rival and win five chapters without spending their regular money or losing business progress.

## What Changes

- Add an offline Story Inbox to purchased Email, with an explicit start choice, fictional challenge correspondence, and resume controls.
- Add a walkable neighborhood and four skill-based competition systems across five chapters, including a four-event finale.
- Suspend regular simulation while the story is active and keep story actors, supplies, scores, and progress separate.
- Persist chapters, clues, correspondence and victories; offer free restart for an interrupted competition.
- Add phone and keyboard controls, outfit and pet presentation, safe save migration, automated and running-game checks.
- Build locally; do not publish this change.

## Capabilities

### New Capabilities

- `neighborhood-story`: Optional campaign, offline Inbox, neighborhood exploration, competitions, progress and isolation.

### Modified Capabilities

None. The existing capabilities have not been archived into main specs.

## Impact

Extends the local simulation/save schema, basement computer and frame loop. Adds procedural Three.js scenery, story UI, deterministic competition logic, tests and local verification artifacts. Reuses existing character and pet assets. No online services, external email, purchases, or new dependencies.
