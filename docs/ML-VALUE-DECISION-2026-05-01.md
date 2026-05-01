# ML Value Decision - 2026-05-01

## Verdict

W6 did not prove that the current static ML policy improves lived play enough to call it a win. The cadence experiment showed that running ML less often can reduce some bad movement side effects, so the game now ships `gameConfig.ml.cadenceFactor = 2` as a conservative default. The rollback is `cadenceFactor = 1`.

Corpus growth landed: `scripts/build-c2-trace-corpus.js` now adds eight W2 lived-loop scenario-derived records, growing the C2 corpus from 4 records to 12 while preserving the existing corpus format. There is no standalone retraining pipeline in this repo, so no policy artifact was rewritten in W6. The M4 artifact evaluation over the expanded corpus reports `warn`: the static artifact underperforms the heuristic labels on most policy families.

## Evidence Shape

```text
W6 evidence
├─ cadence factor audit
│  ├─ factor 1: 1/6 value metrics pass
│  ├─ factor 2: 1/6 value metrics pass
│  └─ factor 4: 3/6 value metrics pass
├─ corpus growth
│  ├─ old builder: 4 curated records
│  └─ new builder: 12 records, including 8 lived-loop scenario traces
└─ static artifact evaluation
   └─ expanded-corpus M4 audit: warn, artifact 38/56 vs heuristic 55/56
```

## Cadence Audit Results

| cadenceFactor | metrics passing | report |
|---:|---:|---|
| 1 | 1 / 6 | `qa_screenshots/ml_on_off_capture_audit/2026-05-01T00-35-39-270Z/report.json` |
| 2 | 1 / 6 | `qa_screenshots/ml_on_off_capture_audit/2026-05-01T00-41-51-193Z/report.json` |
| 4 | 3 / 6 | `qa_screenshots/ml_on_off_capture_audit/2026-05-01T00-36-27-738Z/report.json` |

Factor 4 improved edge churn, migration entropy, and top-edge fraction, but still failed motive distinctness, target acquisition latency, and jitter. Factor 2 is a softer product default, not a full ML success claim.

## Corpus Growth Results

Direct builder run:
- `qa_screenshots/c2_trace_corpus/2026-05-01T00-45-33-903Z/corpus-manifest.json`
- `qa_screenshots/c2_trace_corpus/2026-05-01T00-45-33-903Z/corpus-records.json`

Expanded corpus:
- `recordCount`: 12
- `scenarioCount`: 12
- `scenarioFamilies`: `autobattle`, `communication`, `ecology`, `garden`, `lived-loop`
- `scenarioPresetVersion`: `c2-audit-scenarios-v2-lived-loop`
- `rebuildCheck.matches`: true

The new lived-loop sources are:
- `seed-bond-progression-organic`
- `seed-cleanup-floor-organic`
- `seed-cooperation-organic-floor`
- `seed-grief-long-absence-organic`
- `seed-grief-organic`
- `seed-loneliness-organic`
- `seed-loyalty-organic`
- `seed-shame-organic`

## Static Artifact Evaluation

M4 report:
- `qa_screenshots/ml_phase_m4_audit/2026-05-01T00-46-47-962Z/report.json`
- `qa_screenshots/ml_phase_m4_audit/2026-05-01T00-46-47-962Z/artifact-evaluation.json`

Result:
- `overall`: warn
- `expanded corpus`: 12 records
- `artifactTotalMatches`: 38 / 56
- `heuristicTotalMatches`: 55 / 56
- `traceAlignmentCount`: 56 / 56
- `thresholdPass`: false

Per-policy artifact match rates:
- `actionFamily`: 0.909
- `targetPreference`: 0.545
- `signalChoice`: 0.545
- `riskPosture`: 1.000
- `autobattlePosture`: 0.417

Interpretation: the current artifact is aligned with its own active traces, but the expanded corpus shows it is not better than heuristic behavior. The next honest ML step is a real trainer / policy update path, not more runtime tuning.

## Product Decision

Ship for now:
- Keep static policy available.
- Use `gameConfig.ml.cadenceFactor = 2` by default.
- Keep ML as a read-only scorer; lifeSim/communication remain owners of durable feelings, memories, bonds, and social truth.

Do not claim yet:
- Do not claim ML materially improves lived play.
- Do not claim the current policy is better than the heuristic.
- Do not promote G0 on ML value alone.

Recommended next ML work:
1. Build or import a real linear-policy training script that consumes `corpus-records.json`.
2. Train a replacement `m4-garden-policy` candidate from the expanded lived-loop corpus.
3. Run M4 artifact evaluation and the value-band audit again at factors 1, 2, and 4.
4. Promote only if the artifact beats heuristic labels in M4 and improves at least 3 / 6 lived-play value metrics at the shipped cadence.
