# Codex Handoff: G0H X1, UI Scroll, Sprite Fidelity, and Next Plan

Date: 2026-05-01
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Branch context: `codex/milestone-freeze-playtest`

## Executive Summary

Codex implemented X1 evidence-layer fixes from Claude's prior review and verified the fast G0H scripted packet is now honest-green. Codex also made a side UX fix so scroll wheel input works by hovering over UI boxes and scrolling.

The build should not proceed to human G0 capture yet. The full 7-minute G0H run exposed a separate block-cell contradiction: a fixture stack intended at height `h=1` reloads as `h=0`, creating a duplicate block cell. This looks like a save/load or restored block height issue, not an X1 evidence issue.

Sprite fidelity is also not solved. Original butterfly art assets are intact at high resolution, but the runtime draws them into tiny on-screen baked surfaces, so the source detail is being discarded by scale/downsampling rather than missing from disk.

## Current Shape

```text
Prior Claude plan
  |
  +-- X1 evidence layer fixes
  |     |
  |     +-- implemented
  |     +-- fast G0H: pass, 11/11 lanes
  |     +-- scenario suite: pass, 23/23
  |
  +-- Side UX request: UI hover + mouse wheel
  |     |
  |     +-- implemented
  |     +-- DOM panel wheel probe: pass
  |     +-- R4 UI readability audit: pass
  |
  +-- Full 7-minute G0H rerun
  |     |
  |     +-- evidence-fidelity: pass
  |     +-- accumulated cognition: 11
  |     +-- overall: fail
  |     +-- blocker: duplicate block cell moss-hollow:20:15:0
  |
  +-- Sprite fidelity side finding
        |
        +-- original PNGs are still high-res
        +-- runtime baked wing surfaces are around 12-15 px wide
        +-- likely fix is a separate visual fidelity pass, not asset recovery
```

## X1 Implementation Summary

X1 was implemented to repair false-green cognition evidence in the G0H scripted packet.

Changed files:

- `scripts/g0h/playthroughDriver.js`
- `scripts/g0h/evidenceAssertions.js`
- `scripts/run-g0h-scripted-playthrough.js`
- `systems/lifeSimSystem.js`

Additional deterministic proof fixes were made because scenario proof timing depended on random/reset state:

- `scripts/scenario/runner.js`
- `scripts/scenario/scenarios/seed-pride.json`
- `scripts/scenario/scenarios/seed-pride-organic.json`
- `scripts/scenario/scenarios/seed-jealousy-organic.json`
- `scripts/scenario/scenarios/seed-loyalty.json`

Behavioral changes:

- G0H inspections now summarize `lifeSim.memories.social`, `lifeSim.memories.outcome`, and `lifeSim.memories.place` instead of reading `lifeSim.memories` as a flat array.
- Inspect snapshots include `memoryFamilyCounts` and `memoryKindCounts`.
- `recordBereavementForDeath`, `recordWitnessedAffection`, and `checkLongAbsence` now emit `cognition:triggered` only after a new production packet is created.
- G0H driver accumulates cognition events across the whole scripted run instead of relying only on the eventBus ring buffer.
- `evidence-fidelity` lane now reports whether inspected butterflies have non-zero memory packet counts and whether snapshot cognition events are represented in accumulated cognition.
- Human review output now lists evidence fidelity residuals when present.
- Scenario runner now seeds p5 randomness deterministically and resets core frame/event state before actions.
- Scenario `set_emotions` now sets supplied values directly; `distress` retains raise-to-at-least semantics.

## X1 Proofs

Fresh fast G0H proof:

- Command: `node scripts/run-g0h-scripted-playthrough.js --fast`
- Output folder: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-23-39-969Z`
- Report: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-23-39-969Z\report.json`
- Overall: `pass`
- Lane summary: `11/11 pass`
- Evidence fidelity: `pass`
- Accumulated cognition: `16`
- Accumulated loyalty choices: `6`
- Accumulated outcome anchors: `8`
- Aster final snapshot: `memoryPacketCount=11`, `loyaltyChoice=2`, `prideAnchor=1`

Other proofs:

