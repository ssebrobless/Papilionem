# Papilionem Implementation Recovery Plan

## Historical Status Notice

```text
╔════════════════════ Historical Notice ════════════════════╗
║ this document now records an earlier recovery pass        ║
║ it is not the active source of truth for current drift    ║
║ use ACTIVE-REPAIR-BOARD.md for the frozen repair baseline ║
║ use ACTIVE-POLISH-BOARD.md for live polish sequencing     ║
║ board and current visible repair priorities               ║
╚════════════════════════════════════════════════════════════╝
```

The completion framing below reflects an earlier recovery checkpoint. Later
player-facing testing reopened several areas, including UI sizing/overflow,
carry/flower coherence, zone-action diversity, spatial-model truth, crowded-zone
performance, dialogue depth, and battle readability. Treat this document as a
historical closure record, not the current live repair board.

```text
mission
├─ recover from drift
├─ keep owner seams clean
└─ only advance when visible truth and runtime truth agree
```

## Historical Recovery Snapshot

```text
recovered stack
├─ genetics / stat contract
├─ cognition addendum
├─ ML phases M1-M4 + closure trace
├─ single-player autobattle mode
├─ narrow 3D structure logic
├─ later 3D physics P1-P5 foundation
├─ R1 movement / physics stabilization
├─ R2 zone transition reliability
├─ W1 angled ground-plane / portal alignment
├─ W2 wild ecology / release loop
├─ W3 flower simplification / spread
├─ R4 Inspect / Journal readability
├─ R5 battle presentation recovery
├─ R6 communication / feed / speech layer
├─ R7 block visual cleanup
└─ R8 final visible shared audit closure
```

```text
completion truth
├─ no blocker phases remain open
├─ player-facing recovery work is implemented
├─ final audit suite is green
├─ runtime self-audit threshold matches the live baseline
└─ remaining work after this document is future expansion, not recovery debt
```

## Non-Negotiable Execution Rules

```text
for every phase
1. define the narrow goal
2. touch the fewest owner files possible
3. implement the phase
4. run code-level checks
5. run runtime checks
6. run visible player-facing QA if the phase is visible
7. compare visible behavior against debug truth
8. if anything meaningful fails, revise the same phase
9. do not advance until that phase is clean
```

```text
autonomous continuation rule
├─ follow the ordered checklist without waiting for routine confirmation
├─ after each phase: implement -> self-audit -> runtime-check -> visible QA -> revise if needed
├─ keep concern notes precise when a safe temporary compromise is chosen
├─ do not call a phase done from headless logic alone if the player can see it
└─ if a phase needs temporary local hosting for audit, stop the host again afterward
```

```text
proceed trigger
├─ if the user says "proceed"
├─ continue through the ordered board autonomously
├─ do not stop for routine check-ins or clean checkpoints
├─ if a hard blocker can be safely bypassed, log it and continue
├─ only stop for a truly unbypassable blocker or an explicit user redirect
└─ otherwise keep advancing phase by phase under the audit loop
```

```text
no routine check-in stop rule
├─ phase completion is not a stop condition
├─ audit completion is not a stop condition
├─ a clean checkpoint is not a stop condition
├─ a rebuilt doc/source book is not a stop condition
├─ "I should update the user" is not a stop condition
├─ commentary-style progress notes are allowed mid-run
└─ the default action after any clean pass is: start the next ordered phase immediately
```

```text
next-action ladder
├─ if current phase is not clean
│  └─ stay inside the same phase and revise it
├─ if current phase is clean and another phase remains
│  └─ start the next numbered phase immediately
├─ if a validation path fails but a safe reversible bypass exists
│  └─ log the concern and continue within the same phase
├─ if a true hard blocker appears but a safe bypass exists
│  └─ log it precisely, mark validation as deferred, and continue to the next viable phase
├─ if a true hard blocker appears and no safe bypass exists
│  └─ stop only with exact blocker evidence and the safest next options
└─ if the final phase is clean
   └─ close with the final summary, audit evidence, and deferred blocker review packet
```

## Hard Blocker Bypass Rule

```text
when a genuine blocker appears
1. verify the blocker is real
2. attempt a short bounded recovery pass
3. if recoverable, continue in the same phase
4. if not recoverable but safely bypassable:
   ├─ log exact evidence in the blocker ledger
   ├─ record what validation is deferred
   ├─ record the safest reversible bypass
   ├─ note which future phase must revisit it
   └─ continue to the next viable item without stopping
5. only stop if the blocker is truly unbypassable
```

```text
blocker review promise
├─ blocked items are not forgotten
├─ each one must have exact evidence and touched scope recorded
├─ the final closeout must include a blocked/deferred review section
└─ after the runnable roadmap is complete, revisit the blocked items together
```

## Owner Boundaries

```text
owner boundaries
├─ renderManager / UI layers own presentation only
├─ gameUI owns panel flow and button routing
├─ debugUI calls owner APIs; it does not own gameplay truth
├─ breedingSystem owns mate eligibility and mating state
├─ communicationSystem owns speech / talk modes / hearing truth
├─ gameCore owns zone switching / zone travel orchestration
├─ structureSystem owns static spatial truth
├─ physicsSystem owns dynamic contact / motion truth
├─ battleSystem owns battle truth and battle result commit
├─ saveSystem owns save/load and derived-state rebuild
└─ wild ecology systems own release, hybrid-cap, and rewilding truth
```

