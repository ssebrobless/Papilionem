# ENV15 Evidence Lock - Shared Project Role Legibility

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Scope

ENV15 was a player-visible believability slice. It did not change life-sim ownership, cognition vocabulary, save schema, spatial projection, block placement rules, ML artifacts, or flower ecology behavior.

Goal:

```text
Shared project truth
  ├─ already existed in runtime systems
  ├─ was partly hidden from the player
  └─ now surfaces as:
       ├─ action-feed grounding for non-talk entries
       ├─ completed-project contributor role labels
       └─ inspect-panel "Work + Bonds" lines
```

## Code Changes

### `ui/gameUI.js`

- `buildFeedContextFooter(entry)` now returns normalized grounding text for non-talk entries, so action feed rows can explain what happened instead of dropping their context.
- Added project role formatting helpers:
  - `formatProjectRoleLabel`
  - `formatProjectRoleReason`
  - `formatProjectRoleGrounding`
- Completed shared-project feed rows now include contributor names plus roles, for example:
  - `Open Land SW - 2 memories - 2 bond updates - roles: WarmWelcome carrier`
- Added `buildWorkAndBondInspectLines(target, gameState, communicationSummary)`.
- Inspect detail state now includes a `Work + Bonds` section when the inspected butterfly has active object work, active shared project participation, or relationship history relevant to the moment.

### `scripts/run-environment-shared-projects-audit.js`

- Expanded the fixture from three to four butterflies so the audit can prove builder, carrier, and coordinator role scoring with real butterflies.
- Added an organic real-block role diversity assertion using actual spawned blocks, not mocks:
  - `organic-real-block-role-diversity-covers-three-roles`
- Added an inspect legibility assertion:
  - `inspect-surfaces-active-shared-work-role`
- Tightened the completed-project feed assertion so it requires:
  - shared shade shelter wording
  - memories and bond updates
  - contributor role grounding
  - a visible footer from `buildFeedContextFooter`

## Focused Evidence

Focused audit:

- Command: `node scripts/run-environment-shared-projects-audit.js`
- Result: `pass`
- Report: `qa_screenshots/environment_shared_projects_audit/2026-05-05T01-10-54-153Z/report.json`
- Assertions: `21/21`
- Page errors: `0`
- Console errors: `0`

Key focused proofs:

- `organic-real-block-role-diversity-covers-three-roles`: pass
  - selected roles: `carrier`, `coordinator`, `builder`
  - role profiles were produced from real butterflies and real spawned blocks.
- `inspect-surfaces-active-shared-work-role`: pass
  - inspect showed lines such as:
    - `Shared work carrier for WarmWelcome | bringing usable material`
    - `Active project shadeShelter | invited-helper | contributions 0`
    - `Bond WarmWelcome(F) | steady | follow-through 72 | reasons dialogue-guidance-heard`
- `shared-project-completion-has-feed-line`: pass
  - feed row retained action grounding and contributor role text.

## Regression Evidence

Environment building cooperation:

- Command: `node scripts/run-environment-building-cooperation-audit.js`
- Result: `pass`
- Report: `qa_screenshots/environment_building_cooperation_audit/2026-05-05T01-11-07-895Z/report.json`
- Assertions: `7/7`
- Page errors: `0`
- Console errors: `0`

Runtime self audit:

- Command: `node scripts/run-runtime-self-audit.js`
- Result: `pass`
- Report: `qa_screenshots/runtime_self_audit/report.json`

Long-soak society fixture:

- Command: `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison`
- Result: `pass-with-society-warnings`
- Report: `qa_logs/long_soak_society/2026-05-05T01-11-49-484Z/report.json`
- Fixture assertions: pass
  - witnessed affection event subscription observed `7` events.
  - hand-computed fixture bond churn matched expected value `2`.
  - mean distinct zones visited was present at `2.642857142857143`.
- Warning retained:
  - `bond-stability` observed `0.31799034852291197`, slightly above the `<= 0.30` target.
  - This is not caused by ENV15, but remains useful believability signal for the next planning pass.

G0H scripted playthrough:

- First command: `node scripts/run-g0h-scripted-playthrough.js`
- First result: `fail`, `12/13`
- First report: `qa_logs/g0h_scripted_playthrough/2026-05-05T01-13-16-749Z/report.json`
- Failed lane: `flower-lifecycle`
  - piles before: `10`
  - piles after: `6`
  - cleaned net: `4`
  - gate requires at least `5` net cleaned.
- Rerun command: `node scripts/run-g0h-scripted-playthrough.js`
- Rerun result: `pass`, `13/13`
- Rerun report: `qa_logs/g0h_scripted_playthrough/2026-05-05T01-20-51-491Z/report.json`
- Rerun output folder: `qa_logs/g0h_scripted_playthrough/2026-05-05T01-20-51-491Z`

Scenario suite:

- First command: `node scripts/run-scenario.js --all`
- First result: `fail`, `37/38`
- Failed scenario: `seed-zone-pull-resource`
- First failed report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T01-34-59-940Z/report.json`
- Immediate isolated rerun:
  - Command: `node scripts/run-scenario.js seed-zone-pull-resource`
  - Result: `pass`
  - Report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T01-36-14-387Z/report.json`
- Full rerun:
  - Command: `node scripts/run-scenario.js --all`
  - Result: `pass`, `38/38`
  - Final report set begins at `qa_screenshots/scenario/seed-affection/2026-05-05T01-36-27-939Z/report.json`
  - Final `seed-zone-pull-resource` report: `qa_screenshots/scenario/seed-zone-pull-resource/2026-05-05T01-42-30-074Z/report.json`

## Honest Read

ENV15 is green for its owned goal: social/environment work that was already happening now has clearer player-facing evidence in the feed and inspect UI.

Two residual signals should carry forward:

1. Flower cleanup remains a margin-sensitive lived behavior. A full G0H run failed once by cleaning 4 piles instead of the required 5, then passed on rerun. This is not an ENV15 regression, but it says the cleanup ecology still has occasional weak windows.
2. `seed-zone-pull-resource` failed once in the full scenario suite and passed in both isolated and full reruns. This should be watched as possible suite-order/timing sensitivity.

## Next Planning Hooks

Recommended next believability planning topics:

- Make action-feed language more natural and less system-like without hiding the underlying motive/relationship truth.
- Add stronger lived-player screenshots or capture review for the new inspect `Work + Bonds` section.
- Revisit ecology cleanup margins so G0H flower lifecycle is less close to the failure boundary.
- Investigate scenario suite-order sensitivity around `seed-zone-pull-resource` if it recurs.
- Continue moving from hidden state to visible reasons: who helped, why they helped, what changed in memory/bond state, and what they intend to do next.

