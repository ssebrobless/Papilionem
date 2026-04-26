# Papilionem Developer Reference

Implementation-derived technical reference for the current milestone branch.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Guidebook Scope â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ project            â”‚ Papilionem                        â•‘
â•‘ purpose            â”‚ player + developer reference      â•‘
â•‘ source of truth    â”‚ current implemented code          â•‘
â•‘ audience           â”‚ developers, testers, collaborators â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

## 1. Game At A Glance

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Papilionem Shape â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ title screen                                              â•‘
â•‘  â–¼                                                        â•‘
â•‘ multi-zone living garden                                  â•‘
â•‘  â”œâ”€ butterflies / flowers / caterpillars                  â•‘
â•‘  â”œâ”€ memory / social / sleep / teaching systems            â•‘
â•‘  â”œâ”€ genetics / lineage / hybrids                          â•‘
â•‘  â”œâ”€ wild ecology / release-driven uplift loop             â•‘
â•‘  â””â”€ shelter / structure / zone-aware movement truth       â•‘
â•‘  â–¼                                                        â•‘
â•‘ button-first player shell                                 â•‘
â•‘  â”œâ”€ Save / Journal / Feed / Inspect / Access              â•‘
â•‘  â”œâ”€ Battle / Next Zone / overview toggle                  â•‘
â•‘  â””â”€ release / roster / dialogue summaries stay live       â•‘
â•‘  â–¼                                                        â•‘
â•‘ debug + audit layer                                       â•‘
â•‘  â”œâ”€ presets / snapshots / world checks                    â•‘
â•‘  â”œâ”€ restore save / roundtrip / audit world                â•‘
â•‘  â””â”€ replay seed / local-only verification                 â•‘
â•‘  â–¼                                                        â•‘
â•‘ separate top-right single-player autobattle mode          â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Papilionem is a living-garden simulation first. Butterflies are not just visual entities; they carry:

- personality/archetype traits
- drives and emotions
- memory packets
- social relationship edges
- routines and reinforcement
- distortions/biases
- genetics, upbringing, and lifecycle state

On top of that life-sim layer, the game adds:

- feeding and trust interactions
- hybrid breeding and lineage journaling
- hybrid-cap / release-wave ecology pressure
- zone identity, cross-zone travel, and dialogue memory
- accessibility/readability controls
- debug/audit tooling
- a separate single-player autobattle mode built on battle snapshots and commit-back

## 2. Core System Ownership

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Owner Map â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ GameCore                                           â•‘
â•‘  â”œâ”€ ZoneSystem       â”‚ world zones / focus / mode  â•‘
â•‘  â”œâ”€ StatusSystem     â”‚ timed effects / auras       â•‘
â•‘  â”œâ”€ BehaviorSystem   â”‚ current action runtime      â•‘
â•‘  â”œâ”€ ObjectSystem     â”‚ carry/drop/use ownership    â•‘
â•‘  â”œâ”€ SleepSystem      â”‚ sleep transitions           â•‘
â•‘  â”œâ”€ TeachingSystem   â”‚ packets / lessons / trust   â•‘
â•‘  â”œâ”€ BreedingSystem   â”‚ mating / pregnancy / hatch  â•‘
â•‘  â”œâ”€ BattleSystem     â”‚ battle snapshots / commit   â•‘
â•‘  â”œâ”€ SaveSystem       â”‚ durable serialization        â•‘
â•‘  â”œâ”€ TelemetrySystem  â”‚ frame/update metrics         â•‘
â•‘  â”œâ”€ RenderManager    â”‚ visuals only                â•‘
â•‘  â”œâ”€ GameUI           â”‚ player-facing UI            â•‘
â•‘  â””â”€ DebugUI          â”‚ god mode + audit tools      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Key invariant:

```text
one owner per truth
```

Examples:

- sleep state transitions belong to `SleepSystem`
- timed modifiers/cooldowns/charges/immunities belong to `StatusSystem`
- lesson packets and trust-cascade teaching fallout belong to `TeachingSystem`
- hybrid mating/pregnancy/egg/chrysalis/adult flow belongs to `BreedingSystem`
- battle mutations stay inside `BattleSystem` snapshots until commit
- rendering never changes gameplay truth

## 3. Game Flow

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Player Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ title image                                          â•‘
â•‘  â–¼ click / key                                       â•‘
â•‘ focused garden begins                                â•‘
â•‘  â”œâ”€ butterflies wander / trust / feed / sleep        â•‘
â•‘  â”œâ”€ breeding advances lineage and ecology pressure    â•‘
â•‘  â”œâ”€ Journal / Feed / Inspect expose current truth     â•‘
â•‘  â””â”€ zone travel and structure use stay live           â•‘
â•‘  â–¼                                                    â•‘
â•‘ optional debug / audit                               â•‘
â•‘  â”œâ”€ button-driven saves / snapshots / checks         â•‘
â•‘  â”œâ”€ audit presets and local replay seeding           â•‘
â•‘  â””â”€ no required debug keyboard chord layer           â•‘
â•‘  â–¼                                                    â•‘
â•‘ optional top-right battle mode                       â•‘
â•‘  â”œâ”€ roster-vs-garden or strongest-living fallback    â•‘
â•‘  â””â”€ autobattle commits results back into garden      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

At a high level:

1. The title image appears first.
2. Clicking or pressing any key fades into the garden.
3. The garden runs at a fixed simulation delta.
4. Butterflies respond to their internal state, the player cursor, flowers, each other, and owner-system state.
5. Debug mode can be toggled at any time for scenario setup, replay metadata, snapshots, and audits.
6. Battle can be entered from the top-right `Battle` mode without leaving the living garden save.

## 4. Controls

