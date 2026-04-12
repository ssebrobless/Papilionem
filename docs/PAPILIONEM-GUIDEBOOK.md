# Papilionem Developer Reference

Implementation-derived technical reference for the current milestone branch.

```text
╔════════════════════ Guidebook Scope ════════════════════╗
║ project            │ Papilionem                        ║
║ purpose            │ player + developer reference      ║
║ source of truth    │ current implemented code          ║
║ audience           │ developers, testers, collaborators ║
╚═════════════════════════════════════════════════════════╝
```

## 1. Game At A Glance

```text
╔════════════════════ Papilionem Shape ════════════════════╗
║ title screen                                               ║
║  ▼                                                         ║
║ living garden simulation                                   ║
║  ├─ butterflies                                            ║
║  ├─ flowers                                                ║
║  ├─ caterpillars                                           ║
║  ├─ memory / social / sleep systems                        ║
║  └─ genetics / lineage / hybrids                           ║
║  ▼                                                         ║
║ debug + audit layer                                        ║
║  ├─ presets                                                ║
║  ├─ snapshots                                              ║
║  ├─ invariants                                             ║
║  ├─ roundtrip save/load                                    ║
║  └─ gameplay audit                                         ║
║  ▼                                                         ║
║ optional battle snapshot layer                             ║
╚═════════════════════════════════════════════════════════════╝
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
- accessibility/readability controls
- debug/audit tooling
- an isolated battle snapshot system

## 2. Core System Ownership

```text
╔════════════════════ Owner Map ════════════════════╗
║ GameCore                                           ║
║  ├─ ZoneSystem       │ world zones / focus / mode  ║
║  ├─ StatusSystem     │ timed effects / auras       ║
║  ├─ BehaviorSystem   │ current action runtime      ║
║  ├─ ObjectSystem     │ carry/drop/use ownership    ║
║  ├─ SleepSystem      │ sleep transitions           ║
║  ├─ TeachingSystem   │ packets / lessons / trust   ║
║  ├─ BreedingSystem   │ mating / pregnancy / hatch  ║
║  ├─ BattleSystem     │ battle snapshots / commit   ║
║  ├─ SaveSystem       │ durable serialization        ║
║  ├─ TelemetrySystem  │ frame/update metrics         ║
║  ├─ RenderManager    │ visuals only                ║
║  ├─ GameUI           │ player-facing UI            ║
║  └─ DebugUI          │ god mode + audit tools      ║
╚═════════════════════════════════════════════════════╝
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
╔════════════════════ Player Flow ════════════════════╗
║ title image                                           ║
║  ▼ click / key                                        ║
║ garden begins                                         ║
║  ├─ butterflies wander                               ║
║  ├─ player moves cursor                              ║
║  ├─ trust / fear / feeding update                    ║
║  ├─ sleep / teaching / breeding continue             ║
║  └─ progression tracks discoveries                   ║
║  ▼                                                    ║
║ optional debug / audit                               ║
║  ├─ load preset                                      ║
║  ├─ inspect state                                    ║
║  ├─ save/load verify                                 ║
║  └─ gameplay audit                                   ║
╚═══════════════════════════════════════════════════════╝
```

At a high level:

1. The title image appears first.
2. Clicking or pressing any key fades into the garden.
3. The garden runs at a fixed simulation delta.
4. Butterflies respond to their internal state, the player cursor, flowers, each other, and owner-system state.
5. Debug mode can be toggled at any time for scenario setup, replay metadata, snapshots, and audits.

## 4. Controls

### 4.1 Normal Play Controls

```text
╔════════════════════ Normal Controls ════════════════════╗
║ any key / click │ fade out title screen                 ║
║ D               │ toggle debug mode                     ║
║ B               │ hold boundary zones overlay           ║
║ C               │ butterfly collection / journal        ║
║ I               │ inspect panel                         ║
║ A               │ accessibility panel                   ║
║ M               │ reduced motion                        ║
║ T               │ cycle trail visibility                ║
║ G               │ cycle background atmosphere           ║
║ H               │ high contrast UI                      ║
║ S               │ battle motion simplify                ║
║ ← / →           │ collection page navigation            ║
║ R               │ rename current hybrid in collection   ║
╚══════════════════════════════════════════════════════════╝
```

### 4.2 Debug / Audit Controls

```text
╔════════════════════ Debug Controls ════════════════════╗
║ arrow keys        │ move debug cursor on iso grid       ║
║ Q / E             │ cycle debug tools                   ║
║ Space             │ place current debug tool            ║
║ X                 │ export zone data                    ║
║ K                 │ save game state                     ║
║ L                 │ load game state                     ║
║ V                 │ verify save/load roundtrip          ║
║ N                 │ compare recent snapshots            ║
║ P                 │ load next audit preset              ║
║ O                 │ export audit setup                  ║
║ U                 │ import audit setup                  ║
║ Y                 │ run gameplay audit                  ║
║ J                 │ reseed replay session               ║
╚══════════════════════════════════════════════════════════╝
```

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
- reset progression
- save / load / verify roundtrip
- capture snapshot
- check invariants
- compare snapshots
- load / export / import audit presets
- run gameplay audit
- reseed replay session

## 5. World, Camera, And Rendering

```text
╔════════════════════ World Space ════════════════════╗
║ canvas        │ 800 x 450                           ║
║ grid          │ 18 x 18                             ║
║ tile          │ 18 x 9 isometric                    ║
║ active zone   │ garden-core                         ║
║ view modes    │ overview / focused-garden / battle  ║
╚══════════════════════════════════════════════════════╝
```

Current implementation notes:

- the shipped world foundation is a single-zone base layout
- the simulation and rendering are already zone-aware
- the render manager keeps gameplay ranges separate from visual scale

### Render rules

```text
╔════════════════════ Render Rules ════════════════════╗
║ focused garden      │ moving background allowed       ║
║ overview            │ moving background suppressed    ║
║ battle              │ moving background off           ║
║ battle              │ afterimage trails off           ║
║ reduced motion      │ suppresses extra motion         ║
║ trail off           │ disables decorative trails      ║
╚═══════════════════════════════════════════════════════╝
```

Important implementation invariant:

```text
render changes appearance only
render never changes gameplay distance, collision, or ownership
```

## 6. Butterfly Archetypes And Abilities

### 6.1 Base Butterfly Archetypes

```text
╔════════════════════ Archetype Roster ════════════════════╗
║ friendly   │ common      │ warm / trusting               ║
║ cautious   │ uncommon    │ delicate / patient            ║
║ energetic  │ uncommon    │ fast / zippy                  ║
║ skittish   │ rare        │ nervous / erratic             ║
║ wise       │ rare        │ calm / teaching               ║
║ mystic     │ epic        │ magical / sleep-comfort       ║
║ golden     │ legendary   │ special / divine              ║
║ hybrid     │ bred        │ inherited mix                 ║
╚═══════════════════════════════════════════════════════════╝
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
╔════════════════════ Ability Mapping ════════════════════╗
║ friendly   │ Warm Welcome   │ healing + panic support    ║
║ cautious   │ Delicate Pink  │ sparkle trail             ║
║ energetic  │ Electric Violet│ speed zone / state boost  ║
║ skittish   │ Nervous Jewel  │ trust cascade             ║
║ wise       │ Ancient Scholar│ teaching aura             ║
║ mystic     │ Twilight Dancer│ sleep comfort aura        ║
║ golden     │ legendary      │ special crown state       ║
║ hybrid     │ inherited      │ one chosen parent ability ║
╚══════════════════════════════════════════════════════════╝
```

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
╔════════════════════ LifeSim Container ════════════════════╗
║ identity                                                   ║
║ drives                                                     ║
║ emotions                                                   ║
║ memories                                                   ║
║ socialEdges                                                ║
║ routines                                                   ║
║ interpretation                                             ║
║ distortion                                                 ║
║ genetics                                                   ║
║ upbringing                                                 ║
║ lifecycle                                                  ║
╚═════════════════════════════════════════════════════════════╝
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
╔════════════════════ Drive Families ════════════════════╗
║ selfMaintenance                                         ║
║ safetyAvoidance                                         ║
║ resourceControl                                         ║
║ socialConnection                                        ║
║ caregiving                                              ║
║ exploration                                             ║
║ statusExpression                                        ║
║ rest                                                    ║
╚══════════════════════════════════════════════════════════╝
```

