# AA8 Human Capture Gate - 2026-05-02

## Verdict

AA1 through AA8 are implemented as an evidence slice. The current build is technically eligible for a human G0 capture, with explicit society-quality warnings from the long-soak audit.

This does not mean the game has reached "real AI" or a fully believable butterfly society. It means the harness now proves that the current systems are wired, observable, save-safe, spatially stable, and expressive enough to support the next human playtest without known technical blockers.

```
╔══════════════════════╗
║ Current Gate Shape   ║
╠══════════════════════╬════════════════════════════════════════════════════╗
║ Technical readiness  ║ PASS: G0H 13/13, runtime, UI, spatial, save,       ║
║                      ║ battle, flower lifecycle, scenarios green          ║
╠══════════════════════╬════════════════════════════════════════════════════╣
║ ML readiness         ║ HOLD: m4 remains default; m6 candidate exists but  ║
║                      ║ is not promoted                                    ║
╠══════════════════════╬════════════════════════════════════════════════════╣
║ Society believability║ WARNING: long-soak shows repetition, low migration ║
║                      ║ entropy, low witnessed affection, weak churn       ║
╠══════════════════════╬════════════════════════════════════════════════════╣
║ Human capture        ║ ALLOWED WITH WARNINGS: use capture to judge lived  ║
║                      ║ feel, not to declare 100% success                  ║
╚══════════════════════╩════════════════════════════════════════════════════╝
```

## Phase Status

| Phase | Status | Evidence |
| --- | --- | --- |
| AA1 persistent cognition subscriber | PASS | G0H now accumulates cognition events instead of sampling the eventBus ring. |
| AA2 G0H evidence lock | PASS | `docs/G0H-EVIDENCE-LOCK-2026-05-02.md` |
| AA3 ML closure stabilization | PASS | `qa_screenshots/ml_closure_audit/2026-05-02T22-23-54-534Z/report.json` |
| AA4 corpus growth + m6 trainer | PASS as research artifact | `assets/ml/m6-garden-policy.json`; scenario suite now has 32 scenarios. |
| AA5 m6 promotion decision | HOLD, correct | `docs/ML-PROMOTION-DECISION-2026-05-02.md`; m4 stays default. |
| AA6 expression layer | PASS | `qa_screenshots/r_expression_naturalness_audit/2026-05-02T23-08-25-482Z/report.json` |
| AA7 long-soak society audit | PASS-WITH-SOCIETY-WARNINGS | `qa_logs/long_soak_society/2026-05-02T22-50-53-345Z/report.json` |
| AA8 final gate | PASS-WITH-WARNINGS | This document. |

## Latest Proofs

| Proof | Result | Path / Notes |
| --- | --- | --- |
| G0H scripted playthrough | PASS, 13/13 lanes | `qa_logs/g0h_scripted_playthrough/2026-05-02T23-16-58-153Z/report.json` |
| G0H capture packet | PASS | `qa_logs/session_captures/2026-05-02T23-24-08-715Z-g0h-scripted-playthrough-capture-1777763827504` |
| Runtime self audit | PASS | `qa_screenshots/runtime_self_audit/report.json` |
| UI parity audit | PASS | `qa_screenshots/r_ui_parity_audit/2026-05-02T23-08-25-474Z/report.json` |
| UI readability audit | PASS | `qa_screenshots/r4_ui_readability_audit/2026-05-02T23-08-25-483Z/report.json` |
| Hover-scroll audit | PASS | `qa_screenshots/r_hover_scroll_audit/2026-05-02T23-07-58-031Z/report.json` |
| Expression naturalness audit | PASS | `qa_screenshots/r_expression_naturalness_audit/2026-05-02T23-08-25-482Z/report.json` |
| Scenario suite | PASS, 32/32 | Latest run completed 2026-05-02T23:13:45Z through 2026-05-02T23:16:54Z. |
| Block cell discipline | PASS | `qa_screenshots/r_block_cell_discipline_audit/2026-05-02T22-56-15-698Z/report.json` |
| Zone transition audit | PASS | `qa_screenshots/r2_zone_transition_audit/2026-05-02T22-56-15-682Z/report.json` |
| Social save continuity | PASS | `qa_screenshots/n8_social_save_continuity_audit/2026-05-02T22-56-54-219Z/report.json` |
| Session capture audit | PASS | `qa_screenshots/f1_session_capture_audit/2026-05-02T22-56-54-262Z/report.json` |
| Ability radius conversion | PASS | `qa_screenshots/ability_radius_conversion_audit/2026-05-02T22-56-54-263Z` |
| Single-player autobattle | PASS | `qa_screenshots/single_player_autobattle_audit/2026-05-02T22-56-54-277Z/report.json` |
| Flower lifecycle | PASS | `qa_screenshots/r_flower_lifecycle_audit/2026-05-02T22-57-23-484Z/report.json` |
| Cooperation pressure | PASS | `qa_screenshots/r_cooperation_pressure_audit/2026-05-02T22-57-23-501Z/report.json` |
| Cognition trigger coverage | PASS | `qa_logs/r_cognition_trigger_coverage/2026-05-02T22-57-23-451Z/report.json` |

