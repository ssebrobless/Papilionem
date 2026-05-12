# Papilionem Full Success Refined Plan - 2026-05-06

Author: Codex
Branch reviewed: `codex/milestone-freeze-playtest`
Goal frame: reach a complete, player-legible butterfly society with stable board-backed 3D logic, usable UI, functional environmental objects, expressive social behavior, and ML-supported decision making. This means believable artificial life, not literal consciousness or subjective feeling.

## 1. Current State Map

```
+-----------------+------------------------------+---------------------+
| Layer           | Current evidence             | Remaining gate      |
+-----------------+------------------------------+---------------------+
| Spatial / 3D    | Projection unit tests pass   | Visual truth packet |
| Environment     | Ecology audits pass          | Human-legible loops |
| Social AI       | Causal memories/events pass  | Dialogue naturalness|
| ML              | On/off audit passes          | Weak policy closure |
| Sprites/visuals | High-res work landed         | Audit timeout split |
| UI/controls     | Hover-scroll audit passes    | Full settings matrix|
| Training/battle | Battle has proof lanes       | Training phase fail |
+-----------------+------------------------------+---------------------+
```

The game is no longer in a "rebuild the whole foundation" state. The board/projection model, save continuity, block cells, ecology objects, social memory storage, and ML on/off wiring all have meaningful proof. The remaining work is about making those systems reliably visible, emotionally legible, and strong enough to survive honest player captures.

Approximate honest read:

- Spatial/3D foundation: strong, around 85%. Projection and hover/board proof are green, but the player still needs a visual truth packet that confirms grid, height, occupancy, shade, and zone boundaries look accurate in real scenes.
- Environmental objects: strong mechanically, around 75%. Dirt cleanup, pollen follow-through, reserve food, and shade-rest behavior are proven in audits, but object affordances still need human-readable presentation and longer lived-play review.
- Believable society: improving, around 70%. LifeSim memory, relationships, cognition triggers, and causal inspect/feed UI now do real work. The weak point is language naturalness and longer social arcs that feel like conversation instead of signal snippets.
- Real ML integration: partial, around 45%. ML is integrated and distinguishable from heuristic mode, but policy quality is mixed and some ML audit reports still warn. It is not yet "learning AI" in the player's sense.
- UI/control reliability: medium-high, around 70%. Hover-scroll is now proven. Colorblind, high-contrast, trail settings, hit-box alignment, persistence, and DOM/canvas parity need a full matrix audit.
- Human G0 readiness: not yet. A human capture should wait until the training gate, sprite audit reliability, ML policy clarity, dialogue naturalness, and UI matrix are closed.

## 2. Latest Evidence Used

```
+----------------------------------+--------+-----------------------------------+
| Proof                            | Result | Evidence path                     |
+----------------------------------+--------+-----------------------------------+
| Runtime self-audit               | Pass   | qa_screenshots/runtime_self_audit |
| Spatial projection unit tests    | Pass   | qa_screenshots/spatial_projection |
| Hover-scroll audit               | Pass   | qa_screenshots/r_hover_scroll     |
| Ecology dialogue causality       | Pass   | qa_screenshots/ecology_dialogue   |
| Ecology human packet             | Pass   | qa_logs/ecology_human_review      |
| ML on/off capture audit          | Pass   | qa_screenshots/ml_on_off_capture  |
| ML phase m6 audit                | Warn   | qa_screenshots/ml_phase_m6_audit  |
| Final grand plan audit           | Warn   | qa_screenshots/final_grand_plan   |
| Sprite fidelity audit            | No bar | Timed out before report           |
+----------------------------------+--------+-----------------------------------+
```

Important specific findings:

- Ecology audit `2026-05-06T02-03-40-932Z` showed 124 dialogue events, 54 ecology dialogue events, 17 cleanup objects cleaned, 22 pollen follow-through events, 6/6 reserve food uses, 38 shade-rest arrivals, and 34 shade-rest settling sleep events.
- Hover-scroll audit `2026-05-06T02-12-30-935Z` proved DOM feed/access/inspect/journal/debug scroll and canvas feed/inspect/journal/accessibility scroll.
- ML phase m6 audit `2026-05-06T02-18-03-343Z` warned because corpus/eval thresholds and posture-to-action mapping failed. `actionFamily`, `targetPreference`, and `signalChoice` were better than heuristic, but `riskPosture` was tied at zero and `autobattlePosture` was worse than heuristic.
- ML on/off audit `2026-05-06T02-22-11-632Z` passed with static policy evidence and heuristic fallback evidence. It referenced `assets/ml/m8-garden-policy.json`, which means the next ML phase must reconcile the m6 warning with the apparent m8 on/off pass.
- Final grand plan audit `2026-05-06T02-23-58-907Z` warned because the training phase did not observe `training:drillStarted`, `training:drillCompleted`, or `teaching:completed`.
- Sprite fidelity audit timed out before producing a report. That is not a sprite failure by itself, but it means sprite proof is currently too slow or too coupled to use as a reliable gate.

