# Claude Whole-Game Review: G0H, Real AI, 3D, UI, Sprite Fidelity, Next Plan

Date: 2026-05-01
Author: Claude Opus 4.7
Branch reviewed: `codex/milestone-freeze-playtest`
Latest commit reviewed: `d3bd27f Add scripted G0H playthrough fixture`
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Source request: `docs/CLAUDE-WHOLE-GAME-REVIEW-REQUEST-G0H-REAL-AI-3D-UI-2026-05-01.md`
Codex handoff: `docs/CODEX-HANDOFF-G0H-X1-UI-SPRITE-NEXT-PLAN-2026-05-01.md`
Status: binding for the next implementation slice. Replaces the prior X2..X5
ordering with a re-ordered plan that puts block restore + sprite fidelity +
UI parity audit before the X-phase cognition follow-ups.

---

## Section 0 - Executive Verdict

```text
verdict
+- the build is closer to "real game" than any prior packet. X1 evidence
|  fixes worked. Mid-run inspections now show double-digit memory packets,
|  including production witnessedAffection on Iris (the jealousy triangle
|  fired end-to-end). The cognition layer is genuinely doing work.
+- the spatial / projection / save / save-reload contracts are correct
|  EXCEPT for one named bug: block height is double-tracked
|  (boardPos.h + stackIndex), and the fixture path leaves stackIndex=0
|  while boardPos.h=1. Save serialize uses stackIndex as the hHint, then
|  restore prefers stackIndex over boardPos.h, flattening the stack and
|  producing the duplicate cell at moss-hollow:20:15:0.
+- the visual world is mathematically correct but visually muddled. The
|  high-res butterfly source art is intact (1920x1080 wings, 1080x1080
|  body), but the bake pipeline downsamples to the on-screen display
|  size (12-26 px) BEFORE drawing. Source detail is being baked away,
|  not just downsampled at the GPU. This is a separate fidelity phase.
+- the UI surfaces colorblind / trail / high-contrast settings on the
|  canvas accessibility panel and persists them. The CSS canvas filter
|  for colorblind modes is real and applied each frame. Trail visibility
|  is consumed by renderManager + butterfly afterimage rendering. So
|  the controls are wired - but the user has reported "doesn't work" and
|  hit-box mismatch. That deserves a formal click-region audit, not a
|  guess that it does or does not work.
+- the cognition vocabulary remains adequate. The right next slice is
|  not new vocabulary; it is X2 (loyalty symmetric-fire fix) + X3 (G0H
|  driver coverage) + X4 (organic floors + DOM surfacing) + X5 (real
|  ML trainer). But these come AFTER:
|  +- Y1 - block height restore (one bug, surgical)
|  +- Y2 - UI parity / hit-box / colorblind / trails formal audit
|  `- Y3 - sprite fidelity (separate visual pass)
`- recommendation order:
   Y1 -> Y2 -> Y3 -> X2 -> X3 -> X4 -> X5 -> G0H rerun -> human G0
   with Y1 hard-blocking everything (the duplicate cell fails the full
   G0H), Y2 and Y3 unblocking confidence in the human capture, and
   X2..X5 closing the cognition / ML residuals.
```

Honest score against the user's stated goals:

```text
spatial / 3D-backed board truth          85% (1 named bug: Y1)
visual clarity (sprite legibility)       40% (high-res art lost in bake)
visual clarity (height / depth cues)     65% (blocks crisp, no shadow under
                                              stacks, no doorway hint)
AI / cognition wiring                    75% (X1 proved most triggers; X2
                                              loyalty fix, X3 coverage,
                                              long-absence/death still
                                              uncovered in current packet)
ML earning its keep                      20% (no trainer; m4 strictly worse
                                              than heuristic on 3/5 families)
UI parity DOM <-> canvas                 65% (DOM panel scroll fixed; feed
                                              italic / inspect feeling row /
                                              hit-box alignment unproved)
proof harness reliability                70% (X1 closed the false-green
                                              memory-count bug; cognition
                                              coverage lane still missing;
                                              UI hit-box audit missing;
                                              sprite-fidelity lane missing)
```

Three of those numbers move sharply once the named work in this slice
lands: spatial -> 95%+ after Y1; UI -> 85%+ after Y2; visual clarity ->
75-80% after Y3.

---

## Section 1 - Layer-by-Layer Honest Read

### 1A - Spatial / 3D / projection / blocks

**Strong**. `boardToScreen` / `screenToBoard` reverse cleanly. Per-zone
projections work. The 9 fixture blocks survive save/reload at integer
cells in three of four zones. R11 / W4 cleanups landed. No re-foundation
warranted.

**One real contradiction (Y1)**:

`systems/saveSystem.js:1036-1046` `normalizeRestoredBlockBoardPos`:

```js
const normalized = ... structureSystem.normalizeBlockCell(
    zoneId,
    boardPos.u,
    boardPos.v,
    block?.stackIndex ?? boardPos.h ?? 0    // <-- prefers stackIndex
);
```

`systems/saveSystem.js:612` `serializeBlock`:

```js
boardPos: this.serializeBoardPos(block, { hHint: block.stackIndex ?? 0 }),
```

`entities/block.js:182-206` `applyBoardCell`: sets `boardPos.h = h` but
**does NOT update `this.stackIndex`**. So a fixture-spawned block has
`boardPos.h = 1` but `stackIndex = 0`. On serialize, the hHint is 0,
which can override a missing or invalid `boardPos.h`. On restore, the
normalize prefers `stackIndex = 0` over `boardPos.h`. Both stack base
and stack top end up at h=0 → duplicate cell at `moss-hollow:20:15:0`.

The actual `serializeBoardPos` body (line 479+) needs verification, but
even if it preserves `boardPos.h=1` correctly, the restore-side prefers
stackIndex. So the bug is at minimum in the restore preference.