### 4.1 Normal Play Controls

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Normal Controls â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ any key / click       â”‚ fade out title screen           â•‘
â•‘ Save / Journal / Feed â”‚ top-right button row            â•‘
â•‘ Inspect / Access      â”‚ top-right button row            â•‘
â•‘ Battle / Next Zone    â”‚ top-right button row            â•‘
â•‘ D                     â”‚ toggle debug mode               â•‘
â•‘ B                     â”‚ hold boundary zones overlay     â•‘
â•‘ O                     â”‚ toggle overview mode            â•‘
â•‘ â† / â†’                 â”‚ journal page navigation         â•‘
â•‘ Escape                â”‚ cancel Inspect release checklistâ•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The live shell is button-first. Old panel hotkeys such as `C`, `I`, `A`, `M`,
`T`, `G`, `H`, `S`, and collection rename on `R` are intentionally inactive.

### 4.2 Debug / Audit Controls

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Debug / Audit Entry â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ D                     â”‚ toggle debug mode                â•‘
â•‘ debug action buttons  â”‚ spawn / hatch / labels          â•‘
â•‘ save / restore        â”‚ button-driven in debug panel     â•‘
â•‘ roundtrip / snapshots â”‚ button-driven in debug panel     â•‘
â•‘ presets / audit world â”‚ button-driven in debug panel     â•‘
â•‘ replay seed           â”‚ button-driven in debug panel     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current runtime note:

- debug keyboard placement/tool-cycling is disabled
- audit hotkeys listed in older docs are not consumed by the runtime
- the debug panel remains the live surface for spawn, save, snapshot, and audit actions

### 4.3 Debug Buttons

The debug panel also exposes buttons for:

- spawn butterfly
- spawn flower
- spawn pixels
- refresh male pheromone availability
- hatch all eggs
- hatch all cocoons
- place flowers for caterpillars
- toggle sex labels
- `Reset Progression` for a fresh ecology-state reset
- save / restore latest save / verify roundtrip
- capture snapshot
- check world
- compare snapshots
- load / export / import audit presets
- audit world
- start new replay seed

Important meanings:

- `restore latest save` reloads the single current local save snapshot
- `check world` runs invariant checks against live state contradictions
- `audit world` runs the broader roundtrip + snapshot + invariant bundle
- `start new replay seed` starts a fresh deterministic local test session

## 5. World, Camera, And Rendering

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• World Space â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ canvas        â”‚ 800 x 450                           â•‘
â•‘ grid          â”‚ 18 x 18 isometric logic grid        â•‘
â•‘ world layout  â”‚ land-sanctum-world                  â•‘
â•‘ zones         â”‚ multi-zone section scenes           â•‘
â•‘ player views  â”‚ focused-garden / battle             â•‘
â•‘ internal view â”‚ overview remains legacy/internal    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current implementation notes:

- the shipped world is a multi-zone land sanctuary layout
- the simulation and rendering are zone-aware
- the render manager keeps gameplay ranges separate from visual scale
- battle uses a separate arena asset and presentation path

### Render rules

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Render Rules â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ focused garden      â”‚ moving background allowed       â•‘
â•‘ overview            â”‚ moving background suppressed    â•‘
â•‘ battle              â”‚ moving background off           â•‘
â•‘ battle              â”‚ afterimage trails off           â•‘
â•‘ reduced motion      â”‚ suppresses extra motion         â•‘
â•‘ trail off           â”‚ disables decorative trails      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Important implementation invariant:

```text
render changes appearance only
render never changes gameplay distance, collision, or ownership
```

## 6. Butterfly Archetypes And Abilities

### 6.1 Base Butterfly Archetypes

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Archetype Roster â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ friendly   â”‚ common      â”‚ warm / trusting               â•‘
â•‘ cautious   â”‚ uncommon    â”‚ delicate / patient            â•‘
â•‘ energetic  â”‚ uncommon    â”‚ fast / zippy                  â•‘
â•‘ skittish   â”‚ rare        â”‚ nervous / erratic             â•‘
â•‘ wise       â”‚ rare        â”‚ calm / teaching               â•‘
â•‘ mystic     â”‚ epic        â”‚ magical / sleep-comfort       â•‘
â•‘ golden     â”‚ legendary   â”‚ special / divine              â•‘
â•‘ hybrid     â”‚ bred        â”‚ inherited mix                 â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 6.2 Base Trait Axes

Every butterfly personality provides a trait bundle:

- `speed`
- `jitteriness`
- `trustPropensity`
- `trustSpeed`
- `scareThreshold`
- `happinessBonus`

These traits affect movement, fear response, feeding reward, and interaction feel.

### 6.3 Ability Mapping

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Ability Mapping â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ friendly   â”‚ Warm Welcome   â”‚ healing + panic support    â•‘
â•‘ cautious   â”‚ Delicate Pink  â”‚ sparkle trail             â•‘
â•‘ energetic  â”‚ Electric Violetâ”‚ speed zone / state boost  â•‘
â•‘ skittish   â”‚ Nervous Jewel  â”‚ trust cascade             â•‘
â•‘ wise       â”‚ Ancient Scholarâ”‚ teaching aura             â•‘
â•‘ mystic     â”‚ Twilight Dancerâ”‚ sleep comfort aura        â•‘
â•‘ golden     â”‚ legendary      â”‚ special crown state       â•‘
â•‘ hybrid     â”‚ inherited      â”‚ one chosen parent ability â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current visual readability rule:

- radius-based support abilities render as colored rings sized to their actual gameplay radius
- one-shot/pulse abilities render as compact symbols instead of generic pixel bursts
- the sparkle trail remains pixel-based because the trail itself is the gameplay surface

### 6.4 Spawn Distribution

Current base spawn weights:

- friendly: `40`
- cautious: `15`
- energetic: `15`
- skittish: `10`
- wise: `10`
- mystic: `10`
- golden: not in normal weighted spawn; special/unique presence

