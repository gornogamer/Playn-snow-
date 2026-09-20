# Play'n with Snow

An interactive winter wonderland mini-game experience built with **FriendSDK v0.1.2** for the **Rare Friends Vibeathon** (https://github.com/spokesz/rarefriends-vibeathon).

## Category
**Character Spotlight & Token Gameplay Experience**

## Pitch
"Play'n with Snow" invites your verified Rare Friend into a magical snowy playground: throw snowballs at moving frost targets and winter bells, sculpt and customize 3-tiered snowmen with beanies and scarves, carve shimmering snow angels, and unearth ancient frost drifts for simulated $RAREFRIENDS collectibles!

## Core Features & Mechanics
1. **Interactive Winter Landscape**:
   - 960 × 640 responsive viewport with falling snow particles, aurora borealis shimmers, and indented footprint trails.
   - Dynamic sound kit powered by `@rarefriends/friendsdk/sounds` with procedural Web Audio 8-bit motifs (`select`, `purchase`, `action-start`, `impact`, `reveal-common`, `reveal-rare`, `reveal-legendary`, `reward`).
2. **Snowball Target Range**:
   - Parabolic arc physics with particle burst collisions upon impact.
   - Interactive targets: Bullseye Target Board, Floating Frost Crystal, Golden Winter Bell, and Ice Sprite.
3. **Snowman Sculpting Yard**:
   - Roll fresh snowdrifts to expand sphere diameters across 3 tiers (Base, Torso, Head).
   - Customize with Top Hats, Winter Beanies, Golden Crowns, Carrot Noses, Twig Arms, and colorful wool scarves.
   - Place permanent decorated snowmen in the snowfield.
4. **Powder Meadow Snow Angels**:
   - Lay down in deep untouched powder and flap wings to imprint a glistening snow angel.
5. **Frost Mystery Depot (FriendSDK Chance Game)**:
   - Built on `ChanceGameDefinition` and fully compliant with FriendSDK v0.1.2 reviewable specifications:
     - Consumable: `Frost Shovel` (1.00 RF)
     - Maximum Prize: `10.00 RF` (reserved from free stake on each purchase)
     - Exact 10,000 basis points odds table:
       - **Pinecone Snowball**: 45.0% (4,500 bps) &mdash; 0.25 RF
       - **Glacial Icicle**: 28.0% (2,800 bps) &mdash; 0.50 RF
       - **Frost Crystal Star**: 15.0% (1,500 bps) &mdash; 1.25 RF
       - **Aurora Snow Globe**: 8.0% (800 bps) &mdash; 3.50 RF
       - **Golden Snow Crown**: 4.0% (400 bps) &mdash; 10.00 RF
   - Simulated RF Ledger supporting `read()`, `buy()`, `play()`, `settle()`, and `redeem()` with no expiry.

## Testing on Computer and Mobile Phone
- **Computer**:
  - `WASD` or `Arrow Keys` or `Click` to walk around the snowy world.
  - `Spacebar` to throw a snowball in the facing direction or towards mouse pointer.
  - `F` or `Enter` or click on glowing station signposts to enter activities.
- **Mobile Phone / Tablet**:
  - Responsive layout dynamically adapts to screen sizes.
  - On-screen virtual joystick for 360-degree analog thumb movement.
  - Dedicated "Throw Snowball" and "Interact" touch buttons.

## FriendSDK Integration
- `createFriendReader().read(friendId)` decodes authentic canonical 16×16 Generation 1 sprites (Mask, Cellular, Family, etc.) with walking frame cycles.
- `createFriendSoundKit()` provides zero-latency procedural Web Audio sound synthesis with no external MP3 dependencies.
- `defineChanceGame()` and `createGamePreview()` manage the verified chance game lifecycle.