The fix is layered:
1. `entities/block.js applyBoardCell`: also sync `this.stackIndex = h`.
2. `systems/saveSystem.js normalizeRestoredBlockBoardPos`: prefer a
   finite `boardPos.h` over `block.stackIndex`. Use stackIndex only as
   fallback.
3. After restore, run a one-shot reconciliation: for any block where
   `stackIndex !== Math.max(0, Math.round(boardPos.h))`, prefer
   boardPos.h and update stackIndex.

This is named, surgical, and does not need a schema bump. v5 stays.

### 1B - Visual clarity (sprite resolution)

**Weak by design, not by accident**. The asset pipeline is:

```text
asset on disk (1920x1080 wing PNG)
  -> spriteManager bake at draw-target size (e.g., 12x11 baked surface)
  -> per-frame draw onto creature layer at the same ~12-26 px on-screen
```

`spriteManager.js:825, 866` cache keys are `wing-trimmed|...|drawWidth x drawHeight`.
The bake target IS the on-screen size. Source detail above ~16 px is
DESTROYED at bake time and cannot be recovered by render-side smoothing.

Personality sizes in `entities/butterfly.js`:
- standard: `size: 12`
- delicate: `size: 10`
- commanding: `size: 14`

`gameConfig.rendering.butterflyVisualScale = 1.6` (config.js:362). So
the final on-screen butterfly is ~16-26 px. The bake at that size loses
99.5% of source detail.

`core/renderManager.js:117` says "creature layers default to high-quality
smoothing; blocks/particles stay pixel-crisp." So the architecture
supports separate smoothing. The problem is the bake stage, not the
render stage.

**Fix shape (Y3)**:
- Bake creature pieces at a fixed minimum surface size (e.g., 64x64 for
  body/antenna, 96x64 for wings) regardless of on-screen size. Cache
  one bake per appearance/pose, not per display size.
- At draw time, downscale to the on-screen size with high-quality
  smoothing. The browser's drawImage with imageSmoothingEnabled=true
  and imageSmoothingQuality='high' produces a clean downsample.
- Optional LOD: at inspect/close-up/battle, draw from the source asset
  directly (or a 256x256 bake) for max fidelity. Do NOT use this LOD
  during garden play where 100s of butterflies can be on screen.
- Keep blocks pixel-crisp. The smoothing rule in renderManager.js:117
  already does this; verify the bake path also keeps blocks
  nearest-neighbor.

Audit:
- new `scripts/run-r-sprite-fidelity-audit.js` (or extend the existing
  one) that asserts:
  - baked wing surface min 64 px on either dimension
  - baked body surface min 64 px
  - drawImage at display size uses smoothing
  - SSIM or PSNR or perceptual hash compare against the original asset:
    a 64x baked + downsampled wing must score >= 0.85 SSIM vs a direct
    drawImage from source.

Risk: more memory in the sprite cache. Audit cache memory before and
after. Cap with a max size (~32 MB) and LRU. The current cache reports
0.76 MB; even 4x bake surfaces would land at ~3 MB, well under 32.

### 1C - Visual clarity (height / depth cues)

**Mixed**. Blocks render with stackIndex-driven z-offset. The R0 ambient
grid + soft envelope landed in the visual sim-board rebuild. Altitude
shadow/sprite split (R4) renders the shadow at h=0 and the sprite at
flightH.

What is missing:
- **No drop-shadow under stacked blocks at h>=1**. A stack of two
  blocks visually reads as a single tall block. Adding a soft shadow
  under stacks at boardToScreen({u,v,0}) communicates "this column
  is a real 3D stack."
- **No visible doorway / zone-edge cue**. When a butterfly approaches
  a zone exit, no overlay indicates "you can travel here." This is a
  separate UX gap, not a contract gap.
- **No "selected entity outline" in overview mode**. The inspect
  surface tells you who is selected; the world doesn't echo the
  selection back.

These are visual polish, not blockers. They belong after Y3 sprite
fidelity in a "BR" (board readability) phase if needed.

### 1D - Real AI / cognition

**Real**. Y1 evidence fixes confirm cognition is firing in lived play:

