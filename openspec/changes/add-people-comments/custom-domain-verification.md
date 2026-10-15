# Custom-domain producer sign-in

Checked 2026-10-15.

## Confirmed causes

- The production `returnURL` was hard-coded to `https://lucaessey.github.io/DFP/`.
- Firebase's public project configuration listed only `localhost`, `dfp-game-e2926.firebaseapp.com`, `dfp-game-e2926.web.app` and `lucaessey.github.io`. Both custom domains were missing.
- `https://deepfriedpixels.com/DFP/` returned HTTP 200 after redirecting to `https://www.deepfriedpixels.com/DFP/`. The domain root is a separate game-collection site. GitHub Pages also reports the www `/DFP/` address as the game's URL.

## Repair and verified checks

- New production email requests use `https://www.deepfriedpixels.com/DFP/` with Firebase's in-app completion enabled. The Firebase helper `authDomain` stays on the original Firebase host; GitHub Pages does not provide its auth helper endpoints.
- An unauthorized website/continue-URL error now names the two required domains and the settings location.
- `node tests/people-domain-browser.mjs`: three groups passed. Inspected the actual built SDK request (intercepted, no real email), checked confirmation-before-success and repeated-click protection, verified the new domain error, and completed an emulator email link in another isolated browser. Wrong email denied; owner session restored after reload; game balance preserved; no page errors.
- `node tests/people-auth-errors-browser.mjs`: four checks passed for quota failure, resend cooldown after reload, expired/reused links and malformed links.
- `npm run build:pages`: passed with the existing bundle-size advisory.
- `npm run openspec -- validate add-people-comments --strict`: passed.

Tests run against loopback production/test builds and local Firebase emulators. They neither send real sign-in emails nor consume the production email quota. Existing saved balances, purchases and owner checks are unchanged by this repair. Game progress and authentication are origin-scoped; this change does not delete or silently migrate storage from the old GitHub origin.

## Required Firebase setting and live verification

In **DFP game → Authentication → Settings → Authorized domains**, add these domain names (no scheme or path):

- `deepfriedpixels.com`
- `www.deepfriedpixels.com`

Keep all existing entries. This domain list is separate from Realtime Database rules. It must be updated for email and Google sign-in from the new site. The console session available to the agent could not load project settings, so the owner was asked to add them in regular Edge or Chrome. Do not mark this configured until the public project configuration actually contains both names.

After the frontend is published and both domains are authorized, update the installed PWA through **Settings → Save & update** if it still serves the old build, then request a fresh email from the custom-domain game. Open that new link and, if prompted, confirm `lucaessey@gmail.com`. Verify the address is `www.deepfriedpixels.com/DFP/`, Producer becomes available, and the session survives reload. A real inbox round trip remains a separate owner verification; local interception/emulation does not prove delivery.

Official references: [Firebase email-link authentication](https://firebase.google.com/docs/auth/web/email-link-auth), [Authorized domains for email action return URLs](https://firebase.google.com/docs/auth/web/passing-state-in-email-actions).
