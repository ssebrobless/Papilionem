# Neural-Social Scoring Audit

## Purpose

This is the stable closure note for `n6 neural/social scoring integration`.

It exists to prove that Papilionem's ML scoring layer now notices richer
life-sim-owned social truth without becoming a second owner of feelings,
memories, relationship edges, or society state.

## Phase Shape

```text
n6 neural/social scoring integration
|- feature bundle widened with read-only social context
|  |- society tone
|  |- relationship texture
|  |- follow-through mode + strength
|  |- local signal-field tone + pressure
|  |- follow-through drive
|  `- social avoidance
|- heuristic scorer now notices that context
|  |- clique comfort lifts butterfly targeting and invitation
|  |- devoted seek lifts approach + socialize pressure
|  |- strained avoid lifts avoidance + quiet
|  `- protective warning shifts calming / warning choice
`- owner split stays clean
   |- lifeSimSystem + communicationSystem own social truth
   |- mlInferenceSystem only reads and weights
   `- no durable social state moved into ML
```

## Live Runtime Truth

```text
owners
|- systems/lifeSimSystem.js
|  `- owns derived socialEcology + behaviorBiases truth
|- systems/communicationSystem.js
|  `- owns pair texture, local signal field, and follow-through derivation
`- systems/mlInferenceSystem.js
   |- widens the transient feature bundle to 14 groups / 98 flat / 124 vec
   `- scores richer social action choices from read-only social inputs
```

`n6` did not widen durable save truth.

It only widened transient ML features with:
- `social.societyTone`
- `social.relationshipTexture`
- `social.followThroughMode`
- `social.followThroughStrength`
- `social.localFieldTone`
- `social.localFieldPressure`
- `behavior.followThroughDrive`
- `behavior.socialAvoidance`

## Proof Snapshot

```text
n6 proof
|- clique comfort raises butterfly targeting + invitation -> green
|- devoted seek raises approach + socialize pressure      -> green
|- strained avoid raises avoidance + quiet               -> green
|- protective warning shifts calming / warning choice    -> green
|- f5/f6 social depth regression                         -> green
|- r6 communication regression                           -> green
|- ml phase m3 feature contract                          -> green
|- ml phase m4 artifact/runtime lane                     -> green
`- deep systems regression                               -> green
```

Primary artifacts:
- `qa_screenshots/n6_neural_social_scoring_audit/2026-04-22T07-53-31-722Z/`
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T07-55-04-634Z/`
- `qa_screenshots/r6_communication_audit/2026-04-22T07-55-32-773Z/`
- `qa_screenshots/ml_phase_m3_audit/2026-04-22T07-56-41-545Z/`
- `qa_screenshots/ml_phase_m4_audit/2026-04-22T07-56-57-744Z/`
- `qa_screenshots/deep_systems_audit/2026-04-22T07-58-15-353Z/`

## Honest Boundaries

```text
still true after n6
|- ML may score / weight only
|- no ML-owned durable emotion / memory / edge truth
|- no UI-owned social truth
|- no durable save-schema widening happened here
`- n7 is still required so this richer depth becomes more legible in runtime v1 DOM panels and proof
```

`n6` makes the model-backed layer socially literate enough to notice clique
comfort, strain, protection, devotion, and local signal pressure, but it does
not replace life-sim or communication as the owner of those constructs. The
next pressure is still `n7 surfacing + proof`.
