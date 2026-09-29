# People Comments

## Purpose

Let DFP players share moderated public reviews or send genuinely private producer feedback while preserving the offline game and fictional inbox.

## ADDED Requirements

### Requirement: Shared paginated player comments
Purchased Email SHALL retain its fictional categories and add clearly labeled People Comments containing actual player submissions. Everyone SHALL show published public text, exact 1–5-star rating and posting date newest first. All Stars and each exact star rating SHALL be supported with bounded indexed pagination. Add Comment SHALL remain accessible at the bottom while scrolling, clear of phone safe areas.

#### Scenario: Filter and load another page
- **WHEN** a player selects 2 Stars and loads more Everyone comments
- **THEN** only published two-star comments appear in descending order without fetching the entire collection or repeating rows.

### Requirement: Validated audience-aware submission
The form SHALL require nonblank text of at most 500 characters, an integer rating from 1 through 5, and Producer or Everyone audience, with remaining allowance, Submit and Cancel. Producer selection SHALL immediately show “Only the game’s producer will see this comment. Choose Everyone to share it with all players.” and require acknowledgement. Everyone SHALL show “This comment stays private until the producer approves it for Everyone.” The browser and Firebase rules SHALL enforce validation. Submission state SHALL accurately distinguish Sending, Published, Sent to Producer, Awaiting Review and Rejected, with an opportunity to edit rejection. Repeated taps, retries and reloads SHALL NOT duplicate a submission.

#### Scenario: Missing private acknowledgement
- **WHEN** private feedback lacks acknowledgement, text, audience or a valid rating
- **THEN** it cannot be submitted and no data is published.

#### Scenario: Retry a timed-out submission
- **WHEN** the server accepted a comment but its response was lost
- **THEN** retrying the same submission returns the existing outcome rather than creating another comment.

### Requirement: Private producer access
Producer feedback and pending submissions SHALL never appear in public feeds, rating totals, searches or ordinary-player responses. For ordinary players the Producer audience view SHALL show only the privacy explanation and a way to submit. A fourth Producer app SHALL appear only after online authorization of the authenticated, verified `lucaessey@gmail.com` owner. Inside it, separate private, public and pending views SHALL support exact star filters, mark-read, approve, reject and hide actions. Approving Producer feedback SHALL keep it private. Firebase rules SHALL enforce access independently of the UI.

#### Scenario: Anonymous or other-account access
- **WHEN** an anonymous account, unverified account or different verified email directly requests private or pending data or moderation
- **THEN** access is denied without disclosing the records.

#### Scenario: Approve private feedback
- **WHEN** the verified producer approves a pending Producer comment
- **THEN** it moves only to the private inbox and never becomes readable through public requests.

### Requirement: Verified owner sign-in
A discreet Producer Sign-in entry SHALL offer the approved Google sign-in option alongside Firebase email links for the owner. Only a Firebase-verified `lucaessey@gmail.com` identity using Google or email-link/password SHALL pass protected Firebase rules. A typed email, account hint, local flag, unverified email or different account SHALL never authorize Producer. The app SHALL verify the current account, email verification and online authorization, handle different-device confirmation, expired/reused links, failures, cooldowns and sign-out, and preserve valid sessions. Production SHALL authorize `lucaessey.github.io` with an HTTPS `/DFP/` return URL. Sign-in tokens and credentials SHALL not be logged. Private reads SHALL require online authorization; sign-out SHALL close Producer, cancel requests/subscriptions and erase private UI data.

#### Scenario: Google sign-in while email delivery is unavailable
- **WHEN** the owner chooses Sign in with Google and completes the Google account flow
- **THEN** the game verifies the same owner through Firebase and protected reads, restores the session on reload, sends no email, and preserves gameplay progress; another Google account remains denied.

#### Scenario: Google window is cancelled or blocked
- **WHEN** the sign-in window closes or the browser prevents it from opening
- **THEN** no new Producer access is granted and the UI explains how to retry; repeated taps cannot create overlapping requests.

#### Scenario: Email request accepted without confirmed delivery
- **WHEN** Firebase accepts an email-link request
- **THEN** the UI distinguishes request acceptance from inbox delivery and explains that the resend countdown only limits repeated requests.

#### Scenario: An email is typed without a verified link
- **WHEN** someone supplies the owner email but has not completed authentication
- **THEN** Producer remains hidden and private requests remain forbidden.

#### Scenario: Sign out while a private read is pending
- **WHEN** the owner signs out or goes offline before a private response arrives
- **THEN** the private view is cleared and the late response cannot restore its contents.

#### Scenario: No external moderation service
- **WHEN** Firebase is configured and no Cloudflare endpoint exists
- **THEN** players can submit privately and the verified producer can review, approve, reject, mark read and hide using protected Firebase rules.

#### Scenario: A network operation stalls
- **WHEN** authentication, submission or response parsing does not finish within the bounded wait
- **THEN** the interface restores usable controls, keeps the draft and request identifier, and permits a safe retry without duplicate email sends or publication.

### Requirement: Manual approval and reporting
Every Everyone submission SHALL remain private pending review until the verified producer approves it. Producer submissions SHALL go directly to the private inbox and SHALL never become public. The producer SHALL decide whether to approve or reject Everyone submissions; criticism and low ratings SHALL not be automatically rejected. Public comments SHALL have a report option; reports SHALL remain private for the producer and SHALL NOT let ordinary players hide or publish comments. Repeated or stale moderation actions SHALL not duplicate publication or restore hidden content.

#### Scenario: Negative feedback awaits approval
- **WHEN** a player submits one-star criticism for Everyone
- **THEN** it is accepted privately as Awaiting Review and becomes public only after producer approval.

#### Scenario: Report a published comment
- **WHEN** an ordinary player reports a public comment
- **THEN** the producer can see the report flag and decide whether to hide it; the report does not change publication automatically.

### Requirement: Protected free infrastructure
The feature SHALL use the existing `dfp-game-e2926` Firebase project and specified Realtime Database on Spark without enabling billing. Public, private, pending, receipts and internal records SHALL occupy separately protected locations; public responses SHALL omit authentication IDs, emails and moderation metadata. Ordinary players SHALL only create their own validated private submission, receipt and quota update; they SHALL NOT publish, approve, modify existing content or grant roles. Only the verified producer SHALL perform review transitions. Rules SHALL validate all fields, use server timestamps, enforce per-UID submission limits and prevent replayed requests. No administrative credential, Cloudflare service or external moderation backend SHALL be required. Existing data and game saves SHALL be preserved.

#### Scenario: Direct write bypass
- **WHEN** a player directly attempts to publish or approve a record in the database
- **THEN** the database denies it even if the player bypasses all form controls.

### Requirement: Offline preservation and truthful activation
Offline gameplay, purchases, fictional mail and existing saves SHALL remain unchanged. Offline posting SHALL explain its connection requirement and preserve unfinished drafts locally without claiming success. Any cached public reviews SHALL be labeled potentially stale. Private feedback SHALL NOT enter the public PWA cache. Local/emulator and deployed verification SHALL be reported separately; shared comments and moderation SHALL NOT be described as operational until connected and verified.

#### Scenario: Two sessions and an offline draft
- **WHEN** one online test session submits Everyone and Producer feedback and the verified producer approves the Everyone comment and a second ordinary session reads the feed
- **THEN** only the public feedback is visible to the second session, while a disconnected unfinished draft remains editable and unposted.

#### Scenario: A newer installed build is available
- **WHEN** the player checks for an update and chooses Save and update
- **THEN** the game saves current progress before activating the new worker and reloading, without deleting balances, purchases, drafts or authentication persistence.
