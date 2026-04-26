# Papilionem Active Repair Board

## Purpose

This is the frozen repair board for the closure baseline that mattered in the
current build.

Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish sequencing.

```text
+=======================================================================+
| Current Repair Shape                                                  |
+=======================================================================+
| A1  UI shell / journal readability             | live                 |
| A2  carry / flower coherence                   | live                 |
| A3  zone identity / cross-zone motivation      | live                 |
| A4  spatial model / 3D-grid truth audit        | live                 |
| A5  control simplification / overlay continuity| live                 |
| A6  live dispersal behavior                    | live                 |
| A7  crowded-zone optimization                  | live                 |
| A8  real dialogue composer + naming identity   | live                 |
| A9  battle presentation parity                 | live                 |
| A10 source-book de-staling                     | live                 |
+=======================================================================+
```

## Status Key

```text
live
|- implemented and passing current audit

active
|- still visibly incomplete
`- next repair work should continue here
```

## Current Truth Snapshot

```text
live now
|- journal shell fits in-window, keeps identity visible first, and scrolls internally
|- carried blocks resolve through one stable pose owner
|- butterflies put blocks down before sleep
|- flowers use one live silhouette family with palette variation
|- hybrid-cap authority, zone identity, and visible cross-zone travel are live
|- current pseudo-3D truth is documented and audited
|- redundant panel hotkeys were removed
|- specimen counters stay visible in debug
|- butterflies spread with soft crowd-avoidance and underused-space attraction
|- crowded-scene pressure now uses shared telemetry, adaptive particles,
|  smarter effect budgets, and throttled dialogue churn
|- hybrids now emerge with personal names, duplicate-name disambiguation,
|  known-name memory, and live intent/stance dialogue composition
|- battle feeds now keep representative combat actions visible even when
|  pressure / hp side-events spike
`- closure baseline re-confirmed zone-local caution identity after travel settles
```

```text
still active
`- no open repair remains on the current board
```

## Post-A10 Closure Baseline

```text
closed truth
|- targeted closure reruns are green for runtime self, communication,
|  single-player autobattle, and zone identity
|- battle event recency now prefers representative combat reads over noisy side-effects
|- the battle presentation audit now scores a short combat window instead of one arbitrary frame
`- broader frozen-baseline reruns also passed for controls, wild ecology, and UI readability on 2026-04-18
```

Primary owners:
- `systems/battleSystem.js`
- `systems/lifeSimSystem.js`
- `scripts/run-r5-battle-presentation-audit.js`

Audit evidence:
- `scripts/run-runtime-self-audit.js`
- `scripts/run-r6-communication-audit.js`
- `scripts/run-single-player-autobattle-audit.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-r5-battle-presentation-audit.js`

## Closed Repairs

### A1 - UI Shell / Journal Readability

```text
closed truth
|- journal shell now fits inside the game window by default
|- page headers keep preview, name, description, and parent context readable first
|- mouse wheel scrolls page content only inside the content viewport
|- page changes are arrows / arrow keys only
`- long journal content scrolls internally instead of running off-screen
```

Primary owners:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-r4-ui-readability-audit.js`

### A2 - Carry / Flower Coherence

```text
closed truth
|- carried blocks recover from local/world owner drift through one stable owner path
|- sleep will not continue while a block is still carried
|- butterflies safely put blocks down before settling into sleep
`- legacy flower type ids normalize into the approved one-style live family
```

Primary owners:
- `entities/butterfly.js`
- `entities/block.js`
- `entities/flower.js`
- `systems/physicsSystem.js`
- `systems/sleepSystem.js`
- `ui/debugUI.js`

Audit evidence:
- `scripts/run-a2-carry-flower-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-deep-systems-audit.js`

### A4 - Spatial Model / 3D-Grid Truth Audit

```text
closed truth
|- current pseudo-3D runtime is documented canonically
|- focused-garden placement uses the shared section-scene region
|- roam-safe point generation is audited
`- future free-3D work is separated from current runtime truth
```

Primary owners:
- `docs/CURRENT-SPATIAL-TRUTH.md`
- `docs/LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md`
- `core/gridManager.js`

