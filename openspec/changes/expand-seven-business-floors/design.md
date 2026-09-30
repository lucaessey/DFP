# Design

## Context

The released game uses four data-driven layouts but has four-floor branches in simulation, saves, security and presentation. Saves are version 9. Ordinary earnings already include a 5× multiplier and a 20% boost, plus separate permanent and equipped-pet bonuses. Existing costs and fixed security amounts must remain intact. See proposal.md for motivation.

## Goals / Non-Goals

Implement distinct businesses using the current fixed-step simulation and procedural 3D renderer. Reuse navigation, employee jobs, counter inventory, upgrades and receipt settlement. Keep all feature assets bundled for offline play. No online service, publishing, new currency, billing or offline earnings.

## Decisions

### Price table (approved implementation baseline, recorded before code)

Amounts are purchase costs in dollars. Existing floors and purchases are unchanged. All new equipment starts locked. Shared serving/stocking counters, bins, seating guidance and free repairs are included with the relevant floor/equipment.

| Floor | Unlock | Equipment purchases | Paid section | Five hires (in order) |
|---|---:|---|---|---|
| 5 Pixel Dessert Shop | 5,000 | Waffle iron 400; Ice cream freezer 500; Cake oven 650 | Milkshake Section 1,400 | 440 / 505 / 570 / 635 / 700 |
| 6 Gaming Movie Theater | 8,000 | Ticket booth and standard screen 600; Popcorn stand 450 | VIP Theater 2,200 | 525 / 590 / 655 / 720 / 785 |
| 7 Robot Kitchen | 12,000 | Ingredient supply and robot cooker 900 | Robot Charging Station 3,000 | 610 / 675 / 740 / 805 / 870 |
| 8 Rooftop Restaurant | 18,000 | Terrace kitchen 1,100 | Smoothie Bar 4,000 | 695 / 760 / 825 / 890 / 955 |
| 9 Esports Arena | 26,000 | Admission desk and gaming PCs 1,400; Snack stand 650 | Tournament Stage 5,500 | 780 / 845 / 910 / 975 / 1,040 |
| 10 Pixel Pet Café | 36,000 | Café kitchen 1,000; Treat station and water bowls 600 | Pet Playground 7,000 | 865 / 930 / 995 / 1,060 / 1,125 |
| 11 DFP Factory | 50,000 | Ingredient supply and processor 1,500; Packing and delivery stations 1,200 | Conveyor Belts 9,000 | 950 / 1,015 / 1,080 / 1,145 / 1,210 |

Six seating places per hospitality floor use the existing table-price formula: round(round((60 + zero-based floor×40 + seat index×55)/3)/2). Factory has no customer tables. Rooftop umbrellas cost **300 each**, permanently attached to one purchased table. Standard/VIP seats and gaming desks require purchasing their seating place; VIP/stage enables premium service at the last three places. Seat prices by floor:

| Floor | Places 1–6 |
|---|---|
| 5 | 37 / 46 / 55 / 64 / 74 / 83 |
| 6 | 44 / 53 / 62 / 71 / 80 / 89 |
| 7 | 50 / 59 / 69 / 78 / 87 / 96 |
| 8 | 57 / 66 / 75 / 84 / 94 / 103 |
| 9 | 64 / 73 / 82 / 91 / 100 / 109 |
| 10 | 70 / 79 / 89 / 98 / 107 / 116 |

Personal upgrades cost `90 + floor×30 + previous purchases×65` (zero-based floor), five total purchases per floor; employee upgrades remain `70 + category level×70`, three per category. Transfers remain free with a twelve-employee assignment cap.

| Floor | Personal purchases 1–5 (shared across all three skills) |
|---|---|
| 5 | 210 / 275 / 340 / 405 / 470 |
| 6 | 240 / 305 / 370 / 435 / 500 |
| 7 | 270 / 335 / 400 / 465 / 530 |
| 8 | 300 / 365 / 430 / 495 / 560 |
| 9 | 330 / 395 / 460 / 525 / 590 |
| 10 | 360 / 425 / 490 / 555 / 620 |
| 11 | 390 / 455 / 520 / 585 / 650 |

Employee purchases are **70 / 140 / 210** independently in each category. These are explicit evaluations of the existing formulas, not additional price increases.

| Earning event | Base amount | Long-run unupgraded average (existing 5× and 20%) |
|---|---:|---:|
| Controller waffle / pixel ice cream / console cake / milkshake | 5 / 6 / 9 / 8 | 30 / 36 / 54 / 48 |
| Standard ticket / VIP ticket / popcorn | 8 / 16 / 5 | 48 / 96 / 30 |
| Robot meal | 12 | 72 |
| Terrace meal / smoothie | 14 / 9 | 84 / 54 |
| Esports entry / stage entry / esports snack | 14 / 28 / 7 | 84 / 168 / 42 |
| Café meal / pet treat / playground visit | 12 / 5 / 9 | 72 / 30 / 54 |
| Factory delivery (three snacks per sealed box) | 30 | 180 |

Actual receipts retain the released whole-dollar rounding and fractional boost carry, so a single receipt can be below or above that long-run average; the shop previews the next actual payout. Receipt settlement uses the existing economy function once, preserving actor and equipped-pet relative effects. Tickets/admissions, optional concessions, playground visits and deliveries have distinct persisted receipts. Animations never mint money or goods.

