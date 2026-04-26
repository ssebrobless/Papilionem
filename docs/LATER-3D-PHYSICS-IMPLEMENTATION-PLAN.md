# Later 3D Physics Implementation Plan

## Purpose

This document locks the implementation plan for the later 3D physics phase.

Read this together with:

- [CURRENT-SPATIAL-TRUTH.md](C:/Users/fishe/Documents/projects/ephemera/docs/CURRENT-SPATIAL-TRUTH.md)

This document is **future-facing**. It must not be read as a claim that all of
the described 3D ownership is already live.

For future promoted execution order, use
[ACTIVE-EXPANSION-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-EXPANSION-BOARD.md)
as the authoritative ladder.

Read the `P1`-`P6` sequence below as this contract's local decomposition of the
later 3-D work, not as a competing expansion board.

It exists so we can add physical truth to Papilionem without drifting into:

- generic engine behavior that does not fit the game
- duplicate owners for movement, collision, and structure truth
- old Ephemera/pool-era mechanics we already removed

The goal is not "full physics sandbox."

The goal is:

```text
butterflies should move, collide, carry, enter, build, shove, and battle
in a way that feels spatially honest inside Papilionem's world.
```

## What 3D Means In This Game

```text
╔════════════ Papilionem 3D Model ════════════╗
║ screen plane        │ x / y movement        ║
║ derived elevation   │ stack / roof / carry  ║
║ occupancy volumes   │ body-fit + collisions ║
║ openings            │ valid entry corridors ║
║ interiors           │ shelter usage truth   ║
║ impulses            │ shove / knockback     ║
╚═════════════════════════════════════════════╝
```

This is a **discrete pseudo-3D physical model**, not a freeform rigid-body sim.

We will use:

- continuous motion on the ground plane
- discrete height bands for stacks / roofs / carried objects
- derived occupancy volumes for blocking and shelter use
- short-lived impulses for shoves, impacts, and knockback

We will **not** use:

- free-spinning rigid blocks
- broad general-purpose gravity
- physics that fights the existing aesthetic or movement style

## Zone Border Invariant

```text
╔════════════ Zone Border Invariant ════════════╗
║ later 3D physics must remain inside the same  ║
║ legal visible zone boundaries we already use. ║
╚════════════════════════════════════════════════╝
```

3D physics must not create a second world edge outside the current zone borders.

That means:

- butterflies must remain inside the current legal roam region for their zone
- shove, recoil, slide, separation, and knockback must all resolve back inside that same legal region
- shelter/opening logic must work **within** zone borders, not replace them
- carried blocks and placed blocks must also stay inside legal zone placement bounds
- no physics step may push a butterfly or a block outside the visible playable area

### Border ownership

```text
zone border truth
├─ gameCore / zoneSystem own legal zone bounds
├─ structureSystem owns internal structure constraints
└─ physicsSystem resolves motion inside both
```

### Resolution order

```text
movement intent
▶ collision / impulse resolution
▶ structure constraints
▶ zone-border clamp
▶ final committed x/y
```

### Existing seams to reuse

- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `clampScreenPointToRoamArea(...)`
  - current zone travel anchors and arrival targets
- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
  - opening corridors
  - interior bounds
  - body-fit truth

The later 3D phase must extend those seams, not replace them.

## Current Grounded Runtime Truth

The current live truth is documented canonically in:

- [CURRENT-SPATIAL-TRUTH.md](C:/Users/fishe/Documents/projects/ephemera/docs/CURRENT-SPATIAL-TRUTH.md)

This section is only a bridge into the later expansion plan.

