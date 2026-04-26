# Papilionem Goal-Alignment Review Packet

## Purpose

This doc is the single review packet for the current "where are we now,
what still blocks success, and what should we do next?" question.

It is meant to be handable to an external reviewer without requiring them to
reconstruct intent from scattered phase notes.

Use this with:

- [GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)
- [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)

## Review Shape

```text
╔════════════════════════ Review Packet Shape ═════════════════════════╗
║ 1. what success means                                               ║
║ 2. why success is defined that way                                  ║
║ 3. where the current game stands against that target                ║
║ 4. what still blocks alignment                                      ║
║ 5. why the next plan is ordered the way it is                       ║
║ 6. what a strong external review should challenge                   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Executive Read

```text
╔════════════════════════ Current Program Read ════════════════════════╗
║ foundation mechanics     │ substantially healthier than before       ║
║ 3D / board logic         │ mostly aligned                           ║
║ building correctness     │ mostly aligned                           ║
║ movement correctness     │ mostly aligned                           ║
║ social architecture      │ real and working                         ║
║ social believability     │ not acceptance-closed yet                ║
║ runtime local proof      │ gate-pass green, telemetry-caveated      ║
║ outside/full-stack proof │ not finished                             ║
╚═══════════════════════════════════════════════════════════════════════╝
```

The most important conclusion is:

```text
the game is no longer mainly blocked by core architecture failure
it is now mostly blocked by:
├─ acceptance-proof gaps
├─ social/dialect breadth gaps
├─ autonomous-behavior richness gaps
└─ final outside/full-stack closure
```

## Why These Success Definitions

### The Core Reasoning

The project had drifted toward a dangerous false-positive pattern:

```text
system exists
   └─▶ one audit passes
        └─▶ assume the feature is "done"
```

That was not strong enough because it blurred together very different kinds of
"working":

- underlying mechanics being correct
- the player being able to see/read that correctness
- the system affecting later behavior instead of only labels
- the truth surviving save/load and migration
- the shipped-default runtime being stable enough to trust the feature in play

So success was deliberately defined as a five-layer stack:

```text
mechanical truth
  + visual legibility
  + behavioral impact
  + persistence
  + runtime safety
```

The reasoning was:

### 1. Mechanical truth alone is not enough

If a system is internally correct but visually contradictory, players will
experience it as broken.

Example:

```text
logic says "supported stack"
render says "floating nonsense"
player verdict -> broken
```

### 2. Visual readability alone is not enough

If the game surfaces nice-looking summaries or labels, but later behavior does
not actually change, the simulation feels fake.

Example:

```text
"guarded relationship"
   └─▶ but both butterflies keep behaving generically
```

### 3. Behavior impact alone is not enough

If good behavior only exists in the current session and collapses after
refresh/load/migration, long-running lives are not sacred.

### 4. Persistence alone is not enough

If the truth survives save/load but only under degraded visuals or runtime
stress, the feature is still not shippable.

### 5. Runtime success alone is not enough

If the game is smooth only because the art was gutted or the life-sim was
hollowed out, it misses the project identity.

## Social Realism Calibration

One explicit wording change matters:

```text
rejected target
└─ "make them feel like real humans"

accepted target
└─ "make them feel like a believable butterfly society with
   human-legible emotions, memory, social texture, and consequences"
```

Reasoning:

- exact human mimicry is not a realistic or even fully desirable target here
- the simulation needs readable inner life and social consequence, not perfect
  human impersonation
- this framing protects the project from chasing a vague impossibly broad
  realism goal

## Success Definitions By Section

### 1. Spatial / Pseudo-3D

```text
north star
└─ one canonical spatial truth for position, footprint, support,
   carry, shelter, route, and visibility
