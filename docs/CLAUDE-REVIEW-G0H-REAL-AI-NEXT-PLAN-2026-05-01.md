# Claude Review - G0H Real-AI Next Plan

Date: 2026-05-01
Author: Claude Opus 4.7
Branch reviewed: `codex/milestone-freeze-playtest`
Latest commit reviewed: `d3bd27f Add scripted G0H playthrough fixture`
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Source request: `docs/G0H-REAL-AI-SELF-AUDIT-HANDOFF-2026-05-01.md`
Binding upstream: `docs/CLAUDE-REVIEW-FREEZE-PLAYTEST-NEXT-PLAN-2026-04-30.md`,
                 `docs/G0H-SCRIPTED-PLAYTHROUGH-FIXTURE-PLAN-2026-05-01.md`,
                 `docs/ML-VALUE-DECISION-2026-05-01.md`
Status: binding for the next implementation slice. Supersedes the upstream
"go to G0 human playtest now" implication. Recommends a small, surgical
fix slice (X-phases) before any human capture.

---

## Section 0 - Executive Verdict

```text
verdict
+- the G0H scripted packet is real evidence, but the "10/10 pass" overstates
|  what was proven. Two evidence layers under-report the cognition that did
|  happen, and two intended cognition triggers did not fire during the run.
+- the spatial / save / save-reload / block-cell / ability-radius / runtime
|  layers are honestly green. No spatial rebuild needed.
+- the cognition vocabulary, derivation, and most production triggers ARE
|  in code AND they DO fire from production paths in the right scenarios.
|  The packet under-counts them because:
|  +- the inspect snapshot reads `lifeSim.memoryPackets || lifeSim.memories`
|  |  as a FLAT array, but production stores them as an OBJECT keyed by
|  |  family ('social', 'outcome'). Result: every inspected butterfly in the
|  |  G0H report shows memoryPacketCount=0 even when packets exist.
|  +- only `createProductionOutcomeAnchor` and `recordProductionLoyaltyChoice`
|  |  emit `cognition:triggered`. `recordBereavementForDeath`,
|  |  `recordWitnessedAffection`, and `checkLongAbsence` do NOT. So the
|  |  report's `cognitionTriggered: 1` is a floor, not a ceiling.
|  `- the eventBus history is a ring buffer (250 entries); the report's
|     final summary is taken AFTER the run, after older events were evicted.
|     The G0H run actually fired 4 cognition events at frame 4890 (visible
|     in mid-run snapshot 1) but only 1 survives in the final summary.
+- two intended G0H scenarios never produced cognition during the run:
|  +- jealousy: the Iris/Juniper/Kite triangle is seeded but the driver
|  |  never makes Juniper emit a high-tenderness dialogue toward Kite, so
|  |  recordWitnessedAffection has no input.
|  `- death-bereavement: no kill action exists in the G0H driver; only
|     long-absence is in the seeded edge state.
+- one production trigger has a real correctness bug: competingDistress
|  loyalty fires SYMMETRICALLY. When Briar and Clover are both distressed
|  at frame 4890, Aster gets BOTH a "chose Briar / rejected Clover" packet
|  AND a "chose Clover / rejected Briar" packet. They cancel out as story.
+- ML is honestly weak: the static m4 artifact matches heuristic on 38/56
|  cases vs heuristic 55/56 (3 of 5 policy families strictly worse). There
|  is NO trainer in the repo. cadenceFactor=4 reached 3/6 value-band
|  metrics, the best result so far. The honest next ML step is a real
|  trainer that consumes corpus-records.json, not more runtime tuning.
`- recommendation: do NOT promote to human G0 capture yet. Land the
   X-phase slice (5 small phases, all surgical, all save-additive or
   audit-only) and re-run G0H. The fixed packet will tell the user
   honestly whether the society is ready for human review.
```

Honest score against the user's stated goal "believable butterfly society
with real AI behavior":

```text
mechanical truth (board, save, blocks)        strong
durable cognition state in code               strong
gameplay -> cognition wiring                  strong
                                              (5 production triggers exist;
                                              all measured fire correctly
                                              when conditions are met)
G0H proof of those triggers in lived play     WEAK
                                              (evidence layer hides packets;
                                              two trigger classes uncovered)
ambient legibility of feelings                partial
                                              (feed shows feeling tags; DOM
                                              inspect surface still missing)
ML earning its keep                           NOT YET
                                              (artifact strictly worse than
                                              heuristic; no trainer; corpus
                                              of 12 records)
behavior emergence over a 7-min capture       partial
                                              (loyalty/pride DID fire from
                                              production; long-absence,
                                              jealousy, death-bereavement,
                                              shame did NOT fire in the run)
```

The Codex handoff's self-estimate "lived unscripted society 35-50%, real
ML 20-30%" is roughly fair. My reading is closer to: cognition system
50-65% real (the vocabulary works, triggers fire, but evidence is broken
and two classes are unproved end-to-end); ML 15-25% real (no trainer).

---

## Section 1 - Honest Read of Each Layer

### Tag system

- **proven by harness**: production code path runs, packets persist, audit
  asserts the right state.
- **working but shallow**: code path runs and packet persists, but the
  proof is narrow (e.g., one frame, one scenario, no behavior assertion).
- **only staged**: the harness sets up conditions and calls a helper
  directly; the production trigger chain is not exercised.
- **not solved**: the user-named experience does not actually arrive.

### Per-system read

```text
spatial / projection / block discipline       PROVEN BY HARNESS
  +- run-r-block-cell-discipline-audit pass
  +- run-r2-zone-transition-audit pass
  +- G0H block-cell-discipline lane: 9 blocks, 0 duplicate, 0 half, 0
  |  out-of-range, 0 unsupported stacks, 0 sun-court blocks
  `- save-reload preserves block cells (G0H save-reload-continuity lane)

save schema v5 + n8 social save continuity    PROVEN BY HARNESS
  +- run-n8-social-save-continuity-audit pass
  +- run-h5-long-running-save-smoothness-audit pass
  +- G0H import / re-export / re-import path passes
  `- recent fix: scripts/run-h5-... ignores g0h-scripted-fixture-* exports
     so user real save is protected

bond tier ladder (E2)                         PROVEN BY HARNESS
  +- seed-bond-progression and seed-bond-progression-organic pass
  +- structureSystem.getShelterTrustRecoveryScale uses bondTier for tier
  |  bonus (line 374) - companion +0.10, bonded +0.16
  `- save round-trip preserves bondTier on edge

derived feelings (E1: loneliness, comfortSeeking, socialInsecurity)
  WORKING BUT SHALLOW
  +- deriveDerivedFeelings runs every cognition tick
  +- feelings DO bias derived behavior (recovery, statusExpression,
  |  returnHomeBias, socialAvoidance, caregivingDrive)
  +- motiveBias is consumed by communicationSystem (line 3354) and
  |  lifeSimSystem migration (line 1892)
  +- feed shows "loneliness feeling" / "comfortSeeking feeling" / "pride
  |  feeling" as contextTags during the G0H run
  `- but lifeSim deep-eval cadence ran with cadenceFactor=2 in G0H, so
     derived feelings update every ~12 frames; in early snapshot 0 they
     are still {} for several butterflies

bereavement on death (E3)                     ONLY STAGED
  +- recordBereavementForDeath wired to BUTTERFLY_DIED event
  +- seed-grief and seed-grief-organic pass
  `- G0H driver has NO kill action; the death-bereavement chain was
     never exercised in the official packet

long-absence soft-bereavement (E3.3 / W5)     ONLY STAGED
  +- checkLongAbsence runs every cognition tick
  +- threshold: currentFrame - lastSeenAtFrame > 18000 frames (5 min)
  +- creates packet with subtype: 'long-absence' on partner-not-in-zone
  +- seed-grief-long-absence-organic asserts and passes
  `- BUT: G0H fixture seeds Orchid/Pollen with lastSeenAtFrameOffset
     -120000 (2000s in past), they are in different zones (pool-heart vs
     moss-hollow). So the long-absence WOULD have fired during the 7-min
     run. Whether it did is hidden by the inspector bug below.

