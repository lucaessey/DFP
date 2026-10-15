# Spec Delta

## Purpose

Give the verified DFP producer a bounded cash claim without changing ordinary earnings or exposing owner privileges to players.

## ADDED Requirements

### Requirement: Verified producer cash claim
The Producer app SHALL offer an online Claim $1,000 action only to the existing verified owner. A confirmed claim SHALL add exactly $1,000 to the current saved game, without earnings multipliers, upgrade or pet bonuses.

#### Scenario: Owner claims cash
- **WHEN** the verified owner claims while eligible
- **THEN** the server confirms one receipt and the saved balance increases by exactly $1,000

#### Scenario: Ordinary player attempts a claim
- **WHEN** an anonymous, different, unverified or unsupported-provider account attempts a direct claim
- **THEN** the server denies the claim and the app does not grant money

### Requirement: Five-minute account cooldown
The system SHALL enforce at least 300,000 milliseconds between accepted claims using server time across reloads, tabs and devices. The UI SHALL show a countdown and disable fresh claims while waiting. Waiting SHALL never automatically award cash.

#### Scenario: Repeated or concurrent claims
- **WHEN** requests arrive before five minutes have elapsed since an accepted claim
- **THEN** no second claim is accepted, including requests with a changed device clock

#### Scenario: Cooldown expires
- **WHEN** five minutes elapse and the producer presses Claim again
- **THEN** another single $1,000 claim can be confirmed

### Requirement: Durable payment and clear failures
Claims SHALL preserve existing saves and gameplay. Repeated taps, reloads and lost network responses SHALL not duplicate a claim payment in the receiving save. Failed or offline requests SHALL show a retryable message and SHALL not announce success or grant unconfirmed money.

#### Scenario: Lost confirmation or local save failure
- **WHEN** a claim commits but its confirmation or local save fails
- **THEN** retrying recovers the same receipt and records payment at most once

#### Scenario: Existing player or offline play
- **WHEN** existing progress loads or the game is offline
- **THEN** its money, possessions and gameplay remain intact and no unverified cash claim is allowed
