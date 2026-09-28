# Basement computer

## ADDED Requirements

### Requirement: Permanent computer and app purchases
After the $200 basement unlock, a computer SHALL cost $100 once. Email SHALL cost $50 once. Boggle, Wordventure and Snake SHALL each cost $50 once. All purchases SHALL use the existing atomic funds checks, ownership and transaction protection. Displayed prices SHALL match deductions. Purchases SHALL persist across reloads, duplicate taps and interrupted animations; insufficient funds SHALL leave state unchanged. A new computer SHALL appear on a desk as an original chunky turquoise monitor with rounded dark outlines, pale blue screen and matching stand.

#### Scenario: Exact funds and permanent ownership
- **WHEN** a basement owner buys the computer with exactly $100
- **THEN** the balance becomes zero, the desk/computer appears, its desktop opens through interaction, and repeated purchase requests cannot deduct again.

### Requirement: Responsive computer desktop
The desktop SHALL present large labeled Security, Email and Game Store icon buttons with clear locked/owned states. Back to DFP SHALL remain accessible on every screen, including security and external games, and SHALL return to the basement without losing DFP progress. Portrait, landscape, keyboard focus and touch SHALL keep controls usable outside the game area.

#### Scenario: Return during an app
- **WHEN** Back to DFP is selected from email, security or an embedded game
- **THEN** the computer closes, monitoring pauses, embedded content is removed and saved purchases remain intact.

### Requirement: Security on the computer
The computer SHALL replace TV interaction as the security entry point. The TV SHALL remain a furnishing and prerequisite together with the couch and both plants. The security purchase SHALL cost $150 and display the missing-furniture checklist. Existing security ownership, encounter ids, timers and charged outcomes SHALL migrate unchanged; an existing owner SHALL never pay for security again. Computer ownership SHALL be a separate new purchase. All existing highest-floor monitoring, fixed $15/$5 outcomes, random 1–30-second waits and single ten-second robber rules SHALL remain unchanged. Leaving monitoring for another computer app SHALL pause the encounter.

#### Scenario: Existing security owner upgrades
- **WHEN** a schema-five save with security and an active encounter loads
- **THEN** money, furniture, security and remaining time are retained, new computer/apps begin unowned, and purchasing the computer exposes the already-owned security without a second security charge.

### Requirement: Fictional customer email
Unlocked Email SHALL contain selectable Good Comments and Bad Reviews categories, each with at least twenty original messages. The Email purchase preview SHALL show the current category names and total message count. A readable inbox SHALL open individual notes and provide return navigation to the inbox and categories. Messages SHALL be fictional, locally bundled and have no effect on money or progression. Existing Email owners SHALL receive the additional reviews without another purchase or changes to saved progress.

#### Scenario: Read mail offline
- **WHEN** an email owner reloads offline and opens either category
- **THEN** all messages and navigation work without network requests, rewards or penalties.

### Requirement: Game store and embedded play
The store SHALL launch only the purchased game's fixed URL: Boggle at https://lucaessey.github.io/Boggle/, Wordventure at https://lucaessey.github.io/wordventure/, and Snake at https://lucaessey.github.io/phaser-snake/. Each entry SHALL show an icon, name, $50 Buy or owned Play. Original external gameplay and graphics SHALL render in a titled framed window with loading status, Back to Computer and Back to DFP outside the game. The frame SHALL block ordinary top-level navigation and popups. It SHALL load only the three trusted URLs, permit the browser storage required by their gameplay, and preserve DFP save keys. No game message SHALL authorize DFP purchases or currency changes. Exiting or backgrounding an external game SHALL remove its active frame and audio; ownership and DFP progress SHALL remain.

#### Scenario: Unavailable game
- **WHEN** offline, a game load errors or times out, or the user reports a blank/blocked frame
- **THEN** show an understandable unavailable state with Retry and return controls while retaining ownership. Cross-origin load events SHALL NOT be described as proof of successful gameplay; actual embedding/input results and limitations SHALL be reported.

### Requirement: Versioned offline preservation
Schema six SHALL save computer, email and game ownership together with existing basement/security and gameplay data. Earlier versions SHALL migrate without replaying payments. Unknown future versions SHALL remain protected. The local basement, computer desktop, fictional email and existing security SHALL remain offline-capable; external games MAY require the internet and SHALL not be presented as bundled offline assets.

#### Scenario: Resume after disconnected play
- **WHEN** DFP reloads offline after games were purchased
- **THEN** their owned states persist, external launches explain the connection requirement, and desktop/email/security and return controls remain usable.
