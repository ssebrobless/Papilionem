# Claude Expansion Plan Review Prompt

Copy-paste the prompt below into Claude when you want a serious proofreading and
refinement pass on the expansion plan.

## Prompt

```text
You are reviewing a future-facing implementation plan for the game Papilionem.

Your job is to critique and refine the plan, not to be agreeable by default.
Be specific, concrete, and technically disciplined.

Important review stance:
- prioritize structural weaknesses, risky sequencing, missing prerequisites, ownership conflicts, audit gaps, save/load risks, and places where the plan is too vague to implement safely
- do not suggest reopening already-frozen repair/polish work unless the new plan would implicitly break it
- do not broaden scope into unrelated wishlist ideas
- preserve the project's hard rules unless you have a very strong reason to argue otherwise

Project context:
- Papilionem has a frozen repaired baseline, frozen player-facing polish baseline, and frozen implementation baseline (`I1` through `I5`)
- the remaining future-facing work is intentionally grouped into:
  1A Ecology Depth
  2B Later 3-D
  3C Machine Learning
- the current game is already live in a pseudo-3D grounded garden model; broader later 3-D is not live yet
- the current ML layer is still a heuristic / JSON-policy bridge with inspect/debug proof; true later model-backed runtime is not live yet
- the current ecology/release loop is live, but richer ecology specialization and long-horizon emergence are intentionally later

Hard constraints you should preserve while reviewing:
- one owner per truth
- ecology must not reintroduce the old rarity unlock ladder or pool-era progression logic
- later 3-D must not create a second world border or turn the game into a generic physics sandbox
- ML may score actions/preferences, but may not own memories, emotions, genetics, lineage, or lifecycle truth
- save/load should persist durable truth and rebuild cheap derived or transient caches
- player-facing shell and debug shell must stay honest about what is really happening

Please review these docs together:

1. Active expansion sequencing board
[ACTIVE-EXPANSION-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-EXPANSION-BOARD.md)

2. Remaining implementation roadmap
[REMAINING-IMPLEMENTATION-ROADMAP.md](C:/Users/fishe/Documents/projects/ephemera/docs/REMAINING-IMPLEMENTATION-ROADMAP.md)

3. Expansion execution playbook
[EXPANSION-EXECUTION-PLAYBOOK.md](C:/Users/fishe/Documents/projects/ephemera/docs/EXPANSION-EXECUTION-PLAYBOOK.md)

4. Frozen current implementation boundary
[ACTIVE-IMPLEMENTATION-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-IMPLEMENTATION-BOARD.md)

5. Coverage/deferred boundary map
[SOURCE-CHAPTER-COVERAGE-MATRIX.md](C:/Users/fishe/Documents/projects/ephemera/docs/SOURCE-CHAPTER-COVERAGE-MATRIX.md)

6. Intent/deferred ledger
[INTENT-AND-EXCLUSIONS-LEDGER.md](C:/Users/fishe/Documents/projects/ephemera/docs/INTENT-AND-EXCLUSIONS-LEDGER.md)

7. Ecology contract
[WILD-ECOLOGY-RELEASE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/WILD-ECOLOGY-RELEASE-CONTRACT.md)

8. Current spatial truth
[CURRENT-SPATIAL-TRUTH.md](C:/Users/fishe/Documents/projects/ephemera/docs/CURRENT-SPATIAL-TRUTH.md)

9. Later 3-D contract/plan
[LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md](C:/Users/fishe/Documents/projects/ephemera/docs/LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md)

10. Cognition / ML contract
[COGNITION-ML-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ML-CONTRACT.md)

11. ML implementation contract
[ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)

What I want from you:

Part 1: Findings
- list the most important weaknesses or refinement opportunities in the current plan
- order them by severity / impact
- be explicit about which phase(s) are affected

Part 2: Sequencing critique
- tell me whether the current proposed order is actually the best order
- if not, propose a revised order and explain exactly why

Part 3: Missing prerequisites
- identify any prerequisites, missing tooling, missing audit work, or missing state-definition work that should be promoted earlier

Part 4: Boundary check
- identify any places where the plan risks violating one-owner-per-truth, save/load boundaries, UI-truth boundaries, or current deferred/live boundaries

Part 5: Refinement pass
- propose concrete revisions to the phase plan
- keep the same top-level sections `1A`, `2B`, and `3C`
- you may split, merge, rename, or reorder subphases if you justify it

Part 6: Updated plan
- provide a revised version of the phase ladder in a compact, implementation-ready form

Format requirements:
- lead with findings, not praise
- be direct
- prefer concrete implementation reasoning over generic game-design commentary
- use plain text or markdown
- if you think the current plan is mostly right, still tell me where it is underspecified or risky

Do not:
- rewrite the project into a different game
- suggest online-only ML, live online training, or multiplayer determinism work as near-term priorities
- assume full free-flight 3-D is desired
- treat historical/frozen boards as active gap lists
```

## Suggested Use

Paste the prompt as-is, then if Claude gives a useful critique:

1. compare its proposed changes against the hard constraints above
2. keep only changes that preserve owner boundaries and the frozen baseline
3. update the board and playbook only after the refined order still feels coherent
