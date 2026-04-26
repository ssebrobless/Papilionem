# Papilionem Player Guide

Player-facing guide to how the current game build works.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Player Guide Scope â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ focus     â”‚ how to play, read, and understand the game    â•‘
â•‘ audience  â”‚ players, testers, collaborators               â•‘
â•‘ tone      â”‚ practical, readable, low-jargon               â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

## 1. What Papilionem Is

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Core Experience â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ title screen                                             â•‘
â•‘  â–¼                                                       â•‘
â•‘ living multi-zone garden                                 â•‘
â•‘  â”œâ”€ butterflies wander, react, trust, fear, sleep       â•‘
â•‘  â”œâ”€ flowers support feeding, eggs, and chrysalis stages â•‘
â•‘  â”œâ”€ teaching, memory, and dialogue shape later behavior â•‘
â•‘  â”œâ”€ hybrids inherit traits, wings, colors, and names    â•‘
â•‘  â””â”€ release waves keep the wild ecology moving          â•‘
â•‘  â–¼                                                       â•‘
â•‘ optional debug + audit tools for testing                 â•‘
â•‘  â–¼                                                       â•‘
â•‘ optional autobattle from the top-right Battle button     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Papilionem is a life-simulation game built around butterflies in a living
garden. They are not just animations. They have internal state, social history,
lineage, zone preferences, and readable battle readiness.

## 2. Starting The Game

1. Launch the game.
2. The title screen appears first.
3. Press any key or click to enter the garden.
4. The simulation begins immediately once the garden is live.
5. A short `Quick start` card appears near the upper-left and disappears once you use `Inspect`, `Feed`, `Journal`, `Access`, or debug mode.

## 3. Core Controls

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Live Controls â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ any key / click       â”‚ leave title screen            â•‘
â•‘ Save / Journal / Feed â”‚ top-right click buttons       â•‘
â•‘ Inspect / Access      â”‚ top-right click buttons       â•‘
â•‘ Battle / Next Zone    â”‚ top-right click buttons       â•‘
â•‘ D                     â”‚ toggle debug mode             â•‘
â•‘ B                     â”‚ hold boundary overlay         â•‘
â•‘ O                     â”‚ toggle overview map mode      â•‘
â•‘ â† / â†’                 â”‚ journal page navigation       â•‘
â•‘ Escape                â”‚ cancel Inspect release mode   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Important current truth:

- The main shell is button-first.
- Old panel hotkeys such as `C`, `I`, `A`, `M`, `T`, `G`, `H`, `S`, and `R`
  are not the live way to open those surfaces anymore.
- Hybrid renaming happens with an on-page `Rename` button inside the journal.

## 4. Reading The Garden

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• What To Watch â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ movement        â”‚ who is calm, jittery, or curious    â•‘
â•‘ spacing         â”‚ who feels safe vs pressured         â•‘
â•‘ flower activity â”‚ feeding, eggs, hatch, chrysalis     â•‘
â•‘ closeness       â”‚ trust, comfort, teaching proximity  â•‘
â•‘ talk/feed lines â”‚ recent dialogue and major actions   â•‘
â•‘ zone changes    â”‚ who settles, wanders, or migrates   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The garden is meant to be read as a living system. Butterflies build history.
They remember care, danger, lessons, and other butterflies.

Current boundary worth knowing:

- butterflies can carry and stack shelter blocks
- flowers still matter for feeding, eggs, and lifecycle stages
- flowers are not current build materials in this build

## 5. Zones And Travel

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Zone Identity â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Open Land NW     â”‚ Quiet cloister                     â•‘
â•‘ Training Grounds â”‚ Sun court drills                   â•‘
â•‘ Open Land SW     â”‚ Moss watch                         â•‘
â•‘ Open Land SE     â”‚ Echo pool                          â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Zones are not just background swaps. Each area has its own identity, preferred
flowers, and behavior bias. Butterflies can move between zones for reasons, and
the `Next Zone` button lets you follow the garden one region at a time.

Spatial truth in plain language:

- the game now supports taller stacks and stronger vertical visual cues
- butterflies still live in the grounded garden model rather than a separate
  free-flight altitude simulation

## 6. Feed, Inspect, And Readability

### 6.1 Feed

The `Feed` panel is a live event stream. It currently groups entries into:

- `Talk`
- `Actions`
- `Learn`

This is the fastest way to see recent dialogue, lifecycle events, teaching, and
other meaningful changes without opening debug tools.

The live feed now reads more like a compact chat log: the player-facing rows no
longer show per-entry tags, and the filter buttons stay color-coded as `Talk`
green, `Actions` blue, and `Learn` pink.

### 6.2 Inspect

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Inspect Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ choose butterfly                                      â•‘
â•‘  â–¼                                                    â•‘
â•‘ read name / state / zone / genes / readiness         â•‘
â•‘  â–¼                                                    â•‘
â•‘ optional actions                                      â•‘
â•‘  â”œâ”€ List                                              â•‘
â•‘  â”œâ”€ Release                                           â•‘
â•‘  â”œâ”€ Roster                                            â•‘
â•‘  â””â”€ Mate                                              â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Inspect is where the game surfaces the current truth for one butterfly. It
shows live identity, lineage, zone context, roster status, social state,
dialogue summary, and ecology pressure.

