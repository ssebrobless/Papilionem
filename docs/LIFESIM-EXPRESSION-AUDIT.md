# Life-Sim Expression Audit

## Matrix

| Family | Fields / focus | Stored | Updated | Behavior-driving | UI surfaced | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Identity | archetype, source, entityType | yes | yes | yes | partial | live |
| Drives | selfMaintenance, safetyAvoidance, resourceControl, socialConnection, caregiving, exploration, statusExpression, rest | yes | yes | yes | yes | live |
| Emotions | threat, relief, attachment, rejection, significance, failure, curiosity, agitation, exhaustion | yes | yes | yes | yes | live |
| Memories | place, object, interaction, outcome, routine, social, danger, care | yes | yes | yes | yes | live |
| Social edges | trust, comfort, attachment, dependence, rivalry, resentment, admiration, protectiveness | yes | yes | yes | partial | live |
| Social summary | reputation, belonging, confidence, focus, activeContext | yes | yes | yes | yes | live |
| Routines | movement, social, care, resource, rest, vigilance, teaching | yes | yes | yes | yes | live |
| Interpretation | clarity, lastSignals, warpedSignals | yes | yes | yes | yes | live |
| Communication | signals, phrases, pending responses, conversations | yes | yes | yes | yes | live |
| Social ecology | local signal field, roost/warning/teaching/courtship rhythms, zone-social context | yes | yes | yes | yes | live |
| Distortion | traumaBias, anxietyBias, withdrawalBias, fixationBias, insomniaBias, oversleepBias, warpedTeachingBias | yes | yes | yes | yes | live |
| Genetics | baselineTraits, inheritedTraits, heritageTags, lineageIds | yes | yes | yes | partial | live |
| Upbringing | imprintSources, lessons, routineReinforcement | yes | yes | yes | yes | live |
| Lifecycle | ageTicks, stage, sleep markers, death state, zone ownership | yes | yes | yes | yes | live |
| Derived cognition | dominant drives/emotions, crowding, novelty, behaviorBiases, migration summary | yes | yes | yes | yes | live |

## What Changed

The major under-expressed gap was that memories, routines, upbringing, and distortion existed as real owned truth, but they were only lightly expressed in behavior and Inspect. `I1` closed that gap. `a4` then extended the same life-sim surface so local social ecology is also behavior-driving, inspectable, and audit-proved. The current runtime now:

- appraises butterfly and caterpillar state every frame
- updates all major drive channels
- updates all major emotion channels
- maintains a social summary (`reputation`, `belonging`, `confidence`, `focus`, `activeContext`)
- feeds memory density, routine strength, lesson reinforcement, and distortion families back into drive and emotion targets
- updates all current distortion families that matter to the shipped runtime, including `traumaBias`, `insomniaBias`, `oversleepBias`, and `warpedTeachingBias`
- derives behavior biases that butterfly movement, caution, shelter-seeking, cursor affinity, object interest, and battle posture now consume
- derives social-ecology rhythm summaries for roosting pockets, warning cascades, teaching pockets, and courtship territories from nearby butterflies, signal fields, sleep state, relationship pressure, and zone context
- feeds those social-ecology summaries back into behavior, sleep settling, communication grounding, Inspect, and debug-shell truth
- exposes memory, habit, upbringing, and distortion residue in dedicated Inspect cards
- exposes social rhythm and local signal field grounding in Inspect plus the debug spatial-focus shell
- proves those families directly in `run-lifesim-expression-audit.js` instead of only inferring them from dominant drives/emotions
- proves the dedicated emergence layer in `run-e4-social-ecology-audit.js` and widened `run-r6-communication-audit.js`
- keeps save/load continuity honest by synchronizing sleep oversleep habit with live distortion truth during durable serialization

## Audit Proof

The closure-grade proof for this document is now:

- `node scripts/run-e4-social-ecology-audit.js`
- `node scripts/run-lifesim-expression-audit.js`
- `node scripts/run-r6-communication-audit.js`
- `node scripts/run-r4-ui-readability-audit.js`
- `node scripts/run-runtime-self-audit.js`

## Bounded By Design

The remaining limits here are current design boundaries, not missing implementation:

- memories are structured packet families, not open-ended freeform planning text
- routines and upbringing bias action scoring and social/training follow-through, not a fully scheduled day planner
- distortion bends shared cognition and sleep systems instead of spawning disconnected pathology mini-systems
- communication remains a bounded signal-and-phrase runtime, not a general symbolic language model

## Plain-Language Verdict

The life-sim is now a live shipped cognition stack for the current Papilionem scope, not a partially expressed placeholder. Within the game's bounded model, memories, routines, upbringing, distortion, and local social ecology are now behavior-driving, inspectable, and audit-proved.
