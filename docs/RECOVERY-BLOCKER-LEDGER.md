# Recovery Blocker Ledger

This ledger is for genuine hard blockers encountered during autonomous recovery
work.

Use it when a blocker is:

- real
- specific
- not safely fixable inside a short bounded recovery pass
- but still safely bypassable so the roadmap can continue

Do not use it for ordinary bugs that can be fixed inside the current phase.

## Entry Rules

```text
every blocker entry must include
├─ id
├─ phase
├─ date
├─ blocker summary
├─ why it blocked progress
├─ exact file paths / functions / systems involved
├─ exact failing command or runtime path
├─ key error output or visible evidence
├─ bounded recovery attempts already tried
├─ chosen bypass path
├─ validations deferred
├─ downstream phases to re-check
├─ recommended revisit point
└─ current status
```

## Status Values

```text
status
├─ deferred
├─ bypassed
├─ revisiting
└─ resolved
```

## Entry Template

```text
id:
phase:
date:

blocker summary:

why it mattered:

exact scope:
├─ files:
├─ functions:
└─ systems:

failing path:

evidence:

bounded recovery attempts:
1.
2.
3.

chosen bypass path:

validations deferred:
1.
2.

downstream phases to re-check:
1.
2.

recommended revisit point:

status:
```

## Active Entries

None yet.
