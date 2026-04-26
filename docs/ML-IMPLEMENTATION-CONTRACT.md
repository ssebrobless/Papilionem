# ML Implementation Contract

## Purpose

This document turns the cognition/ML plan into an implementation-ready contract.

It exists to lock:

- the first ML runtime shape
- the feature schema
- the policy outputs
- the inference schedule
- the fallback behavior
- the inspect/debug trace format

It is a bridge between:

- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ML-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ML-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md)

If a future ML implementation is not supported by this contract or later explicit user direction, it should be treated as unresolved rather than improvised.

For future promoted execution order, use
[ACTIVE-EXPANSION-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-EXPANSION-BOARD.md)
as the authoritative ladder.

Read the `M1`-`M5` sequence here as this contract's local phase history and
feature-boundary map:

- `M1`-`M4` describe the shipped heuristic/static-policy closure path
- `M5` marks the later 3-D occupancy extension boundary

The `c1`-`c7` model-backed expansion sequence is now live and frozen on the
expansion board and in the execution playbook.

## Shape

```text
╔════════════════════ ML Runtime Shape ════════════════════╗
║ durable sim truth                                        ║
║  drives · emotions · memories · social · routines        ║
║  genetics · upbringing · progression · battle context    ║
║                 │                                        ║
║                 ▼                                        ║
║ feature builder                                          ║
║  normalized numeric vector + compact categorical flags   ║
║                 │                                        ║
║                 ▼                                        ║
║ policy bundle                                            ║
║  garden-action · target · signal · risk · battle-posture║
║                 │                                        ║
║                 ▼                                        ║
║ arbitration / fallback                                   ║
║  model result if valid                                   ║
║  else heuristic chooser                                  ║
║                 │                                        ║
║                 ▼                                        ║
║ behavior systems                                          ║
║  move · feed · bond · build · signal · battle            ║
║                 │                                        ║
║                 ▼                                        ║
║ inspect / debug traces                                   ║
║  chosen path · confidence · alternatives · source        ║
╚═══════════════════════════════════════════════════════════╝
```

## Ownership

```text
one owner per truth

lifeSimSystem         │ canonical cognition state families
statProfileSystem     │ genetics/expression/battle stat derivation
progressionManager    │ encounter / rarity / lineage progression truth
battleSystem          │ autobattle context + result application
mlInferenceSystem     │ feature building + model execution + policy traces
UI                    │ presentation only
```

`mlInferenceSystem` is a planned owner. It may not become the source of truth for genetics, emotions, memories, or progression.

## Locked First Runtime Choice

The future model-backed replacement path is now locked to:

```text
runtime
├─ local browser inference
├─ pre-trained/static model artifact
├─ deterministic feature builder
└─ heuristic fallback always available
```

Current shipped bridge:

```text
local static policy artifact
├─ browser-loaded JSON policy weights
├─ deterministic action/target scoring
├─ no online dependency
└─ safe bridge toward later ONNX replacement
```

`c1` locks the replacement target without forcing the current shipped bridge to
change first. `c4` now proves the local static policy artifact as a measurable,
versioned bundle, and `c5`-`c7` now close the live runtime rollout, truthful
explainability shell, and soak/freeze proof for that local model-backed path.

Not locked yet for a later phase:

```text
training pipeline host
online learning
server inference
future multiplayer determinism enforcement
```

## Locked Initial Training Path

The first ML layer should be bootstrapped from the existing sim, not from a blank policy.

```text
phase-1 training source
├─ heuristic action traces exported from the current game
├─ curated scenario captures from audits
├─ hand-corrected labels where the heuristic is visibly wrong
└─ offline supervised training / imitation
```

`c2` is now live on that path:

- `scripts/build-c2-trace-corpus.js` is the dedicated export seam
- the corpus manifest now covers garden, communication, ecology, and autobattle scenarios
- reviewed labels stay outside save truth and are rebuild-checked from the persisted corpus records

Not part of the first ML phase:

```text
reinforcement learning
self-play optimization
live online training
```

## Feature Builder Contract

The feature builder must be deterministic, rebuildable, and cheap to recompute.

Persist:

```text
model version id
last trace summary if needed for inspect/debug
```

Do not persist:

```text
raw feature vectors
transient score caches
cheap local-neighbor summaries
```

Current live feature contract after `c3` + `n6`:

```text
frozen feature contract
|- 14 feature groups
|- 98 flat named features
|- 124 numeric vector values
|- b3 stable spatial hooks
|  `- verticality · structureRole · pathState · bodyFit
|- b7 stable spatial fields
|  `- occupancyBand · obstacleDensity · shelterCandidate · insideShelter · canUseInterior
`- inspect/runtime proof
   `- Schema · Feat · Space rows in Inspect and post-load feature proof in runtime-self audit
```

