# Communication / Language Contract

## Purpose

This document locks the new communication direction for Papilionem.

It replaces the older invented butterfly-language direction with an
English-first dialogue model that is:

- readable to the player
- grounded in the life-sim
- expressive enough to support personality, attraction, teaching, and conflict
- auditable in the feed, inspect UI, and debug views

## Connected Contracts

- [C:\Users\fishe\Documents\projects\ephemera\docs\DIALOGUE-VOICE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/DIALOGUE-VOICE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\INTERNAL-SIGNAL-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/INTERNAL-SIGNAL-CONTRACT.md)

## Direction Lock

```text
╔════════════════════ Direction Lock ════════════════════╗
║ speech language        │ English only                 ║
║ invented butterfly lang│ removed                      ║
║ wing / antenna motions │ expression, not language     ║
║ spoken dialogue        │ Talk feed only               ║
║ nonverbal signals      │ internal only                ║
║ universal reply delay  │ 2.0 seconds                  ║
╚════════════════════════════════════════════════════════╝
```

## Ownership Map

```text
╔════════════════════ Ownership Map ════════════════════╗
║ statProfileSystem    │ inherited language baselines   ║
║ lifeSimSystem        │ context, drives, emotions      ║
║ communicationSystem  │ dialogue, talk modes, hearing  ║
║ interpretation       │ understanding / misread truth  ║
║ memory families      │ dialogue memory continuity     ║
║ social edges         │ relationship impact            ║
║ gameUI               │ feed presentation only         ║
╚════════════════════════════════════════════════════════╝
```

Rules:

- `communicationSystem` owns who said what, to whom, and how it was addressed.
- `interpretation` owns how well a butterfly understood what was said.
- `social edges` own long-term relationship changes from communication.
- `gameUI` must not invent dialogue meaning. It only formats and filters entries.

Additional ownership rules:

- `breedingSystem` owns hybrid personal-name assignment at emergence.
- `memory families` own whether another butterfly's name is known or remembered.
- `gameUI` formats display labels, but it does not decide identity truth.

## Name Identity Layer

```text
name identity
├─ wild butterflies use canonical variant identity names
├─ hybrids use personal birth names
├─ duplicate first names are allowed
├─ duplicate display may add one-letter disambiguation
└─ known names are tracked through social memory
```

Rules:

1. Wild butterflies keep canonical variant identity names:
   - `WarmWelcome`
   - `DelicatePink`
   - `ElectricViolet`
   - `NervousJewel`
   - `AncientScholar`
   - `TwilightDancer`
   - `Golden`
2. Hybrids should not be born with placeholder labels like `Hybrid #30`.
3. Each newly emerged hybrid receives a personal first name at birth based on
   sex:
   - masculine pool: `100` names
   - feminine pool: `100` names
4. Duplicate first names are allowed among living butterflies.
5. If a new living butterfly duplicates the first name of another living
   butterfly, give the new butterfly a one-letter display disambiguator:
   - example `Daniel M.`
6. The disambiguator is a display aid, not a hard surname rule.
7. Every butterfly knows its own current name identity.
8. Butterflies may learn and remember the names of other butterflies through
   social memory and repeated interaction.
9. Dialogue and UI should prefer known names where appropriate rather than
   falling back to generic labels.

## Communication Shape

```text
╔════════════════════ Communication Layers ════════════════════╗
║ 1. Dialogue                                                 ║
║    real English words spoken by butterflies                 ║
║                                                             ║
║ 2. Signals                                                  ║
║    internal spatial/coordination support                    ║
║                                                             ║
║ 3. Actions                                                  ║
║    visible consequential world events                       ║
║                                                             ║
║ 4. Learn                                                    ║
║    important learning that changes future behavior          ║
╚══════════════════════════════════════════════════════════════╝
```

## Feed Contract

```text
╔════ Feed Filters ════╦══════════════════════════════════════╗
║ Talk                ║ spoken English dialogue only         ║
║ Actions             ║ visible consequential events         ║
║ Learn               ║ meaningful learning/personality shift║
╚═════════════════════╩══════════════════════════════════════╝
```

### Talk

Use only for spoken dialogue.

Format:

```text
12:00AM-[CanonicalButterflyName(Sex)]: Dialogue
12:00AM-[CanonicalButterflyName(Sex)]: Dialogue (To: [Target Name(Sex)])
```

Examples:

```text
12:00AM-AncientScholar(M): Keep the route open near the arch.
12:00AM-Daniel M.(M): Stay with me near the ivy wall. (To: Ilya(F))
```

### Actions

Use only for visible consequential actions.

Format:

```text
12:00AM-[Butterfly]: Action
12:00AM-[Actor]->[Receiver]: Action
```

Include:

- mating began
- mating completed
- egg laid
- caterpillar hatched
- chrysalis formed
- chrysalis hatched into butterfly
- butterfly struck / shoved / defeated
- major object delivery or placement when player-meaningful

Do not include:

- eating
- sleeping
- idle movement
- low-value repeated micro-actions

### Learn

