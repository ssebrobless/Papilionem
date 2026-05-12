# SR Save Schema Migration Plan - 2026-05-12

Author: Claude (planning) / Codex (implementation)
Scope: Additive save-schema migration plan for SR1 through SR7. Authoritative companion to `docs/SAVE-SCHEMA-REGISTRY.md`.
Owner-track signoff: joint with `runtime v7`, `spatial s7`, `social n8` (per existing protected-state rules).

## 1. Purpose

`docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md` reopens save-schema versioning for an additive sweep across SR1-SR7. This doc names every field added, the owning phase, the default for legacy saves, the migration rule, and the audit hook. Each SR phase is permitted to add only the fields listed against it; nothing else.

## 2. Storage Keys (unchanged)

```
papilionem-save-v2            game state
papilionem-progression-v1     progression
papilionem-accessibility-v1   accessibility
papilionem-audit-setup-v1     audit
papilionem-audit-reports-v1   audit reports
```

The localStorage *keys* do not change during the SR ladder. Inner `schemaVersion` (the field inside the save payload) increments as described below.

## 3. Inner schemaVersion Lifecycle

```
+----------------+--------+--------------------------------------+
| Stage          | Value  | Notes                                |
+----------------+--------+--------------------------------------+
| Pre-SR0 (current) | 4    | Per docs/SAVE-SCHEMA-REGISTRY.md     |
| SR1            | 4      | No persisted fields added            |
| SR2            | 4 -> 5 | First additive bump; selfModel field |
| SR3            | 5      | Additive, no version bump            |
| SR4            | 5      | Additive, no version bump            |
| SR5            | 5      | Additive, no version bump            |
| SR6            | 5      | Per-archetype weights serialized     |
|                |        | outside butterfly state; no bump     |
| SR7            | 5      | episodicLog + narrativeText fields   |
| SR10 promotion | 5      | Final lock, joint signoff            |
+----------------+--------+--------------------------------------+
```

Rationale for a single bump at SR2: `schemaVersion` increments only when a load path must branch on it. SR1's workspace is ephemeral and not persisted. SR2 adds the first persisted SR field, so that is where the bump lives. SR3-SR7 are all `defaultIfMissing` extensions and do not branch any load path.

## 4. Field Migration Table

```
+----+---------------------------------------+--------+---------------------+
| SR | Field path                            | Type   | Default for legacy  |
+----+---------------------------------------+--------+---------------------+
| SR2| butterfly.lifeSim.selfModel            | object | { initialized: false, ready on first tick } |
| SR3| butterfly.lifeSim.metacognition        | array  | []                  |
| SR4| butterfly.lifeSim.bonds[*].theoryOfMind| object | { initialized: false }   |
| SR4| caterpillar.lifeSim.bonds[*].theoryOfMind | object | { initialized: false }|
| SR5| butterfly.lifeSim.intrinsicDrives      | object | { curiosity: 0, competence: 0, boredom: 0 } |
| SR5| caterpillar.lifeSim.intrinsicDrives    | object | same as above        |
| SR6| top-level archetypeWeights             | record | empty; falls back to assets/ml/m8-garden-policy.json |
| SR6| meta.archetypeWeightsBootstrapDigest   | string | null                |
| SR7| butterfly.lifeSim.episodicLog          | array  | []                  |
| SR7| butterfly.lifeSim.narrativeText        | string | ""                  |
| SR7| butterfly.lifeSim.narrativeUpdatedTick | int    | 0                   |
+----+---------------------------------------+--------+---------------------+
```

All new fields are `migration-safe` in the sense of `docs/SAVE-SCHEMA-REGISTRY.md`: they round-trip across save and load, and `defaultIfMissing` is the only behavior on legacy saves.

## 5. Protected Groups (unchanged)

The protected-state groups from `docs/SAVE-SCHEMA-REGISTRY.md` remain protected:

```
identity
drives
emotions
memory
relationship edges
lineage
```

SR phases extend these groups *additively*. The protected group `drives` gains `intrinsicDrives` (SR5) but never has existing drive fields rewritten. The protected group `memory` gains `episodicLog` (SR7) but never has existing memory fields rewritten. The protected group `relationship edges` gains `theoryOfMind` (SR4) but never has existing edge fields rewritten.

No SR phase may overwrite a protected field as a shortcut for repair.

