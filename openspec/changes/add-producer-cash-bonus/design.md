# Design

## Context

Producer authentication and comments already use the Spark RTDB project directly with protected rules. Game money is local and saves are single-tab locked. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:** Protect claim eligibility with server time, preserve payment receipts through failures and keep the UI usable on phones.

**Non-Goals:** Cloud saves, anti-tamper protection for arbitrary edits to local game money, new hosting, billing or automatic payouts.

## Decisions

- Add `producerRewards/limit` plus immutable `producerRewards/receipts/<requestId>`. An atomic update creates a receipt and advances the limit together. Rules require the same existing verified owner claim predicate, exact $1,000, server timestamps, and 300,000 ms since the previous claim. Local-only timers were rejected because reloads and devices would bypass them.
- Persist a pending request ID before networking and apply its confirmed receipt together with the saved balance. A failed save rolls back the in-memory grant while retaining the pending ID. Retry reads the immutable receipt first. Existing single-tab game locks remain in force.
- Add an optional, validated `producerBonus` object to version-12 saves and populate it on migration. This is additive; old clients preserve unknown save fields. No balance conversion or other progression migration occurs.
- A small producer card owns the countdown and refresh/retry state. Authentication is checked again after asynchronous work; leaving the view or signing out never produces an unauthorized payment. Pending recovery requires a verified owner returning to the app. Countdown display uses device time as an estimate; Firebase remains authoritative if a clock is changed.

## Risks / Trade-offs

- Network or save interruption → persist the request before sending; server receipts are immutable and retries are idempotent.
- Claim succeeds on another device → the server-wide limit blocks a second claim; the reward belongs to the local save initiating that request.
- Local save export/restore or manual tampering → local balances are not a server-authoritative economy. This feature does not claim to prevent arbitrary save edits or copied saves.
- Production rules must be updated → test in the emulator first, preserve existing comment rules, and record whether deployment was verified.

## Migration Plan

Deploy the additive rules before releasing the client. The old game ignores the new path. Reverting the client preserves receipt data; do not delete the server cooldown or receipts during rollback.

References: [RTDB rule server time](https://firebase.google.com/docs/reference/security/database#now), [atomic REST updates and server timestamps](https://firebase.google.com/docs/database/rest/save-data).
