# V2 Memory-Growth Audit

```text
v2 memory-growth audit + leak closure
├─ heap attribution seam         -> live
├─ debug/capture memory lines    -> live
├─ post-export capture compaction -> live
├─ social-edge residue compaction -> live
├─ social proof after compaction  -> pass
├─ full lived-in soak proof       -> pass
└─ closure state                  -> live
```

## Intent Held

- make long-running play more stable before restoring heavier creature visuals
- find real retention owners instead of blaming the look blindly
- reduce growth without wiping durable social truth or flattening the sim

## What Landed

```text
first v2 pass
├─ telemetry memory attribution
├─ capture/archive retention summary
└─ finished-capture buffer compaction after export

second v2 pass
├─ edge-local residue history now keeps meaningful pair-carryover only
├─ latest dialogue residue still preserved for inspect/feed truth
└─ durable relationship fields remain untouched
```

## Evidence

### 1. First attribution seam

- smoke lane:
  [2026-04-23T04-34-03-215Z](../qa_logs/session_captures/v2-memory-attribution-smoke/2026-04-23T04-34-03-215Z)
- session-capture audit:
  [report.json](../qa_screenshots/f1_session_capture_audit/2026-04-23T04-30-06-455Z/report.json)

At that point the lived-in calm lane showed:

```text
comm retained        3037
edge residues        2740
heap                 124.9MB
render estimate      141.4MB
```

That established the next real hotspot:
- dense social-edge residue history, not just capture buffers

### 2. Edge-residue closure pass

- updated smoke lane:
  [2026-04-23T04-40-51-292Z](../qa_logs/session_captures/v2-memory-attribution-smoke/2026-04-23T04-40-51-292Z)
- communication audit:
  [report.json](../qa_screenshots/r6_communication_audit/2026-04-23T04-42-07-658Z/report.json)
- social depth audit:
  [report.json](../qa_screenshots/f5_f6_social_depth_audit/2026-04-23T04-42-07-657Z/report.json)

The lived-in calm lane now shows:

```text
comm retained        1228   (-59.6%)
edge residues         931   (-66.0%)
heap                 124.9MB
render estimate      141.4MB
```

## Honest Read

```text
earned now
├─ memory attribution is readable in capture/debug paths
├─ finished captures no longer hold heavy arrays after export
├─ edge-local residue retention is materially lower on the lived-in save
├─ social communication proof still passes after the compaction
└─ full lived-in v2 proof now shows lower peak heap on shell/travel/battle/soak lanes with no runtime issues

not earned yet
└─ flat frame-time improvement across every lane
```

The key boundary held:
- durable social truth stayed intact
- pair texture still reads from live relationship state
- latest residue still exists for inspect/feed surfacing
- the compaction targets redundant recent edge-local carryover, not identity,
  memories, lineage, or relationship ownership

## Next Runtime Pressure

```text
v2 closure result
├─ gate met
│  ├─ 40-minute heap delta improved
│  └─ freeze-confidence proof stayed clean
└─ follow-on pressure
   └─ calm/soak update cost is still high and now reads more simulation-dominant
      └─ that shifts naturally to v4 cadence work rather than blocking v2 closure
```

## Full Proof

- full proof lane:
  [2026-04-23T05-37-30-766Z](../qa_logs/session_captures/v2-full-proof/2026-04-23T05-37-30-766Z)
- canonical diff:
  [diff-vs-post-s3-canonical-baseline.md](../qa_logs/session_captures/v2-full-proof/2026-04-23T05-37-30-766Z/diff-vs-post-s3-canonical-baseline.md)

Key lived-in deltas against the post-`s3` canonical baseline:

```text
heap
├─ shell   168.80MB -> 149.73MB   (-11.3%)
├─ travel  168.80MB -> 149.73MB   (-11.3%)
├─ battle  168.80MB -> 149.73MB   (-11.3%)
└─ soak40  272.75MB -> 256.54MB   (-5.9%)

runtime issues
└─ 0 -> 0
```

The frame-time picture is mixed:
- render improved or held in battle and soak
- shell and travel stayed roughly flat
- calm and soak update costs remain too hot

That is enough to close `v2` honestly because the written gate was
memory-growth and freeze-confidence, not broad cadence repair.
