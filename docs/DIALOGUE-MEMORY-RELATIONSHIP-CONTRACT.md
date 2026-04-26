# Dialogue Memory / Relationship Contract

## Purpose

This document defines how spoken dialogue leaves durable social residue in
Papilionem.

It answers four questions:

- which spoken lines get remembered
- how remembered speech changes trust, comfort, admiration, resentment, and attraction
- how long dialogue impressions last
- when dialogue becomes a true `Learn` outcome instead of passing chatter

## Current Runtime Status

As of the current implementation baseline:

- rememberability bands (`fleeting`, `notable`, `anchoring`) are live in
  `communicationSystem`
- courtship warmth, gentle rejection, repair / forgiveness follow-through, and
  retained dialogue `Learn` outcomes are live in runtime, Inspect, and feed
  proof
- low-stakes casual talk is now live through `check_in`, `shared_observation`,
  `playful_banter`, `gentle_tease`, `quiet_companionship`, `small_praise`,
  `light_irritation`, and `soft_repair`
- pair conversation modes (`easy`, `playful`, `tender`, `guarded`,
  `strained`, `admiring`) and short-horizon texture
  (`recentWarmth`, `recentEase`, `recentFriction`, `recentMutualAttention`)
  are live and feed later life-sim behavior
- talk feed surfacing now groups same-pair lines into short exchange threads,
  but the feed remains presentation-only and must not become the owner of bond
  truth
- the shipped repair path currently rides reassurance / acceptance residue
  rather than a separate apology-only signal type
- explicit promise / bargain / broken-promise dialogue acts remain outside the
  shipped signal set and should not be described as live runtime behavior

## Direction Lock

```text
╔════════════════════ Dialogue Residue Lock ════════════════════╗
║ spoken line        │ does not directly rewrite relationships  ║
║ interpretation     │ decides what the listener believed       ║
║ memory packet      │ stores notable dialogue residue          ║
║ social edge        │ stores durable bond change              ║
║ Learn outcome      │ only fires on meaningful lasting change  ║
╚════════════════════════════════════════════════════════════════╝
```

## Ownership Map

```text
╔════════════════════ Ownership Map ════════════════════════════╗
║ communicationSystem │ emitted line, talk mode, target shape  ║
║ interpretation      │ heard meaning, sincerity, misread       ║
║ memorySystem        │ dialogue memory packet creation/decay   ║
║ socialSystem        │ long-term relationship edge deltas      ║
║ breedingSystem      │ courtship attraction scoring only       ║
║ lifeSimSystem       │ current drives/emotions/receptivity     ║
║ gameUI              │ Talk / Actions / Learn formatting only  ║
╚════════════════════════════════════════════════════════════════╝
```

Rules:

- `communicationSystem` owns what was said and who heard it.
- `interpretation` owns whether a listener understood, misread, trusted, or doubted it.
- `memorySystem` owns remembered dialogue packets and their decay.
- `socialSystem` owns durable edge changes.
- `breedingSystem` may derive attraction from dialogue residue, but it does not own the dialogue memories themselves.
- `gameUI` must never invent trust or attraction shifts from feed formatting.
- runtime `v1` DOM panels under `ui/dom/` render from life-sim / communication state and store no durable truth of their own.

## State Shape

```text
spoken line
  │
  ▼
heard interpretation
  │
  ├─ not notable ───────▶ no durable memory
  │
  └─ notable
       │
       ▼
   dialogue memory packet
       │
       ├─ edge delta ───▶ trust / comfort / admiration / resentment / attachment
       │
       └─ reinforced lesson ───▶ Learn outcome
```

## Dialogue Residue Families

Dialogue should reuse the existing broad life-sim families instead of creating
a separate disconnected mini-system.

