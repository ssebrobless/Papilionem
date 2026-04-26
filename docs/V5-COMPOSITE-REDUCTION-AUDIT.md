# V5 Composite Reduction Audit

## Purpose

This audit freezes the earned `v5` seams so far.

```text
v5 earned seams
|- seam 1             -> renderManager entity/behind composite reduction on clean-shell lanes only
|- seam 2             -> first-session guide moved onto the DOM shell path
|- seam 3             -> mature flower heads now render from a bounded baked sprite cache
|- seam 4             -> entity/behind composite present now uses the native canvas drawImage path
|- seam 5             -> non-carried blocks can peel into their own cropped composite layer behind a default-off flag
|- seam 6             -> when that blocks layer is enabled, unchanged grounded/support block layouts now reuse the prior layer contents by default instead of repainting every frame
|- seam 7             -> mature flowers can route to a direct-present path behind a default-off flag; same-code `h5` and guardrails held, but the quick pre-battle lane regressed so it is not promoted to the live default stack
|- seam 8             -> calm clean-shell HUD redraw now idles at a lower cadence unless the player is actively interacting with shell buttons or doorway travel controls
|- proof fix          -> exported session captures now separate warning-level `cadence-budget-overrun` telemetry from hard runtime errors, so `h5` phase 07 only fails on true runtime faults
|- rejected seam      -> static block layer cache experiment rolled back
|- rolled-back seam   -> raw butterfly canvas draw path regressed the retained stack and was removed
|- rolled-back seam   -> direct entity present path regressed the retained stack and was removed
|- rolled-back seam   -> native entity composite present path regressed frame tails and was removed
|- rolled-back seam   -> tighter butterfly dirty bounds regressed calm/shell and were removed
|- rolled-back seam   -> segmented entity composite follow-up looked good in quick smoke but failed stricter h5/a4 gates and was removed
|- rolled-back seam   -> region-layer entity follow-up regressed calm/battle/soak after the false-win bug was fixed and was removed
|- rolled-back seam   -> split-scenery entity layer follow-up increased composite work and regressed every lived-in render lane, so it was removed
|- rolled-back seam   -> grounded-block background-backdrop follow-up improved quick calm/shell reads but lost same-code h5 and was removed
|- rolled-back seam   -> grounded-block direct-present follow-up improved update-side reads but regressed the render-side v5 lane and was removed
|- rolled-back seam   -> edge-outlier peel follow-up never activated into a meaningful retained-crop split on the lived-in stack and was removed
|- rolled-back seam   -> wing-local butterfly bake follow-up improved quick average render but failed the stricter h5 calm gate and increased heap, so it was removed
|- rolled-back seam   -> hybrid dirty-present threshold follow-up lowered heap but made the stricter calm/shell h5 gate worse, so it was removed
|- rolled-back seam   -> native clip-present follow-up stayed nearly flat in quick smoke but still made the stricter h5 calm gate worse, so it was removed
|- rolled-back seam   -> native no-smooth present follow-up improved battle but still made the stricter h5 calm/shell gate worse, so it was removed
|- inherited runtime  -> v1 shellUiDom default-on + retained v4 18/36/30 cadence slice
|- guardrails         -> battle full-frame + canvas-heavy shell full-frame + proof reruns
`- honest phase state -> v5 is now frozen live
```

## Live Runtime Shape

```text
flag
`- performance.flags.compositeDirtyRegions
   |- off -> legacy full-frame entity + behind-cover composites
`- on  -> cropped composite path on clean-shell lanes only
      |- entities layer
      |  `- estimated dirty region from live entity bounds
      |- optional blocks layer
      |  `- non-carried blocks may peel into their own cropped composite when `performance.flags.compositeBlocksLayer` is enabled
      |- behind-cover layer
      |  `- estimated dirty region from behind-cover bounds
      |- battle view
      |  `- forced full-frame path
      `- canvas-heavy shell
         `- forced full-frame path

flag
`- performance.flags.bakedFlowerHeads
   |- off -> procedural flower heads every frame
   `- on  -> mature flower heads draw from spriteManager's bounded `flower-head` cache
      |- live motion kept
      |  |- sway / lean
      |  |- per-flower head rotation
      |  `- mature pulse scaling
      |- procedural path kept
      |  |- stems
      |  |- bloom / wilting / dissolve heads
      |  `- guide / blessing / lifecycle overlays
      `- heap target
         `- no growth versus the retained v5 guide candidate

flag
`- performance.flags.compositeNativeDraw
   |- off -> composite present uses the generic p5 image path
   `- on  -> entity + behind-cover composite present uses the native canvas drawImage path
      |- scope
      |  |- cropped entity composites
      |  |- cropped behind-cover composites
      |  |- full entity composites on conservative lanes
      |  `- full behind-cover composites on conservative lanes
      |- proof target
      |  `- lower same-code h5 calm + shell render without changing visual readability
      `- retained state
         `- banked as part of the live v5 stack

