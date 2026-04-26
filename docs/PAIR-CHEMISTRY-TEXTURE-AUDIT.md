# Pair Chemistry Texture Audit

## Purpose

This is the stable `n3` closure note.

It records the runtime changes and proof artifacts that deepened pair-specific
chemistry so recurring relationships no longer read as mostly the same
"warm" exchange with minor wording variance.

```text
before
pair mode
   ├─ easy / tender / guarded / strained / admiring / playful
   └─ many recurring pairs still converged on the same social feel

after n3
durable edges + recent residues
   └─> pair texture
       ├─ devoted
       ├─ playful
       ├─ admiring
       ├─ repairing
       ├─ guarded
       ├─ strained
       └─ steady
            ├─ steers subtype choice
            ├─ steers response phrasing
            ├─ surfaces in feed / inspect
            └─ biases later life-sim follow-through
```

## What Landed

```text
runtime changes
├─ communicationSystem now derives a pair-texture state from durable edges,
│  recent residues, and chemistry instead of relying only on coarse pair mode
├─ acknowledgement / calming subtype choice now respects that texture
├─ casual response phrasing now changes by texture, not only by signal family
├─ relationship summaries now surface pair texture and its signature
├─ threaded feed entries now carry pair texture instead of only pair mode
└─ lifeSim follow-through biases now read the same pair-texture truth
```

## Proof Artifacts

Targeted `n3` proof:
- `qa_screenshots/n3_pair_chemistry_audit/2026-04-22T06-11-26-124Z/report.json`

Broader social-depth regression:
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T06-11-51-638Z/report.json`

Communication regression:
- `qa_screenshots/r6_communication_audit/2026-04-22T06-11-51-640Z/report.json`

UI readability regression:
- `qa_screenshots/r4_ui_readability_audit/2026-04-22T06-13-14-236Z/report.json`

## n3 Exit Shape

```text
n3 exit
├─ distinct pair textures resolve from live relationship state -> green
├─ texture changes casual phrase feel, not just labels          -> green
├─ feed / inspect surface pair texture                          -> green
├─ life-sim follow-through consumes the same texture truth      -> green
├─ broader social-depth regression                              -> green
├─ communication regression                                     -> green
└─ UI readability regression                                    -> green
```

## Remaining Gap

`n3` makes recurring pairs feel more distinct, but it does not yet make the
whole garden feel like a visible butterfly society.

That next step belongs to `n4`.

```text
n3
├─ deepen one-to-one chemistry
├─ give recurring pairs recognizable texture
└─ let pair texture steer later behavior

n4
├─ widen from pairs to local social groups
├─ make reputations / cliques / witnessed behavior matter
└─ make the garden read as a society, not only a set of pairs
```

## Status

```text
n3 pair chemistry + relationship texture -> live
n4 butterfly society / group tone        -> active
```
