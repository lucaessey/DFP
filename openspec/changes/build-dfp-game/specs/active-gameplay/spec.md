# Active gameplay

## Purpose
Deliver readable, approachable restaurant work through a directly controlled character and four distinct playable floors.

## ADDED Requirements

### Requirement: Separate food and drink service
Takeout and Pixel & Pour SHALL contain distinct food and drink sections with their own equipment, stacking pads, service counters and customer queues. Signs and floor colors SHALL identify the sections. Collisions, navigation, camera-visible controls and spacious walking routes SHALL match the actual furniture. Food SHALL only be stacked/served in the food section and drinks in the drink section. Mixed orders SHALL receive food first, then drinks, and pay once for the full order at the final section before seating. Player and employee jobs SHALL follow the same rules.

#### Scenario: Mixed order crosses sections
- **WHEN** a customer orders food and a drink
- **THEN** food service fills only the food units, the customer moves to the drinks queue, drink service fills the remaining units, and collection pays the combined bill once.

#### Scenario: Accessible independent queues
- **WHEN** both sections have customers and employees working
- **THEN** all production, stack and service pads remain reachable without furniture intersections, and queues occupy separate spaces with clear routes to dining and the entrance.

### Requirement: Cohesive chunky world
All four floors SHALL share warm peach/cream floors, purple furniture or trim, yellow-orange accents, bevelled chunky equipment, minimal surface detail, elevated diagonal framing and soft directional/contact shadows. Each floor SHALL retain its own atmosphere, theme, expanded layout and approved black featureless characters.

#### Scenario: Stable readable environment
- **WHEN** work proceeds normally on any floor
- **THEN** silhouettes and aisles remain clear, and floors, walls and structural furniture remain stable while relevant goods and machine components animate.

### Requirement: Transaction-driven world motion
Products SHALL emerge, follow short pickup/delivery arcs and settle with small landing bounces. Drinks SHALL visibly fill while produced. Carried goods SHALL sway gently during movement and use bounded stack height with a quantity indicator when needed. Fryers SHALL bubble/steam during cooking, dispensers SHALL pour, checkout SHALL respond to collection, arcade screens and coin piles SHALL reflect use, and VR SHALL distinguish start, running and finished states. Idle, working, ready, blocked and locked stations SHALL be distinguishable.

#### Scenario: Earnings animation without replay
- **WHEN** an existing service, merchandise, arcade or VR transaction commits for a player or employee
- **THEN** bright green money bundles pop/settle at the relevant collection point and travel to the collector or currency counter; the displayed total reflects the committed amount, and decorative animation cannot award money, change inventory or replay on reload.

#### Scenario: Unlock construction
- **WHEN** a product or table purchase succeeds
- **THEN** only the affected object rises/scales into place and settles with a brief highlight, without changing its final footprint, price, unlock rule or interaction zone.

#### Scenario: Interrupted presentation
- **WHEN** animation is interrupted by movement, menus, floor changes, reduced motion or a reload
- **THEN** goods, money and jobs remain governed by saved simulation state; obsolete visual effects clear and no pending payment is recreated by the renderer.

### Requirement: Original three-dimensional presentation
The restaurant SHALL use real 3D characters, furniture, machines, food and carried objects, with consistent lighting, soft contact shadows, low walls, visible legs and doorways. An elevated three-quarter camera SHALL follow smoothly with restrained movement. All four floors SHALL have distinct original furniture and atmosphere, and all five outfits SHALL alter the player model and preview.

Characters SHALL use an original shared 3D base with a large rounded slightly oval featureless charcoal-black head, a compact rounded body, thick smooth black arms and legs, mitten hands and rounded black feet. Soft material highlights SHALL reveal curvature without facial detail. The default uniform SHALL be a bright red short-sleeved collared shirt and curved red baseball cap with a visible brim. A common articulated rig SHALL support all five outfits and distinct player, employee and customer clothing colors/accessories. Clothing SHALL retain each existing outfit's identity. The enlarged room sizes, fivefold earnings, staffing limits, controls and saves SHALL be retained; section layouts and table prices SHALL follow the current service and economy requirements.

