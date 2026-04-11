# Papilionem Player Guide

Player-facing guide to how the current game build works.

```text
╔════════════════════ Player Guide Scope ════════════════════╗
║ focus     │ how to play, read, and understand the game    ║
║ audience  │ players, testers, collaborators               ║
║ tone      │ practical, readable, low-jargon               ║
╚════════════════════════════════════════════════════════════╝
```

## 1. What Papilionem Is

```text
╔════════════════════ Core Experience ════════════════════╗
║ title screen                                             ║
║  ▼                                                       ║
║ living garden                                            ║
║  ├─ butterflies wander, react, trust, fear, sleep       ║
║  ├─ flowers bloom and become part of life cycles        ║
║  ├─ teaching and memory shape long-term behavior         ║
║  └─ breeding creates hybrids with inherited traits       ║
║  ▼                                                       ║
║ optional debug + audit tools for testing and discovery   ║
╚═══════════════════════════════════════════════════════════╝
```

Papilionem is a life-simulation game built around butterflies in a living garden. The butterflies are not just animations. They have internal state, personalities, memories, relationships, sleep behavior, and inherited traits.

## 2. Starting The Game

1. Launch the game.
2. The title screen appears first.
3. Press any key or click to fade into the garden.
4. Once the garden is active, butterflies begin moving and reacting immediately.

## 3. Core Player Controls

```text
╔════════════════════ Main Controls ════════════════════╗
║ any key / click │ leave title screen                  ║
║ D               │ toggle debug mode                   ║
║ B               │ hold boundary overlay               ║
║ C               │ open butterfly collection           ║
║ I               │ open inspect panel                  ║
║ A               │ open accessibility panel            ║
║ M               │ toggle reduced motion               ║
║ T               │ cycle trails                        ║
║ G               │ cycle background atmosphere         ║
║ H               │ toggle high-contrast UI             ║
║ S               │ toggle battle motion simplify       ║
╚═══════════════════════════════════════════════════════╝
```

If the collection is open:

- `Left / Right Arrow` changes pages
- `R` renames the current hybrid entry

## 4. Reading The Garden

```text
╔════════════════════ What To Watch ════════════════════╗
║ movement        │ who is calm, jittery, or curious    ║
║ spacing         │ who feels safe vs threatened        ║
║ flower activity │ feeding, laying eggs, lifecycle use ║
║ closeness       │ trust, comfort, teaching proximity  ║
║ sleep posture   │ settling, sleeping, oversleeping    ║
╚════════════════════════════════════════════════════════╝
```

The garden is meant to be read as a living system:

- butterflies with different archetypes behave differently
- feeding and interaction affect trust and memory
- teaching and comfort can change later behavior
- breeding creates long-term lineage outcomes

## 5. Butterfly Types

```text
╔════════════════════ Butterfly Types ════════════════════╗
║ friendly   │ warm, trusting, support-oriented          ║
║ cautious   │ delicate, careful, patient                ║
║ energetic  │ fast, excitable, motion-heavy             ║
║ skittish   │ nervous, reactive, socially volatile      ║
║ wise       │ calm, teaching-oriented                   ║
║ mystic     │ magical, sleep-comfort oriented           ║
║ golden     │ special legendary form                    ║
║ hybrid     │ inherited mix from bred parents           ║
╚═════════════════════════════════════════════════════════╝
```

Each type has both a personality feel and a gameplay identity.

## 6. Butterfly Abilities

```text
╔════════════════════ Ability Overview ════════════════════╗
║ friendly   │ Warm Welcome        │ support / calm        ║
║ cautious   │ Delicate Pink       │ sparkle presence      ║
║ energetic  │ Electric Violet     │ speed / energy zone   ║
║ skittish   │ Nervous Jewel       │ trust cascade         ║
║ wise       │ Ancient Scholar     │ teaching aura         ║
║ mystic     │ Twilight Dancer     │ sleep comfort aura    ║
║ golden     │ golden special      │ unique special case   ║
║ hybrid     │ inherited ability   │ one parent ability    ║
╚══════════════════════════════════════════════════════════╝
```

From the player side, the most important thing is not the internal implementation. It is:

- what kind of emotional atmosphere the butterfly creates
- what nearby butterflies seem to gain from being around it
- whether it influences speed, calmness, trust, or sleep

## 7. Trust, Memory, And Social Behavior

```text
╔════════════════════ Social Loop ════════════════════╗
║ interaction / feeding                               ║
║  ▼                                                   ║
║ memory formed                                        ║
║  ▼                                                   ║
║ trust / comfort / admiration shift                   ║
║  ▼                                                   ║
║ later behavior changes                               ║
╚══════════════════════════════════════════════════════╝
```

