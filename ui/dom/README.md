# Shell DOM Panels

```text
v1 shell-ui separation
├─ feedPanel.js     -> live DOM slice
├─ accessPanel.js   -> live DOM slice
├─ inspectPanel.js  -> live DOM slice
├─ journalPanel.js  -> live DOM slice
├─ debugPanel.js    -> live DOM slice
├─ guidePanel.js    -> live DOM onboarding/quick-start slice
└─ shellOverlay.js  -> root overlay manager and action bridge
```

Rules:
- panels render presentation only; `gameUI` remains the owner of shell state
- `debugUI` remains the owner of debug state and debug actions
- panel actions dispatch through `eventBus` as `ui:domAction`
- canvas buttons and garden input stay owned by `gameUI` / the canvas path
- the top HUD button bar and save/capture pills remain canvas-owned; a DOM HUD branch was tested and reverted during `v1`
- `Feed`, `Access`, `Inspect`, and `Journal` now render through this path when `performance.flags.shellUiDom` is enabled
- `Debug` now routes its dock/status/actions through this shell while leaving true world overlays on the canvas debug layer
- the first-session quick-start guide now rides this shell too, so lived-in clean-shell lanes stop paying a canvas redraw tax for onboarding presentation
