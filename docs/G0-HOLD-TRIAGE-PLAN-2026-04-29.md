# G0 Hold Triage Plan - 2026-04-29

## Evidence

```text
+=======================================================================+
|| G0 Human Capture                                                     ||
+=======================================================================+
|| capture path | qa_logs/session_captures/2026-04-29T23-39-22-983Z-... ||
|| duration     | 296056ms, about 4:56                                  ||
|| start zone   | moss-hollow                                           ||
|| end zone     | sun-court                                             ||
|| butterflies  | 28                                                    ||
|| flowers      | 183 -> 186                                            ||
|| runtime      | no page errors, no console errors                     ||
|| verdict      | G0 hold                                               ||
+=======================================================================+
```

Capture summary:

- `83` `navigation/focus-zone` events happened during the short run.
- Sprite cache telemetry reported `spriteCache: 0/0`, so the capture did not prove the high-fidelity baked sprite path was active.
- Flowers increased from `183` to `186` during the run, and the capture/player report says visible flower stacking is still happening.
- Feed/social UI was open during the later portion of the run, and the player reported stale warning-flavored lines plus broken filter behavior.
- Player visual report also names: butterflies pushing toward the top edge, butterflies visibly vibrating/jittering, butterfly art still below the original high-resolution sprite clarity, and the new field reading as an unexplained green rectangle instead of a clear place to play.

Visual/spatial audit evidence:

- Screenshot folder: `qa_screenshots/g0_visual_spatial_audit_2026_04_29/`.
- `03-focused-after-dismiss.png` confirms focused play currently shows a large rectangular field, a centered old-style diamond zone overlay, and no visible board-unit grid.
- Runtime geometry for the same screenshot:
  - render mode: `sim-board`
  - focused zone: `ivy-cloister` / `Open Land NW`
  - board projection: origin `(40, 96)`, size `36 x 22` units, `ppu = 20`, `groundT = 0.56`, `hStep = 8`
  - projected field rect: `x 40..760`, `y 96..342.4`
  - placement region: `x 28..772`, `y 108..396`
  - guide default: `false`
  - butterfly sample: all sampled butterflies had `boardPos.h = 0`
- Source contradictions:
  - `core/renderManager.js` `drawSimBoardGround()` draws a full canvas fill plus a hard inner rectangle.
  - `core/renderManager.js` `drawUILayer()` still calls `drawZoneWorldOverlay()` during normal focused play.
  - `core/renderManager.js` `drawZoneWorldOverlay()` uses legacy `gridManager.isoToScreen(zone.bounds)` diamond polygons when not in section-scene overview.
  - `systems/zoneSystem.js` creates board configs for all zones with the same focused-board origin by default, which is usable for focused-zone rendering but not enough for a true zoomed unified board.
  - `entities/butterfly.js` still moves through legacy `gridPos` targets, while render sorting derives `boardPos` from screen after the fact. This is a likely source of visible mismatch/jitter.
  - `entities/block.js` has `boardPos.h` and visual lift, but placement remains screen-point based; exact integer unit occupancy is not yet the placement truth.

## Blocker Shape

```text
G0 hold
|- B1 forced camera/zone switching
|- B2 sim-board field reads as a small unexplained rectangle instead of the whole play field
|- B3 legacy zone overlays still draw over focused sim-board
|- B4 movement targets push butterflies toward the top edge
|- B5 butterflies sometimes vibrate/jitter instead of settling into stable motion
|- B6 butterfly sprite fidelity is below the original art
|- B7 flowers stack visually and old saves carry too many readable flowers
|- B8 flowers have no decay / cleanup / reserve-food loop yet
|- B9 blocks need exact one-unit grid placement and no overlap ambiguity
|- B10 backgrounds do not communicate the actual movement envelope
|- B11 legacy exit points still matter too much for travel
|- B12 there is no visible grid/unit system in normal focused play
|- B13 butterfly altitude/up-down position is not visually legible
|- B14 focused-zone highlight map uses old centered geometry instead of real board size
|- B15 feed/filter controls do not behave correctly
`- B16 talking exists, but does not feel like real social behavior
```

## Target Shape

```text
single habitat board
+---------------------------------------------------------------+
| Open Land NW                         | Training Grounds       |
| building + habitation                | practice / no blocks   |
|                                      |                        |
|                                      |                        |
|--------------------------------------+------------------------|
| Open Land SW                         | Open Land SE           |
| building + habitation                | building + habitation  |
|                                      |                        |
|                                      |                        |
+---------------------------------------------------------------+