```

Why this is the right target:

- many of the earlier bugs were not separate bugs; they were symptoms of split
  ownership
- route geometry, support, movement bounds, and render legibility were
  disagreeing because they were not fully reading one board truth
- until one board/unit/occupancy contract existed, travel and placement fixes
  kept turning into one-off patches

Success is therefore not:

```text
"portal path looks better"
```

It is:

```text
"the player-visible pseudo-3D illusion is driven by one coherent model"
```

### 2. Blocks / Flowers / Building

```text
north star
└─ blocks feel like real matter in the garden, not decorative props
```

Why this is the right target:

- placement correctness matters, but it is not the whole fantasy
- if blocks only pass scripted placement tests yet never produce believable
  autonomous building, the system is technically legal but experientially thin

### 3. Movement / Travel / Space Use

```text
north star
└─ butterflies inhabit the board naturally instead of snapping through it
```

Why this is the right target:

- movement bugs were often not pure logic failures
- the major failure mode was "looks fake"
- that means correctness plus naturalness is the right acceptance bar

### 4. Social Relationships / Emotion

```text
north star
└─ butterflies feel distinct, emotionally readable, and history-shaped
```

Why this is the right target:

- the game already had internal social machinery before the current work
- the real problem was not "no social variables exist"
- the real problem was "the society does not reliably read as alive"
- therefore the target had to include:
  - distinctness
  - readability
  - historical consequence

### 5. Dialogue / Conversation

```text
north star
└─ conversation feels contextual, relational, and consequential
```

Why this is the right target:

- the earlier failure mode was repetitive warning/correction loops
- so the target had to go beyond "more lines"
- it had to require broader motive mix, better voice differentiation, and later
  consequence

### 6. Neural / Scoring Layer

```text
north star
└─ ML helps choose grounded actions; it never owns durable truth
```

Why this is the right target:

- the project explicitly protects one-owner-per-truth boundaries
- if ML starts owning feelings, memory, or relationship truth, the simulation
  becomes less explainable and less durable
- so the correct success target is bounded usefulness, not magical autonomy

### 7. Runtime / Visual Quality

```text
north star
└─ the rich look survives without freezes, crashes, or art gutting
```

Why this is the right target:

- the project explicitly rejected "solve performance by making it uglier"
- runtime success must therefore preserve:
  - high-resolution creatures
  - trails as real options
  - core sim depth

### 8. Persistence / Continuity

```text
north star
└─ long-running lives stay intact across refreshes, migrations, and upgrades
```

Why this is the right target:

- long-running saves were treated as sacred throughout the planning layer
- any success model that allows flattening or wiping continuity is invalid for
  this project

## Current State Against Those Goals

### Summary Table

```text
╔════════════════════════ Current State vs Goals ══════════════════════╗
║ spatial / pseudo-3D            │ mostly aligned                     ║
║ blocks / flowers / building    │ mostly aligned                     ║
║ movement / travel              │ mostly aligned                     ║
║ social relationships / emotion │ partially aligned                  ║
║ dialogue / conversation        │ partially aligned                  ║
║ neural / scoring               │ partially aligned                  ║
║ runtime / visual quality       │ partially aligned                  ║
║ persistence / continuity       │ mostly aligned                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 1. Spatial / Pseudo-3D

Current read:

```text
mostly aligned
```

Why:

- [a4 spatial truth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-26T03-59-40-141Z/report.json) passed
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) passed
- widened-board save/load rebuild also passed in `a4`

Concrete proof already on disk:

- shared region is consistent across zones
- physics + structure are the spatial owners
- save/load rebuilds widened-board spatial truth correctly

What still prevents full alignment:

- this is mechanically strong, but not yet acceptance-closed as a fully
  legible pseudo-3D illusion across all lived-in play situations
- mixed-stage/entity free-play visual acceptance is still thinner than the
  scripted audits

### 2. Blocks / Flowers / Building

Current read:

```text
mostly aligned
```

Why:

- [b4 carry/stack physics audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/b4_carry_stack_physics_audit/2026-04-26T04-01-21-764Z/report.json) passed
- [r7 block visual audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r7_block_visual_audit/2026-04-26T04-00-43-069Z/report.json) passed

Concrete proof already on disk:

- stacked placement routes through physics
- invalid placements normalize safely
- flower conflicts relocate before placement
- unsupported stacks settle safely

What still prevents full alignment:

- the project proves placement correctness better than it proves rich
  autonomous colony building
- we do not yet have strong proof of meaningful multi-step building in
  ordinary free play

### 3. Movement / Travel / Space Use

Current read:

```text
mostly aligned
```

Why:

- [r1 movement stability audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r1_movement_stability_audit/2026-04-22T20-10-54-483Z/report.json) passed
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) passed
- [a6 live dispersal audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a6_live_dispersal_audit/2026-04-24T02-22-07-620Z/report.json) only warns from canvas readback noise, not a failed movement step

