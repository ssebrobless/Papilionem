# Diagram Asset Registry

## Purpose

This file tracks external architecture diagrams that summarize Papilionem more
quickly than the full source book.

Use it to answer:

```text
which diagrams exist
where they are saved
which source docs they were checked against
when they were last verified
what should be updated if the runtime changes
```

## Save Convention

Preferred save root for collaborator-facing diagrams:

`C:\Users\fishe\Documents\projects\ephemera\docs\guidebook\diagrams\`

If a diagram is saved somewhere else, record the exact absolute path below.

## Review Standard

Every diagram review should check:

- owner boundaries still match the runtime
- phase status still matches the live board
- diagrams do not promote deferred work as already live
- player-facing explanations do not contradict current controls or shell flow
- simplified labels still preserve the actual system shape

## Canonical Sources

Use these docs as the primary truth when reviewing or updating diagrams:

- [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md)
- [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md)
- [EXPANSION-EXECUTION-PLAYBOOK.md](./EXPANSION-EXECUTION-PLAYBOOK.md)
- [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
- [ML-IMPLEMENTATION-CONTRACT.md](./ML-IMPLEMENTATION-CONTRACT.md)
- [GENETICS-STAT-CONTRACT.md](./GENETICS-STAT-CONTRACT.md)
- [PAPILIONEM-GUIDEBOOK.md](./PAPILIONEM-GUIDEBOOK.md)

## Diagram Ledger

| Diagram | Status | Saved path | Last verified against | Review status | Update triggers |
| --- | --- | --- | --- | --- | --- |
| `ML layer overview` | `live external doc` | `C:\Users\fishe\Documents\projects\ephemera\docs\SYSTEM-DIAGRAMS.md` | `ACTIVE-EXPANSION-BOARD.md`, `COGNITION-ML-CONTRACT.md`, `ML-IMPLEMENTATION-CONTRACT.md` | `verified 2026-04-20` | `c4-c7`, ML runtime / fallback changes, inspect/debug ML surfacing changes |
| `Neural network / policy pipeline` | `live external doc` | `C:\Users\fishe\Documents\projects\ephemera\docs\SYSTEM-DIAGRAMS.md` | `ML-IMPLEMENTATION-CONTRACT.md`, `EXPANSION-EXECUTION-PLAYBOOK.md`, `ACTIVE-EXPANSION-BOARD.md` | `verified 2026-04-20` | artifact/runtime changes, training-path changes, feature-schema changes |
| `Genetics / lineage systems` | `live external doc` | `C:\Users\fishe\Documents\projects\ephemera\docs\SYSTEM-DIAGRAMS.md` | `GENETICS-STAT-CONTRACT.md`, `PAPILIONEM-GUIDEBOOK.md`, `WILD-ECOLOGY-RELEASE-CONTRACT.md` | `verified 2026-04-19` | genetics surface changes, lineage/release feedback changes, breeding lifecycle changes |

## Future Update Rule

When a diagram file is created or revised:

1. record its exact saved path here
2. mark whether it was reviewed against the live runtime/docs
3. note the phase or contract that would force a future refresh

Do not treat a diagram as canonical until the review status is `verified`.