```text
G0H full 7-min run (failed lane was blocks, not cognition)
+- Lumen   memoryPacketCount=6 (social)
+- Mira    memoryPacketCount=15 (social)
+- Iris    memoryPacketCount=10 (social, 1 witnessedAffection)
+- Aster   memoryPacketCount=18 (17 social + 1 outcome)
+- Aster   loyaltyChoice=2 (the symmetric-fire bug; X2 fix needed)
+- Aster   prideAnchor=1 (caregivingSuccess from production)
`- accumulated cognition events: 11 (across full run)
```

Witnessed-affection fired naturally on Iris from a Juniper-toward-Kite
dialogue without a direct lifeSimSystem call - this is a strict
improvement over the prior G0H, where the triangle never fired.

**Real residuals (named)**:
- **X2 loyalty symmetric fire**: Aster received TWO loyalty packets
  for the same conflict (chose Briar / chose Clover). The dedupe key
  is not canonical. Fix: sort the partner ids before the dedupe key.
- **X3 long-absence and death-bereavement uncovered**: the 7-min run
  did not exercise Pollen's death or Orchid's long-absence wakeup.
  The fixture seeds the conditions but the driver doesn't drive a
  death event or wait long enough for long-absence. Fix: add
  `killBondedPartner` driver action and verify long-absence packet
  exists on Orchid post-run.
- **Production triggers without coverage**: scout-cluster pride,
  abandoned-ally shame, warning-ignored shame still not exercised in
  G0H. Lab scenarios cover them; the live run does not. Fix: extend
  the G0H timeline to provoke these.

**Vocabulary status**: existing 8 drives, 9 emotions, 8 social edges,
8 memory families, 12 motives, 8 chemistry channels, 8 society
summaries, 7 distortion biases ARE sufficient for the named target
experiences. I do not recommend new vocabulary in this slice. The
bottleneck is wiring + observability, not expressiveness.

### 1E - ML

**Weak, with clear path forward**.

```text
ML state at d3bd27f
+- m4 garden policy artifact: 38/56 vs heuristic 55/56
|  +- actionFamily: 0.909 / 0.909
|  +- targetPreference: 0.545 / 1.000  <- artifact strictly worse
|  +- signalChoice: 0.545 / 1.000      <- artifact strictly worse
|  +- riskPosture: 1.000 / 1.000
|  `- autobattlePosture: 0.417 / 1.000 <- artifact strictly worse
+- cadenceFactor=4 reaches 3/6 value-band metrics (best so far)
+- corpus: 12 records, 8 from lived-loop scenarios
`- NO trainer in the repo. The static artifact is hand-crafted.
```

**Recommendation (X5)**: build `scripts/train-m5-garden-policy.js`. A
small ridge-regularized linear classifier per policy family. Inputs
are corpus-records.json. Output is `assets/ml/m5-garden-policy.json`
matching the m4 schema. Promote m5 only if it beats m4 AND improves
>=3/6 value-band metrics at the shipped cadence.

X5 stays at P1, after Y1-Y3 and X2-X4. It is the right honest next ML
step.

### 1F - UI parity / colorblind / trails / hit-boxes

**Mostly wired, formally unproven**.

What works in code (verified):
- `colorblindMode` cycles through `off / protanopia / deuteranopia /
  tritanopia / monochrome` and persists to localStorage.
- `applyCanvasAccessibilityStyle()` at `sketch.js:447-467` is called
  every frame from `sketch.js:320` and applies a CSS canvas-level
  `filter` for the chosen mode. The filters are heuristic
  approximations (sepia + saturate + hue-rotate), not full
  protanomaly transforms, but they DO change visible output.
- `trailVisibility` cycles `off / reduced / full` and is consumed by
  `renderManager.getTrailVisibilityMode()` and
  `entities/butterfly.js:714, 3931` for afterimage rendering.
  `gameConfig.performance.flags.trailsQualityReduced/Full` are both
  default `true`.
- `highContrastUI` is consumed widely in gameUI.js panel styling.

What is unproven:
- **Hit-box vs visible button alignment**. The accessibility panel
  uses `compactScale = max(0.42, uiScale * 0.52)` for buttons but the
  panel position uses `uiScale` directly. This is a known shape for
  hit-box drift. There is no audit that compares the drawn `rect()`
  bounds to the click hit-test bounds across panels.
- **DOM vs canvas parity**. The DOM shell renders feed/inspect/journal,
  but the ACCESSIBILITY panel is canvas-only (gameUI.js:246 -
  `if !this.isShellUiDomEnabled()`). So when DOM shell is enabled,
  the accessibility panel is hidden / unreachable. The user cannot
  toggle colorblind / trails / contrast from DOM mode.
- **Whether colorblind/trails/contrast persist across save/reload**.
  Save metadata at `saveSystem.js:664-666` includes
  `accessibilitySettings`, so it should. No audit verifies it.
- **Hover-scroll formal audit**. The handoff says the manual probe
  passed on multiple panels. There is no committed Playwright audit
  that re-runs the probe automatically. The R4 UI readability audit
  is not specifically a hover-scroll audit.

**Fix shape (Y2)**:
- Build `scripts/run-r-ui-parity-audit.js` (NEW):
  - For each canvas UI panel and DOM panel:
    - Render the panel at uiScale 0.75, 1.0, 1.25.
    - For each interactive button, measure the drawn rect and the
      hit-test rect.
    - Assert the two rects overlap by >= 95% area at every uiScale.
  - For each accessibility setting (colorblindMode, trailVisibility,
    highContrastUI):
    - Cycle through values via the canvas panel button.
    - Verify the visible canvas filter changed (read `canvas.style.filter`).
    - Save the game, reload, verify the setting persisted.
  - For DOM/canvas parity:
    - List which controls exist on canvas but not DOM, and vice versa.
    - Surface as a "ui-parity-gaps" residual lane (not must-pass yet).
- Move the accessibility panel to DOM mode as well (or surface a DOM
  accessibility section under settings) so the toggles are reachable
  in DOM shell. The handoff already enables hover-scroll on DOM
  panels - extending DOM coverage to accessibility is the next step.
- Hover-scroll formal audit: `scripts/run-r-hover-scroll-audit.js`
  that hovers each visible panel header and footer and asserts
  scrollTop advances on wheel. The manual probe should be promoted to
  CI.

### 1G - Harness reliability

**Improved by X1 but still has named gaps**:

```text
audits / scenarios that are reliable now
+- run-runtime-self-audit.js
+- run-h5-long-running-save-smoothness-audit.js
+- run-n8-social-save-continuity-audit.js
+- run-r2-zone-transition-audit.js
+- run-r-block-cell-discipline-audit.js (will catch Y1 once fixed)
+- run-r-spatial-cleanup-audit.js
+- run-r4-ui-readability-audit.js
+- run-ability-radius-conversion-audit.js
+- run-single-player-autobattle-audit.js
+- run-r-feed-thread-audit.js
+- run-r-flower-lifecycle-audit.js
+- run-r-cooperation-pressure-audit.js
+- run-scenario.js --all (23/23)
`- run-g0h-scripted-playthrough.js (--fast green; full failing on Y1)

audits / scenarios that are missing or shallow
+- ui-parity / hit-box (Y2 audit, NEW)
+- hover-scroll (formal Playwright audit, NEW)
+- sprite fidelity at bake-time (Y3 audit, NEW)
+- cognition coverage in full G0H (X3 lane, NEW)
+- cleanup-organic-floor (X4 lane, NEW)
+- cooperation-organic-floor (X4 lane, NEW)
`- ML m5 trainer + audit comparison (X5 audit, NEW)
```

The X1 evidence-fidelity lane was a strong addition. The next strong
addition is the cognition-coverage lane (X3) so the full G0H proves
all six trigger classes fire in lived play.

---

## Section 2 - Phase Order Recommendation

I recommend **Option B** from the request, refined:

```text
proposed order
Y1 - block height restore (one-bug surgical fix)             [P0 hard-block]
Y2 - UI parity / hit-box / colorblind / trails formal audit  [P0]
Y3 - sprite fidelity (bake-size lift, smoothing, LOD)        [P1]
X2 - loyalty symmetric-fire dedupe                            [P0]
X3 - G0H driver coverage (death, witnessed, long-absence)     [P0]
X4 - organic floors + DOM accessibility surfacing             [P1]
X5 - ML m5 trainer + corpus growth                            [P1]
G0H rerun + cognition-coverage lane                           [gate]
G0 human capture                                              [close]
```

Reasoning:
- **Y1 first**: hard blocker. Full G0H fails today on duplicate cell.
  Without Y1 we cannot honestly close the spatial gate.
- **Y2 before X2-X5**: the user has reported colorblind/trails/hit-box
  issues. Doing the cognition follow-ups first ships those issues
  forward into the human capture. A formal UI audit also surfaces
  dom/canvas parity gaps that should be fixed before human play.
- **Y3 before X2-X5**: visual clarity is what the user SEES. If we
  ship cognition fixes but the butterflies still look low-res, the
  human capture will be biased toward "this looks bad" rather than
  "this feels alive." Sprite fidelity is the highest visible-value-
  per-effort fix.
- **X2 next**: loyalty is currently producing contradictory packets.
  This is a real cognition correctness bug visible in any inspect
  during the human capture.
- **X3 next**: cognition coverage. Three of six trigger classes are
  unproven in the live G0H. The rerun must show all six.
- **X4 + X5 in parallel**: organic floors prove lived behavior; ML
  trainer is the honest path to "real AI." Both are P1.

Y3 is moved earlier than the upstream Codex handoff suggested
("plan sprite fidelity as its own visual pass" at step 11). My
reading: sprite fidelity is high-impact, low-risk, and ready now. It
should NOT block Y1 (which is the hard blocker), but it should land
before the human capture so the player sees the actual creatures.

If the user prefers the sprite work to happen later, swap Y3 to
after X5. The other ordering still holds.

---

## Section 3 - Phase Plan Detail

### Y1 - Block height restore

Goal: full 7-minute G0H stops failing on duplicate-cell at
`moss-hollow:20:15:0`. Block stack height is preserved across save /
reload for fixture and player saves alike.

Why now: hard blocker on G0H promotion. Cannot proceed to any rerun
or human capture without it.

Owned files:
- `entities/block.js` (applyBoardCell sync)
- `systems/saveSystem.js` (normalizeRestoredBlockBoardPos preference)
- `scripts/run-r-block-cell-discipline-audit.js` (new edge-case lane)

Forbidden files:
- save schema (stays v5)
- structureSystem.normalizeBlockCell (the normalizer is correct;
  the caller is wrong)
- core/renderManager.js
- entities/butterfly.js
- gridManager.js

Implementation steps:

Y1.1 - `entities/block.js applyBoardCell` (line 182-206) syncs
`stackIndex`:
```js
applyBoardCell(cell, options = {}) {
  if (!cell?.accepted && options.requireAccepted !== false) return false;
  const renderer = typeof renderManager !== 'undefined' ? renderManager : null;
  const zoneId = cell.zoneId || this.currentZoneId || null;
  const h = Math.max(0, Math.round(cell.h || 0));
  const screen = renderer?.boardToScreen?.({ zoneId, u: cell.u, v: cell.v, h: 0 }) || null;
  if (!screen) return false;
  this.currentZoneId = zoneId;
  this.boardPos = { zoneId, u: cell.u, v: cell.v, h };
  this.x = screen.x;
  this.y = screen.y;
  this.stackIndex = h;                                     // <-- ADD
  this.lastPlacedMode = h > 0 ? 'stacked' : 'ground';      // <-- ADD
  this.syncDebugGridPos();
  return true;
}
```

Y1.2 - `systems/saveSystem.js normalizeRestoredBlockBoardPos`
(line 1036-1052) prefers a finite `boardPos.h`:
```js
normalizeRestoredBlockBoardPos(boardPos = null, block = null) {
  if (!this.isValidBoardPos(boardPos)) return null;
  const zoneId = boardPos.zoneId || block?.currentZoneId || null;
  if (!zoneId) return null;
  const savedH = Number.isFinite(boardPos.h) ? Math.max(0, Math.round(boardPos.h)) : null;
  const stackHint = Number.isFinite(block?.stackIndex)
    ? Math.max(0, Math.round(block.stackIndex))
    : null;
  const heightHint = savedH !== null ? savedH : (stackHint !== null ? stackHint : 0);
  const normalized = ... structureSystem.normalizeBlockCell(zoneId, boardPos.u, boardPos.v, heightHint)
    || { ... };
  // ...
}
```
Use `savedH` first, `stackIndex` only as fallback when `boardPos.h` is
not finite.

Y1.3 - After restoring the block, force-sync `stackIndex` to the
final `boardPos.h`:
```js
// in instantiateBlock or after normalizeRestoredBlockBoardPos:
const restoredH = block.boardPos?.h;
if (Number.isFinite(restoredH)) {
  block.stackIndex = Math.max(0, Math.round(restoredH));
}
```

This is belt-and-suspenders and protects against any future caller
that mismatches the two fields.

Y1.4 - `scripts/run-r-block-cell-discipline-audit.js` adds a
fixture-then-save-reload lane:
- Plant a 2-block stack at `(20,15,0)` and `(20,15,1)`.
- Save.
- Reload.
- Assert no duplicate cells, both blocks at correct h.

Y1.5 - Run the full G0H rerun and confirm green.

Acceptance:
- `node scripts/run-g0h-scripted-playthrough.js` (full 7-min, not
  --fast): overall pass, 11/11 lanes (or 12/12 if X3 cognition-
  coverage lane is in by then).
- `node scripts/run-r-block-cell-discipline-audit.js`: pass with the
  new fixture-then-save-reload lane.
- `node scripts/run-h5-long-running-save-smoothness-audit.js`: pass.
- `node scripts/run-n8-social-save-continuity-audit.js`: pass.
- duplicate cells across all 9 fixture blocks = 0.
- the player's real save (if any blocks at h>0 exist) loads with
  preserved stack heights.

Rollback flag: not needed; the fix is defensive and does not need a
flag. If `boardPos.h` is somehow corrupt, the existing stackIndex
fallback still applies.

Risks:
- if a player save has blocks where `stackIndex !== boardPos.h` but
  the OLD save format was correct (boardPos.h was the truth), the new
  preference will give the right answer. If the old save's stackIndex
  was the truth and boardPos.h was stale, the new preference may
  produce slightly different positions. To mitigate: log a runtime
  issue `block-stack-height-divergence` when the two disagree on
  load, with both values, so we can spot-check player saves if any
  divergence exists.

Probes:
```
node scripts/run-r-block-cell-discipline-audit.js
node scripts/run-g0h-scripted-playthrough.js
node scripts/run-h5-long-running-save-smoothness-audit.js
node scripts/run-n8-social-save-continuity-audit.js
node scripts/run-runtime-self-audit.js
node scripts/run-scenario.js --all
```

Manual capture: not required for Y1; this is a code+audit fix. The
G0H rerun is the proof.

---

### Y2 - UI parity / hit-box / colorblind / trails / DOM coverage

Goal: prove that every UI control is clickable where it appears, that
colorblind / trails / high-contrast persist and are reachable in BOTH
canvas and DOM modes, and that hover-scroll is formally audited.

Why now: the user has reported broken / mismatched UI. The cognition
follow-ups will be partly invalidated by a human capture if the UI
itself is misaligned during play.

Owned files:
- `scripts/run-r-ui-parity-audit.js` (NEW)
- `scripts/run-r-hover-scroll-audit.js` (NEW; promotes the manual
  probe to CI)
- `ui/dom/shellOverlay.js` (DOM accessibility section if needed)
- `ui/gameUI.js` (hit-box / draw-rect alignment fixes if found)
- `ui/dom/feedPanel.js` (heard-meaning italic if not yet rendered in
  DOM; verify)

Forbidden files:
- save schema
- entities/, structureSystem placement, projection math
- battle math
- ML runtime

Implementation steps:

Y2.1 - Build `scripts/run-r-ui-parity-audit.js`:
- Boot the game in canvas mode AND DOM mode.
- For each panel (top buttons, accessibility, feed, inspect, journal,
  battle setup, battle HUD, debug, guide, save/load):
  - Render at uiScale 0.75, 1.00, 1.25.
  - For each interactive button advertised by the panel, measure:
    - drawn rect: scrape from the canvas pixel buffer or from the
      panel's get*Rect() helper
    - hit-test rect: derive from the panel's hit handler
  - Assert overlap >= 95% area.
- For each accessibility setting (colorblindMode, trailVisibility,
  highContrastUI, uiScale):
  - Click the cycling button.
  - Read the post-click state.
  - Verify visible effect:
    - colorblindMode: read `canvas.style.filter` and assert non-`'none'`
      for non-`off` modes.
    - trailVisibility: take 2 frames before and after; assert pixel
      delta in butterfly tail region.
    - highContrastUI: read panel fill RGB and assert post-toggle
      change.
    - uiScale: read panel rect and assert width changed.
- For each setting, save -> reload -> assert persisted.
- Compare DOM panel inventory to canvas panel inventory. List any
  panels that exist in one mode but not the other; surface as a
  "ui-parity-gaps" residual.

Y2.2 - Build `scripts/run-r-hover-scroll-audit.js`:
- Promote the manual hover-scroll probe to a Playwright script.
- For each visible DOM panel: hover header, body, footer; scroll
  wheel; assert scrollTop advanced.
- For each canvas panel that supports scroll: hover at canvas
  coordinates within panel bounds; scroll wheel; assert scrollOffset
  advanced.
- Acceptance: pass for all panels.

Y2.3 - Fix any hit-box mismatches found.
- Identify the panels with > 5% mismatch.
- Trace whether the mismatch comes from `compactScale` vs `uiScale`
  drift, panel `x/y` calculation drift, or text-area inflation.
- Fix the draw-rect or hit-rect to match.

Y2.4 - DOM accessibility section.
- Add a small DOM section (collapsible) under the existing settings or
  shell overlay that mirrors the canvas accessibility panel:
  high-contrast toggle, trail visibility cycle, colorblind mode cycle,
  uiScale slider.
- Wire to the same `gameUI.toggleAccessibilitySetting` /
  `gameUI.cycleAccessibilitySetting` / `gameUI.setUiScaleValue`.
- Acceptance: in DOM mode, all accessibility controls reachable.

Y2.5 - DOM feed italic verification.
- Confirm `ui/dom/feedPanel.js` renders heard-meaning italic. If not,
  add it (W4 from the upstream plan).

Acceptance:
- `node scripts/run-r-ui-parity-audit.js`: pass.
- `node scripts/run-r-hover-scroll-audit.js`: pass.
- DOM accessibility controls visible and functional in DOM mode.
- DOM feed renders heard-meaning italic (per upstream W4).
- `run-r4-ui-readability-audit.js`: stays green.

Rollback flag:
- `gameConfig.ui.domAccessibility.enabled = true` (default true).

Risks:
- the parity audit may surface multiple hit-box mismatches. Land them
  one panel at a time. Do not silently relax the >=95% overlap bar.

---

### Y3 - Sprite fidelity (bake-size lift + LOD)

Goal: butterflies look like the high-res source art rather than baked
12 px stamps. Wing colors, body markings, antenna details should be
visible in normal play and especially in inspect close-ups.

Why now: the player will judge "this game looks alive" largely on
sprite legibility. Spending cognition wins on a build that still
draws blurry creatures undersells the work.

Owned files:
- `core/spriteManager.js` (bake-size policy, cache key, smoothing)
- `core/renderManager.js` (creature draw scale + smoothing)
- `core/config.js` (`gameConfig.rendering.creatureBakeSize`,
  `gameConfig.rendering.creatureBakeMode`)
- `entities/butterfly.js` (consume bake size; wing/body/antenna
  draw paths)
- `scripts/run-r-sprite-fidelity-audit.js` (NEW or extension)

Forbidden files:
- save schema
- spatial math (boardToScreen/screenToBoard)
- structureSystem
- battle math
- ML runtime

Implementation steps:

Y3.1 - Add `gameConfig.rendering.creatureBakeSize`:
```js
rendering: {
  butterflyVisualScale: 1.6,
  creatureBakeSize: {
    body: 96,         // baked body surface, square
    wing: { width: 128, height: 96 },
    antenna: 48,
    enabled: true
  },
  creatureBakeMode: 'fixed-high-res',  // 'fixed-high-res' | 'display-size' | 'lod'
  creatureLodCloseupSize: { body: 256, wing: { width: 384, height: 256 }, antenna: 128 }
}
```

Y3.2 - `core/spriteManager.js` bake at fixed size when
`creatureBakeMode === 'fixed-high-res'`. The cache key uses the
canonical bake size, not display size.

Y3.3 - `core/renderManager.js` creature draw uses high-quality
smoothing when downscaling. Block draw stays nearest-neighbor.

Y3.4 - `entities/butterfly.js` wing/body/antenna draw paths read
the cached high-res surface and downscale at draw time.

Y3.5 - LOD path: when an entity is being inspected (the
`gameUI.inspectPanel.lockedTargetId === entity.id`) OR is in battle,
use the close-up bake size. Otherwise, garden bake size.

Y3.6 - `scripts/run-r-sprite-fidelity-audit.js`:
- Asserts bake surfaces are >= configured min sizes.
- Asserts on-screen butterfly bake fidelity beats the prior baseline:
  perceptual-hash distance from source asset < threshold T.
- Asserts blocks remain pixel-crisp (no smoothing applied to block
  layer).
- Memory ceiling: `spriteCacheEstimatedSurfaceMB < 32`.

Y3.7 - Inspect close-up screenshot capture:
- Produce 4 wing close-up screenshots at uiScale 1.0 with 4 different
  butterfly types.
- The user reviews them; the user is the final judge of "looks like
  the source art."

Acceptance:
- `node scripts/run-r-sprite-fidelity-audit.js`: pass.
- baked wing surfaces >= 96 px on either dimension.
- baked body surfaces >= 96 px square.
- sprite cache memory < 32 MB.
- blocks unchanged in visual style (still pixel-crisp).
- runtime self-audit + h5 + scenario suite stay green.
- 4 close-up screenshots produced for human judgment.

Rollback flag:
- `gameConfig.rendering.creatureBakeMode = 'display-size'` reverts to
  the prior bake-at-display-size behavior.

Risks:
- memory growth in the sprite cache. Cap and report.
- LOD switching may produce a visible pop when a butterfly enters or
  leaves inspect mode. Cross-fade at the renderer or only switch
  when the inspect panel itself appears/disappears.

---

### X2 - Loyalty symmetric-fire dedupe

(Carry forward from `docs/CLAUDE-REVIEW-G0H-REAL-AI-NEXT-PLAN-2026-05-01.md`
Section 4 X2. Steps unchanged.)

Owned files:
- `systems/communicationSystem.js`
- `scripts/scenario/scenarios/seed-loyalty-organic.json`

Forbidden files:
- save schema, entities/, render math, ML runtime

Steps:
- canonical pair-key in `recordProductionLoyaltyChoice` dedupe
- helped-first detection: emit one packet only when one side's
  distress dropped first; emit zero if caregiver helped both equally
- update seed-loyalty-organic to assert exactly 1 loyaltyChoice

Acceptance:
- `seed-loyalty-organic` scenario passes with exactly 1 loyaltyChoice
- G0H rerun shows at most 1 loyalty packet per distinct competing
  pair per caregiver per cooldown window
- the cognition-coverage lane (X3) reports loyaltyChoice >= 1 in the
  full G0H

Rollback flag:
- `gameConfig.cognition.triggers.loyalty.competingDistress.canonicalDedupe = true`
  (default true)

---

### X3 - G0H driver coverage (death + witnessed + long-absence)

(Carry forward from prior plan Section 4 X3.)

Owned files:
- `scripts/g0h/playthroughDriver.js`
- `scripts/g0h/fixtureSpec.js`
- `scripts/run-g0h-scripted-playthrough.js`
- `scripts/g0h/evidenceAssertions.js`

Forbidden files:
- systems/, entities/, save schema, render math

Steps:
- killBondedPartner driver action (Pollen) via production
  `eventBus.emit(GameEvents.BUTTERFLY_DIED)`
- nudgeWitnessedAffection action (already partly working in current
  build per evidence-fidelity output - Iris received 1 packet; verify
  this is from the production path, and force a second instance to
  confirm)
- assertLongAbsenceForOrchid evidence check
- new `cognition-coverage` must-pass lane

Acceptance:
- G0H full rerun: 12 must-pass lanes including cognition-coverage.
- non-zero counts for ALL of: bereavement (death), bereavement
  (long-absence), witnessedAffection, loyaltyChoice (canonical),
  prideAnchor (battleWin), prideAnchor (caregivingSuccess).

---

### X4 - Organic floors + DOM accessibility surfacing

(Carry forward from prior plan Section 4 X4. Most of Y2 covers DOM
accessibility, so X4's UI scope here is reduced.)

Owned files:
- `scripts/run-r-flower-lifecycle-audit.js` (organic cleanup lane)
- `scripts/run-r-cooperation-pressure-audit.js` (organic 5-min lane)
- ui/dom/<inspect panel> (cognition feeling row if not in Y2)

Forbidden files:
- save schema, ML runtime, projection math, battle math

Steps:
- cleanup-floor-organic lane (no teleport)
- cooperation-organic-floor lane (no injection)
- DOM inspect feeling row (if not landed in Y2)

Acceptance:
- both organic lanes pass deterministically with the named floors

---

### X5 - ML m5 trainer + corpus growth

(Carry forward from prior plan Section 4 X5.)

Owned files:
- `scripts/train-m5-garden-policy.js` (NEW)
- `assets/ml/m5-garden-policy.json` (NEW, gated)
- `core/config.js` (`gameConfig.ml.modelVersionId` flag, default m4)
- `scripts/run-ml-phase-m4-audit.js` (--policy flag)
- `scripts/run-ml-on-off-capture-audit.js` (--policy flag)
- `docs/ML-VALUE-DECISION-2026-05-XX.md` (next iteration)

Forbidden files:
- ML runtime contract surface
- save schema
- entities/, lifeSimSystem ownership

Steps:
- ridge-regularized linear classifier per policy family
- artifact write to `assets/ml/m5-garden-policy.json`
- gated by `gameConfig.ml.modelVersionId`
- promotion gate: m5 must beat m4 on artifact-match per family AND
  improve >=3/6 value-band metrics at the shipped cadence

---

## Section 4 - Cognition Vocabulary Decision

I do NOT recommend new cognition vocabulary in this slice.

The X1 evidence improvements showed that the existing vocabulary is
expressive enough for the named target experiences:
- loneliness, comfortSeeking, socialInsecurity (derived feelings)
- bond tier ladder (acquaintance / familiar / companion / bonded)
- bereavement (death + long-absence)
- witnessedAffection / jealousy
- pride / shame anchors (battleWin, caregivingSuccess, scoutCluster,
  abandonedAlly, warningIgnored)
- loyaltyChoice (competing distress, competing scout invitation)

What is missing is COVERAGE in the live G0H, not vocabulary. The
inspections during the G0H run ALREADY show:
- Lumen 6 social packets
- Mira 15 social packets
- Iris 10 social packets including 1 witnessedAffection
- Aster 18 packets including 17 social and 1 outcome (pride)

If during X3 / X4 the user identifies a target experience that the
current vocabulary truly cannot express, propose then with concrete
owner / migration / proof. Today, the data shows the bottleneck is
wiring + observability, not expressiveness.

If a future scenario shows a clear gap, the most likely additions
would be:
- "anticipation" (waiting for a future event with positive valence)
- "boredom" (low-stim drift toward novelty)
- "guilt-by-proximity" (witnessedHarm separate from witnessedAffection)
- "confidence" as a first-class derived feeling rather than a society
  summary

But none are required now. Hold the line on vocabulary until X3
proves coverage and the human capture identifies a specific missing
experience.

---

## Section 5 - Save Continuity Protocol

```text
save continuity rules for Y1..Y3 + X2..X5
+-- saves remain at schemaVersion 5
+-- Y1 may DETECT a divergence between stackIndex and boardPos.h on
|   load; emit a runtime issue but do not migrate the save. The new
|   preference produces the right post-load state without touching
|   the saved bytes.
+-- Y2 only adds DOM controls and audits; no save touch
+-- Y3 changes RUNTIME bake size; the save-format butterflies do not
|   carry sprite caches; no save touch
+-- X2 only changes trigger logic; no save touch
+-- X3 only adds driver actions; no save touch
+-- X4 only adds audit lanes and DOM UI; no save touch
+-- X5 only adds an ML artifact under assets/ml/; not save data
+-- the g0h-scripted-fixture is synthetic; the player's real save
|   remains protected by the run-h5 fixture-export ignore rule
+-- if any future phase requires a real schema bump, it is its own
|   joint signoff under SAVE-SCHEMA-REGISTRY. None of this slice
|   needs it.
```

---

## Section 6 - Risk Summary

```text
high
+-- Y1 fix may surface latent block-state divergences in the player's
|   real save (stackIndex vs boardPos.h). Mitigate: emit
|   `block-stack-height-divergence` runtime issue when load detects
|   the disagreement, so we can spot-check before promoting.
+-- Y3 bake-size lift increases sprite cache memory. Cap < 32 MB and
|   audit. If a long-running session blows the cap, switch to LRU
|   eviction or fall back to display-size bakes.
+-- X5 trainer with ~12 records may overfit. Use ridge regularization
|   at lambda 0.01-0.1. Do NOT promote unless the gate passes.

