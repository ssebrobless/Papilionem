# Environmental Affordance Implementation Plan - 2026-05-03

Owner: Codex

Goal: turn Papilionem's world objects into a stronger substrate for believable
butterfly society. The goal is not literal consciousness. The goal is a
simulation where durable drives, emotions, memory, relationships, communication,
and ML scoring have meaningful objects, tasks, tradeoffs, and shared problems to
act on.

## 1. Shape Of The Plan

```text
Cell truth
  -> flower / dirt ecology
  -> pollen state and planting
  -> flower-to-block material economy
  -> shade / rest pressure
  -> social handoff and shared projects
  -> memories, dialogue, ML traces, audits
```

Implementation rule: environmental truth first, social meaning second, ML
scoring third. Do not let ML own pollen, shade, memories, social edges, or save
truth.

## 2. Code-Grounded Findings

### 2.1 Existing Strengths

- `entities/flower.js` already supports:
  - `lifecycleKind === 'flower'`
  - `lifecycleKind === 'dirt-pile'`
  - `lifecycleKind === 'reserve-food-ball'`
  - decay to dirt piles through `shouldDecayToPile()`
  - cleanup through `tryCleanupDirtPile()`
- `core/gameCore.js` already supports:
  - `spawnFlowerAt()`
  - `transformFlowerToDirtPile()`
  - `convertFlowerToReserveFood()`
  - `pendingPollenPlantings`
  - `planPollenDropTarget()`
  - `queuePollenPlanting()`
  - `updatePollenPlantings()`
- `systems/objectSystem.js` already tracks durable object interactions and
  carrier state.
- `systems/structureSystem.js` already owns block cell snapping, stack support,
  shelter geometry, shelter interior detection, and `getSpatialContextForEntity()`.
- `systems/lifeSimSystem.js` already consumes shelter context and zone ecology
  in social ecology / roosting calculations.
- `systems/zoneSystem.js` already computes zone affordances including
  `resource`, `shelter`, `cleanup`, `dirtDensity`, `flowerDensity`, and
  `shelterDensity`.
- `systems/mlInferenceSystem.js` already has feature domains for `pollen`,
  `plant`, `block`, and `shelterUse`; the feature contract can extend
  naturally after gameplay truth exists.

### 2.2 Current Gaps / Risks

- `structureSystem.acceptCellPlacement()` checks block-vs-block occupancy but
  does not check live flowers, dirt piles, reserve food, or pending pollen
  patches. Blocks can therefore be planned without a unified object-cell truth.
- `spawnFlowerAt()` uses pixel distance and per-zone caps. It does not yet ask a
  single board-cell occupancy authority before spawning wild flowers.
- `pendingPollenPlantings` exists, but it is screen-point based and not yet a
  full board-cell reservation with 1-cell occupancy.
- Pollen exists as a post-feeding planting behavior, but not as a durable
  butterfly-carried state with charges, expiration, transfer, or inspect
  surfacing.
- Dirt piles clean up and influence zone affordances, but they are not yet a
  formal one-cell blocker for blocks, flowers, and pollen patches.
- Shelter exists as component geometry, but the user-requested "shade from
  overhead blocks" is not yet a simple board-cell environmental property.
- Blocks are useful, but their scarcity / creation economy is weak. There is no
  live-flower -> block conversion decision.
- Dialogue has many object and shelter phrases, but the next environmental
  features need direct human-readable task language, not atmospheric filler.

## 3. Ownership Contract

| System | Owns |
| --- | --- |
| `structureSystem` | board-cell normalization, block stack support, shared cell occupancy queries, shade cells from blocks |
| `objectSystem` | object interactions, carry/deliver/consume records, object affordance summaries |
| `gameCore` | object creation/removal orchestration, pending environmental queues |
| `entities/flower.js` | flower lifecycle visuals and per-flower state transitions |
| `entities/butterfly.js` | local action execution: clean, feed, plant, carry, convert, handoff |
| `lifeSimSystem` | drives, emotions, memories, relationship consequences |
| `communicationSystem` | offers, requests, warnings, replies, interpretation |
| `zoneSystem` | zone-level ecology and affordance vector |
| `mlInferenceSystem` | read-only scoring and trace features |
| `saveSystem` | additive persistence only where state must survive reload |

