# Cognition / ML Neural Contract

## Purpose

This document defines the intended cognition stack for Papilionem and separates:

- what is already implemented heuristically
- what remains to be made model-backed
- what must be inspectable, save-safe, and auditable

It exists so the live and future ML layers stay disciplined extensions of the
life-sim, not ad hoc replacements.

## Source Anchors

- [C:\Users\fishe\Documents\projects\ephemera\systems\lifeSimSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/lifeSimSystem.js)
- [C:\Users\fishe\Documents\projects\ephemera\docs\LIFESIM-EXPRESSION-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/LIFESIM-EXPRESSION-AUDIT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)
- [C:\Users\fishe\.codex\skills\life-simulation-architecture\references\drives-emotions-memory-social.md](C:/Users/fishe/.codex/skills/life-simulation-architecture/references/drives-emotions-memory-social.md)
- [C:\Users\fishe\.codex\skills\life-simulation-architecture\references\communication-routines-distortion.md](C:/Users/fishe/.codex/skills/life-simulation-architecture/references/communication-routines-distortion.md)

## Shape

```text
╔════════════ Cognition Stack ════════════╗
║ durable truth                           ║
║  ├─ drives                              ║
║  ├─ emotions                            ║
║  ├─ memories                            ║
║  ├─ social edges                        ║
║  ├─ routines                            ║
║  ├─ interpretation                      ║
║  ├─ distortion                          ║
║  ├─ genetics / upbringing               ║
║  └─ lifecycle                           ║
║            │                            ║
║            ▼                            ║
║ derived cognition                       ║
║  ├─ dominant drives                     ║
║  ├─ dominant emotions                   ║
║  ├─ crowding / novelty                  ║
║  └─ behavior biases                     ║
║            │                            ║
║            ▼                            ║
║ action selection                        ║
║  ├─ heuristic today                     ║
║  └─ model-backed later                  ║
║            │                            ║
║            ▼                            ║
║ visible behavior                        ║
║  ├─ movement / feeding / bonding        ║
║  ├─ signaling / teaching                ║
║  ├─ breeding / care                     ║
║  └─ battle readiness contribution       ║
╚═════════════════════════════════════════╝
```

## Locked Current Families

### Drives

```text
selfMaintenance
safetyAvoidance
resourceControl
socialConnection
caregiving
exploration
statusExpression
rest
```

### Emotions

```text
threat
relief
attachment
rejection
significance
failure
curiosity
agitation
exhaustion
```

### Other cognition families

```text
memories
socialEdges
routines
communication
distortion
interpretation
social summary
derived behavior biases
```

## Locked Current Heuristic Outputs

The current life-sim already derives these behavior-facing outputs:

```text
wanderScale
feedUrgency
displayConfidence
socialConfidence
caution
trainingAffinity
```

These are currently authoritative until the ML layer replaces or augments the relevant decision points.

## Current Heuristic Appraisal Inputs

The live system already uses:

```text
crowding
zone flower availability
attachment average
admiration average
rejection average
communication activity
lesson count
teaching routine strength
novelty
warning/calm signals
active conversation bonus
special ability bias
rarity bias
state threat/care/display/feed-focus
sleep state
happiness ratio
memory density
```

## Contract Rule: What ML May Replace

The live model-backed layer may replace or augment:

```text
action-family scoring
target preference scoring
signal choice scoring
social response weighting
risk tolerance weighting
```

The live model-backed layer must not replace:

```text
canonical storage of drives
canonical storage of emotions
canonical storage of memories
canonical storage of social edges
canonical genetics truth
canonical lifecycle truth
```

ML is allowed to choose from the state.
ML is not allowed to become the source of truth for the state families themselves.

## Boundary Audit (P6)

The later audit rule is:

```text
systems/mlInferenceSystem.js
|- may score
|- may weight
`- may not mutate protected save-state groups
```

Protected groups are the ones listed in
[SAVE-SCHEMA-REGISTRY.md](/C:/Users/fishe/Documents/projects/ephemera/docs/SAVE-SCHEMA-REGISTRY.md)
under:

- `identity`
- `memory`
- `relationship edges`
- `lineage`
- `emotions`
- `drives`

The audit script itself lands in a later implementation phase.
This document holds the rule now.

## ML Input Contract

The model-backed layer must consume a structured feature vector built from the current life-sim.

Minimum feature groups:

```text
Identity
├─ archetype
├─ rarity
├─ sex
├─ birthSource
└─ special ability

Genetics / expression
├─ baseline traits
├─ effective traits
├─ inherited ability
└─ upbringing summary

Drives
├─ 8 drive values

Emotions
├─ 9 emotion values

Social
├─ reputation
├─ belonging
├─ confidence
├─ focus/context
└─ summarized edge strengths