```text
╔════════════ Current Owners ════════════╦════════════════════════════════════╗
║ owner                                  ║ current responsibility            ║
╠════════════════════════════════════════╬════════════════════════════════════╣
║ [structureSystem.js]                   ║ derived structure / shelter truth ║
║ [gameCore.js]                          ║ path blocking + separation loop   ║
║ [butterfly.js]                         ║ movement intent + carry behavior  ║
║ [block.js]                             ║ stack/carry placement state       ║
║ [teachingSystem.js]                    ║ training impacts + HP/pressure    ║
║ [renderManager.js]                     ║ draw ordering / z-index           ║
║ [lifeSimSystem.js]                     ║ spatial awareness summaries       ║
║ [mlInferenceSystem.js]                 ║ choice layers, not collision      ║
╚════════════════════════════════════════╩════════════════════════════════════╝
```

Important current seams:

- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
  - already owns:
    - shelter components
    - opening corridors
    - body-fit checks
    - point blocking
    - carry anchors
    - placement target selection
- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - currently owns:
    - `resolveButterflySeparation`
    - `isScreenPointBlockedForButterfly`
    - zone travel movement
- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
  - currently owns:
    - movement target choice
    - block pickup / carry / place flow
    - direct carried-block pose updates
- [teachingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/teachingSystem.js)
  - currently owns:
    - training contact detection
    - impact HP / pressure changes
    - but not real physical knockback truth

## Ownership Plan

```text
╔════════════ Target Ownership Map ════════════╗
║ butterfly / caterpillar                      ║
║  └─ intent only                             ║
║     ├─ desired move target                  ║
║     ├─ desired speed                        ║
║     ├─ desired posture                      ║
║     └─ desired carried-object action        ║
║                                             ║
║ structureSystem                             ║
║  └─ static derived spatial truth            ║
║     ├─ block occupancy columns              ║
║     ├─ openings / interiors / roofs         ║
║     ├─ body-fit constraints                 ║
║     └─ valid placement geometry             ║
║                                             ║
║ physicsSystem                               ║
║  └─ dynamic physical truth                  ║
║     ├─ contact detection                    ║
║     ├─ collision resolution                 ║
║     ├─ impulses / knockback                 ║
║     ├─ separation / pushback                ║
║     ├─ carried-object attachment motion     ║
║     └─ final resolved positions             ║
║                                             ║
║ teachingSystem                              ║
║  └─ impact intent only                      ║
║     └─ asks physicsSystem to apply shove    ║
╚══════════════════════════════════════════════╝
```

### Hard ownership rules

```text
do not allow
├─ butterfly.js to finalize collision-resolved x/y alone
├─ teachingSystem to directly fake knockback by teleporting
├─ structureSystem to own dynamic impulse state
├─ physicsSystem to own permanent structure truth
└─ ML to mutate collision truth directly
```

## New Runtime Layer

Create:

- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

It should become the single owner for:

- dynamic contacts
- dynamic impulses
- collision resolution
- final per-frame resolved movement
- short-lived physical state caches

## Runtime Data Shape

```text
╔════════════ Entity Physics State ════════════╗
║ position        │ x, y, zLift                ║
║ velocity        │ vx, vy                     ║
║ intent          │ desiredDx, desiredDy       ║
║ body            │ radius, width, clearance   ║
║ contact flags   │ grounded / blocked / inside║
║ impulse state   │ ix, iy, decayFrames        ║
║ carry state     │ attachedObjectId / anchor  ║
║ collision mask  │ butterfly / block / roof   ║
╚═══════════════════════════════════════════════╝
```

Suggested container shape:

```js
entity.physics = {
  velocity: { x: 0, y: 0 },
  intent: { x: 0, y: 0 },
  impulse: { x: 0, y: 0, frames: 0, source: null },
  body: {
    radius: 0,
    width: 0,
    clearance: 1,
    liftBand: 'ground'
  },
  contact: {
    blocked: false,
    blockedByIds: [],
    touchedButterflyIds: [],
    touchedBlockIds: [],
    insideShelter: false,
    openingTransition: false
  },
  carry: {
    attachedObjectId: null,
    anchor: null
  }
};
```

### Persistence rule

Persist only durable, meaningful truth:

- attached carry ownership if the object is currently carried
- maybe a short carry phase if needed for continuity

Do **not** persist:

