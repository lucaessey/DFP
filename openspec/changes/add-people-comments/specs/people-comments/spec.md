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
The form SHALL require nonblank text of at most 500 characters, an integer rating from 1 through 5, and Producer or Everyone audience, with remaining allowance, Submit and Cancel. Producer selection SHALL immediately show “Only the game’s producer will see this comment. Choose Everyone to share it with all players.” and require acknowledgement. Everyone SHALL show “This comment will be visible to all players after it passes the language check.” Browser and trusted backend SHALL enforce validation. Submission state SHALL accurately distinguish Sending, Published, Sent to Producer, Awaiting Review and Rejected, with an opportunity to edit rejection. Repeated taps, retries and reloads SHALL NOT duplicate a submission.

#### Scenario: Missing private acknowledgement
- **WHEN** private feedback lacks acknowledgement, text, audience or a valid rating
- **THEN** it cannot be submitted and no data is published.

#### Scenario: Retry a timed-out submission
- **WHEN** the server accepted a comment but its response was lost
- **THEN** retrying the same submission returns the existing outcome rather than creating another comment.

### Requirement: Private producer access
Producer feedback and pending submissions SHALL never appear in public feeds, rating totals, searches or ordinary-player responses. For ordinary players the Producer audience view SHALL show only the privacy explanation and a way to submit. A fourth Producer app SHALL appear only after online authorization of the authenticated, verified `lucaessey@gmail.com` owner. Inside it, separate private, public and pending views SHALL support exact star filters, mark-read, approve, reject and hide actions. Approving Producer feedback SHALL keep it private. Rules and trusted endpoints SHALL enforce access independently of the UI.

#### Scenario: Anonymous or other-account access
- **WHEN** an anonymous account, unverified account or different verified email directly requests private or pending data or moderation
- **THEN** access is denied without disclosing the records.

#### Scenario: Approve private feedback
- **WHEN** the verified producer approves a pending Producer comment
- **THEN** it moves only to the private inbox and never becomes readable through public requests.

### Requirement: Verified owner sign-in
A discreet Producer Sign-in entry SHALL offer the approved Google sign-in option alongside Firebase email links for the owner. Only a Firebase-verified `lucaessey@gmail.com` identity using Google or email-link/password SHALL pass protected rules and backend checks. A typed email, account hint, local flag, unverified email or different account SHALL never authorize Producer. The app SHALL verify the current account, email verification and online authorization, handle different-device confirmation, expired/reused links, failures, cooldowns and sign-out, and preserve valid sessions. Production SHALL authorize `lucaessey.github.io` with an HTTPS `/DFP/` return URL. Sign-in tokens and credentials SHALL not be logged. Private reads SHALL require online authorization; sign-out SHALL close Producer, cancel requests/subscriptions and erase private UI data.

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

#### Scenario: Moderation endpoint is not connected
- **WHEN** Firebase is configured but the comments backend has not been activated
- **THEN** the owner can still request and complete Firebase email-link authentication and open only inboxes authorized by Firebase rules; submissions and moderation actions clearly report their unavailable service and do not pretend to succeed.

#### Scenario: A network operation stalls
- **WHEN** authentication, submission or response parsing does not finish within the bounded wait
- **THEN** the interface restores usable controls, keeps the draft and request identifier, and permits a safe retry without duplicate email sends or publication.

### Requirement: Trusted moderation and reporting
Both audiences SHALL use identical trusted language checks for profanity, slurs, harassment, threats and inappropriate sexual language, including common disguised spelling. Clearly appropriate feedback SHALL proceed automatically to its chosen audience; clear violations SHALL be rejected with a brief explanation; uncertain or unavailable moderation SHALL remain private pending review. Ordinary criticism and low ratings SHALL be allowed. Public comments SHALL have a report option and explain that automatic checks are imperfect. Moderation retries SHALL not duplicate publication or restore hidden content.

#### Scenario: Negative feedback without abuse
- **WHEN** a player submits appropriate critical feedback with one star
- **THEN** its rating and criticism do not themselves cause rejection.

#### Scenario: Uncertain content or unavailable checks
- **WHEN** the trusted check cannot confidently allow or reject a submission
- **THEN** it is held privately for the producer with no public copy.

### Requirement: Protected free infrastructure
The feature SHALL use the existing `dfp-game-e2926` Firebase project and specified Realtime Database on Spark without enabling billing. Public, private, pending and internal abuse metadata SHALL occupy separately protected locations; public responses SHALL omit authentication IDs, emails and moderation metadata. Browser clients SHALL NOT directly publish, approve, edit others' comments or grant roles. Trusted writes SHALL validate all fields, use server timestamps, limit spam and bind idempotency to the authenticated author. Privileged service credentials SHALL exist only in server-side secrets. Existing rules and data SHALL be reviewed and preserved. Without an existing trusted backend, a Workers Free implementation SHALL be prepared; activation prerequisites SHALL be reported honestly.

#### Scenario: Direct write bypass
- **WHEN** a player directly attempts to publish or approve a record in the database
- **THEN** the database denies it even if the player bypasses all form controls.

### Requirement: Offline preservation and truthful activation
Offline gameplay, purchases, fictional mail and existing saves SHALL remain unchanged. Offline posting SHALL explain its connection requirement and preserve unfinished drafts locally without claiming success. Any cached public reviews SHALL be labeled potentially stale. Private feedback SHALL NOT enter the public PWA cache. Local/emulator and deployed verification SHALL be reported separately; shared comments and moderation SHALL NOT be described as operational until connected and verified.

#### Scenario: Two sessions and an offline draft
- **WHEN** one online test session posts public and private feedback and a second ordinary session reads the feed
- **THEN** only the public feedback is visible to the second session, while a disconnected unfinished draft remains editable and unposted.

#### Scenario: A newer installed build is available
- **WHEN** the player checks for an update and chooses Save and update
- **THEN** the game saves current progress before activating the new worker and reloading, without deleting balances, purchases, drafts or authentication persistence.