A type that has already spawned at least twice gets its weight halved, and the removed weight is redistributed to types still under the soft cap.

## 7. The Neuro-Social Life Simulation

This is the deepest part of the game.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LifeSim Container â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ identity                                                   â•‘
â•‘ drives                                                     â•‘
â•‘ emotions                                                   â•‘
â•‘ memories                                                   â•‘
â•‘ socialEdges                                                â•‘
â•‘ routines                                                   â•‘
â•‘ interpretation                                             â•‘
â•‘ distortion                                                 â•‘
â•‘ genetics                                                   â•‘
â•‘ upbringing                                                 â•‘
â•‘ lifecycle                                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 7.1 Identity

Identity tracks:

- `entityType`
- `archetype`
- `source`

For butterflies this usually means:

- `entityType = butterfly`
- `archetype = friendly / wise / hybrid / etc.`
- `source = wild / bred / hybrid`

### 7.2 Drives

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Drive Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ selfMaintenance                                         â•‘
â•‘ safetyAvoidance                                         â•‘
â•‘ resourceControl                                         â•‘
â•‘ socialConnection                                        â•‘
â•‘ caregiving                                              â•‘
â•‘ exploration                                             â•‘
â•‘ statusExpression                                        â•‘
â•‘ rest                                                    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

These are the long-running pressures that shape what an agent tends to prioritize.

### 7.3 Emotion Channels

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Emotion Channels â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ threat                                                    â•‘
â•‘ relief                                                    â•‘
â•‘ attachment                                                â•‘
â•‘ rejection                                                 â•‘
â•‘ significance                                              â•‘
â•‘ failure                                                   â•‘
â•‘ curiosity                                                 â•‘
â•‘ agitation                                                 â•‘
â•‘ exhaustion                                                â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

These are not a full planner by themselves. They are inputs into the simulation state and owner systems.

### 7.4 Memory Families

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Memory Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ place                                                     â•‘
â•‘ object                                                    â•‘
â•‘ interaction                                               â•‘
â•‘ outcome                                                   â•‘
â•‘ routine                                                   â•‘
â•‘ social                                                    â•‘
â•‘ danger                                                    â•‘
â•‘ care                                                      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Memory packets store:

- family
- subject id
- valence
- strength
- recency
- reinforcement count
- emotional coloring
- warped flag
- tags
- created time
- metadata

### 7.5 Social Edge Families

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Social Edge Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ trust                                                        â•‘
â•‘ comfort                                                      â•‘
â•‘ attachment                                                   â•‘
â•‘ dependence                                                   â•‘
â•‘ rivalry                                                      â•‘
â•‘ resentment                                                   â•‘
â•‘ admiration                                                   â•‘
â•‘ protectiveness                                               â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Edges are persistent relationship summaries. They are not the same thing as memories.

### 7.6 Routine Families

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Routine Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ movement                                                  â•‘
â•‘ social                                                    â•‘
â•‘ care                                                      â•‘
â•‘ resource                                                  â•‘
â•‘ rest                                                      â•‘
â•‘ vigilance                                                 â•‘
â•‘ teaching                                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Routines represent reinforced behavioral tendencies rather than one-off events.

### 7.7 Interpretation And Distortion

Interpretation tracks:

- clarity
- last signals
- warped signal count

Distortion tracks:

- trauma bias
- anxiety bias
- withdrawal bias
- fixation bias
- insomnia bias
- oversleep bias
- warped teaching bias

These distort existing systems rather than creating separate disconnected mini-systems.

### 7.8 Upbringing

Upbringing stores:

- imprint sources
- lessons
- routine reinforcement by category

Key rule:

```text
genes define baseline predisposition
upbringing adapts, reinforces, suppresses, or distorts over time
```

## 8. Sleep System

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Sleep State Machine â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ awake                                                        â•‘
â•‘  â–¼ exhaustion threshold / forced sleep                       â•‘
â•‘ settling_sleep                                               â•‘
â•‘  â–¼ settled                                                   â•‘
â•‘ normal_sleep                                                 â•‘
â•‘  â”œâ”€ recovered â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ awake                         â•‘
â•‘  â””â”€ oversleep pressure â”€â”€â”€â”€â”€â–¶ oversleeping                   â•‘
â•‘                              â””â”€ finished â”€â”€â”€â”€â”€â–¶ awake        â•‘
â•‘ forced_battle_sleep â”€â”€â”€â”€â”€â”€â”€â”€â–¶ awake when effect ends         â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Sleep state is owned entirely by `SleepSystem`.

### Stored sleep fields

- `subtype`
- `exhaustion`
- `sleepPressure`
- `sleepComfort`
- `wakeDrive`
- `oversleepPressure`
- `oversleepHabit`
- `assistSources`
- `settlingSeconds`
- `asleepSeconds`
- `lastSleepStartSeconds`
- `lastWakeSeconds`
- `lastWakeReason`

### Implemented sleep subtypes

- `settling_sleep`
- `normal_sleep`
- `oversleeping`
- `forced_battle_sleep`

### Current key tuning defaults

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Sleep Balance â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ assist strength default     â”‚ 0.15                   â•‘
â•‘ settling duration           â”‚ 1.5 s                  â•‘
â•‘ wake minimum sleep          â”‚ 4 s                    â•‘
â•‘ normal recovery base        â”‚ 0.032                  â•‘
â•‘ oversleep threshold base    â”‚ 0.35                   â•‘
â•‘ forced sleep recovery       â”‚ 0.014                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Sleep visuals expose:

- grounded posture
- lower wing motion
- visual y-offset
- visual tilt

