# Proposal

## Why

DFP's purchased Email inbox currently contains only 40 fictional reviews. Players need a separate shared feedback channel and the producer needs a genuinely private, authenticated moderation inbox without changing gameplay or requiring paid services.

## What Changes

- Add paginated People Comments beside the fictional categories, exact star filters, public/private audience explanations, a validated 500-character form and recoverable local drafts.
- Add discreet Firebase email-link sign-in and a fourth Producer app visible only after the verified owner is authorized online. Support private feedback, moderation, read status, hiding public comments and reports.
- Use the existing DFP game Firebase project `dfp-game-e2926`, Spark only. Isolate public, private, pending and internal data; deny direct client publication.
- Prepare a free Cloudflare Worker with trusted language checks, Firebase token validation, spam controls and retry-safe actions. Keep activation explicit until the backend is deployed and verified.
- Preserve computer purchases, fictional reviews, local saves, offline gameplay and all existing economy rules.
- Repair the deployed sign-in dependency on an unconfigured moderation endpoint: Firebase email authentication and protected read-only inbox access must work independently, while all publication/moderation writes still require an authorized trusted service. Improve timeout/retry feedback and save-preserving PWA update checks.

## Capabilities

### New Capabilities
- `people-comments`: Public player reviews, submission privacy, pagination, filtering, moderation, owner access and offline behavior.

### Modified Capabilities
None. Main specs have not been archived from `build-dfp-game`; its existing basement-computer requirements remain preserved.

## Impact

Touches the computer UI and startup email-link handling, adds Firebase Auth, a Worker backend and database rules, and introduces emulator/backend/browser privacy tests. No game-save migration or new purchase is required. Cloudflare account access, server secrets and deployment remain activation steps unless separately available and approved. Existing Firebase rules and data must be inspected and preserved before replacing legacy access rules.
