# Papilionem Source-Chapter Coverage Matrix

## Purpose

This matrix scans the current source-book chapter by chapter and classifies each
source document against the proved runtime.

Use this document to answer:

```text
what is already live
what is only partially realized
what is intentionally deferred
what is only historical/reference material
what was closed in the implementation pass versus what remains intentionally later
```

Use [ACTIVE-IMPLEMENTATION-BOARD.md](./ACTIVE-IMPLEMENTATION-BOARD.md) for the
frozen `I1`-`I5` execution path derived from this matrix.
Use [IMPLEMENTATION-PARITY-AUDIT.md](./IMPLEMENTATION-PARITY-AUDIT.md) and
[PLAYER-FACING-POLISH-AUDIT.md](./PLAYER-FACING-POLISH-AUDIT.md) for the
current frozen runtime baseline.

## Coverage Lens

```text
source-book chapter
      |
      v
source document
      |
      v
runtime proof / boundary doc
      |
      v
live / partial / deferred / historical / drift-watch
      |
      v
hold / deferred / historical against the frozen I1-I5 baseline
```

## Classification Key

```text
runtime state
|- live            = current docs and proved runtime mostly match
|- live core       = shipped current truth is live, but edge rules or later boundaries remain
|- partial         = implemented area still marked under-expressed or under-proved
|- deferred        = intentionally later by contract, not a current implementation miss
|- historical      = checkpoint/reference only, not a live status owner
`- reference       = appendix/supporting material that should sync to source docs, not drive implementation alone
```

```text
gap type
|- none            = no current implementation work needed
|- under-expressed = owner truth exists, but behavior/UI/proof is still shallow
|- proof-light     = likely live, but audit/trace proof is narrower than the contract
|- meta-doc drift  = runtime is ahead of doc framing/classification
|- deferred        = not current-board work
`- historical-only = keep for reference, not live sequencing
```

```text
next action
|- hold            = keep current baseline only
|- later           = explicitly deferred by contract
|- historical      = reference only
`- sync-on-change  = update when the corresponding source docs change
```

`I1` through `I5` now appear only as historical closure labels in proof text.

## Current Scan Shape

```text
coverage result
|- hold / live now
|  |- orientation docs
|  |- player-facing shell docs
|  |- ecology / release docs
|  |- autobattle docs
|  |- life-sim expression audit
|  |- frozen parity / polish baselines
|  |- frozen implementation baseline
|  |- frozen expansion baseline
|  `- current spatial truth
`- intentionally later
   |- volumetric / sandbox-style 3D beyond the grounded spatial baseline
   |- optional later ML runtime replacement
   `- online battle / later expansion work
```

## Chapter 1 - Orientation

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `README.md` | `live` | `none` | source-book workflow and current doc map are still valid | `hold` |
| `PAPILIONEM-GUIDEBOOK.md` | `live` | `none` | repaired runtime and source-book rebuilds now match the guidebook baseline | `hold` |
| `PAPILIONEM-PLAYER-GUIDE.md` | `live` | `none` | player-facing shell, controls, ecology, and battle docs were de-staled in A10/P1-P5 | `hold` |

