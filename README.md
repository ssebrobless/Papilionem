# Papilionem

Papilionem is a painted butterfly-garden life sim built in p5.js. The current build combines a real-time garden, breeding and hybrid inheritance, sleep and social systems, section-based world navigation, debug/audit tooling, and a compiled source book that serves as the main reading copy for the project.

## Run

```powershell
npm install
npm run playtest
```

Then open:

- `http://127.0.0.1:3000/` on the host machine
- `http://<host-ip>:3000/` on another device on the same local network, if you are intentionally sharing a local-host playtest

Current validated path:

- Node `18+`
- desktop Chromium-family browser

## What Is In The Build

- butterfly personalities, traits, trust, fear, and displays
- sleep, settling, oversleep, and sleep assist behaviors
- eggs, caterpillars, chrysalis, hybrids, and lineage tracking
- social memory, teaching pulses, trust cascades, and lifecycle feed events
- save/load, autosave, debug audits, snapshots, and roundtrip verification
- section-based world shell with overview and focused-zone travel
- accessibility, inspect, journal, feed, and save controls in the player UI

## Main Controls

- `Save`, `Journal`, `Feed`, `Inspect`, `Access`: top-right UI buttons
- `Overview`, `Next Zone`: world navigation controls when multi-zone travel is available
- `D`: toggle debug mode
- `B`: hold boundary overlay
- `O`: toggle overview map mode

Important current truth:

- the main shell is button-first
- older panel hotkeys such as `C`, `I`, and `A` are not the live way to open those surfaces

## Repo Guide

```text
core/       game state, rendering, progression, sprite loading
entities/   butterflies, flowers, caterpillars
systems/    breeding, sleep, teaching, zones, save, battle, effects
ui/         player UI, collection UI, debug UI
assets/     butterfly, background, cocoon, caterpillar, and title art
docs/       guidebook, diagrams, and reference docs
scripts/    guidebook, audit, and benchmark helpers
bench/      deterministic performance scenarios
```

## Performance Benchmarking

The repo ships a deterministic, headless harness for measuring per-frame cost
without driving the game by hand. Use it to localize hot spots and verify that a
change actually moves the numbers before claiming a win.

### One-time setup

```bash
npm install
npx playwright install chromium
```

### Run a single scenario

```bash
node scripts/bench.js butterflies-200 --out qa_logs/bench/baseline
```

`scripts/bench.js`:

1. Reuses the playtest server on `:3000` if one is already running, otherwise
   spawns its own (auto-falls-back to `:3030` if `:3000` is taken by something
   else).
2. Boots Playwright headless with `__PAPILIONEM_HARNESS_MODE__` set so
   `sketch.js` skips the title screen, kills p5's draw loop, and exposes
   `window.papilionemHarness`.
3. Seeds `randomSeed`/`noiseSeed` deterministically, spawns the requested number
   of butterflies, runs `warmupFrames` to stabilize, then ticks
   `captureFrames` worth of `gameCore.update() + gameCore.draw()` while the
   in-game telemetry records per-frame costs.
4. Writes a JSON digest to the output directory containing the per-stage
   averages, the full `frameTimes` distribution, and a flat `breakdown` map of
   every avg-ms field from telemetry (per-system, per-entity-family, per-render
   layer). Pass `--raw` to also emit the unfiltered capture payload.

### Per-system breakdown (preferred signal)

Every digest carries a `summary.breakdown` object with the avg ms-per-frame
contribution of each subsystem — e.g. `update.foundation.lifeSimSystemMs`,
`update.foundation.mlInferenceSystemMs`, `update.entity.butterflyUpdateMs`,
`render.entityFamilyButterflyMs`. The bench command prints a curated top
slice; `bench-compare` diffs every `*Ms` field with its own threshold (default
10%) so a noisy `avgUpdateMs` does not hide a deterministic system-level shift
underneath. Fields where both sides round under 0.5 ms are muted to avoid
percent inflation on near-zero costs.