Invariant: one board unit is the shared cell unit. Blocks, live flowers, dirt
piles, reserve food balls, and pollen patches are all one-cell ground
occupants/reservations unless a phase explicitly proves otherwise.

## 4. Phase Ladder

### ENV0 - Safety Baseline And Current-State Snapshot

Purpose: lock a clean evidence point before changing ecology.

Owned files:

- New doc only: `docs/ENVIRONMENTAL-AFFORDANCE-EVIDENCE-LOCK-2026-05-03.md`

Proofs:

```text
node scripts/run-r-flower-lifecycle-audit.js
node scripts/run-r-block-cell-discipline-audit.js
node scripts/run-long-soak-society-audit.js --minutes 8 --skip-ml-comparison
node scripts/run-r-expression-naturalness-audit.js
```

Acceptance:

- Record current flower/dirt/block/social metrics.
- Do not modify gameplay in this phase.

### ENV1 - Shared Board-Cell Occupancy Contract

Purpose: prevent blocks, flowers, dirt piles, reserve food, and pollen patches
from occupying or reserving the same board cell.

Likely owned files:

- `systems/structureSystem.js`
- `core/gameCore.js`
- `entities/block.js`
- `scripts/run-r-block-cell-discipline-audit.js`
- New audit: `scripts/run-environment-occupancy-contract-audit.js`

Implementation:

1. Add a shared occupancy query in `structureSystem`, for example:
   - `normalizeObjectCell(zoneId, u, v, h = 0)`
   - `buildObjectCellKey(zoneId, u, v, h = 0)`
   - `getBoardCellOccupants(zoneId, u, v, h, options)`
   - `canOccupyBoardCell({ zoneId, u, v, h, occupantType, ignoreIds })`
2. Keep existing `acceptCellPlacement()` behavior for block support, but call
   the shared occupancy query for ground-level blockers.
3. Treat these as ground-cell blockers:
   - `block` at same h
   - normal live flower
   - dirt pile
   - reserve food ball
   - pending pollen patch
4. Allow butterflies to fly over occupied cells; occupancy blocks placement and
   spawning, not movement.
5. Add explicit rejection reasons:
   - `occupied-by-flower`
   - `occupied-by-dirt-pile`
   - `occupied-by-reserve-food`
   - `occupied-by-pollen-patch`
   - `occupied-by-block`

Forbidden:

- No save schema bump.
- No projection math changes.
- No ML changes.
- No new cognition vocabulary.

Acceptance:

- A block cannot be placed on a live flower.
- A block cannot be placed on a dirt pile.
- A block cannot be placed on a pending pollen patch.
- A flower cannot spawn on a block, dirt pile, live flower, reserve food, or
  pollen patch.
- Existing block stack roundtrip still passes.

### ENV2 - Flower Spawn Rebalance And Cell-Based Wild Spawns

Purpose: make wild flowers limited and spatially legible, while making butterfly
planting meaningful.

Likely owned files:

- `core/config.js`
- `core/gameCore.js`
- `systems/zoneSystem.js`
- `scripts/run-r-flower-lifecycle-audit.js`
- `scripts/run-long-soak-society-audit.js`

Implementation:

1. Add per-zone natural flower caps:
   - training grounds: 0 or very low cap unless explicitly seeded
   - open land zones: small cap such as 4-6 normal flowers
2. Update `spawnFlowerAt()` to find a valid board cell through ENV1 occupancy.
3. Preserve `ignoreZoneFlowerCap` for audits and explicit fixtures, but still
   respect occupancy unless an audit explicitly requests overlap.
4. Include dirt burden in spawn suppression.
5. Report per-zone flower pressure in zone affordance output.

