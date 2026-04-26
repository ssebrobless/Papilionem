# Dialogue Voice Contract

## Purpose

This document defines how butterflies should sound when they speak English in
Papilionem.

It turns the high-level language model into concrete output rules:

- sentence length
- sentence structure
- slang probability
- tone switching
- register use
- sample utterance patterns

## Current Proof Status

Current shipped state:

- dialogue records now retain `languageBand`, `register`, and `tone`
- Inspect now surfaces a `Voice` proof line beside recent spoken/heard dialogue
- `scripts/run-r6-communication-audit.js` now proves below-average casual,
  scholar-formal, and aggressive warning phrasing directly

## Ownership

```text
╔════════════════════ Voice Ownership ════════════════════╗
║ communicationSystem │ line generation and phrasing      ║
║ statProfileSystem   │ inherited language predisposition ║
║ lifeSimSystem       │ emotional/social context          ║
║ social edges        │ relationship-driven style shifts  ║
║ gameUI              │ formatting only                   ║
╚══════════════════════════════════════════════════════════╝
```

## Output Shape

```text
╔════════════════════ Dialogue Output Model ════════════════════╗
║ line =                                                        ║
║   intent                                                      ║
║ + talk mode                                                   ║
║ + intelligence band                                           ║
║ + language stats                                              ║
║ + tone                                                        ║
║ + register                                                    ║
║ + relationship context                                        ║
║ + current emotional pressure                                  ║
╚════════════════════════════════════════════════════════════════╝
```

## Core Output Rules

```text
always
├─ understandable English
├─ usually 1 sentence, sometimes 2
├─ no giant paragraph speeches in normal play
├─ no random gibberish
└─ tone and register should be readable from the wording
```

## Intelligence Band Voice Rules

```text
╔════ Intelligence Voice Bands ════╦══════════════════════════════╗
║ Below Average                   ║ broken flow, simpler wording ║
║ Average                         ║ normal everyday speech       ║
║ Above Average                   ║ cleaner nuance and timing    ║
║ Exceptional / Scholar           ║ high clarity, pattern-rich   ║
╚═════════════════════════════════╩══════════════════════════════╝
```

### Below Average

```text
sentence length
├─ 2 to 8 words typical
└─ 12 words soft cap

structure
├─ fragments allowed
├─ repetition allowed
├─ simple connectors only
└─ topic drift more likely
```

Rules:

- speech must remain understandable
- broken flow should come from simplicity and awkwardness, not nonsense
- may repeat favorite words or slang
- weaker turn tracking and weaker contextual precision

Example shapes:

```text
"Come here."
"Put it there. Yeah, there."
"I don't like that. Feels bad."
"Come with me, bet."
```

### Average

```text
sentence length
├─ 5 to 12 words typical
└─ 16 words soft cap

structure
├─ simple complete sentences
├─ some compound sentences
└─ steady conversational flow
```

Rules:

- should sound like solid everyday speech
- can explain simple intentions clearly
- moderate slang use in casual mode only

Example shapes:

```text
"Come with me. It’s quieter over there."
"Put that block by the doorway."
"I didn’t like how that felt."
```

### Above Average

```text
sentence length
├─ 7 to 16 words typical
└─ 22 words soft cap

structure
├─ stronger sentence variety
├─ better topic continuity
└─ more precise wording
```

Rules:

- better nuance and responsiveness
- stronger cue-reading visible in replies
- can explain motives and observations more cleanly

Example shapes:

```text
"Put that block near the arch, not in the doorway."
"You looked uneasy when I moved closer, so I backed off."
"Stay with me for a moment. I think this path is safer."
```

### Exceptional / Scholar

```text
sentence length
├─ 9 to 20 words typical
└─ 26 words soft cap

structure
├─ strong clarity
├─ controlled complexity
├─ pattern language
└─ best teaching phrasing
```

Rules:

- should sound clearer, not just longer
- may use more abstract or pattern-aware wording
- should code-switch well between formal, neutral, and casual registers
- strongest chance to create `Learn` outcomes

Example shapes:

```text
"Place it by the archway; that keeps the route open and the shelter stable."
"You settled after I lowered my voice, so I think calm helps you listen."
"This pattern repeats every time the crowd tightens near the wall."
```

## Register Rules

```text
╔════ Register Rules ════╦══════════════════════════════════════╗
║ formal                ║ precise, restrained, little slang    ║
║ neutral               ║ normal everyday speech               ║
║ casual                ║ relaxed, lighter, slang-eligible     ║
╚═══════════════════════╩══════════════════════════════════════╝
```

### Formal

Use more often for:

- teaching
- careful apology
- serious warning
- conflict de-escalation
- scholar speech

### Neutral

Default for:

- ordinary conversation
- routine coordination
- most social interaction

### Casual

Use more often for:

- close relationships
- playful conversation
- relaxed open talk
- social bonding
- flirtation when not highly formal or tense

## Slang Probability Draft

Slang should be tied to register first, then intelligence/personality second.

```text
╔════ Slang Probability Draft ════╦══════════════════════════════╗
║ formal                         ║ 0% to 2%                    ║
║ neutral                        ║ 2% to 10%                   ║
║ casual                         ║ 8% to 30%                   ║
╚════════════════════════════════╩══════════════════════════════╝
```

