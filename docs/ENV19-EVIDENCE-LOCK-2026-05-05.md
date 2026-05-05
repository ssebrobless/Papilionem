# ENV19 Evidence Lock - Grief Reunion Recovery Scenario

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

Add a deterministic organic scenario that proves long-absence grief can recover
when the missing partner returns. ENV18 made the long-soak metric honest by
marking "no recovery opportunity" as residual; ENV19 adds the missing proof
where the opportunity actually happens.

No gameplay behavior changed in this phase.

## Shape

```
bonded pair together
      |
      v
partner leaves for > 300s
      |
      v
long-absence bereavement packet forms
      |
      v
partner returns to same zone
      |
      v
reunion frame recorded
      |
      v
next cognition tick decays packet intensity below 0.05
```

## Change

- Added `scripts/scenario/scenarios/seed-grief-reunion-recovery-organic.json`.
- Scenario flow:
  - two bonded butterflies start together in `moss-hollow`
  - partner `b` moves to `pool-heart`
  - cognition advances long enough to create a long-absence bereavement packet
  - partner `b` returns to `moss-hollow`
  - one short cognition tick records the reunion
  - one follow-up cognition tick performs recovery decay
- Acceptance:
  - `a` still has the long-absence bereavement packet for `b`
  - packet intensity is `<= 0.05` after reunion recovery

## Proofs

| Proof | Result | Report |
|---|---:|---|
| `node scripts/run-scenario.js seed-grief-reunion-recovery-organic` | pass | `qa_screenshots/scenario/seed-grief-reunion-recovery-organic/2026-05-05T02-47-18-763Z/report.json` |
| `node scripts/run-scenario.js --all` | pass, 39/39 | starts at `qa_screenshots/scenario/seed-affection/2026-05-05T02-47-32-466Z/report.json`; new scenario report `qa_screenshots/scenario/seed-grief-reunion-recovery-organic/2026-05-05T02-50-32-248Z/report.json` |

## Honest Residual

A concurrent long-soak run after this scenario addition returned
`pass-with-society-warnings`:

`qa_logs/long_soak_society/2026-05-05T02-47-25-761Z/report.json`

Warnings were bond stability (`0.312`, expected `<= 0.30`) and bond churn
(`2.83/min`, expected `<= 2.0/min`). Grief recovery itself was correctly marked
as residual because no recovery opportunity occurred in that particular
long-soak.

The previous repeat long-soak after ENV18 passed cleanly at:

`qa_logs/long_soak_society/2026-05-05T02-43-02-690Z/report.json`

This suggests the society soak is still somewhat stochastic around bond churn /
stability. That is a better next residual than grief recovery.
