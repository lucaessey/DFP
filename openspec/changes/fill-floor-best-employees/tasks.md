# Tasks

## 1. Bulk assignment
- [x] 1.1 Implement ranking and safe atomic swaps; test small collections, full floors, ties, locked floors, cargo, upgrades and repeated requests.
- [x] 1.2 Add the named control and explanatory states to every floor filter; inspect desktop and small-phone controls and verify the selected destination.

## 2. Verification
- [x] 2.1 Verify assignment persistence and offline reload, run the automated suite and production build, and validate OpenSpec; record only actual results.

## Verification results

- `npm test`: 199 passed, zero failed/skipped, including seven new bulk-staffing tests covering all eleven destinations, full-floor swaps, deterministic ties, caps, original-floor cargo returns, unchanged upgrades and idempotent reloads.
- `node tests/best-employees-browser.mjs`: four check groups passed with zero browser errors. Verified all eleven floor controls, strongest twelve assignments, selected floor versus gameplay floor, disabled states, a smaller three-person collection, 320px phone taps, desktop/landscape presentation, reload and offline reassignment. Isolated test profiles preserved the user's real save.
- `npm run build`: passed; existing non-fatal large-bundle warning remains.
- `openspec validate fill-floor-best-employees --strict` and `git diff --check`: passed.
- Screenshots and browser report: `artifacts/best-employees/` (local generated evidence, ignored by Git).
- All three tasks complete in the `fill-floor-best-employees` change. No publishing, commit or push performed for this request; physical phone testing was not performed.