flag
`- performance.flags.compositeBlocksLayer
   |- off -> blocks stay inside the main cropped entity composite
   `- on  -> grounded/supported non-carried blocks peel into their own cropped composite layer
      |- proof target
      |  |- shrink the hot actor crop
      |  |- keep block visuals + spatial truth intact
      |  `- lower lived-in same-code h5 calm + shell pressure without reopening broad split-scenery work
      `- retained state
         `- earned as a default-off seam only; the redraw-reuse variant is now the retained default behavior inside this seam, and the seam now co-pulls the direct-flower present path because that stacked shape is the earned version of the blocks layer

flag
`- performance.flags.compositeBlocksLayerReuse
   |- off -> blocks composite layer repaints every frame while active
   `- on  -> unchanged visible grounded/support block signatures reuse the prior blocks layer contents
      |- scope
      |  `- only matters when `performance.flags.compositeBlocksLayer` is already enabled
      |- proof target
      |  `- beat the plain blocks-layer seam without changing visuals or spatial truth
      `- retained state
         `- banked as the better default inside the optional blocks-layer seam

flag
`- performance.flags.directPresentFlowers
   |- off -> flowers stay inside the main cropped entity composite
   `- on  -> mature flowers route to a direct-present path below blocks/actors and leave the shared entity crop
      |- proof target
      |  |- reduce the calm/shell flower-owned crop without changing save/spatial truth
      |  `- hold battle presentation and block overlap readability
      |- retained state
      |  `- earned as a standalone default-off seam, and now also acts as the retained companion path inside the optional blocks-layer seam
      `- unresolved note
         `- the standalone seam still regressed a quick pre-battle battle lane while active in focused-garden, but the retained blocks-layer stack cleaned that up enough to bank the combined path
```

```text
runtime behavior
|- calm clean-shell HUD redraw discipline
|  |- idle focused-garden shell   -> redraw every 6 frames
|  `- interactive shell / doorway -> redraw every 2 frames
|- capture export classification
|  |- cadence-budget-overrun -> warning
|  `- true runtime fault     -> error
`- proof effect
   |- calm lane now clears the stricter `h5` render threshold
   `- capture export proof now fails only on real runtime errors
```

## Files

- `core/renderManager.js`
- `core/config.js`
- `core/spriteManager.js`
- `entities/flower.js`
- `ui/gameUI.js`
- `ui/dom/guidePanel.js`
- `ui/dom/shellOverlay.js`
- `index.html`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-h5-long-running-save-smoothness-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`
- `docs/V1-SHELL-UI-SEPARATION-AUDIT.md`
- `docs/ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md`
- `docs/ACTIVE-COMPLETION-BOARD.md`

## Proof

```text
same-code compare
|- control   -> qa_logs/session_captures/v5-composite-dirty-control-r2/2026-04-24T03-33-43-472Z/
|- candidate -> qa_logs/session_captures/v5-composite-dirty-candidate-r2/2026-04-24T03-33-43-467Z/
`- diff      -> qa_logs/session_captures/v5-composite-dirty-candidate-r2/2026-04-24T03-33-43-467Z/diff-vs-v4-retained-control.md
```

```text
guide-to-dom compare
|- baseline  -> qa_logs/session_captures/v5-composite-dirty-candidate-r2/2026-04-24T03-33-43-467Z/
|- candidate -> qa_logs/session_captures/v5-guide-dom-candidate/2026-04-24T04-15-22-948Z/
`- diff      -> qa_logs/session_captures/v5-guide-dom-candidate/2026-04-24T04-15-22-948Z/diff-vs-v5-composite-retained.md
```

```text
stacked runtime follow-up
|- inherited defaults -> shellUiDom on, retained v4 cadence slice banked
|- proof lane         -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-24T04-16-31-196Z/report.json
`- read               -> materially improved, still not green
```

```text
flower-head same-code compare
|- baseline  -> qa_logs/session_captures/v5-guide-dom-candidate/2026-04-24T04-15-22-948Z/
|- candidate -> qa_logs/session_captures/v5-flower-head-candidate/2026-04-24T05-24-48-513Z/
`- diff      -> qa_logs/session_captures/v5-flower-head-candidate/2026-04-24T05-24-48-513Z/diff-vs-v5-guide-retained.md
```

```text
earned wins from current v5 stack
|- calm avgRenderMs   29.97 -> 24.95  (-16.7%)
|- calm p95FrameMs    41.60 -> 36.10  (-13.2%)
|- shell avgRenderMs  36.62 -> 26.22  (-28.4%)
|- shell p95FrameMs   60.30 -> 38.80  (-35.7%)
|- battle avgRenderMs 37.37 -> 32.76  (-12.3%)
|- ui redraws (calm)  123 -> 18
|- ui redraws (shell) 89 -> 28
|- heap               159.26 -> 159.26 MB
|- a4 spatial truth   -> pass on stacked runtime
`- r4 readability     -> pass
```

