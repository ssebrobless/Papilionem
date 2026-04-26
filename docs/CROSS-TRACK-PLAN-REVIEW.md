# Cross-Track Plan Review — Findings + Refinement Asks

> Review of the active planning layer across the three child tracks under `public-share readiness`:
> runtime (visual-first), spatial unification, and social cognition.
>
> Purpose of this doc: capture every cross-track problem found in one place, with concrete, scoped edits to land before implementation.

---

## Scope Of Review

Docs reviewed:

1. `docs/ACTIVE-PLAN-REGISTRY.md`
2. `docs/ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md`
3. `docs/VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md`
4. `docs/ACTIVE-SPATIAL-UNIFICATION-BOARD.md`
5. `docs/SPATIAL-UNIFICATION-ROADMAP.md`
6. `docs/ACTIVE-SOCIAL-COGNITION-BOARD.md`
7. `docs/SOCIAL-COGNITION-ROADMAP.md`

Context docs pulled for grounding:

- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/CURRENT-SPATIAL-TRUTH.md`
- `docs/BASELINE.md`

Hard constraints preserved:

```text
preserve
├─ no "fix performance by gutting the look"
├─ no removal of core life-sim / social / genetics / battle identity
├─ UI layers may surface truth but never own it
├─ ML may score but never own durable emotions / memories / edges
├─ long-running saves (butterfly identity, memories, relationships, lineage) are sacred
├─ spatial work unifies ONE canonical board / unit / occupancy truth
└─ social work must produce LATER behavior, not only prettier text
```

---

## Findings (ordered by severity)

### F1. No shared save-migration contract across three tracks that all touch save
Runtime (`v0.5`, `v7`), spatial (`s7`), and social (`n8`) each declare an independent save-migration phase with overlapping "must preserve" lists. There is no single save-schema version number, no combined migration ledger, and no rule for which track owns `systems/saveSystem.js` when two tracks converge on it. **This is the single most load-bearing coordination gap.** Whichever track ships first silently locks schema assumptions the other two must chase.

### F2. v0 baseline is being taken on provably-wrong spatial geometry
`CURRENT-SPATIAL-TRUTH.md` and `ACTIVE-SPATIAL-UNIFICATION-BOARD.md` both state the current roam polygon is "narrower than the intended board", doorway routes compensate for geometry mismatch, and lower play area is underused. `ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md` also notes the v0 battle lane times out on the first real-save run. Measuring runtime deltas against a baseline captured on the wrong geometry will be invalidated the moment `s2` expands bounds. Either freeze geometry for the v0 baseline OR defer the baseline until after `s3`.

### F3. Ownership collision on `gameUI.js` / Feed / Inspect
Runtime `v1` moves Feed, Inspect, Journal, Access into DOM panels. Social `n7` then declares `ui/gameUI.js` as a primary owner and says "feed shows distinct exchange texture" / "Inspect shows real chemistry". Two plans rewrite the same surfaces in opposite directions on overlapping timelines, with no handshake about the state-shape contract between them. `DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md` already says "gameUI must never invent trust or attraction shifts from feed formatting" — that rule is even harder to enforce during a canvas-to-DOM migration that ships at the same time as social-surface deepening.

### F4. v4 cadence split is premature relative to n1–n6
Runtime `v4` proposes life-sim deep eval every 6 frames, ML every 12 frames, dialogue event-driven. Social `n1–n6` are about to materially expand what deep life-sim and social ML compute (pair chemistry, group tone, reputation, witnessed-interaction residue). Freezing cadence before the social feature set is locked means either `v4` budgets are blown by `n3–n6` and must be re-tuned, or `n3–n6` are forced into a cadence chosen before their work. Cadence belongs downstream of `n1`.

### F5. Baseline / proof gap on the social track
`n0` produces a qualitative "repeated-line / repeated-motive list". No structured measurement (motive-frequency histogram, pair-distinctness score, follow-through rate) is required. Later phases have no way to say "n3 made pair chemistry 30% more distinct" the way runtime phases can cite `avgRenderMs −30%`. The non-negotiable "later behavior, not prettier text" is unenforceable without a measurement harness.

### F6. "Default on" v0.5 flags defeat the phase-rollback invariant
Registry has four v0.5 flags shipping `default true` (`pauseWhenHidden`, `asyncImageDecode`, `telemetryRingCap`, `textMeasureCache`). The refined plan's own rule is "A flag ships off until the phase's exit criteria are met on the baseline save." The rule is violated at v0.5 before v0 closes. Either ship those flags default-off and flip after exit criteria, or carve out a narrow exception with a rollback rule.

### F7. `adaptiveQualityScaler` (v5) and `mainRenderScale` (v5) can contradict the player
`mainRenderScale` is a player setting (0.75–1.25). `adaptiveQualityScaler` auto-ramps particles / foliage / background cadence when p95 breaches budget. Nothing says how they negotiate. If a player sets 1.25× but the scaler auto-ramps, the player's expressed visual preference is being silently overridden — the original plan's "no silent downgrade" rule is violated.

### F8. Review-gate "named reviewer" is undefined
Review-gate checklist item 5 requires "one named reviewer has signed off". No rubric, no authority question answered, no default. On a solo project the gate will be informally bypassed. Replace with a concrete rubric.

### F9. Three "active" boards with no arbitration rule
Registry lists runtime, spatial, and social all as `active child`. No doc says which takes priority when two collide on the same file. `core/gameCore.js`, `systems/saveSystem.js`, `core/config.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `ui/gameUI.js` all appear as primary owners on multiple boards.

