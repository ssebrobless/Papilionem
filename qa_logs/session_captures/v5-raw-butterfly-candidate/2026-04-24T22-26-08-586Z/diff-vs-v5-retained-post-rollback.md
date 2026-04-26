# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-retained-post-rollback\2026-04-24T18-16-31-541Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-raw-butterfly-candidate\2026-04-24T22-26-08-586Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.45 | 19.43 | +5.3% |
| avgRenderMs | 26.74 | 27.92 | +4.4% |
| p50FrameMs | 54.40 | 55.40 | +1.8% |
| p95FrameMs | 61.00 | 60.30 | -1.1% |
| p99FrameMs | 94.20 | 95.10 | +1.0% |
| compositeCallsPerFrame | 4.24 | 4.24 | -0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 129.00 | -2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.28 | 6.65 | +5.9% |
| avgRenderMs | 14.48 | 15.31 | +5.7% |
| p50FrameMs | 21.30 | 22.30 | +4.7% |
| p95FrameMs | 25.10 | 26.30 | +4.8% |
| p99FrameMs | 28.10 | 27.30 | -2.8% |
| compositeCallsPerFrame | 5.15 | 5.16 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 23.00 | -8.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.84 | 9.96 | +1.2% |
| avgRenderMs | 15.54 | 16.02 | +3.0% |
| p50FrameMs | 25.10 | 25.60 | +2.0% |
| p95FrameMs | 30.30 | 31.20 | +3.0% |
| p99FrameMs | 32.10 | 33.20 | +3.4% |
| compositeCallsPerFrame | 5.14 | 5.08 | -1.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 33.00 | 32.00 | -3.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.52 | 8.52 | -0.0% |
| avgRenderMs | 17.07 | 18.12 | +6.1% |
| p50FrameMs | 26.20 | 26.80 | +2.3% |
| p95FrameMs | 33.50 | 35.40 | +5.7% |
| p99FrameMs | 42.30 | 44.60 | +5.4% |
| compositeCallsPerFrame | 4.85 | 4.92 | +1.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 227.00 | 219.00 | -3.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
