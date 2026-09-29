# Producer sign-in and comment submission repair

September 29, 2026. Project: **DFP game / dfp-game-e2926**. Database: `https://dfp-game-e2926-default-rtdb.firebaseio.com/`. Producer: `lucaessey@gmail.com`.

## Actual causes

**Producer sign-in:** the frontend disabled the email button, owner verification, and session restoration whenever `VITE_COMMENTS_API_URL` was missing. Firebase email authentication does not require that moderation API. The deployed Pages workflow reads repository variable `DFP_COMMENTS_API_URL`; the repository variable list was empty. An isolated reproduction of the pre-repair production build showed a disabled sign-in button and no authentication request, network failure, or JavaScript exception. This was an application gate, not an observed rejected Firebase email request.

**Comments:** the trusted submission/moderation backend was prepared but never connected. The same production build disabled Submit before making any request. The repository contains the existing Worker implementation, but Wrangler is not authenticated and no backend address is configured. No existing deployed backend address has been supplied in response to the clarification request. Changing database permissions or approving text in the browser would bypass required moderation; neither is a valid repair.

**PWA:** the isolated pre-repair profile had an active worker and no waiting update. There is no evidence that a stale worker caused those two disabled buttons. The user's installed profile has not been independently inspected for its cached version. The repair adds an explicit, save-preserving update check.

## Completed code repairs

- Request and complete Firebase email links without depending on the moderation API. Settings provides sign-in even on a device without basement purchases. The production return address remains `https://lucaessey.github.io/DFP/`.
- Check the real Firebase identity and perform a bounded, protected database read before showing Producer. Every private read refreshes the Firebase token; rules require the verified owner email and password/email-link provider. Local role flags never authorize access. Sessions restore after reload; sign-out clears private views and late responses cannot refill them.
- Read public and protected inbox projections directly from Firebase with matching exact-star indexes and shared pagination. All browser writes remain denied. The trusted backend still exclusively performs submission, moderation, reporting and read-marker writes; unavailable actions are visibly disabled.
- Limit waits across authentication, network requests and response parsing. Preserve text and the request ID after failures; allow retry without duplicate publication. Prevent overlapping email requests, reserve the resend cooldown before sending, handle quota/expired-link errors, and show success only after a recognized service receipt.
- Add **Settings → Check for updates → Save & update DFP**. Worker update checks bypass HTTP caches, detect waiting versions, and save before activation/reload. No saved balances, purchases, drafts or authentication storage are cleared.

## Firebase configuration checked

The existing Firebase console was inspected during the repair. Anonymous sign-in, Email/Password and its passwordless email-link option are enabled. Authorized domains include `lucaessey.github.io`, `localhost`, and the project's Firebase domains. The console still shows **Spark — No-cost ($0/month)**. No billing or provider changes were made.

The published Realtime Database rules were re-opened and match `firebase/database.rules.json`. They use `public`, `private`, `pending`, `ownerPublic` and server-only `internal` projections, not the old Real/Funny labels. Form audiences remain `everyone` and `producer`. No rules change was necessary. An earlier console inspection was temporarily blocked by automatic approval review's usage limit; the same read-only inspection later succeeded.

Six fresh, read-only production HTTP probes returned:

| Request without authentication | HTTP result |
| --- | --- |
| Bounded `public/all`, ordered by key, limit 21 | 200 |
| Bounded `private/all` | 401 denied |
| Bounded `pending/all` | 401 denied |
| Bounded `ownerPublic/all` | 401 denied |
| `internal` | 401 denied |
| Unbounded `public/all` | 401 denied |

No production feedback was created, no real sign-in email was sent during local verification, and no test credentials were written to production.

## Verification

All local integration profiles use the disposable **demo-dfp-comments** Auth/Database emulators, not the user's game saves or production email quota.