camera truth
|- Next Zone buttons jump the camera/focus only when the player chooses them
|- zoom out can show the whole habitat board
|- ambient butterfly travel never hijacks the camera
|- grid overlay is optional readability/debug help, not the world itself
`- top movement limit protects the UI band

unit truth
|- 1 block = 1 board unit = 1 support/stack unit
|- block placement snaps to integer { zoneId, u, v, h }
|- one solid block may occupy a cell
`- projection can change visually, but unit ownership does not

movement truth
|- background shows the playable movement envelope
|- butterflies may move anywhere inside that envelope
|- exits happen by reaching the correct outer map border
`- old doorway/exit anchor points are no longer primary travel truth

height truth
|- board `h` means vertical board height
|- blocks visibly occupy integer `h` stack levels
|- butterflies need a visible altitude/flight cue if they can fly above ground
`- shadows stay on the ground plane so up/down movement is readable
```

## Phase Order

### H-1 - Zone Meaning Correction

Goal: keep the habitat concept simple and aligned with the intended layout.

```text
zone truth
|- top left     -> Open Land NW
|- top right    -> Training Grounds
|- bottom left  -> Open Land SW
`- bottom right -> Open Land SE
```

Training Grounds should not receive ambient block spawns. The other three zones are open land for building and habitation.

Status:

- Ambient/debug refresh block spawning is now disabled for Training Grounds.
- Existing loaded saves run a readability cleanup on normal load that removes non-carried blocks from no-block zones and reduces visibly stacked readable flowers without wiping the save.

### H0 - Lock This Capture As A Hold

Goal: preserve this as the acceptance evidence that reopens the next work.

Tasks:

- Keep `docs/STAGE-A-G0-SIGNOFF-2026-04-29.md` marked `Stage A held`.
- Do not restart the save to hide these symptoms.
- Use this capture as the regression fixture for the next work.

Acceptance:

- The hold is documented.
- Every fix below points to one named symptom, not a broad rebuild.

### H1 - Stop Forced Focus Switching

Goal: ambient butterfly travel must never move the player's camera/focused zone.

Evidence:

- Capture logged `83` focus-zone changes in under five minutes.
- Code path: `core/gameCore.js` `updateSimBoardZoneTraveler()` calls `focusZone(zoneTravel.targetZoneId)` when a traveler crosses zones and the current focus matches the source zone.

Plan:

- Add a `zoneTravel.focusOnCross` or `zoneTravel.cameraFollow` flag.
- Default it to `false` for ambient migration and autonomous habitat travel.
- Allow it only for explicit player/UI travel actions if we still want that behavior.
- Add a focused audit that starts ambient zone travel and asserts `gameState.focusedZoneId` does not change without a player action.

Acceptance:

- A five-minute capture does not change focused zone unless the player clicks/chooses a zone.
- Ambient butterflies may leave/arrive, but the camera stays put.

### H2 - Rework Focused Sim-Board Presentation

Goal: the focused garden should read as one intentional play field with a clear movement envelope, not a green rectangle inside a green background.

Current issue:

- `renderManager.drawSimBoardGround()` fills the whole canvas green, then draws a separate ground rectangle from the board projection.
- Player read: the rectangle is confusing, and butterflies/objects do not appear constrained to it.
- Zone backgrounds do not currently explain where butterflies can actually move.

Plan:

- Convert focused sim-board ground into a full-screen or nearly full-screen play field.
- Reserve a top UI-safe band so the playable field does not creep behind or into the interface.
- Preserve the current approximate top limit unless the UI layout changes; do not expand the field upward into the top controls.
- Draw the movement envelope clearly: the visible ground should match where butterflies, flowers, blocks, and edge exits are allowed to exist.
- Avoid a decorative inner rectangle unless it is the actual movement boundary.
- Add a normal-play subtle board/grid overlay, with grid cells aligned to board units and a stronger debug overlay available separately.
- Make the background communicate the same unit system used by movement and blocks: cell spacing, border, and travel edge should agree.
- Keep block size equal to one board unit, but allow visual scaling to follow the revised board projection.

