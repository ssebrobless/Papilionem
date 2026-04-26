# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-tight-bounds-control\2026-04-25T00-01-59-563Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-segmented-entity-composite-candidate-r2\2026-04-25T00-45-37-586Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 31.46 | 27.30 | -13.2% |
| avgRenderMs | 38.16 | 34.43 | -9.8% |
| p50FrameMs | 72.10 | 66.30 | -8.0% |
| p95FrameMs | 114.40 | 71.80 | -37.2% |
| p99FrameMs | 125.60 | 119.90 | -4.5% |
| compositeCallsPerFrame | 4.26 | 4.20 | -1.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 110.00 | +20.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.37 | 8.66 | -7.6% |
| avgRenderMs | 21.03 | 18.06 | -14.2% |
| p50FrameMs | 28.80 | 27.40 | -4.9% |
| p95FrameMs | 43.00 | 30.80 | -28.4% |
| p99FrameMs | 48.20 | 33.50 | -30.5% |
| compositeCallsPerFrame | 5.21 | 5.19 | -0.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 18.00 | 19.00 | +5.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.79 | 9.15 | +4.0% |
| avgRenderMs | 22.47 | 20.72 | -7.8% |
| p50FrameMs | 30.70 | 29.90 | -2.6% |
| p95FrameMs | 43.20 | 35.80 | -17.1% |
| p99FrameMs | 52.30 | 41.60 | -20.5% |
| compositeCallsPerFrame | 4.99 | 5.00 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 27.00 | 29.00 | +7.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 11.99 | 12.44 | +3.7% |
| avgRenderMs | 23.81 | 20.35 | -14.5% |
| p50FrameMs | 38.00 | 31.40 | -17.4% |
| p95FrameMs | 81.60 | 39.70 | -51.3% |
| p99FrameMs | 111.40 | 52.40 | -53.0% |
| compositeCallsPerFrame | 4.65 | 6.53 | +40.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 153.00 | 190.00 | +24.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
