# Stage A G0-Bar Signoff - 2026-04-29

## Session Setup

```text
+-------------------------------------------------------------+
| Stage A Human Signoff                                       |
+----------------------+--------------------------------------+
| branch               | codex/milestone-freeze-playtest       |
| build                | c87f98b                               |
| local url            | http://127.0.0.1:3000/                |
| minimum duration     | 20 continuous minutes                 |
| entry state          | real lived-in save                    |
| optional evidence    | Start Capture -> Export Capture       |
+----------------------+--------------------------------------+
```

## What This Session Decides

```text
Stage A
|- G1 spatial readability
|- G2 live building behavior
`- G3 movement naturalness
```

Automated local proof is green. This sheet is for the human read: does the
game feel coherent in ordinary play?

## Session Info

```text
reviewer         :
date             : 2026-04-29
browser/device   :
start time       :
end time         :
duration         : about 5 minutes
save used        :
capture exported : yes
capture path     : qa_logs/session_captures/2026-04-29T23-39-22-983Z-playtest-manual-capture-1777505666832
```

## During Play

Start in normal play. Use debug only to start/export capture unless you need to
inspect a suspected bug after noticing it normally.

```text
watch order
|- first 5 min   -> move through normal garden play and zone switching
|- next 5 min    -> watch block carrying / placement / structure growth
|- next 5 min    -> watch calm wandering, approach, linger, scared/recovery motion
`- final 5 min   -> revisit any suspicious moment and decide close/hold
```

## G1 Spatial

Rate each item `good`, `mixed`, or `rough`.

```text
butterflies at correct height/band :
flowers sit correctly              :
blocks ground/connected/stacked    :
carry / cover / overhead states    :
doorway travel matches corridor    :
no pseudo-3D contradiction         :
```

Notes:

- strongest contradiction seen:
- where it happened:
- repeatable:

## G2 Building

Rate each item `good`, `mixed`, or `rough`.

```text
butterflies choose blocks naturally :
carry behavior looks intentional    :
placement resolves cleanly          :
flower conflict reads cleanly       :
stacking / support reads cleanly    :
revisit or grow structure pocket    :
colony-shaped, not random shuffling :
readable without debug truth        :
```

Notes:

- best building moment:
- weakest building moment:
- did the colony create readable structural change:

## G3 Movement

Rate each item `good`, `mixed`, or `rough`.

```text
calm wandering feels natural       :
social approach / linger           :
doorway travel                     :
carrying movement                  :
threat / scared movement           :
recovery after pressure            :
no snap / zoom / route ugliness    :
```

Notes:

- best movement moment:
- ugliest movement moment:
- did any motion feel like teleport choreography:

## Closure Call

```text
G1 spatial  -> close / hold
G2 building -> close / hold
G3 movement -> close / hold
Stage A     -> hold
```

If holding anything, classify each blocker:

- implementation gap
- acceptance gap
- proof gap
- outside-evidence gap

```text
blocker 1
|- phase / pillar : G1 spatial / zone presentation
|- blocker type   : implementation gap
|- what happened  : focused-zone view changed repeatedly without player intent; capture logged 83 navigation focus-zone events in under 5 minutes
`- next action    : stop ambient butterfly zone travel from changing the player camera/focused zone

blocker 2
|- phase / pillar : G1 spatial / sim-board presentation
|- blocker type   : acceptance gap
|- what happened  : sim-board ground reads as an unexplained green rectangle inside a green screen; zone highlights overlay the old map and confuse the board truth
`- next action    : redesign focused sim-board as a full-screen readable play field with optional grid, and suppress legacy zone overlays in focused sim-board mode
```

## Final Signoff

```text
reviewer :
result   : Stage A held
date     : 2026-04-29
```
