# Wild Ecology / Release Contract

## Purpose

This document replaces the old breeding-gated unlock ladder with the new
wild-ecology loop.

Papilionem is no longer using progression as a rarity ladder. The intended loop
is now:

- living wild populations
- hybrid lineage management
- selective release
- released-stat uplift of future wild populations

## Direction Lock

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

## Scope

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

## Flower Material Boundary

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

## Ownership Map

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

## Fresh Save State

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

## Wild Butterfly Rules

```text
wild butterfly
â”œâ”€ birthSource = wild
â”œâ”€ totalWildMatesMax = 3
â”œâ”€ uniquePartnersRequired = true
â””â”€ after 3rd successful mating = vanish / die in place
```

### Unique Partner Rule

Across the 3 allowed matings:

- a wild butterfly must not mate with the same partner twice
- failure to find a new valid partner should block further mating rather than
  violate this rule

### Departure Rule

After the 3rd successful mating:

- wild butterfly vanishes where it stands
- no portal path / doorway departure sequence
- this is death/removal from the living wild population, not migration

## Hybrid Rule

```text
hybrid
= any butterfly that is not a wild butterfly
```

This includes:

- offspring of mixed lineage
- retained player-managed lineages
- any non-wild garden-born butterfly

### Hybrid Cap

```text
global hybrid cap
â””â”€ 150 total living hybrids across all zones
```

The cap applies to:

- currently living hybrids
- regardless of zone

Wild butterflies do not count toward this cap.

### Hard Hatch Rule At Cap

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

## Release Rule

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

### Release UI Rule

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

## Release Batch / Wild Baseline Uplift

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

### Batch Rule

Every 10 released hybrids:

- compute a release-batch stat contribution
- apply that contribution to the wild baseline modifier
- spawn 1 male and 1 female of every base butterfly type again

### Cohort Feedback Rule

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

### Base-Type Respawn Wave

Respawn wave should include:

- friendly
- cautious
- energetic
- skittish
- wise
- mystic

Legendary/golden remains excluded for now unless later explicitly re-added.

### Stat Uplift Rule

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

## Mutant Gene Continuity

Removing the unlock ladder must not remove mutant-gene emergence as a real
aspect of the game.

```text
keep
â”œâ”€ mutant genes as real genetic possibilities
â”œâ”€ hybrid lineage as a source of unusual combinations
â””â”€ release-driven baseline uplift as a way to keep ecology evolving
```

## Persistence

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

## Invariants

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

## Audit Requirements

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