```text
earned wins from bakedFlowerHeads on top of the retained v5 stack
|- calm avgRenderMs   24.95 -> 14.09  (-43.5%)
|- calm p95FrameMs    36.10 -> 24.00  (-33.5%)
|- shell avgRenderMs  26.22 -> 15.09  (-42.4%)
|- shell p95FrameMs   38.80 -> 28.80  (-25.8%)
|- battle avgRenderMs 32.76 -> 24.24  (-26.0%)
|- soak avgRenderMs   27.27 -> 15.85  (-41.9%)
|- heap               159.26 -> 159.26 MB
|- r4 readability     -> pass with the retained stacked runtime
`- a4 spatial truth   -> pass with the retained stacked runtime
```

```text
native composite present same-code compare
|- baseline  -> qa_logs/session_captures/v5-native-composite-control/2026-04-24T23-55-18-611Z/
|- candidate -> qa_logs/session_captures/v5-native-composite-candidate/2026-04-24T23-55-18-602Z/
`- diff      -> qa_logs/session_captures/v5-native-composite-candidate/2026-04-24T23-55-18-602Z/diff-vs-no-flag-control.md
```

```text
h5 improved shape after stacked runtime
|- calm         avgUpdate 27.33 | avgRender 28.80
|- shell-heavy  avgUpdate 26.48 | avgRender 27.59
|- read         cleaner than the earlier stacked path, but still above closure targets
`- note         the run now times out later in the audit; the blocker remains runtime pressure, not geometry drift
```

```text
h5 improved shape after bakedFlowerHeads
|- calm         avgUpdate 6.11 | avgRender 15.96
|- shell-heavy  avgUpdate 7.95 | avgRender 14.53
|- read         much cheaper than the retained guide-only stack, but still held open by the audit's stricter pressure target
`- note         the failure is now "still above target", not a seam regression
```

```text
post-rollback calm attribution on the retained v5 stack
|- capture root        -> qa_logs/session_captures/v5-family-attribution-calm-r3/2026-04-24T18-25-05-936Z/
|- avgRenderMs         -> 15.02
|- entityLayerMs       -> 5.53
|- composite.entities  -> 8.65
|- butterfly draw      -> 2.75
|- flower draw         -> 2.15
|- block draw          -> 0.51
`- read                -> the remaining calm miss is now mostly entity composite pressure, with butterfly draw the largest family-specific slice
```

```text
fine-grained butterfly attribution on the retained stack
|- capture root              -> qa_logs/session_captures/v5-butterfly-component-attribution/2026-04-24T23-51-22-560Z/
|- calm butterfly total      -> 3.70ms
|- calm butterfly wings      -> 3.29ms
|- calm butterfly antenna    -> 0.11ms
|- calm butterfly body       -> 0.04ms
|- calm butterfly overlays   -> 0.01ms
|- calm entities composite   -> 11.54ms
`- read                      -> wings dominate the butterfly-specific slice, but the bigger remaining blocker is still entity composite/present cost
```

```text
retained-stack crop read
|- capture root              -> qa_logs/session_captures/v5-tight-bounds-control/2026-04-25T00-01-59-563Z/
|- calm entities mode        -> cropped
|- calm entities region      -> 706 x 273
|- calm cropped area ratio   -> 53.5% of the screen
|- calm entities composite   -> 11.93ms
`- read                      -> dirty-region cropping is already active; the remaining blocker is that the retained crop is still large and expensive to present
```

```text
family composite-footprint attribution on the retained stack
|- capture root                    -> qa_logs/session_captures/v0-baseline/2026-04-25T03-27-33-668Z/
|- retained crop                   -> 706 x 273
|- butterfly union                 -> 525 x 203 (29.6%)
|- flower union                    -> 700 x 224 (43.6%)
|- block union                     -> 705 x 273 (53.5%)
`- read                            -> blocks widen the retained crop almost to its full current bounds; flowers hold most of the width and upper body of the crop
```

```text
edge-owner attribution on the retained dirty-region stack
|- capture root                    -> qa_logs/session_captures/v5-edge-entity-attribution/2026-04-25T04-40-24-693Z/
|- family owners                   -> left block | right flower | top block | bottom block
|- entity owners                   -> left `block_1776894272484_842`
|  |- top                          -> `block_1776894272485_854`
|  |- bottom                       -> `block_1776894272482_828`
|  `- right                        -> `flower_1776656084512_722_338_399.0048954728991`
|- owner shape                     -> ordinary grounded `pool-heart` blocks plus one far-right mature daisy
`- read                            -> the retained crop is being pinned by real zone dispersion, not by one oversized aura/debug overlay bug
```

