# Internal Signal Contract

## Purpose

This document defines the new internal signal system for Papilionem.

Signals are no longer a player-facing feed channel and are no longer treated as
hidden words or alternate language. Their purpose is now narrower and more
modern:

- connect communication to space
- coordinate movement and group behavior
- ground deictic meaning like `here`, `there`, `this`, and `that`
- support urgency and timing without replacing speech

## Current Proof Status

Current shipped state:

- signals remain absent from the player activity feed
- active source summaries now retain support family, audience, urgency, and
  expiry while a signal is alive
- `scripts/run-r6-communication-audit.js` now proves targeted guidance support,
  recipient perception, and expiry cleanup without turning signals back into a
  feed channel

## Direction Lock

```text
╔════════════════════ Signal Direction Lock ════════════════════╗
║ feed presence      │ none                                     ║
║ speech replacement │ forbidden                                ║
║ primary role       │ coordination + spatial grounding         ║
║ player-facing role │ indirect only through visible behavior   ║
╚════════════════════════════════════════════════════════════════╝
```

## Ownership

```text
╔════════════════════ Ownership ════════════════════╗
║ communicationSystem  │ signal emission/perception ║
║ interpretation       │ confidence / misread truth ║
║ lifeSimSystem        │ context and need weighting ║
║ structureSystem      │ spatial anchors / routes   ║
║ gameUI               │ no feed logging for signals║
╚════════════════════════════════════════════════════╝
```

Signals must remain internal simulation truth.

## System Role

```text
speech
├─ carries meaning
├─ carries nuance
├─ carries teaching content
└─ carries relationship language

signals
├─ ground speech into space
├─ coordinate movement and placement
├─ direct attention
└─ carry urgency / priority

expression
├─ wing flutter
├─ antenna motion
└─ emotional/body-language flavor
```

## Core Principle

Signals should behave like the nonverbal layer a human uses while speaking:

- pointing to a place
- indicating a route
- drawing attention to an object
- telling a group to move together
- adding urgency to a request

They are not:

- a hidden grammar
- a secret lexicon
- a substitute for spoken dialogue

## Kept Signal Families

```text
╔════ Internal Signal Families ════╦══════════════════════════════╗
║ Direction                       ║ where to move / place / face ║
║ Attention                       ║ what to look at / focus on   ║
║ Coordination                    ║ synchronize with me / group  ║
║ Urgency                         ║ do it now / danger / hurry   ║
╚═════════════════════════════════╩══════════════════════════════╝
```

### Direction

Use for:

- where `there` is
- where to carry or place an object
- where to gather
- where to pass through a doorway
- which side of a structure matters

### Attention

Use for:

- which object is being referenced
- which flower, block, doorway, or butterfly matters
- what the speaker wants others to notice

### Coordination

Use for:

- move together
- hold position
- align for training
- maintain a local group action

### Urgency

Use for:

- danger
- immediate threat
- hurry / do this now
- higher priority weighting on current instruction

## Removed Signal Burdens

The following must no longer be treated as core signal meaning:

```text
remove from signals
├─ romance language
├─ acknowledgement language
├─ teaching content
├─ apology or comfort language
└─ hidden butterfly grammar
```

These now belong to:

- spoken dialogue
- body language
- learning outcomes
- relationship state

## Signal Payload Shape

Signals should remain low-bandwidth and structured.

```text
╔════ Signal Payload ════╦══════════════════════════════════════╗
║ family                ║ direction / attention / etc.         ║
║ sourceId              ║ emitting butterfly                    ║
║ mode                  ║ single / multi / open support        ║
║ targetIds             ║ intended receivers if any            ║
║ zoneId                ║ local zone context                   ║
║ anchorType            ║ object / entity / region / route     ║
║ anchorId              ║ referenced object/entity if relevant ║
║ anchorPoint           ║ x/y point if needed                  ║
║ routeHint             ║ doorway / path / side hint           ║
║ urgencyLevel          ║ low / medium / high                  ║
║ expiresAt             ║ short-lived                          ║
╚═══════════════════════╩══════════════════════════════════════╝
```

## Address Modes

