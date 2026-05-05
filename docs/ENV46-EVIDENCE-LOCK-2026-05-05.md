# ENV46 Evidence Lock - Dialogue Voice Polish

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Phase: ENV46 - narrow production dialogue polish after ENV45 measurement

## Goal

ENV45 proved that organic dialogue is now mostly social language, but it also exposed expression roughness: modern slang such as "sus", bare clause joins like "you you", repeated utility scout lines, and a few old abstract zone words. ENV46 fixes those specific seams without changing durable cognition truth, social triggers, save schema, ML policy, or spatial behavior.

## Files Changed

- `core/config.js`
- `systems/communicationSystem.js`

## Implementation

Changes:

- Added `gameConfig.expression.languagePolish.modernSlangEnabled = false`.
- Disabled probabilistic modern slang insertion unless that flag is explicitly enabled.
- Added sentence-aware joining for average and below-average dialogue fragments.
- Added sentence-aware joining between named-memory prefixes and base phrases.
- Replaced the repeated scout line `"Zone looks better; follow me there."` with a small relationship-aware phrase pool.
- Replaced fixed distress phrases with a small grounded phrase pool.
- Removed the guarded check-in opener that produced `"you; you"` style phrasing.
- Replaced several old abstract lexicon terms:
  - `covered edge` -> `moss line`
  - `echoing ground` -> `pool ground`
  - `air` -> `green light`
  - `stone edge` in calm open land -> `garden edge`

## Proofs

Syntax:

- `node --check systems/communicationSystem.js`: pass
- `node --check core/config.js`: pass
- `node --check scripts/run-dialogue-readability-audit.js`: pass

Dialogue readability:

- Command: `node scripts/run-dialogue-readability-audit.js`
- Report: `qa_screenshots/dialogue_readability_audit/2026-05-05T07-40-31-930Z/report.json`
- Overall: `pass`
- Dialogue count: 47
- Unique phrase ratio: 0.8511
- Social language ratio: 1.0
- Task language ratio: 0.2979
- Atmospheric ratio: 0
- System-like ratio: 0
- Search check found no `sus`, no `you you`, no `air shifted`, no `covered edge`, and no `"Will you come."` in the final report.

Feed:

- Command: `node scripts/run-r-feed-thread-audit.js`
- Report: `qa_screenshots/r_feed_thread_audit/2026-05-05T07-41-11-723Z/report.json`
- Overall: `pass`

Runtime:

- Command: `node scripts/run-runtime-self-audit.js`
- Report: `qa_screenshots/runtime_self_audit/report.json`
- Overall: `pass`

Scenario suite:

- Command: `node scripts/run-scenario.js --all`
- Overall: `pass`
- Scenario count: 41
- First report in run: `qa_screenshots/scenario/seed-affection/2026-05-05T07-46-29-561Z/report.json`
- Final report in run: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T07-52-27-002Z/report.json`

## Honest Read

ENV46 makes organic speech cleaner and more fitting for the game world. The sampled output no longer contains the most obvious immersion breakers from ENV45, and the task-language ratio rose from 15.56% in ENV45 to 29.79% in the final ENV46 run.

This still does not mean the society is "complete." Dialogue is now more legible, but the next believability work should focus on making ecological tasks and social decisions appear in conversation because they actually matter to survival, rest, gardening, cleaning, shelter, and cooperation. The expression layer is improved; the next question is whether the environment keeps generating enough meaningful reasons to talk.

## Recommended Next Phase

ENV47 should audit ecology-to-dialogue causality:

1. Run a fixture where dirt piles, pollen planting, food reserves, shade/rest, and scout invitations all exist.
2. Confirm butterflies talk about those objects because production motives are active, not because the audit injects direct dialogue.
3. Measure how often ecological decisions become social speech and relationship change.
4. If the ratio is low, add narrow production hooks that let existing motives request help, offer pollen, ask for cleanup, invite rest in shade, or coordinate planting.

The target is not more phrase templates by themselves. The target is more lived reasons for the butterflies to communicate.
