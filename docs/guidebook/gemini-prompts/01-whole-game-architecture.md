# 01 Whole-Game Systems Architecture

Target output:

`docs/guidebook/diagrams/01-whole-game-architecture.png`

```text
Create a landscape systems architecture diagram for the game Papilionem.

Show these major regions:
- GameCore orchestration in the center
- World/render/UI on one side
- Life-simulation systems on another side
- Breeding/genetics/ecology loop on another side
- Debug/audit/save systems on another side
- Battle snapshot layer clearly separated from normal garden truth

Include these systems by name:
- ZoneSystem
- StatusSystem
- BehaviorSystem
- ObjectSystem
- SleepSystem
- TeachingSystem
- BreedingSystem
- BattleSystem
- SaveSystem
- TelemetrySystem
- RenderManager
- GameUI
- DebugUI

Visually emphasize:
- one owner per truth
- battle as an isolated snapshot/commit layer
- save/load persisting durable truth only
- render as visuals only

Use arrows to show data/control flow between systems.
```
