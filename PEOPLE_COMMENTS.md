# People Comments and Producer

Initial implementation: September 28, 2026 (Pacific). Repair verification: September 29, 2026. See [the repair report](PEOPLE_COMMENTS_REPAIR.md) for current causes, checks and remaining activation work.

**The feature is implemented locally. Shared comments and moderation are not yet live.** Cloudflare is not authenticated on this computer, no Worker has been deployed, and no server credentials have been provisioned. The normal build therefore displays an honest connection/setup message, preserves drafts, and does not accept unconfirmed posts. No paid service or billing upgrade was enabled.

## What changed

The existing paid Email app now includes People Comments beside the 40 fictional reviews. Public comments have dates, exact 1–5-star filters and 20-comment pages. The footer keeps Add Comment accessible while scrolling. The form validates 500 Unicode characters, rating and audience, displays the requested privacy wording, and requires acknowledgement for Producer feedback. Drafts stay on the device until sent or explicitly discarded.

The fourth computer app, Producer, appears only after Firebase authentication and a fresh Firebase token and a protected, bounded Realtime Database read for verified `lucaessey@gmail.com`. It separates private feedback, public comments and pending moderation, with star filters, mark-read, approve, reject and hide actions. Sign-in is also available in Settings, without buying the basement. Public and private inbox reads work independently of the moderation API; write actions require the connected trusted service. Private approval retains the original audience. Public reports move comments into private review. Signing out, losing authorization, going offline or backgrounding clears private views; late responses cannot refill them.

Game simulation, save schema, purchases, earnings, outfits, employees, security minigame and fictional messages are unchanged. No private inbox data is placed in local storage or the PWA cache. Firebase manages authentication persistence; only an unfinished comment draft is stored by this feature. The interface warns about private drafts on shared devices and provides Discard draft.

## Existing Firebase project: configured

The configuration was read from **DFP game**, project **dfp-game-e2926**, web app `1:531541340277:web:86f49995e07b03db47c83c`.

- Database: `https://dfp-game-e2926-default-rtdb.firebaseio.com/`.
- Console showed **Spark, No-cost ($0/month)**; that plan was preserved.
- Published rules originally denied all root reads/writes. The inspected database was empty. The original rules are retained in `firebase/published-rules-before.json`.
- Anonymous authentication and Email/Password with email-link sign-in were enabled and saved. On September 29 the owner approved adding Google sign-in; that provider was enabled with the DFP public name and owner support email, preserving Spark.
- `lucaessey.github.io` was added to authorized domains, preserving existing domains. The production return URL is `https://lucaessey.github.io/DFP/`.
- The tested `firebase/database.rules.json` was published and updated to accept the same verified owner through Google or email links. No production submissions or test accounts were created. One production sign-in email was requested during the earlier repair; Firebase accepted it, but the owner reports no delivery.

