# Playtest Feedback Template

After each outside session, copy any actionable blocker/confusion items into
[docs/PLAYTEST-TRIAGE-LOG.md](/C:/Users/fishe/Documents/projects/ephemera/docs/PLAYTEST-TRIAGE-LOG.md).

```text
╔════════════════════ Session Info ════════════════════╗
║ tester name        │                                  ║
║ date               │                                  ║
║ branch/build       │ public-share-readiness candidate ║
║ device/browser     │                                  ║
║ network mode       │ host-local / same-lan            ║
║ url used           │                                  ║
║ startup result     │ reached title / blocked / mixed  ║
║ used debug presets │                                  ║
╚════════════════════════════════════════════════════════╝
```

Session note:

- if debug tools were available, record whether a session capture was exported
  after the run and where it was saved

## Core Checks

Rate each area:

- `good`
- `mixed`
- `rough`

### 1. Garden feel

- Did the garden feel readable and alive?
- Did butterflies seem too static, too chaotic, or about right?

### 2. Sleep behavior

- Did sleep/settling behavior look natural?
- Did sleep visuals match what the debug/audit tools said was happening?

### 3. Social behavior

- Did trust, teaching, and comfort changes feel gradual?
- Did any social state jump too quickly or feel invisible?

### 4. Hybrid/lineage pacing

- Did hybrid/lineage scenarios feel understandable?
- Did breeding/pregnancy/offspring pacing feel too fast, too slow, or about right?

### 5. Debug/audit usability

- Were the presets useful?
- Was the debug panel readable?
- Did any audit tool feel confusing or broken?

### 6. Accessibility/readability

- Did reduced motion, trail, and background settings help?
- Was anything visually noisy or hard to track?

## Specific Findings

For each issue:

```text
area               :
what happened      :
expected instead   :
steps to reproduce :
preset used        :
severity           : low / medium / high
```

Startup-specific findings to capture if relevant:

```text
did install work     :
did launch work      :
did url connect      :
first blocker        :
```

## Best/Worst Moments

- Best moment:
- Most confusing moment:
- Most beautiful moment:
- Biggest friction point:

## Overall

- Would you keep playing this build?
- What is the first thing you would change?
- What feels strongest right now?
