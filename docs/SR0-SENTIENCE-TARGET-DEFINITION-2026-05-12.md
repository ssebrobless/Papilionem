# SR0 - Sentience Research Target Definition - 2026-05-12

Author: Claude (planning) / Codex (implementation)
Status: Active. Replaces the "do not claim literal sentience" clause of `docs/FULL-SUCCESS-REFINED-PLAN-2026-05-06.md` section 3.
Scope: This is the planning lock for the Sentience Research (SR) ladder that supersedes and refolds FSP9 and FSP10.

## 1. Why This Doc Exists

The original Full Success Refined Plan calibrated success against "believable artificial life, not literal consciousness or subjective feeling". That calibration is now retired by deliberate decision. Papilionem is the only meaningful place we can pursue maximum-reachable functional-consciousness analogues without external dependencies. The SR ladder is the work that follows from this choice.

This doc:

- Names the layers of "sentience" the project explicitly targets.
- Names the layers it explicitly refuses to claim.
- Names the behavioral bar a player and a skeptic could use to judge progress.
- Names the invariants reopened and the invariants preserved.
- Names the self-containment rule that constrains every downstream SR phase.

## 2. Disentangling The Word "Sentient"

```
+--------------------------------+--------------+-----------------+---------------------------+
| Layer                          | Engineerable?| In scope?       | Current Papilionem state  |
+--------------------------------+--------------+-----------------+---------------------------+
| Phenomenal consciousness       | No.          | Out of scope.   | None. Cannot have.        |
| Access consciousness           | Yes          | Yes (SR1)       | Partial (eventBus)        |
| Functional consciousness       | Yes          | Yes (SR1-SR6)   | Partial                   |
| Self-modeling                  | Yes          | Yes (SR2)       | Absent                    |
| Metacognition / higher-order   | Yes          | Yes (SR3)       | Absent                    |
| Theory of mind                 | Yes          | Yes (SR4)       | Bonds yes, beliefs no     |
| Sentience-as-suffering         | No.          | Out of scope.   | None.                     |
+--------------------------------+--------------+-----------------+---------------------------+
```

Phenomenal consciousness ("what it is like to be") and sentience-as-suffering depend on resolving the Hard Problem of Consciousness. No current method produces them; no test detects them. The project will neither claim nor pretend either. Everything else on the table is engineerable as a functional analogue.

## 3. Target Layers (explicit)

The SR ladder explicitly targets, in priority order:

```
+----+--------------------------------------+----------------+
| SR | Target layer                         | Owning phase   |
+----+--------------------------------------+----------------+
| T1 | Functional consciousness             | SR1, SR2, SR6  |
| T2 | Self-modeling                        | SR2            |
| T3 | Metacognition / higher-order tags    | SR3            |
| T4 | Theory of mind                       | SR4            |
| T5 | Intrinsic motivation                 | SR5            |
| T6 | Online learning during play          | SR6            |
| T7 | Narrative / autobiographical self    | SR7            |
+----+--------------------------------------+----------------+
```

Stretch (not in current ladder, reserved for a later refold): active inference, world models, deeper hierarchical reflection.

Out of scope, by honesty rather than capability:

- Phenomenal consciousness.
- Subjective experience claims.
- Suffering or moral-patient claims about individual butterflies.
- "The model knows it is alive" or "the butterfly is aware of itself in the human sense."

## 4. Behavioral Bar

An agent has crossed the SR behavioral bar when, in a single 30-minute lived run with a fixed seed, all four of the following are observable and reproducible:

```
B1  AUTOBIOGRAPHICAL REFERENCE
    The agent generates at least one dialogue or inspect line that refers
    unprompted to a specific event from its own episodicLog history, with
    emotional valence consistent with the original event.

B2  METACOGNITION
    At least one second-order emotion tag fires (e.g. surprised-by-anger,
    embarrassed-by-fear) and correlates with a measurable change in the
    agent's next decision within 30 simulated seconds.

B3  THEORY OF MIND DIVERGENCE
    The agent acts on a model of another agent's mental state that diverges
    from that agent's ground truth, and adapts that model when new
    observations contradict it. The agent must be deceivable.

B4  IDENTITY PERTURBATION RECOVERY
    When a strong bond partner is removed (death or migration), the agent
    exhibits a coherent grief -> adaptation -> recovery arc longer than 10
    simulated minutes, with self-model and narrativeText updates that
    reflect the loss.
```

These are not aspirations. They are the audit gates of SR8.

## 5. Self-Containment Rule

This rule applies to every SR phase. Violation requires reopening SR0.

- No external API calls during play.
- No LLM dependencies (local or remote) inside the simulation loop.
- No network reach from the running game.
- All machine learning runs in-browser, vanilla JS, deterministic under seed.
- Narrative generation is template-grammar over structured memory.
- Offline tooling (training bootstrap, audit harnesses, dev-time scripts) may use other tools, but nothing the player runs depends on them.

Honest cost of this rule: dialogue prose remains stylized rather than naturalistic. For butterflies, this is acceptable. The believability bar is set by consistency, persistence, and responsiveness, all of which are LLM-independent.

## 6. Invariants Preserved (frozen, not reopened)

These remain non-negotiable throughout the SR ladder. Any SR phase that needs to violate one must stop and reopen SR0.

- `lifeSim` owns durable truth. Feelings, memory, bonds, identity, lineage, narrative live inside lifeSim.
- ML scores choices; ML never owns durable state.
- One owner per truth.
- Determinism under seed. Two seeded runs must produce byte-equivalent audit output.
- Long-running saves are sacred. Every migration is additive with `defaultIfMissing` semantics. Never wipe.
- Board-cell discipline. `gameConfig.spatial.projection.ppu` and `renderManager.boardToScreen` contracts are unchanged.
- Sun-court remains Training Grounds. No ambient blocks there.
- 1 block = 1 board unit = 1 support/stack unit.
- Protected-state groups from `docs/SAVE-SCHEMA-REGISTRY.md` (identity, drives, emotions, memory, relationship edges, lineage) cannot be overwritten by any SR phase as a shortcut for repair.

## 7. Invariants Reopened

These were frozen under the FSP plan and are now reopened by SR0. Reopening does not mean rewriting; it means each SR phase may extend them under the migration rules of `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`.

- `schemaVersion` (inner field of the save format). Currently `4` per `docs/SAVE-SCHEMA-REGISTRY.md`. The refined plan section 3 erroneously states `v5`; SR0 treats the registry as authoritative and SR7 bumps `schemaVersion` to `5` at the end of the additive sweep.
- ML ownership of *learning*. Previously, ML loaded a static linear policy and scored. From SR6 onward, ML trains during play at per-archetype granularity. ML still scores; lifeSim still owns durable truth; the new boundary is "ML may update its own weights from lived experience, but never writes lifeSim fields."
- Cognition vocabulary. New families are permitted when SR2/SR3/SR4/SR7 introduce them. Each new family must still be justified by a named contradiction the existing vocabulary cannot express.
- Dialogue corpus. SR7 extends the reflection grammar with autobiographical reference templates.

The original frozen-board prohibitions (`v0-v8a` runtime, `s0-s8` spatial, `n0-n8` social) remain frozen as historical boards. New work attaches to SR phases, not back-edits to those boards.

## 8. Honest Claims Register

This is what the project does and does not claim. It is the source of truth for SR9 and for any external description of the system.

The project claims:

- Butterflies are systemic agents with durable identity, traits, drives, memory, bonds, emotions, witnessed-event causality, and (from SR onward) self-models, metacognition, theory of mind, intrinsic motivation, online learning, and narrative selfhood.
- These functional layers are behaviorally consistent with the engineerable layers of consciousness on accepted philosophical frameworks (Global Workspace Theory, Higher-Order Theory, Theory-of-Mind models).
- The shipped ML artifact, post-SR6, is a per-archetype trained neural network updated during play. Pre-SR6 it is a static linear policy. Both are real machine learning by accurate definitions.