| Check | Result |
| --- | --- |
| Unit tests | 131 passed, including timeout/body parsing/cancellation tests and existing gameplay/save/security tests |
| Database rules | 8 passed: protected reads, denied client writes, exact-star bounded queries, duplicate creation and stale moderation protection |
| Comments browser suite | 12 passed: two independent sessions, public/private submission, criticism, rejection, pending approval, rating filters, reporting/hiding, pagination, offline drafts and late-response clearing |
| Auth errors browser suite | 4 passed: sending limits, persistent cooldown, expired/reused link rejection and malformed-link recovery |
| Repair browser suite | 9 passed: no-backend sign-in, confirmed single email request, different-device completion, session restoration/sign-out, saved drafts, denied ordinary private reads, anonymous-auth failure recovery, lost-response deduplication, timeout/invalid-receipt recovery |
| Existing gameplay browser suite | 18 passed, including complete jobs on four floors, employees/outfits, touch, offline reload and the new manual update check preserving progress |
| Existing computer browser suite | 12 passed, including purchases, 40 fictional messages, saved ownership and offline behavior |
| Pages-path browser suite | 5 passed: /DFP/ rendering, worker/manifest scope, paid order/table purchase, offline reload and phone controls |
| Build and documentation | Root and /DFP/ production builds, existing Worker dry run (no deployment), strict OpenSpec validation and diff whitespace checks passed; existing large-main-chunk advisory remains |

The repair suite saves a phone screenshot of the protected inbox with its unavailable-service notice. Evidence files are local ignored artifacts under `artifacts/people-repair/` and `artifacts/people-comments/`; screenshots use emulator fixtures only.

Reproduce the normal comments tests using [PEOPLE_COMMENTS.md](PEOPLE_COMMENTS.md). For the missing-backend regression, also build `test-comments` mode with `VITE_COMMENTS_API_URL` empty into `artifacts/people-repair/no-api`, serve it at `127.0.0.1:4187`, and run `npm run test:comments:repair`. The configured test build remains at port 4186 and local API at 8787. Tests use isolated browser profiles and real emulator authentication/rules. Restart the local API between repeated complete suites to reset test quotas.

## Remaining setup and live verification

**Live submissions and moderation are still unavailable.** Supply the HTTPS address of an already-authorized backend that implements the existing `worker/api.js` contract and trusted moderation. Verify its exact Firebase project, secrets, origin allowlist and `/health` configuration; health alone is not proof of permissions. Set GitHub repository **Settings → Secrets and variables → Actions → Variables → DFP_COMMENTS_API_URL** to its HTTPS origin, then rebuild through the Pages workflow. Never put administrative credentials in that variable or any `VITE_` setting.

If no backend exists, the prepared Worker requires separate deployment authorization and server credentials. No new Cloudflare service, service account or billing has been activated. Conditional setup instructions remain in [PEOPLE_COMMENTS.md](PEOPLE_COMMENTS.md); they are not a claim of deployment or approval. Without a trusted backend, publication remains blocked and drafts stay local.

After the repaired frontend deploys, the owner must complete a real email link on `https://lucaessey.github.io/DFP/` to verify delivery and the production session. If it opens in another browser, confirm the same owner email in the game. Expired/reused links require a new request. Do not send sign-in links or codes through chat. Firebase's free email-link quota is five per day, so avoid repeated real test sends.

After backend activation, complete a real two-browser public/private posting, exact-rating filtering and moderation test, plus direct denial checks with an ordinary production token. These live checks remain unchecked in OpenSpec; successful emulator checks do not establish live operation.

If configuration is changed later, the matching Firebase console settings are: **Authentication → Sign-in method → Anonymous: enabled; Email/Password: enabled; Email link: enabled; Authentication → Settings → Authorized domains: lucaessey.github.io**. The client must retain `handleCodeInApp: true` and the HTTPS `/DFP/` return URL. Keep the repository's complete `firebase/database.rules.json`; never replace it with public-write starter rules. Official references: [Firebase email-link auth](https://firebase.google.com/docs/auth/web/email-link-auth), [Auth limits](https://firebase.google.com/docs/auth/limits), [protected REST authentication](https://firebase.google.com/docs/database/rest/auth).
