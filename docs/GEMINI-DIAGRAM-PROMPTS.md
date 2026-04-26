# Gemini Diagram Prompt Pack

Use these as copy-paste prompts for Gemini or another diagram-capable model. They are written to produce clearer standalone visuals than the ASCII guidebook blocks.

## Global Style Prompt

Use this prefix before any prompt if you want a more consistent visual family:

```text
Create a clean, information-dense game systems diagram with strong visual hierarchy, minimal decoration, and high readability. Prefer a muted natural palette inspired by a painted garden: moss green, warm cream, soft gold, muted teal, dusky violet, and charcoal ink. Use clear labels, grouped regions, arrows, and compact legends. Avoid generic sci-fi UI styling. The output should feel like a polished systems design plate for an indie life-simulation game guidebook.
```

## 1. Whole-Game Systems Architecture

```text
Create a landscape systems architecture diagram for the game Papilionem.

Show these major regions:
- GameCore orchestration in the center
- World/render/UI on one side
- Life-simulation systems on another side
- Breeding/genetics/ecology loop on another side
- Debug/audit/save systems on another side
- Battle snapshot layer clearly separated from normal garden truth

Include these systems by name:
- ZoneSystem
- StatusSystem
- BehaviorSystem
- ObjectSystem
- SleepSystem
- TeachingSystem
- BreedingSystem
- BattleSystem
- SaveSystem
- TelemetrySystem
- RenderManager
- GameUI
- DebugUI

Visually emphasize:
- one owner per truth
- battle as an isolated snapshot/commit layer
- save/load persisting durable truth only
- render as visuals only

Use arrows to show data/control flow between systems.
```

## 2. Life-Simulation State Container

```text
Create a diagram showing the full life-simulation state container for a butterfly in Papilionem.

The main container should be labeled LifeSim and contain these compartments:
- identity
- drives
- emotions
- memories
- socialEdges
- routines
- interpretation
- distortion
- genetics
- upbringing
- lifecycle

For each compartment, list its important fields:

identity:
- entityType
- archetype
- source

drives:
- selfMaintenance
- safetyAvoidance
- resourceControl
- socialConnection
- caregiving
- exploration
- statusExpression
- rest

emotions:
- threat
- relief
- attachment
- rejection
- significance
- failure
- curiosity
- agitation
- exhaustion

memories:
- place
- object
- interaction
- outcome
- routine
- social
- danger
- care

socialEdges:
- trust
- comfort
- attachment
- dependence
- rivalry
- resentment
- admiration
- protectiveness

routines:
- movement
- social
- care
- resource
- rest
- vigilance
- teaching

interpretation:
- clarity
- lastSignals
- warpedSignals

distortion:
- traumaBias
- anxietyBias
- withdrawalBias
- fixationBias
- insomniaBias
- oversleepBias
- warpedTeachingBias

genetics:
- source
- baselineTraits
- inheritedTraits
- heritageTags
- lineageIds

upbringing:
- imprintSources
- lessons
- routineReinforcement

lifecycle:
- stage
- ageTicks
- deathState
- upbringingState

Make it look like a reference plate from a simulation design guidebook.
```

## 3. Sleep State Machine

```text
Create a state machine diagram for Papilionem's sleep system.

States:
- awake
- settling_sleep
- normal_sleep
- oversleeping
- forced_battle_sleep

Transitions:
- awake to settling_sleep when exhaustion threshold is crossed
- awake to forced_battle_sleep when forced sleep effect lands
- settling_sleep to normal_sleep after settling duration
- settling_sleep back to awake if interrupted
- normal_sleep to awake when recovery threshold is met
- normal_sleep to oversleeping when oversleep pressure is high
- oversleeping to awake when oversleep finishes
- forced_battle_sleep to awake when forced sleep effect ends

Also include side inputs:
- sleepComfort
- wakeResistance
- sleepRecoveryMultiplier
- insomniaBias
- oversleepBias

Make it readable enough for both designers and testers.
```

## 4. Teaching / Trust / Social Reinforcement Flow

