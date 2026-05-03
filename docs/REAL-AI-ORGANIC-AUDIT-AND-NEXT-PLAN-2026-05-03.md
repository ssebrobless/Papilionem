# Real-AI Organic Audit And Next Plan - 2026-05-03

Owner: Codex

Goal frame: determine how close Papilionem is to the desired experience of a believable butterfly society: durable emotions, memory, relationships, cooperation, social expression, player-legible inner life, and ML-supported decision making. This document does not claim literal consciousness or subjective feeling. The honest target is a convincing simulation that depicts living internal state through emergent behavior.

## 1. Executive Verdict

```text
╔══════════════════════════════════════╗
║ Current distance to target           ║
╠════════════════════════╦═════════════╣
║ Life-sim architecture  ║ 78 / 100    ║
║ Organic emergence      ║ 58 / 100    ║
║ Player-visible emotion ║ 70 / 100    ║
║ Real ML value          ║ 30 / 100    ║
║ Overall believable AI  ║ 62 / 100    ║
╚════════════════════════╩═════════════╝
```

Short verdict: the game now has real durable state and real behavior coupling. It is not merely a flat sequence of `if/then` flavor lines anymore. Relationships, drives, memories, pair texture, social follow-through, object cleanup, zone migration, and dialogue grounding all influence behavior. But the current neutral world does not naturally generate enough socially meaningful events without a fixture, and the ML layer is still mostly an active policy artifact rather than a proven value-adding intelligence layer.

The strongest evidence is social stability, low repetition, action follow-through, and UI/debug surfacing. The weakest evidence is natural witnessed affection, grief/jealousy/shame/pride arising without directed pressure, and ML outperforming heuristic behavior.

## 2. Evidence Map

```text
Organic evidence
   │
   ├─ 8-minute no-fixture society soak
   │    ├─ stable bonds: PASS
   │    ├─ bond churn: PASS
   │    ├─ partner repetition: PASS
   │    ├─ cleanup: PASS
   │    ├─ conversation repetition: PASS
   │    ├─ witnessed affection: FAIL
   │    └─ zone entropy: FAIL by a small margin
   │
   ├─ ML on/off value audit
   │    ├─ model loads and decides: PASS
   │    ├─ trace rows populated: PASS
   │    └─ value metrics: 1 / 6 pass
   │
   ├─ authored social/emotion audits
   │    ├─ expression naturalness: PASS
   │    ├─ social surfacing: PASS
   │    ├─ dialogue follow-through: PASS
   │    ├─ neural/social scoring: PASS
   │    └─ social depth: PASS
   │
   └─ deep systems audit
        └─ integrated systems: PASS
```

## 3. Reports Run

- Organic no-fixture long-soak:
  - `qa_logs/long_soak_society/2026-05-03T17-09-35-600Z/report.json`
- ML on/off value audit:
  - `qa_screenshots/ml_on_off_capture_audit/2026-05-03T17-10-55-668Z/report.json`
- Expression naturalness:
  - `qa_screenshots/r_expression_naturalness_audit/2026-05-03T17-11-56-272Z/report.json`
- Social surfacing:
  - `qa_screenshots/n7_social_surfacing_audit/2026-05-03T17-11-56-277Z/report.json`
- Dialogue behavior follow-through:
  - `qa_screenshots/n5_dialogue_behavior_follow_through_audit/2026-05-03T17-12-29-111Z`
- Neural social scoring:
  - `qa_screenshots/n6_neural_social_scoring_audit/2026-05-03T17-12-29-114Z/report.json`
- Social depth:
  - `qa_screenshots/f5_f6_social_depth_audit/2026-05-03T17-12-29-125Z/report.json`
- Deep systems:
  - `qa_screenshots/deep_systems_audit/2026-05-03T17-13-16-947Z/report.json`

## 4. What Is Real Now

### Durable Inner State Exists

The current architecture has persistent drives, emotions, derived feelings, social edges, memories, relationship textures, dialogue residue, genetics, spatial context, and ML feature extraction. This is real simulation state, not only display text.

Evidence:

- `n6_neural_social_scoring_audit` exposes 15 feature groups and 106 flat features.
- `deep_systems_audit` shows drives, emotions, social context, signal clarity, genetics, communication, and relationship summaries.
- `n5_dialogue_behavior_follow_through_audit` proves relationship states cause movement changes:
  - familiar partner return
  - strained partner avoidance
  - admiring shadow behavior
  - protective proximity behavior