- `node scripts/run-runtime-self-audit.js`
  - Report: `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\runtime_self_audit\report.json`
  - Overall: `pass`
- `node scripts/run-h5-long-running-save-smoothness-audit.js`
  - Report: `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\h5_long_running_save_smoothness_audit\2026-05-01T04-49-29-042Z\report.json`
  - Overall: `pass`
- `node scripts/run-n8-social-save-continuity-audit.js`
  - Report: `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\n8_social_save_continuity_audit\2026-05-01T04-50-04-331Z\report.json`
  - Overall: `pass`
- `node scripts/run-scenario.js --all`
  - Overall: `23/23 pass`

## Full G0H Residual Blocker

Command:

- `node scripts/run-g0h-scripted-playthrough.js`

Output:

- Output folder: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-13-13-119Z`
- Report: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-13-13-119Z\report.json`
- Capture: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-13-13-119Z\capture\capture.json`
- Summary: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-13-13-119Z\capture\summary.txt`

Result:

- Overall: `fail`
- Passing lanes: 10/11
- Failing lane: `block-cell-discipline`
- Evidence fidelity: `pass`
- Accumulated cognition: `11`
- Accumulated loyalty choices: `2`
- Accumulated outcome anchors: `8`
- No console errors or page errors.

Failure detail:

```json
{
  "duplicateCells": [
    {
      "key": "moss-hollow:20:15:0",
      "blockIds": [
        "block_1777612396145_421",
        "block_1777612396145_423"
      ]
    }
  ]
}
```

Fixture context:

- The fixture manifest intended:
  - `moss-stack-base` at `{ zoneId: "moss-hollow", u: 20, v: 15, h: 0 }`
  - `moss-stack-top` at `{ zoneId: "moss-hollow", u: 20, v: 15, h: 1 }`
- The duplicate exists from the first snapshot after loading the fixture, so it is not caused by the 7-minute run's movement.

Likely root cause to review:

- `systems/saveSystem.js`
  - `normalizeRestoredBlockBoardPos()` around line 1036 passes `block?.stackIndex ?? boardPos.h ?? 0` into `structureSystem.normalizeBlockCell`.
  - If serialized `boardPos.h` is `1` but restored `block.stackIndex` is `0`, the saved height can be flattened to `0`.
  - Later restore paths also pass `hHintFromEntity: true` for blocks, which may preserve the same bad preference for stale `stackIndex`.
- `entities/block.js`
  - `applyBoardCell()` sets `boardPos.h`, but does not appear to synchronize `stackIndex`, `supportBlockId`, or placement metadata.

Suggested surgical fix candidate for Claude to evaluate:

- Prefer valid saved `boardPos.h` over `block.stackIndex` during save restore normalization.
- Consider whether `Block.applyBoardCell()` should synchronize `stackIndex` with accepted cell height when used by fixture/save placement code.
- Do not change save schema. Keep schemaVersion v5.
- Protect the player's real save. Synthetic fixture saves are fine.

## UI Scroll Wheel Side Fix

User requested: hovering over a UI box and scrolling should scroll that UI box.

Changed files:

- `index.html`
- `ui/dom/shellOverlay.js`
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

Behavioral changes:

- DOM shell panels now contain wheel scrolling and have stable scrollable inner areas.
- `shellOverlay` listens for wheel events on visible DOM panels and routes the wheel to the panel's scrollable body/list.
- Wheel input over panel headers/buttons now still scrolls the panel body.
- Canvas fallback journal now scrolls when hovering anywhere over the journal panel, not only over the internal viewport.
- Canvas fallback panels consume wheel input when hovered so the wheel does not leak through to the game.

Proofs:

- `node --check ui/dom/shellOverlay.js`
- `node --check ui/gameUI.js`
- `node --check ui/butterflyCollection.js`
- `node scripts/run-r4-ui-readability-audit.js`
  - Report: `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\r4_ui_readability_audit\2026-05-01T05-30-48-961Z\report.json`
  - Overall: `pass`
- A manual Playwright probe mounted feed, inspect, journal, access, debug, and guide DOM panels, hovered over panel headers, scrolled the wheel, and verified each panel body scrollTop advanced. Result: `pass`.

