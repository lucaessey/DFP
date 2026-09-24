# Public DFP release

Public address: **https://lucaessey.github.io/DFP/**

Repository: **https://github.com/lucaessey/DFP**

The user explicitly requested public GitHub Pages publication. The existing repository was empty and public. The release includes the game source, build configuration and tests; GitHub Pages receives only the compiled game from `dist-pages/`. Local screenshots, recordings, machine reports, dependency folders and editor instructions stay outside the repository. One synthetic legacy-save fixture is retained for migration tests.

## Deployment

`.github/workflows/pages.yml` runs on pushes to `main` or manual dispatch. It installs locked dependencies, runs 50 simulation tests, builds with `/DFP/` as the Vite base, uploads the compiled site and publishes it through GitHub Pages. The build job has read-only repository access; the deployment job has Pages and deployment-identity permissions.

The manifest uses relative installation URLs. The service worker and every precache URL use the resolved build base. Root-path local builds continue to work, and the public worker is confined to `/DFP/`. Third-party runtime license notices are included in the deployed files.

## Verification

- 50 unit/simulation tests passed before publication.
- The Pages build passed an isolated browser check: real 3D rendering, correct manifest/icons/scope, first food unlock, table purchase, a complete $1 order, saved ownership and balance after offline reload, and phone touch access without overflow.
- `npm run test:pages` runs these checks locally. Set `DFP_TEST_URL` to the public address to verify the deployment without touching the player's own saves. The report is written to ignored `test-results/pages-report.json`.

Public-site saves are separate from localhost because they use a different browser origin. Everyone can play without a GitHub account; progress stays in their own browser. No cloud save service or multiplayer server is involved.
