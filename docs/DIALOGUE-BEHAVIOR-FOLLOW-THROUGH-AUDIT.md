# Dialogue-Behavior Follow-Through Audit

## Purpose

This is the stable closure note for `n5 dialogue-to-behavior follow-through`.

It exists to prove that Papilionem now carries dialogue and relationship
texture forward into later visible behavior instead of letting social state stay
mostly inside feed wording and inspect summaries.

## Phase Shape

```text
n5 dialogue-to-behavior follow-through
|- relationship carry-over
|  |- familiar partners are re-sought
|  |- strained partners are avoided
|  |- admired partners are shadowed
|  `- vulnerable partners pull protective staying-near behavior
|- owner split stays clean
|  |- communicationSystem -> derive follow-through profile from durable edges
|  |- lifeSimSystem       -> expose derived follow-through bias
|  |- behaviorSystem      -> surface action-family / subtype intent
|  |- butterfly           -> choose visible movement targets from that truth
|  `- gameUI              -> presentation only
`- no second social owner introduced
```

## Live Runtime Truth

```text
owners
|- systems/communicationSystem.js
|  `- derives seek / avoid / imitate / protect carry-over from existing edge truth
|- systems/lifeSimSystem.js
|  `- exposes follow-through inside socialEcology + behavior bias summaries
|- systems/behaviorSystem.js
|  `- surfaces partner-return / strained-avoidance / admiring-shadow / protective-follow-through
`- entities/butterfly.js
   `- turns the derived follow-through into actual visible movement choice
```

The phase deliberately did not widen durable save truth.

`n5` reuses:
- trust
- comfort
- attachment
- admiration
- protectiveness
- resentment
- rejection weight
- follow-through score
- recent warmth / ease / friction / mutual attention
- pair texture
- society context

## Proof Snapshot

```text
n5 proof
|- partner-return keeps close to familiar partner       -> green
|- strained-avoidance keeps distance                    -> green
|- admiring-shadow stays near admired butterfly         -> green
|- protective-follow-through stays near vulnerable ally -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

Primary artifacts:
- `qa_screenshots/n5_dialogue_behavior_follow_through_audit/2026-04-22T07-27-31-687Z/`
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T07-27-59-696Z/`
- `qa_screenshots/r6_communication_audit/2026-04-22T07-27-59-740Z/`
- `qa_screenshots/r4_ui_readability_audit/2026-04-22T07-27-59-771Z/`

## Honest Boundaries

```text
still true after n5
|- no UI-owned relationship or feeling truth
|- no ML-owned durable emotion / memory / edge truth
|- no new durable social schema yet
`- n6 is still required before the model-backed layer can help choose richer social actions
```

`n5` makes later social carry-over visible in normal movement, but it is not
the neural-social scoring phase. The next pressure is still `n6 neural/social
scoring integration`.
