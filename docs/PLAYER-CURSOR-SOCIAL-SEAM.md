# Player / Cursor Social Seam Reservation

Status: reserved only, not implemented.
Date: 2026-04-30
Owner: future player-social interaction work
Binding context: `CLAUDE-REVIEW-G0-VISUAL-SPATIAL-AI-2026-04-29.md` R9

This document protects the future goal where the player can give themselves a
name, speak through the cursor, and have butterflies recognize that named
player as a social participant. It does not add runtime behavior, save fields,
UI, dialogue generation, or relationship state in the current G0 round.

```text
future seam shape
+-- player profile truth
|   +-- display name
|   +-- cursor entity id
|   `-- cursor board position
+-- butterfly social truth
|   +-- relationship-to-player values
|   +-- last player speech receipt
|   `-- whether the butterfly knows the player name
+-- communication truth
|   +-- talkMode = "to_player"
|   +-- non-butterfly listener/speaker support
|   `-- feed attribution to player displayName
`-- ML feature truth
    +-- player interaction features are read-only signals
    `-- ML scores choices, never owns durable bonds
```

## Reserved Field Names

These names are reserved so future migrations can be additive and consistent.
They must not be used for unrelated purposes.

```text
playerProfile:
  displayName        : string | null
  cursorEntityId     : string              default "cursor"
  cursorBoardPos     : { zoneId, u, v, h } derivable from cursor + board projection

butterfly.relationshipsToPlayer:
  trust              : 0..100
  fear               : 0..100
  attachment         : 0..100
  lastSpeechReceived : { atFrame, lineId, motive } | null
  knownByPlayerName  : boolean

communicationSystem:
  talkMode           : "to_player"
  listenerId         : playerProfile.cursorEntityId
  speakerId          : playerProfile.cursorEntityId when the player speaks
  display label      : playerProfile.displayName when set, otherwise "Player"
```

## Ownership Rules

The one-owner-per-truth rule still applies.

```text
owner map
+-- saveSystem
|   `-- persists playerProfile only after a future additive migration
+-- gameCore / input layer
|   `-- derives cursorBoardPos from the live cursor and current projection
+-- communicationSystem
|   `-- formats to_player speech and feed attribution
+-- lifeSimSystem / social edge helpers
|   `-- owns durable trust, fear, attachment, and player-recognition residue
`-- mlInferenceSystem
    `-- reads player interaction features and scores choices only
```

ML must not own durable player relationships, memories, emotions, or identity.
It may only consume the feature row and score candidate actions.

## Future Implementation Constraints

- Additive save migration only; no wipe or reset of long-running saves.
- Do not rename locked drive, emotion, memory, motive, or social-edge families.
- Do not claim literal consciousness or subjective feeling.
- Cursor speech must be distinguishable from butterfly speech in feed traces.
- The player display name is presentation and identity context, not a new
  butterfly entity.
- `cursorBoardPos` must use the same board projection contract as butterflies,
  blocks, flowers, and abilities.
- Relationship-to-player values must be inspectable and explainable through
  source events, not hidden magic numbers.

## Non-Goals For G0

R9 does not implement:

- player naming UI
- player chat input
- cursor entity persistence
- butterfly replies to player speech
- save schema changes
- new ML runtime
- new emotion or relationship vocabularies

## Acceptance For This Reservation

This document exists and is linked from `ACTIVE-PLAN-REGISTRY.md`. Any future
plan that touches player naming, cursor speech, player relationship state, or
chat attribution should read this document before proposing fields.
