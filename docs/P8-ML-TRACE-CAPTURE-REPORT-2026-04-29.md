# P8 ML Trace Capture Report - 2026-04-29

## Scope

P8 adds a default-on, runtime-only outcome window to ML decision history so future training/export work can learn from what happened after a choice.

No save schema, spatial math, projection, ability radius, render mode, or durable life-sim ownership changed.

```text
P8 trace shape
|- decision history entry
|  |- atFrame / outcomeDueFrame
|  |- chosen action / target / signal / risk / battle labels
|  `- outcomeWindow -> filled lazily after 60 frames
|
|- outcomeWindow
|  |- zoneId
|  |- boardPos u/v/h
|  |- alive + current state
|  |- object focus / affordance / carried object type
|  |- social context + dominant drive/emotion samples
|  `- movement: zone changed / travel active / wander scale
|
`- cost guard
   |- no durable save
   |- no action-choice ownership
   |- no feature rebuild
   `- nextOutcomeDueFrame skips scans until a window is due
```

## Files Changed

- `systems/mlInferenceSystem.js`
  - Adds `outcomeWindow` capture behind `gameConfig.ml.traceCapture.outcomeWindow !== false`.
  - Adds `updatedAtFrame`, `zoneId`, and `boardPos` to active traces.
  - Adds `nextOutcomeDueFrame` so the fill path stays lazy instead of scanning every frame.
  - Adds `outcomeWindowCount` to ML runtime telemetry samples.
- `scripts/build-c2-trace-corpus.js`
  - Includes `activeTrace` and `decisionHistory` in corpus digests.
  - Reports `outcomeWindowRecordCount` and `outcomeWindowEntryCount`.
  - Advances curated garden scenarios long enough to export filled outcome windows.
- `scripts/run-ml-trace-capture-audit.js`
  - New focused P8 proof.

## Proofs

```text
syntax
|- node --check systems/mlInferenceSystem.js                         -> pass
|- node --check scripts/build-c2-trace-corpus.js                     -> pass
`- node --check scripts/run-ml-trace-capture-audit.js                -> pass

focused P8 audit
`- node scripts/run-ml-trace-capture-audit.js                        -> pass
   |- report -> qa_screenshots/ml_trace_capture_audit/2026-04-29T06-58-46-319Z/report.json
   |- 1200-frame focused garden: 63 due / 63 populated
   |- populated ratio: 1.0
   |- decision history limit: 6, preserved
   |- ML cadence config: 48 frames x 3.5ms, unchanged
   |- rollback flag disables capture
   `- page errors / console errors: 0 / 0

corpus export
`- node scripts/build-c2-trace-corpus.js                            -> pass
   |- output -> qa_screenshots/c2_trace_corpus/2026-04-29T06-59-03-460Z
   |- records: 4
   |- outcome-window records: 3
   |- outcome-window entries: 11
   `- rebuildCheck.matches: true

behavior / runtime audits
|- node scripts/run-n6-neural-social-scoring-audit.js                -> pass
|  `- output -> qa_screenshots/n6_neural_social_scoring_audit/2026-04-29T07-02-40-837Z
`- node scripts/run-runtime-self-audit.js                            -> pass
   `- output -> qa_screenshots/runtime_self_audit/report.json
```

## Bench Evidence

Fresh composed lanes were captured under:

- `qa_logs/bench/p8-ml-trace-capture`
- `qa_logs/bench/p8-ml-trace-capture-final`

Final sim-board reruns after lazy `nextOutcomeDueFrame` optimization:

| Lane | Avg Update | Avg Render | ML Avg | Digest |
| --- | ---: | ---: | ---: | --- |
| `single-zone-122-sim-board` | 33.76ms | 48.23ms | 1.69ms | `qa_logs/bench/p8-ml-trace-capture-final/single-zone-122-sim-board-2026-04-29T07-01-28-829Z.json` |
| `single-zone-200-sim-board` | 89.03ms | 65.95ms | 4.74ms | `qa_logs/bench/p8-ml-trace-capture-final/single-zone-200-sim-board-2026-04-29T06-59-42-578Z.json` |

Read: P8 does not alter render code. The high-density render and tail numbers remain noisy stress evidence from the promoted sim-board path, not a new trace-capture behavior change. The ML cadence budget values remain unchanged, and the fill path is now lazy.

## Rollback

Set:

```js
gameConfig.ml.traceCapture = {
  ...(gameConfig.ml.traceCapture || {}),
  outcomeWindow: false
};
```

Existing history entries will remain bounded by `decisionHistoryLimit`; no save migration or cleanup is required.