These are the long-running pressures that shape what an agent tends to prioritize.

### 7.3 Emotion Channels

```text
╔════════════════════ Emotion Channels ════════════════════╗
║ threat                                                    ║
║ relief                                                    ║
║ attachment                                                ║
║ rejection                                                 ║
║ significance                                              ║
║ failure                                                   ║
║ curiosity                                                 ║
║ agitation                                                 ║
║ exhaustion                                                ║
╚════════════════════════════════════════════════════════════╝
```

These are not a full planner by themselves. They are inputs into the simulation state and owner systems.

### 7.4 Memory Families

```text
╔════════════════════ Memory Families ════════════════════╗
║ place                                                     ║
║ object                                                    ║
║ interaction                                               ║
║ outcome                                                   ║
║ routine                                                   ║
║ social                                                    ║
║ danger                                                    ║
║ care                                                      ║
╚════════════════════════════════════════════════════════════╝
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
╔════════════════════ Social Edge Families ════════════════════╗
║ trust                                                        ║
║ comfort                                                      ║
║ attachment                                                   ║
║ dependence                                                   ║
║ rivalry                                                      ║
║ resentment                                                   ║
║ admiration                                                   ║
║ protectiveness                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

Edges are persistent relationship summaries. They are not the same thing as memories.

### 7.6 Routine Families

```text
╔════════════════════ Routine Families ════════════════════╗
║ movement                                                  ║
║ social                                                    ║
║ care                                                      ║
║ resource                                                  ║
║ rest                                                      ║
║ vigilance                                                 ║
║ teaching                                                  ║
╚═══════════════════════════════════════════════════════════╝
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
╔════════════════════ Sleep State Machine ════════════════════╗
║ awake                                                        ║
║  ▼ exhaustion threshold / forced sleep                       ║
║ settling_sleep                                               ║
║  ▼ settled                                                   ║
║ normal_sleep                                                 ║
║  ├─ recovered ───────────────▶ awake                         ║
║  └─ oversleep pressure ─────▶ oversleeping                   ║
║                              └─ finished ─────▶ awake        ║
║ forced_battle_sleep ────────▶ awake when effect ends         ║
╚═══════════════════════════════════════════════════════════════╝
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
╔════════════════════ Sleep Balance ════════════════════╗
║ assist strength default     │ 0.15                   ║
║ settling duration           │ 1.5 s                  ║
║ wake minimum sleep          │ 4 s                    ║
║ normal recovery base        │ 0.032                  ║
║ oversleep threshold base    │ 0.35                   ║
║ forced sleep recovery       │ 0.014                  ║
╚═══════════════════════════════════════════════════════╝
```

Sleep visuals expose:

- grounded posture
- lower wing motion
- visual y-offset
- visual tilt

## 9. Teaching, Trust, And Social Pacing

```text
╔════════════════════ Teaching Flow ════════════════════╗
║ wise aura pulse                                         ║
║  ▼                                                      ║
║ beginTeach(listener)                                    ║
║  ▼                                                      ║
║ active lesson timer                                     ║
║  ▼                                                      ║
║ resolve lesson                                          ║
║  ├─ packet added                                        ║
║  ├─ upbringing lesson added                             ║
║  ├─ memory added                                        ║
║  ├─ social edge adjusted                                ║
║  └─ routine reinforced                                  ║
╚══════════════════════════════════════════════════════════╝
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
╔════════════════════ Genetics Profile ════════════════════╗
║ source                                                     ║
║ baselineTraits                                             ║
║ inheritedTraits                                            ║
║ heritageTags                                               ║
║ lineageIds                                                 ║
║  ├─ parents                                                ║
║  └─ ancestors                                              ║
╚═════════════════════════════════════════════════════════════╝
```

### 10.2 Breeding Lifecycle

```text
╔════════════════════ Breeding Lifecycle ════════════════════╗
║ eligible male + eligible female                             ║
║  ▼ pheromone attraction                                     ║
║ mating state                                                ║
║  ▼ completeMating                                           ║
║ pregnancy assigned to female                                ║
║  ▼ travel to valid flower                                   ║
║ egg attached to flower                                      ║
║  ▼ hatch timer                                              ║
║ caterpillar                                                 ║
║  ▼ chrysalis flower lifecycle                               ║
║ hybrid butterfly spawn                                      ║
║  ▼ progression journal entry                                ║
║ named hybrid in collection                                  ║
╚══════════════════════════════════════════════════════════════╝
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
╔════════════════════ Hybrid Inheritance ════════════════════╗
║ child sex                 │ random M/F                     ║
║ core numeric traits       │ average of both parents        ║
║ special ability           │ one random parent ability      ║
║ wing donor for each wing  │ random mother/father per wing  ║
║ colors                    │ average parent colors          ║
║ fertility uses            │ config-owned bred value        ║
╚═════════════════════════════════════════════════════════════╝
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

