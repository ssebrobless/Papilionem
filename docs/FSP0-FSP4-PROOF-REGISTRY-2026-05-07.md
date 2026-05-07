# FSP0-FSP4 Proof Registry - 2026-05-07

Scope: implementation gates for `docs/FULL-SUCCESS-REFINED-PLAN-2026-05-06.md`, phases FSP0 through FSP4.

## Promotion Shape

```
+------+------------------------------+-------------------------------+
| Gate | Must prove                    | Primary command               |
+------+------------------------------+-------------------------------+
| FSP0 | Audit registry is honest      | node scripts/run-r-sprite...  |
| FSP1 | Training grounds fires live   | node scripts/run-final...     |
| FSP2 | 3D board truth is visible     | node scripts/run-p1-visual... |
| FSP3 | Sprite clarity proof is fast  | node scripts/run-r-sprite...  |
| FSP4 | UI controls/settings intact   | node scripts/run-r-ui...      |
+------+------------------------------+-------------------------------+
```

## Current Gate Registry

| Phase | Status before work | Required proof | Residual if not green |
| --- | --- | --- | --- |
| FSP0 | Open | Sprite fidelity audit has `--fast-fidelity` and `--pressure-only` lanes; registry names hard blockers. | Cannot trust slow/timed-out sprite proof. |
| FSP1 | Open | `run-final-grand-plan-audit.js` training phase passes with `training:drillStarted`, `training:drillCompleted`, or `teaching:completed`. | Training Grounds may be visually present but behaviorally unproven. |
| FSP2 | Open | Visual calibration packet shows player view plus debug overlay and passes board/grid/support checks. | 3D/board logic remains code-proven but not player-visible. |
| FSP3 | Open | Fast sprite fidelity lane completes quickly and produces closeup screenshots. | Butterfly clarity remains subjective and hard to regress-test. |
| FSP4 | Open | UI parity audit proves hitboxes, colorblind/high-contrast/trails, persistence, DOM/canvas rows, and inventory. | Controls may work in some panels while silently regressing elsewhere. |

## Hard Cannot-Promote List

- Final grand plan audit must not warn on Training Grounds.
- Sprite fidelity must have a fast proof lane that writes a report before the pressure lane is attempted.
- UI/control matrix must cover settings persistence, hit boxes, and DOM/canvas parity.
- ML policy warnings remain outside FSP0-FSP4 and are reserved for FSP8.
- Dialogue naturalness and deeper society believability remain outside FSP0-FSP4 and are reserved for high-effort FSP5-FSP8.

## Browser Audit Rule

Run browser-heavy audits sequentially in the final gate. Parallel Playwright launches have caused environment-level launch collisions in this workspace, so simultaneous browser proofs are not treated as reliable evidence for FSP0-FSP4.

## Phase Exit Commands

Use these as the minimum exit proof set for FSP0-FSP4:

```powershell
node --check scripts/run-r-sprite-fidelity-audit.js
node scripts/run-r-sprite-fidelity-audit.js --fast-fidelity
node scripts/run-final-grand-plan-audit.js
node scripts/run-p1-visual-calibration-audit.js
node scripts/run-r-ui-parity-audit.js
node scripts/run-r-hover-scroll-audit.js
node scripts/run-spatial-projection-unit-tests.js
node scripts/run-runtime-self-audit.js
```