### F10. v7 trails has no cross-reference to social/emotion state
Trails are a natural emergent social signal (longer when excited / social, faded when withdrawn). `v7` defines them as accessibility-only. The social track never mentions trails as an output channel. Missed hook, not a defect — but it shows the tracks aren't talking to each other about shared surface areas.

### F11. v8 soak is conflated across all three tracks
`v8 real-save soak + public-share proof` uses the same lived-in save as `s7` and `n8` will. If all three land in the same soak, a freeze cannot be cleanly attributed to runtime, spatial, or social. Split `v8` into `v8a runtime-only proof` (on a spatial+social frozen save) and `v8b full-stack proof` (after s7 and n8 land).

### F12. Board ↔ plan disagreement on owner files
`ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md` lists `sketch.js` and `index.html` among primary owners; the refined plan's work items don't reference them. Minor, but means board and plan disagree on deliverables.

---

## Cross-Track Sequencing Critique

```text
stated order (per registry):   runtime ∥ spatial ∥ social  (all active in parallel)
real dependency graph:
                     spatial s0–s3  ────┐
                                        ├──▶  runtime v0 (valid baseline)
                     runtime v0.5      ─┘
                     runtime v1 ───┐
                     social  n0–n1 ┴──▶  social n3–n6 ─────┐
                                                             ├──▶ runtime v4 (cadence)
                     runtime v2+v3+v5 ───────────────────────┼──▶ runtime v6 worker
                     spatial s1–s6    ───────────────────────┘
                     (all migrations must merge before v7/s7/n8)
```

### Move earlier
- Spatial `s0` (audit) and `s1` (unit contract) should run **concurrently with, or before, runtime `v0`**. Expanding bounds later invalidates the baseline.
- Social `n1` (family lock) should run **before runtime `v4`**. Cadence windows depend on what actually ticks.
- A new cross-track save-schema contract must land **before any of v7 / s7 / n8** begins migration work.

### Move later
- `v4` cadence split gated on `n1` family lock.
- `v8` splits into `v8a` (runtime-only, frozen save) and `v8b` (full-stack, post-migration).

### Parallel-safe
- Runtime `v0.5` items (except `saveStoreIndexedDbOnly`) are safe alongside `s0` / `n0`.
- `v2` leak closure is mostly parallel-safe with `s0` / `n0`.

### Must be gated
- `v4` gated on `n1`.
- `v5` gated on `s3` (zone-boundary invalidation rules would otherwise bake in wrong geometry).
- `v7` / `s7` / `n8` all gated on the shared save-migration contract.
- `v8` gated on `s7` and `n8` landing (or explicitly scoped to runtime-only).

---

## Missing Prerequisites (must lock before implementation)

### P1. Save schema versioning + protected-state registry
One doc listing every persistent field `saveSystem.js` writes, grouped by owner (identity, memory, relationship edges, lineage, progression, spatial, social summary, settings). Each field tagged with `owner-track` and `migration-safe vs migration-derives`. Precondition for v7 / s7 / n8.

### P2. Geometry freeze commitment
Either commit to freezing the current roam polygon / placement region for the duration of v0–v3, or run `s0`–`s2` first and take v0 baseline after. No third option.