The Firebase web configuration and API key in `src/people/config.js` are public app identifiers. They are not privileged service credentials. Rules and backend authorization enforce the exact verified owner email and `password` or `google.com` provider. Google sign-in uses the SDK popup with default identity scopes only, without sending email or requesting Gmail access. Firebase requires the email/password provider plus the email-link option for email links. Spark currently permits five email-link sign-in emails daily; the interface reserves a five-minute resend cooldown even after a send timeout. A cooldown is not a delivery countdown; only a confirmed Firebase response produces an accepted-request message. [Google sign-in guidance](https://firebase.google.com/docs/auth/web/google-signin), [Firebase email-link guidance](https://firebase.google.com/docs/auth/web/email-link-auth), [Authentication limits](https://firebase.google.com/docs/auth/limits).

## Storage and authority

All feedback lives under `/peopleComments`:

| Location | Contents and access |
| --- | --- |
| `public/all` and `public/1`–`5` | Published Everyone projections: opaque ID, text, rating, posting timestamp only. Bounded public reads. |
| `private/all` and `private/1`–`5` | Producer feedback, owner-only bounded reads. |
| `pending/all` and `pending/1`–`5` | Uncertain/reported feedback, owner-only bounded reads. |
| `ownerPublic/all` and `ownerPublic/1`–`5` | Public comments with revision metadata for owner actions; owner-only. |
| `internal/records` | Canonical content, author UID, idempotency hashes and action history; server-only. |

Browser writes are denied, including the owner's. The Worker verifies signed Firebase tokens for the exact project. Owner requests also verify the current account's email, verification, disabled and revoked-session status. Ordinary tokens cannot gain privileges through request fields or a browser role flag.

One SQLite Durable Object serializes mutations and stores rolling UID/IP quotas. IPs are HMAC hashed; raw addresses are not stored. Limits are six submissions/hour and 20/day per UID, 25/hour and 80/day per IP, with a 30-second UID cooldown. Reports have separate limits. JSON bodies are capped at 8 KiB. Client request IDs bind to both author and payload.

Each accepted mutation atomically updates its canonical record and reader projections. The privileged REST client applies a limited-privilege server identity, so database rules still validate sequential revisions and immutable content, audience and timestamp. A late duplicate create or approval is rejected atomically, including its public projections. A retry after a timeout checks the existing canonical record. This uses Firebase's documented limited-privilege model and the REST override used by its official Admin SDK. [Limited privileges](https://firebase.google.com/docs/database/admin/start#authenticate-with-limited-privileges), [official REST SDK implementation](https://github.com/firebase/firebase-admin-python/blob/master/firebase_admin/db.py).

The language check runs on the server for both audiences. It normalizes common substitutions and rejects recognized profanity, slurs, harassment, threats and sexual abuse. Ordinary criticism and low ratings can pass. Unknown language, unsupported wording or classifier failures remain private pending review. This conservative English ruleset has false positives and cannot detect every abusive meaning; it is not an AI moderation service or a complete safety guarantee. Public reporting and Producer review provide follow-up moderation.

## Remaining activation steps — requires account access and approval

These are conditional instructions for the already-prepared implementation, not approval to create a new service. First connect an existing authorized backend if one exists. If none exists, obtain explicit approval before any Cloudflare deployment or service-account provisioning. Firebase sign-in and protected inbox reading do not require these steps.

1. Confirm a Cloudflare account on **Workers Free**, authenticate Wrangler to that account, and approve deploying this feature. No Cloudflare account was created and no terms were accepted during implementation. The configuration uses a SQLite Durable Object, which is available on Free. Exceeding free quotas can make the service unavailable; do not upgrade plans automatically. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
2. Provision a dedicated service account in **dfp-game-e2926** with the Firebase Realtime Database Admin product role (`roles/firebasedatabase.admin`), rather than project-wide Editor/Owner access. Store its JSON key securely outside this repository. This key is privileged; do not paste it into chat, frontend code, GitHub variables or logs. [Firebase product roles](https://firebase.google.com/docs/projects/iam/roles-predefined-product).
3. After deployment approval, deploy `worker/wrangler.jsonc` to the confirmed Free account. Without secrets, all application requests fail closed. Set `FIREBASE_SERVICE_ACCOUNT` to the service-account JSON and `IP_HASH_SECRET` to at least 32 cryptographically random bytes using Cloudflare encrypted Worker secrets. The latter protects stored IP hashes. No Auth administration role is needed: account lookup uses the caller's ID token.

   ```powershell
   npx wrangler login
   npx wrangler whoami
   npx wrangler deploy --config worker/wrangler.jsonc
   # Supply each value through Wrangler's private input, never as a command argument.
   npx wrangler secret put FIREBASE_SERVICE_ACCOUNT --config worker/wrangler.jsonc
   npx wrangler secret put IP_HASH_SECRET --config worker/wrangler.jsonc
   ```

   For multiline service-account JSON, pipe the secured file directly to `wrangler secret put` without printing it. Keep request logging off. The supplied Worker configuration contains only public settings and allows the production origin `https://lucaessey.github.io`.
4. Verify `GET /comments?stars=all` returns a bounded feed from the production database, unauthorized owner requests fail, and browser preflight succeeds from the actual game origin. `/health` is a configuration check, not proof of Firebase permissions or email delivery.
5. Set the GitHub repository Actions variable **DFP_COMMENTS_API_URL** to the deployed HTTPS Worker origin, without a trailing path, then run the Pages workflow. Its build maps this to `VITE_COMMENTS_API_URL`. For local development, use an ignored `.env.local` with `VITE_COMMENTS_API_URL`; add only the needed localhost origin to the Worker's allowlist. Never put service credentials in `VITE_` variables.
6. With the owner present, send one real sign-in email and verify completion at the HTTPS `/DFP/` URL, different-device confirmation, Producer access and sign-out. Run a real two-session public/private submission check, approval/report/hide and reload checks. Keep test feedback clearly labelled and remove it only with authorization. **These production end-to-end checks are pending.**

## Local verification and reproduction

Use Node 24 and Java 21 for the Firebase emulators. `npm ci` installs the pinned dependencies. Every automated integration session uses an isolated browser profile and the **demo-dfp-comments** emulator project, never production saves or real email quota.

In separate terminals:

```powershell
npm run comments:emulators
npm run comments:local-api
```

The API runs at `127.0.0.1:8787`, Auth at `9099`, and Database at `9000`. The local API's unsigned-token support is confined to `tests/people-local-server.mjs`; production verifies RS256 signatures and never imports the test harness.

Build and serve the isolated comments test frontend:

```powershell
$env:VITE_COMMENTS_API_URL='http://127.0.0.1:8787'
npm run build -- --mode test-comments --outDir artifacts/people-comments/build
Remove-Item Env:VITE_COMMENTS_API_URL
npx vite preview --configLoader native --outDir artifacts/people-comments/build --host 127.0.0.1 --port 4186 --strictPort
```

Only `test-comments` mode on a loopback hostname enables Auth emulator configuration. Normal and GitHub Pages builds always use the real public project configuration.

```powershell
npm test
npm run test:comments:rules
npm run test:comments:browser
npm run test:comments:auth
npm run comments:worker:check
npm run spec:comments
```

The comments browser suite resets its disposable emulator feedback and writes pagination fixtures through the same service. Do not point it at a production database. Restart the local API between repeated suites to reset test-only rate-limit memory. Production quotas persist in Durable Object storage.

## Initial implementation results (September 28)

| Verification | Result |
| --- | --- |
| Unit suite | 127 passed, including 12 feedback/security cases and existing economy, navigation, animation and save tests. |
| Firebase emulator rules | 8 passed: public/private boundaries, owner checks, denied direct writes, bounded queries, late duplicate creates and stale approval rejection. |
| Comments browser integration | 12 passed: two independent sessions, privacy acknowledgement, exact filters, rejection/pending/publication, email-link owner flow, private approval, reporting/hiding, 20/20/5 pagination, offline draft/save persistence, sign-out and late-response cancellation, reused-link rejection. |
| Auth failure browser checks | 3 passed: quota failure, persistent cooldown, invalid/expired link and address-bar cleanup. |
| Existing computer browser suite | 12 passed, including all 40 fictional messages, purchases, saved ownership, responsive controls and offline behavior. |
| Existing gameplay browser suite | 18 passed, including complete jobs across four floors, employees, outfits, touch controls, offline reload and service-worker update without progress loss. |
| GitHub Pages path browser suite | 5 passed: `/DFP/` assets, manifest/worker scope, earning/table purchase, offline reload and phone controls. |
| Production builds / Worker dry run | Root and `/DFP/` builds passed; Worker bundle 76.04 KiB (21.80 KiB gzip). Existing main-chunk size advisory remains. |
| Production configuration | Spark, providers, authorized domain and published rules confirmed in Firebase console. Six read-only live rule probes passed; no real feedback/email tests performed. |
| Production dependency audit | Zero reported production vulnerabilities at implementation time. |

Phone, landscape, private-form and Producer screenshots plus the browser report are in `artifacts/people-comments/` (local, ignored). Screenshots contain emulator fixtures, not actual player submissions. The normal game remains available at `http://localhost:8080/` when its development server is running.

## Rollback

Clear `DFP_COMMENTS_API_URL`, rebuild/redeploy the game, and restore the backed-up Firebase rules if disabling all online feedback is desired. Disable the Worker route/deployment and revoke the dedicated service-account key when no longer needed. Preserve stored submissions for authorized review; do not delete them as part of rollback. Local game balances, purchases and saves need no migration or rollback.