## 6. Per-Phase Migration Rules

### SR1 - Global Workspace

Persisted fields added: **none**.

Workspace is ephemeral per-tick state. It is rebuilt at game start and at save load. No migration entries.

### SR2 - Self-Model

Persisted fields added:

```
butterfly.lifeSim.selfModel = {
  predictedNextEmotion: { primary: null, intensity: 0 },
  currentSelfAssessment: { traitsSelfRated: {}, dominantDrive: null },
  perceivedByOthersBelief: { mood: null, intent: null },
  divergenceFromActual: 0,
  initialized: false,
  lastUpdatedTick: 0
}
```

Migration:

- New saves: written by `selfModelSystem.initializeForButterfly()` on butterfly construction.
- Legacy saves: `defaultIfMissing` returns the shape above with `initialized: false`. First tick after load populates it.
- Caterpillars: same field, same shape, populated when caterpillar transitions to butterfly.

Inner `schemaVersion` bumps from 4 to 5. The load path branches once: if `schemaVersion < 5`, run a one-time migration that inserts the default `selfModel` on every butterfly and caterpillar, then writes `schemaVersion = 5`.

### SR3 - Metacognition

Persisted fields added:

```
butterfly.lifeSim.metacognition = [
  // ring buffer cap 32
  { feelingId, firstOrderEmotion, metaEmotion, metaIntensity, tick }
]
```

Migration:

- Legacy and SR2-era saves: `defaultIfMissing` returns `[]`.
- No `schemaVersion` bump.
- Ring buffer cap enforced on push: oldest entries dropped at cap.

### SR4 - Theory of Mind

Persisted fields added (nested inside existing relationship-edge entries):

```
butterfly.lifeSim.bonds[*].theoryOfMind = {
  believedDrives: {},
  believedMood: { primary: null, intensity: 0 },
  believedGoal: null,
  divergenceFromActual: 0,
  initialized: false,
  lastUpdatedTick: 0
}
```

Migration:

- Legacy and SR2/SR3-era saves: `defaultIfMissing` returns the shape above with `initialized: false` per bond. First tick after load populates it.
- Protected group `relationship edges` unchanged in shape; `theoryOfMind` is a nested addition.
- No `schemaVersion` bump.

### SR5 - Intrinsic Motivation

Persisted fields added (inside the protected `drives` group, but as a sibling subfield, not overwriting any existing drive):

```
butterfly.lifeSim.intrinsicDrives = {
  curiosity: 0.0,
  competence: 0.0,
  boredom: 0.0,
  lastUpdatedTick: 0
}
```

Migration:

- Legacy and pre-SR5 saves: `defaultIfMissing` returns `{ curiosity: 0, competence: 0, boredom: 0, lastUpdatedTick: 0 }`.
- Caterpillars: same field, same shape.
- No `schemaVersion` bump.
- Existing drive values are not touched.

### SR6 - Online Learning Loop

Persisted fields added (top-level on the save payload, not on individual butterflies):

```
save.archetypeWeights = {
  [archetypeId]: {
    schemaVersion: 'archetype-mlp-v1',
    layerShapes: [...],
    weights: [...],          // flat Float32 array, base64 encoded
    biases: [...],
    bootstrapDigest: 'sha1-...',
    lastTrainedTick: 0
  }
}
save.meta.archetypeWeightsBootstrapDigest = 'sha1-...'   // digest of bootstrap artifact at SR6 ship
```

Bootstrap artifacts live in `assets/ml/archetypes/<archetype>.weights.json` and are loaded if `save.archetypeWeights[archetype]` is missing.

Migration:

- Legacy and pre-SR6 saves: `save.archetypeWeights` defaults to `{}`. ML inference falls back to `assets/ml/m8-garden-policy.json` per the existing `mlInferenceSystem.js` fallback path.
- SR6-era saves: `archetypeWeights` is populated and used. The bootstrap artifact is the safety net if any archetype's weights are missing.
- No `schemaVersion` bump on the butterfly schema.
- Per-archetype weight files are serialized atomically and write-protected against partial writes (write-temp-rename).

The legacy `assets/ml/m8-garden-policy.json` is *not deleted*. It remains the deterministic fallback.

### SR7 - Narrative Self

Persisted fields added:

