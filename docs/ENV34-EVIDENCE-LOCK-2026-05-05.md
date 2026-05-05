# ENV34 Evidence Lock - m8 Candidate Sweep

Date: 2026-05-05

## Scope

ENV34 reran the garden-policy candidate sweep after the ENV32/ENV33 corpus-label repairs. The purpose was to verify whether a new protected garden policy could outperform the prior m4 default without relying on ambiguous labels or polluted autobattle records.

No game behavior was changed in this phase.

## Inputs

- Corpus builder: `scripts/build-c2-trace-corpus.js`
- Candidate sweep: `scripts/sweep-m8-garden-policy.js --quick`
- Formal audit: `scripts/run-ml-phase-m7-audit.js --policy <candidate>`
- Candidate artifact selected:
  `qa_screenshots/m8_policy_sweep/2026-05-05T06-02-50-087Z/candidates/protected-slower.json`

## Sweep Result

Report:

`qa_screenshots/m8_policy_sweep/2026-05-05T06-02-50-087Z/report.json`

Verdict:

- Overall: `pass`
- Recommendation: `promote-after-formal-audit`
- Best candidate: `protected-slower`
- Corpus records: `229`
- Corrected records: `117`
- Corrected policy labels: `232`
- Rebuild check: `pass`

Held-out policy means for the selected candidate:

| Policy | Candidate | Heuristic | m4 |
| --- | ---: | ---: | ---: |
| actionFamily | 0.821 | 0.021 | 0.158 |
| targetPreference | 0.964 | 0.387 | 0.491 |
| signalChoice | 0.817 | 0.410 | 0.317 |
| riskPosture | 1.000 | 0.000 | 0.000 |
| autobattlePosture | 0.849 | 0.782 | 0.782 |

The selected candidate had no held-out regression policy count and beat both the heuristic and m4 on the repaired supervised artifact gate.

## Formal Candidate Audit

Initial formal audit exposed an audit harness problem: phase 04 of `scripts/run-ml-phase-m7-audit.js` still expected the older hard-coded `m7-garden-policy-v1` runtime id. The audit was corrected to compare against the selected artifact's own `modelVersionId`.

Passing formal audit:

`qa_screenshots/ml_phase_m7_audit/2026-05-05T06-10-48-425Z/report.json`

Verdict:

- Overall: `pass`
- Candidate model id: `m8-garden-policy-protected-slower`

## Honest Read

ENV34 proves that the repaired corpus can train a substantially stronger supervised garden/autobattle policy candidate. It does not by itself prove lived-society value. Lived value remains a separate gate measured by the ML on/off audit after promotion.