Acceptance:

- In focused mode, there is no unexplained inner rectangle.
- The visible play field matches where butterflies, flowers, blocks, and travel actually happen.
- The upper boundary clearly stops below the UI and does not invite movement into UI space.
- A subtle grid is visible enough to understand one-unit spacing, but light enough not to dominate the art.

### H2.1 - One Spatial Overlay Rule

Goal: focused play should show one board contract, not both the sim-board field and the legacy isometric zone polygon.

Evidence:

- `drawUILayer()` calls `drawZoneWorldOverlay()` during normal focused play.
- In sim-board mode, `drawZoneWorldOverlay()` is not the overview card map; it draws a centered diamond using legacy `zone.bounds`.
- Player read: the highlighted map sits awkwardly in the middle and does not reflect the real playable size.

Plan:

- In `sim-board` + `focused-garden`, suppress legacy `drawZoneWorldOverlay()` entirely.
- Replace it with a sim-board-native optional overlay:
  - movement envelope border
  - board-unit grid
  - legal exit edges
  - selected/focused zone label in UI chrome, not on top of the play field
- Keep the section-card overview only when the player explicitly opens overview/zoom-out.

Acceptance:

- No centered diamond label/outline appears during focused sim-board play.
- Any visible map/highlight matches the actual projected board rectangle/envelope.
- Zone identity remains visible through the top label/chip or overview, not by obscuring the field.

### H2.2 - Visible Height / Flight Layer Cue

Goal: players should be able to tell whether a butterfly is on/near the ground or flying above it.

Evidence:

- `boardToScreen()` supports height through `hStep`, and blocks use stack height/lift.
- Sampled butterflies in the audit all had `boardPos.h = 0`, and there is no dedicated altitude visual cue.
- Butterfly `y` and `shadowOffset` imply flight visually, but the board state does not communicate up/down in the 3D-backed space.

Plan:

- Decide the butterfly height contract:
  - `boardPos.h = 0` means ground-contact/shadow plane.
  - `flightH` or an equivalent transient visual altitude may lift the sprite while the shadow remains on the ground.
  - durable occupancy remains ground/board truth unless a future flight-occupancy rule is opened.
- Render altitude with:
  - ground shadow anchored to board `u/v`
  - sprite lifted by altitude
  - optional faint vertical tether/debug marker when grid overlay is enabled
  - slight scale/alpha cue for higher flight if it reads well
- Add an altitude probe showing low/medium/high butterfly flight over the same board cell.

Acceptance:

- The player can tell a high-flying butterfly from one near the ground.
- Height cues do not make sprites look blurry or detached from their shadow.
- Sort order still uses board position plus height consistently.

### H2.5 - Replace Legacy Exit Anchors With Border Exits

Goal: movement between zones should use the outer edges of the visible movement envelope, not old preserved doorway points.

Plan:

- Define each zone's legal exit edges from its quadrant relation:
  - Open Land NW can exit east toward Training Grounds and south toward Open Land SW.
  - Training Grounds can exit west toward Open Land NW and south toward Open Land SE.
  - Open Land SW can exit north toward Open Land NW and east toward Open Land SE.
  - Open Land SE can exit north toward Training Grounds and west toward Open Land SW.
- For each travel intent, choose a target along the correct outer border of the current movement envelope.
- Keep old doorway/arrival anchor points only as migration compatibility hints if needed; do not let them visually or mathematically constrain normal travel.
- Arrival should place the butterfly just inside the opposite border, then hand control back to normal wander/social movement without pushing upward.
- Add an edge-travel audit that records source zone, target zone, exit edge, exit point, arrival edge, arrival point, and whether the camera focus changed.

Acceptance:

- Butterflies travel by flying to the actual right/left/top/bottom map border for that transition.
- No visible travel path aims for an invisible old doorway point.
- Arrival points are inside the movement envelope and do not cause jitter or top-edge pressure.
- Camera remains player-controlled during all ambient edge travel.

