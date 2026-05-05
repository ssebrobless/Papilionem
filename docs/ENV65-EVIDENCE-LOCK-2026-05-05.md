# ENV65 Evidence Lock - Dialogue Continuity and Voice Differentiation

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Shape

```text
╔════════════════════════════════════════════════════════════════════╗
║ ENV65: conversation should feel socially remembered, not random   ║
╠══════════════════════╦══════════════════════╦══════════════════════╣
║ Existing truth       ║ ENV65 expression     ║ Proof                ║
╠══════════════════════╬══════════════════════╬══════════════════════╣
║ dialogue residue     ║ later phrase prefix  ║ continuity audit     ║
║ retained lesson      ║ metadata + cause     ║ feed/dialogue sample  ║
║ voice band/tone      ║ no schema change     ║ voice split audit     ║
╚══════════════════════╩══════════════════════╩══════════════════════╝
```

## Implementation

Changed files:

- `core/config.js`
  - Added `gameConfig.expression.conversationContinuityDialogue`.
  - Default enabled.
  - Gated by `minAgeSeconds`, `maxAgeSeconds`, and `maxPrefixCharacters`.

- `systems/communicationSystem.js`
  - Added a continuity phrase path that consumes existing `recentResidues`, retained dialogue lessons, and recent partner dialogue.
  - The continuity phrase only applies when:
    - named durable memory dialogue did not already win,
    - the utterance is not an immediate queued response,
    - the same partner has recent dialogue/residue/lesson state inside the configured age window.
  - The line carries metadata:
    - `conversationContinuity: true`
    - `continuityType`
    - `referencedResidueType`
    - `referencedDialogueId`
    - `referencedLessonId`
    - `referencedPartnerId`
    - `referencedPartnerLabel`
    - `continuityAgeSeconds`
    - `causeLabel: "earlier talk"`
  - No save schema fields, cognition vocabulary, social-edge vocabulary, ML artifacts, projection math, or behavior ownership changed.

- `scripts/run-dialogue-continuity-voice-audit.js`
  - New targeted Playwright audit.
  - Proves a later same-pair dialogue references an earlier social residue.
  - Proves four voice signatures remain distinct:
    - plain/skittish
    - warm/friendly
    - formal/scholar
    - urgent/cautious

## Targeted Evidence

New audit:

- `qa_screenshots/dialogue_continuity_voice_audit/2026-05-05T16-43-44-886Z/report.json`
- Screenshot:
  - `qa_screenshots/dialogue_continuity_voice_audit/2026-05-05T16-43-44-886Z/dialogue-continuity-voice.png`

Result: `pass`

Checks:

- `browser-clean`: pass
- `conversation-continuity-visible`: pass
- `voice-differentiation-visible`: pass

Continuity sample:

> I kept thinking about how it felt to stay near you, WarmWelcome. WarmWelcome, you did that better than most would; you carried that moment with more grace than you know; I do not want to let good work pass unnoticed when it genuinely moved me.

Continuity metadata:

- `conversationContinuity`: true
- `continuityType`: `warm-company`
- `referencedResidueType`: `warm-company`
- `continuityAgeSeconds`: 62
- `causeLabel`: `earlier talk`

Voice samples:

- Plain/skittish: `below_average | casual | hesitant`
  - "Look at this for a second. Everything slowed down a little."
- Warm/friendly: `above_average | casual | warm`
  - "This side feels calmer with you here; I noticed this place before we crossed the open grass; it feels better when we catch the same thing."
- Formal/scholar: `exceptional | formal | formal`
  - "Look closely here; the open grass changes before the rest of the quiet ground; that is how you stay ahead of the turn instead of reacting late."
- Urgent/cautious: `average | neutral | aggressive`
  - "Careful near the sunlit wall. I do not trust that side yet!"

## Regression Evidence

Syntax:

- `node --check systems/communicationSystem.js`: pass
- `node --check core/config.js`: pass
- `node --check scripts/run-dialogue-continuity-voice-audit.js`: pass

Dialogue readability:

- `node scripts/run-dialogue-readability-audit.js --frames 7200`: pass
- Report:
  - `qa_screenshots/dialogue_readability_audit/2026-05-05T16-44-56-851Z/report.json`

Ecology dialogue causality:

- `node scripts/run-ecology-dialogue-causality-audit.js --frames 7200 --unforced`: pass
- Report:
  - `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T16-49-14-527Z/report.json`
- Note:
  - Overall pass.
  - Follow-through observed for cleanup, pollen, reserve food, and shade rest.
  - `unforcedSoakVerdict` was `residual` because that random unforced run did not surface cleanup/planting dialogue even though the actions occurred. This is a next-tuning signal, not a regression caused by ENV65.

Communication audit:

- `node scripts/run-r6-communication-audit.js`: pass
- Report:
  - `qa_screenshots/r6_communication_audit/2026-05-05T16-54-52-782Z/report.json`

Scenario suite:

- `node scripts/run-scenario.js --all`: pass
- Result: 43/43 pass
- Final report:
  - `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T17-04-11-600Z/report.json`

G0H:

- `node scripts/run-g0h-scripted-playthrough.js`: pass
- Result: 13/13 lanes pass
- Report:
  - `qa_logs/g0h_scripted_playthrough/2026-05-05T17-05-46-284Z/report.json`
- Capture:
  - `qa_logs/g0h_scripted_playthrough/2026-05-05T17-05-46-284Z/capture/capture.json`
  - `qa_logs/g0h_scripted_playthrough/2026-05-05T17-05-46-284Z/capture/summary.txt`

Runtime:

- `node scripts/run-runtime-self-audit.js`: pass
- Report:
  - `qa_screenshots/runtime_self_audit/report.json`

## Sandbox Note

Playwright-based audits initially failed with `spawn EPERM` inside the filesystem sandbox. Each failed command was rerun with escalated execution, and the reruns produced the evidence above. The EPERM failures happened before browser/game startup and are not game regressions.

## Honest State After ENV65

This phase moves dialogue believability forward in a specific way: butterflies can now visibly carry a recent social exchange into later speech, and the audit proves that different communication/personality profiles do not collapse into one voice.

This still does not mean literal consciousness or sentience. The game now has stronger simulated social continuity: existing social residue affects what a butterfly says later, and existing voice traits affect the shape of the line.

## Next Best Slices

1. Ecology dialogue opportunity tuning
   - The unforced ecology audit passed overall but had a residual verdict because cleanup and planting dialogue did not appear in that random run.
   - Best next fix: make cleanup/planting talk opportunity-sensitive without forcing it, so ecological work is more legible during normal play.

2. Conversation continuity in feed grouping
   - The dialogue line itself carries continuity metadata and appears in the grouped feed detail.
   - The grouped feed entry did not surface the `earlier talk` cause label in the report sample.
   - Best next fix: preserve continuity/cause metadata through grouped talk-thread presentation.

3. Longer memory-to-action arcs
   - ENV65 proves memory-to-speech continuity.
   - The next believability step is proving memory-to-choice continuity over a longer window: a butterfly says something, later chooses a partner/task because of it, and the feed/inspect view makes that causal thread legible.