Note: the final G0H shell command reached the local timeout during cleanup, but the run wrote a complete report, human review, screenshots, and capture packet. The report itself says `overall: pass`, `laneSummary: 13/13`, with zero page errors, zero console errors, and zero runtime errors.

## G0H Runtime Snapshot

From `qa_logs/g0h_scripted_playthrough/2026-05-02T23-16-58-153Z/report.json`:

| Metric | Value |
| --- | ---: |
| runtimeIssueCount | 6 |
| errorRuntimeIssueCount | 0 |
| warningRuntimeIssueCount | 6 |
| runtimeIssueKinds | cadence-budget-overrun only |
| pressureTier | normal |
| densityTier | normal |
| stutterTier | normal |
| cacheTier | normal |
| p95FrameMs | 10.50 |
| p99FrameMs | 11.00 |
| maxRenderMs | 10.10 |
| captureMaxRenderMs | 68.40 |
| captureP99FrameMs | 20.90 |
| spriteCacheEstimatedSurfaceMB | 2.81 / 64 |
| spriteCache hits / misses | 1,292,931 / 216 |

## Society Warnings

The long-soak audit is the most honest current read on "how close are we to real AI?" It confirms the systems run, but it does not confirm rich society yet.

| Long-soak signal | Observed | Target | Meaning |
| --- | ---: | --- | --- |
| bond stability | 0.355 | <= 0.30 | Social edges still wobble more than desired. |
| bond churn | 0 | 0.5..4.0 transitions/min | Relationships are too static over a long run. |
| partner repetition | 0.896 | <= 0.40 | Conversations cluster too hard around repeated partners. |
| witnessed affection rate | 0/min | >= 0.10/min | Affection exists in scripted/trigger coverage, but does not emerge enough organically. |
| cleanup gradient | 0.50 | < 0.50 non-positive windows | Cleanup is borderline; the ecosystem can still stall. |
| zone migration entropy | 0.077 | >= 0.50 stretch | Movement across zones is too concentrated. |

Interpretation: the game has durable emotions, memory packets, social edges, dialogue interpretation, cooperation hooks, and ML policy infrastructure. It is not merely a pile of if-statements anymore. But the lived long-run behavior still needs better pressure gradients, target diversity, social opportunity selection, and ML value before it feels like a self-sustaining society.

## UI Fix Landed During AA8

The hover-scroll audit exposed a real DOM-shell issue: dynamic panel rerenders could reset scroll position, especially in the feed and debug panels. The fix preserves scroll position across feed/debug rerenders and tightens the audit's synthetic overflow fixture so every panel is tested reliably.

Changed files:

- `ui/dom/debugPanel.js`
- `ui/dom/feedPanel.js`
- `scripts/run-r-hover-scroll-audit.js`

The repaired audit now covers feed, access, inspect, journal, debug, and canvas hover-scroll paths.

## ML Gate

m4 remains the correct default. m6 exists as a trained candidate, but AA5 correctly refused promotion because it did not beat both m4 and heuristic without policy regressions.

Next ML work should focus on:

- growing the trace corpus beyond the current scenario-driven set,
- adding more held-out organic cases,
- fixing weak policy families before promotion,
- measuring value in lived behavior, not just artifact match.

## Recommended Next Slice

The next phase should not be another foundation rebuild. The board/projection/spatial/save layers are green enough to support product work.

```
╔════════════════════════════════╗
║ Next Believability Slice       ║
╠════════════════════════════════╬═══════════════════════════════════════╗
║ B1 Social partner diversity    ║ reduce repeated partner loops         ║
║ B2 Organic affection exposure  ║ make witnessed affection happen live  ║
║ B3 Migration pressure tuning   ║ increase zone entropy without hijack  ║
║ B4 Cleanup economy pressure    ║ keep flower/decay loop from stalling  ║
║ B5 ML value instrumentation    ║ prove policy choices improve behavior ║
║ B6 Human G0 capture review     ║ judge lived feel after B1-B5 or now   ║
╚════════════════════════════════╩═══════════════════════════════════════╝
```

If the user wants a human capture immediately, it is now technically reasonable. The capture brief should specifically watch for:

- whether butterflies repeat the same conversation partners too often,
- whether zones feel underused,
- whether affection, grief, pride, shame, loyalty, and comfort are visible without forcing them,
- whether cleanup/food reserve behavior creates a believable ecosystem loop,
- whether the ML default feels better, neutral, or worse than heuristic behavior.

