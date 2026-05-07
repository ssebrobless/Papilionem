# FSP0-FSP4 Evidence Lock - 2026-05-07

Branch: `codex/fsp0-fsp4-success-gates`

## Result

FSP0 through FSP4 are implemented and proofed.

```
+------+------------------------------------+--------+
| FSP0 | Proof registry + audit reliability | PASS   |
| FSP1 | Training grounds closure           | PASS   |
| FSP2 | Visual 3D truth packet             | PASS   |
| FSP3 | Sprite fidelity proof split        | PASS   |
| FSP4 | UI/control matrix                  | PASS   |
+------+------------------------------------+--------+
```

## Implementation Summary

- FSP0 added `docs/FSP0-FSP4-PROOF-REGISTRY-2026-05-07.md` and split `scripts/run-r-sprite-fidelity-audit.js` into independently runnable fidelity and pressure lanes:
  - `--fast` / `--fast-fidelity` / `--screenshots-only`
  - `--pressure` / `--pressure-only`
- FSP1 updated `scripts/run-final-grand-plan-audit.js` to use phase-local event subscribers for Training Grounds and migration evidence. The production events were already firing; the previous audit sampled the global event history after noisy frames could rotate evidence out.
- FSP2 updated `scripts/run-p1-visual-calibration-audit.js` to capture all four focused zones and gate the packet on zone screenshots, stack/support fixture, and occupancy anchors.
- FSP3 proved the split sprite lanes:
  - fast fidelity lane completed quickly and passed
  - pressure-only lane completed separately and passed
- FSP4 used the existing UI parity and hover-scroll audits as the control matrix gate.

## Report Paths

| Proof | Result | Report |
| --- | --- | --- |
| Fast sprite fidelity | Pass | `qa_screenshots/r_sprite_fidelity_audit/2026-05-07T20-32-12-692Z/report.json` |
| Sprite pressure-only | Pass | `qa_screenshots/r_sprite_fidelity_audit/2026-05-07T20-36-09-414Z/report.json` |
| Final grand plan | Pass | `qa_screenshots/final_grand_plan_audit/2026-05-07T20-34-14-059Z/report.json` |
| Visual 3D calibration | Pass | `qa_screenshots/p1_visual_calibration_audit/2026-05-07T20-35-41-284Z/report.json` |
| UI parity matrix | Pass | `qa_screenshots/r_ui_parity_audit/2026-05-07T20-43-29-047Z/report.json` |
| Hover-scroll | Pass | `qa_screenshots/r_hover_scroll_audit/2026-05-07T20-43-58-980Z/report.json` |
| Spatial projection units | Pass | `qa_screenshots/spatial_projection_unit_tests/2026-05-07T20-44-32-012Z/report.json` |
| Runtime self-audit | Pass | `qa_screenshots/runtime_self_audit/report.json` |

## Important Findings

- Training Grounds was a proof-layer issue, not a production behavior failure. Captured events included `training:drillStarted`, `teaching:completed`, and `training:drillCompleted` in sun-court.
- Migration also needed subscriber-backed evidence. The audit now captures `zone:travelStarted` events even when the transient `zoneTravel` field is gone by the time the screenshot/check runs.
- Sprite fidelity no longer depends on finishing the seven-minute pressure lane before producing closeup clarity evidence.
- UI controls covered by the matrix include hit boxes, high contrast, colorblind mode, trail visibility, UI scale persistence, DOM heard-meaning, inspect feeling rows, feed filters, and hover-scroll.

## Remaining Work Outside This Lock

- FSP5 dialogue naturalness.
- FSP6 social-life long soak.
- FSP7 environmental affordance polish.
- FSP8 ML learning closure.

These remain the high-effort phases and should be reviewed with higher reasoning before implementation.

