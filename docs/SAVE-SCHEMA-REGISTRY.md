# Save Schema Registry

## Purpose

This is the shared save-schema contract for the three active migration phases:

```text
runtime v7
   |
   +-- joint schema contract -- spatial s7
   |
   +-- joint schema contract -- social n8
```

If a persistent field is not listed here, it is not part of the protected
cross-track schema contract.

## Schema Lock

```text
schemaVersion = 5
```

Rules:
- `runtime v7`, `spatial s7`, and `social n8` read and bump this file jointly.
- No independent migration may change save schema versioning on its own.
- Long-running saves keep butterfly identity, memories, relationships, and lineage.
- `migration-safe` means the stored field family must round-trip unchanged.
- `migration-derives` means the field family may be rebuilt from protected truth.

## Joint Signoff

```text
2026-04-25 shared save-schema signoff
|- schemaVersion -> 4
|- runtime v7    -> no schema bump required
|- spatial s7    -> no schema bump required
|- social n8     -> no schema bump required
`- c7 state      -> signed locally on the lived-in-save proof stack
```

```text
2026-05-12 shared save-schema signoff (SR2)
|- schemaVersion -> 5
|- runtime v7    -> additive: no runtime protected-field overwrite
|- spatial s7    -> no shape change
|- social n8     -> additive: butterflies[].lifeSim.selfModel and caterpillars[].lifeSim.selfModel
`- c7 state      -> additive self-model defaults signed by SR2 audit
```

```text
2026-05-12 shared save-schema signoff (SR3)
|- schemaVersion -> 5 (no bump)
|- runtime v7    -> no shape change
|- spatial s7    -> no shape change
|- social n8     -> additive: butterflies[].lifeSim.metacognition and caterpillars[].lifeSim.metacognition
`- c7 state      -> defaultIfMissing [] signed by SR3 audit
```

DefaultIfMissing:
- `lifeSim.selfModel.predictedNextEmotion`: `"steady"` until first SR2 update.
- `lifeSim.selfModel.currentSelfAssessment`: confidence `0.35`, roleGuess `"wanderer"`, nullable dominant drive/emotion/workspace focus.
- `lifeSim.selfModel.perceivedByOthersBelief`: mood/intent `"unknown"`, reputationEstimate `0.2`, socialContext `"quiet"`.
- `lifeSim.selfModel.divergenceFromActual`: `0`, then smoothed per tick after workspace broadcast is available.
- `lifeSim.metacognition`: `[]`; ring buffer cap 32, persisted as second-order emotion tag packets.

Evidence:
- [V7-VISUAL-RESTORATION-AUDIT.md](./V7-VISUAL-RESTORATION-AUDIT.md)
- [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md)
- [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)
- [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)

## Canonical Persistent Field Families

| Group | Canonical persisted paths written by `saveSystem.js` | owner-track | Tag |
| --- | --- | --- | --- |
| `identity` | `butterflies[].{id,displayName,personalityType,sex,birthSource,specialAbility,isImmortal,isHybrid,hybridEntryId,colors,wingPattern}`, `flowers[].{id,flowerType,isImmortal,petalColor,centerColor,accentColor,stemColor}`, `caterpillars[].{id,phase,dead,failReason}`, `blocks[].{id,objectProfile}` | `baseline-core (reviewed in runtime-v7)` | `migration-safe` |
| `drives` | `butterflies[].lifeSim.drives`, `caterpillars[].lifeSim.drives`, durable drive families nested under `foundations.lifeSim.*` | `social n8` | `migration-safe` |
| `emotions` | `butterflies[].lifeSim.emotions`, `caterpillars[].lifeSim.emotions`, durable emotion families nested under `foundations.lifeSim.*` | `social n8` | `migration-safe` |
| `memory` | `butterflies[].lifeSim.memories`, `caterpillars[].lifeSim.memories`, dialogue/social memory packets under `foundations.lifeSim.*` and `foundations.communication.*` | `social n8` | `migration-safe` |
| `relationship edges` | `butterflies[].lifeSim.socialEdges`, `caterpillars[].lifeSim.socialEdges`, durable edge/residue families under `foundations.lifeSim.*`, `foundations.communication.*`, `foundations.roster.*`, `foundations.teaching.*` | `social n8` | `migration-safe` |
| `self model` | `butterflies[].lifeSim.selfModel`, `caterpillars[].lifeSim.selfModel` | `social n8 / SR2` | `migration-safe` |
| `metacognition` | `butterflies[].lifeSim.metacognition`, `caterpillars[].lifeSim.metacognition` | `social n8 / SR3` | `migration-safe` |
| `lineage` | `butterflies[].{hybridGenome,mutationProfile,pregnancy,breeding,wildLifecycle}`, `flowers[].{eggData,chrysalisData,goldenBlessing}`, `caterpillars[].lifecycleData`, lineage-bearing entries nested under `progression.hybridJournal` | `baseline-core (reviewed in social n8)` | `migration-safe` |
| `progression` | `progression.*`, including fallback fields `nextHybridId`, `progressionOrderIndex`, `unlockedButterflyTypes`, `unlockHistory`, `starterPairsSeeded`, `perTypeUnlockStatus`, `perWildButterflyProgress`, `encounteredButterflies`, `collectedButterflies`, `butterflyCollectionStats` | `baseline-core (reviewed in runtime-v7)` | `migration-safe` |
| `spatial core` | `butterflies[].{x,y,currentZoneId,zoneTravel,blockInteraction,feeding}`, `flowers[].{x,y,currentZoneId,occupancyState,allowedButterflyId}`, `caterpillars[].{x,y,currentZoneId,targetFlowerId}`, `blocks[].{x,y,currentZoneId,renderWidth,renderHeight,blockHeight,stackIndex,supportBlockId,lastPlacedMode,carriedById,attachedOffset,movedAtFrame,lastMovedById}`, `foundations.{zones,objects,sleep}` | `spatial s7` | `migration-safe` |
| `social summary` | durable summaries nested under `foundations.lifeSim.*`, `foundations.communication.*`, `foundations.roster.*`, `foundations.teaching.*`, and any presentation-facing residue groupings derived from those stores | `social n8` | `migration-derives` |
| `settings` | `meta.{timeScale,focusedZoneId,viewMode,accessibilitySettings}`, `runtime.showButterflyCollection` | `runtime v7` | `migration-safe` |
| `runtime continuity` | `meta.{serializedAtMs,replay}`, `runtime.{butterflySpawnCounts,goldenButterflySpawned,feedingCombo,lastFeedingTime,maxCombo,pendingOffspringReservations}`, `foundations.mlInference.*`, `foundations.statuses.*` | `runtime v7` | `migration-safe` |
| `refresh metadata` | `meta.refreshRevisions`, `meta.persistRefreshToStorage`, `meta.restoreRecoveryNote`, and other rebuild markers used to normalize world layout after load | `runtime v7 + spatial s7` | `migration-derives` |

## Protected-State Rule

The protected-state groups are:

```text
identity
drives
emotions
memory
relationship edges
lineage
```

No ML phase, UI migration, or spatial migration may overwrite those groups as a
shortcut for repair.
