# ENV64 Evidence Lock - Dialogue Legibility Read

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Commit: pending

## Goal

The next user-visible risk after ENV63 was dialogue quality: the feed previously felt too much like vague atmospheric narration and not enough like social communication. ENV64 is an evidence-only lock. No code changed in this slice because the current audits show the feed is already producing direct social and task language at the proof level.

## Dialogue Shape Observed

```
living state / object need
        |
        v
communicationSystem dialogue
        |
        v
feed entries with:
  - speaker
  - target(s)
  - phrase
  - intent tags
  - social/task grounding
        |
        v
readability audit ratios
```

## Proofs

### Dialogue Readability

Command:

```bash
node scripts/run-dialogue-readability-audit.js --frames 7200
```

Result: pass.

Report:

`qa_screenshots/dialogue_readability_audit/2026-05-05T14-41-55-281Z/report.json`

Important evidence:

- dialogue count: 96
- unique phrase count: 69
- unique phrase ratio: 0.7188
- social language ratio: 0.9896
- task language ratio: 0.3958
- atmospheric count: 0
- atmospheric ratio: 0
- system-like count: 0
- system-like ratio: 0
- readability verdict: pass

Representative lines:

- "I am trying not to guess wrong. You felt farther away from me than a moment ago."
- "I wanted to show you this spot. I like noticing this with you near the garden edge."
- "The shade would help me settle. Stay with me there a moment."
- "This ground needs cleaning before we plant here. The sooner we clear it, the sooner this place can feed us again."
- "I found a better path toward Open Land SE. Come with me if you trust my read."

### Ecology Dialogue Causality

Command:

```bash
node scripts/run-ecology-dialogue-causality-audit.js --frames 7200 --unforced
```

Result: pass.

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T14-41-55-302Z/report.json`

Important evidence:

- mode: unforced soak
- unforced soak verdict: healthy
- dialogue count: 99
- ecology dialogue count: 39
- ecology dialogue ratio: 0.3939
- cleanup dialogue observed
- pollen dialogue observed
- reserve-food dialogue observed
- shade-rest dialogue observed
- cleanup follow-through observed
- pollen follow-through observed
- reserve-food follow-through observed
- shade-rest follow-through observed

Representative ecology lines:

- "There is reserve food here. Let us share it before anyone gets too worn down."
- "I need a darker place to rest. Can we stay near the shade?"
- "The shade would help me settle. Stay with me there a moment."
- "I found a better path toward Training Grounds. Come with me if you trust my read."

## Honest Read

This does not prove literal consciousness or human-level language. It does prove the current dialogue layer is no longer dominated by abstract atmospheric phrasing in the audited runs. The stronger remaining issue is not "they cannot talk"; it is depth and continuity:

- more multi-turn conversational memory should shape later lines,
- repetition should keep trending down in longer captures,
- individual voice/personality should become more legible,
- ML should eventually help choose better timing and targets for dialogue, not invent durable feelings.

## Next Planning Signals

The next high-value slice should likely focus on one of these:

1. Longer conversation continuity: prove a butterfly references a prior conversation later in the same session without a direct fixture call.
2. Individual voice differentiation: measure whether two butterflies with different traits produce measurably different dialogue distributions.
3. ML dialogue value: measure whether ML improves partner/intent timing compared with heuristic selection.

## Rollback

No code changes were made in ENV64.