What still prevents full alignment:

- movement is now mostly proven correct
- it is not yet fully acceptance-proven as graceful in long ordinary play

### 4. Social Relationships / Emotion

Current read:

```text
partially aligned
```

Why:

- [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-26T17-00-28-158Z/report.json) passed
- [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-26T17-01-36-382Z/report.json) passed
- [e4 social ecology audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/e4_social_ecology_audit/2026-04-26T04-04-50-293Z/report.json) passed
- [lifesim expression audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/lifesim_expression_audit/2026-04-26T16-58-12-269Z/report.json) passed

What is genuinely working now:

- pair texture is real
- group tone is real
- follow-through is real
- emotion/resource/threat surfacing is real

What still prevents full alignment:

- long free-play social breadth is under-proven
- ambient emotional readability may still lag behind underlying truth
- much of the richness is easiest to verify in inspect/feed/debug rather than
  naturally reading during ordinary play

### 5. Dialogue / Conversation

Current read:

```text
partially aligned
```

Why:

- dialogue is grounded
- voice band/register contract is working
- dialogue changes later relationship/life-sim state

What still prevents full alignment:

- the colony is more varied than before, but not yet acceptance-closed as
  consistently natural and broad in uncontrolled play
- wording may still feel system-authored in some longer runs
- topic breadth and repetition tolerance are still under-proven

### 6. Neural / Scoring Layer

Current read:

```text
partially aligned
```

Why:

- [n6 neural social scoring audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/n6_neural_social_scoring_audit/2026-04-26T04-03-47-795Z/report.json) passed

What is genuinely working now:

- ML scoring is bounded correctly
- it helps targeted seek/avoid/imitate/protect behavior

What still prevents full alignment:

- the value proof is still stronger in scenarios than in long free play
- we do not yet have a clear ML-on versus ML-off acceptance read for colony
  believability

### 7. Runtime / Visual Quality

Current read:

```text
mostly aligned
```

Why:

- [h5 long-running save smoothness audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T03-59-40-141Z/report.json) passed
- `v8a` runtime-only proof is frozen live

What is genuinely working now:

- local runtime-only proof is strong
- rich visuals are restored locally
- high-resolution creatures and trails are back in the intended model

What still prevents full alignment:

- `v8b` full-stack proof is still open
- outside-session proof is still open
- warning-noise cleanup is not fully finished

### 8. Persistence / Continuity

Current read:

```text
mostly aligned
```

Why:

- shared save-schema signoff is recorded at `schemaVersion = 4`
- spatial continuity is green
- social continuity is green

What still prevents full alignment:

- final cross-track migrated-save proof is still open
- outside-session continuity evidence is still thin compared with local proof

## Main Remaining Blockers

```text
highest-value blockers
├─ no lived-in spatial acceptance sweep across all visible pseudo-3D cases
├─ no strong autonomous building proof in ordinary colony play
├─ no movement-naturalness acceptance sweep beyond correctness audits
├─ social/emotional breadth still under-proven in long free play
├─ dialogue naturalness/repetition still under-proven in long free play
├─ ML value still under-proven outside targeted scenario scoring
├─ v8b full-stack migrated-save proof still open
└─ outside-session evidence still open
```

## Planning Reasoning

### What I Considered

I considered three competing explanations for the remaining work:

```text
option A
└─ the game is still fundamentally architecturally broken

option B
└─ the architecture is now mostly right, but the player-facing acceptance
   and breadth layers are still not proven enough

option C
└─ the architecture is right and the game is already fully done;
   only paperwork remains
```

I rejected `A` because:

- the major spatial/runtime/social audits are now green
- the prior concrete ownership and continuity failures are repaired

I rejected `C` because:

- several success targets depend on acceptance breadth, not just scenario
  correctness
- outside/full-stack proof is still unfinished
- social believability is not yet strongly proven in long free play

So the current planning assumes `B`:

```text
the game has moved out of the "core architecture emergency" phase
and into the "acceptance, breadth, and final closure" phase
```

### Why The New Plan Starts With `g1` / `g2` / `g3`

These three come first because they answer a very important question:

