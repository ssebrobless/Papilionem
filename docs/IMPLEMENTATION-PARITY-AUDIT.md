# Papilionem Implementation Parity Audit

## Purpose

This audit compares current source-of-truth direction against the live runtime
at the frozen closure baseline.

Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish sequencing.

```text
source contract
      |
      v
live owner code
      |
      v
live / partial / active drift
```

## Current Summary

```text
+======================================================================+
| Parity Snapshot                                                      |
+======================================================================+
| UI shell / journal                     | live                        |
| carry / flower coherence               | live                        |
| wild ecology / release loop            | live                        |
| zone identity / incentives             | live                        |
| spatial model / pseudo-3D truth        | live                        |
| controls / overlay continuity          | live                        |
| live dispersal                         | live                        |
| crowded-zone optimization              | live                        |
| communication runtime                  | live                        |
| battle presentation                    | live                        |
| player/source docs                     | live                        |
+======================================================================+
```

## System Audit

### 1. UI Shell / Journal

```text
source truth
|- readable in-window
|- basic identity visible first
`- dense content scrolls internally

live truth
|- journal shell fits in-window
|- summary header keeps preview, name, description, and parent context front-loaded
`- wheel scroll is content-only inside the current page viewport, not page-change

status
`- live
```

Primary seams:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

### 2. Carry / Flower Coherence

```text
source truth
|- held objects should be stable
|- butterflies should not sleep while holding blocks
`- flowers should use the one-style visual direction

live truth
|- carried blocks resolve through one stable owner even after local carry-id drift
|- butterflies put blocks down before sleep and will not remain asleep while still carrying
`- flowers use one silhouette family with palette variation and normalize legacy type ids

status
`- live
```

Primary seams:
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

### 3. Wild Ecology / Release Loop

```text
source truth
|- progression ladder removed
|- wild ecology / release loop is primary
`- hybrid cap = 50

live truth
|- release-wave bookkeeping is live
|- Inspect owns release flow
|- cap pressure / emergence / travel use the 50-cap path
`- wild reappearance remains active even at hybrid cap

status
`- live
```

Primary seams:
- `core/gameCore.js`
- `core/progressionManager.js`
- `systems/breedingSystem.js`
- `ui/gameUI.js`

### 4. Zone Identity / Cross-Zone Travel

```text
source truth
|- butterflies should move between zones for reasons
`- zones should feel behaviorally distinct

live truth
|- zones now expose explicit identity labels, tags, settle bias, and action-bias profiles
|- auto travel uses action-fit, novelty, crowd relief, and recent-zone memory
|- life-sim derived state now shifts after arrival so training/watchful/exploratory/calm zones feel different
|- moss-hollow once again settles as the highest-caution resident zone after travel churn
`- focused UI summaries now surface the stronger identity profile

status
`- live
```

Primary seams:
- `core/gameCore.js`
- `core/config.js`
- `systems/lifeSimSystem.js`
- `systems/zoneSystem.js`
- `ui/gameUI.js`

### 5. Spatial Model / 3D Grid

```text
source truth
|- pseudo-3D garden with derived verticality and spatial rules
`- future free-3D work must not be mistaken for live runtime

live truth
|- current pseudo-3D runtime is documented canonically
|- focused-garden placement uses the shared section-scene region
`- physics / structure seams own the active spatial truth

status
`- live
```

Primary seams:
- `core/gridManager.js`
- `systems/structureSystem.js`
- `systems/physicsSystem.js`
- `docs/CURRENT-SPATIAL-TRUTH.md`

### 6. Controls / Overlay Continuity

```text
source truth
|- simple button-first controls
`- specimen counts stay visible for testing

live truth
|- redundant global panel hotkeys were removed
`- debug overlays keep specimen counters visible

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `core/renderManager.js`

### 7. Live Dispersal

```text
source truth
|- butterflies should spread, regroup, and spread again
`- gathering should be temporary, not permanent collapse

live truth
|- wander points use live sector occupancy
|- flower and block choices respect crowd pressure
`- settled gardens keep soft social grouping without one-patch collapse

status
`- live
```

Primary seams:
- `core/gameCore.js`
- `entities/butterfly.js`

Audit evidence:
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

### 8. Crowded-Zone Optimization

```text
source truth
|- optimize by smarter cadence / caching
`- keep important simulation truth

live truth
|- runtime now uses a shared pressure profile
|- particle emission adapts to pressure and available pool headroom
|- decorative effects are pruned before important readability effects
|- crowded reply churn is throttled without removing dialogue truth
`- crowded-scene runtime is currently passing without deferred particle warnings

status
`- live
```

Primary seams:
- `systems/telemetrySystem.js`
- `core/renderManager.js`
- `systems/specialEffects.js`
- `systems/particleSystem.js`
- `systems/communicationSystem.js`
- `core/gameCore.js`

Audit evidence:
- `scripts/run-runtime-self-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`

### 9. Communication Runtime

```text
source truth
|- real dialogue should be intent + stance + memory shaped
|- signals are internal only
`- butterflies should have real name identity

live truth
|- hybrids now emerge with personal names instead of placeholder labels
|- duplicate living hybrid names keep the oldest unsuffixed and later duplicates gain one-letter display suffixes
|- butterflies now retain self-name identity and learn the names of butterflies they speak with or hear
|- spoken dialogue now carries intent family, intent subtype, and reply stance metadata
|- reply pacing is still live at 2.0 seconds
`- spoken lines now compose from talk mode, zone lexicon, register, tone, and relationship context instead of old full-line signal tables

status
`- live
```

Primary seams:
- `systems/communicationSystem.js`
- `systems/breedingSystem.js`
- `core/progressionManager.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-r6-communication-audit.js`

### 10. Battle Presentation

```text
source truth
|- top-down arena
|- readable movement and consequence
|- projectiles / emitted effects where appropriate
`- flower-related battle behavior when called for

live truth
|- top-down staging is live and battle labels now use canonical butterfly identity
|- action families now show clearer attack / rally / guard / retreat reads
|- battle feeds now keep representative combat actions visible when side-effect events spike
|- projectiles / emitted effects now carry ability-specific visual styles
`- flower-related battle behavior is now live through Delicate Pink bloom/petal battle effects

status
`- live
```

Primary seams:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

### 11. Source / Player Docs

```text
source truth
|- docs should match current runtime truth
`- historical plans should not masquerade as live behavior

live truth
|- guidebook, player guide, contracts, and diagram prompts now reflect the repaired runtime
|- the rebuilt source book carries current ecology, controls, accessibility, and battle shell truth
`- historical closure docs are now labeled as historical checkpoints instead of live status

status
`- live
```

Primary seams:
- `docs/PAPILIONEM-GUIDEBOOK.md`
- `docs/PAPILIONEM-PLAYER-GUIDE.md`
- `docs/WILD-ECOLOGY-RELEASE-CONTRACT.md`
- `docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`
- `docs/GEMINI-DIAGRAM-PROMPTS.md`
- `docs/source-book/PAPILIONEM-SOURCE-BOOK.md`
- `ui/gameUI.js`
- `ui/debugUI.js`

## Active Gap Order

```text
1. no active parity gap on the current board
```

## Closure Baseline

```text
2026-04-18
|- targeted closure reruns passed for runtime self, communication,
|  single-player autobattle, zone identity, and battle presentation
|- the battle presentation audit now evaluates a short combat window so
|  fast resolves do not create one-frame false negatives
`- broader frozen-baseline reruns also passed for controls, wild ecology,
   and UI readability
```