witnessed-affection / jealousy (E4)           NOT SOLVED in G0H
  +- recordWitnessedAffection called from communicationSystem.emitDialogue
  |  on every dialogue (line 4484)
  +- seed-jealousy-organic uses a `witness_affection` action that calls
  |  recordWitnessedAffection directly; this is staged, not lived
  +- the production check requires bondTier companion+ on witness->source,
  |  zone match, board distance <= 6, and dialogue intentTags include
  |  positive affect (comfort, companionship, warmth, admiration, playful,
  |  shared_attention) OR metadata.affectionIntensity > 0.5
  `- in G0H, no dialogue was emitted with those tags from Juniper toward
     Kite while Iris was in line of sight. The triangle never fired.

pride / shame anchors (E5)                    PROVEN BY HARNESS PARTIALLY
  +- battle-win pride: PROVEN (G0H captured 1 packet on Wisp at frame 15550)
  +- caregiving-success pride: PROVEN (G0H captured 1 packet on Aster at
  |  frame 4890)
  +- scout-cluster pride: trigger exists but no audit observed it firing
  +- abandoned-ally shame: trigger exists but no audit / G0H run
  |  observed it firing; needs >=600 frames of >=0.64 distress with a
  |  companion+ candidate in same zone who never responds
  `- warning-ignored-then-harm shame: trigger exists; needs warning emit
     -> witness recipient -> harm to that recipient within 600 frames

loyalty under conflict (E6)                   PROVEN BUT BUGGY
  +- recordLoyaltyChoice triggered from competingDistress (line 507) and
  |  competingScoutInvitation (line elsewhere)
  +- seed-loyalty-organic asserts and passes
  +- G0H captured 2 packets on Aster at frame 4890
  `- BUG: competingDistress fires symmetrically. Aster got
     both "chose Briar / rejected Clover" AND "chose Clover / rejected
     Briar". The de-dupe key includes chosen+rejected order so the
     opposing pair is not deduped. (See Gap-2 below.)

flower lifecycle / dirt cleanup               WORKING BUT SHALLOW
  +- run-r-flower-lifecycle-audit cleanup-floor lane teleports butterflies
  |  onto piles; 8/8 cleaned in lab
  +- G0H run: 27 dirt piles before, 26 after (1 cleaned in 7 minutes); the
  |  driver also ran a single nudgeFlowerCleanup that called pile.tryCleanupDirtPile
  |  directly, which is NOT lived play
  `- the production "butterflies organically navigate to piles and clean
     them" loop has weak evidence. 1 / 27 in 7 minutes is a low floor.

cooperation hooks H1..H5                      WORKING BUT SHALLOW
  +- run-r-cooperation-pressure-audit 5-min lane runs each H1..H5 once
  |  by direct injection at scheduled frames
  +- G0H did not have an explicit cooperation lane; production cooperation
  |  events fired (caregiving pride, loyalty choices) but no scarcity
  |  pulse, no shelter trust scaling event, no scout cluster, no heavy
  |  block carry happened in the 7 minutes
  `- the audit gate is "at least one event per 5 minutes" via injection;
     the user's intent is "cooperation emerges in lived play"

ML inference                                  NOT SOLVED
  +- m4-garden-policy.json artifact: 38/56 vs heuristic 55/56
  +- targetPreference: artifact 0.545 vs heuristic 1.0 (strictly worse)
  +- signalChoice: artifact 0.545 vs heuristic 1.0 (strictly worse)
  +- autobattlePosture: artifact 0.417 vs heuristic 1.0 (strictly worse)
  +- riskPosture: 1.0 / 1.0 (matches)
  +- actionFamily: 0.909 / 0.909 (matches)
  +- value-band at cadenceFactor=4 reaches 3/6 metrics (edge churn,
  |  migration entropy, top-edge fraction). Latency, jitter, motive
  |  distinctness still fail. The chi-square motive distinctness is the
  |  hardest because the artifact and heuristic both produce the same
  |  motive distribution per pair.
  `- there is NO trainer in the repo. corpus-records.json is 12 records
     and grew via build-c2-trace-corpus.js which captures scenario
     decision histories. To make the artifact better than heuristic, a
     real trainer is required.

DOM feed italic + DOM inspect feeling row     PARTIAL
  +- canvas-mode feed renders heard meaning under spoken line
  +- DOM-mode feed (ui/dom/feedPanel.js) does not render heard meaning
  +- DOM inspect lacks feeling counters
  `- W4 from the prior plan documented this and Codex shipped some of
     it; the DOM feed italic is still a residual

evidence-layer fidelity                       BROKEN (this is the
                                              #1 finding of this review)
  +- inspect snapshot at scripts/g0h/playthroughDriver.js:155 and 186:
  |    memoryPacketCount: (target.lifeSim?.memoryPackets
  |                        || target.lifeSim?.memories || []).length
  |  reads `memories` as if it were a flat array; production stores it as
  |  { social: [...], outcome: [...], place: [...], ... }
  |  every G0H inspection therefore reads memoryPacketCount=0
  +- continuity check at scripts/g0h/evidenceAssertions.js:79 compares
  |  before/after memoryPacketCount; both are 0; passes vacuously
  +- recordBereavementForDeath, recordWitnessedAffection, checkLongAbsence
  |  do NOT emit `cognition:triggered`; only createProductionOutcomeAnchor
  |  and recordProductionLoyaltyChoice do. So bereavement/witnessed/long-
  |  absence are silent paths the report cannot count.
  `- eventBus history ring buffer is 250 entries; the G0H final summary
     is sampled AFTER the run; older cognition events are evicted; the
     `recentCognition` array shows only what's left in the ring at
     summary time
```

---

## Section 2 - Gap List, Ranked

Findings tagged: **B** (behavior gap - production trigger missing or
buggy), **E** (evidence gap - real behavior not measurable from packet),
**C** (correctness bug), **U** (UI / surfacing gap), **M** (ML gap).

### Gap-1 [E, P0] - Inspect snapshot reads memories as a flat array

`scripts/g0h/playthroughDriver.js:155, 186` and analogous inspect-snapshot
sites read:

```js
memoryPacketCount: (target.lifeSim?.memoryPackets
                    || target.lifeSim?.memories
                    || []).length