#### Scenario: Character design inspection
- **WHEN** the updated shared base is reviewed
- **THEN** front, side and back previews and an in-game carrying view are available, and the base is compared to the user's reference image once the image is accessible.

#### Scenario: Full takeout presentation
- **WHEN** a player and an employee complete a takeout service loop
- **THEN** their feet, turning, walk cadence, preparation, reach, carry stack, placement, handover and payment reactions are visible in the 3D world, with station action icons, accessible names and customer order icons.

### Requirement: Independent blended animation
Presentation SHALL blend idle, walking, stopping, working, pickup, carrying, placement, serving, greeting, seating, eating, departure, restocking and quarter collection. Characters SHALL remain grounded and avoid visible furniture penetration or overlapping crowds. Brief object motion, particles, readable money labels and mute-aware audio SHALL communicate successful interactions, purchases, hires and unlocks without hiding controls.

Walking cadence SHALL follow actual distance traveled, with alternating grounded steps and small body bounce. Idle breathing, weight shifts and occasional head turns SHALL remain gentle. Carried stacks SHALL remain visible in front of the body; work poses SHALL distinguish frying, pouring, serving, restocking, cleaning and quarter collection. Reaches and transfers SHALL follow actual completed inventory changes. Greeting, sitting, eating, standing and leaving SHALL blend without blocking the customer's simulation. Purchases/unlocks/upgrades SHALL trigger brief visual celebrations without delaying controls. Decorative anticipation, squash/stretch and follow-through SHALL be small and suppressed by reduced motion.

#### Scenario: Outfit and movement interruption
- **WHEN** carrying or working is interrupted by movement, an outfit change, a floor change, reload or reduced motion
- **THEN** controls respond immediately, the current inventory is represented accurately, stale visual transfers disappear, and no animation callback changes payments, goods, timers or customer progress.

#### Scenario: Interrupted animation
- **WHEN** a floor changes, the renderer restarts, or reduced motion is enabled during an interaction
- **THEN** the underlying job and exactly-once transaction proceed independently and goods or rewards cannot be duplicated by animation callbacks.

### Requirement: Trash on every floor
Every floor SHALL contain a visible trash can with an icon-marked interaction ring and accessible name. A player standing in the ring SHALL discard one carried item per action interval, receive discard feedback, and receive no refund or profit. Employees SHALL not discard their cargo while navigating.

#### Scenario: Discard unwanted stock
- **WHEN** the player carries goods to the trash ring on any floor
- **THEN** carried goods are removed one at a time without changing money, and leaving the ring stops discarding.

### Requirement: Direct movement and automatic work
The game SHALL provide an original isometric environment, keyboard WASD/arrows, a touch joystick, visible carried goods, capacity feedback, accessible station action icons, and automatic work inside marked interaction areas. Characters SHALL navigate without crossing solid stations. A short playable tutorial in the surrounding UI SHALL guide production, carrying, and service. Floating station names, player-name text, customer-state words and movement instruction overlays SHALL be hidden while money, order icons, buttons and menus remain available.

#### Scenario: Stop direct and automatic movement
- **WHEN** a player releases a movement key, joystick or held floor pointer, cancels a touch, loses focus or opens a menu
- **THEN** direct movement stops without drifting; explicit station/area trips can also be cancelled with Escape or the stop button, and interrupted movement does not resume by itself.

#### Scenario: Facing between simulation ticks
- **WHEN** a walking character is drawn several times between fixed simulation steps
- **THEN** the character continues facing its travel direction rather than turning toward an idle or work pose. Stationary crowds do not displace the player's displayed position.

#### Scenario: First order
- **WHEN** a new player follows the tutorial to preparation, frying, collection, counter stacking, and the middle service circle
- **THEN** the carried controller meal is consumed, the waiting customer receives it, and one payment is earned.

