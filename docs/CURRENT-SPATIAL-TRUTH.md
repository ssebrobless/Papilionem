# Current Spatial Truth

## Purpose

This document separates the **live spatial runtime** from:

- the legacy/debug isometric grid
- farther volumetric / sandbox-style 3D ideas
- ambiguous shorthand like "the game is 3D"

It exists to answer one question clearly:

```text
╔════════════════════ Current Spatial Stack ════════════════════╗
║ live now            │ grounded garden + occupancy/carry truth║
║ legacy still used   │ 18x18 iso grid for debug/conversion    ║
║ future only         │ volumetric / sandbox-style 3D work     ║
╚═══════════════════════════════════════════════════════════════╝
```

## Live Runtime Shape

```text
focused garden
├─ movement space
│  └─ screen-space roam polygon
├─ legal placement space
│  └─ shared focused-garden placement region
├─ logical ecology zones
│  └─ zone ids for ownership / travel / spawning / counts
├─ derived verticality
│  └─ z-index + zLift + carry / stack / shelter cues
└─ dynamic physical truth
   └─ physicsSystem + structureSystem + gameCore clamps
```

## Hard Truths

### 1. Butterflies do not inhabit a free volumetric 3D space

```text
live movement
├─ x / y ground-plane travel      │ yes
├─ derived elevation cues         │ yes
├─ free flight volume             │ no
├─ arbitrary y-axis hovering      │ no
└─ rigid-body airborne motion     │ no
```

Butterflies live on a grounded pseudo-3D plane with later-3D occupancy,
shelter, carry, and contact truth layered onto it.

They can show:

- carry lift
- stack-relative lift
- shelter/interior context
- sleep/down-state posture

But they are not moving through a fully simulated open 3D volume.

### 1b. Taller structures do not mean a separate altitude-band butterfly sim is live

