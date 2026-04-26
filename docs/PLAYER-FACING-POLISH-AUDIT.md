# Papilionem Player-Facing Polish Audit

## Purpose

This audit compares live runtime truth against how quickly and clearly a player
can read that truth from the current shell.

It starts after the 2026-04-18 frozen repair baseline and should not be used to
re-litigate already closed owner-system repairs unless a fresh runtime audit
fails.

```text
closure baseline
      |
      v
player-facing proof
      |
      v
visible polish gap or live polish truth
```

## Current Snapshot

```text
+======================================================================+
| Player-Facing Proof Snapshot                                         |
+======================================================================+
| inspect / single-butterfly shell      | live                         |
| feed / visible action grounding       | live                         |
| journal / roster glanceability        | live                         |
| battle shell comprehension            | live                         |
| release / ecology shell               | live                         |
| accessibility shell                   | live                         |
| debug-truth shell                     | live                         |
+======================================================================+
```

```text
closure state
|- the shared player-facing shell now reads cleanly across Inspect, Journal, feed, battle, release, accessibility, and debug-truth
|- screenshot-backed proof now exists in the final grand-plan audit artifact set
`- no active polish gaps remain on this board
```

## Audit Detail

### 1. Inspect / Single-Butterfly Shell

```text
source truth
|- Inspect is the player-facing truth shell for one butterfly
`- the first read should surface identity, context, and current state quickly

live truth
|- Inspect now opens with a fixed hero summary and grouped section cards
`- identity, state, social, battle, and ecology reads land in a clearer top-to-bottom order

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

### 2. Feed / Visible Action Grounding

```text
source truth
|- feed lines should reinforce what the player can plausibly see happening
`- text should not feel ahead of the garden

live truth
|- intent, stance, naming, and zone lexicon are live
|- communication timing and event ownership are already repaired
|- the shell now renders context-aware category cards instead of one flattened text wall
|- talk cards now ground speech with direct/open talk mode, zone context, and visible activity cues
`- action cards now carry short grounding lines instead of floating as pure text

closure proof
|- same-name speakers are disambiguated in the feed when stripped names would collide
`- `r6` now checks for grounded talk and action entries, not only legacy line strings

status
`- live
```

Primary seams:
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`

### 3. Journal / Roster Glanceability

```text
source truth
|- Journal should archive long-term truth without becoming slow to scan
`- roster should show battle relevance quickly

live truth
|- collection, roster, rename, and battle-launch flows are live
|- strongest-team selection and readiness truth are live
|- collection and roster now open with badge-led summary cards and stronger section contrast
`- roster now surfaces membership, readiness tier, and nearby alternatives through a glance strip

closure proof
|- wheel-scroll, roster selection, and battle-launch flow still pass through the active audits
`- the shell now lands identity and battle relevance faster without reopening runtime repairs

status
`- live
```

Primary seams:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

### 4. Battle Shell Comprehension

```text
source truth
|- battle should read clearly without debug overlays
|- action, consequence, and return flow should feel legible
`- visible combat should support the autobattle fantasy

live truth
|- battle presentation parity is repaired and the active audits are green
|- battle labels, event recency, and ability-styled effects are live
|- the shell now defaults to a focus view with clearer team-state cards, tagged feed rows, and stronger live comparisons
`- Return now reads as `Return to Garden` when the result is ready and the arena highlights the current focus

closure proof
|- `r5` and `single-player-autobattle` both now check for a populated focus shell and clearer return-state labels
`- the live battle read now lands action, consequence, and commit clarity faster without reopening combat truth

status
`- live
```

Primary seams:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`

### 5. Release / Ecology Shell

```text
source truth
|- release should remain the primary long-term ecology pressure flow
`- hybrid-cap behavior should stay understandable from the shell

live truth
|- Inspect owns release flow
|- release-wave bookkeeping and the 150-hybrid cap are audited live
`- current player-facing ecology rules now match the repaired runtime docs

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `core/progressionManager.js`
- `systems/breedingSystem.js`

### 6. Accessibility Shell

```text
source truth
|- players should be able to tune readability from the live shell
`- current exposed controls should stay honest and usable

live truth
|- Access remains the player-facing home for contrast, trail, color, and UI-scale controls
`- control continuity audits are green

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `core/renderManager.js`

### 7. Debug-Truth Shell

```text
source truth
|- debug should help testers verify truth without breaking the player shell
`- debug overlays must not hide key counters or lie about owner truth

live truth
|- debug is button-first
|- specimen counters remain visible
`- current closure audits are green here

status
`- live
```

Primary seams:
- `ui/debugUI.js`
- `ui/gameUI.js`

## Active Gap Order

```text
none
`- board frozen clean after the final screenshot-backed proof pass
```