The physics stage is broken down further. `update.physicsMs` is the total spent
inside `physicsSystem.update` per frame; the digest also includes:

- `update.physics.syncTrackedEntitiesMs` (and per-family `syncButterfliesMs`,
  `syncCaterpillarsMs`, `syncBlocksMs`, `syncPruneMs`) — registers/refreshes
  spatial context for every entity. In single-zone scenarios this dominates
  physics cost (~95% under typical loads).
- `update.physics.reconcileUnsupportedBlocksMs` — re-evaluates support state
  for stacked blocks.
- `update.physics.resolveButterflyContactsMs` — butterfly-butterfly contacts.
- `update.physics.resolveButterflyImpulsesMs` — applies movement intent.
- `update.physics.resolveButterflyStructureCollisionsMs` — butterfly-block
  collisions.

When a real-play capture is heavier in physics than the bench, this breakdown
is the first place to look — it tells you whether the gap is in spatial sync,
contact resolution, or structure collision.

### CPU profile capture (one-shot deep dive)

Add `--profile` to record a Chrome DevTools `.cpuprofile` covering exactly the
capture window (warmup is excluded). Open the resulting file in Chrome
DevTools > Performance > Load profile to get a flame graph with function-level
attribution. Use this when the per-system breakdown shows a large block (e.g.
`mlInferenceSystemMs`) and you want to see which functions inside it dominate.

```bash
node scripts/bench.js butterflies-400 --out qa_logs/bench/candidate --profile
# writes <label>.cpuprofile alongside the digest
```

Default sampling is 500 µs; tighten with `--profile-interval 250` for finer
granularity at the cost of profile size.

### Built-in scenarios

Two families:

**Synthetic population sweeps** — fast, useful for finding O(N²) inflection
points in the per-system breakdown. Spawn N butterflies into the default world,
no flowers, no blocks, no zone focus.

| File | N butterflies | Use |
|---|---|---|
| `bench/scenarios/butterflies-50.json` | 50 | Reference; should sit comfortably under 16.7 ms/frame |
| `bench/scenarios/butterflies-100.json` | 100 | Looking for early signs of the cliff |
| `bench/scenarios/butterflies-200.json` | 200 | High population, O(N²) hot |
| `bench/scenarios/butterflies-400.json` | 400 | Stress, near the 500 entity cap |

**Composed scenarios** — drive butterflies, flowers, and blocks all into a
focused single zone so the bench reproduces the per-zone density that real
gameplay actually exhibits. The synthetic scenarios understate real-world cost
substantially; for example, a 13s manual playtest capture with 122 butterflies +
108 blocks + 48 flowers in `ivy-cloister` ran at 75 ms avg update / 86 ms p50,
while `butterflies-200` (no blocks, no flowers, no focus) sits around 22 ms avg
update. Use the composed scenarios when investigating real-play cost.

| File | Composition | Use |
|---|---|---|
| `bench/scenarios/single-zone-122.json` | 122 butterflies / 48+ flowers / 108 blocks in `ivy-cloister` | Validated reproduction of the 2026-04-27 manual capture (bench p50 ≈ 97% of capture, avg update ≈ 84%). Use as the realistic gameplay reference. |
| `bench/scenarios/single-zone-200.json` | 200 butterflies / 60 flowers / 130 blocks in `ivy-cloister` | Above-real-play single-zone density; finds the cliff above 122. |
| `bench/scenarios/block-carry-active.json` | 80 butterflies / 12 flowers / 200 blocks in `ivy-cloister` | High block density isolates structureSystem and carry/perch interaction cost. |
| `bench/scenarios/flower-feed-storm.json` | 80 butterflies / 120 flowers / 16 blocks in `ivy-cloister` | High flower density saturates the feed/seek loop. |