## 9. Teaching, Trust, And Social Pacing

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Teaching Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ wise aura pulse                                         â•‘
â•‘  â–¼                                                      â•‘
â•‘ beginTeach(listener)                                    â•‘
â•‘  â–¼                                                      â•‘
â•‘ active lesson timer                                     â•‘
â•‘  â–¼                                                      â•‘
â•‘ resolve lesson                                          â•‘
â•‘  â”œâ”€ packet added                                        â•‘
â•‘  â”œâ”€ upbringing lesson added                             â•‘
â•‘  â”œâ”€ memory added                                        â•‘
â•‘  â”œâ”€ social edge adjusted                                â•‘
â•‘  â””â”€ routine reinforced                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

`TeachingSystem` handles:

- lesson packets by entity
- active lessons
- teaching aura pulses
- trust cascades
- social memories from feeding and cursor interaction

### Social pacing knobs

Current centralized knobs include:

- teaching pulse radius
- teaching pulse memory valence/strength
- teaching pulse trust/admiration/comfort gains
- trust cascade radius
- trust cascade memory valence/strength
- lesson upbringing strength
- lesson clarity gain
- teaching boost frames

### Current intent of the tuned pass

The current milestone intentionally slows social escalation so:

- trust feels gradual
- comfort does not spike too fast
- admiration gains from teaching stay readable
- routine reinforcement is noticeable without overwhelming the sim

## 10. Genetics, Lineage, And Breeding

### 10.1 Genetics Profile

Each life-sim state includes a genetics container:

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Genetics Profile â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ source                                                     â•‘
â•‘ baselineTraits                                             â•‘
â•‘ inheritedTraits                                            â•‘
â•‘ heritageTags                                               â•‘
â•‘ lineageIds                                                 â•‘
â•‘  â”œâ”€ parents                                                â•‘
â•‘  â””â”€ ancestors                                              â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current shipped additions:

- `mutationProfile`
- `lineageTypes`
- `lineageDepth`

### 10.2 Breeding Lifecycle

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Breeding Lifecycle â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ eligible male + eligible female                             â•‘
â•‘  â–¼ pheromone attraction                                     â•‘
â•‘ mating state                                                â•‘
â•‘  â–¼ completeMating                                           â•‘
â•‘ pregnancy assigned to female                                â•‘
â•‘  â–¼ travel to valid flower                                   â•‘
â•‘ egg attached to flower                                      â•‘
â•‘  â–¼ hatch timer                                              â•‘
â•‘ caterpillar                                                 â•‘
â•‘  â–¼ chrysalis flower lifecycle                               â•‘
â•‘ hybrid butterfly spawn                                      â•‘
â•‘  â–¼ hybrid journal entry                                     â•‘
â•‘ named hybrid in collection                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 10.3 Eligibility Rules

Male eligibility requires:

- sex = `M`
- state = `normal`
- no pheromone cooldown
- not spawning
- not pregnant
- no breeding partner
- can still reproduce
- adult cap not exceeded

Female eligibility requires:

- sex = `F`
- state = `normal`
- not spawning
- not already pregnant
- no breeding partner
- can still reproduce

### 10.4 Pregnancy Data

Pregnancy holds:

- `active`
- `lifecycleData`
- `targetFlower`

When the pregnant butterfly reaches a valid flower, the system attaches an egg and returns the mother to feeding.

### 10.5 Inheritance Rules

Hybrid inheritance currently works like this:

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Hybrid Inheritance â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ child sex                 â”‚ random M/F                     â•‘
â•‘ core numeric traits       â”‚ average of both parents        â•‘
â•‘ special ability           â”‚ one random parent ability      â•‘
â•‘ wing donor for each wing  â”‚ random mother/father per wing  â•‘
â•‘ colors                    â”‚ average parent colors          â•‘
â•‘ fertility uses            â”‚ config-owned bred value        â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Inherited trait keys averaged:

- `speed`
- `jitteriness`
- `trustPropensity`
- `trustSpeed`
- `scareThreshold`
- `happinessBonus`

Then:

- `special` is set to the chosen inherited ability, if any
- a `hybridGenome` stores wing donor sources plus body sex
- mutation is treated as post-average genetics truth rather than a learned modifier
- lineage depth, parent refs, and ancestor refs are archived for bred lines
- lineage rarity is descriptive context only; it stays separate from encounter rarity and unlock logic
- the shipped runtime does not use a separate hidden latent/dormant numeric trait layer

### 10.6 Hybrid Journal And Naming

Every new hybrid gets a hybrid journal entry with:

- id
- personal name / display name
- sex
- born timestamp
- render spec
- parent A render spec
- parent B render spec
- inherited ability
- optional one-letter disambiguator when a later living duplicate shares the same first name

The collection UI exposes a `Rename` button on hybrid pages rather than a
keyboard shortcut.

### 10.7 Current Hybrid Tuning Defaults

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Hybrid Balance â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ pheromone radius         â”‚ 132                        â•‘
â•‘ mating distance          â”‚ 16                         â•‘
â•‘ mating duration          â”‚ 150 frames                 â•‘
â•‘ male cooldown            â”‚ 21600 frames               â•‘
â•‘ adult hard cap           â”‚ 150                        â•‘
â•‘ zone soft cap            â”‚ 14                         â•‘
â•‘ egg hatch                â”‚ 2700-5400 frames           â•‘
â•‘ cocoon hatch             â”‚ 5400-10800 frames          â•‘
â•‘ bred fertility uses      â”‚ 1                          â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

## 11. Status System

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Status Ownership â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ effect families                                            â•‘
â•‘ cooldown channels                                          â•‘
â•‘ charge channels                                            â•‘
â•‘ immunity families                                          â•‘
â•‘ aggregated numeric bundle                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The status system stores:

- timed effects by target
- aggregated modifiers by target
- cooldown state by entity
- charge state by entity
- immunity state by entity

### Canonical status families

