const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'docs', 'guidebook');
const outputHtml = path.join(outputDir, 'PAPILIONEM-COMPLETE-GUIDEBOOK.html');

function loadConfig() {
    const code = fs.readFileSync(path.join(root, 'core', 'config.js'), 'utf8');
    const context = { console };
    vm.createContext(context);
    vm.runInContext(`${code}\nglobalThis.__guideCfg = gameConfig;`, context);
    return context.__guideCfg;
}

const cfg = loadConfig();

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatValue(value) {
    if (Array.isArray(value)) return value.map(item => formatValue(item)).join(', ');
    if (value && typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function flattenObject(value, prefix = '') {
    const rows = [];
    if (Array.isArray(value)) {
        rows.push({ key: prefix || '(root)', value: formatValue(value) });
        return rows;
    }
    for (const [key, nextValue] of Object.entries(value || {})) {
        const nextKey = prefix ? `${prefix}.${key}` : key;
        if (nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)) {
            rows.push(...flattenObject(nextValue, nextKey));
        } else {
            rows.push({ key: nextKey, value: formatValue(nextValue) });
        }
    }
    return rows;
}

function renderKeyValueTable(title, rows) {
    return `\n<section class="config-block">\n  <h4>${escapeHtml(title)}</h4>\n  <table class="kv-table">\n    <thead><tr><th>Setting</th><th>Value</th></tr></thead>\n    <tbody>\n      ${rows.map(row => `<tr><td><code>${escapeHtml(row.key)}</code></td><td><code>${escapeHtml(row.value)}</code></td></tr>`).join('\n')}\n    </tbody>\n  </table>\n</section>`;
}

function renderBulletList(items) {
    return `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
}

function renderVisualPlate(src, title, caption) {
    return `<figure class="visual-plate"><img src="${escapeHtml(src)}" alt="${escapeHtml(title)}"><figcaption><strong>${escapeHtml(title)}.</strong> ${escapeHtml(caption)}</figcaption></figure>`;
}

const diagrams = {
  systemsArchitecture: `
flowchart LR
    Core["GameCore"]
    Durable["Durable Truth"]

    subgraph WR["World / Render / UI Systems"]
        Zone["ZoneSystem"]
        Render["RenderManager<br/>visuals only"]
        UI["GameUI"]
        Interaction["InteractionSystem"]
    end

    subgraph LS["Life-Simulation Owners"]
        Status["StatusSystem"]
        Behavior["BehaviorSystem"]
        Object["ObjectSystem"]
        Sleep["SleepSystem"]
        Teaching["TeachingSystem"]
        Breeding["BreedingSystem"]
    end

    subgraph DS["Debug / Audit / Persistence"]
        Save["SaveSystem"]
        Progression["ProgressionManager"]
        Telemetry["TelemetrySystem"]
        Debug["DebugUI"]
    end

    subgraph BS["Battle Snapshot Layer"]
        Battle["BattleSystem"]
    end

    Core --> Zone
    Core --> Render
    Core --> UI
    Core --> Interaction
    Core --> Status
    Core --> Behavior
    Core --> Object
    Core --> Sleep
    Core --> Teaching
    Core --> Breeding
    Core --> Save
    Core --> Progression
    Core --> Telemetry
    Core --> Debug
    Save --> Durable
    Core -. snapshot / commit .-> Battle
`,
  controlsMap: `
flowchart TB
    subgraph Start["Start / Entry"]
        StartAny["Any key or click"]
    end

    subgraph Garden["Normal Garden Controls"]
        D["D Debug mode"]
        B["B Boundary overlay"]
        C["C Collection / journal"]
        I["I Inspect panel"]
    end

    subgraph Access["Accessibility Controls"]
        A["A Accessibility panel"]
        M["M Reduced motion"]
        T["T Trail visibility"]
        G["G Background atmosphere"]
        H["H High contrast UI"]
        S["S Battle motion simplify"]
    end

    subgraph DebugCtl["Debug / Audit Controls"]
        QE["Q / E Cycle debug tools"]
        Space["Space Place current tool"]
        X["X Export zone data"]
        K["K Save"]
        L["L Load"]
        V["V Verify roundtrip"]
        N["N Compare snapshots"]
        P["P Next audit preset"]
        O["O Export audit setup"]
        U["U Import audit setup"]
        Y["Y Run gameplay audit"]
        J["J Reseed replay"]
    end

    subgraph Collection["Collection Controls"]
        Arrows["Left / Right page"]
        R["R Rename current hybrid"]
    end
`,
  cursorInteraction: `
flowchart LR
    Cursor["Player cursor"]
    Velocity["Cursor velocity"]
    Gentle["Gentle hover check"]
    Near["Nearby butterfly check"]
    Hover["Hover timer builds"]
    Trust["Display / follow / trust memory"]
    Fear["Scare memory / threat state"]

    Cursor --> Velocity --> Gentle
    Cursor --> Near
    Gentle -->|still enough| Hover
    Gentle -->|too fast| Fear
    Near --> Hover
    Hover -->|threshold reached| Trust
`,
  lifeSimContainer: `
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
`,
  sleepStateMachine: `
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

    Awake -->|exhaustion threshold crossed| Settling
    Awake -->|forced sleep effect lands| Forced
    Settling -->|settling duration completed| Normal
    Settling -->|interrupted| Awake
    Normal -->|recovered enough| Awake
    Normal -->|oversleep pressure high| Oversleep
    Oversleep -->|oversleep finishes| Awake
    Forced -->|effect ends| Awake

    Comfort -.-> Settling
    Comfort -.-> Normal
    Resistance -.-> Normal
    Resistance -.-> Forced
    Recovery -.-> Normal
    Recovery -.-> Forced
    Insomnia -.-> Settling
    OversleepBias -.-> Oversleep
`,
  teachingTrustFlow: `
flowchart TB
    subgraph T1["Wise Butterfly Teaching Aura"]
        Pulse["Teaching pulse emitted"]
        Listeners["Listeners in radius"]
        Begin["beginTeach"]
        Active["active lesson timer"]
        Resolve["resolveLesson"]
        Packet["lesson packet"]
        Upbringing["upbringing lesson"]
        Memory["social memory"]
        Edge["social edge shift"]
        Routine["routine reinforced"]

        Pulse --> Listeners --> Begin --> Active --> Resolve --> Packet --> Upbringing --> Memory --> Edge --> Routine
    end

    subgraph T2["Skittish Butterfly Trust Cascade"]
        Fed["Skittish butterfly fed"]
        Cascade["Trust cascade emitted"]
        Nearby["Nearby butterflies"]

        Fed --> Cascade --> Nearby --> Memory
        Nearby --> Edge
    end

    Visit["Flower visit"] --> Memory
    Visit --> Routine
`,
  geneticsLifecycle: `
flowchart TB
    Male["Eligible male"]
    Female["Eligible female"]
    Attraction["Pheromone attraction"]
    Mating["Mating state"]
    Pregnancy["Pregnancy assigned"]
    Flower["Target flower"]
    Egg["Egg on flower"]
    Caterpillar["Caterpillar"]
    Chrysalis["Chrysalis flower"]
    Adult["Hybrid butterfly"]
    Journal["Hybrid journal entry"]

    Male --> Attraction
    Female --> Attraction --> Mating --> Pregnancy --> Flower --> Egg --> Caterpillar --> Chrysalis --> Adult --> Journal

    subgraph Inheritance["Inheritance Rules"]
        Sex["Child sex random"]
        Traits["Core traits averaged"]
        Ability["One parent ability chosen"]
        Wings["Each wing donor chosen independently"]
        Colors["Colors averaged"]
        Fertility["Bred fertility uses limited"]
    end

    Inheritance -.-> Adult
`,
  progressionLoop: `
flowchart LR
    Encounter["Encounter butterfly"]
    Collect["Collection stats update"]
    Breed["Breed hybrid"]
    Journal["Hybrid journal entry"]
    Rename["Optional rename"]
    Save["Progression save"]

    Encounter --> Collect
    Breed --> Journal --> Rename --> Save
    Collect --> Save
`,
  saveLoadAudit: `
flowchart TB
    Live["Live game state"]
    Serialize["SaveSystem serializeState"]
    Storage["localStorage save slot"]
    Deserialize["SaveSystem deserialize / migrate"]
    Restore["Entity + system restore"]
    Rebuild["Rebuild derived state"]
    Audit["Roundtrip verify / invariant checks / gameplay audit"]

    Live --> Serialize --> Storage --> Deserialize --> Restore --> Rebuild --> Audit
`,
  battleSnapshot: `
flowchart LR
    Garden["Live garden entities"]
    Snapshot["Battle snapshot copy"]
    Resolve["Battle-local mutation<br/>HP / pressure / cooldowns / commit memories"]
    Commit["Selective commit payload"]
    Garden2["Live garden entities updated"]

    Garden -. read only .-> Snapshot --> Resolve --> Commit --> Garden2
`
};

const toc = [
['guide-overview', 'Guide overview and how to use this book'],
['game-shape', 'What the game is and how it flows'],
['controls', 'All player, accessibility, collection, and debug controls'],
['world-camera', 'World, camera, rendering, and readability'],
['entities', 'Butterflies, flowers, caterpillars, and lifecycle objects'],
['player-logic', 'What the player actually changes in the simulation'],
['archetypes-abilities', 'Archetypes, traits, abilities, and spawn logic'],
['life-sim', 'The neuro-social life-simulation model'],
['sleep', 'Sleep, oversleep, comfort, and wake rules'],
['teaching', 'Teaching, trust, routines, and social pacing'],
['genetics', 'Genetics, breeding, lineage, and upbringing'],
['progression', 'Progression, collection, and hybrid journaling'],
['owners', 'Internal logic ownership and system boundaries'],
['save-audit', 'Save/load, replay, audit, and telemetry'],
['battle', 'Battle snapshot layer'],
['assets', 'Sprite and asset pipeline'],
['visual-supplement', 'Visual supplement: anatomy, archetypes, hybrids, and lifecycle visuals'],
['config', 'Exact tunable config tables'],
['glossary', 'Glossary']
];

const configTables = [
['Rendering', flattenObject(cfg.rendering)],
['Canvas', flattenObject(cfg.canvas)],
['Grid', flattenObject(cfg.grid)],
['Isometric', flattenObject(cfg.isometric)],
['Entities: limits and defaults', flattenObject(cfg.entities)],
['Particles', flattenObject(cfg.particles)],
['Color pools', flattenObject(cfg.colorPools)],
['Interaction', flattenObject(cfg.interaction)],
['Effects', flattenObject(cfg.effects)],
['Debug', flattenObject(cfg.debug)],
['Accessibility', flattenObject(cfg.accessibility)],
['Simulation', flattenObject(cfg.simulation)],
['Balance: sleep', flattenObject(cfg.balance.sleep)],
['Balance: social', flattenObject(cfg.balance.social)],
['Balance: hybrid', flattenObject(cfg.balance.hybrid)],
['World', flattenObject(cfg.world)],
['Registries', flattenObject(cfg.registries)],
['System order', flattenObject(cfg.systems)]
];

const today = new Date().toISOString().slice(0, 10);
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Papilionem Complete Guidebook</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @page { size: Letter; margin: 0.6in; }
    :root { --bg:#fcf8f3; --ink:#2a2431; --muted:#6d6775; --line:#d8cfbf; --panel:#fffdf9; --accent:#356b59; --accent-soft:#e8f2ed; --warm:#7f4f24; --mono:"Cascadia Mono","Consolas",monospace; --sans:"Segoe UI","Trebuchet MS",sans-serif; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family:var(--sans); line-height:1.45; font-size:11pt; }
    main { max-width:8in; margin:0 auto; }
    .page { break-after:page; min-height:10in; padding:0.2in 0 0 0; }
    .section-break { break-before:page; padding-top:0.15in; }
    h1,h2,h3,h4 { line-height:1.15; margin:0 0 0.2rem 0; }
    h1 { font-size:28pt; margin-top:0.2in; }
    h2 { font-size:18pt; margin-top:0.35in; padding-top:0.08in; border-top:2px solid var(--line); }
    h3 { font-size:13pt; margin-top:0.25in; }
    h4 { font-size:11pt; margin-top:0.18in; }
    p,li { margin-top:0.15rem; margin-bottom:0.15rem; }
    .cover-note,.subtle { color:var(--muted); }
    .hero { border:2px solid var(--ink); background:linear-gradient(135deg, #fffaf2, #f7efe2); padding:0.28in; border-radius:16px; }
    .hero-grid { display:grid; grid-template-columns:1.2fr 0.8fr; gap:0.22in; align-items:start; }
    .shape-box { font-family:var(--mono); white-space:pre-wrap; background:var(--panel); border:1px solid var(--line); padding:0.16in; border-radius:12px; font-size:9pt; }
    .toc { display:grid; gap:0.06in; margin-top:0.18in; padding:0.18in; border:1px solid var(--line); background:var(--panel); border-radius:12px; }
    .toc a { color:var(--ink); text-decoration:none; display:flex; justify-content:space-between; gap:0.12in; border-bottom:1px dotted #c8c0b2; padding-bottom:0.04in; }
    .callout { margin:0.16in 0; padding:0.14in 0.16in; border-left:4px solid var(--accent); background:var(--accent-soft); border-radius:8px; }
    .warning { border-left-color:var(--warm); background:#f8eee4; }
    .diagram { margin:0.18in 0 0.26in 0; padding:0.12in; background:var(--panel); border:1px solid var(--line); border-radius:12px; }
    .kv-table { width:100%; border-collapse:collapse; margin:0.08in 0 0.16in 0; font-size:9.5pt; }
    .kv-table th,.kv-table td { border:1px solid var(--line); padding:0.06in 0.08in; vertical-align:top; text-align:left; }
    .kv-table th { background:#f1eadf; }
    .columns-2 { display:grid; grid-template-columns:1fr 1fr; gap:0.18in; }
    .pill-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:0.08in; margin:0.1in 0; }
    .pill { border:1px solid var(--line); background:var(--panel); border-radius:999px; padding:0.05in 0.1in; font-size:9.5pt; }
    code { font-family:var(--mono); font-size:9pt; }
    .appendix-grid { display:grid; gap:0.14in; }
    .config-block { break-inside:avoid; }
    .visual-plate { margin:0.16in 0 0.22in 0; padding:0.14in; border:1px solid var(--line); background:var(--panel); border-radius:16px; break-inside:avoid; }
    .visual-plate img { display:block; width:100%; height:auto; border:1px solid #e6ddd0; border-radius:12px; background:#fffaf5; }
    .visual-plate figcaption { margin-top:0.1in; color:var(--muted); font-size:9.8pt; }
    .plate-page { break-before:page; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad:false, theme:'base', securityLevel:'loose', themeVariables:{ primaryColor:'#fffaf2', primaryTextColor:'#2a2431', primaryBorderColor:'#7f4f24', lineColor:'#356b59', secondaryColor:'#f4ede3', tertiaryColor:'#eef5f1', fontFamily:'Segoe UI, Trebuchet MS, sans-serif' }, flowchart:{ useMaxWidth:true, htmlLabels:true, curve:'basis' } }); window.addEventListener('load', async () => { await mermaid.run({ querySelector: '.mermaid' }); document.body.dataset.mermaidReady = 'true'; });</script>
</head>
<body>
<main>
  <section class="page">
    <div class="hero"><div class="hero-grid"><div><h1>Papilionem Complete Guidebook</h1><p class="cover-note">Built from the current implemented milestone branch on ${escapeHtml(today)}.</p><p>This guidebook is meant to do two jobs at once:</p><ul><li>teach an average player or tester how the game works</li><li>preserve the exact internal logic, tuning, and system boundaries for future reference</li></ul><div class="callout"><strong>Important note:</strong> when this guide talks about the game's neuro layer, it does <em>not</em> mean a machine-learning neural network. Papilionem uses a simulated life-model made of drives, emotions, memory, social edges, routines, interpretation, distortion, genetics, and lifecycle state.</div></div><div class="shape-box">Guidebook shape\npage 1: table of contents\npart 1: how to play and read the garden\npart 2: how the living simulation works\npart 3: internal systems, save/audit, battle\npart 4: visual supplement + exact config tables + glossary</div></div></div>
    <h2>Table Of Contents</h2>
    <nav class="toc">${toc.map(([id, label], index) => `<a href="#${id}"><span>${index + 1}. ${escapeHtml(label)}</span><span>&gt;</span></a>`).join('\n')}</nav>
  </section>
  <section id="guide-overview" class="section-break"><h2>1. Guide Overview And How To Use This Book</h2><div class="columns-2"><div><h3>Who this is for</h3>${renderBulletList(['players who want to understand what they are seeing','testers who need to reproduce and describe behavior','developers who need exact system logic and tunable values','future-you when you want one place that explains the whole project'])}</div><div><h3>How it is organized</h3>${renderBulletList(['the early sections are plain-language and player-facing','the middle sections explain the life-simulation model','the later sections cover persistence, audit tools, battle, and assets','the appendix contains exact config values pulled from code'])}</div></div></section>
  <section id="game-shape"><h2>2. What The Game Is And How It Flows</h2><div class="diagram"><div class="mermaid">${diagrams.systemsArchitecture}</div></div><p>Papilionem is a living-garden simulation first. The butterflies are not just decorative sprites. Each one carries a persistent internal model that shapes how it moves, whom it trusts, how it learns, how it sleeps, and what it can pass on to offspring.</p><div class="callout"><strong>The short version:</strong> the player enters a garden, influences butterflies mainly through presence and care, and watches a long-running social, genetic, and lifecycle simulation unfold over time.</div><h3>High-level flow</h3><div class="shape-box">Title screen\nv\nliving garden\n- butterflies move, react, trust, fear, sleep\n- flowers support feeding, eggs, caterpillars\n- teaching and memory alter later behavior\n- breeding creates hybrid lineages\nv\noptional debug / audit / replay\nv\noptional battle snapshot layer</div></section>
  <section id="controls"><h2>3. All Controls</h2><div class="diagram"><div class="mermaid">${diagrams.controlsMap}</div></div><h3>Normal play controls</h3>${renderKeyValueTable('Normal controls',[{ key:'Any key / click', value:'Leave title screen and enter garden' },{ key:'D', value:'Toggle debug mode' },{ key:'B', value:'Show boundary overlay while held' },{ key:'C', value:'Open butterfly collection / journal' },{ key:'I', value:'Open inspect panel' },{ key:'A', value:'Open accessibility panel' },{ key:'M', value:'Toggle reduced motion' },{ key:'T', value:'Cycle trail visibility' },{ key:'G', value:'Cycle background atmosphere' },{ key:'H', value:'Toggle high-contrast UI' },{ key:'S', value:'Toggle battle motion simplify' },{ key:'Left / Right', value:'Change collection page' },{ key:'R', value:'Rename current hybrid in collection' }])}<h3>Debug and audit controls</h3>${renderKeyValueTable('Debug controls',[{ key:'Arrow keys', value:'Move debug cursor on isometric grid' },{ key:'Q / E', value:'Cycle debug tools' },{ key:'Space', value:'Place current debug tool' },{ key:'X', value:'Export zone data' },{ key:'K', value:'Save game state' },{ key:'L', value:'Load game state' },{ key:'V', value:'Verify save/load roundtrip' },{ key:'N', value:'Compare recent snapshots' },{ key:'P', value:'Load next audit preset' },{ key:'O', value:'Export audit setup' },{ key:'U', value:'Import audit setup' },{ key:'Y', value:'Run gameplay audit' },{ key:'J', value:'Reseed replay session' }])}</section>
  <section id="world-camera"><h2>4. World, Camera, Rendering, And Readability</h2><p>The shipped build is a single-zone foundation, but the systems are already built as if the world can grow into multiple zones later. The camera and render layer know about view modes and readability rules.</p><div class="pill-grid"><div class="pill"><strong>Canvas:</strong> ${escapeHtml(`${cfg.canvas.baseWidth}×${cfg.canvas.baseHeight}`)}</div><div class="pill"><strong>Grid:</strong> ${escapeHtml(`${cfg.grid.gridWidth}×${cfg.grid.gridHeight}`)}</div><div class="pill"><strong>Tile:</strong> ${escapeHtml(`${cfg.isometric.tileWidth}×${cfg.isometric.tileHeight} isometric`)}</div><div class="pill"><strong>Modes:</strong> ${escapeHtml(cfg.world.viewModes.join(', '))}</div></div>${renderBulletList(['Focused garden mode allows more background motion and decorative presence.','Overview mode suppresses moving background effects so the garden stays readable from afar.','Battle mode removes moving background effects and afterimage trails so tactical readability wins over decoration.','Accessibility toggles can further reduce motion, raise contrast, and simplify visual density.'])}<div class="callout warning"><strong>Internal rule:</strong> rendering changes appearance only. It never changes gameplay range, collision, ownership, or state truth.</div></section>
  <section id="entities"><h2>5. Entities And Lifecycle Objects</h2><h3>Butterflies</h3><p>Butterflies are the main living agents. They hold personality traits, a life-simulation state, ability state, breeding state, social history, and long-term progression visibility.</p><h3>Flowers</h3><p>Flowers are consumable, non-carryable garden objects with their own lifecycle. They bloom, mature, wilt, and dissolve. They can also become lifecycle hosts for eggs and chrysalis stages.</p>${renderKeyValueTable('Flower lifecycle defaults',[{ key:'stageDurations.bloom', value:'1200 frames (~20s at 60fps)' },{ key:'stageDurations.mature', value:'2400 frames (~40s)' },{ key:'stageDurations.wilting', value:'1200 frames (~20s)' },{ key:'stageDurations.dissolve', value:'360 frames (~6s)' },{ key:'flower types', value:'daisy, tulip, bush, lavender, sprout' },{ key:'resource tags', value:'nectar, care, garden-object' }])}<h3>Caterpillars</h3><p>Caterpillars are a real intermediate life stage, not just a note in the breeding system. They seek a food flower first, then seek a second flower to become a chrysalis host. If they fail to find what they need in time, they can starve and die.</p>${renderKeyValueTable('Caterpillar behavior defaults',[{ key:'initial phase', value:'seekingFood' },{ key:'follow-up phase', value:'seekingChrysalis' },{ key:'phase timeout', value:'10800 frames (~3 minutes)' },{ key:'speed', value:'0.35' },{ key:'lifecycle.stage', value:'larval / phase-driven' }])}</section>
  <section id="player-logic"><h2>6. What The Player Actually Changes</h2><div class="diagram"><div class="mermaid">${diagrams.cursorInteraction}</div></div><p>The player does not command butterflies directly like an RTS unit. The core player influence is the cursor and the conditions the player creates around the garden.</p>${renderBulletList(['A calm cursor can build gentle hover interactions and trust-related memory.','A fast cursor can startle butterflies and create danger memory.','Feeding and flower contact create object and outcome memories.','Debug mode can directly create scenarios, but normal play mostly nudges the living systems rather than bypassing them.'])}</section>
  <section id="archetypes-abilities"><h2>7. Archetypes, Traits, Abilities, And Spawn Logic</h2>${renderKeyValueTable('Butterfly roster',[{ key:'friendly', value:'warm, trusting, support-oriented' },{ key:'cautious', value:'delicate, patient, sparkle-oriented' },{ key:'energetic', value:'fast, excitable, state-boosting' },{ key:'skittish', value:'nervous, reactive, trust-cascade capable' },{ key:'wise', value:'calm, teaching-oriented' },{ key:'mystic', value:'sleep-comfort and calm aura oriented' },{ key:'golden', value:'special legendary presence' },{ key:'hybrid', value:'bred mixture with inherited traits and one parent ability' }])}${renderKeyValueTable('Shared trait axes',[{ key:'speed', value:'movement feel and pacing' },{ key:'jitteriness', value:'movement noise and nervousness' },{ key:'trustPropensity', value:'how likely trust is to build' },{ key:'trustSpeed', value:'how quickly trust changes' },{ key:'scareThreshold', value:'how easy it is to scare the butterfly' },{ key:'happinessBonus', value:'how strongly positive outcomes raise mood' }])}${renderKeyValueTable('Ability mapping',[{ key:'friendly', value:'Warm Welcome: healing and panic support aura' },{ key:'cautious', value:'Delicate Pink: sparkle / flower-oriented presence' },{ key:'energetic', value:'Electric Violet: movement speed and energetic state boost' },{ key:'skittish', value:'Nervous Jewel: trust cascade on care event' },{ key:'wise', value:'Ancient Scholar: teaching pulse and lesson support' },{ key:'mystic', value:'Twilight Dancer: sleep comfort and recovery support' },{ key:'golden', value:'legendary special crown state' },{ key:'hybrid', value:'one chosen parent ability inherited into hybrid genome' }])}${renderKeyValueTable('Current base spawn weights',[{ key:'friendly', value:'40' },{ key:'cautious', value:'15' },{ key:'energetic', value:'15' },{ key:'skittish', value:'10' },{ key:'wise', value:'10' },{ key:'mystic', value:'10' },{ key:'golden', value:'special, not part of normal weighted spawn' }])}</section>
  <section id="life-sim"><h2>8. The Neuro-Social Life-Simulation Model</h2><div class="diagram"><div class="mermaid">${diagrams.lifeSimContainer}</div></div><p>This is the heart of the game. Every major living agent is represented by a structured life-simulation state.</p><div class="callout"><strong>Plain-language summary:</strong> instead of a black-box AI brain, the game stores explicit pressures, feelings, memories, relationships, habits, inherited traits, and life stage. Those pieces are visible, inspectable, and persistent.</div><h3>Drives</h3><p>Drives are long-running pressures: self-maintenance, safety avoidance, resource control, social connection, caregiving, exploration, status expression, and rest.</p><h3>Emotion channels</h3><p>Emotion channels are current-state readings such as threat, relief, attachment, rejection, significance, failure, curiosity, agitation, and exhaustion.</p><h3>Memory packets</h3><p>Memories are concrete packets, not vague story text. Each packet has a family, subject, valence, strength, recency, reinforcement count, emotional tags, and metadata.</p><h3>Social edges</h3><p>Social edges are longer-term relationship summaries: trust, comfort, attachment, dependence, rivalry, resentment, admiration, and protectiveness.</p><h3>Routines</h3><p>Routines are reinforced habits: movement, social, care, resource, rest, vigilance, and teaching.</p><h3>Interpretation and distortion</h3><p>Interpretation tracks clarity and signal handling. Distortion biases such as trauma, anxiety, insomnia, or warped teaching do not create separate disconnected systems. They bend the shared systems over time.</p></section>
  <section id="sleep"><h2>9. Sleep, Oversleep, Comfort, And Wake Rules</h2><div class="diagram"><div class="mermaid">${diagrams.sleepStateMachine}</div></div><p>Sleep is a full system with owned state transitions. Butterflies do not just have a boolean asleep flag. They can be settling, normally asleep, oversleeping, or in forced battle sleep.</p>${renderBulletList(['Exhaustion grows passively while awake.','Rest drive, insomnia bias, and comfort influence how easy it is to settle.','Sleep assist sources and sleep-related status modifiers increase comfort or recovery.','Oversleep is not random noise; it is driven by oversleep pressure and oversleep bias.','Forced battle sleep is intentionally separated from normal garden sleep so battle effects do not accidentally use oversleep rules.'])}${renderKeyValueTable('Stored sleep state fields',[{ key:'subtype', value:'current sleep subtype or null' },{ key:'exhaustion', value:'current exhaustion value' },{ key:'sleepPressure', value:'rest-drive-linked sleep pressure' },{ key:'sleepComfort', value:'comfort gathered from assists and statuses' },{ key:'wakeDrive', value:'wake pressure against staying asleep' },{ key:'oversleepPressure', value:'pressure to remain asleep longer than needed' },{ key:'oversleepHabit', value:'distortion-linked oversleep predisposition' },{ key:'assistSources', value:'queued sleep assists for this update' },{ key:'settlingSeconds', value:'time spent settling' },{ key:'asleepSeconds', value:'time spent asleep' },{ key:'lastSleepStartSeconds', value:'last sleep start timestamp' },{ key:'lastWakeSeconds', value:'last wake timestamp' },{ key:'lastWakeReason', value:'why the entity woke up' }])}</section>
  <section id="teaching"><h2>10. Teaching, Trust, Routines, And Social Pacing</h2><div class="diagram"><div class="mermaid">${diagrams.teachingTrustFlow}</div></div><p>Teaching is a real continuity system. A wise butterfly's aura begins a lesson, the lesson runs for a tunable duration, then the result is turned into a packet, upbringing note, social memory, edge adjustment, and routine reinforcement.</p><p>A skittish butterfly's trust cascade is also persistent. It does not just flash a temporary effect; it creates memory and relationship fallout in nearby butterflies.</p>${renderBulletList(['Flower visits can create object and outcome memory plus resource-routine reinforcement.','Following the player cursor can create trusted-cursor interaction memory.','Being scared by the player cursor can create danger memory tied to the cursor.','Teaching can raise interpretation clarity and teaching-related routine strength.'])}</section>
  <section id="genetics"><h2>11. Genetics, Breeding, Lineage, And Upbringing</h2><div class="diagram"><div class="mermaid">${diagrams.geneticsLifecycle}</div></div><p>Breeding is not a single spawn action. It is a staged lifecycle: attraction, mating, pregnancy, egg placement, caterpillar, chrysalis, adult hybrid, and journal entry.</p>${renderBulletList(['Males and females must both be eligible, free, and within pheromone radius.','Distance chooses the best attraction match among eligible pairs.','Pregnancy is assigned to the female and targeted toward an appropriate flower.','Egg and cocoon hatch timing is tunable and stored.','Hybrid adults inherit averaged core traits, blended colors, one chosen parent ability, and independently chosen wing donors.'])}<div class="callout"><strong>Genes vs upbringing:</strong> genes set the baseline predisposition. Upbringing does not erase that baseline; it reinforces, suppresses, clarifies, or distorts it over time.</div>${renderKeyValueTable('Hybrid lifecycle artifacts',[{ key:'pregnancy', value:'stored on female butterfly until egg lay' },{ key:'lifecycleData', value:'carries lineage and inheritance context through egg, caterpillar, and chrysalis stages' },{ key:'hybridGenome', value:'stored on resulting hybrid butterfly' },{ key:'hybridJournal entry', value:'stored in progression data and collection layer' }])}</section>
  <section id="progression"><h2>12. Progression, Collection, And Hybrid Journaling</h2><div class="diagram"><div class="mermaid">${diagrams.progressionLoop}</div></div><p>The progression layer turns the simulation into an archive. It stores encountered butterflies, collected butterflies, collection stats, hybrid journal entries, and the next hybrid id. The journal also supports renaming hybrids so discoveries feel personal and trackable.</p>${renderKeyValueTable('Progression storage',[{ key:'encounteredButterflies', value:'set of seen types' },{ key:'collectedButterflies', value:'set of collected types' },{ key:'butterflyCollectionStats', value:'aggregate collection stats' },{ key:'hybridJournal', value:'ordered hybrid entry list' },{ key:'nextHybridId', value:'next journal id counter' }])}</section>
  <section id="owners"><h2>13. Internal Logic Ownership And Boundaries</h2><p>One owner per truth is the main internal safety rule. This is how the game avoids double-applying logic or letting two systems disagree about the same state.</p>${renderKeyValueTable('Owner map',[{ key:'ZoneSystem', value:'world zones, focus, and mode context' },{ key:'StatusSystem', value:'timed effects, auras, cooldowns, charges, immunities, and aggregated modifiers' },{ key:'BehaviorSystem', value:'current action runtime and target choice' },{ key:'ObjectSystem', value:'carry, drop, delivery, and object ownership' },{ key:'SleepSystem', value:'sleep transitions and sleep visual state inputs' },{ key:'TeachingSystem', value:'lesson packets, trust cascades, social teaching fallout' },{ key:'BreedingSystem', value:'mating, pregnancy, eggs, caterpillars, chrysalis, adult hybrid spawn' },{ key:'SaveSystem', value:'durable serialization and migration' },{ key:'TelemetrySystem', value:'update/render metrics' },{ key:'RenderManager', value:'visuals only' },{ key:'BattleSystem', value:'isolated battle snapshot layer' }])}</section>
  <section id="save-audit"><h2>14. Save / Load, Replay, Audit, And Telemetry</h2><div class="diagram"><div class="mermaid">${diagrams.saveLoadAudit}</div></div><p>Persistence in Papilionem is designed around durable truth plus rebuilt derived state. Butterflies, flowers, caterpillars, progression, runtime values, and system-owned durable sub-states are serialized. Cheap derived values are reconstructed after load.</p>${renderBulletList(['SaveSystem captures butterfly, flower, and caterpillar state plus progression and selected runtime values.','Sleep state is synchronized into life-sim lifecycle fields before save so the durable record stays honest.','Roundtrip verification saves, reloads, rebuilds, and compares durable truth.','Gameplay audit chains snapshots, invariant checks, and persistence checks into one pass.','Replay metadata tracks session ids, seeds, and audit markers for reproducibility groundwork.'])}<h3>Telemetry</h3><p>Telemetry records recent update and render samples, including total update time, foundation time, entity time, particle time, render time, particle render time, entity counts, time scale, and view mode. It is meant to support optimization without changing game truth.</p></section>
  <section id="battle"><h2>15. Battle Snapshot Layer</h2><div class="diagram"><div class="mermaid">${diagrams.battleSnapshot}</div></div><p>Battle is intentionally isolated from the garden. When a battle starts, live entities are cloned into a battle snapshot. HP changes, pressure, retreat, cooldown spending, charge spending, and battle-generated social or memory outcomes are all recorded inside that snapshot first.</p><p>Only selected results are committed back into the live garden state. This keeps battle experimentation from corrupting normal simulation truth.</p></section>
  <section id="assets"><h2>16. Sprite And Asset Pipeline</h2><p>Runtime rendering uses the repository's asset folders, while the sprite manager slices, cleans, and composes those assets into renderable butterflies and lifecycle visuals.</p>${renderKeyValueTable('Sprite pipeline',[{ key:'butterfly wing base path', value:'assets/butterflies/' },{ key:'wing file organization', value:'separate male/female full wing composites per archetype' },{ key:'body sprite', value:'ephemera-butterfly-body-.png' },{ key:'antenna sprite', value:'ephemera-butterfly-antenna.png' },{ key:'cocoon sprites', value:'assets/cocoons/cocoon-unhatched.png and cocoon-hatched.png' },{ key:'caterpillar frames', value:'assets/caterpillars/caterpillar-crawl1/2/3.png' },{ key:'wing split point', value:'x=900, y=600' },{ key:'background cleanup rule', value:'near-black pixels converted to transparent' }])}<p>The render spec for hybrids can mix wing donors per wing, so hybrid visuals are not limited to a single parent's full wing set.</p></section>
  <section id="visual-supplement" class="section-break"><h2>17. Visual Supplement: Sprite Anatomy, Archetypes, Hybrids, And Lifecycle</h2><p>This section uses the actual runtime sprite assets from the project to show how the butterfly visuals are built, how the male and female versions differ at render time, how hybrids mix donor wings, and how the caterpillar-to-cocoon-to-adult lifecycle is displayed.</p>${renderBulletList(['The anatomy plate shows the body sprite, antenna sprite, wing sheet split points, and anchor facts used by the sprite manager.','The comparison plates show assembled in-game male and female renders for every archetype, not just raw wing sheets.','The hybrid plate uses mixed donor wings so the visual inheritance logic can be read at a glance.','The lifecycle plate shows caterpillar frames, cocoon states, adult composition order, and wing-spread-based adult motion.'])}</section>
  <section class="plate-page">${renderVisualPlate('visual-supplement/01-sprite-anatomy.png', 'Sprite anatomy plate', 'Shows the separate body and antenna assets, a representative wing sheet split at x=900 and y=600, and the runtime anchor facts that let the renderer assemble the butterfly.')}</section>
  <section class="plate-page">${renderVisualPlate('visual-supplement/02-archetype-male-female-comparisons-core.png', 'Archetype male/female comparison plate, core roster', 'Shows the assembled male and female versions of Warm Welcome, Delicate Pink, Electric Violet, and Nervous Jewel using the same sex-based sprite scaling the game uses.')}</section>
  <section class="plate-page">${renderVisualPlate('visual-supplement/03-archetype-male-female-comparisons-special.png', 'Archetype male/female comparison plate, special roster', 'Shows the assembled male and female versions of Ancient Scholar, Twilight Dancer, and Legendary One, preserving the visual distinction between ordinary archetypes and the special golden form.')}</section>
  <section class="plate-page">${renderVisualPlate('visual-supplement/04-hybrid-inheritance-visual.png', 'Hybrid inheritance plate', 'Shows one worked hybrid example with a friendly female donor, an energetic male donor, a mixed child, and a per-wing donor map so the visual inheritance rule is explicit.')}</section>
  <section class="plate-page">${renderVisualPlate('visual-supplement/05-animation-lifecycle-breakdown.png', 'Animation and lifecycle plate', 'Shows caterpillar crawl frames, cocoon states, adult composition order, and the adult wing-spread animation approach that creates flap motion without swapping a separate butterfly frame sheet.')}</section>
  <section id="config" class="section-break"><h2>18. Exact Tunable Config Tables</h2><p class="subtle">These tables are generated from the live <code>core/config.js</code> structure so the guidebook reflects the implemented values instead of a hand-maintained copy.</p><div class="appendix-grid">${configTables.map(([title, rows]) => renderKeyValueTable(title, rows)).join('\n')}</div></section>
  <section id="glossary"><h2>19. Glossary</h2>${renderKeyValueTable('Glossary',[{ key:'Archetype', value:'A base butterfly type such as friendly, wise, or mystic.' },{ key:'Ability', value:'A special effect identity tied to an archetype or inherited by a hybrid.' },{ key:'Drive', value:'A long-running pressure such as rest, exploration, or safety.' },{ key:'Emotion channel', value:'A current-state feeling value such as threat, curiosity, or exhaustion.' },{ key:'Memory packet', value:'A stored event-like record with valence, strength, and tags.' },{ key:'Social edge', value:'A durable relationship summary like trust or admiration.' },{ key:'Routine', value:'A reinforced tendency to behave in a certain way.' },{ key:'Distortion', value:'A bias that bends shared systems, such as anxiety or insomnia bias.' },{ key:'LifeSim', value:'The full internal life-simulation state carried by an entity.' },{ key:'Hybrid genome', value:'The inherited trait and visual source data for a bred hybrid butterfly.' },{ key:'Roundtrip verify', value:'A save/load comparison that checks whether durable truth survives correctly.' },{ key:'Gameplay audit', value:'A chained test pass that checks snapshots, invariants, save/load, and visible state.' },{ key:'Battle snapshot', value:'A battle-local copy of live entities used so battle can mutate safely before commit.' }])}</section>
</main>
</body>
</html>`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputHtml, html, 'utf8');
console.log(`Wrote ${outputHtml}`);