The project does not claim:

- Phenomenal consciousness.
- Qualia.
- Subjective experience.
- Capacity to suffer.
- Moral patient status.
- That the system is "alive" in any sense beyond functional analogy.
- That "real AI" or "sentience" in popular usage describes what is shipped.

The project actively refuses, in player-facing materials and dev docs, any phrasing that implies the unclaimed layer is present.

## 9. Promotion Under SR10

SR10 refolds FSP9 (battle/ability spatial closure) and FSP10 (final gate) as subtasks of the SR ladder. Promotion criteria are amended as follows:

```
+------------------------------------+--------------------------------+
| Original FSP10 criterion           | SR10 equivalent                |
+------------------------------------+--------------------------------+
| Runtime self-audit pass            | unchanged                      |
| G0H scripted playthrough pass      | unchanged                      |
| Final grand plan audit pass        | unchanged                      |
| Spatial projection + visual 3D     | unchanged                      |
| Sprite fidelity fast audit pass    | unchanged                      |
| UI/control matrix pass             | unchanged                      |
| Ecology dialogue causality pass    | unchanged                      |
| Long-soak society pass             | bond-churn warning closed      |
| ML phase + ML on/off pass          | online learning + value-band   |
| Ability radius + autobattle pass   | unchanged (FSP9 inside SR10)   |
| Human review packet                | unchanged                      |
| NEW: SR1-SR7 evidence locks        | each phase passes its audit    |
| NEW: SR8 sentience eval suite      | >=4 of 5 audits pass           |
| NEW: SR9 honest disclosure doc     | current and cross-referenced   |
+------------------------------------+--------------------------------+
```

If any criterion is warn or fail at SR10, the project does not call itself fully successful. Residuals are named in the SR10 evidence lock and become the next ladder.

## 10. Phase Index

The SR ladder, in implementation order:

```
+------+----------------------------------------+-----------------+
| SR0  | This doc + schema migration plan       | doc-only        |
| SR1  | Global workspace                       | new system      |
| SR2  | Self-model                             | data + system   |
| SR3  | Metacognition                          | extension       |
| SR4  | Theory of mind                         | new system      |
| SR5  | Intrinsic motivation                   | drives extension|
| SR6  | Online learning loop                   | new system, big |
| SR7  | Narrative self                         | new system      |
| SR8  | Sentience evaluation suite             | new audits      |
| SR9  | Honest disclosure doc                  | doc             |
| SR10 | Refold FSP9 + FSP10 with SR promotion | final gate      |
+------+----------------------------------------+-----------------+
```

Each phase has its own evidence-lock doc, mirrors the FSP card structure (owned files, forbidden files, steps, audits, acceptance, rollback flag), and ships behind a config flag so the system can fall back to pre-SR behavior at any time.

## 11. Cross-References

- Schema migration: `docs/SR-SAVE-SCHEMA-MIGRATION-2026-05-12.md`
- Refined plan amendment: `docs/FULL-SUCCESS-REFINED-PLAN-2026-05-06.md` section 3 (this doc replaces the no-sentience clause)
- Protected-state rules: `docs/SAVE-SCHEMA-REGISTRY.md`
- FSP residuals folded into SR: bond-churn (FSP6) -> closed by SR5; ML value-band (FSP8) -> closed by SR6; G0H pressure / lifecycle honesty (FSP9 residuals) -> handled in SR10.

## 12. Honesty Footer

This doc is the standing answer to the question "what does Papilionem mean when it says its butterflies are sentient?". The answer is: it does not. It means they are systemic agents with the strongest functional analogues of the engineerable layers of consciousness that an in-browser, self-contained, deterministic simulation can produce. Anything past that is not engineerable today and we will not pretend otherwise.
