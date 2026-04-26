# V6 Worker Offload Audit

## Purpose

This audit records the first `v6` off-thread seam and freezes the honest
result before any broader worker rollout is attempted.

```text
v6 first cut
|- seam              -> stateless ML policy scoring worker
|- retained code     -> bootstrap + worker scripts + orchestrator hooks
|- retained default  -> off
|- fallback path     -> inline ML scoring on worker unavailable/error
`- honest state      -> groundwork landed, retained win not earned yet
```

## Live Runtime Shape

```text
flag
`- performance.flags.workerOffload
   |- off -> legacy inline ML scoring path
   `- on  -> worker bootstrap attempts stateless `ml.infer`
      |- host script      -> workers/offloadHost.js
      |- worker script    -> workers/mlOffloadWorker.js
      |- orchestrator     -> systems/mlInferenceSystem.js
      |- truth ownership  -> main thread still owns features, traces, runtime state, save state
      `- fallback         -> inline scoring or heuristic/last-valid reuse on sync gap/error
```

## Files

- `workers/offloadHost.js`
- `workers/mlOffloadWorker.js`
- `systems/mlInferenceSystem.js`
- `index.html`
- `docs/ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md`
- `docs/ACTIVE-COMPLETION-BOARD.md`

## Proof

```text
first candidate
|- baseline  -> qa_logs/session_captures/v5-retained-post-rollback/2026-04-24T18-16-31-541Z/
|- candidate -> qa_logs/session_captures/v6-worker-offload-candidate/2026-04-24T22-33-12-884Z/
`- diff      -> qa_logs/session_captures/v6-worker-offload-candidate/2026-04-24T22-33-12-884Z/diff-vs-v5-retained-post-rollback.md
```

```text
revised candidate
|- baseline  -> qa_logs/session_captures/v5-retained-post-rollback/2026-04-24T18-16-31-541Z/
|- candidate -> qa_logs/session_captures/v6-worker-offload-candidate-r2/2026-04-24T22-36-00-312Z/
`- diff      -> qa_logs/session_captures/v6-worker-offload-candidate-r2/2026-04-24T22-36-00-312Z/diff-vs-v5-retained-post-rollback.md
```

```text
batched/stateless candidate
|- baseline  -> qa_logs/session_captures/v5-retained-post-rollback/2026-04-24T18-16-31-541Z/
|- candidate -> qa_logs/session_captures/v6-worker-offload-batch-candidate/2026-04-24T22-57-34-470Z/
`- diff      -> qa_logs/session_captures/v6-worker-offload-batch-candidate/2026-04-24T22-57-34-470Z/diff-vs-v5-retained-post-rollback.md
```

```text
first candidate read
|- calm   -> 14.48 / 6.28  -> 15.14 / 6.47
|- shell  -> 15.54 / 9.84  -> 16.42 / 9.80
|- battle -> 26.74 / 18.45 -> 28.39 / 20.35
|- soak   -> 17.07 / 8.52  -> 17.87 / 9.41
`- read   -> clear regression; not retained
```

```text
revised candidate read
|- calm   -> 14.48 / 6.28  -> 15.35 / 6.48
|- shell  -> 15.54 / 9.84  -> 17.54 / 10.11
|- battle -> 26.74 / 18.45 -> 25.86 / 19.51
|- soak   -> 17.07 / 8.52  -> 17.33 / 8.56
|- heap   -> 159.26 -> 159.26 MB
`- read   -> one narrow battle render win, broader lived-in regression; still not retained
```

```text
ml runtime note from revised candidate
|- avgGardenUpdateMs -> 1.39
|- mlPolicyShare     -> 0.52
|- fallbackShare     -> 0.48
`- read              -> worker path is functioning, but current orchestration does not beat the retained v5 stack
```

```text
batched/stateless candidate read
|- calm   -> 14.48 / 6.28  -> 19.75 / 8.99
|- shell  -> 15.54 / 9.84  -> 22.33 / 8.78
|- battle -> 26.74 / 18.45 -> 37.05 / 28.40
|- soak   -> 17.07 / 8.52  -> 22.51 / 13.70
|- heap   -> 159.26 -> 159.26 MB
`- read   -> batch removed per-entity chatter, but still regressed every lived-in render lane; not retained
```

```text
batched runtime note
|- avgGardenUpdateMs -> 2.10
|- mlPolicyShare     -> 0.48
|- fallbackShare     -> 0.52
`- read              -> batch seam is working, but the current off-thread ML cut still does not beat the retained v5 stack
```

```text
deferred-trace candidate
|- control report   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-12-05-976Z/report.json
|- candidate report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-12-47-943Z/report.json
|- control capture  -> qa_logs/session_captures/2026-04-25T22-12-43-387Z-h5-long-running-save-capture-1777155132050/
`- candidate capture -> qa_logs/session_captures/2026-04-25T22-13-25-812Z-h5-long-running-save-capture-1777155174053/
```

```text
deferred-trace candidate read
|- seam   -> worker returns prebuilt model traces and the garden worker path defers unchanged cadence-only refreshes until the worker result lands
|- calm   -> 6.56 / 13.51 -> 6.70 / 13.53
|- shell  -> 10.81 / 13.26 -> 10.34 / 12.98
|- p95    -> 30.90 -> 30.80
|- heap   -> 168.80 -> 159.26 MB
|- trace churn -> avgRefreshedTraceCount 3.31 -> 2.86
|- ml share    -> 0.90 -> 0.78
`- read   -> mixed but better than earlier worker cuts; passes h5, lowers trace churn and heap, helps shell-heavy play, but calm is not clearly better and the seam is still not strong enough to promote
```

## Guardrail Read

```text
what held
|- worker path stayed stateless
|- save truth stayed on the main thread
|- no durable relationship/memory/emotion state moved off-thread
|- fallback path stayed available
|- same-code h5 control and candidate both passed on the lived-in save
`- flag stayed default-off
```

```text
what is not earned
|- no v6 default-on flip
|- no runtime board promotion from this seam alone
|- no claim that worker offload solved the remaining blocker
`- no claim that the deferred trace cut beats the live stack strongly enough to freeze c5 closed
```

## Honest Phase State

```text
v6 today
|- groundwork        -> live behind default-off code
|- best retained cut -> deferred model-trace worker return + unchanged-cadence garden refresh deferral
|- retained outcome  -> improved groundwork only; still not promoted
|- next safe move
|  |- do not promote the current ML-offload cuts as a live runtime win
|  |- keep the stronger deferred-trace cut only as default-off groundwork unless a later same-code proof turns it into a clear gain
|  `- if v6 stays mixed, carry the frozen live runtime stack into v7 instead of inventing a worker victory
`- current blocker   -> the deferred trace cut is safer and lighter than the older worker seams, but lived-in calm still does not improve enough to close c5 honestly
```
