# Papilionem Game Success Criteria

## Purpose

This doc defines what "success" actually means for the current game.

It exists so later reviews do not drift into:

```text
"the system exists, so it must be done"
```

or:

```text
"the audit passed once, so the player experience must already be ideal"
```

Use this with:

- [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)

## Success Stack

```text
╔════════════════════════════ Success Stack ════════════════════════════╗
║ a section is only "done" when all five layers hold                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║ 1. mechanical truth   │ the underlying simulation behaves correctly  ║
║ 2. visual legibility  │ the player can read what the simulation says ║
║ 3. behavioral impact  │ the truth changes later behavior             ║
║ 4. persistence        │ the truth survives save/load and migration   ║
║ 5. runtime safety     │ the shipped-default build remains stable     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## Social Realism Calibration

```text
bad target
└─ "indistinguishable from real humans"

actual target
└─ "a believable butterfly society with human-legible emotions,
   memory, social texture, and consequences"
```

That means the social goal is not perfect human mimicry.
It is readable, distinct, consequential inner life.

## Section Criteria

### 1. Spatial / Pseudo-3D

```text
north star
└─ one canonical spatial truth for position, footprint, support,
   carry, shelter, route, and visibility
```

Success means:

- every entity family reads from the same board/unit/occupancy model
- no silent overlap except intentional occupancy-band cases
- what the player sees matches what the simulation thinks happened
- save/load rebuilds the same spatial state

Failure signs:

- objects clip or overlap even though logic says they should not
- doorway/corridor movement disagrees with rendered cover/path geometry
- one entity family uses a private positioning shortcut

Acceptance proof:

- spatial audit green
- route/travel audit green
- lived-in save roundtrip green
- manual acceptance pass on the lived-in save

### 2. Blocks / Flowers / Building

```text
north star
└─ blocks feel like real matter in the garden, not decorative props
```

Success means:

- placement either resolves safely or rejects cleanly
- stacks have explicit support and settle correctly
- flowers relocate cleanly before conflicting placements
- butterflies can carry, place, stack, and build without visual contradiction
- structure outcomes are understandable to the player

Failure signs:

- floating blocks
- orphaned support
- overlap during placement
- flowers ignored or clipped through
- building only works in harnesses but looks wrong in live play

Acceptance proof:

- carry/stack/support audit green
- block visual audit green
- live build-sequence acceptance pass green

### 3. Movement / Travel / Space Use

```text
north star
└─ butterflies inhabit the board naturally instead of snapping through it
```

Success means:

- roaming respects real movement bounds
- departures and arrivals use believable doorway/corridor routes
- behind-cover travel reads correctly
- movement style reflects current state: calm, social, scared, carrying, building

Failure signs:

- zooming from deep map positions
- early turns into doorways
- travel that reads like teleport choreography
- movement that ignores obstacle/support context

Acceptance proof:

- movement stability green
- zone-transition green
- longer free-play movement review green

### 4. Social Relationships / Emotion

```text
north star
└─ butterflies feel distinct, emotionally readable, and history-shaped
```

Success means:

- each butterfly has stable tendencies plus situational emotion
- relationships accumulate specific history, not just generic warmth
- dialogue changes later belonging, confidence, relief, attachment, or avoidance
- group rhythms emerge and alter behavior
- inspect/feed summaries match authoritative life-sim truth

Failure signs:

- everyone feels interchangeable
- feelings exist only as hidden numbers
- pair labels change but later behavior does not
- presentation summaries contradict the underlying state

Acceptance proof:

- communication grounding green
- social depth / follow-through green
- long free-play society review green

### 5. Dialogue / Conversation

```text
north star
└─ conversation feels contextual, relational, and consequential
```

Success means:

- talk varies by personality, relation, place, motive, and pressure
- warnings are one slice of culture, not the whole culture
- courtship, teaching, comfort, praise, tension, repair, and curiosity all appear
- the colony sounds like individuals, not template spam
- talking leaves residue, lessons, follow-through, or avoidance

Failure signs:

- repetitive warning/acknowledge loops
- same voice regardless of butterfly or situation
- pretty lines with no later impact

Acceptance proof:

- dialogue audits green
- free-play repetition review green
- partner/group consequence review green

### 6. Neural / Scoring Layer

```text
north star
└─ ML helps choose grounded actions; it never owns durable truth
```

Success means:

- scores improve action selection and nuance
- life-sim, memory, and relationship truth remain authoritative
- stale or missing ML output fails soft
- behavior is more coherent with scoring active than inactive

Failure signs:

- ML invents emotions, memories, or bonds
- social behavior becomes opaque or contradictory
- the system only "looks smarter" because labels changed

Acceptance proof:

- ML contract holds
- neural social scoring audit green
- ML-on versus ML-off acceptance read favors ML-on

### 7. Runtime / Visual Quality

```text
north star
└─ the rich look survives without freezes, crashes, or art gutting
```

Success means:

- shipped defaults run smoothly on a lived-in save
- no black-screen collapse or save-quota stall
- high-resolution creatures are back safely
- trails exist as off, reduced, and full
- optimizations preserve the intended visual identity

Failure signs:

- smoothness only comes from making the game uglier
- long sessions still choke
- synthetic passes hide bad live play

Acceptance proof:

- runtime-only proof green
- migrated-save proof green
- outside-session evidence green

### 8. Persistence / Continuity

```text
north star
└─ long-running lives stay intact across refreshes, migrations, and upgrades
```

Success means:

- identity, lineage, memories, and relationships survive
- spatial truth roundtrips correctly
- migrations do not flatten individuality
- old saves restore into new truth without hidden drift

Failure signs:

- hybrids lose names/history
- stale refresh silently creates a fresh world
- inspect/feed truth changes after reload for no real reason

Acceptance proof:

- save-schema signoff recorded
- runtime/spatial/social continuity audits green
- migrated-save full-stack proof green

## Acceptance Bar

The Stage A and Stage B closure language repeatedly references "lived-in",
"long free play", and "ordinary play" without defining what counts. Without
a defined bar, those steps cannot honestly close.

The acceptance bar for any "lived-in" / "free-play" / "ordinary play"
acceptance step is:

```text
session shape
├─ duration: at least one continuous 20-minute free-play session
├─ observer: a single human reviewer, not an automated harness
├─ entry state: a real lived-in save, not a fresh seed
└─ closure: written signoff against a named rubric
```

Per-step rubric requirements:

```text
g1 spatial acceptance sweep
└─ rubric covers butterflies, flowers, blocks, eggs, cocoons,
   caterpillars, carry/cover/overhead readability, doorway travel

