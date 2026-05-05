# ENV59 Evidence Lock - Ecology Loop Pressure Measurement - 2026-05-05

## Shape

```text
╔══════════════════════╗    ╔══════════════════════╗    ╔══════════════════════╗
║ long-soak events     ║    ║ sampled world state  ║    ║ society metrics     ║
║ cleanup / compost    ║───▶║ piles / flowers /    ║───▶║ ecology-loop-       ║
║ pollen bloom         ║    ║ compost patches      ║    ║ pressure            ║
╚══════════════════════╝    ╚══════════════════════╝    ╚══════════════════════╝
          │                            │                            │
          ▼                            ▼                            ▼
 event-subscription path       sample-series path           honest pass/warning
```

## What Changed

- `scripts/run-long-soak-society-audit.js`
  - Adds an ecology event subscriber beside the existing cognition subscriber.
  - Captures cleanup, compost, pollen-planted, pollen-sprinkle, and pollen-bloom events.
  - Adds `compostPatchCount` to each sample.
  - Adds fixture action support for cleanup, pollen grant, pollen planning, pollen completion, and simulation stepping so ecology fixtures can be measured by long-soak tooling.
  - Surfaces `ecologySubscriber` in the report run summary.

- `scripts/g0h/societyMetrics.js`
  - Adds `computeEcologyLoopPressure()`.
  - Reports:
    - cleanup object events,
    - cleanup compost events,
    - compost-created rate,
    - compost-boosted sprinkle and bloom counts,
    - compost-aware pollen dialogue fraction,
    - max/mean compost patch count,
    - dirt-pile net delta,
    - flower net delta,
    - source-path metadata.
  - Adds a provisional `ecology-loop-pressure` check.

## Proofs

| Proof | Result | Report |
| --- | --- | --- |
| Syntax check | PASS | `node --check scripts/run-long-soak-society-audit.js`; `node --check scripts/g0h/societyMetrics.js` |
| Fast compost fixture long-soak | PASS-WITH-SOCIETY-WARNINGS | `qa_logs/long_soak_society/2026-05-05T12-37-25-976Z/report.json` |
| Six-minute compost fixture long-soak | PASS-WITH-SOCIETY-WARNINGS | `qa_logs/long_soak_society/2026-05-05T12-38-34-582Z/report.json` |

## Key Measurements

Fast fixture run:

- `ecology-loop-pressure`: PASS.
- `cleanupCompostCreatedEventCount`: 22.
- `compostBoostedBloomCount`: 1.
- `compostAwarePollenDialogueFraction`: 0.
- Residual/warning: zone migration entropy remained below stretch target.

Six-minute fixture run:

- `ecology-loop-pressure`: PASS.
- `cleanupCompostCreatedEventCount`: 24.
- `compostBoostedBloomCount`: 1.
- `cleanup-gradient`: PASS with observed `0`.
- Warnings:
  - `bond-churn`: observed `2.3333/min`, above provisional `2.0/min` ceiling.
  - `zone-migration-entropy`: mean entropy `0.3943`, mean distinct zones `1.9167`, below stretch target.

## Honest Read

ENV59 proves the measurement path, not full ecological success.

```text
proved:
  cleanup creates compost in long-soak evidence
  compost-boosted blooms are visible to the metric layer
  dirt-pile pressure can be measured beside social metrics

not yet proved:
  butterflies reliably talk about compost in long organic play
  compost changes cooperation rates without fixture setup
  compost improves zone recovery at society scale
  ecological work stabilizes bond churn rather than adding noise
```

The most important new finding is `compostAwarePollenDialogueFraction: 0` despite successful compost blooms. The behavior exists, but long-soak conversation did not surface it. The next best phase should improve and prove compost-aware dialogue selection during organic pollen work, ideally without forcing the phrase.
