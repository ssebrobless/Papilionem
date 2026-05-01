# G0H Scripted Playthrough Fixture Plan - 2026-05-01

## Verdict

A scripted G0H playthrough is a better next proof than a purely freeform 7-minute human capture. The freeform capture is still valuable, but it is too dependent on chance: grief, loyalty, pride, shame, flower cleanup, block stacking, ability radius, battle presentation, save continuity, and feed readability may not all happen in one normal run.

The stronger plan is:

```text
G0H evidence ladder
+-- synthetic fixture save
|   +-- controlled cast, positions, memories, edges, flowers, blocks, battle setup
|   `-- never overwrites the player's long-running save
+-- scripted 7-minute capture
|   +-- visits all zones
|   +-- forces the camera/player route only
|   +-- lets production systems create the proof events
+-- automated report
|   +-- screenshots, inspect snapshots, feed excerpts, event counters
|   +-- save/reload continuity comparison
|   `-- runtime/page/console error gate
`-- human judgment pass
    +-- visual readability
    +-- whether the society feels alive
    +-- whether social behavior reads as cause -> response -> consequence
```

This should not replace human judgment. It should make human judgment cleaner by putting the right situations on stage.

## Current Evidence Context

Completed:
- R0-R9 visual/spatial/social rebuild phases.
- R10/R11/R12/E1-E6 cognition expansion.
- W1-W6 production trigger, scenario, spatial cleanup, long-absence, ML decision work.
- Save restore compatibility fix for old sim-board saves.

Recent preflight gates passed:
- `node scripts/run-h5-long-running-save-smoothness-audit.js`
- `node scripts/run-runtime-self-audit.js`
- `node scripts/run-n8-social-save-continuity-audit.js`
- `node scripts/run-r2-zone-transition-audit.js`
- `node scripts/run-f1-session-capture-audit.js`
- `node scripts/run-r-block-cell-discipline-audit.js`

ML caveat:
- ML remains a read-only scorer and is not proven as better than heuristic.
- `docs/ML-VALUE-DECISION-2026-05-01.md` records factor 1 = 1/6, factor 2 = 1/6, factor 4 = 3/6 value metrics.
- G0H can close visual/social/save-readiness if honest, but must not claim ML value is solved.

## Ownership Rules

```text
truth owner map
+-- saveSystem
|   `-- fixture save export/import, v5 additive continuity only
+-- lifeSimSystem
|   `-- durable feelings, memories, outcome anchors, derived cognition
+-- communicationSystem
|   `-- dialogue, interpretation residue, distress cascade, scout/social signals
+-- structureSystem/objectSystem
|   `-- block cells, carry/drop/use, dirt piles, food reserves
+-- battleSystem
|   `-- battle snapshots, attacks/projectiles, battle pride trigger
+-- renderManager/gameUI
|   `-- screenshots, inspect/feed readability, visual truth only
`-- mlInferenceSystem
    `-- scores choices and exports traces; never owns durable social truth
