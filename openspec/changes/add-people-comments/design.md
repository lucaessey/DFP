# Design

## Context

DFP is a Vite/Three.js static PWA on `https://lucaessey.github.io/DFP/`. Game progress is device-local, schema six. ComputerView renders local fictional email and never handles network feedback. Initial Firebase console inspection confirmed DFP game / `dfp-game-e2926`, existing DFP web app `1:531541340277:web:86f49995e07b03db47c83c`, and root rules denying reads and writes. The namespace rules added by the initial implementation were re-inspected September 29 and match the repository. No moderation backend address is configured in the Pages build. See proposal.md for motivation.

## Goals / Non-Goals

Goals: independently protect each audience; fail closed; keep transactions repeatable; bound feed downloads; preserve offline game assets and saves; use Spark and Workers Free only.

Non-goals: cloud game saves, display names, public profiles, public rating totals, paid moderation APIs, or a guarantee that language filtering catches every abuse.

## Decisions

1. Bundle modular Firebase Auth, lazy-load the Auth SDK, retain public app configuration only. Use the existing project, anonymous submissions and persistent Firebase owner sessions. Email-link return URL is the deployed HTTPS `/DFP/` page. Capture and remove one-time codes from the address bar early; never log them or put them into persistent app storage. Different-device completion requires typed owner-email confirmation. The Worker verifies signed project-specific tokens; owner endpoints additionally check verified email against the current Firebase account, disabled/revoked status and email-link/password provider. Merely typing an email or reading a local role flag is insufficient.
2. Use a Worker API for trusted submission/moderation, and RTDB REST for storage. A single SQLite-backed Durable Object serializes mutations and persists rate limits. This is available on Workers Free; it avoids concurrent publish/hide races and unbounded root transactions. Firebase multi-location updates atomically update a canonical internal record and sanitized read projections. The server uses a limited-privilege auth override so database rules enforce successive canonical revisions and immutable content/audience/time. Even a timed-out write arriving late cannot create a second feed key or overwrite a subsequent hide. Idempotency keys bind to uid and payload digest. Retrying a completed operation returns its result; approving private feedback never writes a public projection.
3. Under `/peopleComments`, separate `public`, `private`, `pending` and `internal`. Each reader-facing view has `all` and `1`–`5` keyed collections ordered by server-generated time plus opaque ID. Fetch at most 21 rows for 20-row pages using key cursors. Public projections contain only opaque ID, text, rating and server timestamp. Private and pending data require the verified owner in rules and backend. Browser writes are denied everywhere. Existing unrelated data and deny rules are preserved. No public text search or aggregate is added.
4. Normalize Unicode, common substitutions and separated-letter disguises server-side. Reject clear profanity/slurs/threats/sexual abuse; send ambiguous, unsupported or otherwise uncertain language to private review. Use a conservative vocabulary for automatic approval of ordinary game feedback, including criticism and low ratings. Failures queue privately, never publish unchecked. Both audiences use identical checks. Reports hold public content for producer review and are retry safe. UI clearly states filtering has limitations.
5. Anonymous UID and HMAC-hashed IP quotas plus a submission cooldown bound spam without storing raw IPs. Body size, rating, audience, acknowledgement and request IDs are validated server-side. Rate-limit metadata has bounded rolling windows. Secrets stay in Worker secrets. No browser path bypasses moderation.
6. Comments UI is separate from simulation. A sticky Add Comment footer remains outside scrolling results; audience and star selectors reset cursors. Submitted text is rendered with textContent/escaping. Only an unfinished draft is persisted locally, with an explicit shared-device note and discard action. Public feed caching, if used, is sanitized and marked stale; private records remain in memory only, are fetched with no-store, and are cleared on sign-out, loss of authorization, offline or backgrounding. No private subscriptions survive closure. Existing PWA only caches bundled assets and ignores cross-origin API responses.

## Risks / Trade-offs

- Rule-based English filtering has false positives and misses → conservative pending state, visible limitation, public report control, producer review; do not promise complete detection.
- A small single mutation coordinator limits throughput → appropriate for a free small game, bounded requests and explicit quotas; scaling is outside this change.
- Spark has five email-link sends/day → five-minute resend cooldown, preserve valid sessions, explanatory errors; emulator tests do not consume real emails.
- Cloudflare setup/secrets are unconfirmed → disabled online service state until configured; complete local verification first and document activation steps.
- Same-origin third-party games share the GitHub Pages host → no privileged credentials in frontend; Firebase rules/backend remain authoritative. Private text is never intentionally cached.

## Migration Plan

Back up inspected published rules. Validate local rules with the Firebase emulator before publishing a namespace-only rules addition. Preserve all pre-existing data; do not import old Real/Funny content or expose it. Confirm anonymous/email-link providers and authorized domain. Deploy the Worker on a confirmed Free account with least-privilege Firebase service credentials in secrets; configure its HTTPS URL in the frontend. Run two-session live public/private and real owner-link smoke checks before describing the feature as active. Rollback disables the frontend API URL and restores backed-up rules without deleting stored submissions or local game saves.

## Repair decisions

The repair rechecks live configuration rather than treating earlier local tests as activation. Email-link requests and session restoration use Firebase directly, independently of `VITE_COMMENTS_API_URL`. When the moderation endpoint is absent, fresh Firebase authentication plus a protected bounded database read authorizes the Producer app; its read-only inboxes use the existing owner-only rules. No client publication or moderation writes are introduced. The UI explains that submission/actions require a connected trusted service. It does not infer receipt from a browser-only language check.

Bound the whole network operation, including SDK authentication and response parsing, and preserve one in-flight operation and stable idempotency key across retries. A timeout cannot permit a late authentication callback to restore a signed-out private view. Keep sign-in link tokens transient and out of logs. Add a visible PWA update check that saves before activation/reload and does not clear storage or caches containing game progress.

## Open Questions

An existing authorized backend URL has been requested but not supplied. The Cloudflare account and deployment approval, and the server-side service credential provision, remain activation prerequisites explicitly deferred by the user. Live email delivery must be verified with the owner when ready.
