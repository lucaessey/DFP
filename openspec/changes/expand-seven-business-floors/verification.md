# Local verification — September 29, 2026

## Completed implementation

All seven businesses have working production/customer cycles, purchasable equipment and sections, five hires each, actual employee work, original procedural 3D props and visible state changes. The elevator lists B1 first and all eleven businesses in order. Five bottom tabs remain accessible. The design contains the full purchase and earning tables.

Save version 10 appends seven locked floors to the existing four-floor save. Prior balances, stock, receipts, staff, upgrades, outfits, pets and basement/computer progress are retained. The existing backup mechanism keeps the earlier serialized save. Online comments and account services were not changed or deployed.

Lens Buddy retains the user's earlier explicit $5,555/+5 configuration and $100 remote catch reward. The expansion brief repeated older $5,000/+2 values; clarification was requested and no reply received, so the preservation assumption was stated during implementation. Ordinary computer security still pays $15, with $5 penalties.

## Automated tests

`npm test`: **192 passed, 0 failed, 0 skipped**. The 33 expansion tests cover:

- Full price table, sequential unlocks, insufficient funds, prerequisites and repeated purchases.
- Real navigation routes to every workstation and seating approach, including companion clearance.
- Player work and five-employee business cycles on each of the seven floors; valid saves throughout.
- Ice-cream timers, robot faults/charging, rooftop rain/umbrellas, esports faults, café water/playground and factory inventory/conveyors.
- Separate admission, concession, meal, playground and delivery receipts; duplicate actions and reload.
- Preserved fivefold earnings and upgrade/pet effects applied once; fixed security amounts unchanged.
- Version-nine migration comparisons, older historical save fixtures, invalid-state rejection and future-save protection.
- Player and employee upgrade limits, staff transfers, pet following/preparation/service/collection/cleanup, and security on every new highest floor.

Existing tests for the original floors, controls, economy, characters, pets, comments, computer and security also pass. Old four-floor migration fixtures remain genuinely four-floor fixtures; active-state tests use the new configured count.

## Running production build

`tests/expansion-browser.mjs`: **17 check groups passed**, zero uncaught browser errors.

- Inspected every new floor's work and guest/packing areas with an equipped companion.
- Completed a full player job on every new floor through visible navigation/station controls, then continued the same progress with three employees and verified additional completed jobs and revenue.
- Verified B1 first and visited all eleven destinations using the mobile elevator.
- Checked 390×844 portrait and 844×390 landscape navigation.
- Installed the generated service worker in an isolated profile, disconnected the browser, reloaded and visited another floor with money and pets preserved.

`tests/expansion-final-browser.mjs`: **4 additional integration groups passed**, zero uncaught browser errors.

- Rendered all seven busy floors after final visual refinements. Corrected cinema seating direction, café animal placement, portrait roster selection visibility and landscape controls. New food models share merged geometry to reduce repeated drawing operations.
- Monitored each highest floor from 5 through 11 in a phone viewport; caught robbers for exactly $100 using remote Lens access; returned to the same gameplay floor/position and confirmed closed encounter clocks pause.
- Checked every outfit, interruption of preparation, carried goods after reload, the touch business guide, eleven staff filters, a factory hire and transfer, and landscape tabs.
- Repeated offline reload against the final production assets; preserved purchases and carried inventory and opened the factory.

Screenshots and machine-readable reports are in `artifacts/expansion/`. The local gallery is `http://localhost:8080/artifacts/expansion/index.html`. These generated evidence files are ignored by Git; the browser scripts and this record are tracked source. Tests used isolated browser profiles and did not alter the user's actual saved game.

## Build and scope limits

- `npm run build` succeeds and generates the offline service worker. Vite reports its non-fatal large-chunk warning (the main game/Three.js bundle is approximately 795 kB before gzip).
- Strict OpenSpec validation and `git diff --check` pass.
- Desktop Edge and emulated phone viewports were tested. Physical iOS/Android performance and installation were not tested; reduced effects remains available.
- Existing online authentication/comment services were not live-tested or redeployed for this offline gameplay expansion.
- No publishing, commit or push was performed. Local development and production preview remain available.