If no butterfly is currently locked, `Inspect` opens to a list view. The `All`
button switches that list from the current zone to all butterflies across the
garden, so you can read an off-screen butterfly without selecting it on the
map first.

## 7. Hybrid Lifecycle And Ecology

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Hybrid / Ecology Loop â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ wild adults live in the garden                                â•‘
â•‘  â–¼ mate and lay eggs on flowers                               â•‘
â•‘ egg â†’ caterpillar â†’ chrysalis â†’ hybrid adult                  â•‘
â•‘  â–¼                                                            â•‘
â•‘ hybrid joins journal with a personal name                     â•‘
â•‘  â–¼                                                            â•‘
â•‘ living hybrids count toward the 150-hybrid cap                 â•‘
â•‘  â–¼                                                            â•‘
â•‘ released hybrids contribute to the next wild respawn wave     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current player-facing ecology rules:

- Living hybrids are capped at `150` across the garden.
- Hybrid pages are named when they emerge.
- If two living hybrids share the same first name, the oldest keeps the plain
  name and later duplicates gain a one-letter suffix.
- Releasing hybrids is the main long-term ecology pressure mechanic.
- Every `10` releases triggers a fresh wild respawn wave.
- Inspect release rows show the current zone, lineage mix, and `batch x/10` progress.
- Journal and Inspect also show the latest release-wave root zone and familiarity summary once a cohort has formed.

## 8. Journal, Roster, And Battle

### 8.1 Journal

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Journal Tabs â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Collection â”‚ wild types + hybrids                    â•‘
â•‘ Roster     â”‚ battle-ready members and launch path    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The journal is the long-term archive for the garden. In the `Collection` tab
you can:

- review wild types
- inspect hybrid pages
- use the `Rename` button on hybrid pages
- scroll longer page content with the mouse wheel inside the page viewport

### 8.2 Roster

The `Roster` tab is the battle-facing side of the journal. It lets you:

- add or remove butterflies from the battle roster
- see roster count and readiness
- launch `Battle mode` from the roster shell

### 8.3 Battle

Single-player battle is autobattle. The game currently does this:

- if you have roster members and there are eligible non-roster opponents, it
  builds your team from the strongest roster butterflies and the opposing team
  from the strongest eligible garden butterflies
- otherwise it auto-splits the strongest living butterflies into both sides
- battle plays on the top-down arena and commits the results back into the
  living garden
- the match opens from back-line release positions and spreads into the arena
  instead of resolving as a cramped instant panel read
- the player-facing shell stays minimal while combat runs: garden feed/inspect
  panels are hidden, small HP bars sit above butterflies, `Pause` remains
  available, and `Return to Garden` appears once the result is ready
- battle events still log internally for the feed/audit path, but the main
  visible proof is now the field itself: movement, ability traces, projectiles,
  and the result overlay

## 9. Release Flow

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Release Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Inspect                                              â•‘
â•‘  â–¼ Release                                           â•‘
â•‘ checklist mode                                       â•‘
â•‘  â”œâ”€ select living hybrids in the viewed zone         â•‘
â•‘  â”œâ”€ press Escape to cancel                           â•‘
â•‘  â””â”€ confirm release to remove them from the garden   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Release is handled through `Inspect`, not through a separate detached panel.
Only living hybrids can be released.

What the live shell now tells you during release:

- each checklist row shows the current zone and a short lineage summary
- each checklist row shows the current release progress as `batch x/10`
- after a full batch, later wild butterflies may reflect that wave through mild familiarity and root-zone context
- that shaping is clamped on purpose, so focused releasing is not meant to become a hidden "best build" strategy

## 10. Accessibility

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Access Panel â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ High contrast â”‚ stronger UI contrast                 â•‘
â•‘ Trails        â”‚ off / reduced / full                â•‘
â•‘ Color mode    â”‚ cycle color-friendly modes          â•‘
â•‘ Color off     â”‚ reset color mode                    â•‘
â•‘ UI scale      â”‚ resize the shell                    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The `Access` panel is the live player-facing surface for readability controls.
Some additional accessibility defaults still exist internally, but the controls
above are what players can directly change from the current shell.

## 11. Debug Mode For Testers

Debug mode is optional. Press `D` to open it.

Important current truth:

- debug actions are primarily clickable buttons
- save / restore / roundtrip / snapshot / audit actions live in the debug panel
- older debug keyboard placement/tool hotkeys are not the live interaction path

Useful presets still include:

- Sleep Assist
- Teaching Pair
- Trust Cascade
- Social Web
- Hybrid Lineage
- Nursery Lineage

## 12. Best Way To Read The Game

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Best Reading Lens â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Papilionem is a small life-simulation garden where mood,  â•‘
â•‘ memory, dialogue, lineage, release pressure, and zone     â•‘
â•‘ identity all matter at the same time.                     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

