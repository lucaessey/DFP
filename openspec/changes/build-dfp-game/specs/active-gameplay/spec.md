# Active gameplay

## Purpose
Deliver readable, approachable restaurant work through a directly controlled character and four distinct playable floors.

## ADDED Requirements

### Requirement: Original three-dimensional presentation
The restaurant SHALL use real 3D characters, furniture, machines, food and carried objects, with consistent lighting, soft contact shadows, low walls, visible legs and doorways. An elevated three-quarter camera SHALL follow smoothly with restrained movement. All four floors SHALL have distinct original furniture and atmosphere, and all five outfits SHALL alter the player model and preview.

#### Scenario: Full takeout presentation
- **WHEN** a player and an employee complete a takeout service loop
- **THEN** their feet, turning, walk cadence, preparation, reach, carry stack, placement, handover and payment reactions are visible in the 3D world, with readable station labels and customer needs.

### Requirement: Independent blended animation
Presentation SHALL blend idle, walking, stopping, working, pickup, carrying, placement, serving, greeting, seating, eating, departure, restocking and quarter collection. Characters SHALL remain grounded and avoid visible furniture penetration or overlapping crowds. Brief object motion, particles, readable money labels and mute-aware audio SHALL communicate successful interactions, purchases, hires and unlocks without hiding controls.

#### Scenario: Interrupted animation
- **WHEN** a floor changes, the renderer restarts, or reduced motion is enabled during an interaction
- **THEN** the underlying job and exactly-once transaction proceed independently and goods or rewards cannot be duplicated by animation callbacks.

### Requirement: Trash on every floor
Every floor SHALL contain a visible trash can with a labeled interaction ring. A player standing in the ring SHALL discard one carried item per action interval, receive discard feedback, and receive no refund or profit. Employees SHALL not discard their cargo while navigating.

#### Scenario: Discard unwanted stock
- **WHEN** the player carries goods to the trash ring on any floor
- **THEN** carried goods are removed one at a time without changing money, and leaving the ring stops discarding.

### Requirement: Direct movement and automatic work
The game SHALL provide an original isometric environment, keyboard WASD/arrows, a touch joystick, visible carried goods, capacity feedback, station labels, and automatic work inside marked interaction areas. Characters SHALL navigate without crossing solid stations. A short playable tutorial SHALL guide production, carrying, and service.

#### Scenario: First order
- **WHEN** a new player follows the tutorial to preparation, frying, collection, counter stacking, and the middle service circle
- **THEN** the carried controller meal is consumed, the waiting customer receives it, and one payment is earned.

#### Scenario: Movement input
- **WHEN** a player holds a movement key or drags the joystick and then releases it
- **THEN** the character moves continuously in the indicated screen direction and stops after release.

### Requirement: Takeout service
Floor one SHALL include preparation, timed frying, pickup, a separate marked counter-stacking spot, a middle service circle, queues, payment, an unlockable drink station, employees, and player upgrades. The player and employees SHALL unload goods onto the counter at the stacking spot, then stand in the middle service circle to give customers food from the counter stack and collect payment. Carried goods SHALL NOT be handed directly to customers at the service circle. Drinks SHALL become an additional customer need after unlocking.

#### Scenario: Stack then serve
- **WHEN** a player carries food into the service circle with an empty counter
- **THEN** no goods are delivered until the player unloads at the stack spot and returns to the middle service circle.

#### Scenario: Drinks order
- **WHEN** drinks are unlocked and a waiting customer requests one
- **THEN** the order is completed only after the requested food and drink are delivered.

### Requirement: Seated dining
Floor two SHALL sell two original console-shaped meals and wine through the same separate stacking and middle-circle service process as takeout. Customers SHALL pay at the counter before moving to purchased tables to eat. This supersedes the initial waiter-delivery workflow.

#### Scenario: Complete dining cycle
- **WHEN** a worker stacks a diner's food and wine and serves from the middle circle
- **THEN** payment occurs once before the diner sits and eats, and the table becomes dirty only after eating finishes.

### Requirement: Counter food service and purchased seating on every floor
Every floor SHALL offer food through separate STACK FOOD and middle SERVE circles and an expanded seating area with six individually purchasable tables. The shop and arcade SHALL retain their existing activities and add separately unlockable snack food. Direct carrying at SERVE SHALL not deliver food; stacking alone SHALL not serve or pay. Food customers SHALL pay before seating. Without owned tables they MAY take food away; with owned tables they SHALL wait for a free clean table.

#### Scenario: Food service on every floor
- **WHEN** food is carried directly into the service circle on any floor
- **THEN** no delivery occurs until it has been stacked at the separate counter spot.

#### Scenario: Clean only after eating
- **WHEN** a seated customer is still eating and the player or an employee reaches the table
- **THEN** cleaning cannot occur, the eating timer continues, and the table remains occupied until the meal finishes; afterward it becomes dirty and requires one cleanup before reuse.

#### Scenario: Buy and retain a table
- **WHEN** an affordable unowned table is purchased
- **THEN** money is charged once, the table becomes available for seating, and ownership survives reload without affecting other floors.

### Requirement: Merchandise shop
Floor three SHALL include DFP chicken/controller souvenirs, stock pickup, carrying, shelf restocking, browsing customers, checkout, and an unlockable miniature-keychain section. It SHALL contain no drinks.

#### Scenario: Stock to sale
- **WHEN** a worker carries merchandise from stock to a shelf and then serves checkout
- **THEN** a browsing customer takes stocked merchandise and pays once at checkout.

### Requirement: Arcade and VR
Floor four SHALL include at least three arcade machines, waiting customers, animated play, accumulated quarters, and collection at each machine. One quarter SHALL equal one spending dollar before applicable profit bonuses. There SHALL be no ticket economy. An unlockable VR section SHALL offer a repeatable three-lane dodge game using touch buttons or arrow keys, without a headset.

#### Scenario: Machine revenue
- **WHEN** a customer finishes an arcade session
- **THEN** quarters remain visibly at that machine until a player or employee collects them.

#### Scenario: VR run
- **WHEN** the player enters the unlocked VR zone and starts a run
- **THEN** left/right inputs change lanes, obstacles can be dodged, hits reduce lives, and the completed run awards its reward exactly once.

### Requirement: Active off-screen floors
Unlocked floors SHALL continue deterministic simulation and assigned employee work while another floor is selected during an active session. Backgrounded or closed applications SHALL not accrue catch-up earnings.

#### Scenario: Other floor work
- **WHEN** a player visits floor two while floor-one employees are assigned
- **THEN** floor-one employees continue useful service and can add earnings during the active session.
