# Visual-First Runtime Optimization Plan

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║ Goal                                                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Make Papilionem run smoothly on real long-running saves without solving     ║
║ performance by stripping visual identity or cutting core simulation/design. ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

```text
current failure shape
┌──────────────────────────────┬─────────────────────────────────────────────┐
│ server                       │ healthy                                     │
│ browser tab                  │ overloaded / memory-heavy                  │
│ hottest steady cost          │ render + UI compositing                    │
│ secondary steady cost        │ main-thread simulation cadence             │
│ long-session risk            │ memory growth + repeated canvas work       │
└──────────────────────────────┴─────────────────────────────────────────────┘
```

## Hard Guardrails

```text
must preserve
├─ the full core game design
│  ├─ life sim
│  ├─ relationships / dialogue / memory
│  ├─ breeding / genetics / lineage
│  ├─ wild ecology
│  ├─ battle
│  └─ grounded spatial garden behavior
├─ the visual identity of the game
│  ├─ high-resolution butterflies
│  ├─ high-resolution caterpillars
│  ├─ high-resolution cocoons / chrysalises
│  ├─ readable high-resolution UI text
│  └─ butterfly trails restored as:
│     off by default | reduced | full
└─ the planned player-facing feel
   ├─ lush atmosphere
   ├─ expressive creature readability
   └─ no "optimize by making it plain" shortcut
```

### Non-Negotiable Rules

1. Do not remove or permanently downgrade core simulation systems to gain performance.
2. Do not treat lower creature resolution as the primary optimization strategy.
3. Do not lock trails off forever; keep `off` as default, but retain `reduced` and `full`.
4. Do not reduce performance pressure by making the garden visually empty or sterile.
5. Prefer architectural improvements over aesthetic concessions.
6. Any temporary visual fallback must be explicitly marked temporary and must not become the new baseline without an intentional doc decision.

## Why The Game Is Currently Demanding

```text
main-thread frame
┌────────────────────────────────────────────────────────────────────────────┐
│ simulation                                                                │
│ zone + life sim + communication + behavior + ML + battle + save cadence   │
└────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ rendering                                                                  │
│ entity draw + particles + UI draw + full-canvas compositing               │
└────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ browser pressure                                                           │
│ memory growth + GC stalls + shell-heavy redraws                            │
└────────────────────────────────────────────────────────────────────────────┘
```

The current evidence says the biggest costs are not "too many butterflies" in isolation. The real pressure comes from:

1. Multiple full-canvas layer composites every frame.
2. Text-heavy shell UI rendered on canvas instead of through cheaper DOM layout.
3. Deep simulation systems competing with rendering on the same main thread.
4. Long-session browser memory growth that makes later gameplay worse than short audits.
5. Expensive presentation work being recomputed even when the visible scene barely changed.

## Strategy

```text
preserve look
    │
    ├─ stop paying for unchanged presentation
    ├─ move expensive text/UI work off the canvas path
    ├─ cache creature visuals at high quality instead of redrawing them raw
    ├─ split deep simulation cadence away from visual smoothness
    ├─ fix memory growth in long sessions
    └─ only escalate to renderer migration if the above still fails
```

## Ordered Phase Ladder

```text
review gate
   │
   ▼
v1 shell-ui separation
   │
   ▼
v2 memory-growth audit + leak closure
   │
   ▼
v3 high-resolution creature sprite baking
   │
   ▼
v4 simulation cadence split
   │
   ▼
v5 render/composite pass reduction
   │
   ▼
v6 worker offload for non-render systems
   │
   ▼
v7 trails + visual-quality restoration pass
   │
   ▼
v8 real-save soak + public-share proof
   │
   ▼
v9 renderer escalation decision
```

## Phase Details

### v1. Shell-UI Separation

```text
move out of canvas first
├─ Feed
├─ Inspect
├─ Journal
├─ Access
└─ debug panels that are text/layout heavy
```

Owners:
- `ui/gameUI.js`
- `ui/debugUI.js`
- `core/renderManager.js`
- related shell styles/assets

Intent:
- Move text-heavy static UI out of the main canvas redraw path.
- Keep the art scene on canvas; move shell chrome and long text to DOM/CSS overlays.
- Improve UI clarity while reducing repeated canvas text/layout work.

Must preserve:
- current shell features
- current button-first flow
- inspect/feed/journal readability

Exit criteria:
- shell panels no longer require full canvas text redraw every frame
- UI remains visually consistent with current style
- focused-garden shell cost materially drops without reducing creature fidelity

### v2. Memory-Growth Audit + Leak Closure

```text
find retained growth
├─ cached graphics
├─ stale capture/session data
├─ repeated arrays/objects
├─ dialogue/feed history presentation copies
└─ effect/trail residue that never clears
```

Owners:
- `systems/telemetrySystem.js`
- `core/renderManager.js`
- `systems/communicationSystem.js`
- `systems/specialEffects.js`
- capture/export tooling

Intent:
- Add stronger memory attribution for long sessions.
- Identify growth across 10-, 20-, and 40-minute runs on lived-in saves.
- Close leaks before restoring more visual richness.

Must preserve:
- session capture
- dialogue history
- feed/thread history needed for player reading

Exit criteria:
- memory trend is measured and attributable
- no obvious unbounded growth in normal play sessions
- browser process growth is substantially flatter than current long-session behavior

### v3. High-Resolution Creature Sprite Baking

```text
appearance key
   └─▶ baked sprite cache
        ├─ butterfly
        ├─ caterpillar
        └─ chrysalis
```

Owners:
- creature entity render paths
- `core/renderManager.js`
- sprite/image cache helpers

Intent:
- Reintroduce high-resolution butterflies, caterpillars, and cocoons/chrysalises.
- Preserve visual clarity by baking appearance variants once and reusing them until appearance changes.
- Avoid paying full reconstruction cost every frame.