```text
do not do these
├─ no silent placeholder behavior
├─ no "pass" based only on headless assertions
├─ no new feature work while a blocker phase is still red
├─ no direct deep-state mutations from debugUI when an owner exists
├─ no UI wording that hides what an action actually did
├─ no visual approval without live visible verification
└─ no stopping work just because a phase would make a nice checkpoint
```

## Elegance Rules

```text
when implementing
├─ prefer additive seams over destructive rewrites
├─ keep each fix localized to the correct owner
├─ remove the old path when replacing it; do not leave both active
├─ use stable state names and one meaning per field
├─ separate durable truth from derived truth
├─ make UI feedback explicit when actions are destructive or diagnostic
└─ when in doubt, choose the safer reversible path
```

```text
before advancing
├─ ask: did I patch the symptom or the owner seam?
├─ ask: does save/load still rebuild this cleanly?
├─ ask: would a player understand what happened on screen?
└─ ask: would debug truth agree with the visible result?
```

## Phase Status

```text
closed
├─ R1 movement / physics stabilization
├─ R2 zone transition reliability
├─ R3 progression runtime rewrite
├─ W1 angled ground-plane / portal alignment
├─ W2 wild ecology / release loop
├─ W3 flower simplification / spread
├─ R4 Inspect / Journal readability
├─ R5 battle presentation recovery
├─ R6 communication / feed / speech-layer implementation
├─ R7 block visual cleanup
└─ R8 final visible shared audit closure
```

R3 note:

- the R3 runtime was intentionally superseded by the newer wild-ecology / release-loop direction once W2 landed

## Master Ordered Checklist

```text
ordered recovery board
├─ 1. W1 angled ground-plane / portal alignment               complete
├─ 2. W2 wild ecology / release loop                          complete
├─ 3. W3 flower simplification / spread                       complete
├─ 4. R4 Inspect / Journal readability                        complete
├─ 5. R5 battle presentation recovery                         complete
├─ 6. R6 communication / feed / speech-layer implementation   complete
├─ 7. R7 block visual cleanup                                 complete
└─ 8. R8 final visible shared audit closure                   complete
```

```text
why this order
├─ W1 first because the angled-space seam affected ability rings, portals, and movement truth
├─ W2 next because it replaced the old long-term game loop before later UI/battle work hardened around it
├─ W3 then because ecology readability and flower spread affect life-sim feel across the garden
├─ R4 before R5/R6 so inspection and journal truth were readable while debugging battle and speech systems
├─ R5 before R6 because battle was trust-breaking and had to visibly match the contracts
├─ R6 after battle because the new communication model is broad and needed repaired core presentation
├─ R7 after the larger presentation/system changes so block rendering could finalize against the newer visual baseline
└─ R8 last because only the full stack could prove the recovery actually held together
```

## Recovery Completion Snapshot

```text
W1
├─ shared angled ground-plane profile is canonical in the garden
├─ portal and doorway anchors follow the same projection seam
└─ battle rendering explicitly overrides back to a top-down plane

W2
├─ wild ecology replaced the unlock ladder
├─ hybrid cap is enforced at hatch time
├─ Inspect owns the release checklist flow through owner APIs
└─ release batches feed future wild baseline uplift

W3
├─ flowers use one simpler silhouette family with color variance
├─ spread scoring replaced center-heavy clustering
└─ caterpillar support spawning follows explicit support rules

R4
├─ Inspect and Journal are readable at player scale
├─ dense tabs support hover + scrollwheel navigation
└─ release checklist stays inside Inspect without overflow

R5
├─ battle arena is top-down and visually isolated from the garden
├─ combatants visibly move, strike, guard, rally, and retreat
├─ special attacks and projectiles / emitted effects are visible where applicable
├─ flower-related battle behavior appears when the contracts call for it
└─ updated ability effects render in battle on the top-down arena plane

R6
├─ Talk / Actions / Learn is the live feed contract
├─ Talk is sourced from communicationSystem dialogue history
├─ spoken replies use a universal 2.0-second delay with one queued reply max
├─ signals are internal only
└─ dialogue now drives relationship residue, chemistry, and teaching outcomes

R7
├─ live blocks render procedurally instead of relying on the old bitmap seam
├─ outline fragmentation and corner-dot artifacts are removed
└─ carried and placed blocks share the same cube render rules

R8
├─ focused phase audits passed
├─ deep systems and autobattle audits passed
├─ runtime self-audit passed on the corrected live threshold
└─ no recovery blocker phases remain open
```

## Final Audit Closure

```text
final audit suite
├─ ability visual audit                           pass
├─ R1 movement stability audit                    pass
├─ R2 zone transition audit                       pass
├─ P5 training physics audit                      pass
├─ M5 structure audit                             pass
├─ W2 wild ecology audit                          pass
├─ W3 flower ecology audit                        pass
├─ R4 UI readability audit                        pass
├─ R5 battle presentation audit                   pass
├─ R6 communication audit                         pass
├─ R7 block visual audit                          pass
├─ deep systems audit                             pass
├─ single-player autobattle audit                 pass
└─ runtime self-audit                             pass
```

## Phase Advancement Rule

```text
do not start the next phase unless
├─ the current phase goal is met
├─ owner seams are still clean
├─ runtime checks pass
├─ visible QA passes where relevant
└─ regression checks do not re-break closed phases
```