Signals support the same broad address shape as speech, but they are support
data rather than speech acts.

```text
╔════ Address Mode ════╦══════════════════════════════════════╗
║ single              ║ one intended receiver                ║
║ multi               ║ selected receivers                   ║
║ open-local          ║ any nearby butterfly in scope        ║
╚═════════════════════╩══════════════════════════════════════╝
```

## Perception Rules

```text
╔════ Perception Rules ════╦════════════════════════════════════╗
║ single                  ║ target receives strongest truth    ║
║ multi                   ║ selected receivers get full truth  ║
║ open-local              ║ nearby butterflies perceive it     ║
║ zone-wide telepathy     ║ forbidden                          ║
╚═════════════════════════╩════════════════════════════════════╝
```

Signals must stay local and spatially grounded.

## Signal-to-Space Contract

This is the most important new rule.

```text
spoken instruction
"put that block over there"
        │
        ▼
internal signal support
├─ attention ▶ which block
├─ direction ▶ which region / point
├─ coordination ▶ who should act
└─ urgency ▶ how strongly to prioritize it
```

Signals connect language to:

- object references
- placement points
- spatial regions
- doorway choices
- routes
- group formation

## Signal Type Table

```text
╔════ Signal Type ════╦══════════════╦══════════════════════╦══════════════╗
║ Direction          ║ stores where ║ path / place / move  ║ no feed      ║
║ Attention          ║ stores what  ║ target selection     ║ no feed      ║
║ Coordination       ║ stores with whom │ group sync       ║ no feed      ║
║ Urgency            ║ stores priority │ action weighting  ║ no feed      ║
╚════════════════════╩══════════════╩══════════════════════╩══════════════╝
```

## Draft Operational Tuning

These are the proposed first-pass implementation values. They are intended to
be close enough to the current communication ranges to integrate cleanly,
while being clearer and narrower in purpose.

```text
╔════ Signal ════╦════ Range ════╦══ Lifetime ══╦═ Misread ═╦════════════════════╗
║ Direction     ║ 84 px         ║ 1.8 s       ║ medium    ║ path / place / face║
║ Attention     ║ 72 px         ║ 1.4 s       ║ low-med   ║ focus / reference  ║
║ Coordination  ║ 96 px         ║ 2.4 s       ║ medium    ║ group sync / align ║
║ Urgency       ║ 108 px        ║ 1.2 s       ║ low       ║ priority / interrupt║
╚═══════════════╩═══════════════╩═════════════╩═══════════╩════════════════════╝
```

### Direction

```text
target modes
├─ single
├─ multi
└─ open-local
```

Use for:

- where to move
- where to place an object
- where “there” refers to
- which route or doorway to prefer

Misread shape:

- recipient may choose the wrong nearby placement point
- recipient may take a less ideal route
- recipient should not invert the instruction into the opposite direction

### Attention

```text
target modes
├─ single
├─ multi
└─ open-local
```

Use for:

- which object, flower, doorway, or butterfly is meant
- which part of a shared scene matters right now

Misread shape:

- recipient may focus on the wrong nearby object
- recipient may miss a subtle referent if crowded or anxious

### Coordination

```text
target modes
├─ multi
└─ open-local
```

Use for:

- synchronize movement
- maintain local formation
- line up for training
- keep working the same local task

Misread shape:

- recipient may lag behind or desynchronize
- recipient may interpret “stay with me” as “stay near here”

### Urgency

```text
target modes
├─ single
├─ multi
└─ open-local
```

Use for:

- danger emphasis
- “do this now”
- interrupting lower-priority behavior
- raising caution and response priority

Misread shape:

- recipient may overreact or underreact
- recipient should still detect that something important happened

## Draft Interpretation Rule

```text
signal success
= perception
+ interpretation clarity
+ relationship trust
- anxiety/distortion
- crowding / noise
```

Recommended first pass:

- `Direction` and `Coordination` should be more trust-sensitive
- `Attention` should be more crowding-sensitive
- `Urgency` should be least ambiguous, even when emotionally distorted

## Draft Misread Policy

Signals should be allowed to fail in believable ways, but not in chaotic ways.