Current live `c4` closure:

```text
threshold-proved local artifact
|- live bundle
|  `- m4-garden-policy-v1
|- explicit metadata
|  |- artifactFormat = linear-policy-json
|  |- featureSchemaVersion = m4-feature-schema-v1
|  |- traceSchemaVersion = m4-trace-schema-v1
|  `- contractVersion = c1-runtime-contract-v1
|- runtime proof
|  `- getRuntimeSummary() now surfaces artifactSummary compatibility state
|- evaluation proof
|  |- rebuilt c2 corpus during m4 audit
|  |- runtime trace alignment across garden, communication, ecology, autobattle
|  |- 16 / 16 artifact matches on the latest passing corpus
|  `- reviewed teaching actionFamily correction beats heuristic baseline
`- compatibility sweep
   `- m1, m3, m4, and autobattle audits stay green while runtime-self keeps the post-load ML step green
```

Current live `c5`-`c7` closure:

```text
frozen model-backed baseline
|- live runtime rollout
|  |- garden action / target / signal / risk scoring now runs through the local artifact
|  |- battle policy traces now stay on the same model-backed path
|  `- fallback remains explicit and audited
|- truthful explainability shell
|  |- Inspect rows: Path · Why
|  `- debug shell: artifact path · source · confidence · alternatives · feature drivers · budgets
|- performance / soak proof
|  |- focused-garden inference budget = 3.5ms
|  |- battle decision budget = 0.75ms
|  |- runtime-self proves post-load explainability and budget continuity
|  |- long soak proves the model-backed path stays live across checkpoints
|  `- final grand-plan proof now passes on the frozen expansion baseline
`- scope boundary
   `- later ONNX replacement remains optional future work, not a missing current phase
```

### Feature groups

```text
Identity
├─ archetype id
├─ rarity bucket
├─ sex
├─ birth source
└─ special ability id

Genetics / expression
├─ 6 baseline traits
├─ 6 effective traits
├─ inherited ability origin
├─ mutation presence
└─ upbringing summary

Drives
├─ 8 drive values

Emotions
├─ 9 emotion values

Social
├─ reputation
├─ belonging
├─ confidence
├─ active context
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
└─ recent communication activity

Player interaction
├─ cursorTrust
├─ cursorFear
├─ petHistory
├─ clapStartleHistory
└─ calmedByCursor

Object awareness
├─ focusType
├─ currentAffordance
├─ carryingType
├─ flower familiarity
├─ pollen familiarity
├─ egg familiarity
├─ block familiarity
└─ shelter confidence

Space / 3D-ready context
├─ verticality
├─ structure role
├─ path state
└─ body fit

Progression context
├─ origin type
├─ rarity exposure
├─ variant familiarity
├─ lineage value
└─ encounter value

World context
├─ zone kind
├─ crowding
├─ novelty
├─ flower availability
├─ nearby allies
├─ nearby rivals
├─ nearby vulnerable targets
└─ battle vs garden mode

Autobattle context
├─ ally pressure
├─ enemy threat
├─ target priority
├─ spacing state
├─ retreat pressure
└─ support opportunity
```

Shared hook ownership is now locked for future expansion:

```text
owner
└─ structureSystem

exported hook set
├─ verticality
├─ structureRole
├─ pathState
└─ bodyFit

consumer rule
├─ lifeSimSystem and mlInferenceSystem may import these hooks
└─ neither consumer may invent duplicate enums or labels
```

Live count after `c3` + `n6`:

```text
14 groups
98 flat named features
124 numeric vector values
```

### Encoding rules

```text
numeric channels
├─ normalized to 0..1 where practical
└─ clamped before inference

categorical channels
├─ stable enum ids
└─ one-hot or compact embedding index

missing values
└─ explicit zero/default encoding, never NaN
```

## Policy Bundle Contract

The first ML phase should be split into multiple small policies instead of one opaque mega-decision.

```text
policy bundle
├─ action-family policy
├─ target-preference policy
├─ signal policy
├─ risk-posture policy
└─ autobattle-posture policy
```

### 1. Action-family policy

Outputs weighted preferences for:

```text
wander
feed
socialize
signal
teach
court
rest
avoid
buildOrUseObject
battlePosture
```

### 2. Target-preference policy

Outputs weighted preferences for:

```text
flower
butterfly
block
shelter
doorway
emptySpace
```

### 3. Signal policy

Outputs weighted preferences for:

```text
calming
warning
teaching
invitation
quiet
```

### 4. Risk-posture policy

Outputs weighted preferences for:

```text
approach
observe
avoid
flee
```

### 5. Autobattle-posture policy

Outputs weighted preferences for:

```text
engage
support
focusWeakTarget
stabilize
retreat
```

## Arbitration Contract

The model does not directly mutate the world.

```text
allowed
feature vector -> model scores -> chooser/arbitrator -> existing systems act