```text
╔════ Dialogue Residue Families ════╦════════════════════════════╗
║ social memory                    ║ praise, insult, apology,   ║
║                                  ║ disclosure, courtship      ║
║ interaction memory               ║ coordination, agreement,   ║
║                                  ║ refusal, response pattern  ║
║ care memory                      ║ comfort, reassurance,      ║
║                                  ║ protective speech          ║
║ danger memory                    ║ warning, threat, panic     ║
║ outcome memory                   ║ promise kept/broken,       ║
║                                  ║ advice succeeded/failed    ║
╚══════════════════════════════════╩════════════════════════════╝
```

## Rememberability Bands

```text
╔════ Rememberability Bands ════╦════════════════════════════════╗
║ fleeting                     ║ routine banter, low-stakes talk║
║ notable                      ║ emotional, pointed, useful,    ║
║                              ║ or socially meaningful lines   ║
║ anchoring                    ║ betrayal, deep comfort,        ║
║                              ║ courtship breakthrough, major  ║
║                              ║ lesson, public humiliation     ║
╚══════════════════════════════╩════════════════════════════════╝
```

### Fleeting

Usually not persisted as a durable packet unless reinforced.

Examples:

- casual greeting
- light joking with no social shift
- ordinary route instruction with no consequence

### Notable

Create a durable memory packet when interpretation is strong enough.

Examples:

- a reassurance during distress
- a pointed insult
- a useful explanation that immediately helps
- a careful apology
- a vulnerable romantic line

### Anchoring

Create strong durable memory and stronger edge movement.

Examples:

- promise kept under pressure
- promise broken after explicit commitment
- public ridicule
- comfort during panic or grief
- a teaching moment that permanently changes behavior
- a clear courtship breakthrough with mutual response

## Runtime Data Shape

### 1. Spoken Dialogue Event

Ephemeral; owned by `communicationSystem`.

```text
{
  id,
  speakerId,
  talkMode,            // single_target | multi_target | open_talk
  targetIds,
  audibleZoneId,
  lineText,
  intentTags,          // comfort, courtship, warning, teaching, etc.
  tone,
  register,
  emittedAt
}
```

### 2. Heard Interpretation

Ephemeral; owned by `interpretation`.

```text
{
  eventId,
  listenerId,
  heardQuality,
  meaningConfidence,
  sincerityEstimate,
  emotionalImpact,
  misunderstood,
  responseWindowAt
}
```

### 3. Dialogue Memory Packet

Durable; owned by `memorySystem`.

```text
{
  id,
  family,                  // social / interaction / care / danger / outcome
  speakerId,
  listenerId,
  summaryText,             // short gist, not a full transcript log
  intentTags,
  valence,
  strength,
  recency,
  reinforcementCount,
  emotionalColoring,
  sincerityBelief,
  publicContext,           // private / witnessed / public
  anchored,
  warped
}
```

### 4. Relationship Edge Delta

Durable result; owned by `socialSystem`.

```text
{
  pairKey,
  trustDelta,
  comfortDelta,
  admirationDelta,
  resentmentDelta,
  attachmentDelta,
  sourceMemoryId,
  appliedAt
}
```

### 5. Attraction Note

Attraction should be derived, not duplicated as a permanent second memory model.

```text
courtship attraction
= trust
+ comfort
+ admiration
+ recent courtship resonance
+ perceived reciprocity
- resentment
- rejection residue
```

## Canonical Social Scale

Relationship-facing dialogue effects should resolve onto a normalized social
scale so Inspect and debugging tell the same story.

```text
╔════ Canonical Social Scale ════╦════════════════════════════════╗
║ Trust                         ║ 0 to 100                       ║
║ Comfort                       ║ 0 to 100                       ║
║ Admiration                    ║ 0 to 100                       ║
║ Resentment                    ║ 0 to 100                       ║
║ Attachment                    ║ 0 to 100                       ║
║ Chemistry (derived)           ║ 0 to 100                       ║
╚═══════════════════════════════╩════════════════════════════════╝
```

Interpretation:

- `0 to 24` low / absent
- `25 to 49` weak / unstable
- `50 to 74` meaningful / established
- `75 to 100` strong / dominant

