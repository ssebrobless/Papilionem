# Sprite Cache Contract

```text
v3 sprite cache
├─ source truth        -> spriteManager raw assets + butterfly render spec
├─ cache truth         -> reusable render-only baked surfaces
├─ gameplay truth      -> unchanged; never owned here
└─ active flag         -> performance.flags.bakedCreatureSprites
```

## Intent

- restore sharp butterflies, caterpillars, and cocoons without paying the full
  per-frame scale/composite cost every draw
- keep animation ownership in entity render code
- keep durable truth out of the cache entirely

## Appearance Key

```text
appearance key
├─ sex
├─ personalityType
├─ baseType
└─ wing donor signature
   ├─ foreLeft
   ├─ foreRight
   ├─ hindLeft
   └─ hindRight
```

Canonical form:

```text
sex=<sex>|personality=<personalityType>|base=<baseType>|wings=<wing-source-signature>
```

Wing-source signature uses:

```text
<wingKey>:<personalityType>:<sex>
```

For hybrids, donor wings own the signature. For non-hybrids, the butterfly's own
personality + sex own it.

## Cache Families

| Family | Owner | Key shape | Render ownership |
| --- | --- | --- | --- |
| butterfly body | `core/spriteManager.js` | `body|sex|<w>x<h>` | cached surface only |
| butterfly antenna | `core/spriteManager.js` | `antenna|sex|<w>x<h>` | cached surface only |
| butterfly wing piece | `core/spriteManager.js` | `wing|appearanceKey|wing-source|<w>x<h>` | cached surface only |
| caterpillar frame | `core/spriteManager.js` | `caterpillar|frame=<n>|<w>x<h>` | cached surface only |
| cocoon sprite | `core/spriteManager.js` | `cocoon|state|<w>x<h>` | cached surface only |

## Hard Boundaries

```text
cache may own
├─ baked p5.Graphics surfaces
├─ LRU eviction
└─ appearance-key lookup

cache may never own
├─ butterfly identity
├─ butterfly genetics / lineage
├─ relationships / memories / feelings
├─ live flap / tilt / sway state
└─ any save-persisted field
```

- `spriteManager` owns reusable baked render surfaces only.
- `entities/butterfly.js` still owns wing flap, wing tilt, antenna sway, alpha,
  trail timing, and battle/garden render context choices.
- `entities/caterpillar.js` and `entities/flower.js` still own lifecycle-stage
  presentation choices.
- `saveSystem` never persists baked cache entries.

## Cache Limits

```text
limit
└─ performance.cache.maxBakedSprites
```

- default cap: `256`
- eviction policy: insertion-order LRU
- eviction cleanup: cached `p5.Graphics.remove()`

## Invalidation Rule

```text
invalidate when
├─ sprite assets reload
├─ baked flag flips off
├─ size bucket changes
└─ appearance key changes
```

Current landed guarantee:
- asset re-initialize clears the whole cache
- size-specific entries are keyed by baked width/height
- appearance-specific entries are keyed by the canonical appearance key above

Future `v3` closure work:
- explicit per-appearance invalidation hooks
- atlas-backed source path under `performance.flags.spriteAtlas`

## Landed First Slice

```text
live now
├─ body bake
├─ antenna bake
├─ wing-piece bake
├─ caterpillar-frame bake
├─ cocoon bake
└─ collection preview reuse
```

Not landed yet:

```text
still future inside v3
├─ atlas source path
├─ screenshot parity grid
└─ closure/default-on decision
```
