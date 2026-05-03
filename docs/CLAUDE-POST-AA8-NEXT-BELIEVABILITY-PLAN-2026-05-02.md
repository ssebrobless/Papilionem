# Claude Post-AA8 Next Believability Plan - 2026-05-02

Reviewer: Claude (Opus 4.7)
Source handoff: `docs/CODEX-POST-AA8-CURRENT-STATE-AND-NEXT-PLAN-HANDOFF-2026-05-02.md`
Goal frame: a believable butterfly society with durable emotions, memory,
relationships, social cooperation, player-legible behavior, stable 3D/board
logic, and ML-supported decision making. Not literal consciousness.

## 1. Honest Current-State Verdict

The technical foundation is in good shape; the lived ecology is not.

```
+---------------------------------+----------+--------------------------------+
| Layer                           | Verdict  | Honest meaning                 |
+---------------------------------+----------+--------------------------------+
| 3D / board / projection         | Green    | No named contradiction; do not |
|                                 |          | refound.                       |
| Save / reload                   | Green    | Schema v5; n8 continuity green |
| UI / a11y / scroll              | Green    | Audits + AA8 fixes hold        |
| Sprite fidelity                 | Green    | Pipeline restored; eye test    |
|                                 |          | belongs to human capture       |
| Cognition storage + triggers    | Green    | G0H 13/13; events durable      |
| Expression naturalness (audit)  | Green    | 9 templates, 10 named-mem,     |
|                                 |          | repetition 0, why-coverage 1.0 |
| ML runtime                      | Stable   | m4 default; runtime contract   |
|                                 |          | locked                         |
| ML training pipeline            | Real     | Corpus 191, m6 trained, gates  |
|                                 |          | refused promotion (correct)    |
| Lived society over 20 min       | Warning  | Repetition, churn, witnessing, |
|                                 |          | migration, cleanup all weak    |
| Long-soak measurement honesty   | Warning  | Witnessed-affection metric is  |
|                                 |          | structurally undercounting     |
+---------------------------------+----------+--------------------------------+
```

Headline: G0H proves the systems exist and produce the intended states under
targeted pressure; long-soak proves those states do not yet emerge with
organic variety. There is also one **measurement honesty** gap that must be
closed before believability work, otherwise B1-B5 risk false-greens.

Estimated distance to "believable butterfly society": **62-70%**. The
ceiling on this estimate is set by the long-soak signals, not by foundation
work.

## 2. Ranked Blockers / Gaps

Ordered by impact on the user's perceived "is this a society?" judgment.

| Rank | Gap | Why it ranks here |
| ---- | --- | ----------------- |
| 1 | Long-soak `witnessedAffectionRate` measures only `samples.at(-1).packets` while packets decay in 30s (`decayFrames=1800`). G0H captures 5 events in 7 min; long-soak reports 0/min over 20 min. Metric is structurally blind. | Without honest measurement, every later phase ships false-green. Must precede B1. |
| 2 | Partner repetition 0.896 (ml) / 0.876 (heuristic). Same tight pair-loops dominate dialogue. | Most visible "they don't act like a society" symptom. Independent of ML. |
| 3 | Zone migration entropy 0.077 (ml) / 0.222 (heuristic). ML-on is **worse** than heuristic. Movement clusters. | Reads as flat world; also a real ML regression to fix in m7. |
| 4 | Witnessed affection production rate is too low even after fixing the metric. Triggers gate on companion+ bond, same zone, distance ≤6, dedup 60s; almost nothing fires organically. | Removes the visible relational drama the user wants. |
| 5 | Bond churn 0/min in both runs. `bondTier` transitions during a 20-min sample window are essentially never observed. | No relationship arcs visible to the player. |
| 6 | Cleanup gradient stalls: deltas 17 → 1 → 0 → 0 (ml) and 15 → 0 → 1 → -1 (heuristic). Initial pile clears, then ecology stops producing dirt or producing reasons to clean. | Borderline now, will read as "world sits still" once attention is on it. |
| 7 | m6 fails held-out signalChoice (0.66 vs heuristic 0.85) and autobattlePosture (0.78 vs heuristic 0.91); also fails value lanes for migration entropy and top-edge fraction. | Until ML doesn't regress in long-soak, default cannot move off m4. |
| 8 | Player legibility: "Why This Moment" is wired and audit-green, but not hooked into long-soak emotional events; feed cause-tracing to specific packet IDs is partial. | Player knowing *why* is the difference between "weird" and "alive". |
| 9 | Bond stability ratio 0.355 / 0.316 (target ≤0.30). Edges wobble more than desired. Lower-priority because it likely tightens once B1-B3 land. | Symptom, not driver. |

