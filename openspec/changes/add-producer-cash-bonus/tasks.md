# Tasks

## 1. Protected claims and durable payments

- [x] 1.1 Implement shared receipts and additive save state; unit-test exact payment, retries, migration and save failures.
- [x] 1.2 Add owner-only Firebase rules with server cooldown and atomic receipts; emulator-test access, concurrency, time boundaries, tampering and existing comment rules.

## 2. Producer interface

- [x] 2.1 Integrate claim, countdown, recovery and error UI; browser-test owner/ordinary sessions, repeated taps, reload, failures, phone and landscape.

## 3. Verification and configuration

- [x] 3.1 Run regression tests, build and strict OpenSpec validation; record actual results and limitations.
- [ ] 3.2 Deploy the additive Firebase rules to the existing project and verify protected access, or document exact remaining setup if live access is unavailable. Setup instructions are delivered in verification.md; live deployment remains unverified because CLI has no authorized account and the console denies project access.
