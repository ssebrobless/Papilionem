# 08 Battle Snapshot Separation

Target output:

`docs/guidebook/diagrams/08-battle-snapshot-separation.png`

```text
Create a diagram explaining Papilionem's battle architecture.

Show the strict separation between:
- live garden entities
- battle snapshot participants
- battle-local mutations
- resolve step
- commit payload
- writeback to live garden entities

Include the kinds of data stored in the snapshot:
- hp
- pressure
- retreat state
- exhaustion
- sleep subtype
- action family/subtype
- status bundle
- cooldowns
- charges
- carried objects
- social edges
- genetics
- special ability

Emphasize that battle does not directly mutate live garden truth until commit.
Use a clean systems diagram style.
```