g2 live building behavior proof
└─ rubric covers choose/carry/place/relocate/stack/revisit cycles
   under ordinary motivation, not scripted placement, and asks whether
   those cycles produce a readable colony-shaped structure change

g3 movement naturalness acceptance
└─ rubric covers calm wander, social linger, doorway travel,
   carrying, threat/scared, recovery

g4 ambient social breadth
└─ rubric covers companionship, praise, teasing, repair, tension,
   affection, curiosity, frequency targets per session

g5 dialogue naturalness + repetition pressure
└─ rubric covers casualness, repetition, topic breadth, voice register,
   absence of system-authored tone

g6 ML value proof
└─ rubric covers coherence delta AND ML-cadence cost justification
```

Why this bar exists:

```text
why
├─ a 30-second audit "long-running save" pass is not lived-in proof
├─ scenario harnesses prove mechanics, not breadth
├─ "feels right" without a rubric drifts under reviewer fatigue
└─ a defined bar lets us honestly say "this is closed" or "this is not"
```

This bar is a one-time precondition (`g0-bar`) for closing g1-g5.
g6 absorbs the cost-vs-value clause separately.

## Final Rule

```text
not done
├─ because the architecture exists
├─ because one audit lane passed once
└─ because the doc sounds complete

done
├─ because the mechanic is right
├─ because the player can read it
├─ because it changes later behavior
├─ because it survives persistence
└─ because it holds at shipped defaults
```