Use only when a butterfly has meaningfully learned something that materially
shapes future behavior.

Format:

```text
12:00AM-[Butterfly Name]: What was learned
```

## Talk Modes

```text
╔════ Talk Modes ════╦════════════════════════════════════════╗
║ single_target     ║ one butterfly addresses one target     ║
║ multi_target      ║ one butterfly addresses chosen targets ║
║ open_talk         ║ one butterfly speaks to audible range  ║
╚═══════════════════╩════════════════════════════════════════╝
```

### Single-target talk

- one intended target
- strongest intimacy, attraction, apology, persuasion, reassurance effects
- nearby bystanders may perceive tone, but are not primary recipients

### Multi-target talk

- one source, several chosen targets
- suited for teaching, group guidance, invitations, warnings
- each chosen target hears full content

### Open talk

- one source, no explicit target
- heard by butterflies within audible range in the current zone
- not full-zone telepathy
- any hearing butterfly may respond using any talk mode

## Hearing Rules

```text
╔════ Hearing Rules ════╦════════════════════════════════════╗
║ single_target        ║ target hears full content          ║
║                      ║ others may overhear tone/context   ║
║ multi_target         ║ all selected targets hear content  ║
║ open_talk            ║ all butterflies in audible range   ║
╚══════════════════════╩════════════════════════════════════╝
```

Audible range should be zone-local and distance-based.

## Response Timing

```text
╔════════════════════ Response Timing ════════════════════╗
║ universal dialogue reply delay │ 2.0 seconds           ║
║ one queued spoken reply max    │ per butterfly         ║
╚═════════════════════════════════════════════════════════╝
```

Rules:

- all spoken dialogue replies wait 2.0 seconds before emission
- a butterfly may only hold one queued spoken reply at a time
- queued replies may be replaced or cancelled if context changes sharply
- this delay applies to `single_target`, `multi_target`, and `open_talk`
- this delay does not slow non-dialogue simulation systems

## English Foundation

```text
╔════════════════════ Species Floor ════════════════════╗
║ all butterflies can speak basic English               ║
║ all butterflies can understand basic direct speech    ║
║ nobody is “mute because of bad rolls”                 ║
╚═══════════════════════════════════════════════════════╝
```

Variation is expressed through language quality, not speech existence.

## Core Language Stats

All language stats use a `0-100` scale.

```text
╔════ Core Language Stats ════╦════════════════════════════════╗
║ Vocabulary                  ║ word range and precision       ║
║ Articulation                ║ clarity and sentence quality   ║
║ Social Reading              ║ tone/subtext understanding     ║
║ Listening                   ║ retention and response quality ║
║ Emotional Expression        ║ ability to verbalize feelings  ║
║ Pragmatic Speech Use        ║ ability to use speech well     ║
╚═════════════════════════════╩════════════════════════════════╝
```

## Intelligence Bands

```text
╔════ Intelligence Bands ════╦══════════════════════════════════════╗
║ Below Average              ║ weaker structure and cue-reading    ║
║ Average                    ║ solid everyday speech               ║
║ Above Average              ║ better nuance and timing            ║
║ Exceptional / Scholar      ║ high clarity, teaching, abstraction ║
╚════════════════════════════╩══════════════════════════════════════╝
```

### Below Average

Below-average intelligence does not remove the English foundation.

It causes:

- shorter, less stable sentence flow
- more fragments
- more repetition
- more topic drift
- weaker turn-taking
- weaker social cue reading
- more slang overuse in casual speech

It must not cause:

- unreadable nonsense
- total inability to converse
- random gibberish as the default output

## Speech Tone Palette

```text
╔════ Speech Tones ════╦══════════════════════════════════════╗
║ Warm                ║ kind, reassuring, affectionate       ║
║ Playful             ║ teasing, light, lively              ║
║ Curious             ║ questioning, exploratory            ║
║ Direct              ║ plain, efficient, blunt             ║
║ Diplomatic          ║ tactful, smoothing, careful         ║
║ Formal              ║ restrained, proper, composed        ║
║ Assertive           ║ confident, firm, self-possessed     ║
║ Hesitant            ║ unsure, cautious, stumbling         ║
║ Aggressive          ║ hostile, forceful, confrontational  ║
║ Condescending       ║ patronizing, talking down           ║
║ Passive-Aggressive  ║ indirect hostility                  ║
║ Sarcastic           ║ mocking, cutting, dismissive        ║
╚═════════════════════╩══════════════════════════════════════╝
```

## Register Layers

```text
╔════ Register ════╦════════════════════════════════════════════╗
║ formal          ║ restrained, polished, little slang         ║
║ neutral         ║ normal everyday speech                     ║
║ casual          ║ slang-enabled, lighter, more relaxed       ║
╚═════════════════╩════════════════════════════════════════════╝
```

## Casual Slang Shortlist

This shortlist is based on widely documented US slang usage from the last
decade. It is a curated gameplay lexicon, not a claim of statistically exact
top-12 usage.