```

Synthetic fixture setup may use owner APIs to seed initial state. G0H proof events must be counted separately as events produced during the scripted run, not as pre-seeded storage.

## Fixture Save Design

Create a deterministic save named `g0h-scripted-fixture` under `qa_logs/save_exports/`. The player's real save must not be modified.

Recommended cast: 16 butterflies.

| Alias | Zone | Board Pos | Purpose |
|---|---|---:|---|
| Aster | moss-hollow | 8,8,0 | caregiver, loyalty-choice witness |
| Briar | moss-hollow | 10,8,0 | distressed companion |
| Clover | moss-hollow | 12,8,0 | competing distressed companion |
| Lumen | ivy-cloister | 7,7,0 | scout/teacher signal source |
| Mira | ivy-cloister | 8,7,0 | scout recipient |
| Nettle | ivy-cloister | 9,7,0 | scout recipient |
| Iris | ivy-cloister | 16,8,0 | jealousy/attachment subject |
| Juniper | ivy-cloister | 17,8,0 | partner in jealousy triangle |
| Kite | ivy-cloister | 18,8,0 | third-party affection/rivalry target |
| Orchid | pool-heart | 10,10,0 | bonded partner missing Pollen |
| Pollen | moss-hollow | 28,18,0 | absent bonded partner |
| Vale | pool-heart | 28,17,0 | isolated/lonely butterfly |
| Rowan | sun-court | 8,8,0 | battle team, high contribution |
| Sage | sun-court | 10,8,0 | battle ally/support |
| Thorn | sun-court | 13,8,0 | opponent |
| Wisp | sun-court | 15,8,0 | opponent |

Use locked drive/emotion vocabulary only:
- drives: `selfMaintenance`, `safetyAvoidance`, `resourceControl`, `socialConnection`, `caregiving`, `exploration`, `statusExpression`, `rest`
- emotions: `threat`, `relief`, `attachment`, `rejection`, `significance`, `failure`, `curiosity`, `agitation`, `exhaustion`

Seed social setup:
- Aster -> Briar: trust .72, comfort .70, attachment .68, protectiveness .62, bondTier `companion`, coTimeSeconds 900.
- Aster -> Clover: trust .70, comfort .68, attachment .66, protectiveness .60, bondTier `companion`, coTimeSeconds 900.
- Iris -> Juniper: trust .78, comfort .76, attachment .84, bondTier `bonded`, coTimeSeconds 1900.
- Iris -> Kite: rivalry .38, resentment .20.
- Juniper -> Kite: admiration .62, comfort .58.
- Orchid -> Pollen: trust .82, comfort .80, attachment .84, bondTier `bonded`, coTimeSeconds 1900, lastSeenAtFrame old enough for long-absence proof.
- Vale: no strong edges, socialConnection drive high, positioned away from other butterflies.

Seed initial conditions:
- Briar and Clover start calm enough that distress is triggered during the run, not pre-counted.
- Orchid has durable edge state but long-absence packet should be generated during scripted cognition advancement.
- Lumen has exploration/statusExpression bias and scout target `pool-heart`.
- Rowan/Sage/Thorn/Wisp have battle-ready stats/specials.

Flowers / food / dirt:
- moss-hollow: 4 fresh flowers around u 6-9, v 13-14.
- moss-hollow: 3 flowers pre-aged to decay within minute 2-3.
- moss-hollow: 4 dirt piles at u 15-18, v 12.
- ivy-cloister: 2 reserve-food balls, different colors, near u 11, v 13.
- pool-heart: 2 flowers near Vale but outside immediate pickup range, to test motive/targeting rather than instant consumption.

Blocks:
- No ambient or fixture blocks in sun-court.
- ivy-cloister: legal 3-block shelter cue at cells (4,16,0), (5,16,0), (6,16,0).
- moss-hollow: legal stack column at (20,15,0), (20,15,1), plus neighbor at (21,15,0).
- pool-heart: legal low wall at (24,15,0), (25,15,0), (26,15,0).
- All blocks must satisfy `run-r-block-cell-discipline-audit.js`: no duplicates, no half-cells, no out-of-range cells, no unsupported stacks.

Abilities / battle:
- Assign `warmRally` or equivalent support visual to Aster if available.
- Assign `teacher` or equivalent signal visual to Lumen if available.
- Assign mixed battle abilities to Rowan/Sage/Thorn/Wisp.
- Use existing battleSystem motion/projectile conversion; do not reopen battle architecture.

## Scripted 7-Minute Timeline

The runner should create a real session capture of at least 420 seconds. If fully real-time is too slow for iteration, support a `--fast` mode for development, but final G0H output must be a normal-duration capture unless explicitly marked as accelerated.

| Time | Zone | Driver Action | Expected Evidence |
|---:|---|---|---|
| 0:00 | ivy-cloister | load fixture, start capture, screenshot focused mode | no page/console errors, visible grid/envelope |
| 0:20 | ivy-cloister | inspect Lumen, Mira, Iris | identity, edges, drives visible |
| 0:45 | ivy-cloister | trigger/allow Lumen scout/teaching signal | feed thread, recipients, possible scout pride |
| 1:20 | overview | screenshot overview, switch zones via UI | all zones readable, no centered obsolete overlay |
| 1:45 | moss-hollow | inspect Aster/Briar/Clover | companion edges visible before distress |
| 2:00 | moss-hollow | raise Briar and Clover distress through production state, step sim | Aster chooses one, loyaltyChoice packet/edge delta if conditions met |
| 2:45 | moss-hollow | observe flower decay and dirt cleanup | dirt pile count drops, cleanup feed/object events |
| 3:20 | moss-hollow | demonstrate legal block stack and height | stack reads as height, no overlap, no block-cell runtime errors |
| 4:00 | pool-heart | inspect Orchid and Vale | long-absence grief/comfort-seeking/loneliness visible as functional state |
| 4:45 | pool-heart | save, reload, re-inspect Orchid or Aster | identity, memories, edges, packets survive reload |
| 5:25 | sun-court | start scripted battle/autobattle | battle view, attack/projectile radius, no blocks in training zone |
| 6:15 | sun-court | finish/commit battle | battle pride anchor if contribution condition met |
| 6:45 | ivy-cloister | final feed + inspect screenshots | thread continuity, heard-meaning italic if misunderstanding exists |
| 7:00 | any | export capture and report | capture.json, summary.txt, screenshots, pass/fail report |

## Required Evidence Files

Output root:
- `qa_logs/g0h_scripted_playthrough/<timestamp>/`

Required files:
- `fixture-save/save.json`
- `capture/capture.json`
- `capture/summary.txt`
- `report.json`
- `human-review.md`
- screenshots:
  - `00-ivy-focused.png`
  - `01-inspect-lumen.png`
  - `02-overview.png`
  - `03-moss-distress.png`
  - `04-flower-cleanup.png`
  - `05-block-stack.png`
  - `06-pool-grief-lonely.png`
  - `07-after-reload-inspect.png`
  - `08-sun-battle.png`
  - `09-final-feed.png`

The report should include:
- zone visit counters
- inspected butterfly IDs before/after reload
- memory packet counts by entity
- social edge deltas for Aster/Briar/Clover and Orchid/Pollen
- flower/dirt/reserve-food counts before/after
- block cell validation summary
- battle event summary
- ability visual/radius summary
- runtime issue counts
- page/console errors
- ML runtime summary as context only

## Automated Acceptance

Must pass:
- no page errors
- no console errors
- `errorRuntimeIssueCount === 0`
- capture duration >= 420000 ms for official run
- all four zones visited through player-facing UI or equivalent UI driver
- at least 3 butterflies inspected, with at least 1 inspected again after reload
- save/reload preserves identity, edges, memories, packets, and fixture block cells
- no blocks in `sun-court`
- no duplicate/half/out-of-range block cells
- at least one feed thread with motive/target/response/consequence shape
- at least one social production event fires from the run, not just fixture seeding
- flower lifecycle evidence exists: flower decay or dirt pile cleanup or food reserve interaction
- battle/ability evidence exists, or report explicitly marks the lane infeasible with exact reason

Should fail G0H:
- runtime errors during capture
- save/reload loses inspected identity or social state
- block overlap / illegal cell state returns
- forced/unprompted camera zone changes return
- fixture proof relies only on direct lifeSim helper calls and no production path events
- screenshots do not correspond to the claimed evidence
- feed/inspect cannot show why a social behavior happened

Residual, not automatic blocker:
- ML value remains below promotion threshold if documented honestly.
- cadence-budget warnings without freezes/errors.
- subjective user dislike of a visual choice, provided the issue is named for a follow-up lane.
- a rare social hook not firing if the report names the exact condition that failed and the fixture still proves other required lanes.

## Human Judgment Checklist

The scripted report should produce `human-review.md` with these questions:

- Does focused mode read as one coherent playable space?
- Can you tell where butterflies can move?
- Can you tell when something is higher/lower?
- Do blocks look snapped and non-overlapping?
- Do flower decay, dirt piles, and food reserves read as actual world objects?
- Does the feed feel less repetitive and more like cause -> response?
- Does inspect explain social state without claiming literal consciousness?
- Do distress/caregiving/loyalty/grief/pride/shame read as functional behavior?
- Are butterfly sprites clear enough during the scripted close-ups?
- Does battle/ability presentation fit the sim-board rules?
- After reload, does continuity feel intact?

## Implementation Plan

### G0H-S0 - Fixture Save Builder

Owned files:
- `scripts/g0h/fixtureSpec.js`
- `scripts/build-g0h-fixture-save.js`

Forbidden:
- save schema
- player save files
- core lifeSim vocabulary
- ML artifact files

Steps:
1. Create a reusable fixture spec with cast, zones, board positions, edges, objects, blocks, and expected evidence IDs.
2. Build a Playwright script that starts from `gameCore.resetGame(true)`.
3. Seed entities through existing game/owner APIs where possible.
4. Use direct field assignment only for fixture initial state, and mark it as fixture seeding in the report.
5. Export the save to `qa_logs/save_exports/<timestamp>-g0h-scripted-fixture/save.json`.
6. Write `fixture-manifest.json`.

Proof:
- generated save loads
- no player save overwritten
- `run-r-block-cell-discipline-audit.js` stays green after import

### G0H-S1 - Scripted Playthrough Runner

Owned files:
- `scripts/run-g0h-scripted-playthrough.js`
- optional `scripts/g0h/playthroughDriver.js`

Steps:
1. Load the fixture save into isolated browser storage.
2. Start session capture.
3. Execute the 7-minute route.
4. Capture screenshots at every checkpoint.
5. Export session capture.
6. Save `report.json` and `human-review.md`.
7. Restore original storage snapshot at the end.

Proof:
- report exists
- capture exists
- screenshots exist
- storage restored

### G0H-S2 - Automated Assertions

Owned files:
- `scripts/run-g0h-scripted-playthrough.js`
- optional `scripts/g0h/evidenceAssertions.js`

Steps:
1. Add report-level checks for runtime, zones, inspect continuity, feed, blocks, flower lifecycle, battle/ability, and social production events.
2. Tag every evidence lane as `pass`, `fail`, or `residual`.
3. Make the script exit nonzero on must-pass failure.
4. Do not retune thresholds to hide failures.

Proof:
- must-pass checks all pass or report exits nonzero
- residuals are explicit and not silently promoted

### G0H-S3 - Existing Audit Replay

Run:
- `node scripts/run-runtime-self-audit.js`
- `node scripts/run-h5-long-running-save-smoothness-audit.js`
- `node scripts/run-r2-zone-transition-audit.js`
- `node scripts/run-r-block-cell-discipline-audit.js`
- `node scripts/run-n8-social-save-continuity-audit.js`
- `node scripts/run-f1-session-capture-audit.js`
- `node scripts/run-ability-radius-conversion-audit.js`
- `node scripts/run-single-player-autobattle-audit.js`

Optional:
- `node scripts/run-ml-on-off-capture-audit.js`

### G0H-S4 - User Review Packet

Owned files:
- generated only under `qa_logs/g0h_scripted_playthrough/<timestamp>/`

Steps:
1. Produce a short `README.md` in the output folder.
2. Link screenshots, capture summary, and human checklist.
3. Include exact pass/fail summary and residuals.
4. Provide the local game URL and fixture save path for manual replay.

## Recommended Codex Start

Start with G0H-S0 and G0H-S1 together only if they share a fixture spec cleanly. Do not edit gameplay logic unless the fixture exposes a hard blocker. The first implementation commit should be test tooling only.

If G0H-S1 reveals a real gameplay bug, pause the G0H tooling work, name the bug, and fix it in a separate commit before promoting the capture.