```

But production code (lifeSimSystem.ensureLifeSimState line 64-68) sets:

```js
entity.lifeSim.memories.social = ...     // array
entity.lifeSim.memories.outcome = ...    // array
```

`{}.length === undefined → 0`. Every inspection in the G0H official
packet shows `memoryPacketCount: 0`, even on Aster (who has at least 2
loyaltyChoice + 1 pride packet) and Wisp (who has 1 pride). The
save-reload-continuity lane's `memoryMismatches` filter therefore passes
vacuously: 0 vs 0 is a "no regression."

**Severity**: this is the load-bearing bug behind the false-green G0H.
Without fixing this, no future capture can honestly judge cognition
continuity.

**Fix**: rewrite snapshot to count by family:

```js
const families = entity.lifeSim?.memories || {};
const counts = {
  social: Array.isArray(families.social) ? families.social.length : 0,
  outcome: Array.isArray(families.outcome) ? families.outcome.length : 0,
  place: Array.isArray(families.place) ? families.place.length : 0
};
const totalMemoryPacketCount = counts.social + counts.outcome + counts.place;
```

Add to snapshot:
- `memoryPacketCount` (sum)
- `memoryFamilyCounts` (per family)
- `memoryKindCounts` (bereavement, witnessedAffection, loyaltyChoice,
  prideAnchor, shameAnchor)

The continuity check should compare per-kind counts, not the flat sum.

### Gap-2 [C, P0] - Loyalty competingDistress fires symmetrically

`systems/communicationSystem.js:499-510`:

```js
const competing = distressed.find(entry =>
    entry.entity.id !== entity.id
    && entry.zoneId === zoneId
    && Math.abs((this.distressRecords.get(entry.entity.id)?.lastHighFrame ?? currentFrame) - currentFrame) <= 120
);
if (competing?.entity?.id) {
    const topPriority = this.getTopPrioritySourceIds(caregiver, [entity, competing.entity], 3);
    if (topPriority.includes(competing.entity.id)) {
        this.recordProductionLoyaltyChoice(caregiver, entity.id, competing.entity.id, 'competingDistress', ...);
    }
}
```

When the outer loop processes Briar's distress, Clover is "competing" and
the choice "Aster chose Briar / rejected Clover" is recorded. Then the
outer loop processes Clover's distress, Briar is "competing" and the
choice "Aster chose Clover / rejected Briar" is also recorded.

The de-dupe key in `recordProductionLoyaltyChoice`:

```js
const key = `loyalty:${triggerName}:${entity.id}:${chosenPartnerId}:${rejectedPartnerId}`;
```

Includes the order of (chosen, rejected), so the symmetric pair has a
DIFFERENT key and is not deduped. Both fire. Aster ends up with a packet
saying "chose Briar over Clover" AND "chose Clover over Briar." Net
narrative: incoherent.

**Severity**: real behavior bug. The cognition record is contradictory.

**Fix**: canonicalize the pair key by sorting partner ids before forming
the key. Skip if the canonical key has already been recorded within the
last cooldown window. Then resolve which side the caregiver ACTUALLY
helped first - the one whose distress dropped first by some signal -
and emit ONE packet with that as chosen.

If the simulation cannot tell which side was helped first (the helper
shouted to both at once), do not record a loyalty choice at all; only
record when one side's distress drops while the other's stays high.

### Gap-3 [E, P0] - Bereavement / witnessedAffection / long-absence are silent paths

`recordBereavementForDeath`, `recordWitnessedAffection`, and
`checkLongAbsence` (all in lifeSimSystem.js) do NOT emit
`cognition:triggered`. Only `createProductionOutcomeAnchor` (pride/shame
from communicationSystem) and `recordProductionLoyaltyChoice` (loyalty)
emit it. So the G0H report's `cognitionTriggered` count and
`recentCognition` array are missing three trigger classes entirely.

**Severity**: makes the G0H "production-social-event" lane unable to
prove that bereavement, witnessed-affection, or long-absence actually
fired in lived play.

**Fix**: emit `cognition:triggered` from each silent path:

- `recordBereavementForDeath`: emit one `cognition:triggered` per packet
  created with `{ kind: 'bereavement', source: 'production', system:
  'lifeSimSystem', trigger: 'butterflyDied', entityId, partnerId,
  intensity }`.
- `recordWitnessedAffection`: emit one per packet created with
  `{ kind: 'witnessedAffection', source: 'production', system:
  'lifeSimSystem', trigger: 'dialogueWitnessed', entityId, sourceId,
  thirdPartyId, intensity }`.
- `checkLongAbsence`: emit one per packet created with
  `{ kind: 'bereavement', subtype: 'long-absence', source: 'production',
  system: 'lifeSimSystem', trigger: 'longAbsence', entityId, partnerId,
  intensity }`.

This is purely additive observability. No save-schema touch.

### Gap-4 [B, P0] - G0H driver has no death/witnessed-affection orchestration

`scripts/g0h/playthroughDriver.js` has methods for distress, scout,
flower cleanup, battle. It does NOT have:

- `triggerBondedPartnerDeath`: kill Pollen (or any seeded bonded
  partner) so death-bereavement fires for Orchid (and emit BUTTERFLY_DIED
  via the production death pipeline, not via direct lifeSim call).
- `triggerWitnessedAffection`: nudge Juniper to emit a
  comfort/companionship/warmth dialogue toward Kite while Iris is in
  line of sight. The dialogue must be emitted via
  `communicationSystem.emitCooperationSignal` (which fires the production
  recordWitnessedAffection on every emit) - NOT via direct
  `recordWitnessedAffection` call.
- `runLongAbsenceWindow`: the fixture already seeds the edge with an old
  lastSeenAtFrame; we just need to verify Orchid's lifeSim deep-eval ran
  enough times to call checkLongAbsence at least once. Add a snapshot
  read of Orchid's `lifeSim.memories.social` filtered for kind ===
  'bereavement' && subtype === 'long-absence'.

**Fix**: add three driver methods. Each must run via production code:

```js
async killBondedPartner(alias = 'Pollen') {
  await page.evaluate(name => {
    const target = state.butterflies.find(e => e.displayName === name);
    if (!target) return { ok: false };
    target.hp = 0;
    target.dead = true;
    if (typeof eventBus !== 'undefined' && GameEvents?.BUTTERFLY_DIED) {
      eventBus.emit(GameEvents.BUTTERFLY_DIED, { entity: target, source: 'g0h-scripted' });
    }
    return { ok: true, deceasedId: target.id };
  }, alias);
}

async nudgeWitnessedAffection() {
  // place Juniper near Kite (within 6 board units of Iris); set
  // chemistry/edge so Juniper's dialogue carries comfort+companionship+warmth
  // tags. Emit the dialogue via communicationSystem.emitCooperationSignal,
  // which will fire recordWitnessedAffection on Iris through the
  // production path.
}
```

### Gap-5 [E, P1] - eventBus history ring buffer evicts cognition events

`scripts/g0h/playthroughDriver.js:495-512` `refreshProductionEventCounts`
reads:

```js
const cognition = eventBus?.getHistory?.('cognition:triggered') || [];
```

The eventBus history is bounded (typically 250 entries per channel).
During the G0H run, ~107 timeline entries plus other channels evict
older cognition events. By the time the final summary samples, only
1 remains.

The mid-run snapshot at frame 4890 captured 3 cognition events (loyalty
x2 + pride x1 from caregivingSuccess) plus 1 more later (battle pride at
frame 15550). The final summary missed 3 of those.

**Fix**: in the driver, sample `eventBus.getHistory('cognition:triggered')`
at multiple checkpoints (e.g., after each minute) and keep an
accumulator on the driver side. Or, lift the cognition ring buffer to a
dedicated, larger-capacity sink during scripted runs (gameConfig flag
`gameConfig.telemetry.cognitionRingCapacity = 4096`).

The accumulator approach is simpler and does not change runtime state.

### Gap-6 [B, P1] - Flower-cleanup organic floor is teleport-driven

The current cleanup-floor lane in `run-r-flower-lifecycle-audit.js` and
the G0H `nudgeFlowerCleanup` both teleport butterflies onto piles. The
G0H run cleaned 1 pile in 7 minutes, leaving 26.

**Fix**: extend the cleanup-floor lane with an organic variant that:
- Seeds piles in moss-hollow at fixed boardPos
- Places butterflies AROUND piles (3+ board units away)
- Does NOT teleport
- Runs 60s of full game update
- Asserts at least 4 of 8 cleaned organically
- Records affordance read trace, target acquisition, cleanup completion

Same shape as the cooperation-organic-floor scenario already in
`scripts/scenario/scenarios/`.

### Gap-7 [B/M, P1] - Cooperation H1..H5 still injection-driven

The 5-min cooperation lane runs H1..H5 by direct injection at scheduled
frames. The user's "lived play" intent is unproven.

**Fix**: add an organic cooperation lane that does NOT inject. Plant the
preconditions (heavy block, two companion pairs, scarcity-prone flower
density, distress-prone butterflies) and let the simulation run. Count
firings. Acceptance: at least 1 of EACH hook fires organically in 5
minutes. If a hook does not fire organically, document the gap as a
real product issue, not silenced.

### Gap-8 [U, P1] - DOM feed lacks heard-meaning italic and inspect lacks feeling row

Documented in upstream W4. Codex shipped W4 but ui/dom/feedPanel.js
still does not render heardMeaning. DOM inspect still does not show
loneliness/comfortSeeking/socialInsecurity/jealousy/grief/pride/shame/
loyaltyBias counters.

**Fix**: same as upstream W4. Make sure the DOM feed entry shape carries
heardMeaning and renders an italic line under the spoken phrase, capped
at 60 chars. DOM inspect needs a feelings row analogous to gameUI.js:621.

### Gap-9 [M, P0] - No real ML trainer in the repo

The static m4 artifact is hand-crafted. Corpus has 12 records (8
lived-loop + 4 curated). The artifact is strictly worse than heuristic
on 3 of 5 policy families. cadenceFactor=4 reaches 3/6 value-band
metrics by reducing ML's frequency, not by improving its quality.

The honest next ML step is a real trainer. The current corpus-records
are linear-feature -> categorical-label rows; a logistic regression or
softmax linear policy can be fit cheaply.

**Fix (X5)**: build `scripts/train-m5-garden-policy.js` that:
1. Loads corpus-records.json from
   `qa_screenshots/c2_trace_corpus/<latest>/corpus-records.json`
2. For each policy family (actionFamily, targetPreference, signalChoice,
   riskPosture, autobattlePosture):
   - Builds (features, label) pairs from `decisionHistory[*]` rows where
     `trainingLabels[<family>]` is present
   - Fits a one-vs-rest linear policy by gradient descent (no external
     deps; this is a small problem)
3. Writes `assets/ml/m5-garden-policy.json` matching the m4 format
4. Updates `gameConfig.ml.modelVersionId = 'm5-garden-policy-v1'` (under
   a flag, default off)
5. Re-runs `run-ml-phase-m4-audit` and `run-ml-on-off-capture-audit` at
   factors 1, 2, 4 with m5
6. Promotes m5 only if it beats m4 on artifact match rate AND improves
   at least 3/6 value-band metrics at the shipped cadence

Risks: corpus is tiny (12 records). Trainer must produce reasonable
weights even on tiny data. Use ridge regularization. Document expected
overfitting. The promotion gate is what protects against bad m5.

### Gap-10 [E, P1] - G0H lacks "honest residual" reporting

`run-g0h-scripted-playthrough.js` exits 0 when 10/10 lanes pass. It does
not surface "evidence-collection bugs" as a separate residual lane. So
Gap-1, Gap-2, Gap-3, Gap-4, Gap-5 above all silently allowed the packet
to read green.

**Fix**: add a `evidence-fidelity` residual lane (NOT must-pass) that
asserts:
- `memoryPacketCount > 0` for at least one inspected butterfly that the
  fixture explicitly seeded with packets (or for any butterfly after the
  expected production triggers ran)
- the per-snapshot `cognitionEvents` array shows at least one event of
  EACH expected kind given the fixture (bereavement, witnessedAffection,
  loyaltyChoice, prideAnchor) - or the lane reports the missing kinds
  as named residuals
- the cognition accumulator across all snapshots matches the eventBus
  history at the moment of sampling

If the fidelity lane fails, the overall packet should be marked
`pass-with-residual`, not `pass`. The user MUST see "we proved X but did
not see Y."

### Gap-11 [B, P2] - No production motive trace surface

When a butterfly does X (chooses target, emits dialogue, ignores warning,
travels to a zone), today's trace surfaces it as a feed entry with
context tags like "loneliness feeling | guarded texture | memory
anchoring." That is good and human-readable. But there is no first-class
"why did the butterfly do this" trace that says:

```text
Aster chose Briar over Clover because:
  - both at >0.78 distress, same zone, same frame
  - Aster's edge to Briar: trust 0.72, comfort 0.70, attachment 0.68
  - Aster's edge to Clover: trust 0.70, comfort 0.68, attachment 0.66
  - Aster's loyalty edge to Briar slightly higher, ranked first
  - tie-breaker: id-canonical order
