# Playtest Checkpoint

```text
+=============================================================+
| Playtest Flow                                               |
+=============================================================+
| install      | npm install                                  |
| launch       | npm run playtest                             |
| host url     | http://127.0.0.1:3000/                       |
| lan url      | http://<host-ip>:3000/                       |
| debug toggle | D                                            |
| boundary map | hold B                                       |
| audit preset | debug panel -> Load Audit Preset             |
| full audit   | debug panel -> Run Gameplay Audit            |
| export save  | debug panel -> Export Save                   |
| export log   | debug panel -> Start Capture / Export Capture|
+=============================================================+
```

## Recommended Pass Order

1. Title screen and normal garden startup.
2. Accessibility panel:
   use the `Access` button, then check high contrast, trails (`off` by
   default, with `reduced` / `full` available), atmosphere, and motion
   settings.
3. Debug audit presets:
   `Sleep Assist`, `Teaching Pair`, `Trust Cascade`, `Social Web`,
   `Hybrid Lineage`, `Nursery Lineage`
4. Roundtrip audit:
   `Save Game`, `Load Game`, `Verify Roundtrip`
5. Full gameplay audit:
   `Run Gameplay Audit`
6. Session capture for freeze/stutter review:
   `D` -> `Start Capture` -> play normally -> `Export Capture`
7. Long-running save retest:
   `D` -> `Export Save` -> run `node scripts/run-h5-long-running-save-smoothness-audit.js`

## Session Capture

Use session capture any time the game stutters, freezes, or behaves oddly over
a longer run.

```text
capture flow
|- open debug mode with `D`
|- click `Start Capture`
|- play normally until the issue happens or the session is done
|- click `Export Capture`
`- review the saved artifact folder
```

Exports land in:

- `qa_logs/session_captures/...`

Each export contains:

- `capture.json`
- `summary.txt`

The capture includes:

- runtime issues and important console failures
- update/render spikes
- focused-zone changes
- save/load events
- battle start/end events
- event-history and replay-marker context
- start/end world summaries

## Save Export

Use save export when you want the repo-side `h5` smoothness audit to load the
same lived-in world that you are playing in the browser.

```text
save export flow
|- open debug mode with `D`
|- click `Export Save`
|- note the saved folder path
`- use that export with the h5 audit script
```

Exports land in:

- `qa_logs/save_exports/...`

Each export contains:

- `save.json`
- `summary.txt`

Run the imported-save retest with either:

- `node scripts/run-h5-long-running-save-smoothness-audit.js`
- `node scripts/run-h5-long-running-save-smoothness-audit.js <path-to-save-or-export-folder>`

The `h5` audit covers:

- calm garden observation
- feed / inspect / journal shell use
- zone travel
- save / load continuity
- battle entry / exit
- session-capture export from the imported save

## What To Watch

- Sleep transitions should look grounded and match debug truth.
- Teaching and social presets should build trust and routines gradually instead
  of snapping upward.
- Hybrid presets should show slower courtship and lifecycle pacing than the
  previous build.
- Battle readability should keep reduced-motion behavior when those
  accessibility toggles are enabled.
- The debug panel should stay readable while the battle HUD stays out of its
  way.
- Long-running save retests should feel smoother without forcing a reset of the
  lived-in world.

## Shareable Checkpoint

This milestone is shareable as a lightweight local-host playtest build:

- launch with `npm run playtest`
- use `http://127.0.0.1:3000/` on the host machine
- use `http://<host-ip>:3000/` only when intentionally sharing to another
  device on the same local network
- use the built-in debug presets, gameplay audit tools, save export, and
  session capture export for guided testing

Current validated baseline:

- Node `18+`
- desktop Chromium-family browser

Broader browser/device support should be treated as an explicit playtest
question, not an implied promise.

Use the outside-tester lanes in
[docs/EXTERNAL-PLAYTEST-MATRIX.md](/C:/Users/fishe/Documents/projects/ephemera/docs/EXTERNAL-PLAYTEST-MATRIX.md)
when you start collecting multi-device or multi-browser evidence.
Copy actionable outside-session issues into
[docs/PLAYTEST-TRIAGE-LOG.md](/C:/Users/fishe/Documents/projects/ephemera/docs/PLAYTEST-TRIAGE-LOG.md)
so `R4` stays tied to real evidence.

## Related Checkpoints

- [milestone-freeze.md](/C:/Users/fishe/Documents/projects/ephemera/milestone-freeze.md)
- [qa_screenshots/final_e2e_audit_pass](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/final_e2e_audit_pass)
- [qa_screenshots/polish_pass](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/polish_pass)
