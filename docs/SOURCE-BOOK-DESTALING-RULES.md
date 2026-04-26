# Source-Book De-Staling Rules

## Purpose

This section defines how Papilionem's master source must stay aligned with the
actual live game.

The source book is the canonical reading copy, but it is only trustworthy when
its claims match:

- live runtime behavior
- current owner-system code
- current audits
- current intended direction that is still active

## Core Shape

```text
╔════════════════════ Section 5: Source-Book De-Staling ════════════════════╗
║ source docs        │ must describe current truth or active intended truth ║
║ stale claims       │ must be corrected, downgraded, or explicitly marked  ║
║ closed phases      │ cannot claim full closure if player-facing drift remains ║
║ rebuild cadence    │ update docs, then rebuild the source book            ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

```text
live code / runtime truth
          ▼
contract truth
          ▼
repair / audit truth
          ▼
source book chapter text
```

## Authority Order

```text
authority order
├─ 1. live owner-system behavior
├─ 2. active contracts
├─ 3. active repair plan / audit evidence
└─ 4. compiled source book output
```

Rules:

1. The compiled source book is not allowed to outrank live owner truth.
2. If the source book and live game disagree, the source book must be corrected.
3. If the live game is wrong but the contract is right, the source book must
   state that the system is partial or in-repair, not silently call it done.
4. Historical planning documents may remain, but they must not read as current
   truth without qualification.

## What Counts As Stale

```text
stale content
├─ claims a system is complete when the player can still see it is partial
├─ describes removed progression or legacy Ephemera behavior as current
├─ calls an audit or closure “green” after later regressions were found
├─ uses old naming after canonical naming changed
├─ describes older communication / battle behavior after contracts changed
└─ leaves superseded history unmarked as superseded
```

## Allowed Truth States

Every significant system description must resolve to one of these states:

```text
truth states
├─ live
│  └─ implemented and matches current runtime behavior
├─ active intended
│  └─ not fully implemented yet, but still part of the current direction
├─ partial
│  └─ some owner seam exists, but player-facing or runtime truth is incomplete
├─ superseded
│  └─ old direction kept only for history / migration context
└─ archived
   └─ no longer part of the active direction
```

Rules:

1. Do not call a system `live` if the player-facing behavior still contradicts
   the contract in obvious ways.
2. Use `active intended` for work we still mean to build.
3. Use `partial` when code exists but is visibly or structurally incomplete.
4. Use `superseded` for older progression/recovery ideas that no longer govern
   the game.
5. Use `archived` only when we intentionally no longer want that direction.

## Writing Rules

```text
do
├─ state the current truth plainly
├─ separate live behavior from active intention
├─ mention important limits or partial status
├─ mark superseded directions explicitly
└─ prefer exact system names and owner seams

do not
├─ over-celebrate a system as “closed” while active drift remains
├─ let old completion language survive by inertia
├─ treat audit history as current status without dates/context
└─ bury important caveats under optimistic summary text
```

## Repair Rule For Stale Docs

When a stale section is discovered:

```text
stale section found
      ▼
compare with live runtime + owner code + contracts
      ▼
decide correct truth state
      ▼
rewrite the source section
      ▼
rebuild source book
      ▼
verify compiled book no longer overstates reality
```

Required rewrite outcomes:

1. downgrade overclaimed completion to `partial` where needed
2. replace old progression language with wild-ecology truth where applicable
3. mark old recovery milestones as historical if later drift reopened the area
4. preserve useful history, but never let it masquerade as current state

## Chapter-Specific Rules

### Orientation / Guidebook Chapters

1. Must describe the current live shape of the game.
2. Must not teach removed mechanics as if they still exist.
3. Must use current naming for butterflies, abilities, modes, and tabs.

### Core Contracts

1. Must describe the intended active rules clearly.
2. If runtime is behind the contract, that mismatch must be discoverable in the
   repair/audit chapters rather than hidden by optimistic wording.
3. Contracts should not pretend implementation is already equal to design.

### Implementation / Recovery Chapters

1. Must distinguish:
   - historical closures
   - current repair work
   - reopened drift
2. `complete` means the player-facing and runtime truth currently hold, not
   just that a past audit once passed.
3. If new regression evidence appears later, the text must be revised.

### Audit Chapters

1. Audit summaries must include when they were true.
2. A past green audit cannot be used as present-tense proof after later drift.
3. Audit chapters should support confidence, not replace current verification.

## Source-Book Build Rule

```text
edit source docs
      ▼
run build-source-book
      ▼
inspect compiled markdown/html/pdf
      ▼
confirm stale claims are removed or marked
```

Rules:

1. The source book must be rebuilt after any material source-doc correction.
2. Rebuild alone is not enough; compiled output must be spot-checked for stale
   language that survived through included historical chapters.
3. If a historical chapter is intentionally preserved, its status must be made
   obvious in the text around it.

## Required Active Repair Board Alignment

The master source must honestly reflect the current active repair board:

```text
active repair board
├─ 1. live dispersal behavior
├─ 2. crowded-zone optimization
├─ 3. real dialogue composer
├─ 4. battle presentation parity
└─ 5. source-book de-staling
```

Rules:

1. These must not be described as fully resolved until the live game and audits
   actually show them resolved.
2. If one of these is only partially improved, the source book must say so.
3. Section 5 exists to keep the master book from hiding the other four.

## Definition Of Done For Section 5

```text
pass if
├─ master source no longer overstates system completion
├─ active intended systems are clearly separated from live systems
├─ superseded progression/recovery language is marked or corrected
├─ battle / dialogue / dispersal status is described honestly
└─ rebuilt source book matches the corrected source docs
```

## First Audit Targets

1. `IMPLEMENTATION-RECOVERY-PLAN.md`
2. `PAPILIONEM-GUIDEBOOK.md`
3. `SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`
4. `COMMUNICATION-LANGUAGE-CONTRACT.md`
5. compiled `PAPILIONEM-SOURCE-BOOK.md`

## Implementation Order

```text
1. identify overstated or superseded claims
2. compare each against live runtime + current contracts
3. rewrite with correct truth state labels
4. rebuild the source book
5. spot-check compiled chapters for surviving drift
6. repeat until the compiled master book is honest
```