```
butterfly.lifeSim.episodicLog = [
  // ring buffer cap 64
  {
    tick,
    type,          // 'bond-formed' | 'bond-lost' | 'death-witnessed' | 'role-change' | 'identity-perturbation' | ...
    summary,       // structured summary, not text
    witnesses: [], // butterfly ids that observed
    emotionalValence,
    salience
  }
]

butterfly.lifeSim.narrativeText = ""             // last generated reflection, 2-4 sentences
butterfly.lifeSim.narrativeUpdatedTick = 0
```

Migration:

- Legacy and pre-SR7 saves: `episodicLog = []`, `narrativeText = ""`, `narrativeUpdatedTick = 0`.
- Caterpillars: same fields, same shape. On caterpillar -> butterfly transition, caterpillar's episodicLog is preserved.
- No `schemaVersion` bump.
- Ring buffer cap enforced on push.

## 7. Forward-Compat Rules

Every SR phase asserts the following on load:

```
load(save):
  if save.schemaVersion > KNOWN_MAX:
    refuse to load; surface a clear error
  if save.schemaVersion < CURRENT:
    run additive migration; do not wipe; do not transform protected groups
  for each SR field:
    if missing: insert default
    if present: round-trip unchanged
```

The save system MUST never:

- Wipe a long-running save to simplify migration.
- Overwrite a protected field as a shortcut.
- Drop unknown fields. Unknown fields are preserved and round-tripped.
- Branch on `schemaVersion` for anything other than the single SR2 migration step.

## 8. Rollback Flags

Every SR phase ships behind a config flag in `core/gameConfig.js` (or equivalent). Disabling the flag falls back to pre-SR behavior without losing the persisted field.

```
+----+-------------------------------+----------------------------+
| SR | Flag                          | Off behavior                |
+----+-------------------------------+----------------------------+
| SR1| workspace.enabled             | observe-only, no broadcasts |
| SR2| selfModel.enabled             | field present, not updated  |
| SR3| metacognition.enabled         | field present, not written  |
| SR4| theoryOfMind.enabled          | field present, not updated  |
| SR5| intrinsicDrives.enabled       | drives zeroed, no influence |
| SR6| onlineLearning.enabled        | static m8 policy fallback   |
| SR7| narrativeSelf.enabled         | field present, not written  |
+----+-------------------------------+----------------------------+
```

When a flag is off, the persisted field still serializes (so toggling back on does not lose data). Only the update logic is disabled.

## 9. Migration Test Plan

Each SR phase must include a migration test that proves:

1. A legacy save (pre-SR, schemaVersion = 4) loads cleanly with all new fields defaulted.
2. A round-trip (save -> load -> save) produces byte-equivalent output for protected groups.
3. A round-trip with the rollback flag off and on both succeed.
4. The H5 long-running save smoothness audit still passes.
5. The N8 social save continuity audit still passes.

The aggregated migration test target is:

```
node scripts/run-h5-long-running-save-smoothness-audit.js
node scripts/run-n8-social-save-continuity-audit.js
node scripts/run-runtime-self-audit.js
node scripts/run-g0h-scripted-playthrough.js
```

Every SR evidence-lock doc must cite green reports for all four.

## 10. Joint Signoff Process

The existing joint-signoff rule from `docs/SAVE-SCHEMA-REGISTRY.md` applies. The SR2 `schemaVersion = 4 -> 5` bump must be signed jointly across `runtime v7`, `spatial s7`, `social n8`. Codex must update `docs/SAVE-SCHEMA-REGISTRY.md` at SR2 with:

```
2026-MM-DD shared save-schema signoff (SR2)
|- schemaVersion -> 5
|- runtime v7    -> additive: meta.archetypeWeightsBootstrapDigest reserved
|- spatial s7    -> no shape change
|- social n8     -> additive: butterfly.lifeSim.selfModel
`- c7 state      -> additive: schemaVersion bump signed
```

Each subsequent SR phase adds its own signoff block to the registry, even when `schemaVersion` does not bump.

## 11. Cross-References

- `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`
- `docs/SAVE-SCHEMA-REGISTRY.md`
- `docs/FULL-SUCCESS-REFINED-PLAN-2026-05-06.md` (section 3 amended by SR0)
- Existing migration audits: `h5_long_running_save_smoothness_audit`, `n8_social_save_continuity_audit`