Acceptance:

- Natural spawns stay under per-zone cap.
- Natural spawns never overlap occupied cells.
- Flower scarcity increases resource/planting pressure without starving the
  simulation.

### ENV3 - Pollen Carrier State

Purpose: make pollen a real carried task state rather than only an immediate
post-feeding target.

Likely owned files:

- `entities/butterfly.js`
- `core/gameCore.js`
- `systems/saveSystem.js`
- `ui/gameUI.js`
- `ui/dom/debugPanel.js`
- `scripts/run-r-flower-lifecycle-audit.js`
- New audit: `scripts/run-pollen-carrier-state-audit.js`

Implementation:

1. Add additive butterfly state:
   - `pollenState.charges`
   - `pollenState.maxCharges = 2`
   - `pollenState.flowerType`
   - `pollenState.color`
   - `pollenState.sourceFlowerId`
   - `pollenState.sourceZoneId`
   - `pollenState.expiresAtFrame`
2. Eating a flower or converting to reserve food grants pollen if enabled.
3. Pollen expires after roughly 2 minutes.
4. Inspect/debug UI surfaces pollen state.
5. Save/load persists active pollen state.

Acceptance:

- Feed or reserve conversion grants 1-2 charges.
- Pollen expires if unused.
- Save/reload preserves active pollen state.
- No visual particle effect is required.

### ENV4 - Pollen Patch Planting

Purpose: make pollen planting reserve a 3D board cell, display small colored
dots, and bloom after 20 seconds.

Likely owned files:

- `core/gameCore.js`
- `entities/flower.js`
- `systems/saveSystem.js`
- `core/renderManager.js` or existing flower rendering path if needed
- `scripts/run-r-flower-lifecycle-audit.js`
- New audit: `scripts/run-pollen-planting-cell-audit.js`

Implementation:

1. Convert `pendingPollenPlantings` from screen-only points to board-cell
   reservations:
   - `zoneId`, `u`, `v`, `h=0`
   - `flowerType`
   - `color`
   - `plantedById`
   - `createdAtFrame`
   - `bloomsAtFrame`
2. Pollen patch occupies one cell through ENV1.
3. Draw small colored dots on the target board cell.
4. After 20 seconds, bloom a flower if the reservation is still valid.
5. If the reservation becomes invalid, cancel it and create an outcome memory.

Acceptance:

- Pollen patch blocks wild flower spawn and block placement.
- Patch blooms after 20 seconds.
- Patch persists through save/reload if active.
- Patch displays visibly but modestly.

### ENV5 - Pollen Handoff And Cooperation

Purpose: allow butterflies to transfer pollen so the better-suited butterfly can
plant it.

Likely owned files:

- `entities/butterfly.js`
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `systems/objectSystem.js`
- `scripts/run-r-cooperation-pressure-audit.js`
- New audit: `scripts/run-pollen-handoff-cooperation-audit.js`

Implementation:

1. Add offer/request signals:
   - "Can you plant this before it fades?"
   - "I can carry it."
   - "I am too tired; take this."
2. Recipient accepts based on:
   - trust/comfort/attachment
   - resourceControl/exploration/caregiving/rest state
   - distance to valid planting cell
   - current load or exhaustion
3. Record outcome memory:
   - giver trusted receiver
   - receiver planted successfully
   - receiver let pollen expire
4. Update relationship edges through existing families: trust, admiration,
   comfort, resentment as appropriate.

Acceptance:

- A pollinated butterfly can transfer one or more charges.
- Recipient can plant from transferred pollen.
- Successful transfer creates social memory and edge changes.
- Expired transferred pollen creates a negative outcome memory.

### ENV6 - Flower To Block Conversion

Purpose: let butterflies create building material from flowers with a real
tradeoff.

Likely owned files:

- `core/gameCore.js`
- `entities/butterfly.js`
- `systems/objectSystem.js`
- `systems/structureSystem.js`
- `systems/lifeSimSystem.js`
- New audit: `scripts/run-flower-to-block-conversion-audit.js`

