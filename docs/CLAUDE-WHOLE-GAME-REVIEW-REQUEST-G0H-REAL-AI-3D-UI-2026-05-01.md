# Claude Whole-Game Review Request: G0H, Real AI, 3D/Spatial Truth, Visuals, and UI Parity

Date: 2026-05-01
Workspace: `C:\Users\fishe\Documents\projects\ephemera`
Current branch context: `codex/milestone-freeze-playtest`

## Why This Review Exists

The project has moved through a long sequence of stabilization, visual sim-board rebuild, G0H scripted playthrough, cognition evidence, and UI fixes. The next review should not only approve the immediate next patch. It should evaluate whether the whole game is still moving toward the user's target:

- a visually readable 3D-backed sim-board world,
- believable butterfly society,
- functional AI-like behavior with emotion, memory, social bonds, and cooperation,
- clear UI that preserves all built features,
- a reliable proof harness that catches regressions before human playtesting.

This review should be allowed to propose a new concrete plan if the current plan is too narrow.

## Current High-Level State

```text
Game target
  |
  +-- Spatial / 3D-backed world
  |     +-- board/projection contracts exist
  |     +-- no full rebuild currently recommended
  |     +-- full visual truth still needs human-facing confirmation
  |
  +-- G0H scripted proof
  |     +-- fast X1 packet is honest-green
  |     +-- full 7-minute packet has block-height duplicate-cell blocker
  |
  +-- Real AI / life sim
  |     +-- derived feelings, memory packets, social edges, triggers exist
  |     +-- evidence was improved by X1
  |     +-- still needs whole-loop believability review, not only storage proof
  |
  +-- Visual fidelity
  |     +-- high-res butterfly sprites are intact
  |     +-- runtime draws them tiny, so they look low-res
  |
  +-- UI
        +-- DOM and canvas UI layers both exist
        +-- hover-scroll was just improved
        +-- possible regressions remain: colorblind mode, trail settings, hit-box alignment, lost controls
```

## Documents Claude Should Read

Primary handoff from Codex:

- `C:\Users\fishe\Documents\projects\ephemera\docs\CODEX-HANDOFF-G0H-X1-UI-SPRITE-NEXT-PLAN-2026-05-01.md`

Prior Claude review / next-plan documents:

- `C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-REVIEW-G0H-REAL-AI-NEXT-PLAN-2026-05-01.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-REVIEW-FREEZE-PLAYTEST-NEXT-PLAN-2026-04-30.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\G0H-SCRIPTED-PLAYTHROUGH-FIXTURE-PLAN-2026-05-01.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\CLAUDE-REVIEW-G0-VISUAL-SPATIAL-AI-2026-04-29.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\VISUAL-SIM-BOARD-REBUILD-PLAN-2026-04-29-CLAUDE-REVIEW.md`

Contracts / audit context:

- `C:\Users\fishe\Documents\projects\ephemera\docs\CURRENT-SPATIAL-TRUTH.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\SPATIAL-UNIT-CONTRACT.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ML-CONTRACT.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\LIFESIM-EXPRESSION-AUDIT.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-PLAN-REGISTRY.md`
- `C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-COMPLETION-BOARD.md`

## Current Evidence Paths

X1 fast G0H packet:

- `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-23-39-969Z\report.json`
- Overall: `pass`
- Lane summary: `11/11 pass`
- Evidence fidelity: `pass`
- Accumulated cognition: `16`

Full 7-minute G0H packet with blocker:

- `C:\Users\fishe\Documents\projects\ephemera\qa_logs\g0h_scripted_playthrough\2026-05-01T05-13-13-119Z\report.json`
- Overall: `fail`
- Passing lanes: `10/11`
- Failing lane: `block-cell-discipline`
- Duplicate cell: `moss-hollow:20:15:0`
- Evidence fidelity itself: `pass`

UI readability / scroll proof:

- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\r4_ui_readability_audit\2026-05-01T05-30-48-961Z\report.json`
- Overall: `pass`

Other green proofs from the X1 pass:

- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\runtime_self_audit\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\h5_long_running_save_smoothness_audit\2026-05-01T04-49-29-042Z\report.json`
- `C:\Users\fishe\Documents\projects\ephemera\qa_screenshots\n8_social_save_continuity_audit\2026-05-01T04-50-04-331Z\report.json`
- `node scripts/run-scenario.js --all` passed `23/23`.