```

Today the player can guess from feed tags but the reasoning is implicit.

**Fix (X4 optional, can defer)**: add an explainability sidecar
`lifeSim.derived.lastChoiceReason` that records the last meaningful
decision's structured reason. Rendered in inspect under "Last choice."
Read-only consumer of existing state. No save change.

---

## Section 3 - Decision: Promote to G0 Human Capture?

**No.** Three classes of risk make a human capture today low-value:

1. **Evidence-layer bugs (Gap-1, Gap-2, Gap-3, Gap-5)**: a human capture
   today will under-report the cognition that actually fires, exactly as
   the scripted G0H did. The user will see a feed with feeling tags but
   the inspect surface will say "0 memories." That misreads as "the
   butterflies have no inner life," which is the OPPOSITE of true.

2. **Cognition coverage gaps (Gap-4, Gap-6, Gap-7)**: even with the
   evidence layer fixed, several intended experiences are not
   reachable in 7 minutes of normal play - long-absence,
   witnessed-affection, organic flower cleanup, organic cooperation.
   The user would conclude "the society is shallow" when the actual
   answer is "the experience requires either longer play or scripted
   provocations." Land the X-phase fixes first.

3. **ML correctness (Gap-9)**: the user explicitly asked about "real AI."
   If we ship the human capture without addressing the trainer gap, the
   user will judge "real AI" by current heuristic + static-policy
   behavior. That is a fair judgment of the current build, but it sets
   the wrong baseline. Even a small trainer pass (X5) on the existing
   corpus will produce a measurably different artifact and a more honest
   "ML versus heuristic" reading.

**Recommended order**: land the X-phase slice (X1, X2, X3 are required;
X4, X5 are P1 and can land in parallel after X1-X3). Re-run the G0H
scripted packet. Then the user gets a clean baseline for the human G0
capture.

---

## Section 4 - The X-Phase Slice (Next Implementation Plan)

### X-phase ladder

```text
X-phase ladder (next slice)
+-- X1 evidence layer fixes        [P0, must-have for G0H promotion]
|   +-- inspect snapshot reads memories by family
|   +-- bereavement/witnessedAffection/longAbsence emit cognition:triggered
|   +-- driver accumulates cognition across snapshots; not just final
|   `-- evidence-fidelity residual lane in G0H
+-- X2 cognition correctness fix   [P0]
|   `-- competingDistress symmetric-fire bug
+-- X3 G0H driver coverage         [P0]
|   +-- killBondedPartner action (death-bereavement)
|   +-- nudgeWitnessedAffection action (jealousy triangle)
|   `-- assert long-absence packet on Orchid after the run
+-- X4 organic floors              [P1, can run after X1-X3]
|   +-- cleanup-floor-organic lane
|   +-- cooperation-organic lane
|   `-- DOM feed italic + inspect feeling row
`-- X5 ML trainer + corpus growth  [P1, parallel]
    +-- scripts/train-m5-garden-policy.js
    +-- ridge-regularized linear fit; tiny dependency footprint
    +-- promote m5 only if beats m4 on artifact-match AND >=3/6 value
        metrics at cadenceFactor 1, 2, or 4
+-- G0H rerun                      [gate before human capture]
+-- G0 human capture                [the close]
```

X1-X3 are required before re-running G0H.
X4-X5 can land in parallel after X1-X3 lands and the rerun is green.
Human G0 capture comes only after the rerun reads honestly.

---

### X1 - Evidence layer fixes

Goal: make the G0H packet honestly report cognition activity.

Owned files:
- `scripts/g0h/playthroughDriver.js` (snapshot, refreshProductionEventCounts)
- `scripts/g0h/evidenceAssertions.js` (continuity check, lanes)
- `scripts/run-g0h-scripted-playthrough.js` (residual lane wiring)
- `systems/lifeSimSystem.js` (emit cognition:triggered from 3 silent paths)

Forbidden files:
- save schema
- ML runtime contract
- entities/, gridManager.js
- core/renderManager.js, projection math
- battleSystem.js (already emits cognition:triggered correctly)

Contracts touched: none. eventBus channel `cognition:triggered` gains
three new emitters. Save schema unchanged.

Implementation steps:

X1.1 - Snapshot reads memories by family.
  Replace the two reads at `playthroughDriver.js:155, 186`:
```js
const families = entity?.lifeSim?.memories || {};
const socialPackets = Array.isArray(families.social) ? families.social : [];
const outcomePackets = Array.isArray(families.outcome) ? families.outcome : [];
const placePackets = Array.isArray(families.place) ? families.place : [];
const memoryFamilyCounts = {
  social: socialPackets.length,
  outcome: outcomePackets.length,
  place: placePackets.length
};
const memoryKindCounts = {
  bereavement: socialPackets.filter(p => p?.kind === 'bereavement').length,
  bereavementLongAbsence: socialPackets.filter(
    p => p?.kind === 'bereavement' && p?.subtype === 'long-absence'
  ).length,
  witnessedAffection: socialPackets.filter(p => p?.kind === 'witnessedAffection').length,
  loyaltyChoice: socialPackets.filter(p => p?.kind === 'loyaltyChoice').length,
  prideAnchor: outcomePackets.filter(p => p?.anchor === 'pride').length,
  shameAnchor: outcomePackets.filter(p => p?.anchor === 'shame').length
};
const memoryPacketCount = memoryFamilyCounts.social
  + memoryFamilyCounts.outcome
  + memoryFamilyCounts.place;
```
  Include all four fields in the inspect details and snapshot per-alias
  payload.

