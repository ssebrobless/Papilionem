# Spatial Unit Contract

## Purpose

This doc is the stable `s1` lock for the live grounded pseudo-3D board.

It exists to answer one question clearly:

```text
what is the canonical spatial unit?
```

The answer going forward is:

```text
canonical unit
├─ 1 block footprint width
├─ 1 board-space placement/support unit
└─ 1 occupancy / stack step reference
```

Use this with:

- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
- [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)

## Canonical Rule

```text
1 block
   = 1 board unit
   = 1 support / stack unit
   = the base footprint reference for occupancy columns
```

Interpretation:

- board expansion in `s2` must be expressed in this unit
- doorway/corridor geometry in `s3` must inherit from this unit
- entity footprints in `s4` must be declared relative to this unit
- block placement/support in `s5` must measure against this unit

## Live Mapping

```text
authoritative for spatial truth
├─ board unit                -> canonical
├─ occupancy/support step    -> canonical
└─ stack height              -> canonical

presentation-only mappings
├─ config grid cell          -> screen/placement helper
├─ isometric tile width/height -> projection helper
├─ block render width/height -> sprite presentation
└─ legacy gridManager tile math -> debug / conversion only
```

Current live values that must map onto this contract:

| Surface | Current live value | Contract meaning |
| --- | --- | --- |
| `gameConfig.grid.cellSize` | `16` | helper scale, not the spatial authority |
| `gameConfig.isometric.tileWidth` | `18` | projection helper, not block truth |
| `gameConfig.isometric.tileHeight` | `9` | projection helper, not block truth |
| `entities.block.renderWidth` | `20` | current sprite width, not independent placement truth |
| `entities.block.renderHeight` | `20` | current sprite height, not independent support truth |
| `entities.block.maxStackHeight` | `12` | `12` canonical support steps |
| `gridManager.tileWidth` | `32` | legacy/debug conversion only after `s1` |
| `gridManager.tileHeight` | `16` | legacy/debug conversion only after `s1` |

## Required Boundary

```text
after s1
├─ the 18x18 iso grid stays debug-only
├─ renderWidth/renderHeight stop acting like hidden spatial authorities
└─ physics/structure heuristics must be retired phase by phase in favor of
   declared board-unit footprints
```

That means:

- `gridManager` may still convert and visualize
- it may not become a second owner of live board bounds or block size
- `renderWidth` may still drive sprite presentation
- it may not remain the long-term source of placement, support, or clearance truth

## Transitional Mismatch Ledger

```text
still transitional today
├─ structure spacing derives from block.renderWidth
├─ occupancy radii derive from renderWidth heuristics
├─ physics block radius/clearance derives from renderWidth and stackIndex
└─ debug grid uses a separate tile projection size
```

These are explicitly tolerated only as transitional seams for:

```text
s2 -> board boundary expansion
s3 -> doorway corridor rebuild
s4 -> entity footprint declarations
s5 -> block placement/support unification
```

## Phase Gate

`s1` closes when:

1. this contract exists
2. the active spatial board and roadmap point to it
3. the `18x18` iso grid is no longer ambiguous and is declared debug-only
4. later phases are explicitly tasked with retiring render-size-derived spatial heuristics

That gate is now satisfied at the planning/contract layer.
