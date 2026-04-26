# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-retained-post-rollback\2026-04-24T18-16-31-541Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v6-worker-offload-batch-candidate\2026-04-24T22-57-34-470Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.45 | 28.40 | +53.9% |
| avgRenderMs | 26.74 | 37.05 | +38.5% |
| p50FrameMs | 54.40 | 66.50 | +22.2% |
| p95FrameMs | 61.00 | 90.50 | +48.4% |
| p99FrameMs | 94.20 | 125.00 | +32.7% |
| compositeCallsPerFrame | 4.24 | 4.21 | -0.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 104.00 | -21.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.28 | 8.99 | +43.3% |
| avgRenderMs | 14.48 | 19.75 | +36.4% |
| p50FrameMs | 21.30 | 27.60 | +29.6% |
| p95FrameMs | 25.10 | 38.40 | +53.0% |
| p99FrameMs | 28.10 | 43.70 | +55.5% |
| compositeCallsPerFrame | 5.15 | 5.20 | +0.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 18.00 | -28.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.84 | 8.78 | -10.8% |
| avgRenderMs | 15.54 | 22.33 | +43.7% |
| p50FrameMs | 25.10 | 31.40 | +25.1% |
| p95FrameMs | 30.30 | 45.30 | +49.5% |
| p99FrameMs | 32.10 | 51.00 | +58.9% |
| compositeCallsPerFrame | 5.14 | 4.99 | -2.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 33.00 | 26.00 | -21.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.52 | 13.70 | +60.8% |
| avgRenderMs | 17.07 | 22.51 | +31.8% |
| p50FrameMs | 26.20 | 32.20 | +22.9% |
| p95FrameMs | 33.50 | 49.50 | +47.8% |
| p99FrameMs | 42.30 | 62.60 | +48.0% |
| compositeCallsPerFrame | 4.85 | 4.98 | +2.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 227.00 | 180.00 | -20.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
