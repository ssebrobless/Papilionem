# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-retained-post-rollback\2026-04-24T18-16-31-541Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-plus-v3stack-candidate\2026-04-24T22-15-16-807Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.45 | 20.10 | +8.9% |
| avgRenderMs | 26.74 | 27.35 | +2.3% |
| p50FrameMs | 54.40 | 55.50 | +2.0% |
| p95FrameMs | 61.00 | 62.20 | +2.0% |
| p99FrameMs | 94.20 | 93.60 | -0.6% |
| compositeCallsPerFrame | 4.24 | 4.23 | -0.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 131.00 | -0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.28 | 6.49 | +3.4% |
| avgRenderMs | 14.48 | 14.89 | +2.8% |
| p50FrameMs | 21.30 | 21.90 | +2.8% |
| p95FrameMs | 25.10 | 25.40 | +1.2% |
| p99FrameMs | 28.10 | 26.20 | -6.8% |
| compositeCallsPerFrame | 5.15 | 5.15 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 24.00 | -4.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.84 | 10.12 | +2.9% |
| avgRenderMs | 15.54 | 15.95 | +2.6% |
| p50FrameMs | 25.10 | 25.80 | +2.8% |
| p95FrameMs | 30.30 | 30.60 | +1.0% |
| p99FrameMs | 32.10 | 32.60 | +1.6% |
| compositeCallsPerFrame | 5.14 | 5.00 | -2.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 33.00 | 34.00 | +3.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.52 | 9.26 | +8.7% |
| avgRenderMs | 17.07 | 16.78 | -1.7% |
| p50FrameMs | 26.20 | 26.30 | +0.4% |
| p95FrameMs | 33.50 | 37.20 | +11.0% |
| p99FrameMs | 42.30 | 43.30 | +2.4% |
| compositeCallsPerFrame | 4.85 | 4.92 | +1.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 227.00 | 222.00 | -2.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
