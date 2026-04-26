# Closure Audit Matrix

## Purpose

This matrix is the phase-one closure baseline for Papilionem.

It now serves as a historical closure checkpoint.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-REPAIR-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-REPAIR-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-PARITY-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-PARITY-AUDIT.md)
for the frozen closure baseline.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish status.

It exists to answer one question honestly:

```text
what is actually done, what is only partial, and what still needs a real owner?
```

It must stay anchored to the current contract docs and audited owner systems.

## Shape

```text
╔════════════════════ Closure Matrix ════════════════════╦════════╦══════════════════════════════╗
║ Contract / Phase                                      ║ State  ║ Current owner / next action  ║
╠════════════════════════════════════════════════════════╬════════╬══════════════════════════════╣
║ Genetics / Stat Contract                              ║ pass   ║ statProfileSystem            ║
║ Cognition Addendum                                    ║ pass   ║ lifeSimSystem               ║
║ Wild Ecology / Release Loop                          ║ pass   ║ progressionManager + gameCore║
║ Single-Player Autobattle                              ║ pass   ║ battleSystem + rosterSystem ║
║ ML M1-M4 + closure trace surface                      ║ pass   ║ mlInferenceSystem + Inspect ║
║ M5 Structure / Occupancy / Shelter Truth              ║ pass   ║ structureSystem              ║
╚════════════════════════════════════════════════════════╩════════╩══════════════════════════════╝
```

## Contract Anchors

- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\WILD-ECOLOGY-RELEASE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/WILD-ECOLOGY-RELEASE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)

## Matrix

```text
╔════ Area ══════════════════════════════════════════════╦═══════╦══════════════════════════════════════════════════════╗
║ area                                                   ║ state ║ proof / drift watch                                   ║
╠════════════════════════════════════════════════════════╬═══════╬══════════════════════════════════════════════════════╣
║ genetics / inheritance / stat readability             ║ pass  ║ contract audit green; inspect/journal surfaces live  ║
║ cognition addendum for newer systems                  ║ pass  ║ player/object/ecology/battle channels live          ║
║ wild ecology / release / hybrid-cap loop             ║ pass  ║ progressionManager + gameCore hold canonical truth  ║
║ single-player autobattle                             ║ pass  ║ top-right battle mode + roster-vs-garden selection  ║
║ ML feature / garden / signal / risk / battle posture ║ pass  ║ M1-M4 audited, fallback preserved, Inspect trace live║
║ structure / shelter / interior truth                 ║ pass  ║ structureSystem owns derived shelter/path truth       ║
╚════════════════════════════════════════════════════════╩═══════╩══════════════════════════════════════════════════════╝
```

## Phase Two Result

```text
M5 closure
├─ dedicated derived structure owner added
├─ roof / wall / opening / shelter truth rebuilt per zone
├─ path blocking now reads shared structure profiles
├─ lifeSim spatial awareness refreshes from structure truth
└─ save/rebuild path refreshes structure-derived state explicitly
```

## Locked Rule

Phase two closed the M5 gap by adding a derived owner.

It must not:

- persist fake structure state as durable truth
- move structure truth into UI-only code
- reintroduce old pool or Ephemera-era mechanics
- leave life-sim and pathing on separate spatial models

## Narrower 3D Phase Result

```text
narrower 3D environment phase
|- opening corridor transitions are now explicit
|- body-fit resolves from opening width + interior clearance
|- shelter targeting prefers valid opening approach points
|- carried block pose comes from structure-owned carry anchors
|- block placement avoids opening corridors
`- focused M5 structure audit now verifies:
   - opening transition truth
   - body-fit narrowing
   - carry-anchor truth
   - rebuild-derived shelter truth
```