## Required Whole-Game Audit Scope

Claude should audit the current game across these areas and build a new plan in exact implementation order.

### 1. Spatial / 3D Logic and Visual Truth

Goal: confirm the game is not only mathematically using board/projection truth, but also visually communicates a coherent 3D-backed space.

Review:

- board position ownership,
- projection math,
- zone dimensions,
- focused zone vs overview,
- zone travel,
- height `h`,
- block support and stack height,
- block cell discipline,
- entity footprints,
- flowers / piles / food reserves,
- battle arena spatial rules,
- garden ability radii,
- battle ability/projectile radius and arc math,
- save/load preservation of board positions,
- camera/focus behavior,
- visual grid and height legibility,
- whether blocks visually overlap or only appear to due to projection.

Specific known blocker:

- Full G0H duplicate block cell likely caused by restored block height flattening. Review `systems/saveSystem.js` and `entities/block.js`.

Questions Claude should answer:

- Is the current 3D-backed board/projection approach sufficient?
- Are visuals accurate enough for a human to understand movement and height?
- What exact tests or screenshots are needed to confirm visual truth?
- Should the next immediate phase be the block-height restore fix before X2?
- Do we need a grid overlay or improved height cues as a separate phase?

### 2. Real AI / Butterfly Society

Goal: evaluate whether the current systems produce believable living behavior, not only scripted-looking if/then output.

Important framing:

- The user wants the butterflies to feel like living creatures with emotions, memory, personality, social bonds, and cooperation.
- Do not claim literal consciousness or subjective feeling.
- It is acceptable to propose new or expanded cognition vocabulary if needed, as long as Claude explains:
  - why existing families cannot express the target behavior,
  - owner system,
  - migration path,
  - proof strategy,
  - UI surfacing plan.

Review:

- drives,
- derived feelings,
- emotion dynamics,
- memory packets,
- social edges,
- bond tiers,
- grief / long absence,
- jealousy / witnessed affection,
- pride / shame,
- loyalty under conflict,
- caregiving,
- cooperation pressure,
- communication and dialogue variety,
- misunderstanding / heard meaning,
- routine formation,
- personality influence,
- ML scoring role,
- ML value metrics,
- trace corpus size and quality,
- whether current ML is actually helpful,
- whether behavior is still mostly scripted,
- what deterministic tests are needed.

Known state:

- X1 repaired evidence observability for memories and cognition events.
- Prior ML audit showed the current ML artifact is not yet valuable enough; cadenceFactor improvements reached only part of value-band metrics.
- There is no repo trainer yet per prior review.
- Some production triggers exist, but Claude should verify all intended lived-loop paths still fire naturally.

Questions Claude should answer:

- How close are we to "real AI" in practical game terms?
- Which parts are genuinely causal and durable?
- Which parts are still scripted or cosmetic?
- What should be built next to make social behavior feel alive?
- What scenario harness lanes should Codex add so we do not rely on random long saves?
- Should X2-X5 remain the next plan, or should a broader AI believability phase be inserted?

### 3. UI Completeness, Regression, and Parity Audit

Goal: make sure UI changes did not remove or break existing features, and that all UI boxes are usable, readable, and clickable.

Known user concerns:

- colorblind mode does not work,
- trail effect settings may have been lost,
- some button clicks are not aligned with their visual buttons,
- feed filters / talking / action / learn buttons have had issues,
- DOM UI and canvas UI may not expose the same functionality,
- hover-scroll was just patched but should be validated in real play,
- inspect/journal/battle/setup/access/debug UI should not lose built-in controls.

Review all UI surfaces:

- top player buttons,
- feed panel,
- feed filters,
- DOM feed vs canvas feed,
- inspect panel,
- inspect browse/release/mate/list modes,
- butterfly journal / collection,
- roster / battle journal,
- battle setup panel,
- battle HUD,
- accessibility panel,
- colorblind mode,
- high contrast mode,
- trail effect settings,
- debug UI,
- first-session guide,
- zone overview / next-zone UI,
- save/load buttons,
- button hit rectangles vs drawn rectangles,
- scroll wheel behavior,
- keyboard shortcuts if present,
- mobile/responsive constraints if applicable.

Questions Claude should answer:

- Which UI features existed before and are now missing or unreachable?
- Which controls exist in canvas UI but not DOM UI, or vice versa?
- Which buttons have mismatched hit boxes?
- What audit should Codex implement to compare visual button rects with click rects?
- Should settings be centralized so colorblind/trails/high-contrast are not lost again?
- Does hover-scroll need a formal audit script beyond the current probe?

### 4. Visual Fidelity / Sprite Resolution

Goal: restore visible clarity of the user's high-resolution butterfly art.

Known finding:

- Original butterfly PNGs are still high-res:
  - wings are `1920x1080`,
  - body/antenna are `1080x1080`.
- Runtime scaling draws the art into tiny surfaces:
  - butterfly sizes are mostly `10` to `16`,
  - sprite scale uses `this.size / 1080`,
  - visual scale is `1.6`,
  - baked wing surfaces in captures are roughly `12x11` to `15x12`.
- This is not asset loss. It is a screen-pixel budget/downsampling problem.

Review:

- `assets/butterflies`,
- `entities/butterfly.js`,
- `core/spriteManager.js`,
- `core/renderManager.js`,
- `core/config.js`,
- sprite cache telemetry,
- close-up inspect rendering options,
- whether there should be LOD sprites or a higher creature render scale,
- keeping blocks pixel-crisp while smoothing creatures.

Questions Claude should answer:

- Should sprite clarity be fixed before or after G0H block correctness?
- What is the safest way to increase visible detail without breaking spatial fit?
- Should close-up/inspect/battle use a different fidelity LOD than far garden view?
- What screenshot/audit criteria should define "sprite clarity restored"?

### 5. Harness / Proof System

Goal: make sure the proof system catches real issues and does not false-green.

Review:

- G0H fixture and driver,
- scenario runner,
- runtime self audit,
- save continuity audits,
- block discipline audit,
- ability radius conversion audit,
- single-player autobattle audit,
- UI readability audit,
- sprite fidelity audit,
- ML on/off and value-band audits,
- trace capture quality.

Questions Claude should answer:

- Which existing audits are sufficient?
- Which audits are false-green or too narrow?
- What deterministic scenario fixtures should be added?
- Should Codex build a 7-minute human-style manual playthrough plan after scripted G0H is green?

## Planning Output Requested From Claude

Claude should produce a concrete next implementation roadmap with phases in exact order.

For each phase include:

- phase name,
- goal,
- why it comes now,
- owned files,
- forbidden files,
- exact implementation steps,
- rollback flags or rollback strategy,
- proof commands,
- screenshots/captures required,
- pass/fail acceptance criteria,
- residuals that should block human G0 capture.

Claude should not only continue the old X2-X5 sequence automatically. It should decide whether the better order is:

```text
Option A: block restore -> full G0H -> X2-X5 -> sprite/UI/AI polish
Option B: block restore -> UI parity repair -> full G0H -> X2-X5
Option C: block restore -> sprite fidelity -> full G0H -> X2-X5
Option D: a different order Claude can justify
```

## Constraints

Keep:

- Protect the player's real long-running save.
- Synthetic fixture saves and deterministic scenario saves are allowed.
- Prefer no schema bump for the immediate block-height restore.
- Keep schemaVersion v5 unless a named contradiction proves migration is required.
- Do not claim literal consciousness or subjective feeling.
- Do not promote human G0 capture until scripted G0H is honest-green.
- Keep blocks pixel-crisp if changing sprite smoothing/fidelity.
- Do not redefine `1 block = 1 board unit = 1 support/stack unit` without a named contradiction.
- ML may score choices, but durable feelings/memories/bonds should be owned by life-sim/social systems unless Claude proposes a carefully justified architecture change.

Allow:

- Claude may propose new cognition vocabulary or richer emotional/social systems if it proves current families are not expressive enough.
- Claude may propose new deterministic scenario harness lanes.
- Claude may propose UI architecture repair if DOM/canvas parity is too brittle.
- Claude may propose a fresh visual-grid/height-legibility phase if current 3D visuals are technically correct but not understandable.
- Claude may recommend broader implementation phases if the current plan is too narrow for the user's real goals.

## Desired Final Claude Deliverable

Claude should return:

1. An honest current-state verdict:
   - spatial/3D truth,
   - visual clarity,
   - AI believability,
   - UI completeness,
   - proof reliability.
2. A prioritized list of remaining contradictions and product gaps.
3. A concrete phase-by-phase implementation plan.
4. A singular copy-paste prompt for the user to give Codex next, with exact files, steps, proofs, and stop conditions.