```text
are the remaining 3D/build/movement misses real implementation gaps
or mostly acceptance-proof gaps?
```

If they mostly pass in manual/lived-in acceptance, then the biggest remaining
work is social breadth plus full-stack/outside closure.

If they fail, then specific spatial/build/movement implementation work should
be reopened with named contradictions rather than broad guesswork.

### Why The Social Work Reopens Later

The social track from `n0` through `n8` is locally frozen clean.
That means we should not casually reopen it as if nothing landed.

Instead:

```text
reopen only the realism/acceptance layer
not the whole frozen social history
```

This keeps the project disciplined and preserves the already-earned social
contracts.

### Why `v8b` and Outside Proof Stay At The End

Those are closure gates, not good exploration tools.

They should happen after:

- the acceptance sweeps
- the targeted remaining depth work

Otherwise the team risks mixing too many open questions into the final proof
packet.

## Concrete Next Plan

```text
goal-alignment ladder
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
├─ g3 movement naturalness acceptance
├─ g4 ambient social breadth pass
├─ g5 dialogue naturalness + repetition pressure
├─ g6 ML value proof
├─ g7 v8b full-stack migrated-save proof
└─ g8 outside-session closure + public alpha freeze
```

### Stage A: acceptance closure on already-strong systems

```text
g1 -> g2 -> g3
```

Purpose:

- prove whether the remaining spatial/build/movement concerns are real
  implementation misses or mostly acceptance gaps

### Stage B: social believability deepening

```text
g4 -> g5 -> g6
```

Purpose:

- close the gap between "green social scenarios" and
  "believable society in ordinary play"

### Stage C: final closure

```text
g7 -> g8
```

Purpose:

- close the remaining full-stack and outside-player proof gates

## What Should Not Be Reopened By Default

```text
do not reopen by default
├─ spatial unit contract
├─ doorway/corridor model
├─ shared save schema
├─ local runtime-only proof
└─ frozen n0-n8 social history
```

Reason:

- those are currently earned truths
- reopening them without a named contradiction would create planning drift

## What A Strong Claude Review Should Challenge

An external review should pressure-test these exact questions:

```text
1. are the success criteria too strict, too weak, or correctly calibrated?
2. is "mostly aligned" versus "partially aligned" being judged honestly?
3. are any of the blocker lists still mixing acceptance gaps with true code gaps?
4. is the order g1 -> g8 the strongest one, or should some steps move?
5. are we underestimating any hidden remaining spatial/runtime/social risks?
6. are we protecting the frozen child boards enough while still allowing the
   right next realism work to reopen?
```

## Recommended Claude Review Conclusion Target

The reviewer should come back with a conclusion in this shape:

```text
plan strength
├─ structurally strong / mixed / weak
├─ why
├─ which blockers are correctly identified
├─ which blockers are missing or overstated
└─ whether the g1 -> g8 ladder should stand or be revised
```

## Bottom Line

```text
bottom line
├─ the game is no longer mainly failing at the foundation level
├─ the current architecture is strong enough to judge by acceptance goals now
├─ the biggest remaining risk is overestimating how "finished" social and
│  behavioral richness feel in ordinary play
└─ the current plan is strongest if it now focuses on acceptance, breadth,
   and final proof instead of reopening already-earned foundation work
```

## Claude Review Integration

This section records an external Claude pressure-test of the goal-alignment
plan, success criteria, gap assessment, and g1-g8 ladder. The review was
conducted on `2026-04-26` against the live planning layer and a spot-check
of the cited audit reports.

### Review Verdict

```text
verdict
├─ structurally strong, calibration-mixed
├─ the five-layer success stack is the right framework
├─ the macro g1-g8 order is sound
├─ two pillars (runtime, neural) are graded more generously than the
│  underlying evidence supports
├─ the dialogue gap is already actionable from the f5/f6 audit content
└─ the acceptance bar itself is undefined in every Stage A/B step
```

### Overall Strength