If the runtime stores edges differently internally, it should adapt to this
canonical scale at the owner seam rather than exposing mixed scales to UI/debug.

## Dialogue Delta Model

Dialogue should move edges in bounded nudges, not giant leaps.

```text
edge delta
= base event band
× interpretation quality
× sincerity belief
× relevance to that edge
× public/private intensity factor
× reinforcement factor
```

### Base Delta Bands

```text
╔════ Dialogue Delta Bands ════╦════════════════════════════════╗
║ trace                        ║ ±1 to ±2                      ║
║ light                        ║ ±3 to ±5                      ║
║ moderate                     ║ ±6 to ±9                      ║
║ major                        ║ ±10 to ±14                    ║
║ anchoring                    ║ ±15 to ±24                    ║
╚══════════════════════════════╩════════════════════════════════╝
```

Rules:

- ordinary good conversation should usually land in `trace` or `light`
- clear helpful or hurtful moments should usually land in `light` or `moderate`
- public humiliation, betrayal, deep reassurance, and breakthrough teaching may reach `major`
- anchoring deltas should be rare and need the anchoring conditions already defined

### Delta Clamp Rule

No single spoken event should:

- move a durable edge by more than `24`
- fully reverse a strong bond by itself
- create deep attachment from one line alone

## Dialogue Weighting Factors

```text
╔════ Weighting Factors ════╦══════════════════════════════════╗
║ interpretation quality    ║ was it understood clearly?      ║
║ sincerity belief          ║ was it believed?                ║
║ emotional readiness       ║ was the listener open or shut?  ║
║ relationship relevance    ║ does this line matter to trust, ║
║                           ║ comfort, admiration, etc.?      ║
║ public/private intensity  ║ does witness context magnify it?║
║ reinforcement             ║ has this pattern repeated?      ║
╚═══════════════════════════╩══════════════════════════════════╝
```

Recommended first-pass interpretation multipliers:

```text
clean read      1.00
soft drift      0.65
wrong local     0.35
hard miss       0.00
```

Recommended sincerity multipliers:

```text
fully believed  1.00
uncertain       0.60
doubted         0.25
seen as false   0.00 or negative spill if deception is evident
```

## Relationship Impact Map

```text
╔════ Dialogue Type ═══════════════╦════ Main Edge Movement ═══════════════╗
║ sincere reassurance              ║ trust↑ comfort↑ attachment slight↑    ║
║ useful warning that helps        ║ trust↑ admiration slight↑             ║
║ clear, helpful teaching          ║ admiration↑ trust↑                    ║
║ apology accepted                 ║ trust recover↑ comfort slight↑        ║
║ promise kept                     ║ trust↑ admiration↑                    ║
║ promise broken / deception       ║ trust↓↓ resentment↑                   ║
║ public praise                    ║ admiration↑ comfort slight↑           ║
║ vulnerable courtship             ║ comfort↑ attachment↑ attraction bias↑ ║
║ attentive flirtation             ║ comfort↑ attraction bias↑             ║
║ insult / ridicule                ║ resentment↑ trust↓                    ║
║ condescension                    ║ resentment↑ admiration↓ attraction↓   ║
║ threat / verbal aggression       ║ trust↓↓ resentment↑ rivalry↑          ║
╚══════════════════════════════════╩════════════════════════════════════════╝
```

Notes:

- dialogue should move attraction mostly through `trust`, `comfort`, `admiration`,
  and recent courtship memory, not through a totally separate always-on edge
  system
- courtship lines can increase attraction bias, but visible reciprocity and later
  outcomes should matter more than one line alone

## Reciprocity / Courtship Resonance

Courtship should care about the exchange, not just the initiating line.

```text
courtship resonance
= romantic intent expressed
+ answer quality
+ emotional warmth in response
+ response timing success
+ repeated mutual initiation
+ later follow-through
- cold response
- avoidance
- explicit rejection
- resentment pressure
```

### Reciprocity Bands