## 3. Non-Negotiable Constraints

> **Amendment 2026-05-12 (SR0):** the original "do not claim literal sentience"
> clause is retired and replaced by the honest-claims register in
> `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`. FSP9 and FSP10 are
> refolded as subtasks of the SR ladder; see SR0 section 9 for the updated
> promotion criteria. Save-schema handling is now governed by
> `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`, which is authoritative over
> the `Save schema remains v5` line below (the registry is at `schemaVersion =
> 4` and SR2 bumps it to `5` under joint signoff).

- Do not wipe the player's real long-running save.
- Save schema migrations are governed by `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`. All additions are `defaultIfMissing`; protected-state groups are never overwritten.
- Honest claims about consciousness are governed by `docs/SR0-SENTIENCE-TARGET-DEFINITION-2026-05-12.md`. The project claims functional analogues of the engineerable layers (access consciousness, functional consciousness, self-modeling, metacognition, theory of mind, intrinsic motivation, online learning, narrative self). The project does not claim phenomenal consciousness, qualia, subjective experience, suffering, or moral-patient status.
- The target is a butterfly society whose agents are behaviorally consistent with the engineerable layers of consciousness. The 30-minute behavioral bar is defined in SR0 section 4 (B1 autobiographical reference, B2 metacognition, B3 theory-of-mind divergence, B4 identity-perturbation recovery).
- ML may score choices and, from SR6 onward, update per-archetype weights from lived experience, but lifeSim owns durable feelings, memories, relationships, and social state. ML never writes lifeSim fields.
- No external API calls, LLM dependencies, or network reach inside the running game (SR0 self-containment rule).
- Do not re-found the spatial system or move to a volumetric engine unless a named contradiction proves board/projection contracts are insufficient.
- Sun-court remains Training Grounds. No ambient blocks there.
- 1 block = 1 board unit = 1 support/stack unit.
- New cognition vocabulary is allowed only after proving the existing families cannot express a required behavior. Prefer wiring, evidence, and expression improvements first. SR2/SR3/SR4/SR7 may introduce new vocabulary under their owned scopes.

## 4. Refined Phase Plan

```
+-------+------------------------------------+--------------------------+
| Phase | Purpose                            | Why now                  |
+-------+------------------------------------+--------------------------+
| FSP0  | Proof registry + audit reliability | Prevent false progress   |
| FSP1  | Training grounds closure           | Current hard audit fail  |
| FSP2  | Visual 3D truth packet             | Prove board logic visual |
| FSP3  | Sprite fidelity proof split        | Current audit times out  |
| FSP4  | UI/control matrix                  | User reports lost UI bits|
| FSP5  | Dialogue naturalness               | Feed still feels stale   |
| FSP6  | Social-life long soak              | Prove durable society    |
| FSP7  | Environment affordance polish      | Make ecology readable    |
| FSP8  | ML learning closure                | Policy quality mixed     |
| FSP9  | Battle/ability spatial closure     | Ensure combat math holds |
| FSP10 | Final G0H + human capture gate     | Promote only after green |
+-------+------------------------------------+--------------------------+
```

### FSP0 - Proof Registry + Audit Reliability

Goal: create a single current-state proof registry and make the slow/fragile audits runnable as smaller gates.

Owned areas:

- `docs/`
- `scripts/run-r-sprite-fidelity-audit.js` if splitting lanes is required
- audit report readers only

Steps:

1. Write or update a proof registry listing every current audit lane, expected status, latest report path, and residual risk.
2. Split sprite fidelity into a fast fidelity lane and a separate long pressure lane, or add flags such as `--fast-fidelity`, `--pressure`, and `--screenshots-only`.
3. Ensure Playwright/browser audits run sequentially in orchestration scripts to avoid parallel launch collisions.
4. Add a short "cannot promote" list: training gate warning, ML policy warning, sprite proof timeout, UI settings matrix missing.

Acceptance:

- The proof registry names every pass/warn/fail and report path.
- Sprite fidelity proof can produce a report within a reasonable timeout.
- No gameplay behavior changes.

### FSP1 - Training Grounds Closure

Goal: close the current final-grand-plan warning where training activity is not observed.

Owned areas:

- Training/teaching systems only if production triggers are wrong.
- `scripts/run-final-grand-plan-audit.js` only if the audit no longer drives current behavior correctly.
- Feed/inspect UI only if training events fire but are invisible.

Steps:

1. Trace the expected training loop from sun-court zone state to drill selection to event emission to feed/inspect visibility.
2. Determine whether production behavior is missing or the audit is using stale event names.
3. Patch the smallest owner:
   - If drills do not start, fix the training decision/availability path.
   - If drills start but do not emit, add the production event.
   - If events emit but audit misses them, update the audit to current names while preserving strictness.
4. Verify sun-court still has no ambient blocks.

Acceptance:

- `node scripts/run-final-grand-plan-audit.js` passes the training phase.
- At least one lived training event is visible in the feed or inspect evidence.
- Runtime, spatial, block-cell, and save-continuity audits stay green.

### FSP2 - Visual 3D Truth Packet

Goal: prove the board-backed 3D logic looks correct to a player.

Owned areas:

- Rendering overlays and screenshots.
- Existing projection helpers.
- No projection rewrite unless a named contradiction appears.

Steps:

1. Capture each zone in focused mode with grid overlay, object cells, height markers, and zone bounds.
2. Capture block stacks at h=0, h=1, h=2 with butterfly/flower/dirt occupancy nearby.
3. Capture shade under overhead blocks and confirm it maps to board cells rather than screen guesses.
4. Capture edge travel lanes and confirm butterflies leave toward real map edges, not old doorway corridors.

Acceptance:

- Visual packet includes all four zones, stack/height examples, occupancy examples, shade examples, and edge travel examples.
- No object appears to occupy a different board cell than its visual footprint.
- Any contradiction becomes a named ticket, not a rebuild by default.

### FSP3 - Sprite Fidelity Proof Split

Goal: turn sprite clarity from a user impression into a repeatable proof.

Owned areas:

- `core/spriteManager.js` only if the bake pipeline still destroys detail.
- `entities/butterfly.js` only for draw options/LOD use.
- `scripts/run-r-sprite-fidelity-audit.js`.

Steps:

1. Make the audit output close-up crops and source/bake metadata quickly.
2. Assert creature bakes use high-resolution intermediate surfaces and downscale smoothly at draw time.
3. Verify blocks remain crisp pixel-art while butterflies remain smooth.
4. Keep memory pressure gates separate from fidelity gates.

Acceptance:

- Fast sprite fidelity audit completes and writes report/screenshots.
- Butterfly closeups preserve visible wing/body detail.
- Cache hit rate and memory caps remain acceptable in the pressure lane.

### FSP4 - UI/Control Matrix

Goal: prove the user-facing UI did not lose settings or clickable behavior while systems were added.

Owned areas:

- `ui/`
- UI audit scripts
- settings persistence audit helpers

Checks to include:

- Hover-scroll over every scrollable DOM and canvas panel.
- Colorblind mode applies and persists.
- High contrast applies and persists.
- Trail effect settings apply and persist.
- Button hit boxes align with visible button bounds.
- Feed, talk/action/learn filters, inspect, journal, debug, accessibility, zone controls, and settings all remain reachable.
- DOM/canvas parity for feed thread details including heard-meaning and action-causality lines.

Acceptance:

- A matrix report lists each UI feature as pass/fail/residual with screenshots.
- No known UI feature silently missing.

### FSP5 - Dialogue Naturalness

Goal: move feed text from abstract signal fragments toward human-esque social language while preserving systemic causality.

Owned areas:

- `systems/communicationSystem.js`
- feed rendering and dialogue audits
- phrase template/corpus files if present

Steps:

1. Build a stale-phrase detector for lines like "the air shifted" when used too often or without concrete social content.
2. Add dialogue scenario lanes for greeting, checking on someone, asking for help, thanking, declining, sharing food/pollen, warning, apologizing, repair after conflict, and remembering a prior event.
3. Require generated lines to cite a motive/source internally while sounding like social speech externally.
4. Show player-readable conversation threads with speaker, target, meaning, heard meaning when misunderstood, and follow-through action.

Acceptance:

- Lived dialogue audit shows varied social speech, not only environmental omens.
- At least one conversation has a multi-turn arc with memory continuity and a later behavior change.
- No claim that butterflies are literally conscious.

### FSP6 - Social-Life Long Soak

Goal: prove the society has durable social lives, not one-shot scripted events.

Owned areas:

- long-soak audits
- scenario fixtures
- lifeSim metrics only if observability is missing

Metrics:

- Repeated partner choice.
- Bond tier transitions.
- Rivalry avoidance or repair.
- Caregiving recurrence.
- Grief/absence after death or separation.
- Loyalty under competing needs.
- Work sharing around cleanup, pollen, food reserve, shade, and building.
- Zone migration entropy and mean distinct zones visited per entity.

Acceptance:

- 30-60 minute synthetic and lived soaks produce social arcs without direct helper calls.
- The report includes event evidence and durable memory evidence.
- Any "memory without event" or "event without visible behavior" becomes a named bug.

### FSP7 - Environmental Affordance Polish

