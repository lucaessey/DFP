# Spec Delta

## Purpose

Let players purchase an optional eye-level perspective while preserving DFP's management mechanics and saved progress.

## ADDED Requirements

### Requirement: Permanent perspective outfit
The Outfits shop SHALL offer First-Person Explorer for exactly $1,000 with a preview, perspective description and Buy, Owned and Equipped states. Only the equipped Explorer SHALL activate first person. It SHALL confer no statistics, allow free switching and charge a purchase at most once.

#### Scenario: Purchase and switching
- **WHEN** a player buys Explorer with sufficient funds, repeats the purchase, switches outfits and reloads
- **THEN** exactly $1,000 is charged, ownership persists and only equipping Explorer changes perspective without moving the player or changing inventory

#### Scenario: Insufficient funds
- **WHEN** a player with less than $1,000 attempts purchase
- **THEN** neither balance nor ownership changes

### Requirement: Comfortable movement across game scenes
First person SHALL work on all eleven business floors, the basement lounge and implemented Story Mode scenes. Its level camera SHALL remain at eye height without bob, shake or forced turns. Horizontal movement SHALL follow camera heading independently of pitch while preserving movement speed, collision and interaction rules. The player's own model SHALL not obscure the camera.

#### Scenario: Looking while navigating
- **WHEN** the player walks while looking up or down in any supported scene
- **THEN** they move along the floor at the existing speed, cannot pass through furniture or walls, and retain usable work and story interactions

### Requirement: Mouse and simultaneous touch controls
Desktop players SHALL use WASD or arrows and explicitly enter mouse look by click. Escape SHALL release mouse look. Touch players SHALL move with the left joystick and look with a simultaneous right-side drag. Menus, buttons, typing and backgrounding SHALL suspend look and prevent lingering movement.

#### Scenario: Two-finger navigation
- **WHEN** a player holds the left joystick while dragging the right side
- **THEN** movement and look occur together without scrolling the gameplay surface or turning when pressing UI buttons

### Requirement: Clear hands and inventory presentation
First person SHALL show black mitten hands and representative carried goods at the lower corners with an exact count, keeping the central view clear from empty through maximum capacity (13). Visual presentation SHALL never change inventory, earnings or work timing. Reduced motion SHALL remove incidental hand movement.

#### Scenario: Maximum carrying capacity
- **WHEN** the player carries thirteen items
- **THEN** a compact stack and accurate quantity remain visible without a thirteen-item tower blocking the center

### Requirement: Computer and security isolation
Computer apps, email, reviews, embedded games and security footage SHALL retain existing layouts and cameras. Returning SHALL restore the same gameplay floor, position and look. Lens Buddy remote Back SHALL return directly to gameplay. These transitions SHALL stop input and never duplicate payouts.

#### Scenario: Remote security return
- **WHEN** Explorer and Lens Buddy are equipped and remote monitoring opens then closes
- **THEN** security uses its normal camera and Back restores the original first-person position and heading without opening the desktop

### Requirement: Compatible saved and offline progress
Ownership, equipment, heading and lounge position SHALL persist locally and work offline without external assets. Older saves SHALL migrate without changing existing balances, purchases, floors, outfits, pets or story progress. Pets SHALL continue following while avoiding persistent obstruction of the camera.

#### Scenario: Existing save upgrade
- **WHEN** an older valid save loads, later buys Explorer and reloads offline
- **THEN** previous progress is intact and the owned/equipped outfit and look direction are restored
