# Papilionem Active Social-Cognition Board

## Purpose

This board sequences the work needed to make Papilionem feel like a living
butterfly society instead of a mostly functional warning/response loop.

It exists because the runtime already had dialogue residue, pair-mode, and
relationship machinery, but the lived play experience still read too often as:

```text
warning / correction
   └─▶ obedient acknowledgement
        └─▶ little apparent feeling, chemistry, or society texture
```

The target feeling is:

```text
butterfly society
├─ companions who check in, linger, admire, tease, and comfort
├─ rivals who needle, avoid, resent, or compete
├─ pairs whose chemistry feels distinct
├─ groups whose local tone changes behavior
└─ talk that matters later because feelings and memory feed action
```

This board is not "make prettier dialogue lines."
It is a life-sim / cognition / communication track.

Use this with:

- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
- [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
- [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md)
- [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md)
- [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md)
- [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
- [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
- [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md)
- [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)
- [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
- [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)
- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)

## Problem Shape

```text
╔════════════════════════════ Social / Feeling Gap ════════════════════════════╗
║ player-facing symptom          │ likely underlying seam                     ║
╠════════════════════════════════╪═════════════════════════════════════════════╣
║ repetitive talk                │ motive family is too narrow / skewed       ║
║ "be careful" dominates         │ danger/warning talk outcompetes everything ║
║ flat responses                 │ listener response weighting is too generic ║
║ no real chemistry              │ pair dynamics are too shallow / invisible  ║
║ no visible society             │ group/reputation/local tone are underused  ║
║ feelings do not read later     │ talk-to-behavior follow-through is weak    ║
║ neural layer not helping       │ social scoring is not yet meaningfully fed ║
╚════════════════════════════════╧═════════════════════════════════════════════╝
```

## Non-Negotiables

```text
always preserve
├─ communicationSystem owns emitted speech/events, not the UI
├─ lifeSim/social truth stays authoritative over feelings and bonds
├─ ML may score social choices later, but may not own feelings/memory truth
├─ feed/inspect remain presentation layers, not bond/state owners
├─ emergence beats hand-authored cutscenes
├─ more depth must produce later behavior, not just prettier wording
└─ long-running saves must preserve identity, memory, and relationship continuity
```

## Ownership Map

```text
communicationSystem  -> utterance motives, exchange flow, heard events
lifeSimSystem        -> drives, emotions, social summaries, follow-through biases
memory/social state  -> durable residue, edge deltas, repetition/novelty pressure
mlInferenceSystem    -> later social action weighting only
gameUI/debugUI       -> visibility, not truth ownership
saveSystem           -> persistence and migration of durable social state
```

## Stable Evidence

```text
pre-n2 evidence
├─ manual playtest audit
│  ├─ warning            -> 123
│  ├─ acknowledgement    -> 79
│  ├─ comfort            -> 61
│  ├─ teaching           -> 58
│  ├─ companionship      -> 12
│  ├─ shared-observation -> 9
│  ├─ admiration         -> 1
│  └─ repair / rivalry / play / flirtation -> 0
└─ n0.5 measurement snapshot
   ├─ dialogue records         -> 345
   ├─ resolved pairs (>=3)     -> 11
   ├─ unresolved single-target -> 75
   ├─ average JS divergence    -> 0.5392
   ├─ median JS divergence     -> 0.4591
   └─ visible follow-through   -> 0.501
```

```text
n2 proof snapshot
├─ low-risk warning suppression         -> green
├─ invitation/social targeting          -> green
├─ multi-target warning auto-reply stop -> green
├─ casual reply variation by motive     -> green
├─ f5/f6 social depth regression        -> green
└─ r6 communication regression          -> green
```

```text
n3 proof snapshot
|- distinct pair textures resolve from live relationship state -> green
|- texture affects casual phrase feel, not only labels         -> green
|- feed / inspect surface pair texture                         -> green
|- life-sim follow-through reads the same texture truth        -> green
|- f5/f6 social depth regression                               -> green
|- r6 communication regression                                 -> green
`- r4 UI readability regression                                -> green
```

```text
n4 proof snapshot
|- witnessed praise changes observer admiration         -> green
|- clique comfort resolves as the active local rhythm   -> green
|- clique exclusion resolves as the active local rhythm -> green
|- protective ring resolves as the active local rhythm  -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

```text
n5 proof snapshot
|- partner-return keeps close to familiar partner       -> green
|- strained-avoidance keeps distance                    -> green
|- admiring-shadow stays near admired butterfly         -> green
|- protective-follow-through stays near vulnerable ally -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

Stable artifacts:

- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
- [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
- [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md)
- [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md)
- [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md)
- [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
- [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
- [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)

```text
n8 proof snapshot
|- protected social serialize             -> green
|- protected social roundtrip             -> green
|- overload recovery keeps sacred hybrid  -> green
|- r6 communication regression            -> green
`- runtime self baseline                  -> unchanged non-blocking warn
```

## Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current planning / implementation phase

queued
|- next in exact order

gated
`- cannot close honestly until prerequisite proof exists
```

## Phase Ladder

| Phase | Status | Goal | Primary owners | Honest gate |
| --- | --- | --- | --- | --- |
| `n0 social-truth audit + playtest gap map` | `live` | map what is currently live, what is under-expressed, and which repeated lines/motives dominate actual play | `docs/`, `systems/communicationSystem.js`, `systems/lifeSimSystem.js`, `qa_logs/`, `scripts/` | closed through `SOCIAL-TRUTH-AUDIT.md` plus the manual-capture audit artifacts in `qa_logs/social_truth_audit/2026-04-22T00-56-17-757Z/` |
| `n0.5 social measurement harness` | `live` | lock the measurable proof layer for social depth before family tuning gets deeper | `docs/`, `qa_logs/`, `scripts/`, `systems/communicationSystem.js`, `systems/lifeSimSystem.js` | closed through `SOCIAL-MEASUREMENT-HARNESS.md` plus `qa_logs/social_measurement_harness/2026-04-22T01-16-37-039Z/` |
| `n1 ownership + family lock` | `live` | lock the canonical feeling, memory, relationship, motive, and society families so later fixes do not overlap or drift, and co-own `SIM-CADENCE-CONTRACT.md` with runtime `v4` | `docs/`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js` | closed through `SOCIAL-FAMILY-LOCK.md` plus the sequencing signoff now recorded in `SIM-CADENCE-CONTRACT.md` |
| `n2 social motive rebalance` | `live` | stop warning/correction talk from crowding out companionship, banter, admiration, affection, irritation, repair, and curiosity | `systems/communicationSystem.js`, `entities/butterfly.js`, `scripts/` | closed through `SOCIAL-MOTIVE-REBALANCE-AUDIT.md` plus the green `n2`, `f5/f6`, and `r6` audit artifacts in `qa_screenshots/` |
| `n3 pair chemistry + relationship texture` | `live` | deepen pair-specific chemistry, moods, and recurring interaction texture so different relationships feel distinct | `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `ui/gameUI.js` | closed through `PAIR-CHEMISTRY-TEXTURE-AUDIT.md` plus the green `n3`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n4 butterfly society / group tone` | `live` | add local social context like reputations, cliques, teaching pockets, protectiveness, rivalry pressure, and witnessed interactions | `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/zoneSystem.js` | closed through `BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md` plus the green `n4`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n5 dialogue-to-behavior follow-through` | `live` | make talk visibly matter later through lingering, seeking, avoidance, imitation, repair, defense, and coordinated behavior | `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/behaviorSystem.js` | closed through `DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md` plus the green `n5`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n6 neural/social scoring integration` | `live` | make the model-backed layer score richer social choices using current feelings, memories, chemistry, and society context | `systems/mlInferenceSystem.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `docs/COGNITION-ML-CONTRACT.md` | closed through `NEURAL-SOCIAL-SCORING-AUDIT.md` plus the green `n6`, `f5/f6`, `r6`, `m3`, `m4`, and `deep-systems` artifacts in `qa_screenshots/` |
| `n7 surfacing + proof` | `live` | update the current runtime feed/inspect/debug surfaces with DOM-ready presentation snapshots so social depth is readable without turning presentation into the owner | `ui/gameUI.js`, `ui/debugUI.js`, `scripts/`, `docs/` | closed through `SOCIAL-SURFACING-PROOF-AUDIT.md` plus the green `n7`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n8 save migration + freeze` | `live` | preserve long-running relationships and migrate any widened durable social state cleanly | `systems/saveSystem.js`, `scripts/`, `docs/` | closed through `SOCIAL-SAVE-CONTINUITY-AUDIT.md` plus the green `n8` continuity artifact and non-regressing `r6` / runtime-self proof lanes |

## Exact Order

```text
n0
 │
 ▼
n0.5
 │
 ▼
n1
 │
 ▼
n2
 │
 ▼
n3
 │
 ▼
n4
 │
 ▼
n5
 │
 ▼
n6
 │
 ▼
n7
 │
 ▼
n8
```

## What "Feels Real" Means Here

```text
not enough
├─ more line templates
└─ more feed color or layout polish

actually needed
├─ richer motives
├─ richer listener interpretation
├─ richer pair chemistry
├─ richer group context
├─ later behavioral consequences
└─ model scoring that notices social texture
```

## Current Focus

```text
n8 closure update
|- n7 surfacing + proof       -> live
|- n8 save migration + freeze -> live
|- current proof -> `SOCIAL-SAVE-CONTINUITY-AUDIT.md`
`- next pressure -> no further local social phase is open; the remaining shared dependency is the later `v7 / s7 / n8` save-schema gate
```

## Current Truth

```text
post-n3 update
|- recurring one-to-one relationships now resolve into distinct pair textures
|- feed / inspect surface pair texture instead of only coarse pair mode
|- life-sim follow-through now reads the same pair-texture truth
`- the biggest remaining social gap is visible group tone / society context
```

```text
post-n4 update
|- witnessed exchanges now create small bystander carry-over on existing social edges
|- life-sim derives clique comfort, clique exclusion, protective ring, and reputation wave from local truth
|- Inspect now surfaces Society separately from Rhythm so group tone is readable
`- the biggest remaining social gap is stronger later behavior follow-through from that society context
```

```text
post-n5 update
|- familiar partners are visibly re-sought
|- strained partners push visible avoidance targets
|- admired butterflies attract shadowing behavior
|- vulnerable partners attract protective staying-near behavior
`- the biggest remaining social gap is making the richer depth easier to read in runtime v1 DOM panels and proof under n7
```

```text
current live status
|- low-risk warning emissions are suppressed more aggressively
|- invitation/social openings now land on nearby butterflies more reliably
|- multi-target warnings no longer harvest generic auto replies
|- pair chemistry and group tone are both visibly legible now
|- later social carry-over is visible in movement, not only wording
|- inspect/feed/debug now surface that richer depth through one presentation snapshot path
|- widened social durability now survives roundtrip restore and overload recovery
`- the social-cognition ladder is now locally frozen clean through n8
```

That means the social track is no longer blocked on readability or continuity.
Its only remaining dependency is the later shared save-schema signoff with the
runtime and spatial tracks.

