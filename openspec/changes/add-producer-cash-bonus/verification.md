# Producer cash verification

Checked 2026-10-15. Implementation and local testing are complete. This release includes the frontend and matching Firebase rule source. Publishing the static game does not deploy database rules; live cash claims remain unavailable until the protected rules are deployed and verified.

## Implemented

The existing verified owner sees a **Claim $1,000** card in the Producer inbox. A successful claim adds exactly $1,000 to the current saved balance and displays a five-minute countdown. It does not change sales statistics, security rewards or bonuses. Firebase rules enforce a single owner-wide 300,000 ms cooldown, independent of client clocks, reloads and devices. Claims require an internet connection and the existing verified owner identity.

Pending IDs are saved before requests, Firebase stores immutable receipts, and local payment and its receipt are saved together. A lost response can be recovered. A failed local save rolls back the in-memory grant and retains the pending request. Existing version-12 saves receive an additive default field without altering progress. Existing tab locking remains in use.

## Actual results

| Check | Result |
| --- | --- |
| `npm test` | 227 passed, 0 failed, including six new cash/receipt/migration checks. |
| `node tests/producer-bonus-rules.mjs` | Five groups passed against local Firebase. Denied unauthorized users, early/repeated/cross-device claims, forged times or amounts, partial writes, extra receipts and receipt edits. Concurrent eligible requests accepted one winner. Before-five-minute and at/after-five-minute boundaries tested with disposable server fixtures. |
| `node tests/producer-bonus-browser.mjs` | Eight groups passed, no page errors. Actual owner sign-in in Auth emulator; rapid taps, exact balance, reload, second browser, advanced client clock denial, expired server cooldown, lost write response/recovery, phone/landscape/desktop, offline reload and sign-out. |
| `node tests/people-rules.mjs` | All 13 existing comment privacy/moderation rule groups passed. |
| `node tests/people-manual-browser.mjs` | All 11 existing comment UI/session/moderation/offline groups passed with the new card. |
| `npm run build` | Production build succeeded. Existing Vite bundle-size advisory remains. |
| `npm run openspec -- validate add-producer-cash-bonus --strict` | Valid. |
| `git diff --check` | No whitespace errors. |

Release checks repeated on 2026-10-15: all 227 unit tests passed, `npm run build:pages` succeeded, strict OpenSpec validation passed, and the diff had no whitespace errors. The existing custom-domain sign-in correction remains included. The rule and browser results above were obtained earlier against this same cash implementation; they are not production checks.

Browser tests use isolated Microsoft Edge profiles and emulated touch, never the user's saved game. Screenshots and reports are local ignored artifacts under `artifacts/producer-bonus/`. Tests use `demo-dfp-comments` on loopback ports 9000/9099; no live cash claims or comments were made. Phone hardware and non-Edge browsers were not tested. Local save editing/restoring/copying is outside this offline game's trust boundary; server eligibility is protected, but this is not a cloud-authoritative wallet.

## Remaining live setup

`firebase login:list --non-interactive` still reported no authorized accounts at release time. Opening the project's Realtime Database Rules page in the available browser session again displayed a Firebase console error that the project does not exist or the account cannot list its apps. This is an access failure, not evidence that the project was deleted. No credentials, billing or project permissions were changed. The client fails closed if the rules deny a claim: it cannot award cash without a confirmed protected receipt.

1. Sign in to Firebase Console with an account authorized to manage **DFP game**, project **dfp-game-e2926**, and verify the project opens.
2. In **Build → Realtime Database → Rules**, retain a copy of the current published rules. Compare them with `firebase/database.rules.json` before replacing anything. This change adds only the `producerRewards` sibling; all existing comment rules remain unchanged. If production has unrelated newer rules, merge that sibling instead of overwriting them.
3. Publish the matching rules from `firebase/database.rules.json`. The new rules use the existing verified `lucaessey@gmail.com` owner predicate, an exact $1,000 receipt, and Firebase server time. Keep root read/write denied.
4. Alternatively, after an authorized `npx firebase login`, run `npx firebase deploy --only database --project dfp-game-e2926` from the repository, after the same production-rule comparison.
5. Publish the frontend through the normal GitHub Pages workflow when requested. Sign in to Producer, claim once, verify exactly +$1,000, then reload and check the remaining countdown. Verify another account cannot access the claim. Record these as live checks only after actually performed.

No new service or plan change is required. Keep the existing Spark project. To reproduce local browser tests, run the Auth/Database emulators, build with `--mode test-comments --outDir artifacts/producer-bonus/site`, and preview that directory on port 4188. The bundled test JRE is in `artifacts/runtime/java21/jdk-21.0.12.1+1-jre` if Java is not on PATH.
