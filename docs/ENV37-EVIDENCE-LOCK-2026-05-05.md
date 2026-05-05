# ENV37 Evidence Lock - ML Lived-Value Gap Diagnostics

Date: 2026-05-05

## Scope

ENV37 added diagnostic detail to the ML on/off value audit. This phase is measurement-only. It does not change game behavior, model weights, save schema, spatial logic, cognition vocabulary, or UI.

The goal was to explain the remaining lived-value failures after m8 promotion rather than blindly tune behavior.

## Files Changed

- `scripts/run-ml-on-off-capture-audit.js`

## New Diagnostic Fields

The value report now includes:

- `valueMetrics.diagnostics.mlOn.topEdgeOffenders`
- `valueMetrics.diagnostics.mlOff.topEdgeOffenders`
- `valueMetrics.diagnostics.mlOn.slowTargetAcquirers`
- `valueMetrics.diagnostics.mlOff.slowTargetAcquirers`
- `valueMetrics.diagnostics.*.zoneTopEdgeFractions`
- `valueMetrics.diagnostics.*.migrationTargetCounts`
- `valueMetrics.diagnostics.*.migrationTargetSourceCounts`
- `valueMetrics.diagnostics.*.meanDistinctZonesPerEntity`
- per-entity `zoneSamples`, `zoneTopSamples`, `migrationTargetCounts`, `migrationTargetSourceCounts`, `targetChangeCount`, and acquisition averages

## Proofs

Syntax check:

`node --check scripts/run-ml-on-off-capture-audit.js`

- Result: pass

Diagnostic ML on/off value audit:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T06-33-15-586Z/report.json`

- Overall: `pass`
- Policy artifact path: `assets/ml/m8-garden-policy.json`
- ML-on model id: `m8-garden-policy-protected-slower`
- Value metrics meeting threshold in this run: `3/6`

## Run Metrics

| Metric | Result |
| --- | --- |
| per-policy-disagreement-rate | Pass: `0.8982 >= 0.1` |
| edge-delta-churn-per-minute | Pass: ML `7.8481` vs off `6.6162`, ratio `1.186 >= 1.15` |
| migration-target-shannon-entropy | Fail: ML `1.9494` vs off `1.9144`, ratio `1.018 < 1.1` |
| target-acquisition-latency | Fail: ML `113.08` vs off `33.33`, ratio `3.393 > 1.2` |
| top-15-percent-top-edge-fraction | Fail: ML `0.2260 > 0.15` |
| near-target-jitter-ratio | Pass: ML `0.0007` vs off `0.0008`, ratio `0.875 <= 0.9` |

## Key Findings

Top-edge clustering is not evenly distributed across the board. It is dominated by `moss-hollow`:

| Scenario | Zone | Top-edge fraction |
| --- | --- | ---: |
| ML on | moss-hollow | `0.9398` |
| ML on | ivy-cloister | `0.0204` |
| ML on | pool-heart | `0.0091` |
| ML on | sun-court | `0` |
| ML off | moss-hollow | `0.9771` |
| ML off | pool-heart | `0.1012` |
| ML off | ivy-cloister | `0.0009` |
| ML off | sun-court | `0` |

The strongest ML-on top-edge offenders were two entities spending almost the whole run in moss-hollow's top band:

- `butterfly_1777962799429_14`: top-edge fraction `0.9729`, moss-hollow samples `467/480`
- `butterfly_1777962799428_6`: top-edge fraction `0.9479`, moss-hollow samples `455/480`
- `butterfly_1777962799428_8`: top-edge fraction `0.3583`, moss-hollow samples `172/480`

Migration target source was also uniform:

- ML on: `derived.travelTargetZoneId` for `5760/5760` movement samples
- ML off: `derived.travelTargetZoneId` for `5760/5760` movement samples

That means the remaining migration/top-edge symptoms are probably not coming from mixed legacy target sources. They are more likely coming from the migration derivation itself, zone geometry, target selection, or the reward/label pressure that makes m8 prefer those targets.

Mean distinct zones per entity:

- ML on: `3.0`
- ML off: `3.25`

## Honest Read

The post-m8 lived-value picture is better than m4 but still variable. The corrected ENV36 run hit `4/6`; this diagnostic run hit `3/6`. The stable wins are policy disagreement, edge churn, and jitter. The stable problem is top-edge occupancy. Migration entropy is close but below the threshold. Target acquisition can swing between pass and fail, which means it should be treated as unstable until the diagnostic is repeated under fixed fixtures or a deterministic value scenario.

Recommended next phase:

1. Add a deterministic ML value fixture that reproduces moss-hollow top-edge pressure and target acquisition instability.
2. Run m8 and fallback on that fixture.
3. Only then decide whether the fix belongs in migration derivation, target generation, training labels, or model weights.