### Social Behavior Can Follow Internal State

The authored social audits are strong. They prove the machinery can express:

- attachment / partner return
- avoidance / strained distance
- admiration / shadowing
- protection / staying near vulnerable partner
- pair texture
- courtship-style tenderness
- dialogue residue
- follow-through effects on future behavior

This means the game is beyond cosmetic dialogue. The state can drive action.

### Organic Neutral Play Is Improving

The no-fixture 8-minute organic run was not a full success, but it was meaningfully alive:

- bond stability: `0.0938`, target `<= 0.30`
- bond churn: `0.875/min`, target `0.25..2.0`
- partner repetition: `0.0882`, target `<= 0.40`
- conversation repetition: `0`
- cleanup gradient: `0`

This is good evidence that the society can move and maintain relationships without obvious spam or total randomness.

## 5. What Is Not Yet Real Enough

### Gap 0: Conversation Still Sounds Too Atmospheric

The user specifically called out lines like “the air shifted” and similar phrases. The organic dialogue sample confirms this is still a real issue. Recent no-fixture dialogue includes lines such as:

- “Do you notice this too the light shifted before we even crossed the open grass.”
- “The garden feels different right here the echo shifted before we even crossed the waterlit path.”
- “The garden feels different right here the pressure shifted before we even crossed the drill line.”
- “Stay close while the air settles.”

These lines are not useless: they often map to a real signal, zone, warning, or social observation. But they do not consistently feel like two living social beings talking to each other. They read like symbolic narration or environmental poetry. That weakens the user’s target of “real language for the purpose of socializing.”

The current communication system can produce stronger lines:

- “Keep pace with me; I want to keep this feeling a little longer.”
- “I am trying not to guess wrong about you; you felt farther away from me than a moment ago.”
- “I saw Clover draw close, and that moment still follows me.”
- “I chose Iris over Juniper, and I still feel that pull.”

So the problem is not that real dialogue is absent. The problem is weighting, filtering, and context selection: too much ordinary social space still chooses atmospheric observation templates instead of relationship-directed speech.

Conversation believability must become a blocking acceptance lane, not just an expression-naturalness screenshot check.

### Gap A: Organic Affection Does Not Naturally Surface

The organic run produced:

- witnessed-affection event rate: `0/min`
- target: `>= 0.10/min`

This is the biggest believability gap. The system can create witnessed-affection packets in G0H and dedicated scenarios, but neutral lived play did not naturally produce any in 8 minutes.

Interpretation: the social system has the capability, but the world lacks enough incentives and circumstances for affectionate third-party observations to emerge on their own.

### Gap B: Organic Movement Has Weak Spatial Purpose

The organic run produced:

- migration mean entropy: `0.4755`
- target: `>= 0.50`
- mean distinct zones visited: `2`

This is close, but still not quite there. Butterflies visit more than one zone, but the migration pattern is not yet rich enough to feel like a society moving for legible reasons.

Interpretation: zone travel works, but zone-level needs and social errands should become more meaningful.

### Gap C: ML Is Active But Not Yet Valuable

The ML audit passed runtime checks, but only `1 / 6` value metrics met threshold.

Metrics:

- policy disagreement rate: `0.514`, pass
- edge churn ratio: `0.772`, fail
- migration entropy ratio: `0.948`, fail
- target acquisition latency ratio: `1.262`, fail
- top-edge fraction: `0.247`, fail
- near-target jitter ratio: `1.0`, fail

Interpretation: ML is making different decisions, but those decisions are not yet better than the heuristic across the value metrics. It is currently more like a static imitation/scoring policy than “real machine learning intelligence” from the player's point of view.

### Gap D: High-Stakes Emotions Need More Organic Causes

Pride, shame, grief, jealousy, loyalty, and witnessed affection are all wired and testable. But many of them are still easiest to prove through targeted scenarios. Neutral play is not yet producing enough:

- dilemmas
- loss / absence
- repair opportunities
- visible preference conflicts
- social triangles
- resource conflicts
- caregiving moments
- group coordination moments

The emotional model is real enough to react. The world is not yet pressurizing it enough.

