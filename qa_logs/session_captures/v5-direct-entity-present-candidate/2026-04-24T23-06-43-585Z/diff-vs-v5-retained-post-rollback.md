# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-retained-post-rollback\2026-04-24T18-16-31-541Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-direct-entity-present-candidate\2026-04-24T23-06-43-585Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.45 | 28.71 | +55.6% |
| avgRenderMs | 26.74 | 37.72 | +41.0% |
| p50FrameMs | 54.40 | 67.70 | +24.4% |
| p95FrameMs | 61.00 | 94.00 | +54.1% |
| p99FrameMs | 94.20 | 122.90 | +30.5% |
| compositeCallsPerFrame | 4.24 | 4.22 | -0.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 101.00 | -23.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.28 | 8.66 | +37.9% |
| avgRenderMs | 14.48 | 19.37 | +33.7% |
| p50FrameMs | 21.30 | 27.00 | +26.8% |
| p95FrameMs | 25.10 | 39.10 | +55.8% |
| p99FrameMs | 28.10 | 41.50 | +47.7% |
| compositeCallsPerFrame | 5.15 | 5.19 | +0.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 19.00 | -24.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.84 | 9.11 | -7.4% |
| avgRenderMs | 15.54 | 21.36 | +37.4% |
| p50FrameMs | 25.10 | 29.40 | +17.1% |
| p95FrameMs | 30.30 | 42.80 | +41.3% |
| p99FrameMs | 32.10 | 53.80 | +67.6% |
| compositeCallsPerFrame | 5.14 | 5.00 | -2.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 33.00 | 28.00 | -15.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.52 | 13.74 | +61.3% |
| avgRenderMs | 17.07 | 21.09 | +23.5% |
| p50FrameMs | 26.20 | 33.10 | +26.3% |
| p95FrameMs | 33.50 | 50.40 | +50.4% |
| p99FrameMs | 42.30 | 71.10 | +68.1% |
| compositeCallsPerFrame | 4.85 | 5.05 | +4.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 227.00 | 180.00 | -20.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