Butterflies remember things. They form impressions from:

- places
- objects
- care
- danger
- social contact
- teaching

This means the garden is not just “live in the moment.” It develops history.

## 8. Sleep And Rest

```text
╔════════════════════ Sleep Flow ════════════════════╗
║ awake                                               ║
║  ▼ tired / safe enough                              ║
║ settling sleep                                      ║
║  ▼                                                   ║
║ normal sleep                                        ║
║  └─ sometimes heavy oversleeping                    ║
╚══════════════════════════════════════════════════════╝
```

Sleep matters in Papilionem. Butterflies build exhaustion over time, then:

- settle down
- enter sleep
- recover
- sometimes oversleep depending on internal bias and pressure

Mystic butterflies are especially important here because they support sleep comfort.

## 9. Teaching And Learning

Wise butterflies can create teaching moments. These matter because they do more than trigger a short effect.

Teaching can:

- create memories
- increase trust and admiration
- strengthen routines
- contribute to upbringing history

This means some behavioral change is meant to feel earned over time rather than randomly assigned.

## 10. Genetics, Breeding, And Hybrids

```text
╔════════════════════ Hybrid Lifecycle ════════════════════╗
║ male + female attraction                                 ║
║  ▼                                                       ║
║ mating                                                   ║
║  ▼                                                       ║
║ pregnancy                                                ║
║  ▼                                                       ║
║ egg on flower                                            ║
║  ▼                                                       ║
║ caterpillar                                              ║
║  ▼                                                       ║
║ chrysalis / cocoon                                       ║
║  ▼                                                       ║
║ hybrid butterfly                                         ║
╚═══════════════════════════════════════════════════════════╝
```

Hybrid offspring inherit from both parents. In practical terms:

- traits blend
- colors blend
- wing sources can come from either parent per wing
- one parent ability is inherited
- lineage is tracked

The collection/journal helps you keep track of what you have discovered.

## 11. Collection And Journal

The collection is where the game’s long-term discovery layer becomes visible.

Use it to:

- review discovered butterflies
- inspect hybrids
- rename hybrids
- treat the game more like a living archive instead of a short session toy

## 12. Accessibility And Readability

```text
╔════════════════════ Accessibility Tools ════════════════════╗
║ reduced motion            │ less visual movement           ║
║ battle motion simplify    │ clearer combat presentation    ║
║ high contrast UI          │ stronger readability           ║
║ trail visibility          │ full / reduced / off           ║
║ background atmosphere     │ full / reduced / minimal       ║
║ UI scale                  │ larger or smaller interface    ║
╚══════════════════════════════════════════════════════════════╝
```

These settings are important, especially if:

- the scene feels too visually dense
- battle readability gets noisy
- motion is distracting
- UI feels too small

## 13. Debug Mode For Testers

If you are only playing normally, you can ignore this. If you are testing, debug mode matters.

```text
╔════════════════════ Debug Testing Layer ════════════════════╗
║ presets       │ jump straight to useful scenarios          ║
║ snapshots     │ compare states                             ║
║ roundtrip     │ verify save/load                           ║
║ audit         │ run broader health checks                  ║
║ replay seed   │ make tests more repeatable                 ║
╚══════════════════════════════════════════════════════════════╝
```

Useful built-in presets:

- Sleep Assist
- Teaching Pair
- Trust Cascade
- Social Web
- Hybrid Lineage
- Nursery Lineage

## 14. Good Things To Test

If you are playtesting intentionally, pay attention to:

- whether the garden feels readable
- whether sleep looks natural
- whether social changes feel gradual rather than random
- whether hybrids feel understandable and interesting
- whether accessibility settings noticeably help
- whether debug and audit tools feel clear rather than intimidating

## 15. Short Glossary

| Term | Meaning |
| --- | --- |
| archetype | the butterfly’s base type |
| hybrid | a bred butterfly with inherited traits |
| lineage | parent/ancestor identity trail |
| memory packet | stored remembered event/value |
| social edge | a relationship value toward another entity |
| routine reinforcement | behavior becoming more likely through repetition/teaching |
| oversleeping | a deeper, extended sleep state |
| gameplay audit | combined debug verification pass |

## 16. Best Way To Read The Game

```text
╔════════════════════ Best Reading Lens ════════════════════╗
║ Papilionem is not just a butterfly sandbox.               ║
║ It is a small life-simulation system where mood, memory,  ║
║ sleep, inheritance, and social history all matter.        ║
╚════════════════════════════════════════════════════════════╝
```
