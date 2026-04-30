# Papilionem Source Book

_Master reference for systems, contracts, plans, and player/developer guidance_

Generated: April 28, 2026 at 2:10 PM

Refresh command: `node scripts/build-source-book.js`

## Table of Contents

- [Chapter 1. Orientation](#chapter-1-orientation)
  - [Documentation Map](#documentation-map)
    - [Recommended Reading Paths](#recommended-reading-paths)
    - [Document Roles](#document-roles)
    - [Source-Book Workflow](#source-book-workflow)
    - [Suggested Sharing Use](#suggested-sharing-use)
  - [Developer Reference](#developer-reference)
    - [1. Game At A Glance](#1-game-at-a-glance)
    - [2. Core System Ownership](#2-core-system-ownership)
    - [3. Game Flow](#3-game-flow)
    - [4. Controls](#4-controls)
    - [5. World, Camera, And Rendering](#5-world-camera-and-rendering)
    - [6. Butterfly Archetypes And Abilities](#6-butterfly-archetypes-and-abilities)
    - [7. The Neuro-Social Life Simulation](#7-the-neuro-social-life-simulation)
    - [8. Sleep System](#8-sleep-system)
    - [9. Teaching, Trust, And Social Pacing](#9-teaching-trust-and-social-pacing)
    - [10. Genetics, Lineage, And Breeding](#10-genetics-lineage-and-breeding)
    - [11. Status System](#11-status-system)
    - [12. Behavior Runtime](#12-behavior-runtime)
    - [13. Battle Snapshot Layer](#13-battle-snapshot-layer)
    - [14. Save, Load, And Ecology State](#14-save-load-and-ecology-state)
    - [15. Debug, Audit, And Playtesting](#15-debug-audit-and-playtesting)
    - [16. Accessibility And Readability](#16-accessibility-and-readability)
    - [17. Developer Reference Quick Sheet](#17-developer-reference-quick-sheet)
    - [18. Suggested Reading Order](#18-suggested-reading-order)
    - [19. Summary](#19-summary)
    - [20. Exact Config Tables](#20-exact-config-tables)
  - [Player Guide](#player-guide)
    - [1. What Papilionem Is](#1-what-papilionem-is)
    - [2. Starting The Game](#2-starting-the-game)
    - [3. Core Controls](#3-core-controls)
    - [4. Reading The Garden](#4-reading-the-garden)
    - [5. Zones And Travel](#5-zones-and-travel)
    - [6. Feed, Inspect, And Readability](#6-feed-inspect-and-readability)
    - [7. Hybrid Lifecycle And Ecology](#7-hybrid-lifecycle-and-ecology)
    - [8. Journal, Roster, And Battle](#8-journal-roster-and-battle)
    - [9. Release Flow](#9-release-flow)
    - [10. Accessibility](#10-accessibility)
    - [11. Debug Mode For Testers](#11-debug-mode-for-testers)
    - [12. Best Way To Read The Game](#12-best-way-to-read-the-game)
- [Chapter 2. Core Contracts](#chapter-2-core-contracts)
  - [Genetics / Stat Contract](#genetics-stat-contract)
    - [Purpose](#purpose)
    - [Source Anchors](#source-anchors)
    - [Current Runtime Status](#current-runtime-status)
    - [Shape](#shape)
    - [Ownership](#ownership)
    - [Locked Trait Axes](#locked-trait-axes)
    - [Locked Inheritance Rules](#locked-inheritance-rules)
    - [Locked Runtime Layers](#locked-runtime-layers)
    - [Locked Combination Rule](#locked-combination-rule)
    - [Locked Battle Stat Formulas](#locked-battle-stat-formulas)
    - [Locked Readiness Formula](#locked-readiness-formula)
    - [Ability-Origin Contract](#ability-origin-contract)
    - [Required UI Surfacing](#required-ui-surfacing)
    - [Invariants](#invariants)
    - [Locked Edge Rules](#locked-edge-rules)
    - [Definition Of Done](#definition-of-done)
  - [Cognition / ML Contract](#cognition-ml-contract)
    - [Purpose](#purpose-2)
    - [Source Anchors](#source-anchors-2)
    - [Shape](#shape-2)
    - [Locked Current Families](#locked-current-families)
    - [Locked Current Heuristic Outputs](#locked-current-heuristic-outputs)
    - [Current Heuristic Appraisal Inputs](#current-heuristic-appraisal-inputs)
    - [Contract Rule: What ML May Replace](#contract-rule-what-ml-may-replace)
    - [Boundary Audit (P6)](#boundary-audit-p6)
    - [ML Input Contract](#ml-input-contract)
    - [ML Output Contract](#ml-output-contract)
    - [Integration Rule](#integration-rule)
    - [Persistence Contract](#persistence-contract)
    - [Inspect / Debug Contract](#inspect-debug-contract)
    - [Audit Contract](#audit-contract)
    - [Locked Current Boundary](#locked-current-boundary)
    - [c1 Locked Replacement Boundary](#c1-locked-replacement-boundary)
    - [Definition Of Done](#definition-of-done-2)
  - [Communication / Language Contract](#communication-language-contract)
    - [Purpose](#purpose-3)
    - [Connected Contracts](#connected-contracts)
    - [Direction Lock](#direction-lock)
    - [Ownership Map](#ownership-map)
    - [Name Identity Layer](#name-identity-layer)
    - [Communication Shape](#communication-shape)
    - [Feed Contract](#feed-contract)
    - [Talk Modes](#talk-modes)
    - [Hearing Rules](#hearing-rules)
    - [Response Timing](#response-timing)
    - [English Foundation](#english-foundation)
    - [Core Language Stats](#core-language-stats)
    - [Intelligence Bands](#intelligence-bands)
    - [Speech Tone Palette](#speech-tone-palette)
    - [Register Layers](#register-layers)
    - [Casual Slang Shortlist](#casual-slang-shortlist)
    - [Derived Language Outcomes](#derived-language-outcomes)
    - [Ancient Scholar Contract](#ancient-scholar-contract)
    - [Nonverbal Expression Rule](#nonverbal-expression-rule)
    - [Future Signal Phase Boundary](#future-signal-phase-boundary)
    - [Dialogue Residue Boundary](#dialogue-residue-boundary)
    - [Persistence Rules](#persistence-rules)
    - [Debug / QA Rules](#debug-qa-rules)
    - [Implementation Order](#implementation-order)
    - [Sources](#sources)
  - [Dialogue Voice Contract](#dialogue-voice-contract)
    - [Purpose](#purpose-4)
    - [Current Proof Status](#current-proof-status)
    - [Ownership](#ownership-2)
    - [Output Shape](#output-shape)
    - [Core Output Rules](#core-output-rules)
    - [Intelligence Band Voice Rules](#intelligence-band-voice-rules)
    - [Register Rules](#register-rules)
    - [Slang Probability Draft](#slang-probability-draft)
    - [Sentence Structure Rules](#sentence-structure-rules)
    - [Tone Switching Rules](#tone-switching-rules)
    - [Talk Mode Voice Differences](#talk-mode-voice-differences)
    - [Sample Utterance Patterns](#sample-utterance-patterns)
    - [Hard Limits](#hard-limits)
    - [QA Rules](#qa-rules)
    - [Implementation Order](#implementation-order-2)
  - [Dialogue Memory / Relationship Contract](#dialogue-memory-relationship-contract)
    - [Purpose](#purpose-5)
    - [Current Runtime Status](#current-runtime-status-2)
    - [Direction Lock](#direction-lock-2)
    - [Ownership Map](#ownership-map-2)
    - [State Shape](#state-shape)
    - [Dialogue Residue Families](#dialogue-residue-families)
    - [Rememberability Bands](#rememberability-bands)
    - [Runtime Data Shape](#runtime-data-shape)
    - [Canonical Social Scale](#canonical-social-scale)
    - [Dialogue Delta Model](#dialogue-delta-model)
    - [Dialogue Weighting Factors](#dialogue-weighting-factors)
    - [Relationship Impact Map](#relationship-impact-map)
    - [Reciprocity / Courtship Resonance](#reciprocity-courtship-resonance)
    - [Social Repair Loop](#social-repair-loop)
    - [Apology Contract](#apology-contract)
    - [Rejection Contract](#rejection-contract)
    - [Forgiveness Contract](#forgiveness-contract)
    - [Recovery Over Time](#recovery-over-time)
    - [Courtship Chemistry vs Attachment](#courtship-chemistry-vs-attachment)
    - [Inspect Surfacing Contract](#inspect-surfacing-contract)
    - [Anchoring Dialogue Contract](#anchoring-dialogue-contract)
    - [Learn Creation Rule](#learn-creation-rule)
    - [Decay and Persistence Model](#decay-and-persistence-model)
    - [Persistence Boundary](#persistence-boundary)
    - [AI Integration Points](#ai-integration-points)
    - [Invariants](#invariants-2)
    - [Testing / Debug Guidance](#testing-debug-guidance)
    - [Visual QA Notes](#visual-qa-notes)
    - [Implementation Order](#implementation-order-3)
  - [Internal Signal Contract](#internal-signal-contract)
    - [Purpose](#purpose-6)
    - [Current Proof Status](#current-proof-status-2)
    - [Direction Lock](#direction-lock-3)
    - [Ownership](#ownership-3)
    - [System Role](#system-role)
    - [Core Principle](#core-principle)
    - [Kept Signal Families](#kept-signal-families)
    - [Removed Signal Burdens](#removed-signal-burdens)
    - [Signal Payload Shape](#signal-payload-shape)
    - [Address Modes](#address-modes)
    - [Perception Rules](#perception-rules)
    - [Signal-to-Space Contract](#signal-to-space-contract)
    - [Signal Type Table](#signal-type-table)
    - [Draft Operational Tuning](#draft-operational-tuning)
    - [Draft Interpretation Rule](#draft-interpretation-rule)
    - [Draft Misread Policy](#draft-misread-policy)
    - [Misread Severity Bands](#misread-severity-bands)
    - [Family-Specific Misread Policy](#family-specific-misread-policy)
    - [Misread Recovery Rule](#misread-recovery-rule)
    - [Trust and Relationship Weight](#trust-and-relationship-weight)
    - [Crowding Rule](#crowding-rule)
    - [Anxiety / Distortion Rule](#anxiety-distortion-rule)
    - [Draft Emission Rule](#draft-emission-rule)
    - [Dialogue-Linked vs Instant Signals](#dialogue-linked-vs-instant-signals)
    - [Family-Specific Emission Guidance](#family-specific-emission-guidance)
    - [Debug Visibility Draft](#debug-visibility-draft)
    - [Relationship To Body Language](#relationship-to-body-language)
    - [Relationship To Attraction](#relationship-to-attraction)
    - [Feed Rule](#feed-rule)
    - [Persistence Rules](#persistence-rules-2)
    - [QA Rules](#qa-rules-2)
    - [Implementation Order](#implementation-order-4)
  - [Cognition Addendum for New Systems](#cognition-addendum-for-new-systems)
    - [Purpose](#purpose-7)
    - [Shape](#shape-3)
    - [Locked Rule](#locked-rule)
    - [New Feature Groups To Add](#new-feature-groups-to-add)
    - [Contract Dependencies Now](#contract-dependencies-now)
    - [Definition Of Done](#definition-of-done-3)
  - [ML Implementation Contract](#ml-implementation-contract)
    - [Purpose](#purpose-8)
    - [Shape](#shape-4)
    - [Ownership](#ownership-4)
    - [Locked First Runtime Choice](#locked-first-runtime-choice)
    - [Locked Initial Training Path](#locked-initial-training-path)
    - [Feature Builder Contract](#feature-builder-contract)
    - [Policy Bundle Contract](#policy-bundle-contract)
    - [Arbitration Contract](#arbitration-contract)
    - [Inference Schedule Contract](#inference-schedule-contract)
    - [Fallback Contract](#fallback-contract)
    - [Trace / Inspect Contract](#trace-inspect-contract)
    - [Audit Contract](#audit-contract-2)
    - [Phase Order Contract](#phase-order-contract)
    - [Hard Exclusions](#hard-exclusions)
    - [Definition Of Done](#definition-of-done-4)
  - [Wild Ecology / Release Contract](#wild-ecology-release-contract)
    - [Purpose](#purpose-9)
    - [Direction Lock](#direction-lock-4)
    - [Scope](#scope)
    - [Flower Material Boundary](#flower-material-boundary)
    - [Ownership Map](#ownership-map-3)
    - [Fresh Save State](#fresh-save-state)
    - [Wild Butterfly Rules](#wild-butterfly-rules)
    - [Hybrid Rule](#hybrid-rule)
    - [Release Rule](#release-rule)
    - [Release Batch / Wild Baseline Uplift](#release-batch-wild-baseline-uplift)
    - [Mutant Gene Continuity](#mutant-gene-continuity)
    - [Persistence](#persistence)
    - [Invariants](#invariants-3)
    - [Audit Requirements](#audit-requirements)
  - [Single-Player Autobattle Contract](#single-player-autobattle-contract)
    - [Purpose](#purpose-10)
    - [Source Anchors](#source-anchors-3)
    - [Locked Shape](#locked-shape)
    - [Battle Map Rule](#battle-map-rule)
    - [Team Selection Rule](#team-selection-rule)
    - [Stat Rule](#stat-rule)
    - [Decision Rule](#decision-rule)
    - [Presentation Rule](#presentation-rule)
    - [Result Commit Rule](#result-commit-rule)
    - [Hard Exclusions](#hard-exclusions-2)
    - [Remaining Follow-Up Surface](#remaining-follow-up-surface)
    - [Definition Of Done](#definition-of-done-5)
- [Chapter 3. Implementation Plans and Closure](#chapter-3-implementation-plans-and-closure)
  - [Active Repair Board](#active-repair-board)
    - [Purpose](#purpose-11)
    - [Status Key](#status-key)
    - [Current Truth Snapshot](#current-truth-snapshot)
    - [Post-A10 Closure Baseline](#post-a10-closure-baseline)
    - [Closed Repairs](#closed-repairs)
    - [Active Repairs](#active-repairs)
    - [Next Implementation Order](#next-implementation-order)
  - [Active Polish Board](#active-polish-board)
    - [Purpose](#purpose-12)
    - [Status Key](#status-key-2)
    - [Current Baseline Snapshot](#current-baseline-snapshot)
    - [Phase Detail](#phase-detail)
    - [Completed Polish Order](#completed-polish-order)
  - [Source-Chapter Coverage Matrix](#source-chapter-coverage-matrix)
    - [Purpose](#purpose-13)
    - [Coverage Lens](#coverage-lens)
    - [Classification Key](#classification-key)
    - [Current Scan Shape](#current-scan-shape)
    - [Chapter 1 - Orientation](#chapter-1-orientation-2)
    - [Chapter 2 - Core Contracts](#chapter-2-core-contracts-2)
    - [Chapter 3 - Implementation Plans And Closure](#chapter-3-implementation-plans-and-closure-2)
    - [Chapter 4 - Architecture And Diagram Appendices](#chapter-4-architecture-and-diagram-appendices)
    - [Routing Summary](#routing-summary)
  - [Active Implementation Board](#active-implementation-board)
    - [Purpose](#purpose-14)
    - [Current Implementation Shape](#current-implementation-shape)
    - [Status Key](#status-key-3)
    - [Current Baseline Snapshot](#current-baseline-snapshot-2)
    - [Phase Detail](#phase-detail-2)
    - [Not On This Board](#not-on-this-board)
    - [Exact Implementation Order](#exact-implementation-order)
  - [Active Expansion Board](#active-expansion-board)
    - [Purpose](#purpose-15)
    - [Current Expansion Shape](#current-expansion-shape)
    - [Status Key](#status-key-4)
    - [Cross-Track Invariants](#cross-track-invariants)
    - [1A - Ecology Depth](#1a-ecology-depth)
    - [2B - Later 3-D](#2b-later-3-d)
    - [3C - Machine Learning](#3c-machine-learning)
    - [Frozen State](#frozen-state)
  - [Remaining Implementation Roadmap](#remaining-implementation-roadmap)
    - [Purpose](#purpose-16)
    - [Planning Shape](#planning-shape)
    - [Sequencing Authority](#sequencing-authority)
    - [Ownership Map](#ownership-map-4)
    - [Cross-Track Invariants](#cross-track-invariants-2)
    - [Recurring Obligations](#recurring-obligations)
    - [1A - Ecology Depth](#1a-ecology-depth-2)
    - [2B - Later 3-D](#2b-later-3-d-2)
    - [3C - Machine Learning](#3c-machine-learning-2)
    - [Program-Level Definition Of Done](#program-level-definition-of-done)
  - [Expansion Execution Playbook](#expansion-execution-playbook)
    - [Purpose](#purpose-17)
    - [Program Execution Shape](#program-execution-shape)
    - [Execution Doctrine](#execution-doctrine)
    - [Branching And Change Shape](#branching-and-change-shape)
    - [Sequencing Authority](#sequencing-authority-2)
    - [Shared Regression Gate](#shared-regression-gate)
    - [Phase Template](#phase-template)
    - [1A - Ecology Depth](#1a-ecology-depth-3)
    - [2B - Later 3-D](#2b-later-3-d-3)
    - [3C - Machine Learning](#3c-machine-learning-3)
    - [Review Checklist Before Starting Any Phase](#review-checklist-before-starting-any-phase)
    - [Review Checklist Before Closing Any Phase](#review-checklist-before-closing-any-phase)
    - [Historical First Execution Packet](#historical-first-execution-packet)
  - [Active Public-Share Board](#active-public-share-board)
    - [Purpose](#purpose-18)
    - [Current Shareability Shape](#current-shareability-shape)
    - [Status Key](#status-key-5)
    - [Invariants](#invariants-4)
    - [Phase Ladder](#phase-ladder-4)
    - [Current Focus](#current-focus)
  - [Active Plan Registry](#active-plan-registry)
    - [Purpose](#purpose-19)
    - [Program Shape](#program-shape)
    - [Active Plans](#active-plans)
    - [Goal Alignment Companions](#goal-alignment-companions)
    - [Shared Contracts](#shared-contracts)
    - [Cross-Track Gates](#cross-track-gates)
    - [Review-Gate Rubric](#review-gate-rubric)
    - [How They Relate](#how-they-relate)
    - [Exact Reading Order](#exact-reading-order)
    - [Supporting Evidence Docs](#supporting-evidence-docs)
    - [Historical But Still Useful](#historical-but-still-useful)
    - [Current Truth](#current-truth)
    - [Goal-Alignment Next Move](#goal-alignment-next-move)
    - [Recommended Next Review Hand-Off](#recommended-next-review-hand-off)
  - [Active Completion Board](#active-completion-board)
    - [Purpose](#purpose-20)
    - [Non-Negotiables](#non-negotiables)
    - [Current Truth](#current-truth-2)
    - [Status Key](#status-key-6)
    - [Completion Shape](#completion-shape)
    - [Exact Order](#exact-order)
    - [Parallel-Safe Window](#parallel-safe-window)
    - [Finish Conditions](#finish-conditions)
    - [Immediate Next Moves](#immediate-next-moves)
  - [Game Success Criteria](#game-success-criteria)
    - [Purpose](#purpose-21)
    - [Success Stack](#success-stack)
    - [Social Realism Calibration](#social-realism-calibration)
    - [Section Criteria](#section-criteria)
    - [Acceptance Bar](#acceptance-bar)
    - [Final Rule](#final-rule)
  - [Current-State Gap Assessment](#current-state-gap-assessment)
    - [Purpose](#purpose-22)
    - [Current Snapshot](#current-snapshot)
    - [Goal-by-Goal Read](#goal-by-goal-read)
    - [Highest-Value Remaining Gaps](#highest-value-remaining-gaps)
    - [What This Means](#what-this-means)
  - [Goal-Alignment Implementation Plan](#goal-alignment-implementation-plan)
    - [Purpose](#purpose-23)
    - [Program Shape](#program-shape-2)
    - [Non-Negotiables](#non-negotiables-2)
    - [g0-bar Precondition](#g0-bar-precondition)
    - [Runtime Harness Rule](#runtime-harness-rule)
    - [Exact Ladder](#exact-ladder)
    - [Parallel-Safe Shape](#parallel-safe-shape)
    - [What Not To Reopen](#what-not-to-reopen)
    - [Practical Next Move](#practical-next-move)
  - [Goal-Alignment Review Packet](#goal-alignment-review-packet)
    - [Purpose](#purpose-24)
    - [Review Shape](#review-shape)
    - [Executive Read](#executive-read)
    - [Why These Success Definitions](#why-these-success-definitions)
    - [Social Realism Calibration](#social-realism-calibration-2)
    - [Success Definitions By Section](#success-definitions-by-section)
    - [Current State Against Those Goals](#current-state-against-those-goals)
    - [Main Remaining Blockers](#main-remaining-blockers)
    - [Planning Reasoning](#planning-reasoning)
    - [Concrete Next Plan](#concrete-next-plan)
    - [What Should Not Be Reopened By Default](#what-should-not-be-reopened-by-default)
    - [What A Strong Claude Review Should Challenge](#what-a-strong-claude-review-should-challenge)
    - [Recommended Claude Review Conclusion Target](#recommended-claude-review-conclusion-target)
    - [Bottom Line](#bottom-line)
    - [Claude Review Integration](#claude-review-integration)
  - [G0-Bar Stage A Signoff](#g0-bar-stage-a-signoff)
    - [Purpose](#purpose-25)
    - [Session Bar](#session-bar)
    - [Session Info](#session-info)
    - [G1 Spatial Acceptance Sweep](#g1-spatial-acceptance-sweep-2)
    - [G2 Live Building Behavior Proof](#g2-live-building-behavior-proof-2)
    - [G3 Movement Naturalness Acceptance](#g3-movement-naturalness-acceptance-2)
    - [Closure Call](#closure-call)
    - [Final Signoff](#final-signoff)
  - [G1 Spatial Acceptance Sweep](#g1-spatial-acceptance-sweep-3)
    - [Purpose](#purpose-26)
    - [Current Read](#current-read)
    - [Lived-In Anchor](#lived-in-anchor)
    - [Local Proof Stack](#local-proof-stack)
    - [What The Local Sweep Established](#what-the-local-sweep-established)
    - [What Is Still Open](#what-is-still-open)
    - [Honest Result](#honest-result)
  - [G2 Live Building Behavior Proof](#g2-live-building-behavior-proof-3)
    - [Purpose](#purpose-27)
    - [Current Read](#current-read-2)
    - [Proof Lane](#proof-lane)
    - [What The Passing Lane Shows](#what-the-passing-lane-shows)
    - [Honest Limits](#honest-limits)
  - [G3 Movement Naturalness Acceptance](#g3-movement-naturalness-acceptance-3)
    - [Purpose](#purpose-28)
    - [Current Read](#current-read-3)
    - [Local Proof Stack](#local-proof-stack-2)
    - [What The Current Stack Proves](#what-the-current-stack-proves)
    - [What Is Still Open](#what-is-still-open-2)
    - [Honest Result](#honest-result-2)
  - [Composed Benchmark Harness Workflow](#composed-benchmark-harness-workflow)
    - [Purpose](#purpose-29)
    - [Workflow Shape](#workflow-shape)
    - [Scenario Roles](#scenario-roles)
    - [Runtime Claim Rule](#runtime-claim-rule)
    - [Standard Runtime Loop](#standard-runtime-loop)
    - [Current Harness Notes](#current-harness-notes)
    - [Profile Rule](#profile-rule)
    - [What This Does Not Replace](#what-this-does-not-replace)
  - [Composed Benchmark Baseline 2026-04-27](#composed-benchmark-baseline-2026-04-27)
    - [Purpose](#purpose-30)
    - [Packet Shape](#packet-shape)
    - [Artifact Paths](#artifact-paths)
    - [Baseline Summary](#baseline-summary)
    - [Immediate Read](#immediate-read)
    - [Named Contradiction](#named-contradiction)
    - [Top Realistic Hotspots](#top-realistic-hotspots)
    - [Stress-Lane Reads](#stress-lane-reads)
    - [Current Interpretation](#current-interpretation)
    - [Retained Reality-Lane Recovery](#retained-reality-lane-recovery)
    - [Post-56c9a4f Refresh Packet](#post-56c9a4f-refresh-packet)
    - [Next Diagnosis Order](#next-diagnosis-order)
  - [Active Playtest Follow-Up Board](#active-playtest-follow-up-board)
    - [Purpose](#purpose-31)
    - [Current Shape](#current-shape)
    - [Status Key](#status-key-7)
    - [Invariants](#invariants-5)
    - [Phase Ladder](#phase-ladder-5)
    - [Exact Order](#exact-order-2)
    - [Current Focus](#current-focus-2)
    - [Open Items This Board Covers](#open-items-this-board-covers)
  - [Active Runtime Hardening Board](#active-runtime-hardening-board)
    - [Purpose](#purpose-32)
    - [Current Shape](#current-shape-2)
    - [Status Key](#status-key-8)
    - [Invariants](#invariants-6)
    - [Comfort Target](#comfort-target)
    - [Phase Ladder](#phase-ladder-6)
    - [Exact Order](#exact-order-3)
    - [Current Focus](#current-focus-3)
    - [Open Items This Board Covers](#open-items-this-board-covers-2)
  - [Active Visual-First Runtime Board](#active-visual-first-runtime-board)
    - [Purpose](#purpose-33)
    - [Current Honest Block](#current-honest-block)
    - [Status Key](#status-key-9)
    - [Non-Negotiables](#non-negotiables-3)
    - [Current Shape](#current-shape-3)
    - [Phase Ladder](#phase-ladder-7)
    - [Exact Order](#exact-order-4)
    - [Current Focus](#current-focus-4)
    - [Latest V4 Note](#latest-v4-note)
    - [Latest V5 Note](#latest-v5-note)
    - [Latest V6 Note](#latest-v6-note)
    - [Latest V7 Note](#latest-v7-note)
    - [Latest V8a Note](#latest-v8a-note)
    - [Latest Composed Harness Note](#latest-composed-harness-note)
    - [Latest Single-Zone-200 Note](#latest-single-zone-200-note)
    - [Latest Harness Accounting Note](#latest-harness-accounting-note)
    - [Latest V3 Note](#latest-v3-note)
  - [Public-Share Readiness Roadmap](#public-share-readiness-roadmap)
    - [Purpose](#purpose-34)
    - [Program Shape](#program-shape-3)
    - [Release Levels](#release-levels)
    - [R1 - Startup / Package Sanity](#r1-startup-package-sanity)
    - [R2 - First-Session Onboarding](#r2-first-session-onboarding)
    - [R3 - External Playtest Matrix](#r3-external-playtest-matrix)
    - [R4 - Feedback Triage + Readability Hardening](#r4-feedback-triage-readability-hardening)
    - [R5 - Public Alpha Freeze](#r5-public-alpha-freeze)
  - [Playtest Follow-Up Roadmap](#playtest-follow-up-roadmap)
    - [Purpose](#purpose-35)
    - [Program Shape](#program-shape-4)
    - [F1 - Session Capture + Freeze Triage](#f1-session-capture-freeze-triage)
    - [F2 - Freeze / Performance Hardening](#f2-freeze-performance-hardening)
    - [F3 - Long-Running Save Regression Sweep](#f3-long-running-save-regression-sweep)
    - [F4 - Shell Follow-Up Retest](#f4-shell-follow-up-retest)
    - [F5 - Feed Threading + Conversation Surfacing](#f5-feed-threading-conversation-surfacing)
    - [F6 - Emergent Casual Conversation Depth](#f6-emergent-casual-conversation-depth)
    - [F7 - Material Behavior Visibility](#f7-material-behavior-visibility)
    - [F8 - Flower-Carry / Build Scope Lock](#f8-flower-carry-build-scope-lock)
    - [F9 - Vertical Habitat Contract Lock](#f9-vertical-habitat-contract-lock)
    - [F10 - Outside Retest + Freeze Handoff](#f10-outside-retest-freeze-handoff)
    - [Exact Implementation Order](#exact-implementation-order-2)
    - [Why This Order](#why-this-order)
  - [Runtime Hardening Roadmap](#runtime-hardening-roadmap)
    - [Purpose](#purpose-36)
    - [Program Shape](#program-shape-5)
    - [H1 - Real-Save Lag Capture + Attribution](#h1-real-save-lag-capture-attribution)
    - [H2 - Render-Pass Slimming](#h2-render-pass-slimming)
    - [H3 - Simulation Cadence + Budget Enforcement](#h3-simulation-cadence-budget-enforcement)
    - [H4 - Shell Redraw Discipline](#h4-shell-redraw-discipline)
    - [H5 - Long-Running Save Smoothness Retest](#h5-long-running-save-smoothness-retest)
    - [H6 - Outside Retest + Public-Share Handoff](#h6-outside-retest-public-share-handoff)
    - [Exact Implementation Order](#exact-implementation-order-3)
    - [Why This Order](#why-this-order-2)
    - [Current Read](#current-read-4)
  - [Visual-First Runtime Optimization Plan](#visual-first-runtime-optimization-plan)
    - [Hard Guardrails](#hard-guardrails)
    - [Why The Game Is Currently Demanding](#why-the-game-is-currently-demanding)
    - [Strategy](#strategy)
    - [Ordered Phase Ladder](#ordered-phase-ladder)
    - [Phase Details](#phase-details)
    - [Proof Requirements](#proof-requirements)
    - [What We Explicitly Will Not Do](#what-we-explicitly-will-not-do)
    - [Claude Review Ask](#claude-review-ask)
    - [Recommended Next Step](#recommended-next-step)
  - [Visual-First Runtime Optimization Plan Refined](#visual-first-runtime-optimization-plan-refined)
    - [0. Grounding Facts (as of 2026-04-21)](#0-grounding-facts-as-of-2026-04-21)
    - [Phase Ladder (with v0, review gate, and the v8 split made concrete)](#phase-ladder-with-v0-review-gate-and-the-v8-split-made-concrete)
    - [Review Gate Checklist (run once, between v0 and v1)](#review-gate-checklist-run-once-between-v0-and-v1)
    - [Baseline Capture Protocol — v0](#baseline-capture-protocol-v0)
    - [Measurement Harness Spec](#measurement-harness-spec)
    - [Feature Flag Registry](#feature-flag-registry)
    - [Phase Details (Refined)](#phase-details-refined)
    - [Proof Requirements (unchanged)](#proof-requirements-unchanged)
    - [Investigate Appendix (promote to a phase only if v0 captures justify it)](#investigate-appendix-promote-to-a-phase-only-if-v0-captures-justify-it)
    - [Open Questions (to resolve during the review gate)](#open-questions-to-resolve-during-the-review-gate)
    - [Recommended Next Step](#recommended-next-step-2)
  - [Baseline Ledger](#baseline-ledger)
    - [Purpose](#purpose-37)
    - [Current Status](#current-status)
    - [Required Inputs](#required-inputs)
    - [Closure Conditions](#closure-conditions)
    - [Baseline Runs](#baseline-runs)
    - [V7 Restoration Proof](#v7-restoration-proof)
    - [Notes](#notes)
  - [V0.5 Free-Wins Audit](#v05-free-wins-audit)
    - [Purpose](#purpose-38)
    - [Live Runtime State](#live-runtime-state)
    - [Evidence](#evidence)
    - [Honest Read](#honest-read)
    - [Phase Result](#phase-result)
    - [Next Exact Move](#next-exact-move)
  - [V1 Shell-UI Separation Audit](#v1-shell-ui-separation-audit)
    - [Intent Held](#intent-held)
    - [Canonical Proof Surface](#canonical-proof-surface)
    - [Earned Result](#earned-result)
    - [Default-On State](#default-on-state)
    - [Kept Boundaries](#kept-boundaries)
    - [Rejected Branch](#rejected-branch)
    - [Next Runtime Pressure](#next-runtime-pressure)
  - [V2 Memory-Growth Audit](#v2-memory-growth-audit)
    - [Intent Held](#intent-held-2)
    - [What Landed](#what-landed)
    - [Evidence](#evidence-2)
    - [Honest Read](#honest-read-2)
    - [Next Runtime Pressure](#next-runtime-pressure-2)
    - [Full Proof](#full-proof)
  - [Sprite Cache Contract](#sprite-cache-contract)
    - [Intent](#intent)
    - [Appearance Key](#appearance-key)
    - [Cache Families](#cache-families)
    - [Hard Boundaries](#hard-boundaries)
    - [Cache Limits](#cache-limits)
    - [Invalidation Rule](#invalidation-rule)
    - [Landed First Slice](#landed-first-slice)
  - [V3 Sprite Baking Audit](#v3-sprite-baking-audit)
    - [Intent Held](#intent-held-3)
    - [What Landed](#what-landed-2)
    - [Evidence](#evidence-3)
    - [Honest Read](#honest-read-3)
    - [Carry Forward](#carry-forward)
  - [V4 Sim Cadence Audit](#v4-sim-cadence-audit)
    - [Purpose](#purpose-39)
    - [Live Runtime Shape](#live-runtime-shape)
    - [Files](#files)
    - [Proof](#proof)
    - [Guardrail Read](#guardrail-read)
    - [Honest Phase State](#honest-phase-state)
  - [V5 Composite Reduction Audit](#v5-composite-reduction-audit)
    - [Purpose](#purpose-40)
    - [Live Runtime Shape](#live-runtime-shape-2)
    - [Files](#files-2)
    - [Proof](#proof-2)
    - [Guardrail Read](#guardrail-read-2)
    - [Honest Phase State](#honest-phase-state-2)
  - [V6 Worker Offload Audit](#v6-worker-offload-audit)
    - [Purpose](#purpose-41)
    - [Live Runtime Shape](#live-runtime-shape-3)
    - [Files](#files-3)
    - [Proof](#proof-3)
    - [Guardrail Read](#guardrail-read-3)
    - [Honest Phase State](#honest-phase-state-3)
  - [V7 Visual Restoration Audit](#v7-visual-restoration-audit)
    - [Purpose](#purpose-42)
    - [Live Runtime Shape](#live-runtime-shape-4)
    - [Files](#files-4)
    - [Proof](#proof-4)
    - [Guardrail Read](#guardrail-read-4)
    - [Honest Phase State](#honest-phase-state-4)
  - [Active Spatial Unification Board](#active-spatial-unification-board)
    - [Purpose](#purpose-43)
    - [Non-Negotiables](#non-negotiables-4)
    - [Current Diagnosis](#current-diagnosis)
    - [Status Key](#status-key-10)
    - [Phase Ladder](#phase-ladder-8)
    - [Exact Order](#exact-order-5)
    - [Why This Order](#why-this-order-3)
    - [Current Focus](#current-focus-5)
    - [Relationship To Current Runtime Work](#relationship-to-current-runtime-work)
  - [Spatial Unit Contract](#spatial-unit-contract)
    - [Purpose](#purpose-44)
    - [Canonical Rule](#canonical-rule)
    - [Live Mapping](#live-mapping)
    - [Required Boundary](#required-boundary)
    - [Transitional Mismatch Ledger](#transitional-mismatch-ledger)
    - [Phase Gate](#phase-gate)
  - [Spatial Boundary Expansion Audit](#spatial-boundary-expansion-audit)
    - [Purpose](#purpose-45)
    - [Runtime Closure](#runtime-closure)
    - [Proof Snapshot](#proof-snapshot)
    - [Honest Boundary](#honest-boundary)
  - [Doorway Corridor Alignment Audit](#doorway-corridor-alignment-audit)
    - [Purpose](#purpose-46)
    - [Runtime Closure](#runtime-closure-2)
    - [Proof Snapshot](#proof-snapshot-2)
    - [Honest Boundary](#honest-boundary-2)
  - [Entity Footprint Unification Audit](#entity-footprint-unification-audit)
    - [Purpose](#purpose-47)
    - [Runtime Closure](#runtime-closure-3)
    - [Proof Snapshot](#proof-snapshot-3)
    - [Honest Boundary](#honest-boundary-3)
  - [Block Placement + Support Unification Audit](#block-placement-support-unification-audit)
    - [Purpose](#purpose-48)
    - [What Landed](#what-landed-3)
    - [Spatial Truth Closed In `s5`](#spatial-truth-closed-in-s5)
    - [Proof](#proof-5)
    - [Honest Boundary](#honest-boundary-4)
    - [Next Move](#next-move)
  - [Shared Interaction-Space Reconciliation Audit](#shared-interaction-space-reconciliation-audit)
    - [Purpose](#purpose-49)
    - [What Landed](#what-landed-4)
    - [Spatial Truth Closed In `s6`](#spatial-truth-closed-in-s6)
    - [Proof](#proof-6)
    - [Honest Boundary](#honest-boundary-5)
    - [Next Move](#next-move-2)
  - [Spatial Save Migration Audit](#spatial-save-migration-audit)
    - [Purpose](#purpose-50)
    - [What Landed](#what-landed-5)
    - [Proof Shape](#proof-shape)
    - [Evidence](#evidence-4)
    - [Closure](#closure)
    - [Remaining Pressure](#remaining-pressure)
    - [Shared Schema Note](#shared-schema-note)
  - [Spatial Unification Roadmap](#spatial-unification-roadmap)
    - [Intent](#intent-2)
    - [Status Update](#status-update)
    - [Current Status](#current-status-2)
    - [Current Seams](#current-seams)
    - [Target Model](#target-model)
    - [Phase Details](#phase-details-2)
    - [Exact Order](#exact-order-6)
    - [Current Next Move](#current-next-move)
  - [Active Social-Cognition Board](#active-social-cognition-board)
    - [Purpose](#purpose-51)
    - [Problem Shape](#problem-shape)
    - [Non-Negotiables](#non-negotiables-5)
    - [Ownership Map](#ownership-map-5)
    - [Stable Evidence](#stable-evidence)
    - [Status Key](#status-key-11)
    - [Phase Ladder](#phase-ladder-9)
    - [Exact Order](#exact-order-7)
    - [What "Feels Real" Means Here](#what-feels-real-means-here)
    - [Current Focus](#current-focus-6)
    - [Current Truth](#current-truth-3)
  - [Social-Cognition Roadmap](#social-cognition-roadmap)
    - [Intent](#intent-3)
    - [Current Status](#current-status-3)
    - [Current Evidence](#current-evidence)
    - [Locked Family + Owner Truth](#locked-family-owner-truth)
    - [Phase Details](#phase-details-3)
    - [Exact Order](#exact-order-8)
    - [Current Next Move](#current-next-move-2)
  - [Social Truth Audit](#social-truth-audit)
    - [Purpose](#purpose-52)
    - [Primary Evidence](#primary-evidence)
    - [Manual Playtest Snapshot](#manual-playtest-snapshot)
    - [Most Repeated Phrase Shapes](#most-repeated-phrase-shapes)
    - [Weak Follow-Through Pattern](#weak-follow-through-pattern)
    - [Supporting Contrast](#supporting-contrast)
    - [`n0` Outcome](#n0-outcome)
    - [Immediate Requirements For `n0.5`](#immediate-requirements-for-n05)
  - [Social Measurement Harness](#social-measurement-harness)
    - [Purpose](#purpose-53)
    - [Harness Outputs](#harness-outputs)
    - [Current Evidence](#current-evidence-2)
    - [Owner Boundaries](#owner-boundaries)
    - [Phase Gate](#phase-gate-2)
  - [Social Family Lock](#social-family-lock)
    - [Purpose](#purpose-54)
    - [Canonical Family Map](#canonical-family-map)
    - [Owner Map](#owner-map)
    - [Durable vs Derived Rule](#durable-vs-derived-rule)
    - [ML Boundary](#ml-boundary)
    - [Cadence Handshake](#cadence-handshake)
    - [Phase Gate](#phase-gate-3)
  - [Social Motive Rebalance Audit](#social-motive-rebalance-audit)
    - [Purpose](#purpose-55)
    - [What Landed](#what-landed-6)
    - [Proof Artifacts](#proof-artifacts)
    - [n2 Exit Shape](#n2-exit-shape)
    - [Remaining Gap](#remaining-gap)
    - [Status](#status)
  - [Pair Chemistry Texture Audit](#pair-chemistry-texture-audit)
    - [Purpose](#purpose-56)
    - [What Landed](#what-landed-7)
    - [Proof Artifacts](#proof-artifacts-2)
    - [n3 Exit Shape](#n3-exit-shape)
    - [Remaining Gap](#remaining-gap-2)
    - [Status](#status-2)
  - [Butterfly Society Group Tone Audit](#butterfly-society-group-tone-audit)
    - [Purpose](#purpose-57)
    - [Phase Shape](#phase-shape)
    - [Live Runtime Truth](#live-runtime-truth)
    - [Proof Snapshot](#proof-snapshot-4)
    - [Honest Boundaries](#honest-boundaries)
  - [Dialogue-Behavior Follow-Through Audit](#dialogue-behavior-follow-through-audit)
    - [Purpose](#purpose-58)
    - [Phase Shape](#phase-shape-2)
    - [Live Runtime Truth](#live-runtime-truth-2)
    - [Proof Snapshot](#proof-snapshot-5)
    - [Honest Boundaries](#honest-boundaries-2)
  - [Neural-Social Scoring Audit](#neural-social-scoring-audit)
    - [Purpose](#purpose-59)
    - [Phase Shape](#phase-shape-3)
    - [Live Runtime Truth](#live-runtime-truth-3)
    - [Proof Snapshot](#proof-snapshot-6)
    - [Honest Boundaries](#honest-boundaries-3)
  - [Social Surfacing Proof Audit](#social-surfacing-proof-audit)
    - [What Landed](#what-landed-8)
    - [Proof](#proof-7)
    - [Closure](#closure-2)
  - [Social Save Continuity Audit](#social-save-continuity-audit)
    - [Purpose](#purpose-60)
    - [Runtime Closure](#runtime-closure-4)
    - [Proof Snapshot](#proof-snapshot-7)
    - [Regression Check](#regression-check)
    - [Honest Boundary](#honest-boundary-6)
  - [External Playtest Matrix](#external-playtest-matrix)
    - [Purpose](#purpose-61)
    - [Status Key](#status-key-12)
    - [Current Baseline](#current-baseline)
    - [Intake Path](#intake-path)
    - [Immediate Next Lane](#immediate-next-lane)
    - [Environment Matrix](#environment-matrix)
    - [Required Test Flow](#required-test-flow)
    - [Failure Buckets](#failure-buckets)
    - [Promotion Rule](#promotion-rule)
  - [Playtest Triage Log](#playtest-triage-log)
    - [Purpose](#purpose-62)
    - [Intake Rule](#intake-rule)
    - [Status Key](#status-key-13)
    - [Entry Template](#entry-template)
    - [Active Queue](#active-queue)
  - [Implementation Parity Audit](#implementation-parity-audit)
    - [Purpose](#purpose-63)
    - [Current Summary](#current-summary)
    - [System Audit](#system-audit)
    - [Active Gap Order](#active-gap-order)
    - [Closure Baseline](#closure-baseline)
  - [Player-Facing Polish Audit](#player-facing-polish-audit)
    - [Purpose](#purpose-64)
    - [Current Snapshot](#current-snapshot-2)
    - [Audit Detail](#audit-detail)
    - [Active Gap Order](#active-gap-order-2)
  - [Intent and Exclusions Ledger](#intent-and-exclusions-ledger)
    - [Purpose](#purpose-65)
    - [Current Classification Shape](#current-classification-shape)
    - [Live Now](#live-now)
    - [Deferred / Later](#deferred-later)
    - [Removed / Superseded On Purpose](#removed-superseded-on-purpose)
    - [Do Not Reintroduce By Accident](#do-not-reintroduce-by-accident)
    - [Clarifying Boundaries](#clarifying-boundaries)
    - [Use Rule](#use-rule)
  - [Grand-Plan Closure Roadmap](#grand-plan-closure-roadmap)
    - [Scope](#scope-2)
    - [Historical Closure Snapshot](#historical-closure-snapshot)
    - [Active Grand-Plan Items That Still Matter](#active-grand-plan-items-that-still-matter)
    - [Closure Baseline](#closure-baseline-2)
    - [Evidence-Based Remaining Gaps](#evidence-based-remaining-gaps)
    - [Closure Plan From Here](#closure-plan-from-here)
    - [Recommended Near-Term Execution Order](#recommended-near-term-execution-order)
    - [Important Rule](#important-rule)
  - [Implementation Recovery Plan](#implementation-recovery-plan)
    - [Historical Status Notice](#historical-status-notice)
    - [Historical Recovery Snapshot](#historical-recovery-snapshot)
    - [Non-Negotiable Execution Rules](#non-negotiable-execution-rules)
    - [Hard Blocker Bypass Rule](#hard-blocker-bypass-rule)
    - [Owner Boundaries](#owner-boundaries-2)
    - [Elegance Rules](#elegance-rules)
    - [Phase Status](#phase-status)
    - [Master Ordered Checklist](#master-ordered-checklist)
    - [Recovery Completion Snapshot](#recovery-completion-snapshot)
    - [Final Audit Closure](#final-audit-closure)
    - [Phase Advancement Rule](#phase-advancement-rule)
  - [Source-Book De-Staling Rules](#source-book-de-staling-rules)
    - [Purpose](#purpose-66)
    - [Core Shape](#core-shape)
    - [Authority Order](#authority-order)
    - [What Counts As Stale](#what-counts-as-stale)
    - [Allowed Truth States](#allowed-truth-states)
    - [Writing Rules](#writing-rules)
    - [Repair Rule For Stale Docs](#repair-rule-for-stale-docs)
    - [Chapter-Specific Rules](#chapter-specific-rules)
    - [Source-Book Build Rule](#source-book-build-rule)
    - [Required Active Repair Board Alignment](#required-active-repair-board-alignment)
    - [Definition Of Done For Section 5](#definition-of-done-for-section-5)
    - [First Audit Targets](#first-audit-targets)
    - [Implementation Order](#implementation-order-5)
  - [Recovery Blocker Ledger](#recovery-blocker-ledger)
    - [Entry Rules](#entry-rules)
    - [Status Values](#status-values)
    - [Entry Template](#entry-template-2)
    - [Active Entries](#active-entries)
  - [Current Spatial Truth](#current-spatial-truth)
    - [Purpose](#purpose-67)
    - [Live Runtime Shape](#live-runtime-shape-5)
    - [Hard Truths](#hard-truths)
    - [What Is Live Right Now](#what-is-live-right-now)
    - [What Is Not Live Yet](#what-is-not-live-yet)
    - [Ownership Summary](#ownership-summary)
    - [`s0` Owner Ledger](#s0-owner-ledger)
    - [`s0` Seam Ledger](#s0-seam-ledger)
    - [`s0` Later Audit Checklist](#s0-later-audit-checklist)
    - [`s1` Contract Lock](#s1-contract-lock)
    - [Implementation Rule](#implementation-rule)
  - [Later 3D Physics Implementation Plan](#later-3d-physics-implementation-plan)
    - [Purpose](#purpose-68)
    - [What 3D Means In This Game](#what-3d-means-in-this-game)
    - [Zone Border Invariant](#zone-border-invariant)
    - [Current Grounded Runtime Truth](#current-grounded-runtime-truth)
    - [Ownership Plan](#ownership-plan)
    - [New Runtime Layer](#new-runtime-layer)
    - [Runtime Data Shape](#runtime-data-shape-2)
    - [Spatial Model](#spatial-model)
    - [Contact Matrix](#contact-matrix)
    - [Movement Resolution Pipeline](#movement-resolution-pipeline)
    - [Block Placement And Collision Rules](#block-placement-and-collision-rules)
    - [Carry Physics](#carry-physics)
    - [Butterfly ↔ Butterfly Physics](#butterfly-butterfly-physics)
    - [Training Grounds Physics](#training-grounds-physics)
    - [Butterfly ↔ Shelter Interaction](#butterfly-shelter-interaction)
    - [Rendering Implications](#rendering-implications)
    - [AI / ML Integration](#ai-ml-integration)
    - [Debug / Audit Plan](#debug-audit-plan)
    - [Phase Rollout](#phase-rollout)
    - [Invariants](#invariants-7)
    - [Risks To Watch](#risks-to-watch)
    - [Performance Rules](#performance-rules)
    - [Exact Next Implementation Order](#exact-next-implementation-order)
    - [Definition Of Done](#definition-of-done-6)
  - [Closure Audit Matrix](#closure-audit-matrix)
    - [Purpose](#purpose-69)
    - [Shape](#shape-5)
    - [Contract Anchors](#contract-anchors)
    - [Matrix](#matrix)
    - [Phase Two Result](#phase-two-result)
    - [Locked Rule](#locked-rule-2)
    - [Narrower 3D Phase Result](#narrower-3d-phase-result)
  - [Completeness Audit](#completeness-audit)
    - [Scope](#scope-3)
    - [Historical Snapshot](#historical-snapshot)
    - [Confirmed In Code](#confirmed-in-code)
    - [Partial Or Under-Expressed](#partial-or-under-expressed)
    - [Still Active From The Grand Plan](#still-active-from-the-grand-plan)
    - [Current Priorities](#current-priorities)
    - [Notes](#notes-2)
  - [Life-Sim Expression Audit](#life-sim-expression-audit)
    - [Matrix](#matrix-2)
    - [What Changed](#what-changed)
    - [Audit Proof](#audit-proof)
    - [Bounded By Design](#bounded-by-design)
    - [Plain-Language Verdict](#plain-language-verdict)
- [Chapter 4. Architecture and Diagram Appendices](#chapter-4-architecture-and-diagram-appendices-2)
  - [Diagram Prompt Pack](#diagram-prompt-pack)
    - [Global Style Prompt](#global-style-prompt)
    - [1. Whole-Game Systems Architecture](#1-whole-game-systems-architecture)
    - [2. Life-Simulation State Container](#2-life-simulation-state-container)
    - [3. Sleep State Machine](#3-sleep-state-machine)
    - [4. Teaching / Trust / Social Reinforcement Flow](#4-teaching-trust-social-reinforcement-flow)
    - [5. Genetics And Hybrid Breeding Lifecycle](#5-genetics-and-hybrid-breeding-lifecycle)
    - [6. Controls And UI Map](#6-controls-and-ui-map)
    - [7. Save / Load / Audit Workflow](#7-save-load-audit-workflow)
    - [8. Battle Snapshot Separation](#8-battle-snapshot-separation)
  - [Diagram Asset Registry](#diagram-asset-registry)
    - [Purpose](#purpose-70)
    - [Save Convention](#save-convention)
    - [Review Standard](#review-standard)
    - [Canonical Sources](#canonical-sources)
    - [Diagram Ledger](#diagram-ledger)
    - [Future Update Rule](#future-update-rule)
  - [Diagram Save Location](#diagram-save-location)
  - [Whole-Game Systems Architecture](#whole-game-systems-architecture)
  - [Life-Sim State Container](#life-sim-state-container)
  - [Sleep State Machine](#sleep-state-machine)
  - [Teaching Trust Flow](#teaching-trust-flow)
  - [Genetics Breeding Lifecycle](#genetics-breeding-lifecycle)
  - [Controls and UI Map](#controls-and-ui-map)
  - [Save Load Audit Workflow](#save-load-audit-workflow)
  - [Battle Snapshot Separation](#battle-snapshot-separation)

# Chapter 1. Orientation

Start here for the overall shape of the game, the documentation map, and the current player and developer references.

## Documentation Map

_Source: `docs/README.md`_

```text
+==============================================================+
| Documentation Set                                            |
+==============================================================+
| player docs      | how to play and read the game            |
| developer docs   | how systems are built and tuned          |
| diagram prompts  | prompts for external visual diagrams     |
+==============================================================+
```

### Recommended Reading Paths

#### If you want the single master document

1. [source-book/PAPILIONEM-SOURCE-BOOK.pdf](./source-book/PAPILIONEM-SOURCE-BOOK.pdf)
2. [source-book/PAPILIONEM-SOURCE-BOOK.md](./source-book/PAPILIONEM-SOURCE-BOOK.md)
3. [source-book/README.md](./source-book/README.md)

This source book is now the primary reading copy for the project.

#### If you are a player or tester

1. [PAPILIONEM-PLAYER-GUIDE.md](./PAPILIONEM-PLAYER-GUIDE.md)
2. [PLAYTEST.md](../PLAYTEST.md)
3. [PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)

#### If you are developing or tuning the game

1. [source-book/PAPILIONEM-SOURCE-BOOK.pdf](./source-book/PAPILIONEM-SOURCE-BOOK.pdf)
2. [PAPILIONEM-GUIDEBOOK.md](./PAPILIONEM-GUIDEBOOK.md)
3. [GEMINI-DIAGRAM-PROMPTS.md](./GEMINI-DIAGRAM-PROMPTS.md)
4. [DIAGRAM-ASSET-REGISTRY.md](./DIAGRAM-ASSET-REGISTRY.md)
5. [SYSTEM-DIAGRAMS.md](./SYSTEM-DIAGRAMS.md)
6. [guidebook/diagrams/README.md](./guidebook/diagrams/README.md)
7. [core/config.js](../core/config.js)
8. [SOURCE-CHAPTER-COVERAGE-MATRIX.md](./SOURCE-CHAPTER-COVERAGE-MATRIX.md)
9. [ACTIVE-IMPLEMENTATION-BOARD.md](./ACTIVE-IMPLEMENTATION-BOARD.md)
10. [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md)
11. [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md)
12. [EXPANSION-EXECUTION-PLAYBOOK.md](./EXPANSION-EXECUTION-PLAYBOOK.md)
13. [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
14. [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
15. [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)
16. [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
17. [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
18. [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
19. [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md)
20. [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
21. [ACTIVE-RUNTIME-HARDENING-BOARD.md](./ACTIVE-RUNTIME-HARDENING-BOARD.md)
22. [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
23. [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md)
24. [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md)
25. [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
26. [BASELINE.md](./BASELINE.md)
27. [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md)
28. [V1-SHELL-UI-SEPARATION-AUDIT.md](./V1-SHELL-UI-SEPARATION-AUDIT.md)
29. [V2-MEMORY-GROWTH-AUDIT.md](./V2-MEMORY-GROWTH-AUDIT.md)
30. [SPRITE-CACHE-CONTRACT.md](./SPRITE-CACHE-CONTRACT.md)
31. [V3-SPRITE-BAKING-AUDIT.md](./V3-SPRITE-BAKING-AUDIT.md)
32. [V4-SIM-CADENCE-AUDIT.md](./V4-SIM-CADENCE-AUDIT.md)
33. [V5-COMPOSITE-REDUCTION-AUDIT.md](./V5-COMPOSITE-REDUCTION-AUDIT.md)
34. [V6-WORKER-OFFLOAD-AUDIT.md](./V6-WORKER-OFFLOAD-AUDIT.md)
35. [V7-VISUAL-RESTORATION-AUDIT.md](./V7-VISUAL-RESTORATION-AUDIT.md)
36. [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
37. [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
38. [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md)
39. [DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md](./DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md)
40. [ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md](./ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md)
41. [BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md](./BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md)
42. [SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md](./SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md)
43. [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md)
44. [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
45. [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)
46. [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
47. [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
48. [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md)
49. [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md)
50. [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md)
51. [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
52. [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
53. [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md)
54. [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)
55. [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md)
56. [CLAUDE-EXPANSION-PLAN-REVIEW-PROMPT.md](./CLAUDE-EXPANSION-PLAN-REVIEW-PROMPT.md)

#### If you want the current acceptance target and remaining gaps

- [GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)
- [GOAL-ALIGNMENT-REVIEW-PACKET.md](./GOAL-ALIGNMENT-REVIEW-PACKET.md)
- [G0-BAR-STAGE-A-SIGNOFF.md](./G0-BAR-STAGE-A-SIGNOFF.md)
- [G1-SPATIAL-ACCEPTANCE-SWEEP.md](./G1-SPATIAL-ACCEPTANCE-SWEEP.md)
- [G2-LIVE-BUILDING-BEHAVIOR-PROOF.md](./G2-LIVE-BUILDING-BEHAVIOR-PROOF.md)
- [G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md](./G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md)
- [COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md](./COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md)
- [COMPOSED-BENCHMARK-BASELINE-2026-04-27.md](./COMPOSED-BENCHMARK-BASELINE-2026-04-27.md)

The current implementation board is frozen clean after `I1` through `I5`.
Use the matrix for the live hold/deferred picture, and only reopen a new
implementation board if fresh non-deferred work is intentionally promoted.
The expansion board, remaining roadmap, and execution playbook now preserve the
completed ecology-depth, later-3D, and machine-learning expansion path.
The public-share board now tracks the release-facing hardening work needed to
move from a frozen internal build to a wider outside-tester/public-alpha path.
The active plan registry is now the top-level index for all current plan
tracks, showing which boards are still active, which ones are parent/child
tracks, and which older boards are only historical context.
The active completion board is now the one-page closure ladder that says what
still has to land, in what exact order, before the active runtime, spatial,
social, and public-share tracks can all be called complete together.
The `g0-bar` Stage A signoff sheet now packages the human acceptance closure
for `g1` through `g3`, so the remaining blocker is a concrete 20-minute
review artifact rather than an abstract "someone should sign this off" step.
The `g1` spatial acceptance sweep companion now records the local lived-in
proof stack and the remaining human-signoff/mixed-stage thinness against the
new goal-alignment acceptance bar.
The `g2` live building behavior proof now records the first passing lived-in
builder-pocket lane, showing repeated choose/carry/place/revisit behavior
without claiming that uncontrolled free-play colony-building is fully closed.
The `g3` movement naturalness companion now records that the current local
movement/dispersal stack is mechanically green, while the remaining closure
item is a human free-play grace/readability signoff rather than a named route
bug.
The composed benchmark harness workflow now defines how runtime work should use
the new deterministic single-zone/block/flower scenarios instead of relying on
synthetic `butterflies-N` sweeps as the main runtime truth.
The composed benchmark baseline packet now freezes the first official runtime
reality packet from those new scenarios, including the named realistic-lane
hotspots and the current contradiction between the `single-zone-122` validation
note and the current branch tip.
The external playtest matrix now defines which environments are actually
validated versus merely prepared.
The triage log now acts as the intake landing spot for real outside-tester
findings before `R4` code/doc fixes are chosen.
The superseded runtime-hardening board now preserves the earlier `h1`-`h5`
repair path as historical context.
The active visual-first runtime board now owns the current smoothness work and
the baseline-first implementation order required before any further
optimization-phase code can be judged honestly.
The visual-first runtime optimization plan records the review-first path for
restoring high-fidelity visuals and trails while solving smoothness through
architecture, caching, cadence, and memory improvements instead of degrading
the look or cutting core systems.
The refined companion turns that optimization path into an implementation-ready
phase ladder with concrete metrics, flags, harness requirements, and review
gate expectations aligned to the current repo truth.
The baseline doc is the canonical home for the lived-in save capture set and
phase-by-phase before/after references once `v0` is complete.
The `v0.5` free-wins audit is the runtime rollback note for the implemented
but-not-yet-earned free-win flags, preserving the dedicated seam pass, the
post-`s3` quick compare, and the rule that the defaults stay off until the
visible-frame regressions are isolated and fixed.
The `v1` shell-ui separation audit is the runtime freeze note for the DOM shell
panel migration, recording the canonical lived-in-save diff that earned closure
plus the rejected DOM-HUD experiment that was explicitly rolled back.
The `v2` memory-growth audit is now the stable `v2` closure note for the
memory-attribution seam, finished-capture compaction, and the lived-in save
retention reduction pass, including the edge-local residue compaction that
reduced communication retention without flattening durable social truth or
blocking the next sharp-creature restoration phase.
The sprite-cache contract now locks the render-only ownership, appearance-key
shape, cache families, and cap rules for the `v3` creature-baking path so the
cache cannot drift into gameplay or save truth.
The `v3` sprite-baking audit is now the active runtime phase note for the
first baked-sprite slice, recording the live butterfly/caterpillar/cocoon
reuse path, the quick lived-in smoke improvements, and the remaining atlas +
parity work before `v3` can close honestly.
The `v5` composite-reduction audit is now the active runtime phase note for the
retained clean-shell composite + DOM-guide seams, recording the stacked-runtime
`a4` win, the materially improved but still-failing `h5` lane, the rejected
static-block cache experiment, and the rule that battle and canvas-heavy shell
paths stay on the conservative full-frame composite route until later proof
earns more.
The `v6` worker-offload audit now records the first stateless ML worker cut,
the default-off bootstrap scaffolding, and the honest result that the best
deferred-trace worker seam is still only groundwork, not promoted live runtime
truth. The `v7` visual-restoration audit freezes the return of sharp creatures
plus the player-facing trail presets, recording that off/reduced/full all hold
on the lived-in save while the shipped default remains trails off.
The active spatial unification board and roadmap now capture the planned
board/unit/occupancy reconciliation work needed to align movement bounds,
doorway corridors, block sizing, and shared pseudo-3D interaction truth before
any broad geometry promotion is attempted. The spatial boundary expansion audit
is now the stable `s2` closure note, recording the widened shared board,
lighter placement inset, and the proof that doorway/corridor alignment was the
next active spatial phase. The doorway corridor alignment audit is now the
stable `s3` closure note, recording the corridor-owned approach, lineup,
cover, warp, and settle anchors plus the distance-aware route staging that
makes `s4` entity-footprint unification the next active spatial pressure. The
entity footprint unification audit is now the stable `s4` closure note,
recording the shared family footprint registry, the handoff of carry/spacing
fallbacks onto that registry, and the proof that `s5` block placement/support
unification is the next active spatial phase. The block placement/support
unification audit is now the stable `s5` closure note, recording the canonical
block-unit handoff for openings, support columns, scatter spacing, safe-drop
fallback, and stack lift before `s6` widens that same contract out to the
remaining cross-entity interaction space.
The active social-cognition board and roadmap now capture the planned work
needed to make butterflies read as a real society with richer feelings,
relationship chemistry, group tone, and later behavior follow-through instead
of mostly warning/correction loops.
The social-truth audit is now the concrete `n0` evidence map from real play,
showing exactly which motive families dominate now and which ones remain
under-expressed before the measurement harness and family lock phases begin.
The social-measurement harness is now the stable `n0.5` proof layer, recording
the measurable motive mix, pair-distinctness, and follow-through proxy instead
of relying only on subjective feed impressions.
The social-family lock is now the stable `n1` contract for canonical emotion,
pair-chemistry, society, and motive families, plus the owner split that keeps
life-sim, communication, ML, and UI from drifting into overlapping social
truth.
The social-motive rebalance audit is now the stable `n2` closure note,
recording the broadened everyday social mix, the suppressed low-risk warning
loops, and the proof that `n3` pair-chemistry work is the next active social
need.
The pair-chemistry texture audit is now the stable `n3` closure note,
recording the derived pair-texture layer, the feed/inspect surfacing proof,
and the follow-through evidence that distinct one-to-one relationships are now
live before `n4` widens that depth into full butterfly-society behavior.
The butterfly-society group-tone audit is now the stable `n4` closure note,
recording witnessed social carry-over, clique comfort/exclusion, protective
rings, reputation-wave surfacing, and the proof that `n5` later-behavior
follow-through is now the next active social pressure.
The dialogue-behavior follow-through audit is now the stable `n5` closure
note, recording visible partner-return, avoidance, admiring-shadow, and
protective carry-over plus the proof that `n6` neural/social scoring is now
the next active social phase.
The neural-social scoring audit is now the stable `n6` closure note, recording
the read-only social feature widening, the richer heuristic social weighting,
the live `14 groups / 98 flat / 124 vec` contract, and the proof that `n7`
surfacing/proof was the next active social phase. The social surfacing proof
audit is now the stable `n7` closure note, recording the inspect/feed/debug
presentation snapshot path and the proof that `n8` save migration/freeze is the
next active social phase. The social save continuity audit is now the stable
`n8` closure note, recording protected social serialize/restore continuity,
overload recovery without forced fresh-world wipes, and the local freeze point
for the social-cognition track.
The spatial-unit contract is now the stable `s1` lock for `1 block = 1 board
unit = 1 support/stack unit`, making the debug grid explicitly subordinate to
the grounded board contract before the board-expansion and doorway-rebuild
phases begin.
The Claude prompt doc still packages the right context for an external review
pass if a new beyond-baseline board is opened later.

### Document Roles

| Document | Role |
| --- | --- |
| [source-book/PAPILIONEM-SOURCE-BOOK.pdf](./source-book/PAPILIONEM-SOURCE-BOOK.pdf) | compiled master reading copy with chapter structure and table of contents |
| [source-book/PAPILIONEM-SOURCE-BOOK.md](./source-book/PAPILIONEM-SOURCE-BOOK.md) | compiled master Markdown source book built from the underlying docs |
| [PAPILIONEM-PLAYER-GUIDE.md](./PAPILIONEM-PLAYER-GUIDE.md) | player-facing explanation of controls, flow, reading the garden, butterflies, breeding, accessibility, and testing |
| [PAPILIONEM-GUIDEBOOK.md](./PAPILIONEM-GUIDEBOOK.md) | deep developer reference covering systems, ownership, state models, breeding, sleep, battle separation, persistence, and exact config tables |
| [SOURCE-CHAPTER-COVERAGE-MATRIX.md](./SOURCE-CHAPTER-COVERAGE-MATRIX.md) | chapter-by-chapter scan of source-book coverage against proved runtime and deferred boundaries |
| [ACTIVE-IMPLEMENTATION-BOARD.md](./ACTIVE-IMPLEMENTATION-BOARD.md) | frozen implementation sequencing board showing the completed `I1`-`I5` closure path and the boundary for future promoted work |
| [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md) | frozen expansion sequencing board showing the completed ecology-depth, later-3D, and machine-learning path |
| [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md) | frozen phased roadmap recording the closed expansion order and remaining beyond-baseline boundaries |
| [EXPANSION-EXECUTION-PLAYBOOK.md](./EXPANSION-EXECUTION-PLAYBOOK.md) | build-method companion recording how the closed expansion phases were executed, audited, and frozen |
| [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md) | active sequencing board for startup hardening, onboarding, outside playtests, and public-alpha freeze work |
| [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md) | top-level registry for all active issue-resolution plans, their parent/child relationships, and the exact source-of-truth docs for each track |
| [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md) | cross-track closure ladder for the remaining runtime, spatial, social, and public-share work, including the exact gates that still block a true finish |
| [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md) | concrete roadmap for moving from frozen internal build to local-host shareability and then public-alpha readiness |
| [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md) | environment/status matrix for outside playtests, validated launch lanes, and multi-device/browser evidence |
| [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md) | running intake log for outside playtest findings, severity, reproduction notes, and fix status |
| [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md) | exact ordered board for the still-open local playtest issues: freezing, session capture, social depth, material visibility, and scope locks |
| [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md) | detailed implementation order, owner seams, and exit conditions for the remaining playtest follow-up work |
| [ACTIVE-RUNTIME-HARDENING-BOARD.md](./ACTIVE-RUNTIME-HARDENING-BOARD.md) | superseded historical board preserving the earlier `h1`-`h6` runtime-hardening ladder and proof notes |
| [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md) | active sequencing board for the lived-in-save baseline-first visual/runtime optimization track |
| [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md) | detailed build order, owners, and exit conditions for sustained runtime smoothness hardening |
| [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md) | review-first architectural optimization plan that preserves visual quality and core game design while targeting smoothness and long-session stability |
| [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md) | implementation-ready companion to the visual-first plan, with concrete metrics, phase tasks, flag defaults, review gate checks, and baseline/proof requirements |
| [BASELINE.md](./BASELINE.md) | canonical baseline ledger for lived-in-save capture references, per-lane metrics, and phase-by-phase comparisons against `v0` |
| [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md) | runtime closure note for the implemented `v0.5` flags, preserving the seam audit, the post-`s3` quick compare, the one-flag isolation pass, and the rule that the defaults stay off until a later diff proves one safe to re-enable |
| [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md) | active planning board for spatial reconciliation across board bounds, doorway corridors, one-block-to-one-unit truth, footprints, occupancy, and save migration |
| [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md) | exact phase order and owner map for auditing current spatial seams and then unifying board geometry, routes, footprints, blocks, and interaction-space truth |
| [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md) | stable `s2` closure note recording the widened shared board polygon/placement region, the proof that clamps stayed unified, and the handoff into doorway/corridor alignment |
| [DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md](./DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md) | stable `s3` closure note recording the corridor-owned travel anchors, deeper cover tuck, distance-aware doorway commitment, and the handoff into `s4` footprint unification |
| [ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md](./ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md) | stable `s4` closure note recording the shared family footprint registry, the structure/physics/gameCore handoff onto that registry, and the proof that `s5` block placement/support unification is the next active spatial phase |
| [BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md](./BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md) | stable `s5` closure note recording the canonical block-unit handoff for openings, columns, scatter spacing, safe-drop fallback, and stack lift before `s6` widens that truth across the rest of the interaction space |
| [SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md](./SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md) | stable `s6` closure note recording the widened shared interaction-space contract across butterfly sampling, flower placement/relocation, pollen planting, and caterpillar travel before `s7` migrates lived-in saves into the unified board model |
| [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md) | stable `s7` closure note recording widened-board refresh revisions, restore-time placement profiles, and the proof that lived-in saves re-seat without a fresh-world wipe before `s8` freeze work |
| [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md) | active planning board for deepening feelings, relationship chemistry, butterfly society behavior, and neural-social scoring so the simulation reads as emotionally alive |
| [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md) | exact phase order and owner map for auditing the current social/emotional gap and then deepening motives, chemistry, society context, follow-through, and later neural-social scoring |
| [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md) | stable `n0` evidence doc summarizing the real-play capture results that show warning/acknowledgement dominance, under-expressed families, and weak visible follow-through |
| [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md) | stable `n0.5` measurement doc for motive-frequency capture, pair-distinctness, and the current life-sim-owned follow-through proxy |
| [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md) | stable `n1` contract that locks the canonical social families and owner boundaries before motive-rebalance work begins |
| [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md) | stable `n2` closure note recording the broadened motive mix, the suppression of low-risk warning loops, and the proof that `n3` pair chemistry is the next active phase |
| [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md) | stable `n3` closure note recording the pair-texture layer, the feed/inspect surfacing proof, and the follow-through evidence that distinct recurring relationships are now live |
| [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md) | stable `n4` closure note recording witnessed social carry-over, clique comfort/exclusion, protective-ring derivation, reputation-wave surfacing, and the proof that `n5` is the next active social phase |
| [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md) | stable `n5` closure note recording visible later social carry-over in movement and the proof that `n6` neural/social scoring is the next active phase |
| [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md) | stable `n6` closure note recording the richer read-only social feature/scoring seam, the widened live ML feature contract, and the proof that `n7` surfacing/proof is the next active phase |
| [SOCIAL-SURFACING-PROOF-AUDIT.md](./SOCIAL-SURFACING-PROOF-AUDIT.md) | stable `n7` closure note recording the inspect/feed/debug presentation snapshot path, the presentation-only boundary, and the proof that `n8` social save migration/freeze is the next active phase |
| [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md) | stable `n8` closure note recording protected social continuity across save/restore, overload recovery without forced fresh-world wipes, and the local social-track freeze point before the later shared save-schema gate |
| [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md) | stable `s1` contract that locks `1 block = 1 board unit = 1 support/stack unit` and makes the old iso grid debug-only instead of a second spatial authority |
| [CLAUDE-EXPANSION-PLAN-REVIEW-PROMPT.md](./CLAUDE-EXPANSION-PLAN-REVIEW-PROMPT.md) | copy-paste external review prompt for asking Claude to critique and refine the expansion plan |
| [GEMINI-DIAGRAM-PROMPTS.md](./GEMINI-DIAGRAM-PROMPTS.md) | copy-paste prompt pack for generating external diagrams |
| [DIAGRAM-ASSET-REGISTRY.md](./DIAGRAM-ASSET-REGISTRY.md) | registry for external architecture diagrams, saved paths, review status, and future update triggers |
| [SYSTEM-DIAGRAMS.md](./SYSTEM-DIAGRAMS.md) | short collaborator-facing diagram reference for the live genetics, cognition, and ML pipeline shape |
| [guidebook/diagrams/README.md](./guidebook/diagrams/README.md) | preferred save location and naming convention for collaborator-facing diagrams |

### Source-Book Workflow

```text
update source docs
        |
        v
run `node scripts/build-source-book.js`
        |
        v
refresh master Markdown / HTML / PDF book
```

### Suggested Sharing Use

```text
share with testers
|- player guide
|- playtest doc
`- feedback template

share with collaborators
|- source book
|- developer reference
|- config
`- diagram prompts
```

## Developer Reference

_Source: `docs/PAPILIONEM-GUIDEBOOK.md`_

Implementation-derived technical reference for the current milestone branch.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Guidebook Scope â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ project            â”‚ Papilionem                        â•‘
â•‘ purpose            â”‚ player + developer reference      â•‘
â•‘ source of truth    â”‚ current implemented code          â•‘
â•‘ audience           â”‚ developers, testers, collaborators â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 1. Game At A Glance

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Papilionem Shape â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ title screen                                              â•‘
â•‘  â–¼                                                        â•‘
â•‘ multi-zone living garden                                  â•‘
â•‘  â”œâ”€ butterflies / flowers / caterpillars                  â•‘
â•‘  â”œâ”€ memory / social / sleep / teaching systems            â•‘
â•‘  â”œâ”€ genetics / lineage / hybrids                          â•‘
â•‘  â”œâ”€ wild ecology / release-driven uplift loop             â•‘
â•‘  â””â”€ shelter / structure / zone-aware movement truth       â•‘
â•‘  â–¼                                                        â•‘
â•‘ button-first player shell                                 â•‘
â•‘  â”œâ”€ Save / Journal / Feed / Inspect / Access              â•‘
â•‘  â”œâ”€ Battle / Next Zone / overview toggle                  â•‘
â•‘  â””â”€ release / roster / dialogue summaries stay live       â•‘
â•‘  â–¼                                                        â•‘
â•‘ debug + audit layer                                       â•‘
â•‘  â”œâ”€ presets / snapshots / world checks                    â•‘
â•‘  â”œâ”€ restore save / roundtrip / audit world                â•‘
â•‘  â””â”€ replay seed / local-only verification                 â•‘
â•‘  â–¼                                                        â•‘
â•‘ separate top-right single-player autobattle mode          â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Papilionem is a living-garden simulation first. Butterflies are not just visual entities; they carry:

- personality/archetype traits
- drives and emotions
- memory packets
- social relationship edges
- routines and reinforcement
- distortions/biases
- genetics, upbringing, and lifecycle state

On top of that life-sim layer, the game adds:

- feeding and trust interactions
- hybrid breeding and lineage journaling
- hybrid-cap / release-wave ecology pressure
- zone identity, cross-zone travel, and dialogue memory
- accessibility/readability controls
- debug/audit tooling
- a separate single-player autobattle mode built on battle snapshots and commit-back

### 2. Core System Ownership

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Owner Map â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ GameCore                                           â•‘
â•‘  â”œâ”€ ZoneSystem       â”‚ world zones / focus / mode  â•‘
â•‘  â”œâ”€ StatusSystem     â”‚ timed effects / auras       â•‘
â•‘  â”œâ”€ BehaviorSystem   â”‚ current action runtime      â•‘
â•‘  â”œâ”€ ObjectSystem     â”‚ carry/drop/use ownership    â•‘
â•‘  â”œâ”€ SleepSystem      â”‚ sleep transitions           â•‘
â•‘  â”œâ”€ TeachingSystem   â”‚ packets / lessons / trust   â•‘
â•‘  â”œâ”€ BreedingSystem   â”‚ mating / pregnancy / hatch  â•‘
â•‘  â”œâ”€ BattleSystem     â”‚ battle snapshots / commit   â•‘
â•‘  â”œâ”€ SaveSystem       â”‚ durable serialization        â•‘
â•‘  â”œâ”€ TelemetrySystem  â”‚ frame/update metrics         â•‘
â•‘  â”œâ”€ RenderManager    â”‚ visuals only                â•‘
â•‘  â”œâ”€ GameUI           â”‚ player-facing UI            â•‘
â•‘  â””â”€ DebugUI          â”‚ god mode + audit tools      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Key invariant:

```text
one owner per truth
```

Examples:

- sleep state transitions belong to `SleepSystem`
- timed modifiers/cooldowns/charges/immunities belong to `StatusSystem`
- lesson packets and trust-cascade teaching fallout belong to `TeachingSystem`
- hybrid mating/pregnancy/egg/chrysalis/adult flow belongs to `BreedingSystem`
- battle mutations stay inside `BattleSystem` snapshots until commit
- rendering never changes gameplay truth

### 3. Game Flow

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Player Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ title image                                          â•‘
â•‘  â–¼ click / key                                       â•‘
â•‘ focused garden begins                                â•‘
â•‘  â”œâ”€ butterflies wander / trust / feed / sleep        â•‘
â•‘  â”œâ”€ breeding advances lineage and ecology pressure    â•‘
â•‘  â”œâ”€ Journal / Feed / Inspect expose current truth     â•‘
â•‘  â””â”€ zone travel and structure use stay live           â•‘
â•‘  â–¼                                                    â•‘
â•‘ optional debug / audit                               â•‘
â•‘  â”œâ”€ button-driven saves / snapshots / checks         â•‘
â•‘  â”œâ”€ audit presets and local replay seeding           â•‘
â•‘  â””â”€ no required debug keyboard chord layer           â•‘
â•‘  â–¼                                                    â•‘
â•‘ optional top-right battle mode                       â•‘
â•‘  â”œâ”€ roster-vs-garden or strongest-living fallback    â•‘
â•‘  â””â”€ autobattle commits results back into garden      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

At a high level:

1. The title image appears first.
2. Clicking or pressing any key fades into the garden.
3. The garden runs at a fixed simulation delta.
4. Butterflies respond to their internal state, the player cursor, flowers, each other, and owner-system state.
5. Debug mode can be toggled at any time for scenario setup, replay metadata, snapshots, and audits.
6. Battle can be entered from the top-right `Battle` mode without leaving the living garden save.

### 4. Controls

#### 4.1 Normal Play Controls

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Normal Controls â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ any key / click       â”‚ fade out title screen           â•‘
â•‘ Save / Journal / Feed â”‚ top-right button row            â•‘
â•‘ Inspect / Access      â”‚ top-right button row            â•‘
â•‘ Battle / Next Zone    â”‚ top-right button row            â•‘
â•‘ D                     â”‚ toggle debug mode               â•‘
â•‘ B                     â”‚ hold boundary zones overlay     â•‘
â•‘ O                     â”‚ toggle overview mode            â•‘
â•‘ â† / â†’                 â”‚ journal page navigation         â•‘
â•‘ Escape                â”‚ cancel Inspect release checklistâ•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The live shell is button-first. Old panel hotkeys such as `C`, `I`, `A`, `M`,
`T`, `G`, `H`, `S`, and collection rename on `R` are intentionally inactive.

#### 4.2 Debug / Audit Controls

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Debug / Audit Entry â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ D                     â”‚ toggle debug mode                â•‘
â•‘ debug action buttons  â”‚ spawn / hatch / labels          â•‘
â•‘ save / restore        â”‚ button-driven in debug panel     â•‘
â•‘ roundtrip / snapshots â”‚ button-driven in debug panel     â•‘
â•‘ presets / audit world â”‚ button-driven in debug panel     â•‘
â•‘ replay seed           â”‚ button-driven in debug panel     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current runtime note:

- debug keyboard placement/tool-cycling is disabled
- audit hotkeys listed in older docs are not consumed by the runtime
- the debug panel remains the live surface for spawn, save, snapshot, and audit actions

#### 4.3 Debug Buttons

The debug panel also exposes buttons for:

- spawn butterfly
- spawn flower
- spawn pixels
- refresh male pheromone availability
- hatch all eggs
- hatch all cocoons
- place flowers for caterpillars
- toggle sex labels
- `Reset Progression` for a fresh ecology-state reset
- save / restore latest save / verify roundtrip
- capture snapshot
- check world
- compare snapshots
- load / export / import audit presets
- audit world
- start new replay seed

Important meanings:

- `restore latest save` reloads the single current local save snapshot
- `check world` runs invariant checks against live state contradictions
- `audit world` runs the broader roundtrip + snapshot + invariant bundle
- `start new replay seed` starts a fresh deterministic local test session

### 5. World, Camera, And Rendering

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• World Space â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ canvas        â”‚ 800 x 450                           â•‘
â•‘ grid          â”‚ 18 x 18 isometric logic grid        â•‘
â•‘ world layout  â”‚ land-sanctum-world                  â•‘
â•‘ zones         â”‚ multi-zone section scenes           â•‘
â•‘ player views  â”‚ focused-garden / battle             â•‘
â•‘ internal view â”‚ overview remains legacy/internal    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current implementation notes:

- the shipped world is a multi-zone land sanctuary layout
- the simulation and rendering are zone-aware
- the render manager keeps gameplay ranges separate from visual scale
- battle uses a separate arena asset and presentation path

#### Render rules

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Render Rules â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ focused garden      â”‚ moving background allowed       â•‘
â•‘ overview            â”‚ moving background suppressed    â•‘
â•‘ battle              â”‚ moving background off           â•‘
â•‘ battle              â”‚ afterimage trails off           â•‘
â•‘ reduced motion      â”‚ suppresses extra motion         â•‘
â•‘ trail off           â”‚ disables decorative trails      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Important implementation invariant:

```text
render changes appearance only
render never changes gameplay distance, collision, or ownership
```

### 6. Butterfly Archetypes And Abilities

#### 6.1 Base Butterfly Archetypes

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Archetype Roster â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ friendly   â”‚ common      â”‚ warm / trusting               â•‘
â•‘ cautious   â”‚ uncommon    â”‚ delicate / patient            â•‘
â•‘ energetic  â”‚ uncommon    â”‚ fast / zippy                  â•‘
â•‘ skittish   â”‚ rare        â”‚ nervous / erratic             â•‘
â•‘ wise       â”‚ rare        â”‚ calm / teaching               â•‘
â•‘ mystic     â”‚ epic        â”‚ magical / sleep-comfort       â•‘
â•‘ golden     â”‚ legendary   â”‚ special / divine              â•‘
â•‘ hybrid     â”‚ bred        â”‚ inherited mix                 â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

#### 6.2 Base Trait Axes

Every butterfly personality provides a trait bundle:

- `speed`
- `jitteriness`
- `trustPropensity`
- `trustSpeed`
- `scareThreshold`
- `happinessBonus`

These traits affect movement, fear response, feeding reward, and interaction feel.

#### 6.3 Ability Mapping

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Ability Mapping â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ friendly   â”‚ Warm Welcome   â”‚ healing + panic support    â•‘
â•‘ cautious   â”‚ Delicate Pink  â”‚ sparkle trail             â•‘
â•‘ energetic  â”‚ Electric Violetâ”‚ speed zone / state boost  â•‘
â•‘ skittish   â”‚ Nervous Jewel  â”‚ trust cascade             â•‘
â•‘ wise       â”‚ Ancient Scholarâ”‚ teaching aura             â•‘
â•‘ mystic     â”‚ Twilight Dancerâ”‚ sleep comfort aura        â•‘
â•‘ golden     â”‚ legendary      â”‚ special crown state       â•‘
â•‘ hybrid     â”‚ inherited      â”‚ one chosen parent ability â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current visual readability rule:

- radius-based support abilities render as colored rings sized to their actual gameplay radius
- one-shot/pulse abilities render as compact symbols instead of generic pixel bursts
- the sparkle trail remains pixel-based because the trail itself is the gameplay surface

#### 6.4 Spawn Distribution

Current base spawn weights:

- friendly: `40`
- cautious: `15`
- energetic: `15`
- skittish: `10`
- wise: `10`
- mystic: `10`
- golden: not in normal weighted spawn; special/unique presence

A type that has already spawned at least twice gets its weight halved, and the removed weight is redistributed to types still under the soft cap.

### 7. The Neuro-Social Life Simulation

This is the deepest part of the game.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LifeSim Container â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ identity                                                   â•‘
â•‘ drives                                                     â•‘
â•‘ emotions                                                   â•‘
â•‘ memories                                                   â•‘
â•‘ socialEdges                                                â•‘
â•‘ routines                                                   â•‘
â•‘ interpretation                                             â•‘
â•‘ distortion                                                 â•‘
â•‘ genetics                                                   â•‘
â•‘ upbringing                                                 â•‘
â•‘ lifecycle                                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

#### 7.1 Identity

Identity tracks:

- `entityType`
- `archetype`
- `source`

For butterflies this usually means:

- `entityType = butterfly`
- `archetype = friendly / wise / hybrid / etc.`
- `source = wild / bred / hybrid`

#### 7.2 Drives

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Drive Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ selfMaintenance                                         â•‘
â•‘ safetyAvoidance                                         â•‘
â•‘ resourceControl                                         â•‘
â•‘ socialConnection                                        â•‘
â•‘ caregiving                                              â•‘
â•‘ exploration                                             â•‘
â•‘ statusExpression                                        â•‘
â•‘ rest                                                    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

These are the long-running pressures that shape what an agent tends to prioritize.

#### 7.3 Emotion Channels

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Emotion Channels â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ threat                                                    â•‘
â•‘ relief                                                    â•‘
â•‘ attachment                                                â•‘
â•‘ rejection                                                 â•‘
â•‘ significance                                              â•‘
â•‘ failure                                                   â•‘
â•‘ curiosity                                                 â•‘
â•‘ agitation                                                 â•‘
â•‘ exhaustion                                                â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

These are not a full planner by themselves. They are inputs into the simulation state and owner systems.

#### 7.4 Memory Families

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Memory Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ place                                                     â•‘
â•‘ object                                                    â•‘
â•‘ interaction                                               â•‘
â•‘ outcome                                                   â•‘
â•‘ routine                                                   â•‘
â•‘ social                                                    â•‘
â•‘ danger                                                    â•‘
â•‘ care                                                      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Memory packets store:

- family
- subject id
- valence
- strength
- recency
- reinforcement count
- emotional coloring
- warped flag
- tags
- created time
- metadata

#### 7.5 Social Edge Families

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Social Edge Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ trust                                                        â•‘
â•‘ comfort                                                      â•‘
â•‘ attachment                                                   â•‘
â•‘ dependence                                                   â•‘
â•‘ rivalry                                                      â•‘
â•‘ resentment                                                   â•‘
â•‘ admiration                                                   â•‘
â•‘ protectiveness                                               â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Edges are persistent relationship summaries. They are not the same thing as memories.

#### 7.6 Routine Families

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Routine Families â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ movement                                                  â•‘
â•‘ social                                                    â•‘
â•‘ care                                                      â•‘
â•‘ resource                                                  â•‘
â•‘ rest                                                      â•‘
â•‘ vigilance                                                 â•‘
â•‘ teaching                                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Routines represent reinforced behavioral tendencies rather than one-off events.

#### 7.7 Interpretation And Distortion

Interpretation tracks:

- clarity
- last signals
- warped signal count

Distortion tracks:

- trauma bias
- anxiety bias
- withdrawal bias
- fixation bias
- insomnia bias
- oversleep bias
- warped teaching bias

These distort existing systems rather than creating separate disconnected mini-systems.

#### 7.8 Upbringing

Upbringing stores:

- imprint sources
- lessons
- routine reinforcement by category

Key rule:

```text
genes define baseline predisposition
upbringing adapts, reinforces, suppresses, or distorts over time
```

### 8. Sleep System

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Sleep State Machine â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ awake                                                        â•‘
â•‘  â–¼ exhaustion threshold / forced sleep                       â•‘
â•‘ settling_sleep                                               â•‘
â•‘  â–¼ settled                                                   â•‘
â•‘ normal_sleep                                                 â•‘
â•‘  â”œâ”€ recovered â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ awake                         â•‘
â•‘  â””â”€ oversleep pressure â”€â”€â”€â”€â”€â–¶ oversleeping                   â•‘
â•‘                              â””â”€ finished â”€â”€â”€â”€â”€â–¶ awake        â•‘
â•‘ forced_battle_sleep â”€â”€â”€â”€â”€â”€â”€â”€â–¶ awake when effect ends         â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Sleep state is owned entirely by `SleepSystem`.

#### Stored sleep fields

- `subtype`
- `exhaustion`
- `sleepPressure`
- `sleepComfort`
- `wakeDrive`
- `oversleepPressure`
- `oversleepHabit`
- `assistSources`
- `settlingSeconds`
- `asleepSeconds`
- `lastSleepStartSeconds`
- `lastWakeSeconds`
- `lastWakeReason`

#### Implemented sleep subtypes

- `settling_sleep`
- `normal_sleep`
- `oversleeping`
- `forced_battle_sleep`

#### Current key tuning defaults

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Sleep Balance â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ assist strength default     â”‚ 0.15                   â•‘
â•‘ settling duration           â”‚ 1.5 s                  â•‘
â•‘ wake minimum sleep          â”‚ 4 s                    â•‘
â•‘ normal recovery base        â”‚ 0.032                  â•‘
â•‘ oversleep threshold base    â”‚ 0.35                   â•‘
â•‘ forced sleep recovery       â”‚ 0.014                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Sleep visuals expose:

- grounded posture
- lower wing motion
- visual y-offset
- visual tilt

### 9. Teaching, Trust, And Social Pacing

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Teaching Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ wise aura pulse                                         â•‘
â•‘  â–¼                                                      â•‘
â•‘ beginTeach(listener)                                    â•‘
â•‘  â–¼                                                      â•‘
â•‘ active lesson timer                                     â•‘
â•‘  â–¼                                                      â•‘
â•‘ resolve lesson                                          â•‘
â•‘  â”œâ”€ packet added                                        â•‘
â•‘  â”œâ”€ upbringing lesson added                             â•‘
â•‘  â”œâ”€ memory added                                        â•‘
â•‘  â”œâ”€ social edge adjusted                                â•‘
â•‘  â””â”€ routine reinforced                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

`TeachingSystem` handles:

- lesson packets by entity
- active lessons
- teaching aura pulses
- trust cascades
- social memories from feeding and cursor interaction

#### Social pacing knobs

Current centralized knobs include:

- teaching pulse radius
- teaching pulse memory valence/strength
- teaching pulse trust/admiration/comfort gains
- trust cascade radius
- trust cascade memory valence/strength
- lesson upbringing strength
- lesson clarity gain
- teaching boost frames

#### Current intent of the tuned pass

The current milestone intentionally slows social escalation so:

- trust feels gradual
- comfort does not spike too fast
- admiration gains from teaching stay readable
- routine reinforcement is noticeable without overwhelming the sim

### 10. Genetics, Lineage, And Breeding

#### 10.1 Genetics Profile

Each life-sim state includes a genetics container:

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Genetics Profile â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ source                                                     â•‘
â•‘ baselineTraits                                             â•‘
â•‘ inheritedTraits                                            â•‘
â•‘ heritageTags                                               â•‘
â•‘ lineageIds                                                 â•‘
â•‘  â”œâ”€ parents                                                â•‘
â•‘  â””â”€ ancestors                                              â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current shipped additions:

- `mutationProfile`
- `lineageTypes`
- `lineageDepth`

#### 10.2 Breeding Lifecycle

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Breeding Lifecycle â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ eligible male + eligible female                             â•‘
â•‘  â–¼ pheromone attraction                                     â•‘
â•‘ mating state                                                â•‘
â•‘  â–¼ completeMating                                           â•‘
â•‘ pregnancy assigned to female                                â•‘
â•‘  â–¼ travel to valid flower                                   â•‘
â•‘ egg attached to flower                                      â•‘
â•‘  â–¼ hatch timer                                              â•‘
â•‘ caterpillar                                                 â•‘
â•‘  â–¼ chrysalis flower lifecycle                               â•‘
â•‘ hybrid butterfly spawn                                      â•‘
â•‘  â–¼ hybrid journal entry                                     â•‘
â•‘ named hybrid in collection                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

#### 10.3 Eligibility Rules

Male eligibility requires:

- sex = `M`
- state = `normal`
- no pheromone cooldown
- not spawning
- not pregnant
- no breeding partner
- can still reproduce
- adult cap not exceeded

Female eligibility requires:

- sex = `F`
- state = `normal`
- not spawning
- not already pregnant
- no breeding partner
- can still reproduce

#### 10.4 Pregnancy Data

Pregnancy holds:

- `active`
- `lifecycleData`
- `targetFlower`

When the pregnant butterfly reaches a valid flower, the system attaches an egg and returns the mother to feeding.

#### 10.5 Inheritance Rules

Hybrid inheritance currently works like this:

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Hybrid Inheritance â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ child sex                 â”‚ random M/F                     â•‘
â•‘ core numeric traits       â”‚ average of both parents        â•‘
â•‘ special ability           â”‚ one random parent ability      â•‘
â•‘ wing donor for each wing  â”‚ random mother/father per wing  â•‘
â•‘ colors                    â”‚ average parent colors          â•‘
â•‘ fertility uses            â”‚ config-owned bred value        â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Inherited trait keys averaged:

- `speed`
- `jitteriness`
- `trustPropensity`
- `trustSpeed`
- `scareThreshold`
- `happinessBonus`

Then:

- `special` is set to the chosen inherited ability, if any
- a `hybridGenome` stores wing donor sources plus body sex
- mutation is treated as post-average genetics truth rather than a learned modifier
- lineage depth, parent refs, and ancestor refs are archived for bred lines
- lineage rarity is descriptive context only; it stays separate from encounter rarity and unlock logic
- the shipped runtime does not use a separate hidden latent/dormant numeric trait layer

#### 10.6 Hybrid Journal And Naming

Every new hybrid gets a hybrid journal entry with:

- id
- personal name / display name
- sex
- born timestamp
- render spec
- parent A render spec
- parent B render spec
- inherited ability
- optional one-letter disambiguator when a later living duplicate shares the same first name

The collection UI exposes a `Rename` button on hybrid pages rather than a
keyboard shortcut.

#### 10.7 Current Hybrid Tuning Defaults

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Hybrid Balance â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ pheromone radius         â”‚ 132                        â•‘
â•‘ mating distance          â”‚ 16                         â•‘
â•‘ mating duration          â”‚ 150 frames                 â•‘
â•‘ male cooldown            â”‚ 21600 frames               â•‘
â•‘ adult hard cap           â”‚ 150                        â•‘
â•‘ zone soft cap            â”‚ 14                         â•‘
â•‘ egg hatch                â”‚ 2700-5400 frames           â•‘
â•‘ cocoon hatch             â”‚ 5400-10800 frames          â•‘
â•‘ bred fertility uses      â”‚ 1                          â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 11. Status System

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Status Ownership â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ effect families                                            â•‘
â•‘ cooldown channels                                          â•‘
â•‘ charge channels                                            â•‘
â•‘ immunity families                                          â•‘
â•‘ aggregated numeric bundle                                  â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The status system stores:

- timed effects by target
- aggregated modifiers by target
- cooldown state by entity
- charge state by entity
- immunity state by entity

#### Canonical status families

- `healing_received_bonus`
- `panic_resistance`
- `aggression_suppression`
- `attack_speed_bonus`
- `movement_speed_bonus`
- `energetic_state_boost`
- `reposition_guidance`
- `cooldown_intelligence`
- `sleep_comfort_bonus`
- `wake_resistance`
- `forced_sleep`
- `forced_sleep_immunity`
- `sleep_recovery_multiplier`

Important rule:

```text
gameplay modifiers should come from the status bundle
not from duplicate ad hoc side logic
```

### 12. Behavior Runtime

`BehaviorSystem` is intentionally lightweight right now. It tracks what an entity is effectively doing and why.

#### Runtime fields

- `currentActionFamily`
- `currentActionSubtype`
- `currentTargetId`
- `currentZoneId`
- `priorityScore`
- `reason`
- `overrideSecondsRemaining`

#### Registered action families

- `idle`
- `wander`
- `seek_resource`
- `care_for_vulnerable`
- `teach_or_listen`
- `sleep`
- `socialize`
- `reposition`
- `battle`

This is a behavior ownership seam, not a full utility AI planner.

### 13. Battle Snapshot Layer

Battle is intentionally isolated from normal garden truth.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Battle Separation â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ live garden entities                                        â•‘
â•‘  â–¼ snapshot participants                                    â•‘
â•‘ battle-local mutable truth                                  â•‘
â•‘  â”œâ”€ hp                                                      â•‘
â•‘  â”œâ”€ pressure                                                â•‘
â•‘  â”œâ”€ retreat flags                                           â•‘
â•‘  â”œâ”€ status bundle clone                                     â•‘
â•‘  â”œâ”€ cooldowns / charges                                     â•‘
â•‘  â””â”€ commit payload                                          â•‘
â•‘  â–¼ resolve                                                  â•‘
â•‘ commit selected results back to live entities               â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Battle snapshots store:

- participant identity/team/role
- HP and pressure
- retreat/defeat state
- exhaustion and sleep subtype
- action family/subtype/target
- carried objects
- social edges
- genetics
- special ability
- commit payload for later garden writeback

Battle events include:

- battle start
- action set
- HP loss/restore
- pressure changes
- cooldown and charge changes
- memory additions
- social adjustments
- resolve
- commit

### 14. Save, Load, And Ecology State

#### 14.1 Save Boundaries

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Persistence Boundary â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ persist durable truth                                         â•‘
â•‘  â”œâ”€ entities                                                  â•‘
â•‘  â”œâ”€ lifeSim                                                   â•‘
â•‘  â”œâ”€ hybrid journal                                            â•‘
â•‘  â”œâ”€ sleep durable state                                       â•‘
â•‘  â”œâ”€ teaching durable state                                    â•‘
â•‘  â”œâ”€ status/cooldown/charge/immunity                           â•‘
â•‘  â””â”€ replay metadata                                           â•‘
â•‘                                                               â•‘
â•‘ rebuild derived state                                         â•‘
â•‘  â”œâ”€ aggregated bundles                                        â•‘
â•‘  â”œâ”€ local summaries                                           â•‘
â•‘  â”œâ”€ zone focus render context                                 â•‘
â•‘  â””â”€ debug text / snapshots                                    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

#### 14.2 Save format highlights

The save system serializes:

- butterflies
- flowers
- caterpillars
- ecology / hybrid state
- runtime state
- foundation systems:
  - zones
  - statuses
  - objects
  - sleep
  - teaching

#### 14.3 Ecology / hybrid state

The live ecology containers store:

- `ecologyMode = wild-release-loop`
- per-wild-butterfly mate / departure history
- starter-pair seeding state
- releases since respawn / total releases
- current release batch
- current release batch lineage / zone counts
- wild baseline modifiers
- release history
- release cohort summaries / modifier highlights
- per-wild release cohort ids
- hybrid journal
- next hybrid id
- pending offspring reservations

Compatibility note:

- restore logic still accepts older encounter/collection-era fields when loading legacy local saves
- unlock-shaped containers remain for compatibility with older saves and older UI expectations
- canonical live ecology truth now belongs to `progressionManager`

### 15. Debug, Audit, And Playtesting

#### 15.1 Audit Presets

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Audit Presets â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Sleep Assist                                            â•‘
â•‘ Teaching Pair                                           â•‘
â•‘ Trust Cascade                                           â•‘
â•‘ Social Web                                              â•‘
â•‘ Hybrid Lineage                                          â•‘
â•‘ Nursery Lineage                                         â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

#### 15.2 Audit Tools

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Audit Tool Stack â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ save / restore latest save                                â•‘
â•‘ roundtrip verifier                                        â•‘
â•‘ snapshots / diff                                          â•‘
â•‘ check world invariants                                    â•‘
â•‘ audit world                                               â•‘
â•‘ replay seed                                               â•‘
â•‘ event reports                                             â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

#### 15.3 Audit World Meaning

The combined `audit world` flow currently summarizes:

- roundtrip save/load health
- invariant status
- snapshot diff status
- current battle count involvement
- local audit footer status back to the debug dock

#### 15.4 Playtest docs

Related practical docs:

- `PLAYTEST.md`
- `PLAYTEST-FEEDBACK.md`

### 16. Accessibility And Readability

The current `Access` panel exposes:

- high contrast UI
- trail visibility
- color mode cycle
- color mode reset
- UI scale

Additional runtime defaults still exist in config but are not currently exposed
as direct Access-panel buttons:

- reduced motion
- battle motion simplify
- colorblind-safe indicators
- strong selection outlines
- trail visibility: `off / reduced / full`
- background atmosphere: `full`
- status indicator density

The render manager obeys these settings in normal gameplay and battle.

### 17. Developer Reference Quick Sheet

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Key Files â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ core/config.js            â”‚ tuning / registries    â•‘
â•‘ core/entity.js            â”‚ life-sim containers    â•‘
â•‘ core/gameCore.js          â”‚ orchestration          â•‘
â•‘ entities/butterfly.js     â”‚ archetypes / behavior  â•‘
â•‘ systems/sleepSystem.js    â”‚ sleep ownership        â•‘
â•‘ systems/teachingSystem.js â”‚ social/lesson owner    â•‘
â•‘ systems/statusSystem.js   â”‚ modifiers/cooldowns    â•‘
â•‘ systems/breedingSystem.js â”‚ mating + hybrids       â•‘
â•‘ systems/battleSystem.js   â”‚ snapshot combat        â•‘
â•‘ systems/saveSystem.js     â”‚ persistence            â•‘
â•‘ ui/gameUI.js              â”‚ player UI              â•‘
â•‘ ui/debugUI.js             â”‚ debug + audit tools    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 18. Suggested Reading Order

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Reading Path â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ 1. this developer reference                            â•‘
â•‘ 2. PLAYTEST.md                                         â•‘
â•‘ 3. PLAYTEST-FEEDBACK.md                                â•‘
â•‘ 4. core/config.js                                      â•‘
â•‘ 5. core/entity.js                                      â•‘
â•‘ 6. breeding / sleep / teaching / status systems        â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 19. Summary

```text
Papilionem currently works as:

a multi-zone living garden simulation
with persistent internal state
plus a wild ecology / release-driven lineage loop, ML-backed decision layers,
single-player autobattle, and local audit tooling
wrapped in a player-facing and tester-facing shell
```

That is the cleanest way to think about the game right now.

### 20. Exact Config Tables

This section is the literal tunable surface currently centralized in `core/config.js`.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Config Map â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ rendering / canvas / grid / isometric             â•‘
â•‘ entities / particles / colorPools                 â•‘
â•‘ interaction / effects / debug                     â•‘
â•‘ accessibility / simulation                        â•‘
â•‘ balance.sleep / balance.social / balance.hybrid   â•‘
â•‘ world / registries / systems                      â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

#### 20.1 Rendering

| Key | Value |
| --- | --- |
| `rendering.useSprites` | `true` |
| `rendering.butterflyVisualScale` | `1.6` |

#### 20.2 Canvas

| Key | Value |
| --- | --- |
| `canvas.baseWidth` | `800` |
| `canvas.baseHeight` | `450` |
| `canvas.targetWidth` | `800` |
| `canvas.targetHeight` | `450` |
| `canvas.backgroundColor` | `#f4e8dc` |

#### 20.3 Grid

| Key | Value |
| --- | --- |
| `grid.cellSize` | `16` |
| `grid.gridWidth` | `18` |
| `grid.gridHeight` | `18` |
| `grid.debugGridSize` | `32` |
| `grid.gridOffset.x` | `10` |
| `grid.gridOffset.y` | `8` |

#### 20.4 Isometric Projection

| Key | Value |
| --- | --- |
| `isometric.tileWidth` | `18` |
| `isometric.tileHeight` | `9` |
| `isometric.offsetX` | `400` |
| `isometric.offsetY` | `100` |
| `isometric.bounds.minX` | `0` |
| `isometric.bounds.maxX` | `17` |
| `isometric.bounds.minY` | `0` |
| `isometric.bounds.maxY` | `17` |

#### 20.5 Entity Limits And Base Entity Config

| Key | Value |
| --- | --- |
| `entities.maxButterflies` | `12` |
| `entities.maxFlowers` | `6` |
| `entities.heightOffset.butterfly` | `10` |
| `entities.heightOffset.flower` | `0` |
| `entities.heightOffset.pixel` | `0` |

#### 20.6 Butterfly Base Config

This config list still exists, but the live butterfly roster comes from the
runtime archetype registries rather than this three-label compatibility array.

| Key | Value |
| --- | --- |
| `entities.butterfly.size` | `12` |
| `entities.butterfly.speed` | `0.008` |
| `entities.butterfly.wanderTimer.min` | `40` |
| `entities.butterfly.wanderTimer.max` | `90` |
| `entities.butterfly.maxWanderDistance` | `3` |
| `entities.butterfly.lifetime` | `10000` |
| `entities.butterfly.personalities` | `brave, cautious, curious` |

#### 20.7 Butterfly Spawn Weights

These are implementation weights in `entities/butterfly.js`, not `core/config.js`.

| Archetype | Weight |
| --- | --- |
| `friendly` | `40` |
| `cautious` | `15` |
| `energetic` | `15` |
| `skittish` | `10` |
| `wise` | `10` |
| `mystic` | `10` |
| `golden` | special/nonstandard spawn path |

#### 20.8 Flower Base Config

| Key | Value |
| --- | --- |
| `entities.flower.types` | `daisy, tulip, sprout, lavender, bush` |
| `entities.flower.stemHeight` | `16` |
| `entities.flower.stageDurations.bloom` | `1200` |
| `entities.flower.stageDurations.mature` | `2400` |
| `entities.flower.stageDurations.wilting` | `1200` |
| `entities.flower.stageDurations.dissolve` | `360` |

#### 20.9 Particles

| Key | Value |
| --- | --- |
| `particles.maxParticles` | `100` |
| `particles.gravity` | `0.1` |
| `particles.pixelSize` | `2` |
| `particles.bounce` | `0.3` |
| `particles.friction` | `0.99` |
| `particles.types.scale.lifetime` | `-1` |
| `particles.types.scale.fadeSpeed` | `0` |
| `particles.types.joy.lifetime` | `255` |
| `particles.types.joy.fadeSpeed` | `2` |
| `particles.types.stress.lifetime` | `180` |
| `particles.types.stress.fadeSpeed` | `3` |
| `particles.types.happy.lifetime` | `-1` |
| `particles.types.happy.fadeSpeed` | `0` |
| `particles.types.happy_visual.lifetime` | `200` |
| `particles.types.happy_visual.fadeSpeed` | `1` |

#### 20.10 Color Pools

| Key | Value |
| --- | --- |
| `colorPools.radius` | `20` |
| `colorPools.requiredPixels` | `50` |
| `colorPools.pulseSpeed` | `0.1` |
| `colorPools.spawnDelay` | `180` |
| `colorPools.gridSize` | `40` |

#### 20.11 Interaction

These cursor comfort/flee radii remain a compatibility-tuning surface. The live
zone/ecology/archetype identity model comes from the zone and stat-profile
systems rather than these three legacy labels alone.

| Key | Value |
| --- | --- |
| `interaction.stillFramesRequired` | `120` |
| `interaction.cursorZoneRadius` | `30` |
| `interaction.butterflyZones.brave.comfort` | `60` |
| `interaction.butterflyZones.brave.flee` | `40` |
| `interaction.butterflyZones.cautious.comfort` | `100` |
| `interaction.butterflyZones.cautious.flee` | `80` |
| `interaction.butterflyZones.curious.comfort` | `80` |
| `interaction.butterflyZones.curious.flee` | `60` |

#### 20.12 Effects

| Key | Value |
| --- | --- |
| `effects.shadowOpacity` | `50` |
| `effects.glowPulseSpeed` | `0.1` |
| `effects.swaySpeed.min` | `0.02` |
| `effects.swaySpeed.max` | `0.03` |
| `effects.swayAmount` | `0.1` |

#### 20.13 Debug Surface

| Key | Value |
| --- | --- |
| `debug.enabled` | `false` |
| `debug.showGrid` | `true` |
| `debug.showZones` | `true` |
| `debug.showCoordinates` | `true` |
| `debug.showFPS` | `true` |
| `debug.gardenTimeControls.enabledInNormalPlay` | `false` |
| `debug.gardenTimeControls.debugSpeedPresets` | `1, 2, 4` |
| `debug.auditTools.scenarioPresets` | `true` |
| `debug.auditTools.snapshotDiff` | `true` |
| `debug.auditTools.invariantChecker` | `true` |
| `debug.auditTools.eventTimeline` | `true` |
| `debug.auditTools.saveLoadVerifier` | `true` |
| `debug.auditTools.screenshotNotes` | `true` |

#### 20.14 Accessibility

These are runtime defaults from `core/config.js`; the current Access panel only
surfaces high contrast, trails, color mode/color off, and UI scale directly.

| Key | Value |
| --- | --- |
| `accessibility.reducedMotion` | `false` |
| `accessibility.battleMotionSimplify` | `true` |
| `accessibility.highContrastUI` | `false` |
| `accessibility.colorblindSafeIndicators` | `true` |
| `accessibility.strongSelectionOutlines` | `true` |
| `accessibility.trailVisibility` | `off` |
| `accessibility.backgroundAtmosphere` | `full` |
| `accessibility.statusIndicatorDensity` | `simplified` |
| `accessibility.uiScale` | `1` |

#### 20.15 Simulation

| Key | Value |
| --- | --- |
| `simulation.defaultTimeScale` | `1` |
| `simulation.battleTimeScales` | `1, 2` |
| `simulation.frameRate` | `60` |
| `simulation.fixedDeltaSeconds` | `1 / 60` |

#### 20.16 Sleep Balance

| Key | Value |
| --- | --- |
| `balance.sleep.assistStrengthDefault` | `0.15` |
| `balance.sleep.movementMultiplierSettling` | `0.25` |
| `balance.sleep.wingAnimationMultiplierSettling` | `0.35` |
| `balance.sleep.wingAnimationMultiplierAsleep` | `0.08` |
| `balance.sleep.visualYOffsetSettling` | `1.5` |
| `balance.sleep.visualYOffsetAsleep` | `3` |
| `balance.sleep.visualTiltSettling` | `0.08` |
| `balance.sleep.visualTiltAsleep` | `0.18` |
| `balance.sleep.passiveExhaustionBaseGain` | `0.006` |
| `balance.sleep.passiveExhaustionRestMultiplier` | `0.004` |
| `balance.sleep.passiveExhaustionInsomniaMultiplier` | `0.002` |
| `balance.sleep.settleThresholdBase` | `0.62` |
| `balance.sleep.settleThresholdFloor` | `0.28` |
| `balance.sleep.settleThresholdInsomniaMultiplier` | `0.08` |
| `balance.sleep.settleThresholdComfortMultiplier` | `0.05` |
| `balance.sleep.settlingDurationSeconds` | `1.5` |
| `balance.sleep.normalRecoveryBaseRate` | `0.032` |
| `balance.sleep.normalRecoveryComfortMultiplier` | `0.014` |
| `balance.sleep.oversleepPressureGainMultiplier` | `0.02` |
| `balance.sleep.wakeThresholdBase` | `0.18` |
| `balance.sleep.wakeThresholdFloor` | `0.08` |
| `balance.sleep.wakeThresholdResistanceMultiplier` | `0.03` |
| `balance.sleep.wakeMinimumSleepSeconds` | `4` |
| `balance.sleep.oversleepThresholdBase` | `0.35` |
| `balance.sleep.oversleepThresholdBiasMultiplier` | `0.15` |
| `balance.sleep.oversleepRecoveryRate` | `0.02` |
| `balance.sleep.oversleepPressureDecayRate` | `0.016` |
| `balance.sleep.forcedSleepRecoveryRate` | `0.014` |
| `balance.sleep.passiveOversleepPressureDecayRate` | `0.004` |

#### 20.17 Social Balance

| Key | Value |
| --- | --- |
| `balance.social.teachingLessonDurationSeconds` | `1.6` |
| `balance.social.teachingPulseRadius` | `76` |
| `balance.social.teachingPulseMemoryValence` | `0.22` |
| `balance.social.teachingPulseMemoryStrength` | `0.26` |
| `balance.social.teachingPulseEdgeTrust` | `0.02` |
| `balance.social.teachingPulseEdgeAdmiration` | `0.035` |
| `balance.social.teachingPulseEdgeComfort` | `0.015` |
| `balance.social.teachingPulseRoutineReinforcement` | `0.025` |
| `balance.social.trustCascadeRadius` | `132` |
| `balance.social.trustCascadeMemoryValence` | `0.28` |
| `balance.social.trustCascadeMemoryStrength` | `0.34` |
| `balance.social.trustCascadeEdgeTrust` | `0.035` |
| `balance.social.trustCascadeEdgeComfort` | `0.025` |
| `balance.social.trustCascadeEdgeAdmiration` | `0.015` |
| `balance.social.lessonUpbringingStrength` | `0.28` |
| `balance.social.lessonRoutineReinforcement` | `0.05` |
| `balance.social.lessonInterpretationClarityGain` | `0.01` |
| `balance.social.lessonMemoryValence` | `0.36` |
| `balance.social.lessonMemoryStrength` | `0.4` |
| `balance.social.lessonEdgeTrust` | `0.03` |
| `balance.social.lessonEdgeAdmiration` | `0.04` |
| `balance.social.lessonEdgeComfort` | `0.02` |
| `balance.social.listenerTeachingRoutineReinforcement` | `0.035` |
| `balance.social.teacherTeachingRoutineReinforcement` | `0.025` |
| `balance.social.teachingBoostFrames` | `16` |

#### 20.18 Hybrid Balance

| Key | Value |
| --- | --- |
| `balance.hybrid.pheromoneRadius` | `132` |
| `balance.hybrid.matingDistance` | `16` |
| `balance.hybrid.matingDurationFrames` | `150` |
| `balance.hybrid.pheromoneCooldownFrames` | `21600` |
| `balance.hybrid.adultHardCap` | `150` |
| `balance.hybrid.zoneAdultSoftCap` | `14` |
| `balance.hybrid.zoneReservationCap` | `2` |
| `balance.hybrid.eggHatchFrames.min` | `2700` |
| `balance.hybrid.eggHatchFrames.max` | `5400` |
| `balance.hybrid.cocoonHatchFrames.min` | `5400` |
| `balance.hybrid.cocoonHatchFrames.max` | `10800` |
| `balance.hybrid.bredFertilityUses` | `1` |

#### 20.19 World

| Key | Value |
| --- | --- |
| `world.layout` | `land-sanctum-world` |
| `world.renderMode` | `section-scenes` |
| `world.overviewMode` | `false` |
| `world.viewModes` | `overview, focused-garden, battle` |
| `world.zones[0].id` | `ivy-cloister` |
| `world.zones[0].label` | `Open Land NW` |
| `world.zones[0].kind` | `open-land` |
| `world.zones[0].poolAllowed` | `false` |
| `world.zones[0].bounds.minX` | `0` |
| `world.zones[0].bounds.maxX` | `8` |
| `world.zones[0].bounds.minY` | `0` |
| `world.zones[0].bounds.maxY` | `8` |
| `world.zones[0].renderProfile.movingBackgroundEffectsInFocus` | `false` |
| `world.zones[0].renderProfile.movingBackgroundEffectsInOverview` | `false` |
| `world.zones[0].renderProfile.afterimageTrailsInFocus` | `true` |
| `world.zones[0].renderProfile.afterimageTrailsInBattle` | `false` |

#### 20.20 Registries

| Registry | Values |
| --- | --- |
| `registries.actionFamilies` | `idle, wander, seek_resource, care_for_vulnerable, teach_or_listen, sleep, socialize, reposition, battle` |
| `registries.statusFamilies` | `healing_received_bonus, panic_resistance, aggression_suppression, attack_speed_bonus, movement_speed_bonus, energetic_state_boost, reposition_guidance, cooldown_intelligence, sleep_comfort_bonus, wake_resistance, forced_sleep, forced_sleep_immunity, sleep_recovery_multiplier` |
| `registries.sleepSubtypes` | `settling_sleep, normal_sleep, oversleeping, forced_battle_sleep` |
| `registries.battleStates` | `inactive, snapshotting, active, resolving, committing` |
| `registries.persistenceFieldClasses` | `durable, derived, runtime` |

#### 20.21 System Boot Order

| Key | Value |
| --- | --- |
| `systems.phaseFoundationOrder` | `zoneSystem, statusSystem, behaviorSystem, objectSystem, sleepSystem, teachingSystem, battleSystem, saveSystem` |

#### 20.22 Exact Hybrid Inheritance Rules

These are behavior rules in `systems/breedingSystem.js`, not config fields.

```text
eligible male + eligible female
        â–¼
female locks onto strongest nearby male in pheromone radius
        â–¼
distance <= matingDistance
        â–¼
mating for matingDurationFrames
        â–¼
completeMating()
        â”œâ”€ fertility uses decremented
        â”œâ”€ male cooldown applied
        â”œâ”€ lifecycleData created
        â””â”€ pregnancy assigned to female
```

Exact inheritance behavior:

| Rule | Current behavior |
| --- | --- |
| child sex | random male/female |
| chosen ability | one parent ability chosen randomly |
| core traits | averaged between both parents |
| wing donors | chosen independently per wing: `foreLeft`, `foreRight`, `hindLeft`, `hindRight` |
| colors | parent primary/secondary colors averaged |
| hybrid fertility | bred offspring get `bredFertilityUses` from config |
| persistence | `hybridGenome`, `lineageIds`, pregnancy/lifecycle data, hybrid journal entry |

## Player Guide

_Source: `docs/PAPILIONEM-PLAYER-GUIDE.md`_

Player-facing guide to how the current game build works.

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Player Guide Scope â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ focus     â”‚ how to play, read, and understand the game    â•‘
â•‘ audience  â”‚ players, testers, collaborators               â•‘
â•‘ tone      â”‚ practical, readable, low-jargon               â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

### 1. What Papilionem Is

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Core Experience â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ title screen                                             â•‘
â•‘  â–¼                                                       â•‘
â•‘ living multi-zone garden                                 â•‘
â•‘  â”œâ”€ butterflies wander, react, trust, fear, sleep       â•‘
â•‘  â”œâ”€ flowers support feeding, eggs, and chrysalis stages â•‘
â•‘  â”œâ”€ teaching, memory, and dialogue shape later behavior â•‘
â•‘  â”œâ”€ hybrids inherit traits, wings, colors, and names    â•‘
â•‘  â””â”€ release waves keep the wild ecology moving          â•‘
â•‘  â–¼                                                       â•‘
â•‘ optional debug + audit tools for testing                 â•‘
â•‘  â–¼                                                       â•‘
â•‘ optional autobattle from the top-right Battle button     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Papilionem is a life-simulation game built around butterflies in a living
garden. They are not just animations. They have internal state, social history,
lineage, zone preferences, and readable battle readiness.

### 2. Starting The Game

1. Launch the game.
2. The title screen appears first.
3. Press any key or click to enter the garden.
4. The simulation begins immediately once the garden is live.
5. A short `Quick start` card appears near the upper-left and disappears once you use `Inspect`, `Feed`, `Journal`, `Access`, or debug mode.

### 3. Core Controls

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Live Controls â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ any key / click       â”‚ leave title screen            â•‘
â•‘ Save / Journal / Feed â”‚ top-right click buttons       â•‘
â•‘ Inspect / Access      â”‚ top-right click buttons       â•‘
â•‘ Battle / Next Zone    â”‚ top-right click buttons       â•‘
â•‘ D                     â”‚ toggle debug mode             â•‘
â•‘ B                     â”‚ hold boundary overlay         â•‘
â•‘ O                     â”‚ toggle overview map mode      â•‘
â•‘ â† / â†’                 â”‚ journal page navigation       â•‘
â•‘ Escape                â”‚ cancel Inspect release mode   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Important current truth:

- The main shell is button-first.
- Old panel hotkeys such as `C`, `I`, `A`, `M`, `T`, `G`, `H`, `S`, and `R`
  are not the live way to open those surfaces anymore.
- Hybrid renaming happens with an on-page `Rename` button inside the journal.

### 4. Reading The Garden

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• What To Watch â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ movement        â”‚ who is calm, jittery, or curious    â•‘
â•‘ spacing         â”‚ who feels safe vs pressured         â•‘
â•‘ flower activity â”‚ feeding, eggs, hatch, chrysalis     â•‘
â•‘ closeness       â”‚ trust, comfort, teaching proximity  â•‘
â•‘ talk/feed lines â”‚ recent dialogue and major actions   â•‘
â•‘ zone changes    â”‚ who settles, wanders, or migrates   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The garden is meant to be read as a living system. Butterflies build history.
They remember care, danger, lessons, and other butterflies.

Current boundary worth knowing:

- butterflies can carry and stack shelter blocks
- flowers still matter for feeding, eggs, and lifecycle stages
- flowers are not current build materials in this build

### 5. Zones And Travel

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Zone Identity â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Open Land NW     â”‚ Quiet cloister                     â•‘
â•‘ Training Grounds â”‚ Sun court drills                   â•‘
â•‘ Open Land SW     â”‚ Moss watch                         â•‘
â•‘ Open Land SE     â”‚ Echo pool                          â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Zones are not just background swaps. Each area has its own identity, preferred
flowers, and behavior bias. Butterflies can move between zones for reasons, and
the `Next Zone` button lets you follow the garden one region at a time.

Spatial truth in plain language:

- the game now supports taller stacks and stronger vertical visual cues
- butterflies still live in the grounded garden model rather than a separate
  free-flight altitude simulation

### 6. Feed, Inspect, And Readability

#### 6.1 Feed

The `Feed` panel is a live event stream. It currently groups entries into:

- `Talk`
- `Actions`
- `Learn`

This is the fastest way to see recent dialogue, lifecycle events, teaching, and
other meaningful changes without opening debug tools.

The live feed now reads more like a compact chat log: the player-facing rows no
longer show per-entry tags, and the filter buttons stay color-coded as `Talk`
green, `Actions` blue, and `Learn` pink.

#### 6.2 Inspect

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Inspect Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ choose butterfly                                      â•‘
â•‘  â–¼                                                    â•‘
â•‘ read name / state / zone / genes / readiness         â•‘
â•‘  â–¼                                                    â•‘
â•‘ optional actions                                      â•‘
â•‘  â”œâ”€ List                                              â•‘
â•‘  â”œâ”€ Release                                           â•‘
â•‘  â”œâ”€ Roster                                            â•‘
â•‘  â””â”€ Mate                                              â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Inspect is where the game surfaces the current truth for one butterfly. It
shows live identity, lineage, zone context, roster status, social state,
dialogue summary, and ecology pressure.

If no butterfly is currently locked, `Inspect` opens to a list view. The `All`
button switches that list from the current zone to all butterflies across the
garden, so you can read an off-screen butterfly without selecting it on the
map first.

### 7. Hybrid Lifecycle And Ecology

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Hybrid / Ecology Loop â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ wild adults live in the garden                                â•‘
â•‘  â–¼ mate and lay eggs on flowers                               â•‘
â•‘ egg â†’ caterpillar â†’ chrysalis â†’ hybrid adult                  â•‘
â•‘  â–¼                                                            â•‘
â•‘ hybrid joins journal with a personal name                     â•‘
â•‘  â–¼                                                            â•‘
â•‘ living hybrids count toward the 150-hybrid cap                 â•‘
â•‘  â–¼                                                            â•‘
â•‘ released hybrids contribute to the next wild respawn wave     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Current player-facing ecology rules:

- Living hybrids are capped at `150` across the garden.
- Hybrid pages are named when they emerge.
- If two living hybrids share the same first name, the oldest keeps the plain
  name and later duplicates gain a one-letter suffix.
- Releasing hybrids is the main long-term ecology pressure mechanic.
- Every `10` releases triggers a fresh wild respawn wave.
- Inspect release rows show the current zone, lineage mix, and `batch x/10` progress.
- Journal and Inspect also show the latest release-wave root zone and familiarity summary once a cohort has formed.

### 8. Journal, Roster, And Battle

#### 8.1 Journal

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Journal Tabs â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Collection â”‚ wild types + hybrids                    â•‘
â•‘ Roster     â”‚ battle-ready members and launch path    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The journal is the long-term archive for the garden. In the `Collection` tab
you can:

- review wild types
- inspect hybrid pages
- use the `Rename` button on hybrid pages
- scroll longer page content with the mouse wheel inside the page viewport

#### 8.2 Roster

The `Roster` tab is the battle-facing side of the journal. It lets you:

- add or remove butterflies from the battle roster
- see roster count and readiness
- launch `Battle mode` from the roster shell

#### 8.3 Battle

Single-player battle is autobattle. The game currently does this:

- if you have roster members and there are eligible non-roster opponents, it
  builds your team from the strongest roster butterflies and the opposing team
  from the strongest eligible garden butterflies
- otherwise it auto-splits the strongest living butterflies into both sides
- battle plays on the top-down arena and commits the results back into the
  living garden
- the match opens from back-line release positions and spreads into the arena
  instead of resolving as a cramped instant panel read
- the player-facing shell stays minimal while combat runs: garden feed/inspect
  panels are hidden, small HP bars sit above butterflies, `Pause` remains
  available, and `Return to Garden` appears once the result is ready
- battle events still log internally for the feed/audit path, but the main
  visible proof is now the field itself: movement, ability traces, projectiles,
  and the result overlay

### 9. Release Flow

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Release Flow â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Inspect                                              â•‘
â•‘  â–¼ Release                                           â•‘
â•‘ checklist mode                                       â•‘
â•‘  â”œâ”€ select living hybrids in the viewed zone         â•‘
â•‘  â”œâ”€ press Escape to cancel                           â•‘
â•‘  â””â”€ confirm release to remove them from the garden   â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

Release is handled through `Inspect`, not through a separate detached panel.
Only living hybrids can be released.

What the live shell now tells you during release:

- each checklist row shows the current zone and a short lineage summary
- each checklist row shows the current release progress as `batch x/10`
- after a full batch, later wild butterflies may reflect that wave through mild familiarity and root-zone context
- that shaping is clamped on purpose, so focused releasing is not meant to become a hidden "best build" strategy

### 10. Accessibility

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Access Panel â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ High contrast â”‚ stronger UI contrast                 â•‘
â•‘ Trails        â”‚ off / reduced / full                â•‘
â•‘ Color mode    â”‚ cycle color-friendly modes          â•‘
â•‘ Color off     â”‚ reset color mode                    â•‘
â•‘ UI scale      â”‚ resize the shell                    â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

The `Access` panel is the live player-facing surface for readability controls.
Some additional accessibility defaults still exist internally, but the controls
above are what players can directly change from the current shell.

### 11. Debug Mode For Testers

Debug mode is optional. Press `D` to open it.

Important current truth:

- debug actions are primarily clickable buttons
- save / restore / roundtrip / snapshot / audit actions live in the debug panel
- older debug keyboard placement/tool hotkeys are not the live interaction path

Useful presets still include:

- Sleep Assist
- Teaching Pair
- Trust Cascade
- Social Web
- Hybrid Lineage
- Nursery Lineage

### 12. Best Way To Read The Game

```text
â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• Best Reading Lens â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
â•‘ Papilionem is a small life-simulation garden where mood,  â•‘
â•‘ memory, dialogue, lineage, release pressure, and zone     â•‘
â•‘ identity all matter at the same time.                     â•‘
â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
```

# Chapter 2. Core Contracts

These are the locked rules for the current game. When behavior drifts, these are the first places to reconcile against live code and audits.

## Genetics / Stat Contract

_Source: `docs/GENETICS-STAT-CONTRACT.md`_

### Purpose

This document is the implementation contract for Papilionem's genetics, inheritance, stat expression, and battle-facing stat derivation.

It exists to stop drift.

If a genetics/stat behavior is not supported by:

- this contract
- the verified live formulas in code
- or later explicit user direction

then it should be treated as unresolved rather than improvised.

### Source Anchors

- [C:\Users\fishe\Documents\projects\ephemera\systems\breedingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/breedingSystem.js)
- [C:\Users\fishe\Documents\projects\ephemera\systems\statProfileSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/statProfileSystem.js)
- [C:\Users\fishe\Documents\projects\ephemera\entities\butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
- [C:\Users\fishe\Documents\projects\ephemera\docs\guidebook\gemini-prompts\05-genetics-breeding-lifecycle.md](C:/Users/fishe/Documents/projects/ephemera/docs/guidebook/gemini-prompts/05-genetics-breeding-lifecycle.md)
- [C:\Users\fishe\.codex\skills\life-simulation-architecture\references\genetics-lineage-inheritance.md](C:/Users/fishe/.codex/skills/life-simulation-architecture/references/genetics-lineage-inheritance.md)

### Current Runtime Status

As of the current implementation baseline:

- mutation is explicitly treated as post-average genetics truth and is surfaced in Inspect, journal, and save/load proof
- multi-generation lineage summaries are live through `lineageTypes`, `lineageDepth`, and archived parent/ancestor refs
- lineage rarity is now surfaced separately from encounter rarity; it is descriptive lineage context, not wild unlock or spawn truth
- golden / legendary ancestry follows the same trait, ability, and wing inheritance rules as every other line and does not carry special unlock logic
- the shipped runtime does not implement a separate hidden latent/dormant stat layer; unused parent abilities can appear as lineage notes, but numeric baseline truth is direct

### Shape

```text
╔════════════ Genetic Truth Flow ════════════╗
║ parents                                    ║
║  ├─ baseline traits                        ║
║  ├─ ability                                ║
║  ├─ wing donor sources                     ║
║  └─ colors                                 ║
║            │                               ║
║            ▼                               ║
║ inherited baseline                         ║
║  ├─ averaged core traits                   ║
║  ├─ one inherited ability                  ║
║  ├─ per-wing donor inheritance             ║
║  └─ averaged colors                        ║
║            │                               ║
║            ▼                               ║
║ expressed profile                          ║
║  ├─ baseline traits                        ║
║  ├─ upbringing modifiers                   ║
║  ├─ current-state modifiers                ║
║  └─ effective traits                       ║
║            │                               ║
║            ▼                               ║
║ battle profile                             ║
║  ├─ initiative / offense                   ║
║  ├─ guard / resolve / support              ║
║  └─ derived max HP                         ║
║            │                               ║
║            ▼                               ║
║ readiness profile                          ║
║  ├─ score / tier                           ║
║  ├─ current HP / pressure                  ║
║  └─ strengths / watch-outs                 ║
╚════════════════════════════════════════════╝
```

### Ownership

```text
one owner per truth

breedingSystem     │ parent combination + offspring inheritance
statProfileSystem  │ expressed stats + battle stats + readiness
lifeSimSystem      │ live emotional/social/state modifiers
progressionManager │ lineage journal entries
UI                 │ presentation only
```

### Locked Trait Axes

These are the canonical inherited baseline traits.

```text
speed
jitteriness
trustPropensity
trustSpeed
scareThreshold
happinessBonus
```

UI labels:

```text
speed            │ Speed
jitteriness      │ Jitter
trustPropensity  │ Trust lean
trustSpeed       │ Trust rate
scareThreshold   │ Calmness
happinessBonus   │ Joy gain
```

### Locked Inheritance Rules

These are already explicit and should not be changed without an intentional redesign.

```text
child sex                   │ random
core trait values           │ average mother + father
mutation variance           │ rare post-average trait shifts
inherited ability           │ choose one parent ability randomly
wing inheritance            │ each wing donor chosen independently
colors                      │ average parent colors
bred fertility uses         │ limited
```

### Locked Runtime Layers

#### 1. Baseline Traits

Baseline traits are the inherited or archetype-defined starting truth.

Priority order:

```text
1. lifeSim.genetics.baselineTraits
2. lineageRecord.inheritedTraits
3. parent midpoint reconstruction
4. subject.traits
5. archetype fallback
```

#### 1b. Mutation Layer

Mutation is part of genetics truth, not upbringing or current state.

Rule:

```text
baseline with mutation
  = inherited parent midpoint
  + optional mutant-gene trait shifts
```

Current mutation contract:

```text
chance                  │ 0.20
major mutation chance   │ 0.06
mutated traits          │ 1..2
ability mutation        │ none
```

#### 2. Upbringing Modifiers

Upbringing changes expression, not genotype truth.

Signals already used:

```text
lessons
routineReinforcement
teaching routine strength
warped lesson count
care lessons
social lessons
training lessons
```

#### 3. Current-State Modifiers

Current-state modifiers are derived from live state, not inherited truth.

Signals already used:

```text
emotions
social confidence / belonging
interpretation clarity
status bonuses
sleep exhaustion
pressure / HP state for readiness
```

### Locked Combination Rule

```text
effective traits
  = baseline
  + upbringing modifiers
  + current-state modifiers
```

Upbringing must never overwrite baseline truth.
Current state must never overwrite baseline truth.

### Locked Battle Stat Formulas

These formulas already exist in the live stat system and should be treated as the current source of truth.

```text
initiative
  = speed*16
  + trustSpeed*11
  + (2.4 - jitteriness)*7
  + confidence*12
  - exhaustion*22

offense
  = speed*15
  + happinessBonus*10
  + jitteriness*4
  + significance*10

guard
  = scareThreshold*12
  + trustSpeed*6
  + (1 - threat)*10
  + (1 - exhaustion)*8

resolve
  = scareThreshold*10
  + happinessBonus*9
  + belonging*12
  + (1 - failure)*8

support
  = trustPropensity*12
  + happinessBonus*8
  + confidence*10
  + attachment*12

derivedMaxHp
  = 70 + guard*0.8 + resolve*0.35
```

All five battle stats are clamped to `10..120`.

### Locked Readiness Formula

```text
readiness score
  = initiative*0.16
  + offense*0.18
  + guard*0.18
  + resolve*0.18
  + support*0.14
  + hpRatio*14
  + clarity*8
  + confidence*8
  - exhaustion*22
  - pressurePenalty*100
  - threat*10
```

Where:

```text
pressurePenalty = min(0.22, pressure*0.018)
hpRatio         = hp / derivedMaxHp
```

Current readiness tiers:

```text
82+  │ Prime
68+  │ Ready
52+  │ Watch
else │ Rest
```

### Ability-Origin Contract

Visible ability origin must be one of:

```text
natural
inherited
bred
```

Rule:

```text
if inheritedAbility exists         │ inherited
else if bred/hybrid source         │ bred
else                               │ natural
```

### Required UI Surfacing

#### Inspect

Inspect must present these sections for living butterflies:

```text
Stats
├─ effective trait lines
├─ baseline trait lines
├─ upbringing modifier lines
└─ current-state modifier lines

Genes
├─ inherited ability + origin
├─ parent summary
├─ comparison vs parent midpoint
└─ wing donor summary where applicable

Battle
├─ initiative / offense
├─ guard / resolve
├─ support / HP seed
└─ readiness score / tier / concerns
```

Added surfacing now locked in runtime:

- heritage depth and archived ancestor summaries
- lineage rarity versus encounter rarity
- a direct lock note that no hidden latent/dormant numeric stat layer ships today

#### Journal

Hybrid and lineage pages must show:

```text
baseline traits
inherited ability
parent comparison
battle profile
readiness profile
wing donor summary
```

Added journal surfacing now locked in runtime:

- heritage summary lines that can extend beyond direct parents
- rarity split lines that keep lineage context separate from encounter rarity
- mutation and latent/dormant lock notes when relevant

#### Garden-Level Proof

The player must be able to confirm in normal play that:

```text
different lineages produce different effective traits
different lineages produce different battle-readiness profiles
inherited abilities are visible and attributable
```

Added normal-play proof now expected:

- multi-generation lines can be distinguished by heritage depth and archived ancestry
- golden / legendary lineage context never implies wild unlock or encounter rarity carry

### Invariants

```text
1. genotype truth is stored separately from learned modifiers
2. upbringing never mutates genotype truth
3. current state never mutates genotype truth
4. battle stats are derived, not stored as canonical genetics
5. readiness is derived from battle stats + current state
6. inherited ability origin must be visible
7. parent references must remain stable and journal-safe
```

### Locked Edge Rules

These edge rules are now explicit in the shipped runtime and should not drift without a deliberate redesign.

```text
latent/dormant stat layer      | none in shipped runtime; baseline truth is direct
multi-generation heritage      | lineage types + depth + archived parent/ancestor refs
golden/legendary inheritance   | same numeric/ability/wing rules as any other parent
mutation variance              | post-average trait shifts only; no ability mutation
rarity split                   | lineage rarity is descriptive; encounter rarity remains separate
```

### Definition Of Done

This contract is complete in implementation when:

```text
player can answer
|- what was inherited?
|- what was learned?
|- what is currently modifying this butterfly?
|- why is this butterfly strong or weak in battle?
`- which parent contributed the visible ability and wing traits?
```

## Cognition / ML Contract

_Source: `docs/COGNITION-ML-CONTRACT.md`_

### Purpose

This document defines the intended cognition stack for Papilionem and separates:

- what is already implemented heuristically
- what remains to be made model-backed
- what must be inspectable, save-safe, and auditable

It exists so the live and future ML layers stay disciplined extensions of the
life-sim, not ad hoc replacements.

### Source Anchors

- [C:\Users\fishe\Documents\projects\ephemera\systems\lifeSimSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/lifeSimSystem.js)
- [C:\Users\fishe\Documents\projects\ephemera\docs\LIFESIM-EXPRESSION-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/LIFESIM-EXPRESSION-AUDIT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)
- [C:\Users\fishe\.codex\skills\life-simulation-architecture\references\drives-emotions-memory-social.md](C:/Users/fishe/.codex/skills/life-simulation-architecture/references/drives-emotions-memory-social.md)
- [C:\Users\fishe\.codex\skills\life-simulation-architecture\references\communication-routines-distortion.md](C:/Users/fishe/.codex/skills/life-simulation-architecture/references/communication-routines-distortion.md)

### Shape

```text
╔════════════ Cognition Stack ════════════╗
║ durable truth                           ║
║  ├─ drives                              ║
║  ├─ emotions                            ║
║  ├─ memories                            ║
║  ├─ social edges                        ║
║  ├─ routines                            ║
║  ├─ interpretation                      ║
║  ├─ distortion                          ║
║  ├─ genetics / upbringing               ║
║  └─ lifecycle                           ║
║            │                            ║
║            ▼                            ║
║ derived cognition                       ║
║  ├─ dominant drives                     ║
║  ├─ dominant emotions                   ║
║  ├─ crowding / novelty                  ║
║  └─ behavior biases                     ║
║            │                            ║
║            ▼                            ║
║ action selection                        ║
║  ├─ heuristic today                     ║
║  └─ model-backed later                  ║
║            │                            ║
║            ▼                            ║
║ visible behavior                        ║
║  ├─ movement / feeding / bonding        ║
║  ├─ signaling / teaching                ║
║  ├─ breeding / care                     ║
║  └─ battle readiness contribution       ║
╚═════════════════════════════════════════╝
```

### Locked Current Families

#### Drives

```text
selfMaintenance
safetyAvoidance
resourceControl
socialConnection
caregiving
exploration
statusExpression
rest
```

#### Emotions

```text
threat
relief
attachment
rejection
significance
failure
curiosity
agitation
exhaustion
```

#### Other cognition families

```text
memories
socialEdges
routines
communication
distortion
interpretation
social summary
derived behavior biases
```

### Locked Current Heuristic Outputs

The current life-sim already derives these behavior-facing outputs:

```text
wanderScale
feedUrgency
displayConfidence
socialConfidence
caution
trainingAffinity
```

These are currently authoritative until the ML layer replaces or augments the relevant decision points.

### Current Heuristic Appraisal Inputs

The live system already uses:

```text
crowding
zone flower availability
attachment average
admiration average
rejection average
communication activity
lesson count
teaching routine strength
novelty
warning/calm signals
active conversation bonus
special ability bias
rarity bias
state threat/care/display/feed-focus
sleep state
happiness ratio
memory density
```

### Contract Rule: What ML May Replace

The live model-backed layer may replace or augment:

```text
action-family scoring
target preference scoring
signal choice scoring
social response weighting
risk tolerance weighting
```

The live model-backed layer must not replace:

```text
canonical storage of drives
canonical storage of emotions
canonical storage of memories
canonical storage of social edges
canonical genetics truth
canonical lifecycle truth
```

ML is allowed to choose from the state.
ML is not allowed to become the source of truth for the state families themselves.

### Boundary Audit (P6)

The later audit rule is:

```text
systems/mlInferenceSystem.js
|- may score
|- may weight
`- may not mutate protected save-state groups
```

Protected groups are the ones listed in
[SAVE-SCHEMA-REGISTRY.md](/C:/Users/fishe/Documents/projects/ephemera/docs/SAVE-SCHEMA-REGISTRY.md)
under:

- `identity`
- `memory`
- `relationship edges`
- `lineage`
- `emotions`
- `drives`

The audit script itself lands in a later implementation phase.
This document holds the rule now.

### ML Input Contract

The model-backed layer must consume a structured feature vector built from the current life-sim.

Minimum feature groups:

```text
Identity
├─ archetype
├─ rarity
├─ sex
├─ birthSource
└─ special ability

Genetics / expression
├─ baseline traits
├─ effective traits
├─ inherited ability
└─ upbringing summary

Drives
├─ 8 drive values

Emotions
├─ 9 emotion values

Social
├─ reputation
├─ belonging
├─ confidence
├─ focus/context
└─ summarized edge strengths

Interpretation / distortion
├─ clarity
├─ warpedSignals
├─ anxietyBias
├─ withdrawalBias
├─ fixationBias
├─ insomniaBias
├─ oversleepBias
└─ warpedTeachingBias

Memory / routine summaries
├─ memory density by family
├─ routine strength by family
└─ active conversation / recent signals

World context
├─ zone kind
├─ crowding
├─ novelty
├─ available flowers
├─ nearby allies
├─ nearby rivals
├─ nearby vulnerable targets
└─ battle vs garden mode
```

The new-system extension points for:

- player interaction memory
- object affordance awareness
- 3D-ready spatial understanding
- progression context
- autobattle context

are defined in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)

### ML Output Contract

The model must output weighted preferences, not directly mutate the world.

Required output families:

```text
nextActionFamily
├─ wander
├─ feed
├─ socialize
├─ signal
├─ teach
├─ court
├─ rest
├─ avoid
├─ build/use object
└─ battle posture

targetPreference
├─ flower
├─ butterfly
├─ block
├─ shelter
├─ doorway
└─ empty space / roam target

signalChoice
├─ calming
├─ warning
├─ teaching
├─ invitation
└─ quiet / none

riskPosture
├─ approach
├─ observe
├─ avoid
└─ flee bias
```

### Integration Rule

```text
life-sim state ──▶ feature builder ──▶ model scores ──▶ behavior system acts
```

Not allowed:

```text
model ──▶ directly edits memories / emotions / genetics / social edges
```

Those must still change through owner systems and normal simulation consequences.

### Persistence Contract

Persist:

```text
model config/version id
last inference trace summary if needed for inspect/debug
any long-lived policy state only if explicitly introduced
```

Do not persist:

```text
full transient action score cache
cheap neighbor summaries
recomputable feature vectors
```

### Inspect / Debug Contract

The player/debug surfaces must eventually show:

```text
Mind
├─ dominant drives
├─ dominant emotions
├─ context
├─ clarity
└─ distortion highlights

Decision
├─ chosen action family
├─ target preference
├─ signal preference
├─ confidence / certainty
└─ top rejected alternatives
```

The goal is that we can answer:

```text
why did this butterfly do that?
```

without guessing.

### Audit Contract

The ML layer is not done until audits can prove:

```text
1. different internal states produce different action preferences
2. inherited traits materially affect decisions
3. upbringing materially affects expression, not genotype truth
4. distortion materially warps interpretation/behavior
5. save/load preserves long-term cognition truth correctly
6. debug/inspect can expose the chosen path
```

Current shipped proof now covers:

- visible chosen-path rows in Inspect for action, target, signal, risk, battle,
  context, and short history
- runtime self-audit and ML closure proof for inspect/debug trace surfacing
- live model-backed garden and battle rollout with explicit fallback proof
- focused-garden / battle budget proof on the live ML runtime seam
- long-soak and final grand-plan proof on the frozen expansion baseline

### Locked Current Boundary

Right now, owner truth still remains outside the ML layer, but choice scoring is
no longer heuristic-only.

That means:

```text
implemented today
├─ heuristic appraisal and owner-authored derived behavior biases
├─ local model-backed action / target / signal / risk / battle preference scoring
├─ inspectable explainability through Inspect and debug shells
└─ fallback-safe, post-load, and long-soak-proved runtime behavior
```

The remaining incompleteness now sits only in optional runtime-replacement and
networking work, not in the shipped local model-backed layer.

### c1 Locked Replacement Boundary

These decisions are now locked tightly enough for later ML phases to build
against safely:

```text
future model-backed runtime
├─ ONNX Runtime Web in the local browser
├─ versioned local artifact bundle
├─ deterministic feature and trace schemas
└─ heuristic fallback required on every failed tick

offline training path
├─ heuristic traces exported from the live sim
├─ curated audit scenarios
├─ hand-corrected labels where the heuristic is visibly wrong
└─ offline supervised / imitation training only

shared spatial hooks for b3 / c3
├─ verticality
├─ structureRole
├─ pathState
└─ bodyFit
owner: structureSystem

no-online-dependency rule
├─ no server inference
├─ no live online training
└─ no runtime dependency beyond local bundled assets
```

What remains later is optional replacement work, not contract ambiguity:

```text
still later
├─ actual ONNX artifact rollout if that replacement path is ever promoted
├─ alternate local training-host / runtime-pipeline decisions
└─ future multiplayer determinism / networking constraints
```

The implementation details for these locks now live in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)

### Definition Of Done

This contract is complete in implementation when:

```text
the butterfly mind is not just stored
it is behavior-driving, inspectable, auditable,
and partly model-backed where the contract says it should be
```

## Communication / Language Contract

_Source: `docs/COMMUNICATION-LANGUAGE-CONTRACT.md`_

### Purpose

This document locks the new communication direction for Papilionem.

It replaces the older invented butterfly-language direction with an
English-first dialogue model that is:

- readable to the player
- grounded in the life-sim
- expressive enough to support personality, attraction, teaching, and conflict
- auditable in the feed, inspect UI, and debug views

### Connected Contracts

- [C:\Users\fishe\Documents\projects\ephemera\docs\DIALOGUE-VOICE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/DIALOGUE-VOICE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\INTERNAL-SIGNAL-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/INTERNAL-SIGNAL-CONTRACT.md)

### Direction Lock

```text
╔════════════════════ Direction Lock ════════════════════╗
║ speech language        │ English only                 ║
║ invented butterfly lang│ removed                      ║
║ wing / antenna motions │ expression, not language     ║
║ spoken dialogue        │ Talk feed only               ║
║ nonverbal signals      │ internal only                ║
║ universal reply delay  │ 2.0 seconds                  ║
╚════════════════════════════════════════════════════════╝
```

### Ownership Map

```text
╔════════════════════ Ownership Map ════════════════════╗
║ statProfileSystem    │ inherited language baselines   ║
║ lifeSimSystem        │ context, drives, emotions      ║
║ communicationSystem  │ dialogue, talk modes, hearing  ║
║ interpretation       │ understanding / misread truth  ║
║ memory families      │ dialogue memory continuity     ║
║ social edges         │ relationship impact            ║
║ gameUI               │ feed presentation only         ║
╚════════════════════════════════════════════════════════╝
```

Rules:

- `communicationSystem` owns who said what, to whom, and how it was addressed.
- `interpretation` owns how well a butterfly understood what was said.
- `social edges` own long-term relationship changes from communication.
- `gameUI` must not invent dialogue meaning. It only formats and filters entries.

Additional ownership rules:

- `breedingSystem` owns hybrid personal-name assignment at emergence.
- `memory families` own whether another butterfly's name is known or remembered.
- `gameUI` formats display labels, but it does not decide identity truth.

### Name Identity Layer

```text
name identity
├─ wild butterflies use canonical variant identity names
├─ hybrids use personal birth names
├─ duplicate first names are allowed
├─ duplicate display may add one-letter disambiguation
└─ known names are tracked through social memory
```

Rules:

1. Wild butterflies keep canonical variant identity names:
   - `WarmWelcome`
   - `DelicatePink`
   - `ElectricViolet`
   - `NervousJewel`
   - `AncientScholar`
   - `TwilightDancer`
   - `Golden`
2. Hybrids should not be born with placeholder labels like `Hybrid #30`.
3. Each newly emerged hybrid receives a personal first name at birth based on
   sex:
   - masculine pool: `100` names
   - feminine pool: `100` names
4. Duplicate first names are allowed among living butterflies.
5. If a new living butterfly duplicates the first name of another living
   butterfly, give the new butterfly a one-letter display disambiguator:
   - example `Daniel M.`
6. The disambiguator is a display aid, not a hard surname rule.
7. Every butterfly knows its own current name identity.
8. Butterflies may learn and remember the names of other butterflies through
   social memory and repeated interaction.
9. Dialogue and UI should prefer known names where appropriate rather than
   falling back to generic labels.

### Communication Shape

```text
╔════════════════════ Communication Layers ════════════════════╗
║ 1. Dialogue                                                 ║
║    real English words spoken by butterflies                 ║
║                                                             ║
║ 2. Signals                                                  ║
║    internal spatial/coordination support                    ║
║                                                             ║
║ 3. Actions                                                  ║
║    visible consequential world events                       ║
║                                                             ║
║ 4. Learn                                                    ║
║    important learning that changes future behavior          ║
╚══════════════════════════════════════════════════════════════╝
```

### Feed Contract

```text
╔════ Feed Filters ════╦══════════════════════════════════════╗
║ Talk                ║ spoken English dialogue only         ║
║ Actions             ║ visible consequential events         ║
║ Learn               ║ meaningful learning/personality shift║
╚═════════════════════╩══════════════════════════════════════╝
```

#### Talk

Use only for spoken dialogue.

Format:

```text
12:00AM-[CanonicalButterflyName(Sex)]: Dialogue
12:00AM-[CanonicalButterflyName(Sex)]: Dialogue (To: [Target Name(Sex)])
```

Examples:

```text
12:00AM-AncientScholar(M): Keep the route open near the arch.
12:00AM-Daniel M.(M): Stay with me near the ivy wall. (To: Ilya(F))
```

#### Actions

Use only for visible consequential actions.

Format:

```text
12:00AM-[Butterfly]: Action
12:00AM-[Actor]->[Receiver]: Action
```

Include:

- mating began
- mating completed
- egg laid
- caterpillar hatched
- chrysalis formed
- chrysalis hatched into butterfly
- butterfly struck / shoved / defeated
- major object delivery or placement when player-meaningful

Do not include:

- eating
- sleeping
- idle movement
- low-value repeated micro-actions

#### Learn

Use only when a butterfly has meaningfully learned something that materially
shapes future behavior.

Format:

```text
12:00AM-[Butterfly Name]: What was learned
```

### Talk Modes

```text
╔════ Talk Modes ════╦════════════════════════════════════════╗
║ single_target     ║ one butterfly addresses one target     ║
║ multi_target      ║ one butterfly addresses chosen targets ║
║ open_talk         ║ one butterfly speaks to audible range  ║
╚═══════════════════╩════════════════════════════════════════╝
```

#### Single-target talk

- one intended target
- strongest intimacy, attraction, apology, persuasion, reassurance effects
- nearby bystanders may perceive tone, but are not primary recipients

#### Multi-target talk

- one source, several chosen targets
- suited for teaching, group guidance, invitations, warnings
- each chosen target hears full content

#### Open talk

- one source, no explicit target
- heard by butterflies within audible range in the current zone
- not full-zone telepathy
- any hearing butterfly may respond using any talk mode

### Hearing Rules

```text
╔════ Hearing Rules ════╦════════════════════════════════════╗
║ single_target        ║ target hears full content          ║
║                      ║ others may overhear tone/context   ║
║ multi_target         ║ all selected targets hear content  ║
║ open_talk            ║ all butterflies in audible range   ║
╚══════════════════════╩════════════════════════════════════╝
```

Audible range should be zone-local and distance-based.

### Response Timing

```text
╔════════════════════ Response Timing ════════════════════╗
║ universal dialogue reply delay │ 2.0 seconds           ║
║ one queued spoken reply max    │ per butterfly         ║
╚═════════════════════════════════════════════════════════╝
```

Rules:

- all spoken dialogue replies wait 2.0 seconds before emission
- a butterfly may only hold one queued spoken reply at a time
- queued replies may be replaced or cancelled if context changes sharply
- this delay applies to `single_target`, `multi_target`, and `open_talk`
- this delay does not slow non-dialogue simulation systems

### English Foundation

```text
╔════════════════════ Species Floor ════════════════════╗
║ all butterflies can speak basic English               ║
║ all butterflies can understand basic direct speech    ║
║ nobody is “mute because of bad rolls”                 ║
╚═══════════════════════════════════════════════════════╝
```

Variation is expressed through language quality, not speech existence.

### Core Language Stats

All language stats use a `0-100` scale.

```text
╔════ Core Language Stats ════╦════════════════════════════════╗
║ Vocabulary                  ║ word range and precision       ║
║ Articulation                ║ clarity and sentence quality   ║
║ Social Reading              ║ tone/subtext understanding     ║
║ Listening                   ║ retention and response quality ║
║ Emotional Expression        ║ ability to verbalize feelings  ║
║ Pragmatic Speech Use        ║ ability to use speech well     ║
╚═════════════════════════════╩════════════════════════════════╝
```

### Intelligence Bands

```text
╔════ Intelligence Bands ════╦══════════════════════════════════════╗
║ Below Average              ║ weaker structure and cue-reading    ║
║ Average                    ║ solid everyday speech               ║
║ Above Average              ║ better nuance and timing            ║
║ Exceptional / Scholar      ║ high clarity, teaching, abstraction ║
╚════════════════════════════╩══════════════════════════════════════╝
```

#### Below Average

Below-average intelligence does not remove the English foundation.

It causes:

- shorter, less stable sentence flow
- more fragments
- more repetition
- more topic drift
- weaker turn-taking
- weaker social cue reading
- more slang overuse in casual speech

It must not cause:

- unreadable nonsense
- total inability to converse
- random gibberish as the default output

### Speech Tone Palette

```text
╔════ Speech Tones ════╦══════════════════════════════════════╗
║ Warm                ║ kind, reassuring, affectionate       ║
║ Playful             ║ teasing, light, lively              ║
║ Curious             ║ questioning, exploratory            ║
║ Direct              ║ plain, efficient, blunt             ║
║ Diplomatic          ║ tactful, smoothing, careful         ║
║ Formal              ║ restrained, proper, composed        ║
║ Assertive           ║ confident, firm, self-possessed     ║
║ Hesitant            ║ unsure, cautious, stumbling         ║
║ Aggressive          ║ hostile, forceful, confrontational  ║
║ Condescending       ║ patronizing, talking down           ║
║ Passive-Aggressive  ║ indirect hostility                  ║
║ Sarcastic           ║ mocking, cutting, dismissive        ║
╚═════════════════════╩══════════════════════════════════════╝
```

### Register Layers

```text
╔════ Register ════╦════════════════════════════════════════════╗
║ formal          ║ restrained, polished, little slang         ║
║ neutral         ║ normal everyday speech                     ║
║ casual          ║ slang-enabled, lighter, more relaxed       ║
╚═════════════════╩════════════════════════════════════════════╝
```

### Casual Slang Shortlist

This shortlist is based on widely documented US slang usage from the last
decade. It is a curated gameplay lexicon, not a claim of statistically exact
top-12 usage.

```text
╔════ Casual Slang ════╦══════════════════════════════════════╗
║ bet                 ║ agreement / “okay”                  ║
║ no cap              ║ sincere / truthful emphasis         ║
║ sus                 ║ suspicious                          ║
║ low-key             ║ understated admission               ║
║ rizz                ║ romantic charm                      ║
║ slay                ║ praise / admiration                 ║
║ drip                ║ style / appearance                  ║
║ bussin'             ║ very good, especially rewarding     ║
║ say less            ║ “I understand / I’m in”             ║
║ ghosted             ║ disappeared / stopped replying      ║
║ lit                 ║ exciting / excellent                ║
║ hits different      ║ unusually affecting / special       ║
╚═════════════════════╩══════════════════════════════════════╝
```

Rules:

- slang is optional, not constant
- slang does not itself imply low intelligence
- lower-intelligence butterflies overuse slang more often in casual speech
- higher-intelligence butterflies code-switch more effectively

### Derived Language Outcomes

```text
╔════ Derived Outcomes ════╦════════════════════════════════════╗
║ Dialogue Clarity        ║ Vocabulary + Articulation         ║
║ Misread Risk            ║ low Social Reading / Listening    ║
║ Courtship Verbal Skill  ║ Emotional + Social Reading        ║
║ Teaching Power          ║ Vocabulary + Articulation +       ║
║                         ║ Pragmatic Speech Use              ║
║ Group Talk Control      ║ Articulation + Listening +        ║
║                         ║ Pragmatic Speech Use              ║
║ De-escalation Skill     ║ Social Reading + Emotional Expr.  ║
╚═════════════════════════╩════════════════════════════════════╝
```

### Ancient Scholar Contract

```text
╔════════════════════ Ancient Scholar ════════════════════╗
║ not just “bigger words”                                 ║
║ but better interpretation, teaching, and explanation    ║
╚═════════════════════════════════════════════════════════╝
```

Ancient Scholar should improve:

- vocabulary range
- articulation
- social reading
- teaching power
- memory recall in dialogue
- chance that dialogue becomes a `Learn` event

### Nonverbal Expression Rule

```text
╔════════════════════ Nonverbal Rule ════════════════════╗
║ wing flutter / antenna motion = expression only        ║
║ not grammar, not lexicon, not alternate speech         ║
╚═════════════════════════════════════════════════════════╝
```

Allowed uses:

- emphasis
- nervousness
- warmth
- attraction
- hesitation
- intimidation
- excitement

### Future Signal Phase Boundary

This contract intentionally does not fully redesign signals.

Signals are defined in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\INTERNAL-SIGNAL-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/INTERNAL-SIGNAL-CONTRACT.md)

### Dialogue Residue Boundary

This contract intentionally does not fully define:

- what spoken lines become durable memories
- how those memories move long-term relationship edges
- when dialogue becomes a `Learn` outcome

Those are defined in:

- [C:\Users\fishe\Documents\projects\ephemera\docs\DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)

### Persistence Rules

Persist:

- base language stats
- intelligence band
- dialogue-relevant upbringing shifts
- meaningful dialogue memories
- social edges affected by dialogue

Rebuild:

- active queued reply
- current line candidates
- temporary talk-mode scoring
- feed text formatting

### Debug / QA Rules

Visible QA must prove:

```text
1. dialogue is readable English
2. low intelligence is weaker, not incomprehensible
3. scholar butterflies teach and interpret better
4. open talk is audible-range based, not telepathic
5. wing/antenna motions never behave like hidden language
6. Talk feed contains speech only
7. signals stay internal and out of the player feed
8. dialogue voice differences are readable across intelligence bands
```

### Implementation Order

```text
╔════════════════════ Communication Build Order ════════════════════╗
║ C1. feed remodel: Talk / Actions / Learn                         ║
║ C2. talk modes: single / multi / open                            ║
║ C3. hearing and response timing                                  ║
║ C4. language stat model + intelligence bands                     ║
║ C5. dialogue voice rules: tone / register / slang                ║
║ C6. dialogue memory and relationship residue                     ║
║ C7. attraction and teaching weighting from dialogue residue      ║
║ C8. internal signal redesign after speech layer is stable        ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Sources

- [Grammarly: common tone types](https://www.grammarly.com/blog/writing-techniques/types-of-tone/)
- [Indeed: tone examples and distinctions](https://www.indeed.com/career-advice/career-development/examples-of-tone)
- [Articulus: broader tone lexicon](https://articulus.co.uk/tone-of-voice/)
- [Dictionary.com: Gen Z slang overview](https://www.dictionary.com/articles/gen-z-slang)
- [Merriam-Webster: no cap](https://www.merriam-webster.com/slang/no-cap)
- [Merriam-Webster: bet](https://www.merriam-webster.com/slang/bet)
- [Merriam-Webster: rizz](https://www.merriam-webster.com/slang/rizz)
- [Merriam-Webster: ghosting](https://www.merriam-webster.com/wordplay/ghosting-words-were-watching)
- [Merriam-Webster: lit](https://www.merriam-webster.com/wordplay/lit-meaning-origin)

## Dialogue Voice Contract

_Source: `docs/DIALOGUE-VOICE-CONTRACT.md`_

### Purpose

This document defines how butterflies should sound when they speak English in
Papilionem.

It turns the high-level language model into concrete output rules:

- sentence length
- sentence structure
- slang probability
- tone switching
- register use
- sample utterance patterns

### Current Proof Status

Current shipped state:

- dialogue records now retain `languageBand`, `register`, and `tone`
- Inspect now surfaces a `Voice` proof line beside recent spoken/heard dialogue
- `scripts/run-r6-communication-audit.js` now proves below-average casual,
  scholar-formal, and aggressive warning phrasing directly

### Ownership

```text
╔════════════════════ Voice Ownership ════════════════════╗
║ communicationSystem │ line generation and phrasing      ║
║ statProfileSystem   │ inherited language predisposition ║
║ lifeSimSystem       │ emotional/social context          ║
║ social edges        │ relationship-driven style shifts  ║
║ gameUI              │ formatting only                   ║
╚══════════════════════════════════════════════════════════╝
```

### Output Shape

```text
╔════════════════════ Dialogue Output Model ════════════════════╗
║ line =                                                        ║
║   intent                                                      ║
║ + talk mode                                                   ║
║ + intelligence band                                           ║
║ + language stats                                              ║
║ + tone                                                        ║
║ + register                                                    ║
║ + relationship context                                        ║
║ + current emotional pressure                                  ║
╚════════════════════════════════════════════════════════════════╝
```

### Core Output Rules

```text
always
├─ understandable English
├─ usually 1 sentence, sometimes 2
├─ no giant paragraph speeches in normal play
├─ no random gibberish
└─ tone and register should be readable from the wording
```

### Intelligence Band Voice Rules

```text
╔════ Intelligence Voice Bands ════╦══════════════════════════════╗
║ Below Average                   ║ broken flow, simpler wording ║
║ Average                         ║ normal everyday speech       ║
║ Above Average                   ║ cleaner nuance and timing    ║
║ Exceptional / Scholar           ║ high clarity, pattern-rich   ║
╚═════════════════════════════════╩══════════════════════════════╝
```

#### Below Average

```text
sentence length
├─ 2 to 8 words typical
└─ 12 words soft cap

structure
├─ fragments allowed
├─ repetition allowed
├─ simple connectors only
└─ topic drift more likely
```

Rules:

- speech must remain understandable
- broken flow should come from simplicity and awkwardness, not nonsense
- may repeat favorite words or slang
- weaker turn tracking and weaker contextual precision

Example shapes:

```text
"Come here."
"Put it there. Yeah, there."
"I don't like that. Feels bad."
"Come with me, bet."
```

#### Average

```text
sentence length
├─ 5 to 12 words typical
└─ 16 words soft cap

structure
├─ simple complete sentences
├─ some compound sentences
└─ steady conversational flow
```

Rules:

- should sound like solid everyday speech
- can explain simple intentions clearly
- moderate slang use in casual mode only

Example shapes:

```text
"Come with me. It’s quieter over there."
"Put that block by the doorway."
"I didn’t like how that felt."
```

#### Above Average

```text
sentence length
├─ 7 to 16 words typical
└─ 22 words soft cap

structure
├─ stronger sentence variety
├─ better topic continuity
└─ more precise wording
```

Rules:

- better nuance and responsiveness
- stronger cue-reading visible in replies
- can explain motives and observations more cleanly

Example shapes:

```text
"Put that block near the arch, not in the doorway."
"You looked uneasy when I moved closer, so I backed off."
"Stay with me for a moment. I think this path is safer."
```

#### Exceptional / Scholar

```text
sentence length
├─ 9 to 20 words typical
└─ 26 words soft cap

structure
├─ strong clarity
├─ controlled complexity
├─ pattern language
└─ best teaching phrasing
```

Rules:

- should sound clearer, not just longer
- may use more abstract or pattern-aware wording
- should code-switch well between formal, neutral, and casual registers
- strongest chance to create `Learn` outcomes

Example shapes:

```text
"Place it by the archway; that keeps the route open and the shelter stable."
"You settled after I lowered my voice, so I think calm helps you listen."
"This pattern repeats every time the crowd tightens near the wall."
```

### Register Rules

```text
╔════ Register Rules ════╦══════════════════════════════════════╗
║ formal                ║ precise, restrained, little slang    ║
║ neutral               ║ normal everyday speech               ║
║ casual                ║ relaxed, lighter, slang-eligible     ║
╚═══════════════════════╩══════════════════════════════════════╝
```

#### Formal

Use more often for:

- teaching
- careful apology
- serious warning
- conflict de-escalation
- scholar speech

#### Neutral

Default for:

- ordinary conversation
- routine coordination
- most social interaction

#### Casual

Use more often for:

- close relationships
- playful conversation
- relaxed open talk
- social bonding
- flirtation when not highly formal or tense

### Slang Probability Draft

Slang should be tied to register first, then intelligence/personality second.

```text
╔════ Slang Probability Draft ════╦══════════════════════════════╗
║ formal                         ║ 0% to 2%                    ║
║ neutral                        ║ 2% to 10%                   ║
║ casual                         ║ 8% to 30%                   ║
╚════════════════════════════════╩══════════════════════════════╝
```

#### By intelligence band

```text
╔════ Casual Slang Tendency ════╦══════════════════════════════╗
║ Below Average               ║ high use / more repetition    ║
║ Average                     ║ moderate use                  ║
║ Above Average               ║ light-moderate use            ║
║ Exceptional / Scholar       ║ low deliberate use            ║
╚═════════════════════════════╩══════════════════════════════╝
```

Recommended first-pass target rates for casual speech:

```text
Below Average            22% to 30%
Average                  12% to 18%
Above Average             8% to 12%
Exceptional / Scholar     4% to 8%
```

Rules:

- never stack multiple slang terms into every line by default
- repeat slang more often for below-average speakers
- scholar butterflies may still use slang, but as code-switching, not habit

### Sentence Structure Rules

```text
╔════ Structural Levers ════╦════════════════════════════════════╗
║ Vocabulary               ║ word choice sophistication         ║
║ Articulation             ║ sentence smoothness and clarity    ║
║ Social Reading           ║ whether reply fits the moment      ║
║ Listening                ║ whether reply stays on topic       ║
║ Emotional Expression     ║ feeling naming and intimacy        ║
║ Pragmatic Speech Use     ║ whether speech achieves a purpose  ║
╚══════════════════════════╩════════════════════════════════════╝
```

Examples:

- low `Listening`:
  - reply may drift off topic
- low `Articulation`:
  - more fragments and awkward joins
- high `Emotional Expression`:
  - better naming of feelings and needs
- high `Pragmatic Speech Use`:
  - clearer requests, persuasion, comfort, and teaching

### Tone Switching Rules

Tone should not randomly change every line.

```text
╔════ Tone Switching Model ════╦════════════════════════════════╗
║ state pressure              ║ danger, trust, attraction      ║
║ relationship context        ║ friend, rival, stranger        ║
║ task context                ║ teaching, warning, courtship   ║
║ personality bias            ║ default tone preference        ║
╚═════════════════════════════╩════════════════════════════════╝
```

#### Default rule

- each butterfly should have a dominant baseline tone tendency
- context may shift tone, but usually within a narrow range

#### Shift triggers

```text
warning / danger
├─ Direct
├─ Assertive
└─ Aggressive only if personality/distortion supports it

teaching
├─ Curious
├─ Direct
├─ Diplomatic
└─ Formal more often for scholar types

courtship
├─ Warm
├─ Playful
├─ Hesitant
└─ Direct depending on confidence

conflict
├─ Direct
├─ Assertive
├─ Passive-Aggressive
├─ Condescending
└─ Aggressive depending on rivalry/distortion

comfort / care
├─ Warm
├─ Diplomatic
└─ Hesitant if nervous
```

#### Anti-thrash rule

- do not allow more than one major tone-family jump in a single short exchange unless a strong event happened
- prefer gradual shifts over line-to-line whiplash

### Talk Mode Voice Differences

```text
single-target
├─ more specific
├─ more intimate
└─ more likely to reference shared history

multi-target
├─ clearer and shorter
├─ more directive or inclusive
└─ lower ambiguity

open talk
├─ broader wording
├─ less private context
└─ more public/social phrasing
```

### Sample Utterance Patterns

#### Below Average

```text
guidance
"Come here."
"Put it there."

courtship
"Stay near me."
"Dance with me, yeah?"

warning
"Back up. Now."

teaching
"Do this first. Then that."
```

#### Average

```text
guidance
"Bring that block over here."

courtship
"Stay with me a little longer."

warning
"Back away from that wall."

teaching
"Watch me first, then try it."
```

#### Above Average

```text
guidance
"Set it near the arch, not in the path."

courtship
"You seem calmer when we move together."

warning
"Don’t crowd the doorway. It’s too tight there."

teaching
"Notice how the route stays open when the block sits here."
```

#### Exceptional / Scholar

```text
guidance
"Place it beside the archway; that keeps the route open for everyone."

courtship
"You answer me more softly when the garden is quiet, and I like that."

warning
"If we tighten around that corner, the whole group loses room to move."

teaching
"Watch the pattern: when the entry stays clear, the shelter works instead of trapping us."
```

### Hard Limits

```text
do not allow
├─ unreadable gibberish for low intelligence
├─ constant slang in every casual line
├─ scholar butterflies talking in unnatural essays
├─ tone flipping every line without cause
└─ all butterflies sounding identical
```

### QA Rules

Visible QA must prove:

```text
1. intelligence bands sound different
2. low intelligence is weaker, not nonsense
3. scholar butterflies sound clearer and more perceptive
4. slang appears mostly in casual speech
5. negative tones appear when context supports them
6. courtship, teaching, warning, and guidance sound distinct
```

### Implementation Order

```text
╔════════════════════ Dialogue Voice Build Order ════════════════════╗
║ V1. sentence length and structure bands                           ║
║ V2. register rules                                                ║
║ V3. slang probability model                                       ║
║ V4. tone switching rules                                          ║
║ V5. sample pattern library by intent and intelligence band        ║
║ V6. QA tuning against live conversation traces                    ║
╚════════════════════════════════════════════════════════════════════╝
```

## Dialogue Memory / Relationship Contract

_Source: `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`_

### Purpose

This document defines how spoken dialogue leaves durable social residue in
Papilionem.

It answers four questions:

- which spoken lines get remembered
- how remembered speech changes trust, comfort, admiration, resentment, and attraction
- how long dialogue impressions last
- when dialogue becomes a true `Learn` outcome instead of passing chatter

### Current Runtime Status

As of the current implementation baseline:

- rememberability bands (`fleeting`, `notable`, `anchoring`) are live in
  `communicationSystem`
- courtship warmth, gentle rejection, repair / forgiveness follow-through, and
  retained dialogue `Learn` outcomes are live in runtime, Inspect, and feed
  proof
- low-stakes casual talk is now live through `check_in`, `shared_observation`,
  `playful_banter`, `gentle_tease`, `quiet_companionship`, `small_praise`,
  `light_irritation`, and `soft_repair`
- pair conversation modes (`easy`, `playful`, `tender`, `guarded`,
  `strained`, `admiring`) and short-horizon texture
  (`recentWarmth`, `recentEase`, `recentFriction`, `recentMutualAttention`)
  are live and feed later life-sim behavior
- talk feed surfacing now groups same-pair lines into short exchange threads,
  but the feed remains presentation-only and must not become the owner of bond
  truth
- the shipped repair path currently rides reassurance / acceptance residue
  rather than a separate apology-only signal type
- explicit promise / bargain / broken-promise dialogue acts remain outside the
  shipped signal set and should not be described as live runtime behavior

### Direction Lock

```text
╔════════════════════ Dialogue Residue Lock ════════════════════╗
║ spoken line        │ does not directly rewrite relationships  ║
║ interpretation     │ decides what the listener believed       ║
║ memory packet      │ stores notable dialogue residue          ║
║ social edge        │ stores durable bond change              ║
║ Learn outcome      │ only fires on meaningful lasting change  ║
╚════════════════════════════════════════════════════════════════╝
```

### Ownership Map

```text
╔════════════════════ Ownership Map ════════════════════════════╗
║ communicationSystem │ emitted line, talk mode, target shape  ║
║ interpretation      │ heard meaning, sincerity, misread       ║
║ memorySystem        │ dialogue memory packet creation/decay   ║
║ socialSystem        │ long-term relationship edge deltas      ║
║ breedingSystem      │ courtship attraction scoring only       ║
║ lifeSimSystem       │ current drives/emotions/receptivity     ║
║ gameUI              │ Talk / Actions / Learn formatting only  ║
╚════════════════════════════════════════════════════════════════╝
```

Rules:

- `communicationSystem` owns what was said and who heard it.
- `interpretation` owns whether a listener understood, misread, trusted, or doubted it.
- `memorySystem` owns remembered dialogue packets and their decay.
- `socialSystem` owns durable edge changes.
- `breedingSystem` may derive attraction from dialogue residue, but it does not own the dialogue memories themselves.
- `gameUI` must never invent trust or attraction shifts from feed formatting.
- runtime `v1` DOM panels under `ui/dom/` render from life-sim / communication state and store no durable truth of their own.

### State Shape

```text
spoken line
  │
  ▼
heard interpretation
  │
  ├─ not notable ───────▶ no durable memory
  │
  └─ notable
       │
       ▼
   dialogue memory packet
       │
       ├─ edge delta ───▶ trust / comfort / admiration / resentment / attachment
       │
       └─ reinforced lesson ───▶ Learn outcome
```

### Dialogue Residue Families

Dialogue should reuse the existing broad life-sim families instead of creating
a separate disconnected mini-system.

```text
╔════ Dialogue Residue Families ════╦════════════════════════════╗
║ social memory                    ║ praise, insult, apology,   ║
║                                  ║ disclosure, courtship      ║
║ interaction memory               ║ coordination, agreement,   ║
║                                  ║ refusal, response pattern  ║
║ care memory                      ║ comfort, reassurance,      ║
║                                  ║ protective speech          ║
║ danger memory                    ║ warning, threat, panic     ║
║ outcome memory                   ║ promise kept/broken,       ║
║                                  ║ advice succeeded/failed    ║
╚══════════════════════════════════╩════════════════════════════╝
```

### Rememberability Bands

```text
╔════ Rememberability Bands ════╦════════════════════════════════╗
║ fleeting                     ║ routine banter, low-stakes talk║
║ notable                      ║ emotional, pointed, useful,    ║
║                              ║ or socially meaningful lines   ║
║ anchoring                    ║ betrayal, deep comfort,        ║
║                              ║ courtship breakthrough, major  ║
║                              ║ lesson, public humiliation     ║
╚══════════════════════════════╩════════════════════════════════╝
```

#### Fleeting

Usually not persisted as a durable packet unless reinforced.

Examples:

- casual greeting
- light joking with no social shift
- ordinary route instruction with no consequence

#### Notable

Create a durable memory packet when interpretation is strong enough.

Examples:

- a reassurance during distress
- a pointed insult
- a useful explanation that immediately helps
- a careful apology
- a vulnerable romantic line

#### Anchoring

Create strong durable memory and stronger edge movement.

Examples:

- promise kept under pressure
- promise broken after explicit commitment
- public ridicule
- comfort during panic or grief
- a teaching moment that permanently changes behavior
- a clear courtship breakthrough with mutual response

### Runtime Data Shape

#### 1. Spoken Dialogue Event

Ephemeral; owned by `communicationSystem`.

```text
{
  id,
  speakerId,
  talkMode,            // single_target | multi_target | open_talk
  targetIds,
  audibleZoneId,
  lineText,
  intentTags,          // comfort, courtship, warning, teaching, etc.
  tone,
  register,
  emittedAt
}
```

#### 2. Heard Interpretation

Ephemeral; owned by `interpretation`.

```text
{
  eventId,
  listenerId,
  heardQuality,
  meaningConfidence,
  sincerityEstimate,
  emotionalImpact,
  misunderstood,
  responseWindowAt
}
```

#### 3. Dialogue Memory Packet

Durable; owned by `memorySystem`.

```text
{
  id,
  family,                  // social / interaction / care / danger / outcome
  speakerId,
  listenerId,
  summaryText,             // short gist, not a full transcript log
  intentTags,
  valence,
  strength,
  recency,
  reinforcementCount,
  emotionalColoring,
  sincerityBelief,
  publicContext,           // private / witnessed / public
  anchored,
  warped
}
```

#### 4. Relationship Edge Delta

Durable result; owned by `socialSystem`.

```text
{
  pairKey,
  trustDelta,
  comfortDelta,
  admirationDelta,
  resentmentDelta,
  attachmentDelta,
  sourceMemoryId,
  appliedAt
}
```

#### 5. Attraction Note

Attraction should be derived, not duplicated as a permanent second memory model.

```text
courtship attraction
= trust
+ comfort
+ admiration
+ recent courtship resonance
+ perceived reciprocity
- resentment
- rejection residue
```

### Canonical Social Scale

Relationship-facing dialogue effects should resolve onto a normalized social
scale so Inspect and debugging tell the same story.

```text
╔════ Canonical Social Scale ════╦════════════════════════════════╗
║ Trust                         ║ 0 to 100                       ║
║ Comfort                       ║ 0 to 100                       ║
║ Admiration                    ║ 0 to 100                       ║
║ Resentment                    ║ 0 to 100                       ║
║ Attachment                    ║ 0 to 100                       ║
║ Chemistry (derived)           ║ 0 to 100                       ║
╚═══════════════════════════════╩════════════════════════════════╝
```

Interpretation:

- `0 to 24` low / absent
- `25 to 49` weak / unstable
- `50 to 74` meaningful / established
- `75 to 100` strong / dominant

If the runtime stores edges differently internally, it should adapt to this
canonical scale at the owner seam rather than exposing mixed scales to UI/debug.

### Dialogue Delta Model

Dialogue should move edges in bounded nudges, not giant leaps.

```text
edge delta
= base event band
× interpretation quality
× sincerity belief
× relevance to that edge
× public/private intensity factor
× reinforcement factor
```

#### Base Delta Bands

```text
╔════ Dialogue Delta Bands ════╦════════════════════════════════╗
║ trace                        ║ ±1 to ±2                      ║
║ light                        ║ ±3 to ±5                      ║
║ moderate                     ║ ±6 to ±9                      ║
║ major                        ║ ±10 to ±14                    ║
║ anchoring                    ║ ±15 to ±24                    ║
╚══════════════════════════════╩════════════════════════════════╝
```

Rules:

- ordinary good conversation should usually land in `trace` or `light`
- clear helpful or hurtful moments should usually land in `light` or `moderate`
- public humiliation, betrayal, deep reassurance, and breakthrough teaching may reach `major`
- anchoring deltas should be rare and need the anchoring conditions already defined

#### Delta Clamp Rule

No single spoken event should:

- move a durable edge by more than `24`
- fully reverse a strong bond by itself
- create deep attachment from one line alone

### Dialogue Weighting Factors

```text
╔════ Weighting Factors ════╦══════════════════════════════════╗
║ interpretation quality    ║ was it understood clearly?      ║
║ sincerity belief          ║ was it believed?                ║
║ emotional readiness       ║ was the listener open or shut?  ║
║ relationship relevance    ║ does this line matter to trust, ║
║                           ║ comfort, admiration, etc.?      ║
║ public/private intensity  ║ does witness context magnify it?║
║ reinforcement             ║ has this pattern repeated?      ║
╚═══════════════════════════╩══════════════════════════════════╝
```

Recommended first-pass interpretation multipliers:

```text
clean read      1.00
soft drift      0.65
wrong local     0.35
hard miss       0.00
```

Recommended sincerity multipliers:

```text
fully believed  1.00
uncertain       0.60
doubted         0.25
seen as false   0.00 or negative spill if deception is evident
```

### Relationship Impact Map

```text
╔════ Dialogue Type ═══════════════╦════ Main Edge Movement ═══════════════╗
║ sincere reassurance              ║ trust↑ comfort↑ attachment slight↑    ║
║ useful warning that helps        ║ trust↑ admiration slight↑             ║
║ clear, helpful teaching          ║ admiration↑ trust↑                    ║
║ apology accepted                 ║ trust recover↑ comfort slight↑        ║
║ promise kept                     ║ trust↑ admiration↑                    ║
║ promise broken / deception       ║ trust↓↓ resentment↑                   ║
║ public praise                    ║ admiration↑ comfort slight↑           ║
║ vulnerable courtship             ║ comfort↑ attachment↑ attraction bias↑ ║
║ attentive flirtation             ║ comfort↑ attraction bias↑             ║
║ insult / ridicule                ║ resentment↑ trust↓                    ║
║ condescension                    ║ resentment↑ admiration↓ attraction↓   ║
║ threat / verbal aggression       ║ trust↓↓ resentment↑ rivalry↑          ║
╚══════════════════════════════════╩════════════════════════════════════════╝
```

Notes:

- dialogue should move attraction mostly through `trust`, `comfort`, `admiration`,
  and recent courtship memory, not through a totally separate always-on edge
  system
- courtship lines can increase attraction bias, but visible reciprocity and later
  outcomes should matter more than one line alone

### Reciprocity / Courtship Resonance

Courtship should care about the exchange, not just the initiating line.

```text
courtship resonance
= romantic intent expressed
+ answer quality
+ emotional warmth in response
+ response timing success
+ repeated mutual initiation
+ later follow-through
- cold response
- avoidance
- explicit rejection
- resentment pressure
```

#### Reciprocity Bands

```text
╔════ Reciprocity Bands ════╦══════════════════════════════════╗
║ none                      ║ no answer, miss, or visible cold ║
║ weak                      ║ polite but thin reply            ║
║ present                   ║ warm reply, interest, follow-up  ║
║ strong                    ║ mutual initiation or repeated    ║
║                           ║ high-quality response            ║
╚═══════════════════════════╩══════════════════════════════════╝
```

#### Courtship Rules

- one-sided flirtation should raise chemistry only slightly, if at all
- warm direct reciprocation should matter more than the initiating line itself
- repeated mutual high-quality courtship should build chemistry faster than attachment
- attachment should only rise materially after repeated comfort, safety, and continuity
- explicit rejection should suppress short-term chemistry quickly without instantly erasing older attachment

#### Response Timing Effect

The universal `2.0 second` spoken delay should be judged against context, not as a raw penalty.

Recommended resonance rule:

- answer given in the expected reply window with no cold interruption: normal resonance
- answer replaced by silence, avoidance, or sharp topic break: reduced resonance
- repeated mutual initiation across multiple conversations: increased resonance

### Social Repair Loop

Repair should be a structured process, not a binary toggle.

```text
hurt / rejection / betrayal
  │
  ▼
spoken response
  │
  ├─ respectful boundary or sincere apology
  │      │
  │      ▼
  │   repair in progress
  │      │
  │      ├─ changed behavior holds ─▶ partial recovery
  │      └─ repeated care / follow-through ─▶ deeper forgiveness
  │
  └─ pressure / denial / deflection
         │
         ▼
      worsened residue
```

Repair should be driven by:

- interpretation of the apology or rejection
- prior trust and resentment
- severity of the original hurt
- whether later behavior actually changed

### Apology Contract

An apology should only help if it is socially legible and supported by later conduct.

```text
╔════ Real Apology Components ════╦══════════════════════════════╗
║ acknowledgement                 ║ names what happened         ║
║ ownership                       ║ does not dodge blame        ║
║ care                            ║ shows concern for impact    ║
║ repair intent                   ║ signals changed behavior    ║
║ follow-through                  ║ later conduct matches words ║
╚═════════════════════════════════╩══════════════════════════════╝
```

#### Helpful Apology Outcomes

```text
accepted sincere apology
├─ trust          +3 to +10
├─ comfort        +1 to +6
├─ resentment     -2 to -10
└─ attachment     +0 to +3 if a strong prior bond exists
```

#### Weak Or Harmful Apology Outcomes

```text
empty / evasive apology
├─ trust          0 to -4
├─ comfort        0 to -3
├─ resentment     +0 to +5
└─ may reinforce negative anchoring if repeated
```

Examples of apology failure:

- apologizing without naming the harm
- apologizing while deflecting responsibility
- repeating apologies with no behavioral change
- using apology speech to force immediate forgiveness

### Rejection Contract

Rejection should function as a boundary event, not automatically as cruelty.

```text
╔════ Rejection Split ════╦══════════════════════════════════════╗
║ respectful rejection    ║ clear boundary, minimal contempt    ║
║ cold rejection          ║ low warmth, low comfort             ║
║ humiliating rejection   ║ public or mocking, high hurt        ║
╚═════════════════════════╩══════════════════════════════════════╝
```

#### Respectful Rejection

Should usually:

- reduce chemistry strongly
- reduce comfort slightly to moderately
- keep trust mostly stable if the boundary is honest and calm
- avoid strong resentment unless the listener is already distorted or raw

Recommended first-pass impact:

```text
chemistry       -6 to -14
comfort         -2 to -6
trust           -2 to +1
resentment      +0 to +3
```

#### Cold Or Avoidant Rejection

Should usually:

- reduce chemistry strongly
- reduce comfort more clearly
- risk small resentment gain

#### Humiliating Rejection

Should usually:

- reduce chemistry to near-zero quickly
- reduce trust and comfort strongly
- increase resentment sharply
- create notable or anchoring residue if public or mocking

#### Boundary Respect Rule

After rejection:

- respecting the boundary should prevent further chemistry pressure and may preserve some trust
- pushing harder after rejection should strongly worsen resentment and trust
- repeated ignored rejection should escalate into major negative residue

### Forgiveness Contract

Forgiveness should mean social recovery, not memory deletion.

```text
forgiveness
≠ forgetting
≠ instant trust reset
= willingness to let the bond recover under real counterevidence
```

#### Forgiveness Stages

```text
╔════ Forgiveness Stages ════╦══════════════════════════════════╗
║ 1. hurt acknowledged       ║ listener accepts the harm is seen║
║ 2. apology accepted        ║ repair path opens                ║
║ 3. changed behavior held   ║ resentment starts decaying       ║
║ 4. renewed safety          ║ trust/comfort recover partially  ║
║ 5. deeper forgiveness      ║ bond stabilizes again            ║
╚════════════════════════════╩══════════════════════════════════╝
```

#### Forgiveness Rules

- forgiveness should usually reduce resentment before it fully restores trust
- old anchoring hurt may remain remembered even after forgiveness
- forgiveness should be easier for light harms than betrayal or humiliation
- strong prior attachment may make forgiveness possible sooner, but it should not bypass resentment entirely
- repeated re-harm after forgiveness should hit trust harder than the original light harm

#### What Should Be Impossible

- one apology instantly erasing deep resentment
- forgiveness without any counterevidence or changed behavior
- rejected courtship automatically becoming resentment every time
- public humiliation being fully repaired by one polite line

### Recovery Over Time

Relationship repair should be time-sensitive.

```text
╔════ Time Effects ════╦════════════════════════════════════════╗
║ immediate            ║ emotion is hot, acceptance harder     ║
║ short cooling period ║ best window for sincere acknowledgement║
║ repeated calm days   ║ best window for trust rebuilding      ║
╚══════════════════════╩════════════════════════════════════════╝
```

Rules:

- immediate apology may help with misunderstanding if the harm was light
- heavy hurt often needs later follow-through more than instant words
- repeated calm, respectful conduct should matter more than repeated verbal pleading
- forgiveness should accumulate from stable counterevidence, not apology spam

### Courtship Chemistry vs Attachment

These must not collapse into one value.

```text
╔════ Courtship Chemistry ════╦════════ Long-Term Attachment ════════╗
║ short / medium horizon      ║ long horizon                        ║
║ spark, pull, romantic ease  ║ bond continuity and emotional hold  ║
║ rises fast, falls faster    ║ rises slower, falls slower          ║
║ sensitive to recent talk    ║ sensitive to trust/care history     ║
║ and reciprocity             ║ and repeated safe connection        ║
╚═════════════════════════════╩══════════════════════════════════════╝
```

#### Courtship Chemistry

Courtship chemistry is a derived short-to-mid-term romantic pull.

It should be influenced by:

- recent flirtation and courtship dialogue
- reciprocity and answer quality
- recent admiration and comfort
- novelty and romantic tension
- current emotional openness

It should be reduced by:

- recent rejection residue
- resentment
- visible coldness or avoidance
- strong mistrust

#### Long-Term Attachment

Attachment is a durable bond edge, not a temporary spark score.

It should be influenced by:

- repeated comfort and safety with the same butterfly
- trustworthy follow-through over time
- care during vulnerable states
- enduring social preference and continuity
- positive shared routine history

It should not spike wildly from one good line.

#### Interaction Rule

```text
high chemistry + low attachment
├─ strong spark
├─ volatile / uncertain
└─ good for early romance or unstable courtship

high attachment + low chemistry
├─ deep bond
├─ safety and loyalty
└─ may read as companionship or enduring pair-bond without active spark

high chemistry + high attachment
└─ strongest stable romantic bond
```

### Inspect Surfacing Contract

Inspect should show the most readable relationship truths, not every internal edge.

```text
╔════ Inspect Social Surface ════╦══════════════════════════════════╗
║ Trust                          ║ “Do I believe this butterfly?”  ║
║ Comfort                        ║ “Do I feel at ease with them?”  ║
║ Admiration                     ║ “Do I respect/value them?”      ║
║ Resentment                     ║ “Am I carrying hurt/anger?”     ║
║ Attachment                     ║ “How bonded am I over time?”    ║
║ Chemistry                      ║ derived romantic pull           ║
╚════════════════════════════════╩══════════════════════════════════╝
```

Rules:

- `Chemistry` is derived and should be labeled as such.
- `Attachment` is durable edge truth and should not be replaced by chemistry.
- `Protectiveness`, `Dependence`, and `Rivalry` may exist internally but should stay debug-only until they clearly improve player understanding.
- Inspect should prefer a short readable social summary over dumping every raw modifier.

Recommended Inspect shape:

```text
Social
├─ Trust
├─ Comfort
├─ Admiration
├─ Resentment
├─ Attachment
└─ Chemistry (derived)
```

### Anchoring Dialogue Contract

Anchoring dialogue should be rare, legible, and socially important.

```text
anchoring memory
= a spoken moment that meaningfully reshapes later behavior
  or relationship expectation
```

#### Eligible Anchoring Cases

```text
╔════ Anchoring Dialogue Cases ════╦═══════════════════════════════╗
║ explicit promise kept/broken     ║ trust floor/ceiling shift    ║
║ accepted deep apology            ║ relationship reset potential  ║
║ betrayal / deception uncovered   ║ long negative residue         ║
║ comfort during panic/grief       ║ strong safe-bond memory       ║
║ public praise or humiliation     ║ durable admiration/shame      ║
║ major teaching breakthrough      ║ strong Learn and admiration   ║
║ mutual courtship breakthrough    ║ enduring romantic residue     ║
║ vulnerable disclosure received   ║ attachment / trust deepening  ║
╚══════════════════════════════════╩═══════════════════════════════╝
```

#### Should Usually Stay Non-Anchoring

- ordinary flirt lines with no reciprocation
- routine guidance that worked once but taught nothing durable
- casual praise with no emotional weight
- low-stakes teasing
- routine open-talk chatter

#### Anchoring Requirements

A spoken event should usually need several of these at once:

- high interpretation clarity
- strong emotional pressure or vulnerability
- high trust relevance
- clear visible consequence
- repetition or reinforcement
- public/private context that makes the moment matter

#### Counterevidence Rule

Anchoring memories should not disappear from one opposite line.

They should need:

- repeated counterevidence
- durable opposite behavior
- or a stronger later anchoring event

to meaningfully reverse their edge effects.

### Learn Creation Rule

`Learn` should only fire when dialogue causes a real durable change in future
behavior.

```text
spoken lesson
  │
  ├─ heard clearly?
  ├─ trusted enough?
  ├─ relevant to current need/task?
  ├─ reinforced by visible success or repetition?
  └─ strong enough to alter later behavior?
        │
        └─ yes ▶ create Learn outcome
```

#### Eligible Learn Families

```text
╔════ Learn Families ════════════╦══════════════════════════════╗
║ task lesson                    ║ how to place, route, build   ║
║ social lesson                  ║ how to approach, apologize,  ║
║                                ║ court, or de-escalate        ║
║ care lesson                    ║ how to comfort or protect    ║
║ self-regulation lesson         ║ how to settle, wait, focus   ║
╚════════════════════════════════╩══════════════════════════════╝
```

#### Must Not Create Learn

- tiny casual chatter
- repetitive low-stakes banter
- misunderstood lines with no reinforced outcome
- speech that changed mood briefly but not future behavior

### Decay and Persistence Model

```text
╔════ Dialogue Lifetimes ════════╦════════════════════════════════╗
║ fleeting impression            ║ 5 to 20 sim minutes           ║
║ notable memory packet          ║ 1 to 3 sim days               ║
║ reinforced memory packet       ║ 4 to 10 sim days              ║
║ anchoring memory               ║ long-lived until countered    ║
╚════════════════════════════════╩════════════════════════════════╝
```

Rules:

- fleeting impressions may guide the next response without becoming durable memory
- repeated similar lines should reinforce existing packets instead of spawning endless duplicates
- anchoring memories decay very slowly and should need strong counterevidence to reverse
- social edges should decay more slowly than the individual memory packet that created them

### Persistence Boundary

Persist:

- durable dialogue memory packets
- reinforcement counts
- anchoring flags
- public/private context when it matters
- social edges altered by dialogue

Rebuild:

- queued responses
- current interpretation scores
- current candidate line lists
- temporary attraction calculations
- feed row formatting

### AI Integration Points

Dialogue residue should feed behavior, not replace it.

Use it to expose:

- recent trusted speaker summaries
- recent hurtful speaker summaries
- courtship resonance with specific partners
- which lessons were retained
- which promises were kept or broken
- who is emotionally safe or unsafe to approach

Then let behavior scoring use those signals for:

- who to answer
- who to avoid
- who to court
- who to trust in coordination
- who to learn from

### Invariants

```text
do not allow
├─ a spoken line to mutate trust directly without interpretation
├─ memory packets and social edges to store the same truth twice
├─ every casual line to become a durable memory
├─ Learn outcomes from mere chatter
├─ attraction to ignore trust/comfort residue
└─ feed text to be the source of truth for relationship state
```

### Testing / Debug Guidance

Debug views should make it possible to inspect:

- last notable dialogue memory per selected butterfly
- current displayed social summary intended for Inspect
- top positive and negative speaker residues
- current trust/comfort/admiration/resentment edges for a selected pair
- current attachment edge and derived chemistry value for a selected pair
- latest reciprocity/resonance band for an active courtship pair
- the last applied dialogue delta band and weighting factors
- whether a recent line was fleeting, notable, or anchoring
- why a line did or did not become a `Learn` outcome

Scenario checks:

1. reassurance during distress should improve comfort/trust if understood
2. repeated useful teaching should increase admiration and produce a `Learn`
3. promise broken after explicit agreement should create strong negative residue
4. flirtation with good reciprocity should raise attraction bias more than flirtation with no reciprocity
5. trivial banter should not flood durable memories
6. high chemistry should be possible before high attachment
7. high attachment should persist longer than short-term chemistry
8. anchoring dialogue should require more than ordinary banter
9. one line should never swing a deep bond from one extreme to the other
10. respectful rejection should cut chemistry harder than trust
11. sincere apology should help only if later behavior supports it
12. forgiveness should lower resentment before fully restoring trust
13. same-pair casual talk should be able to render as a 2-3 line exchange thread
14. recent warmth / ease / friction / mutual attention should be visible in Inspect summaries without UI inventing the values

### Visual QA Notes

Player-facing behavior should look like this:

```text
visible signs
├─ butterflies answer trusted speakers more readily
├─ hurt or insulted butterflies become colder or avoidant later
├─ scholars create more meaningful Learn events
├─ courtship feels cumulative, not random per-line roulette
├─ respectful rejection changes romance without always creating enemies
├─ apologies can open repair without magically resetting the bond
└─ important dialogue changes later behavior, not just feed text
```

### Implementation Order

```text
╔════════════════ Dialogue Residue Build Order ════════════════╗
║ M1. heard interpretation packets                             ║
║ M2. rememberability scoring: fleeting / notable / anchoring ║
║ M3. durable dialogue memory packets + reinforcement          ║
║ M4. relationship edge deltas from remembered dialogue        ║
║ M5. attraction derivation from courtship residue             ║
║ M6. apology / rejection / forgiveness repair rules           ║
║ M7. Learn creation from reinforced dialogue                  ║
║ M8. debug / inspect surfacing for dialogue residue           ║
╚═══════════════════════════════════════════════════════════════╝
```

## Internal Signal Contract

_Source: `docs/INTERNAL-SIGNAL-CONTRACT.md`_

### Purpose

This document defines the new internal signal system for Papilionem.

Signals are no longer a player-facing feed channel and are no longer treated as
hidden words or alternate language. Their purpose is now narrower and more
modern:

- connect communication to space
- coordinate movement and group behavior
- ground deictic meaning like `here`, `there`, `this`, and `that`
- support urgency and timing without replacing speech

### Current Proof Status

Current shipped state:

- signals remain absent from the player activity feed
- active source summaries now retain support family, audience, urgency, and
  expiry while a signal is alive
- `scripts/run-r6-communication-audit.js` now proves targeted guidance support,
  recipient perception, and expiry cleanup without turning signals back into a
  feed channel

### Direction Lock

```text
╔════════════════════ Signal Direction Lock ════════════════════╗
║ feed presence      │ none                                     ║
║ speech replacement │ forbidden                                ║
║ primary role       │ coordination + spatial grounding         ║
║ player-facing role │ indirect only through visible behavior   ║
╚════════════════════════════════════════════════════════════════╝
```

### Ownership

```text
╔════════════════════ Ownership ════════════════════╗
║ communicationSystem  │ signal emission/perception ║
║ interpretation       │ confidence / misread truth ║
║ lifeSimSystem        │ context and need weighting ║
║ structureSystem      │ spatial anchors / routes   ║
║ gameUI               │ no feed logging for signals║
╚════════════════════════════════════════════════════╝
```

Signals must remain internal simulation truth.

### System Role

```text
speech
├─ carries meaning
├─ carries nuance
├─ carries teaching content
└─ carries relationship language

signals
├─ ground speech into space
├─ coordinate movement and placement
├─ direct attention
└─ carry urgency / priority

expression
├─ wing flutter
├─ antenna motion
└─ emotional/body-language flavor
```

### Core Principle

Signals should behave like the nonverbal layer a human uses while speaking:

- pointing to a place
- indicating a route
- drawing attention to an object
- telling a group to move together
- adding urgency to a request

They are not:

- a hidden grammar
- a secret lexicon
- a substitute for spoken dialogue

### Kept Signal Families

```text
╔════ Internal Signal Families ════╦══════════════════════════════╗
║ Direction                       ║ where to move / place / face ║
║ Attention                       ║ what to look at / focus on   ║
║ Coordination                    ║ synchronize with me / group  ║
║ Urgency                         ║ do it now / danger / hurry   ║
╚═════════════════════════════════╩══════════════════════════════╝
```

#### Direction

Use for:

- where `there` is
- where to carry or place an object
- where to gather
- where to pass through a doorway
- which side of a structure matters

#### Attention

Use for:

- which object is being referenced
- which flower, block, doorway, or butterfly matters
- what the speaker wants others to notice

#### Coordination

Use for:

- move together
- hold position
- align for training
- maintain a local group action

#### Urgency

Use for:

- danger
- immediate threat
- hurry / do this now
- higher priority weighting on current instruction

### Removed Signal Burdens

The following must no longer be treated as core signal meaning:

```text
remove from signals
├─ romance language
├─ acknowledgement language
├─ teaching content
├─ apology or comfort language
└─ hidden butterfly grammar
```

These now belong to:

- spoken dialogue
- body language
- learning outcomes
- relationship state

### Signal Payload Shape

Signals should remain low-bandwidth and structured.

```text
╔════ Signal Payload ════╦══════════════════════════════════════╗
║ family                ║ direction / attention / etc.         ║
║ sourceId              ║ emitting butterfly                    ║
║ mode                  ║ single / multi / open support        ║
║ targetIds             ║ intended receivers if any            ║
║ zoneId                ║ local zone context                   ║
║ anchorType            ║ object / entity / region / route     ║
║ anchorId              ║ referenced object/entity if relevant ║
║ anchorPoint           ║ x/y point if needed                  ║
║ routeHint             ║ doorway / path / side hint           ║
║ urgencyLevel          ║ low / medium / high                  ║
║ expiresAt             ║ short-lived                          ║
╚═══════════════════════╩══════════════════════════════════════╝
```

### Address Modes

Signals support the same broad address shape as speech, but they are support
data rather than speech acts.

```text
╔════ Address Mode ════╦══════════════════════════════════════╗
║ single              ║ one intended receiver                ║
║ multi               ║ selected receivers                   ║
║ open-local          ║ any nearby butterfly in scope        ║
╚═════════════════════╩══════════════════════════════════════╝
```

### Perception Rules

```text
╔════ Perception Rules ════╦════════════════════════════════════╗
║ single                  ║ target receives strongest truth    ║
║ multi                   ║ selected receivers get full truth  ║
║ open-local              ║ nearby butterflies perceive it     ║
║ zone-wide telepathy     ║ forbidden                          ║
╚═════════════════════════╩════════════════════════════════════╝
```

Signals must stay local and spatially grounded.

### Signal-to-Space Contract

This is the most important new rule.

```text
spoken instruction
"put that block over there"
        │
        ▼
internal signal support
├─ attention ▶ which block
├─ direction ▶ which region / point
├─ coordination ▶ who should act
└─ urgency ▶ how strongly to prioritize it
```

Signals connect language to:

- object references
- placement points
- spatial regions
- doorway choices
- routes
- group formation

### Signal Type Table

```text
╔════ Signal Type ════╦══════════════╦══════════════════════╦══════════════╗
║ Direction          ║ stores where ║ path / place / move  ║ no feed      ║
║ Attention          ║ stores what  ║ target selection     ║ no feed      ║
║ Coordination       ║ stores with whom │ group sync       ║ no feed      ║
║ Urgency            ║ stores priority │ action weighting  ║ no feed      ║
╚════════════════════╩══════════════╩══════════════════════╩══════════════╝
```

### Draft Operational Tuning

These are the proposed first-pass implementation values. They are intended to
be close enough to the current communication ranges to integrate cleanly,
while being clearer and narrower in purpose.

```text
╔════ Signal ════╦════ Range ════╦══ Lifetime ══╦═ Misread ═╦════════════════════╗
║ Direction     ║ 84 px         ║ 1.8 s       ║ medium    ║ path / place / face║
║ Attention     ║ 72 px         ║ 1.4 s       ║ low-med   ║ focus / reference  ║
║ Coordination  ║ 96 px         ║ 2.4 s       ║ medium    ║ group sync / align ║
║ Urgency       ║ 108 px        ║ 1.2 s       ║ low       ║ priority / interrupt║
╚═══════════════╩═══════════════╩═════════════╩═══════════╩════════════════════╝
```

#### Direction

```text
target modes
├─ single
├─ multi
└─ open-local
```

Use for:

- where to move
- where to place an object
- where “there” refers to
- which route or doorway to prefer

Misread shape:

- recipient may choose the wrong nearby placement point
- recipient may take a less ideal route
- recipient should not invert the instruction into the opposite direction

#### Attention

```text
target modes
├─ single
├─ multi
└─ open-local
```

Use for:

- which object, flower, doorway, or butterfly is meant
- which part of a shared scene matters right now

Misread shape:

- recipient may focus on the wrong nearby object
- recipient may miss a subtle referent if crowded or anxious

#### Coordination

```text
target modes
├─ multi
└─ open-local
```

Use for:

- synchronize movement
- maintain local formation
- line up for training
- keep working the same local task

Misread shape:

- recipient may lag behind or desynchronize
- recipient may interpret “stay with me” as “stay near here”

#### Urgency

```text
target modes
├─ single
├─ multi
└─ open-local
```

Use for:

- danger emphasis
- “do this now”
- interrupting lower-priority behavior
- raising caution and response priority

Misread shape:

- recipient may overreact or underreact
- recipient should still detect that something important happened

### Draft Interpretation Rule

```text
signal success
= perception
+ interpretation clarity
+ relationship trust
- anxiety/distortion
- crowding / noise
```

Recommended first pass:

- `Direction` and `Coordination` should be more trust-sensitive
- `Attention` should be more crowding-sensitive
- `Urgency` should be least ambiguous, even when emotionally distorted

### Draft Misread Policy

Signals should be allowed to fail in believable ways, but not in chaotic ways.

```text
╔════ Misread Inputs ════╦══════════════════════════════════════╗
║ interpretation clarity║ better decoding / less ambiguity     ║
║ receptivity          ║ willingness to accept the signal      ║
║ trust                ║ confidence in the source              ║
║ anxiety/distortion   ║ warping, overreaction, avoidance      ║
║ crowding/noise       ║ local confusion and referent clutter  ║
╚══════════════════════╩══════════════════════════════════════╝
```

Recommended shape:

```text
misread pressure
= low clarity
+ low receptivity
+ low trust
+ anxiety/distortion
+ crowding/noise
```

Signals should not use identical misread rules.

### Misread Severity Bands

```text
╔════ Severity Band ════╦══════════════════════════════════════╗
║ clean read           ║ intended meaning accepted            ║
║ soft drift           ║ near-enough but imperfect            ║
║ wrong local choice   ║ wrong nearby object/point/route      ║
║ hard miss            ║ ignored, dropped, or weakly followed ║
╚══════════════════════╩══════════════════════════════════════╝
```

Rule:

- prefer `soft drift` and `wrong local choice`
- use `hard miss` only when distortion or disengagement is strong
- avoid random nonsense outcomes

### Family-Specific Misread Policy

```text
╔════ Signal ════╦══════════════════════╦════════════════════════════╗
║ Direction     ║ medium misread risk  ║ wrong nearby point/route   ║
║ Attention     ║ medium-high in crowds║ wrong nearby referent      ║
║ Coordination  ║ medium trust-sensitive║ lag / partial sync / drift║
║ Urgency       ║ low semantic ambiguity║ overreact or underreact   ║
╚═══════════════╩══════════════════════╩════════════════════════════╝
```

#### Direction

Allowed mistakes:

- choosing the wrong nearby placement point
- taking a less ideal nearby route
- arriving near the intended region but not at the best spot

Forbidden mistakes:

- choosing the opposite side of the zone without local reason
- turning a placement cue into a destroy/abandon cue

#### Attention

Allowed mistakes:

- focusing on the wrong nearby object
- focusing on a similar nearby doorway/flower/block
- losing the referent briefly in a crowded cluster

Forbidden mistakes:

- picking a completely unrelated distant target without a visible basis

#### Coordination

Allowed mistakes:

- lagging behind the group
- syncing to the wrong phase of the same task
- interpreting “stay with us” as “stay near this place”

Forbidden mistakes:

- treating a coordination cue as an unrelated emotional or romantic cue

#### Urgency

Allowed mistakes:

- overreacting slightly
- underreacting slightly
- treating medium urgency as high or low

Forbidden mistakes:

- completely missing that something important happened unless receptivity is extremely low
- converting urgency into a precise directional meaning on its own

### Misread Recovery Rule

Misreads should not lock the butterfly into nonsense for long.

```text
recovery path
├─ stronger follow-up signal may correct the state
├─ spoken clarification should reduce ambiguity sharply
├─ visible movement of the source should help re-ground meaning
└─ stale wrong interpretations should decay quickly
```

### Trust and Relationship Weight

```text
high trust
├─ direction reads cleaner
├─ coordination reads cleaner
└─ fewer hard misses

low trust
├─ more hesitation
├─ more soft drift
└─ more ignored signals
```

Signals should not replace relationship logic, but relationship quality should
shape how reliably they are followed.

### Crowding Rule

Crowding should mostly affect:

- `Attention`
- secondarily `Direction`

It should not dominate `Urgency` the same way.

### Anxiety / Distortion Rule

Anxiety and distortion should mostly produce:

- overreaction
- avoidance
- wrong local choice
- dropped coordination

They should not usually create wild opposite-world interpretations.

### Draft Emission Rule

Signals should not use a broad fixed cooldown model.

Instead, they should be edge-triggered and context-sensitive.

```text
╔════ Signal Emission Model ════╦════════════════════════════════╗
║ transition gate              ║ emit on meaningful change      ║
║ refresh-not-stack            ║ same signal updates existing   ║
║ material-delta check         ║ ignore tiny meaningless drift  ║
║ escalation override          ║ stronger urgency replaces weak ║
║ expiry                       ║ stale signals clear cleanly    ║
╚══════════════════════════════╩════════════════════════════════╝
```

Rules:

- do not emit a fresh signal every update just because a task is still active
- if the same family/anchor/intent is still active, refresh the existing signal instead of stacking a new one
- if the referenced object, route, region, or group target changes meaningfully, emit or replace
- tiny jitter in target point or path choice must not cause repeated re-emission
- stronger urgency may replace weaker urgency immediately
- stale signals should expire cleanly without lingering hidden influence

### Dialogue-Linked vs Instant Signals

```text
╔════ Signal Timing Split ════╦════════════════════════════════════╗
║ dialogue-linked            ║ inherits dialogue pacing           ║
║ instant execution          ║ immediate if context changes       ║
╚════════════════════════════╩════════════════════════════════════╝
```

#### Dialogue-linked

These are signals attached to speech acts such as:

- object reference grounding
- destination grounding
- group-reference grounding

Rule:

- they inherit the timing of the spoken line that caused them
- they do not need a second independent cooldown

#### Instant execution

These are signals emitted during active task execution such as:

- route correction
- placement-point change
- group re-alignment
- sudden urgency shift

Rule:

- they should be immediate when context materially changes
- they should remain quiet when nothing meaningful changed

### Family-Specific Emission Guidance

```text
Direction
├─ emit when destination or route meaningfully changes
└─ refresh while the same destination remains active

Attention
├─ emit when referent changes
└─ suppress tiny retarget flicker

Coordination
├─ emit on task-start or task-phase-shift
└─ refresh while the same coordinated task continues

Urgency
├─ emit immediately on escalation
├─ replace weaker urgency with stronger urgency
└─ use a tiny refractory guard only if oscillation appears in testing
```

### Debug Visibility Draft

Signals remain invisible in the player feed, but we should still have
debug-only ways to inspect them.

```text
debug visibility
├─ Inspect summary: latest signal family + anchor kind
├─ optional debug overlay: local arrow / radius / target marker
├─ audit logs only in developer tooling
└─ no normal player feed entries
```

### Relationship To Body Language

```text
╔════ Internal Signal vs Expression ════╦══════════════════════════╗
║ internal signal                      ║ hidden simulation support ║
║ wing flutter / antenna motion        ║ visible expression only   ║
╚══════════════════════════════════════╩═══════════════════════════╝
```

Wing flutter and antenna motion may visually accompany signals, but they do
not encode grammar or carry the semantic content by themselves.

### Relationship To Attraction

Signals should have only a light indirect effect on attraction.

```text
strong attraction drivers
├─ spoken dialogue quality
├─ relationship history
├─ trust / comfort / admiration
└─ teaching and memory continuity

light indirect modifiers
├─ coordination success
├─ responsiveness
└─ urgency handling under stress
```

### Feed Rule

```text
╔════════════════════ Feed Rule ════════════════════╗
║ signals do not appear as a player feed channel    ║
║ only speech/actions/learn remain player-facing    ║
╚════════════════════════════════════════════════════╝
```

Signals may still be visible in:

- debug overlays
- inspect summaries
- developer audits

But not in the main player feed.

### Persistence Rules

Persist only what materially shapes continuity:

- recent signal-reliability bias if used by interpretation
- long-term coordination tendencies if they become learned

Do not persist:

- most transient active signals
- stale per-frame pointing hints
- temporary route annotations

### QA Rules

Visible QA must prove:

```text
1. speech and signals no longer blur together
2. signals are not logged as feed chatter
3. spatial phrases like “there” or “this one” resolve better in behavior
4. butterflies coordinate movement/placement more clearly
5. no hidden-language look returns through motion cues
```

### Implementation Order

```text
╔════════════════════ Signal Implementation Order ═══════════════════╗
║ S1. remove player-feed signal channel                              ║
║ S2. add internal signal families and payloads                      ║
║ S3. bind signals to object/space grounding                         ║
║ S4. connect signals to pathing / placement / coordination          ║
║ S5. expose debug-only signal inspection                            ║
╚═════════════════════════════════════════════════════════════════════╝
```

## Cognition Addendum for New Systems

_Source: `docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md`_

### Purpose

This addendum extends the cognition contract for systems added after the original grand-plan draft.

It exists so newer gameplay additions are integrated into the butterfly mind intentionally rather than as disconnected one-off behaviors.

This addendum is subordinate to:

- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ML-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ML-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)

### Shape

```text
╔════════════ Addendum Coverage ════════════╗
║ player interaction  │ cursor trust / pet  ║
║ object affordance   │ flower / pollen /   ║
║                     │ egg / block         ║
║ space understanding │ obstacle / opening  ║
║                     │ / shelter / 3D prep ║
║ ecology context     │ wild / bred / release║
║ battle context      │ autobattle scoring  ║
╚═══════════════════════════════════════════╝
```

### Locked Rule

New systems must extend the existing cognition stack.

They must not:

- reintroduce removed pool-era logic
- depend on old Ephemera progression assumptions
- bypass owner systems with hardcoded one-off behavior

### New Feature Groups To Add

#### 1. Player Interaction Memory

These should become explicit cognition inputs and memory summaries:

```text
cursorTrust
cursorFear
petHistory
clapStartleHistory
calmedByCursor
startledByCursor
```

Purpose:

- let butterflies become friendlier by experience, not by static script
- let clap meaningfully affect sleep, caution, and future approach bias
- let pet/trust behavior persist as part of social memory with the player

#### 2. Object Affordance Awareness

These should become explicit world/context features:

```text
objectType
├─ flower
├─ pollen
├─ egg
└─ block

objectAffordance
├─ feedFrom
├─ carry
├─ plant
├─ drop
├─ stack
└─ shelterUse
```

Purpose:

- unify flower, pollen, egg, and block reasoning
- stop object behavior from living only inside ad hoc per-entity logic

#### 3. 3D-Ready Spatial Understanding

These should be added now even if full 3D occupancy is implemented later.

```text
verticality
├─ ground
├─ stacked
└─ overhead

structureRole
├─ loose
├─ wall
├─ roof
├─ opening
└─ shelter

pathState
├─ open
├─ obstructed
├─ enterable
└─ trapped

bodyFit
├─ canPass
├─ tooNarrow
└─ canShelterInside
```

Purpose:

- prepare butterflies to understand blocks under real 3D logic
- make future roof/interior/shelter work an extension of cognition instead of a bolt-on

#### 4. Ecology / Lineage Context

These should become explicit long-lived context channels:

```text
originType
├─ wild
├─ bred
└─ rostered

ecologyPressure
variantFamiliarity
lineageValue
releaseValue
zoneAffinity
```

Purpose:

- support the live wild ecology / release loop cleanly
- let discovery, bonding, breeding, release pressure, and roster value become part of the living simulation

#### 5. Autobattle Context

These should become explicit battle-mode cognition features:

```text
allyPressure
enemyThreat
targetPriority
spacingState
retreatPressure
supportOpportunity
```

Purpose:

- support autobattle reasoning without inventing a separate fake brain
- keep battle decisions rooted in the same butterfly identity used in the garden

### Contract Dependencies Now

The following now anchor this addendum:

```text
1. wild ecology / release contract
2. single-player autobattle contract
3. current spatial truth + later 3D shelter planning docs
```

### Definition Of Done

This addendum is implemented correctly when:

```text
1. newer systems feed the same cognition stack as older systems
2. butterflies can reason about player interaction, objects, and space coherently
3. future 3D block logic has reserved cognitive hooks already in place
4. no new implementation depends on removed pool / old Ephemera mechanics
```

## ML Implementation Contract

_Source: `docs/ML-IMPLEMENTATION-CONTRACT.md`_

### Purpose

This document turns the cognition/ML plan into an implementation-ready contract.

It exists to lock:

- the first ML runtime shape
- the feature schema
- the policy outputs
- the inference schedule
- the fallback behavior
- the inspect/debug trace format

It is a bridge between:

- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ML-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ML-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md)

If a future ML implementation is not supported by this contract or later explicit user direction, it should be treated as unresolved rather than improvised.

For future promoted execution order, use
[ACTIVE-EXPANSION-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-EXPANSION-BOARD.md)
as the authoritative ladder.

Read the `M1`-`M5` sequence here as this contract's local phase history and
feature-boundary map:

- `M1`-`M4` describe the shipped heuristic/static-policy closure path
- `M5` marks the later 3-D occupancy extension boundary

The `c1`-`c7` model-backed expansion sequence is now live and frozen on the
expansion board and in the execution playbook.

### Shape

```text
╔════════════════════ ML Runtime Shape ════════════════════╗
║ durable sim truth                                        ║
║  drives · emotions · memories · social · routines        ║
║  genetics · upbringing · progression · battle context    ║
║                 │                                        ║
║                 ▼                                        ║
║ feature builder                                          ║
║  normalized numeric vector + compact categorical flags   ║
║                 │                                        ║
║                 ▼                                        ║
║ policy bundle                                            ║
║  garden-action · target · signal · risk · battle-posture║
║                 │                                        ║
║                 ▼                                        ║
║ arbitration / fallback                                   ║
║  model result if valid                                   ║
║  else heuristic chooser                                  ║
║                 │                                        ║
║                 ▼                                        ║
║ behavior systems                                          ║
║  move · feed · bond · build · signal · battle            ║
║                 │                                        ║
║                 ▼                                        ║
║ inspect / debug traces                                   ║
║  chosen path · confidence · alternatives · source        ║
╚═══════════════════════════════════════════════════════════╝
```

### Ownership

```text
one owner per truth

lifeSimSystem         │ canonical cognition state families
statProfileSystem     │ genetics/expression/battle stat derivation
progressionManager    │ encounter / rarity / lineage progression truth
battleSystem          │ autobattle context + result application
mlInferenceSystem     │ feature building + model execution + policy traces
UI                    │ presentation only
```

`mlInferenceSystem` is a planned owner. It may not become the source of truth for genetics, emotions, memories, or progression.

### Locked First Runtime Choice

The future model-backed replacement path is now locked to:

```text
runtime
├─ local browser inference
├─ pre-trained/static model artifact
├─ deterministic feature builder
└─ heuristic fallback always available
```

Current shipped bridge:

```text
local static policy artifact
├─ browser-loaded JSON policy weights
├─ deterministic action/target scoring
├─ no online dependency
└─ safe bridge toward later ONNX replacement
```

`c1` locks the replacement target without forcing the current shipped bridge to
change first. `c4` now proves the local static policy artifact as a measurable,
versioned bundle, and `c5`-`c7` now close the live runtime rollout, truthful
explainability shell, and soak/freeze proof for that local model-backed path.

Not locked yet for a later phase:

```text
training pipeline host
online learning
server inference
future multiplayer determinism enforcement
```

### Locked Initial Training Path

The first ML layer should be bootstrapped from the existing sim, not from a blank policy.

```text
phase-1 training source
├─ heuristic action traces exported from the current game
├─ curated scenario captures from audits
├─ hand-corrected labels where the heuristic is visibly wrong
└─ offline supervised training / imitation
```

`c2` is now live on that path:

- `scripts/build-c2-trace-corpus.js` is the dedicated export seam
- the corpus manifest now covers garden, communication, ecology, and autobattle scenarios
- reviewed labels stay outside save truth and are rebuild-checked from the persisted corpus records

Not part of the first ML phase:

```text
reinforcement learning
self-play optimization
live online training
```

### Feature Builder Contract

The feature builder must be deterministic, rebuildable, and cheap to recompute.

Persist:

```text
model version id
last trace summary if needed for inspect/debug
```

Do not persist:

```text
raw feature vectors
transient score caches
cheap local-neighbor summaries
```

Current live feature contract after `c3` + `n6`:

```text
frozen feature contract
|- 14 feature groups
|- 98 flat named features
|- 124 numeric vector values
|- b3 stable spatial hooks
|  `- verticality · structureRole · pathState · bodyFit
|- b7 stable spatial fields
|  `- occupancyBand · obstacleDensity · shelterCandidate · insideShelter · canUseInterior
`- inspect/runtime proof
   `- Schema · Feat · Space rows in Inspect and post-load feature proof in runtime-self audit
```

Current live `c4` closure:

```text
threshold-proved local artifact
|- live bundle
|  `- m4-garden-policy-v1
|- explicit metadata
|  |- artifactFormat = linear-policy-json
|  |- featureSchemaVersion = m4-feature-schema-v1
|  |- traceSchemaVersion = m4-trace-schema-v1
|  `- contractVersion = c1-runtime-contract-v1
|- runtime proof
|  `- getRuntimeSummary() now surfaces artifactSummary compatibility state
|- evaluation proof
|  |- rebuilt c2 corpus during m4 audit
|  |- runtime trace alignment across garden, communication, ecology, autobattle
|  |- 16 / 16 artifact matches on the latest passing corpus
|  `- reviewed teaching actionFamily correction beats heuristic baseline
`- compatibility sweep
   `- m1, m3, m4, and autobattle audits stay green while runtime-self keeps the post-load ML step green
```

Current live `c5`-`c7` closure:

```text
frozen model-backed baseline
|- live runtime rollout
|  |- garden action / target / signal / risk scoring now runs through the local artifact
|  |- battle policy traces now stay on the same model-backed path
|  `- fallback remains explicit and audited
|- truthful explainability shell
|  |- Inspect rows: Path · Why
|  `- debug shell: artifact path · source · confidence · alternatives · feature drivers · budgets
|- performance / soak proof
|  |- focused-garden inference budget = 3.5ms
|  |- battle decision budget = 0.75ms
|  |- runtime-self proves post-load explainability and budget continuity
|  |- long soak proves the model-backed path stays live across checkpoints
|  `- final grand-plan proof now passes on the frozen expansion baseline
`- scope boundary
   `- later ONNX replacement remains optional future work, not a missing current phase
```

#### Feature groups

```text
Identity
├─ archetype id
├─ rarity bucket
├─ sex
├─ birth source
└─ special ability id

Genetics / expression
├─ 6 baseline traits
├─ 6 effective traits
├─ inherited ability origin
├─ mutation presence
└─ upbringing summary

Drives
├─ 8 drive values

Emotions
├─ 9 emotion values

Social
├─ reputation
├─ belonging
├─ confidence
├─ active context
└─ summarized edge strengths

Interpretation / distortion
├─ clarity
├─ warpedSignals
├─ anxietyBias
├─ withdrawalBias
├─ fixationBias
├─ insomniaBias
├─ oversleepBias
└─ warpedTeachingBias

Memory / routine summaries
├─ memory density by family
├─ routine strength by family
└─ recent communication activity

Player interaction
├─ cursorTrust
├─ cursorFear
├─ petHistory
├─ clapStartleHistory
└─ calmedByCursor

Object awareness
├─ focusType
├─ currentAffordance
├─ carryingType
├─ flower familiarity
├─ pollen familiarity
├─ egg familiarity
├─ block familiarity
└─ shelter confidence

Space / 3D-ready context
├─ verticality
├─ structure role
├─ path state
└─ body fit

Progression context
├─ origin type
├─ rarity exposure
├─ variant familiarity
├─ lineage value
└─ encounter value

World context
├─ zone kind
├─ crowding
├─ novelty
├─ flower availability
├─ nearby allies
├─ nearby rivals
├─ nearby vulnerable targets
└─ battle vs garden mode

Autobattle context
├─ ally pressure
├─ enemy threat
├─ target priority
├─ spacing state
├─ retreat pressure
└─ support opportunity
```

Shared hook ownership is now locked for future expansion:

```text
owner
└─ structureSystem

exported hook set
├─ verticality
├─ structureRole
├─ pathState
└─ bodyFit

consumer rule
├─ lifeSimSystem and mlInferenceSystem may import these hooks
└─ neither consumer may invent duplicate enums or labels
```

Live count after `c3` + `n6`:

```text
14 groups
98 flat named features
124 numeric vector values
```

#### Encoding rules

```text
numeric channels
├─ normalized to 0..1 where practical
└─ clamped before inference

categorical channels
├─ stable enum ids
└─ one-hot or compact embedding index

missing values
└─ explicit zero/default encoding, never NaN
```

### Policy Bundle Contract

The first ML phase should be split into multiple small policies instead of one opaque mega-decision.

```text
policy bundle
├─ action-family policy
├─ target-preference policy
├─ signal policy
├─ risk-posture policy
└─ autobattle-posture policy
```

#### 1. Action-family policy

Outputs weighted preferences for:

```text
wander
feed
socialize
signal
teach
court
rest
avoid
buildOrUseObject
battlePosture
```

#### 2. Target-preference policy

Outputs weighted preferences for:

```text
flower
butterfly
block
shelter
doorway
emptySpace
```

#### 3. Signal policy

Outputs weighted preferences for:

```text
calming
warning
teaching
invitation
quiet
```

#### 4. Risk-posture policy

Outputs weighted preferences for:

```text
approach
observe
avoid
flee
```

#### 5. Autobattle-posture policy

Outputs weighted preferences for:

```text
engage
support
focusWeakTarget
stabilize
retreat
```

### Arbitration Contract

The model does not directly mutate the world.

```text
allowed
feature vector -> model scores -> chooser/arbitrator -> existing systems act

forbidden
model -> directly edits memories / emotions / genetics / progression / battle truth
```

Behavior systems remain responsible for:

```text
movement
feeding
object pickup/drop/place
breeding transitions
signaling execution
battle resolution
```

The ML layer only proposes preferences.

### Inference Schedule Contract

The first ML phase should infer periodically, not every frame.

#### Garden mode

```text
default cadence
├─ every 20 simulation frames
└─ or earlier on major context change
```

Major context changes include:

```text
focus target changed
sleep state changed
pet or clap event
new signal received
object picked up or dropped
flower reached or depleted
courtship / breeding state changed
zone travel started or completed
```

#### Autobattle mode

```text
default cadence
└─ once per autobattle decision tick
```

The battle tick remains owned by [C:\Users\fishe\Documents\projects\ephemera\systems\battleSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/battleSystem.js).

### Fallback Contract

The game must remain fully playable if:

```text
model file missing
model load fails
inference throws
feature vector invalid
model output invalid
```

Fallback rule:

```text
1. log a compact debug event
2. mark the trace source as heuristic-fallback
3. use existing heuristic chooser for that policy tick
4. do not corrupt durable state
```

This is mandatory for:

```text
garden simulation
autobattle
save/load continuity
debug / audit tools
```

Current shipped proof now covers:

- Inspect rows for decision source, chosen path, context, and short history
- debug footer surfacing for backend, model id, and fallback count
- ML closure proof for a real heuristic-fallback tick with the model unavailable

### Trace / Inspect Contract

The ML layer is not done until it is readable.

Inspect / Debug must show:

```text
Decision Source
├─ heuristic
├─ ml
└─ heuristic-fallback

Chosen Path
├─ action family
├─ target preference
├─ signal choice
└─ risk posture

Confidence
├─ chosen score
├─ confidence band
└─ uncertainty flag

Alternatives
├─ next-best option
├─ second-next option
└─ rejection reasons summary

Context
├─ dominant drives
├─ dominant emotions
├─ object focus
├─ player trust/fear
└─ battle or garden mode
```

The player-facing question remains:

```text
why did this butterfly do that?
```

The answer must be visible without reading code.

### Audit Contract

The ML phase is not complete until audits can prove:

```text
1. the same butterfly can choose different actions in different contexts
2. different inherited traits produce different policy outputs
3. upbringing changes expression without mutating genotype truth
4. clap/pet/cursor trust changes future choices
5. object and shelter context affect action/target selection
6. autobattle posture changes with pressure/threat/support context
7. save/load preserves durable truth and safely rebuilds policy inputs
8. fallback path keeps the game playable if the model is absent
9. inspect/debug exposes chosen path and source correctly
```

Recommended audit layers:

```text
formula / schema tests
scenario tests
save-load round-trip tests
battle probe tests
visual QA screenshots/video
long-run soak tests
```

### Phase Order Contract

The ML work should ship in this order:

```text
Phase M1
├─ feature builder
├─ trace format
└─ heuristic-fallback wiring

Phase M2
├─ garden action-family policy
└─ target-preference policy

M2 currently ships with the local static policy artifact backend above.

Phase M3
├─ signal policy
└─ risk-posture policy

M3 currently ships with the same local static policy artifact backend for:

```text
garden policies
├─ action-family
├─ target-preference
├─ signal-choice
└─ risk-posture
```

Phase M4
└─ autobattle-posture policy

M4 currently ships with the same local static policy artifact backend for:

```text
battle policy
└─ autobattle-posture
```

Phase M5
└─ 3D occupancy feature extension once full shelter logic ships
```

Do not skip straight to autobattle ML before the garden feature builder and trace layer are stable.

### Hard Exclusions

The ML implementation must not:

```text
reintroduce pool-era progression
rely on removed Ephemera mechanics
replace owner systems as truth
require online services for basic single-player use
hide decisions behind unreadable opaque outputs
```

### Definition Of Done

This contract is fulfilled when:

```text
1. a dedicated ML inference owner exists
2. live features are built deterministically from current sim truth
3. at least the first policy layers are model-backed
4. heuristics remain as safe fallback
5. inspect/debug can explain the chosen path
6. audits prove the model changes behavior meaningfully
7. the system stays compatible with future 3D shelter logic and later online work
```

## Wild Ecology / Release Contract

_Source: `docs/WILD-ECOLOGY-RELEASE-CONTRACT.md`_

### Purpose

This document replaces the old breeding-gated unlock ladder with the new
wild-ecology loop.

Papilionem is no longer using progression as a rarity ladder. The intended loop
is now:

- living wild populations
- hybrid lineage management
- selective release
- released-stat uplift of future wild populations

### Direction Lock

```text
wild loop
â”œâ”€ fresh save
â”‚  â””â”€ starting zone only:
â”‚     â””â”€ 1 male + 1 female of each base type
â”‚        â””â”€ legendary/golden excluded for now
â”œâ”€ wild butterfly
â”‚  â”œâ”€ may mate 3 times total
â”‚  â”œâ”€ cannot repeat the same partner
â”‚  â””â”€ after 3rd mating vanishes in place
â”œâ”€ hybrid butterfly
â”‚  â”œâ”€ counts toward 150-total hybrid cap
â”‚  â””â”€ dies at hatch if the cap is still full
â”œâ”€ wild butterflies
â”‚  â””â”€ may still appear even when hybrid cap is full
â””â”€ every 10 released hybrids
   â””â”€ spawn 1 male + 1 female of every base type again
      using upgraded wild baselines from that release batch
```

### Scope

This contract replaces the old unlock-order progression model.

```text
no longer canonical
â”œâ”€ rarity unlock ladder
â”œâ”€ same-type child unlocks next type
â”œâ”€ per-type unlock order as the primary game loop
â””â”€ progression pressure as the main long-term structure

canonical now
â”œâ”€ wild population lifecycle
â”œâ”€ hybrid cap management
â”œâ”€ release-driven baseline uplift
â””â”€ mutant genes emerging inside an open ecology loop
```

### Flower Material Boundary

```text
flowers
|- live now
|  |- feeding surfaces
|  |- egg / lifecycle surfaces
|  `- ecology pressure inputs
`- not live now
   |- carried shelter materials
   |- build pieces
   `- flower-based construction loops
```

Direction lock:

- flowers remain part of the ecology/lifecycle loop in the current build
- butterflies do **not** currently gather flowers as construction material
- shelter/build visibility on this runtime comes from blocks, not flowers
- any future flower-material behavior must reopen on a later promoted board instead of being implied by the current release/ecology contract

### Ownership Map

```text
progressionManager   â”‚ live ecology owner: hybrid journal, wild mate history,
                    â”‚ release batches, naming identity, and baseline uplift
breedingSystem       â”‚ mating success, pregnancy, lifecycle, hatch gating
genetics/stat system â”‚ baseline stat package + mutant genes
gameCore             â”‚ fresh-save seeding, release-wave spawning, zone assignment
saveSystem           â”‚ persistence and migration
gameUI               â”‚ Inspect release flow only, never release truth
```

Implementation note:

- `progressionManager` is the current canonical runtime owner for the
  wild-release loop
- older unlock-shaped containers remain compatibility surfaces for legacy saves
  and historical UI paths only
- docs and future refactors should treat the ecology loop as live now, not a
  stopgap owner arrangement

### Fresh Save State

Assumption locked from your direction:

```text
fresh save
â””â”€ only the starting zone is seeded this way
```

Fresh save should place:

```text
starting zone receives
â”œâ”€ 1 female friendly
â”œâ”€ 1 male friendly
â”œâ”€ 1 female cautious
â”œâ”€ 1 male cautious
â”œâ”€ 1 female energetic
â”œâ”€ 1 male energetic
â”œâ”€ 1 female skittish
â”œâ”€ 1 male skittish
â”œâ”€ 1 female wise
â”œâ”€ 1 male wise
â”œâ”€ 1 female mystic
â””â”€ 1 male mystic
```

Legendary/golden is excluded from the fresh-save wild seed for now.

All seeded wild butterflies use the currently established base-line stats for
their type.

### Wild Butterfly Rules

```text
wild butterfly
â”œâ”€ birthSource = wild
â”œâ”€ totalWildMatesMax = 3
â”œâ”€ uniquePartnersRequired = true
â””â”€ after 3rd successful mating = vanish / die in place
```

#### Unique Partner Rule

Across the 3 allowed matings:

- a wild butterfly must not mate with the same partner twice
- failure to find a new valid partner should block further mating rather than
  violate this rule

#### Departure Rule

After the 3rd successful mating:

- wild butterfly vanishes where it stands
- no portal path / doorway departure sequence
- this is death/removal from the living wild population, not migration

### Hybrid Rule

```text
hybrid
= any butterfly that is not a wild butterfly
```

This includes:

- offspring of mixed lineage
- retained player-managed lineages
- any non-wild garden-born butterfly

#### Hybrid Cap

```text
global hybrid cap
â””â”€ 150 total living hybrids across all zones
```

The cap applies to:

- currently living hybrids
- regardless of zone

Wild butterflies do not count toward this cap.

#### Hard Hatch Rule At Cap

The cap must be enforced as a hard living-hybrid limit.

```text
if hybrid cap = full
â”œâ”€ mating may still occur
â”œâ”€ egg may still be laid
â”œâ”€ caterpillar may still hatch
â”œâ”€ caterpillar may still enter chrysalis / cocoon
â””â”€ at butterfly hatch moment
   â””â”€ if no hybrid slot exists, the hatch dies immediately
```

Intent:

- this keeps the living hybrid limit hard
- it still lets the life cycle visibly complete up to the hatch moment
- it gives the player time to release an existing hybrid and save an upcoming
  hatch

This death should be treated as:

- a failed hybrid emergence due to full capacity
- not a wild death
- not a release

Wild butterflies may still appear even when the hybrid cap is full.

### Release Rule

Release remains a meaningful selective-pressure mechanic.

```text
release
â”œâ”€ removes a hybrid from the living garden
â”œâ”€ removes it from all zones
â”œâ”€ contributes its stat package to the release batch
â””â”€ does not count as wild death
```

Released butterflies should contribute:

- inherited/base stat package
- relevant genetic trait values
- mutant-gene presence for future probability shaping if that remains active

#### Release UI Rule

Release should be surfaced through Inspect rather than a detached panel.

```text
Inspect
â”œâ”€ current-zone butterfly list
â”œâ”€ top action button: Release
â”œâ”€ first press on Release
â”‚  â””â”€ enters checklist mode
â”œâ”€ checklist mode
â”‚  â”œâ”€ player may select multiple butterflies in the viewed zone
â”‚  â””â”€ Escape cancels
â””â”€ second press on Release
   â””â”€ confirms release of all checked butterflies
```

Release UI should:

- make destructive intent explicit
- show that multiple butterflies can be selected
- stay local to the zone currently being viewed in Inspect
- show the current zone, lineage summary, and `batch x/10` progress for each releasable hybrid
- route the actual release through the release owner, not direct UI mutation

### Release Batch / Wild Baseline Uplift

```text
10 released hybrids
   â”‚
   â–¼
average + clamp + blend
   â”‚
   â–¼
updated wild baseline modifier
   â”‚
   â–¼
spawn 1 male + 1 female of every base type
```

#### Batch Rule

Every 10 released hybrids:

- compute a release-batch stat contribution
- apply that contribution to the wild baseline modifier
- spawn 1 male and 1 female of every base butterfly type again

#### Cohort Feedback Rule

Completed release batches now become cohort summaries in the live runtime.

Each cohort summary stores:

- the released hybrid ids from that completed 10-release wave
- top lineage mix
- top zone mix
- modifier highlights
- preferred root zone
- a blend guard that dampens overly concentrated release lines

Release-wave wild butterflies may use that cohort summary to show:

- familiarity with the cohort's leading lineages
- the preferred root zone for the cohort
- mild migration bias toward that root zone when the cohort actually had a strong zone focus

This shaping is intentionally mild. It is meant to make the ecology readable, not to
create a new hidden progression ladder.

#### Base-Type Respawn Wave

Respawn wave should include:

- friendly
- cautious
- energetic
- skittish
- wise
- mystic

Legendary/golden remains excluded for now unless later explicitly re-added.

#### Stat Uplift Rule

To avoid runaway stat inflation, release influence should be:

```text
uplift
= averaged
+ clamped
+ blended into existing wild baselines
```

Not:

- direct 1:1 copying of released stats
- permanent unchecked stat explosion from outliers
- focused release becoming strictly better than varied release when the underlying stat package is roughly equal

### Mutant Gene Continuity

Removing the unlock ladder must not remove mutant-gene emergence as a real
aspect of the game.

```text
keep
â”œâ”€ mutant genes as real genetic possibilities
â”œâ”€ hybrid lineage as a source of unusual combinations
â””â”€ release-driven baseline uplift as a way to keep ecology evolving
```

### Persistence

Persist:

```text
wild population records
hybrid living count
per-wild mate counts
per-wild partner history
release batch count
release batch stat aggregate
release batch lineage / zone counts
wild baseline modifiers
release cohort history
per-wild release cohort id
hybrid journal / lineage truth
pending hatch outcomes blocked by cap
```

Rebuild:

```text
zone-local spawn directives
derived ecology summaries
UI summaries derived from living population state
Inspect release-mode list state
```

### Invariants

```text
1. Fresh save seeds only the starting zone with one male + one female of each base type.
2. Wild butterflies can mate at most 3 times.
3. Wild butterflies cannot use the same partner twice across those 3 matings.
4. Wild butterflies vanish in place after their 3rd successful mating.
5. Hybrids are capped at 150 total living butterflies across all zones.
6. If the cap is full, hybrid cocoon-to-butterfly emergence fails as an immediate death at hatch.
7. Wild butterflies may still appear even when the hybrid cap is full.
8. Every 10 releases spawn 1 male + 1 female of each base type again.
9. Release affects future wild baselines through averaged/clamped uplift, not direct copying.
10. Completed release waves may shape future wild familiarity and root-zone preference, but only mildly.
11. Focused release of one lineage must not become a strictly dominant progression strategy.
12. Removing progression must not remove mutant-gene emergence.
```

### Audit Requirements

Additional live proof now requires:

- release waves persist cohort ids, top lineages, top zones, and readable ecology summaries
- Inspect release rows show zone, lineage, and `batch x/10` context
- focused release does not outperform a varied line by default when trait packages are comparable
- long-soak ecology proof keeps zone identity, migration health, resource recovery, and release feedback stable across the full multi-seed soak

```text
must verify
â”œâ”€ fresh save seeds the starting zone correctly
â”œâ”€ wild butterflies stop after 3 successful unique-partner matings
â”œâ”€ repeated same-partner wild mating is blocked
â”œâ”€ 150-hybrid cap is enforced globally
â”œâ”€ full-cap hybrid cocoons die at hatch instead of creating a 51st living hybrid
â”œâ”€ releasing before hatch can free a slot and allow the hatch to survive
â”œâ”€ wild spawns still function while the hybrid cap is full
â”œâ”€ release removes the butterfly cleanly from living zones
â”œâ”€ 10 releases trigger a correct respawn wave
â”œâ”€ respawn wave uses upgraded wild baselines
â””â”€ mutant genes still appear as intended in the new open ecology loop
```

## Single-Player Autobattle Contract

_Source: `docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`_

### Purpose

This document locks the intended single-player battle shape so battle implementation does not drift again.

It is intentionally limited to single-player first.
Online play is deferred and must be specified separately later.

### Source Anchors

- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ML-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ML-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)

### Locked Shape

```text
garden roster
   │
   ▼
top-right Battle mode
   │
   ▼
system builds strongest eligible player team
   │
   ▼
system builds opposing team by battle rules
   │
   ▼
autobattle runs on the battle arena map
   │
   ▼
result summary
   │
   ▼
commit back to garden truth
```

### Battle Map Rule

The current battle arena asset is the visible source of truth for the arena.

The arena is intentionally top-down.
It must not inherit the angled garden-ground presentation used in the living
zones.

Not allowed:

- custom visible grid overlay that ignores the arena art
- stray garden wall composition over the arena
- battle presentation that redraws a different playfield than the arena asset establishes
- reusing angled-garden projection logic as the visible battle plane

Internal slot geometry is allowed.
Visible battle borders should come from the battle map art.

### Team Selection Rule

The player does not manually build large teams butterfly by butterfly.

Default behavior:

```text
1. system reads all eligible living butterflies
2. system ranks them by battle readiness / strength
3. if roster members exist and non-roster opponents exist:
   - player team = strongest eligible roster members
   - opponent team = strongest eligible non-roster garden butterflies
4. otherwise:
   - strongest living butterflies are split into both sides
5. team size comes from arena battle capacity, capped by available fighters
```

This exists to keep battle usable at larger team sizes.

### Stat Rule

Battle strength must come from the genetics/stat contract, not a separate invented battle-only stat system.

Battle-relevant truth comes from:

```text
baseline inherited traits
upbringing modifiers
current-state modifiers
derived battle stats
readiness score/tier
special ability
```

### Decision Rule

Battle is autobattle.

Not allowed:

- turn-command HUD as the main battle model
- manual per-action player micromanagement as the core loop

Allowed:

- pause/resume
- compact field-status shell
- internal battle log / audit trail
- readable result summary
- small in-field health bars
- visible combat movement
- visible battle ability effects that match the current ability visual language

### Presentation Rule

Battle must visibly show the fight rather than only summarizing it in the log.

Visible combat should include, where applicable:

```text
movement into engagement
ability activation
special attacks
projectiles / emitted effects
flower-related battle behavior when the contracts call for it
health / damage consequence readability
```

The battle log is a support layer, not the main visible proof that combat happened.

The default player-facing battle shell should stay minimal:

- no large side roster slabs covering the field
- no permanent visible feed pane during combat
- a compact status rail is preferred over a dashboard-like HUD
- small in-field HP bars should carry most live unit readability

### Result Commit Rule

Battle outcomes must commit back into the garden simulation through owner systems.

Affected truth may include:

```text
memories
social edges
pressure / HP state
injury or strain state
confidence / fear / reputation
```

Battle must not be an isolated minigame with no effect on the living garden.

### Hard Exclusions

The single-player autobattle implementation must not depend on:

- pool completion
- old Ephemera progression loops
- manual squad/team concepts that were not part of the intended design

### Remaining Follow-Up Surface

These items still remain worth tracking, but opponent sourcing and team-size
selection are now live runtime rules:

```text
victory / retreat / KO end conditions
exact result-summary layout
future online battle sync model
```

### Definition Of Done

This contract is fulfilled when:

```text
1. battle launches from the top-right battle mode
2. team build follows roster-vs-garden first, then strongest-living fallback
3. the current battle map is rendered faithfully
4. the arena remains top-down and free of leaked garden-wall fragments
5. the fight resolves as an autobattle
6. stats, health, damage, and abilities visibly matter
7. results commit back into the live garden truth
```

# Chapter 3. Implementation Plans and Closure

These chapters collect the frozen execution path, the current coverage matrix, the live-versus-deferred boundary docs for the repaired runtime, the now-completed expansion record, and the active public-share readiness track.

## Active Repair Board

_Source: `docs/ACTIVE-REPAIR-BOARD.md`_

### Purpose

This is the frozen repair board for the closure baseline that mattered in the
current build.

Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish sequencing.

```text
+=======================================================================+
| Current Repair Shape                                                  |
+=======================================================================+
| A1  UI shell / journal readability             | live                 |
| A2  carry / flower coherence                   | live                 |
| A3  zone identity / cross-zone motivation      | live                 |
| A4  spatial model / 3D-grid truth audit        | live                 |
| A5  control simplification / overlay continuity| live                 |
| A6  live dispersal behavior                    | live                 |
| A7  crowded-zone optimization                  | live                 |
| A8  real dialogue composer + naming identity   | live                 |
| A9  battle presentation parity                 | live                 |
| A10 source-book de-staling                     | live                 |
+=======================================================================+
```

### Status Key

```text
live
|- implemented and passing current audit

active
|- still visibly incomplete
`- next repair work should continue here
```

### Current Truth Snapshot

```text
live now
|- journal shell fits in-window, keeps identity visible first, and scrolls internally
|- carried blocks resolve through one stable pose owner
|- butterflies put blocks down before sleep
|- flowers use one live silhouette family with palette variation
|- hybrid-cap authority, zone identity, and visible cross-zone travel are live
|- current pseudo-3D truth is documented and audited
|- redundant panel hotkeys were removed
|- specimen counters stay visible in debug
|- butterflies spread with soft crowd-avoidance and underused-space attraction
|- crowded-scene pressure now uses shared telemetry, adaptive particles,
|  smarter effect budgets, and throttled dialogue churn
|- hybrids now emerge with personal names, duplicate-name disambiguation,
|  known-name memory, and live intent/stance dialogue composition
|- battle feeds now keep representative combat actions visible even when
|  pressure / hp side-events spike
`- closure baseline re-confirmed zone-local caution identity after travel settles
```

```text
still active
`- no open repair remains on the current board
```

### Post-A10 Closure Baseline

```text
closed truth
|- targeted closure reruns are green for runtime self, communication,
|  single-player autobattle, and zone identity
|- battle event recency now prefers representative combat reads over noisy side-effects
|- the battle presentation audit now scores a short combat window instead of one arbitrary frame
`- broader frozen-baseline reruns also passed for controls, wild ecology, and UI readability on 2026-04-18
```

Primary owners:
- `systems/battleSystem.js`
- `systems/lifeSimSystem.js`
- `scripts/run-r5-battle-presentation-audit.js`

Audit evidence:
- `scripts/run-runtime-self-audit.js`
- `scripts/run-r6-communication-audit.js`
- `scripts/run-single-player-autobattle-audit.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-r5-battle-presentation-audit.js`

### Closed Repairs

#### A1 - UI Shell / Journal Readability

```text
closed truth
|- journal shell now fits inside the game window by default
|- page headers keep preview, name, description, and parent context readable first
|- mouse wheel scrolls page content only inside the content viewport
|- page changes are arrows / arrow keys only
`- long journal content scrolls internally instead of running off-screen
```

Primary owners:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-r4-ui-readability-audit.js`

#### A2 - Carry / Flower Coherence

```text
closed truth
|- carried blocks recover from local/world owner drift through one stable owner path
|- sleep will not continue while a block is still carried
|- butterflies safely put blocks down before settling into sleep
`- legacy flower type ids normalize into the approved one-style live family
```

Primary owners:
- `entities/butterfly.js`
- `entities/block.js`
- `entities/flower.js`
- `systems/physicsSystem.js`
- `systems/sleepSystem.js`
- `ui/debugUI.js`

Audit evidence:
- `scripts/run-a2-carry-flower-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-deep-systems-audit.js`

#### A4 - Spatial Model / 3D-Grid Truth Audit

```text
closed truth
|- current pseudo-3D runtime is documented canonically
|- focused-garden placement uses the shared section-scene region
|- roam-safe point generation is audited
`- future free-3D work is separated from current runtime truth
```

Primary owners:
- `docs/CURRENT-SPATIAL-TRUTH.md`
- `docs/LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md`
- `core/gridManager.js`

Audit evidence:
- `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-r1-movement-stability-audit.js`

#### A5 - Control Simplification / Overlay Continuity

```text
closed truth
|- redundant global hotkeys for clickable panels were removed
|- Escape remains for intentional cancel flows
`- specimen counters stay visible with debug overlays active
```

Primary owners:
- `ui/gameUI.js`
- `core/renderManager.js`

Audit evidence:
- `scripts/run-a5-control-continuity-audit.js`

#### A6 - Live Dispersal Behavior

```text
closed truth
|- butterflies score wander points against live sector occupancy
|- feeding and block curiosity respect crowd pressure and recent-target reuse
|- crowded pockets trigger earlier retargeting toward underused space
`- gathering remains possible without permanent knotting
```

Primary owners:
- `core/gameCore.js`
- `entities/butterfly.js`
- `core/config.js`

Audit evidence:
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

#### A7 - Crowded-Zone Optimization

```text
closed truth
|- telemetry now exposes a shared pressure profile
|- render/effect degradation keys off shared pressure instead of isolated guesses
|- particle emission scales to load and respects pool headroom
|- decorative effects are pruned before important readability effects
|- queued dialogue replies now respect crowded-scene budgets
`- particle pool bookkeeping no longer leaks active slots during pool handoff
```

Primary owners:
- `systems/telemetrySystem.js`
- `core/renderManager.js`
- `systems/specialEffects.js`
- `systems/particleSystem.js`
- `systems/communicationSystem.js`
- `core/gameCore.js`

Audit evidence:
- `scripts/run-runtime-self-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`

### Active Repairs

#### A3 - Zone Identity / Cross-Zone Motivation

```text
closed truth
|- each zone now carries explicit identity labels, tags, settle bias, and action-bias profiles
|- gameCore scores travel with action-fit, novelty, crowd relief, and recent-zone memory
|- butterflies now retain lightweight zone-travel memory to reduce ping-pong and support meaningful movement
|- life-sim derived state now bends toward the active zone's role after arrival
|- training, watchful, exploratory, and calm zones now produce visibly different resident bias patterns
|- moss-hollow once again settles as the highest-caution resident zone after travel churn
`- focused UI summaries now surface the richer zone identity instead of flattening everything into one garden rhythm
```

Owners:
- `core/config.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/zoneSystem.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-r2-zone-transition-audit.js`
- `scripts/run-runtime-self-audit.js`

#### A8 - Real Dialogue Composer + Naming Identity

```text
closed truth
|- hybrids now receive personal first names at emergence
|- duplicate living hybrid first names keep the oldest unsuffixed and give later duplicates a one-letter display suffix
|- butterflies now retain self-name identity and learn the names of butterflies they speak with or hear
|- dialogue records now carry intent family, intent subtype, and reply stance metadata
|- spoken lines are composed from live intent, talk mode, register, tone, zone lexicon, and relationship context
`- reply timing, inspect summaries, and Talk feed formatting remain aligned with the new runtime
```

Owners:
- `core/progressionManager.js`
- `core/entity.js`
- `entities/butterfly.js`
- `systems/breedingSystem.js`
- `systems/communicationSystem.js`
- `scripts/run-r6-communication-audit.js`

Audit evidence:
- `scripts/run-r6-communication-audit.js`

#### A9 - Battle Presentation Parity

```text
closed truth
|- battle HUD and battle log now use canonical butterfly labels instead of id fragments
|- top-down combat now shows distinct guard, retreat, rally, attack, and special-action cues
|- battle projectiles now carry ability-specific visual styles instead of generic dots only
|- Delicate Pink now has flower-related battle behavior through bloom/petal combat effects
`- battle audits now verify readable labels, special labels, projectile styles, and flower-related battle actions
```

Owners:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

Audit evidence:
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

#### A10 - Source-Book De-Staling

```text
closed truth
|- guidebook, player guide, contracts, and diagram prompts now describe the live wild-ecology/button-first runtime
|- on-screen helper copy no longer advertises retired panel hotkeys
`- the source book now rebuilds cleanly from current upstream docs
```

### Next Implementation Order

```text
1. no open repair on the current board
```

## Active Polish Board

_Source: `docs/ACTIVE-POLISH-BOARD.md`_

### Purpose

This is the live sequencing board for player-facing polish after the
2026-04-18 frozen repair baseline.

Use this board for:

- readability passes
- player-proof passes
- visual grounding passes
- shared visible QA closure

Do not use this board to reopen closed owner-truth repairs unless a fresh audit
proves a real regression.

```text
+=======================================================================+
| Current Polish Shape                                                  |
+=======================================================================+
| P1 inspect / feed readability shell     | live                        |
| P2 journal / roster glanceability       | live                        |
| P3 battle shell comprehension           | live                        |
| P4 communication visible grounding      | live                        |
| P5 final visible polish proof           | live                        |
+=======================================================================+
```

### Status Key

```text
live
|- implemented and holding through current polish evidence

active
|- current working phase
`- next edits should stay here until it is clean

queued
`- intentionally sequenced later
```

### Current Baseline Snapshot

```text
baseline now
|- repair and parity closure are frozen clean
|- runtime truth is currently passing the active closure audit ring
|- remaining work is not missing systems
`- player-facing proof is now frozen clean
```

```text
active now
|- P1 is holding through `r4` and `r6` after the new inspect/feed shell pass
|- P2 is holding through `r4` and `single-player-autobattle` after the journal/roster glanceability pass
|- P3 is holding through `r5` and `single-player-autobattle` after the new battle-shell comprehension pass
|- P4 is holding through `r6` and `runtime-self` after the visible communication grounding pass
|- P5 is holding through `r4`, `r5`, `r6`, `single-player-autobattle`, `runtime-self`, and `final-grand-plan`
`- the polish board is frozen clean after the shared screenshot-backed proof pass
```

### Phase Detail

#### P1 - Inspect / Feed Readability Shell

```text
phase goal
|- make Inspect scan in a clearer top-to-bottom order
|- improve hierarchy, spacing, and contrast at normal play scale
|- keep feed lines more obviously tied to visible lessons, movement, and talk
`- preserve current accessibility controls and debug-truth agreement
```

Owners:
- `ui/gameUI.js`
- `ui/butterflyCollection.js`
- `systems/communicationSystem.js`

Baseline evidence:
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-r6-communication-audit.js`

Closure evidence:
- 2026-04-18: fixed inspect hero card + grouped section cards
- 2026-04-18: feed now renders structured context-aware cards while preserving feed-string audit contracts
- 2026-04-18: `run-r4-ui-readability-audit.js` -> pass
- 2026-04-18: `run-r6-communication-audit.js` -> pass

#### P2 - Journal / Roster Glanceability

```text
phase goal
|- make collection and roster pages easier to skim at a glance
|- reduce card-density confusion and button collisions
|- surface battle relevance, readiness, and identity faster
`- keep long-page scrolling and current button-first flows intact
```

Owners:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

Baseline evidence:
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

Closure evidence:
- 2026-04-18: collection and roster summary cards now use badge rows, stronger section contrast, and clearer shell spacing
- 2026-04-18: roster now surfaces readiness, membership, and nearby alternatives through a glance strip without changing wheel-scroll or battle-launch flow
- 2026-04-18: `run-r4-ui-readability-audit.js` -> pass
- 2026-04-18: `run-single-player-autobattle-audit.js` -> pass

#### P3 - Battle Shell Comprehension

```text
phase goal
|- make live battle state easier to understand without debug tools
|- improve team-state reads, combat consequence reads, and post-battle return clarity
|- keep battle labels, event recency, and action-family reads aligned
`- avoid reopening resolved battle snapshot or arena-truth repairs
```

Owners:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`

Baseline evidence:
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

Closure evidence:
- 2026-04-18: battle HUD now defaults to a live focus view, clearer team-state reads, and tagged battle-feed rows instead of an empty center shell
- 2026-04-18: the arena now highlights the current battle focus and the result state now reads as `Return to Garden` before commit
- 2026-04-18: `run-r5-battle-presentation-audit.js` -> pass
- 2026-04-18: `run-single-player-autobattle-audit.js` -> pass

#### P4 - Communication Visible Grounding

```text
phase goal
|- keep spoken/feed output believable and easy to map to visible behavior
|- reduce moments where the text implies stronger action than the garden shows
|- preserve current naming, intent, stance, and zone-lexicon truth
`- keep signals internal-only and avoid reviving retired feed models
```

Owners:
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`

Baseline evidence:
- `scripts/run-r6-communication-audit.js`
- `scripts/run-runtime-self-audit.js`

Closure evidence:
- 2026-04-18: talk cards now surface direct/open talk mode, zone context, and visible-behavior grounding without changing legacy feed-line contracts
- 2026-04-18: same-name speakers are now disambiguated in the feed and battle/action cards carry explicit grounding lines
- 2026-04-18: `run-r6-communication-audit.js` -> pass
- 2026-04-18: `run-runtime-self-audit.js` -> pass

#### P5 - Final Visible Polish Proof

```text
phase goal
|- run one shared browser-visible polish pass across Inspect, Journal, feed, and battle
|- capture screenshot-backed proof for the most important player-facing states
`- freeze the polish board only after the visible shell reads cleanly end to end
```

Owners:
- `scripts/`
- `docs/`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

Baseline evidence:
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-r6-communication-audit.js`
- `scripts/run-single-player-autobattle-audit.js`
- `scripts/run-final-grand-plan-audit.js`
- `scripts/run-runtime-self-audit.js`

Closure evidence:
- 2026-04-18: shared proof pass re-ran Inspect, Journal, feed, and battle audits against the repaired shell and captured fresh screenshot-backed evidence
- 2026-04-18: `run-final-grand-plan-audit.js` was de-staled to the repaired wild-exit, migration, and short-soak rules and now passes end to end with video + screenshot output
- 2026-04-18: `run-r4-ui-readability-audit.js` -> pass
- 2026-04-18: `run-r5-battle-presentation-audit.js` -> pass
- 2026-04-18: `run-r6-communication-audit.js` -> pass
- 2026-04-18: `run-single-player-autobattle-audit.js` -> pass
- 2026-04-18: `run-runtime-self-audit.js` -> pass
- 2026-04-18: `run-final-grand-plan-audit.js` -> pass

### Completed Polish Order

```text
1. P2 journal / roster glanceability
2. P3 battle shell comprehension
3. P4 communication visible grounding
4. P5 final visible polish proof
```

## Source-Chapter Coverage Matrix

_Source: `docs/SOURCE-CHAPTER-COVERAGE-MATRIX.md`_

### Purpose

This matrix scans the current source-book chapter by chapter and classifies each
source document against the proved runtime.

Use this document to answer:

```text
what is already live
what is only partially realized
what is intentionally deferred
what is only historical/reference material
what was closed in the implementation pass versus what remains intentionally later
```

Use [ACTIVE-IMPLEMENTATION-BOARD.md](./ACTIVE-IMPLEMENTATION-BOARD.md) for the
frozen `I1`-`I5` execution path derived from this matrix.
Use [IMPLEMENTATION-PARITY-AUDIT.md](./IMPLEMENTATION-PARITY-AUDIT.md) and
[PLAYER-FACING-POLISH-AUDIT.md](./PLAYER-FACING-POLISH-AUDIT.md) for the
current frozen runtime baseline.

### Coverage Lens

```text
source-book chapter
      |
      v
source document
      |
      v
runtime proof / boundary doc
      |
      v
live / partial / deferred / historical / drift-watch
      |
      v
hold / deferred / historical against the frozen I1-I5 baseline
```

### Classification Key

```text
runtime state
|- live            = current docs and proved runtime mostly match
|- live core       = shipped current truth is live, but edge rules or later boundaries remain
|- partial         = implemented area still marked under-expressed or under-proved
|- deferred        = intentionally later by contract, not a current implementation miss
|- historical      = checkpoint/reference only, not a live status owner
`- reference       = appendix/supporting material that should sync to source docs, not drive implementation alone
```

```text
gap type
|- none            = no current implementation work needed
|- under-expressed = owner truth exists, but behavior/UI/proof is still shallow
|- proof-light     = likely live, but audit/trace proof is narrower than the contract
|- meta-doc drift  = runtime is ahead of doc framing/classification
|- deferred        = not current-board work
`- historical-only = keep for reference, not live sequencing
```

```text
next action
|- hold            = keep current baseline only
|- later           = explicitly deferred by contract
|- historical      = reference only
`- sync-on-change  = update when the corresponding source docs change
```

`I1` through `I5` now appear only as historical closure labels in proof text.

### Current Scan Shape

```text
coverage result
|- hold / live now
|  |- orientation docs
|  |- player-facing shell docs
|  |- ecology / release docs
|  |- autobattle docs
|  |- life-sim expression audit
|  |- frozen parity / polish baselines
|  |- frozen implementation baseline
|  |- frozen expansion baseline
|  `- current spatial truth
`- intentionally later
   |- volumetric / sandbox-style 3D beyond the grounded spatial baseline
   |- optional later ML runtime replacement
   `- online battle / later expansion work
```

### Chapter 1 - Orientation

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `README.md` | `live` | `none` | source-book workflow and current doc map are still valid | `hold` |
| `PAPILIONEM-GUIDEBOOK.md` | `live` | `none` | repaired runtime and source-book rebuilds now match the guidebook baseline | `hold` |
| `PAPILIONEM-PLAYER-GUIDE.md` | `live` | `none` | player-facing shell, controls, ecology, and battle docs were de-staled in A10/P1-P5 | `hold` |

### Chapter 2 - Core Contracts

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `GENETICS-STAT-CONTRACT.md` | `live` | `none` | mutation, lineage depth, rarity split, latent/dormant lock notes, and multi-generation heritage proof now hold through genetics/stat audits and the foundation contract audit | `hold` |
| `COGNITION-ML-CONTRACT.md` | `live core` | `deferred` | the local model-backed layer is now live with explainability, fallback, performance, and soak proof; optional later runtime-replacement choices remain intentionally separate | `deferred` |
| `COMMUNICATION-LANGUAGE-CONTRACT.md` | `live` | `none` | naming, intent/stance metadata, reply timing, and feed grounding now hold through `r6` | `hold` |
| `DIALOGUE-VOICE-CONTRACT.md` | `live` | `none` | dialogue records, Inspect voice surfacing, and `r6` now prove intelligence-band, register, and warning-tone shaping directly | `hold` |
| `DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md` | `live` | `none` | rememberability bands, courtship/rejection residue, repair follow-through, retained dialogue lessons, Inspect surfacing, and `r6` proof now hold; explicit promise-only dialogue acts remain outside the shipped signal set | `hold` |
| `INTERNAL-SIGNAL-CONTRACT.md` | `live` | `none` | active signal summaries and `r6` now prove targeted support, recipient perception, expiry cleanup, and no feed leakage | `hold` |
| `COGNITION-ADDENDUM-NEW-SYSTEMS.md` | `live` | `none` | closure docs treat the addendum as pass and the newer systems now feed the shared cognition stack | `hold` |
| `ML-IMPLEMENTATION-CONTRACT.md` | `live core` | `deferred` | the frozen `c1`-`c7` ML baseline is now documented with rollout, explainability, and soak proof; optional later ONNX/runtime replacement remains intentionally open | `deferred` |
| `WILD-ECOLOGY-RELEASE-CONTRACT.md` | `live` | `none` | `w2`, parity, and final grand-plan proof all match the wild-ecology loop | `hold` |
| `SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md` | `live` | `none` | `single-player-autobattle`, `r5`, and final grand-plan proof all hold | `hold` |

### Chapter 3 - Implementation Plans And Closure

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `ACTIVE-REPAIR-BOARD.md` | `historical` | `historical-only` | frozen closure board; no open repair remains | `historical` |
| `ACTIVE-POLISH-BOARD.md` | `historical` | `historical-only` | frozen polish board; `P5` closed and board is clean | `historical` |
| `SOURCE-CHAPTER-COVERAGE-MATRIX.md` | `live` | `none` | this matrix is the frozen classification layer for the repaired runtime and its deferred boundaries | `hold` |
| `ACTIVE-IMPLEMENTATION-BOARD.md` | `live` | `none` | this board now preserves the completed `I1`-`I5` closure path derived from the matrix | `hold` |
| `ACTIVE-EXPANSION-BOARD.md` | `live` | `none` | this board now preserves the completed `a1`-`a6`, `b1`-`b7`, and `c1`-`c7` expansion path on the frozen runtime | `hold` |
| `REMAINING-IMPLEMENTATION-ROADMAP.md` | `live` | `none` | the roadmap now records the completed expansion order and closed-state notes for ecology depth, later 3-D, and ML | `hold` |
| `EXPANSION-EXECUTION-PLAYBOOK.md` | `live` | `none` | the playbook now acts as the frozen execution record for how the completed expansion path was built and audited | `hold` |
| `ACTIVE-PUBLIC-SHARE-BOARD.md` | `live` | `none` | active release-readiness sequencing board for startup sanity, onboarding, outside playtests, and public-alpha freeze work | `hold` |
| `PUBLIC-SHARE-READINESS-ROADMAP.md` | `live` | `none` | concrete roadmap for moving from frozen internal build to local-host shareability and then public-alpha readiness | `hold` |
| `EXTERNAL-PLAYTEST-MATRIX.md` | `live` | `none` | environment matrix, validated host-local lane, and outside-tester intake path now exist as the release-readiness evidence map | `hold` |
| `PLAYTEST-TRIAGE-LOG.md` | `live` | `none` | outside-tester findings now have a concrete landing spot before `R4` code/doc changes are chosen | `hold` |
| `IMPLEMENTATION-PARITY-AUDIT.md` | `live` | `none` | frozen owner-truth baseline for current runtime | `hold` |
| `PLAYER-FACING-POLISH-AUDIT.md` | `live` | `none` | frozen player-facing proof baseline for the current shell | `hold` |
| `INTENT-AND-EXCLUSIONS-LEDGER.md` | `live` | `none` | the former `active intended` items are now reclassified into `live now` or `deferred / later` against the frozen implementation baseline | `hold` |
| `GRAND-PLAN-CLOSURE-ROADMAP.md` | `historical` | `historical-only` | closure roadmap is a checkpoint/reference now, not live sequencing | `historical` |
| `IMPLEMENTATION-RECOVERY-PLAN.md` | `historical` | `historical-only` | recovery plan is a historical execution record now | `historical` |
| `SOURCE-BOOK-DESTALING-RULES.md` | `live` | `none` | still the correct rule set for keeping present-tense claims honest | `hold` |
| `RECOVERY-BLOCKER-LEDGER.md` | `historical` | `historical-only` | no current blocker is open; preserve as reversal history only | `historical` |
| `CURRENT-SPATIAL-TRUTH.md` | `live core` | `deferred` | the grounded spatial baseline now includes occupancy/carry/stack truth and remains green; volumetric free-flight remains explicitly not live | `hold` |
| `LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md` | `deferred` | `deferred` | later 3D phase is intentionally separate from current runtime truth | `later` |
| `CLOSURE-AUDIT-MATRIX.md` | `historical` | `historical-only` | historical closure checkpoint replaced by frozen parity/polish baselines | `historical` |
| `COMPLETENESS-AUDIT.md` | `historical` | `historical-only` | explicitly historical; no longer a current gap list | `historical` |
| `LIFESIM-EXPRESSION-AUDIT.md` | `live` | `none` | `I1` closed the life-sim family gap with deeper behavior feedback, Inspect surfacing, and audit proof | `hold` |

### Chapter 4 - Architecture And Diagram Appendices

| Source doc | Runtime state | Gap type | Proof / anchor | Next action |
| --- | --- | --- | --- | --- |
| `GEMINI-DIAGRAM-PROMPTS.md` | `reference` | `none` | diagram prompt pack remains useful as a communication appendix | `sync-on-change` |
| `01-whole-game-architecture.md` | `reference` | `none` | architecture appendix should follow source-doc changes, not lead them | `sync-on-change` |
| `02-life-sim-state-container.md` | `reference` | `none` | update only if `I1` changes the owned life-sim shape materially | `sync-on-change` |
| `03-sleep-state-machine.md` | `reference` | `none` | current sleep owner truth is already frozen clean | `sync-on-change` |
| `04-teaching-trust-flow.md` | `reference` | `none` | the appendix still matches the shipped teaching/trust shape and can remain a sync-on-change reference | `sync-on-change` |
| `05-genetics-breeding-lifecycle.md` | `reference` | `none` | update if `I3` changes edge-rule presentation or lineage surfacing | `sync-on-change` |
| `06-controls-ui-map.md` | `reference` | `none` | current controls/UI shell is frozen clean after `P5` | `sync-on-change` |
| `07-save-load-audit-workflow.md` | `reference` | `none` | save/load/audit workflow remains valid as a reference appendix | `sync-on-change` |
| `08-battle-snapshot-separation.md` | `reference` | `none` | battle snapshot ownership is already closed and frozen | `sync-on-change` |

### Routing Summary

```text
current routing
|- hold
|  |- `GENETICS-STAT-CONTRACT.md`
|  |- `DIALOGUE-VOICE-CONTRACT.md`
|  |- `INTERNAL-SIGNAL-CONTRACT.md`
|  |- `ACTIVE-EXPANSION-BOARD.md`
|  |- `REMAINING-IMPLEMENTATION-ROADMAP.md`
|  |- `EXPANSION-EXECUTION-PLAYBOOK.md`
|  |- `ACTIVE-PUBLIC-SHARE-BOARD.md`
|  |- `PUBLIC-SHARE-READINESS-ROADMAP.md`
|  |- `EXTERNAL-PLAYTEST-MATRIX.md`
|  |- `PLAYTEST-TRIAGE-LOG.md`
|  `- `INTENT-AND-EXCLUSIONS-LEDGER.md`
|- deferred
|  |- `COGNITION-ML-CONTRACT.md`
|  |- `ML-IMPLEMENTATION-CONTRACT.md`
|  `- `LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md`
`- sync-on-change
   `- reference appendices such as `04-teaching-trust-flow.md`
```

## Active Implementation Board

_Source: `docs/ACTIVE-IMPLEMENTATION-BOARD.md`_

### Purpose

This board is the frozen sequencing record for the post-polish implementation
work derived from the source coverage scan.

Use [SOURCE-CHAPTER-COVERAGE-MATRIX.md](./SOURCE-CHAPTER-COVERAGE-MATRIX.md) as
the intake map.

This board is now frozen clean after `I1` through `I5`.

Use it to:

- understand the completed implementation sequence
- verify what was closed versus what remains deferred
- reopen the work only if a fresh non-deferred phase is intentionally promoted

Do not use this board to reopen frozen repair or polish areas unless a fresh
audit proves a real regression or a new promoted implementation board is opened.

### Current Implementation Shape

```text
+=======================================================================+
| Current Implementation Shape                                          |
+=======================================================================+
| I1 life-sim expression depth               | live                      |
| I2 dialogue residue / relationship follow  | live                      |
| I3 genetics edge-rule lock + surfacing     | live                      |
| I4 voice / signal / ML trace proof         | live                      |
| I5 meta-doc reclassification + freeze      | live                      |
+=======================================================================+
```

### Status Key

```text
live
|- implemented and holding through current evidence

active
|- current working phase
`- next implementation work should stay here until it is clean

queued
`- intentionally sequenced later
```

### Current Baseline Snapshot

```text
baseline now
|- repair closure is frozen clean
|- player-facing polish closure is frozen clean
|- source docs are broadly aligned with the repaired runtime
`- no non-deferred implementation gap remains on this board
```

```text
implementation now
|- I1 through I5 are closed
|- source docs, audit docs, and the source book now read against the same
|  frozen runtime baseline
`- only deferred later work like fuller 3D physics, later ML replacement, and
   online battle stays off this board
```

### Phase Detail

#### I1 - Life-Sim Expression Depth

```text
phase goal
|- make memories, routines, upbringing, and distortion more behavior-driving
|- improve Inspect/debug surfacing for the still-partial life-sim families
|- keep one-owner cognition boundaries intact
`- upgrade the life-sim expression audit from descriptive to closure-grade proof
```

```text
status
|- closed in I1 with deeper life-sim family feedback into behavior
|- Inspect now surfaces memory, habit, upbringing, and distortion residue directly
`- audit and roundtrip proof now hold for the widened runtime
```

Primary source docs:
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
- `docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md`
- `docs/PAPILIONEM-GUIDEBOOK.md`

Owners:
- `systems/lifeSimSystem.js`
- `systems/behaviorSystem.js`
- `ui/gameUI.js`
- `scripts/run-lifesim-expression-audit.js`

Baseline evidence:
- `docs/LIFESIM-EXPRESSION-AUDIT.md`
- `scripts/run-lifesim-expression-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

#### I2 - Dialogue Residue / Relationship Follow-Through

```text
phase goal
|- make remembered dialogue change later behavior more legibly
|- prove rejection, repair / forgiveness, courtship, and follow-through rules
|- preserve the current composer, feed grounding, and relationship-owner boundaries
`- keep feed text as proof surface, never as relationship truth owner
```

Primary source docs:
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`
- `docs/COMMUNICATION-LANGUAGE-CONTRACT.md`

Owners:
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/`

Baseline evidence:
- `scripts/run-r6-communication-audit.js`
- `scripts/run-lifesim-expression-audit.js`

```text
status
|- closed in I2 with rememberability bands, courtship/rejection residue,
|  repair-state follow-through, and retained dialogue Learn outcomes
|- Inspect and feed now surface recent residue, reciprocity, rejection,
|  repair, and retained lesson proof without moving truth out of
|  communicationSystem
`- the shipped repair path currently rides reassurance / acceptance residue,
   not a separate apology-only signal type
```

#### I3 - Genetics Edge-Rule Lock + Surfacing

```text
phase goal
|- lock the unresolved genetics presentation and inheritance edge rules
|- improve player-readable surfacing for inherited vs learned vs current modifiers
|- keep statProfileSystem as the canonical stat derivation owner
`- avoid improvising golden/legendary or latent/dormant behavior outside the contract
```

Primary source docs:
- `docs/GENETICS-STAT-CONTRACT.md`
- `docs/PAPILIONEM-GUIDEBOOK.md`

Owners:
- `systems/statProfileSystem.js`
- `systems/breedingSystem.js`
- `core/progressionManager.js`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

Baseline evidence:
- `scripts/run-genetics-mutation-audit.js`
- `scripts/run-phase2-stats-audit.js`
- `scripts/run-foundation-contract-audit.js`

```text
status
|- closed in I3 with archived lineage types/depth, lineage-vs-encounter rarity
|  surfacing, explicit latent/dormant lock notes, and mutation-as-baseline proof
|- Inspect, journal, and roster now explain inherited, learned, current, and
|  battle-facing stat layers without moving derivation truth out of
|  statProfileSystem
`- golden/legendary ancestry is now locked as normal lineage context rather
   than special unlock or encounter-rarity behavior
```

#### I4 - Voice / Signal / ML Trace Proof

```text
phase goal
|- strengthen proof for dialogue voice, internal signals, and current ML traces
|- add or tighten audits where the contracts are currently broader than the proof
|- keep current shipped ML/runtime boundaries explicit
`- avoid pulling deferred later-ML work onto the current board
```

Primary source docs:
- `docs/DIALOGUE-VOICE-CONTRACT.md`
- `docs/INTERNAL-SIGNAL-CONTRACT.md`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/ML-IMPLEMENTATION-CONTRACT.md`

Owners:
- `systems/communicationSystem.js`
- `systems/mlInferenceSystem.js`
- `ui/gameUI.js`
- `ui/debugUI.js`
- `scripts/`

Baseline evidence:
- `scripts/run-r6-communication-audit.js`
- `scripts/run-ml-closure-audit.js`
- `scripts/run-runtime-self-audit.js`
- `scripts/run-r4-ui-readability-audit.js`

```text
status
|- closed in I4 with explicit voice-band/register/tone proof, source-side
|  signal support summaries, and Inspect/debug trace surfacing for current ML
|- `r6` now proves voice shaping plus targeted signal support without feed
|  leakage, and `ml-closure` now proves the heuristic-fallback path directly
`- later ML runtime replacement and 3D occupancy work remain deferred on purpose
```

#### I5 - Meta-Doc Reclassification + Source-Book Freeze

```text
phase goal
|- reclassify stale "active intended" wording once I1-I4 land
|- keep historical docs clearly historical and live docs clearly present-tense
|- refresh source-book appendices that shadow changed systems
`- freeze this board only after the matrix and source book read honestly end to end
```

Primary source docs:
- `docs/SOURCE-CHAPTER-COVERAGE-MATRIX.md`
- `docs/INTENT-AND-EXCLUSIONS-LEDGER.md`
- `docs/README.md`
- `docs/source-book/book-manifest.json`

Owners:
- `docs/`
- `scripts/build-source-book.js`

Baseline evidence:
- `docs/SOURCE-BOOK-DESTALING-RULES.md`
- `docs/SOURCE-CHAPTER-COVERAGE-MATRIX.md`
- `node scripts/build-source-book.js`

```text
status
|- closed in I5 by reclassifying the intent ledger, freezing the implementation
|  board state, and updating the coverage matrix to match the post-I4 reality
|- the source book now rebuilds from docs that read honestly in present tense
|  against the current shipped runtime
`- open a fresh board only if new non-deferred work is intentionally promoted
```

### Not On This Board

```text
deferred later
├─ fuller later 3D physics beyond current pseudo-3D runtime
├─ later ML runtime replacement / training-host decisions
└─ online battle / multiplayer expansion
```

Those remain intentionally outside the active implementation board until they
are explicitly promoted out of the deferred boundary docs.

### Exact Implementation Order

```text
1. I1 life-sim expression depth
2. I2 dialogue residue / relationship follow-through
3. I3 genetics edge-rule lock + surfacing
4. I4 voice / signal / ML trace proof
5. I5 meta-doc reclassification + source-book freeze
```

## Active Expansion Board

_Source: `docs/ACTIVE-EXPANSION-BOARD.md`_

### Purpose

This board now preserves the completed expansion implementation path that landed
beyond the frozen repair, polish, and `I1`-`I5` implementation baseline.

Read this together with:

- [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md)
- [EXPANSION-EXECUTION-PLAYBOOK.md](./EXPANSION-EXECUTION-PLAYBOOK.md)
- [INTENT-AND-EXCLUSIONS-LEDGER.md](./INTENT-AND-EXCLUSIONS-LEDGER.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md](./LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md)
- [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
- [ML-IMPLEMENTATION-CONTRACT.md](./ML-IMPLEMENTATION-CONTRACT.md)

This board is now frozen against the live expansion baseline.

No active expansion phase remains on this board.

It also remains the authoritative executed ladder for this expansion track.
Older local ladders such as `P1`-`P6` in the later 3-D plan and `M1`-`M5` in
the ML contract should be read as contract-local context and boundary maps.

### Current Expansion Shape

```text
+=================================================================================+
| Future Expansion Shape                                                          |
+=================================================================================+
| 1A ecology depth                        | a1-a6 live                             |
| 2B later 3-D                           | b1-b7 live                             |
| 3C machine learning                    | c1-c7 live                              |
+=================================================================================+
```

```text
executed promotion order

c1
|
v
a1 -> a2 -> a3
            |
            v
b1 -> b2 -> b3
            |
            v
a4 -> a5 -> a6
            |
            v
b4 -> b5 -> b6 -> b7
                  |
                  +--> rerun a6 ecology soak on the later 3-D baseline
                  |
                  v
c2 -> c3 -> c4 -> c5 -> c6 -> c7
```

### Status Key

```text
active
|- next phase to implement

parallel-safe
|- can land early without reopening the main baseline

queued
|- intentionally sequenced later in the same track

gated
`- may not start until the named dependency phases land cleanly
```

### Cross-Track Invariants

```text
always preserve
|- one owner per truth
|- frozen repair/polish/runtime baselines stay green while future phases land
|- if durable state widens, save migration and round-trip proof land in the same phase
|- ecology depth must not reintroduce the old rarity unlock ladder
|- later 3-D must not create a second world border or a full physics sandbox
|- performance budgets must be defined before hot-loop systems broaden materially
|- ML may score actions, but may not own memories, emotions, genetics, or lifecycle truth
`- player-facing shell and debug shell must stay honest about which layer is live
```

### 1A - Ecology Depth

```text
track goal
|- deepen the living garden on the current pseudo-3D baseline first
|- make zones feel distinct over long horizons, not just by labels
|- make migration, release, and habitat pressure visible in behavior
`- keep the current wild ecology contract as the ownership floor
```

#### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `a1 zone signatures + pressure state` | `live` | add explicit zone budgets for food, shelter, crowding, migration pull, and social/training valence | `zoneSystem.js`, `gameCore.js`, `lifeSimSystem.js`, `ui/gameUI.js`, `scripts/` | `run-a3-zone-identity-audit.js`, `run-w3-flower-ecology-audit.js`, `run-r4-ui-readability-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a2 flower + habitat resource loop` | `live` | turn flowers into renewable local resources with depletion, recovery, habitat quality effects, and a minimum population-health floor | `zoneSystem.js`, `gameCore.js`, `lifeSimSystem.js`, `scripts/` | `run-w3-flower-ecology-audit.js`, `run-long-soak-generational-audit.js`, `run-a3-zone-identity-audit.js`, `run-r4-ui-readability-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a3 migration + home-range personality` | `live` | give butterflies long-horizon place preference, scouting, mate-seeking, and overcrowding dispersal motives | `core/entity.js`, `systems/lifeSimSystem.js`, `core/gameCore.js`, `ui/gameUI.js`, `scripts/` | `run-a6-live-dispersal-audit.js`, `run-a3-zone-identity-audit.js`, `run-w2-wild-ecology-audit.js`, `run-r4-ui-readability-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a4 social-ecology emergence` | `live` | make roosting, warning cascades, shelter seeking, teaching pockets, and courtship territories appear as zone rhythms once `b3` shelter truth is stable | `lifeSimSystem.js`, `communicationSystem.js`, `behaviorSystem.js`, `sleepSystem.js`, `saveSystem.js` | `run-e4-social-ecology-audit.js`, `run-lifesim-expression-audit.js`, `run-r6-communication-audit.js`, `run-r4-ui-readability-audit.js`, `run-w2-wild-ecology-audit.js`, serial `run-a4-spatial-truth-audit.js`, and `run-runtime-self-audit.js` stay green |
| `a5 release + lineage ecology feedback` | `live` | make release pressure reshape future wild cohorts visibly through lineage, familiarity, zone affinity summaries, batch/cohort shell proof, and mild preferred-zone shaping without creating a dominant progression strategy | `progressionManager.js`, `statProfileSystem.js`, `lifeSimSystem.js`, `ui/gameUI.js`, `saveSystem.js` | `run-w2-wild-ecology-audit.js`, `run-genetics-mutation-audit.js`, `run-r4-ui-readability-audit.js`, `run-a6-live-dispersal-audit.js`, and `run-runtime-self-audit.js` stay green while the anti-progression check holds |
| `a6 long-soak ecology proof` | `live` | freeze ecology depth with multi-generation soak coverage, doc alignment, and debug summaries | `scripts/`, `telemetrySystem.js`, `docs/` | `run-e6-ecology-depth-audit.js --full`, `run-a6-live-dispersal-audit.js`, `run-w2-wild-ecology-audit.js`, `run-runtime-self-audit.js`, and source-book rebuild stay green |

### 2B - Later 3-D

```text
track goal
|- promote current pseudo-3D seams into more spatially honest physical truth
|- keep zone-border, structure, and render ownership boundaries clean
|- let movement, shelter, carry, shove, and contact feel physically coherent
`- stop before free-flight sandbox behavior or a second world model appears
```

#### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `b1 physics ownership consolidation` | `live` | make `physicsSystem` the single owner for dynamic contact, legalized step commits, impulses, and the focused-garden frame-budget seam | `physicsSystem.js`, `gameCore.js`, `entities/butterfly.js`, `telemetrySystem.js`, `scripts/` | `run-r1-movement-stability-audit.js`, `run-a4-spatial-truth-audit.js`, and `run-runtime-self-audit.js` stay green while the `2.5ms physics / 16ms total update` budget seam remains live |
| `b2 collision-ready structure geometry` | `live` | expose normalized opening corridors, interior volumes, wall normals, roof footprints, and occupancy columns through a stable `structureSystem` -> `physicsSystem` query seam | `structureSystem.js`, `physicsSystem.js`, `scripts/` | `run-m5-structure-audit.js`, `run-a4-spatial-truth-audit.js`, and `run-r1-movement-stability-audit.js` stay green while the geometry packet and physics query seam remain live |
| `b3 occupancy bands + body-fit traversal` | `live` | lock discrete height bands, shared spatial hook ownership, opening traversal, shelter entry/exit, and trapped/body-fit outcomes | `physicsSystem.js`, `structureSystem.js`, `butterfly.js`, `lifeSimSystem.js` | `run-a4-spatial-truth-audit.js`, `run-r2-zone-transition-audit.js`, `run-m5-structure-audit.js`, `run-r1-movement-stability-audit.js`, and `run-ml-phase-m1-audit.js` stay green |
| `b4 carry + stack physicalization` | `live` | route carried-object attachment, stack stability, and legal placement through occupancy truth without reintroducing flower carry | `physicsSystem.js`, `objectSystem.js`, `block.js`, `structureSystem.js` | `run-b4-carry-stack-physics-audit.js`, `run-r7-block-visual-audit.js`, `run-m5-structure-audit.js`, `run-r1-movement-stability-audit.js`, and `run-a4-spatial-truth-audit.js` stay green |
| `b5 impact + shove integration` | `live` | unify training and garden contact impulses while keeping battle truth inside `battleSystem` | `physicsSystem.js`, `teachingSystem.js`, `battleSystem.js`, `statusSystem.js` | extend `run-p5-training-physics-audit.js`, `run-r5-battle-presentation-audit.js`, and `run-runtime-self-audit.js` |
| `b6 visual + debug spatial shell` | `live` | make occupancy bands, shelter state, contacts, and carry anchors legible in render/debug shells | `renderManager.js`, `ui/debugUI.js`, `ui/gameUI.js` | extend `run-r7-block-visual-audit.js` and `run-r4-ui-readability-audit.js` |
| `b7 spatial soak + save/load freeze` | `live` | prove long-run stability, rebuild dynamic caches after load, freeze the later 3-D baseline, and re-check ecology on the new spatial truth | `saveSystem.js`, `physicsSystem.js`, `scripts/`, `docs/` | `run-b7-spatial-soak-audit.js`, `run-a4-spatial-truth-audit.js`, `run-e6-ecology-depth-audit.js` / long soak, and `run-runtime-self-audit.js` all stay green on the frozen spatial baseline |

### 3C - Machine Learning

```text
track goal
|- replace selected choice scoring with a model-backed layer
|- keep the butterfly mind inspectable, fallback-safe, local, and deterministic
|- consume stable ecology and spatial features rather than guessing through gaps
`- stop before online learning, server inference, or multiplayer determinism work
```

#### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `c1 runtime lock + offline training contract` | `live` | lock runtime choice, artifact format, inference cadence, trace schema, hook ownership, and no-online-dependency rules before `b3` / `c3` broaden consumers | `mlInferenceSystem.js`, `docs/`, `scripts/` | extend `run-ml-phase-m1-audit.js` and `run-ml-phase-m2-audit.js` |
| `c2 heuristic trace capture + scenario corpus` | `live` | export reproducible garden/battle traces and corrected labels from audit scenarios | `telemetrySystem.js`, `mlInferenceSystem.js`, `scripts/` | `build-c2-trace-corpus.js`, `run-ml-phase-m1-audit.js`, and `run-deep-systems-audit.js` now prove the corpus manifest, scenario coverage, and rebuild check on the live baseline |
| `c3 feature builder v1` | `live` | freeze deterministic feature encodings, lock the `b3` / `b7` spatial split, and expose a compact inspect trace for the live feature contract | `mlInferenceSystem.js`, `lifeSimSystem.js`, `statProfileSystem.js`, `progressionManager.js`, `physicsSystem.js`, `saveSystem.js` | `run-ml-phase-m3-audit.js` now proves `14 groups / 94 flat / 116 vec`, readable `Schema` / `Feat` / `Space` rows, deterministic rebuilds, and save/fallback continuity while `run-runtime-self-audit.js` keeps the post-load ML feature step green |
| `c4 model artifact + evaluation harness` | `live` | version a compact local `m4` bundle, lock artifact metadata compatibility, and compare it against curated heuristic baselines before rollout | `assets/ml/`, `mlInferenceSystem.js`, `scripts/` | `run-ml-phase-m4-audit.js` now proves artifact metadata compatibility, corpus coverage, runtime trace alignment, and a reviewed `actionFamily` improvement over the heuristic baseline |
| `c5 runtime inference rollout` | `live` | integrate model-backed action, target, signal, risk, and battle-posture scoring behind safe arbitration and fallback while staying within the frame budget | `mlInferenceSystem.js`, `behaviorSystem.js`, `communicationSystem.js`, `battleSystem.js` | `run-ml-closure-audit.js`, `run-r6-communication-audit.js`, `run-single-player-autobattle-audit.js`, and the frame-budget proof now stay green on the live model-backed path |
| `c6 explainability + inspect/debug shell` | `live` | expose confidence, alternatives, model version, source path, and feature highlights without hiding owner truth | `ui/gameUI.js`, `ui/debugUI.js`, `mlInferenceSystem.js` | `run-ml-closure-audit.js` and `run-r4-ui-readability-audit.js` now prove `Path` / `Why` rows and the shared debug explainability shell |
| `c7 soak + regression freeze` | `live` | prove save/load continuity, fallback resilience, performance budget, and long-soak stability before freezing the ML baseline | `saveSystem.js`, `telemetrySystem.js`, `scripts/`, `docs/` | `run-ml-closure-audit.js`, `run-long-soak-generational-audit.js`, `run-runtime-self-audit.js`, and `run-final-grand-plan-audit.js` now stay green on the frozen ML baseline |

### Frozen State

```text
no active expansion phase
|- a1-a6 ecology depth live
|- b1-b7 later 3-D live
|- c1-c7 machine learning live
`- open a fresh board only for work beyond the current expanded baseline
```

Closure note:

- `c4` is now live with a versioned `m4-garden-policy-v1` artifact, explicit artifact metadata compatibility, and a corpus-backed evaluation harness
- `c5` now keeps garden, communication, ecology, and autobattle on the live model-backed arbitration path while staying within the focused-garden budget seam
- `c6` now exposes truthful explainability through Inspect/debug `Path` / `Why` and shared trace summaries instead of decorative shell copy
- `c7` now closes with long-soak, runtime-self, ML closure, and final grand-plan proof all green on the frozen expansion baseline

## Remaining Implementation Roadmap

_Source: `docs/REMAINING-IMPLEMENTATION-ROADMAP.md`_

### Purpose

This roadmap now records the completed expansion path for the intentionally-later
parts of Papilionem.

It does not reopen the frozen repair, polish, or `I1`-`I5` closure work.
It now answers:

```text
what is left
what order it should land in
which owners should carry each layer
which proofs must pass before the next layer begins
```

### Planning Shape

```text
frozen current baseline
|- repaired runtime
|- polished player shell
|- frozen implementation board
`- source docs aligned
        |
        v
remaining implementation roadmap
|- 1A ecology depth
|- 2B later 3-D
`- 3C machine learning
```

```text
recommended program order

1. early ML contract lock
   c1

2. ecology foundation first
   a1 -> a2 -> a3

3. spatial foundation second
   b1 -> b2 -> b3

4. ecology expression second pass
   a4 -> a5 -> a6

5. later 3-D completion
   b4 -> b5 -> b6 -> b7

6. model-backed decision layer last
   c2 -> c3 -> c4 -> c5 -> c6 -> c7
```

```text
current program status
|- 1A ecology depth
|  `- a1-a6 live
|- 2B later 3-D
|  `- b1-b7 live
`- 3C machine learning
   `- c1-c7 live
```

Why this order:

- `c1` is contract/spec work and should land before `b3` or `c3` reserve new hooks
- ecology depth raises game-feel fastest on the current stable shell
- later 3-D should consume clearer long-horizon motives, not invent them
- ML should consume stable ecology and spatial truth instead of masking gaps in either

### Sequencing Authority

```text
authoritative future ladder
`- ACTIVE-EXPANSION-BOARD.md

older local ladders
|- P1-P6 in the later 3-D plan
`- M1-M5 in the ML contract
```

Use the expansion board as the future execution source of truth.

Read the older local ladders as:

- contract-local breakdowns
- shipped closure context
- mapping references for existing docs and audits

not as competing expansion boards.

### Ownership Map

```text
owner map
├─ ecology truth
│  ├─ zoneSystem / gameCore
│  │  └─ durable zone pressure state, live budget updates, travel scoring context
│  ├─ lifeSimSystem / behaviorSystem
│  │  └─ motives, affinities, migration urges, social ecology
│  ├─ progressionManager / statProfileSystem
│  │  └─ release pressure, lineage value, wild baseline feedback
│  └─ UI
│     └─ presentation only
├─ later 3-D truth
│  ├─ gameCore / zoneSystem
│  │  └─ legal bounds, travel anchors, border clamps
│  ├─ structureSystem
│  │  └─ static geometry, openings, interior/roof/body-fit truth
│  ├─ physicsSystem
│  │  └─ dynamic contacts, impulses, final resolved positions
│  └─ renderManager
│     └─ visuals only
└─ ML truth
   ├─ lifeSimSystem
   │  └─ canonical cognition state
   ├─ statProfileSystem / progressionManager / battleSystem
   │  └─ feature-owner state for genetics, ecology, and battle context
   ├─ mlInferenceSystem
   │  └─ feature building, model execution, arbitration traces
   └─ UI/debug
      └─ explanation only
```

### Cross-Track Invariants

```text
must stay true
|- one owner per truth
|- no return to the old rarity unlock ladder or pool-era mechanics
|- no second world border outside the current visible zone bounds
|- no freeform rigid-body sandbox as a side effect of later 3-D work
|- no ML ownership of memories, emotions, genetics, lineage, or lifecycle truth
|- save/load only persists durable state and rebuilds cheap caches
`- player-facing shell and debug shell must agree about what is really happening
```

### Recurring Obligations

```text
whenever durable state widens
|- update save migration in saveSystem
`- add or widen round-trip proof in the same phase
```

```text
whenever a hot loop broadens materially
|- define the new performance budget first
`- prove it before the phase closes
```

### 1A - Ecology Depth

```text
track intent
|- deepen the living-garden loop inside the current pseudo-3D baseline
|- make zones differ by long-horizon pressures, not just flavor labels
|- make release and lineage feedback visible in future wild behavior
`- preserve the wild-ecology contract as the canonical floor
```

#### a1 - Zone Signatures + Pressure State

Status:
- `live` on the current expansion board

```text
goal
|- create explicit zone ecology containers
|- track food richness, shelter capacity, crowding tolerance, migration pull,
|  social/training valence, and recovery pressure
`- expose those pressures to life-sim and debug summaries
```

Owners:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

Implementation notes:
- zone identity now lives as durable zone-pressure state in `zoneSystem.js`
- `gameCore.js` is the live writer for pressure refresh and travel scoring consumption
- `lifeSimSystem.js` consumes the zone summary directly into motives and inspectable summaries
- pressures should be durable enough to shape behavior over time, but cheap local
  summaries should still rebuild
- foundation save/load stays green through widened `zoneSystem` durable state
- this phase only widens the player shell through compact inspectable summary lines

Proof gate:
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- each zone produces a stable and distinct ecological signature that later
  behavior systems can consume directly

#### a2 - Flower + Habitat Resource Loop

Status:
- `live` on the current expansion board

```text
goal
|- turn flowers into renewable local resources instead of flat static supply
|- add depletion, regrowth, habitat-quality consequences, and a minimum
|  population-health floor
`- let feeding pressure respond to ecology rather than constant abundance
```

Owners:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-long-soak-generational-audit.js`

Implementation notes:
- resource loops should stay graceful under long soak and must not starve the
  garden into deadlock
- define the recovery floor before behavior wiring so a depleted garden cannot
  collapse into a non-recovering state
- habitat quality should affect future bloom recovery and zone attractiveness
- the durable resource/habitat fields now ride inside the widened `zoneSystem.js`
  ecology state rather than adding a separate save-owned container
- `gameCore.js` owns reserve spend, emergency floor recovery, spawn targets, and
  flower-consumption bookkeeping so supply stays coupled to live zone demand
- `lifeSimSystem.js` only consumes the habitat/resource summary and does not
  become a second flower-ecology owner
- keep current flower visual direction; this is ecology depth, not a flower-art rewrite

Proof gate:
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-long-soak-generational-audit.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- feeding, crowding, and regrowth create readable local booms and recovery cycles

#### a3 - Migration + Home-Range Personality

```text
goal
|- give butterflies long-horizon place preference
|- add scouting, mate-seeking, overcrowding escape, and return-home behavior
`- make cross-zone movement read as motive-driven rather than churn
```

Status:
- `live`

Owners:
- `core/entity.js`
- `systems/lifeSimSystem.js`
- `core/gameCore.js`
- `ui/gameUI.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-a3-zone-identity-audit.js`

Implementation notes:
- use zone affinity, novelty, caution, and social motive as a combined travel driver
- keep zone travel ownership in `gameCore`
- let the ecology layer choose why to move; let existing travel systems choose how
- make home-range state durable in `lifeSim` and keep inspect copy display-only
- keep save/load proof on the existing life-sim foundation path by rebuilding
  migration summaries with zero-delta refreshes instead of mutating durable state

Proof gate:
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w2-wild-ecology-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- migration produces recognizable home ranges, scouting arcs, and repopulation behavior

#### a4 - Social-Ecology Emergence

```text
goal
|- make ecology visible through group behavior
|- add roosting pockets, warning cascades, shelter seeking, teaching pockets,
|  and courtship territories
`- let zones feel socially alive even when the player is only observing
```

Status:
- `live`

Owners:
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/behaviorSystem.js`
- `systems/sleepSystem.js`
- `systems/zoneSystem.js`
- `systems/saveSystem.js`

Implementation notes:
- this phase should distort shared systems rather than invent ecology-only one-off logic
- confirm `b3` shelter/occupancy truth is stable before building roosting or
  shelter-seeking behavior on top of it
- shelter, sleep, and warning behavior should reuse the same cognition families
- visible emergence must be mirrored in Inspect/debug truth

Proof gate:
- `scripts/run-e4-social-ecology-audit.js`
- `scripts/run-lifesim-expression-audit.js`
- `scripts/run-r6-communication-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-w2-wild-ecology-audit.js`
- serial `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-runtime-self-audit.js`

Exit condition:
- a player can watch a zone long enough to recognize its repeating social/ecological rhythm

#### a5 - Release + Lineage Ecology Feedback

```text
goal
|- make selective release visibly reshape future wild cohorts
|- surface lineage familiarity, zone affinity, and release value in future ecology
`- connect genetics, ecology, and journal truth without duplicating ownership
```

Status:
- `live`

Owners:
- `core/progressionManager.js`
- `systems/statProfileSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`
- `systems/saveSystem.js`

Implementation notes:
- released-stat uplift should stay averaged, clamped, and blended as the contract says
- visibility matters here: the player should be able to read what their releases changed
- current runtime stores cohort summaries with top lineages, top zones, modifier highlights,
  and a blend guard for each completed 10-release wave
- release-wave wilds may receive a mild preferred-zone bias and familiarity context from the
  latest qualifying cohort, but the shaping stays descriptive rather than progression-like
- do not turn release into a new unlock ladder or rarity gate
- if focused release of one line becomes a dominant strategy, the blending/clamp
  parameters are wrong and the phase is not ready to close

Proof gate:
- `scripts/run-w2-wild-ecology-audit.js`
- `scripts/run-genetics-mutation-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-runtime-self-audit.js`
- prove the anti-progression invariant in the wild-ecology proof stack

Exit condition:
- future wild populations visibly reflect the direction of release choices

#### a6 - Long-Soak Ecology Proof

```text
goal
|- prove that deepened ecology stays healthy across generations
|- freeze the new ecology layer in docs, audits, and debug surfaces
`- catch degenerate loops before later 3-D or ML build on them
```

Status:
- `live`

Owners:
- `scripts/`
- `systems/telemetrySystem.js`
- `docs/`

Implementation notes:
- this is the ecology closure gate, and it now closes with a telemetry-backed
  soak layer instead of relying on shorter feature audits alone
- `scripts/run-long-soak-generational-audit.js` now seeds real scout and
  return-home travel, records ecology telemetry summaries, and reports overlap
  sightings separately from truly critical anomalies
- `scripts/run-e6-ecology-depth-audit.js` now judges zone identity, migration
  health, resource recovery, and release feedback across the soak artifact set
- do not advance to broad later 3-D completion or ML rollout if this phase is noisy

Proof gate:
- `scripts/run-e6-ecology-depth-audit.js --full`
- `scripts/run-long-soak-generational-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-w2-wild-ecology-audit.js`
- `scripts/run-runtime-self-audit.js`
- rebuild the source book after doc updates

Exit condition:
- multi-generation runs keep zone identity, migration health, resource recovery,
  and release feedback stable and readable while the targeted ecology regressions
  stay green

### 2B - Later 3-D

```text
track intent
|- promote pseudo-3D seams into more honest spatial truth
|- keep legal borders, structure truth, dynamic motion, and rendering separated
|- make contact, shelter, carry, and shove feel real in Papilionem's style
`- stop short of free-flight sandbox rules
```

#### b1 - Physics Ownership Consolidation

```text
goal
|- make `physicsSystem` the single owner of dynamic contact, impulse, and
|  final resolved movement
`- reduce entity-side teleport-style conflict paths
```

Status:
- `live`

Owners:
- `systems/physicsSystem.js`
- `core/gameCore.js`
- `entities/butterfly.js`
- `systems/telemetrySystem.js`
- `scripts/run-r1-movement-stability-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`

Implementation notes:
- entities now keep motion intent and candidate steps, not final collision truth
- reuse current roam clamps and zone-border order from the later 3-D plan
- `physicsSystem` now legalizes and commits the final focused-garden step
- the baseline frame budget now lives as a real seam:
  `2.5ms physics / 16ms total update` in focused-garden play
- telemetry now records `physicsMs` separately so later 3-D phases can prove,
  not just claim, budget safety

Proof gate:
- `scripts/run-r1-movement-stability-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-runtime-self-audit.js`

Closure proof:
- `r1` now proves `motionOwner = physicsSystem`, synchronized entity/physics positions,
  and a live frame-budget seam
- `a4` now proves physics ownership is exposed through the spatial truth path and that
  the focused-garden budget seam is live

Exit condition:
- the project has one coherent per-frame motion-resolution path

#### b2 - Collision-Ready Structure Geometry

Status:
- `live`

```text
goal
|- expose structure geometry in a physics-friendly form
|- define opening corridors, interior volumes, roof footprints, wall normals,
|  and occupancy columns
`- stop relying on scattered point tests as the final seam
```

Owners:
- `systems/structureSystem.js`
- `systems/physicsSystem.js`

Implementation notes:
- static truth stays in `structureSystem`
- dynamic contact stays in `physicsSystem`
- normalized collision packets now live per-zone / per-component inside `structureSystem`
- `physicsSystem` now exposes a dedicated structure-query seam instead of reaching into shelter internals ad hoc
- `run-m5-structure-audit.js` now proves the shelter packet and the physics query seam together
- `run-a4-spatial-truth-audit.js` now proves the geometry packet is visible on the live focused-garden baseline
- this phase should make later shelter/carry/stack work cheaper and safer

Proof gate:
- `scripts/run-m5-structure-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`
- `scripts/run-r1-movement-stability-audit.js`

Exit condition:
- physics can query a stable geometry seam instead of inferring structure ad hoc

#### b3 - Occupancy Bands + Body-Fit Traversal

Status:
- live

```text
goal
|- lock discrete height bands and occupancy semantics
|- make entry, sheltering, narrow-pass failure, and trapped states spatially honest
`- reserve only the shared spatial hooks that `c1` has already locked
```

Owners:
- `systems/physicsSystem.js`
- `systems/structureSystem.js`
- `entities/butterfly.js`
- `systems/lifeSimSystem.js`
- `core/gameCore.js`

Implementation notes:
- use the `verticality`, `structureRole`, `pathState`, and `bodyFit` hooks already reserved
- lock those shared enums at the owner seam so later consumers import them
  instead of inventing their own copies
- this phase is the main bridge between spatial truth and cognition truth
- do not create a second travel model outside current zone bounds

Proof gate:
- extend `scripts/run-a4-spatial-truth-audit.js`
- extend `scripts/run-r2-zone-transition-audit.js`
- capture debug screenshot proof for blocked, enterable, and sheltered states
- keep the shared-hook ownership rule documented and consistent with `c1`

Exit condition:
- openings, interiors, roofs, and body-fit checks read consistently in play and debug views

Closed state:
- `structureSystem.js` owns the shared spatial semantics packet, including `verticality`, `structureRole`, `pathState`, `bodyFit`, and discrete `occupancyBand` values
- `physicsSystem.js`, `entity.js`, and `mlInferenceSystem.js` now consume those shared domains instead of carrying private copies
- `run-a4-spatial-truth-audit.js`, `run-r2-zone-transition-audit.js`, `run-m5-structure-audit.js`, and `run-r1-movement-stability-audit.js` prove opening/interior traversal, shelter targeting, carry/body-fit truth, and owner-seam stability

#### b4 - Carry + Stack Physicalization

Status:
- live

```text
goal
|- route carry and stack behavior through occupancy truth
|- make attachment motion, placement, and stack stability physically coherent
`- keep the current no-flower-carry boundary intact unless explicitly reapproved later
```

Owners:
- `systems/physicsSystem.js`
- `systems/objectSystem.js`
- `entities/block.js`
- `systems/structureSystem.js`

Implementation notes:
- current carryable-object truth should stay narrow and explicit
- avoid physics chaos; placement still needs to feel hand-authored and readable

Proof gate:
- add `scripts/run-b4-carry-stack-physics-audit.js`
- extend `scripts/run-r7-block-visual-audit.js`
- keep `scripts/run-a4-spatial-truth-audit.js` green

Exit condition:
- carried and stacked objects feel physically honest without becoming sandbox noise

Closed state:
- `physicsSystem.js` now owns normalized carry anchors, legal placement resolution, and unsupported-stack settling instead of butterflies placing blocks ad hoc
- `structureSystem.js` now validates stacked placement against support-column truth, max stack height, doorway conflict, and support alignment
- `objectSystem.js` and `block.js` now surface carried / stacked / grounded occupancy states so audits can verify the same truth the runtime uses
- `run-b4-carry-stack-physics-audit.js`, `run-r7-block-visual-audit.js`, `run-m5-structure-audit.js`, `run-r1-movement-stability-audit.js`, and `run-a4-spatial-truth-audit.js` prove the live carry/stack seam

#### b5 - Impact + Shove Integration

Status:
- live

```text
goal
|- make training and garden impacts use real impulse requests
|- preserve the rule that battle owns battle truth
`- use physics as a spatial cue layer, not a battle-rules replacement
```

Owners:
- `systems/physicsSystem.js`
- `systems/teachingSystem.js`
- `systems/battleSystem.js`
- `systems/statusSystem.js`

Implementation notes:
- training and garden interactions may request shove/impulse through `physicsSystem`
- `battleSystem` still owns combat outcomes and result commits
- keep the top-down battle shell distinct from the angled garden world

Proof gate:
- extend `scripts/run-p5-training-physics-audit.js`
- extend `scripts/run-r5-battle-presentation-audit.js`
- keep `scripts/run-single-player-autobattle-audit.js` green

Exit condition:
- impacts look spatially honest while combat ownership remains stable

Closed state:
- `teachingSystem.js` already routes garden recoil through `physicsSystem.applyImpulse(...)`, so no second garden-displacement owner had to be added for this phase
- `battleSystem.js` still owns battle outcomes, result commits, and participant state while `renderManager.js` only consumes battle presentation data
- `run-p5-training-physics-audit.js`, `run-r5-battle-presentation-audit.js`, `run-single-player-autobattle-audit.js`, and `run-runtime-self-audit.js` all stay green on the live owner split

#### b6 - Visual + Debug Spatial Shell

Status:
- live

```text
goal
|- make spatial truth legible
|- expose occupancy bands, shelter state, contacts, and carry anchors in render
|  and debug shells
`- avoid logic-correct but visually misleading spatial states
```

Owners:
- `core/renderManager.js`
- `ui/debugUI.js`
- `ui/gameUI.js`
- `systems/physicsSystem.js`
- `systems/structureSystem.js`

Implementation notes:
- player shell should read spatial truth quickly without becoming debug clutter
- debug overlays should clearly separate static structure from dynamic contacts

Proof gate:
- extend `scripts/run-r7-block-visual-audit.js`
- extend `scripts/run-r4-ui-readability-audit.js`

Exit condition:
- player-facing and debug-truth views agree about space and contact state

Closed state:
- `physicsSystem.js` now exposes one shared spatial summary seam so render, inspect, and debug surfaces read the same occupancy/contact/carry truth
- `renderManager.js` now draws focus-shell cards plus carried/stacked block badges, `ui/debugUI.js` now surfaces a compact spatial-focus panel, and `ui/gameUI.js` now folds the same truth into Inspect
- `run-r7-block-visual-audit.js` and `run-r4-ui-readability-audit.js` now assert the live shell summaries directly instead of relying only on screenshots

#### b7 - Spatial Soak + Save/Load Freeze

```text
goal
|- prove long-run stability of the later 3-D layer
|- rebuild dynamic caches after load instead of persisting transient state
`- freeze the new spatial baseline before ML depends on it
```

Owners:
- `systems/saveSystem.js`
- `systems/physicsSystem.js`
- `scripts/`
- `docs/`

Implementation notes:
- do not persist velocity, contact caches, or transient push vectors
- use save/load and soak evidence as the freeze gate

Proof gate:
- add `scripts/run-b7-spatial-soak-audit.js`
- extend `scripts/run-a4-spatial-truth-audit.js`
- extend `scripts/run-runtime-self-audit.js`
- rerun `scripts/run-e6-ecology-depth-audit.js` and long-soak ecology proof on
  the later 3-D baseline

Exit condition:
- later 3-D becomes stable enough to serve as a long-term feature source for ML

Closed state:
- `systems/saveSystem.js` now persists durable carry / placement truth while rebuilding transient spatial caches after load instead of serializing them directly
- `scripts/run-b7-spatial-soak-audit.js` now proves payload hygiene, post-load carry/stack continuity, and short spatial-soak stability on the frozen later 3-D baseline
- `scripts/run-a4-spatial-truth-audit.js`, `scripts/run-runtime-self-audit.js`, and the full `scripts/run-e6-ecology-depth-audit.js` rerun now confirm later 3-D closure did not regress ecology or post-load spatial truth

### 3C - Machine Learning

```text
track intent
|- move from heuristic-only choice scoring to model-backed scoring
|- keep the system local, offline-capable, fallback-safe, and inspectable
|- consume stable ecology and spatial feature sources instead of guessing
|- treat `c1` as a parallel-safe contract lock
`- stop before online learning, server inference, or multiplayer determinism work
```

Current expansion state:
- `c1 - c7` are live and frozen on the expansion board

#### c1 - Runtime Lock + Offline Training Contract

```text
goal
|- close the remaining contract ambiguity around runtime choice, artifact format,
|  inference cadence, trace schema, and fallback rules
`- make `b3` and `c3` implementable without drift
```

Owners:
- `systems/mlInferenceSystem.js`
- `docs/`
- `scripts/`

Implementation notes:
- recommended path remains local browser inference with ONNX Runtime Web
- keep heuristic fallback always available
- no online dependency should enter the main runtime
- land this before `b3` finalizes shared spatial hooks or `c3` finalizes feature groups

Proof gate:
- extend `scripts/run-ml-phase-m1-audit.js`
- extend `scripts/run-ml-phase-m2-audit.js`
- update the source contracts before code rollout

Exit condition:
- runtime, artifact, and fallback questions are concrete enough to implement safely

#### c2 - Heuristic Trace Capture + Scenario Corpus

```text
goal
|- export reproducible action traces from the current sim and audits
|- build a curated scenario corpus with corrected labels where the heuristic is wrong
`- create the training and regression substrate before model rollout
```

Owners:
- `systems/telemetrySystem.js`
- `systems/mlInferenceSystem.js`
- `scripts/`

Implementation notes:
- traces should include garden, communication, ecology, and autobattle cases
- corpus should be reproducible from repo state and audit presets
- keep raw data outside save truth; this is tooling, not sim state

Proof gate:
- extend `scripts/run-ml-phase-m1-audit.js`
- extend `scripts/run-deep-systems-audit.js`

Exit condition:
- training input can be regenerated and audited instead of hand-waved

Closed state:
- `systems/mlInferenceSystem.js` now exports corpus-ready garden and battle trace records with active-trace, heuristic-baseline, reviewed-label, and feature-snapshot seams
- `systems/telemetrySystem.js` now records ML corpus sample summaries so the corpus layer has its own profile and manifest inputs without entering save truth
- `scripts/build-c2-trace-corpus.js`, `scripts/run-ml-phase-m1-audit.js`, and `scripts/run-deep-systems-audit.js` now prove four-family scenario coverage, reviewed labels, and a manifest rebuild check from persisted corpus records

#### c3 - Feature Builder V1

```text
goal
|- build deterministic feature vectors from canonical owners
|- include cognition, ecology, progression, autobattle, and 3-D-ready space fields
`- keep the feature builder cheap to recompute and safe to debug
```

Owners:
- `systems/mlInferenceSystem.js`
- `systems/lifeSimSystem.js`
- `systems/statProfileSystem.js`
- `core/progressionManager.js`
- `systems/physicsSystem.js`
- `systems/battleSystem.js`
- `systems/saveSystem.js`

Implementation notes:
- persist version ids and short trace summaries, not raw vectors
- missing values must encode explicitly, never as `NaN`
- stable enum ids matter here because future artifacts depend on them
- split spatial inputs into fields that are stable after `b3` and fields that
  are only valid after the `b7` freeze, rather than pretending the whole later
  3-D stack is already final

Proof gate:
- extend `scripts/run-ml-phase-m3-audit.js`
- extend `scripts/run-runtime-self-audit.js`
- keep save round-trip proof green for model version / trace-summary state

Exit condition:
- feature vectors are deterministic, rebuildable, and aligned with owner boundaries

Closed state:
- `systems/mlInferenceSystem.js` now freezes ordered drive/emotion/memory/progression encodings instead of leaning on object iteration order, and the live feature contract is now exact at `14 groups / 94 flat / 116 vec`
- the spatial feature family now names the `b3` stable hooks separately from the `b7` stable occupancy/shelter fields, and `ui/gameUI.js` now surfaces that split through compact `Schema` / `Feat` / `Space` inspect rows
- `scripts/run-ml-phase-m3-audit.js` and `scripts/run-runtime-self-audit.js` now prove deterministic rebuilds, readable trace surfacing, and post-load / fallback continuity for that feature contract

#### c4 - Model Artifact + Evaluation Harness

```text
goal
|- train and version a compact local model bundle
|- compare it against curated heuristic baselines before live rollout
`- move from "we could infer" to "we have a measurable artifact"
```

Owners:
- `assets/ml/`
- `systems/mlInferenceSystem.js`
- `scripts/`

Implementation notes:
- start with small policy bundles, not one opaque mega-model
- artifact evaluation should include garden, communication, ecology, and battle cases
- keep the current JSON-policy bridge available as a fallback during transition

Proof gate:
- extend `scripts/run-ml-phase-m4-audit.js`
- add artifact version and threshold checks

Exit condition:
- there is a reproducible local artifact that meets clear evaluation gates

Closed state:
- `assets/ml/m4-garden-policy.json` is now a versioned local artifact with explicit `artifactFormat`, feature/trace schema versions, and contract version metadata
- `systems/mlInferenceSystem.js` now validates artifact metadata compatibility and reports a compact artifact summary through `getRuntimeSummary()`
- `scripts/run-ml-phase-m4-audit.js` now rebuilds the `c2` corpus, writes `artifact-evaluation.json`, proves runtime trace alignment, and confirms the reviewed teaching `actionFamily` correction beats the heuristic baseline without regressing ecology or autobattle

#### c5 - Runtime Inference Rollout

```text
goal
|- let the model influence action, target, signal, risk, and battle-posture scoring
|- preserve heuristic fallback and existing owner systems
`- keep arbitration deterministic, reversible, and within the frame budget
```

Owners:
- `systems/mlInferenceSystem.js`
- `systems/behaviorSystem.js`
- `systems/communicationSystem.js`
- `systems/battleSystem.js`

Implementation notes:
- rollout should be staged and measurable
- behavior systems still execute actions; the model only scores preferences
- regressions in communication or autobattle should block advancement immediately
- treat performance budget proof as a close gate, not a cleanup task for `c7`

Proof gate:
- extend `scripts/run-ml-closure-audit.js`
- extend `scripts/run-r6-communication-audit.js`
- extend `scripts/run-single-player-autobattle-audit.js`
- prove the inference path stays within the agreed frame budget under garden and battle load

Exit condition:
- live behavior is model-influenced where allowed and still safe when the model is unavailable

Closed state:
- `systems/mlInferenceSystem.js` now keeps garden and battle policy scoring on the live model-backed path, records runtime budget samples, and exposes focused-garden / battle budget targets through one owner seam
- `scripts/run-ml-closure-audit.js`, `scripts/run-r6-communication-audit.js`, and `scripts/run-single-player-autobattle-audit.js` now prove live model-backed arbitration, truthful fallback boundaries, and the focused-garden / battle budget envelope
- the final grand-plan audit now consumes the live `16ms total update` budget seam during short-soak proof instead of a stale pre-expansion threshold

#### c6 - Explainability + Inspect/Debug Shell

```text
goal
|- answer "why did this butterfly do that?" from the live shell
|- expose confidence, rejected alternatives, model version, source path,
|  and meaningful feature highlights
`- keep explanations truthful rather than decorative
```

Owners:
- `ui/gameUI.js`
- `ui/debugUI.js`
- `systems/mlInferenceSystem.js`

Implementation notes:
- player-facing copy should stay concise
- debug shell should show enough detail to audit the model-vs-heuristic boundary

Proof gate:
- extend `scripts/run-ml-closure-audit.js`
- extend `scripts/run-r4-ui-readability-audit.js`

Exit condition:
- model-backed choices are inspectable without guesswork

Closed state:
- `systems/mlInferenceSystem.js` now turns live linear-policy traces into short explainability summaries for action, target, signal, risk, and battle posture without inventing shell-only truth
- `ui/gameUI.js` now exposes compact `Path` and `Why` rows, and `ui/debugUI.js` now renders the shared ML explainability snapshot with artifact path, confidence, alternatives, feature drivers, and budget lines
- `scripts/run-ml-closure-audit.js` and `scripts/run-r4-ui-readability-audit.js` now prove those explainability surfaces directly

#### c7 - Soak + Regression Freeze

```text
goal
|- prove save/load continuity, fallback resilience, and long-run behavioral stability
|- freeze the ML layer only after performance and regressions are understood
`- keep later multiplayer determinism as a separate future problem
```

Owners:
- `systems/saveSystem.js`
- `systems/telemetrySystem.js`
- `scripts/`
- `docs/`

Implementation notes:
- this is the ML closure gate
- no online/shared determinism claims should sneak in here

Proof gate:
- extend `scripts/run-ml-closure-audit.js`
- extend `scripts/run-long-soak-generational-audit.js`
- extend `scripts/run-runtime-self-audit.js`

Exit condition:
- the model-backed layer becomes a stable, documented, fallback-safe baseline

Closed state:
- `scripts/run-runtime-self-audit.js` now proves the post-load ML explainability shell, budget targets, and debug snapshot against the frozen runtime
- `scripts/run-long-soak-generational-audit.js` now proves the live model-backed path stays active through long-soak checkpoints without falling back silently
- `scripts/run-final-grand-plan-audit.js` now closes the whole expansion program with a green end-to-end pass on the frozen ML baseline

### Program-Level Definition Of Done

```text
done means
|- the garden develops richer ecology over long horizons
|- space feels more physically honest without becoming a sandbox
|- butterflies make some decisions through a real model-backed layer
|- Inspect/debug can still explain why behavior happened
|- save/load and long-soak audits stay green
`- source docs, audits, and runtime truth all agree again
```

## Expansion Execution Playbook

_Source: `docs/EXPANSION-EXECUTION-PLAYBOOK.md`_

### Purpose

This document now preserves how the Papilionem expansion work was executed in
practice and how its phases were closed.

It is the build-method companion to:

- [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md)
- [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md)

Use it to answer:

```text
how each phase should be built
how work should be sequenced safely
what to audit before promotion
what artifacts should exist when a phase closes
```

It is now a frozen execution record for the completed expansion track.

```text
current execution snapshot
|- ecology depth
|  `- a1-a6 live
|- later 3-D
|  `- b1-b7 live
`- machine learning
   `- c1-c7 live
```

### Program Execution Shape

```text
frozen baseline
   |
   v
c1 runtime + training contract lock
   |
   v
ecology foundation
|- a1 zone signatures + pressure state
|- a2 flower + habitat resource loop
`- a3 migration + home-range personality
   |
   v
spatial foundation
|- b1 physics ownership consolidation
|- b2 collision-ready structure geometry
`- b3 occupancy bands + body-fit traversal
   |
   +--> ecology second pass
   |    |- a4 social-ecology emergence
   |    |- a5 release + lineage ecology feedback
   |    `- a6 long-soak ecology proof
   |
   v
later 3-D completion
|- b4 carry + stack physicalization
|- b5 impact + shove integration
|- b6 visual + debug spatial shell
`- b7 spatial soak + save/load freeze
   |
   +--> rerun ecology soak on the later 3-D baseline
   |
   v
ML rollout
|- c2 heuristic trace capture + scenario corpus
|- c3 feature builder v1
|- c4 model artifact + evaluation harness
|- c5 runtime inference rollout
|- c6 explainability + inspect/debug shell
`- c7 soak + regression freeze
```

### Execution Doctrine

```text
every phase follows the same loop

1. lock owner boundaries
2. add durable state containers
2b. if durable state widened: update save migration and round-trip proof
3. add owner APIs and derived summaries
4. connect behavior to the new truth
5. expose player/debug proof if the state is visible
6. widen or add audits
7. run regression stack
8. update docs and rebuild the source book
9. freeze the phase only if the full gate is clean
```

#### Workstream Rules

```text
always do
|- keep one owner per truth
|- prefer additive seams over destructive rewrites
|- keep save/load migration explicit whenever durable state widens
|- define performance budgets before hot-loop work broadens materially
|- land debug-truth surfaces before relying on observation alone
|- widen audits in the same phase that widens behavior
`- document the exit gate before coding the phase
```

```text
never do
|- hide new behavior behind prose-only claims
|- let UI invent truth that belongs to owner systems
|- let later 3-D create a second border model
|- let ML become the source of truth for cognition or genetics
`- promote a downstream phase while its upstream proof is noisy
```

### Branching And Change Shape

```text
phase branch shape

phase start
|- owner systems
|- audit scripts
|- docs
`- optional UI/debug shell

phase close
|- runtime green
|- target audits green
|- source docs updated
`- source book rebuilt
```

Practical rule:

- each phase should aim for one coherent patch set, not a giant mixed refactor
- if a phase gets too wide, split it by owner seam before splitting it by feature fantasy

### Sequencing Authority

```text
authoritative future ladder
`- ACTIVE-EXPANSION-BOARD.md

local contract ladders
|- later 3-D P1-P6
`- ML M1-M5
```

Use the expansion board and this playbook for future execution order.

Read the local contract ladders as:

- shipped context
- local decomposition
- mapping references

not as competing future boards.

### Shared Regression Gate

Run the narrow phase proof first, then the shared baseline gate:

```text
shared baseline gate
|- node scripts/run-runtime-self-audit.js
|- explicit save round-trip proof when the phase widens durable state
|- node scripts/run-r4-ui-readability-audit.js        when visible shell changes
|- node scripts/run-r5-battle-presentation-audit.js   when battle readability changes
|- node scripts/run-r6-communication-audit.js         when communication or social proof changes
|- node scripts/run-w2-wild-ecology-audit.js          when ecology/release logic changes
|- node scripts/run-a4-spatial-truth-audit.js         when spatial ownership changes
`- node scripts/build-source-book.js                  when docs change
```

### Phase Template

Every phase below follows this structure:

```text
build order
|- foundation state
|- owner APIs
|- behavior wiring
|- UI/debug proof
`- audit/doc freeze
```

### 1A - Ecology Depth

#### a1 - Zone Signatures + Pressure State

```text
execution intent
|- convert zone identity from loose behavior scoring into explicit ecology state
`- make later ecology, later 3-D, and ML consume a stable zone truth seam
```

Current status:
- `live`

Build order:
1. Add durable per-zone ecology containers in `zoneSystem.js`.
2. Widen the existing foundation round-trip path so the new `zoneSystem.js` state survives save/load cleanly.
3. Add live pressure refresh and travel scoring consumption in `gameCore.js`.
4. Add readable zone-summary APIs for `lifeSimSystem.js` and inspect/debug consumers.
5. Feed zone pressure summaries into behavior scoring without changing travel ownership.
6. Add compact inspect summaries that expose current zone pressure without reopening the full shell.
7. Widen `run-a3-zone-identity-audit.js` and `run-w3-flower-ecology-audit.js`.

Primary files:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/run-a3-zone-identity-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

Main risks:
- duplicating zone truth between `gameCore` and `zoneSystem`
- making zone signatures so volatile that they stop reading as identity

Phase close artifacts:
- stable zone pressure state shape
- one inspectable summary path
- audit proof for distinct zone signatures

#### a2 - Flower + Habitat Resource Loop

```text
execution intent
|- make food and habitat recover on a real ecological rhythm
`- avoid flat abundance or irreversible collapse
```

Current status:
- `live`

Build order:
1. Define the minimum population-health floor and emergency recovery mechanism before wiring depletion into behavior.
2. Widen the existing `zoneSystem.js` ecology state with reserve, habitat-quality, depletion, and recovery-floor fields.
3. Let `gameCore.js` own reserve spend, emergency floor recovery, spawn targets, and flower-consumption bookkeeping without creating a second ecology container.
4. Feed habitat quality, depletion, and reserve summaries into pressure refresh and life-sim consumption.
5. Extend flower ecology and soak audits with floor-invariant proof.
6. Keep the widened zone-state round-trip green through the existing foundation path.

Primary files:
- `systems/zoneSystem.js`
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-long-soak-generational-audit.js`

Main risks:
- starving zones permanently
- making the ecology too noisy to read from normal play

Phase close artifacts:
- renewable flower/habitat model
- extended `w3`, zone-identity, and soak proof

#### a3 - Migration + Home-Range Personality

```text
execution intent
|- make movement across zones feel chosen
`- establish long-horizon residence and dispersal logic before social emergence
```

Current status:
- `live`

Build order:
1. Add durable migration/home-range memory state in `core/entity.js` and `systems/lifeSimSystem.js`.
2. Add motive-aware travel scoring and reason routing in `core/gameCore.js`.
3. Surface the resulting home-range summary through Inspect without making the UI the owner.
4. Keep round-trip proof on the existing life-sim foundation path by making rebuild refreshes zero-delta and deterministic.
5. Widen `a6` dispersal and zone-identity audits, then keep wild-ecology and runtime-self proof green.

Primary files:
- `core/entity.js`
- `systems/lifeSimSystem.js`
- `core/gameCore.js`
- `ui/gameUI.js`
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-a3-zone-identity-audit.js`

Main risks:
- turning travel into churn
- mixing travel motive truth into path/execution truth
- mutating durable migration state during save/load rebuilds

Phase close artifacts:
- home-range summary
- motive-driven travel traces
- green dispersal, zone-identity, UI, wild-ecology, and runtime-self proof

#### a4 - Social-Ecology Emergence

```text
execution intent
|- use the stabilized ecology layer to produce visible group rhythms
`- deepen feel without creating separate ecology-only mini-systems
```

Current status:
- `live`

Build order:
1. Confirm `b3` shelter/occupancy truth is stable enough to support roosting and shelter-seeking honestly.
2. Add reusable life-sim summaries for roost preference, shelter preference, warning sensitivity, and teaching-cluster affinity.
3. Update `saveSystem.js` migration and round-trip coverage if any new social-ecology state is durable.
4. Connect them to `communicationSystem.js`, `sleepSystem.js`, and `behaviorSystem.js`.
5. Surface these rhythms through Inspect/debug summaries and feed evidence where appropriate.
6. Create a dedicated social-ecology audit scenario script.

Primary files:
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/sleepSystem.js`
- `systems/behaviorSystem.js`
- `systems/saveSystem.js`
- `ui/gameUI.js`
- `ui/debugUI.js`

Main risks:
- fake emergence that only exists in text
- duplicating memory/social state with ecology-specific flags

Phase close artifacts:
- social-ecology scenario script
- Inspect/debug proof
- widened life-sim and communication audits

Closed proof:
- `run-e4-social-ecology-audit.js`
- `run-lifesim-expression-audit.js`
- `run-r6-communication-audit.js`
- `run-r4-ui-readability-audit.js`
- `run-w2-wild-ecology-audit.js`
- serial `run-a4-spatial-truth-audit.js`
- `run-runtime-self-audit.js` with all audited steps green

#### a5 - Release + Lineage Ecology Feedback

```text
execution intent
|- make release consequences legible in future wild cohorts
`- connect ecology feedback to the existing wild-release contract, not a new progression loop
```

Current status:
- `live`

Build order:
1. Add lineage/ecology feedback summaries in `progressionManager.js` and `statProfileSystem.js`.
2. Update `saveSystem.js` migration and round-trip coverage for any widened lineage/ecology state.
3. Feed release-derived affinity and cohort-shaping context into `lifeSimSystem.js`.
4. Surface the results in Inspect/journal in a way that distinguishes inherited, ecological, and current state.
5. Add an anti-progression soak check so focused release does not become a dominant strategy.
6. Extend wild ecology, genetics, and readability audits.

Primary files:
- `core/progressionManager.js`
- `systems/statProfileSystem.js`
- `systems/lifeSimSystem.js`
- `systems/saveSystem.js`
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

Main risks:
- reintroducing rarity-ladder logic in disguise
- making release effects impossible to understand from the shell

Current live result:
- `progressionManager.js` owns release-batch lineage/zone counts, completed cohort summaries,
  blend-guarded baseline uplift, and release-wave cohort ids
- `gameCore.js` routes release-wave spawns through mild preferred-zone shaping instead of direct
  stat duplication or a new unlock path
- `lifeSimSystem.js`, Inspect, and journal surfaces show batch progress, cohort familiarity,
  preferred root zone, and modifier highlights without becoming the truth owner

Phase close artifacts:
- cohort/ecology feedback summary
- journal/Inspect proof
- widened `w2` and genetics proof

#### a6 - Long-Soak Ecology Proof

```text
execution intent
|- treat ecology as frozen only after multi-generation proof
`- stop later layers from building on unstable ecological behavior
```

Current status:
- `live`

Build order:
1. Add ecology-depth soak script and output schema.
2. Add telemetry summaries for zone health, migration health, cohort turnover, and release feedback.
3. Run long soak, inspect failures, tighten thresholds, and re-run.
4. Update docs and source book only after the final green pass.

Primary files:
- `scripts/run-e6-ecology-depth-audit.js`
- `scripts/run-long-soak-generational-audit.js`
- `systems/telemetrySystem.js`
- `docs/`

Main risks:
- hidden collapse loops that short audits miss
- promoting later 3-D or ML on unstable ecology

Phase close artifacts:
- ecology soak artifact set with full multi-seed `e6` proof plus targeted dispersal and wild-ecology regressions
- updated docs
- frozen ecology baseline

### 2B - Later 3-D

#### b1 - Physics Ownership Consolidation

```text
execution intent
|- unify dynamic movement resolution before adding richer geometry
`- remove owner ambiguity first, not last
```

Current status:
- `live`

Build order:
1. Keep butterflies choosing intent, but move legalized step commits into `physicsSystem.js`.
2. Route final resolved movement through one owner API instead of direct butterfly-side position writes.
3. Keep zone-border clamp order explicit in `gameCore.js`.
4. Expose a focused-garden budget seam through `telemetrySystem.js` and `physicsSystem.js`.
5. Extend movement and spatial-truth audits so they prove ownership plus budget, not just initialization.

Primary files:
- `systems/physicsSystem.js`
- `core/gameCore.js`
- `entities/butterfly.js`
- `systems/telemetrySystem.js`
- `scripts/run-r1-movement-stability-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`

Main risks:
- double-applying movement or impulses
- breaking current stable motion while refactoring ownership

Phase close artifacts:
- one per-frame motion pipeline
- live `physicsMs` telemetry seam with a `2.5ms physics / 16ms total update` target
- green movement, spatial-truth, and runtime-self audits

#### b2 - Collision-Ready Structure Geometry

- `live`

Build order:
1. Normalize opening/interior/roof/column outputs in `structureSystem.js`.
2. Create a clean query seam for `physicsSystem.js`.
3. Replace scattered geometry guesses with structure queries.
4. Extend structure and spatial-truth audits.

Primary files:
- `systems/structureSystem.js`
- `systems/physicsSystem.js`
- `scripts/run-m5-structure-audit.js`

Main risks:
- too many geometry formats
- leaving half the codebase on old point-test logic

Closed state:
- `structureSystem.js` publishes a versioned collision packet for each zone/component with openings, interiors, roofs, walls, and occupancy columns
- `physicsSystem.js` uses and exposes a single structure-query helper for later traversal phases
- structure and spatial-truth audits prove the packet in both shelter fixtures and the live focused-garden baseline

#### b3 - Occupancy Bands + Body-Fit Traversal

Build order:
1. Lock discrete occupancy bands and body-fit enums.
2. Lock shared ownership of `verticality`, `structureRole`, `pathState`, and `bodyFit` so later consumers import them instead of redefining them.
3. Add structure-to-physics traversal rules for openings and shelter interiors.
4. Feed those summaries to `lifeSimSystem.js`.
5. Add debug readouts and screenshot-backed proof.

Primary files:
- `systems/physicsSystem.js`
- `systems/structureSystem.js`
- `systems/lifeSimSystem.js`
- `ui/debugUI.js`

Main risks:
- implicit band logic scattered across render/gameplay
- body-fit truth diverging from visible shelter behavior

Closed state:
- `structureSystem.js` is now the single owner for shared spatial semantics, including occupancy bands and the four cross-track hook domains
- opening corridors, interior shelter states, and body-fit outcomes now resolve through the same spatial packet that physics and later ML consumers read
- `run-a4-spatial-truth-audit.js`, `run-r2-zone-transition-audit.js`, `run-m5-structure-audit.js`, and `run-r1-movement-stability-audit.js` now cover the live traversal seam

#### b4 - Carry + Stack Physicalization

Build order:
1. Route carry attachment through `physicsSystem.js`.
2. Route stack legality and stability through `structureSystem.js`.
3. Keep object-use flow in `objectSystem.js`, but make it call the new physical seams.
4. Add a dedicated carry/stack physics audit.

Primary files:
- `systems/physicsSystem.js`
- `systems/objectSystem.js`
- `entities/block.js`
- `systems/structureSystem.js`

Main risks:
- introducing sandbox wobble
- accidentally reintroducing retired flower-carry behavior

Closed state:
- `physicsSystem.js` now resolves carry anchors, legal block placements, and unsupported-stack settling through one owner seam
- `structureSystem.js` now treats stacked placement as a support-column legality check instead of a generic overlap failure
- `block.js` and `objectSystem.js` now expose carried / stacked / grounded object truth clearly enough for audits and later debug work
- `run-b4-carry-stack-physics-audit.js`, `run-r7-block-visual-audit.js`, `run-m5-structure-audit.js`, and `run-r1-movement-stability-audit.js` now cover the live carry/stack runtime

#### b5 - Impact + Shove Integration

Build order:
1. Add impulse request APIs to `physicsSystem.js`.
2. Change `teachingSystem.js` to request impulse instead of faking displacement.
3. Keep battle results in `battleSystem.js`, but let battle visuals request spatial cues safely if needed.
4. Widen training-physics and battle-presentation audits.

Primary files:
- `systems/physicsSystem.js`
- `systems/teachingSystem.js`
- `systems/battleSystem.js`
- `systems/statusSystem.js`

Main risks:
- battle truth drifting into physics truth
- training/battle both touching the same displacement path unsafely

Closed state:
- the live runtime already used `physicsSystem.applyImpulse(...)` as the garden/training recoil seam, so this phase closed by proving and freezing the owner split rather than widening it again
- `battleSystem.js` remains the battle-truth owner while battle-facing render work continues to consume presentation snapshots only
- `run-p5-training-physics-audit.js`, `run-r5-battle-presentation-audit.js`, `run-single-player-autobattle-audit.js`, and `run-runtime-self-audit.js` prove the split holds on the repaired baseline

#### b6 - Visual + Debug Spatial Shell

Build order:
1. Add render-readable spatial summaries.
2. Add debug overlays for occupancy band, shelter state, contact state, and carry anchors.
3. Add player-facing spatial cues only where they improve comprehension.
4. Re-run readability and block-visual audits.

Primary files:
- `core/renderManager.js`
- `ui/debugUI.js`
- `ui/gameUI.js`
- `systems/physicsSystem.js`

Main risks:
- correct logic with misleading visuals
- overloading the player shell with debug detail

Closed state:
- `physicsSystem.js` now publishes a shared spatial summary for occupancy, role, path, body-fit, contact, and carry state
- `renderManager.js`, `ui/debugUI.js`, and `ui/gameUI.js` now read that summary directly so the world cue, debug shell, and Inspect all describe the same live state
- `run-r7-block-visual-audit.js` and `run-r4-ui-readability-audit.js` now prove the visible shell by asserting the summary-backed cues directly

#### b7 - Spatial Soak + Save/Load Freeze

Build order:
1. Add long-run spatial soak cases.
2. Verify save/load only persists durable spatial truth.
3. Stress carry, stack, shelter, shove, and travel continuity after reload.
4. Re-run ecology soak on the later 3-D baseline to make sure `b4`-`b7` did not regress `a4`-`a6`.
5. Freeze docs only after stable soak and round-trip results.

Primary files:
- `systems/saveSystem.js`
- `systems/physicsSystem.js`
- `scripts/run-b7-spatial-soak-audit.js`
- `docs/`

Main risks:
- persisting transient physics caches
- long-soak drift that single-scene tests miss

Closed state:
- `systems/saveSystem.js` now keeps durable carry / placement identifiers while rebuilding transient spatial caches during load restoration
- `scripts/run-b7-spatial-soak-audit.js` now freezes the later 3-D layer with save-payload hygiene, post-load continuity, and short-soak proof
- `scripts/run-a4-spatial-truth-audit.js`, `scripts/run-runtime-self-audit.js`, and the full ecology re-soak rerun now confirm the later 3-D closure did not regress `a4`-`a6`

### 3C - Machine Learning

#### c1 - Runtime Lock + Offline Training Contract

```text
execution intent
|- remove contract ambiguity before any true model rollout
`- make the ML program implementable and reviewable
```

Build order:
1. Lock runtime choice, artifact format, fallback rules, and trace schema in docs.
2. Lock the shared spatial-hook contract early enough that `b3` does not invent ML-facing seams in a vacuum.
3. Update `mlInferenceSystem.js` config seams to match those docs.
4. Tighten `m1` and `m2` audits around those decisions.

Primary files:
- `systems/mlInferenceSystem.js`
- `docs/COGNITION-ML-CONTRACT.md`
- `docs/ML-IMPLEMENTATION-CONTRACT.md`
- `scripts/run-ml-phase-m1-audit.js`
- `scripts/run-ml-phase-m2-audit.js`

Main risks:
- beginning data/model work against unresolved runtime assumptions

#### c2 - Heuristic Trace Capture + Scenario Corpus

Current state:
- live

Build order:
1. Define the trace schema and corpus manifest.
2. Export reproducible traces from audit scenarios.
3. Add hand-corrected labels only where the heuristic is visibly wrong.
4. Add tooling checks that the corpus can be rebuilt.

Primary files:
- `systems/telemetrySystem.js`
- `systems/mlInferenceSystem.js`
- `scripts/`

Main risks:
- unrepeatable data capture
- labels that mix owner truth with UI guesses

Closed state:
- `systems/mlInferenceSystem.js` now exposes corpus-ready garden and battle record builders so audit scenarios can export active traces, heuristic baselines, reviewed labels, and feature snapshots from one owner seam
- `systems/telemetrySystem.js` now profiles ML corpus captures without turning them into save truth
- `scripts/build-c2-trace-corpus.js` now writes the dedicated corpus records + manifest, and both `run-ml-phase-m1-audit.js` and `run-deep-systems-audit.js` now verify family coverage plus manifest rebuild proof

#### c3 - Feature Builder V1

Build order:
1. Freeze enum/value encodings.
2. Define which spatial features are safe after `b3` and which remain deferred until the `b7` freeze.
3. Build deterministic feature extraction from owner systems only.
4. Update `saveSystem.js` for model version / trace-summary state if that state becomes durable.
5. Add a trace view that shows the feature groups without dumping raw noise.
6. Extend `m3` and runtime-self audits.

Primary files:
- `systems/mlInferenceSystem.js`
- `systems/lifeSimSystem.js`
- `systems/statProfileSystem.js`
- `core/progressionManager.js`
- `systems/physicsSystem.js`
- `systems/battleSystem.js`
- `systems/saveSystem.js`

Main risks:
- feature duplication
- hidden non-determinism
- unreadable trace surfaces

Closed state:
- `systems/mlInferenceSystem.js` now uses explicit ordered encodings for the live feature contract, adds the `b3` / `b7` spatial tier split, and reports the frozen counts as `14 groups / 94 flat / 116 vec`
- `ui/gameUI.js` now renders compact `Schema` / `Feat` / `Space` rows so the inspect shell can show the feature contract without dumping raw vectors
- `scripts/run-ml-phase-m3-audit.js` now proves exact counts, deterministic rebuilds, readable trace rows, and save/fallback continuity, while `scripts/run-runtime-self-audit.js` carries the post-load ML feature step

#### c4 - Model Artifact + Evaluation Harness

Build order:
1. Create versioned local artifact structure in `assets/ml/`.
2. Build evaluation harness against the scenario corpus.
3. Compare model bundle against heuristic baselines by policy family.
4. Refuse rollout if the artifact cannot beat or safely match the baseline in the target cases.

Primary files:
- `assets/ml/`
- `systems/mlInferenceSystem.js`
- `scripts/`

Main risks:
- a model that looks impressive but is less stable than the heuristic
- insufficient evaluation breadth

Closed state:
- the live `m4-garden-policy-v1` artifact now carries explicit artifact/feature/trace/contract metadata instead of relying on ambient config alone
- `run-ml-phase-m4-audit.js` now rebuilds the `c2` corpus, writes a dedicated `artifact-evaluation.json`, and proves the artifact meets threshold gates across garden, communication, ecology, and autobattle coverage
- the reviewed teaching correction now lands as a measurable `actionFamily` win over the heuristic baseline while the ecology return-home case stays on `wander`

#### c5 - Runtime Inference Rollout

Build order:
1. Add arbitration between model and heuristic fallback.
2. Roll out one policy family at a time if needed, but keep the external phase label intact.
3. Define and enforce the inference frame-time budget before broad rollout.
4. Re-run communication, autobattle, and closure audits after each rollout step.
5. Keep source path and fallback path exposed in traces.

Primary files:
- `systems/mlInferenceSystem.js`
- `systems/behaviorSystem.js`
- `systems/communicationSystem.js`
- `systems/battleSystem.js`

Main risks:
- silent fallback masking model failure
- regressions that only show in social or battle behavior

Closed state:
- `systems/mlInferenceSystem.js` now keeps live garden and battle policy scoring on the model-backed path, records runtime timing samples, and reports focused-garden / battle budget targets through `getRuntimeSummary()`
- `scripts/run-ml-closure-audit.js`, `scripts/run-r6-communication-audit.js`, and `scripts/run-single-player-autobattle-audit.js` now prove the live rollout, fallback honesty, and frame-budget proof directly
- the final grand-plan short-soak proof now keys off the live `16ms total update` seam rather than a stale pre-expansion threshold

#### c6 - Explainability + Inspect/Debug Shell

Build order:
1. Add concise player-facing ML explanation rows.
2. Add richer debug rows for model version, confidence, alternatives, and source path.
3. Make sure explanations always point back to owner truth rather than vague story text.
4. Extend readability and ML closure audits.

Primary files:
- `ui/gameUI.js`
- `ui/debugUI.js`
- `systems/mlInferenceSystem.js`

Main risks:
- decorative explanations that do not match the actual trace
- debug clarity collapsing under too much raw information

Closed state:
- `systems/mlInferenceSystem.js` now builds concise explainability summaries from the live policy weights and feature values instead of decorative story text
- `ui/gameUI.js` now surfaces `Path` and `Why`, while `ui/debugUI.js` now renders a shared explainability snapshot with artifact path, confidence, alternatives, driver features, and budget lines
- `scripts/run-ml-closure-audit.js` and `scripts/run-r4-ui-readability-audit.js` now prove the explainability shell end to end

#### c7 - Soak + Regression Freeze

Build order:
1. Run long-soak ML scenarios with fallback interruptions.
2. Verify save/load continuity of version ids and trace summaries.
3. Check performance budgets and regression budgets.
4. Freeze the ML baseline only after the long-run gate is repeatably green.

Primary files:
- `systems/saveSystem.js`
- `systems/telemetrySystem.js`
- `scripts/`
- `docs/`

Main risks:
- performance regressions
- behavior drift over long runs
- fallback path rot

Closed state:
- `scripts/run-runtime-self-audit.js` now proves post-load ML explainability rows, budget targets, and the shared debug snapshot
- `scripts/run-long-soak-generational-audit.js` now proves the model-backed path stays live through soak checkpoints instead of degrading into silent fallback
- `scripts/run-final-grand-plan-audit.js` now passes cleanly on the frozen expansion baseline

### Review Checklist Before Starting Any Phase

```text
pre-flight
|- is the owner of durable truth explicit?
|- is the save/load boundary explicit?
|- is there a debug-truth surface?
|- is there at least one audit to widen or add?
|- is the exit gate concrete?
`- does the phase avoid reopening already-frozen baseline work?
```

### Review Checklist Before Closing Any Phase

```text
phase close
|- target phase audits green
|- shared regression gate green
|- visible states match debug truth
|- docs updated
|- source book rebuilt
`- next downstream phase still makes sense after the observed results
```

### Historical First Execution Packet

If I were starting immediately, I would begin with:

```text
c1 runtime + training contract lock
|- lock runtime / artifact / trace / fallback rules
`- lock shared hook ownership before b3 and c3 broaden consumers

a1 zone signatures + pressure state
|- add durable zone ecology state
|- add save migration + round-trip proof
|- add zone summary APIs
|- wire life-sim consumption
|- add debug proof
`- widen a3/w3 audits
```

That is the safest first packet because it:

- improves the garden immediately
- removes contract ambiguity before later 3-D and ML reserve new seams
- has a narrow blast radius
- supplies clean inputs to both later 3-D and later ML
- does not require reopening battle or player-shell foundations

## Active Public-Share Board

_Source: `docs/ACTIVE-PUBLIC-SHARE-BOARD.md`_

### Purpose

This board sequences the work needed to move Papilionem from a frozen internal
baseline to a public-share-ready build.

This track is not about inventing new core simulation systems.
It is about making the existing game:

- easier to launch
- easier to understand in the first session
- safer to hand to outside testers
- easier to freeze as a public alpha

Read this together with:

- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md)
- [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [ACTIVE-RUNTIME-HARDENING-BOARD.md](./ACTIVE-RUNTIME-HARDENING-BOARD.md)
- [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md)
- [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [README.md](./README.md)
- [../README.md](../README.md)
- [../PLAYTEST.md](../PLAYTEST.md)
- [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md)

### Current Shareability Shape

```text
+=================================================================================+
| Public-Share Readiness                                                          |
+=================================================================================+
| current runtime baseline              | frozen clean                            |
| local-host playtest build             | validated on host-local Windows+Chrome  |
| first-session onboarding              | live lightweight quick-start            |
| outside-tester matrix                 | live, with documented intake path       |
| stranger-safe public alpha            | waiting on real outside sessions        |
+=================================================================================+
```

```text
phase order

r1 -> r2 -> r3 -> r4 -> r5
```

### Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current phase

gated
`- cannot close until upstream evidence exists
```

### Invariants

```text
always preserve
|- the frozen repair / polish / implementation / expansion baselines stay green
|- this board hardens sharing and usability before it broadens scope
|- startup instructions must match the real launch path exactly
|- player-facing docs must match the real button-first shell exactly
|- onboarding should explain current truth, not an imagined future shell
|- bug fixes should prefer the smallest reversible change
`- no deferred dream-feature work belongs on this board
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `r1 startup/package sanity` | `live` | make the repo surface, startup scripts, launch docs, and local-host instructions truthful and easy to follow | `package.json`, `server.js`, `README.md`, `PLAYTEST.md`, `docs/`, `scripts/` | launch path works from the documented commands, root/docs maps agree, and source-book rebuild stays green |
| `r2 first-session onboarding` | `live` | make the first five minutes understandable without a developer walking alongside the player | `ui/gameUI.js`, `ui/debugUI.js`, `docs/PAPILIONEM-PLAYER-GUIDE.md`, `PLAYTEST.md` | new-player start path is readable, `r4` stays green, and core shell docs match the live onboarding path |
| `r3 external playtest matrix` | `live` | define supported baseline environments, outside-tester flow, and useful feedback collection | `PLAYTEST.md`, `PLAYTEST-FEEDBACK.md`, `README.md`, `docs/` | tester matrix exists, feedback template is actionable, and at least one outside-tester path is documented cleanly |
| `r4 feedback triage + readability hardening` | `active` | fix the highest-value confusion, friction, and breakage issues found by real players | `runtime files as needed`, `docs/`, `scripts/`, `PLAYTEST-TRIAGE-LOG.md` | blocker bugs are closed, top confusion points are addressed, and the affected regression stack stays green |
| `r5 public alpha freeze` | `gated` | freeze a public-facing alpha baseline with known-issues framing, launch guidance, and a final audit sweep | `docs/`, `scripts/`, `README.md`, `PLAYTEST.md` | final release-readiness sweep is green, docs are aligned, and the source book rebuilds cleanly |

### Current Focus

```text
current focus
`- r4 feedback triage + readability hardening
```

Current blocker:

- host-local runtime proof is now locally green on the committed long-running
  save through the frozen `v7` stack, so the remaining blocker is not a local
  freeze/lag emergency anymore
- real outside play sessions still need to run through the `M2`+ lanes in
  [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- local intake is ready, but `r4` still cannot close until the runtime-only
  proof pack is frozen honestly; `v8a` is now frozen live at
  `qa_logs/session_captures/v8a-runtime-proof/REPORT.md`, so the remaining
  blocker is outside-session evidence plus the later `v8b` full-stack proof

Next exact move:

- run one real `M2` same-LAN desktop Chromium session on the frozen `v8a`
  stack
- collect [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- if the host is comfortable with debug tools, export one session capture
- copy only actionable issues into [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- if no blocker appears, advance to the next outside lane and keep `r4`
  active until outside evidence is broad enough to support `r5`

`r4` support tooling now live:

- structured session-capture export now exists so local and outside test runs can be reviewed after play without depending on manual note-taking alone
- exported-save retesting is now live too: `Export Save` writes the current browser world into `qa_logs/save_exports`, and `run-h5-long-running-save-smoothness-audit.js` can replay that exact world in a fresh audit browser context
- the remaining local-playtest follow-up work is now being executed through [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md) in the exact order recorded by [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- the remaining sustained lag/smoothness work is now sequenced through [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md) and [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md); the canonical lived-in baseline is live, `v7` visual restoration is frozen, and `v8a` runtime-only proof is now frozen honestly while `v8b` waits behind outside-session triage

Fresh local `M1` triage now holding:

- session-capture export is now live for local and outside freeze/stutter review
- high-DPI freeze hardening now clamps oversized windows, backs off expensive background atmosphere and butterfly sprite smoothing earlier under pressure, and keeps a bad render frame from collapsing into a black screen
- host-local runtime hardening has now closed `h1` through `h4` with attributed capture export, slimmer render presentation, cached structure rebuilds, cached shell text/layout work, lighter journal redraw cadence, UI-layer redraw discipline, and battle-aware teaching cadence; the imported-save fixture lane is green, the real lived-in `h5` lane is green, and the frozen local runtime stack is now live through `v7`
- long-running saves now survive refresh-aware block/runtime fixes without forcing a reset, and active doorway travel survives roundtrip cleanly
- the battle shell no longer leaves the garden feed visible behind combat
- battle presentation now uses a minimal field-first shell with in-field HP bars instead of side roster slabs
- battle pacing now opens from back-line release positions and stays visible long enough for ability traces to read cleanly
- the shell retest lane now confirms inspect `All`, inspect clearing, doorway travel, feed cleanup, and trail toggling all still hold after the save/runtime fixes
- the social follow-up lane now has threaded talk exchanges, richer low-stakes casual conversation, pair-mode surfacing, and proven later relationship/life-sim follow-through
- the older local playtest follow-up board has now closed `f1` through `f9`, and the remaining local blocker has been split cleanly into the new runtime-hardening track plus the later `f10` outside-session handoff
- `run-f3-long-running-save-regression-audit.js`, `run-f4-shell-followup-audit.js`, `run-r5-battle-presentation-audit.js`, `run-single-player-autobattle-audit.js`, and `run-r4-ui-readability-audit.js` are green on that repaired shell/runtime baseline

Current intake path:

- [../PLAYTEST.md](../PLAYTEST.md)
- [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)

## Active Plan Registry

_Source: `docs/ACTIVE-PLAN-REGISTRY.md`_

### Purpose

This is the single index for the plans that are still meaningfully in play.

Use it to answer:

```text
which plans are active?
which are supporting?
which are frozen history?
which doc is the source of truth for each one?
```

### Program Shape

```text
╔══════════════════════════════ Papilionem Active Plan Stack ══════════════════════════════╗
║ release-facing parent track                                                             ║
║ └─ public-share readiness                                                               ║
║    ├─ runtime/smoothness child track      -> visual-first runtime optimization          ║
║    ├─ geometry/unit child track           -> spatial unification                        ║
║    ├─ society/feeling child track         -> social-cognition depth                     ║
║    ├─ tester intake + evidence docs       -> playtest matrix / triage / feedback       ║
║    └─ frozen local precursor boards       -> follow-up + old runtime hardening          ║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝
```

### Active Plans

| Track | Status | Role | Source of truth | Companion docs |
| --- | --- | --- | --- | --- |
| `completion board` | `active coordinator` | coordinates the exact remaining closure order across runtime, spatial, social, and public-share work | [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md) | [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md), [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md), [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md), [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md) |
| `public-share readiness` | `active parent` | governs launch quality, onboarding, outside testing, and public-alpha freeze | [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md) | [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md), [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md), [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md), [../PLAYTEST.md](../PLAYTEST.md), [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md) |
| `visual-first runtime optimization` | `active child` | solves lag/freezing/smoothness without sacrificing visuals or core systems | [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md) | [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md), [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md), [BASELINE.md](./BASELINE.md), [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md), [V1-SHELL-UI-SEPARATION-AUDIT.md](./V1-SHELL-UI-SEPARATION-AUDIT.md), [V2-MEMORY-GROWTH-AUDIT.md](./V2-MEMORY-GROWTH-AUDIT.md), [SPRITE-CACHE-CONTRACT.md](./SPRITE-CACHE-CONTRACT.md), [V3-SPRITE-BAKING-AUDIT.md](./V3-SPRITE-BAKING-AUDIT.md), [V4-SIM-CADENCE-AUDIT.md](./V4-SIM-CADENCE-AUDIT.md), [V5-COMPOSITE-REDUCTION-AUDIT.md](./V5-COMPOSITE-REDUCTION-AUDIT.md), [V6-WORKER-OFFLOAD-AUDIT.md](./V6-WORKER-OFFLOAD-AUDIT.md), [V7-VISUAL-RESTORATION-AUDIT.md](./V7-VISUAL-RESTORATION-AUDIT.md) |
| `spatial unification` | `live child` | unifies board bounds, one-block-to-one-unit truth, doorway corridors, footprints, occupancy, interaction-space behavior, and save normalization | [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md) | [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md), [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md), [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md), [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md), [DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md](./DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md), [ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md](./ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md), [BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md](./BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md), [SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md](./SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md), [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md) |
| `social-cognition depth` | `live child` | deepens feelings, relationships, butterfly society behavior, and neural social scoring so the simulation reads as emotionally alive instead of mostly functional warning loops | [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md) | [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md), [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md), [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md), [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md), [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md), [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md), [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md), [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md), [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md), [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md), [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md), [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md) |

### Goal Alignment Companions

```text
goal-alignment companion set
├─ GAME-SUCCESS-CRITERIA.md
├─ CURRENT-STATE-GAP-ASSESSMENT.md
├─ GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md
├─ GOAL-ALIGNMENT-REVIEW-PACKET.md
├─ G0-BAR-STAGE-A-SIGNOFF.md
├─ G1-SPATIAL-ACCEPTANCE-SWEEP.md
├─ G2-LIVE-BUILDING-BEHAVIOR-PROOF.md
└─ G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md
```

Use these when the question is not "which historical phase landed?" but:

```text
what does success actually mean now?
what still does not line up with that target?
what should reopen next, if anything?
```

Additional runtime benchmark companions:

- [COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md](./COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md)
- [COMPOSED-BENCHMARK-BASELINE-2026-04-27.md](./COMPOSED-BENCHMARK-BASELINE-2026-04-27.md)

Latest harness-accounting correction:

```text
2026-04-28 benchmark telemetry correction
|- composite total now includes direct-flower present cost
|- top-contributor attribution now ranks timing keys only
`- do not treat counters, widths, heights, or ratios as millisecond costs
```

Use these when the question is:

```text
what does the runtime really cost under realistic single-zone play?
which lane should own the next hotspot diagnosis?
```

### Shared Contracts

```text
shared contracts
|- SAVE-SCHEMA-REGISTRY.md
|- SIM-CADENCE-CONTRACT.md
|- spatial-unit contract (`s1`)
|- social-family lock (`n1`)
|- CROSS-TRACK-ARBITRATION.md
`- COGNITION-ML-CONTRACT.md
```

| Contract | Purpose |
| --- | --- |
| [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md) | canonical save field families, protected-state groups, and the shared `schemaVersion` used jointly by runtime `v7`, spatial `s7`, and social `n8` |
| [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) | co-owned cadence boundary between runtime `v4` and social `n1` |
| [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md) | canonical `s1` lock for `1 block = 1 board unit = 1 support/stack unit`, with later adoption sequenced in [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md) |
| [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md) | canonical `n1` lock for feeling, pair-chemistry, society, and motive families, with the detailed sequence preserved in [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md) |
| [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md) | contested-file owner table and merge-time tie-breaker |
| [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md) | ML boundary rules, including the later P6 audit requirement |

### Cross-Track Gates

| Gate | Requires | Recorded status |
| --- | --- | --- |
| `v0 baseline` | geometry-freeze commitment (`P2`) | `satisfied: geometry was not frozen through v0-v3; spatial s3 is live, and both the quick plus full-duration post-s3 recaptures are now on disk` |
| `v4 cadence` | social `n1` family lock + [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) | `satisfied locally: n1 is frozen live, the shared cadence contract is signed, and v4 is now banked as the retained 18/36/30 slice` |
| `v5 composite` | spatial `s3` doorway corridor alignment | `satisfied locally; runtime v5 may now consume the live corridor geometry` |
| `v7 / s7 / n8` | [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md) signed off jointly | `satisfied locally: schemaVersion 4 is now the explicit shared signoff for runtime v7, spatial s7, and social n8` |
| `v8 split` | `v8a runtime-only proof` + `v8b full-stack proof` | `partially satisfied: v8a is frozen live; v8b stays gated behind c9 / r4 outside-session triage` |

### Review-Gate Rubric

| Gate | Source of truth | Current status |
| --- | --- | --- |
| `runtime review-gate rubric` | [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md) | `closed locally: shared contracts are in place, v0.5 is closed with default-off regressors, and the canonical post-s3 full-duration baseline is frozen in BASELINE.md` |

### How They Relate

```text
ACTIVE-COMPLETION-BOARD
├─ asks: what exact order closes every remaining active track?
│
ACTIVE-PUBLIC-SHARE-BOARD
├─ asks: can we hand the game to more people safely?
│
├─ ACTIVE-VISUAL-FIRST-RUNTIME-BOARD
│  └─ answers: can the game run smoothly at the visual quality we want?
│
├─ ACTIVE-SPATIAL-UNIFICATION-BOARD
│  └─ answers: do bounds, units, doorways, blocks, and entity footprints share one spatial truth?
│
└─ ACTIVE-SOCIAL-COGNITION-BOARD
   └─ answers: do butterflies actually feel like a society with emotions, chemistry, and memory?
```

### Exact Reading Order

#### If you need the big picture

1. [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
2. [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)
3. [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
4. [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
5. [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
6. [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)

#### If you are working on lag/freezing first

1. [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
2. [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
3. [BASELINE.md](./BASELINE.md)
4. [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md)
5. [V1-SHELL-UI-SEPARATION-AUDIT.md](./V1-SHELL-UI-SEPARATION-AUDIT.md)
6. [V2-MEMORY-GROWTH-AUDIT.md](./V2-MEMORY-GROWTH-AUDIT.md)

#### If you are working on movement/bounds/3D consistency first

1. [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
2. [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
3. [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

#### If you are working on feelings / society / conversation depth first

1. [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
2. [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)
3. [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
4. [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
5. [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
6. [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md)
7. [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
8. [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)

### Supporting Evidence Docs

```text
evidence + intake
├─ EXTERNAL-PLAYTEST-MATRIX.md
├─ PLAYTEST-TRIAGE-LOG.md
├─ PLAYTEST.md
└─ PLAYTEST-FEEDBACK.md
```

These are not separate implementation plans.
They support the active boards by capturing:

- where testing is supposed to happen
- what players found
- what still blocks wider sharing

### Historical But Still Useful

```text
historical boards
├─ ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md
│  └─ local issue ladder that fed into the runtime/share tracks
├─ ACTIVE-RUNTIME-HARDENING-BOARD.md
│  └─ older runtime repair ladder, now superseded
├─ ACTIVE-IMPLEMENTATION-BOARD.md
│  └─ frozen implementation closure board
└─ ACTIVE-EXPANSION-BOARD.md
   └─ frozen expansion closure board
```

These should be treated as:

```text
reference / proof history
not the current implementation queue
```

### Current Truth

```text
do not lose this distinction
├─ completion board        = exact remaining closure ladder
├─ public-share board      = release-facing parent program
├─ visual-first board      = runtime/smoothness child program
├─ spatial board           = board/unit/occupancy child program
├─ social board            = feelings/society/neural-social child program
└─ older boards            = frozen context, not active sequencing
```

### Goal-Alignment Next Move

Updated by the `2026-04-26` Claude Review.

```text
runtime benchmark truth
|- composed harness is now the active runtime reality reference
|- retained local recovery stack has materially repaired the realistic lane
|  |- clustered `single-zone-122` -> 127.77 / 45.91 / 172.5 -> 52.18 / 43.53 / 94.9
|  `- scattered `single-zone-122` -> 52.43 / 50.20 / 102.8 on `56c9a4f`, then 43.77 / 44.98 / 89.4 after the structure-query cut, then 40.84 / 42.69 / 88.4 after the dense-flower gate, then 36.62 / 43.15 / 81.1 after the communication/trace-cache cut, then 39.27 / 43.54 / 81.3 after the structure runtime-cache hold
|- retained dense-flower gate has materially repaired the flower-heavy lane
|  `- `flower-feed-storm` -> 45.68 / 73.37 / 117.5 -> 32.54 / 63.95 / 98.2 -> 33.31 / 63.55 / 98.9 hold
|- retained communication-maintenance + decision-trace cache has materially repaired the stress lane
|  |- `single-zone-200` -> 96.94 / 56.00 / 153.1 -> 86.37 / 55.22 / 141.5 retained
|  `- social guardrails -> r6 pass / f5-f6 pass
|- retained structure-system frame-local runtime caches have materially repaired the next stress-lane slice
|  |- `single-zone-200` -> 86.37 / 55.22 / 141.5 -> 81.39 / 55.82 / 135.3 retained
|  `- spatial/build guardrails -> a4 pass / b4 pass
|- retained pressure-gated crowd/cursor checks + critical communication cadence have repaired the next smaller stress-lane slice
|  |- `single-zone-200` -> 81.39 / 55.82 / 135.3 -> 80.87 / 54.92 / 134.0 retained
|  |- `single-zone-122` -> 34.71 / 41.86 / 74.7 hold
|  |- `flower-feed-storm` -> 29.66 / 61.31 / 88.7 hold
|  |- `block-carry-active` -> 30.47 / 25.78 / 55.1 hold
|  `- guardrails -> r6 pass / f5-f6 pass / r1 pass
`- next composed benchmark order
   |- keep fixing `single-zone-200`, now with composite / drawImage first
   |- keep `flower-feed-storm` green as a repaired watch lane
   |- keep `block-carry-active` green as a repaired watch lane
   `- only reopen `single-zone-122` if we want extra margin beyond the old `83ms p50` note
```

```text
start now (Stage A acceptance closure)
├─ g1 spatial acceptance sweep
│  └─ local companion proof is green; human g0-bar signoff still pending
├─ g2 live building behavior proof
│  └─ first guided lived-in proof lane is green; formal close still pending
└─ g3 movement naturalness acceptance
   └─ local companion proof is now green; human g0-bar signoff still pending

run in parallel with Stage A (prep-only early-start)
├─ g4-observation: begin ambient social observation now
│   └─ evidence gathering only; formal close still waits for Stage B
└─ g5-style: begin dialogue style cleanup now
    └─ prep-only style work; formal close still waits for Stage B

precondition (one-time)
└─ g0-bar: adopt the acceptance-bar definition in
   GAME-SUCCESS-CRITERIA.md before closing any of g1-g5
   └─ Stage A human signoff sheet now lives in G0-BAR-STAGE-A-SIGNOFF.md
```

Why early-start g4 and g5:

- g4 needs accumulated free-play observation; starting in Stage A means
  the social breadth read does not start from zero when Stage A closes
- g5 has actionable text-style evidence today (f5/f6 audit lines read as
  system-authored); cleanup does not need to wait for Stage B
- the parallel-safe shape in
  [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md#parallel-safe-shape)
  already permits this; this section surfaces it as the active next move

Active runtime benchmark method:

```text
runtime benchmark method
|- reality baseline -> single-zone-122
|- stress baseline  -> single-zone-200
|- block lane       -> block-carry-active
|- flower lane      -> flower-feed-storm
`- profile rule     -> profile the heaviest failing composed lane
```

### Recommended Next Review Hand-Off

If you want Claude to review the active planning layer before implementation,
give it this exact set first:

1. [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
2. [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)
3. [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
4. [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
5. [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
6. [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
7. [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
8. [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)

That gives one map plus the three active issue-resolution tracks.

## Active Completion Board

_Source: `docs/ACTIVE-COMPLETION-BOARD.md`_

### Purpose

This board collapses the remaining active work into one exact closure ladder.

Use it to answer:

```text
what is still open?
what closes first?
what can run in parallel safely?
what still gates public alpha?
when are we actually done?
```

It does not replace the child boards.
It coordinates them.

Read this with:

- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
- [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
- [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)

### Non-Negotiables

```text
always preserve
|- no performance fix may solve smoothness by gutting the look
|- no core life-sim / social / genetics / battle system gets removed
|- long-running saves stay sacred across every migration and proof pass
|- UI surfaces truth but never owns durable state
|- ML may score choices but never own durable social truth
|- runtime proof must use the real lived-in save, not only fixture worlds
`- public alpha stays gated until both local smoothness and outside evidence are honest
```

### Current Truth

```text
2026-04-25 closure update
|- c1 runtime v3 closure -> live
|  `- retained reduced-bucket battle-only pose slice is now banked as a default-off runtime seam
|- runtime child track   -> live through v7
|  |- c3 runtime v4      -> live as the promoted 18/36/30 cadence slice
|  |- c4 runtime v5      -> live on the promoted clean-shell composite + DOM-guide + baked-flower + idle-HUD reduction stack
|  |- c5 runtime v6      -> live as improved default-off worker groundwork
|  |- c6 runtime v7      -> live with sharp creatures restored and trails back as off/reduced/full
|  |- c7 schema signoff  -> live at `schemaVersion = 4`
|  `- c8 runtime proof   -> now frozen live on the committed lived-in save
|- spatial child track   -> live through s8
|  `- current read       -> `r2`, `b4`, `r7`, `a4`, and `h5` are green, so the board/unit/corridor contract is now frozen honestly
`- social child track    -> live through n8
   `- current read       -> shared save-schema signoff is now recorded jointly at `schemaVersion = 4`
```

```text
2026-04-25 v6/v7 runtime read
|- v6 deferred-trace seam -> best worker cut so far, but still default-off groundwork only
|- v7 visual restoration  -> frozen live
|- h5 off/reduced/full    -> all pass on the lived-in save
|- r4 full-path           -> green
|- v3 parity              -> green
|- r5 note                -> control/candidate both fail the same guard-only fixture, so `r5` was not used as the v7 differentiator
`- next active closure step -> c9 outside-session triage
```

```text
2026-04-26 c8 closeout packet
|- full pack  -> qa_logs/session_captures/v8a-runtime-proof/2026-04-26T02-19-35-305Z
|- diff       -> qa_logs/session_captures/v8a-runtime-proof/diff-vs-v0-full-baseline.md
|- calm       -> render 24.58 -> 12.14 | update 24.17 -> 9.20
|- shell      -> render 32.08 -> 12.55 | update 25.73 -> 7.01
|- travel     -> render 35.08 -> 13.38 | update 25.54 -> 12.82
|- battle     -> render 43.52 -> 22.70 | update 36.98 -> 16.98
|- soak40     -> render 27.56 -> 13.10 | update 26.34 -> 6.94
|- pack totals -> warnings 0 | errors 0 | freezeSuspects 4 | telemetryWarnings 6914
|- soak gate  -> warnings 0 | errors 0 | freezeSuspects 0
|- no-flag hold -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json -> pass
`- honest read -> c8 is now frozen honestly; the next active closure step is c9 outside-session triage
```

```text
remaining active stack
|- runtime child track       -> live through c8
|  `- next runtime gate      -> c10 / v8b after c9 outside-session triage
|- spatial child track       -> live through s8
|- social child track        -> live through n8
`- public-share parent track -> active at r4
   `- r5 is now gated mainly on outside evidence plus the later full-stack proof
```

```text
done does not mean
|- "the game systems exist"
`- "the old boards are frozen"

done does mean
|- runtime track closed through v8a / v8b, with v9 explicitly decided
|- spatial track frozen honestly at s8
|- shared save-schema signoff recorded for v7 / s7 / n8
`- public-share track closed through r5
```

### Status Key

```text
live
|- closure step is frozen honestly

active
|- current closure work

queued
|- next in exact order

gated
`- cannot close honestly until upstream proof exists
```

### Completion Shape

```text
completion ladder
|- c1 runtime v3 closure
|- c2 spatial s8 proof freeze
|- c3 runtime v4 cadence split
|- c4 runtime v5 composite reduction
|- c5 runtime v6 worker offload
|- c6 runtime v7 visual restoration
|- c7 shared save-schema signoff
|- c8 runtime-only proof (v8a)
|- c9 outside-session triage closure (r4)
|- c10 full-stack proof (v8b)
|- c11 public alpha freeze (r5)
`- c12 renderer escalation decision (v9, only if still needed)
```

### Exact Order

| Step | Status | Consumes | Produces | Honest gate |
| --- | --- | --- | --- | --- |
| `c1 runtime v3 closure` | `live` | runtime `v3` live narrowed slice, parity proof, cache attribution | honest close or rollback note for sharp-creature restoration path | runtime `v3` closes without reopening freeze symptoms or visual drift |
| `c2 spatial s8 proof freeze` | `live` | spatial `s0`-`s7` already live | frozen spatial board on the real save | travel, placement, structure, save, and longer lived-in play stay honest on the lived-in save |
| `c3 runtime v4 cadence split` | `live` | `c1`, `n1`, [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) | smooth visual frame cadence with deep-sim staggering | retained 18/36/30 cadence slice is banked and parity-safe |
| `c4 runtime v5 composite reduction` | `live` | `c2`, `c3`, spatial `s3` already live | materially cheaper composite-heavy lanes | render/composite costs dropped enough to clear `h5` while preserving readability, battle presentation, and spatial truth |
| `c5 runtime v6 worker offload` | `live` | `c3`, `c4` | reduced main-thread contention for non-render work | improved default-off groundwork is landed honestly, even if it is not promoted into the live runtime shape |
| `c6 runtime v7 visual restoration` | `live` | `c1` through `c5` | trails + high-fidelity restoration on a smoother runtime | restored visuals hold on the real lived-in save |
| `c7 shared save-schema signoff` | `live` | `c6`, spatial `s7`, social `n8`, [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md) | one explicit cross-track migration signoff | runtime `v7`, spatial `s7`, and social `n8` agree on the shared schema state |
| `c8 runtime-only proof (v8a)` | `live` | `c6`, `c7` | clean runtime-only proof on the frozen lived-in save | all required runtime proof lanes hold before outside-proof mixing begins |
| `c9 outside-session triage closure (r4)` | `active` | `c8`, public-share `r4` intake path | outside evidence plus fixed top blockers | real outside findings are triaged, fixed, or honestly documented |
| `c10 full-stack proof (v8b)` | `gated` | `c7`, `c8`, `c9` | migrated-save proof after runtime + spatial + social + triage all coexist | full-stack proof stays green on the migrated lived-in save |
| `c11 public alpha freeze (r5)` | `gated` | `c9`, `c10` | public-share-ready alpha baseline | docs, launch path, known-issues framing, and proof stack all align |
| `c12 renderer escalation decision (v9)` | `gated` | `c10`, `c11` | explicit no-escalation note or a separately opened renderer program | renderer escalation is only opened if the proven post-v8b build still misses the runtime target |

### Parallel-Safe Window

```text
2026-04-25 active overlap
|- c8 runtime-only proof
`- public-share r4 intake / evidence loop
```

```text
safe overlap
|- c8 runtime-only proof
`- public-share r4 intake / evidence loop
   `- safe because the spatial/social contracts are now frozen and the remaining runtime work is proof, not new geometry or social schema churn
```

```text
not safe to skip
|- c3 before c5
|  `- cadence split defines what is worth moving off-thread
|- c6 before c8
|  `- runtime-only proof should judge the intended restored visual state
|- c7 before c8 / c10
|  `- proof cannot pretend the shared save contract is still unsettled
`- c9 before c11
   `- public alpha cannot freeze before real outside blockers are triaged
```

### Finish Conditions

```text
this board closes only when
|- runtime child board is no longer active
|- spatial child board is frozen clean at s8
|- social child board remains live-clean through n8 and is jointly signed at c7
|- public-share board is closed through r5
`- v9 is either explicitly declined or promoted into its own new program
```

### Immediate Next Moves

```text
2026-04-25 next moves
|- keep c2 frozen -> spatial board stays live/frozen unless a later migrated-save proof surfaces a real contradiction
|- keep c7 frozen -> shared save-schema signoff now stays at `schemaVersion = 4` unless a new joint migration is explicitly opened
`- continue c9 -> run the outside-session intake loop and promote any real blocker into `PLAYTEST-TRIAGE-LOG.md`
```

```text
right now
|- keep c2 frozen -> the spatial board/unit/corridor contract is now live through s8
|- keep c4 frozen -> the runtime composite/present/HUD stack is now live through v5
|- keep c6 frozen -> sharp creatures are live again and trails are back as off/reduced/full with off shipped by default
|- keep c7 frozen -> schemaVersion 4 is now the signed shared save contract for runtime/spatial/social
`- continue c9 -> close the first real outside-session triage loop before `v8b` full-stack proof
```

## Game Success Criteria

_Source: `docs/GAME-SUCCESS-CRITERIA.md`_

### Purpose

This doc defines what "success" actually means for the current game.

It exists so later reviews do not drift into:

```text
"the system exists, so it must be done"
```

or:

```text
"the audit passed once, so the player experience must already be ideal"
```

Use this with:

- [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)

### Success Stack

```text
╔════════════════════════════ Success Stack ════════════════════════════╗
║ a section is only "done" when all five layers hold                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║ 1. mechanical truth   │ the underlying simulation behaves correctly  ║
║ 2. visual legibility  │ the player can read what the simulation says ║
║ 3. behavioral impact  │ the truth changes later behavior             ║
║ 4. persistence        │ the truth survives save/load and migration   ║
║ 5. runtime safety     │ the shipped-default build remains stable     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Social Realism Calibration

```text
bad target
└─ "indistinguishable from real humans"

actual target
└─ "a believable butterfly society with human-legible emotions,
   memory, social texture, and consequences"
```

That means the social goal is not perfect human mimicry.
It is readable, distinct, consequential inner life.

### Section Criteria

#### 1. Spatial / Pseudo-3D

```text
north star
└─ one canonical spatial truth for position, footprint, support,
   carry, shelter, route, and visibility
```

Success means:

- every entity family reads from the same board/unit/occupancy model
- no silent overlap except intentional occupancy-band cases
- what the player sees matches what the simulation thinks happened
- save/load rebuilds the same spatial state

Failure signs:

- objects clip or overlap even though logic says they should not
- doorway/corridor movement disagrees with rendered cover/path geometry
- one entity family uses a private positioning shortcut

Acceptance proof:

- spatial audit green
- route/travel audit green
- lived-in save roundtrip green
- manual acceptance pass on the lived-in save

#### 2. Blocks / Flowers / Building

```text
north star
└─ blocks feel like real matter in the garden, not decorative props
```

Success means:

- placement either resolves safely or rejects cleanly
- stacks have explicit support and settle correctly
- flowers relocate cleanly before conflicting placements
- butterflies can carry, place, stack, and build without visual contradiction
- structure outcomes are understandable to the player

Failure signs:

- floating blocks
- orphaned support
- overlap during placement
- flowers ignored or clipped through
- building only works in harnesses but looks wrong in live play

Acceptance proof:

- carry/stack/support audit green
- block visual audit green
- live build-sequence acceptance pass green

#### 3. Movement / Travel / Space Use

```text
north star
└─ butterflies inhabit the board naturally instead of snapping through it
```

Success means:

- roaming respects real movement bounds
- departures and arrivals use believable doorway/corridor routes
- behind-cover travel reads correctly
- movement style reflects current state: calm, social, scared, carrying, building

Failure signs:

- zooming from deep map positions
- early turns into doorways
- travel that reads like teleport choreography
- movement that ignores obstacle/support context

Acceptance proof:

- movement stability green
- zone-transition green
- longer free-play movement review green

#### 4. Social Relationships / Emotion

```text
north star
└─ butterflies feel distinct, emotionally readable, and history-shaped
```

Success means:

- each butterfly has stable tendencies plus situational emotion
- relationships accumulate specific history, not just generic warmth
- dialogue changes later belonging, confidence, relief, attachment, or avoidance
- group rhythms emerge and alter behavior
- inspect/feed summaries match authoritative life-sim truth

Failure signs:

- everyone feels interchangeable
- feelings exist only as hidden numbers
- pair labels change but later behavior does not
- presentation summaries contradict the underlying state

Acceptance proof:

- communication grounding green
- social depth / follow-through green
- long free-play society review green

#### 5. Dialogue / Conversation

```text
north star
└─ conversation feels contextual, relational, and consequential
```

Success means:

- talk varies by personality, relation, place, motive, and pressure
- warnings are one slice of culture, not the whole culture
- courtship, teaching, comfort, praise, tension, repair, and curiosity all appear
- the colony sounds like individuals, not template spam
- talking leaves residue, lessons, follow-through, or avoidance

Failure signs:

- repetitive warning/acknowledge loops
- same voice regardless of butterfly or situation
- pretty lines with no later impact

Acceptance proof:

- dialogue audits green
- free-play repetition review green
- partner/group consequence review green

#### 6. Neural / Scoring Layer

```text
north star
└─ ML helps choose grounded actions; it never owns durable truth
```

Success means:

- scores improve action selection and nuance
- life-sim, memory, and relationship truth remain authoritative
- stale or missing ML output fails soft
- behavior is more coherent with scoring active than inactive

Failure signs:

- ML invents emotions, memories, or bonds
- social behavior becomes opaque or contradictory
- the system only "looks smarter" because labels changed

Acceptance proof:

- ML contract holds
- neural social scoring audit green
- ML-on versus ML-off acceptance read favors ML-on

#### 7. Runtime / Visual Quality

```text
north star
└─ the rich look survives without freezes, crashes, or art gutting
```

Success means:

- shipped defaults run smoothly on a lived-in save
- no black-screen collapse or save-quota stall
- high-resolution creatures are back safely
- trails exist as off, reduced, and full
- optimizations preserve the intended visual identity

Failure signs:

- smoothness only comes from making the game uglier
- long sessions still choke
- synthetic passes hide bad live play

Acceptance proof:

- runtime-only proof green
- migrated-save proof green
- outside-session evidence green

#### 8. Persistence / Continuity

```text
north star
└─ long-running lives stay intact across refreshes, migrations, and upgrades
```

Success means:

- identity, lineage, memories, and relationships survive
- spatial truth roundtrips correctly
- migrations do not flatten individuality
- old saves restore into new truth without hidden drift

Failure signs:

- hybrids lose names/history
- stale refresh silently creates a fresh world
- inspect/feed truth changes after reload for no real reason

Acceptance proof:

- save-schema signoff recorded
- runtime/spatial/social continuity audits green
- migrated-save full-stack proof green

### Acceptance Bar

The Stage A and Stage B closure language repeatedly references "lived-in",
"long free play", and "ordinary play" without defining what counts. Without
a defined bar, those steps cannot honestly close.

The acceptance bar for any "lived-in" / "free-play" / "ordinary play"
acceptance step is:

```text
session shape
├─ duration: at least one continuous 20-minute free-play session
├─ observer: a single human reviewer, not an automated harness
├─ entry state: a real lived-in save, not a fresh seed
└─ closure: written signoff against a named rubric
```

Per-step rubric requirements:

```text
g1 spatial acceptance sweep
└─ rubric covers butterflies, flowers, blocks, eggs, cocoons,
   caterpillars, carry/cover/overhead readability, doorway travel

g2 live building behavior proof
└─ rubric covers choose/carry/place/relocate/stack/revisit cycles
   under ordinary motivation, not scripted placement, and asks whether
   those cycles produce a readable colony-shaped structure change

g3 movement naturalness acceptance
└─ rubric covers calm wander, social linger, doorway travel,
   carrying, threat/scared, recovery

g4 ambient social breadth
└─ rubric covers companionship, praise, teasing, repair, tension,
   affection, curiosity, frequency targets per session

g5 dialogue naturalness + repetition pressure
└─ rubric covers casualness, repetition, topic breadth, voice register,
   absence of system-authored tone

g6 ML value proof
└─ rubric covers coherence delta AND ML-cadence cost justification
```

Why this bar exists:

```text
why
├─ a 30-second audit "long-running save" pass is not lived-in proof
├─ scenario harnesses prove mechanics, not breadth
├─ "feels right" without a rubric drifts under reviewer fatigue
└─ a defined bar lets us honestly say "this is closed" or "this is not"
```

This bar is a one-time precondition (`g0-bar`) for closing g1-g5.
g6 absorbs the cost-vs-value clause separately.

### Final Rule

```text
not done
├─ because the architecture exists
├─ because one audit lane passed once
└─ because the doc sounds complete

done
├─ because the mechanic is right
├─ because the player can read it
├─ because it changes later behavior
├─ because it survives persistence
└─ because it holds at shipped defaults
```

## Current-State Gap Assessment

_Source: `docs/CURRENT-STATE-GAP-ASSESSMENT.md`_

### Purpose

This doc compares the current live build against
[GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md).

It answers:

```text
what is already aligned?
what is only partially aligned?
what still blocks "success" for each section?
```

### Current Snapshot

```text
╔════════════════════════════ Current Read ═════════════════════════════╗
║ 3D / spatial board truth        │ mostly aligned                     ║
║ blocks / flowers / support      │ mostly aligned                     ║
║ movement / travel               │ mostly aligned                     ║
║ social relationships / emotion  │ partially aligned                  ║
║ dialogue / conversation         │ partially aligned                  ║
║ neural / scoring layer          │ partially aligned                  ║
║ runtime / visual quality        │ partially aligned (was mostly)     ║
║ persistence / continuity        │ mostly aligned                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

Note: runtime / visual quality was downgraded from `mostly aligned` to
`partially aligned` by the `2026-04-26` Claude Review based on the
underlying telemetry of the h5 capture (see pillar 7 below).

Blocker taxonomy used below:

```text
primary blocker type
├─ implementation gap   -> the game still needs new or changed behavior
├─ acceptance gap       -> mechanics exist, but player-believable closure is missing
├─ proof gap            -> stronger evidence is still required before closure
└─ outside-evidence gap -> local proof is stronger than outside-session proof
```

Status language:

```text
aligned
└─ matches the success target closely enough that only routine proof remains

mostly aligned
└─ mechanics are strong, but acceptance-level or breadth gaps remain

partially aligned
└─ the system works, but it still misses an important part of the target feeling
```

### Goal-by-Goal Read

#### 1. Spatial / Pseudo-3D

```text
current read
└─ mostly aligned
```

Strongest proof:

- [a4 spatial truth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-26T03-59-40-141Z/report.json) -> `pass`
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) -> `pass`
- [h5 long-running save smoothness audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T03-59-40-141Z/report.json) -> `pass`

What now lines up:

- one shared focused-garden placement region is live
- physics and structure are the authoritative spatial owners
- save/load rebuilds widened-board spatial truth correctly
- doorway/corridor travel is green in the audited route lanes

What still does not line up fully:

- this is mechanically unified, but not yet acceptance-closed as a fully legible pseudo-3D illusion in all lived-in scenarios
- current proof is strongest for butterflies, blocks, and route corridors; it is thinner for broader mixed-stage/entity visual acceptance

Concrete blockers:

- local companion proof now exists in [G1-SPATIAL-ACCEPTANCE-SWEEP.md](./G1-SPATIAL-ACCEPTANCE-SWEEP.md), but no human `g0-bar` signoff is recorded yet
- no explicit acceptance lane for eggs/cocoons/caterpillars plus carry/cover in one longer free-play review

Type of remaining work:

```text
primary: acceptance gap
secondary: proof gap
not a core architecture gap
```

#### 2. Blocks / Flowers / Building

```text
current read
└─ mostly aligned
```

Strongest proof:

- [b4 carry/stack physics audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/b4_carry_stack_physics_audit/2026-04-26T04-01-21-764Z/report.json) -> `pass`
- [r7 block visual audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r7_block_visual_audit/2026-04-26T04-00-43-069Z/report.json) -> `pass`

What now lines up:

- stacked placement routes through physics
- invalid placements normalize to safe targets
- flower conflicts relocate before block placement
- unsupported stacks settle instead of persisting broken support states

What still does not line up fully:

- the game proves mechanical correctness better than it proves rich autonomous building behavior
- we do not yet have a strong acceptance pass showing butterflies building meaningful multi-step structures under ordinary free play

Concrete blockers:

- the first guided lived-in proof lane now exists in [G2-LIVE-BUILDING-BEHAVIOR-PROOF.md](./G2-LIVE-BUILDING-BEHAVIOR-PROOF.md), but uncontrolled free-play acceptance is still missing
- no longer-form manual review of carry -> place -> revisit structure in ordinary play with broader colony-shaped richness judgment

Type of remaining work:

```text
primary: acceptance gap
secondary: implementation gap (autonomous-build richness only)
not a placement-correctness gap
```

#### 3. Movement / Travel / Space Use

```text
current read
└─ mostly aligned
```

Strongest proof:

- [r1 movement stability audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r1_movement_stability_audit/2026-04-22T20-10-54-483Z/report.json) -> `pass`
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) -> `pass`
- [a6 live dispersal audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a6_live_dispersal_audit/2026-04-24T02-22-07-620Z/report.json) -> `warn`

What now lines up:

- movement bounds are stable
- corridor-owned travel is green
- live dispersal steps all pass

What still does not line up fully:

- the remaining `a6` warn is render-tooling noise, not a failed movement step
- we still need a stronger acceptance read on movement naturalness, not just movement correctness

Concrete blockers:

- local companion proof now exists in [G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md](./G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md), but no human `g0-bar` grace/readability signoff is recorded yet
- no recent manual capture review focused only on naturalness of movement style across calm, social, scared, and carrying states

Type of remaining work:

```text
primary: acceptance gap
secondary: proof gap
not a route-correctness gap
```

#### 4. Social Relationships / Emotion

```text
current read
└─ partially aligned
```

Strongest proof:

- [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-26T17-00-28-158Z/report.json) -> `pass`
- [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-26T17-01-36-382Z/report.json) -> `pass`
- [e4 social ecology audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/e4_social_ecology_audit/2026-04-26T04-04-50-293Z/report.json) -> `pass`
- [lifesim expression audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/lifesim_expression_audit/2026-04-26T16-58-12-269Z/report.json) -> `pass`

What now lines up:

- social grounding matches life-sim truth
- pair texture, group tone, and follow-through are real
- emotion/resource/threat expression now surfaces correctly

What still does not line up fully:

- the system is now structurally alive, but the target is a believable society, not only green scenario audits
- current proof is still scenario-rich and curated; it does not yet prove enough long free-play social breadth
- much of the richness is easiest to confirm in inspect/feed/debug, not always ambiently through ordinary play alone

Concrete blockers:

- no long-session society-breadth acceptance pass
- no explicit acceptance metric for distinct recurring social arcs over time
- ambient emotional readability may still lag behind underlying truth in ordinary player observation

Type of remaining work:

```text
primary: acceptance gap
secondary: implementation gap (ambient surfacing / breadth)
tertiary: proof gap
not a core ownership gap
```

#### 5. Dialogue / Conversation

```text
current read
└─ partially aligned
```

Strongest proof:

- [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-26T17-00-28-158Z/report.json) -> `pass`
- [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-26T17-01-36-382Z/report.json) -> `pass`

What now lines up:

- dialogue is grounded
- voice band/register contract is working
- dialogue can now change later behavior and relationship state

What still does not line up fully:

- the colony is more varied than before, but not yet acceptance-closed as consistently natural, casual, and socially broad
- current lines can still read as system-authored in style even when the logic is correct
- long free play may still expose repetition or narrow phrasing that scenario audits do not punish hard enough

Concrete blockers:

- no long-form repetition/naturalness acceptance sweep
- no explicit topic-breadth target for ordinary ambient conversation
- no manual proof that companionship, teasing, praise, repair, flirtation, tension, and curiosity all appear often enough in uncontrolled play

Type of remaining work:

```text
primary: implementation gap (content/style breadth)
secondary: acceptance gap
not a grounding or follow-through bug
```

#### 6. Neural / Scoring Layer

```text
current read
└─ partially aligned
```

Strongest proof:

- [n6 neural social scoring audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/n6_neural_social_scoring_audit/2026-04-26T04-03-47-795Z/report.json) -> `pass`

What now lines up:

- ML scoring is bounded by the life-sim contract
- it is using richer social features
- it helps weight seek/avoid/imitate/protect style behavior

What still does not line up fully:

- we can prove the scorer is legal and useful in targeted scenarios
- we cannot yet prove strongly enough that ML-on creates a noticeably
  more believable society in longer free play
- the ML cadence is the largest update contributor in the h5 capture
  (`37.27ms` for `foundation.mlCadenceIntervalFrames`), which makes ML's
  runtime cost a real factor; value alone is not sufficient justification
  if that cost is not paid back in lived-in coherence

Concrete blockers:

- no dedicated ML-on versus ML-off free-play acceptance comparison
- no explicit value proof beyond targeted scenario scoring
- no cost-vs-value reconciliation for the ML cadence's update budget

Type of remaining work:

```text
primary: proof gap
secondary: implementation gap (cost-vs-value if ML remains expensive)
not an ownership-boundary gap
```

#### 7. Runtime / Visual Quality

```text
current read
└─ partially aligned (downgraded by Claude Review on 2026-04-26)
```

Strongest proof:

- [h5 long-running save smoothness audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T03-59-40-141Z/report.json) -> `pass`
- `v8a` full runtime-only packet on `2026-04-26`

What now lines up:

- local runtime-only proof is green at the gate-pass level
- rich visuals are restored locally
- high-resolution creatures and trail presets are back

What still does not line up fully:

- h5 currently *passes* its gate but underneath reports
  `pressureTier: critical`, `runtimeIssueCount: 92` (all
  `cadence-budget-overrun`), `lagCategory: simulation-dominant`,
  `peakHeapUsedMB: 159.26`, and `p99FrameMs: 37.8` (>2 frames at 60fps)
- the h5 audit duration is 30 seconds; the heap milestones beyond
  `tenSeconds` are all null, so the "long-running" label is not earned
- `foundation.mlCadenceIntervalFrames` is the top update contributor at
  `37.27ms`, which makes the ML scorer's runtime cost a real risk and not
  only its value (covered separately in pillar 6)
- runtime success is not fully finished until `v8b` full-stack proof and
  outside-session evidence close
- runtime self audit still carries noisy warning-level console output
- the battle lane remains a watch item in the `v8a` packet even though
  the local proof is frozen live
- a6 dispersal logs 56 identical Canvas2D `willReadFrequently` warnings
  per run; treating that volume as pure tooling noise is generous
- the refreshed composed benchmark packet on `56c9a4f` is healthier in the
  reality lane but still exposes real local implementation gaps:
  - scattered `single-zone-122` first landed at `102.8ms p50` / `52.43ms avg update`
  - after the internal structure-query no-clone cut, it now lands at
    `89.4ms p50` / `43.77ms avg update`, which is much closer to the scenario
    note's `83ms p50`
  - the dense-flower direct-present gate then moved scattered `single-zone-122`
    again to `88.4ms p50` / `40.84ms avg update`
  - the communication-maintenance + decision-trace cache follow-up then moved
    scattered `single-zone-122` again to `81.1ms p50` / `36.62ms avg update`
  - the follow-up structure-system frame-local runtime caches then held
    scattered `single-zone-122` at `81.3ms p50` / `39.27ms avg update`
  - `single-zone-200` also dropped again to `86.37ms avg update`, then
    `81.39ms avg update`, so the old physics-sync cliff is no longer the main
    story there
  - pressure-gated crowd/cursor checks plus a critical communication cadence
    follow-up then moved `single-zone-200` again to `80.87ms avg update` /
    `134.0ms p50`
  - the same retained follow-up moved scattered `single-zone-122` to
    `34.71ms avg update` / `74.7ms p50`, leaving it well below the old
    `83ms p50` note
  - `block-carry-active` was the strongest local blocker, but it is now
    materially repaired at `30.47ms avg update` / `73.1ms p95`
  - `flower-feed-storm` was the remaining stronger local hotspot, but the new
    dense-flower gate repairs it to `63.95ms avg render` / `98.2ms p50`, and it
    now holds at `61.31ms avg render` / `88.7ms p50` after the communication/runtime cuts
  - the new `physics.*` stage fields proved that the old carry-lane cliff was
    driven by clone-heavy structure query work, not an irreducible opaque
    physics budget
  - the new frame-local structure caches prove that repeated same-frame
    collision and spatial-context queries were still a real stress-lane tax
  - follow-up social guardrails still pass after the communication maintenance
    cut (`r6` and `f5/f6`)
  - follow-up spatial/build guardrails also still pass after the structure
    runtime-cache cut (`a4` and `b4`)
  - follow-up social and movement guardrails still pass after the pressure-gated
    crowd/cursor and communication-cadence cut (`r6`, `f5/f6`, and `r1`)

Concrete blockers:

- a real long-session h5 (sixtySeconds + tenMinutes heap milestones
  populated, cadence overruns under control) is not yet captured
- outside-session proof is still open
- full-stack migrated-save runtime proof is still open
- warning-noise cleanup is not yet fully closed
- ML cadence cost is not yet justified (gates on g6)
- the composed benchmark packet now points to a live runtime implementation gap
  in the remaining composed lanes:
  - `single-zone-200` -> smaller but still real above-real-play density stress lane,
    now most visibly led by composite / drawImage tail plus residual butterfly update
  - `flower-feed-storm` -> repaired watch lane that should stay green during
    later stress-lane work
  - `block-carry-active` -> repaired watch lane that should stay green during
    later stress-lane work
  - `single-zone-122` -> now locally below the old `83ms p50` note, so it is no
    longer an active blocker unless we choose to chase extra margin

Type of remaining work:

```text
primary: implementation gap
secondary: proof gap
tertiary: outside-evidence gap
not a save/ownership emergency gap, but stronger than gate-pass runtime evidence
```

#### 8. Persistence / Continuity

```text
current read
└─ mostly aligned
```

Strongest proof:

- shared save-schema signoff at `schemaVersion = 4`
- spatial save migration green
- social save continuity green

What now lines up:

- identity, relationships, and spatial truth survive current local proof lanes
- overload recovery no longer forces fresh-world wipes

What still does not line up fully:

- continuity is locally strong, but the final migrated-save cross-track proof is still not frozen
- outside evidence on older/lived-in saves is still thinner than the local proof stack

Concrete blockers:

- `v8b` full-stack migrated-save proof still open
- outside-session save continuity evidence still open

Type of remaining work:

```text
primary: proof gap
secondary: outside-evidence gap
not a current migration-contract gap
```

### Highest-Value Remaining Gaps

```text
top remaining mismatches
├─ runtime stress-lane cost is still above the new composed target
│  ├─ single-zone-200 composite / drawImage tail
│  ├─ single-zone-200 residual butterfly-update pressure
│  └─ residual structure-query misses after the new frame-local caches
├─ social/emotional breadth is real but not yet acceptance-closed
├─ dialogue naturalness and ambient variety are still under-proven
├─ autonomous building behavior is under-proven compared with placement correctness
├─ ML value is proven in scenarios more than in long free play
└─ persistence/public-share still need v8b + outside-session closure
```

### What This Means

```text
good news
├─ the current build is no longer failing at the foundation level
├─ the pseudo-3D / spatial contract is substantially healthier
├─ blocks/flowers/support are mechanically stable
└─ the social system is no longer just warning spam plus acknowledgements

honest next step
└─ stop treating every remaining problem like a core architecture bug
   and split the work cleanly into:
   1. acceptance proof
   2. social/dialect breadth
   3. behavior richness
   4. composed-lane runtime hotspot diagnosis
   5. final outside/full-stack closure
```

## Goal-Alignment Implementation Plan

_Source: `docs/GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md`_

### Purpose

This plan turns the remaining mismatches in
[CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
into one clean implementation ladder.

It does not replace the frozen child boards.
It tells us what to reopen, what to prove, and what to leave alone.

### Program Shape

```text
╔════════════════════════ Goal Alignment Ladder ════════════════════════╗
║ A. acceptance closure on already-strong systems                      ║
║ B. social believability deepening on partially aligned systems       ║
║ C. final full-stack / outside-proof closure                          ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Non-Negotiables

```text
always preserve
├─ do not reopen green mechanics without a named gap
├─ do not degrade visuals to make later proof easier
├─ do not blur life-sim ownership just to get nicer dialogue
├─ do not let ML own durable feelings, memories, or bonds
└─ do not wipe long-running saves to simplify acceptance work
```

### g0-bar Precondition

Before any of `g1`-`g5` can close, the acceptance-bar definition in
[GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md#acceptance-bar)
must be referenced as the closure rubric. This is a one-time precondition
added by the `2026-04-26` Claude Review.

```text
g0-bar
├─ defines what counts as a "lived-in" / "free-play" / "ordinary play"
│  acceptance session
├─ duration, observer, entry-state, signoff format
└─ one rubric per Stage A/B step
```

Without `g0-bar`, "lived-in" closure is subjective and prone to
reviewer-fatigue drift.

### Runtime Harness Rule

For any runtime-facing change or runtime-facing closure claim, the composed
benchmark harness is now the local proof owner.

```text
runtime benchmark routing
|- reality baseline    -> single-zone-122
|- stress baseline     -> single-zone-200
|- block lane          -> block-carry-active
|- flower lane         -> flower-feed-storm
|- scaling only        -> butterflies-100 / 200 / 400
`- deep diagnosis      -> rerun the heaviest failing composed lane with --profile
```

Synthetic `butterflies-N` sweeps remain useful, but they are no longer the
primary answer to "did this help the real game?"

### Exact Ladder

#### `g1 spatial acceptance sweep`

```text
goal
└─ turn "mechanically unified" into "player-legible pseudo-3D truth"
```

Outputs:

- one lived-in manual acceptance sweep covering:
  - butterflies
  - flowers
  - blocks
  - eggs/cocoons/caterpillars where relevant
  - carry/cover/overhead readability
- one concise proof note recording any remaining contradictions

Owner shape:

```text
primary owner
└─ spatial board companion proof

consumes
└─ existing a4 / r2 / h5 green lanes
```

Close when:

- no visual contradiction appears in the lived-in acceptance sweep
- or any remaining contradiction is promoted as a named blocker

Current execution note (`2026-04-26`):

- local companion proof is now green in
  [G1-SPATIAL-ACCEPTANCE-SWEEP.md](./G1-SPATIAL-ACCEPTANCE-SWEEP.md)
- formal close still waits on one human `g0-bar` lived-in signoff

#### `g2 live building behavior proof`

```text
goal
└─ prove that autonomous butterflies can build cleanly in ordinary play,
   not only in scripted placement harnesses
```

Outputs:

- a new proof lane or manual audit for:
  - choose block
  - carry block
  - relocate flower if needed
  - place block safely
  - stack or revisit structure
  - reuse or react to an earlier structure under ordinary motivation
  - produce a visible colony-shaped change, not only one legal placement cycle

Close when:

- autonomous build behavior looks stable, readable, and colony-shaped in free play
- at least one lived-in free-play session shows repeated choose/carry/place/revisit behavior
- any remaining thinness is promoted as a named richness blocker rather than hidden inside "placement passed"

Current execution note (`2026-04-26`):

- the first guided lived-in proof lane is now green in
  [G2-LIVE-BUILDING-BEHAVIOR-PROOF.md](./G2-LIVE-BUILDING-BEHAVIOR-PROOF.md)
- formal close still waits on an uncontrolled free-play acceptance session
  plus a broader colony-shaped richness read

#### `g3 movement naturalness acceptance`

```text
goal
└─ close the gap between "movement is correct" and
   "movement feels graceful"
```

Outputs:

- one longer free-play capture focused on movement feel
- explicit review of:
  - calm wandering
  - social linger/approach
  - doorway travel
  - carrying motion
  - threat/scared motion

Close when:

- no obvious snap/zoom/route ugliness remains in ordinary play

Current execution note (`2026-04-26`):

- local companion proof is now recorded in
  [G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md](./G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md)
- current local read is green on correctness/dispersal, with the remaining
  open item being one human `g0-bar` free-play signoff

#### `g4 ambient social breadth pass`

```text
goal
└─ make the society feel broad in free play, not only in curated scenarios
```

This is where to reopen the social track if needed.
Do not mutate the frozen `n0`-`n8` history.
Open a post-`n8` realism pass instead.

Outputs:

- wider ambient motive mix targets
- stronger group-rhythm persistence in uncontrolled play
- explicit acceptance review for companionship, praise, teasing, repair, tension, affection, curiosity

Close when:

- those modes appear frequently enough in long free play to feel like a society, not a demo harness

#### `g5 dialogue naturalness + repetition pressure`

```text
goal
└─ close the gap between grounded dialogue and naturally readable dialogue
```

Outputs:

- repetition/naturalness review rubric
- topic-breadth targets
- line-style cleanup where wording still reads too system-authored

Close when:

- the colony no longer feels dominated by a narrow phrase style in longer play

#### `g6 ML value proof`

```text
goal
└─ prove the neural/social scorer meaningfully improves the colony feel
   AND that its update cost is justified by that improvement
```

Outputs:

- ML-on versus ML-off free-play comparison
- acceptance read on:
  - coherence
  - social variety
  - follow-through quality
  - contradiction reduction
- cost-vs-value reconciliation:
  - ML cadence cost in update budget (currently top contributor in h5)
  - whether the observed coherence/variety delta justifies that cost
  - if value is real but cost is too high, recommend cadence reduction
    rather than scoring removal

Close when:

- we can honestly say the scorer helps free play, not just harnesses
- AND the update cost it consumes is paid back in lived-in coherence

#### `g7 v8b full-stack migrated-save proof`

```text
goal
└─ prove runtime + spatial + social all hold together on the migrated save
```

Outputs:

- migrated-save full-stack packet
- final continuity read across runtime, spatial, and social truth

Close when:

- `v8b` is green on the real migrated lived-in save

#### `g8 outside-session closure + public alpha freeze`

```text
goal
└─ turn local confidence into honest outside-player confidence
```

Outputs:

- real outside-session evidence
- triaged blocker list
- public-alpha freeze call or hold

Close when:

- outside evidence agrees with local proof strongly enough to close `r4` and gate `r5`

### Parallel-Safe Shape

```text
safe overlap (Stage A)
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance

safe overlap with Stage A (prep-only early-start, added by Claude Review 2026-04-26)
├─ g4-observation: begin ambient social observation now
│   └─ preparatory evidence gathering only; formal close still waits for Stage B
└─ g5-style: begin dialogue style cleanup now
    └─ preparatory style work only; formal close still waits for Stage B

then (Stage B)
├─ g4 ambient social breadth (formal close)
├─ g5 dialogue naturalness (formal close)
└─ g6 ML value proof (now includes cost-vs-value)

finally (Stage C)
├─ g7 v8b full-stack proof
└─ g8 outside-session closure
```

Why g4 and g5 may early-start:

```text
g4 needs accumulated free-play observation
└─ starting that clock during Stage A means it does not start at zero
   when Stage A closes

g5 has actionable text-style evidence today
└─ the f5/f6 audit lines themselves expose the system-authored tone the
   gap doc warns about; cleanup does not need to wait for Stage B, but
   it does not advance formal Stage B closure on its own
```

### What Not To Reopen

```text
do not reopen by default
├─ the spatial unit contract
├─ the doorway/corridor model
├─ the shared save schema
├─ local runtime-only proof
└─ the frozen n0-n8 social history
```

Reopen only if a new named contradiction appears.

### Practical Next Move

```text
start here
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance
```

Those three tell us whether the remaining 3D/build/movement gaps are real
implementation gaps or mostly acceptance gaps.

After that:

```text
if the main remaining misses are social feel
└─ promote g4 -> g5 -> g6

if the main remaining misses are only proof breadth
└─ skip directly toward g7 -> g8
```

## Goal-Alignment Review Packet

_Source: `docs/GOAL-ALIGNMENT-REVIEW-PACKET.md`_

### Purpose

This doc is the single review packet for the current "where are we now,
what still blocks success, and what should we do next?" question.

It is meant to be handable to an external reviewer without requiring them to
reconstruct intent from scattered phase notes.

Use this with:

- [GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)
- [ACTIVE-COMPLETION-BOARD.md](./ACTIVE-COMPLETION-BOARD.md)

### Review Shape

```text
╔════════════════════════ Review Packet Shape ═════════════════════════╗
║ 1. what success means                                               ║
║ 2. why success is defined that way                                  ║
║ 3. where the current game stands against that target                ║
║ 4. what still blocks alignment                                      ║
║ 5. why the next plan is ordered the way it is                       ║
║ 6. what a strong external review should challenge                   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Executive Read

```text
╔════════════════════════ Current Program Read ════════════════════════╗
║ foundation mechanics     │ substantially healthier than before       ║
║ 3D / board logic         │ mostly aligned                           ║
║ building correctness     │ mostly aligned                           ║
║ movement correctness     │ mostly aligned                           ║
║ social architecture      │ real and working                         ║
║ social believability     │ not acceptance-closed yet                ║
║ runtime local proof      │ gate-pass green, telemetry-caveated      ║
║ outside/full-stack proof │ not finished                             ║
╚═══════════════════════════════════════════════════════════════════════╝
```

The most important conclusion is:

```text
the game is no longer mainly blocked by core architecture failure
it is now mostly blocked by:
├─ acceptance-proof gaps
├─ social/dialect breadth gaps
├─ autonomous-behavior richness gaps
└─ final outside/full-stack closure
```

### Why These Success Definitions

#### The Core Reasoning

The project had drifted toward a dangerous false-positive pattern:

```text
system exists
   └─▶ one audit passes
        └─▶ assume the feature is "done"
```

That was not strong enough because it blurred together very different kinds of
"working":

- underlying mechanics being correct
- the player being able to see/read that correctness
- the system affecting later behavior instead of only labels
- the truth surviving save/load and migration
- the shipped-default runtime being stable enough to trust the feature in play

So success was deliberately defined as a five-layer stack:

```text
mechanical truth
  + visual legibility
  + behavioral impact
  + persistence
  + runtime safety
```

The reasoning was:

#### 1. Mechanical truth alone is not enough

If a system is internally correct but visually contradictory, players will
experience it as broken.

Example:

```text
logic says "supported stack"
render says "floating nonsense"
player verdict -> broken
```

#### 2. Visual readability alone is not enough

If the game surfaces nice-looking summaries or labels, but later behavior does
not actually change, the simulation feels fake.

Example:

```text
"guarded relationship"
   └─▶ but both butterflies keep behaving generically
```

#### 3. Behavior impact alone is not enough

If good behavior only exists in the current session and collapses after
refresh/load/migration, long-running lives are not sacred.

#### 4. Persistence alone is not enough

If the truth survives save/load but only under degraded visuals or runtime
stress, the feature is still not shippable.

#### 5. Runtime success alone is not enough

If the game is smooth only because the art was gutted or the life-sim was
hollowed out, it misses the project identity.

### Social Realism Calibration

One explicit wording change matters:

```text
rejected target
└─ "make them feel like real humans"

accepted target
└─ "make them feel like a believable butterfly society with
   human-legible emotions, memory, social texture, and consequences"
```

Reasoning:

- exact human mimicry is not a realistic or even fully desirable target here
- the simulation needs readable inner life and social consequence, not perfect
  human impersonation
- this framing protects the project from chasing a vague impossibly broad
  realism goal

### Success Definitions By Section

#### 1. Spatial / Pseudo-3D

```text
north star
└─ one canonical spatial truth for position, footprint, support,
   carry, shelter, route, and visibility
```

Why this is the right target:

- many of the earlier bugs were not separate bugs; they were symptoms of split
  ownership
- route geometry, support, movement bounds, and render legibility were
  disagreeing because they were not fully reading one board truth
- until one board/unit/occupancy contract existed, travel and placement fixes
  kept turning into one-off patches

Success is therefore not:

```text
"portal path looks better"
```

It is:

```text
"the player-visible pseudo-3D illusion is driven by one coherent model"
```

#### 2. Blocks / Flowers / Building

```text
north star
└─ blocks feel like real matter in the garden, not decorative props
```

Why this is the right target:

- placement correctness matters, but it is not the whole fantasy
- if blocks only pass scripted placement tests yet never produce believable
  autonomous building, the system is technically legal but experientially thin

#### 3. Movement / Travel / Space Use

```text
north star
└─ butterflies inhabit the board naturally instead of snapping through it
```

Why this is the right target:

- movement bugs were often not pure logic failures
- the major failure mode was "looks fake"
- that means correctness plus naturalness is the right acceptance bar

#### 4. Social Relationships / Emotion

```text
north star
└─ butterflies feel distinct, emotionally readable, and history-shaped
```

Why this is the right target:

- the game already had internal social machinery before the current work
- the real problem was not "no social variables exist"
- the real problem was "the society does not reliably read as alive"
- therefore the target had to include:
  - distinctness
  - readability
  - historical consequence

#### 5. Dialogue / Conversation

```text
north star
└─ conversation feels contextual, relational, and consequential
```

Why this is the right target:

- the earlier failure mode was repetitive warning/correction loops
- so the target had to go beyond "more lines"
- it had to require broader motive mix, better voice differentiation, and later
  consequence

#### 6. Neural / Scoring Layer

```text
north star
└─ ML helps choose grounded actions; it never owns durable truth
```

Why this is the right target:

- the project explicitly protects one-owner-per-truth boundaries
- if ML starts owning feelings, memory, or relationship truth, the simulation
  becomes less explainable and less durable
- so the correct success target is bounded usefulness, not magical autonomy

#### 7. Runtime / Visual Quality

```text
north star
└─ the rich look survives without freezes, crashes, or art gutting
```

Why this is the right target:

- the project explicitly rejected "solve performance by making it uglier"
- runtime success must therefore preserve:
  - high-resolution creatures
  - trails as real options
  - core sim depth

#### 8. Persistence / Continuity

```text
north star
└─ long-running lives stay intact across refreshes, migrations, and upgrades
```

Why this is the right target:

- long-running saves were treated as sacred throughout the planning layer
- any success model that allows flattening or wiping continuity is invalid for
  this project

### Current State Against Those Goals

#### Summary Table

```text
╔════════════════════════ Current State vs Goals ══════════════════════╗
║ spatial / pseudo-3D            │ mostly aligned                     ║
║ blocks / flowers / building    │ mostly aligned                     ║
║ movement / travel              │ mostly aligned                     ║
║ social relationships / emotion │ partially aligned                  ║
║ dialogue / conversation        │ partially aligned                  ║
║ neural / scoring               │ partially aligned                  ║
║ runtime / visual quality       │ partially aligned                  ║
║ persistence / continuity       │ mostly aligned                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

#### 1. Spatial / Pseudo-3D

Current read:

```text
mostly aligned
```

Why:

- [a4 spatial truth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-26T03-59-40-141Z/report.json) passed
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) passed
- widened-board save/load rebuild also passed in `a4`

Concrete proof already on disk:

- shared region is consistent across zones
- physics + structure are the spatial owners
- save/load rebuilds widened-board spatial truth correctly

What still prevents full alignment:

- this is mechanically strong, but not yet acceptance-closed as a fully
  legible pseudo-3D illusion across all lived-in play situations
- mixed-stage/entity free-play visual acceptance is still thinner than the
  scripted audits

#### 2. Blocks / Flowers / Building

Current read:

```text
mostly aligned
```

Why:

- [b4 carry/stack physics audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/b4_carry_stack_physics_audit/2026-04-26T04-01-21-764Z/report.json) passed
- [r7 block visual audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r7_block_visual_audit/2026-04-26T04-00-43-069Z/report.json) passed

Concrete proof already on disk:

- stacked placement routes through physics
- invalid placements normalize safely
- flower conflicts relocate before placement
- unsupported stacks settle safely

What still prevents full alignment:

- the project proves placement correctness better than it proves rich
  autonomous colony building
- we do not yet have strong proof of meaningful multi-step building in
  ordinary free play

#### 3. Movement / Travel / Space Use

Current read:

```text
mostly aligned
```

Why:

- [r1 movement stability audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r1_movement_stability_audit/2026-04-22T20-10-54-483Z/report.json) passed
- [r2 zone transition audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r2_zone_transition_audit/2026-04-26T04-00-43-060Z/report.json) passed
- [a6 live dispersal audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a6_live_dispersal_audit/2026-04-24T02-22-07-620Z/report.json) only warns from canvas readback noise, not a failed movement step

What still prevents full alignment:

- movement is now mostly proven correct
- it is not yet fully acceptance-proven as graceful in long ordinary play

#### 4. Social Relationships / Emotion

Current read:

```text
partially aligned
```

Why:

- [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-26T17-00-28-158Z/report.json) passed
- [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-26T17-01-36-382Z/report.json) passed
- [e4 social ecology audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/e4_social_ecology_audit/2026-04-26T04-04-50-293Z/report.json) passed
- [lifesim expression audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/lifesim_expression_audit/2026-04-26T16-58-12-269Z/report.json) passed

What is genuinely working now:

- pair texture is real
- group tone is real
- follow-through is real
- emotion/resource/threat surfacing is real

What still prevents full alignment:

- long free-play social breadth is under-proven
- ambient emotional readability may still lag behind underlying truth
- much of the richness is easiest to verify in inspect/feed/debug rather than
  naturally reading during ordinary play

#### 5. Dialogue / Conversation

Current read:

```text
partially aligned
```

Why:

- dialogue is grounded
- voice band/register contract is working
- dialogue changes later relationship/life-sim state

What still prevents full alignment:

- the colony is more varied than before, but not yet acceptance-closed as
  consistently natural and broad in uncontrolled play
- wording may still feel system-authored in some longer runs
- topic breadth and repetition tolerance are still under-proven

#### 6. Neural / Scoring Layer

Current read:

```text
partially aligned
```

Why:

- [n6 neural social scoring audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/n6_neural_social_scoring_audit/2026-04-26T04-03-47-795Z/report.json) passed

What is genuinely working now:

- ML scoring is bounded correctly
- it helps targeted seek/avoid/imitate/protect behavior

What still prevents full alignment:

- the value proof is still stronger in scenarios than in long free play
- we do not yet have a clear ML-on versus ML-off acceptance read for colony
  believability

#### 7. Runtime / Visual Quality

Current read:

```text
mostly aligned
```

Why:

- [h5 long-running save smoothness audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T03-59-40-141Z/report.json) passed
- `v8a` runtime-only proof is frozen live

What is genuinely working now:

- local runtime-only proof is strong
- rich visuals are restored locally
- high-resolution creatures and trails are back in the intended model

What still prevents full alignment:

- `v8b` full-stack proof is still open
- outside-session proof is still open
- warning-noise cleanup is not fully finished

#### 8. Persistence / Continuity

Current read:

```text
mostly aligned
```

Why:

- shared save-schema signoff is recorded at `schemaVersion = 4`
- spatial continuity is green
- social continuity is green

What still prevents full alignment:

- final cross-track migrated-save proof is still open
- outside-session continuity evidence is still thin compared with local proof

### Main Remaining Blockers

```text
highest-value blockers
├─ no lived-in spatial acceptance sweep across all visible pseudo-3D cases
├─ no strong autonomous building proof in ordinary colony play
├─ no movement-naturalness acceptance sweep beyond correctness audits
├─ social/emotional breadth still under-proven in long free play
├─ dialogue naturalness/repetition still under-proven in long free play
├─ ML value still under-proven outside targeted scenario scoring
├─ v8b full-stack migrated-save proof still open
└─ outside-session evidence still open
```

### Planning Reasoning

#### What I Considered

I considered three competing explanations for the remaining work:

```text
option A
└─ the game is still fundamentally architecturally broken

option B
└─ the architecture is now mostly right, but the player-facing acceptance
   and breadth layers are still not proven enough

option C
└─ the architecture is right and the game is already fully done;
   only paperwork remains
```

I rejected `A` because:

- the major spatial/runtime/social audits are now green
- the prior concrete ownership and continuity failures are repaired

I rejected `C` because:

- several success targets depend on acceptance breadth, not just scenario
  correctness
- outside/full-stack proof is still unfinished
- social believability is not yet strongly proven in long free play

So the current planning assumes `B`:

```text
the game has moved out of the "core architecture emergency" phase
and into the "acceptance, breadth, and final closure" phase
```

#### Why The New Plan Starts With `g1` / `g2` / `g3`

These three come first because they answer a very important question:

```text
are the remaining 3D/build/movement misses real implementation gaps
or mostly acceptance-proof gaps?
```

If they mostly pass in manual/lived-in acceptance, then the biggest remaining
work is social breadth plus full-stack/outside closure.

If they fail, then specific spatial/build/movement implementation work should
be reopened with named contradictions rather than broad guesswork.

#### Why The Social Work Reopens Later

The social track from `n0` through `n8` is locally frozen clean.
That means we should not casually reopen it as if nothing landed.

Instead:

```text
reopen only the realism/acceptance layer
not the whole frozen social history
```

This keeps the project disciplined and preserves the already-earned social
contracts.

#### Why `v8b` and Outside Proof Stay At The End

Those are closure gates, not good exploration tools.

They should happen after:

- the acceptance sweeps
- the targeted remaining depth work

Otherwise the team risks mixing too many open questions into the final proof
packet.

### Concrete Next Plan

```text
goal-alignment ladder
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
├─ g3 movement naturalness acceptance
├─ g4 ambient social breadth pass
├─ g5 dialogue naturalness + repetition pressure
├─ g6 ML value proof
├─ g7 v8b full-stack migrated-save proof
└─ g8 outside-session closure + public alpha freeze
```

#### Stage A: acceptance closure on already-strong systems

```text
g1 -> g2 -> g3
```

Purpose:

- prove whether the remaining spatial/build/movement concerns are real
  implementation misses or mostly acceptance gaps

#### Stage B: social believability deepening

```text
g4 -> g5 -> g6
```

Purpose:

- close the gap between "green social scenarios" and
  "believable society in ordinary play"

#### Stage C: final closure

```text
g7 -> g8
```

Purpose:

- close the remaining full-stack and outside-player proof gates

### What Should Not Be Reopened By Default

```text
do not reopen by default
├─ spatial unit contract
├─ doorway/corridor model
├─ shared save schema
├─ local runtime-only proof
└─ frozen n0-n8 social history
```

Reason:

- those are currently earned truths
- reopening them without a named contradiction would create planning drift

### What A Strong Claude Review Should Challenge

An external review should pressure-test these exact questions:

```text
1. are the success criteria too strict, too weak, or correctly calibrated?
2. is "mostly aligned" versus "partially aligned" being judged honestly?
3. are any of the blocker lists still mixing acceptance gaps with true code gaps?
4. is the order g1 -> g8 the strongest one, or should some steps move?
5. are we underestimating any hidden remaining spatial/runtime/social risks?
6. are we protecting the frozen child boards enough while still allowing the
   right next realism work to reopen?
```

### Recommended Claude Review Conclusion Target

The reviewer should come back with a conclusion in this shape:

```text
plan strength
├─ structurally strong / mixed / weak
├─ why
├─ which blockers are correctly identified
├─ which blockers are missing or overstated
└─ whether the g1 -> g8 ladder should stand or be revised
```

### Bottom Line

```text
bottom line
├─ the game is no longer mainly failing at the foundation level
├─ the current architecture is strong enough to judge by acceptance goals now
├─ the biggest remaining risk is overestimating how "finished" social and
│  behavioral richness feel in ordinary play
└─ the current plan is strongest if it now focuses on acceptance, breadth,
   and final proof instead of reopening already-earned foundation work
```

### Claude Review Integration

This section records an external Claude pressure-test of the goal-alignment
plan, success criteria, gap assessment, and g1-g8 ladder. The review was
conducted on `2026-04-26` against the live planning layer and a spot-check
of the cited audit reports.

#### Review Verdict

```text
verdict
├─ structurally strong, calibration-mixed
├─ the five-layer success stack is the right framework
├─ the macro g1-g8 order is sound
├─ two pillars (runtime, neural) are graded more generously than the
│  underlying evidence supports
├─ the dialogue gap is already actionable from the f5/f6 audit content
└─ the acceptance bar itself is undefined in every Stage A/B step
```

#### Overall Strength

```text
strong
├─ five-layer success stack
├─ one-owner-per-truth invariant
├─ frozen-board reopening discipline
├─ Stage C ordering (v8b -> outside-session)
└─ non-negotiables (ML never owns durable state, no save wipes)

mixed
├─ Stage A first / Stage B second sequencing leaves social discovery
│  starting from zero when Stage A closes
└─ runtime status leans on h5, which passes the gate but reports
   pressureTier=critical and 92 cadence-budget overruns in 30s

weak
├─ "lived-in" / "ordinary play" / "long free play" closure language
│  is undefined - duration, observer, signoff format
└─ g6 ML value proof framed only as feel, not as cost-vs-value
```

#### Key Accepted Findings

```text
accepted
├─ pseudo-3D / spatial unit contract is sound; remaining work is acceptance
├─ blocks/flowers/building placement correctness is real; autonomous-build
│  behavior remains under-proven
├─ social architecture is alive; "scenario-rich, curated" self-criticism is
│  honest and matches the audit citation chain
├─ persistence locally strong; v8b + outside-session closure correctly named
├─ frozen n0-n8 / s0-s8 boards must not be reopened without a named gap
└─ Stage C ordering (g7 -> g8) is correct
```

#### Key Modified Findings

```text
modified
├─ runtime / visual quality (pillar 7)
│  └─ "mostly aligned" overstates h5's evidence; pressureTier=critical,
│     92 cadence-budget overruns, ML cadence is top update contributor
│     at 37.27ms; recommend "partially aligned" until a real long-session
│     run is captured
│
├─ dialogue / conversation (pillar 5)
│  └─ the gap is more actionable than treated; f5/f6 audit lines already
│     read as system-authored ("this part of the quiet ground is easier
│     to hold when you are beside me"); g5 style cleanup can begin in
│     Stage A without waiting for Stage B
│
├─ neural / scoring (pillar 6)
│  └─ g6 must include cost-vs-value, not only behavioral coherence;
│     if ML cadence is the top runtime contributor, ML value has to
│     justify its update cost too
│
├─ sequencing
│  └─ g4 ambient-observation and g5 style cleanup can run in parallel
│     with Stage A; the parallel-safe shape exists in the plan but is
│     not surfaced in the registry's "next move"
│
└─ acceptance bar
   └─ "lived-in" / "ordinary play" / "long free play" appear as closure
      criteria in g1, g2, g3, g4, g5 with no defined duration, observer
      role, or signoff format; treat as a one-time g0-bar precondition
      for Stage A/B closure
```

#### Key Rejected Findings

```text
rejected (i.e. this review did not find them)
├─ no evidence the spatial unit contract should be reopened
├─ no evidence the doorway/corridor model should be reopened
├─ no evidence the save schema should be reopened
├─ no evidence the n0-n8 social ladder should be reopened
└─ no evidence the success-target "believable butterfly society, not
   indistinguishable from humans" is wrong; it is correctly calibrated
```

#### Spot-Check Notes

The review spot-checked four audit reports cited as primary evidence:

- `a6 live dispersal` (`warn`) - all 3 movement steps pass; 56 identical
  Canvas2D `willReadFrequently` warnings per run; dismissal as render-tooling
  noise is defensible, but the warning *volume* is itself a perf signal
- `h5 long-running save smoothness` (`pass`) - all 7 phases pass, but
  pressureTier=critical, runtimeIssueCount=92 (all cadence-budget-overrun),
  lagCategory=simulation-dominant, peakHeapUsedMB=159.26, p99FrameMs=37.8ms,
  duration=30s with `sixtySeconds`/`tenMinutes`/`twentyMinutes`/`fortyMinutes`
  heap milestones all null; the label "long-running" is not earned
- `n6 neural social scoring` (`pass`) - clean; 4 hand-crafted social
  scenarios; the scorer responds correctly to clique-comfort, devoted-seek,
  strained-avoid, protective-warning; this is scenario evidence, not free-play
- `f5/f6 social depth` (`pass`) - structural pass; threading, intent
  selection, pair-texture accumulation, life-sim follow-through all green;
  the dialogue text itself is the evidence for the dialogue-naturalness gap

#### Effect On Other Docs

Findings are propagated as targeted edits to:

- [GAME-SUCCESS-CRITERIA.md](./GAME-SUCCESS-CRITERIA.md) - acceptance bar
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md) -
  runtime caveat, neural cost-vs-value sub-blocker
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md) -
  g6 cost-vs-value clause, g0-bar precondition, parallel-start note
- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md) - parallel-start
  surface in next-move

The frozen child boards (`n0-n8`, `s0-s8`, `v0-v8a`) are not reopened.

## G0-Bar Stage A Signoff

_Source: `docs/G0-BAR-STAGE-A-SIGNOFF.md`_

### Purpose

This is the human-review signoff sheet for Stage A goal-alignment closure:

```text
Stage A
├─ g1 spatial acceptance sweep
├─ g2 live building behavior proof
└─ g3 movement naturalness acceptance
```

Use this after a real lived-in free-play session.

It exists so Stage A does not stall at:

```text
"needs human signoff"
```

without a concrete signoff artifact.

### Session Bar

```text
g0-bar session requirements
├─ duration    -> at least 20 continuous minutes
├─ observer    -> one human reviewer
├─ entry state -> real lived-in save, not a fresh seed
└─ closure     -> written signoff against this named rubric
```

Recommended setup:

- launch with [../PLAYTEST.md](../PLAYTEST.md)
- use the same lived-in save family referenced by:
  - [G1-SPATIAL-ACCEPTANCE-SWEEP.md](./G1-SPATIAL-ACCEPTANCE-SWEEP.md)
  - [G2-LIVE-BUILDING-BEHAVIOR-PROOF.md](./G2-LIVE-BUILDING-BEHAVIOR-PROOF.md)
  - [G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md](./G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md)
- if comfortable, run `Start Capture` before play and `Export Capture` after play

### Session Info

```text
session info
├─ reviewer            :
├─ date                :
├─ branch / build      :
├─ device / browser    :
├─ session duration    :
├─ save used           :
├─ capture exported    : yes / no
└─ capture path        :
```

### G1 Spatial Acceptance Sweep

Rate each item:

- `good`
- `mixed`
- `rough`

```text
g1 rubric
├─ butterflies read at the correct height/band
├─ flowers sit/read correctly against the board
├─ blocks read correctly on ground / connected / stacked states
├─ eggs read correctly if present
├─ cocoons read correctly if present
├─ caterpillars read correctly if present
├─ carry / cover / overhead states read correctly
├─ doorway travel matches the visible corridor/path truth
└─ no obvious pseudo-3D contradiction appeared during ordinary play
```

Notes:

- strongest contradiction seen:
- where it happened:
- repeatable:

### G2 Live Building Behavior Proof

Rate each item:

- `good`
- `mixed`
- `rough`

```text
g2 rubric
├─ butterflies choose blocks under ordinary motivation
├─ carry behavior looks intentional, not glitchy
├─ placement resolves cleanly
├─ flower conflict resolution reads cleanly when it occurs
├─ stacking / support results read cleanly
├─ butterflies revisit or grow an earlier structure pocket
├─ resulting change feels colony-shaped, not random prop shuffling
└─ building is readable without opening debug truth
```

Notes:

- best building moment:
- weakest / thinnest building moment:
- did the colony create a readable structural change:

### G3 Movement Naturalness Acceptance

Rate each item:

- `good`
- `mixed`
- `rough`

```text
g3 rubric
├─ calm wandering feels natural
├─ social linger / approach feels natural
├─ doorway travel feels graceful
├─ carrying movement feels grounded
├─ threat / scared motion reads clearly
├─ recovery after pressure reads naturally
└─ no snap / zoom / route ugliness stood out in ordinary play
```

Notes:

- best movement moment:
- ugliest movement moment:
- did any motion feel like teleport choreography:

### Closure Call

```text
Stage A closure call
├─ g1 -> close / hold
├─ g2 -> close / hold
├─ g3 -> close / hold
└─ overall Stage A -> close / hold
```

If any item is `hold`, name the blocker type:

- `implementation gap`
- `acceptance gap`
- `proof gap`
- `outside-evidence gap`

Blockers:

```text
1.
├─ phase / pillar :
├─ blocker type   :
├─ what happened  :
└─ next action    :

2.
├─ phase / pillar :
├─ blocker type   :
├─ what happened  :
└─ next action    :
```

### Final Signoff

```text
final signoff
├─ reviewer:
├─ result  : Stage A accepted / Stage A held
└─ date    :
```

If accepted, copy the result into:

- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)
- [CURRENT-STATE-GAP-ASSESSMENT.md](./CURRENT-STATE-GAP-ASSESSMENT.md)
- [GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md](./GOAL-ALIGNMENT-IMPLEMENTATION-PLAN.md)

If held, promote only actionable blockers into:

- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)

## G1 Spatial Acceptance Sweep

_Source: `docs/G1-SPATIAL-ACCEPTANCE-SWEEP.md`_

### Purpose

This is the local companion proof note for `g1 spatial acceptance sweep`.

It does not replace the frozen spatial child board.
It records the current lived-in proof stack against the new goal-alignment
acceptance target.

### Current Read

```text
g1 status
├─ local companion proof   -> green
├─ named contradiction     -> none found in the current local sweep
├─ human g0-bar signoff    -> still pending
└─ mixed-stage coverage    -> thinner than butterfly/block/route coverage
```

### Lived-In Anchor

```text
anchor save
├─ source       -> qa_logs/save_exports/2026-04-22T21-44-34-355Z-v0-5-derived-real/save.json
├─ focused zone -> pool-heart
├─ butterflies  -> 28
├─ flowers      -> 141
├─ blocks       -> 108
└─ caterpillars -> 0
```

This is the same real-export family used by the current `h5` runtime proof.

### Local Proof Stack

- [a4 spatial truth audit](../qa_screenshots/a4_spatial_truth_audit/2026-04-26T22-48-07-434Z/report.json) -> `pass`
- [r1 movement stability audit](../qa_screenshots/r1_movement_stability_audit/2026-04-26T22-50-55-280Z/report.json) -> `pass`
- [r2 zone transition audit](../qa_screenshots/r2_zone_transition_audit/2026-04-26T22-48-29-637Z/report.json) -> `pass`
- [r7 block visual audit](../qa_screenshots/r7_block_visual_audit/2026-04-26T22-49-57-013Z/report.json) -> `pass`
- [b4 carry/stack physics audit](../qa_screenshots/b4_carry_stack_physics_audit/2026-04-26T22-54-31-850Z/report.json) -> `pass`

### What The Local Sweep Established

```text
locally green now
├─ board/unit/occupancy truth stays coherent
├─ doorway/corridor travel stays coherent
├─ block carry/stack/support visuals stay coherent
├─ save/load rebuild stays coherent
└─ reviewed screenshots did not surface an obvious pseudo-3D contradiction
```

Key local notes:

- the initial `b4` flower-conflict failure from
  `2026-04-26T22-48-43-915Z` did not reproduce on rerun
- direct diagnostic tracing of `gameCore`, `structureSystem`, and
  `physicsSystem` showed current live logic can preserve the requested point
  and relocate the flower cleanly
- the failure was treated as fixture-sensitive proof noise, not a stable
  spatial contradiction

### What Is Still Open

```text
still open
├─ one human g0-bar lived-in signoff
└─ broader mixed-stage visual acceptance
   ├─ eggs
   ├─ cocoons
   └─ caterpillars
```

The current lived-in anchor save is strong for butterflies, flowers, blocks,
carry, stack, and route readability.
It is not strong for egg/cocoon/caterpillar acceptance because those families
are not materially present in the anchor save.

### Honest Result

```text
g1 can be treated as
├─ locally green on the companion proof stack
├─ not blocked by a named mechanical contradiction
└─ not fully closed until a human g0-bar lived-in sweep signs off
```

## G2 Live Building Behavior Proof

_Source: `docs/G2-LIVE-BUILDING-BEHAVIOR-PROOF.md`_

### Purpose

This is the first dedicated proof note for `g2 live building behavior proof`.

Its job is to answer:

```text
can the current autonomous block-interaction path produce repeated,
readable building behavior on the lived-in save?
```

### Current Read

```text
g2 status
├─ first dedicated proof lane -> green
├─ proof shape                -> guided lived-in builder pocket
├─ full g2 closure            -> still pending
└─ next remaining gap         -> uncontrolled free-play acceptance
```

### Proof Lane

```text
lane shape
├─ source save   -> real export
├─ zone          -> focused pool-heart pocket
├─ builder state -> high object-interest / shelter-seeking bias
├─ action path   -> existing butterfly checkBlockExperimentation()
└─ guidance      -> travel leg compressed for deterministic proof
```

The proof used:

- [g2 live building behavior report](../qa_screenshots/g2_live_building_behavior_proof/2026-04-26T23-13-25-245Z/report.json) -> `pass`

Anchor save summary inside that report:

```text
lived-in source
├─ butterflies  -> 28
├─ flowers      -> 141
├─ blocks       -> 108
└─ hybridJournal -> 16
```

### What The Passing Lane Shows

#### First cycle

```text
cycle 1
├─ carry observed            -> yes
├─ placement target observed -> yes
├─ block placed              -> yes
├─ moved distance            -> 21.82px
└─ conflict outcome          -> placement retargeted legally
```

Important note:

- the staged flower conflict did not resolve by moving the flower
- instead, the autonomous builder chose a different legal placement
- the flower therefore stayed put and no longer blocked the final placement

That means:

```text
first cycle proves
├─ clean autonomous choose/carry/place
└─ clean conflict resolution

first cycle does not prove
└─ autonomous preference for flower relocation over legal retarget
```

Explicit flower relocation remains proven by
[b4 carry/stack physics audit](../qa_screenshots/b4_carry_stack_physics_audit/2026-04-26T22-54-31-850Z/report.json).

#### Second cycle

```text
cycle 2
├─ target observed           -> yes
├─ carry observed            -> yes
├─ placement target observed -> yes
├─ block placed              -> yes
├─ placed mode               -> stacked
├─ moved distance            -> 27.04px
└─ same structure pocket     -> yes
```

This is the most important part of the lane:

```text
repeated behavior proven
├─ choose block
├─ carry block
├─ place block
└─ revisit / grow the same structure pocket
```

### Honest Limits

```text
not closed yet
├─ this lane is guided, not uncontrolled free play
├─ it proves repeated building behavior in one lived-in pocket
└─ it does not yet prove broad colony-shaped building over a longer session
```

So the correct read is:

```text
g2 is now stronger than before because
├─ there is a real lived-in proof lane on disk
├─ repeated choose/carry/place/revisit behavior is demonstrated
└─ the existing autonomous system does not need a from-scratch rebuild

g2 remains open because
├─ one uncontrolled free-play acceptance session is still missing
└─ broader colony-richness judgment is still missing
```

## G3 Movement Naturalness Acceptance

_Source: `docs/G3-MOVEMENT-NATURALNESS-ACCEPTANCE.md`_

### Purpose

This is the local companion note for `g3 movement naturalness acceptance`.

It records the current movement-proof stack and the exact remaining gap
between:

```text
movement is correct
```

and:

```text
movement feels graceful in ordinary play
```

### Current Read

```text
g3 status
├─ local proof stack      -> green with one tooling warn
├─ named movement bug     -> none found in the current local sweep
├─ tooling warn           -> canvas readback noise in a6 only
└─ human g0-bar signoff   -> still pending
```

### Local Proof Stack

- [r1 movement stability audit](../qa_screenshots/r1_movement_stability_audit/2026-04-26T22-50-55-280Z/report.json) -> `pass`
- [r2 zone transition audit](../qa_screenshots/r2_zone_transition_audit/2026-04-26T22-48-29-637Z/report.json) -> `pass`
- [a6 live dispersal audit](../qa_screenshots/a6_live_dispersal_audit/2026-04-26T23-16-22-683Z/report.json) -> `warn`

### What The Current Stack Proves

```text
proven locally
├─ movement bounds stay stable
├─ physics owns final motion
├─ corridor/zone travel stays coherent
├─ dispersal spreads butterflies across sectors and homes
└─ no failed movement step surfaced in the current local runs
```

Important `a6` note:

```text
a6 warning source
└─ repeated Canvas2D getImageData readback warnings
```

That warn is tooling noise, not a failed movement/dispersal behavior step.
All three `a6` steps still pass:

- `initial-spread-baseline`
- `settled-live-dispersal`
- `home-range-personality`

### What Is Still Open

```text
still open
├─ one human g0-bar free-play signoff
└─ a stricter feel read across
   ├─ calm wandering
   ├─ social approach / linger
   ├─ carrying motion
   └─ threat / scared motion
```

The current proof stack is strongest on:

- route correctness
- dispersal spread
- final-motion ownership

It is weaker on:

- long ordinary-play grace/readability judgment
- state-by-state motion feel in one lived-in review pass

### Honest Result

```text
g3 can be treated as
├─ locally green on correctness / route / dispersal proof
├─ not blocked by a named mechanical movement contradiction
└─ not fully closed until one human free-play movement review signs off
```

## Composed Benchmark Harness Workflow

_Source: `docs/COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md`_

### Purpose

This doc defines how Papilionem should use the new deterministic benchmark
harness for runtime and hotspot work.

It does not replace human acceptance or outside-session proof.
It replaces the older habit of treating synthetic `butterflies-N` sweeps as the
main runtime truth.

### Workflow Shape

```text
+---------------- Runtime Benchmark Ladder ----------------+
| reality baseline    -> single-zone-122                  |
| stress baseline     -> single-zone-200                  |
| targeted block lane -> block-carry-active               |
| targeted flower lane-> flower-feed-storm                |
| scaling sweeps      -> butterflies-100 / 200 / 400      |
| deep diagnosis      -> rerun heaviest failing lane      |
|                        with --profile                   |
+---------------------------------------------------------+
```

### Scenario Roles

| Scenario | Role | Use |
| --- | --- | --- |
| `single-zone-122` | reality baseline | default runtime truth for current real-play density |
| `single-zone-200` | composed stress baseline | above-real-play single-zone density; use to find the cliff above the observed free-play regime |
| `block-carry-active` | targeted structure/carry lane | isolate structure, carry, perch, and block-heavy physics pressure |
| `flower-feed-storm` | targeted flower/feed lane | isolate flower density, feed loops, and crowded butterfly targeting behavior |
| `butterflies-100/200/400` | synthetic scaling sweeps | secondary evidence for O(N) / O(N^2) shape; do not use as the only runtime proof |

### Runtime Claim Rule

```text
no runtime win is accepted unless
|- single-zone-122 improves or holds
|- the relevant targeted lane improves or holds
|- single-zone-200 does not collapse unexpectedly
`- a synthetic sweep only supports, never replaces, the composed proof
```

Synthetic sweeps are still useful, but they are no longer the primary answer to
"did this help the real game?"

### Standard Runtime Loop

1. Run `single-zone-122`.
2. Run the targeted lane that matches the changed subsystem:
   - `block-carry-active` for structure/carry/block work
   - `flower-feed-storm` for flower/feed/seek-loop work
3. Run `single-zone-200`.
4. Run `butterflies-200` or `butterflies-400` only when scaling shape still matters.
5. If a composed lane is heavy, rerun the heaviest failing composed lane with `--profile`.
6. Record:
   - digest path
   - raw path
   - top breakdown fields
   - top `physics.*` fields when physics is materially present
   - whether the win/loss is reality, targeted, stress, or scaling only

### Current Harness Notes

```text
important current harness behavior
|- `single-zone-122` now sets `scatterButterfliesAcrossZone: true`
|  `- this keeps the reality lane from clustering at doorway anchors
|- physics now exports per-stage breakdown fields
|  |- syncTrackedEntitiesMs
|  |- syncButterfliesMs / syncBlocksMs / syncPruneMs
|  |- reconcileUnsupportedBlocksMs
|  |- resolveButterflyContactsMs
|  |- resolveButterflyImpulsesMs
|  `- resolveButterflyStructureCollisionsMs
`- when physics is hot, these stage fields are now the first diagnosis surface
```

### Profile Rule

Use `--profile` when:

- a composed lane is materially worse than expected
- the breakdown says one large system block is dominant
- a top-line average improved but the tail got worse

The `.cpuprofile` file is the tie-breaker for function-level diagnosis.

### What This Does Not Replace

```text
still human-only
|- g0-bar free-play signoff
|- movement grace/readability judgment
|- social realism / dialogue naturalness review
|- colony believability review
`- outside-session acceptance
```

The harness owns runtime and hotspot truth.
Humans still own feel, readability, and acceptance closure.

## Composed Benchmark Baseline 2026-04-27

_Source: `docs/COMPOSED-BENCHMARK-BASELINE-2026-04-27.md`_

### Purpose

This doc freezes the first official composed-scenario benchmark packet using the
new harness and records the current hotspot picture on branch `34d1c6d`.

Use this as the runtime reality reference until a newer composed baseline is
intentionally promoted.

### Packet Shape

```text
+---------------- Official Composed Baseline ----------------+
| branch        -> 34d1c6d                                  |
| reality lane  -> single-zone-122                          |
| stress lane   -> single-zone-200                          |
| block lane    -> block-carry-active                       |
| flower lane   -> flower-feed-storm                        |
| profile lane  -> single-zone-122                          |
+-----------------------------------------------------------+
```

### Artifact Paths

- `single-zone-122`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-34-38-157Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-34-38-157Z.raw.json)
- `single-zone-200`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-200-2026-04-27T02-36-46-723Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-200-2026-04-27T02-36-46-723Z.raw.json)
- `block-carry-active`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/block-carry-active-2026-04-27T02-42-51-641Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/block-carry-active-2026-04-27T02-42-51-641Z.raw.json)
- `flower-feed-storm`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/flower-feed-storm-2026-04-27T02-46-13-846Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/flower-feed-storm-2026-04-27T02-46-13-846Z.raw.json)
- `single-zone-122` profile lane
  - [profile digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-49-33-098Z.json)
  - [profile raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-49-33-098Z.raw.json)
  - [cpuprofile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/composed_baseline/single-zone-122-2026-04-27T02-49-33-098Z.cpuprofile)

### Baseline Summary

| Scenario | Actual composition | Avg update | Avg render | p50 frame | p95 frame | Wall / frame |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `single-zone-122` | 122 butterflies / 57 flowers / 108 blocks | `127.77ms` | `45.91ms` | `172.50ms` | `191.30ms` | `172.95ms` |
| `single-zone-200` | 200 butterflies / 69 flowers / 130 blocks | `578.11ms` | `65.51ms` | `561.10ms` | `988.30ms` | `559.38ms` |
| `block-carry-active` | 80 butterflies / 21 flowers / 199 blocks | `295.53ms` | `36.31ms` | `326.30ms` | `578.90ms` | `308.79ms` |
| `flower-feed-storm` | 80 butterflies / 129 flowers / 108 blocks | `129.82ms` | `84.94ms` | `209.40ms` | `231.60ms` | `200.12ms` |

### Immediate Read

```text
what the packet says
|- single-zone-122 is the realistic reality lane
|- single-zone-200 is the above-real-play single-zone cliff
|- block-carry-active is dominated by physics + butterfly update
`- flower-feed-storm is dominated by flowers-direct composite + butterfly update
```

### Named Contradiction

`single-zone-122` now runs far above its own scenario note:

- scenario note target: `83ms p50` / `63ms avg update`
- current non-profile run: `172.5ms p50` / `127.77ms avg update`

This is a real post-harness contradiction.
Do not treat the scenario note as still current truth until the regression is
explained or a newer validation note replaces it.

### Top Realistic Hotspots

#### Hotspot 1: butterfly crowd / flower-targeting update path

Evidence from `single-zone-122`:

- `update.entity.butterflyUpdateMs` -> `88.13ms`
- profile lane -> `122.20ms` under sampling overhead
- top profile functions:
  - `countNearbyButterflies` in [gameCore.js](/C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `countButterfliesTargetingFlower` in [gameCore.js](/C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `chooseBestFlowerForButterfly` in [gameCore.js](/C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `getDecisionPolicyChoice` in [butterfly.js](/C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
  - `checkFlowerSeeking` in [butterfly.js](/C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)

Interpretation:

- crowd checks, flower-target contention, and butterfly choice loops are now a
  first-order runtime cost in the realistic lane

#### Hotspot 2: flowers-direct composite / butterfly-present render path

Evidence from `single-zone-122`:

- `render.compositeMs` -> `37.55ms`
- `render.composite.flowersDirectPresentMs` -> `31.91ms`
- `render.entityLayerMs` -> `8.26ms`
- `render.entityFamilyButterflyMs` -> `7.84ms`
- profile lane shows repeated `drawImage` hot samples during the same window

Interpretation:

- the realistic lane is paying heavily for flower direct-present work and the
  downstream butterfly present/composite path, not just for simulation

### Stress-Lane Reads

#### `single-zone-200`

```text
dominant shape
|- butterflyUpdateMs -> 348.90
|- physicsMs         -> 164.91
|- compositeMs       -> 50.08
`- result            -> single-zone cliff is still severe
```

#### `block-carry-active`

```text
dominant shape
|- physicsMs         -> 201.32
|- butterflyUpdateMs -> 65.52
`- result            -> block-heavy worlds are physics-dominant first
```

#### `flower-feed-storm`

```text
dominant shape
|- butterflyUpdateMs      -> 94.56
|- render.compositeMs     -> 77.36
|- flowersDirectPresentMs -> 72.36
`- result                 -> flower-heavy worlds are render-heavy and feed-loop-heavy together
```

### Current Interpretation

```text
runtime truth after the new harness
|- synthetic butterflies-N sweeps understate real-play cost
|- realistic single-zone composed lanes are now the primary truth
|- current tip is not runtime-healthy in the realistic lane
`- next runtime work should diagnose hotspot 1 first, then hotspot 2
```

### Retained Reality-Lane Recovery

```text
retained local recovery stack for `single-zone-122`
|- ButterflyStore proximityCount with active-butterfly filtering
|- frame-local flower-targeting snapshot reuse
|- frame-local live-sector snapshot reuse
|- frame-local progression-container guard
|- per-zone doorway-anchor cache
|- single-pass structure collision nearest-query
`- dense-scene direct-flower fallback recalibrated to `directPresentFlowerMaxVisible = 64`
```

#### Latest retained artifacts

- [first retained beat](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/hotspot7_structure_query/single-zone-122-2026-04-27T04-17-29-446Z.json)
- [confirmation rerun](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/hotspot7_structure_query_rerun/single-zone-122-2026-04-27T04-19-20-903Z.json)

#### Current reality-lane delta vs frozen baseline

| Lane | Avg update | Avg render | p50 frame | p95 frame | p99 frame | Wall / frame |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frozen composed baseline | `127.77ms` | `45.91ms` | `172.50ms` | `191.30ms` | `209.30ms` | `172.95ms` |
| retained rerun | `52.18ms` | `43.53ms` | `94.90ms` | `106.10ms` | `113.00ms` | `95.56ms` |
| delta | `-59.2%` | `-5.2%` | `-45.0%` | `-44.5%` | `-46.0%` | `-44.7%` |

#### Honest read after the retained slice

```text
what is now true
|- `single-zone-122` no longer has an update-budget contradiction
|  `- avg update is now below the scenario note's `63ms` reference
|- render average now beats the frozen composed baseline again
`- frame pacing is still not fully back to the scenario note
   `- retained rerun p50 `94.9ms` vs note `83ms`
```

The runtime story is materially healthier now, but the composed packet is not
fully closed yet:

- `single-zone-200` still needs a post-fix rerun
- `block-carry-active` still needs a post-fix rerun
- `flower-feed-storm` still needs a post-fix rerun
- `single-zone-122` still has a smaller remaining p50 gap relative to its own
  validation note

### Post-56c9a4f Refresh Packet

The branch now includes `56c9a4f`:

```text
new harness surfaces
|- per-stage `physics.*` breakdown fields
`- `scatterButterfliesAcrossZone` in `single-zone-122`
```

This means the older `single-zone-122` packet and the refreshed one are not
strict apples-to-apples. The refreshed packet is the new local truth because it
uses a more realistic butterfly spread.

#### Refresh artifact paths

- `single-zone-122`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-122-2026-04-27T04-55-01-833Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-122-2026-04-27T04-55-01-833Z.raw.json)
- `single-zone-122` profile
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet_profile/single-zone-122-2026-04-27T05-02-30-729Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet_profile/single-zone-122-2026-04-27T05-02-30-729Z.raw.json)
  - [cpuprofile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet_profile/single-zone-122-2026-04-27T05-02-30-729Z.cpuprofile)
- `single-zone-200`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-200-2026-04-27T04-55-01-835Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/single-zone-200-2026-04-27T04-55-01-835Z.raw.json)
- `block-carry-active`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/block-carry-active-2026-04-27T04-55-01-764Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/block-carry-active-2026-04-27T04-55-01-764Z.raw.json)
  - [profile digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_block_profile/block-carry-active-2026-04-27T05-04-57-634Z.json)
  - [cpuprofile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_block_profile/block-carry-active-2026-04-27T05-04-57-634Z.cpuprofile)
- `flower-feed-storm`
  - [digest](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/flower-feed-storm-2026-04-27T04-55-01-904Z.json)
  - [raw](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/post_56c9a4f_packet/flower-feed-storm-2026-04-27T04-55-01-904Z.raw.json)
- post-structure-query cut follow-ups
  - [single-zone-122](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_after_blockcarry_cut/single-zone-122-2026-04-27T07-18-15-770Z.json)
  - [single-zone-200](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_after_blockcarry_cut/single-zone-200-2026-04-27T07-16-17-882Z.json)
  - [block-carry-active first win](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_clonecut/block-carry-active-2026-04-27T07-13-58-565Z.json)
  - [block-carry-active confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_clonecut_rerun/block-carry-active-2026-04-27T07-15-27-660Z.json)
- dense-flower direct-present gate follow-ups
  - [flower-feed-storm first win](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_direct_dense_gate/flower-feed-storm-2026-04-27T07-30-43-324Z.json)
  - [flower-feed-storm confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_direct_dense_gate_rerun/flower-feed-storm-2026-04-27T07-34-45-605Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_flower_direct_dense_gate_rerun/single-zone-200-2026-04-27T07-35-51-111Z.json)
  - [single-zone-122 hold check](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_flower_direct_dense_gate/single-zone-122-2026-04-27T07-33-27-275Z.json)
- communication-maintenance + decision-trace cache follow-ups
  - [single-zone-200 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm_trace_cache/single-zone-200-2026-04-27T11-54-31-782Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm_trace_cache_rerun/single-zone-200-2026-04-27T11-56-59-365Z.json)
  - [single-zone-122 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_comm_trace_cache/single-zone-122-2026-04-27T11-55-48-494Z.json)
  - [single-zone-200 profile](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm_trace_cache_profile/single-zone-200-2026-04-27T12-01-31-516Z.cpuprofile)
  - social guardrails:
    - [r6 communication audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-27T11-59-52-972Z/report.json)
    - [f5/f6 social depth audit](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-27T12-00-54-754Z/report.json)

#### Refresh summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Dominant read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-122` | `52.43ms` | `50.20ms` | `102.80ms` | `113.70ms` | `103.62ms` | realistic lane held after scatter; butterfly update + composite still dominate |
| `single-zone-200` | `253.63ms` | `57.90ms` | `310.20ms` | `370.40ms` | `274.21ms` | density cliff still severe; physics sync + butterfly update dominate |
| `block-carry-active` | `378.65ms` | `26.11ms` | `468.10ms` | `1930.10ms` | `657.08ms` | active blocker; huge tails from butterfly update + structure-heavy physics |
| `flower-feed-storm` | `45.68ms` | `73.37ms` | `117.50ms` | `129.00ms` | `115.98ms` | improved vs frozen baseline but still render-heavy |

#### Post-structure-query follow-up summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-122` | `43.77ms` | `44.98ms` | `89.40ms` | `97.80ms` | `89.42ms` | reality lane is now close to the `83ms` note and materially healthier |
| `single-zone-200` | `103.62ms` | `55.69ms` | `154.70ms` | `185.90ms` | `152.26ms` | stress lane improved sharply but is still above-real-play heavy |
| `block-carry-active` | `32.59ms` | `26.57ms` | `58.00ms` | `76.40ms` | `60.83ms` | former blocker is now materially repaired |

#### Dense-flower direct-present gate follow-up summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `flower-feed-storm` | `32.54ms` | `63.95ms` | `98.20ms` | `108.50ms` | `96.91ms` | former flower-heavy blocker is materially repaired; flowers now bypass the entity layer cleanly in dense low-butterfly scenes |
| `single-zone-200` | `96.94ms` | `56.00ms` | `153.10ms` | `169.30ms` | `149.87ms` | stress lane improves overall and stays the remaining above-real-play density blocker |
| `single-zone-122` | `40.84ms` | `42.69ms` | `88.40ms` | `100.10ms` | `88.64ms` | reality lane still holds with better averages and a small p95 wobble |

#### Communication-maintenance + decision-trace cache follow-up summary

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-200` | `86.37ms` | `55.22ms` | `141.50ms` | `158.10ms` | `138.09ms` | retained stress-lane improvement; update cost drops materially while render holds |
| `single-zone-122` | `36.62ms` | `43.15ms` | `81.10ms` | `90.10ms` | `81.22ms` | reality lane now beats the old `83ms p50` note locally |
| `flower-feed-storm` | `33.31ms` | `63.55ms` | `98.90ms` | `108.40ms` | `97.94ms` | repaired flower-heavy lane stays green after the communication/runtime cuts |

The first `single-zone-200` pass was even stronger at `68.16ms` avg update /
`110.6ms` p50, but the confirmation rerun above is the retained honest value.

#### What the new breakdown changed

```text
single-zone-122 physics read
|- physicsMs                -> 13.64
|- syncTrackedEntitiesMs    -> 9.03
|- syncButterfliesMs        -> 8.84
|- resolveContactsMs        -> 2.06
`- resolveStructureCollisionMs -> 2.22
```

The realistic lane no longer points first at an opaque "physics" block. It
points at butterfly sync work inside physics plus the still-hot butterfly
decision/update path.

#### Active blocker after the refresh

The first refresh packet said `block-carry-active` was the dominant blocker.
That was correct then, but the follow-up no-clone internal structure-query cut
changed the picture substantially.

```text
block-carry-active now
|- avgUpdateMs -> 32.59
|- p95FrameMs  -> 76.40
|- physicsMs   -> 10.69
|  |- syncTrackedEntitiesMs              -> 6.26
|  |- syncButterfliesMs                  -> 4.60
|  `- resolveButterflyStructureCollisionsMs -> 1.30
`- butterflyUpdateMs -> 14.28
```

The follow-up dense-flower direct-present gate changed the picture again:

```text
flower-feed-storm now
|- avgUpdateMs -> 32.54
|- avgRenderMs -> 63.95
|- p50FrameMs  -> 98.20
|- entityLayerMs          -> 5.55
|- entitiesCompositeMs    -> 3.40
`- flowersDirectPresentMs -> 54.30
```

So the blocker moved again:

```text
remaining local runtime order
|- single-zone-200    -> above-real-play density cliff, still led by butterfly update + composite pressure
|- single-zone-122    -> repaired locally; only reopen if we want margin beyond the old note
`- flower-feed-storm  -> repaired watch lane; keep it green during later stress-lane work
```

The communication-maintenance + decision-trace cache follow-up moved the stress
lane again:

```text
single-zone-200 now
|- avgUpdateMs -> 86.37
|- avgRenderMs -> 55.22
|- p50FrameMs  -> 141.50
|- butterflyUpdateMs     -> 40.97
|- communicationSystemMs -> 6.86
|- lifeSimSystemMs       -> 9.69
`- compositeMs           -> 34.26
```

And the new profile says the remaining stress-lane shape is:

```text
single-zone-200 retained profile
|- render
|  |- drawImage
|  `- near-full-width entity composite present
|- update
|  |- queryCollisionGeometry / isPointBlockedForEntity
|  |- proximityCount / chooseBestFlowerForButterfly
|  `- residual communication + life-sim maintenance
`- social guardrails
   |- r6  -> pass
   `- f5/f6 -> pass
```

The carry/structure profile still mattered because it proved the cause of the
old cliff:

```text
what the carry fix removed
|- structureSystem.cloneValue churn
|- repeated queryCollisionGeometry clone pressure
`- excessive passable-sample / blocked-point structure query overhead
```

#### Structure-system frame-local runtime cache follow-up summary

- retained artifacts:
  - [single-zone-200 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_structure_runtime_cache/single-zone-200-2026-04-27T16-07-48-113Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_structure_runtime_cache_rerun/single-zone-200-2026-04-27T16-10-00-910Z.json)
  - [single-zone-122 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_structure_runtime_cache/single-zone-122-2026-04-27T16-07-48-080Z.json)
  - [single-zone-122 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_structure_runtime_cache_rerun/single-zone-122-2026-04-27T16-11-30-540Z.json)
  - [block-carry-active hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_structure_runtime_cache/block-carry-active-2026-04-27T16-07-47-583Z.json)
  - spatial/build guardrails:
    - [a4 spatial truth](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-27T16-12-44-383Z/report.json)
    - [b4 carry-stack physics](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/b4_carry_stack_physics_audit/2026-04-27T16-13-00-309Z/report.json)

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-200` | `81.39ms` | `55.82ms` | `135.30ms` | `150.60ms` | `133.53ms` | retained stress-lane improvement; repeated same-frame structure queries are materially cheaper, but this is still the remaining density cliff |
| `single-zone-122` | `39.27ms` | `43.54ms` | `81.30ms` | `90.40ms` | `81.81ms` | reality lane stays below the old `83ms p50` note while holding render close to the earlier retained slice |
| `block-carry-active` | `30.77ms` | `26.98ms` | `56.20ms` | `74.30ms` | `59.96ms` | repaired carry lane holds after the structure-cache cut |

What changed in the code path:

```text
structure query reuse
|- frame-local queryCollisionGeometry cache
|- frame-local getSpatialContextForEntity cache
|- clone-on-demand on public returns only
`- reset / rebuild now clear runtime caches explicitly
```

What this means now:

```text
latest local runtime order
|- single-zone-200    -> active blocker
|  |- butterfly update remains the largest update family
|  |- composite / drawImage tail still matters
|  `- residual structure-query pressure is smaller, not gone
|- single-zone-122    -> local hold below the old `83ms p50` note
|- flower-feed-storm  -> repaired watch lane
`- block-carry-active -> repaired watch lane
```

#### Pressure-gated crowd/cursor checks + critical communication cadence summary

- retained artifacts:
  - [single-zone-200 first pass](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm8_cursor_gate/single-zone-200-2026-04-28T16-20-40-492Z.json)
  - [single-zone-200 confirmation](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone200_comm8_cursor_gate_rerun/single-zone-200-2026-04-28T16-22-13-826Z.json)
  - [single-zone-122 hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/singlezone122_comm8_cursor_gate_hold/single-zone-122-2026-04-28T16-34-14-926Z.json)
  - [flower-feed-storm hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_feed_comm8_cursor_gate_hold/flower-feed-storm-2026-04-28T16-39-59-002Z.json)
  - [block-carry-active hold](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/blockcarry_comm8_cursor_gate_hold/block-carry-active-2026-04-28T16-41-35-396Z.json)
  - guardrails:
    - [r6 communication](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r6_communication_audit/2026-04-28T16-45-05-824Z/report.json)
    - [f5/f6 social depth](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/f5_f6_social_depth_audit/2026-04-28T16-49-27-227Z/report.json)
    - [r1 movement stability](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/r1_movement_stability_audit/2026-04-28T16-51-08-906Z/report.json)

| Scenario | Avg update | Avg render | p50 frame | p95 frame | Wall / frame | Honest read |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `single-zone-200` | `80.87ms` | `54.92ms` | `134.00ms` | `149.20ms` | `131.66ms` | retained stress-lane improvement; smaller than the structure-cache gain, but confirmed across update, render, p50, p95, and wall time |
| `single-zone-122` | `34.71ms` | `41.86ms` | `74.70ms` | `85.40ms` | `75.68ms` | reality lane improves again and keeps wide margin under the old `83ms p50` note |
| `flower-feed-storm` | `29.66ms` | `61.31ms` | `88.70ms` | `97.80ms` | `87.69ms` | repaired flower-heavy lane improves and stays green |
| `block-carry-active` | `30.47ms` | `25.78ms` | `55.10ms` | `73.10ms` | `57.28ms` | repaired carry lane improves and stays green |

What changed in the code path:

```text
retained pressure gates
|- normal crowd-retarget proximity checks now run only on the existing retarget interval
|- cursor risk profile lookup is lazy when the cursor is outside scare/trust reach
|- critical communication maintenance interval is 8 frames
`- communication maintenance phase is cached per entity / interval
```

What this means now:

```text
latest local runtime order
|- single-zone-200   -> still active, but narrower
|  |- butterflyUpdateMs -> 37.18 in the retained confirmation
|  |- compositeMs       -> 34.22 in the retained confirmation
|  `- next target       -> render/composite tail before more social cadence work
|- single-zone-122   -> repaired local hold at `74.7ms p50`
|- flower-feed-storm -> repaired local hold at `88.7ms p50`
`- block-carry-active -> repaired local hold at `55.1ms p50`
```

#### Telemetry Accounting Correction

Two benchmark-accounting issues were found during the `single-zone-200`
composite-tail inspection and are now corrected in code:

```text
telemetry truth correction
|- `render.composite.totalCompositeMs` now includes `flowersDirectPresentMs`
|- attribution top-contributor lists now rank timing fields only
|  `- non-duration counters / widths / ratios no longer appear as "ms" costs
`- benchmark performance baselines above remain the retained local truth
   `- post-correction sanity timings were noisy locally and are not promoted
```

Sanity artifact:

- [flower-feed accounting sanity](/C:/Users/fishe/Documents/projects/ephemera/qa_logs/bench/flower_feed_composite_accounting_sanity/flower-feed-storm-2026-04-28T18-02-05-444Z.json)

The sanity capture proves the accounting shape: `render.composite.totalCompositeMs`
is `69.22ms`, `render.composite.flowersDirectPresentMs` is `64.88ms`, and
the raw attribution top render contributors are timing keys rather than
composite widths. Its absolute frame timings should not replace the retained
watch-lane numbers above.

### Next Diagnosis Order

1. `single-zone-200` composite / drawImage tail
2. `single-zone-200` residual butterfly-update cost only where the next profile still shows repeatable pressure
3. `single-zone-200` residual blocked-point / structure-query pressure only where the frame-local caches still miss
4. `flower-feed-storm` and `block-carry-active` only as repaired watch lanes while later stress-lane work lands
5. `single-zone-122` only if we want additional margin beyond the old `83ms p50` note

## Active Playtest Follow-Up Board

_Source: `docs/ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md`_

### Purpose

This board turns the remaining local-playtest findings into one concrete,
ordered implementation path.

It sits underneath `R4 feedback triage + readability hardening` and answers:

```text
+====================================================================================+
| Remaining Work Order                                                               |
+====================================================================================+
| 1. stop the game from freezing                                                     |
| 2. capture better runtime evidence                                                 |
| 3. re-check the repaired shell on a real long-running save                         |
| 4. deepen social conversation so bonds feel visible and emergent                   |
| 5. make material / building behavior easier to observe                             |
| 6. decide whether fuller vertical butterfly movement is real next work or later    |
+====================================================================================+
```

Read this together with:

- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [WILD-ECOLOGY-RELEASE-CONTRACT.md](./WILD-ECOLOGY-RELEASE-CONTRACT.md)

### Current Shape

```text
frozen baselines
|- repair / parity closed
|- polish closed
|- implementation closed
|- expansion closed
`- public-share board active
        |
        v
playtest follow-up
|- f1 session capture + freeze triage
|- f2 freeze / performance hardening
|- f3 long-running save regression sweep
|- f4 shell follow-up retest
|- f5 feed threading + conversation surfacing
|- f6 emergent casual conversation depth
|- f7 material behavior visibility
|- f8 flower-carry / build scope lock
|- f9 vertical habitat contract lock
`- f10 outside retest + freeze handoff
```

### Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current phase

gated
`- requires an upstream decision or proof gate first
```

### Invariants

```text
always preserve
|- freezing/performance is treated as a release blocker before deeper polish work
|- long-running butterfly identity, memory, bonds, and lineage must survive refresh-oriented fixes
|- feed / inspect UI must not become the source of truth for social state
|- casual conversation should emerge from state and context, not fixed scripted scenes
|- flower carry/build work must not be implied as live until it is truly implemented
`- full free-flight volumetric 3D is still out of scope unless a later board promotes it
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `f1 session capture + freeze triage` | `live` | record real session errors, warnings, frame spikes, and important player actions so freezes can be diagnosed from evidence instead of memory | `systems/telemetrySystem.js`, `ui/debugUI.js`, `core/gameCore.js`, `docs/`, `qa_logs/` | export exists, capture survives a real play session, and at least one freeze session artifact can be reviewed after play |
| `f2 freeze / performance hardening` | `live` | remove the hard stutter / freeze behavior on real saves by clamping the hottest update/render paths first | `core/renderManager.js`, `entities/butterfly.js`, `core/config.js`, `systems/telemetrySystem.js`, `scripts/` | real session no longer freezes, pressure profile stays under the focused-garden budget seam, and affected audits remain green |
| `f3 long-running save regression sweep` | `live` | make sure refresh-aware world fixes do not force save resets and do not break long-running bonds, memories, or lineage | `systems/saveSystem.js`, `core/gameCore.js`, `scripts/`, `docs/` | save/load roundtrip stays green on a lived-in save, refreshed worlds preserve butterfly/social identity, and no reset is needed to see current environment truth |
| `f4 shell follow-up retest` | `live` | retest the already-repaired shell items on the stabilized runtime: battle readability, doorway travel, inspect clearing, and feed cleanliness | `ui/gameUI.js`, `core/gameCore.js`, `core/renderManager.js`, `scripts/`, `PLAYTEST-TRIAGE-LOG.md` | the current repaired items still hold in real play after `f2` and `f3` |
| `f5 feed threading + conversation surfacing` | `live` | make ongoing talk read more like actual exchanges instead of isolated system cards | `ui/gameUI.js`, `systems/communicationSystem.js`, `docs/` | feed shows short grouped exchanges, old overlap/proof clutter stays gone, and communication/readability audits stay green |
| `f6 emergent casual conversation depth` | `live` | add low-stakes social talk, pair rhythm, and visible relationship texture without abandoning emergence | `systems/communicationSystem.js`, `systems/lifeSimSystem.js`, `ui/gameUI.js`, `docs/` | butterflies produce richer casual talk, repeated warmth/friction changes later behavior, and the contract/docs stay aligned |
| `f7 material behavior visibility` | `live` | make block pickup / carrying / placement show up more reliably in live play and easier to notice in the shell | `entities/butterfly.js`, `systems/lifeSimSystem.js`, `ui/gameUI.js`, `scripts/` | block interaction occurs often enough to witness in ordinary sessions and related audits stay green |
| `f8 flower-carry / build scope lock` | `live` | explicitly decide whether flower carry/build becomes real shipped behavior now or is documented as intentionally not live | `docs/`, `entities/flower.js`, `entities/butterfly.js`, `systems/communicationSystem.js` | a clear yes/no decision is recorded before any flower-carry implementation claims are made |
| `f9 vertical habitat contract lock` | `live` | decide whether to promote true butterfly altitude-band movement and high-home behavior beyond the current grounded spatial model | `docs/CURRENT-SPATIAL-TRUTH.md`, `docs/`, `core/config.js`, `systems/physicsSystem.js`, `entities/butterfly.js` | the contract clearly says either `still grounded only` or `promoted to implementation`, with no ambiguous middle state |
| `f10 outside retest + freeze handoff` | `active` | rerun internal and outside play once the remaining local blockers are settled, then hand the result back to `R4/R5` | `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `docs/PLAYTEST-TRIAGE-LOG.md`, `PLAYTEST.md`, `scripts/` | local freezes are closed, top follow-up issues are resolved or intentionally deferred, and the public-share board can advance honestly |

### Exact Order

```text
must land in this order

f1
  v
f2
  v
f3
  v
f4
  v
f5
  v
f6
  v
f7
  v
f8 decision
  |- no  -> hold as explicit non-live boundary
  `- yes -> implement flower carry/build after f7
  v
f9 decision
  |- no  -> hold grounded spatial model as current truth
  `- yes -> open a later implementation phase for true altitude movement
  v
f10
```

### Current Focus

```text
current focus
`- f10 outside retest + freeze handoff
```

`f1` closed state now live:

- debug mode now exposes `Start Capture` and `Export Capture`
- session captures export to `qa_logs/session_captures/...` with both `capture.json` and `summary.txt`
- exports include runtime issues, frame spikes, focused-zone changes, save/load events, event history, replay markers, and start/end world summaries
- `run-f1-session-capture-audit.js` proves the export end to end even when an older server is already occupying `3000`

`f2` closed state now live:

- oversized browser windows now clamp to a safer display size before the canvas is resized
- high-DPI canvases now cap backing density more aggressively on large windows instead of scaling toward runaway cost
- butterfly sprite smoothing now disables automatically under pressure instead of paying the full visual cost in crowded scenes
- `run-f2-performance-hardening-audit.js` proves the high-DPI stress lane with a passing session capture and no freeze-suspect events
- `run-r4-ui-readability-audit.js` stayed green and `run-runtime-self-audit.js` still passed all audited steps after the hardening pass

`f3` closed state now live:

- save/load roundtrip now strips transient per-butterfly signal fanout instead of treating it as durable save truth
- active doorway travel now restores against the live doorway route so a refresh/load does not strand a traveler in the source zone
- `run-f3-long-running-save-regression-audit.js` now passes on the social web, nursery lineage, and stale refresh + doorway travel lanes

`f4` closed state now live:

- inspect `All` browse and zone-scoped clearing both still hold on the stabilized runtime
- doorway travel still reaches the wall/warp route before crossing zones, instead of silently regressing to a middle-of-garden jump
- the cleaned feed shell and default-off trail toggle both still hold after the save/runtime fixes
- `run-f4-shell-followup-audit.js`, `run-r2-zone-transition-audit.js`, `run-r4-ui-readability-audit.js`, and `run-r5-battle-presentation-audit.js` are green together

`f5` closed state now live:

- talk feed entries now collapse same-pair exchanges into short 2-3 line threads instead of rendering each line as an isolated card
- talk cards now render speaker-labelled thread lines directly in the feed, with light pair-mode continuity instead of the older grounding clutter
- `run-f5-f6-social-depth-audit.js`, `run-r6-communication-audit.js`, and `run-r4-ui-readability-audit.js` are green together on the threaded feed shell

`f6` closed state now live:

- low-stakes casual talk now includes `check_in`, `shared_observation`, `playful_banter`, `gentle_tease`, `quiet_companionship`, `small_praise`, `light_irritation`, and `soft_repair`
- pair conversation modes (`easy`, `playful`, `tender`, `guarded`, `strained`, `admiring`) now derive from live relationship state instead of being implied only by courtship residue
- social edges now track short-horizon conversation texture (`recentWarmth`, `recentEase`, `recentFriction`, `recentMutualAttention`) and feed it back into later life-sim behavior
- Inspect and communication summaries now surface pair-mode and recent conversation texture without making UI the owner of the relationship truth

`f7` closed state now live:

- ordinary block interaction now follows through more reliably from pursuit into pickup, carry, and placement without debug forcing
- calm/shelter-oriented butterflies now treat nearby blocks as real opportunities sooner instead of dropping the behavior before arrival
- feed wording now uses lighter `shelter block` language so the behavior reads as part of the garden instead of a debug-like event
- `run-f7-material-visibility-audit.js`, `run-r7-block-visual-audit.js`, and `run-r4-ui-readability-audit.js` now hold green together on the ordinary material lane

`f8` decision now locked:

- flower carry/build is intentionally **not** a live mechanic on this board
- flowers remain feeding, egg-laying, and lifecycle ecology surfaces rather than current shelter/build materials
- no player-facing or source docs should imply that butterflies currently gather flowers as construction pieces

`f9` decision now locked:

- taller block stacks and shelter columns are live, but the butterfly runtime still uses the grounded pseudo-3D model
- this board does **not** promote a separate altitude-band habitat sim, high-home altitude routine layer, or free-flight volumetric movement
- any future altitude-focused butterfly movement work now belongs on a later intentionally promoted board instead of drifting into the current public-share path

Immediate reason `f10` is current:

- the remaining local follow-up blockers are now either fixed or explicitly bounded
- the next honest proof step is a fresh local handoff plus at least one outside captured session
- `R4/R5` can only advance from here on real `M2+` evidence, not more invented local closure

### Open Items This Board Covers

```text
open / partial items
|- fresh local handoff session on the stabilized long-running save
|- at least one captured `M2+` outside session
|- outside-session findings promoted into the triage log when real blockers appear
`- honest handoff back to `R4 / R5`
```

## Active Runtime Hardening Board

_Source: `docs/ACTIVE-RUNTIME-HARDENING-BOARD.md`_

> Superseded on 2026-04-21 by
> [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md).
> Keep this board as historical context for the already-landed `h1`-`h5`
> runtime-hardening work; do not use it as the active sequencing source of
> truth.

### Purpose

This board turns the still-open smoothness problem into one exact implementation
path.

It sits underneath `R4 feedback triage + readability hardening` and answers:

```text
+====================================================================================+
| Remaining Runtime Work Order                                                       |
+====================================================================================+
| 1. prove where real-save lag still comes from                                      |
| 2. slim the render path until the garden stops feeling heavy                       |
| 3. decimate non-visual simulation work under pressure without breaking behavior    |
| 4. stop the shell from redrawing expensive views every frame                       |
| 5. retest on the same long-running save that currently feels bad                   |
| 6. only then hand the smoother build back to outside playtesting                   |
+====================================================================================+
```

Read this together with:

- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
- [PLAYTEST.md](../PLAYTEST.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

### Current Shape

```text
runtime state
|- black-screen collapse           -> repaired
|- hard freeze suspect lane        -> repaired
|- shell readability regressions   -> repaired
|- long-running save continuity    -> repaired
`- sustained smoothness on real save
    |- still too laggy
    `- still active
```

### Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current phase

queued
`- next sequenced phase, not started yet
```

### Invariants

```text
always preserve
|- no performance fix should require resetting progression or wiping long-running saves
|- fail-soft rendering stays in place; a bad frame must not collapse to a black screen
|- button-first shell readability must survive every runtime cut
|- social / ecology / lineage truth stays correct even if expensive systems are decimated under pressure
|- visual cuts should prefer graceful degradation over feature disappearance
`- outside-playtest handoff only happens after the host-local save feels meaningfully smoother
```

### Comfort Target

```text
host-local comfort target
|- ordinary focused-garden lane
|  |- pressure tier          -> warm or lower
|  |- avg update            -> <= 12ms
|  |- avg render            -> <= 14ms
|  `- repeated 40ms+ spikes -> rare, not persistent
|- no black-screen or frame-collapse symptom
`- same long-running save remains usable throughout
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Proof gate |
| --- | --- | --- | --- | --- |
| `h1 real-save lag capture + attribution` | `live` | capture and separate real-save lag into render cost, simulation cost, UI redraw cost, or browser/canvas stress | `systems/telemetrySystem.js`, `core/gameCore.js`, `core/renderManager.js`, `PLAYTEST-TRIAGE-LOG.md`, `qa_logs/` | dedicated `h1` capture export now reports lag category, shell state, and top update/render contributors instead of only `hot` |
| `h2 render-pass slimming` | `live` | reduce sustained render cost by cutting or caching the heaviest world/background/layer work first | `core/renderManager.js`, `sketch.js`, `core/config.js`, `systems/specialEffects.js` | shell-heavy attribution lane dropped from roughly `29ms render` into the low-20s, and the focused-garden audit now holds near `15.7ms render` without freeze suspects |
| `h3 simulation cadence + budget enforcement` | `live` | decimate or stagger expensive non-visual work under pressure without breaking the life-sim | `core/gameCore.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/behaviorSystem.js`, `systems/mlInferenceSystem.js`, `systems/zoneSystem.js`, `systems/structureSystem.js` | unchanged structure state no longer pays a full rebuild every frame; focused-garden update averages now sit near `7.8ms` in the current proof lane |
| `h4 shell redraw discipline` | `live` | stop feed/inspect/journal/debug surfaces from paying full layout cost every frame when nothing changed | `ui/gameUI.js`, `ui/debugUI.js`, `ui/butterflyCollection.js`, `core/renderManager.js` | UI-heavy lanes stay readable while idle redraw cost drops |
| `h5 long-running save smoothness retest` | `active` | rerun the exact long-running host-local save with capture, battle, zone travel, and save/load after `h2-h4` | `PLAYTEST.md`, `ui/debugUI.js`, `server.js`, `scripts/run-h5-long-running-save-smoothness-audit.js`, `qa_logs/`, `PLAYTEST-TRIAGE-LOG.md` | exported-save retest tooling is live, the imported-save fixture proof is now green end to end, session capture survives save/load, and the real exported save is the remaining honest smoothness gate |
| `h6 outside retest + public-share handoff` | `queued` | rerun `M2+` with the smoother build and hand the result back to `R4/R5` | `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `PLAYTEST-FEEDBACK.md`, `docs/PLAYTEST-TRIAGE-LOG.md`, `scripts/` | host-local smoothness is acceptable, outside session evidence exists, and `R4` can advance honestly |

### Exact Order

```text
must land in this order

h1 real-save lag capture + attribution
  v
h2 render-pass slimming
  v
h3 simulation cadence + budget enforcement
  v
h4 shell redraw discipline
  v
h5 long-running save smoothness retest
  v
h6 outside retest + public-share handoff
```

### Current Focus

```text
current focus
`- h5 long-running save smoothness retest
```

Immediate reasons `h5` is next:

- `h1` now proves the lag shape instead of only saying `hot`
- `h2` and `h3` materially lowered the focused-garden lane
- `h4` is now live: text/layout caches and UI-layer redraw throttling cut the three-panel shell lane from the mid/high-20s down to roughly `15.4ms update / 18.8ms render`, while the ordinary feed lane now holds near `6.6ms update / 12.7ms render`
- `h5` now has a real imported-save path: `Export Save` writes the browser world to `qa_logs/save_exports`, and `run-h5-long-running-save-smoothness-audit.js` can load that same world into a fresh audit browser context
- session capture now survives save/load during the `h5` retest instead of being wiped by foundation reset
- the current fixture-export proof is now green for calm garden, shell exercise, zone travel, save/load, battle, and capture export, with the calm lane landing near `3.25ms update / 11.22ms render`
- the only remaining honest blocker is that `qa_logs/save_exports` still does not contain the real lived-in browser save, so `h5` still needs that direct exported-save rerun before closure

### Open Items This Board Covers

```text
open / partial items
|- host-local long-running save still feels extremely laggy
|- shell-heavy lanes are materially lower, but they still need direct real-save confirmation from an exported long-running world
|- the imported-save fixture proof is now fully green, but it is still only the fixture world
|- the real lived-in browser save has not been exported yet, so `h5` cannot close honestly
|- ordinary focused-garden/feed play now sits in the low-teens render range in proof lanes
|- multi-panel shell play is cheaper and remains readable, but still above ideal comfort
|- update cost is materially better in the focused-garden lane
`- outside playtest handoff is blocked until host-local smoothness improves
```

## Active Visual-First Runtime Board

_Source: `docs/ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md`_

### Purpose

This board makes the reviewed visual-first optimization plan the active runtime
sequence.

It replaces the older `h1`-`h6` runtime-hardening ladder as the current source
of truth for smoothness work.

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║ Visual-First Runtime Optimization                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ target               │ smooth long-running play without sacrificing look    ║
║ preserve             │ core simulation, shell clarity, save continuity      ║
║ restore live         │ sharp creatures, trails off/reduced/full             ║
║ active sequence      │ v0 -> review gate -> v0.5 -> v1 -> ... -> v8a -> v8b║
║ current honest block │ shared save-schema is signed; runtime-only proof next║
╚══════════════════════════════════════════════════════════════════════════════╝
```

```text
runtime snapshot
├─ target          -> smooth long-running play without sacrificing look
├─ preserve        -> core simulation, shell clarity, save continuity
├─ restore live    -> sharp creatures, trails off/reduced/full
├─ active sequence -> v0 -> review gate -> v0.5 -> v1 -> ... -> v8a -> v8b
└─ current status  -> live through v8a; next runtime gate is v8b after c9
```

Read this together with:

- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
- [BASELINE.md](./BASELINE.md)
- [V0-5-FREE-WINS-AUDIT.md](./V0-5-FREE-WINS-AUDIT.md)
- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PUBLIC-SHARE-READINESS-ROADMAP.md](./PUBLIC-SHARE-READINESS-ROADMAP.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)
- [V2-MEMORY-GROWTH-AUDIT.md](./V2-MEMORY-GROWTH-AUDIT.md)
- [SPRITE-CACHE-CONTRACT.md](./SPRITE-CACHE-CONTRACT.md)
- [V3-SPRITE-BAKING-AUDIT.md](./V3-SPRITE-BAKING-AUDIT.md)
- [V4-SIM-CADENCE-AUDIT.md](./V4-SIM-CADENCE-AUDIT.md)
- [V5-COMPOSITE-REDUCTION-AUDIT.md](./V5-COMPOSITE-REDUCTION-AUDIT.md)
- [V6-WORKER-OFFLOAD-AUDIT.md](./V6-WORKER-OFFLOAD-AUDIT.md)
- [V7-VISUAL-RESTORATION-AUDIT.md](./V7-VISUAL-RESTORATION-AUDIT.md)
- [COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md](./COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md)
- [COMPOSED-BENCHMARK-BASELINE-2026-04-27.md](./COMPOSED-BENCHMARK-BASELINE-2026-04-27.md)
- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

### Current Honest Block

```text
runtime frozen live
|- v4 retained 18/36/30 cadence slice
|- v5 composite/present/HUD reduction stack
|- v6 worker-offload groundwork (default-off)
|- v7 visual restoration stack
|- spatial s8 board/unit/corridor freeze
`- social n8 save continuity freeze

current blocker
`- no local runtime blocker is left inside `v8a`; runtime-only proof is now frozen honestly, and the next gate is `v8b` after outside-session triage

next proof
|- c8 runtime-only proof -> frozen live on the committed lived-in save
`- v8b full-stack proof  -> next runtime gate after `c9` outside-session triage closes

post-v8a runtime watch
|- composed benchmark harness is now live
|- current branch tip must be judged against `single-zone-122`, not only synthetic `butterflies-N`
|- retained local recovery stack now brings the old clustered `single-zone-122` from `127.77 / 45.91 / 172.5` to `52.18 / 43.53 / 94.9`
|- the refreshed scattered `single-zone-122` packet on `56c9a4f` first landed at `52.43 / 50.20 / 102.8`
|- post-structure-query cut, scattered `single-zone-122` now lands at `43.77 / 44.98 / 89.4`
|- dense-flower direct-present gate now repairs `flower-feed-storm` to `32.54 / 63.95 / 98.2`
|- communication-maintenance + decision-trace cache now bring `single-zone-200` to `86.37 / 55.22 / 141.5`
|- the same retained slice moves scattered `single-zone-122` to `36.62 / 43.15 / 81.1`
|- structure-system frame-local runtime caches then move `single-zone-200` to `81.39 / 55.82 / 135.3`
|- the same retained slice keeps `single-zone-122` at `39.27 / 43.54 / 81.3`
|- pressure-gated crowd/cursor checks + critical communication cadence now move `single-zone-200` to `80.87 / 54.92 / 134.0`
|- the same retained slice moves `single-zone-122` to `34.71 / 41.86 / 74.7`
|- flower/feed and block/carry watch lanes both improve under the retained slice
|- carry/build guardrails still hold -> `a4` pass / `b4` pass
|- social/movement guardrails still hold -> `r6` pass / `f5-f6` pass / `r1` pass
`- runtime diagnosis stays active because the blocker has narrowed again: `single-zone-200` is still the remaining composed stress lane, while `single-zone-122`, `flower-feed-storm`, and `block-carry-active` are all local holds
```

### Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current implementation phase

queued
|- sequenced next, not yet active

gated
`- cannot close honestly until required evidence exists
```

### Non-Negotiables

```text
always preserve
|- no optimization phase may remove a core simulation system
|- no optimization phase may solve smoothness by permanently degrading visual identity
|- high-resolution butterflies, caterpillars, and cocoons remain part of the target state
|- trail options remain part of the target state: off by default, reduced, full
|- long-running saves must stay valid; no progression wipe is an optimization tool
|- benchmark truth must come from a real lived-in save, not only a fixture world
`- public-share handoff stays blocked until the lived-in save feels materially smoother
```

### Current Shape

```text
2026-04-25 runtime shape
|- v1 shell path            -> live and default-on through `performance.flags.shellUiDom`
|- v3 sharp-creature baking -> live and default-on through `performance.flags.bakedCreatureSprites`
|  `- spriteAtlas           -> still default-off
|- v4 live slice            -> retained 18/36/30 cadence seams are now promoted into the live default runtime shape
|- v5 live seams            -> frozen live; clean-shell dirty-region composites, native composite present, DOM guide, baked flower heads, live blocks composite reuse, and idle clean-shell HUD redraw now define the retained stack
|- v6 worker groundwork     -> live as improved default-off groundwork through `performance.flags.workerOffload`
`- v7 visual restoration    -> live; sharp creatures are back on by default, trails remain off by default, and reduced/full are both available again
```

```text
live proof held
|- h5          -> green off / reduced / full on the lived-in save
|- r4          -> green on the heavy full-trails path
|- a4          -> green on the frozen spatial/runtime stack
|- v3 parity   -> green on the restored sharp-creature path
`- capture lane -> exported captures now separate warning-level cadence-budget-overrun telemetry from hard runtime errors
```

```text
runtime path
|- freeze / quota crash lane             -> repaired
|- black-screen collapse lane            -> repaired
|- host-local shell/battle readability   -> repaired
|- imported-save smoothness fixture lane -> repaired
`- visual-first optimization
   |- baseline harness                   -> live
   |- review gate                        -> live
   |- v0.5 free-wins                     -> live
   `- v1+ implementation phases          -> active
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Honest gate |
| --- | --- | --- | --- | --- |
| `v0 baseline capture protocol` | `live` | build the canonical lived-in-save measurement harness, baseline artifacts, and compare tooling before changing behavior | `systems/telemetrySystem.js`, `core/renderManager.js`, `server.js`, `scripts/run-v0-baseline.js`, `scripts/compare-captures.js`, `docs/BASELINE.md`, `qa_logs/` | full-duration post-`s3` canonical run is on disk and frozen as the comparison surface |
| `review gate` | `live` | freeze the lived-in baseline, review-gate rubric sign-off, and flag registry before feature work | `docs/VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md`, `core/config.js`, `docs/BASELINE.md`, `docs/ACTIVE-PLAN-REGISTRY.md` | canonical post-`s3` baseline, shared contracts, flag registry, and `v0.5` closure all agree |
| `v0.5 free-wins pass` | `live` | land low-risk wins with no visual sacrifice before structural changes | `core/config.js`, `sketch.js`, `systems/saveSystem.js`, `systems/telemetrySystem.js`, `ui/`, `docs/V0-5-FREE-WINS-AUDIT.md` | seams are proven, all regressors remain default-off, and second-save migration proof is on disk |
| `v1 shell-ui separation` | `live` | move shell-heavy panels off the canvas path while preserving button-first shell behavior | `ui/gameUI.js`, `ui/debugUI.js`, `core/renderManager.js`, `index.html`, `styles/`, `docs/V1-SHELL-UI-SEPARATION-AUDIT.md` | shell lanes are materially cheaper than the post-`s3` canonical `v0` while readability improves or holds on the committed lived-in save |
| `v2 memory-growth audit + leak closure` | `live` | make long sessions stable before creature-visual restoration | `systems/telemetrySystem.js`, `core/gameCore.js`, `core/renderManager.js`, `systems/*`, `docs/V2-MEMORY-GROWTH-AUDIT.md` | 40-minute heap/profile deltas improve and freeze symptoms stay absent |
| `v3 high-resolution creature sprite baking` | `live` | restore sharp butterflies/caterpillars/cocoons via caching/atlas work instead of per-frame cost | `core/spriteManager.js`, `entities/`, `assets/`, `core/renderManager.js` | creature clarity improves while staying within the post-`v2` budget |
| `v4 simulation cadence split` | `live` | keep visual motion smooth while deep life-sim/ML/ecology cadence is staggered safely | `core/gameCore.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/mlInferenceSystem.js`, `systems/zoneSystem.js` | retained 18/36/30 scheduler-owned slice is banked and the remaining blocker has moved downstream into render/composite pressure |
| `v5 render/composite pass reduction` | `live` | cut the number and cost of whole-canvas composites without flattening the look | `core/renderManager.js`, `core/config.js`, `docs/V5-COMPOSITE-REDUCTION-AUDIT.md` | composite-heavy lanes are materially cheaper than `v0`, `h5` is green, and readability/battle/spatial guardrails hold |
| `v6 worker offload for non-render systems` | `live` | move selected non-render work off the main thread once cadence boundaries are stable | `systems/mlInferenceSystem.js`, `systems/telemetrySystem.js`, `workers/`, `core/gameCore.js`, `docs/V6-WORKER-OFFLOAD-AUDIT.md` | improved default-off groundwork is landed honestly, even if it is not promoted into the live runtime shape |
| `v7 trails + visual-quality restoration pass` | `live` | reintroduce the desired high-fidelity visual state with proof that it still runs acceptably | `core/config.js`, `core/renderManager.js`, `entities/`, `ui/gameUI.js`, `docs/V7-VISUAL-RESTORATION-AUDIT.md` | high-res creatures and trail presets hold on the lived-in save without reopening the lag/freeze problem |
| `v8a runtime-only proof` | `live` | prove the optimized runtime stack on the real long-running save while spatial and social state stay frozen | `docs/BASELINE.md`, `qa_logs/`, `PLAYTEST.md`, `PLAYTEST-FEEDBACK.md`, `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `qa_logs/session_captures/v8a-runtime-proof/REPORT.md` | lived-in save soak is honest and green before cross-track migration noise is introduced |
| `v8b full-stack proof` | `queued` | prove the optimized build again after `s7` and `n8` land on the migrated long-running save and outside-share path | `docs/BASELINE.md`, `qa_logs/`, `PLAYTEST.md`, `PLAYTEST-FEEDBACK.md`, `docs/EXTERNAL-PLAYTEST-MATRIX.md`, `docs/SAVE-SCHEMA-REGISTRY.md` | full-stack migrated-save proof is honest and green after runtime-only proof already holds |
| `v9 renderer escalation decision` | `queued` | only if needed, decide whether a deeper renderer migration is justified | `docs/`, `core/renderManager.js`, future renderer spikes if opened | decision is evidence-based and explicitly documented |

### Exact Order

```text
v0
  |
  v
review gate
  |
  v
v0.5
  |
  v
v1 -> v2 -> v3 -> v4 -> v5 -> v6 -> v7 -> v8a -> v8b -> v9
```

### Current Focus

```text
current focus
`- runtime track is live through `v8a`
   |- v8a report       -> qa_logs/session_captures/v8a-runtime-proof/REPORT.md
   |- inherited truth  -> shellUiDom is live, `bakedCreatureSprites` is live, 18/36/30 cadence is live, the retained v5 composite stack is live, and trails ship off by default with reduced/full available
   |- current evidence -> shipped-default `h5` is green, soak40 is green at 0 warnings / 0 errors / 0 freezeSuspects, `r4` is green, `a4` is green, and the full five-lane pack is on disk
   |- carry-forward    -> the short battle lane still logs 4 freeze suspects inside the five-lane pack, so keep that lane watched in `v8b`
   |- composed reality lane -> communication/trace-cache follow-up now has scattered `single-zone-122` at `36.62ms` avg update / `43.15ms` avg render / `81.1ms` p50
   |- composed carry lane   -> repaired locally to `30.47ms` avg update / `55.1ms` p50 / `73.1ms` p95 and still passes `b4`
   |- composed flower lane  -> repaired locally to `29.66ms` avg update / `61.31ms` avg render / `88.7ms` p50 and remains a watch lane only
   |- composed blocker      -> `single-zone-200` is now the remaining stress lane at `80.87ms` avg update / `54.92ms` avg render / `134.0ms` p50
   |- social guardrails     -> `r6` pass / `f5-f6` pass after the communication maintenance cut
   |- movement guardrail    -> `r1` pass after the cursor-risk lookup cut
   |- spatial/build guardrails -> `a4` pass / `b4` pass after the structure-runtime-cache cut
   `- next runtime gate -> `v8b` full-stack proof after `c9` outside-session triage closes, with composed stress-lane remediation still pending locally
```

### Latest V4 Note

```text
retained 18/36/30 v4 slice
|- owner seams     -> lifeSimSystem deep butterfly evaluation + mlInferenceSystem garden trace refresh + zoneSystem ecology refresh
|- scheduler owner -> gameCore currentFrame/cadence hook + budget-overrun hook
|- parity          -> pass, including life-sim stale max 22, ML stale max 46, ecology stale max 29
|- calm update     -> 31.56 -> 8.89ms
|- shell update    -> 28.13 -> 6.97ms
|- battle update   -> 45.96 -> 26.25ms
|- soak update     -> 28.59 -> 8.78ms
|- heap            -> 159.26 -> 159.26MB
`- honest read     -> v4 is now banked as the retained cadence slice; capture export treats cadence-budget-overrun as warning-only telemetry, and the remaining runtime work moved downstream into `v6` / `v7`
```

### Latest V5 Note

```text
current composite-reduction stack
|- owner seam 1   -> renderManager cropped entity + behind-cover composites on clean-shell lanes only
|- owner seam 2   -> gameUI first-session guide moved off the canvas path into the DOM shell
|- owner seam 3   -> spriteManager / flower mature-head bake on a bounded `flower-head` cache family
|- owner seam 4   -> clean-shell idle HUD redraw discipline only redraws calm shell HUD at full cadence when the player is actively interacting
|- inherited path -> shellUiDom default-on + retained 18/36/30 cadence slice
|- spatial proof  -> `a4` is green on the stacked runtime
|- h5             -> fully green on the lived-in save at calm 6.96 / 13.88 and shell-heavy 11.51 / 13.74
|- flag state     -> compositeDirtyRegions / compositeNativeDraw / compositeBlocksLayer are live defaults on clean-shell lanes; bakedFlowerHeads is default-on; directPresentFlowers remains retained default-off
|- rolled-back    -> raw butterfly canvas, direct entity present, segmented entity composite, region-layer follow-up, split-scenery layer, grounded-block backdrop, edge-outlier peel, wing-local bake, hybrid threshold, clip-present, and no-smooth-present all remain out
`- honest read    -> `v5` is frozen live; the remaining runtime work moved downstream into `v6` worker-offload decisions and `v8a` proof
```

### Latest V6 Note

```text
worker-offload state
|- worker scope     -> stateless ML policy scoring only
|- retained code    -> worker now returns prebuilt model traces and can defer unchanged garden cadence refreshes until worker results land
|- same-code h5     -> control and candidate both pass on the lived-in save
|- candidate read   -> calm 6.56 / 13.51 -> 6.70 / 13.53 | shell 10.81 / 13.26 -> 10.34 / 12.98 | p95 30.90 -> 30.80
|- heap             -> 168.80 -> 159.26 MB
|- trace churn      -> avgRefreshedTraceCount 3.31 -> 2.86
|- flag state       -> workerOffload stays default-off
`- honest read      -> groundwork landed and the deferred trace cut is the best worker seam so far; keep it as improved default-off scaffolding, not as live runtime truth
```

### Latest V7 Note

```text
visual restoration proof
|- sharp creatures -> live by default through `bakedCreatureSprites`
|- trail options   -> off / reduced / full are all live again
|- shipped default -> trails stay off by default
|- h5              -> pass on off / reduced / full
|- r4              -> pass on the heavy full-trails path
|- v3 parity       -> pass on the restored sharp-creature path
|- r5 note         -> control and candidate both failed the same guard-only fixture, so `r5` was not used as the `v7` differentiator
`- honest read     -> `v7` is frozen live; `c7` is signed, `v8a` is now frozen live too, and the next runtime gate is `v8b` after `c9`
```

### Latest V8a Note

```text
v8a runtime-only closeout
|- full pack -> qa_logs/session_captures/v8a-runtime-proof/2026-04-26T02-19-35-305Z
|- diff      -> qa_logs/session_captures/v8a-runtime-proof/diff-vs-v0-full-baseline.md
|- calm      -> render 24.58 -> 12.14 | update 24.17 -> 9.20
|- shell     -> render 32.08 -> 12.55 | update 25.73 -> 7.01
|- travel    -> render 35.08 -> 13.38 | update 25.54 -> 12.82
|- battle    -> render 43.52 -> 22.70 | update 36.98 -> 16.98
|- soak40    -> render 27.56 -> 13.10 | update 26.34 -> 6.94
|- pack totals -> warnings 0 | errors 0 | freezeSuspects 4 | telemetryWarnings 6914
|- soak gate -> warnings 0 | errors 0 | freezeSuspects 0
|- no-flag hold -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json -> pass
`- honest read -> `v8a` is now frozen honestly; the runtime-only blocker is cleared locally, and the next runtime gate is `v8b`
```

### Latest Composed Harness Note

```text
2026-04-27 composed runtime reality check
|- workflow owner -> COMPOSED-BENCHMARK-HARNESS-WORKFLOW.md
|- official packet -> COMPOSED-BENCHMARK-BASELINE-2026-04-27.md
|- reality baseline -> single-zone-122
|- stress baseline  -> single-zone-200
|- targeted lanes   -> block-carry-active / flower-feed-storm
|- realistic hotspot 1 -> butterfly crowd / flower-targeting update path
|- realistic hotspot 2 -> flowers-direct composite / butterfly-present render path
`- honest read -> synthetic `butterflies-N` sweeps remain useful, but they are no longer the primary runtime truth for real-play cost
```

### Latest Single-Zone-200 Note

```text
single-zone-200 retained local stack
|- communication maintenance cadence under pressure
|- per-frame butterfly decision-trace / policy-choice cache
|- structureSystem frame-local collision-query cache
|- structureSystem frame-local spatial-context cache
|- pressure-gated normal crowd-retarget proximity checks
|- lazy cursor risk-profile lookup
`- cached communication maintenance phase per entity / interval

retained proof
|- single-zone-200 -> `96.94 / 56.00 / 153.1` -> `86.37 / 55.22 / 141.5` -> `81.39 / 55.82 / 135.3` -> `80.87 / 54.92 / 134.0`
|- single-zone-122 -> now holds at `34.71 / 41.86 / 74.7`
|- flower lane     -> holds at `29.66 / 61.31 / 88.7`
|- carry lane      -> holds at `30.47 / 25.78 / 55.1 / 73.1`
|- social guards   -> `r6` pass / `f5-f6` pass
|- movement guard  -> `r1` pass
`- spatial/build guards -> `a4` pass / `b4` pass

honest read
|- the remaining local blocker is no longer broad structure churn
|- the active stress lane is now smaller and more specific
|  |- composite / drawImage tail
|  |- residual butterfly-update pressure
|  `- only remaining structure-query misses that escaped the frame-local caches
`- `single-zone-122` is no longer an active blocker unless we want extra margin beyond the old note
```

### Latest Harness Accounting Note

```text
composed benchmark telemetry correction
|- `render.composite.totalCompositeMs` now includes direct-flower present cost
|- top-contributor attribution now filters to timing keys ending in `Ms`
|- proof artifact -> qa_logs/bench/flower_feed_composite_accounting_sanity/flower-feed-storm-2026-04-28T18-02-05-444Z.json
|- proved shape   -> totalComposite 69.22ms / flowersDirectPresent 64.88ms / timing-only top render contributors
`- caution        -> local absolute timings from this sanity run were noisy and are not promoted over the retained runtime proof above
```

### Latest V3 Note

```text
sharp-creature state
|- parity        -> pass with spriteAtlas + bakedCreatureSprites enabled
|- live flag     -> bakedCreatureSprites is now live by default through `v7`
|- atlas flag    -> spriteAtlas stays default-off
|- blocked path  -> higher-fidelity baked body + antenna + caterpillar helpers still do not beat the retained live slice
`- next push     -> only reopen atlas/body/antenna/caterpillar work on a source path that beats the current live slice in smoke, not just parity
```

## Public-Share Readiness Roadmap

_Source: `docs/PUBLIC-SHARE-READINESS-ROADMAP.md`_

### Purpose

This roadmap turns "we should be able to share this" into one concrete closure
path.

It sits on top of the frozen runtime baseline and answers:

```text
what must be true before wider sharing
what order those fixes should land in
what counts as local-host-ready versus public-alpha-ready
which proofs should block release-facing claims
```

The exact remaining local-playtest implementation order now lives in:

- [ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md](./ACTIVE-PLAYTEST-FOLLOWUP-BOARD.md)
- [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- [ACTIVE-RUNTIME-HARDENING-BOARD.md](./ACTIVE-RUNTIME-HARDENING-BOARD.md)
- [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md)

### Program Shape

```text
frozen game baseline
|- repair / parity closed
|- player-facing polish closed
|- implementation board closed
|- expansion board closed
`- final grand-plan audit passed
        |
        v
public-share readiness
|- r1 startup/package sanity
|- r2 first-session onboarding
|- r3 external playtest matrix
|- r4 feedback triage + readability hardening
`- r5 public alpha freeze
```

### Release Levels

```text
current levels
|- internal frozen baseline
|  `- already reached
|- local-host shareable playtest
|  `- reached on the validated host-local Windows + Chromium lane
|- wider public alpha
|  `- waiting on outside sessions plus triage
`- beyond-alpha expansion
   `- separate future boards only
```

### R1 - Startup / Package Sanity

Status:
- `live`

```text
goal
|- make startup truthful
|- make the repo landing page match the live shell
|- make the local-host share path explicit
`- remove obvious launch / control / doc drift
```

Owners:

- `package.json`
- `server.js`
- `README.md`
- `PLAYTEST.md`
- `docs/README.md`
- `docs/source-book/book-manifest.json`

Implementation notes:

- the documented launch path should be one short command set, not multiple competing stories
- root README control notes must match the live button-first runtime
- the playtest doc should clearly distinguish host-local access from same-LAN access
- this phase should not over-promise browser/device support that has not been proved yet
- if the runtime launch path is already technically fine, fix the documentation drift first

Proof gate:

- documented launch path works in the current environment
- local HTTP endpoint responds from the documented command path
- root README, playtest doc, and docs map agree
- source-book rebuild stays green

Exit condition:

- a collaborator can clone, install, launch, and reach the garden without asking what command or URL to use

Closed state:

- `npm run playtest` launches cleanly from the documented path
- the host URL and same-LAN URL are both documented clearly
- root/docs maps now point at the public-share track directly
- the live controls summary matches the button-first shell and current debug keys

### R2 - First-Session Onboarding

Status:
- `live`

```text
goal
|- make the first five minutes readable
|- teach the shell through the shell
`- reduce reliance on external explanation
```

Owners:

- `ui/gameUI.js`
- `ui/debugUI.js`
- `docs/PAPILIONEM-PLAYER-GUIDE.md`
- `PLAYTEST.md`

Implementation notes:

- teach the current loop: read the garden, use Inspect/Feed/Journal, understand release, understand battle
- avoid building a heavy tutorial layer unless lighter guidance fails
- prefer concise prompts, highlighted first actions, and clearer labels over large modal walls

Proof gate:

- new-player start path can be followed without debug knowledge
- `run-r4-ui-readability-audit.js` stays green
- player-facing docs match the live onboarding path

Exit condition:

- a new player can start, inspect a butterfly, read the feed, open the journal, and understand the main loop without coaching

Closed state:

- the garden now shows a lightweight quick-start card on first entry
- the card auto-hides and persists dismissal once the player uses real shell surfaces
- the player guide now explains that first-session helper explicitly

### R3 - External Playtest Matrix

Status:
- `live`

```text
goal
|- define what environments and testers we actually support
|- make feedback collection useful
`- turn "share it around" into a repeatable process
```

Owners:

- `PLAYTEST.md`
- `PLAYTEST-FEEDBACK.md`
- `README.md`
- `docs/README.md`
- `docs/EXTERNAL-PLAYTEST-MATRIX.md`

Implementation notes:

- define the validated baseline clearly, then expand only with evidence
- include browser, OS, device class, and whether the tester is local-host or same-LAN
- feedback should capture friction, confusion, bugs, and beauty separately

Proof gate:

- tester matrix exists
- feedback template is concise and actually useful
- one clean outside-tester flow is documented from install to report-back

Exit condition:

- an outside tester has a clear, repeatable path from "I got the build" to "here is actionable feedback"

Closed state:

- the environment matrix now distinguishes `validated`, `prepared`, and `queued` lanes
- host-local Windows + Chromium is the current proved path
- same-LAN and broader browser/device lanes are documented without being over-claimed
- the feedback template now captures startup mode, URL used, and first blocker cleanly

### R4 - Feedback Triage + Readability Hardening

Status:
- `active`

```text
goal
|- fix the biggest real-user problems
`- freeze only after outside friction is addressed
```

Owners:

- `runtime files as needed`
- `docs/`
- `scripts/`
- `docs/PLAYTEST-TRIAGE-LOG.md`

Implementation notes:

- prioritize crashes, broken saves, impossible flows, severe confusion, and misleading shell copy
- do not disappear into speculative polish when real-user blockers are still open
- every fix should widen or rerun the relevant audit path
- classify incoming outside findings by lane, bucket, severity, and reproduction clarity before changing code
- do not invent blocker fixes locally that are not backed by real outside-session evidence
- a structured session-capture export is now live as support tooling for `r4` triage because it improves evidence quality without broadening product scope
- the remaining local-playtest follow-up work now has an exact implementation order, with freezing first, in [PLAYTEST-FOLLOWUP-ROADMAP.md](./PLAYTEST-FOLLOWUP-ROADMAP.md)
- the still-open host-local lag and smoothness work now has its own exact implementation order in [RUNTIME-HARDENING-ROADMAP.md](./RUNTIME-HARDENING-ROADMAP.md)

Proof gate:

- top blocker issues from external playtests are closed or explicitly documented as known issues
- affected audits stay green
- player-facing docs remain aligned

Exit condition:

- there are no major unresolved issues that would make a stranger bounce immediately

Current blocker:

- `r4` now has its intake structure, but it still needs real sessions from the
  prepared/queued lanes in [EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md)
  before it can close honestly
- local `M1` self-test findings are still worth landing when they are clear,
  and the current battle-shell clutter/pacing repairs now hold green through
  `r5`, `single-player-autobattle`, `r4`, and `runtime-self`
- host-local smoothness is still an active blocker, but the runtime-hardening
  track has now closed `h1` through `h4`, and the `h5` imported-save fixture
  proof is now green; the remaining honest gate is rerunning that same path on
  the real lived-in save instead of only the current fixture export
- the local follow-up ladder has now closed `f1` through `f9`, which means the
  capture tooling, freeze hardening, save-refresh seam, repaired shell,
  threaded talk surfacing, deeper casual relationship layer, material visibility,
  and remaining flower/spatial scope locks all hold before outside-session
  evidence becomes the next honest gate

### R5 - Public Alpha Freeze

Status:
- `gated`

```text
goal
|- freeze a public-facing alpha baseline
|- state what the build is and is not
`- stop confusing "playable" with "unboundedly ready"
```

Owners:

- `README.md`
- `PLAYTEST.md`
- `docs/`
- `scripts/`

Implementation notes:

- include a known-issues list if needed
- keep the scope honest: this is about a public alpha, not "the ultimate final version"
- freeze against the current runtime, not deferred future expansion ideas

Proof gate:

- release-readiness sweep is green
- final doc pass is green
- source-book rebuild is green

Exit condition:

- the project can be publicly shared as an alpha without the docs or launch path misleading people

## Playtest Follow-Up Roadmap

_Source: `docs/PLAYTEST-FOLLOWUP-ROADMAP.md`_

### Purpose

This roadmap expands the active follow-up board into exact implementation order,
owner seams, and finish conditions.

It is intentionally narrower than the older grand boards:

```text
this roadmap is for
|- real remaining issues found during current play
|- release-blocking stability work
|- social/material/spatial depth that is still visibly under-expressed
`- explicit scope decisions where current truth is still ambiguous to the player
```

### Program Shape

```text
+=====================================================================================================+
| Remaining Work Program                                                                              |
+=====================================================================================================+
| stabilize runtime     | f1 -> f2 -> f3                                                              |
| re-validate shell     | f4                                                                          |
| deepen social feel    | f5 -> f6                                                                    |
| improve material feel | f7 -> f8                                                                    |
| lock spatial boundary | f9                                                                          |
| hand back to release  | f10                                                                         |
+=====================================================================================================+
```

### F1 - Session Capture + Freeze Triage

Status:
- `live`

```text
goal
|- capture what happened during a real play session
|- stop relying on memory for freeze diagnosis
`- make later test reviews faster and more trustworthy
```

Build order:

1. add session-start / session-stop capture controls in the debug shell
2. record:
   - uncaught errors
   - console warnings/errors that matter
   - frame/update spikes
   - focused-zone changes
   - save/load events
   - battle start/end
   - major butterfly/social/material events
3. export the capture to a stable folder path
4. add a short human-readable session summary beside the raw data
5. document how to use it in the playtest docs

Primary owners:

- `systems/telemetrySystem.js`
- `ui/debugUI.js`
- `core/gameCore.js`
- `PLAYTEST.md`
- `docs/ACTIVE-PUBLIC-SHARE-BOARD.md`

Exit condition:

- you can run a real session, export the capture, and review a freeze afterward without guessing

Closed state:

- debug mode now exposes `Start Capture` and `Export Capture`
- exports land in `qa_logs/session_captures/...`
- each export includes both `capture.json` and `summary.txt`
- the capture records runtime issues, frame spikes, focused-zone changes, save/load events, event history, replay markers, and start/end world summaries
- `run-f1-session-capture-audit.js` proves the path end to end and bypasses stale older servers by standing up a fresh audit port when needed

### F2 - Freeze / Performance Hardening

Status:
- `live`

```text
goal
|- stop the game from freezing on real saves
|- prefer the smallest reversible clamps first
`- keep visual readability gains without overloading the runtime
```

Build order:

1. review one or more `f1` session captures and identify the hottest spikes
2. clamp the likely first offenders:
   - afterimage trail accumulation
   - butterfly draw/update density when many are visible
   - UI redraw pressure in large-shell states
   - any runaway event/feed growth
3. tighten performance fallbacks so pressure drops earlier before the browser hard-stalls
4. retest on the same long-running save that previously froze
5. widen the runtime/performance proof if a new hotspot was found

Primary owners:

- `core/renderManager.js`
- `entities/butterfly.js`
- `ui/gameUI.js`
- `systems/telemetrySystem.js`
- `core/config.js`

Exit condition:

- the same real session no longer hard-freezes, and the focused-garden runtime stays within the live budget seam often enough to play normally

Closed state:

- oversized browser windows now clamp to a safer display size before the canvas is resized
- large high-DPI windows now cap canvas pixel density more aggressively instead of scaling the backing store toward runaway cost
- butterfly sprite smoothing now disables automatically under pressure instead of paying the full per-entity cost in crowded scenes
- `run-f2-performance-hardening-audit.js` proves the high-DPI stress lane with a passing session capture and no freeze-suspect events
- `run-r4-ui-readability-audit.js` stayed green and `run-runtime-self-audit.js` still passed all audited steps after the hardening pass

Current note:

- the high-DPI stress lane can still enter `hot` pressure during the run, but it no longer produces freeze-suspect captures in the local proof lane after the clamps

### F3 - Long-Running Save Regression Sweep

Status:
- `live`

```text
goal
|- keep using long-running saves
|- stop environment/runtime refreshes from forcing resets
`- prove that identity and relationship state survive the fixes
```

Build order:

1. load a lived-in save after `f2`
2. verify:
   - butterfly identity and display names
   - memories / residues / relationships
   - journal / lineage / hybrid state
   - ambient block refresh truth
   - doorway travel truth
3. fix any refresh/migration drift found
4. add or widen roundtrip proof cases for whatever drift was real

Primary owners:

- `systems/saveSystem.js`
- `core/gameCore.js`
- `scripts/run-runtime-self-audit.js`
- `scripts/run-long-soak-generational-audit.js`

Exit condition:

- a lived-in save can keep being used after the fixes without losing the long-running butterfly/social story

Closed state:

- per-butterfly active-signal target fanout is now treated as transient runtime state instead of durable save truth
- active doorway travel now restores against the current doorway route so load/refresh does not strand a traveler in the source zone
- `run-f3-long-running-save-regression-audit.js` now passes on the social web, nursery lineage, and stale refresh + doorway-travel lanes

### F4 - Shell Follow-Up Retest

Status:
- `live`

```text
goal
|- re-validate the shell repairs on the stabilized runtime
`- separate real regressions from issues that were only artifacts of freezing
```

Retest list:

- battle field-first shell
- battle movement/pacing readability
- doorway travel through the old wall/warp route
- inspect clearing when a zone-scoped butterfly leaves
- inspect `All` browse path
- feed overlap cleanup
- trail toggle behavior

Primary owners:

- `ui/gameUI.js`
- `core/gameCore.js`
- `core/renderManager.js`
- `docs/PLAYTEST-TRIAGE-LOG.md`

Exit condition:

- the repaired shell items still feel correct in ordinary play after `f2` and `f3`

Closed state:

- inspect `All` browse and zone-scoped inspect clearing both still hold on the stabilized runtime
- doorway travel still reaches the doorway route before warping across zones
- the cleaned feed shell and default-off trail toggle both still hold after the save/runtime fixes
- `run-f4-shell-followup-audit.js`, `run-r2-zone-transition-audit.js`, `run-r4-ui-readability-audit.js`, and `run-r5-battle-presentation-audit.js` are green together

### F5 - Feed Threading + Conversation Surfacing

Status:
- `live`

```text
goal
|- make current talk easier to read as social exchange
`- improve visibility before deepening the underlying sim
```

Build order:

1. group adjacent same-pair talk into short exchange bursts
2. keep `Talk / Actions / Learn` color coding, but let talk render as a thread instead of isolated cards
3. show subtle pair continuity instead of repeated system tags
4. keep the feed visually lighter than battle or inspect

Primary owners:

- `ui/gameUI.js`
- `systems/communicationSystem.js`

Exit condition:

- players can visually follow who is talking to whom and feel continuity across 2-3 line exchanges

Closed state:

- same-pair talk now groups into short 2-3 line threaded exchanges instead of isolated single-line cards
- talk cards render speaker-labelled thread lines directly, while keeping the lighter `Talk / Actions / Learn` color coding
- pair continuity now shows through the exchange headline and pair-mode footer instead of the older cluttered proof tags
- `run-f5-f6-social-depth-audit.js`, `run-r6-communication-audit.js`, and `run-r4-ui-readability-audit.js` are green together

### F6 - Emergent Casual Conversation Depth

Status:
- `live`

```text
goal
|- make friendships and relationships feel more human
|- keep the behavior emergent
`- make later actions prove that the talk mattered
```

Build order:

1. add low-stakes talk intents:
   - `check_in`
   - `shared_observation`
   - `playful_banter`
   - `gentle_tease`
   - `quiet_companionship`
   - `small_praise`
   - `light_irritation`
   - `soft_repair`
2. derive pair conversation modes from existing trust/comfort/resentment/attachment
3. add tiny recent accumulators:
   - `recentWarmth`
   - `recentEase`
   - `recentFriction`
   - `recentMutualAttention`
4. fold those slowly back into existing relationship edges
5. couple speech to later behavior:
   - lingering
   - re-seeking
   - following
   - drifting apart
   - resting together
6. surface the result in inspect/feed without making UI the owner of truth

Primary owners:

- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `docs/DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md`

Exit condition:

- butterflies visibly produce more casual friendship/relationship talk and later behave as if those exchanges mattered

Closed state:

- low-stakes talk now includes `check_in`, `shared_observation`, `playful_banter`, `gentle_tease`, `quiet_companionship`, `small_praise`, `light_irritation`, and `soft_repair`
- pair conversation modes now derive from live trust / comfort / resentment / attachment instead of being implied only by courtship outcomes
- social edges now keep short-horizon conversation texture through `recentWarmth`, `recentEase`, `recentFriction`, and `recentMutualAttention`
- life-sim follow-through now folds recent conversation texture back into belonging, confidence, attachment, relief, agitation, and slight lingering bias
- Inspect/feed surfacing now proves the pair mode and recent texture without turning UI into the owner of the relationship truth
- `run-f5-f6-social-depth-audit.js` proves threaded exchange surfacing, casual subtype selection, pair-texture accumulation, and later life-sim follow-through

### F7 - Material Behavior Visibility

Status:
- `live`

```text
goal
|- make block interaction easier to notice
`- let ordinary play reveal building behavior without debug forcing
```

Build order:

1. increase the probability that eligible butterflies choose block interaction in calm ordinary sessions
2. improve the follow-through so pickup -> carry -> place happens more reliably once started
3. surface this lightly in feed/inspect without clutter
4. widen audits so the behavior is proved as a live ordinary pattern, not only a forced test fixture

Primary owners:

- `entities/butterfly.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`
- `scripts/`

Exit condition:

- you can observe block pickup/build behavior in normal play often enough to understand that it exists

Closed state:

- ordinary block interaction now follows through more reliably from pursuit into pickup, carry, and placement without debug forcing
- calm/shelter-oriented butterflies now treat nearby blocks as real opportunities sooner instead of abandoning the behavior before arrival
- feed wording now uses lighter `shelter block` language so the action reads as garden behavior instead of audit-like jargon
- `run-f7-material-visibility-audit.js`, `run-r7-block-visual-audit.js`, and `run-r4-ui-readability-audit.js` are green together on the ordinary material lane

### F8 - Flower-Carry / Build Scope Lock

Status:
- `live`

```text
decision
|- if yes: promote it to real implementation after f7
`- if no: document clearly that flowers are not current build materials
```

Why this needed a scope lock:

- right now the runtime does not honestly support flower carrying/building as a normal live mechanic
- that needs a clear scope call before implementation claims expand further

Locked outcome:

1. `defer`
   - flowers stay in the ecology/lifecycle loop as feeding, egg, and chrysalis-context surfaces
   - flowers are not current shelter/build materials
   - any future flower-material system must reopen on a later intentionally promoted board instead of being implied here

### F9 - Vertical Habitat Contract Lock

Status:
- `live`

```text
decision
|- keep the current grounded spatial model
`- or promote true altitude-band butterfly behavior
```

Why this needed a contract lock:

- current runtime now supports taller structures and a larger grounded area
- it still does not honestly support a full butterfly altitude behavior model
- that needs a clean yes/no contract before implementation claims keep drifting upward

Locked outcome:

1. `hold grounded model`
   - keep current spatial truth
   - clarify the boundary in docs/player language
   - treat taller block stacks and shelter columns as part of the grounded pseudo-3D runtime, not proof of a separate butterfly altitude model
   - reserve any future altitude bands / high-home preference / doorway-height behavior for a later intentionally promoted board

### F10 - Outside Retest + Freeze Handoff

Status:
- `active`

```text
goal
|- prove the repaired build in real play again
`- hand the remaining result back to r4 / r5 cleanly
```

Build order:

1. re-run local self-test on the stabilized long-running save
2. run at least one outside session using the new capture tooling
3. log real findings in the triage log
4. close what is blocking
5. hand the surviving known issues and the clean runtime back to the public-share board

Exit condition:

- the project can move forward honestly on `R4/R5` with current blockers either fixed or explicitly bounded

Current active blocker:

- this phase now depends on real `M2+` outside-session evidence
- local follow-up closure is no longer the limiting factor
- the next useful artifact is a captured outside session plus any reproduced friction entered into the triage log

### Exact Implementation Order

```text
phase order

f1 session capture + freeze triage
  ▼
f2 freeze / performance hardening
  ▼
f3 long-running save regression sweep
  ▼
f4 shell follow-up retest
  ▼
f5 feed threading + conversation surfacing
  ▼
f6 emergent casual conversation depth
  ▼
f7 material behavior visibility
  ▼
f8 flower-carry / build scope lock
  ▼
f9 vertical habitat contract lock
  ▼
f10 outside retest + freeze handoff
```

### Why This Order

```text
first
|- stop freezes
|- protect long-running saves
`- re-validate earlier repairs

then
|- improve readability of social activity
|- deepen the underlying social simulation
`- improve material behavior visibility

last
|- make explicit scope calls on flower carrying and fuller altitude movement
`- only then freeze for wider sharing again
```

## Runtime Hardening Roadmap

_Source: `docs/RUNTIME-HARDENING-ROADMAP.md`_

### Purpose

This roadmap expands the active runtime-hardening board into exact build order,
owner seams, and finish conditions.

It is narrower than the older freeze board:

```text
this roadmap is for
|- sustained lag on real saves
|- keeping the garden responsive during ordinary play
|- preserving repaired shell/life-sim behavior while decimating cost
`- handing a smoother build back to public-share readiness
```

### Program Shape

```text
+=====================================================================================================+
| Remaining Runtime Program                                                                          |
+=====================================================================================================+
| attribute the lag       | h1                                                                        |
| cut render cost         | h2                                                                        |
| cut simulation cost     | h3                                                                        |
| cut shell redraw cost   | h4                                                                        |
| prove on real save      | h5                                                                        |
| hand back to release    | h6                                                                        |
+=====================================================================================================+
```

### H1 - Real-Save Lag Capture + Attribution

Status:
- `live`

```text
goal
|- stop saying only "it feels laggy"
|- turn the real save into an attributed runtime profile
`- decide what actually dominates: render, simulation, or shell
```

Build order:

1. run session capture on the real long-running save that still feels bad
2. log:
   - focused zone
   - open shell state
   - avg update / render
   - spike counts
   - top system costs
3. split the captured result into:
   - render-dominant
   - simulation-dominant
   - mixed
4. write the attributed result into the triage log so later cuts stay evidence-based

Primary owners:

- `systems/telemetrySystem.js`
- `core/gameCore.js`
- `core/renderManager.js`
- `docs/PLAYTEST-TRIAGE-LOG.md`

Exit condition:

- dedicated capture export now reports `lagCategory`, shell state, top update contributors, and top render contributors in both `capture.json` and `summary.txt`

### H2 - Render-Pass Slimming

Status:
- `live`

```text
goal
|- make the garden cheaper to draw every frame
`- degrade gracefully before the browser feels heavy
```

Build order:

1. cut or cache the heaviest atmosphere/background passes first
2. reduce layer compositing cost where a layer can be reused instead of redrawn
3. tighten sprite smoothing and expensive per-entity visual choices earlier under pressure
4. re-check the battle shell separately so garden cuts do not quietly regress combat readability

Primary owners:

- `core/renderManager.js`
- `sketch.js`
- `core/config.js`
- `systems/specialEffects.js`

Exit condition:

- layer presentation is materially slimmer: empty presentation layers no longer composite, the UI layer no longer renders at the old over-dense backing resolution, and the focused-garden proof lane now sits around `15.7ms render` instead of the earlier low-20s

### H3 - Simulation Cadence + Budget Enforcement

Status:
- `live`

```text
goal
|- reduce steady update cost
|- keep life-sim truth correct
`- stagger what does not need to happen every frame
```

Build order:

1. measure foundation-system cost by family:
   - life sim
   - communication
   - behavior
   - ecology
   - ML
2. stagger slow-moving systems under pressure:
   - ecology refresh
   - social scans
   - migration scoring
   - ML garden cadence if still needed
3. keep save/load, battle, and direct player actions immediate
4. widen the proof so cadence cuts cannot silently corrupt social or ecology truth

Primary owners:

- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/behaviorSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/zoneSystem.js`

Exit condition:

- unchanged structure state no longer triggers a full structure rebuild every frame, focused-garden update averages now sit around `7.8ms`, and the affected proof lanes remain green

### H4 - Shell Redraw Discipline

Status:
- `live`

```text
goal
|- stop idle shell states from paying full layout cost every frame
`- keep the UI sharp while making it cheaper
```

Build order:

1. identify views that still recompute or reflow too much:
   - feed
   - inspect
   - journal
   - debug
2. cache static or unchanged layouts
3. only redraw expensive panels when their underlying state actually changes
4. re-check UI readability after the caching pass

Primary owners:

- `ui/gameUI.js`
- `ui/debugUI.js`
- `ui/butterflyCollection.js`

Exit condition:

- UI-heavy lanes remain readable while idle shell cost drops, the three-panel host-local shell lane now holds around `15.4ms update / 18.8ms render` instead of the older mid/high-20s range, and the ordinary feed lane stays near `6.6ms update / 12.7ms render` without reintroducing freeze suspects

### H5 - Long-Running Save Smoothness Retest

Status:
- `active`

```text
goal
|- prove the actual save feels better
`- avoid declaring victory from audit-only numbers
```

Build order:

1. export the current browser save from the debug panel into `qa_logs/save_exports`
2. rerun the exported save through `run-h5-long-running-save-smoothness-audit.js`
3. keep capture on for the full imported-save pass
4. cover:
   - calm garden observation
   - Inspect / Feed / Journal
   - zone travel
   - save/load
   - battle entry/exit
5. compare the new capture against the old laggy baseline

Primary owners:

- `PLAYTEST.md`
- `ui/debugUI.js`
- `server.js`
- `qa_logs/`
- `docs/PLAYTEST-TRIAGE-LOG.md`
- `scripts/run-h5-long-running-save-smoothness-audit.js`

Exit condition:

- the real exported long-running save no longer feels extremely laggy in the ordinary garden loop

### H6 - Outside Retest + Public-Share Handoff

Status:
- `queued`

```text
goal
|- confirm smoother behavior beyond the host machine
`- hand the result back to the public-share board honestly
```

Build order:

1. run at least one `M2+` session with capture enabled if possible
2. collect notes in `PLAYTEST-FEEDBACK.md`
3. promote real blockers into the triage log
4. either:
   - close `r4` if the smoother build holds, or
   - reopen the next runtime issue with real outside evidence

Primary owners:

- `docs/EXTERNAL-PLAYTEST-MATRIX.md`
- `PLAYTEST-FEEDBACK.md`
- `docs/PLAYTEST-TRIAGE-LOG.md`
- `docs/ACTIVE-PUBLIC-SHARE-BOARD.md`

Exit condition:

- the public-share track can advance on real smoother-play evidence instead of host-only hope

### Exact Implementation Order

```text
phase order

h1 real-save lag capture + attribution
  ▼
h2 render-pass slimming
  ▼
h3 simulation cadence + budget enforcement
  ▼
h4 shell redraw discipline
  ▼
h5 long-running save smoothness retest
  ▼
h6 outside retest + public-share handoff
```

### Why This Order

```text
first
|- attribute the lag honestly
`- do not optimize blind

then
|- cut render cost
|- cut simulation cost
`- cut shell redraw cost

last
|- prove it on the real save
`- only then hand it back to outside playtesting
```

### Current Read

```text
current runtime shape
|- fixture imported-save proof lane
|  |- calm garden     -> ~3.25ms update / ~11.22ms render
|  |- shell exercise  -> ~2.52ms update / ~13.92ms render
|  `- state           -> green, but still only the fixture world
|- broader f2 stress lane
|  |- avg update      -> ~6.16ms
|  |- avg render      -> ~11.67ms
|  `- remaining issue -> pressure tier still reads `critical`
`- next exact target
   `- h5 exported-save rerun on the real lived-in world
```

## Visual-First Runtime Optimization Plan

_Source: `docs/VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md`_

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║ Goal                                                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Make Papilionem run smoothly on real long-running saves without solving     ║
║ performance by stripping visual identity or cutting core simulation/design. ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

```text
current failure shape
┌──────────────────────────────┬─────────────────────────────────────────────┐
│ server                       │ healthy                                     │
│ browser tab                  │ overloaded / memory-heavy                  │
│ hottest steady cost          │ render + UI compositing                    │
│ secondary steady cost        │ main-thread simulation cadence             │
│ long-session risk            │ memory growth + repeated canvas work       │
└──────────────────────────────┴─────────────────────────────────────────────┘
```

### Hard Guardrails

```text
must preserve
├─ the full core game design
│  ├─ life sim
│  ├─ relationships / dialogue / memory
│  ├─ breeding / genetics / lineage
│  ├─ wild ecology
│  ├─ battle
│  └─ grounded spatial garden behavior
├─ the visual identity of the game
│  ├─ high-resolution butterflies
│  ├─ high-resolution caterpillars
│  ├─ high-resolution cocoons / chrysalises
│  ├─ readable high-resolution UI text
│  └─ butterfly trails restored as:
│     off by default | reduced | full
└─ the planned player-facing feel
   ├─ lush atmosphere
   ├─ expressive creature readability
   └─ no "optimize by making it plain" shortcut
```

#### Non-Negotiable Rules

1. Do not remove or permanently downgrade core simulation systems to gain performance.
2. Do not treat lower creature resolution as the primary optimization strategy.
3. Do not lock trails off forever; keep `off` as default, but retain `reduced` and `full`.
4. Do not reduce performance pressure by making the garden visually empty or sterile.
5. Prefer architectural improvements over aesthetic concessions.
6. Any temporary visual fallback must be explicitly marked temporary and must not become the new baseline without an intentional doc decision.

### Why The Game Is Currently Demanding

```text
main-thread frame
┌────────────────────────────────────────────────────────────────────────────┐
│ simulation                                                                │
│ zone + life sim + communication + behavior + ML + battle + save cadence   │
└────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ rendering                                                                  │
│ entity draw + particles + UI draw + full-canvas compositing               │
└────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ browser pressure                                                           │
│ memory growth + GC stalls + shell-heavy redraws                            │
└────────────────────────────────────────────────────────────────────────────┘
```

The current evidence says the biggest costs are not "too many butterflies" in isolation. The real pressure comes from:

1. Multiple full-canvas layer composites every frame.
2. Text-heavy shell UI rendered on canvas instead of through cheaper DOM layout.
3. Deep simulation systems competing with rendering on the same main thread.
4. Long-session browser memory growth that makes later gameplay worse than short audits.
5. Expensive presentation work being recomputed even when the visible scene barely changed.

### Strategy

```text
preserve look
    │
    ├─ stop paying for unchanged presentation
    ├─ move expensive text/UI work off the canvas path
    ├─ cache creature visuals at high quality instead of redrawing them raw
    ├─ split deep simulation cadence away from visual smoothness
    ├─ fix memory growth in long sessions
    └─ only escalate to renderer migration if the above still fails
```

### Ordered Phase Ladder

```text
review gate
   │
   ▼
v1 shell-ui separation
   │
   ▼
v2 memory-growth audit + leak closure
   │
   ▼
v3 high-resolution creature sprite baking
   │
   ▼
v4 simulation cadence split
   │
   ▼
v5 render/composite pass reduction
   │
   ▼
v6 worker offload for non-render systems
   │
   ▼
v7 trails + visual-quality restoration pass
   │
   ▼
v8 real-save soak + public-share proof
   │
   ▼
v9 renderer escalation decision
```

### Phase Details

#### v1. Shell-UI Separation

```text
move out of canvas first
├─ Feed
├─ Inspect
├─ Journal
├─ Access
└─ debug panels that are text/layout heavy
```

Owners:
- `ui/gameUI.js`
- `ui/debugUI.js`
- `core/renderManager.js`
- related shell styles/assets

Intent:
- Move text-heavy static UI out of the main canvas redraw path.
- Keep the art scene on canvas; move shell chrome and long text to DOM/CSS overlays.
- Improve UI clarity while reducing repeated canvas text/layout work.

Must preserve:
- current shell features
- current button-first flow
- inspect/feed/journal readability

Exit criteria:
- shell panels no longer require full canvas text redraw every frame
- UI remains visually consistent with current style
- focused-garden shell cost materially drops without reducing creature fidelity

#### v2. Memory-Growth Audit + Leak Closure

```text
find retained growth
├─ cached graphics
├─ stale capture/session data
├─ repeated arrays/objects
├─ dialogue/feed history presentation copies
└─ effect/trail residue that never clears
```

Owners:
- `systems/telemetrySystem.js`
- `core/renderManager.js`
- `systems/communicationSystem.js`
- `systems/specialEffects.js`
- capture/export tooling

Intent:
- Add stronger memory attribution for long sessions.
- Identify growth across 10-, 20-, and 40-minute runs on lived-in saves.
- Close leaks before restoring more visual richness.

Must preserve:
- session capture
- dialogue history
- feed/thread history needed for player reading

Exit criteria:
- memory trend is measured and attributable
- no obvious unbounded growth in normal play sessions
- browser process growth is substantially flatter than current long-session behavior

#### v3. High-Resolution Creature Sprite Baking

```text
appearance key
   └─▶ baked sprite cache
        ├─ butterfly
        ├─ caterpillar
        └─ chrysalis
```

Owners:
- creature entity render paths
- `core/renderManager.js`
- sprite/image cache helpers

Intent:
- Reintroduce high-resolution butterflies, caterpillars, and cocoons/chrysalises.
- Preserve visual clarity by baking appearance variants once and reusing them until appearance changes.
- Avoid paying full reconstruction cost every frame.

Must preserve:
- exact appearance individuality
- sex/variant/genetic readability
- battle readability

Exit criteria:
- high-resolution creature assets are back
- render cost does not regress to current freeze-prone levels
- cached sprite lifetime is stable and leak-safe

#### v4. Simulation Cadence Split

```text
60 fps feel target
├─ flight / movement / battle motion       high cadence
├─ life-sim deep evaluation                staggered cadence
├─ ecology refresh                         staggered cadence
├─ ML scoring                              staggered cadence
└─ dialogue/feed shaping                   event-driven where possible
```

Owners:
- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/communicationSystem.js`
- `systems/mlInferenceSystem.js`
- ecology update path

Intent:
- Separate "must feel smooth visually" from "must think deeply every frame."
- Keep flight and battle motion responsive while spreading heavier sim work across frames.

Must preserve:
- emergent behavior integrity
- social follow-through
- ecology correctness
- battle fairness/readability

Exit criteria:
- no core sim family is silently disabled
- cadence strategy is documented and auditable
- update spikes are materially reduced on long-running saves

#### v5. Render / Composite Pass Reduction

```text
reduce redundant full-screen work
├─ fewer active buffers
├─ fewer empty composites
├─ smarter dirty-region / dirty-layer reuse
└─ static background stays cached until state actually changes
```

Owners:
- `core/renderManager.js`
- background/atmosphere layer management
- battle scene composition

Intent:
- Pay only for layers that changed.
- Keep rich scene composition, but stop recompositing unnecessary full-screen buffers.

Must preserve:
- atmosphere
- zone backgrounds
- battle field readability
- covered/behind-wall spatial staging

Exit criteria:
- composite cost is materially lower than the current baseline
- scene still looks like the intended game
- no major visual regression in battle or focused garden

#### v6. Worker Offload For Non-Render Systems

```text
main thread keeps
├─ input
├─ animation
├─ entity movement
└─ final draw

worker candidates
├─ ML feature prep / inference
├─ ecology summary prep
├─ telemetry aggregation
└─ dialogue/feed formatting helpers
```

Owners:
- `systems/mlInferenceSystem.js`
- telemetry/export paths
- ecology summary builders
- worker bootstrap plumbing

Intent:
- Reduce main-thread contention without cutting game depth.
- Offload safe non-render computation first.

Must preserve:
- deterministic enough game behavior for audits
- fallback paths when workers are unavailable
- save/load correctness

Exit criteria:
- worker-backed tasks are measurable and stable
- main-thread frame time improves
- no logic ownership confusion is introduced

#### v7. Trails + Visual-Quality Restoration Pass

```text
restore intended visual options
├─ creatures high-res
├─ UI text sharp
├─ trails off by default
├─ trails reduced available
└─ trails full available
```

Owners:
- accessibility/settings UI
- render trail system
- creature render settings
- player docs

Intent:
- Reintroduce the intended visual richness after the earlier architecture wins are in place.
- Make trails a supported setting again without making them the default.

Must preserve:
- accessibility control
- smoothness under `off`
- graceful scaling under `reduced` and `full`

Exit criteria:
- high-resolution creature visuals are restored
- trail settings are present and documented
- `off` remains default
- `reduced` and `full` are stable options rather than hidden regressions

#### v8. Real-Save Soak + Public-Share Proof

```text
prove on lived-in saves
├─ calm garden watch
├─ shell-heavy reading
├─ zone travel
├─ battle
├─ save/load
└─ long session continuity
```

Owners:
- runtime audits
- session capture tooling
- public-share docs / triage logs

Intent:
- Validate the new architecture on the saves that actually used to freeze.
- Use real capture/export evidence, not only synthetic audit worlds.

Must preserve:
- long-running butterflies
- relationship continuity
- memory/emotion continuity
- environment refresh correctness

Exit criteria:
- no freeze / black-screen on the tested real saves
- sustained smoothness is acceptable in normal play
- public-share hardening can continue from a stable visual baseline

#### v9. Renderer Escalation Decision

```text
only if needed
current 2D layered renderer
        │
        ├─ enough after v1-v8? ──▶ keep current renderer
        │
        └─ still not enough? ───▶ evaluate batched WebGL/sprite renderer
```

Owners:
- architecture/docs decision layer
- rendering subsystem

Intent:
- Avoid a renderer rewrite unless the cheaper high-value wins have already failed.
- Make a deliberate call instead of drifting into a rewrite out of frustration.

Exit criteria:
- documented keep/escalate decision
- if escalating, a separate approved renderer plan is opened

### Proof Requirements

```text
every phase must prove
├─ visual identity preserved
├─ core design preserved
├─ no new long-session regression
└─ measured performance win in the target lane
```

Required proof lanes:
1. focused garden, calm watching
2. shell-heavy reading (`Feed`, `Inspect`, `Journal`)
3. battle presentation
4. long-running save continuity
5. exported session capture on a lived-in save

### What We Explicitly Will Not Do

```text
not acceptable as the primary strategy
├─ permanently lowering butterfly/caterpillar/chrysalis resolution
├─ removing trails entirely
├─ deleting atmosphere to fake smoothness
├─ gutting life sim / dialogue / ecology cadence until the game feels empty
└─ redefining "optimized" to mean "less of the game is happening"
```

### Claude Review Ask

Use this plan as a review artifact and ask Claude to critique:

1. whether the phase order is correct
2. whether any prerequisites are missing
3. whether any phase risks silently violating the visual/design guardrails
4. whether any cheaper high-impact optimization path is missing
5. whether the proof requirements are strong enough before implementation begins

### Recommended Next Step

```text
now
├─ external review on this plan
└─ no implementation until the review is incorporated
```

## Visual-First Runtime Optimization Plan Refined

_Source: `docs/VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md`_

> Companion to `VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN.md`. The original remains the intent / guardrails artifact. This document adds the concrete work items, thresholds, flags, and measurement harness needed to actually start cutting code.

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║ What this document adds on top of the original plan                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ • measurable before/after thresholds grounded in existing telemetry fields  ║
║ • a baseline capture protocol (v0) before any optimization work begins      ║
║ • per-phase work items with file-level targets                              ║
║ • feature-flag registry so each phase is individually rollback-able         ║
║ • measurement harness spec tied to scripts/run-f2-performance-*             ║
║ • explicit phase dependencies and a review-gate checklist                   ║
║ • v0.5 free-wins pass (tab-hidden pause, async decode, ring caps,           ║
║   text measure cache, IDB save path)                                        ║
║ • asset-pipeline work folded into v3 (atlas pack, WebP, alpha pre-strip)    ║
║ • render-scale knob + adaptive quality scaler folded into v5                ║
║ • object pooling folded into v2                                             ║
║ • Investigate appendix for conditional optimizations (spatial index,        ║
║   p5-bypass draw path, OffscreenCanvas, ctx hints, pre-rotated bakes)       ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

The Hard Guardrails, Non-Negotiable Rules, and "What We Explicitly Will Not Do" sections from the original plan apply verbatim. They are not restated here; re-read them before starting any phase.

---

### 0. Grounding Facts (as of 2026-04-21)

```text
stack
├─ p5.js, single main-thread render loop
├─ 6 createGraphics layers: background, entitiesBehind, entities, particles, ui, debug
├─ gameUI.js              4,340 LOC — rendered on canvas ui layer
├─ debugUI.js             2,615 LOC — rendered on canvas debug layer
├─ renderManager.js       2,356 LOC — owns composite + atmosphere cache
├─ gameCore.js            4,915 LOC — update/tick orchestration
├─ lifeSimSystem.js       1,827 LOC
├─ communicationSystem.js 3,637 LOC
├─ mlInferenceSystem.js   2,101 LOC
├─ telemetrySystem.js     1,071 LOC — source of capture metrics
└─ specialEffects.js        720 LOC
```

```text
already-present infrastructure worth knowing before planning
├─ atmosphereCacheLayers (renderManager.js) — partial dirty-layer caching exists
├─ uiLayerPixelDensity config knob — UI layer already separately tunable
├─ uiRedrawState / debugRedrawState — frame-key gated UI redraw already attempted
├─ spriteManager — wings sliced + background-stripped once at load
├─ telemetrySystem emits avgUpdateMs, avgRenderMs, avgParticleRenderMs, pressureTier
├─ saveSystem now prefers IndexedDB for the main save slot, with legacy localStorage read/migration fallback
├─ scripts/run-f2-performance-hardening-audit.js — playwright-based capture runner
└─ qa_logs/session_captures/*/capture.json — real lived-in session data
```

```text
most recent f2-performance capture (2026-04-21, 10s, 12 butterflies, 108 blocks)
├─ avgUpdateMs       6.16
├─ avgRenderMs      11.67
├─ avgParticleRenderMs 0.20
└─ pressureTier     critical      ← already flagged critical at 10s short run
```

Implication: the render path is already the dominant cost, and pressureTier is critical even on a short, small-population run. This validates the original plan's ordering (shell-UI first, not creature sprites first).

---

### Phase Ladder (with v0, review gate, and the v8 split made concrete)

```text
v0   baseline capture protocol          ← run before any work begins
   │
   ▼
review gate (checklist below)
   │
   ▼
v0.5 free-wins pass                     ← cheap, low-risk, no visual impact
   │
   ▼
v1 shell-ui separation
   │
   ▼
v2 memory-growth audit + leak closure
   │
   ▼
v3 high-resolution creature sprite baking
   │
   ▼
v4 simulation cadence split
   │
   ▼
v5 render/composite pass reduction
   │
   ▼
v6 worker offload for non-render systems
   │
   ▼
v7 trails + visual-quality restoration pass
   │
   ▼
v8a runtime-only proof
   |
   v
v8b full-stack proof
   │
   ▼
v9 renderer escalation decision
```

#### Phase dependencies (what must happen before what)

```text
v0   ──▶ every phase                baseline is the comparison surface
v0.5 ──▶ v1..v9                     free wins shift the baseline before architecture work
v1   ──▶ v5                         DOM shell means fewer canvas composite consumers
v2   ──▶ v3                         sprite cache is a leak vector; close leaks first
v2   ──▶ v6                         workers can mask leaks; fix visibility first
v4   ──▶ v6                         cadence split defines what's worth moving to a worker
v1+v2+v3+v4+v5 ──▶ v7               restoration only makes sense after wins banked
v1..v8b        ──▶ v9               escalation decision requires soak data
```

---

### Review Gate Checklist (run once, between v0 and v1)

The original plan says "no implementation until review is incorporated" but does not define the gate. Define it as follows. All five must pass before v1 begins:

1. Baseline capture (v0) exists on disk and is linked in this doc.
2. A real lived-in save file is identified and committed to `qa_logs/save_exports/` for reuse across all phases (same save at v0, v2, v4, v8a, and v8b).
3. Feature-flag registry (see below) is wired into `core/config.js` with explicit defaults recorded per flag.
4. Measurement harness (see below) produces a diff report between two captures.
5. Review-gate rubric is satisfied:
   - guardrails re-read
   - SAVE-SCHEMA-REGISTRY signed
   - geometry-freeze decision recorded in ACTIVE-PLAN-REGISTRY
   - SIM-CADENCE-CONTRACT signed
   - social measurement harness exists (`n0.5`)

Review-gate rubric status: _closed locally after the post-s3 full-duration canonical baseline landed in `BASELINE.md`._

---

### Baseline Capture Protocol — v0

**Goal.** Produce one canonical reference capture that every later phase is measured against. Without this, "improved" is unverifiable.

#### Prerequisite

```text
geometry freeze commitment required before baseline capture
|- if geometry is frozen for the duration of v0-v3, keep this baseline
`- if geometry is not frozen for the duration of v0-v3, this baseline must be re-taken after spatial s3
```

#### Work items

1. Add a `v0-baseline` label path to `scripts/run-f2-performance-hardening-audit.js` (or a thin wrapper `scripts/run-v0-baseline.js` that invokes f2 with a fixed seed + save file).
2. Extend `telemetrySystem.js` capture payload with:
   - `p50FrameMs`, `p95FrameMs`, `p99FrameMs` (not just avg)
   - `compositeCallsPerFrame` (hook `renderManager.compositeLayers()`)
   - `heapUsedMB` samples at 10s / 60s / 10min / 20min / 40min (where `performance.memory` is available; gracefully degrade otherwise)
   - `uiRedrawCount`, `debugRedrawCount` (counters already partially tracked)
3. Run each of the five proof lanes on a real, lived-in save:
   - focused garden, calm watching — 10min
   - shell-heavy reading (Feed/Inspect/Journal tours) — 10min
   - zone travel loop — 10min
   - battle scene — 5min
   - long-session soak — 40min continuous
4. Write results to `qa_logs/session_captures/v0-baseline/` and link them in a new `BASELINE.md` next to this plan.

#### Exit criteria

- One capture per lane exists under a v0-baseline directory.
- `BASELINE.md` lists the p50/p95/p99 frame time, avg render ms, avg update ms, peak heap MB, and composite calls/frame per lane.
- All later phase "target" thresholds in this doc are expressed as deltas against those numbers.

#### Feature flag

None. v0 is measurement only; no behavior change ships.

#### Risk + mitigation

- **Risk:** baseline is taken on a toy save, hiding the real failure shape.
  **Mitigation:** the review gate explicitly requires a lived-in save, committed to `qa_logs/save_exports/`.

---

### Measurement Harness Spec

Every phase produces exactly this artifact:

```text
qa_logs/session_captures/v{N}-{phase-slug}/
├─ capture-calm.json
├─ capture-shell.json
├─ capture-travel.json
├─ capture-battle.json
├─ capture-soak40.json
└─ diff-vs-baseline.md       ← generated by scripts/compare-captures.js (new)
```

`scripts/compare-captures.js` (to be written during v0 as part of harness) reads two capture directories and emits a markdown table:

```text
┌────────────────────┬────────────┬────────────┬─────────┐
│ metric             │ v0         │ v{N}       │ Δ       │
├────────────────────┼────────────┼────────────┼─────────┤
│ avgRenderMs calm   │ 11.67      │ 7.10       │ -39.1%  │
│ p95FrameMs shell   │ 24.80      │ 14.90      │ -39.9%  │
│ heapMB @ 40min     │ 612        │ 430        │ -29.7%  │
│ pressureTier calm  │ critical   │ nominal    │  ✓      │
└────────────────────┴────────────┴────────────┴─────────┘
```

A phase cannot be marked done without a `diff-vs-baseline.md` that satisfies its target thresholds.

---

### Feature Flag Registry

All flags live in `core/config.js` under `performance.flags.*`. Each phase owns one flag or setting seam; phases can be rolled back independently.

```text
performance.flags
├─ pauseWhenHidden              v0.5 default false  noLoop when tab hidden
├─ asyncImageDecode             v0.5 default false  createImageBitmap for asset decode
├─ telemetryRingCap             v0.5 default false  bound event-history ring buffer
├─ textMeasureCache             v0.5 default false  memoize textWidth per (font,size,str)
├─ saveStoreIndexedDbOnly       v0.5 default false  retire localStorage save path
├─ shellUiDom                   v1   default false  route shell panels to DOM overlay
├─ memoryAttributionEnabled     v2   default false  extended heap + retention sampling
├─ entityObjectPools            v2   default false  pool short-lived per-tick allocations
├─ bakedCreatureSprites         v3   default false  serve from appearance-key cache
├─ spriteAtlas                  v3   default false  packed atlas instead of 38 PNGs
├─ simCadenceSplit              v4   default false  staggered cadence for deep sim
├─ compositeDirtyRegions        v5   default false  skip unchanged layer composites
├─ mainRenderScale              v5   default 1.0    DPR-aware main-canvas scale knob
├─ adaptiveQualityScaler        v5   default false  auto-ramp particles/foliage on p95 breach
├─ workerOffload                v6   default false  route ML/telemetry/ecology to worker
├─ trailsQualityReduced         v7   default false  trail preset: reduced available
├─ trailsQualityFull            v7   default false  trail preset: full available
└─ rendererBatchedWebGL         v9   default false  only if v9 decides to escalate
```

Rules:
- A flag ships **off** until the phase's exit criteria are met on the baseline save.
- v0.5 flags flip to default-on only at v0.5 exit; a regression flips them back per the P8 rollback rule.
- A flag flipped **on** by default requires an entry in `docs/INTENT-AND-EXCLUSIONS-LEDGER.md` noting the decision.
- No flag may silently permanently downgrade visual identity (see original plan's non-negotiables).

#### P8 Flag-Rollback Rule

If a default-on flag produces a regression against `v0`, flip to
`default-off` within the same release, record the regression in `qa_logs/`,
and do not re-flip until a `diff-vs-baseline.md` shows the cause fixed.

---

### Phase Details (Refined)

Each phase below keeps the original Intent / Must-Preserve sections and adds: **baseline metric → target**, **work items**, **feature flag**, **risk + mitigation**.

---

#### v0.5. Free-Wins Pass

**Goal.** Five low-risk, no-visual-impact changes that improve the v0 baseline before any architectural work begins. Each is independently flagged so a regression in one doesn't block the others.

```text
scope
├─ tab-hidden pause / RAF throttle
├─ async image decode (createImageBitmap)
├─ telemetry event-history ring cap
├─ textWidth memoization
└─ retire localStorage save path in favor of IndexedDB
```

**Baseline metric → target** (against v0)
- `heapMB @ 40min` with tab backgrounded for 10min mid-session: **target −40% or better** (tab-hidden pause does the work).
- Cold-start time to interactive: **target −15% or better** (createImageBitmap).
- `avgRenderMs shell` on panels that stay on canvas post-v1: **target −10%** from textWidth cache alone.
- Autosave main-thread stall: **target ≤ 1 ms p95** (IndexedDB async path).

**Work items**

1. **Tab-hidden pause.** In `core/gameCore.js`, register `document.addEventListener('visibilitychange', ...)`. On `document.hidden === true`: call `noLoop()` and record a "pause-for-hidden" telemetry event. On return: `loop()` and reset frame-time tracker so the first resumed frame doesn't poison the p95. Behind `flags.pauseWhenHidden` (default false until `v0.5` exit).
2. **Async image decode.** In `core/spriteManager.js`, replace `loadImage(path)` with a helper that `fetch(path).then(r => r.blob()).then(createImageBitmap)` where supported; fall back to `loadImage` when `createImageBitmap` is absent. Result stored as a p5-compatible image wrapper. Behind `flags.asyncImageDecode` (default false until `v0.5` exit).
3. **Telemetry ring cap.** In `systems/telemetrySystem.js`, cap the event-history array at `performance.telemetry.eventHistoryMax` (new config, default 2000). Drop oldest on overflow. Capture payload gains `eventHistoryDroppedCount` so we can see when we're truncating. Behind `flags.telemetryRingCap` (default false until `v0.5` exit).
4. **Text-measurement cache.** New helper `ui/textMeasureCache.js` exporting `measure(str, font, size)`. Backing `Map` keyed on the tuple. Eviction: simple size cap (default 4096 entries). `ui/gameUI.js` and `ui/debugUI.js` call it instead of raw `textWidth`. Behind `flags.textMeasureCache` (default false until `v0.5` exit).
5. **IndexedDB save migration proof.** The main save path now prefers IndexedDB with legacy `localStorage` read/migration fallback. v0.5 should validate that path on a real lived-in save, trim remaining debug/audit storage pressure, and only then decide whether `flags.saveStoreIndexedDbOnly` should retire the legacy fallback entirely. Do **not** re-implement the save backend from scratch here.

**Feature flags:** see registry. The four `v0.5` flags start default-off and only flip default-on at `v0.5` exit if their regression checks stay clean. The save-store migration defaults off until migration is proven.

**Risk + mitigation**
- **Risk:** tab-hidden pause misses `requestAnimationFrame` edge cases and the game stalls on return.
  **Mitigation:** resume path calls `loop()` explicitly and verifies `frameCount` advances within 2 frames; telemetry records the resume event.
- **Risk:** `createImageBitmap` wrappers don't match the p5.Image API fully, breaking downstream code.
  **Mitigation:** thin adapter that exposes `.width`, `.height`, `.get()`. Any consumer that needs more falls back to `loadImage`.
- **Risk:** text cache returns stale width after font change.
  **Mitigation:** key includes font name + size; any font swap path invalidates the cache.
- **Risk:** save migration loses a player's save.
  **Mitigation:** dual-read for one release (read IDB first, fall back to localStorage); only purge localStorage after an IDB write succeeds.

**Exit criteria**
- All four `v0.5` flags verified against v0 lanes; delta reports land in `qa_logs/session_captures/v0.5-free-wins/diff-vs-baseline.md`.
- Any `v0.5` flag that regresses against baseline remains default-off under the P8 rollback rule.
- Save migration proven on the committed lived-in save + at least one other real save.

---

#### v1. Shell-UI Separation

**Original intent preserved.** Move text-heavy static UI out of the main canvas redraw path; keep art scene on canvas; shell chrome in DOM.

```text
scope (ordered by expected shell-cost impact)
1. Feed      — long scrolling list, redrawn every frame even when idle
2. Journal   — text-heavy, rarely interactive
3. Inspect   — medium text + small portrait, currently on canvas ui layer
4. Access    — menu surface, mostly static
5. debug     — developer-only, lowest priority within v1
```

**Baseline metric → target** (against v0 shell-heavy lane)
- `avgRenderMs shell` baseline: TBD at v0 — **target: −30% or better**
- `uiRedrawCount / sec shell` baseline: TBD — **target: redraw only on state change (≤1 Hz when idle on a panel)**

**Work items**
1. Create `ui/dom/` directory. One file per panel: `feedPanel.js`, `journalPanel.js`, `inspectPanel.js`, `accessPanel.js`.
2. Each panel exports `mount(container, state)`, `update(state)`, `unmount()`. State shape documented in a new `ui/dom/README.md`.
3. Add a top-level `<div id="shell-overlay">` in `index.html`, z-indexed above the p5 canvas, pointer-events gated per panel.
4. Behind `flags.shellUiDom`, `gameUI.js` stops drawing Feed/Journal/Inspect/Access text to the canvas `ui` layer and instead dispatches state to the DOM panels via `eventBus`.
5. Keep canvas-side input routing for the garden; DOM panels handle their own events and call back through `eventBus`.
6. Session capture tooling (`telemetrySystem.js`) must still record "panel open/close" events — extend the event emitters, not the capture reader.
7. Accessibility parity: the DOM panels must pass the same keyboard-navigation flow already documented in `PAPILIONEM-PLAYER-GUIDE.md`.

**Feature flag:** `performance.flags.shellUiDom`. Default off until all five panels are migrated and exit criteria pass on the baseline save.

**Risk + mitigation**
- **Risk:** DOM panels diverge visually from canvas style and violate the "visual identity preserved" guardrail.
  **Mitigation:** screenshot parity test — capture each panel open on baseline save before/after flag and visually diff.
- **Risk:** input routing regression — buttons double-fire or swallow clicks destined for the garden.
  **Mitigation:** event-bus contract test in `scripts/run-a5-control-continuity-audit.js` extended to cover DOM panels.
- **Risk:** capture tooling stops recording panel content because it was reading canvas pixels.
  **Mitigation:** capture reads state objects from `gameUI.js`, not canvas — verify before flip.

---

#### v2. Memory-Growth Audit + Leak Closure

**Original intent preserved.**

**Baseline metric → target** (against v0 soak-40 lane)
- `heapMB @ 40min` baseline: TBD — **target: ≤ 1.3× `heapMB @ 10min` of the same session** (i.e., growth factor bounded).
- No unbounded array in `communicationSystem.js` dialogue history, `telemetrySystem.js` event history, or `specialEffects.js` residue.

**Work items**
1. Land the extended heap sampling from v0 (it carries forward — this is the phase that *acts* on it).
2. Add a retention attribution pass: a small dev-only panel (behind `flags.memoryAttributionEnabled`) that snapshots `performance.memory` and counts entries in the known suspect collections:
   - `renderManager.worldSectionAssets` and atmosphere caches
   - dialogue / feed / journal history in `communicationSystem.js`
   - telemetry event ring buffer in `telemetrySystem.js`
   - particle / residue pools in `specialEffects.js`
   - capture/export staging buffers
3. For each collection that grows unboundedly across the 40min soak: apply a bounded ring buffer or eviction rule. Do **not** shrink user-visible history (dialogue, feed) silently — if eviction is needed, persist to disk-backed history with a documented cap.
4. Fix leaks identified, one PR per subsystem, each with a before/after capture.
5. **Object pooling for per-tick allocations.** Introduce pools for the hottest short-lived allocation sites — particle records in `systems/specialEffects.js`, per-tick temp vectors in `systems/behaviorSystem.js` / `systems/interactionSystem.js`, and ephemeral arrays in `systems/communicationSystem.js` message formatting. Pools live behind `flags.entityObjectPools` so they can be toggled off if any correctness issue surfaces. Primary goal is to flatten GC pauses during the 40min soak, not raw throughput.

**Feature flag:** `performance.flags.memoryAttributionEnabled` gates the dev panel. `performance.flags.entityObjectPools` gates the pooling rollout. Leak *fixes* (bounded ring buffers, eviction rules) ship unflagged (they're correctness).

**Risk + mitigation**
- **Risk:** eviction drops dialogue or feed rows a player was reading, violating "current shell features" preservation.
  **Mitigation:** any cap ≥ 2× what a lived-in save contains at 40min; verified against the real save before ship.
- **Risk:** baking sprites (v3) masks leak signal if v3 lands first.
  **Mitigation:** dependency enforced — v2 ships before v3.

---

#### v3. High-Resolution Creature Sprite Baking

**Original intent preserved.**

**Baseline metric → target**
- `avgRenderMs calm` must not regress vs post-v1+v2 numbers. **Target: ≤ post-v2 calm render ms**, with creature resolution restored to design intent.
- Sprite cache size bounded (see mitigation below).

**Work items**
1. Define the **appearance key** schema. Initial proposal:
   ```
   sex | personalityType | baseType (for hybrids) | wingDonor signatures | variant tint hash
   ```
   Document in `core/spriteManager.js` header comment and in a new `docs/SPRITE-CACHE-CONTRACT.md`.
2. Extend `spriteManager.js` with `getBakedSprite(spec): p5.Graphics`. First call composites body + antenna + four wing pieces into a single offscreen graphic at the source resolution; subsequent calls return cached.
3. Creature entity render paths (`entities/butterfly.js` and related) call `getBakedSprite` instead of compositing pieces every frame. Animation (wing flap, tilt) applied as transforms over the baked sprite, not by recompositing.
4. Cache size bound: LRU with cap from `performance.cache.maxBakedSprites` (new config, default 256). Eviction frees the `p5.Graphics` via `remove()`.
5. Appearance invalidation: any mutation of a creature's appearance key invalidates that key's cache entry.
6. Sex/variant/genetic readability audit — screenshot parity against v0 for each personality × sex.
7. **Sprite atlas + asset pipeline pass.** Add a build step `scripts/pack-sprite-atlases.js` that:
   - packs the 38 wing / body / antenna PNGs into 1–2 atlases and emits a JSON manifest of per-piece UV coords.
   - converts sources to WebP (lossless or high-quality lossy — verify no perceptible diff against the original against the creature readability audit in item 6).
   - performs alpha pre-stripping at build time, so `spriteManager._removeBlackBackground` and its `loadPixels`/`updatePixels` roundtrip can be **deleted from the runtime path**.
   Runtime: `spriteManager.initialize` loads the atlases and the manifest, slices via manifest coords, and feeds the appearance-key cache. Behind `flags.spriteAtlas`. The raw-PNG path stays as fallback until the atlas path is proven on all lanes.

**Feature flag:** `performance.flags.bakedCreatureSprites` for the runtime cache. `performance.flags.spriteAtlas` for the atlas asset source. They compose: atlas-on + cache-on is the target end state.

**Risk + mitigation**
- **Risk:** animation shortcuts make wings look stiff, violating "expressive creature readability".
  **Mitigation:** baked sprite retains wing-piece sub-regions as animatable; transform budget is per-piece, not per-whole-sprite. Screenshot a flapping comparison.
- **Risk:** cache becomes a leak (retained `p5.Graphics`).
  **Mitigation:** v2 infrastructure detects it; LRU eviction enforced.

---

#### v4. Simulation Cadence Split

**Original intent preserved.**

**Baseline metric → target**
- `avgUpdateMs calm` baseline 6.16 — **target: ≤ 3.0 ms** with no core-sim family disabled.
- No visible behavior regression on scripted scenarios (see work item 5).

**Work items**
1. Document current cadence in `docs/SIM-CADENCE-CONTRACT.md` (new). One row per system: current tick interval, proposed interval, rationale.
2. Gated on social `n1` family lock. Cadence values must be proposed in `docs/SIM-CADENCE-CONTRACT.md` with `social-n1` as a co-owner.
3. Proposed staggered cadences (starting point; tune from captures):
   - flight / movement / battle motion: every frame
   - life-sim deep evaluation: every 6 frames, phase-staggered per butterfly
   - ecology refresh: every 30 frames
   - ML scoring: every 12 frames, phase-staggered
   - dialogue/feed shaping: event-driven
4. Implement via a scheduler in `core/gameCore.js` that takes `(systemId, interval, phase)` and owns the divmod.
5. Time-budget guard: if a staggered tick exceeds its budget, the scheduler logs to telemetry (do not skip; visibility first).
6. Scripted behavior parity: a new `scripts/run-sim-cadence-parity.js` runs two seeds for N ticks with flag off and on, compares per-tick observable state (positions quantized to grid, relationship edge set, ecology summary). Bounded divergence allowed; unbounded drift fails the phase.

**Feature flag:** `performance.flags.simCadenceSplit`.

**Risk + mitigation**
- **Risk:** emergent behavior dulls when sim ticks less often, violating "emergent behavior integrity".
  **Mitigation:** parity script + a 1-hour observation run logged to `qa_logs/` with the flag on.
- **Risk:** battle fairness shifts because battle still reads sim state.
  **Mitigation:** battle system continues to read on its own cadence; cadence split never applies *inside* `battleSystem.js`.

---

#### v5. Render / Composite Pass Reduction

**Original intent preserved.** This phase is partially prefigured by existing `atmosphereCacheLayers` — expand that pattern, do not re-invent it.

**Baseline metric → target**
- `compositeCallsPerFrame calm` baseline: TBD — **target: −50% or better**.
- `avgRenderMs calm` post-v5: **target: ≤ 5.0 ms** (combined with wins from v1).

**Work items**
1. Audit pass on `renderManager.compositeLayers()` (line 2146) and `drawEntitiesLayer()` (line 735). Classify each full-canvas operation as: *always-needed*, *only-on-state-change*, or *skippable-when-flag-on*.
2. Extend the existing atmosphere cache pattern to: background, entitiesBehind, ui (post-v1 DOM shift should empty this most frames), debug.
3. Dirty signaling — each owning system marks its layer dirty on state change; the composite step skips clean layers.
4. Battle scene is explicitly excluded from aggressive dirty gating in v5 (battle runs short, readability matters more than composite savings); revisit in v9.
5. Before/after screenshot sweep across all five proof lanes to catch "scene still looks like the intended game" regressions.
6. **Main-canvas render-scale knob.** Add `performance.flags.mainRenderScale` (default 1.0, player-settable 0.75–1.25). On a 2× or 3× DPR display a full-canvas composite pays 4×/9× pixel bandwidth; a render-scale <1.0 is the single biggest lever on HiDPI laptops. UI layer stays at full DPR via the existing `uiLayerPixelDensity` knob, so text readability is preserved. Expose as an accessibility setting so players opt in.
7. **Adaptive quality scaler.** Behind `flags.adaptiveQualityScaler`: a controller that watches rolling `p95FrameMs`. If it exceeds the budget for N consecutive seconds, ramp down in tiers: particle cap → 0.5×, foliage wave → static frame, background re-render cadence → halved. Ramps back automatically when frame time recovers for M consecutive seconds. Every ramp emits a telemetry event so the player-facing doc can explain it honestly. This is the "temporary visual fallback explicitly marked temporary" guardrail from the original plan, implemented as a measured controller rather than a silent downgrade.

8. **Negotiation rule.** `adaptiveQualityScaler` never reduces quality below what `mainRenderScale` establishes as the player-expressed floor. The player setting is a hard lower bound on particles, foliage, and background cadence.

**Feature flag:** `performance.flags.compositeDirtyRegions` for dirty-gating. `performance.flags.mainRenderScale` as a numeric knob. `performance.flags.adaptiveQualityScaler` for the auto-ramp.

**Risk + mitigation**
- **Risk:** dirty-gating misses a mutation and leaves stale pixels — visible artifact.
  **Mitigation:** a dev-mode overlay (debug flag) tints each layer by dirty-state so visual bugs are caught in QA.
- **Risk:** covered/behind-wall spatial staging breaks because entitiesBehind skips composite on a frame it shouldn't.
  **Mitigation:** entitiesBehind dirty rule errs on the side of always-dirty when any creature crosses a zone boundary.

---

#### v6. Worker Offload For Non-Render Systems

**Original intent preserved.**

**Baseline metric → target**
- `p95FrameMs calm` post-v5 baseline: TBD — **target: −25% after v6**.
- Save/load roundtrip correctness: **100% match against pre-v6 saves** (no new state lives only in a worker).

**Work items**
1. Worker bootstrap module `workers/offloadHost.js` — owns a pool of one worker (start simple).
2. Protocol: structured-clone messages with `{kind, seq, payload}`. First kinds: `ml.infer`, `telemetry.aggregate`, `ecology.summarize`, `dialogue.format`.
3. `mlInferenceSystem.js` splits into `mlInferenceCore.js` (pure) + `mlInferenceSystem.js` (orchestrator). Core is what the worker loads.
4. Fallback: if `Worker` is unavailable or a message times out (>250 ms budget), orchestrator runs core inline. No silent data loss.
5. Determinism: any RNG used inside worker paths must accept a seed from the main thread; no worker-local `Math.random` for gameplay-affecting code.

**Feature flag:** `performance.flags.workerOffload`.

**Risk + mitigation**
- **Risk:** save/load drift because worker state isn't serialized.
  **Mitigation:** worker is stateless — only the orchestrator holds state; save/load exercises unchanged code paths. Roundtrip test required.
- **Risk:** ownership confusion where two subsystems both touch a value.
  **Mitigation:** only four `kind`s land in v6; expansion requires a follow-up phase.

---

#### v7. Trails + Visual-Quality Restoration Pass

**Original intent preserved.**

**Baseline metric → target**
- With `trailsQualityReduced` on: `avgRenderMs calm` ≤ 1.5× the off-baseline.
- With `trailsQualityFull` on: `avgRenderMs calm` ≤ 2.5× the off-baseline (full is allowed to be heaviest, but must remain playable).
- With both off (default): parity with post-v5 numbers.

**Work items**
1. Add `settings.trails: 'off' | 'reduced' | 'full'` to save file, default `off`.
2. Route the two non-off modes behind the paired flags `trailsQualityReduced` and `trailsQualityFull`.
3. Update the accessibility/settings UI (DOM, per v1) with the three-state control, copy drawn from the original plan's wording.
4. Player-facing doc update in `docs/PAPILIONEM-PLAYER-GUIDE.md` — short section describing the three settings.
5. QA: capture the calm lane under each setting. Numbers recorded in `BASELINE.md` as the v7 row.

**Feature flag:** two paired flags; see registry. `off` needs no flag.

**Risk + mitigation**
- **Risk:** `reduced` or `full` silently becomes the default.
  **Mitigation:** save file schema test: new saves must serialize `trails: 'off'` unless the player explicitly changed it.

---

#### v8a. Runtime-Only Proof

**Original intent preserved.**

**Baseline metric → target**
- All five proof lanes pass their per-phase targets *on the committed lived-in save* with spatial and social state held frozen.
- Zero `freezeSuspects`, zero `errors`, ≤ 3 `warnings` across the 40min soak capture.

**Work items**
1. Re-run the full harness (five lanes) with all v1–v7 flags on, against the committed lived-in save.
2. Produce a single consolidated `qa_logs/session_captures/v8a-runtime-proof/REPORT.md` summarizing against v0.
3. Update `docs/ACTIVE-PUBLIC-SHARE-BOARD.md` to reflect that the runtime blocker is cleared (or, if it isn't, list which lane failed — triggers v9).
4. Hold a no-flag run on the same save to confirm default behavior is still correct (regression insurance).

**Feature flag:** none. This phase is proof, not behavior.

**Risk + mitigation**
- **Risk:** passing on the committed save but failing on other lived-in saves.
  **Mitigation:** soak on at least one additional real save drawn from the save-export archive.

---

#### v8b. Full-Stack Proof

**Original intent preserved.**

**Baseline metric → target**
- Runtime gains from `v1` through `v7` still hold after `s7` and `n8` ship on the migrated lived-in save.
- Zero `freezeSuspects`, zero `errors`, ≤ 3 `warnings` across the 40min soak capture on the migrated save.

**Work items**
1. Re-run the full harness on the migrated lived-in save after `s7` and `n8` land.
2. Produce `qa_logs/session_captures/v8b-full-stack-proof/REPORT.md` against both v0 and v8a.
3. Confirm the migrated save keeps identity, memories, relationships, and lineage intact while runtime targets still hold.

**Feature flag:** none. This phase is proof, not behavior.

**Risk + mitigation**
- **Risk:** full-stack migration hides whether a regression is runtime, spatial, or social.
  **Mitigation:** `v8a` must close first, so `v8b` is judged against both the original baseline and the runtime-only proof.

---

#### v9. Renderer Escalation Decision

**Original intent preserved.**

**Decision criteria (make explicit what "not enough" means)**
- If after v8 any of these hold, open a separate batched-WebGL renderer plan:
  - `avgRenderMs calm` > 6.0 ms on the lived-in save
  - `p95FrameMs battle` > 33 ms
  - any freezeSuspect recorded in the 40min soak
- Otherwise record the keep decision in `docs/INTENT-AND-EXCLUSIONS-LEDGER.md` with the numbers that justified it.

**Work items**
1. Write `docs/RENDERER-ESCALATION-DECISION.md` containing the decision, numbers, and (if keeping) the re-evaluation trigger condition.
2. If escalating, open a new plan document — do not append renderer-rewrite work items to this plan.

**Feature flag:** `performance.flags.rendererBatchedWebGL` exists in the registry only as a placeholder; phase v9 decides whether it ever gets wired up.

---

### Proof Requirements (unchanged)

The original plan's five proof lanes are authoritative. This document adds: **every phase produces one capture per lane, one diff-vs-baseline report, and signs off only when the diff passes the target threshold.** No prose-only sign-off.

---

### Investigate Appendix (promote to a phase only if v0 captures justify it)

These are real optimizations, but their ROI depends on what v0 actually shows. Do not schedule them up front. If v0 or post-v5 captures indicate the specific failure mode below, promote the relevant item into the phase noted.

```text
trigger condition                              → candidate                         → promote into
──────────────────────────────────────────────────────────────────────────────────────────────────
avgUpdateMs rises super-linearly with pop      spatial index (grid / quadtree)     v4 addendum
entity draw dominates post-v3 + v5             drop p5 wrappers in hot draw path   v5 addendum
browser supports OffscreenCanvas + worker wins OffscreenCanvas for atmosphere/bg   v6 addendum
presentation stalls visible in capture         canvas context hints (desync/alpha) v5 addendum
rotate/scale cost still visible on entities    pre-rotated bake variants in LRU    v3 addendum
```

#### C1. Spatial index for entity queries
Proximity queries in `systems/interactionSystem.js`, `systems/behaviorSystem.js`, `systems/communicationSystem.js` are likely O(n²). Fine at 12 creatures, expensive at 60+. Uniform grid first (simpler), quadtree if non-uniform density becomes a problem.

#### C2. Drop p5 wrappers in hottest entity draw path
`image()/push/pop/translate/rotate` each carry measurable per-call overhead. Bypass to raw 2D context in the one file that does per-entity draws (likely `entities/butterfly.js`). Typically reclaims 20–40% of entity render cost. Scope: one file, one code path, behind a flag.

#### C3. OffscreenCanvas for atmosphere/background
Natural pair with v6. OffscreenCanvas is worker-transferable, so static caches can be composed off the main thread on supported browsers. Gate on feature detection; fall back to current path.

#### C4. Canvas context hints
`createGraphics` wraps `getContext('2d')`. Passing `{ desynchronized: true, alpha: <needed> }` can reduce presentation stalls. Low code risk, browser-dependent benefit — worth a quick probe if v5 captures show presentation-bound frames.

#### C5. Pre-rotated/pre-scaled bake variants
Inside the v3 sprite cache, bake a small N of pre-rotated frames to avoid per-frame `rotate()` transform cost. Memory tradeoff stays inside the LRU cap.

---

### Open Questions (to resolve during the review gate)

1. Which concrete lived-in save is the baseline? It should be a fresh export from the author's longest-running garden, not the `h5` fixture world.
2. Is there appetite to make v7's `reduced` the default *after* v8 proves headroom, or do we keep `off` as default forever? Original plan says keep `off` default.
3. Is Playwright the right driver for the 40min soak, or should soak be run manually with capture enabled? Playwright is fine for short lanes; soak likely wants a manual run with `npm run playtest` + capture button.
4. Do we have a named reviewer for the review-gate sign-off, or does the author self-review?

---

### Recommended Next Step

```text
now
├─ freeze or supersede `ACTIVE-RUNTIME-HARDENING-BOARD.md` so there is one live implementation sequence
├─ answer the four open questions above
├─ export and commit the real baseline save file to `qa_logs/save_exports/`
├─ execute v0 (baseline capture protocol)
├─ execute v0.5 (free-wins pass) and re-run the baseline harness
└─ then — and only then — begin v1
```

## Baseline Ledger

_Source: `docs/BASELINE.md`_

### Purpose

This document is the canonical home for the `v0` lived-in-save baseline.

```text
baseline flow
real lived-in save export
        │
        ▼
run `node scripts/run-v0-baseline.js`
        │
        ▼
qa_logs/session_captures/v0-baseline/<stamp>/
        │
        ├─ capture-calm.json
        ├─ capture-shell.json
        ├─ capture-travel.json
        ├─ capture-battle.json
        ├─ capture-soak40.json
        └─ diff-vs-baseline.md   (for later phases)
```

### Current Status

```text
v0 baseline
├─ harness scripts               -> live
├─ compare script                -> live
├─ fixture smoke                 -> live
├─ real lived-in save export     -> live
├─ real-save import path         -> live
├─ quick five-lane real-save run -> live
├─ pre-s3 canonical full-duration -> historical
├─ post-s3 quick recapture         -> live
└─ post-s3 canonical full-duration -> live
```

### Required Inputs

- `qa_logs/save_exports/<real-lived-in-save>/save.json`
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)

### Closure Conditions

`v0` only closes when all of the following are true:

1. the baseline run used a real lived-in save export, not the fixture world
2. all five capture lanes exist on disk
3. the saved captures include frame percentiles, composite calls per frame,
   redraw counts, and heap milestone data where available
4. the baseline directory is linked below
5. the review-gate checklist in the refined plan can point back here

Those conditions are now satisfied for the post-`s3` runtime baseline.

### Baseline Runs

```text
fixture smoke only
└─ [2026-04-21T21-47-27-533Z](../qa_logs/session_captures/v0-baseline/2026-04-21T21-47-27-533Z)
   ├─ save kind        -> fixture export
   ├─ purpose          -> harness validation only
   ├─ calm             -> update 3.01ms | render 10.73ms | p95 14.70ms
   ├─ shell            -> update 2.57ms | render 14.67ms | p95 22.00ms
   ├─ travel           -> update 4.04ms | render 15.97ms | p95 27.50ms
   ├─ battle           -> update 4.60ms | render 12.72ms | p95 21.70ms
   └─ soak40           -> update 3.60ms | render 17.99ms | p95 26.20ms

real-lived-in baseline blocked in battle
└─ [2026-04-21T22-12-09-446Z](../qa_logs/session_captures/v0-baseline/2026-04-21T22-12-09-446Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ import           -> restored cleanly through IndexedDB-backed storage
   ├─ calm             -> update 26.95ms | render 28.15ms | p95 71.70ms
   ├─ shell            -> update 24.64ms | render 32.54ms | p95 76.70ms
   ├─ travel           -> update 23.45ms | render 32.46ms | p95 72.40ms
   └─ blocker          -> quick run still timed out in the battle lane before full closure

pre-s3 quick real-save baseline
└─ [2026-04-22T00-52-16-156Z](../qa_logs/session_captures/v0-baseline/2026-04-22T00-52-16-156Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> not frozen through `v0-v3`; retake after spatial `s3`
   ├─ calm             -> update 26.40ms | render 28.94ms | p95 74.40ms
   ├─ shell            -> update 25.34ms | render 34.55ms | p95 85.00ms
   ├─ travel           -> update 24.57ms | render 37.11ms | p95 75.30ms
   ├─ battle           -> update 39.01ms | render 48.02ms | p95 108.90ms
   ├─ soak40           -> update 25.43ms | render 29.08ms | p95 74.90ms
   └─ pressure         -> `critical` in all five quick lanes

pre-s3 full-duration canonical baseline
└─ [2026-04-22T01-24-32-742Z](../qa_logs/session_captures/v0-baseline/2026-04-22T01-24-32-742Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> not frozen through `v0-v3`; retake after spatial `s3`
   ├─ calm             -> update 21.49ms | render 30.73ms | p95 68.60ms | heap 124.93MB
   ├─ shell            -> update 22.58ms | render 39.40ms | p95 79.70ms | heap 159.26MB
   ├─ travel           -> update 32.38ms | render 37.57ms | p95 86.50ms | heap 159.26MB
   ├─ battle           -> update 45.13ms | render 41.11ms | p95 114.80ms | heap 159.26MB
   ├─ soak40           -> update 36.14ms | render 37.64ms | p95 89.60ms | heap 256.54MB
   ├─ runtime issues   -> 0
   ├─ pressure         -> `critical` in all five full-duration lanes
   └─ current state    -> historical reference only; superseded for review-gate purposes once `s3` landed

post-s3 quick real-save baseline
└─ [2026-04-22T21-29-05-105Z](../qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> re-taken after spatial `s3`
   ├─ calm             -> update 25.20ms | render 25.35ms | p95 68.60ms | heap 124.93MB
   ├─ shell            -> update 24.06ms | render 30.82ms | p95 73.80ms | heap 124.93MB
   ├─ travel           -> update 23.94ms | render 33.94ms | p95 83.30ms | heap 124.93MB
   ├─ battle           -> update 38.85ms | render 44.91ms | p95 101.00ms | heap 124.93MB
   ├─ soak40           -> update 24.46ms | render 27.76ms | p95 70.10ms | heap 124.93MB
   ├─ pressure         -> `critical` in all five quick lanes
   └─ current use      -> comparison surface for the live `v0.5` rollback pass

post-s3 full-duration canonical baseline
└─ [2026-04-22T22-11-18-179Z](../qa_logs/session_captures/v0-baseline/2026-04-22T22-11-18-179Z)
   ├─ save kind        -> real export
   ├─ source           -> `2026-04-21T21-56-03-846Z-playtest-manual`
   ├─ geometry         -> re-taken after spatial `s3`
   ├─ calm             -> update 24.17ms | render 24.58ms | p95 67.10ms | heap 124.93MB
   ├─ shell            -> update 25.73ms | render 32.08ms | p95 72.10ms | heap 168.80MB
   ├─ travel           -> update 25.54ms | render 35.08ms | p95 74.00ms | heap 168.80MB
   ├─ battle           -> update 36.98ms | render 43.52ms | p95 99.80ms | heap 168.80MB
   ├─ soak40           -> update 26.34ms | render 27.56ms | p95 71.60ms | heap 272.75MB
   ├─ runtime issues   -> 0
   ├─ pressure         -> `critical` in all five full-duration lanes
   ├─ hottest shell    -> compositeMs 14.28ms | entitiesComposite 13.35ms
   ├─ hottest battle   -> uiLayerMs 20.00ms | entityLayerMs 16.40ms
   └─ current use      -> canonical post-`s3` comparison surface for `v1+`
```

### V7 Restoration Proof

```text
live default (trails off)
└─ [2026-04-25T22-43-28-136Z](../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-43-28-136Z/report.json)
   ├─ proof lane       -> lived-in `h5`
   ├─ calm             -> update 6.76ms | render 13.33ms
   ├─ shell            -> update 12.06ms | render 12.95ms
   ├─ export p95       -> 31.40ms
   └─ role             -> shipped runtime default after `v7`
```

```text
reduced trails
└─ [2026-04-25T22-46-43-006Z](../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-46-43-006Z/report.json)
   ├─ proof lane       -> lived-in `h5`
   ├─ calm             -> update 6.56ms | render 12.96ms
   ├─ shell            -> update 10.60ms | render 13.08ms
   └─ ratio vs off     -> calm render 12.96 / 13.33 = 0.97x
```

```text
full trails
└─ [2026-04-25T22-44-10-129Z](../qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-44-10-129Z/report.json)
   ├─ proof lane       -> lived-in `h5`
   ├─ calm             -> update 6.89ms | render 13.13ms
   ├─ shell            -> update 9.81ms | render 12.77ms
   └─ ratio vs off     -> calm render 13.13 / 13.33 = 0.98x
```

```text
restoration guardrails
├─ sharp-creature parity
│  └─ [2026-04-25T22-42-38-064Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-25T22-42-38-064Z/report.json)
│     └─ read -> pass
├─ readability under heaviest player path
│  └─ [2026-04-25T22-45-01-908Z](../qa_screenshots/r4_ui_readability_audit/2026-04-25T22-45-01-908Z/report.json)
│     └─ read -> pass
└─ battle presentation note
   ├─ [control](../qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-40-44-517Z/report.json)
   ├─ [candidate](../qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-39-53-556Z/report.json)
   └─ both failed the same guard-only fixture, so `r5` was not used as the `v7` differentiator
```

### Notes

- `scripts/run-v0-baseline.js --quick --allow-fixture` is allowed only as a
  harness smoke pass, not as the canonical baseline.
- `scripts/run-v0-baseline.js --quick` on the real lived-in save is still useful
  for rapid iteration, but it is not the full proof lane.
- the pre-`s3` canonical reference is now historical:
  `qa_logs/session_captures/v0-baseline/2026-04-22T01-24-32-742Z/`.
- the post-`s3` quick comparison surface remains useful for short iteration:
  `qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z/`.
- the canonical runtime comparison surface is now the post-`s3`
  full-duration run:
  `qa_logs/session_captures/v0-baseline/2026-04-22T22-11-18-179Z/`.
- later phases should write `diff-vs-baseline.md` via
  `scripts/compare-captures.js`.

## V0.5 Free-Wins Audit

_Source: `docs/V0-5-FREE-WINS-AUDIT.md`_

### Purpose

This is the closure note for the `v0.5` runtime phase.

```text
v0.5
├─ seam audit                 -> proves the flags really wire into the runtime
├─ post-s3 quick baseline     -> re-taken with the flags forced back off
├─ post-s3 quick compare      -> measures the same save with the flags forced on
└─ rollback rule              -> if the compare regresses, defaults stay off
```

`v0.5` is now locally closed:
- all four flags were verified individually against the post-`s3` quick baseline
- every regressing flag remains default-off under the `P8` rollback rule
- save migration was proven on the committed lived-in save and on one derived
  second real save export

### Live Runtime State

```text
implemented
├─ pauseWhenHidden
├─ asyncImageDecode
├─ telemetryRingCap
└─ textMeasureCache

default state
└─ all four flags remain default-off in core/config.js
```

Reason:
- the dedicated seam audit passed
- the full all-on compare regressed visible-frame lanes
- the one-flag isolation pass proved no flag clean enough to justify a
  default-on flip yet
- per the `P8` rollback rule, defaults stay off until a later diff proves a
  specific flag safe to re-enable

### Evidence

#### 1. Dedicated seam audit

```text
proof lane
├─ flag overrides live         -> pass
├─ async decode mode           -> pass
├─ pause / resume hidden tab   -> pass
├─ telemetry ring caps         -> pass
├─ text-measure cache          -> pass
└─ IndexedDB-backed save read  -> pass
```

Artifacts:
- [report.json](../qa_screenshots/v0_5_free_wins_audit/2026-04-22T21-20-36-620Z/report.json)

#### 2. Post-s3 quick baseline with flags off

```text
baseline
└─ qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z
```

Artifacts:
- [summary.json](../qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z/summary.json)
- [report.json](../qa_logs/session_captures/v0-baseline/2026-04-22T21-29-05-105Z/report.json)

#### 3. Post-s3 quick candidate with all four runtime flags on

```text
candidate
└─ qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z
```

Artifacts:
- [summary.json](../qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z/summary.json)
- [report.json](../qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z/report.json)
- [diff-vs-post-s3-baseline.md](../qa_logs/session_captures/v0.5-free-wins/2026-04-22T21-26-17-254Z/diff-vs-post-s3-baseline.md)

### Honest Read

```text
best results
├─ shell render      -> slightly improved
├─ travel p95/p99    -> improved
└─ seam wiring        -> proven

remaining regressions
├─ calm update/render -> worse
├─ battle p50/p95     -> worse
└─ soak render         -> slightly worse
```

That is not good enough to claim that any `v0.5` runtime flag has earned
default-on status.

#### 4. One-flag isolation

```text
single-flag isolates
├─ pauseWhenHidden     -> foreground lanes not clean enough to flip on
├─ asyncImageDecode    -> battle/soak improve, calm/shell regress
├─ telemetryRingCap    -> near-neutral, but not clean enough to call earned
└─ textMeasureCache    -> clearest repeatable regressor
```

Artifacts:
- [SUMMARY.md](../qa_logs/session_captures/v0.5-flag-isolation/2026-04-22T21-36-57-211Z/SUMMARY.md)
- [report.json](../qa_logs/session_captures/v0.5-flag-isolation/2026-04-22T21-36-57-211Z/report.json)

#### 5. Save migration on a second real save

```text
save proof
├─ committed lived-in export      -> restored and saved through IndexedDB
└─ derived second real save export -> restored and saved through IndexedDB
```

Artifacts:
- [report.json](../qa_screenshots/v0_5_save_migration_proof/2026-04-22T21-44-28-634Z/report.json)

### Phase Result

```text
v0.5 closure
├─ implemented seams      -> live
├─ default-on flips       -> none earned yet
├─ save migration proof   -> live
└─ runtime state          -> safe to proceed with all four flags still default-off
```

### Next Exact Move

```text
next runtime blocker
└─ post-s3 full-duration baseline rerun
   ├─ closes the remaining `v0` gap
   ├─ closes the remaining review-gate gap
   └─ only then allows `v1` to become the active runtime phase
```

## V1 Shell-UI Separation Audit

_Source: `docs/V1-SHELL-UI-SEPARATION-AUDIT.md`_

```text
v1 shell-ui separation
├─ feed DOM slice        -> live
├─ access DOM slice      -> live
├─ inspect DOM slice     -> live
├─ journal DOM slice     -> live
├─ debug DOM slice       -> live
├─ eventBus action path  -> preserved
├─ canvas garden input   -> preserved
└─ closure state         -> earned on canonical post-s3 save
```

### Intent Held

- move shell-heavy panels off the canvas UI path
- preserve button-first shell behavior and garden ownership
- improve shell readability without flattening the scene

### Canonical Proof Surface

- baseline:
  `qa_logs/session_captures/v0-baseline/2026-04-22T22-11-18-179Z/`
- candidate:
  `qa_logs/session_captures/v1-shell-ui-smoke/2026-04-23T04-16-03-452Z/`
- canonical diff:
  [diff-vs-post-s3-canonical-baseline.md](../qa_logs/session_captures/v1-shell-ui-smoke/2026-04-23T04-16-03-452Z/diff-vs-post-s3-canonical-baseline.md)

### Earned Result

```text
against canonical post-s3 baseline
├─ shell avgRenderMs   32.08 -> 26.07   (-18.7%)
├─ shell p95FrameMs    72.10 -> 57.00   (-20.9%)
├─ travel avgRenderMs  35.08 -> 25.73   (-26.6%)
├─ travel p95FrameMs   74.00 -> 58.40   (-21.1%)
├─ shell uiRedrawCount 7275  -> 22      (-99.7%)
└─ travel uiRedrawCount 4268 -> 28      (-99.3%)
```

The refined `-30% shell avgRenderMs` stretch target was not fully reached, but
the active board gate was met: shell-heavy lanes are materially cheaper on the
committed lived-in save while readability holds and input ownership stays
correct.

### Default-On State

```text
live default
|- performance.flags.shellUiDom -> true
|- DOM-owned shell panels       -> feed / access / inspect / journal / debug
|- canvas-owned shell remains   -> top HUD, save pills, garden interaction
`- retained fallback            -> canvas panel path still exists for proof/regression checks
```

### Kept Boundaries

- `gameUI` still owns shell state, button actions, and save status truth
- `debugUI` still owns debug state and debug actions
- DOM panels remain presentation-only
- battle HUD remains canvas-owned in this phase

### Rejected Branch

```text
tested then reverted
└─ DOM top HUD (button bar + save pills)
   ├─ looked promising as a shell-only follow-up
   ├─ regressed the canonical quick proof path
   └─ was removed before phase closure
```

That branch is not part of the shipped `v1` result. Canvas top buttons and save
status remain the live path.

### Next Runtime Pressure

```text
remaining blocker after v1
└─ v2 memory-growth audit + leak closure
   ├─ canonical long-session heap growth still needs attribution
   ├─ freeze-risk confidence still depends on soak evidence
   └─ creature-visual restoration stays gated behind that work
```

## V2 Memory-Growth Audit

_Source: `docs/V2-MEMORY-GROWTH-AUDIT.md`_

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

### Intent Held

- make long-running play more stable before restoring heavier creature visuals
- find real retention owners instead of blaming the look blindly
- reduce growth without wiping durable social truth or flattening the sim

### What Landed

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

### Evidence

#### 1. First attribution seam

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

#### 2. Edge-residue closure pass

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

### Honest Read

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

### Next Runtime Pressure

```text
v2 closure result
├─ gate met
│  ├─ 40-minute heap delta improved
│  └─ freeze-confidence proof stayed clean
└─ follow-on pressure
   └─ calm/soak update cost is still high and now reads more simulation-dominant
      └─ that shifts naturally to v4 cadence work rather than blocking v2 closure
```

### Full Proof

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

## Sprite Cache Contract

_Source: `docs/SPRITE-CACHE-CONTRACT.md`_

```text
v3 sprite cache
├─ source truth        -> spriteManager raw assets + butterfly render spec
├─ cache truth         -> reusable render-only baked surfaces
├─ gameplay truth      -> unchanged; never owned here
└─ active flag         -> performance.flags.bakedCreatureSprites
```

### Intent

- restore sharp butterflies, caterpillars, and cocoons without paying the full
  per-frame scale/composite cost every draw
- keep animation ownership in entity render code
- keep durable truth out of the cache entirely

### Appearance Key

```text
appearance key
├─ sex
├─ personalityType
├─ baseType
└─ wing donor signature
   ├─ foreLeft
   ├─ foreRight
   ├─ hindLeft
   └─ hindRight
```

Canonical form:

```text
sex=<sex>|personality=<personalityType>|base=<baseType>|wings=<wing-source-signature>
```

Wing-source signature uses:

```text
<wingKey>:<personalityType>:<sex>
```

For hybrids, donor wings own the signature. For non-hybrids, the butterfly's own
personality + sex own it.

### Cache Families

| Family | Owner | Key shape | Render ownership |
| --- | --- | --- | --- |
| butterfly body | `core/spriteManager.js` | `body|sex|<w>x<h>` | cached surface only |
| butterfly antenna | `core/spriteManager.js` | `antenna|sex|<w>x<h>` | cached surface only |
| butterfly wing piece | `core/spriteManager.js` | `wing|appearanceKey|wing-source|<w>x<h>` | cached surface only |
| caterpillar frame | `core/spriteManager.js` | `caterpillar|frame=<n>|<w>x<h>` | cached surface only |
| cocoon sprite | `core/spriteManager.js` | `cocoon|state|<w>x<h>` | cached surface only |

### Hard Boundaries

```text
cache may own
├─ baked p5.Graphics surfaces
├─ LRU eviction
└─ appearance-key lookup

cache may never own
├─ butterfly identity
├─ butterfly genetics / lineage
├─ relationships / memories / feelings
├─ live flap / tilt / sway state
└─ any save-persisted field
```

- `spriteManager` owns reusable baked render surfaces only.
- `entities/butterfly.js` still owns wing flap, wing tilt, antenna sway, alpha,
  trail timing, and battle/garden render context choices.
- `entities/caterpillar.js` and `entities/flower.js` still own lifecycle-stage
  presentation choices.
- `saveSystem` never persists baked cache entries.

### Cache Limits

```text
limit
└─ performance.cache.maxBakedSprites
```

- default cap: `256`
- eviction policy: insertion-order LRU
- eviction cleanup: cached `p5.Graphics.remove()`

### Invalidation Rule

```text
invalidate when
├─ sprite assets reload
├─ baked flag flips off
├─ size bucket changes
└─ appearance key changes
```

Current landed guarantee:
- asset re-initialize clears the whole cache
- size-specific entries are keyed by baked width/height
- appearance-specific entries are keyed by the canonical appearance key above

Future `v3` closure work:
- explicit per-appearance invalidation hooks
- atlas-backed source path under `performance.flags.spriteAtlas`

### Landed First Slice

```text
live now
├─ body bake
├─ antenna bake
├─ wing-piece bake
├─ caterpillar-frame bake
├─ cocoon bake
└─ collection preview reuse
```

Not landed yet:

```text
still future inside v3
├─ atlas source path
├─ screenshot parity grid
└─ closure/default-on decision
```

## V3 Sprite Baking Audit

_Source: `docs/V3-SPRITE-BAKING-AUDIT.md`_

```text
v3 high-resolution creature sprite baking
|- sprite cache contract          -> live
|- perceptual parity proof        -> pass
|- wing/cocoon baked slice        -> live
|- battle-only forewing pose bake -> live behind flag with reduced pose buckets, mixed-positive
|- reopened-on-v5 follow-ups      -> tried, failed calm/shell proof, rolled back
|- body/antenna/caterpillar bake  -> helper groundwork only; runtime rollout not kept
|- atlas source contract          -> live
|- atlas proof slice              -> pass for parity, mixed-negative for runtime
|- body/antenna proof slice       -> pass for parity, mixed-negative for runtime
|- UI/battle visual audits        -> pass
`- closure state                  -> live
```

### Intent Held

- restore sharper creature rendering without reopening the freeze path
- bank render wins through reusable creature surfaces, not by degrading visuals
- keep flap, tilt, sway, and other expressive motion live
- preserve the option to finish a better source path inside `v3`

### What Landed

```text
current v3 slice
|- core/spriteManager.js
|  |- LRU baked-surface cache
|  |- stable baked-entry reuse (no per-wing metadata churn)
|  |- alpha-bounds precomputation during initialize
|  |- trimmed wing-piece bake path
|  |- explicit baked wing anchor metadata for raw-trimmed and atlas-backed sources
|  |- battle-only forewing pose-bake helper retained behind the bakedCreatureSprites flag
|  `- dormant body/antenna/caterpillar helper groundwork retained for later proof
|- entities/butterfly.js
|  `- baked wing-piece reuse stays live; battle-only forewing pose bake is retained as the latest targeted slice; body + antenna stay raw for parity
|- entities/flower.js
|  `- baked cocoon reuse stays live
|- entities/caterpillar.js
|  `- reverted to raw path until a higher-fidelity bake path exists
|- ui/butterflyCollection.js
|  `- preview path matches the narrowed wing-only baked slice; battle-only pose bake does not expand into collection previews
|- ui/gameUI.js
|  `- battle-hidden collection/journal draw is now suppressed, so the retained pose-bake proof is not paying canvas cost for a panel battle is already hiding
`- scripts/run-v3-sprite-parity-audit.js
   `- perceptual parity gate + side-by-side proof, including spriteAtlas-on coverage and the battle-only pose-bake fallback shape
```

### Evidence

- perceptual parity pass:
  [2026-04-23T07-59-23-686Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T07-59-23-686Z/report.json)
- latest quick lived-in smoke:
  [2026-04-23T08-02-25-046Z](../qa_logs/session_captures/v3-sprite-baking-smoke-current/2026-04-23T08-02-25-046Z)
- quick diff vs frozen post-`s3` quick baseline:
  [diff-vs-post-s3-quick-baseline.md](../qa_logs/session_captures/v3-sprite-baking-smoke-current/2026-04-23T08-02-25-046Z/diff-vs-post-s3-quick-baseline.md)
- atlas-on parity pass:
  [2026-04-23T12-15-16-125Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T12-15-16-125Z/report.json)
- atlas-on quick lived-in smoke:
  [2026-04-23T12-15-26-599Z](../qa_logs/session_captures/v3-sprite-baking-smoke-atlas/2026-04-23T12-15-26-599Z)
- atlas-on diff vs frozen post-`s3` quick baseline:
  [diff-vs-post-s3-quick-baseline.md](../qa_logs/session_captures/v3-sprite-baking-smoke-atlas/2026-04-23T12-15-26-599Z/diff-vs-post-s3-quick-baseline.md)
- atlas-on diff vs current narrowed `v3` slice:
  [diff-vs-current-v3-slice.md](../qa_logs/session_captures/v3-sprite-baking-smoke-atlas/2026-04-23T12-15-26-599Z/diff-vs-current-v3-slice.md)
- body/antenna helper parity pass before rollback:
  [2026-04-23T16-59-37-186Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T16-59-37-186Z/report.json)
- body/antenna helper quick lived-in smoke before rollback:
  [2026-04-23T16-57-14-063Z](../qa_logs/session_captures/v3-sprite-baking-smoke-antenna-bucketed/2026-04-23T16-57-14-063Z)
- body/antenna helper diff vs current narrowed `v3` slice:
  [diff-vs-current-v3-slice.md](../qa_logs/session_captures/v3-sprite-baking-smoke-antenna-bucketed/2026-04-23T16-57-14-063Z/diff-vs-current-v3-slice.md)
- cache-attribution lived-in smoke subset (`calm,shell,battle`):
  [2026-04-23T17-19-29-691Z](../qa_logs/session_captures/v3-cache-attribution-smoke/2026-04-23T17-19-29-691Z)
- battle-only forewing pose parity pass:
  [2026-04-23T18-32-09-076Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T18-32-09-076Z/report.json)
- battle-only forewing pose quick lived-in smoke:
  [2026-04-23T18-32-08-971Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly/2026-04-23T18-32-08-971Z)
- battle-only forewing pose diff vs current narrowed `v3` slice:
  [diff-vs-current-v3-slice.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly/2026-04-23T18-32-08-971Z/diff-vs-current-v3-slice.md)
- battle-only forewing pose diff vs frozen post-`s3` quick baseline:
  [diff-vs-post-s3-quick-baseline.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly/2026-04-23T18-32-08-971Z/diff-vs-post-s3-quick-baseline.md)
- no-flag control smoke on the same lived-in lanes:
  [2026-04-23T20-26-07-521Z](../qa_logs/session_captures/v3-control-no-flag/2026-04-23T20-26-07-521Z)
- battle-only forewing pose diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-fastgate/2026-04-23T20-23-21-866Z/diff-vs-no-flag-control.md)
- reopened v3 slice on top of retained v5:
  [2026-04-25T00-05-54-611Z](../qa_logs/session_captures/v3-on-v5-retained-candidate/2026-04-25T00-05-54-611Z)
- reopened v3 slice diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-on-v5-retained-candidate/2026-04-25T00-05-54-611Z/diff-vs-no-flag-control.md)
- battle-only baked reopen on retained v5:
  [2026-04-25T00-08-35-332Z](../qa_logs/session_captures/v3-battle-only-on-v5-candidate/2026-04-25T00-08-35-332Z)
- battle-only baked reopen diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-battle-only-on-v5-candidate/2026-04-25T00-08-35-332Z/diff-vs-no-flag-control.md)
- reduced-pose-bucket parity pass:
  [2026-04-23T22-35-53-210Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T22-35-53-210Z/report.json)
- reduced-pose-bucket quick lived-in smoke:
  [2026-04-23T22-35-53-145Z](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16/2026-04-23T22-35-53-145Z)
- reduced-pose-bucket diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16/2026-04-23T22-35-53-145Z/diff-vs-no-flag-control.md)
- reduced-pose-bucket diff vs retained fastgate slice:
  [diff-vs-retained-fastgate.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16/2026-04-23T22-35-53-145Z/diff-vs-retained-fastgate.md)
- post-battle-shell suppression parity pass:
  [2026-04-23T23-10-47-003Z](../qa_screenshots/v3_sprite_parity_audit/2026-04-23T23-10-47-003Z/report.json)
- post-battle-shell suppression no-flag control:
  [2026-04-23T23-07-09-553Z](../qa_logs/session_captures/v3-control-no-flag-post-journalfix/2026-04-23T23-07-09-553Z)
- post-battle-shell suppression retained slice:
  [2026-04-23T23-08-13-173Z](../qa_logs/session_captures/v3-posebucket16-post-journalfix/2026-04-23T23-08-13-173Z)
- post-battle-shell suppression diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-posebucket16-post-journalfix/2026-04-23T23-08-13-173Z/diff-vs-no-flag-control.md)
- battle-entry prewarm smoke before rollback:
  [2026-04-23T22-58-39-295Z](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16-prewarm/2026-04-23T22-58-39-295Z)
- battle-entry prewarm diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16-prewarm/2026-04-23T22-58-39-295Z/diff-vs-no-flag-control.md)
- battle-entry prewarm diff vs retained reduced-bucket slice:
  [diff-vs-posebucket16.md](../qa_logs/session_captures/v3-spread-pose-smoke-posebucket16-prewarm/2026-04-23T22-58-39-295Z/diff-vs-posebucket16.md)
- source-key compaction no-flag control:
  [2026-04-23T22-24-04-406Z](../qa_logs/session_captures/v3-control-no-flag-keycompact/2026-04-23T22-24-04-406Z)
- source-key compaction flag-on smoke:
  [2026-04-23T22-25-09-394Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-keycompact/2026-04-23T22-25-09-394Z)
- source-key compaction diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-keycompact/2026-04-23T22-25-09-394Z/diff-vs-no-flag-control.md)
- wing-pose family cap (`16`) smoke:
  [2026-04-23T22-28-06-759Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap16/2026-04-23T22-28-06-759Z)
- wing-pose family cap (`16`) diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap16/2026-04-23T22-28-06-759Z/diff-vs-no-flag-control.md)
- wing-pose family cap (`20`) smoke:
  [2026-04-23T22-29-25-443Z](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap20/2026-04-23T22-29-25-443Z)
- wing-pose family cap (`20`) diff vs same-run no-flag control:
  [diff-vs-no-flag-control.md](../qa_logs/session_captures/v3-spread-pose-smoke-battleonly-familycap20/2026-04-23T22-29-25-443Z/diff-vs-no-flag-control.md)
- readability audit with `bakedCreatureSprites` enabled:
  [report.json](../qa_screenshots/r4_ui_readability_audit/2026-04-23T07-59-42-656Z/report.json)
- battle presentation audit with `bakedCreatureSprites` enabled:
  [report.json](../qa_screenshots/r5_battle_presentation_audit/2026-04-23T18-34-04-072Z/report.json)

Key quick-smoke deltas against the frozen post-`s3` quick baseline:

```text
current narrowed v3 slice
|- calm    25.35 -> 24.65   (-2.8%)
|- shell   30.82 -> 29.94   (-2.8%)
|- travel  33.94 -> 33.07   (-2.6%)
|- battle  44.91 -> 39.94   (-11.1%)
|- soak40  27.76 -> 28.25   (+1.8%)
`- heap   124.93 -> 159.26 MB (+27.5%)
```

Atlas-on deltas against the current narrowed `v3` slice:

```text
atlas vs current v3
|- parity      25/25 pass, max perceptual diff 0.06882, max bbox drift 1px
|- heap        unchanged at 159.26 MB
|- battle      avgRender 39.94 -> 41.98 (+5.1%)
|- calm        avgRender 24.65 -> 26.11 (+5.9%)
|- shell       avgRender 29.94 -> 31.06 (+3.7%)
|- travel      avgRender 33.07 -> 33.68 (+1.9%)
`- soak40      avgRender 28.25 -> 27.31 (-3.3%)
```

Body/antenna helper slice before rollback:

```text
body/antenna helper vs current v3
|- parity      25/25 pass after rollback-tightening to raw body + raw caterpillar
|- heap        unchanged at 159.26 MB
|- battle      avgRender 39.94 -> 45.56 (+14.1%)
|- calm        avgRender 24.65 -> 31.96 (+29.7%)
|- shell       avgRender 29.94 -> 36.60 (+22.2%)
|- travel      avgRender 33.07 -> 39.04 (+18.1%)
`- soak40      avgRender 28.25 -> 31.72 (+12.3%)
```

Cache-attribution slice on the current narrowed `v3` path:

```text
cache attribution
|- lanes       calm / shell / battle (subset smoke via run-v0-baseline --lanes=...)
|- calm        68 entries | 0.02MB est surface | hits 4180 / misses 68
|- shell       72 entries | 0.03MB est surface | hits 5952 / misses 72
|- battle      116 entries | 0.05MB est surface | hits 14056 / misses 116
|- families    wing-trimmed only on the live narrowed slice
|- reuse       high hit ratio, no evictions, 17-29 unique live sizes
`- read        cache residency is not the dominant v3 memory blocker
```

Battle-only forewing pose slice against the current narrowed `v3` slice:

```text
battle-only forewing pose vs current v3
|- parity      25/25 pass on the retained normal-state proof
|- heap        unchanged at 159.26 MB
|- battle      avgRender 53.73 -> 40.36 (-24.9%)
|- calm        avgRender 25.40 -> 26.48 (+4.3%)
|- shell       avgRender 30.34 -> 29.59 (-2.5%)
`- soak40      avgRender 27.19 -> 27.28 (+0.3%)
```

Battle-only forewing pose slice against the frozen post-`s3` quick baseline:

```text
battle-only forewing pose vs post-s3 baseline
|- battle      avgRender 44.91 -> 40.36 (-10.1%)
|- calm        avgRender 25.35 -> 26.48 (+4.5%)
|- shell       avgRender 30.82 -> 29.59 (-4.0%)
|- soak40      avgRender 27.76 -> 27.28 (-1.7%)
`- heap        124.93 -> 159.26 MB (+27.5%)
```

Reopened `v3` attempts on top of the retained `v5` stack before rollback:

```text
reopened v3 on retained v5
|- full reopened slice
|  |- battle      improved
|  |- soak40      improved
|  |- calm        regressed
|  `- shell       regressed
|- battle-only baked reopen
|  |- calm        regressed
|  |- shell       regressed
|  |- battle      not strong enough to justify the regressions
|  `- result      rolled back
`- read           no reopened v3 path beat the retained v5 stack cleanly enough to keep
```

Retained battle-only forewing pose slice with reduced pose buckets against the same-run no-flag control:

```text
retained posebucket16 slice vs no-flag control
|- battle      avgRender 41.20 -> 39.94 (-3.1%)
|- calm        avgRender 27.23 -> 26.56 (-2.4%)
|- shell       avgRender 30.66 -> 29.53 (-3.7%)
|- soak40      avgRender 27.25 -> 26.34 (-3.3%)
|- heap        159.26 -> 159.26 MB (flat)
`- read        retained; this keeps the average render win while removing the extra heap bump over no-flag control
```

Retained posebucket16 slice against the earlier fastgate slice:

```text
posebucket16 vs earlier fastgate
|- battle      avgRender 39.60 -> 39.94 (+0.9%)
|- calm        avgRender 25.83 -> 26.56 (+2.8%)
|- shell       avgRender 29.62 -> 29.53 (-0.3%)
|- soak40      avgRender 26.06 -> 26.34 (+1.1%)
|- heap        168.80 -> 159.26 MB (-5.6%)
`- read        retained because the heap win is real and the average render trade is small enough to prefer over the older fastgate slice
```

Source-key compaction experiment before rollback:

```text
source-key compaction vs no-flag control
|- change       compacted wing-trimmed + wing-pose cache keys to true wing source identity
|- cache shape  unchanged in live battle smoke: 48 wing-trimmed + 24 wing-pose entries
|- battle       avgRender 41.20 -> 42.38 (+2.8%)
|- calm         avgRender 27.23 -> 26.68 (-2.0%)
|- shell        avgRender 30.66 -> 30.08 (-1.9%)
|- soak40       avgRender 27.25 -> 27.32 (+0.3%)
`- read         reverted; the compaction did not change live cache residency and did not beat the retained slice
```

Wing-pose family-cap experiments before rollback:

```text
family cap 16 vs no-flag control
|- change       hard cap on wing-pose family entries
|- cache shape  battle smoke fell to 16 wing-pose entries, but misses/evictions spiked hard
|- battle       avgRender 41.20 -> 46.10 (+11.9%)
|- heap         159.26 -> 159.26 MB (flat)
`- read         reverted; it traded away too much battle render to earn the heap win

family cap 20 vs no-flag control
|- change       softer hard cap on wing-pose family entries
|- battle       avgRender 41.20 -> 46.20 (+12.1%)
|- heap         159.26 -> 159.26 MB (flat)
`- read         reverted; same failure shape as cap 16
```

Battle-entry prewarm experiment before rollback:

```text
posebucket16 prewarm vs retained reduced-bucket slice
|- change       warmed battle forewing pose entries at battle-session start before view switch
|- heap         unchanged at 159.26 MB
|- battle       avgRender 39.94 -> 54.89 (+37.4%)
|- calm         avgRender 26.56 -> 39.42 (+48.4%)
|- shell        avgRender 29.53 -> 42.48 (+43.8%)
|- soak40       avgRender 26.34 -> 31.99 (+21.4%)
`- read         reverted; prewarming introduced a severe cross-lane regression and is not the next seam
```

Battle-hidden collection/journal suppression on the retained slice:

```text
post-journal suppression retained slice vs no-flag control
|- change       collection/journal update + draw are now skipped during battle, while panel visibility is preserved for return to garden
|- battle       avgRender 33.63 -> 31.89 (-5.2%)
|- battle       p95 93.50 -> 88.60 (-5.2%)
|- battle       p99 127.20 -> 122.50 (-3.7%)
|- calm         avgRender 29.72 -> 29.07 (-2.2%)
|- shell        avgRender 33.33 -> 32.35 (-2.9%)
|- soak40       avgRender 30.06 -> 28.99 (-3.6%)
|- heap         159.26 -> 159.26 MB (flat)
`- read         retained; this removed a real hidden battle shell cost and turned the retained reduced-bucket slice into a clean same-run win without visual drift
```

### Honest Read

```text
earned now
|- baked wing/cocoon surfaces preserve the look closely enough to pass perceptual parity
|- battle/calm/shell/travel render lanes improved on the lived-in smoke save for the current narrowed slice
|- player-facing readability and battle audits stay green with the flag enabled
|- atlas-backed source contract now exists and holds parity under spriteAtlas-on proof
|- body/antenna/caterpillar helper groundwork exists, but the first runtime rollout was tested and rolled back
|- cache-family attribution is live and proves the narrowed wing cache itself stays tiny and heavily reused on the lived-in smoke save
|- source-key compaction was tested and rolled back; it did not reduce live cache residency or beat the retained slice
|- wing-pose family caps were tested and rolled back; they erased the heap bump but degraded battle render too sharply
|- battle-entry prewarm was tested and rolled back; it regressed every lane badly even though heap stayed flat
|- the retained battle-only forewing pose slice now uses reduced pose buckets and stays ahead of the same-run no-flag control on average render without carrying an extra heap bump
|- the hidden battle collection/journal draw was removed, which turned the retained slice into a same-run win across battle/calm/shell/soak with parity still passing
|- the later `v3` reopen on top of the retained `v5` stack was tested twice and rolled back
|  |- full reopened slice -> battle and soak improved, but calm and shell regressed too sharply
|  `- battle-only butterfly gate -> still regressed calm/shell and did not earn a retained follow-up seam
`- v3 phase closure itself
   `- earned first as a retained default-off runtime slice, and later promoted live by `v7` once the broader runtime stack proved it could carry the restored visual state honestly

not earned yet
|- high-fidelity baked path for body + antenna + caterpillar
|- default-on or rollout closure for performance.flags.spriteAtlas
|  `- blocked because the first atlas-backed slice regressed calm/shell/travel/battle versus the current narrowed v3 slice while leaving heap unchanged
`- default-on or rollout closure for body/antenna/caterpillar helpers
   `- blocked because the first runtime rollout regressed every quick-smoke lane versus the current narrowed v3 slice
```

The current runtime evidence was strong enough to close `v3` first as a
retained runtime slice. After `v7` landed, the broader runtime stack finally
proved it could carry the restored creature state honestly, so
`bakedCreatureSprites` is now live by default. What remains open is not the
sharp-creature rollout itself; it is the later higher-fidelity body/antenna/
caterpillar path and the atlas-backed source path. `spriteAtlas` still stays
default-off until a later proof shows it can beat the live slice honestly.

### Carry Forward

```text
after v3 closure
|- keep bakedCreatureSprites live; `v7` has now promoted the sharp-creature path on the lived-in runtime stack
|- keep the retained reduced-bucket battle-only forewing pose slice as the banked v3 runtime shape
|- stop treating cache residency as the main blocker; the live wing cache stays tiny in the attribution slice
|- treat source-key compaction as explored and rejected for now; it did not change the live battle cache shape
|- treat wing-pose family caps as explored and rejected for now; they flattened heap but lost too much battle render
|- treat battle-entry prewarm as explored and rejected for now; it made every lane materially worse
|- carry broader runtime pressure and battle tail latency forward into v4/v5; they are no longer reasons to keep v3 itself open
|- keep spriteAtlas default-off; this first atlas-backed slice is still not the win
|- keep body/antenna/caterpillar rollout off the live path; the first runtime slice was proved and rolled back
|- treat the reopened `v3`-on-`v5` stack and the later battle-only butterfly gate as explored and rejected for now; neither beat the retained runtime stack where `h5` still matters
|- use the new explicit anchor contract if atlas work continues, so callers do not re-derive trim math
|- recover high-fidelity body/antenna/caterpillar baking only on a source path that beats the current narrowed slice
|- use the new lane-selector harness for targeted v3 smokes when travel flake would otherwise block calm/shell/battle evidence
|- treat wing-dimension quantization as explored and rejected for now; the first attempt broke parity and was rolled back
`- only then reopen either default-on decision honestly during later runtime restoration work
```

## V4 Sim Cadence Audit

_Source: `docs/V4-SIM-CADENCE-AUDIT.md`_

### Purpose

This audit freezes the currently earned `v4` seams.

```text
v4 live slices
|- owner seam         -> lifeSimSystem deep butterfly evaluation + mlInferenceSystem garden trace refresh + zoneSystem ecology refresh
|- scheduler owner    -> gameCore owns cadence div/mod + over-budget hook
|- guardrails         -> battle bypass + zone-travel bypass + parity proof
`- honest phase state -> v4 retained slice is now promoted into the live default runtime shape
```

### Live Runtime Shape

```text
flag
`- performance.flags.simCadenceSplit
   |- off -> legacy every-frame life-sim butterfly deep eval + legacy every-frame garden ML trace scan
   `- on  -> live-default scheduler-owned cadence seams
      |- life-sim deep eval
      |  |- interval    18 frames
      |  `- bypass      battle view + zoneTravel
      `- ML garden scoring
         |- interval    36 game frames
         |- bypass      battle view + zoneTravel
         |- readers     consume last-valid trace freshness markers
         `- ecology refresh
            |- interval    30 game frames
            |- phase       zoneIndex % 30
            `- readers     consume last-valid zone freshness markers
```

### Files

- `core/gameCore.js`
- `systems/lifeSimSystem.js`
- `systems/mlInferenceSystem.js`
- `systems/zoneSystem.js`
- `core/config.js`
- `core/entity.js`
- `scripts/run-sim-cadence-parity.js`

### Proof

```text
parity
|- script           -> qa_screenshots/v4_sim_cadence_parity_audit/2026-04-24T03-16-08-170Z/
|- result           -> pass
|- life-sim stale   -> 22 frames max
|- ML stale         -> 46 frames max
|- ecology stale    -> 29 frames max
|- avg pos drift    -> 0.12 buckets
|- max pos drift    -> 3 buckets
|- zone mismatches  -> 1 sample
`- social drift     -> 0.0071 max aggregate drift
```

```text
quick lived-in same-code compare
|- baseline  -> qa_logs/session_captures/v4-control-no-flag-tuned18-current/2026-04-24T02-19-53-983Z/
|- candidate -> qa_logs/session_captures/v4-sim-cadence-tuned18-current/2026-04-24T02-19-53-801Z/
`- diff      -> qa_logs/session_captures/v4-sim-cadence-tuned18-current/2026-04-24T02-19-53-801Z/diff-vs-no-flag-control.md
```

```text
earned wins
|- calm avgUpdateMs    43.74 -> 13.08  (-70.1%)
|- shell avgUpdateMs   41.44 -> 10.49  (-74.7%)
|- battle avgUpdateMs  54.06 -> 26.29  (-51.4%)
|- soak avgUpdateMs    37.67 -> 10.08  (-73.2%)
|- calm p95FrameMs      88.50 -> 42.90 (-51.5%)
|- battle p95FrameMs   114.80 -> 64.00 (-44.3%)
|- soak avgRenderMs    37.64 -> 28.64  (-23.9%)
|- heap                159.26 -> 159.26 MB (flat)
`- social audits       r6 pass, f5/f6 pass
```

### Guardrail Read

```text
what passed
|- no page/runtime errors in parity run
|- bounded divergence stayed inside thresholds
|- durable social texture stayed intact
|- life-sim derived state still carries frame stamps for last-valid reads
|- ML trace readers now receive freshness markers with last-valid frame + stale frame count
|- zone ecology readers now receive freshness markers with last-valid frame + stale frame count
`- cadence-budget-overrun capture telemetry now records as warning-level evidence rather than a hard runtime error
```

```text
what is still not earned
|- broader runtime closure is still not earned
|- cadence alone does not close the runtime program; `v5`, `v6`, and `v7` still own the remaining proof
|- pressure can still surface warning-level cadence overruns on hot captures even after the cadence split is banked
|- render/composite work was still required to get the lived-in save through the stricter `h5` lane
`- worker offload and visual-restoration proof remain downstream of this frozen cadence slice
```

### Honest Phase State

```text
v4 today
|- life-sim cadence seam  -> live
|- ML garden cadence seam -> live
|- ecology cadence seam   -> live
|- retained slice         -> promoted into the live default runtime stack
`- carry forward
   |- keep the live 18/36/30 cadence slice
   |- keep cadence-budget-overrun capture telemetry in the warning bucket unless a later phase proves a true runtime fault
   |- do not reopen geometry work to explain runtime-heavy proof seams
   `- push the remaining runtime pressure through `v5` / `v6` / `v7` while keeping this cadence proof frozen
```

## V5 Composite Reduction Audit

_Source: `docs/V5-COMPOSITE-REDUCTION-AUDIT.md`_

### Purpose

This audit freezes the earned `v5` seams so far.

```text
v5 earned seams
|- seam 1             -> renderManager entity/behind composite reduction on clean-shell lanes only
|- seam 2             -> first-session guide moved onto the DOM shell path
|- seam 3             -> mature flower heads now render from a bounded baked sprite cache
|- seam 4             -> entity/behind composite present now uses the native canvas drawImage path
|- seam 5             -> non-carried blocks can peel into their own cropped composite layer behind a default-off flag
|- seam 6             -> when that blocks layer is enabled, unchanged grounded/support block layouts now reuse the prior layer contents by default instead of repainting every frame
|- seam 7             -> mature flowers can route to a direct-present path behind a default-off flag; same-code `h5` and guardrails held, but the quick pre-battle lane regressed so it is not promoted to the live default stack
|- seam 8             -> calm clean-shell HUD redraw now idles at a lower cadence unless the player is actively interacting with shell buttons or doorway travel controls
|- proof fix          -> exported session captures now separate warning-level `cadence-budget-overrun` telemetry from hard runtime errors, so `h5` phase 07 only fails on true runtime faults
|- rejected seam      -> static block layer cache experiment rolled back
|- rolled-back seam   -> raw butterfly canvas draw path regressed the retained stack and was removed
|- rolled-back seam   -> direct entity present path regressed the retained stack and was removed
|- rolled-back seam   -> native entity composite present path regressed frame tails and was removed
|- rolled-back seam   -> tighter butterfly dirty bounds regressed calm/shell and were removed
|- rolled-back seam   -> segmented entity composite follow-up looked good in quick smoke but failed stricter h5/a4 gates and was removed
|- rolled-back seam   -> region-layer entity follow-up regressed calm/battle/soak after the false-win bug was fixed and was removed
|- rolled-back seam   -> split-scenery entity layer follow-up increased composite work and regressed every lived-in render lane, so it was removed
|- rolled-back seam   -> grounded-block background-backdrop follow-up improved quick calm/shell reads but lost same-code h5 and was removed
|- rolled-back seam   -> grounded-block direct-present follow-up improved update-side reads but regressed the render-side v5 lane and was removed
|- rolled-back seam   -> edge-outlier peel follow-up never activated into a meaningful retained-crop split on the lived-in stack and was removed
|- rolled-back seam   -> wing-local butterfly bake follow-up improved quick average render but failed the stricter h5 calm gate and increased heap, so it was removed
|- rolled-back seam   -> hybrid dirty-present threshold follow-up lowered heap but made the stricter calm/shell h5 gate worse, so it was removed
|- rolled-back seam   -> native clip-present follow-up stayed nearly flat in quick smoke but still made the stricter h5 calm gate worse, so it was removed
|- rolled-back seam   -> native no-smooth present follow-up improved battle but still made the stricter h5 calm/shell gate worse, so it was removed
|- inherited runtime  -> v1 shellUiDom default-on + retained v4 18/36/30 cadence slice
|- guardrails         -> battle full-frame + canvas-heavy shell full-frame + proof reruns
`- honest phase state -> v5 is now frozen live
```

### Live Runtime Shape

```text
flag
`- performance.flags.compositeDirtyRegions
   |- off -> legacy full-frame entity + behind-cover composites
`- on  -> cropped composite path on clean-shell lanes only
      |- entities layer
      |  `- estimated dirty region from live entity bounds
      |- optional blocks layer
      |  `- non-carried blocks may peel into their own cropped composite when `performance.flags.compositeBlocksLayer` is enabled
      |- behind-cover layer
      |  `- estimated dirty region from behind-cover bounds
      |- battle view
      |  `- forced full-frame path
      `- canvas-heavy shell
         `- forced full-frame path

flag
`- performance.flags.bakedFlowerHeads
   |- off -> procedural flower heads every frame
   `- on  -> mature flower heads draw from spriteManager's bounded `flower-head` cache
      |- live motion kept
      |  |- sway / lean
      |  |- per-flower head rotation
      |  `- mature pulse scaling
      |- procedural path kept
      |  |- stems
      |  |- bloom / wilting / dissolve heads
      |  `- guide / blessing / lifecycle overlays
      `- heap target
         `- no growth versus the retained v5 guide candidate

flag
`- performance.flags.compositeNativeDraw
   |- off -> composite present uses the generic p5 image path
   `- on  -> entity + behind-cover composite present uses the native canvas drawImage path
      |- scope
      |  |- cropped entity composites
      |  |- cropped behind-cover composites
      |  |- full entity composites on conservative lanes
      |  `- full behind-cover composites on conservative lanes
      |- proof target
      |  `- lower same-code h5 calm + shell render without changing visual readability
      `- retained state
         `- banked as part of the live v5 stack

flag
`- performance.flags.compositeBlocksLayer
   |- off -> blocks stay inside the main cropped entity composite
   `- on  -> grounded/supported non-carried blocks peel into their own cropped composite layer
      |- proof target
      |  |- shrink the hot actor crop
      |  |- keep block visuals + spatial truth intact
      |  `- lower lived-in same-code h5 calm + shell pressure without reopening broad split-scenery work
      `- retained state
         `- earned as a default-off seam only; the redraw-reuse variant is now the retained default behavior inside this seam, and the seam now co-pulls the direct-flower present path because that stacked shape is the earned version of the blocks layer

flag
`- performance.flags.compositeBlocksLayerReuse
   |- off -> blocks composite layer repaints every frame while active
   `- on  -> unchanged visible grounded/support block signatures reuse the prior blocks layer contents
      |- scope
      |  `- only matters when `performance.flags.compositeBlocksLayer` is already enabled
      |- proof target
      |  `- beat the plain blocks-layer seam without changing visuals or spatial truth
      `- retained state
         `- banked as the better default inside the optional blocks-layer seam

flag
`- performance.flags.directPresentFlowers
   |- off -> flowers stay inside the main cropped entity composite
   `- on  -> mature flowers route to a direct-present path below blocks/actors and leave the shared entity crop
      |- proof target
      |  |- reduce the calm/shell flower-owned crop without changing save/spatial truth
      |  `- hold battle presentation and block overlap readability
      |- retained state
      |  `- earned as a standalone default-off seam, and now also acts as the retained companion path inside the optional blocks-layer seam
      `- unresolved note
         `- the standalone seam still regressed a quick pre-battle battle lane while active in focused-garden, but the retained blocks-layer stack cleaned that up enough to bank the combined path
```

```text
runtime behavior
|- calm clean-shell HUD redraw discipline
|  |- idle focused-garden shell   -> redraw every 6 frames
|  `- interactive shell / doorway -> redraw every 2 frames
|- capture export classification
|  |- cadence-budget-overrun -> warning
|  `- true runtime fault     -> error
`- proof effect
   |- calm lane now clears the stricter `h5` render threshold
   `- capture export proof now fails only on real runtime errors
```

### Files

- `core/renderManager.js`
- `core/config.js`
- `core/spriteManager.js`
- `entities/flower.js`
- `ui/gameUI.js`
- `ui/dom/guidePanel.js`
- `ui/dom/shellOverlay.js`
- `index.html`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-h5-long-running-save-smoothness-audit.js`
- `scripts/run-a4-spatial-truth-audit.js`
- `docs/V1-SHELL-UI-SEPARATION-AUDIT.md`
- `docs/ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md`
- `docs/ACTIVE-COMPLETION-BOARD.md`

### Proof

```text
same-code compare
|- control   -> qa_logs/session_captures/v5-composite-dirty-control-r2/2026-04-24T03-33-43-472Z/
|- candidate -> qa_logs/session_captures/v5-composite-dirty-candidate-r2/2026-04-24T03-33-43-467Z/
`- diff      -> qa_logs/session_captures/v5-composite-dirty-candidate-r2/2026-04-24T03-33-43-467Z/diff-vs-v4-retained-control.md
```

```text
guide-to-dom compare
|- baseline  -> qa_logs/session_captures/v5-composite-dirty-candidate-r2/2026-04-24T03-33-43-467Z/
|- candidate -> qa_logs/session_captures/v5-guide-dom-candidate/2026-04-24T04-15-22-948Z/
`- diff      -> qa_logs/session_captures/v5-guide-dom-candidate/2026-04-24T04-15-22-948Z/diff-vs-v5-composite-retained.md
```

```text
stacked runtime follow-up
|- inherited defaults -> shellUiDom on, retained v4 cadence slice banked
|- proof lane         -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-24T04-16-31-196Z/report.json
`- read               -> materially improved, still not green
```

```text
flower-head same-code compare
|- baseline  -> qa_logs/session_captures/v5-guide-dom-candidate/2026-04-24T04-15-22-948Z/
|- candidate -> qa_logs/session_captures/v5-flower-head-candidate/2026-04-24T05-24-48-513Z/
`- diff      -> qa_logs/session_captures/v5-flower-head-candidate/2026-04-24T05-24-48-513Z/diff-vs-v5-guide-retained.md
```

```text
earned wins from current v5 stack
|- calm avgRenderMs   29.97 -> 24.95  (-16.7%)
|- calm p95FrameMs    41.60 -> 36.10  (-13.2%)
|- shell avgRenderMs  36.62 -> 26.22  (-28.4%)
|- shell p95FrameMs   60.30 -> 38.80  (-35.7%)
|- battle avgRenderMs 37.37 -> 32.76  (-12.3%)
|- ui redraws (calm)  123 -> 18
|- ui redraws (shell) 89 -> 28
|- heap               159.26 -> 159.26 MB
|- a4 spatial truth   -> pass on stacked runtime
`- r4 readability     -> pass
```

```text
earned wins from bakedFlowerHeads on top of the retained v5 stack
|- calm avgRenderMs   24.95 -> 14.09  (-43.5%)
|- calm p95FrameMs    36.10 -> 24.00  (-33.5%)
|- shell avgRenderMs  26.22 -> 15.09  (-42.4%)
|- shell p95FrameMs   38.80 -> 28.80  (-25.8%)
|- battle avgRenderMs 32.76 -> 24.24  (-26.0%)
|- soak avgRenderMs   27.27 -> 15.85  (-41.9%)
|- heap               159.26 -> 159.26 MB
|- r4 readability     -> pass with the retained stacked runtime
`- a4 spatial truth   -> pass with the retained stacked runtime
```

```text
native composite present same-code compare
|- baseline  -> qa_logs/session_captures/v5-native-composite-control/2026-04-24T23-55-18-611Z/
|- candidate -> qa_logs/session_captures/v5-native-composite-candidate/2026-04-24T23-55-18-602Z/
`- diff      -> qa_logs/session_captures/v5-native-composite-candidate/2026-04-24T23-55-18-602Z/diff-vs-no-flag-control.md
```

```text
h5 improved shape after stacked runtime
|- calm         avgUpdate 27.33 | avgRender 28.80
|- shell-heavy  avgUpdate 26.48 | avgRender 27.59
|- read         cleaner than the earlier stacked path, but still above closure targets
`- note         the run now times out later in the audit; the blocker remains runtime pressure, not geometry drift
```

```text
h5 improved shape after bakedFlowerHeads
|- calm         avgUpdate 6.11 | avgRender 15.96
|- shell-heavy  avgUpdate 7.95 | avgRender 14.53
|- read         much cheaper than the retained guide-only stack, but still held open by the audit's stricter pressure target
`- note         the failure is now "still above target", not a seam regression
```

```text
post-rollback calm attribution on the retained v5 stack
|- capture root        -> qa_logs/session_captures/v5-family-attribution-calm-r3/2026-04-24T18-25-05-936Z/
|- avgRenderMs         -> 15.02
|- entityLayerMs       -> 5.53
|- composite.entities  -> 8.65
|- butterfly draw      -> 2.75
|- flower draw         -> 2.15
|- block draw          -> 0.51
`- read                -> the remaining calm miss is now mostly entity composite pressure, with butterfly draw the largest family-specific slice
```

```text
fine-grained butterfly attribution on the retained stack
|- capture root              -> qa_logs/session_captures/v5-butterfly-component-attribution/2026-04-24T23-51-22-560Z/
|- calm butterfly total      -> 3.70ms
|- calm butterfly wings      -> 3.29ms
|- calm butterfly antenna    -> 0.11ms
|- calm butterfly body       -> 0.04ms
|- calm butterfly overlays   -> 0.01ms
|- calm entities composite   -> 11.54ms
`- read                      -> wings dominate the butterfly-specific slice, but the bigger remaining blocker is still entity composite/present cost
```

```text
retained-stack crop read
|- capture root              -> qa_logs/session_captures/v5-tight-bounds-control/2026-04-25T00-01-59-563Z/
|- calm entities mode        -> cropped
|- calm entities region      -> 706 x 273
|- calm cropped area ratio   -> 53.5% of the screen
|- calm entities composite   -> 11.93ms
`- read                      -> dirty-region cropping is already active; the remaining blocker is that the retained crop is still large and expensive to present
```

```text
family composite-footprint attribution on the retained stack
|- capture root                    -> qa_logs/session_captures/v0-baseline/2026-04-25T03-27-33-668Z/
|- retained crop                   -> 706 x 273
|- butterfly union                 -> 525 x 203 (29.6%)
|- flower union                    -> 700 x 224 (43.6%)
|- block union                     -> 705 x 273 (53.5%)
`- read                            -> blocks widen the retained crop almost to its full current bounds; flowers hold most of the width and upper body of the crop
```

```text
edge-owner attribution on the retained dirty-region stack
|- capture root                    -> qa_logs/session_captures/v5-edge-entity-attribution/2026-04-25T04-40-24-693Z/
|- family owners                   -> left block | right flower | top block | bottom block
|- entity owners                   -> left `block_1776894272484_842`
|  |- top                          -> `block_1776894272485_854`
|  |- bottom                       -> `block_1776894272482_828`
|  `- right                        -> `flower_1776656084512_722_338_399.0048954728991`
|- owner shape                     -> ordinary grounded `pool-heart` blocks plus one far-right mature daisy
`- read                            -> the retained crop is being pinned by real zone dispersion, not by one oversized aura/debug overlay bug
```

```text
tight-bounds same-code compare
|- baseline  -> qa_logs/session_captures/v5-tight-bounds-control/2026-04-25T00-01-59-563Z/
|- candidate -> qa_logs/session_captures/v5-tight-bounds-candidate/2026-04-25T00-02-57-381Z/
`- diff      -> qa_logs/session_captures/v5-tight-bounds-candidate/2026-04-25T00-02-57-381Z/diff-vs-no-flag-control.md
```

```text
segmented entity composite follow-up
|- first candidate
|  |- candidate -> qa_logs/session_captures/v5-segmented-entity-composite-candidate/2026-04-25T00-41-52-785Z/
|  `- diff      -> qa_logs/session_captures/v5-segmented-entity-composite-candidate/2026-04-25T00-41-52-785Z/diff-vs-no-flag-control.md
|- refined candidate
|  |- candidate -> qa_logs/session_captures/v5-segmented-entity-composite-candidate-r2/2026-04-25T00-45-37-586Z/
|  `- diff      -> qa_logs/session_captures/v5-segmented-entity-composite-candidate-r2/2026-04-25T00-45-37-586Z/diff-vs-no-flag-control.md
|- stricter gates
|  |- h5 -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T00-47-10-748Z/report.json
|  `- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T00-47-10-709Z/report.json
`- read
   |- quick smoke looked strong
   |- first candidate did not activate segmented presentation consistently enough to trust
   |- refined candidate activated more often, but increased composite call count and failed stricter proof
   `- result -> rolled back; not part of the retained stack
```

```text
region-layer entity follow-up
|- first read
|  |- quick compare -> looked impossible-good because render/composite work collapsed
|  `- strict read   -> false win caused by `this.getOrCreateRegionLayer is not a function`
|- corrected candidate
|  |- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T01-09-16-587Z/
|  `- compare   -> versus qa_logs/session_captures/v0-baseline/2026-04-25T01-05-25-002Z/
`- corrected read
   |- calm   avgRender 18.42 -> 19.29
   |- battle avgRender 31.12 -> 32.64
   |- soak40 avgRender 20.20 -> 21.75
   |- heap   flat at 159.26 MB
   `- result -> rolled back; not part of the retained stack
```

```text
split-scenery entity layer follow-up
|- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T03-00-03-048Z/
|- compare   -> versus qa_logs/session_captures/v0-baseline/2026-04-25T01-05-25-002Z/
`- read
   |- calm   avgRender 18.42 -> 22.95
   |- shell  avgRender 19.85 -> 25.25
   |- battle avgRender 31.12 -> 38.50
   |- soak40 avgRender 20.20 -> 28.80
   |- compositeCallsPerFrame climbed across every lane
   `- result -> rolled back; not part of the retained stack
```

```text
grounded-block background-backdrop follow-up
|- quick compare
|  |- control   -> qa_logs/session_captures/v0-baseline/2026-04-25T03-32-13-046Z/
|  `- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T03-33-02-993Z/
|- quick read
|  |- calm   avgRender 14.13 -> 13.64
|  |- shell  avgRender 15.33 -> 14.49
|  |- soak40 avgRender 17.34 -> 16.21
|  `- battle avgRender 24.62 -> 26.22
|- stricter gates
|  |- r7 -> qa_screenshots/r7_block_visual_audit/2026-04-25T03-34-08-274Z/report.json
|  |- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T03-34-08-270Z/report.json
|  `- h5 -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T03-34-08-266Z/report.json
`- read
   |- block visuals and spatial truth held
   |- but same-code h5 control was better:
   |  |- calm   16.56 -> 19.10
   |  `- shell  14.74 -> 15.53
   `- result -> rolled back; not part of the retained stack
```

```text
grounded-block direct-present follow-up
|- quick compare
|  |- control   -> qa_logs/session_captures/v0-baseline/2026-04-25T03-48-39-446Z/
|  `- candidate -> qa_logs/session_captures/v0-baseline/2026-04-25T03-49-31-717Z/
|- quick read
|  |- calm   avgRender 14.13 -> 13.96
|  |- shell  avgRender 15.07 -> 15.01
|  |- soak40 avgRender 16.65 -> 16.92
|  `- battle avgRender 25.99 -> 27.05
|- stricter gates
|  |- r7 -> qa_screenshots/r7_block_visual_audit/2026-04-25T03-50-39-261Z/report.json
|  |- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T03-50-39-247Z/report.json
|  `- h5 -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T03-50-39-247Z/report.json
`- read
   |- block visuals and spatial truth held
   |- same-code h5 control was mixed but still failed the v5 render goal:
   |  |- candidate calm render  19.11 vs control 15.81
   |  `- candidate shell render 15.61 vs control 14.54
   `- result -> rolled back; not part of the retained stack
```

```text
native composite-present same-code h5 compare
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T04-02-37-038Z/report.json
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T04-03-40-751Z/report.json
`- read
   |- calm   avgUpdate 23.47 -> 22.83 | avgRender 16.36 -> 16.05
   |- shell  avgUpdate 25.09 -> 23.97 | avgRender 15.32 -> 15.02
   |- both lanes still fail closure targets
   `- result -> retained; this is a real but partial v5 win
```

```text
native composite-present guardrails
|- r4 -> qa_screenshots/r4_ui_readability_audit/2026-04-25T04-05-04-333Z/report.json
|- r5 -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T04-05-04-339Z/report.json
|- a4 -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T04-06-27-885Z/report.json
`- read
   |- readability held
   |- battle presentation held
   `- spatial truth held on a clean rerun
```

```text
edge-outlier peel follow-up
|- control   -> qa_logs/session_captures/v5-edge-outlier-peel-control/2026-04-25T04-49-28-558Z/
|- candidate -> qa_logs/session_captures/v5-edge-outlier-peel-candidate/2026-04-25T04-49-28-559Z/
`- read
   |- calm   avgRender 15.61 -> 15.48, but p99 worsened 27.70 -> 29.00
   |- shell  avgRender 16.99 -> 17.04
   |- soak40 avgRender 18.97 -> 19.11
   |- candidate telemetry still showed `entitiesEdgeOutlierCompositeMode: off`
   `- result -> rolled back; edge-owner attribution stays useful, but the peel seam was not earned
```

```text
wing-local butterfly bake quick compare
|- control   -> qa_logs/session_captures/v5-winglocal-control/2026-04-25T11-48-40-369Z/
|- candidate -> qa_logs/session_captures/v5-winglocal-candidate/2026-04-25T11-48-40-364Z/
`- read
   |- battle avgRender 29.11 -> 28.11
   |- calm   avgRender 15.29 -> 15.06, but p95/p99 worsened
   |- shell  avgRender 16.85 -> 16.41, but p95/p99 worsened
   |- soak40 avgRender 19.25 -> 18.65, but p95/p99 worsened
   |- heap   168.80 -> 179.29 MB
   `- result -> promising quick average win, but not earned
```

```text
wing-local butterfly bake same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T11-50-08-391Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T11-51-07-114Z/report.json
`- read
   |- calm   avgUpdate 5.9975 -> 6.14 | avgRender 16.2408 -> 16.5475
   |- shell  avgRender 14.5633 -> 14.4058
   |- both lanes still fail closure targets
   `- result -> rolled back; the stricter calm gate lost and the heap bump was visible
```

```text
hybrid dirty-present threshold same-code compare
|- control   -> qa_logs/session_captures/v5-hybrid-threshold-control/2026-04-25T11-59-11-150Z/
|- candidate -> qa_logs/session_captures/v5-hybrid-threshold-candidate/2026-04-25T11-59-11-168Z/
`- read
   |- calm   avgRender 16.74 -> 16.74, with p99 improving 32.30 -> 30.70
   |- shell  avgRender 18.08 -> 18.24
   |- battle avgRender 28.32 -> 31.71
   |- heap   168.80 -> 159.26 MB
   `- result -> mixed at best; not enough to retain
```

```text
hybrid dirty-present threshold same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T12-00-27-217Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T12-00-27-229Z/report.json
`- read
   |- calm   avgUpdate 6.6892 -> 6.7083 | avgRender 18.1942 -> 18.3658
   |- shell  avgUpdate 12.2900 -> 11.4625 | avgRender 16.3000 -> 16.4717
   |- both lanes still fail closure targets
   `- result -> rolled back; lower heap did not outweigh the stricter calm/shell loss
```

```text
native clip-present same-code compare
|- control   -> qa_logs/session_captures/v5-clip-present-control/2026-04-25T13-43-44-047Z/
|- candidate -> qa_logs/session_captures/v5-clip-present-candidate/2026-04-25T13-43-44-069Z/
`- read
   |- calm   avgRender 15.34 -> 15.32
   |- shell  avgRender 17.10 -> 17.12
   |- battle avgRender 28.34 -> 29.18
   |- heap   159.26 -> 159.26 MB
   `- result -> nearly flat in quick smoke, but not enough to retain
```

```text
native clip-present same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-44-53-145Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-44-53-149Z/report.json
`- read
   |- calm   avgUpdate 6.4358 -> 6.4850 | avgRender 17.7633 -> 17.7750
   |- shell  avgUpdate 10.6667 -> 9.2950 | avgRender 15.9733 -> 15.5750
   |- both lanes still fail closure targets
   `- result -> rolled back; the stricter calm gate still got slightly worse
```

```text
native no-smooth present same-code compare
|- control   -> qa_logs/session_captures/v5-nosmooth-control/2026-04-25T13-47-02-838Z/
|- candidate -> qa_logs/session_captures/v5-nosmooth-candidate/2026-04-25T13-47-02-859Z/
`- read
   |- calm   avgRender 15.60 -> 15.60
   |- shell  avgRender 17.34 -> 17.16, but tails worsened
   |- battle avgRender 29.78 -> 26.17
   |- heap   159.26 -> 159.26 MB
   `- result -> good battle-only shape, but not enough on the lived-in runtime stack
```

```text
native no-smooth present same-code h5 compare
|- control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-48-11-298Z/report.json
|- candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T13-48-11-307Z/report.json
`- read
   |- calm   avgUpdate 6.6083 -> 6.6458 | avgRender 17.8217 -> 17.8025
   |- shell  avgUpdate 11.4108 -> 9.3542 | avgRender 15.8983 -> 15.9333
   |- both lanes still fail closure targets
   `- result -> rolled back; battle improved in quick smoke, but the stricter calm/shell pair did not earn retention
```

```text
non-carried blocks-layer same-code compare
|- control   -> qa_logs/session_captures/v5-blocks-layer-control/2026-04-25T19-40-58-367Z/
|- candidate -> qa_logs/session_captures/v5-blocks-layer-candidate/2026-04-25T19-40-58-367Z/
`- read
   |- actor crop shrank hard
   |  |- control `composite.entitiesCompositeMs` -> 9.01
   |  `- candidate `composite.entitiesCompositeMs` -> 0.50
   |- block layer inherited most of the old cost
   |  `- candidate `composite.blocksCompositeMs` -> 8.91
   |- quick smoke stayed mixed
   |  |- calm   avgRender 15.88 -> 15.79
   |  |- shell  avgRender 17.44 -> 17.68
   |  `- soak40 avgRender 18.73 -> 19.16
   `- heap dropped materially
      `- peakHeapUsedMB 179.29 -> 159.26 MB
```

```text
non-carried blocks-layer stricter gates
|- h5 control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-42-29-012Z/report.json
|- h5 candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-42-29-014Z/report.json
|- a4 candidate -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T19-43-46-574Z/report.json
|- r7 candidate -> qa_screenshots/r7_block_visual_audit/2026-04-25T19-43-46-575Z/report.json
`- read
   |- same-code h5 improved slightly
   |  |- calm   avgRender 18.22 -> 17.97
   |  `- shell  avgRender 16.43 -> 16.41
   |- spatial truth held
   |- block visuals held
   `- result -> retained as a default-off seam, not promoted to the live default stack
```

```text
non-carried blocks-layer reuse same-code compare
|- control   -> qa_logs/session_captures/v5-blocks-reuse-control/2026-04-25T19-49-01-131Z/
|- candidate -> qa_logs/session_captures/v5-blocks-reuse-candidate/2026-04-25T19-49-01-137Z/
`- read
   |- calm   avgRender 15.43 -> 14.47
   |- shell  avgRender 17.18 -> 15.98
   |- soak40 avgRender 18.55 -> 17.61
   |- battle avgRender 29.40 -> 25.86
   |- heap   159.26 -> 159.26 MB
   `- result -> earned as the better default behavior inside the optional blocks-layer seam
```

```text
non-carried blocks-layer reuse stricter gates
|- h5 control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-50-01-159Z/report.json
|- h5 candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T19-50-01-173Z/report.json
|- a4 candidate -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T19-51-10-081Z/report.json
|- r7 candidate -> qa_screenshots/r7_block_visual_audit/2026-04-25T19-51-10-081Z/report.json
`- read
   |- same-code h5 improved materially
   |  |- calm   avgRender 17.81 -> 16.65
   |  `- shell  avgRender 15.93 -> 14.98
   |- spatial truth held
   |- block visuals held
   `- result -> retained; this is now the earned version of the optional blocks-layer seam
```

```text
flower direct-present retained-stack compare
|- control   -> qa_logs/session_captures/v5-flower-direct-retained-control/2026-04-25T20-13-01-761Z/
|- candidate -> qa_logs/session_captures/v5-flower-direct-retained-candidate/2026-04-25T20-13-51-897Z/
`- read
   |- calm   avgRender 15.04 -> 13.45
   |- shell  avgRender 16.31 -> 14.75
   |- soak40 avgRender 18.31 -> 15.51
   |- battle avgRender 24.51 -> 27.28
   |- heap   159.26 -> 159.26 MB
   `- result -> retained as a default-off seam only; the battle-prelude slice still regressed
```

```text
flower direct-present stricter gates
|- h5 control   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T20-15-01-161Z/report.json
|- h5 candidate -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T20-16-00-406Z/report.json
|- a4 candidate -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T20-17-33-858Z/report.json
|- r5 candidate -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T20-17-33-893Z/report.json
|- r7 candidate -> qa_screenshots/r7_block_visual_audit/2026-04-25T20-18-20-896Z/report.json
`- read
   |- same-code h5 improved materially
   |  |- calm   avgRender 17.27 -> 15.37
   |  `- shell  avgRender 15.45 -> 13.31
   |- spatial truth held
   |- battle presentation held
   |- block visuals held
   `- result -> retained as a default-off seam pending a battle-safe activation rule
```

```text
final lived-in proof stack
|- h5 pass -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T21-12-00-822Z/report.json
|- r4 pass -> qa_screenshots/r4_ui_readability_audit/2026-04-25T21-13-02-701Z/report.json
|- r5 pass -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T21-18-20-182Z/report.json
|- a4 pass -> qa_screenshots/a4_spatial_truth_audit/2026-04-25T21-18-51-650Z/report.json
`- read
   |- calm   avgUpdate 6.96 | avgRender 13.88
   |- shell  avgUpdate 11.51 | avgRender 13.74
   |- export capture phase passed with errorRuntimeIssueCount 0
   `- cadence-budget-overrun remained warning-only telemetry
```

### Guardrail Read

```text
what held
|- battle remained on the conservative full-frame path
|- canvas-heavy shell states were excluded from dirty-region cropping
|- shellUiDom default-on did not break readability proof
|- the onboarding guide no longer spends canvas redraws on the lived-in clean-shell lane
|- idle clean-shell HUD redraw discipline closed the final calm-lane render gap without changing shell affordances
|- mature flower heads kept live sway / rotation / pulse while cutting scenery draw cost sharply
|- a4 turning green indicates the remaining spatial freeze blocker is no longer geometry drift
|- `h5`, `r4`, `r5`, and `a4` are now green on the lived-in save
`- the retained v5 seams improved clean-shell render cost without flattening the scene
```

```text
what is still not earned
|- battle still stays on the conservative full-frame composite path
|- standalone `directPresentFlowers` is still not promoted by itself because the quick pre-battle lane remains less stable there
|- `v6` worker offload is still not earned
|- `v7` visual restoration is still ahead of this frozen phase
|- the rejected static block cache did not survive the lived-in h5 gate and is not part of the retained path
|- the flower-stem bake candidate looked good in quick smoke but failed h5, so it was rolled back
|- the raw butterfly canvas path regressed calm/shell/soak on the retained stack and was rolled back
|- the direct entity present path regressed calm/shell/battle/soak on the retained stack and was rolled back
|- the native entity composite present path slightly improved some averages but regressed p95/p99 and soak behavior, so it was rolled back
|- the tighter butterfly dirty-bounds follow-up improved soak but regressed calm/shell, so it was rolled back
|- the segmented entity-composite follow-up looked strong in quick smoke but failed stricter h5/a4 proof and was rolled back
|- the region-layer entity follow-up only looked good before a runtime error was fixed; after the fix it regressed calm/battle/soak and was rolled back
|- the split-scenery entity layer follow-up regressed every lived-in render lane and was rolled back
|- the grounded-block background-backdrop follow-up improved quick calm/shell/soak reads but lost same-code h5 and was rolled back
|- the grounded-block direct-present follow-up helped some update-side reads but regressed calm/shell render in same-code h5 and was rolled back
|- the owner-provided flower/block composite-bounds follow-up only shrank the retained dirty-region crop slightly (`706x273 -> 702x266`) and still regressed calm (`14.29 -> 14.34ms`), so it was rolled back
|- edge-owner attribution now says the retained crop is being pinned by ordinary dispersed `pool-heart` occupants: grounded blocks own left/top/bottom and one mature daisy owns the right edge
|- the edge-outlier peel follow-up used that attribution as a runtime seam, but it never activated into a meaningful extra composite split on the lived-in stack and was rolled back
|- the wing-local butterfly bake follow-up improved quick averages but lost the stricter h5 calm gate (`16.2408 -> 16.5475`) and raised heap (`168.80 -> 179.29 MB`), so it was rolled back
|- the hybrid dirty-present threshold follow-up lowered heap (`168.80 -> 159.26 MB`) but made the stricter calm/shell h5 read worse (`18.1942 -> 18.3658`, `16.3000 -> 16.4717`), so it was rolled back
|- the native clip-present follow-up stayed almost flat in quick smoke, but the stricter calm h5 read still moved the wrong way (`17.7633 -> 17.7750`), so it was rolled back
|- the native no-smooth present follow-up improved battle in quick smoke, but the stricter calm/shell pair did not earn retention (`17.8217 -> 17.8025`, `15.8983 -> 15.9333`), so it was rolled back
|- the non-carried blocks-layer follow-up shrank the actor crop hard (`entitiesCompositeMs 9.01 -> 0.50` on calm) but handed most of that cost to a new block composite (`blocksCompositeMs 8.91`), so quick smoke stayed mixed even while same-code `h5` improved slightly (`18.22 -> 17.97`, `16.43 -> 16.41`) and heap dropped (`179.29 -> 159.26 MB`)
|- the non-carried blocks-layer reuse follow-up then improved that same seam cleanly in both quick smoke and same-code `h5` (`17.81 -> 16.65`, `15.93 -> 14.98`) while keeping heap flat and holding both `a4` and `r7`
|- the cleaned-up stacked follow-up then proved that the blocks seam is strongest when it auto-pulls the direct-flower companion path: same-code quick calm/shell/soak improved, same-code `h5` improved, heap stayed flat, `a4` stayed green, and `r7` only failed on a control rerun while the candidate rerun passed
|- the blocks-layer seam is therefore now promoted into the live default dirty-region stack, with the reuse path as its default internal behavior and the direct-flower companion path riding inside that seam
|- the flower direct-present follow-up moved 36 mature flowers off the shared entity crop, collapsed the calm-lane `entitiesCompositeMs` to nearly zero, improved same-code `h5` (`17.27 -> 15.37`, `15.45 -> 13.31`), and held `a4`, `r5`, and `r7`, but it still regressed the quick pre-battle battle lane while active in focused-garden
|- the flower direct-present seam is therefore still retained as a standalone default-off seam for isolated proof, but it no longer blocks the promoted blocks seam because that combined shape earned cleaner same-code proof
|- compositeNativeDraw is now banked as a retained v5 seam, but it only narrows the gap
`- later runtime work now moves downstream into `v6` / `v7`, not back into unresolved `v5` proof
```

### Honest Phase State

```text
v5 today
|- retained seams       -> clean-shell dirty-region composites + native entity/behind composite present + DOM guide path + baked mature flower heads + live non-carried blocks composite layer with reuse-on by default inside that seam and the direct-flower companion path auto-pulled inside that seam + standalone default-off mature-flower direct-present seam
|- shell default        -> shellUiDom is now the live default shell path
|- scenery default      -> bakedFlowerHeads is now the live default mature-flower path
|- present default      -> compositeNativeDraw is now the live entity/behind composite-present path
|- cadence default      -> simCadenceSplit is now the live default runtime cadence shape
|- composite default    -> compositeDirtyRegions is now the live clean-shell composite path
|- blocks default       -> compositeBlocksLayer is now live on clean-shell dirty-region lanes, with compositeBlocksLayerReuse and the retained direct-flower companion path acting as its default internal behavior
|- optional seam        -> directPresentFlowers stays available as a standalone default-off proof seam
|- final proof          -> `h5`, `r4`, `r5`, and `a4` are green on the lived-in save
|- phase closure        -> earned; `v5` is now frozen live
`- carry forward
   |- keep dirty-region cropping limited to clean-shell lanes
   |- keep native composite present on the live path
   |- keep the promoted blocks seam on the live clean-shell path
   |- keep standalone directPresentFlowers default-off for isolated proof
   |- keep warning-only cadence telemetry out of the hard runtime-error bucket in exported capture proof
   |- do not reopen another broad flower/block bounds guess; the retained crop is being pinned by real dispersed occupants, not by a single oversized effect bug
   |- keep the new edge-owner attribution, but do not carry the failed edge-outlier peel seam
   |- keep battle + canvas-heavy shell on the conservative path
   |- keep the guide on the DOM shell path
   |- keep mature flower heads on the baked path
   |- keep the failed flower-stem bake off the live path
   |- keep the failed raw butterfly canvas path off the live path
   |- keep the failed direct entity present path off the live path
   |- keep the failed native entity composite present path off the live path
   |- keep the failed tight-bounds follow-up off the live path
   |- keep the failed segmented entity-composite follow-up off the live path
   |- keep the failed region-layer entity follow-up off the live path
   |- keep the failed split-scenery entity layer follow-up off the live path
   |- keep the failed grounded-block background-backdrop follow-up off the live path
   |- keep the failed owner-provided flower/block composite-bounds follow-up off the live path
   |- keep the failed grounded-block direct-present follow-up off the live path
   |- keep the failed wing-local butterfly bake off the live path
   |- keep the failed hybrid dirty-present threshold follow-up off the live path
   |- keep the failed native clip-present follow-up off the live path
   |- keep the failed native no-smooth present follow-up off the live path
   |- treat the repeated `r5` visible-combat timeout as an audit-stability seam until it is separated from real runtime regressions; that timeout reproduced on both the promoted stack and an old-default override
   `- move the runtime track forward into `v6` / `v7` without reopening cadence or geometry work
```

## V6 Worker Offload Audit

_Source: `docs/V6-WORKER-OFFLOAD-AUDIT.md`_

### Purpose

This audit records the first `v6` off-thread seam and freezes the honest
result before any broader worker rollout is attempted.

```text
v6 first cut
|- seam              -> stateless ML policy scoring worker
|- retained code     -> bootstrap + worker scripts + orchestrator hooks
|- retained default  -> off
|- fallback path     -> inline ML scoring on worker unavailable/error
`- honest state      -> groundwork landed, retained win not earned yet
```

### Live Runtime Shape

```text
flag
`- performance.flags.workerOffload
   |- off -> legacy inline ML scoring path
   `- on  -> worker bootstrap attempts stateless `ml.infer`
      |- host script      -> workers/offloadHost.js
      |- worker script    -> workers/mlOffloadWorker.js
      |- orchestrator     -> systems/mlInferenceSystem.js
      |- truth ownership  -> main thread still owns features, traces, runtime state, save state
      `- fallback         -> inline scoring or heuristic/last-valid reuse on sync gap/error
```

### Files

- `workers/offloadHost.js`
- `workers/mlOffloadWorker.js`
- `systems/mlInferenceSystem.js`
- `index.html`
- `docs/ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md`
- `docs/ACTIVE-COMPLETION-BOARD.md`

### Proof

```text
first candidate
|- baseline  -> qa_logs/session_captures/v5-retained-post-rollback/2026-04-24T18-16-31-541Z/
|- candidate -> qa_logs/session_captures/v6-worker-offload-candidate/2026-04-24T22-33-12-884Z/
`- diff      -> qa_logs/session_captures/v6-worker-offload-candidate/2026-04-24T22-33-12-884Z/diff-vs-v5-retained-post-rollback.md
```

```text
revised candidate
|- baseline  -> qa_logs/session_captures/v5-retained-post-rollback/2026-04-24T18-16-31-541Z/
|- candidate -> qa_logs/session_captures/v6-worker-offload-candidate-r2/2026-04-24T22-36-00-312Z/
`- diff      -> qa_logs/session_captures/v6-worker-offload-candidate-r2/2026-04-24T22-36-00-312Z/diff-vs-v5-retained-post-rollback.md
```

```text
batched/stateless candidate
|- baseline  -> qa_logs/session_captures/v5-retained-post-rollback/2026-04-24T18-16-31-541Z/
|- candidate -> qa_logs/session_captures/v6-worker-offload-batch-candidate/2026-04-24T22-57-34-470Z/
`- diff      -> qa_logs/session_captures/v6-worker-offload-batch-candidate/2026-04-24T22-57-34-470Z/diff-vs-v5-retained-post-rollback.md
```

```text
first candidate read
|- calm   -> 14.48 / 6.28  -> 15.14 / 6.47
|- shell  -> 15.54 / 9.84  -> 16.42 / 9.80
|- battle -> 26.74 / 18.45 -> 28.39 / 20.35
|- soak   -> 17.07 / 8.52  -> 17.87 / 9.41
`- read   -> clear regression; not retained
```

```text
revised candidate read
|- calm   -> 14.48 / 6.28  -> 15.35 / 6.48
|- shell  -> 15.54 / 9.84  -> 17.54 / 10.11
|- battle -> 26.74 / 18.45 -> 25.86 / 19.51
|- soak   -> 17.07 / 8.52  -> 17.33 / 8.56
|- heap   -> 159.26 -> 159.26 MB
`- read   -> one narrow battle render win, broader lived-in regression; still not retained
```

```text
ml runtime note from revised candidate
|- avgGardenUpdateMs -> 1.39
|- mlPolicyShare     -> 0.52
|- fallbackShare     -> 0.48
`- read              -> worker path is functioning, but current orchestration does not beat the retained v5 stack
```

```text
batched/stateless candidate read
|- calm   -> 14.48 / 6.28  -> 19.75 / 8.99
|- shell  -> 15.54 / 9.84  -> 22.33 / 8.78
|- battle -> 26.74 / 18.45 -> 37.05 / 28.40
|- soak   -> 17.07 / 8.52  -> 22.51 / 13.70
|- heap   -> 159.26 -> 159.26 MB
`- read   -> batch removed per-entity chatter, but still regressed every lived-in render lane; not retained
```

```text
batched runtime note
|- avgGardenUpdateMs -> 2.10
|- mlPolicyShare     -> 0.48
|- fallbackShare     -> 0.52
`- read              -> batch seam is working, but the current off-thread ML cut still does not beat the retained v5 stack
```

```text
deferred-trace candidate
|- control report   -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-12-05-976Z/report.json
|- candidate report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-12-47-943Z/report.json
|- control capture  -> qa_logs/session_captures/2026-04-25T22-12-43-387Z-h5-long-running-save-capture-1777155132050/
`- candidate capture -> qa_logs/session_captures/2026-04-25T22-13-25-812Z-h5-long-running-save-capture-1777155174053/
```

```text
deferred-trace candidate read
|- seam   -> worker returns prebuilt model traces and the garden worker path defers unchanged cadence-only refreshes until the worker result lands
|- calm   -> 6.56 / 13.51 -> 6.70 / 13.53
|- shell  -> 10.81 / 13.26 -> 10.34 / 12.98
|- p95    -> 30.90 -> 30.80
|- heap   -> 168.80 -> 159.26 MB
|- trace churn -> avgRefreshedTraceCount 3.31 -> 2.86
|- ml share    -> 0.90 -> 0.78
`- read   -> mixed but better than earlier worker cuts; passes h5, lowers trace churn and heap, helps shell-heavy play, but calm is not clearly better and the seam is still not strong enough to promote
```

### Guardrail Read

```text
what held
|- worker path stayed stateless
|- save truth stayed on the main thread
|- no durable relationship/memory/emotion state moved off-thread
|- fallback path stayed available
|- same-code h5 control and candidate both passed on the lived-in save
`- flag stayed default-off
```

```text
what is not earned
|- no v6 default-on flip
|- no runtime board promotion from this seam alone
|- no claim that worker offload solved the remaining blocker
`- no claim that the deferred trace cut beats the live stack strongly enough to freeze c5 closed
```

### Honest Phase State

```text
v6 today
|- groundwork        -> live behind default-off code
|- best retained cut -> deferred model-trace worker return + unchanged-cadence garden refresh deferral
|- retained outcome  -> improved groundwork only; still not promoted
|- next safe move
|  |- do not promote the current ML-offload cuts as a live runtime win
|  |- keep the stronger deferred-trace cut only as default-off groundwork unless a later same-code proof turns it into a clear gain
|  `- if v6 stays mixed, carry the frozen live runtime stack into v7 instead of inventing a worker victory
`- current blocker   -> the deferred trace cut is safer and lighter than the older worker seams, but lived-in calm still does not improve enough to close c5 honestly
```

## V7 Visual Restoration Audit

_Source: `docs/V7-VISUAL-RESTORATION-AUDIT.md`_

### Purpose

This audit freezes the first honest `v7` restoration result:

```text
v7 restored state
|- sharp creatures   -> live through bakedCreatureSprites
|- trails available  -> reduced + full now live behind player setting
|- shipped default   -> trails stay off by default
`- sprite atlas      -> still off
```

### Live Runtime Shape

```text
visual restoration
|- performance.flags.bakedCreatureSprites -> true
|- performance.flags.trailsQualityReduced -> true
|- performance.flags.trailsQualityFull    -> true
|- performance.flags.spriteAtlas          -> false
|- accessibility.trailVisibility         -> off (default)
|- player options                        -> off / reduced / full
`- battle rule                           -> trails still off in battle
```

### Files

- `core/config.js`
- `core/renderManager.js`
- `ui/gameUI.js`
- `scripts/run-h5-long-running-save-smoothness-audit.js`
- `scripts/run-r4-ui-readability-audit.js`
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-v3-sprite-parity-audit.js`

### Proof

```text
live default (trails off)
|- report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-43-28-136Z/report.json
|- calm   -> 6.76 / 13.33
|- shell  -> 12.06 / 12.95
`- p95    -> 31.40
```

```text
reduced trails
|- report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-46-43-006Z/report.json
|- calm   -> 6.56 / 12.96
|- shell  -> 10.60 / 13.08
`- ratio  -> calm render 12.96 / 13.33 = 0.97x off-baseline
```

```text
full trails
|- report -> qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-25T22-44-10-129Z/report.json
|- calm   -> 6.89 / 13.13
|- shell  -> 9.81 / 12.77
`- ratio  -> calm render 13.13 / 13.33 = 0.98x off-baseline
```

```text
sharp-creature parity
|- report -> qa_screenshots/v3_sprite_parity_audit/2026-04-25T22-42-38-064Z/report.json
`- read   -> pass
```

```text
readability under heaviest player path
|- report -> qa_screenshots/r4_ui_readability_audit/2026-04-25T22-45-01-908Z/report.json
`- read   -> pass
```

```text
battle presentation note
|- control report   -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-40-44-517Z/report.json
|- candidate report -> qa_screenshots/r5_battle_presentation_audit/2026-04-25T22-39-53-556Z/report.json
`- read             -> both failed on the same guard-only battle fixture, so r5 was not used as the v7 differentiator
```

### Guardrail Read

```text
what held
|- trails remain off by default
|- reduced and full are both player-available again
|- baked creature path is now live on the real runtime stack
|- lived-in h5 passes off / reduced / full
|- readability holds under full
`- parity still holds on the baked creature path
```

```text
what is not earned
|- spriteAtlas still stays off
|- no claim that the current r5 battle fixture is repaired
`- no claim that v8a or c7 are already closed
```

### Honest Phase State

```text
v7 today
|- status          -> frozen live
|- shipped default -> sharp creatures on, trails off
|- player options  -> reduced / full available
|- shared schema   -> c7 signoff is now recorded at `schemaVersion = 4`
`- next proof      -> v8a runtime-only proof on the frozen live stack
```

## Active Spatial Unification Board

_Source: `docs/ACTIVE-SPATIAL-UNIFICATION-BOARD.md`_

### Purpose

This board captures the exact implementation order for fixing the deeper
spatial inconsistencies surfaced by recent playtesting:

```text
╔════════════════════════════ Spatial Problem Shape ═══════════════════════════╗
║ visible symptom            │ likely underlying seam                         ║
╠════════════════════════════╪═════════════════════════════════════════════════╣
║ portal zooming             │ doorway route is not driven by one shared board│
║ doorway/corridor mismatch  │ roam bounds, anchors, and cover path split     │
║ awkward block placement    │ block size is not locked to one spatial unit   │
║ incomplete 3D feel         │ footprints / occupancy / bounds are not unified║
║ lower-area underuse        │ legal movement space is narrower than intended ║
╚════════════════════════════╧═════════════════════════════════════════════════╝
```

This is not a free-flight volumetric 3D promotion plan.
It is a grounded pseudo-3D unification plan:

```text
target
├─ one board boundary owner
├─ one spatial unit contract
├─ one doorway/corridor truth
├─ one occupancy/footprint model
└─ one save-migration path when geometry changes
```

Use this with:

- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md)
- [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md)
- [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)
- [ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md](./ACTIVE-VISUAL-FIRST-RUNTIME-BOARD.md)
- [VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md](./VISUAL-FIRST-RUNTIME-OPTIMIZATION-PLAN-REFINED.md)
- [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md)

### Non-Negotiables

```text
always preserve
├─ no phase may remove a core simulation system to simplify spatial logic
├─ no phase may fake 3D with inconsistent per-entity shortcuts
├─ one block must become one canonical spatial unit for placement/support truth
├─ butterflies, flowers, eggs, cocoons, caterpillars, and blocks must read from the same board contract
├─ bounds expansion must be geometry-led, not a blind loosen-the-clamp tweak
├─ save migration must preserve long-running butterfly identity / relationships / lineage
└─ the live runtime remains grounded pseudo-3D, not volumetric sandbox 3D
```

### Current Diagnosis

```text
current stack
├─ s0 owner / seam ledger                    -> written in `CURRENT-SPATIAL-TRUTH.md`
├─ s1 spatial unit contract                  -> written in `SPATIAL-UNIT-CONTRACT.md`
├─ roam polygon / placement region           -> shared and expanded to the intended board shoulders
├─ doorway anchors / cover anchors           -> corridor-owned and board-aligned after `s3`
├─ 18x18 iso debug grid                      -> explicitly debug-only after `s1`
├─ block render size / stack spacing         -> contract-locked, but runtime heuristics still transitional
├─ occupancy bands                           -> semantic, not yet the sole physical contract
└─ zone travel route                         -> corridor-owned and distance-aware after `s3`
```

### Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current planning / implementation phase

queued
|- next in exact order

gated
`- cannot close honestly until prerequisite proof exists
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Honest gate |
| --- | --- | --- | --- | --- |
| `s0 spatial truth audit + baseline` | `live` | inventory every live owner of bounds, units, placement, occupancy, and route geometry before changing them, including file-ownership conflicts logged in `CROSS-TRACK-ARBITRATION.md` | `docs/CURRENT-SPATIAL-TRUTH.md`, `core/config.js`, `core/gameCore.js`, `systems/physicsSystem.js`, `systems/structureSystem.js`, `scripts/` | closed through the owner ledger, seam ledger, and later-audit checklist now written into `CURRENT-SPATIAL-TRUTH.md` |
| `s1 canonical spatial unit contract` | `live` | lock `1 block = 1 board unit = 1 support/stack unit`, define how screen/iso/occupancy units relate, and keep the `18x18` iso grid as debug-only after `s1` | `core/config.js`, `systems/structureSystem.js`, `systems/physicsSystem.js`, `docs/` | closed through `SPATIAL-UNIT-CONTRACT.md`; the unit contract is explicit and the `18x18` grid is no longer ambiguous |
| `s2 board boundary expansion contract` | `live` | expand the movable/placement board to the intended wall borders and lower play area without breaking clamps | `core/config.js`, `core/gameCore.js`, `gridManager`, `docs/` | closed through `SPATIAL-BOUNDARY-EXPANSION-AUDIT.md` plus the green `r1`, `r2`, and `a4` proof lanes on the widened board |
| `s3 doorway corridor alignment` | `live` | rebuild doorway mouths, cover corridors, and warp staging from the expanded board geometry | `core/config.js`, `core/gameCore.js`, `core/renderManager.js` | closed through `DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md`, with corridor-owned approach/lineup/cover/settle anchors and green `r2`, `a6`, `a4` proof lanes |
| `s4 entity footprint unification` | `live` | define canonical footprints/clearances for butterflies, flowers, blocks, eggs, cocoons, caterpillars | `systems/physicsSystem.js`, `systems/structureSystem.js`, `entities/`, `core/gameCore.js` | closed through `ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md`; the family footprint registry now owns radii/clearance truth across structure, physics, and the remaining gameCore fallbacks |
| `s5 block placement + support unification` | `live` | make block scatter, placement, support, and stack logic honor the canonical unit grid | `systems/structureSystem.js`, `systems/physicsSystem.js`, `core/gameCore.js`, `entities/block.js` | closed through `BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md`; openings, columns, scatter spacing, safe-drop fallback, and block lift now read from one declared block unit |
| `s6 shared interaction-space reconciliation` | `live` | align movement, placement, shelter, carry, flowers, eggs, cocoons, and chrysalis/larva interactions to the same board truth | `core/gameCore.js`, `systems/physicsSystem.js`, `systems/structureSystem.js`, `entities/`, `systems/sleepSystem.js` | closed through `SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md`; butterfly sampling, flower placement/relocation, pollen planting, and caterpillar travel now share the widened interaction-space contract |
| `s7 save migration (joint with runtime v7 / social n8, via SAVE-SCHEMA-REGISTRY)` | `live` | migrate old saves into the new board/unit model without wiping long-running social/lineage state | `systems/saveSystem.js`, `core/gameCore.js`, `systems/objectSystem.js`, `scripts/` | closed through `SPATIAL-SAVE-MIGRATION-AUDIT.md`; stale refresh revisions now rewrite into the widened-board contract without forcing a fresh world |
| `s8 audits + soak + proof freeze` | `live` | prove the new spatial contract under normal play, route transitions, structure building, and long-running saves | `scripts/`, `qa_screenshots/`, `docs/` | travel, placement, structure, and save lanes are green and the board freezes honestly on the lived-in save |

### Exact Order

```text
s0
 │
 ▼
s1
 │
 ▼
s2
 │
 ▼
s3
 │
 ▼
s4
 │
 ▼
s5
 │
 ▼
s6
 │
 ▼
s7
 │
 ▼
s8
```

### Why This Order

```text
do not do this
expand bounds first
  └─▶ then discover block/support units are inconsistent

do this instead
audit owners
  └─▶ lock unit contract
       └─▶ expand board
            └─▶ rebuild doorway routes
                 └─▶ unify blocks and footprints
```

### Current Focus

```text
current focus
└─ spatial board freeze
   ├─ current proof  -> `SPATIAL-SAVE-MIGRATION-AUDIT.md`
   ├─ board lock     -> lived-in saves now re-seat into the widened board without wiping sacred long-running state
   ├─ closure proof  -> `r2`, `b4`, `r7`, `a4`, and `h5` are green on the lived-in save
   ├─ runtime self   -> known non-spatial warn only; no longer a blocker for the spatial freeze
   └─ carry forward  -> hold geometry, units, occupancy, and corridor truth frozen unless a later migrated-save proof surfaces a real contradiction
```

### Relationship To Current Runtime Work

```text
visual-first runtime board
├─ owns smoothness / memory / UI / rendering optimization
└─ remains active

spatial unification board
├─ owns board geometry / units / occupancy / doorway truth
└─ is now in real implementation order, not review-only holding
```

This board exists so the spatial work can correct the underlying model once,
instead of continuing to absorb one-off route or placement patches forever.

## Spatial Unit Contract

_Source: `docs/SPATIAL-UNIT-CONTRACT.md`_

### Purpose

This doc is the stable `s1` lock for the live grounded pseudo-3D board.

It exists to answer one question clearly:

```text
what is the canonical spatial unit?
```

The answer going forward is:

```text
canonical unit
├─ 1 block footprint width
├─ 1 board-space placement/support unit
└─ 1 occupancy / stack step reference
```

Use this with:

- [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)
- [ACTIVE-SPATIAL-UNIFICATION-BOARD.md](./ACTIVE-SPATIAL-UNIFICATION-BOARD.md)
- [SPATIAL-UNIFICATION-ROADMAP.md](./SPATIAL-UNIFICATION-ROADMAP.md)

### Canonical Rule

```text
1 block
   = 1 board unit
   = 1 support / stack unit
   = the base footprint reference for occupancy columns
```

Interpretation:

- board expansion in `s2` must be expressed in this unit
- doorway/corridor geometry in `s3` must inherit from this unit
- entity footprints in `s4` must be declared relative to this unit
- block placement/support in `s5` must measure against this unit

### Live Mapping

```text
authoritative for spatial truth
├─ board unit                -> canonical
├─ occupancy/support step    -> canonical
└─ stack height              -> canonical

presentation-only mappings
├─ config grid cell          -> screen/placement helper
├─ isometric tile width/height -> projection helper
├─ block render width/height -> sprite presentation
└─ legacy gridManager tile math -> debug / conversion only
```

Current live values that must map onto this contract:

| Surface | Current live value | Contract meaning |
| --- | --- | --- |
| `gameConfig.grid.cellSize` | `16` | helper scale, not the spatial authority |
| `gameConfig.isometric.tileWidth` | `18` | projection helper, not block truth |
| `gameConfig.isometric.tileHeight` | `9` | projection helper, not block truth |
| `entities.block.renderWidth` | `20` | current sprite width, not independent placement truth |
| `entities.block.renderHeight` | `20` | current sprite height, not independent support truth |
| `entities.block.maxStackHeight` | `12` | `12` canonical support steps |
| `gridManager.tileWidth` | `32` | legacy/debug conversion only after `s1` |
| `gridManager.tileHeight` | `16` | legacy/debug conversion only after `s1` |

### Required Boundary

```text
after s1
├─ the 18x18 iso grid stays debug-only
├─ renderWidth/renderHeight stop acting like hidden spatial authorities
└─ physics/structure heuristics must be retired phase by phase in favor of
   declared board-unit footprints
```

That means:

- `gridManager` may still convert and visualize
- it may not become a second owner of live board bounds or block size
- `renderWidth` may still drive sprite presentation
- it may not remain the long-term source of placement, support, or clearance truth

### Transitional Mismatch Ledger

```text
still transitional today
├─ structure spacing derives from block.renderWidth
├─ occupancy radii derive from renderWidth heuristics
├─ physics block radius/clearance derives from renderWidth and stackIndex
└─ debug grid uses a separate tile projection size
```

These are explicitly tolerated only as transitional seams for:

```text
s2 -> board boundary expansion
s3 -> doorway corridor rebuild
s4 -> entity footprint declarations
s5 -> block placement/support unification
```

### Phase Gate

`s1` closes when:

1. this contract exists
2. the active spatial board and roadmap point to it
3. the `18x18` iso grid is no longer ambiguous and is declared debug-only
4. later phases are explicitly tasked with retiring render-size-derived spatial heuristics

That gate is now satisfied at the planning/contract layer.

## Spatial Boundary Expansion Audit

_Source: `docs/SPATIAL-BOUNDARY-EXPANSION-AUDIT.md`_

### Purpose

This is the stable `s2` closure note for the spatial-unification track.

It records the first true board-geometry expansion after the `s1` unit lock:

```text
old board
├─ shared polygon
└─ shared placement region
   └─ too narrow near the wall starts

new board
├─ wider back-wall shoulders
├─ same shared polygon owner
├─ same derived placement-region owner
└─ less inset lower / border use
```

### Runtime Closure

```text
s2 landed shape
├─ the focused-garden roam polygon now reaches farther toward the wall starts
├─ the derived placement region is less inset
├─ UI reserve no longer depends on a brittle polygon index
└─ movement / placement clamps still route through the same shared geometry owners
```

### Proof Snapshot

Primary artifacts:

- `qa_screenshots/r1_movement_stability_audit/2026-04-22T08-43-07-312Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T08-43-07-354Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T08-43-07-302Z/report.json`

```text
s2 proof
├─ r1 movement stability        -> pass
├─ r2 zone transition           -> pass
├─ a4 shared spatial truth      -> pass
└─ shared focused-garden region -> 28/108/772/396
```

The shared section placement region now resolves to:

```text
placement region
├─ minX -> 28
├─ minY -> 108
├─ maxX -> 772
└─ maxY -> 396
```

### Honest Boundary

```text
s2 closes
├─ board boundary expansion
└─ board-owner consistency

s2 does not close
└─ doorway corridor alignment
   └─ that is still `s3`
```

So the board is larger and more internally consistent now, but the exact
doorway/corridor path shape is still the next active spatial phase.

## Doorway Corridor Alignment Audit

_Source: `docs/DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md`_

### Purpose

This is the stable `s3` closure note for the spatial-unification track.

It closes the route-shape seam left open by the wider `s2` board:

```text
old route
├─ generic approach offset
├─ generic lineup offset
├─ shallow cover tuck
└─ generic inward arrival drift

new route
├─ corridor-owned back-wall lane
├─ corridor-owned lineup anchor
├─ doorway mouth aligned to the rebuilt board
├─ deeper behind-cover tuck
└─ corridor-owned local settle anchor
```

### Runtime Closure

```text
s3 landed shape
├─ each doorway side now owns an explicit corridor profile
├─ approach movement rides a back-wall lane before doorway commitment
├─ lineup uses corridor geometry instead of a generic horizontal offset
├─ cover anchors sit farther behind scenery before warp
├─ arrival settle comes from a corridor-owned local recovery point
└─ lineup / doorway timeouts are now distance-aware instead of fixed
```

The live corridor profiles now read:

```text
left corridor
├─ lane y      -> 112
├─ lineup      -> 312,112
├─ doorway     -> 268,132
├─ cover tuck  -> 230,104
├─ warp anchor -> 194,100
└─ settle      -> 282,154

right corridor
├─ lane y      -> 110
├─ lineup      -> 498,110
├─ doorway     -> 546,124
├─ cover tuck  -> 585,102
├─ warp anchor -> 622,98
└─ settle      -> 532,150
```

### Proof Snapshot

Primary artifacts:

- `qa_screenshots/r2_zone_transition_audit/2026-04-22T10-16-10-981Z/report.json`
- `qa_screenshots/a6_live_dispersal_audit/2026-04-22T10-16-11-002Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T10-16-10-981Z/report.json`

```text
s3 proof
├─ r2 zone transition       -> pass
├─ a6 live dispersal        -> pass
├─ a4 shared spatial truth  -> pass
└─ page / console errors    -> none
```

The important behavior change is:

```text
route cadence
├─ regular-speed approach along the lane
├─ regular-speed lineup into corridor commitment
├─ doorway-align step only once committed
└─ behind-cover tuck before warp
```

### Honest Boundary

```text
s3 closes
├─ doorway corridor alignment
├─ cover-depth alignment
└─ route-shape inheritance from board geometry

s3 does not close
├─ entity footprint unification
├─ block/support spacing unification
└─ shared interaction-space reconciliation
```

So the route now inherits explicit corridor geometry, but the next active
spatial pressure is still `s4`: every entity family needs to advertise the
same footprint/clearance truth instead of continuing to rely on mixed radii.

## Entity Footprint Unification Audit

_Source: `docs/ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md`_

### Purpose

This is the stable `s4` closure note for the spatial-unification track.

It closes the footprint seam left open after the shared board and corridor
geometry were already live:

```text
old footprint truth
├─ structure queries used some derived metrics
├─ physics used some derived metrics
├─ gameCore fallbacks still used local size/render heuristics
└─ flower/block conflict rules could disagree with placement spacing

new footprint truth
├─ one declared family registry in `core/config.js`
├─ structure owns entity metrics from that registry
├─ physics consumes those metrics directly
├─ gameCore fallbacks defer to the same metrics
└─ flower/block relocation and placement spacing now honor the same radius truth
```

### Runtime Closure

```text
s4 landed shape
├─ butterflies, flowers, eggs, chrysalis, caterpillars, and blocks now advertise one family footprint
├─ carry anchors no longer derive side/trail spacing from sprite dimensions
├─ block placement spacing now uses declared block width instead of raw render width
├─ butterfly separation fallback now uses declared separation distance
├─ block-obstacle fallbacks now use declared block radius / butterfly clearance
└─ flower relocation now respects the same block-placement avoid radius as the placement check
```

The live family contract now resolves through:

```text
owner split
├─ `core/config.js`
│  └─ declares `entities.spatialFootprints`
├─ `systems/structureSystem.js`
│  └─ resolves family -> width / radius / clearance / occupancy metrics
├─ `systems/physicsSystem.js`
│  └─ consumes those metrics for motion/support/contact truth
└─ `core/gameCore.js`
   └─ uses the same metrics in the remaining placement / fallback paths
```

### Proof Snapshot

Primary artifacts:

- `qa_screenshots/m5_structure_audit/2026-04-22T19-27-00-755Z/report.json`
- `qa_screenshots/b4_carry_stack_physics_audit/2026-04-22T19-34-13-184Z/report.json`
- `qa_screenshots/r1_movement_stability_audit/2026-04-22T19-27-00-760Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T19-27-00-743Z/report.json`
- `qa_screenshots/r7_block_visual_audit/2026-04-22T19-34-12-911Z/report.json`

```text
s4 proof
├─ m5 structure owner / geometry      -> pass
├─ b4 carry / stack physics           -> pass
├─ r1 movement stability              -> pass
├─ r2 zone transition                 -> pass
├─ r7 block visual / spatial shell    -> pass
└─ page / console errors              -> none
```

One honest note:

```text
a4 spatial truth
└─ still carries the known runtime-budget seam from the runtime track
   so it was not used as the closure gate for s4
```

### Honest Boundary

```text
s4 closes
├─ declared entity footprint families
├─ shared clearance / radius ownership
├─ carry-anchor footprint alignment
└─ flower/block conflict alignment

s4 does not close
├─ block scatter / support-column unit cleanup
├─ opening/body-fit spacing cleanup beyond the footprint contract
└─ wider interaction-space reconciliation across all entity families
```

So the next active spatial pressure is `s5`: block placement, support columns,
openings, and support spacing still need to honor the same board unit all the
way through instead of only sharing the footprint contract.

## Block Placement + Support Unification Audit

_Source: `docs/BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md`_

### Purpose

This is the stable closure note for `s5 block placement + support unification`.

```text
before
block support / openings / scatter / fallback placement
  ├─ used the same broad footprint family
  └─ still kept a few local "close enough" block-size heuristics

after
one canonical block unit
  ├─ opening width + opening-role threshold
  ├─ occupancy-column radius
  ├─ scatter spacing + doorway avoidance
  ├─ connected-placement offsets
  ├─ ground safe-drop radii
  └─ visual stack lift
```

### What Landed

Primary runtime owners:
- `systems/structureSystem.js`
- `core/gameCore.js`
- `entities/block.js`

Concrete changes:

```text
structure owner
├─ declared `getCanonicalBlockUnit()`
├─ moved opening / inset / entry / column math onto that unit
├─ moved support alignment + adjacency clearance onto that unit
└─ moved safe-drop search radii onto that unit

world owner
├─ moved ambient block scatter padding / doorway avoidance onto that unit
├─ moved connected-placement offsets onto that unit
├─ moved ground fallback distances onto that unit
└─ moved block-nudge distances onto that unit

entity owner
└─ moved block visual lift onto the canonical unit step
```

### Spatial Truth Closed In `s5`

```text
`s4` solved
└─ which family footprint each entity uses

`s5` solves
└─ whether block geometry still quietly falls back to approximate render-size math
```

The important closure is:

```text
1 block
├─ still = 1 board unit
├─ still = 1 support / stack unit
└─ now also = the unit used by
   ├─ openings
   ├─ support columns
   ├─ scatter spacing
   ├─ safe-drop fallback
   └─ stack lift
```

### Proof

Required `s5` proof lanes:
- `m5 structure audit` -> `pass`
- `b4 carry/stack physics audit` -> `pass`
- `r7 block visual audit` -> `pass`
- `r2 zone transition audit` -> `pass`

Context / spillover checks:
- `r1 movement stability audit` -> `pass`
- `a4 spatial truth audit` -> `pass`

Artifacts:
- `qa_screenshots/m5_structure_audit/2026-04-22T19-55-17-590Z/report.json`
- `qa_screenshots/b4_carry_stack_physics_audit/2026-04-22T19-55-17-601Z/report.json`
- `qa_screenshots/r7_block_visual_audit/2026-04-22T19-55-17-604Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T19-55-17-616Z/report.json`
- `qa_screenshots/r1_movement_stability_audit/2026-04-22T19-55-56-729Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T19-55-56-756Z/report.json`

### Honest Boundary

```text
closed now
└─ blocks no longer measure support/opening/placement from scattered local size rules

not closed yet
└─ every non-block entity interaction on the expanded board
```

That remaining work is `s6`, not more `s5` tuning.

### Next Move

```text
next
└─ s6 shared interaction-space reconciliation
   ├─ flowers / eggs / cocoons / caterpillars
   ├─ shelter interactions on the widened board
   └─ cross-entity assumptions that still predate the unified board
```

## Shared Interaction-Space Reconciliation Audit

_Source: `docs/SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md`_

### Purpose

This is the stable closure note for `s6 shared interaction-space reconciliation`.

```text
before
expanded board + unit contract
  ├─ fixed the board, corridor, footprint, and block-support owners
  └─ still left a few flower / pollen / lifecycle / spawn paths on older padding rules

after
one widened interaction space
  ├─ butterfly spawn + wander sampling
  ├─ flower spawn + relocation + pollen planting
  ├─ block/flower conflict relocation
  ├─ caterpillar travel clamp + target filtering
  └─ egg / chrysalis occupancy riding the same flower-space contract
```

### What Landed

Primary runtime owners:
- `core/gameCore.js`
- `entities/caterpillar.js`

Concrete changes:

```text
interaction-space helpers
├─ declared butterfly interaction-space metrics from the shared footprint contract
├─ declared flower interaction-space metrics from flower + block-unit truth
└─ declared caterpillar interaction-space metrics for lifecycle travel

world owner
├─ moved butterfly spawn sampling onto the widened interaction-space contract
├─ moved butterfly wander sampling/jitter onto the same contract
├─ moved flower spawn / relocation / pollen planting onto the same contract
└─ moved flower-block conflict relocation defaults onto the same contract

lifecycle owner
├─ kept eggs / chrysalis attached to flower-owned occupancy truth
└─ moved caterpillar movement + target filtering onto the widened board contract
```

### Spatial Truth Closed In `s6`

```text
`s5` solved
└─ whether block placement/support still used scattered local size rules

`s6` solves
└─ whether flowers, pollen, larva travel, and butterfly roam/spawn still quietly assumed
   the older narrower board
```

The important closure is:

```text
same board
├─ butterflies sample from it
├─ flowers sample from it
├─ pollen planting clamps to it
├─ caterpillars move inside it
└─ egg / chrysalis flowers persist inside it
```

### Proof

Required `s6` proof lanes:
- `w3 flower ecology audit` -> `pass`
- `a2 carry/flower audit` -> `pass`
- `r1 movement stability audit` -> `pass`
- `r2 zone transition audit` -> `pass`
- `a4 spatial truth audit` -> `pass`

Artifacts:
- `qa_screenshots/w3_flower_ecology_audit/2026-04-22T20-10-54-479Z/report.json`
- `qa_screenshots/a2_carry_flower_audit/2026-04-22T20-10-54-476Z/report.json`
- `qa_screenshots/r1_movement_stability_audit/2026-04-22T20-10-54-483Z/report.json`
- `qa_screenshots/r2_zone_transition_audit/2026-04-22T20-10-54-482Z/report.json`
- `qa_screenshots/a4_spatial_truth_audit/2026-04-22T20-10-54-423Z/report.json`

### Honest Boundary

```text
closed now
└─ the widened board is no longer just a block/corridor truth; flowers and larval movement
   read it too

not closed yet
└─ lived-in save migration into the fully unified board/unit model
```

That remaining work is `s7`, not more `s6` tuning.

### Next Move

```text
next
└─ s7 save migration
   ├─ normalize old board-derived spatial state into the widened interaction space
   ├─ preserve long-running butterfly identity / memories / lineage
   └─ prove migrated lived-in saves stay stable after autosave
```

## Spatial Save Migration Audit

_Source: `docs/SPATIAL-SAVE-MIGRATION-AUDIT.md`_

### Purpose

This closes `s7` on the spatial unification board:

```text
saved world
   │
   ├─ preserves
   │  ├─ butterfly identity / lineage / social truth
   │  └─ sacred long-running save continuity
   │
   └─ refreshes
      ├─ widened board geometry
      ├─ canonical interaction-space placement
      ├─ block scatter / placement-derived layout
      └─ cheap route / placement rebuild data
```

The goal is not exact no-op positional replay.
The goal is safe migration into the unified board without wiping lived-in state.

### What Landed

```text
s7 migration seam
├─ refresh revision owner         -> `systems/saveSystem.js`
├─ current layout revision        -> `garden-placement-v3`
├─ restore placement profiles     -> butterfly / flower / caterpillar / block
├─ restore clamp source           -> live interaction-space + canonical block unit
├─ block rebuild normalization    -> widened-board padding + spread
└─ recovery note                  -> explicit re-seat note without fresh-world reset
```

### Proof Shape

```text
proof stack
├─ runtime self audit
│  ├─ 17 / 17 steps passing
│  ├─ stale-save refresh lane green
│  └─ overall warn only from runtime budget pressure
├─ spatial truth audit
│  └─ save/load rebuilds spatial truth on the widened board
├─ social save continuity audit
│  └─ sacred hybrid identity / journal / memory edges preserved
└─ lived-in save reload
   └─ remains stable after refresh-driven autosave
```

### Evidence

- Runtime self audit:
  [report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/runtime_self_audit/report.json)
- Spatial truth audit:
  [2026-04-22T20-24-14-364Z/report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/a4_spatial_truth_audit/2026-04-22T20-24-14-364Z/report.json)
- Social save continuity audit:
  [2026-04-22T20-24-14-364Z/report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/n8_social_save_continuity_audit/2026-04-22T20-24-14-364Z/report.json)
- Long-running save smoothness context:
  [2026-04-22T20-18-16-667Z/report.json](/C:/Users/fishe/Documents/projects/ephemera/qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-22T20-18-16-667Z/report.json)

### Closure

`s7` is honest to freeze because:

```text
green now
├─ stale refresh revisions rewrite to current build revisions
├─ widened-board placement re-seat happens through live spatial profiles
├─ block collapse recovery restores spread instead of preserving bad overlap
├─ restore path does not force a fresh world
└─ protected social / lineage truth survives migration
```

### Remaining Pressure

`s7` is closed, but `s8` remains open:

```text
still to prove in s8
├─ longer real-save play on the unified board
├─ travel / placement / structure lanes together under soak
└─ runtime-heavy h5 lane separated from migration truth
```

That means the migration contract is now stable, while the next honest spatial
pressure is proof freeze on the lived-in board under normal play.

### Shared Schema Note

```text
shared save-schema gate
|- s7 migration truth -> frozen
|- joint signoff      -> now recorded at `schemaVersion = 4`
`- carry forward      -> later runtime proof should treat schema as frozen unless a new joint migration is opened explicitly
```

## Spatial Unification Roadmap

_Source: `docs/SPATIAL-UNIFICATION-ROADMAP.md`_

### Intent

The current runtime is close enough to expose the right problems:

```text
we no longer have
└─ completely broken spatial ownership

we do still have
├─ mismatched board bounds
├─ mismatched doorway geometry
├─ mismatched block/unit semantics
└─ mismatched entity footprints
```

### Status Update

- `s7` is now closed through [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md).
- `s8` is now frozen live after the lived-in-save proof stack turned green.

This roadmap turns that into a concrete implementation sequence.

### Current Status

```text
spatial track
├─ s0 owner + seam audit     -> live
├─ s1 unit contract          -> live
├─ s2 board expansion        -> live
├─ s3 corridor alignment     -> live
├─ s4 footprint unification  -> live
├─ s5 placement/support      -> live
├─ s6 shared interaction     -> live
├─ s7 save migration         -> live
└─ s8                        -> live
```

### Current Seams

```text
╔════════════════════════════ Current Spatial Seams ═══════════════════════════╗
║ seam                                │ live evidence                          ║
╠═════════════════════════════════════╪═════════════════════════════════════════╣
║ board boundary owner                │ `PAPILIONEM_LAND_MAP.roamPolygon` +    ║
║                                     │ `PAPILIONEM_SECTION_PLACEMENT_REGION`  ║
║ doorway route geometry              │ `doorways.left/right.{path,cover,spawn}`║
║ movement / placement clamp owner    │ `gameCore.clampPlacementPointInZone()` ║
║ block render size                   │ `entities.block.renderWidth/height`    ║
║ iso/debug conversion size           │ `grid.cellSize`, debug tile math       ║
║ block support / stack semantics     │ `structureSystem` occupancy columns    ║
║ dynamic spatial diagnostics         │ `physicsSystem` occupancy/verticality  ║
║ zone travel behavior                │ `gameCore` staged travel phases        ║
╚═════════════════════════════════════╧═════════════════════════════════════════╝
```

#### Current inconsistencies to resolve

```text
1. board shape
   roam polygon, placement region, and doorway mouths are related
   but not derived from one canonical board contract

2. unit shape
   block render size, stack spacing, and iso/debug grid are close
   but not explicitly locked to one "1 block = 1 unit" model

3. entity shape
   butterflies, flowers, eggs, cocoons, caterpillars, and blocks
   do not all advertise one shared footprint/clearance model

4. route shape
   portal travel is compensating around geometry mismatches
   instead of inheriting from a corridor topology
```

### Target Model

```text
╔════════════════════════════ Target Spatial Stack ════════════════════════════╗
║ board contract                     │ one garden board polygon + subregions   ║
║ unit contract                      │ one block = one canonical board unit    ║
║ footprint contract                 │ every entity type declares width/clear. ║
║ occupancy contract                 │ columns/bands/support derive from unit  ║
║ route contract                     │ doorway mouths + cover corridors on board║
║ save contract                      │ old saves normalize into new geometry   ║
╚════════════════════════════════════╧══════════════════════════════════════════╝
```

### Phase Details

#### `s0 spatial truth audit + baseline`

Goal:
- inventory every live spatial owner
- record every current bound/unit mismatch
- define the exact before-state before geometry changes

Delivered:
- owner map for `bounds`, `units`, `footprints`, `occupancy`, `routes`
- seam ledger for every conflicting size/spacing assumption
- audit checklist for later proof scripts
- file-ownership conflicts resolved and tied back to [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md)

Closure:
- one written map of current spatial truth now exists in [CURRENT-SPATIAL-TRUTH.md](./CURRENT-SPATIAL-TRUTH.md)

#### `s1 canonical spatial unit contract`

Goal:
- define the canonical board unit
- define canonical block dimensions in that unit
- define how iso/debug conversion maps onto it

Stable doc:
- [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md)

Locked rule:

```text
1 block
   = 1 board unit
   = 1 support / stack unit
   = base footprint reference for occupancy columns
```

After `s1`:
- the `18x18` iso grid is debug-only
- render width/height stay presentation-only
- later phases must retire render-size-derived spatial heuristics

#### `s2 board boundary expansion contract`

Goal:
- expand movable area to intended wall-start borders
- intentionally include the lower play area where appropriate
- keep one shared board for movement + placement + ecology

Concrete work:
- redraw the canonical board polygon
- derive placement region from it instead of hand-tuning separately
- derive doorway/corridor subregions from the same geometry
- review zone-sector layouts that currently assume the smaller board
- run a mandatory entity-footprint sweep so no entity family silently assumes the old boundary

Risk:
- blind bounds expansion will amplify awkward block/flower placement if done before `s1`

Stable doc:
- [SPATIAL-BOUNDARY-EXPANSION-AUDIT.md](./SPATIAL-BOUNDARY-EXPANSION-AUDIT.md)

#### `s3 doorway corridor alignment`

Goal:
- make doorways start where the wall openings visually start
- make cover paths disappear fully behind scenery
- make route staging follow corridor topology instead of compensating heuristics

Concrete work:
- rebuild `path`, `cover`, and `spawn` anchors from the new board
- define explicit corridor lanes
- keep regular speed until corridor commitment
- verify cover depth hides the body correctly

Stable doc:
- [DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md](./DOORWAY-CORRIDOR-ALIGNMENT-AUDIT.md)

#### `s4 entity footprint unification`

Goal:
- give every entity family one declared footprint
- stop using scattered ad hoc radii

Stable doc:
- [ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md](./ENTITY-FOOTPRINT-UNIFICATION-AUDIT.md)

Entity families:
- butterflies
- flowers
- blocks
- eggs
- cocoons / chrysalis
- caterpillars

#### `s5 block placement + support unification`

Goal:
- make block scatter honor the board unit
- make stack/support use the same unit
- make openings/flowers/block adjacency behave predictably

Concrete work:
- replace remaining placement heuristics that assume approximate block size
- align occupancy-column spacing to the canonical unit
- ensure opening width and body fit are measured in the same unit
- keep flower relocation logic consistent with the same occupancy truth

Stable doc:
- [BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md](./BLOCK-PLACEMENT-SUPPORT-UNIFICATION-AUDIT.md)

#### `s6 shared interaction-space reconciliation`

Goal:
- make all entity families live on the same board assumptions
- remove "this object still thinks the old board exists" bugs

Examples:
- cocoon/egg placement relative to structures
- flower spawn distribution in expanded lower area
- butterfly shelter interactions
- carried-block anchors versus support columns

Stable doc:
- [SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md](./SHARED-INTERACTION-SPACE-RECONCILIATION-AUDIT.md)

#### `s7 save migration (joint with runtime v7 / social n8, via SAVE-SCHEMA-REGISTRY)`

Goal:
- preserve long-running social/genetic state
- normalize old geometry/unit data into the new board

May rebuild:
- ambient block scatter
- cached placement columns
- derived route anchors
- other cheap geometry-derived data

Stable doc:
- [SPATIAL-SAVE-MIGRATION-AUDIT.md](./SPATIAL-SAVE-MIGRATION-AUDIT.md)

#### `s8 audits + soak + proof freeze`

Goal:
- prove travel reads correctly
- prove block placement/support reads correctly
- prove expanded board remains stable
- freeze docs once the new contract is honest

Proof lanes to require:
- zone transition / dispersal
- spatial truth
- carry / stack / block visual
- runtime self audit
- long-running save reload
- extended live play on the real save

Closure read:
- `r2`, `b4`, `r7`, `a4`, and `h5` are green on the lived-in save
- the remaining `runtime self` warning is non-spatial and does not contradict the frozen board/unit contract
- spatial truth is now frozen unless a later migrated-save proof surfaces a real contradiction

### Exact Order

```text
s0 audit current owners and mismatches
▼
s1 lock one-unit contract
▼
s2 expand board bounds from that contract
▼
s3 rebuild doorway/corridor geometry
▼
s4 unify entity footprints
▼
s5 unify block placement/support
▼
s6 reconcile all entity interactions to the new board
▼
s7 migrate existing saves into the new geometry
▼
s8 audit, soak, freeze
```

### Current Next Move

```text
next
└─ spatial track is now frozen live through `s8`
   ├─ because lived-in saves now reload into the widened-board contract without a fresh-world wipe
   ├─ and the latest lived-in rerun turned `a4` plus `h5` green instead of surfacing a new spatial contradiction
   └─ carry forward only if a later migrated-save proof surfaces a real board/unit/occupancy inconsistency
```

## Active Social-Cognition Board

_Source: `docs/ACTIVE-SOCIAL-COGNITION-BOARD.md`_

### Purpose

This board sequences the work needed to make Papilionem feel like a living
butterfly society instead of a mostly functional warning/response loop.

It exists because the runtime already had dialogue residue, pair-mode, and
relationship machinery, but the lived play experience still read too often as:

```text
warning / correction
   └─▶ obedient acknowledgement
        └─▶ little apparent feeling, chemistry, or society texture
```

The target feeling is:

```text
butterfly society
├─ companions who check in, linger, admire, tease, and comfort
├─ rivals who needle, avoid, resent, or compete
├─ pairs whose chemistry feels distinct
├─ groups whose local tone changes behavior
└─ talk that matters later because feelings and memory feed action
```

This board is not "make prettier dialogue lines."
It is a life-sim / cognition / communication track.

Use this with:

- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
- [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
- [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md)
- [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md)
- [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md)
- [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
- [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
- [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md)
- [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)
- [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
- [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)
- [ACTIVE-PLAN-REGISTRY.md](./ACTIVE-PLAN-REGISTRY.md)

### Problem Shape

```text
╔════════════════════════════ Social / Feeling Gap ════════════════════════════╗
║ player-facing symptom          │ likely underlying seam                     ║
╠════════════════════════════════╪═════════════════════════════════════════════╣
║ repetitive talk                │ motive family is too narrow / skewed       ║
║ "be careful" dominates         │ danger/warning talk outcompetes everything ║
║ flat responses                 │ listener response weighting is too generic ║
║ no real chemistry              │ pair dynamics are too shallow / invisible  ║
║ no visible society             │ group/reputation/local tone are underused  ║
║ feelings do not read later     │ talk-to-behavior follow-through is weak    ║
║ neural layer not helping       │ social scoring is not yet meaningfully fed ║
╚════════════════════════════════╧═════════════════════════════════════════════╝
```

### Non-Negotiables

```text
always preserve
├─ communicationSystem owns emitted speech/events, not the UI
├─ lifeSim/social truth stays authoritative over feelings and bonds
├─ ML may score social choices later, but may not own feelings/memory truth
├─ feed/inspect remain presentation layers, not bond/state owners
├─ emergence beats hand-authored cutscenes
├─ more depth must produce later behavior, not just prettier wording
└─ long-running saves must preserve identity, memory, and relationship continuity
```

### Ownership Map

```text
communicationSystem  -> utterance motives, exchange flow, heard events
lifeSimSystem        -> drives, emotions, social summaries, follow-through biases
memory/social state  -> durable residue, edge deltas, repetition/novelty pressure
mlInferenceSystem    -> later social action weighting only
gameUI/debugUI       -> visibility, not truth ownership
saveSystem           -> persistence and migration of durable social state
```

### Stable Evidence

```text
pre-n2 evidence
├─ manual playtest audit
│  ├─ warning            -> 123
│  ├─ acknowledgement    -> 79
│  ├─ comfort            -> 61
│  ├─ teaching           -> 58
│  ├─ companionship      -> 12
│  ├─ shared-observation -> 9
│  ├─ admiration         -> 1
│  └─ repair / rivalry / play / flirtation -> 0
└─ n0.5 measurement snapshot
   ├─ dialogue records         -> 345
   ├─ resolved pairs (>=3)     -> 11
   ├─ unresolved single-target -> 75
   ├─ average JS divergence    -> 0.5392
   ├─ median JS divergence     -> 0.4591
   └─ visible follow-through   -> 0.501
```

```text
n2 proof snapshot
├─ low-risk warning suppression         -> green
├─ invitation/social targeting          -> green
├─ multi-target warning auto-reply stop -> green
├─ casual reply variation by motive     -> green
├─ f5/f6 social depth regression        -> green
└─ r6 communication regression          -> green
```

```text
n3 proof snapshot
|- distinct pair textures resolve from live relationship state -> green
|- texture affects casual phrase feel, not only labels         -> green
|- feed / inspect surface pair texture                         -> green
|- life-sim follow-through reads the same texture truth        -> green
|- f5/f6 social depth regression                               -> green
|- r6 communication regression                                 -> green
`- r4 UI readability regression                                -> green
```

```text
n4 proof snapshot
|- witnessed praise changes observer admiration         -> green
|- clique comfort resolves as the active local rhythm   -> green
|- clique exclusion resolves as the active local rhythm -> green
|- protective ring resolves as the active local rhythm  -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

```text
n5 proof snapshot
|- partner-return keeps close to familiar partner       -> green
|- strained-avoidance keeps distance                    -> green
|- admiring-shadow stays near admired butterfly         -> green
|- protective-follow-through stays near vulnerable ally -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

Stable artifacts:

- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
- [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
- [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md)
- [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md)
- [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md)
- [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
- [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
- [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)

```text
n8 proof snapshot
|- protected social serialize             -> green
|- protected social roundtrip             -> green
|- overload recovery keeps sacred hybrid  -> green
|- r6 communication regression            -> green
`- runtime self baseline                  -> unchanged non-blocking warn
```

### Status Key

```text
live
|- phase landed and current docs/proof agree

active
|- current planning / implementation phase

queued
|- next in exact order

gated
`- cannot close honestly until prerequisite proof exists
```

### Phase Ladder

| Phase | Status | Goal | Primary owners | Honest gate |
| --- | --- | --- | --- | --- |
| `n0 social-truth audit + playtest gap map` | `live` | map what is currently live, what is under-expressed, and which repeated lines/motives dominate actual play | `docs/`, `systems/communicationSystem.js`, `systems/lifeSimSystem.js`, `qa_logs/`, `scripts/` | closed through `SOCIAL-TRUTH-AUDIT.md` plus the manual-capture audit artifacts in `qa_logs/social_truth_audit/2026-04-22T00-56-17-757Z/` |
| `n0.5 social measurement harness` | `live` | lock the measurable proof layer for social depth before family tuning gets deeper | `docs/`, `qa_logs/`, `scripts/`, `systems/communicationSystem.js`, `systems/lifeSimSystem.js` | closed through `SOCIAL-MEASUREMENT-HARNESS.md` plus `qa_logs/social_measurement_harness/2026-04-22T01-16-37-039Z/` |
| `n1 ownership + family lock` | `live` | lock the canonical feeling, memory, relationship, motive, and society families so later fixes do not overlap or drift, and co-own `SIM-CADENCE-CONTRACT.md` with runtime `v4` | `docs/`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js` | closed through `SOCIAL-FAMILY-LOCK.md` plus the sequencing signoff now recorded in `SIM-CADENCE-CONTRACT.md` |
| `n2 social motive rebalance` | `live` | stop warning/correction talk from crowding out companionship, banter, admiration, affection, irritation, repair, and curiosity | `systems/communicationSystem.js`, `entities/butterfly.js`, `scripts/` | closed through `SOCIAL-MOTIVE-REBALANCE-AUDIT.md` plus the green `n2`, `f5/f6`, and `r6` audit artifacts in `qa_screenshots/` |
| `n3 pair chemistry + relationship texture` | `live` | deepen pair-specific chemistry, moods, and recurring interaction texture so different relationships feel distinct | `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `ui/gameUI.js` | closed through `PAIR-CHEMISTRY-TEXTURE-AUDIT.md` plus the green `n3`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n4 butterfly society / group tone` | `live` | add local social context like reputations, cliques, teaching pockets, protectiveness, rivalry pressure, and witnessed interactions | `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/zoneSystem.js` | closed through `BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md` plus the green `n4`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n5 dialogue-to-behavior follow-through` | `live` | make talk visibly matter later through lingering, seeking, avoidance, imitation, repair, defense, and coordinated behavior | `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `systems/behaviorSystem.js` | closed through `DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md` plus the green `n5`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n6 neural/social scoring integration` | `live` | make the model-backed layer score richer social choices using current feelings, memories, chemistry, and society context | `systems/mlInferenceSystem.js`, `systems/lifeSimSystem.js`, `systems/communicationSystem.js`, `docs/COGNITION-ML-CONTRACT.md` | closed through `NEURAL-SOCIAL-SCORING-AUDIT.md` plus the green `n6`, `f5/f6`, `r6`, `m3`, `m4`, and `deep-systems` artifacts in `qa_screenshots/` |
| `n7 surfacing + proof` | `live` | update the current runtime feed/inspect/debug surfaces with DOM-ready presentation snapshots so social depth is readable without turning presentation into the owner | `ui/gameUI.js`, `ui/debugUI.js`, `scripts/`, `docs/` | closed through `SOCIAL-SURFACING-PROOF-AUDIT.md` plus the green `n7`, `f5/f6`, `r6`, and `r4` artifacts in `qa_screenshots/` |
| `n8 save migration + freeze` | `live` | preserve long-running relationships and migrate any widened durable social state cleanly | `systems/saveSystem.js`, `scripts/`, `docs/` | closed through `SOCIAL-SAVE-CONTINUITY-AUDIT.md` plus the green `n8` continuity artifact and non-regressing `r6` / runtime-self proof lanes |

### Exact Order

```text
n0
 │
 ▼
n0.5
 │
 ▼
n1
 │
 ▼
n2
 │
 ▼
n3
 │
 ▼
n4
 │
 ▼
n5
 │
 ▼
n6
 │
 ▼
n7
 │
 ▼
n8
```

### What "Feels Real" Means Here

```text
not enough
├─ more line templates
└─ more feed color or layout polish

actually needed
├─ richer motives
├─ richer listener interpretation
├─ richer pair chemistry
├─ richer group context
├─ later behavioral consequences
└─ model scoring that notices social texture
```

### Current Focus

```text
n8 closure update
|- n7 surfacing + proof       -> live
|- n8 save migration + freeze -> live
|- current proof -> `SOCIAL-SAVE-CONTINUITY-AUDIT.md`
`- next pressure -> no further local social phase is open; the remaining shared dependency is the later `v7 / s7 / n8` save-schema gate
```

### Current Truth

```text
post-n3 update
|- recurring one-to-one relationships now resolve into distinct pair textures
|- feed / inspect surface pair texture instead of only coarse pair mode
|- life-sim follow-through now reads the same pair-texture truth
`- the biggest remaining social gap is visible group tone / society context
```

```text
post-n4 update
|- witnessed exchanges now create small bystander carry-over on existing social edges
|- life-sim derives clique comfort, clique exclusion, protective ring, and reputation wave from local truth
|- Inspect now surfaces Society separately from Rhythm so group tone is readable
`- the biggest remaining social gap is stronger later behavior follow-through from that society context
```

```text
post-n5 update
|- familiar partners are visibly re-sought
|- strained partners push visible avoidance targets
|- admired butterflies attract shadowing behavior
|- vulnerable partners attract protective staying-near behavior
`- the biggest remaining social gap is making the richer depth easier to read in runtime v1 DOM panels and proof under n7
```

```text
current live status
|- low-risk warning emissions are suppressed more aggressively
|- invitation/social openings now land on nearby butterflies more reliably
|- multi-target warnings no longer harvest generic auto replies
|- pair chemistry and group tone are both visibly legible now
|- later social carry-over is visible in movement, not only wording
|- inspect/feed/debug now surface that richer depth through one presentation snapshot path
|- widened social durability now survives roundtrip restore and overload recovery
`- the social-cognition ladder is now locally frozen clean through n8
```

That means the social track is no longer blocked on readability or continuity.
Its only remaining dependency is the later shared save-schema signoff with the
runtime and spatial tracks.

## Social-Cognition Roadmap

_Source: `docs/SOCIAL-COGNITION-ROADMAP.md`_

### Intent

The goal is to make Papilionem feel like a living butterfly society with
complex emotional and relationship dynamics.

The problem is not only wording.

```text
flat feel
├─ too many exchanges are functional warnings
├─ too many replies are generic acknowledgements
├─ pair chemistry does not read strongly enough
├─ group culture does not read strongly enough
└─ later behavior does not prove the talk mattered enough
```

### Current Status

```text
status update
|- n4 butterfly society       -> live
|- n5 behavior follow-through -> live
|- n6 neural/social scoring   -> live
|- n7 surfacing + proof       -> live
`- n8 save migration + freeze -> live
```

```text
social track
|- n0 evidence audit          -> live
|- n0.5 measurement harness   -> live
|- n1 family/owner lock       -> live
|- n2 motive rebalance        -> live
|- n3 pair chemistry          -> live
|- n4 butterfly society       -> live
|- n5 behavior follow-through -> live
|- n6 neural/social scoring   -> live
|- n7 surfacing + proof       -> live
`- n8 save migration + freeze -> live
```

### Current Evidence

Primary sources:

- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
- [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)
- [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md)
- [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md)
- [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md)
- [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)
- [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)
- [NEURAL-SOCIAL-SCORING-AUDIT.md](./NEURAL-SOCIAL-SCORING-AUDIT.md)
- [SOCIAL-SURFACING-PROOF-AUDIT.md](./SOCIAL-SURFACING-PROOF-AUDIT.md)
- [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)

```text
n4 proof
|- witnessed praise changes observer admiration         -> green
|- clique comfort resolves as the active local rhythm   -> green
|- clique exclusion resolves as the active local rhythm -> green
|- protective ring resolves as the active local rhythm  -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

```text
n5 proof
|- partner-return keeps close to familiar partner       -> green
|- strained-avoidance keeps distance                    -> green
|- admiring-shadow stays near admired butterfly         -> green
|- protective-follow-through stays near vulnerable ally -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

```text
pre-n2 social mix
├─ warning            -> 123
├─ acknowledgement    -> 79
├─ comfort            -> 61
├─ teaching           -> 58
├─ companionship      -> 12
├─ shared-observation -> 9
├─ admiration         -> 1
└─ repair / rivalry / play / flirtation -> 0
```

```text
n2 proof
├─ low-risk warning suppression         -> pass
├─ invitation/social targeting          -> pass
├─ warning auto-reply suppression       -> pass
├─ casual response variation by motive  -> pass
├─ social-depth regression              -> pass
└─ communication regression             -> pass
```

```text
n3 proof
|- pair textures resolve distinctly         -> pass
|- casual phrase feel varies by texture     -> pass
|- feed / inspect surface pair texture      -> pass
|- life-sim follow-through consumes texture -> pass
|- social-depth regression                  -> pass
|- communication regression                 -> pass
`- UI readability regression                -> pass
```

```text
n7 proof
|- inspect social lens snapshot    -> pass
|- feed threaded context footer    -> pass
|- debug social bridge snapshot    -> pass
|- social-depth regression         -> pass
|- communication regression        -> pass
`- UI readability regression       -> pass
```

This means the social track is now past "family lock only" work.
The rebalance layer is live, and the next need is deeper pair differentiation.

### Locked Family + Owner Truth

The stable `n1` lock lives in [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md).

It fixes:

```text
what is locked
├─ emotion channels
├─ pair chemistry summaries
├─ society summaries
├─ conversation motive families
└─ the owner split between life-sim, communication, ML, and UI
```

It also signs the sequencing handshake with [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md).

### Phase Details

#### `n0 social-truth audit + playtest gap map`

Goal:
- capture what social families are actually appearing in play
- capture which lines/motives dominate
- capture where later behavior does or does not follow through

Stable doc:
- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)

#### `n0.5 social measurement harness`

Goal:
- lock the measurable proof layer for later social-depth work

Stable doc:
- [SOCIAL-MEASUREMENT-HARNESS.md](./SOCIAL-MEASUREMENT-HARNESS.md)

#### `n1 ownership + family lock`

Goal:
- freeze one shared family map for emotions, pair chemistry, society context, and motives

Stable doc:
- [SOCIAL-FAMILY-LOCK.md](./SOCIAL-FAMILY-LOCK.md)

#### `n2 social motive rebalance`

Goal:
- broaden what gets said in ordinary play

What landed:
- low-risk warning/caution loops are suppressed more aggressively
- low-stakes social maintenance motives now land on nearby butterflies more reliably
- multi-target warnings stop farming generic reply loops
- casual replies now reflect companionship, admiration, shared-attention, and repair context more clearly

Stable doc:
- [SOCIAL-MOTIVE-REBALANCE-AUDIT.md](./SOCIAL-MOTIVE-REBALANCE-AUDIT.md)

#### `n3 pair chemistry + relationship texture`

Goal:
- make different relationships feel materially different

Concrete work:
- derive stronger pair chemistry from durable edges + recent interaction history
- make chemistry bias tone, motive choice, and response form
- make recurring pairs recognizable by feel

Current status:
- live

Stable doc:
- [PAIR-CHEMISTRY-TEXTURE-AUDIT.md](./PAIR-CHEMISTRY-TEXTURE-AUDIT.md)

#### `n4 butterfly society / group tone`

Goal:
- make butterflies feel like a society, not isolated pair simulators

Current status:
- live

Concrete work:
- witnessed praise / embarrassment
- local teaching pockets
- clique comfort / clique exclusion
- protectiveness around vulnerable butterflies
- reputation carry-over into new interactions

Stable doc:
- [BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md](./BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md)

#### `n5 dialogue-to-behavior follow-through`

Goal:
- make talk visibly matter later

Visible proof should include:
- seeking the same partner again
- staying physically closer
- avoiding a strained partner
- imitating an admired butterfly
- defending a bonded partner
- keeping tension alive after a bad exchange

Current status:
- live

Stable doc:
- [DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md](./DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md)

#### `n6 neural/social scoring integration`

Goal:
- let the model-backed layer score richer social action choices

Boundary:
- ML may score / weight only
- any new social construct still originates in `lifeSimSystem.js`

Closure:
- closed through `NEURAL-SOCIAL-SCORING-AUDIT.md`
- live feature contract is now `14 groups | 98 flat | 124 vec`
- ML now reads society tone, relationship texture, follow-through mode/strength, local signal-field tone/pressure, and life-sim-owned follow-through/avoidance biases without owning durable social truth

#### `n7 surfacing + proof`

Goal:
- make social depth readable through the current runtime feed / inspect / debug surfaces using a DOM-ready presentation snapshot path

Rule:
- surfaces stay presentation-only
- the proof lanes must assert that the underlying life-sim/social state changed
- the same presentation snapshot path must be reusable by runtime `v1` DOM panels later

#### `n8 save migration + freeze`

Goal:
- preserve long-running relationships while widened durable social state migrates cleanly

Must preserve:
- butterfly identity
- memories
- relationship edges
- lineage / continuity

Stable doc:
- [SOCIAL-SAVE-CONTINUITY-AUDIT.md](./SOCIAL-SAVE-CONTINUITY-AUDIT.md)

### Exact Order

```text
n0 audit current social truth
▼
n0.5 lock the measurement harness
▼
n1 lock families + ownership
▼
n2 rebalance motive weighting
▼
n3 deepen pair chemistry
▼
n4 deepen group/society context
▼
n5 strengthen behavior follow-through
▼
n6 integrate richer ML weighting
▼
n7 improve surfacing + proof
▼
n8 migrate saves and freeze
```

### Current Next Move

```text
next update
|- n7 surfacing + proof -> live
`- n8 save migration + freeze -> live
```

```text
next pressure
|- n7 proved that the richer social state is now readable in inspect / feed / debug
|- n8 proved that widened social continuity survives save / restore and overload recovery
`- the remaining shared dependency is the later cross-track save-schema signoff with runtime `v7` and spatial `s7`
```

## Social Truth Audit

_Source: `docs/SOCIAL-TRUTH-AUDIT.md`_

### Purpose

This is the stable `n0` evidence map for the current social-feeling gap.

It closes the first question before family redesign work begins:

```text
what is actually happening now?
├─ not enough motive variety
├─ too much warning / compliance
├─ too little pair distinction
└─ too little visible follow-through
```

### Primary Evidence

```text
primary audit source
├─ capture      -> `2026-04-21T22-37-33-649Z-playtest-manual-capture-1776811016146`
├─ audit report -> `qa_logs/social_truth_audit/2026-04-22T00-56-17-757Z/REPORT.md`
└─ why this one -> real manual play where the repetitive-talk problem was actually observed
```

### Manual Playtest Snapshot

```text
manual playtest social mix
├─ warning            -> 123   (35.7%)
├─ acknowledgement    -> 79    (22.9%)
├─ comfort            -> 61
├─ teaching           -> 58
├─ companionship      -> 12
├─ shared-observation -> 9
├─ admiration         -> 1
└─ repair / rivalry / play / flirtation -> 0
```

```text
what that means
warning / caution
   └─▶ generic acknowledgement
        └─▶ little visible pair chemistry or social texture
```

### Most Repeated Phrase Shapes

| phrase pattern | count |
| --- | ---: |
| easy now nothing urgent is moving through this side of the echoing ground | 12 |
| stay with me this part of the echoing ground is steady enough for you to breathe again | 11 |
| do not take that moss path the air shifted too sharply for that to be harmless | 10 |
| do not take that moss path something in that part of the low ground does not feel stable | 8 |
| back away from the covered edge the pattern there is breaking unevenly | 7 |
| careful near the covered wall the pattern there is breaking unevenly | 7 |
| alright i will move with you | 5 |

### Weak Follow-Through Pattern

```text
current weak loop
warning / correction
   └─▶ “got it / I heard you / I will follow that”
        └─▶ little visible later social consequence
```

Common weak examples from the manual audit:
- `Got it I will keep it in mind.`
- `Alright, I heard that I will follow that.`
- `Bella, got it; I will keep that in mind.`
- `Bella, I understand; I am with you on that.`

### Supporting Contrast

The latest automated `v0` soak audit is still worth keeping as a contrast case:

```text
supporting contrast
├─ capture      -> `2026-04-22T00-53-10-595Z-v0-baseline-soak40-capture-1776819174220`
├─ audit report -> `qa_logs/social_truth_audit/2026-04-22T00-53-20-702Z/REPORT.md`
└─ reading      -> the runtime can emit comfort/teaching families, but ordinary play still does not feel socially broad enough
```

That contrast matters because it means the problem is not “those families do not exist at all.”
It is:

```text
the lived experience is still dominated by the wrong families
```

### `n0` Outcome

```text
n0 status
├─ repeated-line dominance captured   -> yes
├─ under-expressed family map         -> yes
├─ weak follow-through examples       -> yes
└─ next unlocked phase                -> n0.5 social measurement harness
```

### Immediate Requirements For `n0.5`

`n0.5` now has to make the current gap measurable on every later pass:

- motive-family frequency distribution capture
- pair-distinctness metric
- follow-through rate for anchoring residue bands

Without that harness, later social phases would still be judged mostly by feel.

## Social Measurement Harness

_Source: `docs/SOCIAL-MEASUREMENT-HARNESS.md`_

### Purpose

This doc is the stable `n0.5` proof layer for the social-cognition track.

It exists so later phases can be measured against one explicit harness instead
of relying on anecdotal feed impressions alone.

```text
social proof stack
├─ n0  -> what feels flat in lived play
└─ n0.5 -> how we measure whether it actually improved
```

Use this with:

- [SOCIAL-TRUTH-AUDIT.md](./SOCIAL-TRUTH-AUDIT.md)
- [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
- [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)

### Harness Outputs

```text
n0.5 harness
├─ motive-family frequency distribution
├─ pair-distinctness metric
└─ follow-through proxy rate
```

#### 1. Motive-family frequency distribution

The harness counts how often each motive family actually appears in a capture.

This is the proof layer for:

- warning dominance
- acknowledgement dominance
- under-expressed companionship / admiration / repair / play / flirtation

#### 2. Pair-distinctness metric

The harness computes Jensen-Shannon divergence across resolved single-target
pair-line distributions.

```text
high divergence
└─ two pairs sound materially different

low divergence
└─ two pairs are collapsing into the same social voice
```

Current limitation:

- the live capture format does not yet persist explicit target labels on every
  dialogue residue
- resolved pairs therefore currently depend on addressee extraction from the
  emitted phrase when `talkMode == single_target`
- unresolved single-target lines are reported separately instead of being
  hidden

#### 3. Follow-through proxy rate

The harness uses the life-sim-owned `followThroughState` marker as the current
proxy for whether a dialogue residue became visibly social later.

```text
visible proxy states
├─ acting
├─ held
├─ lingering
├─ held-at-distance
└─ repair-open
```

This is intentionally a proxy, not a UI guess.

Future phases may replace it with stricter event-linked timing proof, but the
current owner remains life-sim / communication state rather than presentation.

### Current Evidence

Primary manual-capture artifact:

- [2026-04-22T01-16-37-039Z/REPORT.md](../qa_logs/social_measurement_harness/2026-04-22T01-16-37-039Z/REPORT.md)

Current measured snapshot from that manual playtest capture:

```text
dialogue records          -> 345
resolved pairs (>=3)      -> 11
unresolved single-target  -> 75
average JS divergence     -> 0.5392
median JS divergence      -> 0.4591
visible follow-through    -> 0.501
```

```text
current reading
├─ some pairs are genuinely distinct
├─ but many still collapse into acknowledgement-heavy sameness
└─ follow-through exists, but warning / compliance still dominates the felt mix
```

### Owner Boundaries

```text
communicationSystem / lifeSimSystem
├─ own the emitted dialogue residue and follow-through state
└─ therefore own the harness inputs

gameUI / feed / inspect
└─ may display the result, but never invent or mutate the underlying truth

mlInferenceSystem
└─ may later weight social choices, but does not define pair identity,
   durable feelings, or the harness source data
```

### Phase Gate

`n0.5` closes when:

1. the harness script exists and runs on a real manual capture
2. the three outputs above are written into `qa_logs/social_measurement_harness`
3. the active social board points to this doc as the stable measurement layer

That gate is now satisfied.

## Social Family Lock

_Source: `docs/SOCIAL-FAMILY-LOCK.md`_

### Purpose

This doc is the stable `n1` contract for social truth ownership and canonical
family names.

It exists so later social-depth work does not solve repetition by inventing
overlapping mini-systems.

```text
n1 lock
├─ one family map
├─ one owner map
└─ one cadence boundary handshake with runtime v4
```

Use this with:

- [ACTIVE-SOCIAL-COGNITION-BOARD.md](./ACTIVE-SOCIAL-COGNITION-BOARD.md)
- [SOCIAL-COGNITION-ROADMAP.md](./SOCIAL-COGNITION-ROADMAP.md)
- [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md)
- [DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md](./DIALOGUE-MEMORY-RELATIONSHIP-CONTRACT.md)
- [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md)

### Canonical Family Map

#### Emotion channels

```text
emotion channels
├─ threat
├─ relief
├─ attachment
├─ rejection
├─ significance
├─ failure
├─ curiosity
├─ agitation
└─ exhaustion
```

#### Pair chemistry summaries

```text
pair chemistry
├─ ease
├─ playfulness
├─ tenderness
├─ fascination
├─ irritation
├─ longing
├─ rivalryHeat
└─ repairOpenness
```

#### Society summaries

```text
society summaries
├─ reputation
├─ belonging
├─ cliqueComfort
├─ cliqueTension
├─ witnessedWarmth
├─ witnessedEmbarrassment
├─ protectivenessField
└─ teachingPrestige
```

#### Conversation motive families

```text
conversation motives
├─ maintenance
├─ companionship
├─ observation
├─ admiration
├─ play
├─ flirtation
├─ repair
├─ complaint
├─ rivalry
├─ warning
├─ teaching
└─ statusPerformance
```

### Owner Map

```text
lifeSimSystem
├─ emotion channels
├─ pair chemistry summaries
├─ society summaries
├─ later behavior follow-through pressure
└─ durable social summaries derived from memory + edges

communicationSystem
├─ emitted motive family
├─ exchange flow
├─ heard interpretation envelope
└─ residue labeling attached to spoken interaction

durable social state
├─ relationship edges
├─ dialogue residue packets
├─ witnessed/social-memory packets
└─ repetition / novelty counters

mlInferenceSystem
└─ later scoring / weighting only

gameUI + DOM panels + debugUI
└─ presentation only, never truth ownership
```

### Durable vs Derived Rule

```text
durable truth
├─ emotions
├─ memories
├─ relationship edges
└─ long-running social residue

derived truth
├─ pair chemistry summaries
├─ society summaries
├─ feed thread groupings
└─ debug/player-facing explanation shells
```

Rules:

- pair chemistry must be derived from durable edges, recent interaction history,
  and current emotion channels instead of being stored as a second competing
  relationship model
- society summaries must be derived from witnessed/social memory, belonging,
  clique pressure, protectiveness, and teaching prestige instead of being
  hard-authored UI labels
- UI may format the result but may not invent or persist it

### ML Boundary

```text
mlInferenceSystem
├─ may score who to approach
├─ may score whether to warn / comfort / tease / praise / withdraw
├─ may score whether to repair / escalate / avoid
└─ may not create new durable emotions, memories, or relationship edges
```

This lock is subordinate to [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
and [SAVE-SCHEMA-REGISTRY.md](./SAVE-SCHEMA-REGISTRY.md).

### Cadence Handshake

`n1` co-owns [SIM-CADENCE-CONTRACT.md](./SIM-CADENCE-CONTRACT.md) with runtime
`v4`.

The rule is:

```text
no cadence value is final
until this family lock exists
and the cadence contract is signed for sequencing
```

That sequencing signoff is now recorded.

### Phase Gate

`n1` closes when:

1. one canonical family map exists
2. one owner map exists
3. the cadence contract is signed from the `n1` side
4. the active social board and roadmap point to this doc instead of only to a
   recommended family list embedded in prose

That gate is now satisfied.

## Social Motive Rebalance Audit

_Source: `docs/SOCIAL-MOTIVE-REBALANCE-AUDIT.md`_

### Purpose

This is the stable `n2` proof note.

It records the runtime changes and proof artifacts that shifted ordinary
social talk away from a mostly warning / acknowledgement loop.

```text
before
warning / correction
   └─▶ generic compliance

after n2
low-risk warning suppression
   ├─▶ fewer casual warning emissions
   ├─▶ no auto-reply pile-on for multi-target warnings
   └─▶ more targeted companionship / praise / observation openers
        └─▶ more varied casual replies
```

### What Landed

```text
runtime changes
├─ low-risk warning pulses are suppressed unless there is real warning context
├─ invitation/social signals now target nearby butterflies more reliably
├─ multi-target warnings no longer auto-solicit generic acknowledgement replies
├─ casual acknowledgement subtypes broaden in easy/open pair states
└─ casual reply wording now reflects companionship / admiration / shared-attention / repair context
```

### Proof Artifacts

Targeted `n2` proof:
- `qa_screenshots/n2_social_motive_rebalance_audit/2026-04-22T05-23-46-916Z/report.json`

Broader social-depth regression:
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T05-23-46-937Z/report.json`

Communication regression:
- `qa_screenshots/r6_communication_audit/2026-04-22T05-21-03-535Z/report.json`

### n2 Exit Shape

```text
n2 exit
├─ low-risk warning path        -> green
├─ invitation targeting         -> green
├─ warning auto-reply suppression -> green
├─ casual response variation    -> green
├─ threaded/feed social depth   -> green
└─ communication regression     -> green
```

### Remaining Gap

`n2` broadens the motive mix and reduces the worst warning/acknowledgement
dominance, but it does not yet make relationships deeply distinct.

That next step belongs to `n3`.

```text
n2
├─ rebalance what gets said
└─ stop the obvious dominance loops

n3
├─ deepen pair chemistry
├─ make recurring pairs feel recognizably different
└─ make tone and response form depend more strongly on history
```

### Status

```text
n2 social motive rebalance -> live
n3 pair chemistry + relationship texture -> active
```

## Pair Chemistry Texture Audit

_Source: `docs/PAIR-CHEMISTRY-TEXTURE-AUDIT.md`_

### Purpose

This is the stable `n3` closure note.

It records the runtime changes and proof artifacts that deepened pair-specific
chemistry so recurring relationships no longer read as mostly the same
"warm" exchange with minor wording variance.

```text
before
pair mode
   ├─ easy / tender / guarded / strained / admiring / playful
   └─ many recurring pairs still converged on the same social feel

after n3
durable edges + recent residues
   └─> pair texture
       ├─ devoted
       ├─ playful
       ├─ admiring
       ├─ repairing
       ├─ guarded
       ├─ strained
       └─ steady
            ├─ steers subtype choice
            ├─ steers response phrasing
            ├─ surfaces in feed / inspect
            └─ biases later life-sim follow-through
```

### What Landed

```text
runtime changes
├─ communicationSystem now derives a pair-texture state from durable edges,
│  recent residues, and chemistry instead of relying only on coarse pair mode
├─ acknowledgement / calming subtype choice now respects that texture
├─ casual response phrasing now changes by texture, not only by signal family
├─ relationship summaries now surface pair texture and its signature
├─ threaded feed entries now carry pair texture instead of only pair mode
└─ lifeSim follow-through biases now read the same pair-texture truth
```

### Proof Artifacts

Targeted `n3` proof:
- `qa_screenshots/n3_pair_chemistry_audit/2026-04-22T06-11-26-124Z/report.json`

Broader social-depth regression:
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T06-11-51-638Z/report.json`

Communication regression:
- `qa_screenshots/r6_communication_audit/2026-04-22T06-11-51-640Z/report.json`

UI readability regression:
- `qa_screenshots/r4_ui_readability_audit/2026-04-22T06-13-14-236Z/report.json`

### n3 Exit Shape

```text
n3 exit
├─ distinct pair textures resolve from live relationship state -> green
├─ texture changes casual phrase feel, not just labels          -> green
├─ feed / inspect surface pair texture                          -> green
├─ life-sim follow-through consumes the same texture truth      -> green
├─ broader social-depth regression                              -> green
├─ communication regression                                     -> green
└─ UI readability regression                                    -> green
```

### Remaining Gap

`n3` makes recurring pairs feel more distinct, but it does not yet make the
whole garden feel like a visible butterfly society.

That next step belongs to `n4`.

```text
n3
├─ deepen one-to-one chemistry
├─ give recurring pairs recognizable texture
└─ let pair texture steer later behavior

n4
├─ widen from pairs to local social groups
├─ make reputations / cliques / witnessed behavior matter
└─ make the garden read as a society, not only a set of pairs
```

### Status

```text
n3 pair chemistry + relationship texture -> live
n4 butterfly society / group tone        -> active
```

## Butterfly Society Group Tone Audit

_Source: `docs/BUTTERFLY-SOCIETY-GROUP-TONE-AUDIT.md`_

### Purpose

This is the stable closure note for `n4 butterfly society / group tone`.

It exists to prove that Papilionem now reads as local butterfly society instead
of only pair texture plus isolated warning/correction exchanges.

### Phase Shape

```text
n4 butterfly society / group tone
├─ witnessed exchange carry-over
│  ├─ praise can raise observer admiration
│  ├─ friction can raise observer rivalry / resentment
│  └─ care can raise observer trust / protectiveness
├─ local group-tone derivation
│  ├─ clique comfort
│  ├─ clique exclusion
│  ├─ protective ring
│  └─ reputation wave
├─ player-visible surfacing
│  ├─ Inspect: Society ...
│  ├─ Inspect: Rhythm ...
│  └─ feed grounding can name the local social context
└─ no second owner of social truth
   ├─ communicationSystem -> witnessed carry-over on existing edges
   ├─ lifeSimSystem       -> derived local society summary
   └─ gameUI              -> presentation only
```

### Live Runtime Truth

```text
owners
├─ systems/communicationSystem.js
│  └─ applies tiny bystander carry-over to existing social edges
├─ systems/lifeSimSystem.js
│  └─ derives clique / exclusion / protection / reputation from local edge fields
└─ ui/gameUI.js
   └─ surfaces Society + Rhythm lines without inventing durable truth
```

The phase deliberately did not widen durable save truth.

`n4` reuses:
- trust
- comfort
- attachment
- rivalry
- resentment
- admiration
- protectiveness
- recent warmth / ease / friction / mutual attention

### Proof Snapshot

```text
n4 proof
├─ witnessed praise changes observer admiration         -> green
├─ clique comfort resolves as the active local rhythm   -> green
├─ clique exclusion resolves as the active local rhythm -> green
├─ protective ring resolves as the active local rhythm  -> green
├─ f5/f6 social depth regression                        -> green
├─ r6 communication regression                          -> green
└─ r4 UI readability regression                         -> green
```

Primary artifacts:
- `qa_screenshots/n4_social_group_tone_audit/2026-04-22T06-54-46-914Z/`
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T06-53-17-656Z/`
- `qa_screenshots/r6_communication_audit/2026-04-22T06-53-17-657Z/`
- `qa_screenshots/r4_ui_readability_audit/2026-04-22T06-53-17-623Z/`

### Honest Boundaries

```text
still true after n4
├─ no new durable society schema yet
├─ no UI-owned feelings / group truth
├─ no ML-owned relationship / emotion truth
└─ n5 is still required for stronger later behavioral follow-through
```

`n4` makes society visible and locally consequential, but it is not the final
follow-through phase. The next pressure is still `n5 dialogue-to-behavior
follow-through`.

## Dialogue-Behavior Follow-Through Audit

_Source: `docs/DIALOGUE-BEHAVIOR-FOLLOW-THROUGH-AUDIT.md`_

### Purpose

This is the stable closure note for `n5 dialogue-to-behavior follow-through`.

It exists to prove that Papilionem now carries dialogue and relationship
texture forward into later visible behavior instead of letting social state stay
mostly inside feed wording and inspect summaries.

### Phase Shape

```text
n5 dialogue-to-behavior follow-through
|- relationship carry-over
|  |- familiar partners are re-sought
|  |- strained partners are avoided
|  |- admired partners are shadowed
|  `- vulnerable partners pull protective staying-near behavior
|- owner split stays clean
|  |- communicationSystem -> derive follow-through profile from durable edges
|  |- lifeSimSystem       -> expose derived follow-through bias
|  |- behaviorSystem      -> surface action-family / subtype intent
|  |- butterfly           -> choose visible movement targets from that truth
|  `- gameUI              -> presentation only
`- no second social owner introduced
```

### Live Runtime Truth

```text
owners
|- systems/communicationSystem.js
|  `- derives seek / avoid / imitate / protect carry-over from existing edge truth
|- systems/lifeSimSystem.js
|  `- exposes follow-through inside socialEcology + behavior bias summaries
|- systems/behaviorSystem.js
|  `- surfaces partner-return / strained-avoidance / admiring-shadow / protective-follow-through
`- entities/butterfly.js
   `- turns the derived follow-through into actual visible movement choice
```

The phase deliberately did not widen durable save truth.

`n5` reuses:
- trust
- comfort
- attachment
- admiration
- protectiveness
- resentment
- rejection weight
- follow-through score
- recent warmth / ease / friction / mutual attention
- pair texture
- society context

### Proof Snapshot

```text
n5 proof
|- partner-return keeps close to familiar partner       -> green
|- strained-avoidance keeps distance                    -> green
|- admiring-shadow stays near admired butterfly         -> green
|- protective-follow-through stays near vulnerable ally -> green
|- f5/f6 social depth regression                        -> green
|- r6 communication regression                          -> green
`- r4 UI readability regression                         -> green
```

Primary artifacts:
- `qa_screenshots/n5_dialogue_behavior_follow_through_audit/2026-04-22T07-27-31-687Z/`
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T07-27-59-696Z/`
- `qa_screenshots/r6_communication_audit/2026-04-22T07-27-59-740Z/`
- `qa_screenshots/r4_ui_readability_audit/2026-04-22T07-27-59-771Z/`

### Honest Boundaries

```text
still true after n5
|- no UI-owned relationship or feeling truth
|- no ML-owned durable emotion / memory / edge truth
|- no new durable social schema yet
`- n6 is still required before the model-backed layer can help choose richer social actions
```

`n5` makes later social carry-over visible in normal movement, but it is not
the neural-social scoring phase. The next pressure is still `n6 neural/social
scoring integration`.

## Neural-Social Scoring Audit

_Source: `docs/NEURAL-SOCIAL-SCORING-AUDIT.md`_

### Purpose

This is the stable closure note for `n6 neural/social scoring integration`.

It exists to prove that Papilionem's ML scoring layer now notices richer
life-sim-owned social truth without becoming a second owner of feelings,
memories, relationship edges, or society state.

### Phase Shape

```text
n6 neural/social scoring integration
|- feature bundle widened with read-only social context
|  |- society tone
|  |- relationship texture
|  |- follow-through mode + strength
|  |- local signal-field tone + pressure
|  |- follow-through drive
|  `- social avoidance
|- heuristic scorer now notices that context
|  |- clique comfort lifts butterfly targeting and invitation
|  |- devoted seek lifts approach + socialize pressure
|  |- strained avoid lifts avoidance + quiet
|  `- protective warning shifts calming / warning choice
`- owner split stays clean
   |- lifeSimSystem + communicationSystem own social truth
   |- mlInferenceSystem only reads and weights
   `- no durable social state moved into ML
```

### Live Runtime Truth

```text
owners
|- systems/lifeSimSystem.js
|  `- owns derived socialEcology + behaviorBiases truth
|- systems/communicationSystem.js
|  `- owns pair texture, local signal field, and follow-through derivation
`- systems/mlInferenceSystem.js
   |- widens the transient feature bundle to 14 groups / 98 flat / 124 vec
   `- scores richer social action choices from read-only social inputs
```

`n6` did not widen durable save truth.

It only widened transient ML features with:
- `social.societyTone`
- `social.relationshipTexture`
- `social.followThroughMode`
- `social.followThroughStrength`
- `social.localFieldTone`
- `social.localFieldPressure`
- `behavior.followThroughDrive`
- `behavior.socialAvoidance`

### Proof Snapshot

```text
n6 proof
|- clique comfort raises butterfly targeting + invitation -> green
|- devoted seek raises approach + socialize pressure      -> green
|- strained avoid raises avoidance + quiet               -> green
|- protective warning shifts calming / warning choice    -> green
|- f5/f6 social depth regression                         -> green
|- r6 communication regression                           -> green
|- ml phase m3 feature contract                          -> green
|- ml phase m4 artifact/runtime lane                     -> green
`- deep systems regression                               -> green
```

Primary artifacts:
- `qa_screenshots/n6_neural_social_scoring_audit/2026-04-22T07-53-31-722Z/`
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T07-55-04-634Z/`
- `qa_screenshots/r6_communication_audit/2026-04-22T07-55-32-773Z/`
- `qa_screenshots/ml_phase_m3_audit/2026-04-22T07-56-41-545Z/`
- `qa_screenshots/ml_phase_m4_audit/2026-04-22T07-56-57-744Z/`
- `qa_screenshots/deep_systems_audit/2026-04-22T07-58-15-353Z/`

### Honest Boundaries

```text
still true after n6
|- ML may score / weight only
|- no ML-owned durable emotion / memory / edge truth
|- no UI-owned social truth
|- no durable save-schema widening happened here
`- n7 is still required so this richer depth becomes more legible in runtime v1 DOM panels and proof
```

`n6` makes the model-backed layer socially literate enough to notice clique
comfort, strain, protection, devotion, and local signal pressure, but it does
not replace life-sim or communication as the owner of those constructs. The
next pressure is still `n7 surfacing + proof`.

## Social Surfacing Proof Audit

_Source: `docs/SOCIAL-SURFACING-PROOF-AUDIT.md`_

```text
n7 status
├─ inspect social lens            -> live
├─ feed threaded social footer    -> live
├─ debug ML/social bridge         -> live
└─ next phase                     -> n8 active
```

### What Landed

```text
presentation-only surfacing
├─ inspect now caches a reusable presentation snapshot
│  ├─ texture + carry-over
│  ├─ society + rhythm
│  ├─ local field
│  └─ ML/social why-summary
├─ feed talk threads now show concise lived-context footers
│  ├─ pair texture
│  ├─ visible local situation
│  └─ turn count
└─ debug explainability now exposes
   ├─ social tone
   ├─ pair carry-over
   └─ local signal field
```

Rule held:
- `ui/gameUI.js` and `ui/debugUI.js` only render life-sim / communication / ML summaries
- no durable social truth moved into UI-owned state
- the new presentation snapshot is the bridge current canvas panels use now and runtime `v1` DOM panels can reuse later

### Proof

Primary proof:
- `qa_screenshots/n7_social_surfacing_audit/2026-04-22T08-18-25-219Z/report.json`

Regression support:
- `qa_screenshots/f5_f6_social_depth_audit/2026-04-22T08-18-25-233Z/report.json`
- `qa_screenshots/r6_communication_audit/2026-04-22T08-19-21-740Z/report.json`
- `qa_screenshots/r4_ui_readability_audit/2026-04-22T08-18-25-279Z/report.json`

### Closure

```text
n7 closed because
├─ richer social depth is now readable in normal play
├─ the proof lane checks inspect / feed / debug directly
└─ the UI still does not own relationship, memory, or emotion truth
```

Next pressure:
- preserve long-running social continuity and freeze widened durable state under `n8`

## Social Save Continuity Audit

_Source: `docs/SOCIAL-SAVE-CONTINUITY-AUDIT.md`_

### Purpose

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

### Runtime Closure

```text
save continuity rule now live
├─ overloaded saves no longer force a fresh world
├─ restore sanitization prunes to limits instead of wiping sacred butterflies
├─ renamed hybrid identity survives roundtrip restore
└─ social durability stays anchored in save truth, not UI snapshots
```

### Proof Snapshot

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

### Regression Check

Supporting proof stayed green after the `n8` save changes:

- `qa_screenshots/r6_communication_audit/2026-04-22T08-32-59-448Z/report.json`
- `qa_screenshots/runtime_self_audit/report.json` (`overall: warn`, same non-blocking baseline state)

### Honest Boundary

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

## External Playtest Matrix

_Source: `docs/EXTERNAL-PLAYTEST-MATRIX.md`_

### Purpose

This document turns outside playtesting into a repeatable matrix instead of an
informal "send the build around" step.

Use it together with:

- [../PLAYTEST.md](../PLAYTEST.md)
- [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- [ACTIVE-PUBLIC-SHARE-BOARD.md](./ACTIVE-PUBLIC-SHARE-BOARD.md)
- [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)

### Status Key

```text
validated
|- passed in a real session

prepared
|- launch path exists and is documented, but still needs a real session

queued
|- intended test lane, not yet run

not targeted
`- explicitly outside the current public-share goal
```

### Current Baseline

```text
validated now
|- host-local launch
|  |- npm install
|  |- npm run playtest
|  `- http://127.0.0.1:3000/
|- runtime shell
|  |- title start
|  |- button-first controls
|  |- quick-start card
|  `- debug optional
`- baseline environment
   |- Node 18+
   `- desktop Chromium-family browser
```

### Intake Path

Record sessions in this order:

- launch with [../PLAYTEST.md](../PLAYTEST.md)
- if the host can use debug tools comfortably, run `Start Capture` before play and `Export Capture` after play
- capture observations in [../PLAYTEST-FEEDBACK.md](../PLAYTEST-FEEDBACK.md)
- promote actionable issues into [PLAYTEST-TRIAGE-LOG.md](./PLAYTEST-TRIAGE-LOG.md)

### Immediate Next Lane

```text
next required outside proof
|- lane        -> M2 same-LAN desktop Chromium
|- host build  -> frozen `v8a` runtime stack
|- required    -> one real session reaching garden + core interaction path
|- collect     -> PLAYTEST-FEEDBACK.md
|- optional    -> Start Capture / Export Capture if the host can drive debug tools comfortably
`- after run   -> copy only actionable issues into PLAYTEST-TRIAGE-LOG.md
```

### Environment Matrix

| Lane | Target | Status | What to prove | Notes |
| --- | --- | --- | --- | --- |
| `M1` | host-local Windows + Chromium | `validated` | install, launch, title start, top-right shell, Inspect/Feed/Journal/Access, save/load, battle entry | current strongest proved path |
| `M2` | same-LAN desktop Chromium | `prepared` | second-device connection using `http://<host-ip>:3000/`, normal play loop, save/load, feedback submission | server now prints LAN URLs, but still needs a real second-device session |
| `M3` | same-LAN desktop Edge | `queued` | full local-host-share flow plus shell readability parity | likely near Chromium path, but not yet proved |
| `M4` | same-LAN desktop Firefox | `queued` | startup, shell layout, rendering correctness, save/load, battle readability | explicitly verify no browser-specific rendering regressions |
| `M5` | same-LAN macOS Safari | `queued` | title start, shell controls, accessibility readability, save/load, battle shell | important if broader non-Chromium sharing is desired |
| `M6` | same-LAN iPhone Safari | `queued` | touch startup, readability, basic shell use, viewport fit | only worth promoting if mobile sharing becomes part of alpha scope |
| `M7` | same-LAN Android Chrome | `queued` | touch startup, readability, shell fit, general stability | secondary mobile lane |
| `M8` | public internet hosting | `not targeted` | deployment hardening, remote hosting, public URL ownership | outside the current local-host/public-alpha scope |

### Required Test Flow

Every real outside session should cover:

```text
1. launch
   |- could the tester reach the URL?
   `- did the title screen transition cleanly?

2. first five minutes
   |- did the quick-start shell help?
   |- could they find Inspect / Feed / Journal / Access?
   `- did they understand what to do next?

3. core interaction
   |- read the garden
   |- inspect a butterfly
   |- open the feed
   |- open the journal
   `- try accessibility controls

4. stability
   |- save
   |- load
   |- export session capture if debug was available
   |- verify roundtrip if comfortable
   `- note any visual or startup failures

5. optional advanced pass
   |- debug presets
   |- battle shell
   `- feedback handoff
```

### Failure Buckets

Classify outside findings into one of these buckets first:

```text
startup
onboarding
readability
save/load
battle
browser-specific
performance
known-issue / non-blocking
```

### Promotion Rule

Do not call a lane `validated` until:

- the tester used the documented launch path
- the session reached the garden successfully
- the tester completed the core interaction path
- feedback was captured in the template
- actionable blockers were copied into the triage log when present

Until then, use `prepared` or `queued`, not `validated`.

## Playtest Triage Log

_Source: `docs/PLAYTEST-TRIAGE-LOG.md`_

### Purpose

This log is the intake landing spot for real outside-tester findings during
`R4 feedback triage + readability hardening`.

Do not add speculative polish ideas here.
Only capture issues backed by a real session from the lanes in
[EXTERNAL-PLAYTEST-MATRIX.md](./EXTERNAL-PLAYTEST-MATRIX.md).

### Intake Rule

```text
outside session
      |
      v
PLAYTEST-FEEDBACK.md
      |
      v
triage entry here
      |
      v
runtime/doc fix
      |
      v
rerun affected audits
```

### Status Key

```text
open
|- confirmed outside-session issue, not fixed yet

in progress
|- actively being repaired or reworded

closed
`- fixed and rechecked against the affected audits/docs
```

### Entry Template

Copy one block per actionable issue:

```text
id                :
status            : open / in progress / closed
lane              : M1 / M2 / M3 / M4 / M5 / M6 / M7
bucket            : startup / onboarding / readability / save-load / battle / browser-specific / performance / known-issue
severity          : low / medium / high
summary           :
what the tester saw:
expected instead  :
reproduction notes:
source session    :
owner files       :
audit to rerun    :
resolution notes  :
```

### Active Queue

```text
open outside-session queue
`- no confirmed M2+ issues logged yet; waiting on the first real outside session
```

```text
closed local-session fixes
|- M1 battle shell clutter / field occlusion
|- M1 battle feel / pacing readability
|- M1 focused-garden freeze / high-DPI pressure
|- M1 sustained lag / low smoothness after freeze fix
|- M1 save refresh / doorway continuity
|- M1 shallow social feed / casual conversation visibility
`- M1 weak visible material/build behavior
```

```text
id                : r4-m1-battle-shell-clutter-2026-04-20
status            : closed
lane              : M1
bucket            : battle
severity          : high
summary           : battle mode covered too much of the field and let the garden feed stay visible behind the match
what the tester saw: left/right team panels, a visible battle feed, and the leftover garden feed crowded the arena and made the fight harder to read
expected instead  : battle should read primarily through the field, with only a light support shell
reproduction notes: host-local Windows + Chromium self-test; enter Battle while Feed was visible
source session    : local M1 self-test on 2026-04-19/2026-04-20
owner files       : ui/gameUI.js, core/renderManager.js, scripts/run-r5-battle-presentation-audit.js, scripts/run-single-player-autobattle-audit.js
audit to rerun    : run-r5-battle-presentation-audit.js, run-single-player-autobattle-audit.js, run-r4-ui-readability-audit.js
resolution notes  : battle now uses a minimal field shell, hides garden-side feed/inspect panels while the match is active, keeps the event log internal, and moves HP readability onto small in-field health bars
```

```text
id                : r4-m1-battle-feel-2026-04-20
status            : closed
lane              : M1
bucket            : battle
severity          : high
summary           : battle opened and resolved too abruptly to feel like a real field exchange
what the tester saw: butterflies barely moved, appeared too large for the arena, did not feel released from back lines, and the fight ended before ability traces read clearly
expected instead  : teams should launch from the back of each side, spread into the arena, and fight long enough for movement, dodging, and ability traces to register
reproduction notes: host-local Windows + Chromium self-test; run single-player autobattle from the top-right Battle flow
source session    : local M1 self-test on 2026-04-19/2026-04-20
owner files       : systems/battleSystem.js, core/renderManager.js, entities/butterfly.js, core/config.js
audit to rerun    : run-r5-battle-presentation-audit.js, run-single-player-autobattle-audit.js, run-runtime-self-audit.js
resolution notes  : battle now starts from narrow back-line spawn bands, uses smaller battle-only butterfly scale, adds wider roam/release motion, lengthens visible ability/projectile windows, and slows the cadence enough to watch the fight without restoring the old speed-control shell
```

```text
id                : r4-m1-freeze-hardening-2026-04-20
status            : closed
lane              : M1
bucket            : performance
severity          : high
summary           : larger browser windows and high-DPI rendering could push the garden into hard stutter/freeze territory
what the tester saw: the game could freeze or stall heavily during ordinary garden play, especially after the visual-resolution increase and on larger windows
expected instead  : the garden should stay playable on a normal large local-host browser window without forcing a save reset or disabling the newer visual clarity entirely
reproduction notes: host-local Windows + Chromium self-test; follow-up proof used high-DPI stress playback plus session capture export
source session    : local M1 self-test on 2026-04-20
owner files       : sketch.js, core/gameCore.js, core/config.js, core/renderManager.js, entities/butterfly.js, scripts/run-f2-performance-hardening-audit.js
audit to rerun    : run-f2-performance-hardening-audit.js, run-r4-ui-readability-audit.js, run-runtime-self-audit.js
resolution notes  : the runtime now clamps oversized browser windows, caps large-window canvas density more aggressively, disables costly butterfly sprite smoothing automatically under pressure, turns off animated atmosphere earlier when the renderer is already hot, and keeps the previous composed frame visible if a render-frame error occurs instead of wiping to black; the dedicated high-DPI stress audit now passes with no freeze-suspect capture events
```

```text
id                : r4-m1-save-refresh-continuity-2026-04-20
status            : closed
lane              : M1
bucket            : save-load
severity          : high
summary           : refresh-aware world fixes could force a reset to see current block/runtime changes, and active doorway travel could drop during save/load
what the tester saw: older saves sometimes needed a reset to pick up current environment truth, and a butterfly traveling between zones could fail to complete the trip after load
expected instead  : long-running saves should keep butterfly identity, memory, and lineage while refreshing the world to the current build without stranding travelers
reproduction notes: host-local Windows + Chromium self-test; follow-up proof used lived-in save roundtrip plus stale block-layout refresh injection
source session    : local M1 self-test on 2026-04-20
owner files       : systems/saveSystem.js, core/gameCore.js, scripts/run-f3-long-running-save-regression-audit.js
audit to rerun    : run-f3-long-running-save-regression-audit.js, run-runtime-self-audit.js, run-long-soak-generational-audit.js
resolution notes  : the save path now strips transient per-butterfly active-signal fanout from durable state, restores active doorway travel against the live doorway route, and keeps refreshed block layouts compatible with long-running social/lineage saves without forcing a reset
```

```text
id                : r4-m1-social-thread-depth-2026-04-20
status            : closed
lane              : M1
bucket            : readability
severity          : medium
summary           : ordinary talk looked shallow and isolated, so friendships and pair bonds were hard to perceive in live play
what the tester saw: the feed mostly read as separate acknowledgement-style cards instead of visible short conversations, and the social layer did not clearly show warmth, friction, or companionship building over time
expected instead  : the feed should show short exchange threads, low-stakes casual talk should sound more human, and later Inspect/social state should prove that those exchanges mattered
reproduction notes: host-local Windows + Chromium self-test; observe normal feed activity during calm garden play and Inspect after repeated pair interactions
source session    : local M1 self-test on 2026-04-20
owner files       : systems/communicationSystem.js, systems/lifeSimSystem.js, ui/gameUI.js, scripts/run-f5-f6-social-depth-audit.js, scripts/run-r6-communication-audit.js
audit to rerun    : run-f5-f6-social-depth-audit.js, run-r6-communication-audit.js, run-r4-ui-readability-audit.js, run-runtime-self-audit.js
resolution notes  : same-pair talk now groups into threaded exchange cards, low-stakes talk now includes casual friendship/relationship subtypes, pair conversation modes and short-horizon warmth/ease/friction/attention texture are live, and life-sim follow-through now reflects those recent exchanges in later social state
```

```text
id                : r4-m1-material-visibility-2026-04-20
status            : closed
lane              : M1
bucket            : readability
severity          : medium
summary           : block pickup / carrying / placement was hard to witness in ordinary play, so shelter-building behavior read as mostly absent
what the tester saw: butterflies rarely followed through on block behavior long enough to make the material system feel real without debug help
expected instead  : calm garden play should show occasional pickup, carrying, and placement clearly enough that a player can tell the material loop exists
reproduction notes: host-local Windows + Chromium self-test; ordinary garden play near ambient blocks without forced pickup/place calls
source session    : local M1 self-test on 2026-04-20
owner files       : entities/butterfly.js, systems/lifeSimSystem.js, ui/gameUI.js, scripts/run-f7-material-visibility-audit.js
audit to rerun    : run-f7-material-visibility-audit.js, run-r7-block-visual-audit.js, run-r4-ui-readability-audit.js, run-runtime-self-audit.js
resolution notes  : butterflies now keep pursuing nearby block opportunities more reliably, follow through from pickup into carry/place more often, and surface lighter `shelter block` wording in the feed; the dedicated material-visibility audit and the broader block/UI audits are now green together
```

```text
id                : r4-m1-sustained-lag-2026-04-20
status            : closed
lane              : M1
bucket            : performance
severity          : high
summary           : the game no longer collapses into a black screen, but the host-local long-running save still feels extremely laggy during ordinary garden play
what the tester saw: the garden remained visibly heavy even after the freeze/black-screen hardening work, with sluggish motion and a low-FPS feel during the normal loop
expected instead  : the same long-running save should feel meaningfully smoother, not merely "less broken"
reproduction notes: host-local Windows + Chromium self-test on the long-running save after the latest freeze hardening pass
source session    : local M1 self-test on 2026-04-20, followed by runtime-hardening proof passes on 2026-04-21
owner files       : core/renderManager.js, core/gameCore.js, systems/telemetrySystem.js, systems/structureSystem.js, ui/gameUI.js, docs/ACTIVE-RUNTIME-HARDENING-BOARD.md, docs/RUNTIME-HARDENING-ROADMAP.md
audit to rerun    : run-h1-real-save-attribution-audit.js, run-f2-performance-hardening-audit.js, run-runtime-self-audit.js, real-save session capture export
resolution notes  : the live runtime stack is now frozen through `v7`, the committed exported long-running save is under `qa_logs/save_exports/2026-04-22T21-44-34-355Z-v0-5-derived-real/`, the shipped-default `h5` retest is green at `qa_screenshots/h5_long_running_save_smoothness_audit/2026-04-26T01-37-28-769Z/report.json`, and `v8a` runtime-only proof is frozen honestly in `qa_logs/session_captures/v8a-runtime-proof/REPORT.md`. Autosave serialization now defers out of the update tick, cadence-budget-overrun telemetry no longer inflates the main warning count, the strict 40-minute soak is green at `0 warnings / 0 errors / 0 freezeSuspects`, and the local blocker is no longer host-local smoothness. Carry forward only one watch item: the short battle lane still logged 4 freeze suspects inside the five-lane `v8a` pack, so recheck battle inside `v8b` after outside-session triage.
```

## Implementation Parity Audit

_Source: `docs/IMPLEMENTATION-PARITY-AUDIT.md`_

### Purpose

This audit compares current source-of-truth direction against the live runtime
at the frozen closure baseline.

Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish sequencing.

```text
source contract
      |
      v
live owner code
      |
      v
live / partial / active drift
```

### Current Summary

```text
+======================================================================+
| Parity Snapshot                                                      |
+======================================================================+
| UI shell / journal                     | live                        |
| carry / flower coherence               | live                        |
| wild ecology / release loop            | live                        |
| zone identity / incentives             | live                        |
| spatial model / pseudo-3D truth        | live                        |
| controls / overlay continuity          | live                        |
| live dispersal                         | live                        |
| crowded-zone optimization              | live                        |
| communication runtime                  | live                        |
| battle presentation                    | live                        |
| player/source docs                     | live                        |
+======================================================================+
```

### System Audit

#### 1. UI Shell / Journal

```text
source truth
|- readable in-window
|- basic identity visible first
`- dense content scrolls internally

live truth
|- journal shell fits in-window
|- summary header keeps preview, name, description, and parent context front-loaded
`- wheel scroll is content-only inside the current page viewport, not page-change

status
`- live
```

Primary seams:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

#### 2. Carry / Flower Coherence

```text
source truth
|- held objects should be stable
|- butterflies should not sleep while holding blocks
`- flowers should use the one-style visual direction

live truth
|- carried blocks resolve through one stable owner even after local carry-id drift
|- butterflies put blocks down before sleep and will not remain asleep while still carrying
`- flowers use one silhouette family with palette variation and normalize legacy type ids

status
`- live
```

Primary seams:
- `entities/butterfly.js`
- `entities/block.js`
- `entities/flower.js`
- `systems/physicsSystem.js`
- `systems/sleepSystem.js`
- `ui/debugUI.js`

Audit evidence:
- `scripts/run-a2-carry-flower-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`
- `scripts/run-deep-systems-audit.js`

#### 3. Wild Ecology / Release Loop

```text
source truth
|- progression ladder removed
|- wild ecology / release loop is primary
`- hybrid cap = 50

live truth
|- release-wave bookkeeping is live
|- Inspect owns release flow
|- cap pressure / emergence / travel use the 50-cap path
`- wild reappearance remains active even at hybrid cap

status
`- live
```

Primary seams:
- `core/gameCore.js`
- `core/progressionManager.js`
- `systems/breedingSystem.js`
- `ui/gameUI.js`

#### 4. Zone Identity / Cross-Zone Travel

```text
source truth
|- butterflies should move between zones for reasons
`- zones should feel behaviorally distinct

live truth
|- zones now expose explicit identity labels, tags, settle bias, and action-bias profiles
|- auto travel uses action-fit, novelty, crowd relief, and recent-zone memory
|- life-sim derived state now shifts after arrival so training/watchful/exploratory/calm zones feel different
|- moss-hollow once again settles as the highest-caution resident zone after travel churn
`- focused UI summaries now surface the stronger identity profile

status
`- live
```

Primary seams:
- `core/gameCore.js`
- `core/config.js`
- `systems/lifeSimSystem.js`
- `systems/zoneSystem.js`
- `ui/gameUI.js`

#### 5. Spatial Model / 3D Grid

```text
source truth
|- pseudo-3D garden with derived verticality and spatial rules
`- future free-3D work must not be mistaken for live runtime

live truth
|- current pseudo-3D runtime is documented canonically
|- focused-garden placement uses the shared section-scene region
`- physics / structure seams own the active spatial truth

status
`- live
```

Primary seams:
- `core/gridManager.js`
- `systems/structureSystem.js`
- `systems/physicsSystem.js`
- `docs/CURRENT-SPATIAL-TRUTH.md`

#### 6. Controls / Overlay Continuity

```text
source truth
|- simple button-first controls
`- specimen counts stay visible for testing

live truth
|- redundant global panel hotkeys were removed
`- debug overlays keep specimen counters visible

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `core/renderManager.js`

#### 7. Live Dispersal

```text
source truth
|- butterflies should spread, regroup, and spread again
`- gathering should be temporary, not permanent collapse

live truth
|- wander points use live sector occupancy
|- flower and block choices respect crowd pressure
`- settled gardens keep soft social grouping without one-patch collapse

status
`- live
```

Primary seams:
- `core/gameCore.js`
- `entities/butterfly.js`

Audit evidence:
- `scripts/run-a6-live-dispersal-audit.js`
- `scripts/run-w3-flower-ecology-audit.js`

#### 8. Crowded-Zone Optimization

```text
source truth
|- optimize by smarter cadence / caching
`- keep important simulation truth

live truth
|- runtime now uses a shared pressure profile
|- particle emission adapts to pressure and available pool headroom
|- decorative effects are pruned before important readability effects
|- crowded reply churn is throttled without removing dialogue truth
`- crowded-scene runtime is currently passing without deferred particle warnings

status
`- live
```

Primary seams:
- `systems/telemetrySystem.js`
- `core/renderManager.js`
- `systems/specialEffects.js`
- `systems/particleSystem.js`
- `systems/communicationSystem.js`
- `core/gameCore.js`

Audit evidence:
- `scripts/run-runtime-self-audit.js`
- `scripts/run-a6-live-dispersal-audit.js`

#### 9. Communication Runtime

```text
source truth
|- real dialogue should be intent + stance + memory shaped
|- signals are internal only
`- butterflies should have real name identity

live truth
|- hybrids now emerge with personal names instead of placeholder labels
|- duplicate living hybrid names keep the oldest unsuffixed and later duplicates gain one-letter display suffixes
|- butterflies now retain self-name identity and learn the names of butterflies they speak with or hear
|- spoken dialogue now carries intent family, intent subtype, and reply stance metadata
|- reply pacing is still live at 2.0 seconds
`- spoken lines now compose from talk mode, zone lexicon, register, tone, and relationship context instead of old full-line signal tables

status
`- live
```

Primary seams:
- `systems/communicationSystem.js`
- `systems/breedingSystem.js`
- `core/progressionManager.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-r6-communication-audit.js`

#### 10. Battle Presentation

```text
source truth
|- top-down arena
|- readable movement and consequence
|- projectiles / emitted effects where appropriate
`- flower-related battle behavior when called for

live truth
|- top-down staging is live and battle labels now use canonical butterfly identity
|- action families now show clearer attack / rally / guard / retreat reads
|- battle feeds now keep representative combat actions visible when side-effect events spike
|- projectiles / emitted effects now carry ability-specific visual styles
`- flower-related battle behavior is now live through Delicate Pink bloom/petal battle effects

status
`- live
```

Primary seams:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`

Audit evidence:
- `scripts/run-r5-battle-presentation-audit.js`
- `scripts/run-single-player-autobattle-audit.js`

#### 11. Source / Player Docs

```text
source truth
|- docs should match current runtime truth
`- historical plans should not masquerade as live behavior

live truth
|- guidebook, player guide, contracts, and diagram prompts now reflect the repaired runtime
|- the rebuilt source book carries current ecology, controls, accessibility, and battle shell truth
`- historical closure docs are now labeled as historical checkpoints instead of live status

status
`- live
```

Primary seams:
- `docs/PAPILIONEM-GUIDEBOOK.md`
- `docs/PAPILIONEM-PLAYER-GUIDE.md`
- `docs/WILD-ECOLOGY-RELEASE-CONTRACT.md`
- `docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`
- `docs/GEMINI-DIAGRAM-PROMPTS.md`
- `docs/source-book/PAPILIONEM-SOURCE-BOOK.md`
- `ui/gameUI.js`
- `ui/debugUI.js`

### Active Gap Order

```text
1. no active parity gap on the current board
```

### Closure Baseline

```text
2026-04-18
|- targeted closure reruns passed for runtime self, communication,
|  single-player autobattle, zone identity, and battle presentation
|- the battle presentation audit now evaluates a short combat window so
|  fast resolves do not create one-frame false negatives
`- broader frozen-baseline reruns also passed for controls, wild ecology,
   and UI readability
```

## Player-Facing Polish Audit

_Source: `docs/PLAYER-FACING-POLISH-AUDIT.md`_

### Purpose

This audit compares live runtime truth against how quickly and clearly a player
can read that truth from the current shell.

It starts after the 2026-04-18 frozen repair baseline and should not be used to
re-litigate already closed owner-system repairs unless a fresh runtime audit
fails.

```text
closure baseline
      |
      v
player-facing proof
      |
      v
visible polish gap or live polish truth
```

### Current Snapshot

```text
+======================================================================+
| Player-Facing Proof Snapshot                                         |
+======================================================================+
| inspect / single-butterfly shell      | live                         |
| feed / visible action grounding       | live                         |
| journal / roster glanceability        | live                         |
| battle shell comprehension            | live                         |
| release / ecology shell               | live                         |
| accessibility shell                   | live                         |
| debug-truth shell                     | live                         |
+======================================================================+
```

```text
closure state
|- the shared player-facing shell now reads cleanly across Inspect, Journal, feed, battle, release, accessibility, and debug-truth
|- screenshot-backed proof now exists in the final grand-plan audit artifact set
`- no active polish gaps remain on this board
```

### Audit Detail

#### 1. Inspect / Single-Butterfly Shell

```text
source truth
|- Inspect is the player-facing truth shell for one butterfly
`- the first read should surface identity, context, and current state quickly

live truth
|- Inspect now opens with a fixed hero summary and grouped section cards
`- identity, state, social, battle, and ecology reads land in a clearer top-to-bottom order

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `ui/butterflyCollection.js`

#### 2. Feed / Visible Action Grounding

```text
source truth
|- feed lines should reinforce what the player can plausibly see happening
`- text should not feel ahead of the garden

live truth
|- intent, stance, naming, and zone lexicon are live
|- communication timing and event ownership are already repaired
|- the shell now renders context-aware category cards instead of one flattened text wall
|- talk cards now ground speech with direct/open talk mode, zone context, and visible activity cues
`- action cards now carry short grounding lines instead of floating as pure text

closure proof
|- same-name speakers are disambiguated in the feed when stripped names would collide
`- `r6` now checks for grounded talk and action entries, not only legacy line strings

status
`- live
```

Primary seams:
- `systems/communicationSystem.js`
- `systems/lifeSimSystem.js`
- `ui/gameUI.js`

#### 3. Journal / Roster Glanceability

```text
source truth
|- Journal should archive long-term truth without becoming slow to scan
`- roster should show battle relevance quickly

live truth
|- collection, roster, rename, and battle-launch flows are live
|- strongest-team selection and readiness truth are live
|- collection and roster now open with badge-led summary cards and stronger section contrast
`- roster now surfaces membership, readiness tier, and nearby alternatives through a glance strip

closure proof
|- wheel-scroll, roster selection, and battle-launch flow still pass through the active audits
`- the shell now lands identity and battle relevance faster without reopening runtime repairs

status
`- live
```

Primary seams:
- `ui/butterflyCollection.js`
- `ui/gameUI.js`

#### 4. Battle Shell Comprehension

```text
source truth
|- battle should read clearly without debug overlays
|- action, consequence, and return flow should feel legible
`- visible combat should support the autobattle fantasy

live truth
|- battle presentation parity is repaired and the active audits are green
|- battle labels, event recency, and ability-styled effects are live
|- the shell now defaults to a focus view with clearer team-state cards, tagged feed rows, and stronger live comparisons
`- Return now reads as `Return to Garden` when the result is ready and the arena highlights the current focus

closure proof
|- `r5` and `single-player-autobattle` both now check for a populated focus shell and clearer return-state labels
`- the live battle read now lands action, consequence, and commit clarity faster without reopening combat truth

status
`- live
```

Primary seams:
- `systems/battleSystem.js`
- `core/renderManager.js`
- `ui/gameUI.js`

#### 5. Release / Ecology Shell

```text
source truth
|- release should remain the primary long-term ecology pressure flow
`- hybrid-cap behavior should stay understandable from the shell

live truth
|- Inspect owns release flow
|- release-wave bookkeeping and the 150-hybrid cap are audited live
`- current player-facing ecology rules now match the repaired runtime docs

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `core/progressionManager.js`
- `systems/breedingSystem.js`

#### 6. Accessibility Shell

```text
source truth
|- players should be able to tune readability from the live shell
`- current exposed controls should stay honest and usable

live truth
|- Access remains the player-facing home for contrast, trail, color, and UI-scale controls
`- control continuity audits are green

status
`- live
```

Primary seams:
- `ui/gameUI.js`
- `core/renderManager.js`

#### 7. Debug-Truth Shell

```text
source truth
|- debug should help testers verify truth without breaking the player shell
`- debug overlays must not hide key counters or lie about owner truth

live truth
|- debug is button-first
|- specimen counters remain visible
`- current closure audits are green here

status
`- live
```

Primary seams:
- `ui/debugUI.js`
- `ui/gameUI.js`

### Active Gap Order

```text
none
`- board frozen clean after the final screenshot-backed proof pass
```

## Intent and Exclusions Ledger

_Source: `docs/INTENT-AND-EXCLUSIONS-LEDGER.md`_

### Purpose

This ledger answers:

```text
what belongs now
what belongs later
what was removed on purpose
what should not be reintroduced by accident
```

### Current Classification Shape

```text
now
|- live now

later
`- deferred / later

never again
|- removed / superseded
`- do not reintroduce
```

The current implementation board is frozen clean, so this ledger does not keep a
separate `active intended` bucket right now. Open that bucket again only if a
fresh non-deferred phase is intentionally promoted.

### Live Now

```text
live now
|- multi-zone living garden
|- wild ecology / release loop
|- ecology depth with zone pressures, resource recovery, home ranges, and social ecology
|- top-down separate autobattle mode
|- grounded spatial garden with derived verticality, occupancy, shelter, carry, and stack truth
|- inspect / journal / feed / accessibility shell
|- DOM shell overlay as the default panel path for feed / access / inspect / journal / debug, while the top HUD stays canvas-owned
|- breeding lifecycle: egg -> caterpillar -> chrysalis -> butterfly
|- release via Inspect
|- hybrid lineage / journal persistence
|- English-only dialogue direction
|- internal-only signals as the intended communication support model
|- stronger zone identity and cross-zone motives
|- live dispersal that stays healthy after spawn
|- smarter crowded-zone optimization
|- true dialogue composer with intent / stance / memory
|- hybrid personal birth names and known-name memory
|- local model-backed ML scoring with inspect/debug explainability and fallback
|- cleaner one-style flower presentation
|- battle parity with differentiated special attacks
|- flower-related battle behavior where contracts call for it
`- source-book and expansion-doc alignment with frozen runtime truth
```

### Deferred / Later

```text
deferred / later
|- free-flight volumetric 3D or sandbox-style world rules beyond current grounded spatial truth
|- additional ecology expansion only if a fresh non-deferred board is opened
|- any future flower-carry redesign, if intentionally reintroduced
|- later ML runtime replacement / training-host decisions
|- online battle / multiplayer expansion
`- future expansion beyond the current frozen implementation baseline
```

### Removed / Superseded On Purpose

```text
removed / superseded
|- old rarity/progression unlock ladder
|- encounter/collection-based progression truth
|- pool-era mechanics as current gameplay
|- invented butterfly language
|- wing-flutter / antenna grammar as actual speech
|- player-facing signal feed channel
|- treating slang itself as "stupid speech"
`- generic global hotkeys as the primary normal-play control model
```

### Do Not Reintroduce By Accident

```text
do not reintroduce
|- old collection/encounter progression ownership
|- pool mechanics framed as current progression
|- signals as hidden words or dialogue replacement
|- all-zone telepathic open talk
|- multiple flower silhouette families as current visual direction
|- battle inheriting the angled garden plane
`- source docs claiming closure while visible drift remains
```

### Clarifying Boundaries

#### Flowers

```text
flowers
|- current truth: not carryable
|- current repair: one style family, better spread
`- future optional redesign: explicit carry behavior only if re-approved
```

#### Names

```text
names
|- wild butterflies: canonical identity names
|- hybrids: personal birth names
|- duplicate names: allowed
`- duplicate display suffix: temporary one-letter disambiguation
```

#### Signals

```text
signals
|- internal only
|- support direction / attention / coordination / urgency
`- not visible as their own player feed channel
```

#### Battle

```text
battle
|- top-down
|- readable stylized autobattle
|- projectiles and emitted effects where appropriate
`- not a full physics brawler
```

### Use Rule

When a feature question comes up, classify it here first:

```text
live now
deferred / later
removed / superseded
do not reintroduce
```

If a question does not fit cleanly, it should be discussed before implementation.

## Grand-Plan Closure Roadmap

_Source: `docs/GRAND-PLAN-CLOSURE-ROADMAP.md`_

### Scope

This roadmap is the reality-based closure plan for the Papilionem overhaul.

It now serves as a historical closure roadmap.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-REPAIR-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-REPAIR-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-PARITY-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-PARITY-AUDIT.md)
for the frozen closure baseline.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish sequencing.

It is intentionally anchored to:

- current implemented owner systems
- current contract docs
- current audited closure state

It does not treat removed Ephemera systems as active requirements.

Hard exclusions:

- no pool-driven progression
- no old Ephemera gameplay loops that were intentionally removed
- no placeholder battle/team structures that drift away from the locked contracts

### Historical Closure Snapshot

```text
╔════════════════════ Current Reality ════════════════════╗
║ life-sim foundation              │ real                ║
║ genetics / inheritance / stats   │ real                ║
║ wild ecology / release loop      │ real                ║
║ single-player autobattle         │ real                ║
║ ML decision layers M1-M4         │ real                ║
║ structure / shelter truth        │ real                ║
║ movement / stability polish      │ still rough         ║
║ Inspect / Journal readability    │ still rough         ║
║ battle presentation fidelity     │ still rough         ║
║ feed / communication grounding   │ still rough         ║
║ final shared visible QA closure  │ still required      ║
╚═════════════════════════════════════════════════════════╝
```

### Active Grand-Plan Items That Still Matter

These are still part of the intended direction even when implementation is only partial.

```text
active now
├─ living garden with social / memory / sleep / teaching truth
├─ breeding, genetics, lineage, and readable inherited stats
├─ wild ecology / release-driven lineage pressure
├─ single-player autobattle as a separate battle mode
├─ ML-backed decision layers that remain inspectable and auditable
├─ 3D-aware shelter / opening / occupancy understanding
├─ stronger visible communication and behavior proof
└─ final player-facing readability / polish passes
```

```text
still intended later
├─ richer battle presentation with clearer visible combat expression
├─ deeper communication realism and less primitive translated feed output
├─ fuller ML runtime maturity beyond the current local policy artifact path
└─ online battle as a later separately specified phase
```

### Closure Baseline

The following major contracts are already closed at the owner-system level:

- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\WILD-ECOLOGY-RELEASE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/WILD-ECOLOGY-RELEASE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\CLOSURE-AUDIT-MATRIX.md](C:/Users/fishe/Documents/projects/ephemera/docs/CLOSURE-AUDIT-MATRIX.md)

### Evidence-Based Remaining Gaps

#### 1. Movement And Stability Are Better, But Not Final

Current reality:

- physics, structure, and shove ownership are now separated cleanly
- zone-border-safe physics is in place
- structure / opening / carry truth is in place

Still active:

- vibration and rubberband edge cases need continued visible QA
- debug-spawn stress and dense-contact cases still need careful live validation
- movement truth is ahead of visual feel; the polish gap is real

#### 2. Inspect And Journal Need A Readability Pass

Current reality:

- genetics/stat surfacing exists
- inspect browsing and mate-list flow were modernized
- roster and battle surfaces exist

Still active:

- blur/high-contrast readability issues
- text size and overlap problems
- roster card overflow and button collisions

Conclusion:

- the systems are there
- the player-facing readability shell is not closed yet

#### 3. Battle Exists, But Presentation Still Needs Recovery

Current reality:

- top-right battle mode exists
- strongest-team auto-selection exists
- single-player autobattle resolves and commits back into garden truth
- battle posture and ML-driven decision inputs exist

Still active:

- arena visual corruption must stay gone in live play
- combatants need clearer visible engagement
- battle effects, abilities, and readable combat feedback need to better match the intended battle fantasy
- `Commit` must feel understandable as the post-battle return step, not like stray UI

Conclusion:

- battle is no longer missing
- battle presentation is still under-expressed

#### 4. Communication Is Real, But Player Proof Is Too Primitive

Current reality:

- communication systems, signals, and translation layers exist
- cognition and social context feed those systems

Still active:

- repetitive translated phrases
- weak visible-to-text alignment
- feed lines that imply movement or lessons more strongly than the butterflies visibly show

Conclusion:

- communication is implemented
- communication readability is not yet at the intended level

#### 5. Shared Visible Audit Closure Is Still Required

Current reality:

- focused script audits exist for genetics, progression, autobattle, ML, structure, runtime, and soak runs
- local-only audit tooling exists

Still active:

- player-visible QA must remain the final pass criteria for visual, UI, and battle-facing systems
- headless or state-only passes are not enough for closure

Conclusion:

- the audit stack is strong
- final closure still depends on visible browser verification

#### 6. Online Battle Remains Deferred

Current reality:

- single-player autobattle is the current battle scope

Still active later:

- online battle flow
- networking/sync/authority model
- online UX and validation rules

Conclusion:

- online play is still part of the larger intended direction
- it is intentionally not part of the current closure sprint

### Closure Plan From Here

```text
╔════════════════════ Remaining Phase Map ════════════════════╗
║ Closed  │ R1 movement stabilization                         ║
║ Closed  │ R2 zone transition reliability                    ║
║ Closed  │ R3 progression runtime rewrite                    ║
║ Next    │ R4 Inspect / Journal readability repair           ║
║ Next    │ R5 battle presentation recovery                   ║
║ Next    │ R6 feed / communication alignment                 ║
║ Next    │ R7 block visual cleanup                           ║
║ Final   │ R8 shared visible audit closure                   ║
╚═════════════════════════════════════════════════════════════╝
```

Reference execution plan:

- [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-RECOVERY-PLAN.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-RECOVERY-PLAN.md)

### Recommended Near-Term Execution Order

```text
1. R4  Inspect / Journal readability repair
2. R5  battle presentation recovery
3. R6  feed / communication alignment
4. R7  block visual cleanup
5. R8  shared visible audit closure
```

### Important Rule

```text
do not regress toward older false summaries:
├─ battle is not missing
├─ roster is not missing
├─ progression is not pool-based
├─ ML work is not absent
└─ wild exit logic is not missing
```

The current project state is:

```text
implemented foundation
        ▼
remaining readability / presentation / closure work
        ▼
later deferred systems like online battle
```

## Implementation Recovery Plan

_Source: `docs/IMPLEMENTATION-RECOVERY-PLAN.md`_

### Historical Status Notice

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

### Historical Recovery Snapshot

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

### Non-Negotiable Execution Rules

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

### Hard Blocker Bypass Rule

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

### Owner Boundaries

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

### Elegance Rules

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

### Phase Status

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

### Master Ordered Checklist

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

### Recovery Completion Snapshot

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

### Final Audit Closure

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

### Phase Advancement Rule

```text
do not start the next phase unless
├─ the current phase goal is met
├─ owner seams are still clean
├─ runtime checks pass
├─ visible QA passes where relevant
└─ regression checks do not re-break closed phases
```

## Source-Book De-Staling Rules

_Source: `docs/SOURCE-BOOK-DESTALING-RULES.md`_

### Purpose

This section defines how Papilionem's master source must stay aligned with the
actual live game.

The source book is the canonical reading copy, but it is only trustworthy when
its claims match:

- live runtime behavior
- current owner-system code
- current audits
- current intended direction that is still active

### Core Shape

```text
╔════════════════════ Section 5: Source-Book De-Staling ════════════════════╗
║ source docs        │ must describe current truth or active intended truth ║
║ stale claims       │ must be corrected, downgraded, or explicitly marked  ║
║ closed phases      │ cannot claim full closure if player-facing drift remains ║
║ rebuild cadence    │ update docs, then rebuild the source book            ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

```text
live code / runtime truth
          ▼
contract truth
          ▼
repair / audit truth
          ▼
source book chapter text
```

### Authority Order

```text
authority order
├─ 1. live owner-system behavior
├─ 2. active contracts
├─ 3. active repair plan / audit evidence
└─ 4. compiled source book output
```

Rules:

1. The compiled source book is not allowed to outrank live owner truth.
2. If the source book and live game disagree, the source book must be corrected.
3. If the live game is wrong but the contract is right, the source book must
   state that the system is partial or in-repair, not silently call it done.
4. Historical planning documents may remain, but they must not read as current
   truth without qualification.

### What Counts As Stale

```text
stale content
├─ claims a system is complete when the player can still see it is partial
├─ describes removed progression or legacy Ephemera behavior as current
├─ calls an audit or closure “green” after later regressions were found
├─ uses old naming after canonical naming changed
├─ describes older communication / battle behavior after contracts changed
└─ leaves superseded history unmarked as superseded
```

### Allowed Truth States

Every significant system description must resolve to one of these states:

```text
truth states
├─ live
│  └─ implemented and matches current runtime behavior
├─ active intended
│  └─ not fully implemented yet, but still part of the current direction
├─ partial
│  └─ some owner seam exists, but player-facing or runtime truth is incomplete
├─ superseded
│  └─ old direction kept only for history / migration context
└─ archived
   └─ no longer part of the active direction
```

Rules:

1. Do not call a system `live` if the player-facing behavior still contradicts
   the contract in obvious ways.
2. Use `active intended` for work we still mean to build.
3. Use `partial` when code exists but is visibly or structurally incomplete.
4. Use `superseded` for older progression/recovery ideas that no longer govern
   the game.
5. Use `archived` only when we intentionally no longer want that direction.

### Writing Rules

```text
do
├─ state the current truth plainly
├─ separate live behavior from active intention
├─ mention important limits or partial status
├─ mark superseded directions explicitly
└─ prefer exact system names and owner seams

do not
├─ over-celebrate a system as “closed” while active drift remains
├─ let old completion language survive by inertia
├─ treat audit history as current status without dates/context
└─ bury important caveats under optimistic summary text
```

### Repair Rule For Stale Docs

When a stale section is discovered:

```text
stale section found
      ▼
compare with live runtime + owner code + contracts
      ▼
decide correct truth state
      ▼
rewrite the source section
      ▼
rebuild source book
      ▼
verify compiled book no longer overstates reality
```

Required rewrite outcomes:

1. downgrade overclaimed completion to `partial` where needed
2. replace old progression language with wild-ecology truth where applicable
3. mark old recovery milestones as historical if later drift reopened the area
4. preserve useful history, but never let it masquerade as current state

### Chapter-Specific Rules

#### Orientation / Guidebook Chapters

1. Must describe the current live shape of the game.
2. Must not teach removed mechanics as if they still exist.
3. Must use current naming for butterflies, abilities, modes, and tabs.

#### Core Contracts

1. Must describe the intended active rules clearly.
2. If runtime is behind the contract, that mismatch must be discoverable in the
   repair/audit chapters rather than hidden by optimistic wording.
3. Contracts should not pretend implementation is already equal to design.

#### Implementation / Recovery Chapters

1. Must distinguish:
   - historical closures
   - current repair work
   - reopened drift
2. `complete` means the player-facing and runtime truth currently hold, not
   just that a past audit once passed.
3. If new regression evidence appears later, the text must be revised.

#### Audit Chapters

1. Audit summaries must include when they were true.
2. A past green audit cannot be used as present-tense proof after later drift.
3. Audit chapters should support confidence, not replace current verification.

### Source-Book Build Rule

```text
edit source docs
      ▼
run build-source-book
      ▼
inspect compiled markdown/html/pdf
      ▼
confirm stale claims are removed or marked
```

Rules:

1. The source book must be rebuilt after any material source-doc correction.
2. Rebuild alone is not enough; compiled output must be spot-checked for stale
   language that survived through included historical chapters.
3. If a historical chapter is intentionally preserved, its status must be made
   obvious in the text around it.

### Required Active Repair Board Alignment

The master source must honestly reflect the current active repair board:

```text
active repair board
├─ 1. live dispersal behavior
├─ 2. crowded-zone optimization
├─ 3. real dialogue composer
├─ 4. battle presentation parity
└─ 5. source-book de-staling
```

Rules:

1. These must not be described as fully resolved until the live game and audits
   actually show them resolved.
2. If one of these is only partially improved, the source book must say so.
3. Section 5 exists to keep the master book from hiding the other four.

### Definition Of Done For Section 5

```text
pass if
├─ master source no longer overstates system completion
├─ active intended systems are clearly separated from live systems
├─ superseded progression/recovery language is marked or corrected
├─ battle / dialogue / dispersal status is described honestly
└─ rebuilt source book matches the corrected source docs
```

### First Audit Targets

1. `IMPLEMENTATION-RECOVERY-PLAN.md`
2. `PAPILIONEM-GUIDEBOOK.md`
3. `SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md`
4. `COMMUNICATION-LANGUAGE-CONTRACT.md`
5. compiled `PAPILIONEM-SOURCE-BOOK.md`

### Implementation Order

```text
1. identify overstated or superseded claims
2. compare each against live runtime + current contracts
3. rewrite with correct truth state labels
4. rebuild the source book
5. spot-check compiled chapters for surviving drift
6. repeat until the compiled master book is honest
```

## Recovery Blocker Ledger

_Source: `docs/RECOVERY-BLOCKER-LEDGER.md`_

This ledger is for genuine hard blockers encountered during autonomous recovery
work.

Use it when a blocker is:

- real
- specific
- not safely fixable inside a short bounded recovery pass
- but still safely bypassable so the roadmap can continue

Do not use it for ordinary bugs that can be fixed inside the current phase.

### Entry Rules

```text
every blocker entry must include
├─ id
├─ phase
├─ date
├─ blocker summary
├─ why it blocked progress
├─ exact file paths / functions / systems involved
├─ exact failing command or runtime path
├─ key error output or visible evidence
├─ bounded recovery attempts already tried
├─ chosen bypass path
├─ validations deferred
├─ downstream phases to re-check
├─ recommended revisit point
└─ current status
```

### Status Values

```text
status
├─ deferred
├─ bypassed
├─ revisiting
└─ resolved
```

### Entry Template

```text
id:
phase:
date:

blocker summary:

why it mattered:

exact scope:
├─ files:
├─ functions:
└─ systems:

failing path:

evidence:

bounded recovery attempts:
1.
2.
3.

chosen bypass path:

validations deferred:
1.
2.

downstream phases to re-check:
1.
2.

recommended revisit point:

status:
```

### Active Entries

None yet.

## Current Spatial Truth

_Source: `docs/CURRENT-SPATIAL-TRUTH.md`_

### Purpose

This document separates the **live spatial runtime** from:

- the legacy/debug isometric grid
- farther volumetric / sandbox-style 3D ideas
- ambiguous shorthand like "the game is 3D"

It exists to answer one question clearly:

```text
╔════════════════════ Current Spatial Stack ════════════════════╗
║ live now            │ grounded garden + occupancy/carry truth║
║ legacy still used   │ 18x18 iso grid for debug/conversion    ║
║ future only         │ volumetric / sandbox-style 3D work     ║
╚═══════════════════════════════════════════════════════════════╝
```

### Live Runtime Shape

```text
focused garden
├─ movement space
│  └─ screen-space roam polygon
├─ legal placement space
│  └─ shared focused-garden placement region
├─ logical ecology zones
│  └─ zone ids for ownership / travel / spawning / counts
├─ derived verticality
│  └─ z-index + zLift + carry / stack / shelter cues
└─ dynamic physical truth
   └─ physicsSystem + structureSystem + gameCore clamps
```

### Hard Truths

#### 1. Butterflies do not inhabit a free volumetric 3D space

```text
live movement
├─ x / y ground-plane travel      │ yes
├─ derived elevation cues         │ yes
├─ free flight volume             │ no
├─ arbitrary y-axis hovering      │ no
└─ rigid-body airborne motion     │ no
```

Butterflies live on a grounded pseudo-3D plane with later-3D occupancy,
shelter, carry, and contact truth layered onto it.

They can show:

- carry lift
- stack-relative lift
- shelter/interior context
- sleep/down-state posture

But they are not moving through a fully simulated open 3D volume.

#### 1b. Taller structures do not mean a separate altitude-band butterfly sim is live

```text
live now
|- taller block stacks / shelter columns        | yes
|- carry / stack-relative lift cues             | yes
|- grounded doorway / warp staging              | yes
`- separate butterfly altitude-band world model | no
```

The current build can support taller structures and clearer vertical cues,
including homes formed higher on a stack, without promoting butterflies into a
new free-roaming altitude system.

That means:

- taller shelter structures are real
- render and occupancy height cues are real
- butterflies can look meaningfully higher or lower relative to structure truth
- but there is still no separately simulated `0..10 block` butterfly altitude
  habitat layer in the live runtime

#### 2. The 18x18 isometric grid is still real, but it is not the live garden boundary owner

```text
18x18 iso grid
├─ debug overlays                  │ yes
├─ iso/screen conversion helpers   │ yes
├─ legacy tile reasoning           │ yes
└─ final section-scene roam bounds │ no
```

The live focused garden clamps movement and placement against:

- world roam polygon
- doorway avoidance polygons
- shared placement region
- structure constraints

Not against the old debug grid alone.

#### 3. Section-scene zones are logical ecology zones, not four simultaneous physical rooms

```text
section-scenes
├─ focused view shows one shared garden space
├─ zone ids still matter for ecology truth
├─ zone travel swaps logical zone ownership
└─ overview map regions are not the same as focused movement bounds
```

This means:

- zone identity is real
- zone counts are real
- zone-specific spawning/travel ownership is real
- but focused-garden placement is intentionally shared across section-scenes

#### 4. Physics ownership is already partly live

```text
live owners
├─ physicsSystem     │ contacts, impulses, carry anchors, final clamps
├─ structureSystem   │ openings, interiors, occupancy columns, body fit
├─ gameCore          │ zone travel, roam clamping, fallback separation
├─ butterfly/block   │ intent + state, not final world authority alone
└─ renderManager     │ visual depth read only
```

So the later 3D track must be read as:

- expansion of live pseudo-3D seams that is now already landed
- not creation of spatial ownership from nothing

### What Is Live Right Now

```text
live now
├─ roam polygon and doorway avoidance
├─ shared focused-garden placement region
├─ logical zone ids and zone travel
├─ structure-derived shelter / opening / body-fit truth
├─ occupancy bands and legal shelter traversal
├─ carried-block anchors with zLift
├─ block stacks / occupancy columns
├─ physics contact / impulse / clamp ownership
└─ render-order verticality
```

### What Is Not Live Yet

```text
not live yet
├─ free-flight volumetric movement
├─ broad rigid-body object simulation
├─ literal "move anywhere in 3D space" world rules
└─ a second sandbox-like world model beyond current grounded zones
```

Additional boundary:

- the current build still does **not** include a separate altitude-band
  butterfly home / hanging routine layer
- taller structures and stronger vertical cues do not change that truth by
  themselves

### Ownership Summary

```text
╔══════════════════ Spatial Ownership Summary ══════════════════╗
║ gridManager       │ conversion helpers + roam/placement clamp ║
║ physicsSystem     │ dynamic contact / impulse / carry motion  ║
║ structureSystem   │ static derived structure truth            ║
║ gameCore          │ zone ownership / travel / fallback clamp  ║
║ renderManager     │ visual depth and projection only          ║
╚════════════════════════════════════════════════════════════════╝
```

### `s0` Owner Ledger

| Spatial surface | Current owner | Live seam | `s0` note |
| --- | --- | --- | --- |
| board bounds + legal placement | `core/config.js` + `core/gameCore.js` | `PAPILIONEM_LAND_MAP.roamPolygon`, `PAPILIONEM_SECTION_PLACEMENT_REGION`, `clampPlacementPointInZone()` | config declares the shapes; gameCore performs the final clamp/handoff |
| doorway mouths + corridor staging | `core/gameCore.js` | `getZoneDoorwayAnchor()`, `getZoneDoorwayTravelProfile()`, `buildZoneTravelRoute()` | staged travel is live, but still compensates around mismatched board geometry |
| debug iso conversion | `core/gridManager.js` | `grid.cellSize`, `tileWidth`, iso/screen helpers | this still exists, but it is not the live boundary owner and must become debug-only after `s1` |
| dynamic contact + clearances | `systems/physicsSystem.js` | physics state, separation, carry anchors, final movement clamps | several clearances still derive from render-size heuristics rather than one canonical board unit |
| static occupancy + support + body fit | `systems/structureSystem.js` | occupancy columns, openings, verticality, `getBlockSupportContext()`, `resolveBodyFitForEntity()` | occupancy semantics are strong, but the underlying unit contract is not yet singular |
| visual projection + covered-path hiding | `core/renderManager.js` | covered travel rendering, visual depth sort | presentation-only; it may read the route but must never own the route geometry |

### `s0` Seam Ledger

```text
confirmed live seams
├─ board shape split
│  ├─ roam polygon
│  ├─ focused-garden placement region
│  └─ doorway path / cover / spawn anchors
│
├─ unit split
│  ├─ block render width / render height
│  ├─ debug iso cell / tile conversions
│  └─ occupancy column spacing / support step
│
├─ footprint split
│  ├─ butterflies and blocks lean on render-derived clearances
│  └─ flowers / eggs / cocoons / caterpillars do not all advertise one canonical footprint
│
├─ route split
│  ├─ travel phases are staged
│  └─ but corridor geometry is still screen-shape compensation, not one board-derived corridor stack
│
└─ owner tension already resolved on paper
   ├─ `core/gameCore.js` -> spatial track tie-breaker
   ├─ `core/config.js`   -> runtime track tie-breaker
   └─ `core/renderManager.js` stays presentation-only
```

Use [CROSS-TRACK-ARBITRATION.md](./CROSS-TRACK-ARBITRATION.md) as the owner
tie-breaker whenever the runtime, spatial, and social boards want the same
shared file.

### `s0` Later Audit Checklist

```text
later proof lanes that must read the same spatial contract
├─ zone transition / dispersal
├─ spatial truth
├─ carry / stack / block visual
├─ runtime self audit
├─ long-running save reload after `s7`
└─ manual route captures across opposite-side doorways on the lived-in save
```

### `s1` Contract Lock

The canonical unit lock now lives in [SPATIAL-UNIT-CONTRACT.md](./SPATIAL-UNIT-CONTRACT.md).

```text
s1 locked rule
├─ 1 block = 1 board unit
├─ 1 block = 1 support / stack unit
├─ renderWidth/renderHeight stay presentation-only
└─ the 18x18 iso grid is debug-only, not a second spatial authority
```

### Implementation Rule

Any future work must explicitly state whether it is changing:

```text
1. legacy/debug grid truth
2. live focused-garden pseudo-3D truth
3. beyond-current volumetric / sandbox-style 3D truth
```

If that distinction is not clear, the change is not ready.

## Later 3D Physics Implementation Plan

_Source: `docs/LATER-3D-PHYSICS-IMPLEMENTATION-PLAN.md`_

### Purpose

This document locks the implementation plan for the later 3D physics phase.

Read this together with:

- [CURRENT-SPATIAL-TRUTH.md](C:/Users/fishe/Documents/projects/ephemera/docs/CURRENT-SPATIAL-TRUTH.md)

This document is **future-facing**. It must not be read as a claim that all of
the described 3D ownership is already live.

For future promoted execution order, use
[ACTIVE-EXPANSION-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-EXPANSION-BOARD.md)
as the authoritative ladder.

Read the `P1`-`P6` sequence below as this contract's local decomposition of the
later 3-D work, not as a competing expansion board.

It exists so we can add physical truth to Papilionem without drifting into:

- generic engine behavior that does not fit the game
- duplicate owners for movement, collision, and structure truth
- old Ephemera/pool-era mechanics we already removed

The goal is not "full physics sandbox."

The goal is:

```text
butterflies should move, collide, carry, enter, build, shove, and battle
in a way that feels spatially honest inside Papilionem's world.
```

### What 3D Means In This Game

```text
╔════════════ Papilionem 3D Model ════════════╗
║ screen plane        │ x / y movement        ║
║ derived elevation   │ stack / roof / carry  ║
║ occupancy volumes   │ body-fit + collisions ║
║ openings            │ valid entry corridors ║
║ interiors           │ shelter usage truth   ║
║ impulses            │ shove / knockback     ║
╚═════════════════════════════════════════════╝
```

This is a **discrete pseudo-3D physical model**, not a freeform rigid-body sim.

We will use:

- continuous motion on the ground plane
- discrete height bands for stacks / roofs / carried objects
- derived occupancy volumes for blocking and shelter use
- short-lived impulses for shoves, impacts, and knockback

We will **not** use:

- free-spinning rigid blocks
- broad general-purpose gravity
- physics that fights the existing aesthetic or movement style

### Zone Border Invariant

```text
╔════════════ Zone Border Invariant ════════════╗
║ later 3D physics must remain inside the same  ║
║ legal visible zone boundaries we already use. ║
╚════════════════════════════════════════════════╝
```

3D physics must not create a second world edge outside the current zone borders.

That means:

- butterflies must remain inside the current legal roam region for their zone
- shove, recoil, slide, separation, and knockback must all resolve back inside that same legal region
- shelter/opening logic must work **within** zone borders, not replace them
- carried blocks and placed blocks must also stay inside legal zone placement bounds
- no physics step may push a butterfly or a block outside the visible playable area

#### Border ownership

```text
zone border truth
├─ gameCore / zoneSystem own legal zone bounds
├─ structureSystem owns internal structure constraints
└─ physicsSystem resolves motion inside both
```

#### Resolution order

```text
movement intent
▶ collision / impulse resolution
▶ structure constraints
▶ zone-border clamp
▶ final committed x/y
```

#### Existing seams to reuse

- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - `clampScreenPointToRoamArea(...)`
  - current zone travel anchors and arrival targets
- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
  - opening corridors
  - interior bounds
  - body-fit truth

The later 3D phase must extend those seams, not replace them.

### Current Grounded Runtime Truth

The current live truth is documented canonically in:

- [CURRENT-SPATIAL-TRUTH.md](C:/Users/fishe/Documents/projects/ephemera/docs/CURRENT-SPATIAL-TRUTH.md)

This section is only a bridge into the later expansion plan.

```text
╔════════════ Current Owners ════════════╦════════════════════════════════════╗
║ owner                                  ║ current responsibility            ║
╠════════════════════════════════════════╬════════════════════════════════════╣
║ [structureSystem.js]                   ║ derived structure / shelter truth ║
║ [gameCore.js]                          ║ path blocking + separation loop   ║
║ [butterfly.js]                         ║ movement intent + carry behavior  ║
║ [block.js]                             ║ stack/carry placement state       ║
║ [teachingSystem.js]                    ║ training impacts + HP/pressure    ║
║ [renderManager.js]                     ║ draw ordering / z-index           ║
║ [lifeSimSystem.js]                     ║ spatial awareness summaries       ║
║ [mlInferenceSystem.js]                 ║ choice layers, not collision      ║
╚════════════════════════════════════════╩════════════════════════════════════╝
```

Important current seams:

- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
  - already owns:
    - shelter components
    - opening corridors
    - body-fit checks
    - point blocking
    - carry anchors
    - placement target selection
- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)
  - currently owns:
    - `resolveButterflySeparation`
    - `isScreenPointBlockedForButterfly`
    - zone travel movement
- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
  - currently owns:
    - movement target choice
    - block pickup / carry / place flow
    - direct carried-block pose updates
- [teachingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/teachingSystem.js)
  - currently owns:
    - training contact detection
    - impact HP / pressure changes
    - but not real physical knockback truth

### Ownership Plan

```text
╔════════════ Target Ownership Map ════════════╗
║ butterfly / caterpillar                      ║
║  └─ intent only                             ║
║     ├─ desired move target                  ║
║     ├─ desired speed                        ║
║     ├─ desired posture                      ║
║     └─ desired carried-object action        ║
║                                             ║
║ structureSystem                             ║
║  └─ static derived spatial truth            ║
║     ├─ block occupancy columns              ║
║     ├─ openings / interiors / roofs         ║
║     ├─ body-fit constraints                 ║
║     └─ valid placement geometry             ║
║                                             ║
║ physicsSystem                               ║
║  └─ dynamic physical truth                  ║
║     ├─ contact detection                    ║
║     ├─ collision resolution                 ║
║     ├─ impulses / knockback                 ║
║     ├─ separation / pushback                ║
║     ├─ carried-object attachment motion     ║
║     └─ final resolved positions             ║
║                                             ║
║ teachingSystem                              ║
║  └─ impact intent only                      ║
║     └─ asks physicsSystem to apply shove    ║
╚══════════════════════════════════════════════╝
```

#### Hard ownership rules

```text
do not allow
├─ butterfly.js to finalize collision-resolved x/y alone
├─ teachingSystem to directly fake knockback by teleporting
├─ structureSystem to own dynamic impulse state
├─ physicsSystem to own permanent structure truth
└─ ML to mutate collision truth directly
```

### New Runtime Layer

Create:

- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

It should become the single owner for:

- dynamic contacts
- dynamic impulses
- collision resolution
- final per-frame resolved movement
- short-lived physical state caches

### Runtime Data Shape

```text
╔════════════ Entity Physics State ════════════╗
║ position        │ x, y, zLift                ║
║ velocity        │ vx, vy                     ║
║ intent          │ desiredDx, desiredDy       ║
║ body            │ radius, width, clearance   ║
║ contact flags   │ grounded / blocked / inside║
║ impulse state   │ ix, iy, decayFrames        ║
║ carry state     │ attachedObjectId / anchor  ║
║ collision mask  │ butterfly / block / roof   ║
╚═══════════════════════════════════════════════╝
```

Suggested container shape:

```js
entity.physics = {
  velocity: { x: 0, y: 0 },
  intent: { x: 0, y: 0 },
  impulse: { x: 0, y: 0, frames: 0, source: null },
  body: {
    radius: 0,
    width: 0,
    clearance: 1,
    liftBand: 'ground'
  },
  contact: {
    blocked: false,
    blockedByIds: [],
    touchedButterflyIds: [],
    touchedBlockIds: [],
    insideShelter: false,
    openingTransition: false
  },
  carry: {
    attachedObjectId: null,
    anchor: null
  }
};
```

#### Persistence rule

Persist only durable, meaningful truth:

- attached carry ownership if the object is currently carried
- maybe a short carry phase if needed for continuity

Do **not** persist:

- velocity
- impulses
- contact lists
- per-frame collision caches
- resolved push vectors

Those must rebuild after load.

### Spatial Model

```text
╔════════════ Space Layers ════════════╗
║ Layer 0 │ ground roam plane          ║
║ Layer 1 │ low stack / wall body      ║
║ Layer 2 │ tall stack / roof band     ║
║ Layer 3 │ carried-object lift band   ║
╚═══════════════════════════════════════╝
```

#### Static structure truth stays in `structureSystem`

It already has most of the right language:

- occupancy columns
- opening profiles
- interior bounds
- shelter points
- body-fit checks

For the physics phase, extend it to expose **collision-ready geometry**:

```text
per component
├─ opening corridor volume
├─ interior volume
├─ roof footprint
├─ wall occupancy columns
└─ side normals for push response
```

#### Dynamic truth moves to `physicsSystem`

`physicsSystem` should query `structureSystem`, then resolve:

- can the butterfly step here?
- is this a soft contact or hard stop?
- does this movement cross an opening corridor correctly?
- should the entity slide, stop, or bounce slightly?

### Contact Matrix

```text
╔════════════ Contact Rules ════════════╦══════════════════════════════════════╗
║ pair                                  ║ rule                                 ║
╠═══════════════════════════════════════╬══════════════════════════════════════╣
║ butterfly ↔ butterfly                 ║ soft push / separation / overlap fix ║
║ butterfly ↔ low block                 ║ can pass if clearance allows         ║
║ butterfly ↔ tall stack / wall         ║ hard block + slide                   ║
║ butterfly ↔ opening corridor          ║ valid transition channel             ║
║ butterfly ↔ too-narrow opening        ║ reject + nudge away                  ║
║ butterfly ↔ shelter interior          ║ allowed only if body-fit passes      ║
║ carried block ↔ wall/opening          ║ attachment follows carrier limits    ║
║ placed block ↔ placed block           ║ snap / stack / reject invalid pose   ║
║ training impact ↔ butterfly           ║ shove impulse + readable recoil      ║
╚═══════════════════════════════════════╩══════════════════════════════════════╝
```

### Movement Resolution Pipeline

```text
╔════════════ Per-Frame Pipeline ════════════╗
║ 1. lifeSim / ML choose intent             ║
║ 2. butterfly writes desired movement      ║
║ 3. physicsSystem gathers contacts         ║
║ 4. physicsSystem applies impulses         ║
║ 5. physicsSystem resolves blocking/slide  ║
║ 6. physicsSystem updates carried anchors  ║
║ 7. final x/y/zLift committed              ║
║ 8. renderManager draws resolved result    ║
╚════════════════════════════════════════════╝
```

#### Exact behavioral rule

Butterflies should no longer directly "own" final movement position.

Instead:

- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js) chooses target and desired direction
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js) resolves what movement is physically allowed
- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js) orchestrates update order

### Block Placement And Collision Rules

```text
╔════════════ Block Placement Truth ════════════╗
║ valid placement only if                        ║
║  ├─ inside zone roam area                      ║
║  ├─ not inside opening corridor                ║
║  ├─ not clipping occupied stack volume         ║
║  ├─ supported by ground or legal support block ║
║  └─ does not trap interior path illegally      ║
╚════════════════════════════════════════════════╝
```

#### Placement behavior

Ground placement:

- snaps to clear ground candidate
- rejects opening-corridor conflict
- rejects overlap with existing occupancy column

Stack placement:

- requires support block footprint match
- inherits component membership
- updates occupancy column height

Invalid placement:

- should preview as blocked locally
- should fall back to nearest valid placement point
- should never silently place inside an opening corridor

### Carry Physics

Current carry truth is already close, but it should become physics-owned.

```text
current
butterfly updates carried block pose directly

target
physicsSystem resolves carrier motion
└─ then computes carried block final anchor pose
```

#### Carry rules

- carried block stays attached to a resolved anchor, not a pre-collision target
- if the butterfly is blocked by an opening or wall, the carried block follows that blocked result
- if a carried block would clip a too-narrow opening, the whole carry action is blocked or rerouted
- carried blocks do not spin freely
- carry orientation may visually bias, but logical placement stays discrete and stable

### Butterfly ↔ Butterfly Physics

Current `resolveButterflySeparation` in [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js) is a good seed, but it is too late-stage and too simple for the final phase.

Move this into `physicsSystem` and expand it:

```text
soft-contact model
├─ idle overlap      │ gentle separation
├─ moving pass-by    │ lateral slide
├─ high-speed impact │ shove impulse
└─ training impact   │ stronger directed knockback
```

#### Goals

- stop sprite fusion / perfect overlap
- stop vibration caused by repeated last-frame pushes
- make contact readable without looking heavy or chaotic

### Training Grounds Physics

This is where the later 3D physics phase matters most for readability.

Current state:

- [teachingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/teachingSystem.js) detects impact
- HP / pressure changes are real
- physical consequence is still under-expressed

#### Target behavior

```text
training impact
├─ contact detected by teachingSystem
├─ impact intent sent to physicsSystem
├─ physicsSystem applies short shove impulse
├─ target recoils visibly
├─ HP/pressure update remains in teachingSystem/battle truth
└─ Inspect/UI reflects the result already
```

#### Design rule

Keep combat stats and damage truth separate from physical shove truth.

- `teachingSystem` owns battle-state change
- `physicsSystem` owns recoil motion

### Butterfly ↔ Shelter Interaction

This is where the current narrow 3D phase becomes full physical truth.

```text
╔════════════ Shelter Movement Rules ════════════╗
║ entering shelter                               ║
║  ├─ must approach through opening corridor     ║
║  ├─ must pass body-fit check                   ║
║  ├─ may slide along wall if near-miss          ║
║  └─ cannot teleport across shell boundary      ║
║                                                ║
║ inside shelter                                 ║
║  ├─ movement constrained to interior bounds    ║
║  ├─ exit prefers opening corridor              ║
║  └─ blocked state shown if trapped             ║
╚═════════════════════════════════════════════════╝
```

### Rendering Implications

We do not need a new art style, but we do need clearer physical cues.

```text
render implications
├─ zLift derived from resolved physics state
├─ carried block draw pose from resolved anchor
├─ inside-shelter entities draw consistently under roof logic
├─ shove/impact uses short displacement + subtle effect
└─ shadow rules come from final resolved lift band
```

Files likely touched:

- [renderManager.js](C:/Users/fishe/Documents/projects/ephemera/core/renderManager.js)
- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
- [block.js](C:/Users/fishe/Documents/projects/ephemera/entities/block.js)

### AI / ML Integration

ML should **read** physics summaries, not own physics.

```text
physics feeds ML
├─ blockedAhead
├─ recentImpact
├─ currentPushPressure
├─ interiorAccess
├─ openingReachability
├─ carryBlocked
└─ localCrowding
```

This should enrich:

- action selection
- target selection
- risk posture
- autobattle posture

But the model must never directly override collision truth.

### Debug / Audit Plan

Keep this local-only, like the soak tooling.

#### New local-only audit runners

```text
scripts/
├─ run-3d-physics-contact-audit.js
├─ run-3d-physics-structure-audit.js
├─ run-3d-physics-training-audit.js
└─ run-3d-physics-long-soak-regression.js
```

#### What each audit should prove

```text
contact audit
├─ no butterfly fusion
├─ no vibration loops near obstacles
├─ no ghosting through tall stacks
└─ stable slide-along-wall behavior

structure audit
├─ valid opening entry only
├─ interior usage consistency
├─ body-fit rejection works
└─ carried block respects opening width

training audit
├─ shove impulse visible
├─ HP/pressure still correct
├─ no launch-to-infinity bug
└─ no battle-state leak

long-soak regression
├─ breeding still works
├─ mutations still persist
├─ wild ecology / release loop still canonical
├─ structure usage remains valid
└─ performance remains acceptable
```

### Phase Rollout

```text
mapping to authoritative expansion ladder
|- P1 + P2 -> b1
|- P3      -> b2 + b3
|- P4      -> b4
|- P5      -> b5
`- P6      -> b6 + b7
```

```text
╔════════════ Later 3D Physics Rollout ════════════╗
║ P1. physicsSystem scaffold                        ║
║ P2. butterfly contact + separation rewrite       ║
║ P3. structure collision + slide resolution       ║
║ P4. carry / placement / opening collision truth  ║
║ P5. training-ground shove / knockback            ║
║ P6. render polish + audit closure                ║
╚═══════════════════════════════════════════════════╝
```

#### P1. `physicsSystem` scaffold

Add:

- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

Touch:

- [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)

Deliver:

- registration hooks
- per-entity physics container
- update ordering seam
- no behavior change yet

#### P2. butterfly contact + separation rewrite

Replace:

- `resolveButterflySeparation` in [gameCore.js](C:/Users/fishe/Documents/projects/ephemera/core/gameCore.js)

Deliver:

- stable soft push
- moving-pass slide
- overlap elimination without vibration

#### P3. structure collision + slide resolution

Extend:

- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

Deliver:

- wall/stack hard stop
- slide along obstacle edge
- opening-aware transition
- interior-bound enforcement

#### P4. carry / placement / opening collision truth

Touch:

- [butterfly.js](C:/Users/fishe/Documents/projects/ephemera/entities/butterfly.js)
- [block.js](C:/Users/fishe/Documents/projects/ephemera/entities/block.js)
- [structureSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/structureSystem.js)
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)

Deliver:

- carried block anchor uses resolved physics state
- carry cannot clip through openings
- placement rejects corridor conflicts physically and logically

#### P5. training-ground shove / knockback

Touch:

- [teachingSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/teachingSystem.js)
- [physicsSystem.js](C:/Users/fishe/Documents/projects/ephemera/systems/physicsSystem.js)
- [gameUI.js](C:/Users/fishe/Documents/projects/ephemera/ui/gameUI.js) if readout tweaks are needed

Deliver:

- readable recoil
- no fake teleport shove
- no duplicate ownership of HP / pressure / motion

#### P6. render polish + audit closure

Touch:

- [renderManager.js](C:/Users/fishe/Documents/projects/ephemera/core/renderManager.js)
- [gameUI.js](C:/Users/fishe/Documents/projects/ephemera/ui/gameUI.js)
- local-only audit scripts

Deliver:

- cleaner visual truth
- final local audit stack
- long-soak regression rerun

### Invariants

```text
must remain true
├─ no old Ephemera/pool mechanics reintroduced
├─ structure truth stays derived, not hand-authored cache
├─ physics truth stays dynamic, not persisted bulk state
├─ battle stats are not replaced by physical motion
├─ ML never becomes collision source-of-truth
├─ carried blocks remain discrete placements, not ragdolls
└─ openings remain the legal shelter transition seam
```

### Risks To Watch

```text
highest-risk regressions
├─ butterfly vibration from repeated push/resolve loops
├─ carried block jitter at obstacle edges
├─ wall-slide causing zone-border clipping
├─ shelter entry false positives
├─ training knockback looking too violent or too weak
└─ performance collapse from broad pairwise checks
```

### Performance Rules

- prefer broad-phase grouping by zone and local radius
- reuse structureSystem block profiles instead of recomputing geometry in physics
- keep impulses short-lived and small
- only run expensive contact checks for nearby entities
- keep local-only physics audits out of the shipped build

### Exact Next Implementation Order

```text
1. add physicsSystem scaffold
2. move butterfly separation into physicsSystem
3. add structure collision + slide resolution
4. migrate carry/placement resolution to physicsSystem
5. add training shove / knockback
6. run local audit stack
7. rerun long-soak regression
```

### Definition Of Done

```text
later 3D physics is done when
├─ butterflies no longer fuse or vibrate under contact
├─ stacked blocks block movement honestly
├─ shelter entry/exit only occurs through valid openings
├─ carried blocks move and place without jitter or clipping
├─ training impacts cause readable recoil
├─ no major regression appears in long-soak proof
└─ all of this stays aligned with current contracts and no old mechanics return
```

## Closure Audit Matrix

_Source: `docs/CLOSURE-AUDIT-MATRIX.md`_

### Purpose

This matrix is the phase-one closure baseline for Papilionem.

It now serves as a historical closure checkpoint.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-REPAIR-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-REPAIR-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-PARITY-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-PARITY-AUDIT.md)
for the frozen closure baseline.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish status.

It exists to answer one question honestly:

```text
what is actually done, what is only partial, and what still needs a real owner?
```

It must stay anchored to the current contract docs and audited owner systems.

### Shape

```text
╔════════════════════ Closure Matrix ════════════════════╦════════╦══════════════════════════════╗
║ Contract / Phase                                      ║ State  ║ Current owner / next action  ║
╠════════════════════════════════════════════════════════╬════════╬══════════════════════════════╣
║ Genetics / Stat Contract                              ║ pass   ║ statProfileSystem            ║
║ Cognition Addendum                                    ║ pass   ║ lifeSimSystem               ║
║ Wild Ecology / Release Loop                          ║ pass   ║ progressionManager + gameCore║
║ Single-Player Autobattle                              ║ pass   ║ battleSystem + rosterSystem ║
║ ML M1-M4 + closure trace surface                      ║ pass   ║ mlInferenceSystem + Inspect ║
║ M5 Structure / Occupancy / Shelter Truth              ║ pass   ║ structureSystem              ║
╚════════════════════════════════════════════════════════╩════════╩══════════════════════════════╝
```

### Contract Anchors

- [C:\Users\fishe\Documents\projects\ephemera\docs\GENETICS-STAT-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/GENETICS-STAT-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\COGNITION-ADDENDUM-NEW-SYSTEMS.md](C:/Users/fishe/Documents/projects/ephemera/docs/COGNITION-ADDENDUM-NEW-SYSTEMS.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\WILD-ECOLOGY-RELEASE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/WILD-ECOLOGY-RELEASE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/SINGLE-PLAYER-AUTOBATTLE-CONTRACT.md)
- [C:\Users\fishe\Documents\projects\ephemera\docs\ML-IMPLEMENTATION-CONTRACT.md](C:/Users/fishe/Documents/projects/ephemera/docs/ML-IMPLEMENTATION-CONTRACT.md)

### Matrix

```text
╔════ Area ══════════════════════════════════════════════╦═══════╦══════════════════════════════════════════════════════╗
║ area                                                   ║ state ║ proof / drift watch                                   ║
╠════════════════════════════════════════════════════════╬═══════╬══════════════════════════════════════════════════════╣
║ genetics / inheritance / stat readability             ║ pass  ║ contract audit green; inspect/journal surfaces live  ║
║ cognition addendum for newer systems                  ║ pass  ║ player/object/ecology/battle channels live          ║
║ wild ecology / release / hybrid-cap loop             ║ pass  ║ progressionManager + gameCore hold canonical truth  ║
║ single-player autobattle                             ║ pass  ║ top-right battle mode + roster-vs-garden selection  ║
║ ML feature / garden / signal / risk / battle posture ║ pass  ║ M1-M4 audited, fallback preserved, Inspect trace live║
║ structure / shelter / interior truth                 ║ pass  ║ structureSystem owns derived shelter/path truth       ║
╚════════════════════════════════════════════════════════╩═══════╩══════════════════════════════════════════════════════╝
```

### Phase Two Result

```text
M5 closure
├─ dedicated derived structure owner added
├─ roof / wall / opening / shelter truth rebuilt per zone
├─ path blocking now reads shared structure profiles
├─ lifeSim spatial awareness refreshes from structure truth
└─ save/rebuild path refreshes structure-derived state explicitly
```

### Locked Rule

Phase two closed the M5 gap by adding a derived owner.

It must not:

- persist fake structure state as durable truth
- move structure truth into UI-only code
- reintroduce old pool or Ephemera-era mechanics
- leave life-sim and pathing on separate spatial models

### Narrower 3D Phase Result

```text
narrower 3D environment phase
|- opening corridor transitions are now explicit
|- body-fit resolves from opening width + interior clearance
|- shelter targeting prefers valid opening approach points
|- carried block pose comes from structure-owned carry anchors
|- block placement avoids opening corridors
`- focused M5 structure audit now verifies:
   - opening transition truth
   - body-fit narrowing
   - carry-anchor truth
   - rebuild-derived shelter truth
```

## Completeness Audit

_Source: `docs/COMPLETENESS-AUDIT.md`_

### Scope

This audit is intentionally scoped to the Papilionem overhaul grand plan.

Removed Ephemera-era mechanics remain out of scope unless they were explicitly carried forward into current Papilionem contracts.

This file is a historical completeness checkpoint.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-REPAIR-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-REPAIR-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-PARITY-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-PARITY-AUDIT.md)
for the frozen closure baseline.
Use [C:\Users\fishe\Documents\projects\ephemera\docs\ACTIVE-POLISH-BOARD.md](C:/Users/fishe/Documents/projects/ephemera/docs/ACTIVE-POLISH-BOARD.md)
and [C:\Users\fishe\Documents\projects\ephemera\docs\PLAYER-FACING-POLISH-AUDIT.md](C:/Users/fishe/Documents/projects/ephemera/docs/PLAYER-FACING-POLISH-AUDIT.md)
for live player-facing polish status.

### Historical Snapshot

```text
╔════════════════════ Current Reality ════════════════════╗
║ owner-system architecture          │ real              ║
║ life-sim emotion / cognition state │ real              ║
║ genetics / inheritance core        │ real              ║
║ player-readable stat surfacing     │ real, rough UI    ║
║ wild ecology / release loop        │ real              ║
║ roster + strongest-team selection  │ real, rough UI    ║
║ single-player autobattle           │ real, rough view  ║
║ ML-backed decision layers M1-M4    │ real              ║
║ structure / shelter / 3D-ready     │ real              ║
║ feed / communication readability   │ partial           ║
║ Inspect / Journal readability      │ partial           ║
║ visible closure polish             │ still open        ║
╚═════════════════════════════════════════════════════════╝
```

### Confirmed In Code

```text
implemented now
├─ owner systems for sleep / teaching / communication / breeding / saves
├─ butterfly life-sim fields:
│  ├─ drives
│  ├─ emotions
│  ├─ memories
│  ├─ routines
│  ├─ social
│  ├─ interpretation
│  ├─ distortion
│  ├─ communication
│  └─ lifecycle
├─ hybrid inheritance and lineage records
├─ canonical stat profile system
├─ wild-release-loop ownership
├─ roster truth + strongest-team autobuild
├─ top-right single-player battle mode
├─ ML feature / action / target / signal / risk / battle-posture layers
├─ structure / shelter / opening / carry truth
└─ debug / audit tooling
```

### Partial Or Under-Expressed

```text
still needs stronger player-facing proof
├─ Inspect text size / blur / layout
├─ Journal layout / overflow / roster readability
├─ battle presentation and combat readability
├─ communication feed alignment to visible action
├─ block outline consistency
└─ final visible shared audit closure
```

### Still Active From The Grand Plan

```text
still active work
├─ polish the current single-player autobattle presentation
├─ make genetics / battle relevance easier to read at a glance
├─ deepen communication believability and visible proof
├─ keep 3D-aware shelter / movement behavior stable under load
├─ close remaining UI readability issues
└─ preserve explainable ML decisions in Inspect / Debug
```

```text
deferred later work
├─ fuller online battle implementation
└─ any future ML runtime expansion beyond the current local policy path
```

### Current Priorities

```text
highest-value next work
1. fix Inspect / Journal readability and layout
2. recover battle presentation so it visibly matches the autobattle design
3. align feed text with visible communication and movement
4. clean up remaining block visual issues
5. close with a shared visible browser audit
```

### Notes

- Older versions of this file under-reported what was already implemented.
- [C:\Users\fishe\Documents\projects\ephemera\docs\CLOSURE-AUDIT-MATRIX.md](C:/Users/fishe/Documents/projects/ephemera/docs/CLOSURE-AUDIT-MATRIX.md) is the best current completion baseline.
- [C:\Users\fishe\Documents\projects\ephemera\docs\IMPLEMENTATION-RECOVERY-PLAN.md](C:/Users/fishe/Documents/projects/ephemera/docs/IMPLEMENTATION-RECOVERY-PLAN.md) is the best current execution order for the remaining closure work.
- This audit should stay honest about the difference between:
  - implemented owner truth
  - player-visible quality
  - future deferred systems

## Life-Sim Expression Audit

_Source: `docs/LIFESIM-EXPRESSION-AUDIT.md`_

### Matrix

| Family | Fields / focus | Stored | Updated | Behavior-driving | UI surfaced | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Identity | archetype, source, entityType | yes | yes | yes | partial | live |
| Drives | selfMaintenance, safetyAvoidance, resourceControl, socialConnection, caregiving, exploration, statusExpression, rest | yes | yes | yes | yes | live |
| Emotions | threat, relief, attachment, rejection, significance, failure, curiosity, agitation, exhaustion | yes | yes | yes | yes | live |
| Memories | place, object, interaction, outcome, routine, social, danger, care | yes | yes | yes | yes | live |
| Social edges | trust, comfort, attachment, dependence, rivalry, resentment, admiration, protectiveness | yes | yes | yes | partial | live |
| Social summary | reputation, belonging, confidence, focus, activeContext | yes | yes | yes | yes | live |
| Routines | movement, social, care, resource, rest, vigilance, teaching | yes | yes | yes | yes | live |
| Interpretation | clarity, lastSignals, warpedSignals | yes | yes | yes | yes | live |
| Communication | signals, phrases, pending responses, conversations | yes | yes | yes | yes | live |
| Social ecology | local signal field, roost/warning/teaching/courtship rhythms, zone-social context | yes | yes | yes | yes | live |
| Distortion | traumaBias, anxietyBias, withdrawalBias, fixationBias, insomniaBias, oversleepBias, warpedTeachingBias | yes | yes | yes | yes | live |
| Genetics | baselineTraits, inheritedTraits, heritageTags, lineageIds | yes | yes | yes | partial | live |
| Upbringing | imprintSources, lessons, routineReinforcement | yes | yes | yes | yes | live |
| Lifecycle | ageTicks, stage, sleep markers, death state, zone ownership | yes | yes | yes | yes | live |
| Derived cognition | dominant drives/emotions, crowding, novelty, behaviorBiases, migration summary | yes | yes | yes | yes | live |

### What Changed

The major under-expressed gap was that memories, routines, upbringing, and distortion existed as real owned truth, but they were only lightly expressed in behavior and Inspect. `I1` closed that gap. `a4` then extended the same life-sim surface so local social ecology is also behavior-driving, inspectable, and audit-proved. The current runtime now:

- appraises butterfly and caterpillar state every frame
- updates all major drive channels
- updates all major emotion channels
- maintains a social summary (`reputation`, `belonging`, `confidence`, `focus`, `activeContext`)
- feeds memory density, routine strength, lesson reinforcement, and distortion families back into drive and emotion targets
- updates all current distortion families that matter to the shipped runtime, including `traumaBias`, `insomniaBias`, `oversleepBias`, and `warpedTeachingBias`
- derives behavior biases that butterfly movement, caution, shelter-seeking, cursor affinity, object interest, and battle posture now consume
- derives social-ecology rhythm summaries for roosting pockets, warning cascades, teaching pockets, and courtship territories from nearby butterflies, signal fields, sleep state, relationship pressure, and zone context
- feeds those social-ecology summaries back into behavior, sleep settling, communication grounding, Inspect, and debug-shell truth
- exposes memory, habit, upbringing, and distortion residue in dedicated Inspect cards
- exposes social rhythm and local signal field grounding in Inspect plus the debug spatial-focus shell
- proves those families directly in `run-lifesim-expression-audit.js` instead of only inferring them from dominant drives/emotions
- proves the dedicated emergence layer in `run-e4-social-ecology-audit.js` and widened `run-r6-communication-audit.js`
- keeps save/load continuity honest by synchronizing sleep oversleep habit with live distortion truth during durable serialization

### Audit Proof

The closure-grade proof for this document is now:

- `node scripts/run-e4-social-ecology-audit.js`
- `node scripts/run-lifesim-expression-audit.js`
- `node scripts/run-r6-communication-audit.js`
- `node scripts/run-r4-ui-readability-audit.js`
- `node scripts/run-runtime-self-audit.js`

### Bounded By Design

The remaining limits here are current design boundaries, not missing implementation:

- memories are structured packet families, not open-ended freeform planning text
- routines and upbringing bias action scoring and social/training follow-through, not a fully scheduled day planner
- distortion bends shared cognition and sleep systems instead of spawning disconnected pathology mini-systems
- communication remains a bounded signal-and-phrase runtime, not a general symbolic language model

### Plain-Language Verdict

The life-sim is now a live shipped cognition stack for the current Papilionem scope, not a partially expressed placeholder. Within the game's bounded model, memories, routines, upbringing, distortion, and local social ecology are now behavior-driving, inspectable, and audit-proved.

# Chapter 4. Architecture and Diagram Appendices

These appendices capture the architecture prompt pack and the derived diagram-planning docs used to communicate game shape visually.

## Diagram Prompt Pack

_Source: `docs/GEMINI-DIAGRAM-PROMPTS.md`_

Use these as copy-paste prompts for Gemini or another diagram-capable model. They are written to produce clearer standalone visuals than the ASCII guidebook blocks.

### Global Style Prompt

Use this prefix before any prompt if you want a more consistent visual family:

```text
Create a clean, information-dense game systems diagram with strong visual hierarchy, minimal decoration, and high readability. Prefer a muted natural palette inspired by a painted garden: moss green, warm cream, soft gold, muted teal, dusky violet, and charcoal ink. Use clear labels, grouped regions, arrows, and compact legends. Avoid generic sci-fi UI styling. The output should feel like a polished systems design plate for an indie life-simulation game guidebook.
```

### 1. Whole-Game Systems Architecture

```text
Create a landscape systems architecture diagram for the game Papilionem.

Show these major regions:
- GameCore orchestration in the center
- World/render/UI on one side
- Life-simulation systems on another side
- Breeding/genetics/ecology loop on another side
- Debug/audit/save systems on another side
- Battle snapshot layer clearly separated from normal garden truth

Include these systems by name:
- ZoneSystem
- StatusSystem
- BehaviorSystem
- ObjectSystem
- SleepSystem
- TeachingSystem
- BreedingSystem
- BattleSystem
- SaveSystem
- TelemetrySystem
- RenderManager
- GameUI
- DebugUI

Visually emphasize:
- one owner per truth
- battle as an isolated snapshot/commit layer
- save/load persisting durable truth only
- render as visuals only

Use arrows to show data/control flow between systems.
```

### 2. Life-Simulation State Container

```text
Create a diagram showing the full life-simulation state container for a butterfly in Papilionem.

The main container should be labeled LifeSim and contain these compartments:
- identity
- drives
- emotions
- memories
- socialEdges
- routines
- interpretation
- distortion
- genetics
- upbringing
- lifecycle

For each compartment, list its important fields:

identity:
- entityType
- archetype
- source

drives:
- selfMaintenance
- safetyAvoidance
- resourceControl
- socialConnection
- caregiving
- exploration
- statusExpression
- rest

emotions:
- threat
- relief
- attachment
- rejection
- significance
- failure
- curiosity
- agitation
- exhaustion

memories:
- place
- object
- interaction
- outcome
- routine
- social
- danger
- care

socialEdges:
- trust
- comfort
- attachment
- dependence
- rivalry
- resentment
- admiration
- protectiveness

routines:
- movement
- social
- care
- resource
- rest
- vigilance
- teaching

interpretation:
- clarity
- lastSignals
- warpedSignals

distortion:
- traumaBias
- anxietyBias
- withdrawalBias
- fixationBias
- insomniaBias
- oversleepBias
- warpedTeachingBias

genetics:
- source
- baselineTraits
- inheritedTraits
- heritageTags
- lineageIds

upbringing:
- imprintSources
- lessons
- routineReinforcement

lifecycle:
- stage
- ageTicks
- deathState
- upbringingState

Make it look like a reference plate from a simulation design guidebook.
```

### 3. Sleep State Machine

```text
Create a state machine diagram for Papilionem's sleep system.

States:
- awake
- settling_sleep
- normal_sleep
- oversleeping
- forced_battle_sleep

Transitions:
- awake to settling_sleep when exhaustion threshold is crossed
- awake to forced_battle_sleep when forced sleep effect lands
- settling_sleep to normal_sleep after settling duration
- settling_sleep back to awake if interrupted
- normal_sleep to awake when recovery threshold is met
- normal_sleep to oversleeping when oversleep pressure is high
- oversleeping to awake when oversleep finishes
- forced_battle_sleep to awake when forced sleep effect ends

Also include side inputs:
- sleepComfort
- wakeResistance
- sleepRecoveryMultiplier
- insomniaBias
- oversleepBias

Make it readable enough for both designers and testers.
```

### 4. Teaching / Trust / Social Reinforcement Flow

```text
Create a flow diagram for Papilionem's teaching and trust systems.

Show two main paths:

Path 1: Wise butterfly teaching aura
- teaching pulse emitted
- listeners in radius
- begin lesson
- active lesson timer
- resolve lesson
- packet added
- upbringing lesson added
- social memory added
- social edge adjusted
- routine reinforced

Path 2: Skittish butterfly trust cascade
- skittish butterfly fed
- trust cascade emitted
- nearby butterflies affected
- social memory added
- trust/comfort/admiration adjusted

Also show that feeding and following can create memory packets and routine reinforcement.

Use a clear left-to-right or top-to-bottom layout and visually distinguish memories, social edges, and routines so they are not confused with each other.
```

### 5. Genetics And Hybrid Breeding Lifecycle

```text
Create a lifecycle diagram for Papilionem's breeding and hybrid system.

Stages:
- eligible male
- eligible female
- pheromone attraction
- mating state
- complete mating
- pregnancy assigned to female
- target flower selection
- egg attached to flower
- egg hatch into caterpillar
- caterpillar to chrysalis lifecycle
- hybrid butterfly spawn
- hybrid journal entry created

Include the exact inheritance rules:
- child sex is random
- core traits are averaged from both parents
- one parent ability is chosen randomly
- each wing donor is chosen independently from mother or father
- colors are averaged from both parents
- bred fertility uses are limited

Also show the important persistent artifacts:
- pregnancy data
- lifecycleData
- hybridGenome
- hybridJournal entry

Style it like a natural-history infographic for a fantasy butterfly life cycle.
```

### 6. Controls And UI Map

```text
Create a control map and UI layout poster for Papilionem.

Group controls into:
- title/start controls
- top-right shell buttons
- live keyboard inputs
- access panel controls
- inspect actions
- debug panel actions
- journal / roster controls

Include:
- any key / click to leave title
- top-right buttons: Save, Journal, Feed, Inspect, Access, Battle, Next Zone
- D debug mode
- B boundary overlay while held
- O overview mode toggle
- left/right arrows for journal navigation
- Escape to cancel Inspect release mode
- Rename button on hybrid journal pages
- Feed filters: Talk, Actions, Learn
- Access controls: High contrast, Trails, Color mode, Color off, UI scale
- Inspect actions: List, Release, Roster, Mate
- Debug panel buttons: Save Game, Restore Save, Verify Roundtrip, Capture Snapshot, Check World, Compare Snapshots, Load Audit Preset, Export Audit Setup, Import Audit Setup, Audit World, New Replay Seed
- note that old panel hotkeys are retired and the shell is button-first

Also show the main UI regions:
- inspect panel
- accessibility panel
- debug panel
- battle HUD
- butterfly journal
- battle journal / roster page
- Feed panel

Make it look like a player-developer reference sheet.
```

### 7. Save / Load / Audit Workflow

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

### 8. Battle Snapshot Separation

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

## Diagram Asset Registry

_Source: `docs/DIAGRAM-ASSET-REGISTRY.md`_

### Purpose

This file tracks external architecture diagrams that summarize Papilionem more
quickly than the full source book.

Use it to answer:

```text
which diagrams exist
where they are saved
which source docs they were checked against
when they were last verified
what should be updated if the runtime changes
```

### Save Convention

Preferred save root for collaborator-facing diagrams:

`C:\Users\fishe\Documents\projects\ephemera\docs\guidebook\diagrams\`

If a diagram is saved somewhere else, record the exact absolute path below.

### Review Standard

Every diagram review should check:

- owner boundaries still match the runtime
- phase status still matches the live board
- diagrams do not promote deferred work as already live
- player-facing explanations do not contradict current controls or shell flow
- simplified labels still preserve the actual system shape

### Canonical Sources

Use these docs as the primary truth when reviewing or updating diagrams:

- [ACTIVE-EXPANSION-BOARD.md](./ACTIVE-EXPANSION-BOARD.md)
- [REMAINING-IMPLEMENTATION-ROADMAP.md](./REMAINING-IMPLEMENTATION-ROADMAP.md)
- [EXPANSION-EXECUTION-PLAYBOOK.md](./EXPANSION-EXECUTION-PLAYBOOK.md)
- [COGNITION-ML-CONTRACT.md](./COGNITION-ML-CONTRACT.md)
- [ML-IMPLEMENTATION-CONTRACT.md](./ML-IMPLEMENTATION-CONTRACT.md)
- [GENETICS-STAT-CONTRACT.md](./GENETICS-STAT-CONTRACT.md)
- [PAPILIONEM-GUIDEBOOK.md](./PAPILIONEM-GUIDEBOOK.md)

### Diagram Ledger

| Diagram | Status | Saved path | Last verified against | Review status | Update triggers |
| --- | --- | --- | --- | --- | --- |
| `ML layer overview` | `live external doc` | `C:\Users\fishe\Documents\projects\ephemera\docs\SYSTEM-DIAGRAMS.md` | `ACTIVE-EXPANSION-BOARD.md`, `COGNITION-ML-CONTRACT.md`, `ML-IMPLEMENTATION-CONTRACT.md` | `verified 2026-04-20` | `c4-c7`, ML runtime / fallback changes, inspect/debug ML surfacing changes |
| `Neural network / policy pipeline` | `live external doc` | `C:\Users\fishe\Documents\projects\ephemera\docs\SYSTEM-DIAGRAMS.md` | `ML-IMPLEMENTATION-CONTRACT.md`, `EXPANSION-EXECUTION-PLAYBOOK.md`, `ACTIVE-EXPANSION-BOARD.md` | `verified 2026-04-20` | artifact/runtime changes, training-path changes, feature-schema changes |
| `Genetics / lineage systems` | `live external doc` | `C:\Users\fishe\Documents\projects\ephemera\docs\SYSTEM-DIAGRAMS.md` | `GENETICS-STAT-CONTRACT.md`, `PAPILIONEM-GUIDEBOOK.md`, `WILD-ECOLOGY-RELEASE-CONTRACT.md` | `verified 2026-04-19` | genetics surface changes, lineage/release feedback changes, breeding lifecycle changes |

### Future Update Rule

When a diagram file is created or revised:

1. record its exact saved path here
2. mark whether it was reviewed against the live runtime/docs
3. note the phase or contract that would force a future refresh

Do not treat a diagram as canonical until the review status is `verified`.

## Diagram Save Location

_Source: `docs/guidebook/diagrams/README.md`_

Use this folder for collaborator-facing architecture diagrams that summarize the
game more quickly than the full source book.

Recommended files to keep here:

- `ml-layer-overview.mmd`
- `ml-layer-overview.md`
- `neural-policy-pipeline.mmd`
- `neural-policy-pipeline.md`
- `genetics-lineage-systems.mmd`
- `genetics-lineage-systems.md`

If rendered exports exist, keep them beside the source:

- `.svg`
- `.png`
- `.pdf`

When a new diagram is added here, also update
[DIAGRAM-ASSET-REGISTRY.md](../../DIAGRAM-ASSET-REGISTRY.md) with the exact file
path and review status.

## Whole-Game Systems Architecture

_Source: `docs/guidebook/gemini-prompts/01-whole-game-architecture.md`_

Target output:

`docs/guidebook/diagrams/01-whole-game-architecture.png`

```text
Create a landscape systems architecture diagram for the game Papilionem.

Show these major regions:
- GameCore orchestration in the center
- World/render/UI on one side
- Life-simulation systems on another side
- Breeding/genetics/ecology loop on another side
- Debug/audit/save systems on another side
- Battle snapshot layer clearly separated from normal garden truth

Include these systems by name:
- ZoneSystem
- StatusSystem
- BehaviorSystem
- ObjectSystem
- SleepSystem
- TeachingSystem
- BreedingSystem
- BattleSystem
- SaveSystem
- TelemetrySystem
- RenderManager
- GameUI
- DebugUI

Visually emphasize:
- one owner per truth
- battle as an isolated snapshot/commit layer
- save/load persisting durable truth only
- render as visuals only

Use arrows to show data/control flow between systems.
```

## Life-Sim State Container

_Source: `docs/guidebook/gemini-prompts/02-life-sim-state-container.md`_

Target output:

`docs/guidebook/diagrams/02-life-sim-state-container.png`

```text
Create a diagram showing the full life-simulation state container for a butterfly in Papilionem.

The main container should be labeled LifeSim and contain these compartments:
- identity
- drives
- emotions
- memories
- socialEdges
- routines
- interpretation
- distortion
- genetics
- upbringing
- lifecycle

For each compartment, list its important fields:

identity:
- entityType
- archetype
- source

drives:
- selfMaintenance
- safetyAvoidance
- resourceControl
- socialConnection
- caregiving
- exploration
- statusExpression
- rest

emotions:
- threat
- relief
- attachment
- rejection
- significance
- failure
- curiosity
- agitation
- exhaustion

memories:
- place
- object
- interaction
- outcome
- routine
- social
- danger
- care

socialEdges:
- trust
- comfort
- attachment
- dependence
- rivalry
- resentment
- admiration
- protectiveness

routines:
- movement
- social
- care
- resource
- rest
- vigilance
- teaching

interpretation:
- clarity
- lastSignals
- warpedSignals

distortion:
- traumaBias
- anxietyBias
- withdrawalBias
- fixationBias
- insomniaBias
- oversleepBias
- warpedTeachingBias

genetics:
- source
- baselineTraits
- inheritedTraits
- heritageTags
- lineageIds

upbringing:
- imprintSources
- lessons
- routineReinforcement

lifecycle:
- stage
- ageTicks
- deathState
- upbringingState

Make it look like a reference plate from a simulation design guidebook.
```

## Sleep State Machine

_Source: `docs/guidebook/gemini-prompts/03-sleep-state-machine.md`_

Target output:

`docs/guidebook/diagrams/03-sleep-state-machine.png`

```text
Create a state machine diagram for Papilionem's sleep system.

States:
- awake
- settling_sleep
- normal_sleep
- oversleeping
- forced_battle_sleep

Transitions:
- awake to settling_sleep when exhaustion threshold is crossed
- awake to forced_battle_sleep when forced sleep effect lands
- settling_sleep to normal_sleep after settling duration
- settling_sleep back to awake if interrupted
- normal_sleep to awake when recovery threshold is met
- normal_sleep to oversleeping when oversleep pressure is high
- oversleeping to awake when oversleep finishes
- forced_battle_sleep to awake when forced sleep effect ends

Also include side inputs:
- sleepComfort
- wakeResistance
- sleepRecoveryMultiplier
- insomniaBias
- oversleepBias

Make it readable enough for both designers and testers.
```

## Teaching Trust Flow

_Source: `docs/guidebook/gemini-prompts/04-teaching-trust-flow.md`_

Target output:

`docs/guidebook/diagrams/04-teaching-trust-flow.png`

```text
Create a flow diagram for Papilionem's teaching and trust systems.

Show two main paths:

Path 1: Wise butterfly teaching aura
- teaching pulse emitted
- listeners in radius
- begin lesson
- active lesson timer
- resolve lesson
- packet added
- upbringing lesson added
- social memory added
- social edge adjusted
- routine reinforced

Path 2: Skittish butterfly trust cascade
- skittish butterfly fed
- trust cascade emitted
- nearby butterflies affected
- social memory added
- trust/comfort/admiration adjusted

Also show that feeding and following can create memory packets and routine reinforcement.

Use a clear left-to-right or top-to-bottom layout and visually distinguish memories, social edges, and routines so they are not confused with each other.
```

## Genetics Breeding Lifecycle

_Source: `docs/guidebook/gemini-prompts/05-genetics-breeding-lifecycle.md`_

Target output:

`docs/guidebook/diagrams/05-genetics-breeding-lifecycle.png`

```text
Create a lifecycle diagram for Papilionem's breeding and hybrid system.

Stages:
- eligible male
- eligible female
- pheromone attraction
- mating state
- complete mating
- pregnancy assigned to female
- target flower selection
- egg attached to flower
- egg hatch into caterpillar
- caterpillar to chrysalis lifecycle
- hybrid butterfly spawn
- hybrid journal entry created

Include the exact inheritance rules:
- child sex is random
- core traits are averaged from both parents
- one parent ability is chosen randomly
- each wing donor is chosen independently from mother or father
- colors are averaged from both parents
- bred fertility uses are limited

Also show the important persistent artifacts:
- pregnancy data
- lifecycleData
- hybridGenome
- hybridJournal entry

Style it like a natural-history infographic for a fantasy butterfly life cycle.
```

## Controls and UI Map

_Source: `docs/guidebook/gemini-prompts/06-controls-ui-map.md`_

Target output:

`docs/guidebook/diagrams/06-controls-ui-map.png`

```text
Create a control map and UI layout poster for Papilionem.

Group controls into:
- title/start controls
- top-right shell buttons
- live keyboard inputs
- access panel controls
- inspect actions
- debug panel actions
- journal / roster controls

Include:
- any key / click to leave title
- top-right buttons: Save, Journal, Feed, Inspect, Access, Battle, Next Zone
- D debug mode
- B boundary overlay while held
- O overview mode toggle
- left/right arrows for journal navigation
- Escape to cancel Inspect release mode
- Rename button on hybrid journal pages
- Feed filters: Talk, Actions, Learn
- Access controls: High contrast, Trails, Color mode, Color off, UI scale
- Inspect actions: List, Release, Roster, Mate
- Debug panel buttons: Save Game, Restore Save, Verify Roundtrip, Capture Snapshot, Check World, Compare Snapshots, Load Audit Preset, Export Audit Setup, Import Audit Setup, Audit World, New Replay Seed
- note that old panel hotkeys are retired and the shell is button-first

Also show the main UI regions:
- inspect panel
- accessibility panel
- debug panel
- battle HUD
- butterfly journal
- battle journal / roster page
- Feed panel

Make it look like a player-developer reference sheet.
```

## Save Load Audit Workflow

_Source: `docs/guidebook/gemini-prompts/07-save-load-audit-workflow.md`_

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

## Battle Snapshot Separation

_Source: `docs/guidebook/gemini-prompts/08-battle-snapshot-separation.md`_

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