#### Scenario: Movement input
- **WHEN** a player holds a movement key or drags the joystick and then releases it
- **THEN** the character moves continuously in the indicated screen direction and stops after release.

### Requirement: Takeout service
Floor one SHALL include preparation, timed frying, pickup, a marked food-stacking spot, a food service circle, queues, payment, a separately purchased drinks section, employees, and player upgrades. The player and employees SHALL unload goods onto their section's stacking spot, then stand in that section's service circle to serve from its counter. Carried goods SHALL NOT be handed directly to customers at a service circle. Drinks SHALL become an additional customer need only after unlocking, and mixed orders SHALL pay once at the final drinks counter.

#### Scenario: Stack then serve
- **WHEN** a player carries food into the service circle with an empty counter
- **THEN** no goods are delivered until the player unloads at the stack spot and returns to the middle service circle.

#### Scenario: Drinks order
- **WHEN** drinks are unlocked and a waiting customer requests one
- **THEN** the order is completed only after the requested food and drink are delivered.

### Requirement: Seated dining
Floor two SHALL sell two original console-shaped meals and wine through the same separate food and drinks stacking/service sections as takeout. Customers SHALL pay once at their final counter before moving to purchased tables to eat. This supersedes the initial waiter-delivery workflow.

#### Scenario: Complete dining cycle
- **WHEN** a worker stacks and serves a diner's food and wine at their respective section counters
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
Floor four SHALL include at least three arcade machines, waiting customers, animated play, accumulated quarters, and collection at each machine. One quarter SHALL retain an internal base value of one dollar, with actual collection applying the existing upgrades and 20% carry rule followed by the fivefold multiplier. There SHALL be no ticket economy. An unlockable VR section SHALL offer a repeatable three-lane dodge game using touch buttons or arrow keys, without a headset.

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

### Requirement: Orders of one to three items
Food customers on every floor and merchandise shoppers SHALL request one to three unlocked items per order, with repeated items allowed. Drinks SHALL count toward the limit. Workers SHALL fulfill every requested unit even when multiple carrying trips are needed. Payment SHALL occur once for the sum of all requested products after the full order is delivered. Existing queued orders and partial deliveries SHALL survive reloads.

#### Scenario: Repeated food and a drink
- **WHEN** a customer requests two controller meals and one drink
- **THEN** one stacked controller fills only one requested meal, remaining needs stay visible, and the bill is collected only after both meals and the drink have been served.

#### Scenario: Mixed shopping basket
- **WHEN** a shopper requests two souvenirs and one keychain
- **THEN** they collect all three units from their respective shelves before checkout and pay their combined price once.

#### Scenario: Drinks unlocked for a full order
- **WHEN** the drinks unlock refreshes an untouched three-item waiting order
- **THEN** a drink replaces one requested item instead of expanding the order beyond three, while partially served orders stay unchanged.

### Requirement: Spacious floors and complete navigation
All four floors SHALL expand to 28×18 playable units without scaling down characters or furniture. Wider production aisles, six more widely spaced tables, separate food/service/seating paths, clear gift shelves and separate shop waiting/checkout lanes, spaced arcade machines and VR SHALL preserve themes, existing sections and unlock progression. Collision boundaries, paths, interaction pads, customer queues, indicators and camera limits SHALL use the expanded layout. Frequently used workstation routes SHALL remain compact and all stations, unlocked sections and Elevator controls SHALL remain reachable.

#### Scenario: Full floor operation
- **WHEN** customers and employees operate on any expanded floor
- **THEN** they reach stations, queues, shelves, machines and seats without furniture collisions or blocked paths, while player and employee passing space remains available.

#### Scenario: Mobile framing
- **WHEN** the player walks between production and dining in portrait or landscape
- **THEN** the camera retains readable character scale and keeps the player and reachable controls visible across the expanded boundaries.
