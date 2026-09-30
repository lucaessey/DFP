# Proposal

## Why

Choosing the strongest team from 55 owned employees requires many individual transfers. A single action should staff any unlocked business floor with the player's best employees.

## What Changes

- Add a “Fills with best” button to each floor's Employees view.
- Rank owned employees by total speed, capacity and profit upgrade levels, preferring existing assignments on ties.
- Fill up to twelve places for free; safely swap displaced staff into the spaces incoming employees leave.
- Preserve ownership, upgrades, inventory and saved progress; explain disabled states and ranking in the UI.

## Capabilities

### New Capabilities
- `best-employee-assignment`: Deterministic, free bulk staffing with existing transfer protections.

### Modified Capabilities
None.

## Impact

Employee commands and the Employees panel, responsive styling, automated transfer tests and browser verification. No new dependencies, save schema, purchases, services or publishing.
