# V7 Visual Restoration Audit

## Purpose

This audit freezes the first honest `v7` restoration result:

```text
v7 restored state
|- sharp creatures   -> live through bakedCreatureSprites
|- trails available  -> reduced + full now live behind player setting
|- shipped default   -> trails stay off by default
`- sprite atlas      -> still off
```

## Live Runtime Shape

```text
visual restoration
|- performance.flags.bakedCreatureSprites -> true
|- performance.flags.trailsQualityReduced -> true
|- performance.flags.trailsQualityFull    -> true
|- performance.flags.spriteAtlas          -> false
|- accessibility.trailVisibility         -> off (default)
|- player options                        -> off / reduced / full
`- battle rule                           -> trails still off in battle
```

## Files

- `core/config.js`
- `core/renderManager.js`
- `ui/gameUI.js`
- `scripts/run-h5-long-running-save-smoothness-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-v3-sprite-parity-audit.js`

## Proof

```text
live default (trails off)
|- report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-43-28-136Z/report.json
|- calm   -> 6.76 / 13.33
|- shell  -> 12.06 / 12.95
`- p95    -> 31.40
```

```text
reduced trails
|- report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-46-43-006Z/report.json
|- calm   -> 6.56 / 12.96
|- shell  -> 10.60 / 13.08
`- ratio  -> calm render 12.96 / 13.33 = 0.97x off-baseline
```

```text
full trails
|- report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-44-10-129Z/report.json
|- calm   -> 6.89 / 13.13
|- shell  -> 9.81 / 12.77
`- ratio  -> calm render 13.13 / 13.33 = 0.98x off-baseline
```

```text
sharp-creature parity
|- report -> qa_screenshots/v3_sprite_parity_audit/2026-04-25T22-42-38-064Z/report.json
`- read   -> pass
```

```text
readability under heaviest player path
|- report -> qa_screenshots/r4_ui_readability_audit/2026-04-25T22-45-01-908Z/report.json
`- read   -> pass
```

```text
battle presentation note
|- control report   -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-40-44-517Z/report.json
|- candidate report -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-39-53-556Z/report.json
`- read             -> both failed on the same guard-only battle fixture, so r5 was not used as the v7 differentiator
```

## Guardrail Read

```text
what held
|- trails remain off by default
|- reduced and full are both player-available again
|- baked creature path is now live on the real runtime stack
|- lived-in h5 passes off / reduced / full
|- readability holds under full
`- parity still holds on the baked creature path
```

```text
what is not earned
|- spriteAtlas still stays off
|- no claim that the current r5 battle fixture is repaired
`- no claim that v8a or c7 are already closed
```

## Honest Phase State

```text
v7 today
|- status          -> frozen live
|- shipped default -> sharp creatures on, trails off
|- player options  -> reduced / full available
|- shared schema   -> c7 signoff is now recorded at `schemaVersion = 4`
`- next proof      -> v8a runtime-only proof on the frozen live stack
```