### P3. Shared-file arbitration table
For every file listed as a primary owner on more than one board (`core/gameCore.js`, `systems/saveSystem.js`, `core/config.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `ui/gameUI.js`), name one track as current file-owner. PRs from other tracks must declare review pass-through.

### P4. Social measurement harness
Before `n0` closes, adopt at least three measurable social signals:
- motive-family frequency distribution
- pair-distinctness (Jensen–Shannon or similar across pair-line distributions)
- follow-through rate (fraction of `anchoring` residue bands producing visible behavior within N minutes)

Without these, `n3–n5` cannot produce falsifiable wins.

### P5. Sim-cadence boundary contract
`docs/SIM-CADENCE-CONTRACT.md` co-owned by runtime-v4 and social-n1. Names: which systems tick every frame, which are cadence-eligible, minimum tick interval that preserves emergent behavior. The current v4 numbers (6 / 12 / 30 frames) are guesses.

### P6. ML boundary enforcement test
`COGNITION-ML-CONTRACT.md` says ML doesn't own drives / emotions / memories / edges. No test enforces it. Add a simple audit: `systems/mlInferenceSystem.js` must not mutate any field inside the protected-state registry (P1). Run it in CI before `n6`.

### P7. Review-gate rubric
Replace "one named reviewer" with a concrete checklist: guardrails re-read, save registry signed, geometry-freeze decision recorded, cadence contract signed, social baseline harness exists. Self-review is fine; pro-forma review is not.

### P8. Rollback rule for default-on flags
If a v0.5 default-on flag causes a regression, how is it rolled back? Answer lives in the registry, not in folklore.

---

## Boundary Check

### One-owner-per-truth violations
- **Save migration:** three owners (v7, s7, n8). Needs arbitration.
- **Shell UI surfaces:** v1 and n7 both rebuild Feed / Inspect. Needs handshake on state shape.
- **`core/config.js`:** runtime flags, spatial config, sim-cadence values all land here. One file, three boards, no owner.

### UI truth leakage
- v1 DOM panels pass state via `eventBus` — fine — but no rule prevents a panel from holding filter / sort / grouping state as if it were session truth. Extend the `DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md` "gameUI never invents" rule to the new `ui/dom/` layer.

### ML / social ownership drift
- `n6` lists feature groups (pair chemistry, clique comfort/tension, witnessed social context). If any of those are introduced by `n6` rather than derived from `n1` families already locked, `mlInferenceSystem.js` has quietly become a source of truth for a social construct. Explicit rule: ML reads from `lifeSimSystem.js` / social summaries; ML never instantiates a new durable social field.
- `v4` lets ML outputs go stale up to 12 frames. Dangerous if any downstream reader treats ML output as durable state between refreshes. Readers must handle a "last-valid" flag.

### Spatial-unit / board-boundary ambiguity
- `s1` locks "1 block = 1 board unit = 1 support/stack unit" but `CURRENT-SPATIAL-TRUTH.md` still references the 18×18 iso debug grid as "still used for conversion helpers". Keep debug grid separate from the board contract or retire it in `s1`. Two conversion models cannot coexist.
- `s2` bounds expansion happens before `s4` footprint unification. If any entity family had an ad-hoc clearance that secretly assumed the old boundary, bounds expansion will reveal it as a placement bug. Add a mandatory footprint sweep to `s2` exit criteria.
- `v5` dirty-gating keys on "zone boundary crossing" — which is exactly what `s3` redraws. Correct to gate v5 on s3.

---

## Concrete Edits To The Plans

### `docs/ACTIVE-PLAN-REGISTRY.md`
- Add "Shared Files / Arbitration Owner" table naming one track per contested file.
- Add "Shared Contracts" row listing: save-schema registry, sim-cadence contract, spatial-unit contract, social-family lock, cognition-ML contract.
- Add "Cross-Track Gates" row: `v0 ← geometry-freeze`, `v4 ← n1`, `v5 ← s3`, `v7/s7/n8 ← P1`, `v8 split`.

### `docs/VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md`
- Prerequisite block at the top of v0: "Geometry freeze commitment required before baseline capture. If not frozen, v0 must rerun after `s3`."
- Flip the four v0.5 default-on flags to default-off until v0.5 exit criteria close; flip defaults at the end of v0.5 (not at introduction).
- Add to v4: "Gated on `n1` family lock. Cadence values must be proposed in `SIM-CADENCE-CONTRACT.md` with social-n1 as a co-owner."
- Add to v5 work items: "Negotiation rule — `adaptiveQualityScaler` never reduces quality below what `mainRenderScale` establishes as the player-expressed floor. Player setting is a hard lower bound on particles / foliage / background cadence."
- Split v8 into:
  - `v8a runtime-only proof` on a spatial+social frozen save.
  - `v8b full-stack proof` post-migration.

### `docs/ACTIVE-SPATIAL-UNIFICATION-BOARD.md` and `docs/SPATIAL-UNIFICATION-ROADMAP.md`
- Add to `s0` deliverables: "file-ownership conflicts with runtime and social boards resolved, logged in the registry."
- Add to `s2`: mandatory footprint sweep at bounds expansion, not deferred to `s4`.
- Rename `s7` to `s7 save migration (joint with runtime v7 / social n8)` and require it to use the shared save-schema registry (P1).
- `s1` must explicitly state whether the 18×18 iso debug grid is retired or kept as pure debug-only.

### `docs/ACTIVE-SOCIAL-COGNITION-BOARD.md` and `docs/SOCIAL-COGNITION-ROADMAP.md`
- Insert a new `n0.5 social measurement harness` phase between `n0` and `n1`. Deliverables: motive-frequency capture, pair-distinctness metric, follow-through-rate metric.
- Add to `n1`: "Co-owns `SIM-CADENCE-CONTRACT.md` with runtime-v4."
- Add to `n6`: "ML may only score / weight. Any new social construct is defined in `lifeSimSystem.js`, not in `mlInferenceSystem.js`. Enforcement via P6 audit."
- Update `n7` to reference the DOM panels from runtime `v1` as the surfacing target; panels stay presentation-only.

### `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
- Extend "gameUI never invents" rule to the incoming `ui/dom/` layer from runtime `v1`.

### `docs/COGNITION-ML-CONTRACT.md`
- Add P6 enforcement note: ML may not mutate any field in the protected-state registry (P1).

---

## Revised Plan Shape

```text
╔════════════════ Shared prerequisites (lock before any track proceeds) ═════════════════╗
║ P1 save-schema registry                    (owner: saveSystem)                         ║
║ P2 geometry-freeze commitment              (owner: spatial board)                      ║
║ P3 shared-file arbitration table           (owner: registry)                           ║
║ P4 social measurement harness spec         (owner: social board)                       ║
║ P5 sim-cadence contract                    (co-owned: runtime v4 + social n1)          ║
║ P6 ML boundary audit                       (owner: cognition contract)                 ║
║ P7 review-gate rubric                      (owner: registry)                           ║
║ P8 flag-rollback rule                      (owner: refined plan)                       ║
╚═════════════════════════════════════════════════════════════════════════════════════════╝
            │
            ▼
┌────────────────────────────┬────────────────────────────┬────────────────────────────┐
│ runtime track              │ spatial track              │ social track               │
├────────────────────────────┼────────────────────────────┼────────────────────────────┤
│ v0 baseline (on frozen     │ s0 audit  (parallel w/ v0) │ n0 audit (parallel w/ v0)  │
│   geometry — see P2)       │ s1 unit contract           │ n0.5 measurement harness   │
│ review gate                │ s2 bounds + footprint sweep│ n1 family + ownership lock │
│ v0.5 free wins             │ s3 doorway corridors       │                            │
│   (default-off until exit) │ s4 footprint unification   │ ── gates runtime v4 ──     │
│ v1 shell-UI DOM split      │ s5 block placement/support │                            │
│ v2 memory leaks + pools    │ s6 interaction reconcile   │ n2 motive rebalance        │
│ v3 sprite baking + atlas   │                            │ n3 pair chemistry          │
│ v4 cadence split           │ ◀─── co-owned P5 ──────────│ n4 society / group tone    │
│   (gated on n1)            │   SIM-CADENCE-CONTRACT     │ n5 follow-through          │
│ v5 composite reduction     │                            │ n6 ML scoring integration  │
│   (gated on s3)            │                            │ n7 surfacing (uses v1 DOM) │
│ v6 worker offload          │                            │                            │
│ v7 visual restore          │                            │                            │
│ v8a runtime-only proof     │                            │                            │
└────────────────────────────┴────────────────────────────┴────────────────────────────┘
            │                           │                           │
            └───────────┬───────────────┴───────────────┬───────────┘
                        ▼                               ▼
                  save-migration merge            v8b full-stack proof
                  (joint v7 / s7 / n8             (on the migrated lived-in save)
                   using P1 registry)
                        │
                        ▼
                  v9 renderer escalation decision (runtime-owned)
```

---

## Most Important Question

Do these three tracks form a coherent path toward:

1. a smooth but visually rich build,
2. a unified internal pseudo-3D spatial model,
3. a butterfly society that feels emotionally alive and emergent?

**Not yet.** Each track is individually well-reasoned. Together they break down in three specific places:

1. **Baseline integrity** — runtime `v0` is being captured on geometry that spatial `s2`/`s3` will invalidate.
2. **Save migration coordination** — three tracks declare a save migration with overlapping "must preserve" lists and no shared schema registry. Whichever ships first silently locks the schema for the others.
3. **Cadence-vs-depth ordering** — `v4` freezes tick budgets before `n1–n6` define what actually ticks.

Fix these three and the tracks become coherent. The fix is not a rewrite — it is the eight shared prerequisites above (P1–P8), the three sequencing gates (`v0 ↔ P2`, `v4 ↔ n1`, `v5 ↔ s3`), and one joint save-migration phase. The current plans are ~85% of the way there; the missing 15% is the coordination layer between tracks, which no current doc owns.
