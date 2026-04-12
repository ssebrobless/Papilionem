# Diagram Manifest

This is the authoritative filename map for guidebook visuals.

```text
╔════════════════════ Manifest Rules ════════════════════╗
║ use numbered filenames                                  ║
║ keep one prompt file per output file                    ║
║ regenerate in place when revising                       ║
║ do not invent new names midstream                       ║
╚══════════════════════════════════════════════════════════╝
```

| # | Diagram | Prompt File | Output File |
| --- | --- | --- | --- |
| 01 | Whole-game systems architecture | Mermaid in `DEVELOPER-REFERENCE.md` | `diagrams/01-whole-game-architecture.png` supplemental |
| 02 | Life-simulation state container | Mermaid in `DEVELOPER-REFERENCE.md` | `diagrams/02-life-sim-state-container.png` supplemental |
| 03 | Sleep state machine | Mermaid in `DEVELOPER-REFERENCE.md` | `diagrams/03-sleep-state-machine.png` supplemental |
| 04 | Teaching / trust / social reinforcement flow | Mermaid in `DEVELOPER-REFERENCE.md` | `diagrams/04-teaching-trust-flow.png` supplemental |
| 05 | Genetics and hybrid breeding lifecycle | Mermaid in `DEVELOPER-REFERENCE.md` | `diagrams/05-genetics-breeding-lifecycle.png` supplemental |
| 06 | Controls and UI map | Mermaid in `DEVELOPER-REFERENCE.md` | `diagrams/06-controls-ui-map.png` supplemental |
| 07 | Save / load / audit workflow | Mermaid in `DEVELOPER-REFERENCE.md` | no PNG kept |
| 08 | Battle snapshot separation | Mermaid in `DEVELOPER-REFERENCE.md` | no PNG kept |

## Download Rule

If Gemini gives a generic filename:

1. download it
2. move it into `docs/guidebook/diagrams/`
3. rename it to the exact output filename above
4. audit it against [DIAGRAM-AUDIT-CHECKLIST.md](./DIAGRAM-AUDIT-CHECKLIST.md)
5. keep it only if it adds value beyond the Mermaid source

## Controlled Fallback Rule

If Gemini repeatedly invents incorrect labels for a diagram:

1. stop regenerating the bad asset
2. replace that diagram with a controlled Mermaid or SVG version
3. embed the controlled version directly into the guidebook docs