X1.2 - Emit cognition:triggered from three silent paths.
  - `lifeSimSystem.recordBereavementForDeath`: after `pushCognitionPacket`,
    emit one `cognition:triggered` event per packet.
  - `lifeSimSystem.recordWitnessedAffection`: same.
  - `lifeSimSystem.checkLongAbsence`: same.
  Each emit:
```js
if (typeof eventBus !== 'undefined') {
  eventBus.emit('cognition:triggered', {
    kind: '<bereavement|witnessedAffection>',
    subtype: packet.subtype || null,
    source: 'production',
    system: 'lifeSimSystem',
    trigger: '<butterflyDied|dialogueWitnessed|longAbsence>',
    currentFrame: packet.createdAtFrame || gameCore?.getCurrentFrame?.() || 0,
    entityId: <survivor or witness id>,
    partnerId: packet.partnerId || null,
    thirdPartyId: packet.thirdPartyId || null,
    intensity: packet.intensity ?? null
  });
}
```
  This is purely additive observability. No save change.

X1.3 - Driver accumulator across snapshots.
  In `playthroughDriver.js`, add `this.cognitionAccumulator = []` to the
  constructor. In every method that runs `eventBus.getHistory(...)`,
  append the slice (deduped by `currentFrame + entityId + kind +
  partnerId + thirdPartyId`) to `this.cognitionAccumulator`. The final
  refresh should report `accumulatedCognition` separately from
  `recentCognition`.

X1.4 - Evidence-fidelity residual lane.
  In `evidenceAssertions.js buildEvidenceLanes`, add:
```js
{
  id: 'evidence-fidelity',
  pass: <inspectionsHaveAtLeastOneNonZeroMemoryCount>
        && <accumulatedCognitionMatchesSnapshotPackets>,
  residual: !pass,
  details: { ... }
}
```
  The lane is "residual" (does not block overall pass) but its failure
  must be visible in the report and human-review.md.

X1.5 - human-review.md should record evidence-fidelity findings.
  When the fidelity lane reports residuals, list them under "Evidence
  Fidelity" with the named gap (e.g., "memoryPacketCount=0 across all
  inspections; production stored packets but inspector did not read them
  - X1.1 fix needed").

Acceptance:
- `scripts/run-g0h-scripted-playthrough.js --fast` runs and the
  evidence-fidelity lane reports `pass`
- the existing 9 must-pass lanes continue to pass
- inspections show non-zero memoryPacketCount on at least Aster
  (loyaltyChoice + prideAnchor) and Wisp (prideAnchor) after the run
- accumulated cognition shows >= 4 events (loyalty x2, caregiving
  pride x1, battle pride x1) for the standard 7-min run

Probes:
```
node scripts/run-g0h-scripted-playthrough.js --fast
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-scenario.js --all
node scripts/run-runtime-self-audit.js
```

Rollback: pure additive. No flag needed.

Risks:
- emitting from lifeSimSystem may double-count if a death triggers both a
  direct call AND the BUTTERFLY_DIED event listener. The current code
  has the eventListener call recordBereavementForDeath; only that path
  exists. Verify no double-fire.

---

### X2 - Cognition correctness fix (loyalty symmetric-fire)

Goal: when two butterflies are simultaneously distressed and one
caregiver, record at most ONE coherent loyalty choice (or none if the
caregiver helped both equally).

Owned files:
- `systems/communicationSystem.js` (the competingDistress block)

Forbidden files:
- save schema
- entities/, render math
- ML runtime contract

Implementation steps:

X2.1 - Canonical pair-key in dedupe.
  In `recordProductionLoyaltyChoice`, build the canonical pair key by
  sorting the two partner ids:
```js
const pairKey = [chosenPartnerId, rejectedPartnerId].sort().join('|');
const canonicalKey = `loyalty:${triggerName}:${entity.id}:${pairKey}`;
if (this.hasRecentProductionTrigger(canonicalKey, currentFrame, 60)) return null;
this.markProductionTrigger(canonicalKey, currentFrame);
```
  This prevents the symmetric (B/C) and (C/B) both firing.

X2.2 - Resolve which side was helped, not both.
  In the competingDistress detection in `updateDistressCascade`, do not
  fire the loyalty trigger eagerly during the cascade emit step. Instead,
  observe which distressed butterfly's level dropped first AFTER the
  caregiver responded. When the second of two competing distressed
  butterflies' level is still high while the first has dropped, emit
  the loyalty packet at THAT moment with the dropped one as `chosen` and
  the still-high one as `rejected`.

  This requires storing `respondedDistressedIds` on the caregiver's
  distressRecords entry and checking which one's level dropped later.
  If both drop within 60 frames, do NOT record a loyalty choice - the
  caregiver helped both, which is not a "choice."

X2.3 - Test scenario update.
  Update `seed-loyalty-organic.json` to reflect the new contract:
  - Both B and C start distressed at the same time.
  - B's distress drops at frame 240; C's stays high.
  - Assert ONE loyaltyChoice packet, A->chosen=B, A->rejected=C.
  - Assert no symmetric (B,C) and (C,B) packet pair exists.

Acceptance:
- `seed-loyalty-organic` scenario passes with exactly 1 loyaltyChoice
  packet on A
- G0H rerun shows at most 1 loyalty packet per distinct competing-pair
  per caregiver per cooldown window

Rollback flag:
`gameConfig.cognition.triggers.loyalty.competingDistress.canonicalDedupe = true`

Risks:
- the "helped first" detection requires extra state per distressRecords
  entry. This is small but must be cleaned up when the record is purged.
- if neither distressed butterfly's level drops within the cooldown
  window, NO loyalty packet is emitted. This is fine; "the caregiver
  could not actually help either" is not a choice.

---

### X3 - G0H driver coverage (death + witnessed + long-absence verified)

Goal: G0H exercises ALL six production trigger classes via production
code paths, not via direct lifeSim calls.

Owned files:
- `scripts/g0h/playthroughDriver.js` (new methods)
- `scripts/g0h/fixtureSpec.js` (timeline updates, evidence assertions)
- `scripts/run-g0h-scripted-playthrough.js` (timeline)
- `scripts/g0h/evidenceAssertions.js` (per-trigger assertions)

Forbidden files:
- systems/, entities/
- save schema
- render math

Implementation steps:

X3.1 - killBondedPartner driver method.
  Adds an action at ~3:20 of the timeline that emits BUTTERFLY_DIED
  on Pollen via the production pipeline. The bereavement on Orchid
  fires through the existing lifeSimSystem.recordBereavementForDeath
  listener (`lifeSimSystem.js:10-15`). The X1.2 emit makes this visible
  in the report.

```js
async killBondedPartner(alias = 'Pollen') {
  return this.page.evaluate(targetAlias => {
    const target = (gameCore.gameState?.butterflies || []).find(
      e => e.displayName === targetAlias || e.lifeSim?.identity?.fixtureAlias === targetAlias
    );
    if (!target) return { ok: false, reason: 'missing-target' };
    target.hp = 0;
    target.dead = true;
    target.lifeSim.lifecycle = target.lifeSim.lifecycle || {};
    target.lifeSim.lifecycle.deceased = true;
    if (typeof eventBus !== 'undefined' && GameEvents?.BUTTERFLY_DIED) {
      eventBus.emit(GameEvents.BUTTERFLY_DIED, {
        entity: target,
        source: 'g0h-scripted-bonded-loss'
      });
    }
    return { ok: true, deceasedId: target.id, deceasedAlias: targetAlias };
  }, alias);
}
```

X3.2 - nudgeWitnessedAffection driver method.
  Adds an action at ~4:30 of the timeline that:
  1. Verifies Iris, Juniper, Kite are in ivy-cloister within 6 board
     units of each other.
  2. Asks Juniper to emit a cooperation signal toward Kite with intent
     tags `['comfort', 'companionship', 'warmth']` and
     `metadata.affectionIntensity: 0.82`. This goes through
     `communicationSystem.emitCooperationSignal -> emitDialogue ->
     recordWitnessedAffection`. Iris is the witness because she has a
     companion+ bond to Juniper and is in zone.
  3. Steps the simulation 60 frames so the witness's lifeSim deep-eval
     can pick up the new packet.