```text
╔════ Misread Inputs ════╦══════════════════════════════════════╗
║ interpretation clarity║ better decoding / less ambiguity     ║
║ receptivity          ║ willingness to accept the signal      ║
║ trust                ║ confidence in the source              ║
║ anxiety/distortion   ║ warping, overreaction, avoidance      ║
║ crowding/noise       ║ local confusion and referent clutter  ║
╚══════════════════════╩══════════════════════════════════════╝
```

Recommended shape:

```text
misread pressure
= low clarity
+ low receptivity
+ low trust
+ anxiety/distortion
+ crowding/noise
```

Signals should not use identical misread rules.

## Misread Severity Bands

```text
╔════ Severity Band ════╦══════════════════════════════════════╗
║ clean read           ║ intended meaning accepted            ║
║ soft drift           ║ near-enough but imperfect            ║
║ wrong local choice   ║ wrong nearby object/point/route      ║
║ hard miss            ║ ignored, dropped, or weakly followed ║
╚══════════════════════╩══════════════════════════════════════╝
```

Rule:

- prefer `soft drift` and `wrong local choice`
- use `hard miss` only when distortion or disengagement is strong
- avoid random nonsense outcomes

## Family-Specific Misread Policy

```text
╔════ Signal ════╦══════════════════════╦════════════════════════════╗
║ Direction     ║ medium misread risk  ║ wrong nearby point/route   ║
║ Attention     ║ medium-high in crowds║ wrong nearby referent      ║
║ Coordination  ║ medium trust-sensitive║ lag / partial sync / drift║
║ Urgency       ║ low semantic ambiguity║ overreact or underreact   ║
╚═══════════════╩══════════════════════╩════════════════════════════╝
```

### Direction

Allowed mistakes:

- choosing the wrong nearby placement point
- taking a less ideal nearby route
- arriving near the intended region but not at the best spot

Forbidden mistakes:

- choosing the opposite side of the zone without local reason
- turning a placement cue into a destroy/abandon cue

### Attention

Allowed mistakes:

- focusing on the wrong nearby object
- focusing on a similar nearby doorway/flower/block
- losing the referent briefly in a crowded cluster

Forbidden mistakes:

- picking a completely unrelated distant target without a visible basis

### Coordination

Allowed mistakes:

- lagging behind the group
- syncing to the wrong phase of the same task
- interpreting “stay with us” as “stay near this place”

Forbidden mistakes:

- treating a coordination cue as an unrelated emotional or romantic cue

### Urgency

Allowed mistakes:

- overreacting slightly
- underreacting slightly
- treating medium urgency as high or low

Forbidden mistakes:

- completely missing that something important happened unless receptivity is extremely low
- converting urgency into a precise directional meaning on its own

## Misread Recovery Rule

Misreads should not lock the butterfly into nonsense for long.

```text
recovery path
├─ stronger follow-up signal may correct the state
├─ spoken clarification should reduce ambiguity sharply
├─ visible movement of the source should help re-ground meaning
└─ stale wrong interpretations should decay quickly
```

## Trust and Relationship Weight

```text
high trust
├─ direction reads cleaner
├─ coordination reads cleaner
└─ fewer hard misses

low trust
├─ more hesitation
├─ more soft drift
└─ more ignored signals
```

Signals should not replace relationship logic, but relationship quality should
shape how reliably they are followed.

## Crowding Rule

Crowding should mostly affect:

- `Attention`
- secondarily `Direction`

It should not dominate `Urgency` the same way.

## Anxiety / Distortion Rule

Anxiety and distortion should mostly produce:

- overreaction
- avoidance
- wrong local choice
- dropped coordination

They should not usually create wild opposite-world interpretations.

## Draft Emission Rule

Signals should not use a broad fixed cooldown model.

Instead, they should be edge-triggered and context-sensitive.

```text
╔════ Signal Emission Model ════╦════════════════════════════════╗
║ transition gate              ║ emit on meaningful change      ║
║ refresh-not-stack            ║ same signal updates existing   ║
║ material-delta check         ║ ignore tiny meaningless drift  ║
║ escalation override          ║ stronger urgency replaces weak ║
║ expiry                       ║ stale signals clear cleanly    ║
╚══════════════════════════════╩════════════════════════════════╝
```

