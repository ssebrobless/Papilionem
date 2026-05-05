# ENV18 Evidence Lock - Grief Recovery Measurement Honesty

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

Fix a false-red society metric in the long-soak audit. A bereavement packet can
exist before any actual recovery opportunity occurs. The old metric treated that
stable packet intensity as failed recovery, even when no reunion or active
short-window decay had happened yet.

No gameplay behavior changed in this phase.

## Shape

```
bereavement packet exists
        │
        ├── no reunion / no active recovery window
        │       └── residual: real grief exists, recovery not yet evaluable
        │
        └── reunion or active decay window
                └── evaluate packet intensity slope
```

## Change

- `scripts/g0h/societyMetrics.js`
  - `computeGriefRecovery()` now evaluates decay only for packets with a real
    recovery opportunity:
    - `reunionAtFrame` exists, or
    - a short active recovery decay window is present, or
    - sampled packet intensity actually decreases.
  - Packets without recovery opportunity are reported in `skippedPackets` with
    reason `no-reunion-or-active-recovery-window`.
  - The `grief-recovery` check now reports diagnostics:
    - `packetCount`
    - `recoveryOpportunityCount`
    - `skippedPacketCount`
    - `sourcePath`

## Proofs

| Proof | Result | Report |
|---|---:|---|
| `node --check scripts/g0h/societyMetrics.js` | pass | n/a |
| `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison` | pass-with-society-warnings | `qa_logs/long_soak_society/2026-05-05T02-41-30-191Z/report.json` |
| repeat of same long-soak command | pass | `qa_logs/long_soak_society/2026-05-05T02-43-02-690Z/report.json` |
| `node scripts/run-scenario.js seed-society-soak-organic` | pass | `qa_screenshots/scenario/seed-society-soak-organic/2026-05-05T02-44-46-661Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |

## Result

The first run after the metric change still had one society warning, but it was
bond churn running hot (`2.83/min`), not grief recovery. A repeat run passed all
long-soak checks:

- grief recovery observed: `null`
- grief recovery residual: `true`
- reason: no grief recovery opportunity occurred during the sampled window
- witnessed affection: `0.667/min`
- cleanup gradient: `0`
- zone entropy: `0.897`, mean distinct zones visited `2.571`
- bond churn: `2.0/min`

## Honest Residual

This does not prove butterflies recover from grief organically. It proves the
long-soak metric no longer claims recovery failed when recovery was never
triggered. A later phase should add a deterministic reunion-after-long-absence
society fixture that makes recovery opportunity happen and then checks the
actual decay slope.