### By intelligence band

```text
╔════ Casual Slang Tendency ════╦══════════════════════════════╗
║ Below Average               ║ high use / more repetition    ║
║ Average                     ║ moderate use                  ║
║ Above Average               ║ light-moderate use            ║
║ Exceptional / Scholar       ║ low deliberate use            ║
╚═════════════════════════════╩══════════════════════════════╝
```

Recommended first-pass target rates for casual speech:

```text
Below Average            22% to 30%
Average                  12% to 18%
Above Average             8% to 12%
Exceptional / Scholar     4% to 8%
```

Rules:

- never stack multiple slang terms into every line by default
- repeat slang more often for below-average speakers
- scholar butterflies may still use slang, but as code-switching, not habit

## Sentence Structure Rules

```text
╔════ Structural Levers ════╦════════════════════════════════════╗
║ Vocabulary               ║ word choice sophistication         ║
║ Articulation             ║ sentence smoothness and clarity    ║
║ Social Reading           ║ whether reply fits the moment      ║
║ Listening                ║ whether reply stays on topic       ║
║ Emotional Expression     ║ feeling naming and intimacy        ║
║ Pragmatic Speech Use     ║ whether speech achieves a purpose  ║
╚══════════════════════════╩════════════════════════════════════╝
```

Examples:

- low `Listening`:
  - reply may drift off topic
- low `Articulation`:
  - more fragments and awkward joins
- high `Emotional Expression`:
  - better naming of feelings and needs
- high `Pragmatic Speech Use`:
  - clearer requests, persuasion, comfort, and teaching

## Tone Switching Rules

Tone should not randomly change every line.

```text
╔════ Tone Switching Model ════╦════════════════════════════════╗
║ state pressure              ║ danger, trust, attraction      ║
║ relationship context        ║ friend, rival, stranger        ║
║ task context                ║ teaching, warning, courtship   ║
║ personality bias            ║ default tone preference        ║
╚═════════════════════════════╩════════════════════════════════╝
```

### Default rule

- each butterfly should have a dominant baseline tone tendency
- context may shift tone, but usually within a narrow range

### Shift triggers

```text
warning / danger
├─ Direct
├─ Assertive
└─ Aggressive only if personality/distortion supports it

teaching
├─ Curious
├─ Direct
├─ Diplomatic
└─ Formal more often for scholar types

courtship
├─ Warm
├─ Playful
├─ Hesitant
└─ Direct depending on confidence

conflict
├─ Direct
├─ Assertive
├─ Passive-Aggressive
├─ Condescending
└─ Aggressive depending on rivalry/distortion

comfort / care
├─ Warm
├─ Diplomatic
└─ Hesitant if nervous
```

### Anti-thrash rule

- do not allow more than one major tone-family jump in a single short exchange unless a strong event happened
- prefer gradual shifts over line-to-line whiplash

## Talk Mode Voice Differences

```text
single-target
├─ more specific
├─ more intimate
└─ more likely to reference shared history

multi-target
├─ clearer and shorter
├─ more directive or inclusive
└─ lower ambiguity

open talk
├─ broader wording
├─ less private context
└─ more public/social phrasing
```

## Sample Utterance Patterns

### Below Average

```text
guidance
"Come here."
"Put it there."

courtship
"Stay near me."
"Dance with me, yeah?"

warning
"Back up. Now."

teaching
"Do this first. Then that."
```

### Average

```text
guidance
"Bring that block over here."

courtship
"Stay with me a little longer."

warning
"Back away from that wall."

teaching
"Watch me first, then try it."
```

### Above Average

```text
guidance
"Set it near the arch, not in the path."

courtship
"You seem calmer when we move together."

warning
"Don’t crowd the doorway. It’s too tight there."

teaching
"Notice how the route stays open when the block sits here."
```

### Exceptional / Scholar

```text
guidance
"Place it beside the archway; that keeps the route open for everyone."

courtship
"You answer me more softly when the garden is quiet, and I like that."

warning
"If we tighten around that corner, the whole group loses room to move."

teaching
"Watch the pattern: when the entry stays clear, the shelter works instead of trapping us."
```

## Hard Limits

```text
do not allow
├─ unreadable gibberish for low intelligence
├─ constant slang in every casual line
├─ scholar butterflies talking in unnatural essays
├─ tone flipping every line without cause
└─ all butterflies sounding identical
```

## QA Rules

Visible QA must prove:

```text
1. intelligence bands sound different
2. low intelligence is weaker, not nonsense
3. scholar butterflies sound clearer and more perceptive
4. slang appears mostly in casual speech
5. negative tones appear when context supports them
6. courtship, teaching, warning, and guidance sound distinct
```

## Implementation Order

```text
╔════════════════════ Dialogue Voice Build Order ════════════════════╗
║ V1. sentence length and structure bands                           ║
║ V2. register rules                                                ║
║ V3. slang probability model                                       ║
║ V4. tone switching rules                                          ║
║ V5. sample pattern library by intent and intelligence band        ║
║ V6. QA tuning against live conversation traces                    ║
╚════════════════════════════════════════════════════════════════════╝
```