```js
async nudgeWitnessedAffection() {
  return this.page.evaluate(() => {
    const state = gameCore.getGameState();
    const byName = name => (state.butterflies || []).find(
      e => e.displayName === name || e.lifeSim?.identity?.fixtureAlias === name
    );
    const iris = byName('Iris'), juniper = byName('Juniper'), kite = byName('Kite');
    if (!iris || !juniper || !kite) return { ok: false, reason: 'missing-cast' };
    juniper.currentZoneId = iris.currentZoneId;
    juniper.boardPos = { ...iris.boardPos, u: iris.boardPos.u + 0.5 };
    kite.currentZoneId = iris.currentZoneId;
    kite.boardPos = { ...iris.boardPos, u: iris.boardPos.u + 1.5 };
    const result = communicationSystem.emitCooperationSignal?.(juniper, {
      signalType: 'acknowledgement_signal',
      intentFamily: 'social',
      intentTags: ['comfort', 'companionship', 'warmth'],
      phrase: 'Kite, stay close to me; you are easy company.',
      targetIds: [kite.id],
      zoneId: iris.currentZoneId,
      reason: 'g0h-scripted-witnessed-affection',
      metadata: { affectionIntensity: 0.82 }
    });
    return {
      ok: !!result,
      sourceId: juniper.id,
      witnessId: iris.id,
      thirdPartyId: kite.id
    };
  });
}
```

X3.3 - assertLongAbsenceForOrchid evidence check.
  After the timeline runs, read Orchid's `lifeSim.memories.social` and
  assert at least one packet has `kind === 'bereavement' && subtype ===
  'long-absence' && partnerId === Pollen.id` AND
  `intensity > 0.15 && intensity < 0.5` (long-absence is half-strength).

X3.4 - Add cognition coverage assertion lane.
  In `evidenceAssertions.js`, add a new lane:
```js
{
  id: 'cognition-coverage',
  pass: hasBereavement && hasLongAbsence && hasWitnessedAffection
        && hasLoyaltyChoice && hasPrideBattleWin && hasPrideCaregiving,
  details: { perKindCounts, missingKinds }
}
```
  This lane lists which of the 6 production trigger classes fired
  during the run.

Acceptance:
- G0H rerun shows non-zero counts for ALL of:
  bereavement (death), bereavement-long-absence, witnessedAffection,
  loyaltyChoice, prideAnchor (battleWin), prideAnchor (caregivingSuccess)
- the cognition-coverage lane reports `pass`
- the evidence-fidelity lane (X1.4) reports `pass`
- save-reload-continuity preserves all packets

Rollback: each new driver method is additive. No flag.

Risks:
- killBondedPartner setting `target.dead = true` may confuse other
  systems if they read it before the BUTTERFLY_DIED event listener has
  cleaned up. Existing death pipeline path in core/gameCore.js already
  handles this, so the explicit emit is redundant but safe. Verify by
  running `run-r2-zone-transition-audit` after the kill.

---

### X4 - Organic floors (cleanup, cooperation) + DOM feed/inspect

Goal: provable lived-play behavior at 5-min and 60s windows, plus DOM
surfacing of cognition that already works in canvas mode.

Owned files:
- `scripts/run-r-flower-lifecycle-audit.js` (organic cleanup lane)
- `scripts/run-r-cooperation-pressure-audit.js` (organic 5-min lane)
- `ui/dom/feedPanel.js` (italic line)
- ui/dom/inspect panel (find via grep; add feeling row)

Forbidden files:
- save schema, ML runtime, projection math, battle math

Implementation steps:

X4.1 - Cleanup-floor-organic lane.
  Mirror the existing teleport-driven lane but place butterflies 3+
  board units AROUND the piles. Run 60s with NO teleporting. Acceptance:
  >= 4 of 8 piles cleaned organically. If fewer clean, the lane reports
  the gap as a real product issue (do not silently fall back to teleport).

X4.2 - Cooperation-organic-floor lane.
  Mirror the existing 5-min injection lane but plant the preconditions
  (heavy block, two companion pairs, scarcity-prone density,
  distress-prone butterflies). Do NOT call runH1..runH5. Run 18000
  frames. Acceptance: >= 1 of EACH of H1..H5 fires organically.
  If a hook never fires, report it explicitly.

X4.3 - DOM feed italic.
  When a feed entry's threadLines carry `heardMeaning`, render an
  italic `<em>` line under the spoken phrase with class
  `shell-feed-heard-meaning`. Cap at 60 chars.

X4.4 - DOM inspect feeling row.
  Find the DOM inspect panel (typically `ui/dom/inspectPanel.js` or
  similar). Add a feelings row showing loneliness / comfortSeeking /
  socialInsecurity / jealousy / grief / pride / shame / loyaltyBias as
  percentage labels. Match the canvas layout at gameUI.js:621.

Acceptance:
- both organic lanes pass deterministically
- DOM feed renders heard-meaning italic in the
  `r10_interpretation_italic_probe` audit screenshot
- DOM inspect feelings row visible in the n6 audit screenshot
- runtime self-audit stays green

Rollback flags:
- `gameConfig.ui.feedThreads.interpretationItalicDom = true`
- `gameConfig.ui.inspectDom.cognitionFeelings = true`

---

### X5 - ML trainer + corpus growth

Goal: produce an m5 garden policy that BEATS m4 on artifact-match AND
improves at least 3/6 value-band metrics at the shipped cadence.

Owned files:
- `scripts/train-m5-garden-policy.js` (NEW)
- `assets/ml/m5-garden-policy.json` (NEW)
- `core/config.js` (`gameConfig.ml.modelVersionId` flag, default still
  `m4-garden-policy-v1`)
- `scripts/run-ml-phase-m4-audit.js` (rename to support `--policy=mX`)
- `scripts/run-ml-on-off-capture-audit.js` (`--policy=mX`)

Forbidden files:
- ML runtime contract (the c1 spec stays)
- save schema
- entities/, lifeSimSystem ownership of durable feelings

Implementation steps:

X5.1 - Build the trainer.
  Stand up `scripts/train-m5-garden-policy.js`:
  - Read `corpus-records.json` from the latest c2 corpus directory.
  - For each policy family, build (features, label) rows from
    `decisionHistory[*]` where `trainingLabels[<family>]` is a known
    label.
  - Fit a one-vs-rest linear classifier. No external deps; small
    gradient descent (1000 iterations, lr 0.05, ridge lambda 0.01) is
    enough at 12-100 records.
  - Serialize to the m4-policy format (weights + bias per output, schema
    version `m5-linear-policy-v1`).
  - Write to `assets/ml/m5-garden-policy.json`.
  - Report per-family training match rate vs heuristic.

X5.2 - Wire the model version flag.
  `gameConfig.ml.modelVersionId` toggles which artifact is loaded. Keep
  m4 as the production default. m5 is opt-in for the audit.

X5.3 - Re-run the audits.
  - `run-ml-phase-m4-audit` with `--policy=m5`
  - `run-ml-on-off-capture-audit` with `--policy=m5` at cadenceFactor=1, 2, 4
  - Promotion gate: m5 must beat m4 on artifact-match (>=55/56) AND
    improve >=3/6 value-band metrics at cadenceFactor=2

X5.4 - Document outcome honestly in `docs/ML-VALUE-DECISION-2026-05-XX.md`.
  Record the artifact-match rates per family, value-band metrics at each
  cadence, and the promotion decision. If m5 still does not beat m4,
  document that the corpus is too small and propose corpus growth
  approaches:
  - Synthetic scenarios from the existing 13 organic seeds with random
    perturbations (more diverse coverage)
  - Capture from the long-form scripted G0H runs (record decision-
    history per butterfly)
  - User-curated review-correction labels on existing records (the
    review.correctedPolicies field exists)