## 6. Ownership Map

```text
╔══════════════════════╦════════════════════════════════════╗
║ Truth owner          ║ Owns                               ║
╠══════════════════════╬════════════════════════════════════╣
║ lifeSimSystem        ║ drives, emotions, memories, bonds  ║
║ communicationSystem  ║ signals, dialogue, interpretation  ║
║ behaviorSystem       ║ action selection / movement intent ║
║ objectSystem         ║ object affordances and cleanup     ║
║ zoneSystem           ║ zone ecology and migration pulls   ║
║ mlInferenceSystem    ║ read-only policy scoring           ║
║ saveSystem           ║ durable persistence                ║
║ UI/debug             ║ player-legible explanation         ║
╚══════════════════════╩════════════════════════════════════╝
```

Keep this boundary. Do not let ML own durable memories, emotions, or bonds. ML should score choices using life-sim truth.

## 7. Next Plan

### C0: Human-Language Conversation Gate

Goal: make butterfly communication read like intentional social dialogue, not ambient narration.

Owned likely files:

- `systems/communicationSystem.js`
- `scripts/run-r-expression-naturalness-audit.js`
- `scripts/g0h/societyMetrics.js`
- new audit: `scripts/run-organic-dialogue-believability-audit.js`

Implementation:

1. Add dialogue quality classification to the audit layer:
   - relationship-directed: names partner, asks/answers, expresses preference, care, uncertainty, apology, gratitude, invitation, warning, reassurance
   - task-directed: clear request or coordination about food, cleanup, shelter, training, movement
   - atmospheric: “air shifted,” “pressure changed,” “echo moved,” vague environmental metaphor without clear interpersonal purpose
   - system-like: awkward state labels, map terms, unexplained zone mechanics
2. Set organic thresholds:
   - at least 70% of organic dialogue should be relationship-directed or task-directed
   - atmospheric dialogue should be <= 15%
   - system-like dialogue should be 0%
   - direct replies should preserve conversational context at least 80% of the time
3. Reweight templates:
   - ordinary social, courtship, comfort, repair, and companionship should prefer direct human-like language
   - environmental observation templates should only fire for actual zone/scout/hazard contexts
   - warning lines should name the practical concern when possible
4. Add conversation turns:
   - a first line should be able to produce a direct answer
   - answers should respond to the prior line rather than simply emit a parallel vibe
5. Preserve the butterfly tone without making the lines purple-prose:
   - simple, direct, emotionally legible language
   - examples: “Stay close; I feel safer with you,” “I missed you when you left,” “I saw you choose Clover and it hurt,” “Can you help me clean this?”

Acceptance:

- New organic 8-10 minute dialogue believability audit:
  - relationship/task-directed dialogue `>= 70%`
  - atmospheric dialogue `<= 15%`
  - system-like dialogue `0`
  - repeated phrase rate `<= 5%`
  - at least 5 two-turn conversations with coherent response links
- Existing expression, feed-thread, social-depth, and long-soak audits stay green.

### C1: Organic Social Pressure Loop

Goal: make meaningful social moments arise without scripted injection.

Owned likely files:

- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `systems/behaviorSystem.js`
- `systems/zoneSystem.js`
- scenario/audit scripts

Implementation:

1. Add a low-frequency organic affection opportunity detector:
   - when two butterflies with companion+ or rising comfort stay close for a while
   - and a third butterfly with companion+ toward one participant is nearby
   - allow a natural positive dialogue line with affection intensity
2. Add social-triangle pressure:
   - track when a butterfly repeatedly observes a bonded/companion partner bonding elsewhere
   - use existing rivalry / jealousy / insecurity families
3. Add repair opportunities:
   - after avoidance, warning, or low trust, create a chance for apology/reassurance dialogue
4. Add group-cooperation opportunities:
   - cleanup tasks, food reserve tasks, and scouting should invite others more naturally

Acceptance:

- No-fixture 10-minute society soak:
  - witnessed-affection rate `>= 0.10/min`
  - partner repetition `<= 0.15`
  - conversation repetition `<= 0.05`
  - at least one organic repair or reassurance event
- Dedicated scenario coverage stays green.

### C2: Zone Purpose And Social Errands

Goal: make movement look motivated, not random wandering between colored zones.

Owned likely files:

- `systems/zoneSystem.js`
- `systems/behaviorSystem.js`
- `systems/objectSystem.js`
- `ui/gameUI.js` for surfacing why

Implementation:

1. Give each non-training zone clearer live affordance pressure:
   - food / cleanup / rest / social cluster / building opportunity
2. Add social errands:
   - follow partner to zone
   - bring reserve food to partner
   - return to last meaningful place
   - leave crowded or tense area
3. Make movement reasons visible:
   - feed/debug/inspect should say “going to moss-hollow because resource pressure + partner there,” not generic movement text.

Acceptance:

- Organic 10-minute soak:
  - migration entropy `>= 0.55`
  - mean distinct zones visited `>= 2.25`
  - at least 50% of migration events have a player-readable cause

### C3: Emotional Arc Continuity

Goal: make emotions persist and transform instead of appearing as isolated events.

Owned likely files:

- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `ui/gameUI.js`
- `scripts/g0h/societyMetrics.js`

Implementation:

1. Add emotion arc summaries from existing state:
   - grief easing after reunion
   - jealousy shifting into avoidance or repair
   - pride encouraging repeat helpful behavior
   - shame encouraging repair or withdrawal
2. Add per-butterfly “recent emotional arc” debug/inspect output.
3. Add audit metric for arc continuity:
   - event -> memory -> derived feeling -> later behavior -> surfaced explanation

Acceptance:

- New organic arc audit:
  - at least 3 arc types proven without direct lifeSim helper calls
  - each arc has memory, derived feeling, behavior change, and UI explanation

### C4: ML Value Repair

Goal: ML must become useful, not merely active.

Owned likely files:

- `scripts/train-m7-garden-policy.js` or new trainer
- `scripts/build-c2-trace-corpus.js`
- `scripts/run-ml-on-off-capture-audit.js`
- `assets/ml/*` only when gated

Implementation:

1. Expand corpus from scenario-only examples to organic trace windows.
2. Add value labels based on later outcomes:
   - lower repetition
   - successful social follow-through
   - less top-edge drift
   - faster target acquisition
   - richer zone entropy
3. Train next candidate policy with per-family no-regression gates.
4. Keep m4/m7 default until candidate beats heuristic on at least 4 of 6 value metrics.

Acceptance:

- ML on/off audit:
  - at least `4 / 6` value metrics pass
  - no policy family regresses against heuristic
  - target acquisition ratio `<= 1.1`
  - migration entropy ratio `>= 1.05`

### C5: Long-Lived Society Soak

Goal: verify that the society stays believable over longer runs.

Owned likely files:

- `scripts/run-long-soak-society-audit.js`
- `scripts/g0h/societyMetrics.js`
- new scenario fixtures only if needed

Implementation:

1. Add a 30-minute organic audit mode.
2. Measure:
   - stable bonded pairs
   - repeated partners
   - emotional event variety
   - cleanup sustainability
   - zone entropy
   - social hierarchy / clique formation
   - repair after strain
3. Separate fixture evidence from no-fixture organic evidence in the report.

Acceptance:

- 30-minute no-fixture run:
  - no social collapse
  - no dialogue spam
  - witnessed affection, repair, rivalry/jealousy, and caregiving all occur at least once
  - at least two durable relationship arcs persist through save/reload

## 8. Recommended Order

```text
C0 human-language conversation gate
   │
   ▼
C1 organic social pressure
   │
   ▼
C2 zone purpose / social errands
   │
   ▼
C3 emotional arc continuity
   │
   ▼
C4 ML value repair
   │
   ▼
C5 long-lived society soak
   │
   ▼
Human capture / playtest review
```

Reasoning: do not train ML first. The world needs clearer organic causes and more believable dialogue before a model can learn valuable behavior from traces. Better emergence and better language create better training data.

## 9. Bottom Line

Papilionem is past the “just if/then dialogue” stage. It has a real simulation substrate. But it is not yet at the desired “real AI society” feeling because ordinary speech still too often sounds atmospheric instead of socially intentional, the spontaneous world does not generate enough meaningful social pressure, and the ML layer is not yet better than the heuristic.

The next best work is C0 then C1: first make organic language sound like real social communication, then make affectionate observation, repair, social triangles, and cooperation arise naturally in ordinary play.
