# 07 Save Load Audit Workflow

Target output:

`docs/guidebook/diagrams/07-save-load-audit-workflow.png`

```text
Create a workflow diagram for Papilionem's save-load and audit toolchain.

Show these nodes:
- live game state
- SaveSystem serialize
- local storage save
- load from storage
- entity reconstruction
- foundation system restoration
- derived state rebuild
- roundtrip verification
- snapshot capture
- snapshot diff
- invariant checker
- audit world
- audit report storage
- replay metadata / reseed

Clearly separate:
- durable truth
- rebuilt derived state
- audit-only tooling

This should look like an engineering workflow diagram, not a player-facing diagram.
```