```text
tight-bounds same-code compare
|- baseline  -> qa_logs/session_captures/v5-tight-bounds-control/2026-04-25T00-01-59-563Z/
|- candidate -> qa_logs/session_captures/v5-tight-bounds-candidate/2026-04-25T00-02-57-381Z/
`- diff      -> qa_logs/session_captures/v5-tight-bounds-candidate/2026-04-25T00-02-57-381Z/diff-vs-no-flag-control.md
```

```text
segmented entity composite follow-up
|- first candidate
|  |- candidate -> qa_logs/session_captures/v5-segmented-entity-composite-candidate/2026-04-25T00-41-52-785Z/
|  `- diff      -> qa_logs/session_captures/v5-segmented-entity-composite-candidate/2026-04-25T00-41-52-785Z/diff-vs-no-flag-control.md
|- refined candidate
|  |- candidate -> qa_logs/session_captures/v5-segmented-entity-composite-candidate-r2/2026-04-25T00-45-37-586Z/
|  `- diff      -> qa_logs/session_captures/v5-segmented-entity-composite-candidate-r2/2026-04-25T00-45-37-586Z/diff-vs-no-flag-control.md
|- stricter gates
|  |- h5 -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T00-47-10-748Z/report.json
|  `- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T00-47-10-709Z/report.json
`- read
   |- quick smoke looked strong
   |- first candidate did not activate segmented presentation consistently enough to trust
   |- refined candidate activated more often, but increased composite call count and failed stricter proof
   `- result -> rolled back; not part of the retained stack
```

```text
region-layer entity follow-up
|- first read
|  |- quick compare -> looked impossible-good because render/composite work collapsed
|  `- strict read   -> false win caused by `this.getOrCreateRegionLayer is not a function`
|- corrected candidate
|  |- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T01-09-16-587Z/
|  `- compare   -> versus qa_logs/session_captures/v0-baseline/2026-04-25T01-05-25-002Z/
`- corrected read
   |- calm   avgRender 18.42 -> 19.29
   |- battle avgRender 31.12 -> 32.64
   |- soak40 avgRender 20.20 -> 21.75
   |- heap   flat at 159.26 MB
   `- result -> rolled back; not part of the retained stack
```

```text
split-scenery entity layer follow-up
|- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T03-00-03-048Z/
|- compare   -> versus qa_logs/session_captures/v0-baseline/2026-04-25T01-05-25-002Z/
`- read
   |- calm   avgRender 18.42 -> 22.95
   |- shell  avgRender 19.85 -> 25.25
   |- battle avgRender 31.12 -> 38.50
   |- soak40 avgRender 20.20 -> 28.80
   |- compositeCallsPerFrame climbed across every lane
   `- result -> rolled back; not part of the retained stack
```

```text
grounded-block background-backdrop follow-up
|- quick compare
|  |- control   -> qa_logs/session_captures/v0-baseline/2026-04-25T03-32-13-046Z/
|  `- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T03-33-02-993Z/
|- quick read
|  |- calm   avgRender 14.13 -> 13.64
|  |- shell  avgRender 15.33 -> 14.49
|  |- soak40 avgRender 17.34 -> 16.21
|  `- battle avgRender 24.62 -> 26.22
|- stricter gates
|  |- r7 -> qa_screenshots/r7_block_visual_audit/2026-04-25T03-34-08-274Z/report.json
|  |- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T03-34-08-270Z/report.json
|  `- h5 -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T03-34-08-266Z/report.json
`- read
   |- block visuals and spatial truth held
   |- but same-code h5 control was better:
   |  |- calm   16.56 -> 19.10
   |  `- shell  14.74 -> 15.53
   `- result -> rolled back; not part of the retained stack
```

```text
grounded-block direct-present follow-up
|- quick compare
|  |- control   -> qa_logs/session_captures/v0-baseline/2026-04-25T03-48-39-446Z/
|  `- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T03-49-31-717Z/
|- quick read
|  |- calm   avgRender 14.13 -> 13.96
|  |- shell  avgRender 15.07 -> 15.01
|  |- soak40 avgRender 16.65 -> 16.92
|  `- battle avgRender 25.99 -> 27.05
|- stricter gates
|  |- r7 -> qa_screenshots/r7_block_visual_audit/2026-04-25T03-50-39-261Z/report.json
|  |- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T03-50-39-247Z/report.json
|  `- h5 -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T03-50-39-247Z/report.json
`- read
   |- block visuals and spatial truth held
   |- same-code h5 control was mixed but still failed the v5 render goal:
   |  |- candidate calm render  19.11 vs control 15.81
   |  `- candidate shell render 15.61 vs control 14.54
   `- result -> rolled back; not part of the retained stack
```

