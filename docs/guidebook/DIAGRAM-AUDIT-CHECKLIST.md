# Diagram Audit Checklist

Use this after every Gemini-generated diagram download.

```text
╔════════════════════ Audit Loop ════════════════════╗
║ generate diagram                                    ║
║  ▼                                                  ║
║ rename to manifest filename                         ║
║  ▼                                                  ║
║ visual audit                                        ║
║  ├─ pass  ▶ keep                                    ║
║  └─ fail  ▶ revise prompt and regenerate            ║
╚══════════════════════════════════════════════════════╝
```

## 1. Coverage

Check:

- Are all required regions present?
- Are all required labels present?
- Are all required flows or transitions present?
- Are any critical implementation concepts missing?

## 2. Hierarchy

Check:

- Is the main subject obvious in under 3 seconds?
- Are major regions visually distinct?
- Are arrows/flows readable without zooming in excessively?
- Is the layout shape doing the explanation work?

## 3. Readability

Check:

- Can labels be read at normal viewing size?
- Are there too many tiny labels?
- Does the diagram feel cluttered or breathable?
- Is the contrast strong enough?

## 4. Implementation Match

Check:

- Does the diagram still match the implemented game?
- Does it imply systems that do not actually exist?
- Does it oversimplify something in a misleading way?
- Does it preserve the one-owner-per-truth model where relevant?

## 5. Style / Guidebook Fit

Check:

- Does it look polished enough to sit in the guidebook?
- Does it match the natural, life-sim visual tone?
- Does it avoid generic sci-fi / corporate diagram styling?
- Does it feel elegant rather than over-decorated?

## 6. Pass / Fail Template

```text
diagram:
file:

coverage: pass/fail
hierarchy: pass/fail
readability: pass/fail
implementation match: pass/fail
guidebook fit: pass/fail

decision: keep / regenerate / revise prompt
notes:
```
