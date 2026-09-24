# Economy and staffing

## Purpose
Provide understandable paid progression with bounded staffing, predictable upgrades, and exactly-once rewards and purchases.

## ADDED Requirements

### Requirement: Purchased tables and snack menus
Each floor SHALL offer six independent one-time table purchases outside player upgrade allowances. First-table costs SHALL be $60/$100/$140/$180 by floor, with $55 added per table index. New games SHALL start without purchased tables. Existing dining-floor tables SHALL remain owned after migration. Gift-shop and arcade snacks SHALL require their own unlocks and pay $3/$4 respectively before bonuses. Existing merchandise, arcade, food, drink and upgrade prices SHALL remain unchanged.

#### Scenario: No duplicate table charge
- **WHEN** an owned table purchase is requested again
- **THEN** the request is rejected without changing money or seating state.

#### Scenario: Payment occurs before eating
- **WHEN** a completed food order is paid at the middle service circle
- **THEN** money is credited exactly once before the customer heads to a table, and eating and cleanup create no additional payment.

### Requirement: Every sellable item requires an unlock
Every food, drink, merchandise product, arcade cabinet, and VR offering SHALL require its own one-time in-game purchase on its unlocked floor. Locked products SHALL not be produced, stocked, ordered, or used. A visible Unlock items menu SHALL show ownership, unlock costs, and base earnings. Starting cash SHALL cover the first controller-food unlock; other spending SHALL reserve that minimum until it is purchased. Existing saves SHALL keep previously available products during migration.

#### Scenario: First kitchen unlock
- **WHEN** a new game starts
- **THEN** all products are locked, Crispy Controller costs $50 of the $120 starting cash, and opening it enables preparation and customer arrivals.

#### Scenario: Locked product cannot earn
- **WHEN** a worker visits a station whose product or arcade cabinet has not been purchased
- **THEN** the worker cannot produce or sell that item and guests cannot request or use it.

#### Scenario: Harder earnings
- **WHEN** a base takeout controller order is completed without profit upgrades
- **THEN** it pays $1, with a $3 addition for a drink, and base arcade play generates three spending-currency quarters. Higher-floor base payouts are $6 per console meal, $4 wine, $5 souvenir, and $3 keychain.

### Requirement: Safe spending and progression
Prices, rewards, timers, arrival rates, and upgrade effects SHALL be configurable. Spending SHALL be atomic, reject insufficient funds, and never make money negative. Floors SHALL unlock sequentially for earned money; sections SHALL be purchased once. All floors SHALL offer player and employee upgrades.

#### Scenario: Insufficient money
- **WHEN** the balance is below a hire, upgrade, outfit, section, or floor price
- **THEN** the purchase fails with readable feedback and no change to money or ownership.

#### Scenario: Duplicate unlock
- **WHEN** an already-owned floor or section purchase is requested again
- **THEN** it fails without a second charge.

### Requirement: Shared roster and assignment limits
Each floor SHALL contribute exactly five unique hires to a shared roster with 20 maximum employees. Employees SHALL transfer only to unlocked floors, retain upgrades, have exactly one assignment, and never exceed 12 assigned employees on one floor. Assignment counts SHALL be visible. Workers SHALL visibly navigate and perform useful jobs.

#### Scenario: Thirteenth worker
- **WHEN** a floor has 12 employees and another assignment is attempted
- **THEN** assignment is rejected and both floor counts remain unchanged.

#### Scenario: Safe transfer
- **WHEN** a carrying or servicing employee transfers
- **THEN** carried goods return to the old floor, unfinished actions are canceled without payment, delivered goods remain delivered, customers remain valid, and the employee starts empty on the new floor.

### Requirement: Player upgrade allowance
Speed, carrying capacity, and profit upgrades SHALL affect only the purchased floor. Each floor SHALL allow five purchases combined across all three categories, displaying the used allowance.

#### Scenario: Sixth combined purchase
- **WHEN** three speed and two profit upgrades have been bought on floor one
- **THEN** any further floor-one upgrade is refused while floor two retains its independent allowance.

### Requirement: Employee upgrade cap
Each employee SHALL allow three purchases per category in speed, capacity, and profit (nine combined), independent of the player allowance, with levels and prices displayed.

#### Scenario: Category maximum
- **WHEN** an employee has three speed upgrades
- **THEN** another speed purchase is refused but capacity and profit upgrades remain available below their caps.

### Requirement: Exactly-once earnings
Each payment SHALL credit round(base value × (1 + 0.20 × floor-player-profit-level + 0.15 × collecting-employee-profit-level)), where the employee term is zero for player collection. Bonuses SHALL be applied once at payment collection, never at production or delivery. Arcade quarters and VR rewards SHALL use the same payment rule; VR uses the player only.

#### Scenario: Combined bonuses
- **WHEN** a $100 base payment is collected by an employee with two profit upgrades on a floor with one player profit upgrade
- **THEN** exactly $150 is credited, and a repeated collection of that payment credits zero.

### Requirement: Cosmetic outfits
The game SHALL offer DFP uniform, chef, formal server, retro gamer, and neon arcade outfits, with previews, gameplay unlock requirements, in-game prices, visible equipped appearance, and persistent selection. Cosmetics SHALL have no real-money purchases.

#### Scenario: Equip and restart
- **WHEN** an owned outfit is equipped and the application restarts
- **THEN** the preview and gameplay character retain that outfit.
