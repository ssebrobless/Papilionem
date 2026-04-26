# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-retained-post-rollback\2026-04-24T18-16-31-541Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v6-worker-offload-candidate-r2\2026-04-24T22-36-00-312Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.45 | 19.51 | +5.8% |
| avgRenderMs | 26.74 | 25.86 | -3.3% |
| p50FrameMs | 54.40 | 53.10 | -2.4% |
| p95FrameMs | 61.00 | 61.00 | 0.0% |
| p99FrameMs | 94.20 | 95.10 | +1.0% |
| compositeCallsPerFrame | 4.24 | 4.24 | -0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 133.00 | +0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.28 | 6.48 | +3.2% |
| avgRenderMs | 14.48 | 15.35 | +6.0% |
| p50FrameMs | 21.30 | 22.30 | +4.7% |
| p95FrameMs | 25.10 | 26.30 | +4.8% |
| p99FrameMs | 28.10 | 27.60 | -1.8% |
| compositeCallsPerFrame | 5.15 | 5.16 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 23.00 | -8.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.84 | 10.11 | +2.8% |
| avgRenderMs | 15.54 | 17.54 | +12.9% |
| p50FrameMs | 25.10 | 26.70 | +6.4% |
| p95FrameMs | 30.30 | 32.90 | +8.6% |
| p99FrameMs | 32.10 | 35.20 | +9.7% |
| compositeCallsPerFrame | 5.14 | 5.11 | -0.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 33.00 | 31.00 | -6.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.52 | 8.56 | +0.5% |
| avgRenderMs | 17.07 | 17.33 | +1.5% |
| p50FrameMs | 26.20 | 26.80 | +2.3% |
| p95FrameMs | 33.50 | 34.30 | +2.4% |
| p99FrameMs | 42.30 | 43.90 | +3.8% |
| compositeCallsPerFrame | 4.85 | 4.81 | -0.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 227.00 | 222.00 | -2.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