### Business simulation

Use a dedicated expansion module with hooks into existing receipt settlement, inventory transfer, actor speed/capacity and event feedback. Common counter service remains for dessert and robot meals. Table-service floors reserve seats before arrival, receive carried orders at the table, eat, pay, then become dirty. Special sessions have explicit admission, ushering, optional snack, running, departure and cleanup states. Staff uses the same station interactions as players, including maintenance and ingredient movement. No unreachable jobs are assigned behind locked sections.

- Dessert: separate irons/freezer/oven, existing carry/stack/serve loop. Each carried ice cream has a 30-active-second deadline. Stocked cold goods stop melting; warning begins at 10 seconds remaining. Melted goods disappear with feedback; guests retain fulfillable orders. Carry timers accompany inventory safely through switching and saves.
- Theater: ticket booth admits one waiting guest only when a clean purchased seat is available. Usher interaction starts travel to the reserved seat. Optional popcorn is delivered separately, paid once on delivery. A 14-second original movie starts when seated; guests then leave and the seat/spill must be cleaned. Last three places yield VIP tickets after purchase; standard seats remain useful.
- Robots: carry ingredients from supply to a robot cooker. One ingredient yields one meal after 4 seconds. After each batch, a deterministic occasional fault stops production; free repair takes one ordinary station action. Charging reduces cooking to 2.5 seconds and fault frequency from every fourth to every eighth batch. Supply, finished stock and faults persist.
- Rooftop: reserve, seat, carry meals/smoothies to tables, collect completed meal payment, clean. Weather cycles 35 seconds clear, 5-second warning, 15 seconds rain. Uncovered guests eat at half speed in rain (no impossible orders or lost payment); covered tables eat normally. Only this floor rains.
- Esports: admission and ushering parallel theater. Sessions last 16 active seconds, or 24 for the larger Stage competition; one mid-session computer fault must be repaired without cost. Snack delivery pays separately. Stage admission doubles for the last three purchased desks after unlock. Reset dirty desks before reuse.
- Pet café: guest meals and optional purchased treats are delivered to the table; water bowls have a three-use supply and can be refilled freely. Guests wait for water before completing their meal. Every departing party leaves table dirt and paw prints removed together. Playground is a six-second optional visit with its own receipt. Customer animals follow their guest and have no collectible-pet effects.
- Factory: carry ingredient → input processor → 3-second processing → carry snack → packing hopper → seal every three snacks → carry sealed box → cart → 4-second departure → one delivery receipt. Belts move at most one actual finished snack to packing every two seconds; input, hopper and stock have capacity limits. Belts do not supply free ingredients or load/seal boxes. Factory employees perform the same input, packing, sealing and delivery interactions.

### Layout and presentation

Keep the spacious 28×18 world and camera scale. Production on the left rear, serving/packing in the left middle, six well-spaced hospitality places on the right, clear bottom elevator/entrance route. Milkshakes/smoothies occupy separately colored top-right production strips with separate stock/service pads. Use existing navigation obstacles, safe pads and customer routes. Add original procedural props (desserts, projectors, seats/screens, robots, terrace skyline/umbrellas, computers, pet bowls/playground, factory belts/crates/cart), plus activity-linked moving parts. Only the current/security-monitored floor builds and animates its scene.

### Integration and persistence

Derive all active floor/roster limits from configuration. Save version 10 appends seven fresh locked floor records to legacy four-floor saves; add new inventory keys without changing old values. Persist per-floor activity and receipt identifiers, timers, faults, water, umbrella purchases and factory inventory. Validate bounded numbers, states, item types and customer/seat ownership before loading. Use existing safe-position migration for changed geometry. Retain existing original floor names. Basement is first, followed by all eleven floors in a scrollable list. No bottom tab is removed.

Player speed/carry/profit bonuses work everywhere. Preparation pets speed direct preparation, robot/factory loading and packing work; they do not accelerate independent weather or entertainment timers. Cash pets collect earned table/counter/delivery receipts within their advertised range; service pets transfer one already-made order item (stacked at existing counters, or in the player’s hands for new seated guests); cleaning pets reset nearby dirty places. Existing radii/cooldowns remain. Fixed security rewards/penalties never use pet ordinary-profit multipliers. Lens Buddy retains the latest explicit $5,555/+5 configuration unless the pending clarification changes it.

## Risks / Trade-offs

- Large cross-system migration → fixture old saves and compare every original floor/purchase, balance, employee and pet before/after load.
- Simultaneous actors → consume inventory synchronously, reserve seats before ushering, settle guarded receipts; animation reads state only.
- NPC congestion → validate all pads, seat approaches and exit routes and inspect every floor in a running mobile viewport.
- Hidden-floor performance → fixed-step records continue existing employee simulation; meshes and visual effects only on visible floor.
- Browser offline updates → bundle procedural assets; test production service worker with a fresh isolated profile, preserving actual user storage.

## Migration Plan

Build and verify locally. Publish only in a later user-authorized request. Version 10 loading is forward-only; retain a backup of the prior serialized save during migration. Existing PWA activation must not clear gameplay storage. Do not roll back code over a new-format save without its retained backup.
