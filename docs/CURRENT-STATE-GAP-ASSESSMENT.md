# Current State Gap Assessment

## Purpose

This doc compares the current live build against
[GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md).

It answers:

```text
what is already aligned?
what is only partially aligned?
what still blocks "success" for each section?
```

## Current Snapshot

```text
╔════════════════════════════ Current Read ═════════════════════════════╗
║ 3D / spatial board truth        │ mostly aligned                     ║
║ blocks / flowers / support      │ mostly aligned                     ║
║ movement / travel               │ mostly aligned                     ║
║ social relationships / emotion  │ partially aligned                  ║
║ dialogue / conversation         │ partially aligned                  ║
║ neural / scoring layer          │ partially aligned                  ║
║ runtime / visual quality        │ partially aligned (was mostly)     ║
║ persistence / continuity        │ mostly aligned                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

Note: runtime / visual quality was downgraded from `mostly aligned` to
`partially aligned` by the `2026-04-26` Claude Review based on the
underlying telemetry of the h5 capture (see pillar 7 below).

Blocker taxonomy used below:

```text
primary blocker type
├─ implementation gap   -> the game still needs new or changed behavior
├─ acceptance gap       -> mechanics exist, but player-believable closure is missing
├─ proof gap            -> stronger evidence is still required before closure
└─ outside-evidence gap -> local proof is stronger than outside-session proof
```

Status language:

```text
aligned
└─ matches the success target closely enough that only routine proof remains

mostly aligned
└─ mechanics are strong, but acceptance-level or breadth gaps remain

