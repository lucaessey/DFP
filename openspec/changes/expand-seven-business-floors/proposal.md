## Why

DFP currently ends at four business floors. Extend the same saved restaurant empire with seven distinct, playable businesses, while keeping the basement first in the elevator and retaining existing progress.

## What Changes

- Add dessert, theater, robot kitchen, rooftop, esports, pet café, and factory floors, with sequential purchases, separate paid sections, five hires each, and complete production/service cycles.
- Generalize floor data, saves, navigation, rendering, pets, staffing and security to eleven business floors.
- Add persistent activity state and idempotent receipts for new activities; migrate old saves by appending locked floors.
- Retain the latest approved Lens Buddy configuration ($5,555 and +5 bonuses) pending the user's clarification of conflicting text in the expansion brief.
- Test gameplay, migration, earnings, mobile/offline behavior and build locally. Publishing is excluded.

## Capabilities

### New Capabilities
- `business-floor-expansion`: Seven businesses, their progression, simulation, presentation, and integration with all existing systems.

### Modified Capabilities
None: this repository has no main specifications; earlier requirements live in existing change artifacts.

## Impact

Touches configuration, simulation, persistence, station and character rendering, animation, navigation, elevator/shop/staff UI, security targets, pet eligibility, tests and local preview artifacts. No new service, account or billing requirement.
