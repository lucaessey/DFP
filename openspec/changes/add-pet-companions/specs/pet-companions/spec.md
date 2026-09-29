# Pet companions

## Purpose

Give players a permanent offline collection of readable 3D companions that follow them and provide exact, bounded gameplay assistance.

## ADDED Requirements

### Requirement: Complete accessible collection
The game SHALL provide a paw-labelled Pets bottom tab alongside all four existing tabs. Its shop SHALL show all 30 pets in the design table, their names, distinct appearances, prices, exact abilities, current balance, selected 3D preview and Locked, Buy, Owned or Equipped states. Prices SHALL range from $20 through $2,000. All controls SHALL remain accessible on a 320-pixel-wide phone and desktop.

#### Scenario: Select an unaffordable pet
- **WHEN** a player previews a pet costing more than available funds
- **THEN** its appearance and exact abilities remain visible, its locked state explains the missing amount and purchase is disabled.

### Requirement: Permanent purchase and single equipment
Pet purchases SHALL deduct the catalogue price once, reject duplicate or unaffordable purchases, and persist permanently. At most one owned pet SHALL be equipped. Switching SHALL be free and Unequip SHALL remove bonuses without losing ownership or carried items. The existing first-food reserve SHALL remain enforced and explained.

#### Scenario: Repeated purchase and reload
- **WHEN** a player buys a pet, repeats the purchase and reloads
- **THEN** exactly one price was deducted and ownership and equipment remain intact.

### Requirement: Accurate separate abilities
Only the equipped pet SHALL apply its catalogue abilities. Player speed, capacity, ordinary-income and prep bonuses SHALL remain separate from existing upgrades, never accumulate through switching/reloading and match the displayed amounts. Income SHALL apply once to final eligible player receipts; employee, VR, computer and fixed security rewards/penalties SHALL remain unchanged. Fractional pet earnings SHALL carry forward rather than disappear through repeated rounding.

#### Scenario: Switch a capacity pet while carrying
- **WHEN** a player unequips or switches a capacity pet while carrying extra goods
- **THEN** goods remain carried, and pickup waits until the bag is below the new capacity.

#### Scenario: Collect a payment twice
- **WHEN** an eligible receipt is collected repeatedly with an income pet
- **THEN** its single actual payout includes the pet bonus once and the money animation and preview agree.

### Requirement: Bounded helpers
Cash, service and cleaning helpers SHALL use the exact ranges/cooldowns in the design table, operate only during active play on the current above-ground floor and perform at most one eligible task per activation. Cash SHALL collect only an earned payment or arcade pile. Service SHALL consume one already-stacked item for a correctly positioned customer. Cleaning SHALL affect only a purchased dirty table after dining. Locked stations SHALL remain unavailable. Cooldowns SHALL survive switching and reloading.

#### Scenario: Switch helpers during cooldown
- **WHEN** the player switches pets, unequips or reloads after an activation
- **THEN** the shared remaining cooldown is retained and no extra task is awarded.

#### Scenario: No eligible nearby work
- **WHEN** no earned cash, matching stacked food or dirty table is within range
- **THEN** the pet creates no money, goods or work completion.

### Requirement: Physical animated companions
The equipped pet SHALL follow at a comfortable distance with species-appropriate movement and idle animation, happy purchase/equip reactions and ability reactions. It SHALL route around furniture, avoid crowding actors, never block actor navigation and recover safely when stuck or far behind. Floor changes SHALL bring exactly the equipped pet to a safe nearby position; the basement SHALL show it beside the lounge player. Reduced motion SHALL suppress bounce/flourishes while preserving following and abilities.

#### Scenario: Change floors or get separated
- **WHEN** the player changes floors or the follower becomes stuck or distant
- **THEN** exactly one equipped pet appears at a safe walkable nearby location and resumes following without changing inventory or money.

### Requirement: Offline compatibility and efficient presentation
Existing saves SHALL migrate without losing progress, balances, outfits, staffing, floors or purchases. Pet ownership SHALL not require online services or accounts. All pet models and shop assets SHALL work after an offline reload. Thirty shop entries SHALL use cached still previews and only one animated selected model; gameplay SHALL render only the equipped companion.

#### Scenario: Upgrade an existing save and play offline
- **WHEN** a version-6 save loads the updated game, buys a pet and reloads offline
- **THEN** existing progress remains and the purchased/equipped pet and its abilities remain available.
