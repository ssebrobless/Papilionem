# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-flower-head-candidate\2026-04-24T05-24-48-513Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-native-composite-candidate-r2\2026-04-24T18-04-49-105Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.82 | 17.90 | -4.9% |
| avgRenderMs | 24.24 | 25.47 | +5.1% |
| p50FrameMs | 49.70 | 53.40 | +7.4% |
| p95FrameMs | 56.10 | 59.70 | +6.4% |
| p99FrameMs | 93.10 | 93.40 | +0.3% |
| compositeCallsPerFrame | 3.91 | 4.16 | +6.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 134.00 | +1.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.21 | 6.12 | -1.4% |
| avgRenderMs | 14.09 | 14.08 | -0.1% |
| p50FrameMs | 20.70 | 20.60 | -0.5% |
| p95FrameMs | 24.00 | 24.40 | +1.7% |
| p99FrameMs | 25.80 | 27.00 | +4.7% |
| compositeCallsPerFrame | 5.15 | 5.13 | -0.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 29.00 | +16.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 10.30 | 9.95 | -3.4% |
| avgRenderMs | 15.09 | 14.85 | -1.6% |
| p50FrameMs | 24.70 | 24.80 | +0.4% |
| p95FrameMs | 28.80 | 30.60 | +6.3% |
| p99FrameMs | 31.20 | 33.80 | +8.3% |
| compositeCallsPerFrame | 5.14 | 5.11 | -0.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 34.00 | 38.00 | +11.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.84 | 9.22 | +17.6% |
| avgRenderMs | 15.85 | 17.02 | +7.4% |
| p50FrameMs | 24.70 | 25.90 | +4.9% |
| p95FrameMs | 31.50 | 32.70 | +3.8% |
| p99FrameMs | 41.50 | 45.10 | +8.7% |
| compositeCallsPerFrame | 4.97 | 4.91 | -1.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 235.00 | 254.00 | +8.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