```text
╔════ Casual Slang ════╦══════════════════════════════════════╗
║ bet                 ║ agreement / “okay”                  ║
║ no cap              ║ sincere / truthful emphasis         ║
║ sus                 ║ suspicious                          ║
║ low-key             ║ understated admission               ║
║ rizz                ║ romantic charm                      ║
║ slay                ║ praise / admiration                 ║
║ drip                ║ style / appearance                  ║
║ bussin'             ║ very good, especially rewarding     ║
║ say less            ║ “I understand / I’m in”             ║
║ ghosted             ║ disappeared / stopped replying      ║
║ lit                 ║ exciting / excellent                ║
║ hits different      ║ unusually affecting / special       ║
╚═════════════════════╩══════════════════════════════════════╝
```

Rules:

- slang is optional, not constant
- slang does not itself imply low intelligence
- lower-intelligence butterflies overuse slang more often in casual speech
- higher-intelligence butterflies code-switch more effectively

## Derived Language Outcomes

```text
╔════ Derived Outcomes ════╦════════════════════════════════════╗
║ Dialogue Clarity        ║ Vocabulary + Articulation         ║
║ Misread Risk            ║ low Social Reading / Listening    ║
║ Courtship Verbal Skill  ║ Emotional + Social Reading        ║
║ Teaching Power          ║ Vocabulary + Articulation +       ║
║                         ║ Pragmatic Speech Use              ║
║ Group Talk Control      ║ Articulation + Listening +        ║
║                         ║ Pragmatic Speech Use              ║
║ De-escalation Skill     ║ Social Reading + Emotional Expr.  ║
╚═════════════════════════╩════════════════════════════════════╝
```

## Ancient Scholar Contract

```text
╔════════════════════ Ancient Scholar ════════════════════╗
║ not just “bigger words”                                 ║
║ but better interpretation, teaching, and explanation    ║
╚═════════════════════════════════════════════════════════╝
```

Ancient Scholar should improve:

- vocabulary range
- articulation
- social reading
- teaching power
- memory recall in dialogue
- chance that dialogue becomes a `Learn` event

## Nonverbal Expression Rule

```text
╔════════════════════ Nonverbal Rule ════════════════════╗
║ wing flutter / antenna motion = expression only        ║
║ not grammar, not lexicon, not alternate speech         ║
╚═════════════════════════════════════════════════════════╝
```

Allowed uses:

- emphasis
- nervousness
- warmth
- attraction
- hesitation
- intimidation
- excitement

## Future Signal Phase Boundary

This contract intentionally does not fully redesign signals.

Signals are defined in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\INTERNAL-SIGNAL-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/INTERNAL-SIGNAL-CONTRACT.md)

## Dialogue Residue Boundary

This contract intentionally does not fully define:

- what spoken lines become durable memories
- how those memories move long-term relationship edges
- when dialogue becomes a `Learn` outcome

Those are defined in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)

## Persistence Rules

Persist:

- base language stats
- intelligence band
- dialogue-relevant upbringing shifts
- meaningful dialogue memories
- social edges affected by dialogue

Rebuild:

- active queued reply
- current line candidates
- temporary talk-mode scoring
- feed text formatting

## Debug / QA Rules

Visible QA must prove:

```text
1. dialogue is readable English
2. low intelligence is weaker, not incomprehensible
3. scholar butterflies teach and interpret better
4. open talk is audible-range based, not telepathic
5. wing/antenna motions never behave like hidden language
6. Talk feed contains speech only
7. signals stay internal and out of the player feed
8. dialogue voice differences are readable across intelligence bands
```

## Implementation Order

```text
╔════════════════════ Communication Build Order ════════════════════╗
║ C1. feed remodel: Talk / Actions / Learn                         ║
║ C2. talk modes: single / multi / open                            ║
║ C3. hearing and response timing                                  ║
║ C4. language stat model + intelligence bands                     ║
║ C5. dialogue voice rules: tone / register / slang                ║
║ C6. dialogue memory and relationship residue                     ║
║ C7. attraction and teaching weighting from dialogue residue      ║
║ C8. internal signal redesign after speech layer is stable        ║
╚═══════════════════════════════════════════════════════════════════╝
```

## Sources

- [Grammarly: common tone types](https://www.grammarly.com/blog/writing-techniques/types-of-tone/)
- [Indeed: tone examples and distinctions](https://www.indeed.com/career-advice/career-development/examples-of-tone)
- [Articulus: broader tone lexicon](https://articulus.co.uk/tone-of-voice/)
- [Dictionary.com: Gen Z slang overview](https://www.dictionary.com/articles/gen-z-slang)
- [Merriam-Webster: no cap](https://www.merriam-webster.com/slang/no-cap)
- [Merriam-Webster: bet](https://www.merriam-webster.com/slang/bet)
- [Merriam-Webster: rizz](https://www.merriam-webster.com/slang/rizz)
- [Merriam-Webster: ghosting](https://www.merriam-webster.com/wordplay/ghosting-words-were-watching)
- [Merriam-Webster: lit](https://www.merriam-webster.com/wordplay/lit-meaning-origin)