### H3 - Remove Legacy Zone Highlight Overlay From Focused Sim-Board

Goal: zone section highlights should not be drawn over the focused sim-board unless the player is in overview/debug mode.

Evidence:

- `renderManager.drawZoneWorldOverlay()` still draws focused-zone polygons for sim-board focused mode.

Plan:

- In sim-board focused-garden mode, suppress `drawZoneWorldOverlay()` polygon fills/strokes.
- Keep labels/zone overlays only for overview mode or explicit debug/zone-map mode.

Acceptance:

- Focused play has no translucent legacy zone polygon over the board.
- Overview/debug still has useful zone boundaries.

### H4 - Movement / Placement Containment Pass

Goal: butterflies should distribute naturally across the visible field instead of pushing upward, vibrating, or scattering oddly.

Plan:

- Separate the three movement questions so the fix is testable:
  - target pressure: are wander / social / edge-travel targets being sampled too close to the top of the projected field?
  - position ownership: are screen `x/y`, `gridPos`, `boardPos`, physics, and movement intent fighting over the same butterfly?
  - jitter: is contact resolution, target reacquisition, or rounding making a butterfly bounce around a nearly reached target?
- Reconcile movement ownership so normal wandering does not target legacy `gridPos` while the visible board is driven by `boardPos`.
- Audit `getZonePlacementRegion()`, board projection origins, and wander target selection against the new full-screen field.
- Check whether upward drift is caused by board `origin`, `groundT`, arrival target offsets, movement recovery targets, or the new edge-travel arrival logic.
- Add a movement capture audit with per-zone bounding summaries: min/max screen positions, board `u/v/h`, target `u/v/h`, and percentage of targets/positions in the top 15% of the visible field.
- Add a jitter audit that records frame-to-frame motion for each butterfly and flags repeated small direction reversals around the same target.
- Add a small arrival deadzone and one-owner handoff if the audit shows movement intent and physics are alternating control after arrival.

Acceptance:

- Calm wandering fills the intended field.
- Edge travel exits cleanly without dragging all motion toward one side.
- No repeated upward pressure is visible in ordinary play.
- Butterflies do not visibly vibrate while idle, arriving, colliding, or socializing.

### H4.5 - Block Grid Placement

Goal: block placement should be exact, simple, and legible.

Plan:

- Treat the board cell as the placement truth: `{ zoneId, u, v, h }`.
- Snap any player/debug/autonomous block placement preview to the nearest legal integer cell before confirmation.
- Reject placement when the target cell is occupied or when a stacked block lacks required support below it.
- Keep visual block size tied to one board unit; projection can decide pixel size, but placement cannot land between cells.
- Add a block occupancy audit that scans every zone for duplicate occupied cells, half-cell positions, unsupported stacks, and Training Grounds blocks.

Acceptance:

- No block can be placed halfway between two cells.
- No two solid blocks occupy the same cell.
- Training Grounds remains block-free unless a future explicit practice-object rule is opened.

### H5 - Restore Butterfly Sprite Fidelity

Goal: butterflies should use the original high-resolution art clearly.

Known asset truth:

- Wing assets exist at `1920x1080` in `assets/butterflies/`.
- Body and antenna assets exist at `1080x1080`.

Current symptom:

- Capture summary shows `spriteCache: 0/0`.
- Player reports sprites are still pixelated / distorted.

Plan:

- Verify the sprite path actually uses `assets/butterflies/*wing-full*.png`, `papilionem-butterfly-body.png`, and `papilionem-butterfly-antenna.png`.
- Add a runtime close-up audit that records: source image dimensions, active sprite mode, baked cache hits/misses, layer smoothing state, CSS/canvas scale, and a before/after wing screenshot.
- Investigate why the manual capture had `spriteCache: 0/0`; either the intended high-fidelity path is not active, telemetry is wired to the wrong path, or the capture did not exercise the audited path.
- If baked creature sprites are lower-fidelity in normal garden, either raise bake resolution/surface scale or bypass baking for butterflies in focused low-count play.
- Verify that butterfly scale-up/down never uses nearest-neighbor sampling on creature layers.
- Keep blocks pixel-crisp; only creature sprites get high-quality smoothing.