## Sprite Fidelity Side Finding

User asked why sprites still look low resolution even though original art was high-res.

Codex finding:

- Original butterfly assets are intact:
  - Wings: `1920x1080`
  - Body: `1080x1080`
  - Antenna: `1080x1080`
- Relevant asset path: `C:\Users\fishe\Documents\projects\ephemera\assets\butterflies`

The low-resolution look is caused by runtime scaling/downsampling:

- Butterfly personality sizes are tiny: mostly `10` to `16` in `entities/butterfly.js`.
- Sprite draw scale maps `this.size / 1080` in `entities/butterfly.js` around the sprite drawing path.
- Current `gameConfig.rendering.butterflyVisualScale` is `1.6`, which makes the final on-screen butterfly only about `16` to `26` pixels for the body scale.
- The latest capture summary reported baked wing cache entries around `12x11` and `15x12`, meaning high-res source details are being baked into very small surfaces before display.
- P0 fixed nearest-neighbor smoothing, but did not increase the on-screen pixel budget enough to reveal source detail.

Relevant files:

- `entities/butterfly.js`
  - personality sizes near top of file
  - sprite scale calculations around `drawSpriteWing`, `drawSpriteBody`, and `drawSpriteAntennae`
- `core/config.js`
  - `gameConfig.rendering.butterflyVisualScale`
- `core/spriteManager.js`
  - baked surface and wing pose/piece dimensions
- `core/renderManager.js`
  - creature layer smoothing

Suggested separate visual fidelity phase:

- Do not mix this with the G0H block-height fix.
- Add a sprite-fidelity plan that increases creature pixel budget safely.
- Consider high-fidelity LOD for inspect/close-up/capture states.
- Consider creature-layer render scale or pixel density, while keeping blocks crisp.
- Re-run sprite parity/fidelity audits and manual capture close-ups.
- Keep block style pixel-crisp.
- Avoid changing spatial math as part of sprite fidelity.

## Recommended Next Order

```text
1. Commit X1 evidence fixes.
2. Commit UI hover-scroll fix separately.
3. Fix the full-G0H block height restore contradiction.
4. Rerun full 7-minute G0H.
5. Rerun block/save/runtime audits.
6. If green, proceed to X2 loyalty symmetric-fire fix.
7. Then X3 production-path trigger coverage.
8. Then X4 organic floors + DOM/inspect surfacing.
9. Then X5 ML trainer/corpus/value work.
10. Run human G0 capture only after X-phase rerun is honest-green.
11. Plan sprite fidelity as its own visual pass.
```

## Constraints and Flexibility

Keep these constraints:

- Do not wipe the player's real long-running save.
- Synthetic fixture saves and scenario saves are allowed.
- Do not bump save schema unless a named contradiction proves it is required.
- Keep schemaVersion v5 for the immediate G0H/X-phase work.
- Do not change core cognition vocabulary for the block restore or UI scroll fixes.
- Do not promote human G0 capture until the full scripted G0H packet is honest-green.
- Do not claim literal consciousness or subjective feeling.

Allow this flexibility:

- Claude may propose better order or split phases differently if it names the reason.
- Claude may propose additional tests, fixtures, probes, or acceptance criteria.
- Claude may recommend a sprite-fidelity phase earlier or later, but should keep it separate from the block-height restore unless it identifies a direct dependency.
- Claude may recommend additive migration work if it proves v5 restore logic cannot preserve current block truth without it, but should prefer a no-schema surgical fix first.

## Requested Claude Review

Claude should review the current state and produce a concrete next implementation plan for Codex. The plan should include:

- Whether the block-height restore contradiction should be fixed before X2.
- Exact files to inspect and edit.
- Whether the likely saveSystem fix is sufficient or whether Block.applyBoardCell also needs synchronization.
- Proof commands and acceptance criteria.
- Rollback strategy.
- Whether the UI scroll fix is complete or needs a formal audit script.
- A separate sprite-fidelity phase plan that restores visual clarity from the high-res source art without destabilizing spatial math.
- Updated exact next steps for X2-X5 after the block blocker is resolved.
- A singular copy-paste prompt for the user to hand back to Codex.
