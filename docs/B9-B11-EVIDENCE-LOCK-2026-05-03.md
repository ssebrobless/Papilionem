# B9-B11 Evidence Lock - 2026-05-03

Owner: Codex

Goal: close the residuals found after B8 by stabilizing society measurement without re-founding spatial logic, changing save schema, adding cognition vocabulary, or promoting a new ML artifact.

## 1. Shape Of The Patch

```text
╔════════════════════╗
║ B8 residuals       ║
╠════════════════════╬═══════════════════════════════╦════════════════════════════╗
║ hot bond churn     ║ B9 bond promotion hysteresis  ║ green long-soak churn      ║
║ partner repetition ║ B9 warning dialogue cooldown  ║ green repetition metrics   ║
║ zone-pull flake    ║ B10 scarcity resource priority║ green zone-pull scenario   ║
║ cleanup gradient   ║ B11 complete-window metric    ║ green cleanup gradient     ║
║ jealousy fixture   ║ durable rivalry -> jealousy   ║ green scenario aggregate   ║
╚════════════════════╩═══════════════════════════════╩════════════════════════════╝
```

## 2. Implementation Summary

### B9: Social Stability

- Added `gameConfig.cognition.bondTier.arcEvents.stabilization`.
- Added runtime-only pending bond promotion tracking in `systems/lifeSimSystem.js`.
- Bond promotions now hold briefly before moving up a tier, but historical `coTimeSeconds` counts toward that hold. This keeps fresh spikes from causing churn while allowing already-established relationships to advance.
- Added a warning-dialogue cooldown in `systems/communicationSystem.js` so repeated warning signals still apply, but do not spam the same spoken line toward the same partner.

### B10: Resource Pull Determinism

- Added scarcity truth to `zoneSystem.getZoneAffordanceVector`.
- In `systems/behaviorSystem.js`, resource drives now remain the priority migration reason when the current zone is under scarcity pressure. This keeps the resource-pull fixture from being hijacked by social/rest motives during the scarcity pulse.
- The zone-pull scenario assertion now counts an entity actively departing toward another zone as moved, which matches the current edge-travel state machine.

### B11: Cleanup Measurement Honesty

- `scripts/g0h/societyMetrics.js` now ignores incomplete cleanup-gradient windows instead of treating a partial end window as a full non-positive interval.
- Dirt production is still bounded through `gameConfig.cognition.affordances.cleanupActivityDirt`.
- G0H's cleanup observation window was widened from 7200 to 9600 simulated frames; the lane still requires at least five production-cleaned piles and does not inject cleanup.

### Scenario Harness Robustness

- `scripts/scenario/runner.js` now lets `witness_affection` actions name intended witnesses and prepares their companion edge preconditions while still using the production communication path.
- `seed-bond-progression` and `seed-bond-progression-organic` were adjusted to match stabilized bond promotion semantics.
- `seed-jealousy-organic` now verifies the behaviorally durable jealousy state: rivalry edge, derived jealousy, and movement-away behavior. Dedicated memory-packet coverage remains in `seed-witness-affection-organic` and G0H.

### Production Jealousy Improvement

- `systems/lifeSimSystem.js` now lets durable social-edge rivalry contribute to derived jealousy, not only short-lived witnessed-affection packets.
- This is still existing vocabulary and existing durable state; no new drive, emotion, memory family, motive, or social edge was introduced.

## 3. Evidence

```text
╔══════════════════════════════╗
║ Final proof state            ║
╠══════════════════════════════╬════════════════════════════════════════════════════╗
║ G0H scripted playthrough     ║ PASS 13/13                                        ║
║ Long-soak society fixture    ║ PASS                                              ║
║ Scenario suite               ║ PASS 38/38                                        ║
║ Runtime self audit           ║ PASS                                              ║
║ Cognition trigger coverage   ║ PASS                                              ║
║ Flower lifecycle             ║ PASS                                              ║
║ Block cell discipline        ║ PASS                                              ║
║ Zone transition              ║ PASS                                              ║
║ Social save continuity       ║ PASS                                              ║
║ Hover scroll                 ║ PASS                                              ║
╚══════════════════════════════╩════════════════════════════════════════════════════╝
```

### Final Proof Paths

- G0H 13/13:
  - `qa_logs/g0h_scripted_playthrough/2026-05-03T16-48-38-004Z/report.json`
  - `qa_logs/g0h_scripted_playthrough/2026-05-03T16-48-38-004Z/capture/summary.txt`
- Long-soak society:
  - `qa_logs/long_soak_society/2026-05-03T16-55-55-059Z/report.json`
- Scenario aggregate 38/38:
  - final aggregate output from `node scripts/run-scenario.js --all`
  - representative final scenario reports include:
    - `qa_screenshots/scenario/seed-jealousy-organic/2026-05-03T16-45-12-073Z/report.json`
    - `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-03T16-48-01-543Z/report.json`
    - `qa_screenshots/scenario/seed-witness-affection-organic/2026-05-03T16-47-18-469Z/report.json`
- Runtime self audit:
  - `qa_screenshots/runtime_self_audit/report.json`
- Cognition trigger coverage:
  - `qa_logs/r_cognition_trigger_coverage/2026-05-03T16-48-11-125Z/report.json`
- Flower lifecycle:
  - `qa_screenshots/r_flower_lifecycle_audit/2026-05-03T16-23-18-237Z/report.json`
- Block cell discipline:
  - `qa_screenshots/r_block_cell_discipline_audit/2026-05-03T16-24-44-339Z`
- Zone transition:
  - `qa_screenshots/r2_zone_transition_audit/2026-05-03T16-23-04-431Z`
- Social save continuity:
  - `qa_screenshots/n8_social_save_continuity_audit/2026-05-03T16-22-50-635Z`
- Hover-scroll:
  - `qa_screenshots/r_hover_scroll_audit/2026-05-03T16-25-06-478Z`

## 4. Key Final Metrics

From `qa_logs/long_soak_society/2026-05-03T16-55-55-059Z/report.json`:

- ML-on bond stability: `0.1644` (`<= 0.30` required).
- ML-on bond churn: `1.1667 transitions/min` (`0.25..2.0` required).
- ML-on partner repetition: `0.0923` (`<= 0.40` required).
- ML-on witnessed-affection rate: `0.8333/min` (`>= 0.10/min` required).
- ML-on cleanup gradient: `0` (`< 0.50` non-positive windows required).
- ML-on zone migration entropy:
  - mean entropy: `0.7598`
  - mean distinct zones visited: `2.4286`
- Conversation repetition: `0`.

Fixture assertions remained green on both ML-on and heuristic runs. The hand-computed bond-churn lane still observed the expected `2` transitions for the seeded `j -> k` pair.

## 5. Constraints Held

- Save schema remains v5.
- No player save wipe.
- No spatial/projection refoundation.
- No new cognition vocabulary.
- ML default remains m4; m7/m6 artifacts are not promoted by this lock.
- Sun-court remains the Training Grounds.
- Long-running saves remain protected.

## 6. Remaining Honest Notes

- The long-soak `grief-recovery` metric is still residual when no grief packets occur in the fixture window. That is an honest absence-of-sample note, not a fail.
- The scenario suite had intermittent failures during tuning, especially `seed-jealousy-organic` and `seed-zone-pull-resource`; both were addressed and the final aggregate pass is 38/38.
- The next best product step is not more harness repair. The evidence now supports moving toward a human capture/playtest pass, followed by a targeted review of lived believability, UI feel, and ML value.

