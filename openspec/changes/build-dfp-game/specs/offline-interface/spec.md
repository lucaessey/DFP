# Offline interface

## Purpose
Make the game usable on small touch screens and desktop, with recoverable device-local progress and offline installation.

## ADDED Requirements

### Requirement: Efficient accessible 3D
The game SHALL reuse geometry and materials, limit lighting and effects, and target 60 FPS where practical. Settings SHALL provide persistent reduced-effects and reduced-motion options. Reduced motion SHALL suppress camera follow and decorative movement while preserving readable actions. All models, materials, animations and UI SHALL load offline. Existing saves SHALL retain all progress. Verification SHALL report actual available-environment performance, comparable before-and-after screenshots and a gameplay recording when supported.

#### Scenario: Lower-cost rendering
- **WHEN** reduced effects is enabled and the game reloads offline
- **THEN** lower pixel density, reduced particles and cheaper shadows apply, while all four floors, controls, saves and gameplay rules remain usable.

### Requirement: Four-tab interface
The game SHALL display exactly four persistent bottom tabs in order: Elevator, Home, Outfits, Employees, with recognizable icons and readable labels. Elevator SHALL identify the current floor and unlock requirements. Settings SHALL use a separate button. Portrait, landscape, and safe-area layouts SHALL keep controls accessible.

#### Scenario: Switch panels
- **WHEN** each bottom tab is selected on a narrow phone
- **THEN** its intended panel appears without losing the selected floor or hiding bottom navigation.

### Requirement: Device-local versioned saves
The game SHALL preserve money, unlocked floors/sections, upgrades, employees, assignments, outfit ownership/selection, tutorial, and in-progress simulation state using versioned validated device-local saves. Invalid primary saves SHALL recover from a validated backup; incompatible newer versions SHALL not be overwritten. Storage failures SHALL be visible. Legacy versions one through three SHALL migrate safely to schema four, preserving owned tables and delivered goods.

#### Scenario: Interrupted transaction
- **WHEN** the application reloads immediately after a persisted payment or purchase
- **THEN** money and ownership remain consistent and that transaction cannot be credited or charged twice.

#### Scenario: Corrupt primary save
- **WHEN** the primary save is corrupt and the backup is valid
- **THEN** the game loads the backup and reports recovery without silently resetting all progress.

### Requirement: Installable offline application
The application SHALL provide a manifest, 192px and 512px icons including maskable artwork, standalone layout, and a service worker that caches all required runtime resources. Offline readiness SHALL be shown only after caching succeeds. Settings SHALL provide browser-appropriate installation guidance and clearly describe saves as device-local.

#### Scenario: Offline reload
- **WHEN** all assets have downloaded and the network is disabled
- **THEN** a reload opens the game with saved progress and all floors remain playable.

### Requirement: Update recovery
New application assets SHALL install as a complete new cache before activation. Updates SHALL preserve saved progress and show a user-controlled reload action after saving. An old client SHALL not lose access to its cached assets mid-session.

#### Scenario: Update across sessions
- **WHEN** a new build is installed and the player accepts the update
- **THEN** the new application loads with the same validated balance, ownership, and assignments.

### Requirement: Public GitHub Pages game
The game SHALL be publicly playable at https://lucaessey.github.io/DFP/ without sign-in. All runtime assets, manifest URLs and offline navigation SHALL resolve under /DFP/, and the worker SHALL control only that path. Local root-path development SHALL remain available. Saved progress SHALL remain device-local and separate between localhost and the public origin.

#### Scenario: Public game and offline return
- **WHEN** a new visitor opens the public game, completes a purchase and waits for the offline download
- **THEN** the 3D game runs, and a subsequent offline reload preserves that visitor's progress without requesting assets from the domain root.

### Requirement: Safe layout update
Layout migration SHALL preserve balances, paid flags, partial orders, inventories, employees and assignments, outfits, purchases, upgrades, tables and gameplay timers. Old path targets SHALL be cleared. Saved actors obstructed by changed furniture SHALL move to nearby clear space; seated and playing customers SHALL align with their assigned furniture. Already-valid positions SHALL remain valid and a repeated reload SHALL not replay migration, income or purchases. Offline update and controls SHALL remain functional.

#### Scenario: Old position inside a moved station
- **WHEN** a saved player or employee position conflicts with the expanded layout
- **THEN** the actor resumes on a nearby reachable tile with unchanged cargo and progress, and no money is credited by migration.
