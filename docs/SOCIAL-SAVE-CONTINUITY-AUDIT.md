# Social Save Continuity Audit

## Purpose

This is the stable `n8` closure note for the social-cognition track.

It proves the widened social state now survives:

```text
serialize
  └─▶ restore roundtrip
       └─▶ overload recovery
```

without wiping the protected long-running truth:

```text
protected social continuity
├─ butterfly identity
├─ hybrid journal continuity
├─ social memories
├─ relationship edges
├─ retained lessons / residues
└─ dialogue history needed for later carry-over
```

## Runtime Closure

```text
save continuity rule now live
├─ overloaded saves no longer force a fresh world
├─ restore sanitization prunes to limits instead of wiping sacred butterflies
├─ renamed hybrid identity survives roundtrip restore
└─ social durability stays anchored in save truth, not UI snapshots
```

## Proof Snapshot

Primary artifact:

- `qa_screenshots/n8_social_save_continuity_audit/2026-04-22T08-35-03-534Z/report.json`

```text
n8 proof
├─ serialize protected social truth          -> pass
├─ roundtrip protected social truth          -> pass
├─ overload recovery preserves sacred hybrid -> pass
├─ page errors                               -> none
└─ console errors                            -> none
```

Key values from the passing run:

```text
serialize / roundtrip
├─ displayName         -> SacredHybrid
├─ birthSource         -> bred
├─ isHybrid            -> true
├─ hybridJournalCount  -> 1
├─ memorySocialCount   -> 1
├─ memoryInteraction   -> 1
├─ retainedLessonCount -> 1
├─ recentResidueCount  -> 1
├─ trust               -> 0.91
├─ attachment          -> 0.82
└─ followThrough       -> 0.64
```

```text
overload recovery
├─ original butterflies  -> 5009
├─ sanitized butterflies -> 2500
├─ forceFreshWorld       -> false
├─ sacred hybrid kept    -> true
└─ hybrid journal kept   -> true
```

## Regression Check

Supporting proof stayed green after the `n8` save changes:

- `qa_screenshots/r6_communication_audit/2026-04-22T08-32-59-448Z/report.json`
- `qa_screenshots/runtime_self_audit/report.json` (`overall: warn`, same non-blocking baseline state)

## Honest Boundary

```text
n8 local closure
├─ social save continuity is live
├─ shared `v7 / s7 / n8` signoff is now recorded at `schemaVersion = 4`
└─ carry forward
   └─ runtime-only `v8a` proof now judges a frozen shared schema, not an unsettled migration contract
```

That means the social track can freeze honestly now, and the later shared
save-schema gate is no longer open: runtime `v7`, spatial `s7`, and social
`n8` are now signed together at the same schema state.
