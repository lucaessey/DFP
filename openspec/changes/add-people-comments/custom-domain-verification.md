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

## Firebase setting and live verification

The owner added these names in **DFP game → Authentication → Settings → Authorized domains**. A subsequent read of Firebase's public project configuration confirmed both are present:

- `deepfriedpixels.com`
- `www.deepfriedpixels.com`

All existing domain entries remain present. This domain list is separate from Realtime Database rules. The agent's console session could not load project settings, so the owner made the change in regular Edge or Chrome; the configuration was then independently verified through Firebase's public API.

Commit `bd4102a` was published successfully by [GitHub Pages run 38820727538](https://github.com/lucaessey/DFP/actions/runs/38820727538), including its unit tests and production build. The live game and its referenced JavaScript asset returned HTTP 200. The deployed asset contains the new `https://www.deepfriedpixels.com/DFP/` return URL and actionable domain setup message, and does not contain the old `https://lucaessey.github.io/DFP/` return URL.

The remaining owner check is to update the installed PWA through **Settings → Check for updates → Save & update DFP** if it still serves the old build, then request a fresh email from the custom-domain game. Open that new link and, if prompted, confirm `lucaessey@gmail.com`. Verify the address is `www.deepfriedpixels.com/DFP/`, Producer becomes available, and the session survives reload. A real inbox round trip remains unverified; local interception/emulation and public configuration checks do not prove delivery.

Official references: [Firebase email-link authentication](https://firebase.google.com/docs/auth/web/email-link-auth), [Authorized domains for email action return URLs](https://firebase.google.com/docs/auth/web/passing-state-in-email-actions).
