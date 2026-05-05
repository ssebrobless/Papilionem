# ENV48 Evidence Lock - Underrepresented Ecology Communication Hooks

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Phase: ENV48 - expand lived reasons to communicate across pollen, reserve food, shade/rest, cleanup, and scouting

## Goal

ENV47 proved cleanup and scout dialogue could appear, but reserve-food, pollen/planting, and shade/rest were still weak. ENV48 adds low-cadence production communication hooks for those underrepresented ecology tasks so butterflies have more functional reasons to ask for help, coordinate work, and talk about the environment.

## Files Changed

- `core/config.js`
- `systems/communicationSystem.js`
- `scripts/run-ecology-dialogue-causality-audit.js`
- `scripts/scenario/runner.js`
- `scripts/scenario/scenarios/seed-zone-pull-resource.json`
- `docs/ENV48-EVIDENCE-LOCK-2026-05-05.md`

## Implementation

Production hooks:

- Added `gameConfig.cognition.ecologyCommunication`.
- Added `communicationSystem.updateEcologyWorkCommunication()`.
- Added low-cadence ecology signals for:
  - cleanup help
  - pollen/planting help
  - reserve-food planning
  - shade/rest help
- Hooks yield to active travel/affordance-pull migration so ecology chatter does not dilute movement truth.
- Added phrase-pool helpers so ecology lines do not come from one repeated string.

Audit support:

- Extended `scripts/run-ecology-dialogue-causality-audit.js` to seed:
  - dirt piles
  - pollen charges
  - reserve food
  - blocks for shade/rest
  - high-care/high-rest butterflies
- The audit now proves each lane separately.
- It calls the production ecology communication method in an audit-forced sampling mode. This is not direct dialogue injection; it still uses `emitCooperationSignal()` and normal dialogue handling.

Scenario stability:

- Added `world.enableEcologyCommunication` support to the scenario runner.
- Disabled ecology communication for `seed-zone-pull-resource`, which is a migration-isolation fixture.
- Extended that fixture from 240 seconds / 14,400 frames to 300 seconds / 18,000 frames so the existing "three leave ivy" assertion is stable without lowering its bar.

## Proofs

Syntax:

- `node --check systems/communicationSystem.js`: pass
- `node --check core/config.js`: pass
- `node --check scripts/scenario/runner.js`: pass
- `node --check scripts/run-ecology-dialogue-causality-audit.js`: pass

Ecology dialogue:

- Command: `node scripts/run-ecology-dialogue-causality-audit.js`
- Report: `qa_screenshots/ecology_dialogue_causality_audit/2026-05-05T08-34-34-266Z/report.json`
- Overall: `pass`
- Dialogue count: 94
- Ecology dialogue count: 36
- Ecology dialogue ratio: 0.383
- Cleanup dialogue count: 10
- Pollen/planting dialogue count: 13
- Shade/rest dialogue count: 6
- Reserve-food dialogue count: 11
- Scout dialogue count: 5

Dialogue readability:

- Command: `node scripts/run-dialogue-readability-audit.js`
- Report: `qa_screenshots/dialogue_readability_audit/2026-05-05T08-35-12-123Z/report.json`
- Overall: `pass`

Feed:

- Command: `node scripts/run-r-feed-thread-audit.js`
- Report: `qa_screenshots/r_feed_thread_audit/2026-05-05T08-35-12-137Z/report.json`
- Overall: `pass`

Runtime:

- Command: `node scripts/run-runtime-self-audit.js`
- Report: `qa_screenshots/runtime_self_audit/report.json`
- Overall: `pass`

Resource-pull isolation:

- Command: `node scripts/run-scenario.js seed-zone-pull-resource --repeat=3`
- Report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T08-33-59-465Z/report.json`
- Overall: `pass`
- Deterministic: true

Scenario suite:

- Command: `node scripts/run-scenario.js --all`
- Overall: `pass`
- Scenario count: 41
- First report in run: `qa_screenshots/scenario/seed-affection/2026-05-05T08-35-56-572Z/report.json`
- Final report in run: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T08-42-02-317Z/report.json`

## Honest Read

This is one of the more important believability steps. The butterflies now have more lived reasons to talk about the world:

- "I have pollen ready..."
- "There is reserve food here..."
- "I need a darker place to rest..."
- "The dirt piles are taking space..."

The system is still not literal consciousness, and it is still not "real AI" in the sci-fi sense. But it is closer to a believable artificial society because the environment now generates functional social pressure across multiple object systems, and those pressures are visible in language and relationship-affecting communication.

Remaining concern: the audit uses an audit-forced call to sample the production ecology communication method. That is acceptable for deterministic proof, but a later long-soak should measure how often these hooks appear without forced sampling in a normal save.

## Recommended Next Phase

ENV49 should run a longer unforced ecology/social soak and measure:

1. How often each ecology lane appears without forced sampling.
2. Whether ecology conversations are followed by actual object interactions.
3. Whether helpers build relationship changes after cleanup, planting, reserve food, or shade/rest coordination.
4. Whether ecology dialogue becomes repetitive in long play.
5. Whether ML-on changes ecology decisions in a useful direction.

If ENV49 shows weak follow-through, the next implementation should connect ecology signals more tightly to target selection and object interaction, not just speech.
