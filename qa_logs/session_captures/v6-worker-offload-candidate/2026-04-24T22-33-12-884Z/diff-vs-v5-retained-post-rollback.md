# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-retained-post-rollback\2026-04-24T18-16-31-541Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v6-worker-offload-candidate\2026-04-24T22-33-12-884Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.45 | 20.35 | +10.3% |
| avgRenderMs | 26.74 | 28.39 | +6.2% |
| p50FrameMs | 54.40 | 56.70 | +4.2% |
| p95FrameMs | 61.00 | 64.20 | +5.2% |
| p99FrameMs | 94.20 | 98.90 | +5.0% |
| compositeCallsPerFrame | 4.24 | 4.23 | -0.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 129.00 | -2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.28 | 6.47 | +3.1% |
| avgRenderMs | 14.48 | 15.14 | +4.5% |
| p50FrameMs | 21.30 | 22.20 | +4.2% |
| p95FrameMs | 25.10 | 26.00 | +3.6% |
| p99FrameMs | 28.10 | 27.40 | -2.5% |
| compositeCallsPerFrame | 5.15 | 5.16 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 23.00 | -8.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.84 | 9.80 | -0.3% |
| avgRenderMs | 15.54 | 16.42 | +5.6% |
| p50FrameMs | 25.10 | 25.70 | +2.4% |
| p95FrameMs | 30.30 | 32.00 | +5.6% |
| p99FrameMs | 32.10 | 33.70 | +5.0% |
| compositeCallsPerFrame | 5.14 | 5.00 | -2.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 33.00 | 31.00 | -6.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.52 | 9.41 | +10.5% |
| avgRenderMs | 17.07 | 17.87 | +4.7% |
| p50FrameMs | 26.20 | 27.40 | +4.6% |
| p95FrameMs | 33.50 | 37.40 | +11.6% |
| p99FrameMs | 42.30 | 45.00 | +6.4% |
| compositeCallsPerFrame | 4.85 | 4.93 | +1.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 227.00 | 216.00 | -4.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
