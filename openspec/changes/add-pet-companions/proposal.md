# Proposal

## Why

DFP needs collectible companions that make everyday jobs more playful and give earned money another useful purpose. Pets must fit the existing offline game, expanded rooms and rounded 3D presentation without changing permanent upgrades.

## What Changes

- Add a fifth, paw-labelled Pets navigation tab with 30 individually modelled companions, exact abilities, prices from $20 to $2,000, a selected 3D preview and clear purchase/ownership/equipment states.
- Persist permanent ownership and exactly one optional equipped pet using a backward-compatible local save migration.
- Add separately calculated speed, capacity, ordinary-income and preparation bonuses, plus bounded nearby cash collection, food service and table cleaning.
- Add collision-aware following, floor transfer/recovery, species-specific movement, idle and reaction animations, including a basement companion.
- Test purchases, persistence, individual abilities, anti-stacking, security exclusions, navigation, phone controls and offline operation.

## Capabilities

### New Capabilities

- `pet-companions`: Offline pet collection, bounded gameplay assistance, shop and physical 3D followers.

### Modified Capabilities

None. No main specs have been published in this repository; this change preserves the existing game and comments changes.

## Impact

Simulation, payment quotes, save validation/migration, navigation UI, Three.js rendering, basement rendering, procedural asset caching and regression/browser tests. No external assets, accounts, service, billing or new dependency is required. The full pre-implementation collection table is in this change's design.