Items deliberately not on this list: spatial rebuilding (no named
contradiction); save schema bump (no migration need); cognition-vocabulary
expansion (no named insufficiency).

## 3. Human Capture: Now or One More Slice First?

**Recommendation: one more believability slice first, then capture.**

Why not now: with partner repetition at 0.896, witnessed affection at 0/min
in long-soak, and zone entropy at 0.077, the user will spend the capture
re-discovering what the long-soak already names. That wastes a capture cycle
and risks anchoring expectations to a known-thin run.

Why not "wait until everything is green": the goal is a believable society,
not a perfect one. The B0+B1+B2 slice (measurement honesty, partner
diversity, witness exposure) is the smallest cohesive slice that should
visibly change "feel." Capture should land **after B2 acceptance**, not
after the entire B-ladder.

If the user disagrees and wants a capture immediately, AA8 already declared
it eligible-with-warnings — the brief in `docs/AA8-HUMAN-CAPTURE-GATE-2026-05-02.md`
is good. This plan does not block that.

## 4. Phase Ladder (Exact Implementation Order)

```
B0  Long-soak measurement honesty + society-soak fixture
B1  Social partner diversity and recency pressure
B2  Organic witnessed-affection exposure
B3  Relationship arc dynamics (bond churn without noise)
B4  Zone migration pressure and entropy
B5  Cleanup / flower / food-reserve ecology pressure
B6  m7 corpus rebalance + trainer + held-out gates
B7  Player-facing "why" legibility pass
B8  Long-soak + G0H rerun + human capture packet
```

Slice boundary for capture: **after B2 acceptance**. Rationale: B0 closes the
measurement blind spot, B1 makes pair-variety visible, B2 makes affection
visible. Those three together produce the most legible delta a human can
feel in a single playthrough. B3-B7 then sharpen the depth; B8 locks it.

Ownership invariants preserved across all phases: drives/feelings/memories/
edges remain owned by `lifeSimSystem`, dialogue interpretation by
`communicationSystem`, movement-target candidacy by `behaviorSystem`, durable
state by `saveSystem`. ML scores; it does not own truth. Save schema stays
v5. Sun-court remains Training Grounds with no ambient blocks. 1 block = 1
board unit = 1 support/stack unit.

## 5. Per-Phase Briefs

Format for each: scope, owned files, forbidden files, rollback flag, proof
commands, acceptance criteria.

### B0 - Long-soak measurement honesty + society-soak fixture

**Scope.** The long-soak harness must measure events as they fire, not only
packets present at end-of-run, and must run on a deterministic society-soak
fixture so we don't depend on random fresh-start variance. Also tighten
bond-churn and zone-entropy computations.

- **Witnessed-affection rate**: the long-soak harness should subscribe to
  `cognitionTriggerEmitted` events with `kind === 'witnessedAffection'` (the
  same persistent subscriber pattern used in `playthroughDriver.js`), and
  report `events / durationMinutes`. Keep the current packet-snapshot value
  as a diagnostic, not the gate.
- **Bond churn**: walk the per-pair `bondTier` series, not just samples.
  Count transitions between consecutive non-equal tiers in chronological
  order, ignoring stretch where tier is unobserved.
- **Zone migration entropy**: keep current Shannon entropy but additionally
  report the count of distinct zones visited per entity; the "stretch ≥0.50"
  gate should require both entropy ≥0.50 *and* mean distinct zones ≥2.
- **Society-soak fixture**: build `scripts/scenario/scenarios/seed-society-soak-organic.json`
  as a deterministic ~6-minute synthetic save: 12 butterflies, 3 zones, mixed
  bond tiers (acquaintance/companion/bonded distributed), seeded dirt piles,
  one bonded pair adjacent to a companion-bonded witness in the same zone,
  one rivalry seed for B3.
- **Long-soak --fixture mode**: `scripts/run-long-soak-society-audit.js`
  gains `--fixture <path>` and `--minutes <n>` and `--ml` to run the
  fixture deterministically with each backend. Real saves stay untouched.

Owned files:

- `scripts/g0h/societyMetrics.js`
- `scripts/run-long-soak-society-audit.js`
- `scripts/scenario/scenarios/seed-society-soak-organic.json` (new)

Forbidden files: anything under `systems/`. This is purely measurement and
fixtures, no game-behavior change.

Rollback flag: none required. Behavior preserved if `--fixture` is omitted.

Proof commands:

```
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-g0h-scripted-playthrough.js
```

Acceptance:

- Long-soak fixture run reports witnessed-affection rate from the new
  event-subscription path; the fixture's seeded affection event must appear
  as ≥1 event in the rate report.
- Bond-churn transitions match a hand-computed expected value derived from
  the fixture's seeded tier transitions.