- `healing_received_bonus`
- `panic_resistance`
- `aggression_suppression`
- `attack_speed_bonus`
- `movement_speed_bonus`
- `energetic_state_boost`
- `reposition_guidance`
- `cooldown_intelligence`
- `sleep_comfort_bonus`
- `wake_resistance`
- `forced_sleep`
- `forced_sleep_immunity`
- `sleep_recovery_multiplier`

Important rule:

```text
gameplay modifiers should come from the status bundle
not from duplicate ad hoc side logic
```

## 12. Behavior Runtime

`BehaviorSystem` is intentionally lightweight right now. It tracks what an entity is effectively doing and why.

### Runtime fields

- `currentActionFamily`
- `currentActionSubtype`
- `currentTargetId`
- `currentZoneId`
- `priorityScore`
- `reason`
- `overrideSecondsRemaining`

### Registered action families

- `idle`
- `wander`
- `seek_resource`
- `care_for_vulnerable`
- `teach_or_listen`
- `sleep`
- `socialize`
- `reposition`
- `battle`

This is a behavior ownership seam, not a full utility AI planner.

## 13. Battle Snapshot Layer

Battle is intentionally isolated from normal garden truth.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Battle Separation â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ live garden entities                                        â•‘
â•‘  â–¼ snapshot participants                                    â•‘
â•‘ battle-local mutable truth                                  â•‘
â•‘  â”œâ”€ hp                                                      â•‘
â•‘  â”œâ”€ pressure                                                â•‘
â•‘  â”œâ”€ retreat flags                                           â•‘
â•‘  â”œâ”€ status bundle clone                                     â•‘
â•‘  â”œâ”€ cooldowns / charges                                     â•‘
â•‘  â””â”€ commit payload                                          â•‘
â•‘  â–¼ resolve                                                  â•‘
â•‘ commit selected results back to live entities               â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Battle snapshots store:

- participant identity/team/role
- HP and pressure
- retreat/defeat state
- exhaustion and sleep subtype
- action family/subtype/target
- carried objects
- social edges
- genetics
- special ability
- commit payload for later garden writeback

Battle events include:

- battle start
- action set
- HP loss/restore
- pressure changes
- cooldown and charge changes
- memory additions
- social adjustments
- resolve
- commit

## 14. Save, Load, And Ecology State

### 14.1 Save Boundaries

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Persistence Boundary â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ persist durable truth                                         â•‘
â•‘  â”œâ”€ entities                                                  â•‘
â•‘  â”œâ”€ lifeSim                                                   â•‘
â•‘  â”œâ”€ hybrid journal                                            â•‘
â•‘  â”œâ”€ sleep durable state                                       â•‘
â•‘  â”œâ”€ teaching durable state                                    â•‘
â•‘  â”œâ”€ status/cooldown/charge/immunity                           â•‘
â•‘  â””â”€ replay metadata                                           â•‘
â•‘                                                               â•‘
â•‘ rebuild derived state                                         â•‘
â•‘  â”œâ”€ aggregated bundles                                        â•‘
â•‘  â”œâ”€ local summaries                                           â•‘
â•‘  â”œâ”€ zone focus render context                                 â•‘
â•‘  â””â”€ debug text / snapshots                                    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 14.2 Save format highlights

The save system serializes:

- butterflies
- flowers
- caterpillars
- ecology / hybrid state
- runtime state
- foundation systems:
  - zones
  - statuses
  - objects
  - sleep
  - teaching

### 14.3 Ecology / hybrid state

The live ecology containers store:

- `ecologyMode = wild-release-loop`
- per-wild-butterfly mate / departure history
- starter-pair seeding state
- releases since respawn / total releases
- current release batch
- current release batch lineage / zone counts
- wild baseline modifiers
- release history
- release cohort summaries / modifier highlights
- per-wild release cohort ids
- hybrid journal
- next hybrid id
- pending offspring reservations

Compatibility note:

- restore logic still accepts older encounter/collection-era fields when loading legacy local saves
- unlock-shaped containers remain for compatibility with older saves and older UI expectations
- canonical live ecology truth now belongs to `progressionManager`

## 15. Debug, Audit, And Playtesting

### 15.1 Audit Presets

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Audit Presets â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Sleep Assist                                            â•‘
â•‘ Teaching Pair                                           â•‘
â•‘ Trust Cascade                                           â•‘
â•‘ Social Web                                              â•‘
â•‘ Hybrid Lineage                                          â•‘
â•‘ Nursery Lineage                                         â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 15.2 Audit Tools

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Audit Tool Stack â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ save / restore latest save                                â•‘
â•‘ roundtrip verifier                                        â•‘
â•‘ snapshots / diff                                          â•‘
â•‘ check world invariants                                    â•‘
â•‘ audit world                                               â•‘
â•‘ replay seed                                               â•‘
â•‘ event reports                                             â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 15.3 Audit World Meaning

The combined `audit world` flow currently summarizes:

- roundtrip save/load health
- invariant status
- snapshot diff status
- current battle count involvement
- local audit footer status back to the debug dock

### 15.4 Playtest docs

Related practical docs:

- `PLAYTEST.md`
- `PLAYTEST-FEEDBACK.md`

## 16. Accessibility And Readability

The current `Access` panel exposes:

- high contrast UI
- trail visibility
- color mode cycle
- color mode reset
- UI scale

Additional runtime defaults still exist in config but are not currently exposed
as direct Access-panel buttons:

- reduced motion
- battle motion simplify
- colorblind-safe indicators
- strong selection outlines
- trail visibility: `off / reduced / full`
- background atmosphere: `full`
- status indicator density

The render manager obeys these settings in normal gameplay and battle.