- velocity
- impulses
- contact lists
- per-frame collision caches
- resolved push vectors

Those must rebuild after load.

## Spatial Model

```text
╔════════════ Space Layers ════════════╗
║ Layer 0 │ ground roam plane          ║
║ Layer 1 │ low stack / wall body      ║
║ Layer 2 │ tall stack / roof band     ║
║ Layer 3 │ carried-object lift band   ║
╚═══════════════════════════════════════╝
```

### Static structure truth stays in `structureSystem`

It already has most of the right language:

- occupancy columns
- opening profiles
- interior bounds
- shelter points
- body-fit checks

For the physics phase, extend it to expose **collision-ready geometry**:

```text
per component
├─ opening corridor volume
├─ interior volume
├─ roof footprint
├─ wall occupancy columns
└─ side normals for push response
```

### Dynamic truth moves to `physicsSystem`

`physicsSystem` should query `structureSystem`, then resolve:

- can the butterfly step here?
- is this a soft contact or hard stop?
- does this movement cross an opening corridor correctly?
- should the entity slide, stop, or bounce slightly?

## Contact Matrix

```text
╔════════════ Contact Rules ════════════╦══════════════════════════════════════╗
║ pair                                  ║ rule                                 ║
╠═══════════════════════════════════════╬══════════════════════════════════════╣
║ butterfly ↔ butterfly                 ║ soft push / separation / overlap fix ║
║ butterfly ↔ low block                 ║ can pass if clearance allows         ║
║ butterfly ↔ tall stack / wall         ║ hard block + slide                   ║
║ butterfly ↔ opening corridor          ║ valid transition channel             ║
║ butterfly ↔ too-narrow opening        ║ reject + nudge away                  ║
║ butterfly ↔ shelter interior          ║ allowed only if body-fit passes      ║
║ carried block ↔ wall/opening          ║ attachment follows carrier limits    ║
║ placed block ↔ placed block           ║ snap / stack / reject invalid pose   ║
║ training impact ↔ butterfly           ║ shove impulse + readable recoil      ║
╚═══════════════════════════════════════╩══════════════════════════════════════╝
```

## Movement Resolution Pipeline

```text
╔════════════ Per-Frame Pipeline ════════════╗
║ 1. lifeSim / ML choose intent             ║
║ 2. butterfly writes desired movement      ║
║ 3. physicsSystem gathers contacts         ║
║ 4. physicsSystem applies impulses         ║
║ 5. physicsSystem resolves blocking/slide  ║
║ 6. physicsSystem updates carried anchors  ║
║ 7. final x/y/zLift committed              ║
║ 8. renderManager draws resolved result    ║
╚════════════════════════════════════════════╝
```

### Exact behavioral rule

Butterflies should no longer directly "own" final movement position.

Instead:

- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js) chooses target and desired direction
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js) resolves what movement is physically allowed
- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js) orchestrates update order

## Block Placement And Collision Rules

```text
╔════════════ Block Placement Truth ════════════╗
║ valid placement only if                        ║
║  ├─ inside zone roam area                      ║
║  ├─ not inside opening corridor                ║
║  ├─ not clipping occupied stack volume         ║
║  ├─ supported by ground or legal support block ║
║  └─ does not trap interior path illegally      ║
╚════════════════════════════════════════════════╝
```

### Placement behavior

Ground placement:

- snaps to clear ground candidate
- rejects opening-corridor conflict
- rejects overlap with existing occupancy column

Stack placement:

- requires support block footprint match
- inherits component membership
- updates occupancy column height

Invalid placement:

- should preview as blocked locally
- should fall back to nearest valid placement point
- should never silently place inside an opening corridor

## Carry Physics

Current carry truth is already close, but it should become physics-owned.

```text
current
butterfly updates carried block pose directly

target
physicsSystem resolves carrier motion
└─ then computes carried block final anchor pose
```

### Carry rules