Interpretation / distortion
├─ clarity
├─ warpedSignals
├─ anxietyBias
├─ withdrawalBias
├─ fixationBias
├─ insomniaBias
├─ oversleepBias
└─ warpedTeachingBias

Memory / routine summaries
├─ memory density by family
├─ routine strength by family
└─ active conversation / recent signals

World context
├─ zone kind
├─ crowding
├─ novelty
├─ available flowers
├─ nearby allies
├─ nearby rivals
├─ nearby vulnerable targets
└─ battle vs garden mode
```

The new-system extension points for:

- player interaction memory
- object affordance awareness
- 3D-ready spatial understanding
- progression context
- autobattle context

are defined in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)

## ML Output Contract

The model must output weighted preferences, not directly mutate the world.

Required output families:

```text
nextActionFamily
├─ wander
├─ feed
├─ socialize
├─ signal
├─ teach
├─ court
├─ rest
├─ avoid
├─ build/use object
└─ battle posture

targetPreference
├─ flower
├─ butterfly
├─ block
├─ shelter
├─ doorway
└─ empty space / roam target

signalChoice
├─ calming
├─ warning
├─ teaching
├─ invitation
└─ quiet / none

riskPosture
├─ approach
├─ observe
├─ avoid
└─ flee bias
```

## Integration Rule

```text
life-sim state ──▶ feature builder ──▶ model scores ──▶ behavior system acts
```

Not allowed:

```text
model ──▶ directly edits memories / emotions / genetics / social edges
```

Those must still change through owner systems and normal simulation consequences.

## Persistence Contract

Persist:

```text
model config/version id
last inference trace summary if needed for inspect/debug
any long-lived policy state only if explicitly introduced
```

Do not persist:

```text
full transient action score cache
cheap neighbor summaries
recomputable feature vectors
```

## Inspect / Debug Contract

The player/debug surfaces must eventually show:

```text
Mind
├─ dominant drives
├─ dominant emotions
├─ context
├─ clarity
└─ distortion highlights

Decision
├─ chosen action family
├─ target preference
├─ signal preference
├─ confidence / certainty
└─ top rejected alternatives
```

The goal is that we can answer:

```text
why did this butterfly do that?
```

without guessing.

## Audit Contract

The ML layer is not done until audits can prove:

```text
1. different internal states produce different action preferences
2. inherited traits materially affect decisions
3. upbringing materially affects expression, not genotype truth
4. distortion materially warps interpretation/behavior
5. save/load preserves long-term cognition truth correctly
6. debug/inspect can expose the chosen path
```

Current shipped proof now covers:

- visible chosen-path rows in Inspect for action, target, signal, risk, battle,
  context, and short history
- runtime self-audit and ML closure proof for inspect/debug trace surfacing
- live model-backed garden and battle rollout with explicit fallback proof
- focused-garden / battle budget proof on the live ML runtime seam
- long-soak and final grand-plan proof on the frozen expansion baseline

## Locked Current Boundary

Right now, owner truth still remains outside the ML layer, but choice scoring is
no longer heuristic-only.

That means:

```text
implemented today
├─ heuristic appraisal and owner-authored derived behavior biases
├─ local model-backed action / target / signal / risk / battle preference scoring
├─ inspectable explainability through Inspect and debug shells
└─ fallback-safe, post-load, and long-soak-proved runtime behavior
```

The remaining incompleteness now sits only in optional runtime-replacement and
networking work, not in the shipped local model-backed layer.

## c1 Locked Replacement Boundary

These decisions are now locked tightly enough for later ML phases to build
against safely:

```text
future model-backed runtime
├─ ONNX Runtime Web in the local browser
├─ versioned local artifact bundle
├─ deterministic feature and trace schemas
└─ heuristic fallback required on every failed tick

offline training path
├─ heuristic traces exported from the live sim
├─ curated audit scenarios
├─ hand-corrected labels where the heuristic is visibly wrong
└─ offline supervised / imitation training only

shared spatial hooks for b3 / c3
├─ verticality
├─ structureRole
├─ pathState
└─ bodyFit
owner: structureSystem

no-online-dependency rule
├─ no server inference
├─ no live online training
└─ no runtime dependency beyond local bundled assets
```

What remains later is optional replacement work, not contract ambiguity:

```text
still later
├─ actual ONNX artifact rollout if that replacement path is ever promoted
├─ alternate local training-host / runtime-pipeline decisions
└─ future multiplayer determinism / networking constraints
```

The implementation details for these locks now live in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)

## Definition Of Done

This contract is complete in implementation when:

```text
the butterfly mind is not just stored
it is behavior-driving, inspectable, auditable,
and partly model-backed where the contract says it should be
```
