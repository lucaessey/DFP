# Proposal

## Why

The verified producer wants an optional $1,000 cash claim in the Producer app, limited to one claim every five minutes.

## What Changes

- Add an owner-only Claim $1,000 button, confirmation, retry state and countdown.
- Enforce the five-minute account-wide cooldown using the existing Firebase database rules and server timestamps.
- Persist local claim receipts with game progress so retries and reloads cannot pay twice.

## Capabilities

### New Capabilities
- `producer-cash-bonus`: Verified producer cash claims with a protected cooldown and durable local payment.

### Modified Capabilities
None.

## Impact

Producer UI, Firebase rules generator and generated rules, existing save validation, focused unit/emulator/browser tests. Existing Spark project only; no additional service or billing. Normal gameplay and its earnings remain unchanged.
