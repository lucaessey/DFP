# Design

## Context

Every employee is owned permanently, has one assigned floor and three upgrade levels. Each floor can hold twelve employees. Existing transfers return carried inventory to its source, reset movement/work, and retain identity and upgrades. See proposal.md for motivation.

## Goals / Non-Goals

Provide deterministic bulk staffing across all eleven floor filters. Do not hire, spend money, invent idle assignments, change employee benefits or alter the save schema.

## Decisions

- Score is the sum of speed, capacity and profit upgrades (0–9). All hires have the same base capabilities; hire price or home floor does not make them stronger. This transparent general-purpose ranking avoids claiming to predict revenue for every business. On tied totals, prefer staff already on the destination, then stable employee ID.
- A pure planner selects up to twelve owned employees and computes incoming transfers. Any displaced current employee moves to a floor vacated by an incoming employee. There are always at least as many incoming employees as displaced employees, so these slots suffice even if other floors are full.
- Apply the whole plan synchronously through one command, using the existing safe-transfer operation for both directions. Repeated clicks are harmless once the best team is present. Save once after the complete command; no animation changes assignments.
- Show “Fills with best” above the origin roster on every floor filter, explicitly naming the destination. Explain total upgrades, free transfers and movement from other floors. Disable it on locked floors, with no employees, or when the selected floor already has its best team.

## Risks / Trade-offs

- Pulling staff away reduces other floors' teams → say so next to the action; keep displaced staff assigned and preserve all ownership.
- Tied staff could shuffle repeatedly → prefer existing assignments and use stable IDs.
- Bulk swaps could lose carried goods or exceed caps → precompute the full assignment, return cargo to each source, and verify full-floor exchanges and reloads.

## Migration Plan

Reuse existing employee save fields and commands. Build and verify locally, including offline reload. No publishing is part of this request.
