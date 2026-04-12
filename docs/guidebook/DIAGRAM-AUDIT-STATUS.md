# Diagram Audit Status

Current Gemini generation status for the guidebook diagrams.

```text
╔════════════════════ Current Status ═════════════════════╗
║ 01 whole-game architecture       │ pass via Mermaid    ║
║ 02 life-sim state container      │ pass via Mermaid    ║
║ 03 sleep state machine           │ pass via Mermaid    ║
║ 04 teaching / trust flow         │ pass via Mermaid    ║
║ 05 breeding lifecycle            │ pass via Mermaid    ║
║ 06 controls / UI map             │ pass via Mermaid    ║
║ 07 save/load/audit workflow      │ pass via Mermaid    ║
║ 08 battle snapshot separation    │ pass via Mermaid    ║
╚═════════════════════════════════════════════════════════╝
```

## Notes

- `01` through `08` now have controlled Mermaid versions in the developer guidebook.
- The Mermaid versions are now the canonical source of truth for exact labels, relationships, and flow.
- The kept Gemini images for `01` through `06` are supplemental visual plates, not the authoritative technical diagrams.
- `07` was retried multiple times in Gemini and kept drifting into duplicate or invented workflow elements. It has now been replaced with a controlled Mermaid diagram in the developer guide.
- `08` was retried multiple times in Gemini and kept introducing extra battle-state labels or cropped text. It has now been replaced with a controlled Mermaid diagram in the developer guide.
- The guidebook diagrams folder intentionally contains only the supplemental Gemini plates for `01` through `06`; all eight canonical diagrams now live as Mermaid in the docs.
