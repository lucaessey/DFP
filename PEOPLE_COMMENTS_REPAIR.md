# Current manual-review update (September 29)

The owner cancelled Cloudflare setup and approved Firebase-only manual review. The former activation instructions and historical statements below are superseded by [PEOPLE_COMMENTS.md](PEOPLE_COMMENTS.md). No Cloudflare service, service-account credential or billing was activated.

The new client sends Producer feedback privately and queues every Everyone comment for the verified owner's approval. Firebase rules enforce authorization, validation, immutable content/audience, atomic projections, rate limits and retry receipts. The unconfigured external API gate is removed. Current local verification: 131 unit tests, 13 rules checks, 11 browser checks, seven Google checks and four email-error checks passed. The matching Firebase rules are published and verified; six read-only live permission checks passed. The static game was published from `09b73f7` in successful Pages run `36643489658`. Its installed update retained the live browser's $120 balance and restored the existing verified producer session, confirmed by the protected-read-gated Open Producer button. Production test submissions await explicit approval after automatic review blocked creating test accounts/comments; a fresh real owner sign-in round trip remains distinct from verified session restoration.

## Historical repair and setup record

# Producer sign-in and comment submission repair

September 29, 2026. Project: **DFP game / dfp-game-e2926**. Database: `https://dfp-game-e2926-default-rtdb.firebaseio.com/`. Producer: `lucaessey@gmail.com`.

## Approved comments activation (September 29)

The owner approved deploying the prepared service on Workers Free and connecting the existing Spark Firebase project. A fresh build-only Worker check passed; the GitHub comments-service variable is still absent, so posting correctly remains disabled. Cloudflare is signed in in the browser, and Wrangler's authorization screen requests only user/account read, Worker scripts write and background refresh access. Authorization has been handed to the owner. The first request expired before its return step; a fresh request was opened. Google Cloud also requires first-use terms review. Automatic approval review initially blocked creating a dedicated comments service account. The owner then explicitly approved only Firebase Realtime Database Admin access for that identity, conditional on no payment. [IAM administration is free](https://cloud.google.com/iam/pricing), and [Spark database usage is not billed](https://firebase.google.com/docs/database/usage/billing); stop if setup asks for billing. No account, credential, Worker or billing change has been created during this activation attempt. Production posting checks remain pending.

## Google sign-in follow-up (September 29)

The owner reported no email arrival even though Firebase accepted the request. **“Resend in 5 minutes” is a client request limit, not a delivery countdown.** The correct public API key/project and authorized production domain were checked again; the actual cause of missing delivery is not established. No further production email requests were sent in this follow-up.

The owner explicitly approved Google sign-in alongside email links. The new button uses Firebase's Google popup, the existing project and only default identity scopes. Google sign-in does not send an email or request Gmail access. Other accounts are denied and signed out of the attempted Producer flow. The UI handles cancelled/blocked popups, prevents overlapping attempts, and restores the verified session after reload. Firebase acceptance is now described separately from confirmed email delivery.

The Google provider was enabled in **DFP game**, with public name **DFP — Deep Fried Pixels** and the owner support email. The console still shows **Spark — No-cost**. Published database rules retain denied browser writes and permit protected reads only for the exact verified owner through `password` or `google.com`. Matching shared checks protect the prepared backend too; no backend deployment or billing change was made.

Current follow-up verification: **131 unit tests, 9 rules checks, 12 existing comments browser checks, 4 email error checks and 7 new Google browser checks passed.** The Google suite covers cancellation/retry, wrong-account denial, owner popup completion while email resend is locked, protected reads without a moderation API, restored session/purchases/balance, persistent sign-out, portrait/landscape fit, offline reload and blocked-popup help. Tests use disposable Auth/Database emulators. The emulator's optional remote styles are excluded from this suite, while Firebase's real popup SDK script must remain reachable. Evidence: `artifacts/people-google/report.json`, `google-verified-phone.png` and `google-signin-landscape.png`.

To reproduce Google checks, run the Auth/Database emulators and the missing-backend test build on port 4187 as described below, then `npm run test:comments:google`. Email-link compatibility is covered by the existing suite on port 4186. Strict OpenSpec validation and both production builds passed.

