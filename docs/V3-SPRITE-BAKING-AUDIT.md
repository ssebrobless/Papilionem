# V3 Sprite Baking Audit

```text
v3 high-resolution creature sprite baking
|- sprite cache contract          -> live
|- perceptual parity proof        -> pass
|- wing/cocoon baked slice        -> live
|- battle-only forewing pose bake -> live behind flag with reduced pose buckets, mixed-positive
|- reopened-on-v5 follow-ups      -> tried, failed calm/shell proof, rolled back
|- body/antenna/caterpillar bake  -> helper groundwork only; runtime rollout not kept
|- atlas source contract          -> live
|- atlas proof slice              -> pass for parity, mixed-negative for runtime
|- body/antenna proof slice       -> pass for parity, mixed-negative for runtime
|- UI/battle visual audits        -> pass
`- closure state                  -> live
```

## Intent Held

- restore sharper creature rendering without reopening the freeze path
- bank render wins through reusable creature surfaces, not by degrading visuals
- keep flap, tilt, sway, and other expressive motion live
- preserve the option to finish a better source path inside `v3`

## What Landed

```text
current v3 slice
|- core/spriteManager.js
|  |- LRU baked-surface cache
|  |- stable baked-entry reuse (no per-wing metadata churn)
|  |- alpha-bounds precomputation during initialize
|  |- trimmed wing-piece bake path
|  |- explicit baked wing anchor metadata for raw-trimmed and atlas-backed sources
|  |- battle-only forewing pose-bake helper retained behind the bakedCreatureSprites flag
|  `- dormant body/antenna/caterpillar helper groundwork retained for later proof
|- entities/butterfly.js
|  `- baked wing-piece reuse stays live; battle-only forewing pose bake is retained as the latest targeted slice; body + antenna stay raw for parity
|- entities/flower.js
|  `- baked cocoon reuse stays live
|- entities/caterpillar.js
|  `- reverted to raw path until a higher-fidelity bake path exists
|- ui/butterflyCollection.js
|  `- preview path matches the narrowed wing-only baked slice; battle-only pose bake does not expand into collection previews
|- ui/gameUI.js
|  `- battle-hidden collection/journal draw is now suppressed, so the retained pose-bake proof is not paying canvas cost for a panel battle is already hiding
`- scripts/run-v3-sprite-parity-audit.js
   `- perceptual parity gate + side-by-side proof, including spriteAtlas-on coverage and the battle-only pose-bake fallback shape