## 17. Developer Reference Quick Sheet

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Key Files â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ core/config.js            â”‚ tuning / registries    â•‘
â•‘ core/entity.js            â”‚ life-sim containers    â•‘
â•‘ core/gameCore.js          â”‚ orchestration          â•‘
â•‘ entities/butterfly.js     â”‚ archetypes / behavior  â•‘
â•‘ systems/sleepSystem.js    â”‚ sleep ownership        â•‘
â•‘ systems/teachingSystem.js â”‚ social/lesson owner    â•‘
â•‘ systems/statusSystem.js   â”‚ modifiers/cooldowns    â•‘
â•‘ systems/breedingSystem.js â”‚ mating + hybrids       â•‘
â•‘ systems/battleSystem.js   â”‚ snapshot combat        â•‘
â•‘ systems/saveSystem.js     â”‚ persistence            â•‘
â•‘ ui/gameUI.js              â”‚ player UI              â•‘
â•‘ ui/debugUI.js             â”‚ debug + audit tools    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

## 18. Suggested Reading Order

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Reading Path â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ 1. this developer reference                            â•‘
â•‘ 2. PLAYTEST.md                                         â•‘
â•‘ 3. PLAYTEST-FEEDBACK.md                                â•‘
â•‘ 4. core/config.js                                      â•‘
â•‘ 5. core/entity.js                                      â•‘
â•‘ 6. breeding / sleep / teaching / status systems        â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

## 19. Summary

```text
Papilionem currently works as:

a multi-zone living garden simulation
with persistent internal state
plus a wild ecology / release-driven lineage loop, ML-backed decision layers,
single-player autobattle, and local audit tooling
wrapped in a player-facing and tester-facing shell
```

That is the cleanest way to think about the game right now.

## 20. Exact Config Tables

This section is the literal tunable surface currently centralized in `core/config.js`.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Config Map â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ rendering / canvas / grid / isometric             â•‘
â•‘ entities / particles / colorPools                 â•‘
â•‘ interaction / effects / debug                     â•‘
â•‘ accessibility / simulation                        â•‘
â•‘ balance.sleep / balance.social / balance.hybrid   â•‘
â•‘ world / registries / systems                      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 20.1 Rendering

| Key | Value |
| --- | --- |
| `rendering.useSprites` | `true` |
| `rendering.butterflyVisualScale` | `1.6` |

### 20.2 Canvas

| Key | Value |
| --- | --- |
| `canvas.baseWidth` | `800` |
| `canvas.baseHeight` | `450` |
| `canvas.targetWidth` | `800` |
| `canvas.targetHeight` | `450` |
| `canvas.backgroundColor` | `#f4e8dc` |

### 20.3 Grid

| Key | Value |
| --- | --- |
| `grid.cellSize` | `16` |
| `grid.gridWidth` | `18` |
| `grid.gridHeight` | `18` |
| `grid.debugGridSize` | `32` |
| `grid.gridOffset.x` | `10` |
| `grid.gridOffset.y` | `8` |

### 20.4 Isometric Projection

| Key | Value |
| --- | --- |
| `isometric.tileWidth` | `18` |
| `isometric.tileHeight` | `9` |
| `isometric.offsetX` | `400` |
| `isometric.offsetY` | `100` |
| `isometric.bounds.minX` | `0` |
| `isometric.bounds.maxX` | `17` |
| `isometric.bounds.minY` | `0` |
| `isometric.bounds.maxY` | `17` |

### 20.5 Entity Limits And Base Entity Config

| Key | Value |
| --- | --- |
| `entities.maxButterflies` | `12` |
| `entities.maxFlowers` | `6` |
| `entities.heightOffset.butterfly` | `10` |
| `entities.heightOffset.flower` | `0` |
| `entities.heightOffset.pixel` | `0` |

### 20.6 Butterfly Base Config

This config list still exists, but the live butterfly roster comes from the
runtime archetype registries rather than this three-label compatibility array.

| Key | Value |
| --- | --- |
| `entities.butterfly.size` | `12` |
| `entities.butterfly.speed` | `0.008` |
| `entities.butterfly.wanderTimer.min` | `40` |
| `entities.butterfly.wanderTimer.max` | `90` |
| `entities.butterfly.maxWanderDistance` | `3` |
| `entities.butterfly.lifetime` | `10000` |
| `entities.butterfly.personalities` | `brave, cautious, curious` |

### 20.7 Butterfly Spawn Weights

These are implementation weights in `entities/butterfly.js`, not `core/config.js`.

| Archetype | Weight |
| --- | --- |
| `friendly` | `40` |
| `cautious` | `15` |
| `energetic` | `15` |
| `skittish` | `10` |
| `wise` | `10` |
| `mystic` | `10` |
| `golden` | special/nonstandard spawn path |

### 20.8 Flower Base Config

| Key | Value |
| --- | --- |
| `entities.flower.types` | `daisy, tulip, sprout, lavender, bush` |
| `entities.flower.stemHeight` | `16` |
| `entities.flower.stageDurations.bloom` | `1200` |
| `entities.flower.stageDurations.mature` | `2400` |
| `entities.flower.stageDurations.wilting` | `1200` |
| `entities.flower.stageDurations.dissolve` | `360` |

### 20.9 Particles

| Key | Value |
| --- | --- |
| `particles.maxParticles` | `100` |
| `particles.gravity` | `0.1` |
| `particles.pixelSize` | `2` |
| `particles.bounce` | `0.3` |
| `particles.friction` | `0.99` |
| `particles.types.scale.lifetime` | `-1` |
| `particles.types.scale.fadeSpeed` | `0` |
| `particles.types.joy.lifetime` | `255` |
| `particles.types.joy.fadeSpeed` | `2` |
| `particles.types.stress.lifetime` | `180` |
| `particles.types.stress.fadeSpeed` | `3` |
| `particles.types.happy.lifetime` | `-1` |
| `particles.types.happy.fadeSpeed` | `0` |
| `particles.types.happy_visual.lifetime` | `200` |
| `particles.types.happy_visual.fadeSpeed` | `1` |