Goal: make environmental objects create real, readable reasons to cooperate.

Owned areas:

- flower lifecycle
- dirt/compost/pollen/reserve food systems
- block occupancy and shade presentation
- audits and UI surfacing

Rules to preserve or verify:

- Dirt piles occupy a full board unit and block flower spawn, flower planting, and block placement.
- Flowers occupy a board unit and block block placement.
- Wild flower spawn is capped per zone.
- Flower use can produce food, reserve food, pollen charges, or building material according to the final contract.
- Pollen charges expire, can be planted, and can be handed off when implemented.
- Shade/rest under overhead blocks is board-derived and trait-sensitive.

Acceptance:

- A player can visually understand why clearing, planting, handing off pollen, storing food, and building shade matter.
- Butterflies use the objects organically in a lived run, not only in teleported fixtures.

### FSP8 - ML Learning Closure

Goal: make ML genuinely beneficial while keeping durable truth in lifeSim.

Owned areas:

- ML trainer and corpus scripts
- `assets/ml/`
- ML audit scripts
- no lifeSim ownership transfer

Steps:

1. Reconcile current artifact state: m6 audit warns while m8 on/off passes.
2. Identify current default model and shipped cadence.
3. Grow corpus for weak policy families, especially `riskPosture` and `autobattlePosture`.
4. Train a candidate model only with held-out evaluation and per-policy no-regression gates.
5. Promote only if candidate beats heuristic and current model on required policy families and improves lived value metrics.
6. Keep an explicit ML-off fallback.

Acceptance:

- ML phase audit passes without warnings.
- On/off audit shows ML changes behavior and improves value, not merely differs.
- `autobattlePosture` is no longer worse than heuristic.
- The report explains what the model learned and where it should not be trusted.

### FSP9 - Battle / Ability Spatial Closure

Goal: ensure attacks, projectiles, garden abilities, and battle abilities use the intended board/top-down logic.

Owned areas:

- ability radius conversion audit
- single-player autobattle audit
- battle presentation proof
- ML battle posture evaluation

Steps:

1. Confirm garden radius uses board units and height/occupancy rules where relevant.
2. Confirm battle remains top-down per contract but has coherent position/radius/projectile math.
3. Capture projectile/attack paths with overlays.
4. Confirm ML battle posture does not degrade battle choices.

Acceptance:

- Ability radius conversion audit passes.
- Single-player autobattle audit passes.
- Battle screenshots make attack/projectile space visually understandable.
- ML battle posture policy meets no-regression gate.

### FSP10 - Final G0H + Human Capture Gate

Goal: promote only when the game reads as a complete, coherent build.

Required proof bundle:

- Runtime self-audit pass.
- G0H scripted playthrough pass with all current lanes.
- Final grand plan audit pass.
- Spatial projection and visual 3D truth packet pass.
- Sprite fidelity fast audit pass.
- UI/control matrix pass.
- Ecology dialogue causality pass.
- Long-soak society pass.
- ML phase and ML on/off pass with no critical warnings.
- Ability radius and autobattle pass.
- Human review packet with clear residuals, if any.

Promotion rule:

- If any lane is warn/fail, do not call the game fully successful. Name the residual and plan the next smallest fix.

## 5. Why This Order

The order deliberately does not start by adding more "intelligence." The current bottleneck is not just missing cognition. It is proof reliability, visibility, training/battle closure, dialogue quality, and ML value. Adding more hidden state before these gates would make the system harder to understand without making it feel more alive.

```
Reliable proof
    |
    v
Visible world truth ---> UI that exposes truth
    |                         |
    v                         v
Environmental reasons --> Natural dialogue
    |                         |
    v                         v
Long social arcs ------> ML learns useful choices
    |
    v
Human G0 capture
```

## 6. First Phase Recommendation

Start with FSP0, then immediately FSP1.

FSP0 is small but important: it prevents us from treating timed-out or stale audits as success. FSP1 then attacks the only current hard failure in the final grand plan audit: the training grounds do not produce the expected training/teaching evidence.

Do not start FSP5/FSP6/FSP8 until FSP1-FSP4 are at least green enough to give reliable player-visible evidence. The "real AI" goal depends on the player seeing and understanding what the AI is doing.

## 7. Refined Implementation Prompt Skeleton

Use this only after the user approves starting implementation:

```
Codex, implement FSP0 from docs/FULL-SUCCESS-REFINED-PLAN-2026-05-06.md.
Do not change gameplay behavior. Create/update the current proof registry,
make sprite fidelity proof runnable as a fast segmented gate, and ensure
browser-heavy audits are not launched in conflicting parallel batches.
Run the affected audit(s), report exact paths, then stop before FSP1.
```

After FSP0 is reviewed, FSP1 should be a separate patch focused on training grounds closure.