```text
╔════ Reciprocity Bands ════╦══════════════════════════════════╗
║ none                      ║ no answer, miss, or visible cold ║
║ weak                      ║ polite but thin reply            ║
║ present                   ║ warm reply, interest, follow-up  ║
║ strong                    ║ mutual initiation or repeated    ║
║                           ║ high-quality response            ║
╚═══════════════════════════╩══════════════════════════════════╝
```

### Courtship Rules

- one-sided flirtation should raise chemistry only slightly, if at all
- warm direct reciprocation should matter more than the initiating line itself
- repeated mutual high-quality courtship should build chemistry faster than attachment
- attachment should only rise materially after repeated comfort, safety, and continuity
- explicit rejection should suppress short-term chemistry quickly without instantly erasing older attachment

### Response Timing Effect

The universal `2.0 second` spoken delay should be judged against context, not as a raw penalty.

Recommended resonance rule:

- answer given in the expected reply window with no cold interruption: normal resonance
- answer replaced by silence, avoidance, or sharp topic break: reduced resonance
- repeated mutual initiation across multiple conversations: increased resonance

## Social Repair Loop

Repair should be a structured process, not a binary toggle.

```text
hurt / rejection / betrayal
  │
  ▼
spoken response
  │
  ├─ respectful boundary or sincere apology
  │      │
  │      ▼
  │   repair in progress
  │      │
  │      ├─ changed behavior holds ─▶ partial recovery
  │      └─ repeated care / follow-through ─▶ deeper forgiveness
  │
  └─ pressure / denial / deflection
         │
         ▼
      worsened residue
```

Repair should be driven by:

- interpretation of the apology or rejection
- prior trust and resentment
- severity of the original hurt
- whether later behavior actually changed

## Apology Contract

An apology should only help if it is socially legible and supported by later conduct.

```text
╔════ Real Apology Components ════╦══════════════════════════════╗
║ acknowledgement                 ║ names what happened         ║
║ ownership                       ║ does not dodge blame        ║
║ care                            ║ shows concern for impact    ║
║ repair intent                   ║ signals changed behavior    ║
║ follow-through                  ║ later conduct matches words ║
╚═════════════════════════════════╩══════════════════════════════╝
```

### Helpful Apology Outcomes

```text
accepted sincere apology
├─ trust          +3 to +10
├─ comfort        +1 to +6
├─ resentment     -2 to -10
└─ attachment     +0 to +3 if a strong prior bond exists
```

### Weak Or Harmful Apology Outcomes

```text
empty / evasive apology
├─ trust          0 to -4
├─ comfort        0 to -3
├─ resentment     +0 to +5
└─ may reinforce negative anchoring if repeated
```

Examples of apology failure:

- apologizing without naming the harm
- apologizing while deflecting responsibility
- repeating apologies with no behavioral change
- using apology speech to force immediate forgiveness

## Rejection Contract

Rejection should function as a boundary event, not automatically as cruelty.

```text
╔════ Rejection Split ════╦══════════════════════════════════════╗
║ respectful rejection    ║ clear boundary, minimal contempt    ║
║ cold rejection          ║ low warmth, low comfort             ║
║ humiliating rejection   ║ public or mocking, high hurt        ║
╚═════════════════════════╩══════════════════════════════════════╝
```

### Respectful Rejection

Should usually:

- reduce chemistry strongly
- reduce comfort slightly to moderately
- keep trust mostly stable if the boundary is honest and calm
- avoid strong resentment unless the listener is already distorted or raw

Recommended first-pass impact:

```text
chemistry       -6 to -14
comfort         -2 to -6
trust           -2 to +1
resentment      +0 to +3
```

### Cold Or Avoidant Rejection

Should usually:

- reduce chemistry strongly
- reduce comfort more clearly
- risk small resentment gain

### Humiliating Rejection

Should usually:

- reduce chemistry to near-zero quickly
- reduce trust and comfort strongly
- increase resentment sharply
- create notable or anchoring residue if public or mocking

