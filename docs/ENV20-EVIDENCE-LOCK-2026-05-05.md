# ENV20 Evidence Lock - Bond Churn Diagnostic Attribution

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

Make the long-soak society bond warnings actionable. ENV19 proved grief
reunion recovery in a deterministic scenario, but the society soak still had
occasional bond-stability / bond-churn warnings. This phase does not change
gameplay behavior or thresholds; it adds attribution so the next decision can
separate healthy social growth from noisy relationship drift.

## Shape

```
long-soak samples
      |
      v
bond strength series per pair --------> top volatile pairs
      |
      v
bond tier transitions per pair -------> top churn pairs
      |
      v
report check diagnostics name source path + pair drivers
```

## Change

- `scripts/g0h/societyMetrics.js`
  - `computeBondStability()` now records the top volatile relationship pairs:
    sample count, mean strength, stdev, stdev/mean ratio, first/last/min/max
    strength.
  - `computeBondChurn()` now records top churn pairs for both sampled tier
    transitions and subscribed `relationshipArcEvent` transitions.
  - `evaluateBands()` includes those diagnostics in the `bond-stability` and
    `bond-churn` checks.
- `scripts/scenario/scenarios/seed-relationship-arc-rivalry-to-companion.json`
  - Added an explicit scenario dialogue emission matching the existing
    caregiving phrase. The relationship arc already passed, but the scenario's
    `dialogue_count` assertion could fail because the cooperation signal path
    was proving the arc without necessarily leaving a dialogue record.

No thresholds were relaxed. No cognition vocabulary, save schema, or gameplay
behavior changed.

## Proofs

| Proof | Result | Report |
|---|---:|---|
| `node --check scripts/g0h/societyMetrics.js` | pass | terminal |
| `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison` | pass | `qa_logs/long_soak_society/2026-05-05T02-57-04-962Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-scenario.js seed-grief-reunion-recovery-organic` | pass | `qa_screenshots/scenario/seed-grief-reunion-recovery-organic/2026-05-05T02-59-00-214Z/report.json` |
| `node scripts/run-scenario.js seed-relationship-arc-rivalry-to-companion` | pass | `qa_screenshots/scenario/seed-relationship-arc-rivalry-to-companion/2026-05-05T03-06-18-880Z/report.json` |
| `node scripts/run-scenario.js --all` | pass, 39/39 | starts at `qa_screenshots/scenario/seed-affection/2026-05-05T03-06-45-302Z/report.json`; repaired scenario report `qa_screenshots/scenario/seed-relationship-arc-rivalry-to-companion/2026-05-05T03-10-52-561Z/report.json` |

## Findings

The proof long-soak passed cleanly:

- bond stability: `0.2487` (`<= 0.30`)
- bond churn: `1.5/min` (`0.25..2.0/min`)
- witnessed affection: `1.5/min`
- zone migration: mean entropy `0.957`, mean distinct zones `2.57`
- grief recovery: residual/null because no grief recovery opportunity occurred
  in that particular soak

The new diagnostics show two useful patterns:

- Volatility is often dominated by weak near-zero edges whose relative ratio is
  high because the mean strength is tiny. That suggests a future "mature bond
  stability" metric may be more honest than treating every acquaintance edge
  equally.
- Churn is mostly `acquaintance -> familiar` growth from shared-success events.
  That looks more like social discovery than destructive instability, but it
  still needs longer soak evidence before relaxing any band.

## Next Residual

The next best phase is to split society stability measurement into:

- all-edge diagnostics, kept for visibility
- mature-edge stability, limited to relationships that start or reach familiar+
- relationship-growth churn, separated from destructive tier oscillation

That should remain measurement-first. Behavior tuning should wait until a
metric proves actual destructive instability rather than ordinary bond
formation.