Implementation:

1. Add an action path where a butterfly can convert a live flower into a block.
2. Cost:
   - no food gain
   - one pollen charge only
   - exhaustion/energy cost
3. Spawn the block into a valid nearby cell through ENV1.
4. If no valid block cell exists, conversion does not proceed.
5. Add memory tags under existing `object` / `outcome` families:
   - `shelter-material`
   - `converted-flower`
   - `building-cost`

Acceptance:

- Flower-to-block conversion cannot create overlapping cells.
- Conversion increases exhaustion.
- Conversion grants only one pollen charge and no food benefit.
- The resulting block can be used by existing block carry/place logic.

### ENV7 - Shade Cell Truth From Overhead Blocks

Purpose: make blocks functionally affect rest by creating darker/shaded cells.

Likely owned files:

- `systems/structureSystem.js`
- `systems/lifeSimSystem.js`
- `systems/zoneSystem.js`
- `scripts/run-e4-social-ecology-audit.js`
- New audit: `scripts/run-shade-cell-rest-audit.js`

Implementation:

1. Add a simple deterministic shade rule:
   - a ground cell `(u,v,h=0)` is shaded if a block exists at `(u,v,h>=1)`
2. Optionally allow adjacent partial shade later; do not start there.
3. Add shade fields to spatial context:
   - `insideShade`
   - `shadeSourceBlockId`
   - `shadeConfidenceTarget`
4. Feed shade into existing rest/shelter calculations.
5. Keep "likes warmth/open light" as trait bias, not a new drive.

Acceptance:

- Cells under stacked/overhead blocks are shaded.
- Shaded cells increase rest target score and rest quality.
- Some butterflies can still prefer exposed cells due to traits.
- Existing shelter geometry remains valid.

### ENV8 - Rest / Shelter Behavior Integration

Purpose: make tired butterflies intentionally seek shade/shelter and make
building useful.

Likely owned files:

- `entities/butterfly.js`
- `systems/behaviorSystem.js`
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `scripts/run-n5-dialogue-behavior-follow-through-audit.js`
- New audit: `scripts/run-shade-seeking-behavior-audit.js`

Implementation:

1. Tired butterflies score shaded cells higher.
2. Exhausted butterflies can request help or move toward existing shade.
3. Caregiving butterflies can build/bring material near exhausted partners.
4. Dialogue uses direct task language:
   - "Rest here. It is darker under this."
   - "I am too tired to carry that."
   - "Can you help me make shade?"

Acceptance:

- Exhausted butterflies prefer shade above open cells in a deterministic
  scenario.
- Caregiving/bonded butterflies can respond.
- Dialogue and memory explain why.

### ENV9 - Shared Projects

Purpose: let multiple butterflies contribute to a shelter, garden, cleanup, or
food reserve task.

Likely owned files:

- New system or `systems/objectSystem.js` extension:
  - `environmentProjectSystem` is cleaner if the scope grows
- `systems/saveSystem.js`
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `entities/butterfly.js`
- New audit: `scripts/run-environment-projects-audit.js`

Implementation:

1. Add lightweight projects:
   - `shadeShelter`
   - `foodGarden`
   - `cleanupArea`
2. Project fields:
   - target cells
   - requested materials
   - contributors
   - progress
   - createdById
   - completedAtFrame
3. Contributions create outcome and social memory.
4. Abandonment or blocking creates repair/conflict opportunities.

Acceptance:

- At least two butterflies contribute to the same project.
- Project completion changes zone affordance or shade/resource availability.
- Contributors remember the outcome.

### ENV10 - Commitments / Promises

Purpose: make future intentions socially meaningful.

Likely owned files:

- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `entities/butterfly.js`
- `scripts/g0h/societyMetrics.js`
- New audit: `scripts/run-commitment-follow-through-audit.js`

Implementation:

1. Add lightweight, non-vocabulary-breaking commitment records under existing
   communication/social state:
   - plant this pollen
   - clean this pile
   - bring a block
   - rest near partner
2. Track fulfilled, failed, expired, or impossible.
3. Convert results into existing memory families and edge changes.

Acceptance:

- A request can produce a future action.
- Fulfilled promises improve trust/comfort/admiration.
- Broken promises can create resentment or repair pressure.

### ENV11 - Teaching / Routine Imitation

Purpose: allow butterflies to learn useful environmental routines from each
other.

Likely owned files:

- `systems/lifeSimSystem.js`
- `systems/behaviorSystem.js`
- `systems/communicationSystem.js`
- `scripts/run-deep-systems-audit.js`
- New audit: `scripts/run-routine-imitation-audit.js`

Implementation:

1. Observing a successful action can reinforce a routine:
   - planting in a good cell
   - cleaning before planting
   - resting in shade
   - converting a flower to block when shelter is scarce
2. Trusted/admired teachers have stronger influence.
3. Imitation must be probabilistic and trait-biased.

Acceptance:

- A witness becomes more likely to repeat a useful observed action.
- The behavior is visible in routine strength and later target choice.

### ENV12 - Organic Civilization Soak

Purpose: prove the whole loop creates unscripted society-like behavior.

Likely owned files:

- `scripts/run-long-soak-society-audit.js`
- `scripts/g0h/societyMetrics.js`
- New audit: `scripts/run-environment-civilization-soak-audit.js`

Acceptance over a 15-20 minute organic run:

- flowers remain below natural caps
- dirt piles appear and are cleaned
- pollen patches are planted and bloom
- at least one pollen handoff occurs
- at least one flower-to-block conversion occurs
- at least one butterfly rests in shade because of rest pressure
- at least one shared project receives two contributors
- dialogue is relationship/task-directed, not atmospheric filler
- inspect/debug can show the reason for each major behavior
- ML traces include the new object/shade/resource features, but ML remains
  read-only

## 5. Recommended Implementation Order

```text
ENV0 baseline
  -> ENV1 shared occupancy
  -> ENV2 flower spawn caps
  -> ENV3 pollen carrier state
  -> ENV4 pollen patches
  -> ENV5 pollen handoff
  -> ENV6 flower-to-block conversion
  -> ENV7 shade cell truth
  -> ENV8 rest/shade behavior
  -> ENV9 shared projects
  -> ENV10 commitments
  -> ENV11 routine imitation
  -> ENV12 organic civilization soak
```

Do not implement ENV5 before ENV1-ENV4. Do not implement ENV9-ENV11 until the
basic object economy is stable and audited.

## 6. Open Design Decisions For User Review

1. Natural flower caps:
   - training grounds: 0, 1, or 2?
   - open land zones: 4, 5, or 6?
2. Pollen charges:
   - always 2, or 1-2 based on flower type / butterfly state?
3. Flower-to-block output:
   - creates loose block at nearby valid cell, or creates a carried block?
4. Shade:
   - strict overhead same-cell only first, or same-cell plus adjacent partial
     shade?
5. Shared projects:
   - should projects be invisible internal intentions first, or visibly marked
     planned cells?

## 7. Risks

- Save size and migration risk if every transient pollen patch or project is
  persisted too eagerly. Persist only active states that matter after reload.
- Performance risk if occupancy scans are naive. Use normalized cell keys and
  cheap per-frame indexes once ENV1 grows.
- Social spam risk from pollen handoff requests. Rate-limit offers and ensure
  direct dialogue remains concise.
- False-green risk from scenario-only tests. Each phase needs one deterministic
  scenario plus one organic lane by ENV12.
- Block ecology risk if flower-to-block conversion floods blocks. Cap by zone,
  exhaustion cost, and cell availability.

## 8. Immediate Next Best Step

Implement ENV0 and ENV1 first. ENV1 is the foundation for every idea in this
plan. Without shared occupancy, pollen patches, dirt piles, flowers, and blocks
can keep contradicting each other.