```text
live now
|- taller block stacks / shelter columns        | yes
|- carry / stack-relative lift cues             | yes
|- grounded doorway / warp staging              | yes
`- separate butterfly altitude-band world model | no
```

The current build can support taller structures and clearer vertical cues,
including homes formed higher on a stack, without promoting butterflies into a
new free-roaming altitude system.

That means:

- taller shelter structures are real
- render and occupancy height cues are real
- butterflies can look meaningfully higher or lower relative to structure truth
- but there is still no separately simulated `0..10 block` butterfly altitude
  habitat layer in the live runtime

### 2. The 18x18 isometric grid is still real, but it is not the live garden boundary owner

```text
18x18 iso grid
├─ debug overlays                  │ yes
├─ iso/screen conversion helpers   │ yes
├─ legacy tile reasoning           │ yes
└─ final section-scene roam bounds │ no
```

The live focused garden clamps movement and placement against:

- world roam polygon
- doorway avoidance polygons
- shared placement region
- structure constraints

Not against the old debug grid alone.

### 3. Section-scene zones are logical ecology zones, not four simultaneous physical rooms

```text
section-scenes
├─ focused view shows one shared garden space
├─ zone ids still matter for ecology truth
├─ zone travel swaps logical zone ownership
└─ overview map regions are not the same as focused movement bounds
```

This means:

- zone identity is real
- zone counts are real
- zone-specific spawning/travel ownership is real
- but focused-garden placement is intentionally shared across section-scenes

### 4. Physics ownership is already partly live

```text
live owners
├─ physicsSystem     │ contacts, impulses, carry anchors, final clamps
├─ structureSystem   │ openings, interiors, occupancy columns, body fit
├─ gameCore          │ zone travel, roam clamping, fallback separation
├─ butterfly/block   │ intent + state, not final world authority alone
└─ renderManager     │ visual depth read only
```

So the later 3D track must be read as:

- expansion of live pseudo-3D seams that is now already landed
- not creation of spatial ownership from nothing

## What Is Live Right Now

```text
live now
├─ roam polygon and doorway avoidance
├─ shared focused-garden placement region
├─ logical zone ids and zone travel
├─ structure-derived shelter / opening / body-fit truth
├─ occupancy bands and legal shelter traversal
├─ carried-block anchors with zLift
├─ block stacks / occupancy columns
├─ physics contact / impulse / clamp ownership
└─ render-order verticality
```

## What Is Not Live Yet

```text
not live yet
├─ free-flight volumetric movement
├─ broad rigid-body object simulation
├─ literal "move anywhere in 3D space" world rules
└─ a second sandbox-like world model beyond current grounded zones
```

Additional boundary:

- the current build still does **not** include a separate altitude-band
  butterfly home / hanging routine layer
- taller structures and stronger vertical cues do not change that truth by
  themselves

## Ownership Summary

```text
╔══════════════════ Spatial Ownership Summary ══════════════════╗
║ gridManager       │ conversion helpers + roam/placement clamp ║
║ physicsSystem     │ dynamic contact / impulse / carry motion  ║
║ structureSystem   │ static derived structure truth            ║
║ gameCore          │ zone ownership / travel / fallback clamp  ║
║ renderManager     │ visual depth and projection only          ║
╚════════════════════════════════════════════════════════════════╝
```

## `s0` Owner Ledger

| Spatial surface | Current owner | Live seam | `s0` note |
| --- | --- | --- | --- |
| board bounds + legal placement | `core/config.js` + `core/gameCore.js` | `PAPILIONEM_LAND_MAP.roamPolygon`, `PAPILIONEM_SECTION_PLACEMENT_REGION`, `clampPlacementPointInZone()` | config declares the shapes; gameCore performs the final clamp/handoff |
| doorway mouths + corridor staging | `core/gameCore.js` | `getZoneDoorwayAnchor()`, `getZoneDoorwayTravelProfile()`, `buildZoneTravelRoute()` | staged travel is live, but still compensates around mismatched board geometry |
| debug iso conversion | `core/gridManager.js` | `grid.cellSize`, `tileWidth`, iso/screen helpers | this still exists, but it is not the live boundary owner and must become debug-only after `s1` |
| dynamic contact + clearances | `systems/physicsSystem.js` | physics state, separation, carry anchors, final movement clamps | several clearances still derive from render-size heuristics rather than one canonical board unit |
| static occupancy + support + body fit | `systems/structureSystem.js` | occupancy columns, openings, verticality, `getBlockSupportContext()`, `resolveBodyFitForEntity()` | occupancy semantics are strong, but the underlying unit contract is not yet singular |
| visual projection + covered-path hiding | `core/renderManager.js` | covered travel rendering, visual depth sort | presentation-only; it may read the route but must never own the route geometry |

## `s0` Seam Ledger

```text
confirmed live seams
├─ board shape split
│  ├─ roam polygon
│  ├─ focused-garden placement region
│  └─ doorway path / cover / spawn anchors
│
├─ unit split
│  ├─ block render width / render height
│  ├─ debug iso cell / tile conversions
│  └─ occupancy column spacing / support step
│
├─ footprint split
│  ├─ butterflies and blocks lean on render-derived clearances
│  └─ flowers / eggs / cocoons / caterpillars do not all advertise one canonical footprint
│
├─ route split
│  ├─ travel phases are staged
│  └─ but corridor geometry is still screen-shape compensation, not one board-derived corridor stack
│
└─ owner tension already resolved on paper
   ├─ `core/gameCore.js` -> spatial track tie-breaker
   ├─ `core/config.js`   -> runtime track tie-breaker
   └─ `core/renderManager.js` stays presentation-only
```

Use [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md) as the owner
tie-breaker whenever the runtime, spatial, and social boards want the same
shared file.

## `s0` Later Audit Checklist

```text
later proof lanes that must read the same spatial contract
├─ zone transition / dispersal
├─ spatial truth
├─ carry / stack / block visual
├─ runtime self audit
├─ long-running save reload after `s7`
└─ manual route captures across opposite-side doorways on the lived-in save
```

## `s1` Contract Lock

The canonical unit lock now lives in [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md).

```text
s1 locked rule
├─ 1 block = 1 board unit
├─ 1 block = 1 support / stack unit
├─ renderWidth/renderHeight stay presentation-only
└─ the 18x18 iso grid is debug-only, not a second spatial authority
```

## Implementation Rule

Any future work must explicitly state whether it is changing:

```text
1. legacy/debug grid truth
2. live focused-garden pseudo-3D truth
3. beyond-current volumetric / sandbox-style 3D truth
```

If that distinction is not clear, the change is not ready.
