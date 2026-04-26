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
   averages plus the full `frameTimes` distribution. Pass `--raw` to also emit
   the unfiltered capture payload.

### Built-in scenarios

| File | N butterflies | Use |
|---|---|---|
| `bench/scenarios/butterflies-50.json` | 50 | Reference; should sit comfortably under 16.7 ms/frame |
| `bench/scenarios/butterflies-100.json` | 100 | Looking for early signs of the cliff |
| `bench/scenarios/butterflies-200.json` | 200 | High population, O(N²) hot |
| `bench/scenarios/butterflies-400.json` | 400 | Stress, near the 500 entity cap |

Add your own under `bench/scenarios/` with the shape
`{ label, seed, butterflyCount, warmupFrames, captureFrames, notes }`.

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
   touched simulation behavior — confirm that is intended.

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
