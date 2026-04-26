# Social Measurement Harness

## Purpose

This doc is the stable `n0.5` proof layer for the social-cognition track.

It exists so later phases can be measured against one explicit harness instead
of relying on anecdotal feed impressions alone.

```text
social proof stack
├─ n0  -> what feels flat in lived play
└─ n0.5 -> how we measure whether it actually improved
```

Use this with:

- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
- [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
- [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)

## Harness Outputs

```text
n0.5 harness
├─ motive-family frequency distribution
├─ pair-distinctness metric
└─ follow-through proxy rate
```

### 1. Motive-family frequency distribution

The harness counts how often each motive family actually appears in a capture.

This is the proof layer for:

- warning dominance
- acknowledgement dominance
- under-expressed companionship / admiration / repair / play / flirtation

### 2. Pair-distinctness metric

The harness computes Jensen-Shannon divergence across resolved single-target
pair-line distributions.

```text
high divergence
└─ two pairs sound materially different

low divergence
└─ two pairs are collapsing into the same social voice
```

Current limitation:

- the live capture format does not yet persist explicit target labels on every
  dialogue residue
- resolved pairs therefore currently depend on addressee extraction from the
  emitted phrase when `talkMode == single_target`
- unresolved single-target lines are reported separately instead of being
  hidden

### 3. Follow-through proxy rate

The harness uses the life-sim-owned `followThroughState` marker as the current
proxy for whether a dialogue residue became visibly social later.

```text
visible proxy states
├─ acting
├─ held
├─ lingering
├─ held-at-distance
└─ repair-open
```

This is intentionally a proxy, not a UI guess.

Future phases may replace it with stricter event-linked timing proof, but the
current owner remains life-sim / communication state rather than presentation.

## Current Evidence

Primary manual-capture artifact:

- [2026-04-22T01-16-37-039Z/REPORT.md](../qa_logs/social_measurement_harness/2026-04-22T01-16-37-039Z/REPORT.md)

Current measured snapshot from that manual playtest capture:

```text
dialogue records          -> 345
resolved pairs (>=3)      -> 11
unresolved single-target  -> 75
average JS divergence     -> 0.5392
median JS divergence      -> 0.4591
visible follow-through    -> 0.501
```

```text
current reading
├─ some pairs are genuinely distinct
├─ but many still collapse into acknowledgement-heavy sameness
└─ follow-through exists, but warning / compliance still dominates the felt mix
```

## Owner Boundaries

```text
communicationSystem / lifeSimSystem
├─ own the emitted dialogue residue and follow-through state
└─ therefore own the harness inputs

gameUI / feed / inspect
└─ may display the result, but never invent or mutate the underlying truth

mlInferenceSystem
└─ may later weight social choices, but does not define pair identity,
   durable feelings, or the harness source data
```

## Phase Gate

`n0.5` closes when:

1. the harness script exists and runs on a real manual capture
2. the three outputs above are written into `qa_logs/social_measurement_harness`
3. the active social board points to this doc as the stable measurement layer

That gate is now satisfied.
