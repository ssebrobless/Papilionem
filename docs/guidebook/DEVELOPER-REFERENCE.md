# Papilionem Guidebook Developer Track

Use the canonical developer reference here:

- [../PAPILIONEM-GUIDEBOOK.md](../PAPILIONEM-GUIDEBOOK.md)

```text
╔════════════════════ Developer Track ════════════════════╗
║ best for                                                  ║
║  ├─ system design review                                  ║
║  ├─ implementation lookup                                  ║
║  ├─ tuning and balancing                                    ║
║  └─ breeding / neuro-social / lifecycle reference           ║
╚══════════════════════════════════════════════════════════════╝
```

Recommended companion docs:

- [../GEMINI-DIAGRAM-PROMPTS.md](../GEMINI-DIAGRAM-PROMPTS.md)
- [../../core/config.js](../../core/config.js)

## Systems Architecture

```mermaid
flowchart LR
    Core["GameCore"]
    Durable["Durable Truth"]

    subgraph WR["World / Render / UI Systems"]
        Zone["ZoneSystem"]
        Render["RenderManager<br/>visuals only"]
        UI["GameUI"]
    end

    subgraph LS["Life-Simulation / Shared Simulation Owners"]
        Status["StatusSystem"]
        Behavior["BehaviorSystem"]
        Object["ObjectSystem"]
        Sleep["SleepSystem"]
        Teaching["TeachingSystem"]
    end

    subgraph BG["Breeding / Genetics / Progression"]
        Breeding["BreedingSystem"]
    end

    subgraph DS["Debug / Audit / Save Systems"]
        Save["SaveSystem"]
        Telemetry["TelemetrySystem"]
        Debug["DebugUI"]
    end

    subgraph BS["Battle Snapshot Layer"]
        Battle["BattleSystem"]
    end

    Core --> Zone
    Core --> Render
    Core --> UI
    Core --> Status
    Core --> Behavior
    Core --> Object
    Core --> Sleep
    Core --> Teaching
    Core --> Breeding
    Core --> Save
    Core --> Telemetry
    Core --> Debug

    Save --> Durable
    Core -. snapshot / commit .-> Battle
```

This is the current best visual map of the major owner boundaries and the separation between:

- world/render/UI
- shared life-simulation systems
- breeding/progression
- debug/save systems
- the isolated battle snapshot layer

## Life-Simulation Container

```mermaid
flowchart TB
    LS["LifeSim"]
    LS --> Identity["identity<br/>entityType<br/>archetype<br/>source"]
    LS --> Drives["drives<br/>selfMaintenance<br/>safetyAvoidance<br/>resourceControl<br/>socialConnection<br/>caregiving<br/>exploration<br/>statusExpression<br/>rest"]
    LS --> Emotions["emotions<br/>threat<br/>relief<br/>attachment<br/>rejection<br/>significance<br/>failure<br/>curiosity<br/>agitation<br/>exhaustion"]
    LS --> Memories["memories<br/>place<br/>object<br/>interaction<br/>outcome<br/>routine<br/>social<br/>danger<br/>care"]
    LS --> Social["socialEdges<br/>trust<br/>comfort<br/>attachment<br/>dependence<br/>rivalry<br/>resentment<br/>admiration<br/>protectiveness"]
    LS --> Routines["routines<br/>movement<br/>social<br/>care<br/>resource<br/>rest<br/>vigilance<br/>teaching"]
    LS --> Interpretation["interpretation<br/>clarity<br/>lastSignals<br/>warpedSignals"]
    LS --> Distortion["distortion<br/>traumaBias<br/>anxietyBias<br/>withdrawalBias<br/>fixationBias<br/>insomniaBias<br/>oversleepBias<br/>warpedTeachingBias"]
    LS --> Genetics["genetics<br/>source<br/>baselineTraits<br/>inheritedTraits<br/>heritageTags<br/>lineageIds"]
    LS --> Upbringing["upbringing<br/>imprintSources<br/>lessons<br/>routineReinforcement"]
    LS --> Lifecycle["lifecycle<br/>stage<br/>ageTicks<br/>deathState<br/>upbringingState"]
```

