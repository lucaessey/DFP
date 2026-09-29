# Proposal

## Why

Players need a working feedback channel, and the producer needs a private inbox without another hosting service or billing. On September 29 the owner stopped Cloudflare setup and explicitly chose Firebase-only submissions with manual approval.

## What Changes

- Keep People Comments, the 1–500-character form, 1–5-star rating, exact filters, pagination and local drafts.
- Send Producer comments directly to a protected private inbox. Hold every Everyone submission privately until the verified producer approves it.
- Use anonymous Firebase authentication for ordinary players. Enforce validation, quotas, immutable submissions, retry receipts and owner-only moderation in Realtime Database rules.
- Keep Google and email-link sign-in for the verified `lucaessey@gmail.com` owner. Other accounts cannot read private content or publish anything.
- Remove the frontend dependency on a Cloudflare endpoint. Use the existing `dfp-game-e2926` Spark project and no administrative credentials in the game.
- Preserve existing records, game saves, purchases, outfits, floors and offline gameplay.

## Capabilities

### New Capabilities
- `people-comments`: Shared player feedback, private delivery, producer approval, filtering, verified owner access and offline drafts.

### Modified Capabilities
None. Existing game and computer requirements remain preserved.

## Impact

Changes the feedback client, Firebase rules and privacy tests. Retains previous Worker code only as inactive historical implementation; it is neither deployed nor required. The approved manual review replaces automatic language checks. Publish tested Firebase rules and the static game, then distinguish live verification from emulator checks.