### 20.10 Color Pools

| Key | Value |
| --- | --- |
| `colorPools.radius` | `20` |
| `colorPools.requiredPixels` | `50` |
| `colorPools.pulseSpeed` | `0.1` |
| `colorPools.spawnDelay` | `180` |
| `colorPools.gridSize` | `40` |

### 20.11 Interaction

These cursor comfort/flee radii remain a compatibility-tuning surface. The live
zone/ecology/archetype identity model comes from the zone and stat-profile
systems rather than these three legacy labels alone.

| Key | Value |
| --- | --- |
| `interaction.stillFramesRequired` | `120` |
| `interaction.cursorZoneRadius` | `30` |
| `interaction.butterflyZones.brave.comfort` | `60` |
| `interaction.butterflyZones.brave.flee` | `40` |
| `interaction.butterflyZones.cautious.comfort` | `100` |
| `interaction.butterflyZones.cautious.flee` | `80` |
| `interaction.butterflyZones.curious.comfort` | `80` |
| `interaction.butterflyZones.curious.flee` | `60` |

### 20.12 Effects

| Key | Value |
| --- | --- |
| `effects.shadowOpacity` | `50` |
| `effects.glowPulseSpeed` | `0.1` |
| `effects.swaySpeed.min` | `0.02` |
| `effects.swaySpeed.max` | `0.03` |
| `effects.swayAmount` | `0.1` |

### 20.13 Debug Surface

| Key | Value |
| --- | --- |
| `debug.enabled` | `false` |
| `debug.showGrid` | `true` |
| `debug.showZones` | `true` |
| `debug.showCoordinates` | `true` |
| `debug.showFPS` | `true` |
| `debug.gardenTimeControls.enabledInNormalPlay` | `false` |
| `debug.gardenTimeControls.debugSpeedPresets` | `1, 2, 4` |
| `debug.auditTools.scenarioPresets` | `true` |
| `debug.auditTools.snapshotDiff` | `true` |
| `debug.auditTools.invariantChecker` | `true` |
| `debug.auditTools.eventTimeline` | `true` |
| `debug.auditTools.saveLoadVerifier` | `true` |
| `debug.auditTools.screenshotNotes` | `true` |

### 20.14 Accessibility

These are runtime defaults from `core/config.js`; the current Access panel only
surfaces high contrast, trails, color mode/color off, and UI scale directly.

| Key | Value |
| --- | --- |
| `accessibility.reducedMotion` | `false` |
| `accessibility.battleMotionSimplify` | `true` |
| `accessibility.highContrastUI` | `false` |
| `accessibility.colorblindSafeIndicators` | `true` |
| `accessibility.strongSelectionOutlines` | `true` |
| `accessibility.trailVisibility` | `off` |
| `accessibility.backgroundAtmosphere` | `full` |
| `accessibility.statusIndicatorDensity` | `simplified` |
| `accessibility.uiScale` | `1` |

### 20.15 Simulation

| Key | Value |
| --- | --- |
| `simulation.defaultTimeScale` | `1` |
| `simulation.battleTimeScales` | `1, 2` |
| `simulation.frameRate` | `60` |
| `simulation.fixedDeltaSeconds` | `1 / 60` |

### 20.16 Sleep Balance

| Key | Value |
| --- | --- |
| `balance.sleep.assistStrengthDefault` | `0.15` |
| `balance.sleep.movementMultiplierSettling` | `0.25` |
| `balance.sleep.wingAnimationMultiplierSettling` | `0.35` |
| `balance.sleep.wingAnimationMultiplierAsleep` | `0.08` |
| `balance.sleep.visualYOffsetSettling` | `1.5` |
| `balance.sleep.visualYOffsetAsleep` | `3` |
| `balance.sleep.visualTiltSettling` | `0.08` |
| `balance.sleep.visualTiltAsleep` | `0.18` |
| `balance.sleep.passiveExhaustionBaseGain` | `0.006` |
| `balance.sleep.passiveExhaustionRestMultiplier` | `0.004` |
| `balance.sleep.passiveExhaustionInsomniaMultiplier` | `0.002` |
| `balance.sleep.settleThresholdBase` | `0.62` |
| `balance.sleep.settleThresholdFloor` | `0.28` |
| `balance.sleep.settleThresholdInsomniaMultiplier` | `0.08` |
| `balance.sleep.settleThresholdComfortMultiplier` | `0.05` |
| `balance.sleep.settlingDurationSeconds` | `1.5` |
| `balance.sleep.normalRecoveryBaseRate` | `0.032` |
| `balance.sleep.normalRecoveryComfortMultiplier` | `0.014` |
| `balance.sleep.oversleepPressureGainMultiplier` | `0.02` |
| `balance.sleep.wakeThresholdBase` | `0.18` |
| `balance.sleep.wakeThresholdFloor` | `0.08` |
| `balance.sleep.wakeThresholdResistanceMultiplier` | `0.03` |
| `balance.sleep.wakeMinimumSleepSeconds` | `4` |
| `balance.sleep.oversleepThresholdBase` | `0.35` |
| `balance.sleep.oversleepThresholdBiasMultiplier` | `0.15` |
| `balance.sleep.oversleepRecoveryRate` | `0.02` |
| `balance.sleep.oversleepPressureDecayRate` | `0.016` |
| `balance.sleep.forcedSleepRecoveryRate` | `0.014` |
| `balance.sleep.passiveOversleepPressureDecayRate` | `0.004` |

### 20.17 Social Balance

