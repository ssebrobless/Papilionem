# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-composite-dirty-control-r2\2026-04-24T03-33-43-472Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-composite-dirty-candidate-r2\2026-04-24T03-33-43-467Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.49 | 26.07 | -1.6% |
| avgRenderMs | 34.28 | 37.37 | +9.0% |
| p50FrameMs | 60.20 | 63.30 | +5.1% |
| p95FrameMs | 68.40 | 68.80 | +0.6% |
| p99FrameMs | 106.20 | 110.90 | +4.4% |
| compositeCallsPerFrame | 4.16 | 4.16 | -0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 125.00 | 118.00 | -5.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.22 | 8.42 | -8.7% |
| avgRenderMs | 31.07 | 29.97 | -3.5% |
| p50FrameMs | 39.00 | 38.60 | -1.0% |
| p95FrameMs | 44.00 | 41.60 | -5.5% |
| p99FrameMs | 45.70 | 45.10 | -1.3% |
| compositeCallsPerFrame | 5.25 | 5.24 | -0.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 116.00 | 123.00 | +6.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.38 | 7.38 | -0.1% |
| avgRenderMs | 36.77 | 36.62 | -0.4% |
| p50FrameMs | 42.80 | 42.80 | 0.0% |
| p95FrameMs | 61.80 | 60.30 | -2.4% |
| p99FrameMs | 64.00 | 66.30 | +3.6% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 89.00 | 89.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.25 | 10.06 | +8.7% |
| avgRenderMs | 29.48 | 29.83 | +1.2% |
| p50FrameMs | 38.90 | 39.50 | +1.5% |
| p95FrameMs | 61.00 | 61.40 | +0.7% |
| p99FrameMs | 66.00 | 64.10 | -2.9% |
| compositeCallsPerFrame | 4.70 | 5.09 | +8.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 155.00 | 155.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
