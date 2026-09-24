# Public DFP release

Public address: **https://lucaessey.github.io/DFP/**

Repository: **https://github.com/lucaessey/DFP**

The user explicitly requested public GitHub Pages publication. The existing repository was empty and public. The release includes the game source, build configuration and tests; GitHub Pages receives only the compiled game from `dist-pages/`. Local screenshots, recordings, machine reports, dependency folders and editor instructions stay outside the repository. One synthetic legacy-save fixture is retained for migration tests.

## Deployment

`.github/workflows/pages.yml` runs on pushes to `main` or manual dispatch. It installs locked dependencies, runs 50 simulation tests, builds with `/DFP/` as the Vite base, uploads the compiled site and publishes it through GitHub Pages. The build job has read-only repository access; the deployment job has Pages and deployment-identity permissions.

The manifest uses relative installation URLs. The service worker and every precache URL use the resolved build base. Root-path local builds continue to work, and the public worker is confined to `/DFP/`. Third-party runtime license notices are included in the deployed files.

## Verification

- Published successfully on September 23, 2026. [GitHub Pages deployment](https://github.com/lucaessey/DFP/actions/runs/35943959780) completed both build and deploy jobs. The public HTTPS address returned HTTP 200 with the built HTML; HTTPS enforcement is enabled.
- 50 unit/simulation tests passed before publication.
- The Pages build passed an isolated browser check: real 3D rendering, correct manifest/icons/scope, first food unlock, table purchase, a complete $1 order, saved ownership and balance after offline reload, and phone touch access without overflow.
- `npm run test:pages` runs these checks locally. Set `DFP_TEST_URL` to the public address to verify the deployment without touching the player's own saves. The report is written to ignored `test-results/pages-report.json`.
- Live browser verification was attempted but Microsoft Family Safety on the available computer redirected Edge to its restricted-site page, asking for family-organizer approval. This restriction was left intact. Live browser gameplay is therefore not claimed as verified; the same production build passed local browser gameplay and offline checks at both `/DFP/` and `/`.

Public-site saves are separate from localhost because they use a different browser origin. Everyone can play without a GitHub account; progress stays in their own browser. No cloud save service or multiplayer server is involved.

## Gameplay fixes

[Deployment 35946360379](https://github.com/lucaessey/DFP/actions/runs/35946360379) successfully published commit `7831cec` with stable character facing, immediate stopping for direct controls, a 20% earnings increase with saved fractional carry, an open first-floor pickup tray and icon-based gameplay overlays. Money, buttons, menus and accessible station names remain available.

Validation passed: 54 unit/simulation tests, 18 main browser checks including an actual save-preserving update, 9 control/interface checks including real touch release/cancellation, and 5 checks against the local `/DFP/` production build. Desktop and phone screenshots were inspected. The previously documented Family Safety restriction remains unchanged; no live browser bypass was attempted. Existing players can use Settings → Save & update DFP when the new version is offered.
