## Purpose

Expand a saved DFP business into eleven playable floors with distinct jobs, safe progression, and consistent integration with staff, pets and security.

## ADDED Requirements

### Requirement: Ordered progression and purchases
The game SHALL list Basement B1 first whether locked or owned, then the four unchanged businesses and seven new businesses in the requested order. New businesses SHALL unlock sequentially at the design's listed prices. Equipment and sections SHALL show their requirements and costs, charge once, reject insufficient funds, and persist. Navigation SHALL be scrollable and usable on phones without removing existing bottom tabs.

#### Scenario: Start and expansion
- **WHEN** a player opens the elevator in a new or existing save
- **THEN** B1 is first, all eleven business destinations follow, and purchasing each new floor requires its predecessor and exact funds.

### Requirement: Distinct hospitality and production cycles
The seven businesses SHALL implement all jobs described in the design: dessert preparation and melting, ticketing/ushering/popcorn/movies/cleanup, robot supply/cooking/fault/repair/charging, terrace table service/rain/umbrellas/smoothies, esports admission/snacks/faults/reset/stage, guest pets/food/treats/water/cleanup/playground, and factory ingredients/processing/packing/sealing/loading/delivery/conveyors. All paid sections SHALL materially enable their advertised activity. Locked goods SHALL never be requested or assigned as jobs.

#### Scenario: Complete each business
- **WHEN** the player or hired employees operate purchased equipment on any new floor
- **THEN** actual inventory moves through that business's jobs, guests or deliveries complete, and earned money can be collected without decorative-only stations.

#### Scenario: Maintenance and weather
- **WHEN** ice cream melts, a robot or PC faults, or rooftop rain arrives
- **THEN** readable feedback explains the event, free maintenance can restore operations, and no impossible order or permanently stuck customer is created.

### Requirement: Exactly-once economy
New ordinary earnings SHALL retain the existing profit multiplier and upgrade effects applied once. Distinct admissions, concessions, playground and delivery payments SHALL be persisted separately. Interrupted animation, repeated interaction and reload SHALL neither create goods nor duplicate payment. All existing prices, balances and fixed security amounts SHALL remain unchanged.

#### Scenario: Reload an already paid job
- **WHEN** a paid ticket, snack, visit or delivery is reloaded or tapped again
- **THEN** it cannot pay again and the unfinished remainder of its business cycle remains playable.

### Requirement: Staff pets and security
Each new floor SHALL add five hires, allow five total personal upgrade purchases and retain twelve assigned staff maximum with existing employee upgrade caps. Transfers SHALL preserve employee identity and upgrades. Only the equipped companion SHALL follow and supply documented abilities. Security SHALL monitor the highest unlocked floor through floor eleven with a suitable robbery target and unchanged timers/rewards/penalties, including remote Lens Buddy access.

#### Scenario: Transfer and monitor the last business
- **WHEN** a previously upgraded employee transfers to the factory and floor eleven is highest unlocked
- **THEN** that employee performs factory work with preserved upgrades, the equipped pet follows safely, and security depicts the factory and its robbery interaction.

### Requirement: Save compatibility and offline presentation
Legacy saves SHALL retain all balances, floors, purchases, outfits, staff, pets, apps, comments and security history while appending seven locked floors. New progress SHALL survive reload offline. The game SHALL use original procedural 3D props and readable animations consistent with existing character style, and avoid animating hidden scenes.

#### Scenario: Migrate and play offline
- **WHEN** a version 9 save is loaded by the built offline-capable game
- **THEN** original progress is retained, the seven floors begin locked, and subsequent purchases and work remain usable after offline reload.

### Requirement: Verified local delivery
The expansion SHALL be built and tested with honest OpenSpec completion records. Every business SHALL be inspected in the running game, including mobile navigation, player and employee work, payments, pet behavior and security. Publishing SHALL await a separate request.

#### Scenario: Completion report
- **WHEN** implementation ends
- **THEN** the report includes all new prices, actual passing checks and any remaining limitations, with unverified tasks left unchecked.