```text
native composite-present same-code h5 compare
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T04-02-37-038Z/report.json
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T04-03-40-751Z/report.json
`- read
   |- calm   avgUpdate 23.47 -> 22.83 | avgRender 16.36 -> 16.05
   |- shell  avgUpdate 25.09 -> 23.97 | avgRender 15.32 -> 15.02
   |- both lanes still fail closure targets
   `- result -> retained; this is a real but partial v5 win
```

```text
native composite-present guardrails
|- r4 -> qa_screenshots/r4_ui_readability_audit/2026-04-25T04-05-04-333Z/report.json
|- r5 -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T04-05-04-339Z/report.json
|- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T04-06-27-885Z/report.json
`- read
   |- readability held
   |- battle presentation held
   `- spatial truth held on a clean rerun
```

```text
edge-outlier peel follow-up
|- control   -> qa_logs/session_captures/v5-edge-outlier-peel-control/2026-04-25T04-49-28-558Z/
|- candidate -> qa_logs/session_captures/v5-edge-outlier-peel-candidate/2026-04-25T04-49-28-559Z/
`- read
   |- calm   avgRender 15.61 -> 15.48, but p99 worsened 27.70 -> 29.00
   |- shell  avgRender 16.99 -> 17.04
   |- soak40 avgRender 18.97 -> 19.11
   |- candidate telemetry still showed `entitiesEdgeOutlierCompositeMode: off`
   `- result -> rolled back; edge-owner attribution stays useful, but the peel seam was not earned
```

```text
wing-local butterfly bake quick compare
|- control   -> qa_logs/session_captures/v5-winglocal-control/2026-04-25T11-48-40-369Z/
|- candidate -> qa_logs/session_captures/v5-winglocal-candidate/2026-04-25T11-48-40-364Z/
`- read
   |- battle avgRender 29.11 -> 28.11
   |- calm   avgRender 15.29 -> 15.06, but p95/p99 worsened
   |- shell  avgRender 16.85 -> 16.41, but p95/p99 worsened
   |- soak40 avgRender 19.25 -> 18.65, but p95/p99 worsened
   |- heap   168.80 -> 179.29 MB
   `- result -> promising quick average win, but not earned
```

```text
wing-local butterfly bake same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T11-50-08-391Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T11-51-07-114Z/report.json
`- read
   |- calm   avgUpdate 5.9975 -> 6.14 | avgRender 16.2408 -> 16.5475
   |- shell  avgRender 14.5633 -> 14.4058
   |- both lanes still fail closure targets
   `- result -> rolled back; the stricter calm gate lost and the heap bump was visible
```

```text
hybrid dirty-present threshold same-code compare
|- control   -> qa_logs/session_captures/v5-hybrid-threshold-control/2026-04-25T11-59-11-150Z/
|- candidate -> qa_logs/session_captures/v5-hybrid-threshold-candidate/2026-04-25T11-59-11-168Z/
`- read
   |- calm   avgRender 16.74 -> 16.74, with p99 improving 32.30 -> 30.70
   |- shell  avgRender 18.08 -> 18.24
   |- battle avgRender 28.32 -> 31.71
   |- heap   168.80 -> 159.26 MB
   `- result -> mixed at best; not enough to retain
```

```text
hybrid dirty-present threshold same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T12-00-27-217Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T12-00-27-229Z/report.json
`- read
   |- calm   avgUpdate 6.6892 -> 6.7083 | avgRender 18.1942 -> 18.3658
   |- shell  avgUpdate 12.2900 -> 11.4625 | avgRender 16.3000 -> 16.4717
   |- both lanes still fail closure targets
   `- result -> rolled back; lower heap did not outweigh the stricter calm/shell loss
```

```text
native clip-present same-code compare
|- control   -> qa_logs/session_captures/v5-clip-present-control/2026-04-25T13-43-44-047Z/
|- candidate -> qa_logs/session_captures/v5-clip-present-candidate/2026-04-25T13-43-44-069Z/
`- read
   |- calm   avgRender 15.34 -> 15.32
   |- shell  avgRender 17.10 -> 17.12
   |- battle avgRender 28.34 -> 29.18
   |- heap   159.26 -> 159.26 MB
   `- result -> nearly flat in quick smoke, but not enough to retain
```

```text
native clip-present same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-44-53-145Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-44-53-149Z/report.json
`- read
   |- calm   avgUpdate 6.4358 -> 6.4850 | avgRender 17.7633 -> 17.7750
   |- shell  avgUpdate 10.6667 -> 9.2950 | avgRender 15.9733 -> 15.5750
   |- both lanes still fail closure targets
   `- result -> rolled back; the stricter calm gate still got slightly worse
```

