# Social Surfacing Proof Audit

```text
n7 status
├─ inspect social lens            -> live
├─ feed threaded social footer    -> live
├─ debug ML/social bridge         -> live
└─ next phase                     -> n8 active
```

## What Landed

```text
presentation-only surfacing
├─ inspect now caches a reusable presentation snapshot
│  ├─ texture + carry-over
│  ├─ society + rhythm
│  ├─ local field
│  └─ ML/social why-summary
├─ feed talk threads now show concise lived-context footers
│  ├─ pair texture
│  ├─ visible local situation
│  └─ turn count
└─ debug explainability now exposes
   ├─ social tone
   ├─ pair carry-over
   └─ local signal field
```

Rule held:
- `ui/gameUI.js` and `ui/debugUI.js` only render life-sim / communication / ML summaries
- no durable social truth moved into UI-owned state
- the new presentation snapshot is the bridge current canvas panels use now and runtime `v1` DOM panels can reuse later

## Proof

Primary proof:
- `qa_screenshots/n7_social_surfacing_audit/2026-04-22T08-18-25-219Z/report.json`

Regression support:
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T08-18-25-233Z/report.json`
- `qa_screenshots/r6_communication_audit/2026-04-22T08-19-21-740Z/report.json`
- `qa_screenshots/r4_ui_readability_audit/2026-04-22T08-18-25-279Z/report.json`

## Closure

```text
n7 closed because
├─ richer social depth is now readable in normal play
├─ the proof lane checks inspect / feed / debug directly
└─ the UI still does not own relationship, memory, or emotion truth
```

Next pressure:
- preserve long-running social continuity and freeze widened durable state under `n8`