### 10.6 Hybrid Progression Journal

Every new hybrid gets a progression entry with:

- id
- name
- sex
- born timestamp
- render spec
- parent A render spec
- parent B render spec
- inherited ability

The player can rename hybrids in the collection UI with `R`.

### 10.7 Current Hybrid Tuning Defaults

```text
╔════════════════════ Hybrid Balance ════════════════════╗
║ pheromone radius         │ 132                        ║
║ mating distance          │ 16                         ║
║ mating duration          │ 150 frames                 ║
║ male cooldown            │ 21600 frames               ║
║ adult hard cap           │ 50                         ║
║ egg hatch                │ 28800-39600 frames         ║
║ cocoon hatch             │ 28800-39600 frames         ║
║ bred fertility uses      │ 1                          ║
╚═══════════════════════════════════════════════════════╝
```

## 11. Status System

```text
╔════════════════════ Status Ownership ════════════════════╗
║ effect families                                            ║
║ cooldown channels                                          ║
║ charge channels                                            ║
║ immunity families                                          ║
║ aggregated numeric bundle                                  ║
╚═════════════════════════════════════════════════════════════╝
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
╔════════════════════ Battle Separation ════════════════════╗
║ live garden entities                                        ║
║  ▼ snapshot participants                                    ║
║ battle-local mutable truth                                  ║
║  ├─ hp                                                      ║
║  ├─ pressure                                                ║
║  ├─ retreat flags                                           ║
║  ├─ status bundle clone                                     ║
║  ├─ cooldowns / charges                                     ║
║  └─ commit payload                                          ║
║  ▼ resolve                                                  ║
║ commit selected results back to live entities               ║
╚══════════════════════════════════════════════════════════════╝
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

## 14. Save, Load, And Progression

### 14.1 Save Boundaries

```text
╔════════════════════ Persistence Boundary ════════════════════╗
║ persist durable truth                                         ║
║  ├─ entities                                                  ║
║  ├─ lifeSim                                                   ║
║  ├─ hybrid journal                                            ║
║  ├─ sleep durable state                                       ║
║  ├─ teaching durable state                                    ║
║  ├─ status/cooldown/charge/immunity                           ║
║  └─ replay metadata                                           ║
║                                                               ║
║ rebuild derived state                                         ║
║  ├─ aggregated bundles                                        ║
║  ├─ local summaries                                           ║
║  ├─ zone focus render context                                 ║
║  └─ debug text / snapshots                                    ║
╚═══════════════════════════════════════════════════════════════╝
```

### 14.2 Save format highlights

The save system serializes:

- butterflies
- flowers
- caterpillars
- progression state
- runtime state
- foundation systems:
  - zones
  - statuses
  - objects
  - sleep
  - teaching

### 14.3 Progression state

Progression stores:

- encountered butterflies
- collected butterflies
- butterfly collection stats
- hybrid journal
- next hybrid id

## 15. Debug, Audit, And Playtesting

### 15.1 Audit Presets

```text
╔════════════════════ Audit Presets ════════════════════╗
║ Sleep Assist                                            ║
║ Teaching Pair                                           ║
║ Trust Cascade                                           ║
║ Social Web                                              ║
║ Hybrid Lineage                                          ║
║ Nursery Lineage                                         ║
╚══════════════════════════════════════════════════════════╝
```

### 15.2 Audit Tools

```text
╔════════════════════ Audit Tool Stack ════════════════════╗
║ save / load                                               ║
║ roundtrip verifier                                        ║
║ snapshots                                                 ║
║ snapshot diff                                             ║
║ invariant checker                                         ║
║ gameplay audit                                            ║
║ replay reseed                                             ║
║ event reports                                             ║
╚════════════════════════════════════════════════════════════╝
```

### 15.3 Gameplay Audit Meaning

The combined gameplay audit currently summarizes:

- roundtrip save/load health
- invariant status
- snapshot diff status
- current battle count involvement

### 15.4 Playtest docs

Related practical docs:

- `PLAYTEST.md`
- `PLAYTEST-FEEDBACK.md`

## 16. Accessibility And Readability

Player-facing accessibility settings currently include:

- reduced motion
- battle motion simplify
- high contrast UI
- colorblind-safe indicators
- strong selection outlines
- trail visibility: `full / reduced / off`
- background atmosphere: `full / reduced / minimal`
- status indicator density
- UI scale

The render manager obeys these settings in normal gameplay and battle.

## 17. Developer Reference Quick Sheet

```text
╔════════════════════ Key Files ════════════════════╗
║ core/config.js            │ tuning / registries    ║
║ core/entity.js            │ life-sim containers    ║
║ core/gameCore.js          │ orchestration          ║
║ entities/butterfly.js     │ archetypes / behavior  ║
║ systems/sleepSystem.js    │ sleep ownership        ║
║ systems/teachingSystem.js │ social/lesson owner    ║
║ systems/statusSystem.js   │ modifiers/cooldowns    ║
║ systems/breedingSystem.js │ mating + hybrids       ║
║ systems/battleSystem.js   │ snapshot combat        ║
║ systems/saveSystem.js     │ persistence            ║
║ ui/gameUI.js              │ player UI              ║
║ ui/debugUI.js             │ debug + audit tools    ║
╚════════════════════════════════════════════════════╝
```

## 18. Suggested Reading Order

```text
╔════════════════════ Reading Path ════════════════════╗
║ 1. this developer reference                            ║
║ 2. PLAYTEST.md                                         ║
║ 3. PLAYTEST-FEEDBACK.md                                ║
║ 4. core/config.js                                      ║
║ 5. core/entity.js                                      ║
║ 6. breeding / sleep / teaching / status systems        ║
╚═════════════════════════════════════════════════════════╝
```

## 19. Summary

```text
Papilionem currently works as:

