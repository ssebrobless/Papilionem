# Playtest Checkpoint

```text
╔════════════════════ Playtest Flow ════════════════════╗
║ install      │ npm install                            ║
║ launch       │ npm run playtest                       ║
║ local url    │ http://127.0.0.1:3000/                 ║
║ debug toggle │ B                                      ║
║ audit preset │ debug panel -> Load Audit Preset       ║
║ full audit   │ debug panel -> Run Gameplay Audit      ║
╚═══════════════════════════════════════════════════════╝
```

## Recommended Pass Order

1. Title screen and normal garden startup.
2. Accessibility toggles:
   `A`, `M`, `T`, `G`, `H`, `S`
3. Debug audit presets:
   `Sleep Assist`, `Teaching Pair`, `Trust Cascade`, `Social Web`, `Hybrid Lineage`, `Nursery Lineage`
4. Roundtrip audit:
   `Save Game`, `Load Game`, `Verify Roundtrip`
5. Full gameplay audit:
   `Run Gameplay Audit`

## What To Watch

- Sleep transitions should look grounded and match debug truth.
- Teaching and social presets should build trust and routines gradually instead of snapping upward.
- Hybrid presets should show slower courtship and lifecycle pacing than the previous build.
- Battle readability should keep reduced-motion behavior when those accessibility toggles are enabled.
- The debug panel should stay readable while the battle HUD stays out of its way.

## Shareable Checkpoint

This milestone is shareable as a lightweight local-host playtest build:

- launch with `npm run playtest`
- share the host machine URL with testers
- use the built-in debug presets and gameplay audit tools for guided testing

## Related Checkpoints

- [milestone-freeze.md](/C:/Users/fishe/Documents/projects/ephemera/milestone-freeze.md)
- [qa_screenshots/final_e2e_audit_pass](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/final_e2e_audit_pass)
- [qa_screenshots/polish_pass](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/polish_pass)
