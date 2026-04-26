# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-retained-post-rollback\2026-04-24T18-16-31-541Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-butterfly-bounds-candidate\2026-04-24T22-13-03-506Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.45 | 19.81 | +7.4% |
| avgRenderMs | 26.74 | 28.28 | +5.7% |
| p50FrameMs | 54.40 | 57.20 | +5.1% |
| p95FrameMs | 61.00 | 62.10 | +1.8% |
| p99FrameMs | 94.20 | 96.00 | +1.9% |
| compositeCallsPerFrame | 4.24 | 4.24 | -0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 130.00 | -1.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.28 | 6.59 | +5.1% |
| avgRenderMs | 14.48 | 15.01 | +3.7% |
| p50FrameMs | 21.30 | 22.30 | +4.7% |
| p95FrameMs | 25.10 | 26.70 | +6.4% |
| p99FrameMs | 28.10 | 29.50 | +5.0% |
| compositeCallsPerFrame | 5.15 | 5.16 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 23.00 | -8.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.84 | 9.87 | +0.4% |
| avgRenderMs | 15.54 | 16.33 | +5.0% |
| p50FrameMs | 25.10 | 25.80 | +2.8% |
| p95FrameMs | 30.30 | 31.10 | +2.6% |
| p99FrameMs | 32.10 | 33.10 | +3.1% |
| compositeCallsPerFrame | 5.14 | 5.08 | -1.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 33.00 | 32.00 | -3.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.52 | 8.91 | +4.5% |
| avgRenderMs | 17.07 | 17.56 | +2.9% |
| p50FrameMs | 26.20 | 27.50 | +5.0% |
| p95FrameMs | 33.50 | 36.00 | +7.5% |
| p99FrameMs | 42.30 | 46.40 | +9.7% |
| compositeCallsPerFrame | 4.85 | 4.80 | -0.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 227.00 | 220.00 | -3.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
