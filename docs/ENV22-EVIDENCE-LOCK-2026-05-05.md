# ENV22 Evidence Lock - Environmental Work Pressure Readiness

Date: 2026-05-05
Branch: `codex/milestone-freeze-playtest`

## Goal

Audit the current environmental systems against the user's intended direction:
fewer wild flowers, meaningful dirt piles, flowers and blocks occupying board
space, flower-to-block building material, and object-driven cooperation.

This phase includes one behavior fix: cleanup travel now uses intentional
cleanup speed instead of the slow base movement path.

## Shape

```
environment work loop
      |
      +-- flower cap / no training flowers ----------> spawn rebalance audit
      |
      +-- flower decay -> dirt pile -----------------> lifecycle audit
      |
      +-- dirt pile -> cleanup task -----------------> lived cleanup floor
      |
      +-- flower -> block material + pollen ---------> flower-to-block audit
      |
      +-- blocks / flowers / piles occupy cells -----> block + spawn audits
```

## Change

- `entities/butterfly.js`
  - Cleanup movement targets now use an intentional cleanup travel speed:
    `meander * (1.05 + objectInterest * 0.18)`.
  - This uses existing object-interest / cleanup affordance state. It does not
    add new drives, emotions, memory families, or social vocabulary.
- `scripts/run-r-flower-lifecycle-audit.js`
  - The older cleanup-floor lane now accepts any legal seed count `>= 6` while
    still requiring at least six cleaned piles. The old lane occasionally seeded
    seven legal piles because cell occupancy can reject one of the intended
    eight cells; cleaning 7/7 should not fail that lane.

## Why The Behavior Fix Was Needed

The flower lifecycle audit showed:

- old floor lane: cleaned all seeded piles, but failed when only seven legal
  cells were seeded
- organic cleanup lane: passed
- lived multi-zone cleanup lane: failed twice, cleaning `4/12` then `5/12`
  piles against the `>= 6/12` floor

The cleanup target acquisition existed, but cleanup movement used base speed.
After the speed change, the lived lane cleaned `10/12` piles without teleporting
or injected cleanup.

## Proofs

| Proof | Result | Report |
|---|---:|---|
| `node --check entities/butterfly.js` | pass | terminal |
| `node scripts/run-r-flower-lifecycle-audit.js` | pass | `qa_screenshots/r_flower_lifecycle_audit/2026-05-05T03-25-36-150Z/report.json` |
| `node scripts/run-environment-flower-spawn-rebalance-audit.js` | pass | `qa_screenshots/environment_flower_spawn_rebalance_audit/2026-05-05T03-27-14-491Z/report.json` |
| `node scripts/run-environment-flower-to-block-audit.js` | pass | `qa_screenshots/environment_flower_to_block_audit/2026-05-05T03-27-14-556Z/report.json` |
| `node scripts/run-r-block-cell-discipline-audit.js` | pass | `qa_screenshots/r_block_cell_discipline_audit/2026-05-05T03-27-14-491Z/report.json` |
| `node scripts/run-runtime-self-audit.js` | pass | `qa_screenshots/runtime_self_audit/report.json` |
| `node scripts/run-scenario.js seed-cleanup-floor-organic` | pass | `qa_screenshots/scenario/seed-cleanup-floor-organic/2026-05-05T03-28-15-412Z/report.json` |
| `node scripts/run-scenario.js seed-cleanup-status-loop` | pass | `qa_screenshots/scenario/seed-cleanup-status-loop/2026-05-05T03-29-07-052Z/report.json` |
| `node scripts/run-scenario.js seed-target-cleanup-priority` | pass | `qa_screenshots/scenario/seed-target-cleanup-priority/2026-05-05T03-28-05-419Z/report.json` |
| `node scripts/run-scenario.js seed-society-soak-organic` | pass | `qa_screenshots/scenario/seed-society-soak-organic/2026-05-05T03-28-05-698Z/report.json` |
| `node scripts/run-long-soak-society-audit.js --fixture scripts/scenario/scenarios/seed-society-soak-organic.json --skip-ml-comparison` | pass | `qa_logs/long_soak_society/2026-05-05T03-29-13-785Z/report.json` |
| `node scripts/run-scenario.js --all` | pass, 39/39 | starts at `qa_screenshots/scenario/seed-affection/2026-05-05T03-31-07-406Z/report.json` |

## Current Proven Environmental State

- Open-land natural flowers cap at five per zone.
- Training grounds cap normal flowers at zero.
- Dirt piles reduce natural flower pressure.
- Flowers decay into dirt piles after the configured one-minute window.
- Reserve food balls persist and are tagged as food reserve objects.
- Dirt piles can be cleaned by butterflies in lived multi-zone conditions.
- Flower-to-block conversion removes the flower, creates a legal block, grants
  one pollen charge, grants no food, costs exhaustion, records object memory,
  and rejects conversion in the training grounds.
- Block cell discipline stays green after the environmental work changes.

## Next Residual

The remaining gap is not "does the environment have objects?" It is "do those
objects create visible social coordination loops often enough in normal play?"

Best next phase:

1. Add or strengthen a pollen planting / pollen handoff lived audit.
2. Confirm pollen charges expire after the configured TTL.
3. Confirm planted pollen occupies a board cell until bloom.
4. Confirm flowers, dirt piles, and planted pollen all block each other's cells.
5. Add a social event or trace marker when one butterfly hands pollen to another
   and the recipient later plants it.

That should be proved before tuning ML around environmental choices.