forbidden
model -> directly edits memories / emotions / genetics / progression / battle truth
```

Behavior systems remain responsible for:

```text
movement
feeding
object pickup/drop/place
breeding transitions
signaling execution
battle resolution
```

The ML layer only proposes preferences.

## Inference Schedule Contract

The first ML phase should infer periodically, not every frame.

### Garden mode

```text
default cadence
├─ every 20 simulation frames
└─ or earlier on major context change
```

Major context changes include:

```text
focus target changed
sleep state changed
pet or clap event
new signal received
object picked up or dropped
flower reached or depleted
courtship / breeding state changed
zone travel started or completed
```

### Autobattle mode

```text
default cadence
└─ once per autobattle decision tick
```

The battle tick remains owned by [C:\Users\fishe\Documents\projects\ephemera\systems\battleSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/battleSystem.js).

## Fallback Contract

The game must remain fully playable if:

```text
model file missing
model load fails
inference throws
feature vector invalid
model output invalid
```

Fallback rule:

```text
1. log a compact debug event
2. mark the trace source as heuristic-fallback
3. use existing heuristic chooser for that policy tick
4. do not corrupt durable state
```

This is mandatory for:

```text
garden simulation
autobattle
save/load continuity
debug / audit tools
```

Current shipped proof now covers:

- Inspect rows for decision source, chosen path, context, and short history
- debug footer surfacing for backend, model id, and fallback count
- ML closure proof for a real heuristic-fallback tick with the model unavailable

## Trace / Inspect Contract

The ML layer is not done until it is readable.

Inspect / Debug must show:

```text
Decision Source
├─ heuristic
├─ ml
└─ heuristic-fallback

Chosen Path
├─ action family
├─ target preference
├─ signal choice
└─ risk posture

Confidence
├─ chosen score
├─ confidence band
└─ uncertainty flag

Alternatives
├─ next-best option
├─ second-next option
└─ rejection reasons summary

Context
├─ dominant drives
├─ dominant emotions
├─ object focus
├─ player trust/fear
└─ battle or garden mode
```

The player-facing question remains:

```text
why did this butterfly do that?
```

The answer must be visible without reading code.

## Audit Contract

The ML phase is not complete until audits can prove:

```text
1. the same butterfly can choose different actions in different contexts
2. different inherited traits produce different policy outputs
3. upbringing changes expression without mutating genotype truth
4. clap/pet/cursor trust changes future choices
5. object and shelter context affect action/target selection
6. autobattle posture changes with pressure/threat/support context
7. save/load preserves durable truth and safely rebuilds policy inputs
8. fallback path keeps the game playable if the model is absent
9. inspect/debug exposes chosen path and source correctly
```

Recommended audit layers:

```text
formula / schema tests
scenario tests
save-load round-trip tests
battle probe tests
visual QA screenshots/video
long-run soak tests
```

## Phase Order Contract

The ML work should ship in this order:

```text
Phase M1
├─ feature builder
├─ trace format
└─ heuristic-fallback wiring

Phase M2
├─ garden action-family policy
└─ target-preference policy

M2 currently ships with the local static policy artifact backend above.

Phase M3
├─ signal policy
└─ risk-posture policy

M3 currently ships with the same local static policy artifact backend for:

```text
garden policies
├─ action-family
├─ target-preference
├─ signal-choice
└─ risk-posture
```

Phase M4
└─ autobattle-posture policy

M4 currently ships with the same local static policy artifact backend for:

```text
battle policy
└─ autobattle-posture
```

Phase M5
└─ 3D occupancy feature extension once full shelter logic ships
```

Do not skip straight to autobattle ML before the garden feature builder and trace layer are stable.

## Hard Exclusions

The ML implementation must not:

```text
reintroduce pool-era progression
rely on removed Ephemera mechanics
replace owner systems as truth
require online services for basic single-player use
hide decisions behind unreadable opaque outputs
```

## Definition Of Done

This contract is fulfilled when:

```text
1. a dedicated ML inference owner exists
2. live features are built deterministically from current sim truth
3. at least the first policy layers are model-backed
4. heuristics remain as safe fallback
5. inspect/debug can explain the chosen path
6. audits prove the model changes behavior meaningfully
7. the system stays compatible with future 3D shelter logic and later online work
```
