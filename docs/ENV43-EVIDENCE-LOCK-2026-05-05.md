# ENV43 Evidence Lock - Migration Intent Diagnostics

Date: 2026-05-05

## Scope

ENV43 added reason-level diagnostics to the ML on/off value audit. This phase is measurement-only. It does not change game behavior, model weights, save schema, spatial math, cognition vocabulary, UI, or player saves.

## Files Changed

- `scripts/run-ml-on-off-capture-audit.js`

## What Changed

The value audit now records migration target reasons:

- `migrationIntentCounts`
- `migrationAffordanceCounts`
- per-entity migration intent counts
- per-entity affordance-pull counts

This separates:

1. `lifeSimSystem` migration derivation (`travelIntent`)
2. `behaviorSystem` affordance migration (`affordancePull`)
3. active zone-travel overrides

## Proofs

Syntax check:

`node --check scripts/run-ml-on-off-capture-audit.js`

- Result: pass

Repeated fixture value audit:

`qa_screenshots/ml_on_off_capture_audit/2026-05-05T07-18-32-049Z/report.json`

- Overall: `pass`
- Repeat count: `2`
- Fixture: `seed-ml-value-top-edge-organic`
- Browser clean: pass

## Aggregate Read

| Metric | Pass rate | ML-on mean | ML-off mean | Ratio mean |
| --- | ---: | ---: | ---: | ---: |
| per-policy-disagreement-rate | 2/2 | 0.8576 | n/a | n/a |
| edge-delta-churn-per-minute | 1/2 | 7.1101 | 5.9002 | 1.2011 |
| migration-target-shannon-entropy | 0/2 | 1.7740 | 1.7506 | 1.0131 |
| target-acquisition-latency | 2/2 | 122.5 | 944.165 | 0.1587 |
| top-15-percent-top-edge-fraction | 1/2 | 0.1634 | 0.1605 | n/a |
| near-target-jitter-ratio | 1/2 | 0.0146 | 0.0146 | 0.7043 |

## Intent Findings

Run 1:

| Scenario | Targets | Dominant intents | Affordance-pull read |
| --- | --- | --- | --- |
| ML on | ivy `2496`, moss `1712`, pool `1321`, sun `231` | statusPerformance `1628`, companionship `1549`, return-home `1225`, scouting `855` | none `4843/5760` |
| ML off | ivy `2369`, moss `1881`, pool `1257`, sun `253` | statusPerformance `1474`, scouting `1454`, companionship `1396`, return-home `1102` | none `4886/5760` |

Run 2:

| Scenario | Targets | Dominant intents | Affordance-pull read |
| --- | --- | --- | --- |
| ML on | ivy `2011`, moss `1903`, pool `1427`, sun `419` | scouting `1537`, statusPerformance `1517`, companionship `1456`, return-home `758` | none `4979/5760` |
| ML off | moss `1903`, ivy `1864`, pool `1750`, sun `243` | companionship `1652`, statusPerformance `1624`, scouting `1112`, return-home `1049` | none `5172/5760` |

## Honest Read

The migration entropy gap is not primarily coming from `behaviorSystem` affordance migration. The affordance path is present but a minority signal in these runs. Most target pressure comes from `lifeSimSystem` migration derivation and social/lifecycle intents:

- scouting
- companionship
- return-home
- mate-seeking
- statusPerformance

This is good news for architecture: ML is not secretly owning durable migration truth. But it means improving migration diversity should happen by tuning life-sim migration scoring and/or adding clearer diversity pressure to migration derivation, not by blindly retraining the model.

Recommended next phase:

Add a small, bounded migration-diversity pressure inside the life-sim migration derivation so repeated target choices are nudged toward less-recent zones when the social/drive scores are otherwise close. Keep it additive, traceable, and owned by lifeSim; ML remains a scorer/consumer.