- carried block stays attached to a resolved anchor, not a pre-collision target
- if the butterfly is blocked by an opening or wall, the carried block follows that blocked result
- if a carried block would clip a too-narrow opening, the whole carry action is blocked or rerouted
- carried blocks do not spin freely
- carry orientation may visually bias, but logical placement stays discrete and stable

## Butterfly ↔ Butterfly Physics

Current `resolveButterflySeparation` in [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js) is a good seed, but it is too late-stage and too simple for the final phase.

Move this into `physicsSystem` and expand it:

```text
soft-contact model
├─ idle overlap      │ gentle separation
├─ moving pass-by    │ lateral slide
├─ high-speed impact │ shove impulse
└─ training impact   │ stronger directed knockback
```

### Goals

- stop sprite fusion / perfect overlap
- stop vibration caused by repeated last-frame pushes
- make contact readable without looking heavy or chaotic

## Training Grounds Physics

This is where the later 3D physics phase matters most for readability.

Current state:

- [teachingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/teachingSystem.js) detects impact
- HP / pressure changes are real
- physical consequence is still under-expressed

### Target behavior

```text
training impact
├─ contact detected by teachingSystem
├─ impact intent sent to physicsSystem
├─ physicsSystem applies short shove impulse
├─ target recoils visibly
├─ HP/pressure update remains in teachingSystem/battle truth
└─ Inspect/UI reflects the result already
```

### Design rule

Keep combat stats and damage truth separate from physical shove truth.

- `teachingSystem` owns battle-state change
- `physicsSystem` owns recoil motion

## Butterfly ↔ Shelter Interaction

This is where the current narrow 3D phase becomes full physical truth.

```text
╔════════════ Shelter Movement Rules ════════════╗
║ entering shelter                               ║
║  ├─ must approach through opening corridor     ║
║  ├─ must pass body-fit check                   ║
║  ├─ may slide along wall if near-miss          ║
║  └─ cannot teleport across shell boundary      ║
║                                                ║
║ inside shelter                                 ║
║  ├─ movement constrained to interior bounds    ║
║  ├─ exit prefers opening corridor              ║
║  └─ blocked state shown if trapped             ║
╚═════════════════════════════════════════════════╝
```

## Rendering Implications

We do not need a new art style, but we do need clearer physical cues.

```text
render implications
├─ zLift derived from resolved physics state
├─ carried block draw pose from resolved anchor
├─ inside-shelter entities draw consistently under roof logic
├─ shove/impact uses short displacement + subtle effect
└─ shadow rules come from final resolved lift band
```

Files likely touched:

- [renderManager.js](C:/Users/fishe/Documents/projects/ephemera/core/renderManager.js)
- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
- [block.js](C:/Users/fishe/Documents/projects/ephemera/entities/block.js)

## AI / ML Integration

ML should **read** physics summaries, not own physics.

```text
physics feeds ML
├─ blockedAhead
├─ recentImpact
├─ currentPushPressure
├─ interiorAccess
├─ openingReachability
├─ carryBlocked
└─ localCrowding
```

This should enrich:

- action selection
- target selection
- risk posture
- autobattle posture

But the model must never directly override collision truth.

## Debug / Audit Plan

Keep this local-only, like the soak tooling.

### New local-only audit runners

```text
scripts/
├─ run-3d-physics-contact-audit.js
├─ run-3d-physics-structure-audit.js
├─ run-3d-physics-training-audit.js
└─ run-3d-physics-long-soak-regression.js
```

### What each audit should prove

```text
contact audit
├─ no butterfly fusion
├─ no vibration loops near obstacles
├─ no ghosting through tall stacks
└─ stable slide-along-wall behavior

structure audit
├─ valid opening entry only
├─ interior usage consistency
├─ body-fit rejection works
└─ carried block respects opening width

training audit
├─ shove impulse visible
├─ HP/pressure still correct
├─ no launch-to-infinity bug
└─ no battle-state leak

long-soak regression
├─ breeding still works
├─ mutations still persist
├─ wild ecology / release loop still canonical
├─ structure usage remains valid
└─ performance remains acceptable
```