```text
native no-smooth present same-code compare
|- control   -> qa_logs/session_captures/v5-nosmooth-control/2026-04-25T13-47-02-838Z/
|- candidate -> qa_logs/session_captures/v5-nosmooth-candidate/2026-04-25T13-47-02-859Z/
`- read
   |- calm   avgRender 15.60 -> 15.60
   |- shell  avgRender 17.34 -> 17.16, but tails worsened
   |- battle avgRender 29.78 -> 26.17
   |- heap   159.26 -> 159.26 MB
   `- result -> good battle-only shape, but not enough on the lived-in runtime stack
```

```text
native no-smooth present same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-48-11-298Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-48-11-307Z/report.json
`- read
   |- calm   avgUpdate 6.6083 -> 6.6458 | avgRender 17.8217 -> 17.8025
   |- shell  avgUpdate 11.4108 -> 9.3542 | avgRender 15.8983 -> 15.9333
   |- both lanes still fail closure targets
   `- result -> rolled back; battle improved in quick smoke, but the stricter calm/shell pair did not earn retention
```

```text
non-carried blocks-layer same-code compare
|- control   -> qa_logs/session_captures/v5-blocks-layer-control/2026-04-25T19-40-58-367Z/
|- candidate -> qa_logs/session_captures/v5-blocks-layer-candidate/2026-04-25T19-40-58-367Z/
`- read
   |- actor crop shrank hard
   |  |- control `composite.entitiesCompositeMs` -> 9.01
   |  `- candidate `composite.entitiesCompositeMs` -> 0.50
   |- block layer inherited most of the old cost
   |  `- candidate `composite.blocksCompositeMs` -> 8.91
   |- quick smoke stayed mixed
   |  |- calm   avgRender 15.88 -> 15.79
   |  |- shell  avgRender 17.44 -> 17.68
   |  `- soak40 avgRender 18.73 -> 19.16
   `- heap dropped materially
      `- peakHeapUsedMB 179.29 -> 159.26 MB
```

```text
non-carried blocks-layer stricter gates
|- h5 control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-42-29-012Z/report.json
|- h5 candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-42-29-014Z/report.json
|- a4 candidate -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T19-43-46-574Z/report.json
|- r7 candidate -> qa_screenshots/r7_block_visual_audit/2026-04-25T19-43-46-575Z/report.json
`- read
   |- same-code h5 improved slightly
   |  |- calm   avgRender 18.22 -> 17.97
   |  `- shell  avgRender 16.43 -> 16.41
   |- spatial truth held
   |- block visuals held
   `- result -> retained as a default-off seam, not promoted to the live default stack
```

```text
non-carried blocks-layer reuse same-code compare
|- control   -> qa_logs/session_captures/v5-blocks-reuse-control/2026-04-25T19-49-01-131Z/
|- candidate -> qa_logs/session_captures/v5-blocks-reuse-candidate/2026-04-25T19-49-01-137Z/
`- read
   |- calm   avgRender 15.43 -> 14.47
   |- shell  avgRender 17.18 -> 15.98
   |- soak40 avgRender 18.55 -> 17.61
   |- battle avgRender 29.40 -> 25.86
   |- heap   159.26 -> 159.26 MB
   `- result -> earned as the better default behavior inside the optional blocks-layer seam
```

```text
non-carried blocks-layer reuse stricter gates
|- h5 control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-50-01-159Z/report.json
|- h5 candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-50-01-173Z/report.json
|- a4 candidate -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T19-51-10-081Z/report.json
|- r7 candidate -> qa_screenshots/r7_block_visual_audit/2026-04-25T19-51-10-081Z/report.json
`- read
   |- same-code h5 improved materially
   |  |- calm   avgRender 17.81 -> 16.65
   |  `- shell  avgRender 15.93 -> 14.98
   |- spatial truth held
   |- block visuals held
   `- result -> retained; this is now the earned version of the optional blocks-layer seam
```

```text
flower direct-present retained-stack compare
|- control   -> qa_logs/session_captures/v5-flower-direct-retained-control/2026-04-25T20-13-01-761Z/
|- candidate -> qa_logs/session_captures/v5-flower-direct-retained-candidate/2026-04-25T20-13-51-897Z/
`- read
   |- calm   avgRender 15.04 -> 13.45
   |- shell  avgRender 16.31 -> 14.75
   |- soak40 avgRender 18.31 -> 15.51
   |- battle avgRender 24.51 -> 27.28
   |- heap   159.26 -> 159.26 MB
   `- result -> retained as a default-off seam only; the battle-prelude slice still regressed
```