### Boundary Respect Rule

After rejection:

- respecting the boundary should prevent further chemistry pressure and may preserve some trust
- pushing harder after rejection should strongly worsen resentment and trust
- repeated ignored rejection should escalate into major negative residue

## Forgiveness Contract

Forgiveness should mean social recovery, not memory deletion.

```text
forgiveness
≠ forgetting
≠ instant trust reset
= willingness to let the bond recover under real counterevidence
```

### Forgiveness Stages

```text
╔════ Forgiveness Stages ════╦══════════════════════════════════╗
║ 1. hurt acknowledged       ║ listener accepts the harm is seen║
║ 2. apology accepted        ║ repair path opens                ║
║ 3. changed behavior held   ║ resentment starts decaying       ║
║ 4. renewed safety          ║ trust/comfort recover partially  ║
║ 5. deeper forgiveness      ║ bond stabilizes again            ║
╚════════════════════════════╩══════════════════════════════════╝
```

### Forgiveness Rules

- forgiveness should usually reduce resentment before it fully restores trust
- old anchoring hurt may remain remembered even after forgiveness
- forgiveness should be easier for light harms than betrayal or humiliation
- strong prior attachment may make forgiveness possible sooner, but it should not bypass resentment entirely
- repeated re-harm after forgiveness should hit trust harder than the original light harm

### What Should Be Impossible

- one apology instantly erasing deep resentment
- forgiveness without any counterevidence or changed behavior
- rejected courtship automatically becoming resentment every time
- public humiliation being fully repaired by one polite line

## Recovery Over Time

Relationship repair should be time-sensitive.

```text
╔════ Time Effects ════╦════════════════════════════════════════╗
║ immediate            ║ emotion is hot, acceptance harder     ║
║ short cooling period ║ best window for sincere acknowledgement║
║ repeated calm days   ║ best window for trust rebuilding      ║
╚══════════════════════╩════════════════════════════════════════╝
```

Rules:

- immediate apology may help with misunderstanding if the harm was light
- heavy hurt often needs later follow-through more than instant words
- repeated calm, respectful conduct should matter more than repeated verbal pleading
- forgiveness should accumulate from stable counterevidence, not apology spam

## Courtship Chemistry vs Attachment

These must not collapse into one value.

```text
╔════ Courtship Chemistry ════╦════════ Long-Term Attachment ════════╗
║ short / medium horizon      ║ long horizon                        ║
║ spark, pull, romantic ease  ║ bond continuity and emotional hold  ║
║ rises fast, falls faster    ║ rises slower, falls slower          ║
║ sensitive to recent talk    ║ sensitive to trust/care history     ║
║ and reciprocity             ║ and repeated safe connection        ║
╚═════════════════════════════╩══════════════════════════════════════╝
```

### Courtship Chemistry

Courtship chemistry is a derived short-to-mid-term romantic pull.

It should be influenced by:

- recent flirtation and courtship dialogue
- reciprocity and answer quality
- recent admiration and comfort
- novelty and romantic tension
- current emotional openness

It should be reduced by:

- recent rejection residue
- resentment
- visible coldness or avoidance
- strong mistrust

### Long-Term Attachment

Attachment is a durable bond edge, not a temporary spark score.

It should be influenced by:

- repeated comfort and safety with the same butterfly
- trustworthy follow-through over time
- care during vulnerable states
- enduring social preference and continuity
- positive shared routine history

It should not spike wildly from one good line.

### Interaction Rule

```text
high chemistry + low attachment
├─ strong spark
├─ volatile / uncertain
└─ good for early romance or unstable courtship

high attachment + low chemistry
├─ deep bond
├─ safety and loyalty
└─ may read as companionship or enduring pair-bond without active spark

high chemistry + high attachment
└─ strongest stable romantic bond
```

## Inspect Surfacing Contract

Inspect should show the most readable relationship truths, not every internal edge.