This version is usable and much closer to the implemented structure than the first pass. It is best treated as a reference plate for the major compartments of the butterfly life-simulation state.

## Sleep State Machine

```mermaid
flowchart LR
    Comfort["sleepComfort"]
    Resistance["wakeResistance"]
    Recovery["sleepRecoveryMultiplier"]
    Insomnia["insomniaBias"]
    OversleepBias["oversleepBias"]

    Awake["awake"]
    Settling["settling_sleep"]
    Normal["normal_sleep"]
    Oversleep["oversleeping"]
    Forced["forced_battle_sleep"]

    Awake -->|when exhaustion threshold is crossed| Settling
    Awake -->|when forced sleep effect lands| Forced
    Settling -->|after settling duration| Normal
    Settling -->|if interrupted| Awake
    Normal -->|when recovery threshold is met| Awake
    Normal -->|when oversleep pressure is high| Oversleep
    Oversleep -->|when oversleep finishes| Awake
    Forced -->|when forced sleep effect ends| Awake

    Comfort -.-> Settling
    Comfort -.-> Normal
    Resistance -.-> Normal
    Resistance -.-> Forced
    Recovery -.-> Normal
    Recovery -.-> Forced
    Insomnia -.-> Settling
    OversleepBias -.-> Oversleep
```

This is the current visual summary of the sleep-state transitions and the side inputs that influence sleep and wake behavior.

## Teaching / Trust Flow

```mermaid
flowchart TB
    subgraph T1["Path 1: Wise butterfly teaching aura"]
        Pulse["teaching pulse emitted"]
        Listeners["listeners in radius"]
        Begin["begin lesson"]
        Active["active lesson timer"]
        Resolve["resolve lesson"]
        Packet["packet added"]
        Upbringing["upbringing lesson added"]
        Memory["social memory added"]
        Edge["social edge adjusted"]
        Routine["routine reinforced"]

        Pulse --> Listeners --> Begin --> Active --> Resolve --> Packet --> Upbringing --> Memory --> Edge --> Routine
    end

    subgraph T2["Path 2: Skittish butterfly trust cascade"]
        Fed["skittish butterfly fed"]
        Cascade["trust cascade emitted"]
        Nearby["nearby butterflies affected"]

        Fed --> Cascade --> Nearby --> Memory
        Nearby --> Edge
    end

    FeedFollow["feeding / following"] --> Packet
    FeedFollow --> Routine
```

This is especially useful when reasoning about how memories, social edges, and routine reinforcement connect.

## Genetics / Breeding Lifecycle

```mermaid
flowchart TB
    Male["eligible male"]
    Female["eligible female"]
    Pheromone["pheromone attraction"]
    Mating["mating state"]
    Complete["complete mating"]
    Preg["pregnancy assigned to female"]
    Flower["target flower selection"]
    Egg["egg attached to flower"]
    Caterpillar["egg hatch into caterpillar"]
    Chrysalis["caterpillar to chrysalis lifecycle"]
    Hybrid["hybrid butterfly spawn"]
    Journal["hybrid journal entry created"]

    subgraph Rules["Inheritance Rules"]
        R1["child sex is random"]
        R2["core traits are averaged from both parents"]
        R3["one parent ability is chosen randomly"]
        R4["each wing donor is chosen independently from mother or father"]
        R5["colors are averaged from both parents"]
        R6["bred fertility uses are limited"]
    end

    subgraph Artifacts["Persistent Artifacts"]
        A1["pregnancy data"]
        A2["lifecycleData"]
        A3["hybridGenome"]
        A4["hybridJournal entry"]
    end

    Male --> Pheromone
    Female --> Pheromone
    Pheromone --> Mating --> Complete --> Preg --> Flower --> Egg --> Caterpillar --> Chrysalis --> Hybrid --> Journal

    Rules -.-> Hybrid
    Artifacts -.-> Preg
    Artifacts -.-> Hybrid
    Artifacts -.-> Journal
```