## Chapter 2 - Core Contracts

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `GENETICS-STAT-CONTRACT.md` | `live` | `none` | mutation, lineage depth, rarity split, latent/dormant lock notes, and multi-generation heritage proof now hold through genetics/stat audits and the foundation contract audit | `hold` |
| `COGNITION-ML-CONTRACT.md` | `live core` | `deferred` | the local model-backed layer is now live with explainability, fallback, performance, and soak proof; optional later runtime-replacement choices remain intentionally separate | `deferred` |
| `COMMUNICATION-LANGUAGE-CONTRACT.md` | `live` | `none` | naming, intent/stance metadata, reply timing, and feed grounding now hold through `r6` | `hold` |
| `DIALOGUE-VOICE-CONTRACT.md` | `live` | `none` | dialogue records, Inspect voice surfacing, and `r6` now prove intelligence-band, register, and warning-tone shaping directly | `hold` |
| `DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md` | `live` | `none` | rememberability bands, courtship/rejection residue, repair follow-through, retained dialogue lessons, Inspect surfacing, and `r6` proof now hold; explicit promise-only dialogue acts remain outside the shipped signal set | `hold` |
| `INTERNAL-SIGNAL-CONTRACT.md` | `live` | `none` | active signal summaries and `r6` now prove targeted support, recipient perception, expiry cleanup, and no feed leakage | `hold` |
| `COGNITION-ADDENDUM-NEW-SYSTEMS.md` | `live` | `none` | closure docs treat the addendum as pass and the newer systems now feed the shared cognition stack | `hold` |
| `ML-IMPLEMENTATION-CONTRACT.md` | `live core` | `deferred` | the frozen `c1`-`c7` ML baseline is now documented with rollout, explainability, and soak proof; optional later ONNX/runtime replacement remains intentionally open | `deferred` |
| `WILD-ECOLOGY-RELEASE-CONTRACT.md` | `live` | `none` | `w2`, parity, and final grand-plan proof all match the wild-ecology loop | `hold` |
| `SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md` | `live` | `none` | `single-player-autobattle`, `r5`, and final grand-plan proof all hold | `hold` |

## Chapter 3 - Implementation Plans And Closure

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `ACTIVE-REPAIR-BOARD.md` | `historical` | `historical-only` | frozen closure board; no open repair remains | `historical` |
| `ACTIVE-POLISH-BOARD.md` | `historical` | `historical-only` | frozen polish board; `P5` closed and board is clean | `historical` |
| `SOURCE-CHAPTER-COVERAGE-MATRIX.md` | `live` | `none` | this matrix is the frozen classification layer for the repaired runtime and its deferred boundaries | `hold` |
| `ACTIVE-IMPLEMENTATION-BOARD.md` | `live` | `none` | this board now preserves the completed `I1`-`I5` closure path derived from the matrix | `hold` |
| `ACTIVE-EXPANSION-BOARD.md` | `live` | `none` | this board now preserves the completed `a1`-`a6`, `b1`-`b7`, and `c1`-`c7` expansion path on the frozen runtime | `hold` |
| `REMAINING-IMPLEMENTATION-ROADMAP.md` | `live` | `none` | the roadmap now records the completed expansion order and closed-state notes for ecology depth, later 3-D, and ML | `hold` |
| `EXPANSION-EXECUTION-PLAYBOOK.md` | `live` | `none` | the playbook now acts as the frozen execution record for how the completed expansion path was built and audited | `hold` |
| `ACTIVE-PUBLIC-SHARE-BOARD.md` | `live` | `none` | active release-readiness sequencing board for startup sanity, onboarding, outside playtests, and public-alpha freeze work | `hold` |
| `PUBLIC-SHARE-READINESS-ROADMAP.md` | `live` | `none` | concrete roadmap for moving from frozen internal build to local-host shareability and then public-alpha readiness | `hold` |
| `EXTERNAL-PLAYTEST-MATRIX.md` | `live` | `none` | environment matrix, validated host-local lane, and outside-tester intake path now exist as the release-readiness evidence map | `hold` |
| `PLAYTEST-TRIAGE-LOG.md` | `live` | `none` | outside-tester findings now have a concrete landing spot before `R4` code/doc changes are chosen | `hold` |
| `IMPLEMENTATION-PARITY-AUDIT.md` | `live` | `none` | frozen owner-truth baseline for current runtime | `hold` |
| `PLAYER-FACING-POLISH-AUDIT.md` | `live` | `none` | frozen player-facing proof baseline for the current shell | `hold` |
| `INTENT-AND-EXCLUSIONS-LEDGER.md` | `live` | `none` | the former `active intended` items are now reclassified into `live now` or `deferred / later` against the frozen implementation baseline | `hold` |
| `GRAND-PLAN-CLOSURE-ROADMAP.md` | `historical` | `historical-only` | closure roadmap is a checkpoint/reference now, not live sequencing | `historical` |
| `IMPLEMENTATION-RECOVERY-PLAN.md` | `historical` | `historical-only` | recovery plan is a historical execution record now | `historical` |
| `SOURCE-BOOK-DESTALING-RULES.md` | `live` | `none` | still the correct rule set for keeping present-tense claims honest | `hold` |
| `RECOVERY-BLOCKER-LEDGER.md` | `historical` | `historical-only` | no current blocker is open; preserve as reversal history only | `historical` |
| `CURRENT-SPATIAL-TRUTH.md` | `live core` | `deferred` | the grounded spatial baseline now includes occupancy/carry/stack truth and remains green; volumetric free-flight remains explicitly not live | `hold` |
| `LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md` | `deferred` | `deferred` | later 3D phase is intentionally separate from current runtime truth | `later` |
| `CLOSURE-AUDIT-MATRIX.md` | `historical` | `historical-only` | historical closure checkpoint replaced by frozen parity/polish baselines | `historical` |
| `COMPLETENESS-AUDIT.md` | `historical` | `historical-only` | explicitly historical; no longer a current gap list | `historical` |
| `LIFESIM-EXPRESSION-AUDIT.md` | `live` | `none` | `I1` closed the life-sim family gap with deeper behavior feedback, Inspect surfacing, and audit proof | `hold` |

