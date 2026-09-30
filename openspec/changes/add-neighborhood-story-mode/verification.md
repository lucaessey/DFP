# Story Mode verification

Implemented and checked locally on September 30, 2026. Nothing was published.

## Delivered

Open **Elevator → Basement → Computer → Email → Inbox** after owning the computer and Email. Declining returns to the desktop. Accepting starts the optional story and shows Pip's original introductory email. Resume Story opens the neighborhood. Visiting DFP returns to the actual basement Inbox for the prepared challenge and local reply.

The campaign contains these required victories:

| Chapter | Exploration | Competition |
| --- | --- | --- |
| Across the Road | Crossing guard, rival front door, return to computer | Introductory food fight |
| Cook-Off | Market recipe cards, Chef Romaine | Three correct dishes |
| Lunch Rush | Park preferences, Pip's hosting advice | Seat, serve and clean three tables |
| Delivery Dash | Depot instructions, garden destination | Delivery race, food-fight checkpoint |
| Neighborhood Showdown | Meet the finalists at the Crunch Cup | Cooking, serving, delivery and final food fight |

All supplies and retries are free. Story speed is fixed, so permanent upgrades and pet bonuses are unnecessary. The equipped pet remains a visible companion. Regular actors, goods, pending receipts, production, employees and security timers are suspended in place. Story inventory and scores never pass through ordinary payment calculations. A finished competition commits its unique win before the result animation. Returning to regular play resumes the retained businesses.

Version 11 saves retain existing progress and add the story. Reloading a running competition offers a free restart of that event; earlier objectives and wins remain. A paused live session resumes its current event. The finale records all nine victories, shows the four final results, restores regular play and adds the concluding email.

## Controls

- Move with WASD, arrows, touch joystick, or hold the scene. Releasing manual input stops movement.
- Go to objective and station buttons follow a collision-safe route. E / the nearby action button interacts.
- Cooking requires the named ingredients, a matching recipe at PREP, preparation time and delivery at SERVE. Clear tray also cancels preparation and costs nothing.
- Serving requires seating, the correct meal, four seconds of eating, and cleaning afterward.
- Delivery follows Market, Garden and Park in order. Incorrect addresses and orange cart collisions add two seconds. A tied race requires a free retry.
- Food fights use tap-to-aim or Aim at rival, Throw / F, and Dodge / Space. Incoming attacks are telegraphed; throws and dodges have visible cooldowns.
- Pause and Return to Regular Play are always available. Pause overlays, global Settings, focus loss and backgrounding suspend story time.

## Actual checks

- `npm test`: **212 passed, zero failed**. Includes all prior game tests and 13 Story Mode tests. Story checks cover purchase gates, migration, isolated businesses/inventory, all objective paths, challenge prerequisites, correct recipes, serving/cleaning, wrong destinations, all nine event wins at basic strength, losses/ties/retries, interrupted saves, full campaign completion, malformed data and all outfits facing story tables correctly.
- `node tests/story-browser.mjs`: **14 passing browser check groups**, including the entire five-chapter campaign and all nine victories through the production UI; no page errors.
- `node tests/story-mobile-browser.mjs`: **9 passing browser check groups**. Exercised browser touch events, actual taps, pause/focus-loss handling, regular-play switching, interrupted-event restart, a real timeout loss and retry, 390px and 320px portrait and 844×390 landscape, and service-worker-backed offline reload/ingredient collection. No page errors. Observed 181 render calls in the sampled phone cooking scene with one equipped pet.
- `node tests/story-presentation-browser.mjs`: **5 passing check groups** for active cooking/carrying, seated eating guests, visible projectiles, different outfits, reduced motion and Settings pause; no page errors.
- Local production build passed. OpenSpec strict validation passed. The existing Vite large-chunk advisory remains; it does not prevent the build.
- Screenshots and machine-readable browser reports are in `artifacts/story/`; open its `index.html` for the local gallery.

## Limits of verification

Phone checks used Edge/Chromium device emulation and browser touch input, not physical Android or iPhone hardware. No claim is made about measured frame rate on a particular handset or native installation prompts. Existing online feedback/authentication services and embedded external games were not changed or reconfigured. The fictional story correspondence and campaign run offline. No commit, push, or deployment was performed for this request.
