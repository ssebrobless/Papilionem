# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-guide-dom-candidate\2026-04-24T04-15-22-948Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-flower-head-candidate\2026-04-24T05-24-48-513Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.61 | 18.82 | -20.3% |
| avgRenderMs | 32.76 | 24.24 | -26.0% |
| p50FrameMs | 59.20 | 49.70 | -16.0% |
| p95FrameMs | 65.30 | 56.10 | -14.1% |
| p99FrameMs | 105.30 | 93.10 | -11.6% |
| compositeCallsPerFrame | 4.19 | 3.91 | -6.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 121.00 | 132.00 | +9.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.13 | 6.21 | -13.0% |
| avgRenderMs | 24.95 | 14.09 | -43.5% |
| p50FrameMs | 32.20 | 20.70 | -35.7% |
| p95FrameMs | 36.10 | 24.00 | -33.5% |
| p99FrameMs | 41.40 | 25.80 | -37.7% |
| compositeCallsPerFrame | 5.20 | 5.15 | -1.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 18.00 | 25.00 | +38.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.87 | 10.30 | +50.0% |
| avgRenderMs | 26.22 | 15.09 | -42.4% |
| p50FrameMs | 33.30 | 24.70 | -25.8% |
| p95FrameMs | 38.80 | 28.80 | -25.8% |
| p99FrameMs | 42.50 | 31.20 | -26.6% |
| compositeCallsPerFrame | 5.00 | 5.14 | +2.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 28.00 | 34.00 | +21.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 11.14 | 7.84 | -29.7% |
| avgRenderMs | 27.27 | 15.85 | -41.9% |
| p50FrameMs | 35.70 | 24.70 | -30.8% |
| p95FrameMs | 47.10 | 31.50 | -33.1% |
| p99FrameMs | 53.80 | 41.50 | -22.9% |
| compositeCallsPerFrame | 5.15 | 4.97 | -3.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 177.00 | 235.00 | +32.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
