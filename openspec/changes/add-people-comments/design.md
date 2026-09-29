# Design

## Context

DFP is a static Vite/Three.js PWA on GitHub Pages. Game progress is device-local. The existing Firebase project is DFP game / `dfp-game-e2926`, with Anonymous, Google and email-link sign-in enabled on Spark. The earlier backend-dependent version prevented posting while its Worker was unconfigured. The owner explicitly cancelled Cloudflare setup and accepted manual approval on September 29.

## Goals / Non-Goals

Use the existing free Firebase project; protect Producer and pending feedback; permit ordinary players to submit securely; let only the verified owner publish; retain existing game progress and records. No Cloudflare service, service-account credential, billing, automatic language classifier or new game purchase is needed.

## Decisions

1. Retain lazy Firebase Auth and persistent sessions. Google and email-link sign-in accept only the verified owner email with `google.com` or `password` provider. Fresh protected Firebase reads authorize Producer; browser flags never do. Sign-in links are transient and stripped from the address bar. Sign-out/offline/backgrounding clear private views and abort requests.
2. Use Firebase REST with ID tokens, bounded waits, no-store responses and no token logging. Ordinary players finish anonymous authentication before submitting. Public reads remain unauthenticated and bounded. There is no external API URL or automatic moderation dependency.
3. Retain `public`, `private`, `pending`, `ownerPublic` and `internal/records`. Each view retains `all` and exact-star projections, with at most 21 rows fetched for 20-item pages. New submissions atomically create an immutable canonical record, matching private or pending projections, an author-only receipt, and a per-UID quota update. Every Everyone comment starts pending; every Producer comment starts private. Firebase rules validate every field and the cross-linked records, so clients cannot omit the private queue or add public copies.
4. The receipt contains only opaque ID, payload fingerprint, initial status and server timestamp. UID plus request ID determines one canonical ID. A retry reads its existing receipt before writing; lost responses and reloads retain the same request ID. Quotas use server time and enforce 30 seconds between submissions, six per hour and 20 per day per UID. No IP address is collected. Anonymous account cycling can bypass a per-UID quota; avoiding this completely would require additional infrastructure.
5. Canonical creation times use Firebase server timestamps. Sorting keys use the request time plus ID; rules limit clock skew to five minutes, and records/projection keys are immutable. Rule generation explicitly counts surrogate pairs as one character to match the 500-character form limit.
6. Only the verified owner can read individual canonical records or write moderation transitions. Approval atomically publishes a sanitized Everyone projection and removes pending copies. Audience/text/rating/creation details cannot change; Producer feedback cannot become public. Sequential revisions reject stale writes. Read, reject and hide preserve canonical records. Action request IDs make retries safe without replaying an old approval after a hide.
7. Ordinary players may report a published comment once per UID. Reports remain private and appear as a flag in the Producer public view. Reporting does not grant the player permission to hide or republish it; the owner decides whether to hide it.
8. Drafts persist locally with a shared-device warning. Private feedback is only held in memory; the existing service worker caches bundled assets, not Firebase responses. Game state and payment calculations are untouched.

## Risks / Trade-offs

- All Everyone feedback waits for producer review, including appropriate criticism. This is the owner's approved replacement for automatic moderation.
- Per-UID quotas are a modest abuse control, not protection against creating many anonymous accounts. Spark quotas remain finite; no billing is enabled.
- Owner access relies on Firebase-verified tokens and rules; a disabled account's already-issued token may remain valid until token expiry. The UI refreshes tokens for owner reads and writes.
- Email delivery remains unverified. Google sign-in is available; a live owner login still requires the user's account interaction.

## Migration and verification

Publish the tested namespace-scoped rules before the new frontend. Preserve all existing database data and other root rules. Existing comments retain their paths and immutable fields. No Worker deployment or new credential is needed. Verify malicious direct requests with the emulator, then submission/approval across isolated browser profiles, drafts/retries, filtering, saves and offline reload. Record live tests separately. Rollback can restore the previous rules and frontend without deleting data, although the former disconnected version cannot submit comments.
