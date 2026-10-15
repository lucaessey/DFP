# Verification — First-Person Explorer

Verified locally on 2026-10-15. These implementation checks were recorded before the separately requested commit, push and publication.

## Implemented

- Permanent $1,000 Explorer outfit in Outfits, preview, description, Buy/Owned/Equipped states and free equipment changes. No statistics change.
- Shared eye-level camera across eleven businesses, basement lounge, outdoor neighborhood and all four Story competition scene types. Level horizon, no camera bob, vertical FOV at most 70 degrees and horizontal FOV at most 100 degrees.
- Mouse look through an explicit click, Escape release, camera-relative WASD/arrows, left joystick plus simultaneous right-side touch look. Controls suspend for menus, focus loss, computer and security.
- Lower-corner black mitten hands and at most three representative goods, with the real quantity retained in the HUD. Inventory is never mutated by rendering. Reduced motion disables hand pulses.
- Workstation list and automatic-work status prompt; Story look-to-aim and original action controls. Fixed a Story UI refresh issue that unnecessarily replaced unchanged buttons and could lose keyboard focus.
- Separate, furniture-aware lounge position; first-person pet rest points prefer outside the forward view. Normal outfits and security continue using overhead cameras.
- Save version 12 adds heading, pitch and lounge position. Version 11 and earlier supported migrations preserve existing progress. Procedural assets are part of the existing offline bundle.

## Passed checks

| Check | Actual result |
| --- | --- |
| `npm test` | 221 passed, 0 failed. Includes 9 new perspective/geometry checks and existing economy, pets, staff, security, save, character and Story regression tests. |
| Purchase/persistence tests | Exactly $1,000 once; insufficient funds rejected; repeated purchase free; equipment and heading round-trip; old fields preserved; unknown future saves protected. |
| Movement and geometry | Heading-relative full speed, pitch-independent movement, all eleven floors' station paths, lounge furniture recovery, and actual rendered furniture/wall near-plane clearance at every business work pad. |
| `node tests/first-person-browser.mjs` | 20 browser check groups passed; zero page errors. Real mouse pointer lock/release, keyboard stop, all floors, max inventory, two-touch move/look, physical touch UI buttons, menus, reload, offline production PWA and remote security return. |
| `node tests/first-person-detail-browser.mjs` | 6 additional groups passed; zero page errors. Empty inventory, 320px phone, landscape FOV, Story aiming/throwing, stable keyboard focus, all competition scenes and simultaneous lounge touch. |
| `node tests/first-person-jobs-browser.mjs` | All 11 floors passed: player completes a paid job using actual workstation controls; three employees then earn more revenue. Browser rendering is throttled to 10 Hz for this deterministic long-running suite; simulation steps are retained. |
| `DFP_TEST_OUTFIT=explorer node tests/story-browser.mjs` | All five chapters and all nine competitions completed through UI; 14 groups passed, no page errors. Original businesses and possessions remained unchanged during Story. |
| `npm run build` | Successful production build with cached local assets. Vite retains its bundle-size advisory (main chunk approximately 862 kB / 253 kB gzip). |
| `npm run build:pages` | Successful production build using the deployed `/DFP/` base path. |
| `npm run openspec -- validate add-first-person-explorer --strict` | Valid. |
| `git diff --check` | Clean. |

## Visual evidence

Local gallery: `http://localhost:8080/artifacts/first-person/index.html`.

Inspected screenshots of all eleven floors, desktop and phone carrying, 320px portrait, landscape, lounge and Story scenes. Corrected aspect-dependent stretching of the hands, excess landscape FOV and overlapping look hints. The lower-corner models leave the main sight line clear with zero, three and thirteen goods. Browser reports and full-job screenshots are saved beside the gallery under `artifacts/first-person/` (local ignored evidence).

## Limits

Checks used isolated headless Microsoft Edge profiles, with desktop mouse and emulated mobile touch at 320px, 390px and landscape sizes. No physical phone, Safari or Firefox testing was performed. Pointer-lock availability depends on the browser; right-side drag remains available as a fallback. The existing bundle-size advisory remains; no new runtime dependencies or downloaded model assets were introduced.

No implementation test altered the user's actual browser storage or deployed game.