Must preserve:
- exact appearance individuality
- sex/variant/genetic readability
- battle readability

Exit criteria:
- high-resolution creature assets are back
- render cost does not regress to current freeze-prone levels
- cached sprite lifetime is stable and leak-safe

### v4. Simulation Cadence Split

```text
60 fps feel target
├─ flight / movement / battle motion       high cadence
├─ life-sim deep evaluation                staggered cadence
├─ ecology refresh                         staggered cadence
├─ ML scoring                              staggered cadence
└─ dialogue/feed shaping                   event-driven where possible
```

Owners:
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/mlInferenceSystem.js`
- ecology update path

Intent:
- Separate "must feel smooth visually" from "must think deeply every frame."
- Keep flight and battle motion responsive while spreading heavier sim work across frames.

Must preserve:
- emergent behavior integrity
- social follow-through
- ecology correctness
- battle fairness/readability

Exit criteria:
- no core sim family is silently disabled
- cadence strategy is documented and auditable
- update spikes are materially reduced on long-running saves

### v5. Render / Composite Pass Reduction

```text
reduce redundant full-screen work
├─ fewer active buffers
├─ fewer empty composites
├─ smarter dirty-region / dirty-layer reuse
└─ static background stays cached until state actually changes
```

Owners:
- `core/renderManager.js`
- background/atmosphere layer management
- battle scene composition

Intent:
- Pay only for layers that changed.
- Keep rich scene composition, but stop recompositing unnecessary full-screen buffers.

Must preserve:
- atmosphere
- zone backgrounds
- battle field readability
- covered/behind-wall spatial staging

Exit criteria:
- composite cost is materially lower than the current baseline
- scene still looks like the intended game
- no major visual regression in battle or focused garden

### v6. Worker Offload For Non-Render Systems

```text
main thread keeps
├─ input
├─ animation
├─ entity movement
└─ final draw

worker candidates
├─ ML feature prep / inference
├─ ecology summary prep
├─ telemetry aggregation
└─ dialogue/feed formatting helpers
```

Owners:
- `systems/mlInferenceSystem.js`
- telemetry/export paths
- ecology summary builders
- worker bootstrap plumbing

Intent:
- Reduce main-thread contention without cutting game depth.
- Offload safe non-render computation first.

Must preserve:
- deterministic enough game behavior for audits
- fallback paths when workers are unavailable
- save/load correctness

Exit criteria:
- worker-backed tasks are measurable and stable
- main-thread frame time improves
- no logic ownership confusion is introduced

### v7. Trails + Visual-Quality Restoration Pass

```text
restore intended visual options
├─ creatures high-res
├─ UI text sharp
├─ trails off by default
├─ trails reduced available
└─ trails full available
```

Owners:
- accessibility/settings UI
- render trail system
- creature render settings
- player docs

Intent:
- Reintroduce the intended visual richness after the earlier architecture wins are in place.
- Make trails a supported setting again without making them the default.

Must preserve:
- accessibility control
- smoothness under `off`
- graceful scaling under `reduced` and `full`

Exit criteria:
- high-resolution creature visuals are restored
- trail settings are present and documented
- `off` remains default
- `reduced` and `full` are stable options rather than hidden regressions

### v8. Real-Save Soak + Public-Share Proof

```text
prove on lived-in saves
├─ calm garden watch
├─ shell-heavy reading
├─ zone travel
├─ battle
├─ save/load
└─ long session continuity
```

Owners:
- runtime audits
- session capture tooling
- public-share docs / triage logs

Intent:
- Validate the new architecture on the saves that actually used to freeze.
- Use real capture/export evidence, not only synthetic audit worlds.

Must preserve:
- long-running butterflies
- relationship continuity
- memory/emotion continuity
- environment refresh correctness

Exit criteria:
- no freeze / black-screen on the tested real saves
- sustained smoothness is acceptable in normal play
- public-share hardening can continue from a stable visual baseline

### v9. Renderer Escalation Decision

```text
only if needed
current 2D layered renderer
        │
        ├─ enough after v1-v8? ──▶ keep current renderer
        │
        └─ still not enough? ───▶ evaluate batched WebGL/sprite renderer
```

Owners:
- architecture/docs decision layer
- rendering subsystem

Intent:
- Avoid a renderer rewrite unless the cheaper high-value wins have already failed.
- Make a deliberate call instead of drifting into a rewrite out of frustration.

Exit criteria:
- documented keep/escalate decision
- if escalating, a separate approved renderer plan is opened

## Proof Requirements

```text
every phase must prove
├─ visual identity preserved
├─ core design preserved
├─ no new long-session regression
└─ measured performance win in the target lane
```

Required proof lanes:
1. focused garden, calm watching
2. shell-heavy reading (`Feed`, `Inspect`, `Journal`)
3. battle presentation
4. long-running save continuity
5. exported session capture on a lived-in save

## What We Explicitly Will Not Do

```text
not acceptable as the primary strategy
├─ permanently lowering butterfly/caterpillar/chrysalis resolution
├─ removing trails entirely
├─ deleting atmosphere to fake smoothness
├─ gutting life sim / dialogue / ecology cadence until the game feels empty
└─ redefining "optimized" to mean "less of the game is happening"
```

## Claude Review Ask

Use this plan as a review artifact and ask Claude to critique:

1. whether the phase order is correct
2. whether any prerequisites are missing
3. whether any phase risks silently violating the visual/design guardrails
4. whether any cheaper high-impact optimization path is missing
5. whether the proof requirements are strong enough before implementation begins

## Recommended Next Step

```text
now
├─ external review on this plan
└─ no implementation until the review is incorporated
```
