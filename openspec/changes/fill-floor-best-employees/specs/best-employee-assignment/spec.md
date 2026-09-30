## Purpose

Let players quickly assign their strongest owned team to any business floor without losing upgrades, inventory or existing progress.

## ADDED Requirements

### Requirement: Per-floor bulk staffing control
Every business floor's Employees view SHALL show a button labeled “Fills with best” targeting that selected floor, including a clear destination and ranking explanation. Locked floors and empty employee collections SHALL not allow the action. The control SHALL be usable on phones and desktop.

#### Scenario: Selected floor differs from gameplay floor
- **WHEN** the player selects another floor in Employees and presses the button
- **THEN** the selected floor receives the team while the gameplay floor remains unchanged.

### Requirement: Best owned team with deterministic ties
The action SHALL select up to twelve owned employees by descending sum of speed, capacity and profit upgrade levels. Equal totals SHALL prefer employees already assigned to the destination, then stable employee ID. It SHALL not buy employees, charge money or change upgrade levels.

#### Scenario: Smaller collection
- **WHEN** fewer than twelve employees are owned
- **THEN** all owned employees are assigned to the destination for free.

#### Scenario: Stronger employees replace existing staff
- **WHEN** a full floor contains employees ranked below others owned by the player
- **THEN** stronger employees replace them and displaced employees take spaces vacated on the incoming employees' previous floors, preserving the twelve-person limit everywhere.

### Requirement: Safe persistent transfers
Bulk assignment SHALL retain every employee exactly once, retain upgrades, return moved employees' carried goods to their original floors, and cancel their previous movement/work. Unmoved staff SHALL retain current work. Customers and payments SHALL remain intact. Changes SHALL persist offline with existing saves and repeat activation SHALL not duplicate goods or benefits.

#### Scenario: Interrupted work and reload
- **WHEN** an employee carrying goods is moved in a bulk assignment and the game reloads
- **THEN** their upgrades and new assignment remain, carried goods exist once at the old floor, and no payment is created or replayed.

#### Scenario: Best team already present
- **WHEN** the selected floor already contains the best available team
- **THEN** the interface explains this and further requests do not alter progress.