```text
╔════ Inspect Social Surface ════╦══════════════════════════════════╗
║ Trust                          ║ “Do I believe this butterfly?”  ║
║ Comfort                        ║ “Do I feel at ease with them?”  ║
║ Admiration                     ║ “Do I respect/value them?”      ║
║ Resentment                     ║ “Am I carrying hurt/anger?”     ║
║ Attachment                     ║ “How bonded am I over time?”    ║
║ Chemistry                      ║ derived romantic pull           ║
╚════════════════════════════════╩══════════════════════════════════╝
```

Rules:

- `Chemistry` is derived and should be labeled as such.
- `Attachment` is durable edge truth and should not be replaced by chemistry.
- `Protectiveness`, `Dependence`, and `Rivalry` may exist internally but should stay debug-only until they clearly improve player understanding.
- Inspect should prefer a short readable social summary over dumping every raw modifier.

Recommended Inspect shape:

```text
Social
├─ Trust
├─ Comfort
├─ Admiration
├─ Resentment
├─ Attachment
└─ Chemistry (derived)
```

## Anchoring Dialogue Contract

Anchoring dialogue should be rare, legible, and socially important.

```text
anchoring memory
= a spoken moment that meaningfully reshapes later behavior
  or relationship expectation
```

### Eligible Anchoring Cases

```text
╔════ Anchoring Dialogue Cases ════╦═══════════════════════════════╗
║ explicit promise kept/broken     ║ trust floor/ceiling shift    ║
║ accepted deep apology            ║ relationship reset potential  ║
║ betrayal / deception uncovered   ║ long negative residue         ║
║ comfort during panic/grief       ║ strong safe-bond memory       ║
║ public praise or humiliation     ║ durable admiration/shame      ║
║ major teaching breakthrough      ║ strong Learn and admiration   ║
║ mutual courtship breakthrough    ║ enduring romantic residue     ║
║ vulnerable disclosure received   ║ attachment / trust deepening  ║
╚══════════════════════════════════╩═══════════════════════════════╝
```

### Should Usually Stay Non-Anchoring

- ordinary flirt lines with no reciprocation
- routine guidance that worked once but taught nothing durable
- casual praise with no emotional weight
- low-stakes teasing
- routine open-talk chatter

### Anchoring Requirements

A spoken event should usually need several of these at once:

- high interpretation clarity
- strong emotional pressure or vulnerability
- high trust relevance
- clear visible consequence
- repetition or reinforcement
- public/private context that makes the moment matter

### Counterevidence Rule

Anchoring memories should not disappear from one opposite line.

They should need:

- repeated counterevidence
- durable opposite behavior
- or a stronger later anchoring event

to meaningfully reverse their edge effects.

## Learn Creation Rule

`Learn` should only fire when dialogue causes a real durable change in future
behavior.

```text
spoken lesson
  │
  ├─ heard clearly?
  ├─ trusted enough?
  ├─ relevant to current need/task?
  ├─ reinforced by visible success or repetition?
  └─ strong enough to alter later behavior?
        │
        └─ yes ▶ create Learn outcome
```

### Eligible Learn Families

```text
╔════ Learn Families ════════════╦══════════════════════════════╗
║ task lesson                    ║ how to place, route, build   ║
║ social lesson                  ║ how to approach, apologize,  ║
║                                ║ court, or de-escalate        ║
║ care lesson                    ║ how to comfort or protect    ║
║ self-regulation lesson         ║ how to settle, wait, focus   ║
╚════════════════════════════════╩══════════════════════════════╝
```

### Must Not Create Learn

- tiny casual chatter
- repetitive low-stakes banter
- misunderstood lines with no reinforced outcome
- speech that changed mood briefly but not future behavior

## Decay and Persistence Model

```text
╔════ Dialogue Lifetimes ════════╦════════════════════════════════╗
║ fleeting impression            ║ 5 to 20 sim minutes           ║
║ notable memory packet          ║ 1 to 3 sim days               ║
║ reinforced memory packet       ║ 4 to 10 sim days              ║
║ anchoring memory               ║ long-lived until countered    ║
╚════════════════════════════════╩════════════════════════════════╝
```