| Key | Value |
| --- | --- |
| `balance.social.teachingLessonDurationSeconds` | `1.6` |
| `balance.social.teachingPulseRadius` | `76` |
| `balance.social.teachingPulseMemoryValence` | `0.22` |
| `balance.social.teachingPulseMemoryStrength` | `0.26` |
| `balance.social.teachingPulseEdgeTrust` | `0.02` |
| `balance.social.teachingPulseEdgeAdmiration` | `0.035` |
| `balance.social.teachingPulseEdgeComfort` | `0.015` |
| `balance.social.teachingPulseRoutineReinforcement` | `0.025` |
| `balance.social.trustCascadeRadius` | `132` |
| `balance.social.trustCascadeMemoryValence` | `0.28` |
| `balance.social.trustCascadeMemoryStrength` | `0.34` |
| `balance.social.trustCascadeEdgeTrust` | `0.035` |
| `balance.social.trustCascadeEdgeComfort` | `0.025` |
| `balance.social.trustCascadeEdgeAdmiration` | `0.015` |
| `balance.social.lessonUpbringingStrength` | `0.28` |
| `balance.social.lessonRoutineReinforcement` | `0.05` |
| `balance.social.lessonInterpretationClarityGain` | `0.01` |
| `balance.social.lessonMemoryValence` | `0.36` |
| `balance.social.lessonMemoryStrength` | `0.4` |
| `balance.social.lessonEdgeTrust` | `0.03` |
| `balance.social.lessonEdgeAdmiration` | `0.04` |
| `balance.social.lessonEdgeComfort` | `0.02` |
| `balance.social.listenerTeachingRoutineReinforcement` | `0.035` |
| `balance.social.teacherTeachingRoutineReinforcement` | `0.025` |
| `balance.social.teachingBoostFrames` | `16` |

### 20.18 Hybrid Balance

| Key | Value |
| --- | --- |
| `balance.hybrid.pheromoneRadius` | `132` |
| `balance.hybrid.matingDistance` | `16` |
| `balance.hybrid.matingDurationFrames` | `150` |
| `balance.hybrid.pheromoneCooldownFrames` | `21600` |
| `balance.hybrid.adultHardCap` | `150` |
| `balance.hybrid.zoneAdultSoftCap` | `14` |
| `balance.hybrid.zoneReservationCap` | `2` |
| `balance.hybrid.eggHatchFrames.min` | `2700` |
| `balance.hybrid.eggHatchFrames.max` | `5400` |
| `balance.hybrid.cocoonHatchFrames.min` | `5400` |
| `balance.hybrid.cocoonHatchFrames.max` | `10800` |
| `balance.hybrid.bredFertilityUses` | `1` |

### 20.19 World

| Key | Value |
| --- | --- |
| `world.layout` | `land-sanctum-world` |
| `world.renderMode` | `section-scenes` |
| `world.overviewMode` | `false` |
| `world.viewModes` | `overview, focused-garden, battle` |
| `world.zones[0].id` | `ivy-cloister` |
| `world.zones[0].label` | `Open Land NW` |
| `world.zones[0].kind` | `open-land` |
| `world.zones[0].poolAllowed` | `false` |
| `world.zones[0].bounds.minX` | `0` |
| `world.zones[0].bounds.maxX` | `8` |
| `world.zones[0].bounds.minY` | `0` |
| `world.zones[0].bounds.maxY` | `8` |
| `world.zones[0].renderProfile.movingBackgroundEffectsInFocus` | `false` |
| `world.zones[0].renderProfile.movingBackgroundEffectsInOverview` | `false` |
| `world.zones[0].renderProfile.afterimageTrailsInFocus` | `true` |
| `world.zones[0].renderProfile.afterimageTrailsInBattle` | `false` |

### 20.20 Registries

| Registry | Values |
| --- | --- |
| `registries.actionFamilies` | `idle, wander, seek_resource, care_for_vulnerable, teach_or_listen, sleep, socialize, reposition, battle` |
| `registries.statusFamilies` | `healing_received_bonus, panic_resistance, aggression_suppression, attack_speed_bonus, movement_speed_bonus, energetic_state_boost, reposition_guidance, cooldown_intelligence, sleep_comfort_bonus, wake_resistance, forced_sleep, forced_sleep_immunity, sleep_recovery_multiplier` |
| `registries.sleepSubtypes` | `settling_sleep, normal_sleep, oversleeping, forced_battle_sleep` |
| `registries.battleStates` | `inactive, snapshotting, active, resolving, committing` |
| `registries.persistenceFieldClasses` | `durable, derived, runtime` |

### 20.21 System Boot Order

| Key | Value |
| --- | --- |
| `systems.phaseFoundationOrder` | `zoneSystem, statusSystem, behaviorSystem, objectSystem, sleepSystem, teachingSystem, battleSystem, saveSystem` |

### 20.22 Exact Hybrid Inheritance Rules

These are behavior rules in `systems/breedingSystem.js`, not config fields.

```text
eligible male + eligible female
        â–¼
female locks onto strongest nearby male in pheromone radius
        â–¼
distance <= matingDistance
        â–¼
mating for matingDurationFrames
        â–¼
completeMating()
        â”œâ”€ fertility uses decremented
        â”œâ”€ male cooldown applied
        â”œâ”€ lifecycleData created
        â””â”€ pregnancy assigned to female
```

Exact inheritance behavior:

| Rule | Current behavior |
| --- | --- |
| child sex | random male/female |
| chosen ability | one parent ability chosen randomly |
| core traits | averaged between both parents |
| wing donors | chosen independently per wing: `foreLeft`, `foreRight`, `hindLeft`, `hindRight` |
| colors | parent primary/secondary colors averaged |
| hybrid fertility | bred offspring get `bredFertilityUses` from config |
| persistence | `hybridGenome`, `lineageIds`, pregnancy/lifecycle data, hybrid journal entry |

