# ENV76 Evidence Lock - Ecology Human Review Packet

Date: 2026-05-06
Branch: `codex/milestone-freeze-playtest`

## Shape

```
+--------------------+      +----------------------+      +-------------------+
| ENV74 UI proof     | ---> | ENV76 review packet  | <--- | ENV75 lived proof |
| feed + inspect     |      | screenshots + text   |      | unforced metrics  |
+--------------------+      +----------------------+      +-------------------+
```

## What changed

Added `scripts/write-ecology-human-review-packet.js`.

The script reads the latest ecology UI causality report and the latest unforced ecology dialogue/follow-through report, copies their screenshots into one packet folder, and writes a `human-review.md` with:

- source report paths
- copied screenshot paths
- lane-by-lane UI cause lines
- lived ecology metrics
- dialogue samples
- human review questions
- the explicit boundary that this is believable behavior evidence, not literal sentience evidence

## Evidence

Command:

`node scripts\write-ecology-human-review-packet.js`

Result: `pass`

Packet:

`qa_logs/ecology_human_review/2026-05-06T02-07-36-402Z/human-review.md`

Packet report:

`qa_logs/ecology_human_review/2026-05-06T02-07-36-402Z/report.json`

Copied screenshots:

- `qa_logs/ecology_human_review/2026-05-06T02-07-36-402Z/ecology-ui-causality.png`
- `qa_logs/ecology_human_review/2026-05-06T02-07-36-402Z/ecology-dialogue-causality.png`

Source reports:

- UI causality: `qa_screenshots/ecology_ui_causality_audit/2026-05-06T01-56-54-562Z/report.json`
- Unforced lived ecology: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-06T02-03-40-932Z/report.json`

Syntax proof:

- `node --check scripts\write-ecology-human-review-packet.js`

## Honest read

ENV76 does not add new behavior. It turns the prior proof into a reviewable artifact. This is important because the next question is no longer just "does the event fire?" It is "does a player understand why the butterfly did that?"

The packet is meant to be read by a human before we add more AI layers. If the existing ecology work does not read clearly, the right next step is visual affordance / wording / timing polish, not more hidden cognition.

## Next best slice

The next implementation slice should be decided from the packet review:

```
if behavior is clear:
      add richer lived ecology variety
else if behavior is real but hard to see:
      improve visual affordances and UI timing
else if behavior feels scripted:
      widen organic scenario pressure and reduce deterministic prompts
```

My current recommendation is to review the packet first, then implement the smallest visible-affordance improvement that makes either shade or cleanup legible without opening inspect.