```text
strong
├─ five-layer success stack
├─ one-owner-per-truth invariant
├─ frozen-board reopening discipline
├─ Stage C ordering (v8b -> outside-session)
└─ non-negotiables (ML never owns durable state, no save wipes)

mixed
├─ Stage A first / Stage B second sequencing leaves social discovery
│  starting from zero when Stage A closes
└─ runtime status leans on h5, which passes the gate but reports
   pressureTier=critical and 92 cadence-budget overruns in 30s

weak
├─ "lived-in" / "ordinary play" / "long free play" closure language
│  is undefined - duration, observer, signoff format
└─ g6 ML value proof framed only as feel, not as cost-vs-value
```

### Key Accepted Findings

```text
accepted
├─ pseudo-3D / spatial unit contract is sound; remaining work is acceptance
├─ blocks/flowers/building placement correctness is real; autonomous-build
│  behavior remains under-proven
├─ social architecture is alive; "scenario-rich, curated" self-criticism is
│  honest and matches the audit citation chain
├─ persistence locally strong; v8b + outside-session closure correctly named
├─ frozen n0-n8 / s0-s8 boards must not be reopened without a named gap
└─ Stage C ordering (g7 -> g8) is correct
```

### Key Modified Findings

```text
modified
├─ runtime / visual quality (pillar 7)
│  └─ "mostly aligned" overstates h5's evidence; pressureTier=critical,
│     92 cadence-budget overruns, ML cadence is top update contributor
│     at 37.27ms; recommend "partially aligned" until a real long-session
│     run is captured
│
├─ dialogue / conversation (pillar 5)
│  └─ the gap is more actionable than treated; f5/f6 audit lines already
│     read as system-authored ("this part of the quiet ground is easier
│     to hold when you are beside me"); g5 style cleanup can begin in
│     Stage A without waiting for Stage B
│
├─ neural / scoring (pillar 6)
│  └─ g6 must include cost-vs-value, not only behavioral coherence;
│     if ML cadence is the top runtime contributor, ML value has to
│     justify its update cost too
│
├─ sequencing
│  └─ g4 ambient-observation and g5 style cleanup can run in parallel
│     with Stage A; the parallel-safe shape exists in the plan but is
│     not surfaced in the registry's "next move"
│
└─ acceptance bar
   └─ "lived-in" / "ordinary play" / "long free play" appear as closure
      criteria in g1, g2, g3, g4, g5 with no defined duration, observer
      role, or signoff format; treat as a one-time g0-bar precondition
      for Stage A/B closure
```

### Key Rejected Findings

```text
rejected (i.e. this review did not find them)
├─ no evidence the spatial unit contract should be reopened
├─ no evidence the doorway/corridor model should be reopened
├─ no evidence the save schema should be reopened
├─ no evidence the n0-n8 social ladder should be reopened
└─ no evidence the success-target "believable butterfly society, not
   indistinguishable from humans" is wrong; it is correctly calibrated
```

### Spot-Check Notes

The review spot-checked four audit reports cited as primary evidence:

- `a6 live dispersal` (`warn`) - all 3 movement steps pass; 56 identical
  Canvas2D `willReadFrequently` warnings per run; dismissal as render-tooling
  noise is defensible, but the warning *volume* is itself a perf signal
- `h5 long-running save smoothness` (`pass`) - all 7 phases pass, but
  pressureTier=critical, runtimeIssueCount=92 (all cadence-budget-overrun),
  lagCategory=simulation-dominant, peakHeapUsedMB=159.26, p99FrameMs=37.8ms,
  duration=30s with `sixtySeconds`/`tenMinutes`/`twentyMinutes`/`fortyMinutes`
  heap milestones all null; the label "long-running" is not earned
- `n6 neural social scoring` (`pass`) - clean; 4 hand-crafted social
  scenarios; the scorer responds correctly to clique-comfort, devoted-seek,
  strained-avoid, protective-warning; this is scenario evidence, not free-play
- `f5/f6 social depth` (`pass`) - structural pass; threading, intent
  selection, pair-texture accumulation, life-sim follow-through all green;
  the dialogue text itself is the evidence for the dialogue-naturalness gap

### Effect On Other Docs

Findings are propagated as targeted edits to:

- [GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md) - acceptance bar
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md) -
  runtime caveat, neural cost-vs-value sub-blocker
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md) -
  g6 cost-vs-value clause, g0-bar precondition, parallel-start note
- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md) - parallel-start
  surface in next-move

The frozen child boards (`n0-n8`, `s0-s8`, `v0-v8a`) are not reopened.
