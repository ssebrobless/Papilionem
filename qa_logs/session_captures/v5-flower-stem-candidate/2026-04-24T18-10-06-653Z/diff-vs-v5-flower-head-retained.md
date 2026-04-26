# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-flower-head-candidate\2026-04-24T05-24-48-513Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-flower-stem-candidate\2026-04-24T18-10-06-653Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.82 | 19.24 | +2.2% |
| avgRenderMs | 24.24 | 25.94 | +7.0% |
| p50FrameMs | 49.70 | 54.00 | +8.7% |
| p95FrameMs | 56.10 | 61.90 | +10.3% |
| p99FrameMs | 93.10 | 94.40 | +1.4% |
| compositeCallsPerFrame | 3.91 | 3.93 | +0.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 135.00 | +2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.21 | 6.31 | +1.6% |
| avgRenderMs | 14.09 | 13.54 | -3.9% |
| p50FrameMs | 20.70 | 20.30 | -1.9% |
| p95FrameMs | 24.00 | 23.90 | -0.4% |
| p99FrameMs | 25.80 | 24.70 | -4.3% |
| compositeCallsPerFrame | 5.15 | 5.14 | -0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 25.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 10.30 | 10.55 | +2.5% |
| avgRenderMs | 15.09 | 14.17 | -6.1% |
| p50FrameMs | 24.70 | 24.30 | -1.6% |
| p95FrameMs | 28.80 | 28.50 | -1.0% |
| p99FrameMs | 31.20 | 31.10 | -0.3% |
| compositeCallsPerFrame | 5.14 | 5.14 | -0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 34.00 | 36.00 | +5.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.84 | 8.43 | +7.6% |
| avgRenderMs | 15.85 | 16.05 | +1.3% |
| p50FrameMs | 24.70 | 24.90 | +0.8% |
| p95FrameMs | 31.50 | 32.40 | +2.9% |
| p99FrameMs | 41.50 | 41.10 | -1.0% |
| compositeCallsPerFrame | 4.97 | 5.03 | +1.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 235.00 | 232.00 | -1.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
