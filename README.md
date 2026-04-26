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
scripts/    guidebook and audit helpers
```

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
