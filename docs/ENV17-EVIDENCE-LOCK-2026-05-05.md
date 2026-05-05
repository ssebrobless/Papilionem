# ENV17 Evidence Lock - Human-Directed Dialogue

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

Reduce the ordinary feed/dialogue tendency toward atmospheric or system-like language
(`air shifted`, `pressure shifted`, `grid`, `cell`, `covered-edge`) and make the
audit layer prove that conversation is relationship-directed or task-directed.

## Shape

```
╔════════════════════════════════════════════════════════════╗
║ ENV17: dialogue believability                             ║
╠══════════════════════╦═════════════════════════════════════╣
║ Production language  ║ communicationSystem templates      ║
║ Feed fixture language║ r-feed-thread fixture phrases      ║
║ Proof layer          ║ expression classifier + prod sample║
║ Regression hardening ║ R6 retained-lesson fixture timing  ║
╚══════════════════════╩═════════════════════════════════════╝
```

## Changes

- `systems/communicationSystem.js`
  - Replaced atmospheric wording in explain, reassure, warning, shared-observation,
    and reflective-reply templates with concrete social/task language.
  - Added a guard in `maybePrefixAddress()` so addressed phrases do not repeat a
    name already present at the front of the sentence.

- `scripts/run-r-expression-naturalness-audit.js`
  - Added a dialogue classifier:
    - `relationship-directed`
    - `task-directed`
    - `atmospheric`
    - `system-like`
  - Added acceptance gates:
    - human-directed share >= 70%
    - atmospheric share <= 15%
    - system-like dialogue count = 0
  - Added direct `composeDialoguePhrase()` production samples so seeded text cannot
    hide a production-template regression.

- `scripts/run-r-feed-thread-audit.js`
  - Replaced fixture phrases such as `near the grid`, `one cell`, and `hard edge`
    with player-readable social/task phrasing.
  - Added a system-like phrase guard over talk thread lines.

- `scripts/run-r6-communication-audit.js`
  - Hardened the retained-lesson fixture so it emits two deterministic teaching
    dialogues through communication-system public APIs instead of depending on
    ambient signal targeting and feed timing.

## Proofs

All paths are local to this checkout.

| Proof | Result | Report |
|---|---:|---|
| `node --check systems/communicationSystem.js` | pass | n/a |
| `node --check scripts/run-r-expression-naturalness-audit.js` | pass | n/a |
| `node --check scripts/run-r-feed-thread-audit.js` | pass | n/a |
| `node --check scripts/run-r6-communication-audit.js` | pass | n/a |
| `node scripts/run-r-expression-naturalness-audit.js` | pass | `qa_screenshots/r_expression_naturalness_audit/2026-05-05T02-12-05-202Z/report.json` |
| `node scripts/run-r-feed-thread-audit.js` | pass | `qa_screenshots/r_feed_thread_audit/2026-05-05T02-12-20-001Z/report.json` |
| `node scripts/run-r6-communication-audit.js` | pass | `qa_screenshots/r6_communication_audit/2026-05-05T02-37-42-134Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-g0h-scripted-playthrough.js` | pass, 13/13 | `qa_logs/g0h_scripted_playthrough/2026-05-05T02-23-51-532Z/report.json` |
| `node scripts/run-scenario.js --all` | pass, 38/38 | starts at `qa_screenshots/scenario/seed-affection/2026-05-05T02-31-23-684Z/report.json` |
| `node scripts/run-h5-long-running-save-smoothness-audit.js` | pass | `qa_screenshots/h5_long_running_save_smoothness_audit/2026-05-05T02-31-16-064Z/report.json` |
| `node scripts/run-n8-social-save-continuity-audit.js` | pass | `qa_screenshots/n8_social_save_continuity_audit/2026-05-05T02-31-16-063Z/report.json` |

## Dialogue Metrics From Final Expression Audit

- Seeded feed phrase classification:
  - human-directed share: `1.0`
  - atmospheric share: `0`
  - system-like count: `0`

- Production `composeDialoguePhrase()` sample classification:
  - human-directed share: `1.0`
  - atmospheric share: `0`
  - system-like count: `0`

Sample production lines:

- `easy now; the danger has passed for now; you can let your pace ease`
- `Iris, careful near the sunlit wall; that area does not look safe yet; let the danger show itself before you move`
- `this side feels calmer with you here; I noticed this place before we crossed the open grass; it feels better when we catch the same thing`
- `Kite, come this way; cross through this edge of the quiet ground; you will keep your shape better from here`

## Honest Residual

`node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
returned `pass-with-society-warnings` at:

`qa_logs/long_soak_society/2026-05-05T02-23-51-539Z/report.json`

The residual was `grief-recovery` with observed `0`. Other fixture assertions
passed, including witnessed-affection event subscription (`5` events),
hand-computed bond churn (`2`), cleanup gradient (`0`), and zone entropy
(`meanEntropy 0.586`, `meanDistinctZonesVisited 2.077`).

This residual is not a dialogue-template regression, but it should remain in the
next planning packet as a society-believability gap.