X5.5 - Corpus growth fallback.
  If the trainer cannot beat heuristic with 12 records, extend
  `build-c2-trace-corpus.js` to consume the G0H scripted playthrough as
  a NEW lived-loop source (each scripted scenario contributes one
  record). Re-run the audit.

Acceptance (X5):
- training script runs without error
- m5 policy artifact written
- m4 audit at m5 reports artifact-match rate per family
- ml-on-off audit at m5 reports value-band metrics at all 3 cadences
- ML-VALUE-DECISION doc updated with the data
- if promotion gate fails, the doc explicitly says "do not ship m5 as
  default; ship a corpus-growth follow-up"

Rollback: `gameConfig.ml.modelVersionId = 'm4-garden-policy-v1'` keeps m4
as default. m5 is opt-in until the gate passes.

Risks:
- 12 records may be too few to fit a useful policy. Document this and
  propose corpus growth before silently shipping m5.
- a trainer pass at 12 records is more "demonstrate the path" than "ship
  a policy." That is fine; the user asked for an honest training/update
  path.

---

## Section 5 - G0H Rerun + Acceptance for Promotion

After X1-X3 land (X4-X5 in parallel), rerun the G0H scripted packet:

```
node scripts/run-g0h-scripted-playthrough.js
```

The packet must report:

```text
must-pass lanes (10 prior + 2 new = 12)
+-- runtime-errors                      pass
+-- capture-export                      pass
+-- zone-visits                         pass
+-- inspect-coverage                    pass (now with non-zero memoryPacketCount)
+-- save-reload-continuity              pass (now with per-kind continuity)
+-- block-cell-discipline               pass
+-- production-social-event             pass (>=4 cognition kinds)
+-- feed-thread-shape                   pass
+-- flower-lifecycle                    pass
+-- battle-and-ability                  pass
+-- evidence-fidelity                   pass (X1.4)
`-- cognition-coverage                  pass (X3.4)
                                        - bereavement (death) >= 1
                                        - bereavement (long-absence) >= 1
                                        - witnessedAffection >= 1
                                        - loyaltyChoice >= 1 (one canonical pair)
                                        - prideAnchor (battleWin) >= 1
                                        - prideAnchor (caregivingSuccess) >= 1

residuals (do not block)
+-- cleanup-organic-floor (if X4 lands)
+-- cooperation-organic-floor (if X4 lands)
`-- ML value-band on shipped cadence (if X5 lands and m5 promotes)
```

If all 12 must-pass lanes are green AND no `console.error` AND no
`pageError` AND `errorRuntimeIssueCount === 0`, the packet is the
official close baseline for human G0 capture.

If `cleanup-organic-floor` or `cooperation-organic-floor` reports
residuals, those are real product gaps to follow up on; do not block
G0H promotion on them.

If `ML value-band` does not promote m5, the user has explicit data to
make the product call (keep heuristic, ship m5 with caveats, or invest
more in corpus growth).

---

## Section 6 - Human G0 Capture Plan (after X-phase + rerun)

The capture should run AFTER the X-phase rerun reads honestly.

### Setup

- Use the synthetic `g0h-scripted-fixture` save as the playable starting
  state. The fixture cast is curated to provoke each cognition class
  during a guided 7-minute session.
- The user plays the build manually with the fixture loaded. The
  scripted G0H driver does not run during this session - the user is
  the camera and the actor.
- Recording: enable the existing session capture
  (`gameCore.telemetrySystem.startSessionCapture`).

### What to do, minute by minute

```text
0:00-0:30  open in ivy-cloister; observe ambient grid, soft envelope.
           Player Q: does this read as ONE playfield?
0:30-1:30  inspect Lumen, Mira, Iris. Look at edges, drives, feelings.
           Player Q: does inspect explain who they are without claiming
                     subjective feeling?
1:30-2:30  switch to moss-hollow. Observe Aster/Briar/Clover. Wait or
           nudge Briar to enter distress (if the fixture has decay-pre-
           aged flowers, that may suffice). Watch for distress cascade,
           caregiving, possible loyalty choice, possible pride anchor.
           Player Q: do the social events read as cause -> response ->
                     consequence?
2:30-3:30  inspect Aster after the cascade. Look for memory packets
           (loyaltyChoice, prideAnchor). Confirm the inspect surface
           shows these as functional records, not as metaphysical
           claims.
3:30-4:30  switch to pool-heart. Observe Vale (lonely, alone). Inspect
           Orchid (bonded partner missing Pollen). Look for long-
           absence bereavement packet. Player Q: does the inspect
           describe Orchid's grief packet as functional ("misses
           Pollen for 2:14 more"), not metaphysical?
4:30-5:30  go back to ivy-cloister. Watch the Iris/Juniper/Kite triangle.
           If the timing is right, witnessed-affection fires; check
           Iris's inspect for the packet. Player Q: does Iris's reaction
           feel like jealousy in functional terms?
5:30-6:30  switch to sun-court. Trigger an autobattle between Rowan/Sage
           and Thorn/Wisp. Observe ability radius. After commit, inspect
           a winner for prideAnchor. Player Q: does the battle feel like
           the same world as the garden, just on a tighter board?
6:30-7:00  save and reload. Re-inspect 2-3 butterflies. Confirm packets
           survive. Player Q: does identity, edges, memories, and
           feelings all feel preserved across the save/reload?
```

### What to write down after the capture

A short human-review.md filled in by the user, answering the existing
11 questions plus 2 new ones:

- Does inspect's "Last choice" line (X4 optional) read as a believable
  reason, or as a list of numbers?
- Did long-absence grief on Orchid feel like grief, or like noise?

### What would fail the human gate

- "I cannot tell what is going on in the world." (legibility fail)
- "The butterflies feel like simulation noise." (cognition fail)
- "Inspect claims feelings I do not believe." (metaphysics fail)
- "After reload, X disappears." (continuity fail)

### What is residual, not failure

- ML still scores like heuristic (we already know this; X5 documents it)
- a single feeling does not arrive in 7 minutes (some feelings require
  longer co-time; the fixture is a stage, not a guarantee)
- a particular dialogue style still reads as system-authored (this is a
  later writing pass, not a G0 blocker)

---

## Section 7 - Real-AI Plan (Honest)

The user's "real AI" target has TWO halves:

**Half A: behavioral coherence and durable inner life.** This is a life-
sim plus rule-based cognition plus event-anchored memory. The current
build has 50-65% of this in place. The remaining work is:

```text
behavioral coherence work (already named above)
+-- X1: evidence layer reads cognition correctly
+-- X2: loyalty does not contradict itself
+-- X3: G0H drives every trigger class
+-- X4: organic floors prove lived play
+-- (later) X4.5: explainability sidecar (last-choice reason)
+-- (later) richer routine vocabulary if 8 motives prove insufficient
```

We are NOT close to needing "more drive/emotion/edge vocabulary." The
existing 8 drives, 9 emotions, 8 social edges, 8 memory families, 12
motives, 8 chemistry channels, 8 society summaries, 7 distortion biases
are sufficient for the named experiences (loneliness, grief, jealousy,
pride, shame, loyalty, comfort-seeking, social insecurity). The missing
piece is wiring + observability, not vocabulary.

I do NOT recommend new vocabulary now. If a future scenario shows that
e.g. "anticipation" (looking forward to a future event) cannot be
expressed by curiosity + statusExpression + remembered-promise, propose
it then with concrete owner / migration / proof. Today, the data shows
the current vocabulary is the bottleneck only because of triggers and
evidence, not expressiveness.

**Half B: scored choices and learned policies.** This is ML. The current
build has 15-25% of this. The remaining work is:

```text
ML work (X5 + follow-ups)
+-- X5: real trainer, m5 candidate, audit, decide promote
+-- (if m5 fails gate) corpus growth via G0H scripted runs and review-
|   corrected labels
+-- (after first promotion) periodic re-train pipeline
+-- (much later) move from scoring single-frame decisions to scoring
    short-horizon plans (alternative trajectories), still using
    durable life-sim state as features
```

The ML promotion gate should always be:
1. artifact-match rate per family >= heuristic per family
2. value-band: at least 3/6 metrics improve at the shipped cadence
3. lived-play behavioral observability: in a fixed scripted G0H, the
   m5 build produces equal or richer cognition-coverage (Section 5)