medium
+-- Y2 hit-box audit may find many small mismatches across panels.
|   Plan to land them one panel at a time. Do not silence with looser
|   overlap thresholds.
+-- Y3 LOD switching may produce a pop when entering inspect mode.
|   Cross-fade or restrict LOD to only the inspected entity.
+-- X3 killBondedPartner sets dead=true on Pollen and emits
|   BUTTERFLY_DIED. Existing death cleanup must run; verify with
|   run-r2-zone-transition-audit afterwards.

low
+-- Y2 DOM accessibility section may reflow other DOM panels. Land
|   under a feature flag if reflow is detected.
+-- Y1 force-syncing stackIndex on restore may diverge if the saved
|   stackIndex was the truth and boardPos.h was stale. Mitigate via
|   the divergence runtime issue + spot-check.
```

---

## Section 7 - Audit Lane Map

```text
must stay green through Y1..Y3 + X2..X5
+-- run-runtime-self-audit.js
+-- run-h5-long-running-save-smoothness-audit.js
+-- run-r2-zone-transition-audit.js
+-- run-r-block-cell-discipline-audit.js (with new save-reload lane)
+-- run-n8-social-save-continuity-audit.js
+-- run-f1-session-capture-audit.js
+-- run-ability-radius-conversion-audit.js
+-- run-single-player-autobattle-audit.js
+-- run-r6-communication-audit.js
+-- run-r-feed-thread-audit.js
+-- run-r-flower-lifecycle-audit.js
+-- run-r-cooperation-pressure-audit.js
+-- run-r-altitude-probe.js
+-- run-r-spatial-cleanup-audit.js
+-- run-r4-ui-readability-audit.js
+-- run-scenario.js --all (23 scenarios)
`-- run-g0h-scripted-playthrough.js (must be green at 12 lanes after
    Y1 fix and X3 cognition-coverage lane)

new in this slice
+-- Y1: edge-case fixture-then-save-reload lane in
|       run-r-block-cell-discipline-audit.js
+-- Y2: scripts/run-r-ui-parity-audit.js (NEW)
+-- Y2: scripts/run-r-hover-scroll-audit.js (NEW)
+-- Y3: scripts/run-r-sprite-fidelity-audit.js (NEW or extension)
+-- X3: cognition-coverage must-pass lane in G0H
+-- X4: cleanup-organic-floor lane in run-r-flower-lifecycle-audit
+-- X4: cooperation-organic-floor lane in run-r-cooperation-pressure-audit
+-- X5: scripts/train-m5-garden-policy.js (NEW)
+-- X5: --policy flag in run-ml-phase-m4-audit and run-ml-on-off-capture
`-- X5: docs/ML-VALUE-DECISION-2026-05-XX.md (next iteration)
```

---

## Section 8 - Files / Owners Summary

```text
owned this slice
+-- Y1
|   entities/block.js (applyBoardCell sync)
|   systems/saveSystem.js (normalizeRestoredBlockBoardPos preference)
|   scripts/run-r-block-cell-discipline-audit.js (new lane)
+-- Y2
|   scripts/run-r-ui-parity-audit.js (NEW)
|   scripts/run-r-hover-scroll-audit.js (NEW)
|   ui/dom/shellOverlay.js (DOM accessibility section)
|   ui/gameUI.js (hit-box / draw-rect alignment fixes if found)
|   ui/dom/feedPanel.js (heard-meaning italic verification)
+-- Y3
|   core/spriteManager.js (bake-size policy)
|   core/renderManager.js (creature draw scale)
|   core/config.js (creatureBakeSize, creatureBakeMode, LOD)
|   entities/butterfly.js (consume bake size)
|   scripts/run-r-sprite-fidelity-audit.js (NEW or extension)
+-- X2
|   systems/communicationSystem.js
|   scripts/scenario/scenarios/seed-loyalty-organic.json
+-- X3
|   scripts/g0h/playthroughDriver.js
|   scripts/g0h/fixtureSpec.js
|   scripts/run-g0h-scripted-playthrough.js
|   scripts/g0h/evidenceAssertions.js
+-- X4
|   scripts/run-r-flower-lifecycle-audit.js
|   scripts/run-r-cooperation-pressure-audit.js
|   ui/dom/<inspect panel> (cognition feeling row if not in Y2)
`-- X5
    scripts/train-m5-garden-policy.js (NEW)
    assets/ml/m5-garden-policy.json (NEW, gated)
    core/config.js (gameConfig.ml.modelVersionId)
    scripts/run-ml-phase-m4-audit.js (--policy flag)
    scripts/run-ml-on-off-capture-audit.js (--policy flag)
    docs/ML-VALUE-DECISION-2026-05-XX.md (NEW)

forbidden across all phases
+-- save schema bump
+-- ML runtime contract surface (the c1 spec stays)
+-- new drive / emotion / motive / memory family / social-edge vocabulary
+-- gridManager.js
+-- core/renderManager.js projection math (board math stays)
+-- battleSystem.js battle math
+-- structureSystem.normalizeBlockCell (the normalizer is correct)
```