Rules:

- fleeting impressions may guide the next response without becoming durable memory
- repeated similar lines should reinforce existing packets instead of spawning endless duplicates
- anchoring memories decay very slowly and should need strong counterevidence to reverse
- social edges should decay more slowly than the individual memory packet that created them

## Persistence Boundary

Persist:

- durable dialogue memory packets
- reinforcement counts
- anchoring flags
- public/private context when it matters
- social edges altered by dialogue

Rebuild:

- queued responses
- current interpretation scores
- current candidate line lists
- temporary attraction calculations
- feed row formatting

## AI Integration Points

Dialogue residue should feed behavior, not replace it.

Use it to expose:

- recent trusted speaker summaries
- recent hurtful speaker summaries
- courtship resonance with specific partners
- which lessons were retained
- which promises were kept or broken
- who is emotionally safe or unsafe to approach

Then let behavior scoring use those signals for:

- who to answer
- who to avoid
- who to court
- who to trust in coordination
- who to learn from

## Invariants

```text
do not allow
├─ a spoken line to mutate trust directly without interpretation
├─ memory packets and social edges to store the same truth twice
├─ every casual line to become a durable memory
├─ Learn outcomes from mere chatter
├─ attraction to ignore trust/comfort residue
└─ feed text to be the source of truth for relationship state
```

## Testing / Debug Guidance

Debug views should make it possible to inspect:

- last notable dialogue memory per selected butterfly
- current displayed social summary intended for Inspect
- top positive and negative speaker residues
- current trust/comfort/admiration/resentment edges for a selected pair
- current attachment edge and derived chemistry value for a selected pair
- latest reciprocity/resonance band for an active courtship pair
- the last applied dialogue delta band and weighting factors
- whether a recent line was fleeting, notable, or anchoring
- why a line did or did not become a `Learn` outcome

Scenario checks:

1. reassurance during distress should improve comfort/trust if understood
2. repeated useful teaching should increase admiration and produce a `Learn`
3. promise broken after explicit agreement should create strong negative residue
4. flirtation with good reciprocity should raise attraction bias more than flirtation with no reciprocity
5. trivial banter should not flood durable memories
6. high chemistry should be possible before high attachment
7. high attachment should persist longer than short-term chemistry
8. anchoring dialogue should require more than ordinary banter
9. one line should never swing a deep bond from one extreme to the other
10. respectful rejection should cut chemistry harder than trust
11. sincere apology should help only if later behavior supports it
12. forgiveness should lower resentment before fully restoring trust
13. same-pair casual talk should be able to render as a 2-3 line exchange thread
14. recent warmth / ease / friction / mutual attention should be visible in Inspect summaries without UI inventing the values

## Visual QA Notes

Player-facing behavior should look like this:

```text
visible signs
├─ butterflies answer trusted speakers more readily
├─ hurt or insulted butterflies become colder or avoidant later
├─ scholars create more meaningful Learn events
├─ courtship feels cumulative, not random per-line roulette
├─ respectful rejection changes romance without always creating enemies
├─ apologies can open repair without magically resetting the bond
└─ important dialogue changes later behavior, not just feed text
```

## Implementation Order

```text
╔════════════════ Dialogue Residue Build Order ════════════════╗
║ M1. heard interpretation packets                             ║
║ M2. rememberability scoring: fleeting / notable / anchoring ║
║ M3. durable dialogue memory packets + reinforcement          ║
║ M4. relationship edge deltas from remembered dialogue        ║
║ M5. attraction derivation from courtship residue             ║
║ M6. apology / rejection / forgiveness repair rules           ║
║ M7. Learn creation from reinforced dialogue                  ║
║ M8. debug / inspect surfacing for dialogue residue           ║
╚═══════════════════════════════════════════════════════════════╝
```