a living garden simulation
with persistent internal state
plus hybrid breeding and audit tooling
wrapped in a player-facing and tester-facing shell
```

That is the cleanest way to think about the game right now.

## 20. Exact Config Tables

This section is the literal tunable surface currently centralized in `core/config.js`.

```text
╔════════════════════ Config Map ════════════════════╗
║ rendering / canvas / grid / isometric             ║
║ entities / particles / colorPools                 ║
║ interaction / effects / debug                     ║
║ accessibility / simulation                        ║
║ balance.sleep / balance.social / balance.hybrid   ║
║ world / registries / systems                      ║
╚════════════════════════════════════════════════════╝
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
| `entities.flower.types` | `daisy, tulip, rose, sunflower, lily` |
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

| Key | Value |
| --- | --- |
| `accessibility.reducedMotion` | `false` |
| `accessibility.battleMotionSimplify` | `true` |
| `accessibility.highContrastUI` | `false` |
| `accessibility.colorblindSafeIndicators` | `true` |
| `accessibility.strongSelectionOutlines` | `true` |
| `accessibility.trailVisibility` | `full` |
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
| `balance.hybrid.adultHardCap` | `50` |
| `balance.hybrid.eggHatchFrames.min` | `28800` |
| `balance.hybrid.eggHatchFrames.max` | `39600` |
| `balance.hybrid.cocoonHatchFrames.min` | `28800` |
| `balance.hybrid.cocoonHatchFrames.max` | `39600` |
| `balance.hybrid.bredFertilityUses` | `1` |

### 20.19 World

| Key | Value |
| --- | --- |
| `world.layout` | `single-zone-foundation` |
| `world.overviewMode` | `false` |
| `world.viewModes` | `overview, focused-garden, battle` |
| `world.zones[0].id` | `garden-core` |
| `world.zones[0].label` | `Garden Core` |
| `world.zones[0].kind` | `garden` |
| `world.zones[0].poolAllowed` | `true` |
| `world.zones[0].bounds.minX` | `0` |
| `world.zones[0].bounds.maxX` | `17` |
| `world.zones[0].bounds.minY` | `0` |
| `world.zones[0].bounds.maxY` | `17` |
| `world.zones[0].renderProfile.movingBackgroundEffectsInFocus` | `true` |
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
        ▼
female locks onto strongest nearby male in pheromone radius
        ▼
distance <= matingDistance
        ▼
mating for matingDurationFrames
        ▼
completeMating()
        ├─ fertility uses decremented
        ├─ male cooldown applied
        ├─ lifecycleData created
        └─ pregnancy assigned to female
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
| persistence | `hybridGenome`, `lineageIds`, pregnancy/lifecycle data, progression journal entry |