Add your own under `bench/scenarios/` with the shape
`{ label, seed, butterflyCount, flowerCount?, blockCount?, focusZoneId?, viewMode?, scatterButterfliesAcrossZone?, warmupFrames, captureFrames, notes }`.
The optional fields drive `harness.spawnFlowersTo`, `harness.spawnBlocksTo`,
`harness.forceZoneFocus`, and `harness.scatterButterflies` respectively. When
`focusZoneId` is set, butterfly spawns are routed to that zone too;
`scatterButterfliesAcrossZone: true` then re-randomizes their positions across
the zone interior so they don't all start clustered at doorway anchors (more
realistic mid-zone density for `getSpatialContextForEntity` queries).

### Comparing two runs

```bash
node scripts/bench-compare.js \
  qa_logs/bench/baseline/butterflies-200-<stamp>.json \
  qa_logs/bench/candidate/butterflies-200-<stamp>.json \
  --threshold 0.10
```

Compares lower-is-better metrics (`p50/p95/p99/max frame ms`, `avg update ms`,
`avg render ms`, `wall ms / frame`, `peak heap MB`). Exits non-zero if any
metric regresses past the threshold (default 5%). Counter fields
(`spriteCacheHits`, `peakHeapMB`, etc.) are bit-exact across same-seed runs and
are surfaced informationally — divergence in those means the change altered the
simulation, not just its speed.

### Suggested workflow

1. Run the full sweep at N=50/100/200/400 against `qa_logs/bench/baseline/`.
2. Make a change.
3. Re-run the same scenarios into `qa_logs/bench/candidate/`.
4. `bench-compare` each pair. Counter fields drifting indicates the change
   touched simulation behavior — confirm that is intended. The per-system
   breakdown table is the most reliable signal — wall-clock metrics sit on a
   ~5–15% noise floor, but the sub-system avg ms numbers are deterministic
   averages over the same fixed-tick simulation.
5. If a system block looks suspicious, re-run the heaviest scenario with
   `--profile` and open the `.cpuprofile` to see which function is responsible.

### Knobs worth knowing

- `gameConfig.performance.flags.memoryAttributionEnabled` — the harness flips
  this on by default so digests include per-subsystem memory accounting (render
  layer MB, sprite cache MB, communication retention counts).
- `gameConfig.entities.maxButterflies` (`core/config.js`) caps spawn count;
  `harness.spawnTo()` clamps to it.
- Per-stage timing in the digest summary comes from `core/gameCore.js:3185`+ —
  `entityBreakdown.*Ms`, `worldBreakdown.*Ms`, `attribution.category` etc. tell
  you where in the update loop the time went.

## Reference Docs

- [Primary Source Book PDF](C:/Users/fishe/Documents/projects/ephemera/docs/source-book/PAPILIONEM-SOURCE-BOOK.pdf)
- [Primary Source Book Markdown](C:/Users/fishe/Documents/projects/ephemera/docs/source-book/PAPILIONEM-SOURCE-BOOK.md)
- [Source-Book Workflow](C:/Users/fishe/Documents/projects/ephemera/docs/source-book/README.md)
- [Documentation Map](C:/Users/fishe/Documents/projects/ephemera/docs/README.md)
- [Public-Share Board](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-PUBLIC-SHARE-BOARD.md)
- [Public-Share Roadmap](C:/Users/fishe/Documents/projects/ephemera/docs/PUBLIC-SHARE-READINESS-ROADMAP.md)

## Documentation Workflow

```text
author / update source docs in docs/
              │
              ▼
run `npm run build:source-book`
              │
              ▼
refresh the primary source-book PDF / HTML / Markdown
```

The source book is now the major master reading copy for the repo.

## Repo Hygiene Note

The runtime still uses a few inherited asset filenames for butterfly body/antenna and environmental layers. Those files are still relevant because the live build references them directly. Public-facing repo branding and stale root-level leftovers are being cleaned so the repo surface matches Papilionem instead of the older fork.