## Phase Rollout

```text
mapping to authoritative expansion ladder
|- P1 + P2 -> b1
|- P3      -> b2 + b3
|- P4      -> b4
|- P5      -> b5
`- P6      -> b6 + b7
```

```text
╔════════════ Later 3D Physics Rollout ════════════╗
║ P1. physicsSystem scaffold                        ║
║ P2. butterfly contact + separation rewrite       ║
║ P3. structure collision + slide resolution       ║
║ P4. carry / placement / opening collision truth  ║
║ P5. training-ground shove / knockback            ║
║ P6. render polish + audit closure                ║
╚═══════════════════════════════════════════════════╝
```

### P1. `physicsSystem` scaffold

Add:

- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

Touch:

- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)

Deliver:

- registration hooks
- per-entity physics container
- update ordering seam
- no behavior change yet

### P2. butterfly contact + separation rewrite

Replace:

- `resolveButterflySeparation` in [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)

Deliver:

- stable soft push
- moving-pass slide
- overlap elimination without vibration

### P3. structure collision + slide resolution

Extend:

- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

Deliver:

- wall/stack hard stop
- slide along obstacle edge
- opening-aware transition
- interior-bound enforcement

### P4. carry / placement / opening collision truth

Touch:

- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
- [block.js](C:/Users/fishe/Documents/projects/ephemera/entities/block.js)
- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

Deliver:

- carried block anchor uses resolved physics state
- carry cannot clip through openings
- placement rejects corridor conflicts physically and logically

### P5. training-ground shove / knockback

Touch:

- [teachingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/teachingSystem.js)
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)
- [gameUI.js](C:/Users/fishe/Documents/projects/ephemera/ui/gameUI.js) if readout tweaks are needed

Deliver:

- readable recoil
- no fake teleport shove
- no duplicate ownership of HP / pressure / motion

### P6. render polish + audit closure

Touch:

- [renderManager.js](C:/Users/fishe/Documents/projects/ephemera/core/renderManager.js)
- [gameUI.js](C:/Users/fishe/Documents/projects/ephemera/ui/gameUI.js)
- local-only audit scripts

Deliver:

- cleaner visual truth
- final local audit stack
- long-soak regression rerun

## Invariants

```text
must remain true
├─ no old Ephemera/pool mechanics reintroduced
├─ structure truth stays derived, not hand-authored cache
├─ physics truth stays dynamic, not persisted bulk state
├─ battle stats are not replaced by physical motion
├─ ML never becomes collision source-of-truth
├─ carried blocks remain discrete placements, not ragdolls
└─ openings remain the legal shelter transition seam
```

## Risks To Watch

```text
highest-risk regressions
├─ butterfly vibration from repeated push/resolve loops
├─ carried block jitter at obstacle edges
├─ wall-slide causing zone-border clipping
├─ shelter entry false positives
├─ training knockback looking too violent or too weak
└─ performance collapse from broad pairwise checks
```

## Performance Rules

- prefer broad-phase grouping by zone and local radius
- reuse structureSystem block profiles instead of recomputing geometry in physics
- keep impulses short-lived and small
- only run expensive contact checks for nearby entities
- keep local-only physics audits out of the shipped build

## Exact Next Implementation Order

```text
1. add physicsSystem scaffold
2. move butterfly separation into physicsSystem
3. add structure collision + slide resolution
4. migrate carry/placement resolution to physicsSystem
5. add training shove / knockback
6. run local audit stack
7. rerun long-soak regression
```

## Definition Of Done

```text
later 3D physics is done when
├─ butterflies no longer fuse or vibrate under contact
├─ stacked blocks block movement honestly
├─ shelter entry/exit only occurs through valid openings
├─ carried blocks move and place without jitter or clipping
├─ training impacts cause readable recoil
├─ no major regression appears in long-soak proof
└─ all of this stays aligned with current contracts and no old mechanics return
```