```

## Evidence

- perceptual parity pass:
  [2026-04-23T07-59-23-686Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T07-59-23-686Z/report.json)
- latest quick lived-in smoke:
  [2026-04-23T08-02-25-046Z](../qa_logs/session_captures/v3-sprite-baking-smoke-current/2026-04-23T08-02-25-046Z)
- quick diff vs frozen post-`s3` quick baseline:
  [diff-vs-post-s3-quick-baseline.md](../qa_logs/session_captures/v3-sprite-baking-smoke-current/2026-04-23T08-02-25-046Z/diff-vs-post-s3-quick-baseline.md)
- atlas-on parity pass:
  [2026-04-23T12-15-16-125Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T12-15-16-125Z/report.json)
- atlas-on quick lived-in smoke:
  [2026-04-23T12-15-26-599Z](../qa_logs/session_captures/v3-sprite-baking-smoke-atlas/2026-04-23T12-15-26-599Z)
- atlas-on diff vs frozen post-`s3` quick baseline:
  [diff-vs-post-s3-quick-baseline.md](../qa_logs/session_captures/v3-sprite-baking-smoke-atlas/2026-04-23T12-15-26-599Z/diff-vs-post-s3-quick-baseline.md)
- atlas-on diff vs current narrowed `v3` slice:
  [diff-vs-current-v3-slice.md](../qa_logs/session_captures/v3-sprite-baking-smoke-atlas/2026-04-23T12-15-26-599Z/diff-vs-current-v3-slice.md)
- body/antenna helper parity pass before rollback:
  [2026-04-23T16-59-37-186Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T16-59-37-186Z/report.json)
- body/antenna helper quick lived-in smoke before rollback:
  [2026-04-23T16-57-14-063Z](../qa_logs/session_captures/v3-sprite-baking-smoke-antenna-bucketed/2026-04-23T16-57-14-063Z)
- body/antenna helper diff vs current narrowed `v3` slice:
  [diff-vs-current-v3-slice.md](../qa_logs/session_captures/v3-sprite-baking-smoke-antenna-bucketed/2026-04-23T16-57-14-063Z/diff-vs-current-v3-slice.md)
- cache-attribution lived-in smoke subset (`calm,shell,battle`):
  [2026-04-23T17-19-29-691Z](../qa_logs/session_captures/v3-cache-attribution-smoke/2026-04-23T17-19-29-691Z)
- battle-only forewing pose parity pass:
  [2026-04-23T18-32-09-076Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T18-32-09-076Z/report.json)
- battle-only forewing pose quick lived-in smoke:
  [2026-04-23T18-32-08-971Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly/2026-04-23T18-32-08-971Z)
- battle-only forewing pose diff vs current narrowed `v3` slice:
  [diff-vs-current-v3-slice.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly/2026-04-23T18-32-08-971Z/diff-vs-current-v3-slice.md)
- battle-only forewing pose diff vs frozen post-`s3` quick baseline:
  [diff-vs-post-s3-quick-baseline.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly/2026-04-23T18-32-08-971Z/diff-vs-post-s3-quick-baseline.md)
- no-flag control smoke on the same lived-in lanes:
  [2026-04-23T20-26-07-521Z](../qa_logs/session_captures/v3-control-no-flag/2026-04-23T20-26-07-521Z)
- battle-only forewing pose diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-fastgate/2026-04-23T20-23-21-866Z/diff-vs-no-flag-control.md)
- reopened v3 slice on top of retained v5:
  [2026-04-25T00-05-54-611Z](../qa_logs/session_captures/v3-on-v5-retained-candidate/2026-04-25T00-05-54-611Z)
- reopened v3 slice diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-on-v5-retained-candidate/2026-04-25T00-05-54-611Z/diff-vs-no-flag-control.md)
- battle-only baked reopen on retained v5:
  [2026-04-25T00-08-35-332Z](../qa_logs/session_captures/v3-battle-only-on-v5-candidate/2026-04-25T00-08-35-332Z)
- battle-only baked reopen diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-battle-only-on-v5-candidate/2026-04-25T00-08-35-332Z/diff-vs-no-flag-control.md)
- reduced-pose-bucket parity pass:
  [2026-04-23T22-35-53-210Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T22-35-53-210Z/report.json)
- reduced-pose-bucket quick lived-in smoke:
  [2026-04-23T22-35-53-145Z](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16/2026-04-23T22-35-53-145Z)
- reduced-pose-bucket diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16/2026-04-23T22-35-53-145Z/diff-vs-no-flag-control.md)
- reduced-pose-bucket diff vs retained fastgate slice:
  [diff-vs-retained-fastgate.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16/2026-04-23T22-35-53-145Z/diff-vs-retained-fastgate.md)
- post-battle-shell suppression parity pass:
  [2026-04-23T23-10-47-003Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T23-10-47-003Z/report.json)
- post-battle-shell suppression no-flag control:
  [2026-04-23T23-07-09-553Z](../qa_logs/session_captures/v3-control-no-flag-post-journalfix/2026-04-23T23-07-09-553Z)
- post-battle-shell suppression retained slice:
  [2026-04-23T23-08-13-173Z](../qa_logs/session_captures/v3-posebucket16-post-journalfix/2026-04-23T23-08-13-173Z)
- post-battle-shell suppression diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-posebucket16-post-journalfix/2026-04-23T23-08-13-173Z/diff-vs-no-flag-control.md)
- battle-entry prewarm smoke before rollback:
  [2026-04-23T22-58-39-295Z](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16-prewarm/2026-04-23T22-58-39-295Z)
- battle-entry prewarm diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16-prewarm/2026-04-23T22-58-39-295Z/diff-vs-no-flag-control.md)
- battle-entry prewarm diff vs retained reduced-bucket slice:
  [diff-vs-posebucket16.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16-prewarm/2026-04-23T22-58-39-295Z/diff-vs-posebucket16.md)
- source-key compaction no-flag control:
  [2026-04-23T22-24-04-406Z](../qa_logs/session_captures/v3-control-no-flag-keycompact/2026-04-23T22-24-04-406Z)
- source-key compaction flag-on smoke:
  [2026-04-23T22-25-09-394Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-keycompact/2026-04-23T22-25-09-394Z)
- source-key compaction diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-keycompact/2026-04-23T22-25-09-394Z/diff-vs-no-flag-control.md)
- wing-pose family cap (`16`) smoke:
  [2026-04-23T22-28-06-759Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap16/2026-04-23T22-28-06-759Z)
- wing-pose family cap (`16`) diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap16/2026-04-23T22-28-06-759Z/diff-vs-no-flag-control.md)
- wing-pose family cap (`20`) smoke:
  [2026-04-23T22-29-25-443Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap20/2026-04-23T22-29-25-443Z)
- wing-pose family cap (`20`) diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap20/2026-04-23T22-29-25-443Z/diff-vs-no-flag-control.md)
- readability audit with `bakedCreatureSprites` enabled:
  [report.json](../qa_screenshots/r4_ui_readability_audit/2026-04-23T07-59-42-656Z/report.json)
- battle presentation audit with `bakedCreatureSprites` enabled:
  [report.json](../qa_screenshots/r5_battle_presentation_audit/2026-04-23T18-34-04-072Z/report.json)

Key quick-smoke deltas against the frozen post-`s3` quick baseline:

```text
current narrowed v3 slice
|- calm    25.35 -> 24.65   (-2.8%)
|- shell   30.82 -> 29.94   (-2.8%)
|- travel  33.94 -> 33.07   (-2.6%)
|- battle  44.91 -> 39.94   (-11.1%)
|- soak40  27.76 -> 28.25   (+1.8%)
`- heap   124.93 -> 159.26 MB (+27.5%)
```

