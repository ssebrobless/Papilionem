# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-composite-dirty-candidate-r2\2026-04-24T03-33-43-467Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-guide-dom-candidate\2026-04-24T04-15-22-948Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.07 | 23.61 | -9.4% |
| avgRenderMs | 37.37 | 32.76 | -12.3% |
| p50FrameMs | 63.30 | 59.20 | -6.5% |
| p95FrameMs | 68.80 | 65.30 | -5.1% |
| p99FrameMs | 110.90 | 105.30 | -5.0% |
| compositeCallsPerFrame | 4.16 | 4.19 | +0.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 118.00 | 121.00 | +2.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.42 | 7.13 | -15.2% |
| avgRenderMs | 29.97 | 24.95 | -16.7% |
| p50FrameMs | 38.60 | 32.20 | -16.6% |
| p95FrameMs | 41.60 | 36.10 | -13.2% |
| p99FrameMs | 45.10 | 41.40 | -8.2% |
| compositeCallsPerFrame | 5.24 | 5.20 | -0.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 123.00 | 18.00 | -85.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.38 | 6.87 | -6.9% |
| avgRenderMs | 36.62 | 26.22 | -28.4% |
| p50FrameMs | 42.80 | 33.30 | -22.2% |
| p95FrameMs | 60.30 | 38.80 | -35.7% |
| p99FrameMs | 66.30 | 42.50 | -35.9% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 89.00 | 28.00 | -68.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 10.06 | 11.14 | +10.8% |
| avgRenderMs | 29.83 | 27.27 | -8.6% |
| p50FrameMs | 39.50 | 35.70 | -9.6% |
| p95FrameMs | 61.40 | 47.10 | -23.3% |
| p99FrameMs | 64.10 | 53.80 | -16.1% |
| compositeCallsPerFrame | 5.09 | 5.15 | +1.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 155.00 | 177.00 | +14.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
