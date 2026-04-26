# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-flower-head-candidate\2026-04-24T05-24-48-513Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-native-composite-candidate\2026-04-24T18-00-44-092Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.82 | 17.48 | -7.1% |
| avgRenderMs | 24.24 | 25.72 | +6.1% |
| p50FrameMs | 49.70 | 53.10 | +6.8% |
| p95FrameMs | 56.10 | 62.90 | +12.1% |
| p99FrameMs | 93.10 | 96.60 | +3.8% |
| compositeCallsPerFrame | 3.91 | 4.27 | +9.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 133.00 | +0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.21 | 6.07 | -2.2% |
| avgRenderMs | 14.09 | 14.00 | -0.7% |
| p50FrameMs | 20.70 | 20.30 | -1.9% |
| p95FrameMs | 24.00 | 24.00 | 0.0% |
| p99FrameMs | 25.80 | 26.80 | +3.9% |
| compositeCallsPerFrame | 5.15 | 5.13 | -0.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 29.00 | +16.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 10.30 | 10.84 | +5.3% |
| avgRenderMs | 15.09 | 14.90 | -1.3% |
| p50FrameMs | 24.70 | 25.30 | +2.4% |
| p95FrameMs | 28.80 | 31.40 | +9.0% |
| p99FrameMs | 31.20 | 34.60 | +10.9% |
| compositeCallsPerFrame | 5.14 | 5.28 | +2.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 34.00 | 37.00 | +8.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.84 | 9.80 | +25.1% |
| avgRenderMs | 15.85 | 17.03 | +7.5% |
| p50FrameMs | 24.70 | 25.90 | +4.9% |
| p95FrameMs | 31.50 | 33.30 | +5.7% |
| p99FrameMs | 41.50 | 43.10 | +3.9% |
| compositeCallsPerFrame | 4.97 | 5.17 | +4.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 235.00 | 253.00 | +7.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
