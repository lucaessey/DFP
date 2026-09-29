# Design

## Context

DFP uses deterministic fixed-step simulation, one payment quote/collection path, version-6 checksum saves with backups, grid navigation, procedural Three.js models, a separate stationary basement lounge and four bottom tabs. The PWA build precaches bundled assets. Main specs are not yet archived. See proposal.md for motivation.

## Goals / Non-Goals

Goals: one data-driven catalogue shared by UI, simulation, previews and tests; durable purchases; exact bounded abilities; one visible companion and one animated shop preview; no change to existing upgrade records.

Non-goals: breeding, consumables, employee pet teams, online ownership or earnings while closed.

## Decisions

- Version 7 adds owned IDs, equipped ID, shared ability cooldowns and fractional income carry. Version 6 migrates with no pets and no balance change. Visual follower position is transient and rebuilt at a safe nearby point, avoiding malformed saved paths. Capacity switching preserves cargo; pickup waits until below the new limit.
- Speed multiplies upgraded player speed. Capacity adds slots. Income adds the listed percentage to the existing final ordinary player payout once, retaining fractional dollars for later eligible sales. Employees, VR, security, minigames and existing money are excluded. Quotes are side-effect-free; collection updates both carries atomically.
- Prep increases player work rate only at food/drink production stations. The same rate increases an active floor-1 fryer only while the player is within 3 world units and actively playing that floor. Staff work rates are unchanged.
- Cash collects one completed payment (food counters/gift checkout) or one earned arcade coin pile per cooldown. Serve transfers one already-stacked food/drink item to the first correctly positioned customer; it does not create stock or pay. Clean clears one dirty, unoccupied purchased table. All helpers require a walkable approach within the listed radius of the player, current floor, unlocked station, active gameplay and no active VR game. Helpers cannot act in menus, the basement, background or offline closed app. Cooldowns survive saves and are shared across pet switches; unequipping does not reset them.
- Use a separate collision-aware visual follower, about 1.1–1.8 units away; grid paths with clearance derived from each model around furniture, local crowd avoidance, catch-up speed and safe relocation after 3 seconds stuck or 9 units behind. Prefer a visible side position over resting behind the player's screen silhouette. The basement places the same pet beside the stationary lounge player. Visual animation never pays, transfers inventory or changes cooldowns.
- Shared low-poly geometry/materials build 30 distinct species. One shop renderer makes cached still thumbnails then animates the selected model only. World and lounge lazily show only the equipped model; no online model downloads.
- All pets can be purchased from the beginning. Locked means insufficient funds (or the existing $50 first-food reserve); no additional floor gates. The shop explains floor-specific helper applicability.

## Full collection designed before implementation

Speed, carry and income affect the player only. Prep means increased work rate, not a percentage cut in duration. Helper notation is radius / cooldown; one task per activation. Units match the game's world grid. Each model has a distinct silhouette and colour palette.

| Pet | Appearance / motion | Price | Exact abilities |
|---|---|---:|---|
| Crumb Chick | Yellow chick, orange beak, waddle | $20 | Speed +5% |
| Mochi Bunny | Cream rabbit, long pink ears, hop | $35 | Carry +1 |
| Biscuit Cat | Peach cat, pointed ears and curled tail, walk | $50 | Ordinary income +5% |
| Pepper Pup | Brown floppy-eared dog, walk | $70 | Speed +8% |
| Pesto Turtle | Green domed shell, tiny feet, waddle | $90 | Prep rate +10% |
| Prickle | Plum hedgehog with cream spikes, scurry | $120 | Carry +1; speed +5% |
| Lime Hopper | Lime frog with high eyes, hop | $150 | Speed +12% |
| Cheddar Mouse | Gold mouse, round ears and pink tail, scurry | $180 | Cash 2 units / 12s |
| Sprinkles Penguin | Blue penguin, white belly and flippers, waddle | $220 | Prep rate +15%; income +5% |
| Ember Fox | Orange fox, large cream-tipped tail, walk | $260 | Speed +15%; carry +1 |
| Pixel Slime | Mint stepped jelly blob, bounce | $300 | Carry +2 |
| Honey Byte | Gold striped bee with wings and antennae, float | $350 | Prep rate +20% |
| Bubble Otter | Teal otter, whiskers and paddle tail, walk | $400 | Clean 2.5 units / 18s |
| Bao Panda | White panda, black patches and round ears, waddle | $450 | Carry +2; income +8% |
| Bolt Hound | Turquoise robot dog, antenna and visor, trot | $500 | Cash 2.5 units / 10s; speed +10% |
| Plum Bat | Purple bat, scalloped wings, float | $575 | Speed +18%; prep rate +15% |
| Inky Octo | Coral octopus, eight curling arms, bob | $650 | Serve 2.5 units / 14s |
| Bandit Raccoon | Grey raccoon, mask and ringed tail, walk | $725 | Cash 3 units / 8s; income +10% |
| Joypad Pal | Violet controller creature, buttons and handles, roll | $800 | Carry +2; prep rate +20% |
| Noodle Axolotl | Pink axolotl with coral gills, wiggle | $875 | Clean 3 units / 14s; speed +12% |
| Toast Dragon | Orange dragon, horns, wings and spiked tail, hop | $950 | Prep rate +30%; income +12% |
| Neon Jelly | Cyan jellyfish, lilac trailing tentacles, float | $1,050 | Cash 3.5 units / 8s; carry +2 |
| Captain Crab | Red crab, broad claws and six legs, scuttle | $1,150 | Serve 3 units / 12s; carry +1 |
| Sugarcorn | Lilac unicorn, gold horn and rainbow mane, trot | $1,250 | Speed +25%; income +15% |
| Pickle Rex | Green dinosaur, big snout and dorsal plates, stomp | $1,350 | Carry +3; prep rate +25% |
| Orbit Owl | Indigo owl, gold eye discs and short wings, float | $1,450 | Serve 3 units / 10s; clean 3 units / 16s |
| Nimbus Puff | White cloud, blue droplets and rainbow tail, float | $1,550 | Speed +25%; cash 3.5 units / 6s |
| Star Manta | Midnight ray, broad starry fins and long tail, glide | $1,700 | Income +20%; serve 3.5 units / 10s |
| Saffron Phoenix | Gold firebird with coral crest and fan tail, float | $1,850 | Prep rate +35%; clean 3.5 units / 10s; speed +15% |
| Cosmic Whale | Lavender whale, star crown and wide flukes, float | $2,000 | Carry +3; income +25%; cash 4 units / 6s |

## Risks / Trade-offs

- Extra draw calls → shared primitive meshes, bounded parts, cached shop images and one selected animation; inspect diagnostics on phone.
- Helpers bypass normal jobs → require real existing stock/payment/dirty state, use the same receipt guard, one unit/task and persisted cooldowns.
- Capacity reduction loses goods → retain bag contents and allow only unloading until below the new capacity; validate up to the maximum 11 slots.
- Old clients overwrite pet saves → increment save version so older builds preserve future saves instead of overwriting them.
- Visual crowd/path recovery → companions are non-solid to actors, avoid furniture and people, and settle/reposition safely when recovery is necessary.

## Migration Plan

Run the existing v1–v6 migrations then add empty pets and version 7. Do not change balances, paid receipts, purchases, upgrades or employees. Keep checksum and backup behavior. Bundle the catalogue/models with the PWA. Verify old-save migration and offline reload. Rollback requires preserving version-7 saves for the newer client; never downgrade them destructively.