---

## Section 9 - End-of-Document Honest Framing

```text
honest framing (this slice)
+-- the build is real game now. X1 closed the false-green memory bug.
|   The cognition layer is firing in lived play with double-digit
|   memory packets per inspected butterfly and at least one
|   witnessedAffection from the production dialogue path.
+-- the named blocker is a single bug: block height is double-tracked
|   between stackIndex and boardPos.h, and the fixture path leaves
|   them out of sync. Y1 fixes both writers and both readers.
+-- the named visible weakness is sprite fidelity. Source art is
|   high-res; bake destroys it. Y3 fixes the bake stage; the render
|   stage is already correct.
+-- the named UI risks are unproven, not unwired. Colorblind / trail /
|   contrast settings are wired. The CSS canvas filter is real. The
|   bug surface is hit-box mismatch, DOM coverage, and persistence
|   audit. Y2 closes those.
+-- after Y1..Y3 + X2..X5, the human G0 capture happens against a
|   build where:
|   - the spatial layer is honestly correct
|   - the visual layer makes the creatures look like creatures
|   - the cognition layer fires all six trigger classes in lived play
|   - the UI layer respects all settings in both modes
|   - the ML layer either earns m5 or honestly stays at m4
+-- consciousness is not claimed. The cognition packets remain
|   functional state with named triggers, decay, save persistence,
|   and audit proofs. The Inspect surface should describe them in
|   functional terms ("Misses Pollen for 2:14 more"), not metaphysical.
+-- ML stays as a read-only scorer. lifeSim/communication remain
|   owners of durable social truth. m5 promotes only via the gate.
`- this is the slice that takes the build from "wired and partially
   visible" to "wired, visible, and ready for human play."
```