Acceptance:

- Sprite telemetry is nonzero when butterflies draw.
- Close-up screenshots show original wing texture detail.
- Body/antenna/wing proportions are not distorted.

### H6 - Flower De-Overlap / Spawn Discipline

Goal: flowers should not visibly stack on top of each other.

Status:

- New normal flower spawns now respect a per-zone readable cap and no longer use the unsafe overlap fallback for ordinary preferred points.
- Existing loaded saves run a one-time readability cleanup path on normal load.

Plan:

- Add an audit that counts flower overlap by zone using screen radius / board-unit radius.
- Enforce minimum spawn distance for new flowers in board units.
- Add a one-time runtime de-overlap for existing loaded saves if the current save has already accumulated stacked flowers.
- Keep normal readable flowers capped to a small per-zone budget instead of allowing old saves to retain giant flower piles.

Acceptance:

- Existing save visibly separates stacked flowers without wiping the save.
- New flowers respect a minimum spacing rule.
- Flower count can stay high, but readable clusters should not become visual piles.

### H6.5 - Flower Decay, Rot Cleanup, And Reserve Food

Goal: flowers should become part of the life sim instead of permanent clutter.

Life-sim ownership:

- Do not add new drive names for this.
- Use existing drive families: `selfMaintenance`, `resourceControl`, `caregiving`, `socialConnection`, `rest`, and `exploration`.
- Use existing memory/object/social truth: place/object/outcome/routine/social memories and trust/comfort/dependence/protectiveness social edges.

Loop:

```text
flower lifecycle
fresh flower
|- if eaten -> immediate nutrition / satisfaction signal
|- if picked -> compact same-color food reserve ball, no decay timer
`- if left for 60s -> dark decayed dirt pile

decayed dirt pile
|- visible clutter on the board
|- object-awareness target for cleanup
|- can create mild avoidance / maintenance pressure through existing drives
`- cleanup action removes pile and can produce compost/future-growth credit later
```

Plan:

- Add a flower `spawnedAtFrame` or equivalent game-time timestamp without changing unrelated save schema fields.
- Decay normal unpicked flowers after about 60 seconds of game-owned time.
- Render decayed flowers as small dark dirt piles, visually distinct from food and blocks.
- Add object affordances so butterflies can notice, avoid, clean, or prioritize rot using existing cognition families.
- Add a `foodReserve` object created when a butterfly picks a flower instead of eating it; color should match the source flower.
- Feed lines should report concrete lifecycle actions: picked, stored, shared, cleaned, ignored, or decayed.

Acceptance:

- A test flower decays after about 60 seconds.
- Decayed piles do not stack into unreadable clutter.
- At least one butterfly can clean a pile, and the feed names the action.
- A picked flower becomes a stable reserve ball and does not decay like a flower.

### H7 - Feed And Filter Repair

Goal: feed controls should be trustworthy, and feed lines should reflect real events.

Current issues:

- Filter buttons for feed/talking/action/learn do not work correctly.
- Warning-flavored text like "back away from the covered edge" appears too often or without meaningful visible context.

Plan:

- Test feed filters against the actual event categories emitted by `communicationSystem`, `gameUI`, and event bus history.
- Normalize category names so `talk`, `action`, and `learn` filters map to real data fields.
- Demote environmental warning phrases unless a real danger/threat/social warning signal exists.
- Prefer lines that name the actual social pair, state change, action, or learned/resolved outcome.

Acceptance:

- Each filter changes the visible feed list predictably.
- "Learn" shows actual teaching/learning outcomes only.
- Warning lines are rare and tied to visible or debug-traceable causes.

### H8 - Make Talking Feel Social, Not Text-Emitter

Goal: conversation should look like butterflies responding to each other from relationship, memory, emotion, and current context.

Ownership rule:

- Do not invent new drive/memory/social vocabulary.
- Use the locked families: drives, emotions, memories, social edges, routines, interpretation, communication, social ecology, distortion, genetics, upbringing, lifecycle, derived cognition.
- Communication can express truth, but durable relationship truth stays owned by social/life-sim systems.

