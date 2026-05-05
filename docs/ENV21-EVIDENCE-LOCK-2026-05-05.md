# ENV21 Evidence Lock - Mature Bond Stability Diagnostics

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

Split social stability measurement into early-edge noise, mature relationship
stability, and directional churn. This keeps the long-soak report honest while
making it clearer whether warnings reflect believable bond formation or actual
destructive instability.

No game behavior changed in this phase.

## Shape

```
relationship samples
      |
      +-- all edges -----------------------> all-edge stability
      |
      +-- familiar+ edges -----------------> mature-edge stability
      |
      +-- tier transitions ----------------> growth / regression / lateral
                                             |
                                             v
                                      oscillation diagnostics
```

## Change

- `scripts/g0h/societyMetrics.js`
  - `bondStability` now reports:
    - `maturePairCount`
    - `matureStdevMeanRatio`
    - `topMatureVolatilePairs`
  - `bondChurn` now reports transition direction:
    - growth: higher bond tier
    - regression: lower bond tier
    - lateral: unchanged rank
  - Top churn pair diagnostics now include growth/regression/lateral counts
    and `hasOscillation`.

Existing pass thresholds are unchanged. The original all-edge stability and
primary churn checks still gate the audit.

## Proofs

| Proof | Result | Report |
|---|---:|---|
| `node --check scripts/g0h/societyMetrics.js` | pass | terminal |
| `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison` | pass | `qa_logs/long_soak_society/2026-05-05T03-14-42-007Z/report.json` |

## Findings From The Proof Run

- all-edge stability: `0.2318`
- mature-edge stability: `0.1601`
- mature pair count: `16`
- primary churn: `0.6667/min`
- relationship-arc growth: `0.6667/min`
- relationship-arc regression: `0/min`
- witnessed affection: `0.5/min`
- mean distinct zones visited: `2.31`

Interpretation: this run's churn was relationship growth, not destructive
oscillation. The mature-edge stability number is calmer than all-edge
stability, which supports ENV20's suspicion that weak near-zero acquaintance
edges can exaggerate volatility.

## Next Residual

The next useful phase is a behavior-facing one: increase environmental task
pressure and cooperation opportunities without scripting outcomes. The current
society can form bonds and communicate, but it still needs more everyday
reasons to coordinate: pollen planting, pollen handoff, flower occupancy, dirt
pile occupancy, and shade/shelter utility are the most natural next candidates.
