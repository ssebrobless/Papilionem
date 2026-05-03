# B7 Evidence Lock - Player-Facing Why Legibility

Date: 2026-05-03

## Phase Shape

```
╔════════════════════════════════════════════════════════════╗
║ B7: Player-facing "why" legibility                         ║
╠══════════════════════╦═════════════════════════════════════╣
║ Inspect panel        ║ Why This Moment names feeling + ID  ║
║ Feed data            ║ Memory-backed entries get causeLabel║
║ DOM/canvas feed      ║ Cause labels survive both surfaces  ║
║ Audits               ║ Coverage now measured directly      ║
╚══════════════════════╩═════════════════════════════════════╝
```

## Source Changes

- `core/config.js`
  - Added `gameConfig.expression.causeLabel` with default-enabled rollback flag.
- `systems/communicationSystem.js`
  - Dialogue records that reference memory packets now carry `causeLabel`.
  - Feed entries expose `referencedMemoryPacketId`, `causeLabel`, and supporting metadata.
  - Cause labels are capped at 24 characters and cooled down per source/packet.
- `ui/gameUI.js`
  - Inspect `Why This Moment` now includes strongest feeling plus packet ID when packet-backed cognition is active.
  - Feed DOM/canvas state preserves `causeLabel`.
  - Canvas feed cards render cause labels as a compact detail line.
- `ui/dom/feedPanel.js`
  - DOM feed cards render packet cause labels.
- `scripts/run-r-expression-naturalness-audit.js`
  - Added direct assertions for inspect strongest-feeling packet coverage and feed cause-label coverage.
- `scripts/run-r-feed-thread-audit.js`
  - Added seeded memory-backed dialogue and a feed-thread cause-label assertion.

## Proofs

| Proof | Result | Report |
| --- | --- | --- |
| `node scripts/run-r-expression-naturalness-audit.js` | pass | `qa_screenshots/r_expression_naturalness_audit/2026-05-03T14-23-43-335Z/report.json` |
| `node scripts/run-r-feed-thread-audit.js` | pass | `qa_screenshots/r_feed_thread_audit/2026-05-03T14-23-54-685Z/report.json` |
| `node scripts/run-r4-ui-readability-audit.js` | pass | `qa_screenshots/r4_ui_readability_audit/2026-05-03T14-24-13-951Z/report.json` |
| `node scripts/run-r-ui-parity-audit.js` | pass | `qa_screenshots/r_ui_parity_audit/2026-05-03T14-24-13-966Z/report.json` |
| `node scripts/run-g0h-scripted-playthrough.js` | pass, 13/13 | `qa_logs/g0h_scripted_playthrough/2026-05-03T14-25-08-244Z/report.json` |

## Key Observations

- Expression audit observed 8 packet-backed feed entries; all 8 carried a `causeLabel`.
- Inspect strongest-feeling packet coverage was 1.0, above the required 0.8.
- Dialogue repetition remained 0 and distinct template count stayed 8.
- Feed-thread audit confirmed a grouped social thread retained `referencedMemoryPacketId` and `causeLabel`.
- Full G0H remained honest-green at 13/13 lanes.

## Rollback

Set `gameConfig.expression.causeLabel.enabled = false` to suppress cause-label display without changing stored cognition, dialogue memory packets, or save schema.

## Status

B7 is closed. Proceed to B8 no-code evidence sweep.