Rules:

- do not emit a fresh signal every update just because a task is still active
- if the same family/anchor/intent is still active, refresh the existing signal instead of stacking a new one
- if the referenced object, route, region, or group target changes meaningfully, emit or replace
- tiny jitter in target point or path choice must not cause repeated re-emission
- stronger urgency may replace weaker urgency immediately
- stale signals should expire cleanly without lingering hidden influence

## Dialogue-Linked vs Instant Signals

```text
╔════ Signal Timing Split ════╦════════════════════════════════════╗
║ dialogue-linked            ║ inherits dialogue pacing           ║
║ instant execution          ║ immediate if context changes       ║
╚════════════════════════════╩════════════════════════════════════╝
```

### Dialogue-linked

These are signals attached to speech acts such as:

- object reference grounding
- destination grounding
- group-reference grounding

Rule:

- they inherit the timing of the spoken line that caused them
- they do not need a second independent cooldown

### Instant execution

These are signals emitted during active task execution such as:

- route correction
- placement-point change
- group re-alignment
- sudden urgency shift

Rule:

- they should be immediate when context materially changes
- they should remain quiet when nothing meaningful changed

## Family-Specific Emission Guidance

```text
Direction
├─ emit when destination or route meaningfully changes
└─ refresh while the same destination remains active

Attention
├─ emit when referent changes
└─ suppress tiny retarget flicker

Coordination
├─ emit on task-start or task-phase-shift
└─ refresh while the same coordinated task continues

Urgency
├─ emit immediately on escalation
├─ replace weaker urgency with stronger urgency
└─ use a tiny refractory guard only if oscillation appears in testing
```

## Debug Visibility Draft

Signals remain invisible in the player feed, but we should still have
debug-only ways to inspect them.

```text
debug visibility
├─ Inspect summary: latest signal family + anchor kind
├─ optional debug overlay: local arrow / radius / target marker
├─ audit logs only in developer tooling
└─ no normal player feed entries
```

## Relationship To Body Language

```text
╔════ Internal Signal vs Expression ════╦══════════════════════════╗
║ internal signal                      ║ hidden simulation support ║
║ wing flutter / antenna motion        ║ visible expression only   ║
╚══════════════════════════════════════╩═══════════════════════════╝
```

Wing flutter and antenna motion may visually accompany signals, but they do
not encode grammar or carry the semantic content by themselves.

## Relationship To Attraction

Signals should have only a light indirect effect on attraction.

```text
strong attraction drivers
├─ spoken dialogue quality
├─ relationship history
├─ trust / comfort / admiration
└─ teaching and memory continuity

light indirect modifiers
├─ coordination success
├─ responsiveness
└─ urgency handling under stress
```

## Feed Rule

```text
╔════════════════════ Feed Rule ════════════════════╗
║ signals do not appear as a player feed channel    ║
║ only speech/actions/learn remain player-facing    ║
╚════════════════════════════════════════════════════╝
```

Signals may still be visible in:

- debug overlays
- inspect summaries
- developer audits

But not in the main player feed.

## Persistence Rules

Persist only what materially shapes continuity:

- recent signal-reliability bias if used by interpretation
- long-term coordination tendencies if they become learned

Do not persist:

- most transient active signals
- stale per-frame pointing hints
- temporary route annotations

## QA Rules

Visible QA must prove:

```text
1. speech and signals no longer blur together
2. signals are not logged as feed chatter
3. spatial phrases like “there” or “this one” resolve better in behavior
4. butterflies coordinate movement/placement more clearly
5. no hidden-language look returns through motion cues
```

## Implementation Order

```text
╔════════════════════ Signal Implementation Order ═══════════════════╗
║ S1. remove player-feed signal channel                              ║
║ S2. add internal signal families and payloads                      ║
║ S3. bind signals to object/space grounding                         ║
║ S4. connect signals to pathing / placement / coordination          ║
║ S5. expose debug-only signal inspection                            ║
╚═════════════════════════════════════════════════════════════════════╝
```
