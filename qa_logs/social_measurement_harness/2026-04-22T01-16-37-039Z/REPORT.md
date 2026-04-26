# N0.5 Social Measurement Harness

- capture: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\2026-04-21T22-37-33-649Z-playtest-manual-capture-1776811016146`
- label: `playtest-manual`
- durationMs: `37453`
- dialogue records: `345`

## Motive Distribution

| family | count |
| --- | ---: |
| warning | 123 |
| acknowledgement | 79 |
| comfort | 61 |
| teaching | 58 |
| companionship | 12 |
| shared-observation | 9 |
| other | 2 |
| admiration | 1 |

## Pair Distinctness

- metric: `Jensen-Shannon divergence over resolved single-target pair motive distributions`
- minimumPairRecords: `3`
- resolvedPairCount: `11`
- unresolvedSingleTargetCount: `75`
- averageJsDivergence: `0.5392`
- medianJsDivergence: `0.4591`

### Top Resolved Pairs

| pair | lines | top motives |
| --- | ---: | --- |
| Easton(M) -> DelicatePink | 9 | warning (9) |
| Ian(M) -> Alice | 5 | acknowledgement (5) |
| WarmWelcome(M) -> Bella | 5 | acknowledgement (5) |
| Wyatt(M) -> Alice | 5 | acknowledgement (5) |
| Wyatt(M) -> Ian | 5 | acknowledgement (5) |
| Adrian(M) -> Ian | 4 | acknowledgement (4) |
| AncientScholar(F) -> Bella | 4 | acknowledgement (3), companionship (1) |
| AncientScholar(F) -> ElectricViolet | 4 | companionship (2), shared-observation (2) |
| Bella(F) -> Ian | 4 | acknowledgement (3), other (1) |
| Wyatt(M) -> Bella | 3 | companionship (2), acknowledgement (1) |
| Wyatt(M) -> DelicatePink | 3 | warning (3) |

### Most Distinct Pair Comparisons

| left pair | right pair | JS divergence |
| --- | --- | ---: |
| Adrian(M) -> Ian | AncientScholar(F) -> ElectricViolet | 1 |
| Adrian(M) -> Ian | Wyatt(M) -> DelicatePink | 1 |
| AncientScholar(F) -> Bella | Wyatt(M) -> DelicatePink | 1 |
| AncientScholar(F) -> ElectricViolet | Bella(F) -> Ian | 1 |
| AncientScholar(F) -> ElectricViolet | Wyatt(M) -> DelicatePink | 1 |
| Bella(F) -> Ian | Wyatt(M) -> DelicatePink | 1 |
| Easton(M) -> DelicatePink | Ian(M) -> Alice | 1 |
| Easton(M) -> DelicatePink | WarmWelcome(M) -> Bella | 1 |

### Least Distinct Pair Comparisons

| left pair | right pair | JS divergence |
| --- | --- | ---: |
| Ian(M) -> Alice | Wyatt(M) -> Ian | 0 |
| Ian(M) -> Alice | Adrian(M) -> Ian | 0 |
| WarmWelcome(M) -> Bella | Wyatt(M) -> Alice | 0 |
| WarmWelcome(M) -> Bella | Wyatt(M) -> Ian | 0 |
| WarmWelcome(M) -> Bella | Adrian(M) -> Ian | 0 |
| Wyatt(M) -> Alice | Wyatt(M) -> Ian | 0 |
| Wyatt(M) -> Alice | Adrian(M) -> Ian | 0 |
| Wyatt(M) -> Ian | Adrian(M) -> Ian | 0 |

## Follow-Through Proxy

- windowMinutes: `5`
- anchoringResidueCount: `345`
- visibleFollowThroughCount: `173`
- visibleFollowThroughRate: `0.501`
- methodology: Uses the capture-owned followThroughState marker as the current proxy for visible follow-through until later event-linked timing proof lands.

### Weakest States

| state | count |
| --- | ---: |
| heard | 114 |
| considering | 58 |

### Strong Visible Examples

- `Wyatt(M)` -> `Bella` / `companionship` / `held`: Bella, how are you holding up; I wanted to know how this quiet ground is sitting with you; I would rather ask than assume.
- `Wyatt(M)` -> `Bella` / `companionship` / `held`: Bella, you alright beside me; I did not want to let this part of the quiet ground pass without checking on you; I wanted to hear your read.
- `Easton(M)` -> `Bella` / `shared-observation` / `lingering`: Bella, do you notice this too the pressure shifted before we even crossed the drill line drip.
- `Easton(M)` -> `unresolved` / `companionship` / `held`: Are you still with me here I did not want to let this part of the training floor pass without checking on you.
- `Easton(M)` -> `Bella` / `shared-observation` / `lingering`: Bella, look at this for a second; this edge of the training floor is calmer than the rest of it; I wanted to share that with you.
- `Easton(M)` -> `unresolved` / `companionship` / `held`: Are you still with me here; I wanted to know how this training floor is sitting with you; I would rather ask than assume.
- `ElectricViolet(M)` -> `Bella` / `shared-observation` / `lingering`: Bella, the garden feels different right here this edge of the training floor is calmer than the rest of it.
- `Ariana(F)` -> `unresolved` / `shared-observation` / `lingering`: Do you notice this too; the pressure shifted before we even crossed the drill line; it feels better when we catch the same thing.
- `AncientScholar(F)` -> `Bella` / `companionship` / `held`: Bella, are you still with me here; I did not want to let this part of the training floor pass without checking on you; I wanted to hear your read.
- `Ian(M)` -> `unresolved` / `warning` / `acting`: Stay clear of that side something in that part of the low ground does not feel stable!
- `Ian(M)` -> `unresolved` / `warning` / `acting`: Okay I will stay off the covered edge.
- `Ian(M)` -> `unresolved` / `warning` / `acting`: Back away from the covered edge the air shifted too sharply for that to be harmless!

## Measurement Notes

- Resolved pairs currently depend on addressee extraction from the emitted phrase because the live capture format does not yet persist explicit target labels on every dialogue residue.
- Unresolved single-target lines remain visible in the output so the next social phases can decide whether target persistence itself needs to widen.
- The follow-through rate is a proxy over life-sim-owned followThroughState, not a UI-derived guess.