If the gate is not met, ML stays at m4 (or earlier) and the docs
honestly say so. ML must EARN promotion.

The contract that ML may NOT own durable feelings, memories, bonds, or
relationships stays. ML scores choices; lifeSim/communication owns the
truth. This is the clean separation that allows us to keep iterating
on ML without breaking the life-sim.

---

## Section 8 - Save Continuity Protocol

```text
save continuity rules for X1..X5
+-- saves remain at schemaVersion 5
+-- X1: pure observability addition; no save touch
+-- X2: trigger logic only; no save touch
+-- X3: driver-only; no save touch
+-- X4: UI/audit only; no save touch
+-- X5: ML artifact change only; no save touch (artifacts are not save
|   data; they are runtime assets in assets/ml/)
+-- The g0h-scripted-fixture save is a synthetic test save. The user's
|   real save remains protected (run-h5 ignores fixture exports unless
|   explicitly provided).
`- if any future phase needs a real schema bump, it is its own joint
   signoff under the SAVE-SCHEMA-REGISTRY. None of X1..X5 needs it.
```

---

## Section 9 - Risk Summary

```text
high
+-- X1.2 emits cognition:triggered from lifeSimSystem. If a death event
|   is dispatched twice (once direct, once via eventBus), the survivor's
|   bereavement packet would be created once but the cognition trigger
|   would fire twice. Mitigate: check existing packet before creating
|   in recordBereavementForDeath - this is already true. Only emit
|   cognition:triggered when a NEW packet was created.
+-- X3.1 killBondedPartner sets dead=true. If existing systems run on
|   target before the next frame, they may misbehave. Mitigate: also
|   call any existing death cleanup (e.g., gameCore.handleButterflyDeath
|   if it exists) so the cleanup path matches normal death.
+-- X5 trainer with 12 records may overfit and produce a worse policy
|   than m4. Mitigate: ridge regularization at lambda 0.01-0.1; report
|   per-family rates; do NOT promote unless the gate passes.

medium
+-- X2 helped-first detection adds state per distressRecords entry. If
|   a record is not cleaned, memory grows. Mitigate: prune state on the
|   record's existing 1800-frame timeout already in updateDistressCascade.
+-- X3.2 nudgeWitnessedAffection emits a dialogue with curated intent
|   tags. If the recipient's interpretation has noise, the witnessed
|   affection packet may not fire. Mitigate: place Iris with stable
|   bond to Juniper, not in distress, and with line-of-sight; the
|   production trigger requires bondTier companion+ and zone match.
+-- X4 cooperation-organic floor may report multiple H? hooks not
|   firing in 5 minutes. That is real signal; treat as residual, not
|   failure.

low
+-- X1.1 snapshot read change may break the fast G0H sanity output if
|   tests assert exact memoryPacketCount=0. Verify by running fast
|   sanity once after the fix and update tests if any assert 0.
+-- X4.3 DOM feed italic may overflow at narrow widths. Cap at 60 chars
|   and use text-overflow ellipsis.
```

---

## Section 10 - Audit Lane Map

```text
must stay green through X1..X5 + G0H rerun
+-- run-runtime-self-audit.js
+-- run-h5-long-running-save-smoothness-audit.js
+-- run-r2-zone-transition-audit.js
+-- run-r-block-cell-discipline-audit.js
+-- run-n8-social-save-continuity-audit.js
+-- run-f1-session-capture-audit.js
+-- run-ability-radius-conversion-audit.js
+-- run-single-player-autobattle-audit.js
+-- run-r6-communication-audit.js
+-- run-r-feed-thread-audit.js
+-- run-r-flower-lifecycle-audit.js (existing teleport lane stays)
+-- run-r-cooperation-pressure-audit.js (existing injection lane stays)
+-- run-r-altitude-probe.js
+-- run-r-spatial-cleanup-audit.js
+-- run-scenario.js --all (23 storage + organic scenarios)
`-- run-g0h-scripted-playthrough.js (must be green at 12 lanes after rerun)

new in this slice
+-- X1: evidence-fidelity residual lane in G0H
+-- X3: cognition-coverage must-pass lane in G0H
+-- X4: cleanup-organic-floor lane in run-r-flower-lifecycle-audit
+-- X4: cooperation-organic-floor lane in run-r-cooperation-pressure-audit
+-- X5: scripts/train-m5-garden-policy.js (NEW)
+-- X5: --policy flag in run-ml-phase-m4-audit and run-ml-on-off-capture
+-- X5: docs/ML-VALUE-DECISION-2026-05-XX.md (next iteration)
```

---

## Section 11 - Files / Owners Summary

```text
owned this slice
+-- X1
|   scripts/g0h/playthroughDriver.js
|   scripts/g0h/evidenceAssertions.js
|   scripts/run-g0h-scripted-playthrough.js
|   systems/lifeSimSystem.js (cognition:triggered emits only)
+-- X2
|   systems/communicationSystem.js (canonical pair-key + helped-first
|                                    detection)
|   scripts/scenario/scenarios/seed-loyalty-organic.json
+-- X3
|   scripts/g0h/playthroughDriver.js (new methods)
|   scripts/g0h/fixtureSpec.js (timeline updates)
|   scripts/run-g0h-scripted-playthrough.js (timeline)
|   scripts/g0h/evidenceAssertions.js (cognition-coverage lane)
+-- X4
|   scripts/run-r-flower-lifecycle-audit.js (organic lane)
|   scripts/run-r-cooperation-pressure-audit.js (organic lane)
|   ui/dom/feedPanel.js (italic line)
|   ui/dom/<inspect panel> (feeling row)
`-- X5
    scripts/train-m5-garden-policy.js (NEW)
    assets/ml/m5-garden-policy.json (NEW, gated)
    core/config.js (gameConfig.ml.modelVersionId default unchanged)
    scripts/run-ml-phase-m4-audit.js (--policy flag)
    scripts/run-ml-on-off-capture-audit.js (--policy flag)
    docs/ML-VALUE-DECISION-2026-05-XX.md (NEW)

forbidden across all phases
+-- save schema bump
+-- ML runtime contract surface (the c1 spec stays)
+-- new drive / emotion / motive / memory family / social-edge vocabulary
+-- gridManager.js
+-- core/renderManager.js projection math
+-- battleSystem.js battle math beyond existing pride trigger
+-- entities/* movement / target derivation (the iso-cleanup is upstream
    W5; do not re-open here)
```

---

## Section 12 - End-of-Document Honest Framing

```text
honest framing (this slice)
+-- the prior plan (CLAUDE-REVIEW-FREEZE-PLAYTEST-NEXT-PLAN-2026-04-30)
|   was right. Codex landed W1..W6 mostly correctly.
+-- the G0H scripted packet is real evidence. It also has under-reporting
|   bugs that make the "10/10 pass" header read more confidently than the
|   underlying data supports.
+-- the cognition wiring is real. 5 of 6 trigger classes are wired in
|   production code. Two of them (battle pride, caregiving pride) fired
|   end-to-end in the official packet. Three (death-bereavement, long-
|   absence, witnessed-affection) did not fire OR were silent because of
|   missing eventBus emission.
+-- the spatial/save/block layers are honestly green. No rebuild needed.
+-- the believability bar is now bottlenecked on:
|   1. evidence honesty (X1, X3 cognition-coverage)
|   2. cognition correctness (X2 loyalty symmetric fire)
|   3. driver coverage of the missing trigger classes (X3)
|   4. organic lived-play floors (X4)
|   5. ML training (X5)
+-- after X1..X5 land and G0H reruns honestly, the user can make a
|   clean human G0 judgment on the fixture playthrough.
+-- consciousness is not claimed. The cognition packets remain functional
|   state with named triggers, decay, save persistence, and audit proofs.
|   The Inspect surface should describe them in functional terms ("Misses
|   Pollen for 2:14 more"), not metaphysical terms.
+-- ML stays as a read-only scorer. lifeSim/communication remain owners
|   of durable social truth. m5 is the next honest training pass; the
|   promotion gate is what protects against shipping a regression.
`- this is the slice that takes the build from "wired and partially
   visible" to "wired, visible, and honestly judged." Then human capture.
```