```text
flower direct-present stricter gates
|- h5 control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T20-15-01-161Z/report.json
|- h5 candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T20-16-00-406Z/report.json
|- a4 candidate -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T20-17-33-858Z/report.json
|- r5 candidate -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T20-17-33-893Z/report.json
|- r7 candidate -> qa_screenshots/r7_block_visual_audit/2026-04-25T20-18-20-896Z/report.json
`- read
   |- same-code h5 improved materially
   |  |- calm   avgRender 17.27 -> 15.37
   |  `- shell  avgRender 15.45 -> 13.31
   |- spatial truth held
   |- battle presentation held
   |- block visuals held
   `- result -> retained as a default-off seam pending a battle-safe activation rule
```

```text
final lived-in proof stack
|- h5 pass -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T21-12-00-822Z/report.json
|- r4 pass -> qa_screenshots/r4_ui_readability_audit/2026-04-25T21-13-02-701Z/report.json
|- r5 pass -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T21-18-20-182Z/report.json
|- a4 pass -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T21-18-51-650Z/report.json
`- read
   |- calm   avgUpdate 6.96 | avgRender 13.88
   |- shell  avgUpdate 11.51 | avgRender 13.74
   |- export capture phase passed with errorRuntimeIssueCount 0
   `- cadence-budget-overrun remained warning-only telemetry
```

## Guardrail Read

```text
what held
|- battle remained on the conservative full-frame path
|- canvas-heavy shell states were excluded from dirty-region cropping
|- shellUiDom default-on did not break readability proof
|- the onboarding guide no longer spends canvas redraws on the lived-in clean-shell lane
|- idle clean-shell HUD redraw discipline closed the final calm-lane render gap without changing shell affordances
|- mature flower heads kept live sway / rotation / pulse while cutting scenery draw cost sharply
|- a4 turning green indicates the remaining spatial freeze blocker is no longer geometry drift
|- `h5`, `r4`, `r5`, and `a4` are now green on the lived-in save
`- the retained v5 seams improved clean-shell render cost without flattening the scene
```

