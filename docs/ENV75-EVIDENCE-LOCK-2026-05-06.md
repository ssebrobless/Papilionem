# ENV75 Evidence Lock - Unforced Ecology Follow-Through

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Shape

```
+------------------------------------------------------------------+
| Question: do ecology behaviors happen in a lived run?             |
+----------------+------------------+------------------------------+
| lane           | observed?        | proof signal                 |
+----------------+------------------+------------------------------+
| cleanup        | yes              | 17 cleanup events            |
| pollen         | yes              | 22 pollen follow-throughs    |
| reserve food   | yes              | 6 reserve-food uses          |
| shade/rest     | yes              | 38 shade-rest arrivals       |
+----------------+------------------+------------------------------+
```

## Why this phase did not add code

ENV74 proved the deterministic UI surface for three ecology action families. Before creating another overlapping harness, I ran the existing unforced ecology dialogue/follow-through audit:

`node scripts\run-ecology-dialogue-causality-audit.js --frames 12000 --unforced`

That audit already seeds a synthetic ecology pressure environment, then lets the game update loop produce dialogue and follow-through without the forced sampling lane used by the fixture mode. It was sufficient for the ENV75 question, so adding a second script would have created more harness surface without improving truth.

## Evidence

Report:

`qa_screenshots/ecology_dialogue_causality_audit/2026-05-06T02-03-40-932Z/report.json`

Result:

- Overall: `pass`
- Mode: `unforced-soak`
- Unforced verdict: `healthy`
- Follow-through verdict:
  - cleanup: `observed`
  - pollen: `observed`
  - reserveFood: `observed`
  - shadeRest: `observed`

Key measured values:

- Dialogue count: 124
- Ecology dialogue count: 54
- Ecology dialogue ratio: 0.4355
- Cleanup dialogue count: 3
- Planting dialogue count: 5
- Shelter/shade dialogue count: 31
- Reserve-food dialogue count: 7
- Scout dialogue count: 13
- Cleaned seed dirt piles: 4 / 4
- Cleanup object cleaned events: 17
- Cleanup compost created events: 17
- Pollen follow-through events: 22
- Reserve-food uses: 6 / 6
- Reserve husk cleaned: true
- Shade-rest targeting count: 10
- Shade-rest arrivals: 38
- Shade-rest settling sleep: 34

Representative dialogue samples:

- `There are dirt piles building up. If we clean this together, the ground will be easier to use.`
- `I placed the pollen before it faded. This ground can become food again.`
- `We have stored food nearby. Someone tired should take it before it sits unused.`
- `I am too warm and tired out here. Can we rest under the blocks?`
- `The shade would help me settle. Stay with me there a moment.`

## Honest read

This is stronger than the deterministic ENV74 proof but still not a claim of sentience. The audit shows that the current systems can produce ecology-relevant conversation and object use in a lived run:

```
environment pressure
      |
      +-- dirt piles cleaned and compost created
      +-- pollen work continues after planting
      +-- reserve food is used and depleted husks are cleaned
      +-- shade/rest requests lead to arrivals and settling sleep
```

The remaining gap is player legibility in live viewing. ENV74 proves the feed/inspect language when the event is inspected immediately; ENV75 proves the underlying lived behavior occurs. The next best product-facing proof is a human-readable capture packet that combines both: run a short lived ecology scenario, capture feed rows and inspect panels near each observed event, and ask whether the behavior feels intentional without needing us to read the JSON.

## Next best slice

ENV76 should create a capture/review packet for a short human-facing ecology playtest:

```
run lived ecology pressure
      |
      +-- capture cleanup moment + inspect panel
      +-- capture pollen moment + inspect panel
      +-- capture reserve-food moment + inspect panel
      +-- capture shade/rest moment + inspect panel
      |
      +-- produce human-review.md with screenshots and questions:
            "does this read as intentional work?"
            "does the dialogue sound like social language?"
            "does the object use visibly matter?"
```

If that packet reads well, the next larger AI slice should move from proof to richness: more varied dialogue phrasing and more visible environmental affordances, especially shade and compost, so the player can see what the society is reacting to without opening audit reports.