```text
Create a flow diagram for Papilionem's teaching and trust systems.

Show two main paths:

Path 1: Wise butterfly teaching aura
- teaching pulse emitted
- listeners in radius
- begin lesson
- active lesson timer
- resolve lesson
- packet added
- upbringing lesson added
- social memory added
- social edge adjusted
- routine reinforced

Path 2: Skittish butterfly trust cascade
- skittish butterfly fed
- trust cascade emitted
- nearby butterflies affected
- social memory added
- trust/comfort/admiration adjusted

Also show that feeding and following can create memory packets and routine reinforcement.

Use a clear left-to-right or top-to-bottom layout and visually distinguish memories, social edges, and routines so they are not confused with each other.
```

## 5. Genetics And Hybrid Breeding Lifecycle

```text
Create a lifecycle diagram for Papilionem's breeding and hybrid system.

Stages:
- eligible male
- eligible female
- pheromone attraction
- mating state
- complete mating
- pregnancy assigned to female
- target flower selection
- egg attached to flower
- egg hatch into caterpillar
- caterpillar to chrysalis lifecycle
- hybrid butterfly spawn
- hybrid journal entry created

Include the exact inheritance rules:
- child sex is random
- core traits are averaged from both parents
- one parent ability is chosen randomly
- each wing donor is chosen independently from mother or father
- colors are averaged from both parents
- bred fertility uses are limited

Also show the important persistent artifacts:
- pregnancy data
- lifecycleData
- hybridGenome
- hybridJournal entry

Style it like a natural-history infographic for a fantasy butterfly life cycle.
```

## 6. Controls And UI Map

```text
Create a control map and UI layout poster for Papilionem.

Group controls into:
- title/start controls
- top-right shell buttons
- live keyboard inputs
- access panel controls
- inspect actions
- debug panel actions
- journal / roster controls

Include:
- any key / click to leave title
- top-right buttons: Save, Journal, Feed, Inspect, Access, Battle, Next Zone
- D debug mode
- B boundary overlay while held
- O overview mode toggle
- left/right arrows for journal navigation
- Escape to cancel Inspect release mode
- Rename button on hybrid journal pages
- Feed filters: Talk, Actions, Learn
- Access controls: High contrast, Trails, Color mode, Color off, UI scale
- Inspect actions: List, Release, Roster, Mate
- Debug panel buttons: Save Game, Restore Save, Verify Roundtrip, Capture Snapshot, Check World, Compare Snapshots, Load Audit Preset, Export Audit Setup, Import Audit Setup, Audit World, New Replay Seed
- note that old panel hotkeys are retired and the shell is button-first

Also show the main UI regions:
- inspect panel
- accessibility panel
- debug panel
- battle HUD
- butterfly journal
- battle journal / roster page
- Feed panel

Make it look like a player-developer reference sheet.
```

## 7. Save / Load / Audit Workflow

```text
Create a workflow diagram for Papilionem's save-load and audit toolchain.

Show these nodes:
- live game state
- SaveSystem serialize
- local storage save
- load from storage
- entity reconstruction
- foundation system restoration
- derived state rebuild
- roundtrip verification
- snapshot capture
- snapshot diff
- invariant checker
- audit world
- audit report storage
- replay metadata / reseed

Clearly separate:
- durable truth
- rebuilt derived state
- audit-only tooling

This should look like an engineering workflow diagram, not a player-facing diagram.
```

## 8. Battle Snapshot Separation

```text
Create a diagram explaining Papilionem's battle architecture.

Show the strict separation between:
- live garden entities
- battle snapshot participants
- battle-local mutations
- resolve step
- commit payload
- writeback to live garden entities

Include the kinds of data stored in the snapshot:
- hp
- pressure
- retreat state
- exhaustion
- sleep subtype
- action family/subtype
- status bundle
- cooldowns
- charges
- carried objects
- social edges
- genetics
- special ability

Emphasize that battle does not directly mutate live garden truth until commit.
Use a clean systems diagram style.
```
