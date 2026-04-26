# Cross-Track Arbitration

## Purpose

This file is the tie-breaker when active boards disagree about a contested
shared file.

## Current Contested-File Owners

| File | Current owner track | Why this track is the tie-breaker |
| --- | --- | --- |
| `core/gameCore.js` | `spatial unification` | board bounds, doorway routes, and interaction-space truth currently dominate the file's cross-track risk |
| `core/config.js` | `visual-first runtime optimization` | feature flags, review-gate defaults, and player-facing performance floors currently anchor the config surface |
| `systems/saveSystem.js` | `visual-first runtime optimization` | save-backend stability is already active there, with later migrations forced through the shared schema registry |
| `systems/lifeSimSystem.js` | `social-cognition depth` | feelings, drives, pair chemistry, and group summaries are owned here |
| `systems/communicationSystem.js` | `social-cognition depth` | motive families, response flow, and dialogue residue routing are owned here |
| `ui/gameUI.js` | `visual-first runtime optimization` | runtime `v1` owns the shell-panel split and the state-shape handoff to presentation layers |

## Arbitration Rules

- A PR from a non-owner track requires a linked review pass from the owner
  track before merge.
- If two boards disagree, this file wins until the owner table is explicitly
  updated.
- Shared contracts still apply even when a file has a single current owner:
  `SAVE-SCHEMA-REGISTRY.md`, `SIM-CADENCE-CONTRACT.md`, and
  `COGNITION-ML-CONTRACT.md`.