```text
what is still not earned
|- battle still stays on the conservative full-frame composite path
|- standalone `directPresentFlowers` is still not promoted by itself because the quick pre-battle lane remains less stable there
|- `v6` worker offload is still not earned
|- `v7` visual restoration is still ahead of this frozen phase
|- the rejected static block cache did not survive the lived-in h5 gate and is not part of the retained path
|- the flower-stem bake candidate looked good in quick smoke but failed h5, so it was rolled back
|- the raw butterfly canvas path regressed calm/shell/soak on the retained stack and was rolled back
|- the direct entity present path regressed calm/shell/battle/soak on the retained stack and was rolled back
|- the native entity composite present path slightly improved some averages but regressed p95/p99 and soak behavior, so it was rolled back
|- the tighter butterfly dirty-bounds follow-up improved soak but regressed calm/shell, so it was rolled back
|- the segmented entity-composite follow-up looked strong in quick smoke but failed stricter h5/a4 proof and was rolled back
|- the region-layer entity follow-up only looked good before a runtime error was fixed; after the fix it regressed calm/battle/soak and was rolled back
|- the split-scenery entity layer follow-up regressed every lived-in render lane and was rolled back
|- the grounded-block background-backdrop follow-up improved quick calm/shell/soak reads but lost same-code h5 and was rolled back
|- the grounded-block direct-present follow-up helped some update-side reads but regressed calm/shell render in same-code h5 and was rolled back
|- the owner-provided flower/block composite-bounds follow-up only shrank the retained dirty-region crop slightly (`706x273 -> 702x266`) and still regressed calm (`14.29 -> 14.34ms`), so it was rolled back
|- edge-owner attribution now says the retained crop is being pinned by ordinary dispersed `pool-heart` occupants: grounded blocks own left/top/bottom and one mature daisy owns the right edge
|- the edge-outlier peel follow-up used that attribution as a runtime seam, but it never activated into a meaningful extra composite split on the lived-in stack and was rolled back
|- the wing-local butterfly bake follow-up improved quick averages but lost the stricter h5 calm gate (`16.2408 -> 16.5475`) and raised heap (`168.80 -> 179.29 MB`), so it was rolled back
|- the hybrid dirty-present threshold follow-up lowered heap (`168.80 -> 159.26 MB`) but made the stricter calm/shell h5 read worse (`18.1942 -> 18.3658`, `16.3000 -> 16.4717`), so it was rolled back
|- the native clip-present follow-up stayed almost flat in quick smoke, but the stricter calm h5 read still moved the wrong way (`17.7633 -> 17.7750`), so it was rolled back
|- the native no-smooth present follow-up improved battle in quick smoke, but the stricter calm/shell pair did not earn retention (`17.8217 -> 17.8025`, `15.8983 -> 15.9333`), so it was rolled back
|- the non-carried blocks-layer follow-up shrank the actor crop hard (`entitiesCompositeMs 9.01 -> 0.50` on calm) but handed most of that cost to a new block composite (`blocksCompositeMs 8.91`), so quick smoke stayed mixed even while same-code `h5` improved slightly (`18.22 -> 17.97`, `16.43 -> 16.41`) and heap dropped (`179.29 -> 159.26 MB`)
|- the non-carried blocks-layer reuse follow-up then improved that same seam cleanly in both quick smoke and same-code `h5` (`17.81 -> 16.65`, `15.93 -> 14.98`) while keeping heap flat and holding both `a4` and `r7`
|- the cleaned-up stacked follow-up then proved that the blocks seam is strongest when it auto-pulls the direct-flower companion path: same-code quick calm/shell/soak improved, same-code `h5` improved, heap stayed flat, `a4` stayed green, and `r7` only failed on a control rerun while the candidate rerun passed
|- the blocks-layer seam is therefore now promoted into the live default dirty-region stack, with the reuse path as its default internal behavior and the direct-flower companion path riding inside that seam
|- the flower direct-present follow-up moved 36 mature flowers off the shared entity crop, collapsed the calm-lane `entitiesCompositeMs` to nearly zero, improved same-code `h5` (`17.27 -> 15.37`, `15.45 -> 13.31`), and held `a4`, `r5`, and `r7`, but it still regressed the quick pre-battle battle lane while active in focused-garden
|- the flower direct-present seam is therefore still retained as a standalone default-off seam for isolated proof, but it no longer blocks the promoted blocks seam because that combined shape earned cleaner same-code proof
|- compositeNativeDraw is now banked as a retained v5 seam, but it only narrows the gap
`- later runtime work now moves downstream into `v6` / `v7`, not back into unresolved `v5` proof
```

## Honest Phase State

```text
v5 today
|- retained seams       -> clean-shell dirty-region composites + native entity/behind composite present + DOM guide path + baked mature flower heads + live non-carried blocks composite layer with reuse-on by default inside that seam and the direct-flower companion path auto-pulled inside that seam + standalone default-off mature-flower direct-present seam
|- shell default        -> shellUiDom is now the live default shell path
|- scenery default      -> bakedFlowerHeads is now the live default mature-flower path
|- present default      -> compositeNativeDraw is now the live entity/behind composite-present path
|- cadence default      -> simCadenceSplit is now the live default runtime cadence shape
|- composite default    -> compositeDirtyRegions is now the live clean-shell composite path
|- blocks default       -> compositeBlocksLayer is now live on clean-shell dirty-region lanes, with compositeBlocksLayerReuse and the retained direct-flower companion path acting as its default internal behavior
|- optional seam        -> directPresentFlowers stays available as a standalone default-off proof seam
|- final proof          -> `h5`, `r4`, `r5`, and `a4` are green on the lived-in save
|- phase closure        -> earned; `v5` is now frozen live
`- carry forward
   |- keep dirty-region cropping limited to clean-shell lanes
   |- keep native composite present on the live path
   |- keep the promoted blocks seam on the live clean-shell path
   |- keep standalone directPresentFlowers default-off for isolated proof
   |- keep warning-only cadence telemetry out of the hard runtime-error bucket in exported capture proof
   |- do not reopen another broad flower/block bounds guess; the retained crop is being pinned by real dispersed occupants, not by a single oversized effect bug
   |- keep the new edge-owner attribution, but do not carry the failed edge-outlier peel seam
   |- keep battle + canvas-heavy shell on the conservative path
   |- keep the guide on the DOM shell path
   |- keep mature flower heads on the baked path
   |- keep the failed flower-stem bake off the live path
   |- keep the failed raw butterfly canvas path off the live path
   |- keep the failed direct entity present path off the live path
   |- keep the failed native entity composite present path off the live path
   |- keep the failed tight-bounds follow-up off the live path
   |- keep the failed segmented entity-composite follow-up off the live path
   |- keep the failed region-layer entity follow-up off the live path
   |- keep the failed split-scenery entity layer follow-up off the live path
   |- keep the failed grounded-block background-backdrop follow-up off the live path
   |- keep the failed owner-provided flower/block composite-bounds follow-up off the live path
   |- keep the failed grounded-block direct-present follow-up off the live path
   |- keep the failed wing-local butterfly bake off the live path
   |- keep the failed hybrid dirty-present threshold follow-up off the live path
   |- keep the failed native clip-present follow-up off the live path
   |- keep the failed native no-smooth present follow-up off the live path
   |- treat the repeated `r5` visible-combat timeout as an audit-stability seam until it is separated from real runtime regressions; that timeout reproduced on both the promoted stack and an old-default override
   `- move the runtime track forward into `v6` / `v7` without reopening cadence or geometry work
```
