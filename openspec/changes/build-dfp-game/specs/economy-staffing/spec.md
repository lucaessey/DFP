# Economy and staffing

## Purpose
Provide understandable paid progression with bounded staffing, predictable upgrades, and exactly-once rewards and purchases.

## ADDED Requirements

### Requirement: Fivefold current earnings
Restaurant, shop, arcade and VR earnings SHALL pay exactly five times the previous whole-dollar payout, after the existing additive profit-upgrade calculation, 20% increase and fractional-carry calculation. Fractional bonus dollars SHALL carry forward independently per floor and persist across saves, without changing existing money or unlock costs. Already-paid receipts SHALL not add another payout or bonus remainder.

#### Scenario: Small controller sales
- **WHEN** five $1 controller sales complete without upgrades, including a reload between sales
- **THEN** total earnings are $30, with no lost fractional bonus and no duplicate payment.

### Requirement: Purchased tables and snack menus
Each floor SHALL offer six independent one-time table purchases outside player upgrade allowances. Each table SHALL cost 50% less than the released one-third price, rounded to the nearest whole dollar: round(round((60 + 40 × zero-based floor + 55 × zero-based table index) / 3) / 2). This fixed formula SHALL apply the reduction exactly once and SHALL be shared by displayed prices and actual deductions. First-table costs SHALL be $10/$17/$24/$30 by floor. New games SHALL start without purchased tables. Existing table ownership and saved balances SHALL remain unchanged, without retroactive refunds. Gift-shop and arcade snacks SHALL require their own unlocks and retain internal base values of $3/$4 before the collected-earnings rule. All non-table purchase prices SHALL remain unchanged.

#### Scenario: Halve a released table offer once
- **WHEN** an unowned table previously cost $20 or $60
- **THEN** its menu, interaction offer and one-time deduction are $10 or $30 respectively, and reloading changes neither the price nor any saved balance.

#### Scenario: No duplicate table charge
- **WHEN** an owned table purchase is requested again
- **THEN** the request is rejected without changing money or seating state.

#### Scenario: Payment occurs before eating
- **WHEN** a completed food order is paid at its final service circle
- **THEN** money is credited exactly once before the customer heads to a table, and eating and cleanup create no additional payment.

### Requirement: Purchased drinks sections
New progress SHALL keep drinks sections locked until purchased, with a visible locked boundary, an Unlock Drinks Section label, its price and a clear purchase control. Existing prices SHALL remain $180 on Takeout and $220 on Pixel & Pour, with existing meal prerequisites. Insufficient-funds and repeated purchases SHALL be rejected without mutation. A successful purchase SHALL charge once, reveal the equipment briefly, enable drink demand and employee work, and persist ownership. Existing unlocked drink sections SHALL remain open after updates and reloads.

#### Scenario: Locked section cannot strand an order
- **WHEN** a drinks section has not been purchased
- **THEN** customers never request its drinks and employees never select its equipment, stack or service jobs.

#### Scenario: Unlock survives interruption
- **WHEN** a section purchase succeeds and the game reloads during its reveal
- **THEN** the section stays open with one deduction, and neither the charge nor reveal replays.

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
- **THEN** its unchanged internal base is $1, with a $3 drink base; arcade play generates three uncollected quarters. Higher-floor internal bases remain $6 per console meal, $4 wine, $5 souvenir and $3 keychain. Actual payouts use the fivefold current-earnings rule.

### Requirement: Safe spending and progression
Prices, rewards, timers, arrival rates, and upgrade effects SHALL be configurable. Purchases SHALL be atomic, reject insufficient funds, and never make money negative. Security outcomes SHALL use their separate fixed amounts; a full $5 penalty may leave a negative balance, while free navigation remains available and paid purchases remain unaffordable until earnings cover the shortfall. Floors SHALL unlock sequentially for earned money; sections SHALL be purchased once. All floors SHALL offer player and employee upgrades.

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
Each restaurant, shop, arcade or VR payment SHALL first calculate round(base value × (1 + 0.20 × floor-player-profit-level + 0.15 × collecting-employee-profit-level)), where the employee term is zero for player collection, then apply the 20% earnings increase with saved fractional carry and multiply the resulting whole-dollar payout by five exactly once. Bonuses SHALL be applied once at payment collection, never at production or delivery. Arcade quarters and VR rewards SHALL use the same payment rule; VR uses the player only.

#### Scenario: Combined bonuses
- **WHEN** a $100 base payment is collected by an employee with two profit upgrades on a floor with one player profit upgrade
- **THEN** the upgraded subtotal is $150 and exactly $900 is credited after the existing 20% increase and new fivefold multiplier; a repeated collection credits zero and does not change the fractional carry.

#### Scenario: Earnings previews and preserved costs
- **WHEN** the player views a product, arcade collection or VR reward preview
- **THEN** displayed earnings use the same payout calculation as collection, while purchase, hire, upgrade, outfit and unlock costs use their configured prices independently of the earnings multiplier. Existing saved balances and paid receipts are never multiplied or replayed.

### Requirement: Cosmetic outfits
The game SHALL offer DFP uniform, chef, formal server, retro gamer, and neon arcade outfits, with previews, gameplay unlock requirements, in-game prices, visible equipped appearance, and persistent selection. Cosmetics SHALL have no real-money purchases.

#### Scenario: Equip and restart
- **WHEN** an owned outfit is equipped and the application restarts
- **THEN** the preview and gameplay character retain that outfit.
