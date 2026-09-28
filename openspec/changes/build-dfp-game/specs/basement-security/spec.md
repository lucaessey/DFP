# Basement and security

## ADDED Requirements

### Requirement: Independent basement and furniture purchases
Elevator SHALL offer the basement for $200 from the beginning, independently of upper-floor and food progression, while retaining exactly four bottom navigation tabs. The room SHALL offer a TV for $50, a couch for $100 and two distinct plants for $15 each. Each purchase SHALL reject insufficient funds and duplicate ownership, charge once, reveal its own visible 3D object and persist permanently. The lounge SHALL use the approved chunky style with the couch facing the TV and plants in separate positions.

#### Scenario: Basement before upper floors
- **WHEN** the player has $200 while only Takeout is unlocked
- **THEN** purchasing the basement costs exactly $200 and allows visiting it without unlocking any upper floor.

### Requirement: Furnished security system
The security system SHALL cost $150 and SHALL require the TV, couch and both plants. A checklist SHALL show each requirement. Once purchased, interacting with the TV SHALL open a large animated view of the actual highest unlocked above-ground floor, including its layout and current customers, employees and store activity. The monitored floor SHALL update automatically as higher floors unlock. Monitoring SHALL have clear status, touch/click person targets, camera controls and an exit control.

#### Scenario: Incomplete lounge
- **WHEN** any of the four furnishings is unowned
- **THEN** buying security is unavailable and the checklist identifies the missing item without charging money.

### Requirement: Fixed security encounters
While monitoring is visible and active, a uniformly random integer wait of 1–30 seconds SHALL precede one robber. Only one robber SHALL exist at a time, with recognizable stealing behavior and ten seconds to catch them. A catch SHALL award exactly $15 and end the encounter; an escape SHALL deduct $5 and end it. Tapping an innocent person SHALL deduct $5 while the current encounter continues. After an encounter ends, a new random wait SHALL begin. Profit upgrades, fractional bonuses and earnings multipliers SHALL NOT alter these amounts. Catch, wrong-person and escape outcomes SHALL show clear feedback. A full penalty SHALL still deduct $5 below a $5 balance, allowing a negative balance; free navigation SHALL remain available.

#### Scenario: Duplicate catch input
- **WHEN** a caught robber is selected again, including after reload or during an interrupted animation
- **THEN** no additional reward is awarded and the next encounter's wait is unchanged.

#### Scenario: Wrong selection
- **WHEN** the player selects an innocent person during an active encounter
- **THEN** a $5 penalty and feedback occur, the robber remains active with the same remaining time, and a duplicate selection for that person in that round cannot charge twice.

### Requirement: Paused and persistent monitoring
Closing monitoring, backgrounding the application or reloading SHALL preserve the current wait or encounter and its remaining time. No encounters or penalties SHALL be generated while away; monitoring SHALL resume the saved round when reopened. Basement, furniture and security ownership SHALL persist with existing balances, floors, upgrades, employees and outfits preserved. Furniture and TV animations SHALL remain cosmetic, respect reduced motion and work offline.

#### Scenario: Away during theft
- **WHEN** monitoring closes with four seconds remaining and reopens later
- **THEN** the same robber resumes with four seconds remaining and no away-time penalty.