Audit evidence:
- `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-r1-movement-stability-audit.js`

### A5 - Control Simplification / Overlay Continuity

```text
closed truth
|- redundant global hotkeys for clickable panels were removed
|- Escape remains for intentional cancel flows
`- specimen counters stay visible with debug overlays active
```

Primary owners:
- `ui/gameUI.js`
- `core/renderManager.js`

Audit evidence:
- `scripts/run-a5-control-continuity-audit.js`

### A6 - Live Dispersal Behavior

```text
closed truth
|- butterflies score wander points against live sector occupancy
|- feeding and block curiosity respect crowd pressure and recent-target reuse
|- crowded pockets trigger earlier retargeting toward underused space
`- gathering remains possible without permanent knotting
```

Primary owners:
- `core/gameCore.js`
- `entities/butterfly.js`
- `core/config.js`

Audit evidence:
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

### A7 - Crowded-Zone Optimization

```text
closed truth
|- telemetry now exposes a shared pressure profile
|- render/effect degradation keys off shared pressure instead of isolated guesses
|- particle emission scales to load and respects pool headroom
|- decorative effects are pruned before important readability effects
|- queued dialogue replies now respect crowded-scene budgets
`- particle pool bookkeeping no longer leaks active slots during pool handoff
```

Primary owners:
- `systems/telemetrySystem.js`
- `core/renderManager.js`
- `systems/specialEffects.js`
- `systems/particleSystem.js`
- `systems/communicationSystem.js`
- `core/gameCore.js`

Audit evidence:
- `scripts/run-runtime-self-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`

## Active Repairs

### A3 - Zone Identity / Cross-Zone Motivation

```text
closed truth
|- each zone now carries explicit identity labels, tags, settle bias, and action-bias profiles
|- gameCore scores travel with action-fit, novelty, crowd relief, and recent-zone memory
|- butterflies now retain lightweight zone-travel memory to reduce ping-pong and support meaningful movement
|- life-sim derived state now bends toward the active zone's role after arrival
|- training, watchful, exploratory, and calm zones now produce visibly different resident bias patterns
|- moss-hollow once again settles as the highest-caution resident zone after travel churn
`- focused UI summaries now surface the richer zone identity instead of flattening everything into one garden rhythm
```

Owners:
- `core/config.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/zoneSystem.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-r2-zone-transition-audit.js`
- `scripts/run-runtime-self-audit.js`

### A8 - Real Dialogue Composer + Naming Identity

```text
closed truth
|- hybrids now receive personal first names at emergence
|- duplicate living hybrid first names keep the oldest unsuffixed and give later duplicates a one-letter display suffix
|- butterflies now retain self-name identity and learn the names of butterflies they speak with or hear
|- dialogue records now carry intent family, intent subtype, and reply stance metadata
|- spoken lines are composed from live intent, talk mode, register, tone, zone lexicon, and relationship context
`- reply timing, inspect summaries, and Talk feed formatting remain aligned with the new runtime
```

Owners:
- `core/progressionManager.js`
- `core/entity.js`
- `entities/butterfly.js`
- `systems/breedingSystem.js`
- `systems/communicationSystem.js`
- `scripts/run-r6-communication-audit.js`

Audit evidence:
- `scripts/run-r6-communication-audit.js`

### A9 - Battle Presentation Parity

```text
closed truth
|- battle HUD and battle log now use canonical butterfly labels instead of id fragments
|- top-down combat now shows distinct guard, retreat, rally, attack, and special-action cues
|- battle projectiles now carry ability-specific visual styles instead of generic dots only
|- Delicate Pink now has flower-related battle behavior through bloom/petal combat effects
`- battle audits now verify readable labels, special labels, projectile styles, and flower-related battle actions
```

Owners:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

Audit evidence:
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

### A10 - Source-Book De-Staling

```text
closed truth
|- guidebook, player guide, contracts, and diagram prompts now describe the live wild-ecology/button-first runtime
|- on-screen helper copy no longer advertises retired panel hotkeys
`- the source book now rebuilds cleanly from current upstream docs
```

## Next Implementation Order

```text
1. no open repair on the current board
```