Atlas-on deltas against the current narrowed `v3` slice:

```text
atlas vs current v3
|- parity      25/25 pass, max perceptual diff 0.06882, max bbox drift 1px
|- heap        unchanged at 159.26 MB
|- battle      avgRender 39.94 -> 41.98 (+5.1%)
|- calm        avgRender 24.65 -> 26.11 (+5.9%)
|- shell       avgRender 29.94 -> 31.06 (+3.7%)
|- travel      avgRender 33.07 -> 33.68 (+1.9%)
`- soak40      avgRender 28.25 -> 27.31 (-3.3%)
```

Body/antenna helper slice before rollback:

```text
body/antenna helper vs current v3
|- parity      25/25 pass after rollback-tightening to raw body + raw caterpillar
|- heap        unchanged at 159.26 MB
|- battle      avgRender 39.94 -> 45.56 (+14.1%)
|- calm        avgRender 24.65 -> 31.96 (+29.7%)
|- shell       avgRender 29.94 -> 36.60 (+22.2%)
|- travel      avgRender 33.07 -> 39.04 (+18.1%)
`- soak40      avgRender 28.25 -> 31.72 (+12.3%)
```

Cache-attribution slice on the current narrowed `v3` path:

```text
cache attribution
|- lanes       calm / shell / battle (subset smoke via run-v0-baseline --lanes=...)
|- calm        68 entries | 0.02MB est surface | hits 4180 / misses 68
|- shell       72 entries | 0.03MB est surface | hits 5952 / misses 72
|- battle      116 entries | 0.05MB est surface | hits 14056 / misses 116
|- families    wing-trimmed only on the live narrowed slice
|- reuse       high hit ratio, no evictions, 17-29 unique live sizes
`- read        cache residency is not the dominant v3 memory blocker
```

Battle-only forewing pose slice against the current narrowed `v3` slice:

```text
battle-only forewing pose vs current v3
|- parity      25/25 pass on the retained normal-state proof
|- heap        unchanged at 159.26 MB
|- battle      avgRender 53.73 -> 40.36 (-24.9%)
|- calm        avgRender 25.40 -> 26.48 (+4.3%)
|- shell       avgRender 30.34 -> 29.59 (-2.5%)
`- soak40      avgRender 27.19 -> 27.28 (+0.3%)
```

Battle-only forewing pose slice against the frozen post-`s3` quick baseline:

```text
battle-only forewing pose vs post-s3 baseline
|- battle      avgRender 44.91 -> 40.36 (-10.1%)
|- calm        avgRender 25.35 -> 26.48 (+4.5%)
|- shell       avgRender 30.82 -> 29.59 (-4.0%)
|- soak40      avgRender 27.76 -> 27.28 (-1.7%)
`- heap        124.93 -> 159.26 MB (+27.5%)
```

Reopened `v3` attempts on top of the retained `v5` stack before rollback:

```text
reopened v3 on retained v5
|- full reopened slice
|  |- battle      improved
|  |- soak40      improved
|  |- calm        regressed
|  `- shell       regressed
|- battle-only baked reopen
|  |- calm        regressed
|  |- shell       regressed
|  |- battle      not strong enough to justify the regressions
|  `- result      rolled back
`- read           no reopened v3 path beat the retained v5 stack cleanly enough to keep
```

Retained battle-only forewing pose slice with reduced pose buckets against the same-run no-flag control:

```text
retained posebucket16 slice vs no-flag control
|- battle      avgRender 41.20 -> 39.94 (-3.1%)
|- calm        avgRender 27.23 -> 26.56 (-2.4%)
|- shell       avgRender 30.66 -> 29.53 (-3.7%)
|- soak40      avgRender 27.25 -> 26.34 (-3.3%)
|- heap        159.26 -> 159.26 MB (flat)
`- read        retained; this keeps the average render win while removing the extra heap bump over no-flag control
```

Retained posebucket16 slice against the earlier fastgate slice:

```text
posebucket16 vs earlier fastgate
|- battle      avgRender 39.60 -> 39.94 (+0.9%)
|- calm        avgRender 25.83 -> 26.56 (+2.8%)
|- shell       avgRender 29.62 -> 29.53 (-0.3%)
|- soak40      avgRender 26.06 -> 26.34 (+1.1%)
|- heap        168.80 -> 159.26 MB (-5.6%)
`- read        retained because the heap win is real and the average render trade is small enough to prefer over the older fastgate slice
```

Source-key compaction experiment before rollback:

```text
source-key compaction vs no-flag control
|- change       compacted wing-trimmed + wing-pose cache keys to true wing source identity
|- cache shape  unchanged in live battle smoke: 48 wing-trimmed + 24 wing-pose entries
|- battle       avgRender 41.20 -> 42.38 (+2.8%)
|- calm         avgRender 27.23 -> 26.68 (-2.0%)
|- shell        avgRender 30.66 -> 30.08 (-1.9%)
|- soak40       avgRender 27.25 -> 27.32 (+0.3%)
`- read         reverted; the compaction did not change live cache residency and did not beat the retained slice
```

Wing-pose family-cap experiments before rollback:

```text
family cap 16 vs no-flag control
|- change       hard cap on wing-pose family entries
|- cache shape  battle smoke fell to 16 wing-pose entries, but misses/evictions spiked hard
|- battle       avgRender 41.20 -> 46.10 (+11.9%)
|- heap         159.26 -> 159.26 MB (flat)
`- read         reverted; it traded away too much battle render to earn the heap win

family cap 20 vs no-flag control
|- change       softer hard cap on wing-pose family entries
|- battle       avgRender 41.20 -> 46.20 (+12.1%)
|- heap         159.26 -> 159.26 MB (flat)
`- read         reverted; same failure shape as cap 16
```

Battle-entry prewarm experiment before rollback:

```text
posebucket16 prewarm vs retained reduced-bucket slice
|- change       warmed battle forewing pose entries at battle-session start before view switch
|- heap         unchanged at 159.26 MB
|- battle       avgRender 39.94 -> 54.89 (+37.4%)
|- calm         avgRender 26.56 -> 39.42 (+48.4%)
|- shell        avgRender 29.53 -> 42.48 (+43.8%)
|- soak40       avgRender 26.34 -> 31.99 (+21.4%)
`- read         reverted; prewarming introduced a severe cross-lane regression and is not the next seam
```

Battle-hidden collection/journal suppression on the retained slice:

```text
post-journal suppression retained slice vs no-flag control
|- change       collection/journal update + draw are now skipped during battle, while panel visibility is preserved for return to garden
|- battle       avgRender 33.63 -> 31.89 (-5.2%)
|- battle       p95 93.50 -> 88.60 (-5.2%)
|- battle       p99 127.20 -> 122.50 (-3.7%)
|- calm         avgRender 29.72 -> 29.07 (-2.2%)
|- shell        avgRender 33.33 -> 32.35 (-2.9%)
|- soak40       avgRender 30.06 -> 28.99 (-3.6%)
|- heap         159.26 -> 159.26 MB (flat)
`- read         retained; this removed a real hidden battle shell cost and turned the retained reduced-bucket slice into a clean same-run win without visual drift
```

## Honest Read

```text
earned now
|- baked wing/cocoon surfaces preserve the look closely enough to pass perceptual parity
|- battle/calm/shell/travel render lanes improved on the lived-in smoke save for the current narrowed slice
|- player-facing readability and battle audits stay green with the flag enabled
|- atlas-backed source contract now exists and holds parity under spriteAtlas-on proof
|- body/antenna/caterpillar helper groundwork exists, but the first runtime rollout was tested and rolled back
|- cache-family attribution is live and proves the narrowed wing cache itself stays tiny and heavily reused on the lived-in smoke save
|- source-key compaction was tested and rolled back; it did not reduce live cache residency or beat the retained slice
|- wing-pose family caps were tested and rolled back; they erased the heap bump but degraded battle render too sharply
|- battle-entry prewarm was tested and rolled back; it regressed every lane badly even though heap stayed flat
|- the retained battle-only forewing pose slice now uses reduced pose buckets and stays ahead of the same-run no-flag control on average render without carrying an extra heap bump
|- the hidden battle collection/journal draw was removed, which turned the retained slice into a same-run win across battle/calm/shell/soak with parity still passing
|- the later `v3` reopen on top of the retained `v5` stack was tested twice and rolled back
|  |- full reopened slice -> battle and soak improved, but calm and shell regressed too sharply
|  `- battle-only butterfly gate -> still regressed calm/shell and did not earn a retained follow-up seam
`- v3 phase closure itself
   `- earned first as a retained default-off runtime slice, and later promoted live by `v7` once the broader runtime stack proved it could carry the restored visual state honestly

not earned yet
|- high-fidelity baked path for body + antenna + caterpillar
|- default-on or rollout closure for performance.flags.spriteAtlas
|  `- blocked because the first atlas-backed slice regressed calm/shell/travel/battle versus the current narrowed v3 slice while leaving heap unchanged
`- default-on or rollout closure for body/antenna/caterpillar helpers
   `- blocked because the first runtime rollout regressed every quick-smoke lane versus the current narrowed v3 slice
```

The current runtime evidence was strong enough to close `v3` first as a
retained runtime slice. After `v7` landed, the broader runtime stack finally
proved it could carry the restored creature state honestly, so
`bakedCreatureSprites` is now live by default. What remains open is not the
sharp-creature rollout itself; it is the later higher-fidelity body/antenna/
caterpillar path and the atlas-backed source path. `spriteAtlas` still stays
default-off until a later proof shows it can beat the live slice honestly.

## Carry Forward

```text
after v3 closure
|- keep bakedCreatureSprites live; `v7` has now promoted the sharp-creature path on the lived-in runtime stack
|- keep the retained reduced-bucket battle-only forewing pose slice as the banked v3 runtime shape
|- stop treating cache residency as the main blocker; the live wing cache stays tiny in the attribution slice
|- treat source-key compaction as explored and rejected for now; it did not change the live battle cache shape
|- treat wing-pose family caps as explored and rejected for now; they flattened heap but lost too much battle render
|- treat battle-entry prewarm as explored and rejected for now; it made every lane materially worse
|- carry broader runtime pressure and battle tail latency forward into v4/v5; they are no longer reasons to keep v3 itself open
|- keep spriteAtlas default-off; this first atlas-backed slice is still not the win
|- keep body/antenna/caterpillar rollout off the live path; the first runtime slice was proved and rolled back
|- treat the reopened `v3`-on-`v5` stack and the later battle-only butterfly gate as explored and rejected for now; neither beat the retained runtime stack where `h5` still matters
|- use the new explicit anchor contract if atlas work continues, so callers do not re-derive trim math
|- recover high-fidelity body/antenna/caterpillar baking only on a source path that beats the current narrowed slice
|- use the new lane-selector harness for targeted v3 smokes when travel flake would otherwise block calm/shell/battle evidence
|- treat wing-dimension quantization as explored and rejected for now; the first attempt broke parity and was rolled back
`- only then reopen either default-on decision honestly during later runtime restoration work
```