Plan:

- Reshape talk into visible loops:
  - motivation: why this butterfly talks now
  - target: who it is addressing
  - interpretation: how the listener reads it
  - response: accept, ignore, repair, reciprocate, avoid, teach, or comfort
  - consequence: memory packet / social edge nudge / routine reinforcement
- Feed should show the loop, not just a poetic phrase.
- Add social-thread acceptance capture: one pair over several minutes, showing prior relation, talk, response, and follow-through.

Acceptance:

- A player can tell who talked to whom and why.
- Social exchanges have consequences beyond one feed line.
- Conversation feels situated in the butterflies' lives, not randomly generated.

## Recommended Repair Order

```text
repair ladder
|- H0   keep current capture as the G0 hold fixture
|- H-1  preserve correct zone meanings and no-block Training Grounds
|- H1   stop ambient travel from changing the player's focused zone
|- H3   suppress legacy zone highlight overlay in focused sim-board play
|- H2   replace inner-rectangle presentation with a full-field board/grid treatment
|- H2.1 enforce one spatial overlay rule
|- H2.2 add visible height / flight layer cue
|- H2.5 replace legacy exit anchors with border-based travel
|- H4   fix upward movement pressure and butterfly vibration with movement audits
|- H4.5 enforce exact one-unit block grid placement
|- H5   restore butterfly sprite fidelity from original high-resolution assets
|- H6   finish flower de-overlap / loaded-save cleanup verification
|- H6.5 add flower decay, rot cleanup, and reserve-food loop
|- H7   repair feed filters and remove contextless warning spam
|- H8   make talk visibly social through motive -> target -> response -> consequence
`- G0   rerun human capture, then only close G0 if the held symptoms are gone
```

## Immediate Implementation Slice

```text
first fix slice
|- H1 stop forced focus switching
|- H3 suppress focused sim-board zone overlay
|- H2 replace visible inner rectangle with a full-field ground/grid treatment
|- H2.1 replace legacy diamond overlay with sim-board-native grid/envelope/edge overlay
|- H2.2 add a minimal height cue probe so up/down is readable
|- H2.5 redirect travel targets to real map borders instead of old doorway anchors
|- H4 add movement/top-edge/jitter instrumentation, then fix the proven owner
`- rerun a 5-minute capture
```

Reason:

These fixes address the biggest comprehension break first: the game must stop moving the camera on its own, the play field must read clearly, and butterfly motion must stop fighting the visible board. Sprite fidelity, flower lifecycle, feed controls, and deeper social behavior matter a lot, but they are easier to judge after the camera and field stop fighting the player.

## Proof Checklist

```text
proofs before G0 can close
|- focus stability -> zero unprompted `navigation/focus-zone` events
|- field readability -> no unexplained inner rectangle or focused-mode zone overlay
|- movement envelope -> background clearly matches where butterflies can move
|- grid readability -> normal play has a subtle visible unit grid or equivalent unit cue
|- height readability -> butterfly altitude/ground relation is visually legible
|- overlay honesty -> focused highlight/map reflects real board size or is absent
|- UI boundary -> top of playable field stays below the UI band
|- edge travel -> exits use real map borders, not preserved old doorway points
|- movement spread -> no top-15% target bias unless an explicit edge exit is happening
|- jitter -> no repeated tiny direction reversals around a settled target
|- sprites -> butterfly cache/smoothing telemetry nonzero and close-ups show source detail
|- flowers -> overlap audit green and old save no longer shows stacked readable flowers
|- blocks -> occupancy audit has no duplicate, half-cell, unsupported, or Training Grounds blocks
|- feed -> talk/action/learn filters visibly map to real event categories
`- social -> at least one conversation thread shows motive, target, response, and consequence
```

## Do Not Do

```text
do not
|- restart the save to hide stacked flowers or migration behavior
|- reopen the whole 3D/spatial rebuild without a named blocker
|- remove autonomous life-sim systems just to quiet the feed
|- rename the locked cognition families
|- make ML own relationship truth
`- call G0 closed until a new capture proves the held symptoms are gone
```