- G0H stays 13/13.
- Documentation in the audit output names which path produced each metric
  (subscription vs snapshot), so future readers cannot confuse them.

### B1 - Social partner diversity and recency pressure

**Scope.** Reduce same-partner loops in dialogue selection without
collapsing bond memory. Different needs should surface different partners.

- In `communicationSystem` partner-candidate scoring, add a recency penalty:
  a candidate spoken to within the last N=180s receives a penalty that
  decays linearly over the next 180s.
- Introduce need-typed candidate weighting that biases:
  - loneliness/comfortSeeking → bonded/companion partners,
  - curiosity → unfamiliar (acquaintance) partners,
  - statusExpression → admired (high admiration edge) partners,
  - shame repair → the actual harmed third party when available.
- Preserve the bonded "checking in" pattern by exempting bonded partners
  from the recency penalty when the source has a high-grief or
  high-loneliness packet active in the last 60s.
- No new vocabulary, no new packet kinds.

Owned files:

- `systems/communicationSystem.js`
- `core/config.js` (new `gameConfig.communication.partnerSelection` block)
- `scripts/scenario/scenarios/seed-partner-diversity-organic.json` (new)

Forbidden files: `systems/lifeSimSystem.js` (no new memory writes),
`systems/saveSystem.js` (no schema change), ML files.

Rollback flag: `gameConfig.communication.partnerSelection.recencyPressure
= true` (default true). Setting false reverts to previous selection scoring.

Proof commands:

```
node scripts/run-scenario.js scripts/scenario/scenarios/seed-partner-diversity-organic.json
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-r-expression-naturalness-audit.js
```

Acceptance (first targets):

- Long-soak fixture partner-repetition fraction ≤ **0.60** under both ml-on
  and heuristic.
- New scenario asserts that 5 distinct (sourceId,targetId) pairs are
  observed within the first 90s with the recency penalty enabled, and ≤2
  pairs without it.
- G0H 13/13 unchanged. Expression repetition still ≤0.05.
- No regression in `run-r-cooperation-pressure-audit.js`,
  `run-n5-dialogue-behavior-follow-through-audit.js`,
  `run-n7-social-surfacing-audit.js`.

Later target (after B3): partner-repetition ≤0.40.

### B2 - Organic witnessed-affection exposure

**Scope.** Make witnessed affection actually emerge in unscripted long-run
play. Two-pronged: production opportunity, and observation gating.

- `communicationSystem`: when a bonded pair has a positive-intent dialogue
  candidate (tags include comfort/companionship/warmth/admiration/playful/
  shared_attention) and at least one companion-or-higher witness is in the
  same zone within board distance ≤8, slightly raise the candidate's
  selection weight. This is opportunity bias, not forced fire.
- `systems/lifeSimSystem.js` `recordWitnessedAffection`: keep the bond-tier
  gate (companion+) but raise distance from 6 → 8 board units and raise
  packet `decayFrames` from 1800 → 5400 (90s) so the packet is observable
  across a sample window. Keep the 60s dedup window per
  (witness, source).
- No change to which intent tags qualify as "positive" — the existing list
  is correct.

Owned files:

- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js` (only `recordWitnessedAffection` and adjacent
  helpers; do not touch unrelated cognition triggers)
- `core/config.js` (`gameConfig.cognition.jealousy.witnessedAffection.{distanceUnits,decayFrames}`)
- `scripts/scenario/scenarios/seed-witness-affection-organic.json` (new)

Forbidden files: `systems/saveSystem.js`, ML, `behaviorSystem.js`.

Rollback flag: `gameConfig.cognition.jealousy.witnessedAffection.exposureBias
= true` (default true) gates the communicationSystem opportunity bias only.
The distance and decay numbers default to the new values but are
configurable.

Proof commands:

```
node scripts/run-scenario.js scripts/scenario/scenarios/seed-witness-affection-organic.json
node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-r-cognition-trigger-coverage-audit.js
```

Acceptance (first targets):

- New scenario fires ≥1 witnessedAffection cognition trigger with the
  seeded witness present, and the resulting packet survives ≥2 sample
  ticks.
- Long-soak fixture witnessed-affection event-rate ≥ **0.05/min** (using
  B0's subscription path) under both ml-on and heuristic.
- G0H 13/13. `r_cognition_trigger_coverage` stays green.
- `r_expression_naturalness_audit` shows ≥1 `memory:social:witnessedAffection`
  template usage when seeded.

Later target: ≥0.10/min.

### B3 - Relationship arc dynamics (bond churn without noise)

**Scope.** Make `bondTier` actually transition during long play in response
to lived events, not random noise.

- `lifeSimSystem`: in the existing socialEdge update path, add
  event-weighted deltas for: shared success (caregiving/cooperation),
  conflict (warning ignored, harm), repeated absence, witnessed-affection-
  derived rivalry (already wired but currently small), shared loyalty
  choices. Tier transitions trigger a `relationshipArcEvent` cognition
  trigger (event-only, no new packet kind), so arcs can be observed.
- Do not add a "relationshipArc" memory kind. Arcs are derived from
  existing edges + tier transition events.
- Add a `seed-relationship-arc-rivalry-to-companion.json` deterministic
  fixture: 15-min synthetic save, two butterflies start at low-trust edge
  with seeded harm event, then seeded help event 10 min later, expects at
  least one tier transition.

Owned files:

- `systems/lifeSimSystem.js` (edge update path only)
- `scripts/g0h/societyMetrics.js` (new churn helper that consumes the new
  event)
- `scripts/scenario/scenarios/seed-relationship-arc-rivalry-to-companion.json` (new)
- `core/config.js` (`gameConfig.cognition.bondTier.arcEvents`)

Forbidden files: `systems/saveSystem.js`, ML, communication, behavior.

Rollback flag: `gameConfig.cognition.bondTier.arcEvents.enabled` (default
true). When false, edge-delta weighting reverts to prior path.

Proof commands:

```
node scripts/run-scenario.js scripts/scenario/scenarios/seed-relationship-arc-rivalry-to-companion.json
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-n8-social-save-continuity-audit.js
```

Acceptance (first targets):

- Fixture produces ≥1 tier transition with corresponding `relationshipArcEvent`.
- Long-soak fixture `bondChurn` ≥ **0.25/min** and ≤ **2.0/min** (both
  bounds — runaway churn is also a fail).
- Bond stability ≤ **0.33** (interim).
- G0H 13/13. n8 social save continuity unchanged.

Later targets: churn 0.5..4.0/min, stability ≤0.30.

### B4 - Zone migration pressure and entropy

**Scope.** Make zones differ in pressure terms (resource, social density,
shelter), so a butterfly with a need profile that mismatches the current
zone has board-driven reason to leave. No camera hijack, no forced
crossings, no new zone identities.

- `zoneSystem`: expose a per-zone affordance vector (flower density,
  shelter availability, social density, dirt density) computed from
  existing world state. Read-only; no zone identity change.
- `behaviorSystem`: when a butterfly's active drive is X and the current
  zone's affordance for X is bottom-quartile while another reachable zone's
  affordance is top-quartile, raise the migration-pull weight on candidate
  movement targets at the zone boundary.
- Sun-court (Training Grounds) keeps its current affordance and is exempt
  from migration-target generation for ambient butterflies.
- Edge travel remains board-driven; no auto-teleport.

Owned files:

- `systems/zoneSystem.js` (read-only affordance API only)
- `systems/behaviorSystem.js`
- `core/config.js` (`gameConfig.zones.affordanceMigrationPressure`)
- `scripts/scenario/scenarios/seed-zone-pull-resource.json` (new)

Forbidden files: `systems/structureSystem.js`, save, ML, communication,
lifeSimSystem.

Rollback flag: `gameConfig.zones.affordanceMigrationPressure.enabled`
(default true). When false, behaviorSystem ignores the zone affordance
pull.

Proof commands:

```
node scripts/run-scenario.js scripts/scenario/scenarios/seed-zone-pull-resource.json
node scripts/run-r2-zone-transition-audit.js
node scripts/run-r-block-cell-discipline-audit.js
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-g0h-scripted-playthrough.js
```

Acceptance (first targets):

- Fixture forces ≥1 board-driven zone transition for ≥3 distinct entities
  in the first 4 min.
- Long-soak fixture zone-migration entropy ≥ **0.25** under both backends.
- Mean distinct zones visited ≥ 2 (B0 metric).
- No camera hijack — `r2_zone_transition_audit` and `r_block_cell_discipline`
  green; sun-court remains ambient-block-free.
- G0H 13/13.

Later target: entropy ≥0.50.

### B5 - Cleanup / flower / food-reserve ecology pressure

**Scope.** Stop the cleanup gradient from flatlining at zero by making
ecology produce ongoing reasons to clean and by making cleanup socially
meaningful.

- `objectSystem`: dirt accumulation rate scales with population activity in
  the zone (bounded), so the world keeps producing modest dirt during the
  long run. Avoid runaway rates.
- `lifeSimSystem`: `cleanupNavigationPriority` becomes weighted by
  caregiving drive and statusExpression drive, so different butterflies
  pick different cleanup contexts (no forced uniformity).
- `communicationSystem`: caregiving-tagged dialogue can prefer cleanup
  contexts when source has high caregiving drive and a witness with low
  comfort is in the same zone.
- Food reserve / flower lifecycle: surface food-reserve state in inspect's
  Ecology section so the player can see why a butterfly leaves a zone.
  Keep flower lifecycle audit green.

Owned files:

- `systems/objectSystem.js`
- `systems/lifeSimSystem.js` (drives/affordances only)
- `systems/communicationSystem.js` (caregiving cleanup bias only)
- `ui/dom/inspectPanel.js` (food-reserve readout in Ecology section)
- `core/config.js`
- `scripts/scenario/scenarios/seed-cleanup-status-loop.json` (new)

Forbidden files: save, ML, structureSystem, zoneSystem.

Rollback flag: `gameConfig.cognition.affordances.cleanupSocialModulation`
(default true). When false, cleanup priority reverts to flat constant 4.

Proof commands:

```
node scripts/run-scenario.js scripts/scenario/scenarios/seed-cleanup-floor-organic.json
node scripts/run-scenario.js scripts/scenario/scenarios/seed-cleanup-status-loop.json
node scripts/run-r-flower-lifecycle-audit.js
node scripts/run-r-spatial-cleanup-audit.js
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-g0h-scripted-playthrough.js
```

Acceptance (first targets):

- Long-soak fixture cleanup gradient `nonPositiveFraction` < **0.50**
  strictly (interim). Last two windows must show non-zero deltas.
- Flower lifecycle audit and spatial cleanup audit green.
- G0H 13/13.
- Inspect Ecology section shows a food-reserve line under the audit
  fixture.

Later target: < 0.35; no excessive flower stacking.

### B6 - m7 corpus rebalance + trainer + held-out gates

**Scope.** Build m7 by fixing the two failing held-out families and the
two failing value lanes from m6 without regressing the four families m6
won.

- Corpus: extend `scripts/build-c2-trace-corpus.js` to require minimum
  counts per (policy family × class) cell. Specifically, ensure at least
  N=8 corrected `signalChoice` records each for warning, comfort,
  invitation, teaching, and quiet; and at least N=10 corrected
  `autobattlePosture` records preserving heuristic-good cases (defend,
  pursue, focus, support).
- Held-out: replace the simple 80/20 scenario-id split with grouped
  splitting that holds out **whole scenario families** in rotation, and
  add organic non-fixture-derived held-out cases captured from B0/B3/B4
  fixtures.
- Trainer: `scripts/train-m7-garden-policy.js` (new), starting from m6's
  trainer with per-family loss weighting that protects signalChoice and
  autobattlePosture from regression vs heuristic.
- Promotion gate: m7 must clear (a) held-out signalChoice ≥ heuristic,
  (b) held-out autobattlePosture ≥ heuristic, (c) m7 ≥ m4 on ≥4/5 families,
  (d) value lanes ≥4/6 with no regression on top-edge fraction or
  migration entropy vs m4 (since long-soak shows m4 is already poor on
  migration entropy, m7 must not be worse).

Owned files:

- `scripts/build-c2-trace-corpus.js`
- `scripts/train-m7-garden-policy.js` (new)
- `scripts/run-ml-phase-m7-audit.js` (new, derived from m6 audit)
- `assets/ml/m7-garden-policy.json` (new artifact, not promoted by default)
- `docs/ML-PROMOTION-DECISION-2026-05-02.md` superseded by a new
  `docs/ML-PROMOTION-DECISION-2026-05-XX.md` once m7 is evaluated.

Forbidden files: `systems/mlInferenceSystem.js` runtime contract; do not
change the c1 contract or feature schema. m4 stays default until the gate
clears in this phase.

Rollback flag: not applicable; m7 is opt-in via
`gameConfig.ml.policyArtifactPath`. Default remains m4.

Proof commands:

```
node scripts/build-c2-trace-corpus.js --balance
node scripts/train-m7-garden-policy.js
node scripts/run-ml-phase-m7-audit.js
node scripts/run-ml-on-off-capture-audit.js --policy assets/ml/m7-garden-policy.json
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --policy m7
```

Acceptance:

- Held-out signalChoice ≥ heuristic; autobattlePosture ≥ heuristic.
- m7 ≥ m4 on ≥4 of 5 policy families.
- Value lanes ≥4/6 pass; migration entropy ratio ≥ m4's; top-edge
  fraction ≤ 0.15.
- Long-soak fixture under m7 does not regress partner-repetition,
  witnessed-affection rate, or zone entropy vs ml-off (heuristic).
- A new ML-PROMOTION-DECISION doc records pass/fail per gate. m4 stays
  default if any gate fails.

### B7 - Player-facing "why" legibility

**Scope.** Tighten existing inspect/feed surfaces so a human capture
reviewer can identify why notable events happened without reading debug
text.

- "Why This Moment" inspect lines must reference (a) the strongest active
  drive name, (b) the strongest active feeling and its packet ID if
  applicable, (c) the most recent referenced memory packet ID. Existing
  audit shows (a) and (c) work; (b) is partial.
- Feed entries that already carry `referencedMemoryPacketId` should also
  carry a short (≤24 char) `causeLabel` derived from packet kind (e.g.,
  "grief: long absence", "loyalty: chose Iris", "witnessed: Aster+Briar").
- No new feed categories. No spam: a per-(source, packet) cooldown of 60s
  on causeLabel display.
- Avoid expanding "Why This Moment" line count beyond 5.

Owned files:

- `ui/gameUI.js` (inspect "Why This Moment" composer)
- `ui/dom/inspectPanel.js`
- `ui/dom/feedPanel.js`
- `systems/communicationSystem.js` (causeLabel attachment when packet ID
  is known; no new dialogue templates)
- `core/config.js` (`gameConfig.expression.causeLabel`)

Forbidden files: lifeSim cognition, save, ML, behavior, zone, structure.

Rollback flag: `gameConfig.expression.causeLabel.enabled` (default true).

Proof commands:

```
node scripts/run-r-expression-naturalness-audit.js
node scripts/run-r-feed-thread-audit.js
node scripts/run-r4-ui-readability-audit.js
node scripts/run-r-ui-parity-audit.js
node scripts/run-g0h-scripted-playthrough.js
```

Acceptance:

- Audit asserts inspect Why-This-Moment lines reference strongest feeling
  with packet ID for ≥80% of inspected butterflies that have an active
  social packet.
- ≥5 of the last 10 feed entries with `referencedMemoryPacketId` show a
  causeLabel.
- No regression in expression repetition (≤0.05) or template count
  (≥8).
- G0H 13/13.

### B8 - Long-soak + G0H rerun + human capture packet

**Scope.** Lock the lived-society improvements with a clean evidence pass
and update the human capture brief.

- Fresh long-soak under the society fixture, both backends, recorded.
- Fresh G0H scripted playthrough.
- Fresh `r_*` audit suite.
- Updated capture brief that names which ladder phases changed which
  metric, so the human reviewer knows what to look for.

Owned files:

- `docs/CAPTURE-BRIEF-POST-B-LADDER-2026-05-XX.md` (new)
- (no source changes)

Forbidden files: any code change in B8. If a regression appears, open a
new B# phase, do not patch in B8.

Rollback flag: not applicable.

Proof commands:

```
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-scenario.js --all
node scripts/run-r-ui-parity-audit.js
node scripts/run-r-hover-scroll-audit.js
node scripts/run-r-expression-naturalness-audit.js
```

Acceptance (first-target landing simultaneously):

| Metric | Required |
| --- | --- |
| partner-repetition (fixture, ml + heuristic) | ≤ 0.60 |
| witnessed-affection event-rate | ≥ 0.05/min |
| bond-churn | 0.25..2.0/min |
| bond stability | ≤ 0.33 |
| zone migration entropy | ≥ 0.25 |
| cleanup gradient nonPositiveFraction | < 0.50 strictly |
| expression repetition | ≤ 0.05 |
| G0H lanes | 13/13 |
| Scenario suite | all green (33 + new fixtures) |

If all green: human capture is greenlit with the post-B8 brief.

## 6. Deterministic Scenarios / Fixtures To Build

Codex must not rely on random fresh-start variance. New scenarios:

| Phase | Scenario file | Purpose |
| --- | --- | --- |
| B0 | `seed-society-soak-organic.json` | 6-min synthetic society for fixture-based long-soak: 12 butterflies, mixed bond tiers, 3 zones, seeded dirt, one bonded pair + companion witness pre-positioned, one rivalry seed for B3. |
| B1 | `seed-partner-diversity-organic.json` | 8 butterflies with deliberately varied need profiles (loneliness/curiosity/statusExpression/shame-repair) targeted at known partners; with recency penalty enabled, harness asserts ≥5 distinct pairs in 90s, ≤2 without. |
| B2 | `seed-witness-affection-organic.json` | Bonded pair adjacent to companion-bonded witness in shared zone; positive-intent dialogue queued; harness asserts ≥1 cognitionTriggerEmitted of kind witnessedAffection. |
| B3 | `seed-relationship-arc-rivalry-to-companion.json` | Two butterflies, low-trust edge, seeded harm at t=120s, seeded shared-success help at t=600s; harness asserts ≥1 bondTier transition + relationshipArcEvent. |
| B4 | `seed-zone-pull-resource.json` | Three zones with deliberately asymmetric flower density and shelter; 6 butterflies start in a depleted zone with high curiosity/exploration drive; harness asserts ≥3 distinct entities migrate by board-step within 4 min. |
| B5 | `seed-cleanup-status-loop.json` | Bonded pair with one high-statusExpression and one high-caregiving butterfly, dirt seeded in their zone; harness asserts dirt count strictly decreases across all 4-min windows after first window. |
| B6 | corpus addenda (not scenarios) | Balanced corrected-record cells per (family × class). Held-out organic captures derived from B0/B3/B4 fixtures. |
| B7 | (audit additions, not scenarios) | New assertions in `run-r-expression-naturalness-audit.js` and `run-r-feed-thread-audit.js` for causeLabel coverage. |

Existing 33 scenarios all stay green; new ones are additive.

## 7. ML Plan for the Next Candidate (m7)

Diagnosis from `qa_screenshots/ml_phase_m6_audit/.../report.json` and
`docs/ML-PROMOTION-DECISION-2026-05-02.md`:

- Held-out signalChoice 0.660 < heuristic 0.849 → m6 lost the simple
  near-miss "warn / comfort / invitation / teaching / quiet" decisions.
- Held-out autobattlePosture 0.779 < heuristic 0.911 → m6 took
  support/focus overrides too aggressively over heuristic-good defend/
  pursue cases.
- Value lane: m6 fails migration-target Shannon entropy and top-edge
  fraction. Long-soak corroborates: ml-on entropy 0.077 < heuristic 0.222.

Corpus gaps:

- `signalChoice` records: 16 total; not enough class coverage. Need ≥8
  corrected per class (warning, comfort, invitation, teaching, quiet) →
  ≥40 records, with at least half from organic (non-seeded) traces.
- `autobattlePosture` records: 36 total but biased toward override cases.
  Need ≥10 corrected each for defend/pursue/focus/support, with at least
  10 cases where heuristic was correct and the corrected label confirms it.
- Migration / spatial: corpus does not yet include zone-mismatch cases,
  which is part of why m6 regresses entropy. After B4 lands, capture
  fixture-driven traces of board-step zone migrations.

Trainer changes:

- Move from a single ridge across families to per-family loss weighting
  with explicit `protect-vs-heuristic` regularizers for signalChoice and
  autobattlePosture: penalize predictions that disagree with heuristic
  *more than they disagree with the corrected label*.
- Group held-out by scenario family rotation; report per-family deltas.
- Carry forward all m4/m6 features; do not change feature schema (`m4-feature-schema-v1`).

Held-out gates (must all pass to promote):

- Per-family held-out: signalChoice ≥ heuristic, autobattlePosture ≥
  heuristic, m7 ≥ m4 on ≥4/5 families.
- Value gate: ≥4/6 lanes pass; migration entropy ratio ≥ 1.0 (i.e., m7
  not worse than m4); top-edge fraction ≤0.15.

Lived-value gates (new requirement, runs against the post-B-ladder
society fixture, not just artifact match):

- Long-soak fixture under m7 must not regress partner-repetition,
  witnessed-affection rate, bond-churn, or zone-migration entropy versus
  the heuristic run on the same fixture.
- m7 may be worse than heuristic by ≤10% on at most one of those four;
  any larger regression blocks promotion.

m4 remains default until all gates clear. m6 is retired as a research
artifact reference only.

## 8. UI / Player-Facing Legibility Plan (B7 detail)

The expression naturalness audit shows "Why This Moment" already produces
five-line explanations like "ML chose wander | toward emptySpace | signal
quiet | risk observe | medium confidence" with a memory line and drive
context. That works. The remaining gap is connecting *which packet* drove
the moment.

Improvements:

- "Why This Moment" line 2 (currently a sentence about the active memory
  cause) should embed the packet kind explicitly, e.g.,
  `[grief:long-absence] Returning to traces of Briar; 72 grief.`
- "Why This Moment" line 3 (currently mind drive readout) should append
  the strongest *feeling* with intensity if ≥30: e.g.,
  `Mind socialConnection 72 | curiosity 46 | feeling grief 72`.
- Feed entries with `referencedMemoryPacketId` already render. Add a
  short `causeLabel` (≤24 chars) so a player skimming can see the cause:
  "[grief: long absence]", "[loyalty: Iris]", "[witnessed: Aster+Briar]".
- Per-source packet cooldown 60s on causeLabel render to avoid spam.
- No new dialogue templates. No new feed filters.

Acceptance is in B7. Deferred concerns (decision boundary visualization,
explicit relationship arc UI) are out of scope for this ladder; revisit
after a human capture if they remain unclear.

## 9. Constraints This Plan Preserves

- No claim of literal consciousness or subjective feeling.
- Player's real long-running save is never wiped; only synthetic fixtures
  are touched.
- No spatial / 3D refoundation; no contradiction has been named that
  would require it.
- Sun-court remains Training Grounds; no ambient blocks there.
- 1 block = 1 board unit = 1 support/stack unit.
- ML scores choices, never owns durable feelings, memories, bonds, or
  save truth.
- Save schema stays v5. No additive migration is required by this ladder.
- m4 remains default; m6 is not promoted; m7 will be evaluated honestly
  with both held-out artifact gates and lived-value gates.
- Cognition vocabulary is unchanged. The plan adds one event
  (`relationshipArcEvent`) but no new packet kind. If Codex finds a
  named insufficiency mid-implementation, it must propose the
  insufficiency, migration path, owner system, and proof strategy in a
  doc rather than expanding vocabulary on the fly.

## 10. Codex Copy-Paste Prompt (B0 only)

The single prompt the user will hand to Codex is in section 11 below.
This section briefly explains why B0 is the first phase and not B1.

B1 is the most user-visible improvement. But B1 depends on the long-soak
metric to confirm "did partner-repetition actually go down?" Right now
the long-soak metric for witnessed affection is structurally blind, and
its bond-churn helper does not handle inter-sample tier transitions.
Shipping B1 before B0 risks declaring B1 done on numbers that cannot
move. B0 is small, source-free, and unblocks every later phase.

## 11. Singular Codex Prompt for B0

```
Read docs/CLAUDE-POST-AA8-NEXT-BELIEVABILITY-PLAN-2026-05-02.md in full.
Then implement phase B0 ("Long-soak measurement honesty + society-soak
fixture") exactly as specified in section 5 of that document.

Owned files: scripts/g0h/societyMetrics.js,
scripts/run-long-soak-society-audit.js, and a new
scripts/scenario/scenarios/seed-society-soak-organic.json. Do not modify
anything under systems/, core/config.js, ui/, assets/ml/, or save logic.

Required deliverables:
1. Update scripts/g0h/societyMetrics.js so witnessed-affection rate is
   reported from event-subscription accumulation (kind ===
   "witnessedAffection") over the run, while keeping the current
   last-sample packet count as a diagnostic field. Update bond-churn so
   transitions are counted from the per-pair bondTier series in
   chronological order, ignoring unobserved gaps. Update zone migration
   entropy to additionally report mean distinct zones visited per entity.
2. Update scripts/run-long-soak-society-audit.js to (a) subscribe to
   cognitionTriggerEmitted events the same way scripts/g0h/playthroughDriver.js
   does, (b) accept --fixture <path> and --minutes <n> flags so the
   audit can run from a deterministic synthetic save instead of a fresh
   reset, and (c) annotate each metric in the report with which path
   produced it (event-subscription vs sample-snapshot).
3. Create scripts/scenario/scenarios/seed-society-soak-organic.json: a
   deterministic 6-minute synthetic save with 12 butterflies across 3
   zones, mixed bond tiers (acquaintance/companion/bonded distributed),
   seeded dirt piles in two zones, one bonded pair pre-positioned
   adjacent to a companion-bonded witness in the same zone, and one
   rivalry seed (low-trust edge) for later phases. The fixture must be
   reproducible and not mutate any localStorage save.
4. Add fixture-aware assertions to the long-soak audit so the seeded
   witnessed-affection event is detected as an event (>=1) and the
   seeded bond tiers produce a hand-computed expected churn count.

Do not change game behavior. This phase is purely measurement and
fixtures. Constraints from the plan apply: do not wipe the player's real
save, do not refound spatial, sun-court remains Training Grounds with no
ambient blocks, save schema stays v5, ML default stays m4, and no new
cognition vocabulary.

Proof commands to run and attach reports for, in order:

  node scripts/run-long-soak-society-audit.js --fast --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison
  node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json
  node scripts/run-g0h-scripted-playthrough.js
  node scripts/run-scenario.js --all

Acceptance:
- Long-soak fixture run reports witnessed-affection event-rate from the
  new subscription path; the seeded affection event appears as >=1 event.
- Bond-churn transitions match the fixture's seeded expected value.
- Zone-entropy report includes mean distinct zones visited.
- G0H stays 13/13. Existing scenario suite (33) stays green.
- The audit report names which path produced each metric so future
  readers cannot conflate them.

When complete, write docs/B0-EVIDENCE-LOCK-2026-05-XX.md citing the
report paths and the hand-computed fixture expectations. Do NOT proceed
to B1 in the same patch; B1 will be triggered by a separate Codex run
after the user reviews B0.
```
