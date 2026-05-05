# ENV45 Evidence Lock - Organic Dialogue Readability Audit

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`
Phase: ENV45 - measure organic dialogue readability before rewriting conversation generation

## Goal

The user asked for an honest audit of whether butterfly communication now reads like social language instead of the older abstract feed style such as "the air shifted." ENV45 adds a deterministic browser audit that watches organic dialogue during a live garden run, classifies the sampled phrases, and records the remaining style gaps without changing game behavior.

## New Audit

File:

- `scripts/run-dialogue-readability-audit.js`

Report:

- `qa_screenshots/dialogue_readability_audit/2026-05-05T07-33-37-854Z/report.json`

The audit starts the game in the browser harness, resets to a synthetic garden state, waits for butterflies to spawn, advances 7,200 frames, then reads recent dialogue history from production game state. It records:

- total dialogue count
- unique phrase ratio
- pair coverage
- intent distribution
- social-language ratio
- task/environment-language ratio
- atmospheric or system-like language ratio
- repeated phrases
- recent phrase samples

## Result

Overall: `pass`

Assertions:

- `browser-clean`: pass
- `dialogue-captured`: pass
- `readability-classified`: pass
- `readabilityVerdict`: pass

Key metrics:

- `currentFrame`: 7229
- `butterflyCount`: 12
- `dialogueCount`: 45
- `uniquePhraseCount`: 34
- `uniquePhraseRatio`: 0.7556
- `pairCount`: 39
- `intentCounts`: `{ "social": 40, "teaching": 1, "care": 4 }`
- `socialLanguageCount`: 45
- `socialLanguageRatio`: 1.0
- `taskLanguageCount`: 7
- `taskLanguageRatio`: 0.1556
- `atmosphericCount`: 0
- `atmosphericRatio`: 0
- `systemLikeCount`: 0
- `systemLikeRatio`: 0

## Honest Read

The old abstract ambient style was not present in this run. The audit found no phrases matching the current atmospheric pattern and no system/debug language. This is meaningful evidence that the feed is closer to social speech than it was during the user's earlier capture.

The pass is not a final believability claim. The sampled dialogue still has polish problems:

- one organic phrase included the slang token `sus`, which does not fit the butterfly society voice
- at least one memory-reference phrase had rough grammar: "you you"
- the phrase "Open Land SE looks better; follow me there." repeated three times and reads more like a utility command than relationship-aware conversation
- task/environment language is still low at 15.56%, so the new ecology features are not yet strongly visible in conversation
- some phrases such as "stone edge" and "drill line" are concrete enough to pass the audit but still feel a little over-poetic

## Next Recommended Phase

ENV46 should be a narrow dialogue polish pass, not a broad cognition rewrite:

1. Remove or heavily gate modern slang injection from organic butterfly dialogue.
2. Fix memory-reference grammar so generated clauses are punctuated and do not duplicate pronouns.
3. Make zone-follow and task phrases less repetitive and more relationship-aware.
4. Add a few ecology-grounded phrases tied to pollen, flower planting, dirt cleanup, shade/rest, and food-reserve decisions.
5. Re-run `node scripts/run-dialogue-readability-audit.js`, `node scripts/run-r-feed-thread-audit.js`, and `node scripts/run-runtime-self-audit.js`.

## Boundary

This phase did not change production behavior. It only added measurement. The result supports the current direction: the system is producing real social/care/teaching events, but the expression layer still needs careful language polish before it will consistently feel like a believable society.