This shows the implemented breeding flow and the side panel inheritance rules in a compact visual form.

## Controls / UI Map

```mermaid
flowchart TB
    subgraph Start["title / start controls"]
        StartAny["any key / click"]
    end

    subgraph Garden["normal garden controls"]
        D["D debug mode"]
        B["B boundary zones"]
        C["C collection"]
        I["I inspect"]
    end

    subgraph Access["accessibility controls"]
        A["A accessibility panel"]
        M["M reduced motion"]
        T["T trail visibility"]
        G["G background atmosphere"]
        H["H high contrast UI"]
        S["S battle motion simplify"]
    end

    subgraph DebugCtl["debug / audit controls"]
        QE["Q / E debug tool cycle"]
        Space["Space debug placement"]
        K["K save"]
        L["L load"]
        V["V roundtrip verify"]
        N["N snapshot diff"]
        P["P next audit preset"]
        O["O export audit setup"]
        U["U import audit setup"]
        Y["Y audit world"]
        J["J reseed replay"]
    end

    subgraph Collection["collection controls"]
        Arrows["arrow keys navigation"]
        R["R rename current hybrid"]
    end

    subgraph UIRegions["main UI regions"]
        Inspect["inspect panel"]
        Accessibility["accessibility panel"]
        DebugPanel["debug panel"]
        BattleHUD["battle HUD"]
        Notebook["butterfly collection notebook"]
    end

    C --> Notebook
    I --> Inspect
    A --> Accessibility
    D --> DebugPanel
    S --> BattleHUD
```

This controlled diagram is the exact version of the controls/UI map. The Gemini render is still kept as a supplemental player-facing plate because it looks friendlier, but this Mermaid version is the authoritative structure.

## Pending Diagrams

## Save / Load / Audit Workflow

```mermaid
flowchart LR
    subgraph DT["durable truth"]
        A["live game state"]
        B["SaveSystem serialize"]
        C["local storage save"]
        D["load from storage"]
    end

    subgraph RD["rebuilt derived state"]
        E["entity reconstruction"]
        F["foundation system restoration"]
        G["derived state rebuild"]
    end

    subgraph AO["audit-only tooling"]
        H["roundtrip verification"]
        I["snapshot capture"]
        J["snapshot diff"]
        K["invariant checker"]
        L["audit world"]
        M["audit report storage"]
        N["replay metadata / reseed"]
    end

    A --> B --> C --> D
    D --> E
    D --> F
    E --> G
    F --> G

    A --> I --> J
    A --> H
    D --> H
    G --> H

    A --> K
    H --> L
    J --> L
    K --> L
    L --> M
    N --> L
```

This Mermaid version is intentionally stricter than the Gemini attempts. It preserves the exact workflow nodes we wanted without inventing extra validator/rebuilder/deserializer layers.

## Battle Snapshot Separation

```mermaid
flowchart LR
    A["live garden entities"]
    B["battle snapshot participants<br/>hp<br/>pressure<br/>retreat state<br/>exhaustion<br/>sleep subtype<br/>action family/subtype<br/>status bundle<br/>cooldowns<br/>charges<br/>carried objects<br/>social edges<br/>genetics<br/>special ability"]
    C["battle-local mutations"]
    D["resolve step"]
    E["commit payload"]
    F["writeback to live garden entities"]

    A --> B --> C --> D --> E --> F --> A
```

This controlled version keeps the architecture exact:

- live garden truth is separate from battle-local mutation
- the battle snapshot is the container for all participant data
- only the commit payload writes anything back to the live garden

For the current generation status, see:

- [DIAGRAM-AUDIT-STATUS.md](./DIAGRAM-AUDIT-STATUS.md)