## Chapter 4 - Architecture And Diagram Appendices

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `GEMINI-DIAGRAM-PROMPTS.md` | `reference` | `none` | diagram prompt pack remains useful as a communication appendix | `sync-on-change` |
| `01-whole-game-architecture.md` | `reference` | `none` | architecture appendix should follow source-doc changes, not lead them | `sync-on-change` |
| `02-life-sim-state-container.md` | `reference` | `none` | update only if `I1` changes the owned life-sim shape materially | `sync-on-change` |
| `03-sleep-state-machine.md` | `reference` | `none` | current sleep owner truth is already frozen clean | `sync-on-change` |
| `04-teaching-trust-flow.md` | `reference` | `none` | the appendix still matches the shipped teaching/trust shape and can remain a sync-on-change reference | `sync-on-change` |
| `05-genetics-breeding-lifecycle.md` | `reference` | `none` | update if `I3` changes edge-rule presentation or lineage surfacing | `sync-on-change` |
| `06-controls-ui-map.md` | `reference` | `none` | current controls/UI shell is frozen clean after `P5` | `sync-on-change` |
| `07-save-load-audit-workflow.md` | `reference` | `none` | save/load/audit workflow remains valid as a reference appendix | `sync-on-change` |
| `08-battle-snapshot-separation.md` | `reference` | `none` | battle snapshot ownership is already closed and frozen | `sync-on-change` |

## Routing Summary

```text
current routing
|- hold
|  |- `GENETICS-STAT-CONTRACT.md`
|  |- `DIALOGUE-VOICE-CONTRACT.md`
|  |- `INTERNAL-SIGNAL-CONTRACT.md`
|  |- `ACTIVE-EXPANSION-BOARD.md`
|  |- `REMAINING-IMPLEMENTATION-ROADMAP.md`
|  |- `EXPANSION-EXECUTION-PLAYBOOK.md`
|  |- `ACTIVE-PUBLIC-SHARE-BOARD.md`
|  |- `PUBLIC-SHARE-READINESS-ROADMAP.md`
|  |- `EXTERNAL-PLAYTEST-MATRIX.md`
|  |- `PLAYTEST-TRIAGE-LOG.md`
|  `- `INTENT-AND-EXCLUSIONS-LEDGER.md`
|- deferred
|  |- `COGNITION-ML-CONTRACT.md`
|  |- `ML-IMPLEMENTATION-CONTRACT.md`
|  `- `LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md`
`- sync-on-change
   `- reference appendices such as `04-teaching-trust-flow.md`
```