Google sign-in was published from commit `935f2ca` ([successful Pages deployment](https://github.com/lucaessey/DFP/actions/runs/36635745720)). The live game activated the update through **Settings → Check for updates → Save & update DFP**, retained its $120 balance and displayed the new Google button. Published rule probes still return 200 for the bounded public feed and 401 for unauthenticated private, pending, owner-public and internal data. The real Google flow was started and handed to the owner to finish; production owner completion/session restoration is not yet claimed. In a browser that blocks the popup or embedded sign-in, open the same game in Chrome, Edge or Safari and allow its sign-in window. Keep saved browser data intact.

The following sections record the earlier repair. Comment submission remains blocked until an authorized trusted moderation backend is connected; adding Google does not publish unchecked comments.

## Actual causes

**Producer sign-in:** the frontend disabled the email button, owner verification, and session restoration whenever `VITE_COMMENTS_API_URL` was missing. Firebase email authentication does not require that moderation API. The deployed Pages workflow reads repository variable `DFP_COMMENTS_API_URL`; the repository variable list was empty. An isolated reproduction of the pre-repair production build showed a disabled sign-in button and no authentication request, network failure, or JavaScript exception. This was an application gate, not an observed rejected Firebase email request.

**Comments:** the trusted submission/moderation backend was prepared but never connected. The same production build disabled Submit before making any request. The repository contains the existing Worker implementation, but Wrangler is not authenticated and no backend address is configured. No existing deployed backend address has been supplied in response to the clarification request. Changing database permissions or approving text in the browser would bypass required moderation; neither is a valid repair.

**PWA:** the isolated pre-repair profile had an active worker and no waiting update. There is no evidence that a stale worker caused those two disabled buttons. The user's installed profile has not been independently inspected for its cached version. The repair adds an explicit, save-preserving update check.

## Completed code repairs

- Request and complete Firebase email links without depending on the moderation API. Settings provides sign-in even on a device without basement purchases. The production return address remains `https://lucaessey.github.io/DFP/`.
- Check the real Firebase identity and perform a bounded, protected database read before showing Producer. Every private read refreshes the Firebase token; rules require the verified owner email and an approved sign-in provider (originally email links, now also Google). Local role flags never authorize access. Sessions restore after reload; sign-out clears private views and late responses cannot refill them.
- Read public and protected inbox projections directly from Firebase with matching exact-star indexes and shared pagination. All browser writes remain denied. The trusted backend still exclusively performs submission, moderation, reporting and read-marker writes; unavailable actions are visibly disabled.
- Limit waits across authentication, network requests and response parsing. Preserve text and the request ID after failures; allow retry without duplicate publication. Prevent overlapping email requests, reserve the resend cooldown before sending, handle quota/expired-link errors, and show success only after a recognized service receipt.
- Add **Settings → Check for updates → Save & update DFP**. Worker update checks bypass HTTP caches, detect waiting versions, and save before activation/reload. No saved balances, purchases, drafts or authentication storage are cleared.

## Firebase configuration checked

The existing Firebase console was inspected during the initial repair. Anonymous sign-in, Email/Password and its passwordless email-link option are enabled. Authorized domains include `lucaessey.github.io`, `localhost`, and the project's Firebase domains. The console showed **Spark — No-cost ($0/month)**. That initial repair made no provider changes; the separately approved Google addition is recorded above.

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

No production feedback was created and no test credentials were written to production. After publishing the repair, one real sign-in email was requested through the deployed game; Firebase confirmed sending it. The owner has been asked to complete the link, so delivery/completion and live session restoration remain unverified.

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

The repaired frontend was deployed successfully by GitHub Pages from commit `d454a40` ([deployment run](https://github.com/lucaessey/DFP/actions/runs/36632491620)). The live browser activated its waiting update through Save & update, retained its $120 balance, displayed the new Settings sign-in entry, and confirmed one email send with the resend button disabled. The owner must complete that real email link on `https://lucaessey.github.io/DFP/` to verify delivery and the production session. If it opens in another browser, confirm the same owner email in the game. Expired/reused links require a new request. Do not send sign-in links or codes through chat. Firebase's free email-link quota is five per day, so avoid repeated real test sends.

After backend activation, complete a real two-browser public/private posting, exact-rating filtering and moderation test, plus direct denial checks with an ordinary production token. These live checks remain unchecked in OpenSpec; successful emulator checks do not establish live operation.

If configuration is changed later, the matching Firebase console settings are: **Authentication → Sign-in method → Anonymous: enabled; Email/Password: enabled; Email link: enabled; Authentication → Settings → Authorized domains: lucaessey.github.io**. The client must retain `handleCodeInApp: true` and the HTTPS `/DFP/` return URL. Keep the repository's complete `firebase/database.rules.json`; never replace it with public-write starter rules. Official references: [Firebase email-link auth](https://firebase.google.com/docs/auth/web/email-link-auth), [Auth limits](https://firebase.google.com/docs/auth/limits), [protected REST authentication](https://firebase.google.com/docs/database/rest/auth).
