# B6 Evidence Lock - m7 Corpus / Trainer / Held-Out Gates

Date: 2026-05-03

Phase source: `docs/CLAUDE-POST-AA8-NEXT-BELIEVABILITY-PLAN-2026-05-02.md`, Section 5, B6.

## Result

```
╔════════════════════ B6 result ════════════════════╗
║ Corpus balance                          PASS      ║
║ m7 trainer                              PASS      ║
║ m7 artifact held-out gates              PASS      ║
║ m7 phase audit                          PASS      ║
║ m7 lived value promotion                FAIL      ║
╚════════════════════════════════════════════════════╝
```

B6 implementation is complete, but m7 is **not promoted**. This is an honest hold, not a broken build. The artifact gates succeeded; lived value gates did not.

## Files

- `scripts/build-c2-trace-corpus.js`
  - Added `--balance` support.
  - Adds explicitly tagged B6 synthetic corrected records only for underfilled target cells.
  - Exports `balanceTraceCorpusRecords()`.

- `scripts/train-m7-garden-policy.js`
  - New m7 trainer derived from m6.
  - Builds with balanced corpus.
  - Distills protected weak-policy families (`signalChoice`, `autobattlePosture`) toward heuristic labels unless curated corrections override.
  - Keeps m7 opt-in; m4 remains default.

- `scripts/run-ml-phase-m7-audit.js`
  - New m7 audit derived from m6.
  - Uses balanced corpus.
  - Gates on the B6 held-out artifact criteria and keeps full-corpus evaluation diagnostic.

- `assets/ml/m7-garden-policy.json`
  - New opt-in artifact.

- `docs/ML-PROMOTION-DECISION-2026-05-03.md`
  - Promotion decision: hold.

## Proofs

| Proof | Result | Path |
| --- | --- | --- |
| `node scripts/build-c2-trace-corpus.js --balance` | PASS | `qa_screenshots/c2_trace_corpus/2026-05-03T06-43-08-521Z/corpus-manifest.json` |
| `node scripts/train-m7-garden-policy.js` | PASS artifact gate | `qa_screenshots/m7_policy_training/2026-05-03T07-27-43-679Z/m7-training-evaluation.json` |
| `node scripts/run-ml-phase-m7-audit.js` | PASS | `qa_screenshots/ml_phase_m7_audit/2026-05-03T07-47-17-694Z/report.json` |
| `node scripts/run-ml-on-off-capture-audit.js --policy assets/ml/m7-garden-policy.json` | PASS measurement, FAIL promotion value | `qa_screenshots/ml_on_off_capture_audit/2026-05-03T07-49-55-637Z/report.json` |
| `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --policy m7` | WARN | `qa_logs/long_soak_society/2026-05-03T07-51-02-976Z/report.json` |

## Gate Details

Held-out artifact gate passed:

- `signalChoice`: m7 `0.958`, heuristic `0.786`, m4 `0.584`.
- `autobattlePosture`: m7 `0.902`, heuristic `0.849`, m4 `0.639`.
- m7 beat m4 on `4/5` policy families.

Promotion blocked by lived value:

- Value lanes: `2/6`, below required `>=4/6`.
- Migration entropy ratio: `1.046`, below `>=1.1`.
- Top-edge fraction: `0.3276`, above `<=0.15`.
- Long-soak partner repetition: `0.4891`, above `<=0.40`.
- Long-soak bond churn: `2.6667`, above `<=2.0`.

## Next Boundary

Do not proceed to B7 as if B6 produced a promotable default ML model. The safe next step is either:

1. A focused B6 follow-up for lived-value ML behavior, especially top-edge fraction, migration entropy, jitter, partner repetition, and bond churn.
2. Or B7 player-facing legibility with m4 still default and m7 treated as a research artifact.

The current implementation keeps the game stable by leaving m4 default.

