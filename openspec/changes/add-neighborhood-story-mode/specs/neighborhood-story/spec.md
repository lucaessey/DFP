# Story Mode

## Purpose

Provide an optional offline neighborhood adventure with fair skill competitions, persistent chapters, and complete separation from regular business progress.

## ADDED Requirements

### Requirement: Explicit start through purchased Email
The game SHALL expose a separate Inbox inside Email only with the basement computer and Email owned. The first visit SHALL ask “Would you like to start Story Mode?” No SHALL return to computer home without changing progress. Yes SHALL start the story and display its introductory fictional email. Started players SHALL see saved correspondence and Resume Story. No messages SHALL be sent externally.

#### Scenario: Declining and returning
- **WHEN** an eligible player chooses No and later opens Inbox
- **THEN** businesses are unchanged and the start choice is offered again

#### Scenario: Challenge correspondence
- **WHEN** the player investigates the rival and returns to the basement computer
- **THEN** a prepared challenge can be sent once locally and a rival reply introduces the competitions

### Requirement: Isolated optional play
Active Story Mode SHALL suspend all regular business customers, employees, production, payments and timers without deleting them. Story supplies SHALL be free and separate from normal inventory. Pause Story / Return to Regular Play SHALL restore business activity, and Resume Story SHALL continue progress. Story actions SHALL NOT charge money, change ordinary earnings, or consume ordinary goods.

#### Scenario: Round trip with a carried order
- **WHEN** a player starts, pauses, resumes and reloads the story with regular carried goods and waiting customers
- **THEN** the normal goods, receipts, customers, purchases and upgrades are retained without duplicated payments

### Requirement: Explore the neighborhood
The game SHALL provide walkable DFP and rival entrances on opposite sides of a road, a crossing, plaza/park, delivery route and competition arena. Each chapter SHALL include location objectives, clues or NPC dialogue. Outfit and equipped pet SHALL appear outdoors with collision-safe movement and follow recovery. Returning inside SHALL preserve the regular floor and inventory.

#### Scenario: Reach every objective
- **WHEN** a player follows the objective indicators using keyboard, touch joystick or location navigation
- **THEN** every clue, NPC, event and DFP entrance is reachable around scenery

### Requirement: Five gated chapters
The story SHALL include Across the Road (investigation, challenge, introductory food fight), Cook-Off (recipe clues and timed cooking), Lunch Rush (preferences and serving), Delivery Dash (route exploration, delivery race and food fight), and Neighborhood Showdown (rival meetings, cooking, serving, race and food fight). Each required event SHALL be won before advancing. Completion SHALL show a victory scene, concluding email and permanently end the story customer shortage.

#### Scenario: Complete the finale
- **WHEN** all four final competitions are won
- **THEN** per-event and overall results, original victory dialogue and concluding email are available and ordinary customers return

### Requirement: Fair playable competitions
Cooking SHALL require collecting ingredients, preparing the requested recipe and delivering dishes. Serving SHALL require seating guests, correct orders and post-meal cleaning. Delivery SHALL require ordered route checkpoints and correct destinations with visible recoverable obstacles. Food fights SHALL use aimed projectiles, dodgeable telegraphed attacks, harmless splats and brief recoverable stuns. All events SHALL display scores, rival progress, timers, rules and tie handling. Basic characters without bonuses SHALL be able to win.

#### Scenario: Failed attempt
- **WHEN** a player loses or ties a required competition
- **THEN** a result and useful tip are shown with free Retry and Return to Regular Play, preserving all earlier victories

### Requirement: Safe persistence and interruptions
The game SHALL save story objectives, clues, emails, wins and completion with existing progress. Old saves SHALL acquire an unstarted story without changing prior purchases. Event timers SHALL pause when backgrounded or a pause/result/menu overlay is open. Reloading an unfinished event SHALL offer a free restart of that event without replaying prior rewards or victories.

#### Scenario: Offline interrupted competition
- **WHEN** a saved active event is reloaded offline
- **THEN** completed objectives remain, the event does not advance while away, and the player can restart it for free or return to regular play

### Requirement: Readable local presentation
The game SHALL provide a compact chapter/objective/location/results panel, touch and keyboard controls, reduced-motion support and procedural assets cached with the existing PWA. Existing bottom navigation, computer applications, floors, pets, outfits, controls and online feedback SHALL remain available. Verification documentation SHALL distinguish passing checks from unfinished work; this change SHALL be built locally without publication.

#### Scenario: Phone layout
- **WHEN** Story Mode is opened in portrait or landscape on a small phone
- **THEN** the objective, movement controls, actions and regular-play exit are usable without horizontal overflow