partially aligned
└─ the system works, but it still misses an important part of the target feeling
```

## Goal-by-Goal Read

### 1. Spatial / Pseudo-3D

```text
current read
└─ mostly aligned
```

Strongest proof:

- [a4 spatial truth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-26T03-59-40-141Z/report.json) -> `pass`
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) -> `pass`
- [h5 long-running save smoothness audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T03-59-40-141Z/report.json) -> `pass`

What now lines up:

- one shared focused-garden placement region is live
- physics and structure are the authoritative spatial owners
- save/load rebuilds widened-board spatial truth correctly
- doorway/corridor travel is green in the audited route lanes

What still does not line up fully:

- this is mechanically unified, but not yet acceptance-closed as a fully legible pseudo-3D illusion in all lived-in scenarios
- current proof is strongest for butterflies, blocks, and route corridors; it is thinner for broader mixed-stage/entity visual acceptance

Concrete blockers:

- no dedicated lived-in manual acceptance sweep for all visible pseudo-3D cases
- no explicit acceptance lane for eggs/cocoons/caterpillars plus carry/cover in one longer free-play review

Type of remaining work:

```text
primary: acceptance gap
secondary: proof gap
not a core architecture gap
```

### 2. Blocks / Flowers / Building

```text
current read
└─ mostly aligned
```

Strongest proof:

- [b4 carry/stack physics audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/b4_carry_stack_physics_audit/2026-04-26T04-01-21-764Z/report.json) -> `pass`
- [r7 block visual audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r7_block_visual_audit/2026-04-26T04-00-43-069Z/report.json) -> `pass`

What now lines up:

- stacked placement routes through physics
- invalid placements normalize to safe targets
- flower conflicts relocate before block placement
- unsupported stacks settle instead of persisting broken support states

What still does not line up fully:

- the game proves mechanical correctness better than it proves rich autonomous building behavior
- we do not yet have a strong acceptance pass showing butterflies building meaningful multi-step structures under ordinary free play

Concrete blockers:

- no "live colony building" proof lane
- no longer-form manual review of carry -> relocate flower -> place -> stack -> revisit structure in ordinary play

Type of remaining work:

```text
primary: acceptance gap
secondary: implementation gap (autonomous-build richness only)
not a placement-correctness gap
```

### 3. Movement / Travel / Space Use

```text
current read
└─ mostly aligned
```

Strongest proof:

- [r1 movement stability audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r1_movement_stability_audit/2026-04-22T20-10-54-483Z/report.json) -> `pass`
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) -> `pass`
- [a6 live dispersal audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a6_live_dispersal_audit/2026-04-24T02-22-07-620Z/report.json) -> `warn`

What now lines up:

- movement bounds are stable
- corridor-owned travel is green
- live dispersal steps all pass

What still does not line up fully:

- the remaining `a6` warn is render-tooling noise, not a failed movement step
- we still need a stronger acceptance read on movement naturalness, not just movement correctness

Concrete blockers:

- no explicit "does this still look graceful in ordinary play?" acceptance gate
- no recent manual capture review focused only on naturalness of movement style across calm, social, scared, and carrying states

Type of remaining work:

```text
primary: acceptance gap
secondary: proof gap
not a route-correctness gap
```

### 4. Social Relationships / Emotion

```text
current read
└─ partially aligned
```

Strongest proof:

- [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-26T17-00-28-158Z/report.json) -> `pass`
- [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-26T17-01-36-382Z/report.json) -> `pass`
- [e4 social ecology audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/e4_social_ecology_audit/2026-04-26T04-04-50-293Z/report.json) -> `pass`
- [lifesim expression audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/lifesim_expression_audit/2026-04-26T16-58-12-269Z/report.json) -> `pass`

What now lines up:

- social grounding matches life-sim truth
- pair texture, group tone, and follow-through are real
- emotion/resource/threat expression now surfaces correctly

What still does not line up fully:

- the system is now structurally alive, but the target is a believable society, not only green scenario audits
- current proof is still scenario-rich and curated; it does not yet prove enough long free-play social breadth
- much of the richness is easiest to confirm in inspect/feed/debug, not always ambiently through ordinary play alone

Concrete blockers:

- no long-session society-breadth acceptance pass
- no explicit acceptance metric for distinct recurring social arcs over time
- ambient emotional readability may still lag behind underlying truth in ordinary player observation

Type of remaining work:

```text
primary: acceptance gap
secondary: implementation gap (ambient surfacing / breadth)
tertiary: proof gap
not a core ownership gap
```

### 5. Dialogue / Conversation

```text
current read
└─ partially aligned
```

Strongest proof:

- [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-26T17-00-28-158Z/report.json) -> `pass`
- [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-26T17-01-36-382Z/report.json) -> `pass`

What now lines up:

- dialogue is grounded
- voice band/register contract is working
- dialogue can now change later behavior and relationship state

What still does not line up fully:

- the colony is more varied than before, but not yet acceptance-closed as consistently natural, casual, and socially broad
- current lines can still read as system-authored in style even when the logic is correct
- long free play may still expose repetition or narrow phrasing that scenario audits do not punish hard enough

Concrete blockers:

- no long-form repetition/naturalness acceptance sweep
- no explicit topic-breadth target for ordinary ambient conversation
- no manual proof that companionship, teasing, praise, repair, flirtation, tension, and curiosity all appear often enough in uncontrolled play

Type of remaining work:

```text
primary: implementation gap (content/style breadth)
secondary: acceptance gap
not a grounding or follow-through bug
```

### 6. Neural / Scoring Layer

```text
current read
└─ partially aligned
```

Strongest proof:

- [n6 neural social scoring audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/n6_neural_social_scoring_audit/2026-04-26T04-03-47-795Z/report.json) -> `pass`

What now lines up:

- ML scoring is bounded by the life-sim contract
- it is using richer social features
- it helps weight seek/avoid/imitate/protect style behavior

What still does not line up fully:

- we can prove the scorer is legal and useful in targeted scenarios
- we cannot yet prove strongly enough that ML-on creates a noticeably
  more believable society in longer free play
- the ML cadence is the largest update contributor in the h5 capture
  (`37.27ms` for `foundation.mlCadenceIntervalFrames`), which makes ML's
  runtime cost a real factor; value alone is not sufficient justification
  if that cost is not paid back in lived-in coherence

Concrete blockers:

- no dedicated ML-on versus ML-off free-play acceptance comparison
- no explicit value proof beyond targeted scenario scoring
- no cost-vs-value reconciliation for the ML cadence's update budget

Type of remaining work:

```text
primary: proof gap
secondary: implementation gap (cost-vs-value if ML remains expensive)
not an ownership-boundary gap
```

### 7. Runtime / Visual Quality

```text
current read
└─ partially aligned (downgraded by Claude Review on 2026-04-26)
```

Strongest proof:

- [h5 long-running save smoothness audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T03-59-40-141Z/report.json) -> `pass`
- `v8a` full runtime-only packet on `2026-04-26`

What now lines up:

- local runtime-only proof is green at the gate-pass level
- rich visuals are restored locally
- high-resolution creatures and trail presets are back

What still does not line up fully:

- h5 currently *passes* its gate but underneath reports
  `pressureTier: critical`, `runtimeIssueCount: 92` (all
  `cadence-budget-overrun`), `lagCategory: simulation-dominant`,
  `peakHeapUsedMB: 159.26`, and `p99FrameMs: 37.8` (>2 frames at 60fps)
- the h5 audit duration is 30 seconds; the heap milestones beyond
  `tenSeconds` are all null, so the "long-running" label is not earned
- `foundation.mlCadenceIntervalFrames` is the top update contributor at
  `37.27ms`, which makes the ML scorer's runtime cost a real risk and not
  only its value (covered separately in pillar 6)
- runtime success is not fully finished until `v8b` full-stack proof and
  outside-session evidence close
- runtime self audit still carries noisy warning-level console output
- the battle lane remains a watch item in the `v8a` packet even though
  the local proof is frozen live
- a6 dispersal logs 56 identical Canvas2D `willReadFrequently` warnings
  per run; treating that volume as pure tooling noise is generous

Concrete blockers:

- a real long-session h5 (sixtySeconds + tenMinutes heap milestones
  populated, cadence overruns under control) is not yet captured
- outside-session proof is still open
- full-stack migrated-save runtime proof is still open
- warning-noise cleanup is not yet fully closed
- ML cadence cost is not yet justified (gates on g6)

Type of remaining work:

```text
primary: proof gap
secondary: outside-evidence gap
watch-item: implementation gap if long-session rerun stays critical
not a local runtime-emergency gap, but stronger than gate-pass evidence
```

### 8. Persistence / Continuity

```text
current read
└─ mostly aligned
```

Strongest proof:

- shared save-schema signoff at `schemaVersion = 4`
- spatial save migration green
- social save continuity green

What now lines up:

- identity, relationships, and spatial truth survive current local proof lanes
- overload recovery no longer forces fresh-world wipes

What still does not line up fully:

- continuity is locally strong, but the final migrated-save cross-track proof is still not frozen
- outside evidence on older/lived-in saves is still thinner than the local proof stack

Concrete blockers:

- `v8b` full-stack migrated-save proof still open
- outside-session save continuity evidence still open

Type of remaining work:

```text
primary: proof gap
secondary: outside-evidence gap
not a current migration-contract gap
```

## Highest-Value Remaining Gaps

```text
top remaining mismatches
├─ social/emotional breadth is real but not yet acceptance-closed
├─ dialogue naturalness and ambient variety are still under-proven
├─ autonomous building behavior is under-proven compared with placement correctness
├─ ML value is proven in scenarios more than in long free play
└─ runtime/persistence still need v8b + outside-session closure
```

## What This Means

```text
good news
├─ the current build is no longer failing at the foundation level
├─ the pseudo-3D / spatial contract is substantially healthier
├─ blocks/flowers/support are mechanically stable
└─ the social system is no longer just warning spam plus acknowledgements

honest next step
└─ stop treating every remaining problem like a core architecture bug
   and focus on:
   1. acceptance proof
   2. social/dialect breadth
   3. behavior richness
   4. final outside/full-stack closure
```
