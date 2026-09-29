# Tasks

## 1. Configuration and privacy foundations

- [x] 1.1 Record the exact existing Firebase app, current rules/data and Spark/Auth settings; preserve a rules backup and document any unavailable activation prerequisites.
- [x] 1.2 Implement separate protected collections, bounded star indexes and deny-client-write rules; verify direct allowed/denied reads and writes with the Firebase emulator.

## 2. Trusted moderation backend

- [x] 2.1 Implement strict input validation and conservative language classification shared by both audiences; test appropriate criticism, disguised abuse, rejection and pending fallback.
- [x] 2.2 Implement project-specific token and verified-owner checks, free Worker/Durable Object configuration and server-only Firebase credentials; test anonymous/other/unverified/revoked denial and missing configuration.
- [x] 2.3 Implement atomic indexed publication, private/pending transitions, read/hide/report actions, spam controls and idempotency; test repeated/concurrent submissions and moderation without leaks or re-publication.

## 3. Computer interface and authentication

- [x] 3.1 Add People Comments, exact audience/star filters, bounded pagination, dates/ratings and sticky Add Comment; test desktop/phone navigation and preserved fictional categories.
- [x] 3.2 Add validation, required private acknowledgement, accurate submission states, retry protection and local draft preservation/discard; test offline and rejected/uncertain flows.
- [x] 3.3 Add email-link sign-in/completion, different-device confirmation, cooldown/errors/session preservation and sign-out; test with Auth emulator without consuming production email quota.
- [x] 3.4 Add owner-only Producer views/actions and cancellation/clearing on sign-out/offline; verify a late private response cannot refill the UI.

## 4. Integration and delivery

- [x] 4.1 Verify two independent local sessions see public comments but cannot read each other's private/pending feedback; run unit, rules and browser tests including direct API/database bypass attempts.
- [x] 4.2 Verify existing game saves, computer purchases, offline gameplay, responsive screenshots and production builds; record actual results and limitations.
- [x] 4.3 Deliver matching rules, free-tier setup/rollback instructions and activation checklist; keep live deployment and real owner-email verification explicitly pending until the required account access/secrets/approval are supplied.

## 5. Sign-in and submission repair

- [x] 5.1 Reproduce the disabled flows, inspect deployment/backend configuration, Firebase providers/domain/rules and PWA update behavior; record observed failures.
- [x] 5.2 Remove the unnecessary moderation-service dependency from Firebase email sign-in; verify owner access with protected Firebase reads, restore sessions, support explicit sign-out and preserve private-data boundaries.
- [x] 5.3 Bound authentication/submission waits, retain failed drafts and stable retry IDs, prevent repeated requests, recover loading controls and explain unavailable moderation without claiming success.
- [x] 5.4 Provide a save-preserving PWA update check; verify current and upgraded builds, anonymous/private/public/moderation/retry flows and offline gameplay with isolated tests.
- [ ] 5.5 Verify requesting and completing a real owner email link on the deployed repaired game; requesting was confirmed on the live repaired site, but owner completion and session restoration are still pending.
- [ ] 5.6 Connect an already-authorized trusted backend and verify live public/private submissions across sessions. Do not activate a new service or billing without authorization; leave this unchecked if no authorized backend exists.

## 6. Approved Google sign-in option

- [x] 6.1 Add Google sign-in alongside email links, truthful email delivery/cooldown messages, single-flight and cancellation/error handling.
- [x] 6.2 Update shared owner checks and protected rules to allow only the same verified Google owner; test other/unverified accounts and denied browser writes.
- [x] 6.3 Test popup success/cancellation, session reload, email-link compatibility, phone layout and preserved offline progress.
- [x] 6.4 Enable the approved Google provider in the existing Spark project, publish matching tested rules and deploy the frontend.
- [ ] 6.5 Verify the live Google account flow with the owner; record any user sign-in step still pending separately from emulator results.

## Activation (external prerequisites, not claimed complete)

Production Firebase rules, providers, authorized domain and Spark plan were confirmed; final read-only rule probes passed. Live Worker deployment, server secrets, frontend API connection and a real two-session/owner-email smoke test remain required before this feature can be described as operational. They depend on the Cloudflare setup and credentials explicitly deferred in the request. No paid service is authorized. See PEOPLE_COMMENTS.md for the complete verification and activation record.
