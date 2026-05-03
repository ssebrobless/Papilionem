# G0H Evidence Lock

Date: 2026-05-02  
Phase: AA2, after AA1 persistent cognition subscriber  
Branch: `codex/milestone-freeze-playtest`  

## Locked Run

Command:

```bash
node scripts/run-g0h-scripted-playthrough.js
```

Result: pass, 13/13 lanes.

Report:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T20-48-18-612Z\report.json`

Capture:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T20-48-18-612Z\capture\capture.json`

Summary:

`C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-02T20-48-18-612Z\capture\summary.txt`

## Cognition Accumulator Digest

```json
{
  "accumulatedCognitionCount": 32,
  "eventCounts": {
    "bereavementDeath": 1,
    "bereavementLongAbsence": 5,
    "witnessedAffection": 7,
    "loyaltyChoice": 1,
    "prideBattleWin": 1,
    "prideCaregivingSuccess": 2,
    "shameAbandonedAlly": 3,
    "shameWarningIgnoredHarm": 2
  },
  "memoryCounts": {
    "bereavementDeath": 1,
    "bereavementLongAbsence": 1,
    "witnessedAffection": 2,
    "loyaltyChoice": 1,
    "prideAnchor": 1,
    "shameAnchor": 1
  },
  "evidenceFidelityNotes": []
}
```

AA1 specifically closed the previous G0H contradiction: `witnessedAffection` now has event evidence and durable memory evidence in the same run. The subscriber attached successfully, dropped 0 page-side cognition events, flushed throughout the run, and detached at the final runtime-summary boundary.

## Runtime Digest

The locked run reported no page errors, no console errors, and no runtime errors. The only runtime issues were warnings.

```json
{
  "pressureTier": "hot",
  "densityTier": "normal",
  "stutterTier": "hot",
  "cacheTier": "warm"
}
```

## Status

This document locks the first honest-green 13/13 G0H run after the AA1 persistent cognition subscriber. AA3 and later phases should use this packet as the current G0H reference unless a newer explicitly locked packet supersedes it.

## AA2 Audit Suite Notes

AA2 ran the Section 7 audit suite after the lock. Current correctness lanes stayed green:

- `run-runtime-self-audit.js`: pass
- `run-h5-long-running-save-smoothness-audit.js`: pass
- `run-r2-zone-transition-audit.js`: pass
- `run-r-block-cell-discipline-audit.js`: pass
- `run-n8-social-save-continuity-audit.js`: pass
- `run-f1-session-capture-audit.js`: pass
- `run-ability-radius-conversion-audit.js`: pass
- `run-single-player-autobattle-audit.js`: pass
- `run-r-feed-thread-audit.js`: pass
- `run-r-flower-lifecycle-audit.js`: pass
- `run-r-cooperation-pressure-audit.js`: pass
- `run-r-altitude-probe.js`: pass
- `run-r-spatial-cleanup-audit.js`: pass
- `run-r4-ui-readability-audit.js`: pass
- `run-r-ui-parity-audit.js`: pass
- `run-r-hover-scroll-audit.js`: pass
- `run-r-sprite-fidelity-audit.js`: pass
- `run-r5-sprite-fidelity-audit.js`: pass
- `run-r-cognition-trigger-coverage-audit.js`: pass
- `run-scenario.js --all`: pass, 23/23
- `run-r6-communication-audit.js`: pass on rerun at `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\r6_communication_audit\2026-05-02T21-19-50-080Z\report.json`

Expected future-phase signals:

- `run-ml-closure-audit.js`: fail at `02-runtime-budget-proof`; this is the known AA3 target, not caused by AA1.
- `run-ml-phase-m4-audit.js`: warn; this is the known m4 corpus/evaluation weakness for AA4-AA5.
- `run-ml-on-off-capture-audit.js`: pass structurally at `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\ml_on_off_capture_audit\2026-05-02T21-18-18-660Z\report.json`.
