# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-tight-bounds-control\2026-04-25T00-01-59-563Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-segmented-entity-composite-candidate\2026-04-25T00-41-52-785Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 31.46 | 25.99 | -17.4% |
| avgRenderMs | 38.16 | 34.04 | -10.8% |
| p50FrameMs | 72.10 | 65.80 | -8.7% |
| p95FrameMs | 114.40 | 76.40 | -33.2% |
| p99FrameMs | 125.60 | 116.20 | -7.5% |
| compositeCallsPerFrame | 4.26 | 4.01 | -5.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 110.00 | +20.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.37 | 8.36 | -10.7% |
| avgRenderMs | 21.03 | 18.08 | -14.1% |
| p50FrameMs | 28.80 | 26.60 | -7.6% |
| p95FrameMs | 43.00 | 32.10 | -25.3% |
| p99FrameMs | 48.20 | 35.50 | -26.3% |
| compositeCallsPerFrame | 5.21 | 5.19 | -0.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 18.00 | 19.00 | +5.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.79 | 8.92 | +1.5% |
| avgRenderMs | 22.47 | 19.71 | -12.3% |
| p50FrameMs | 30.70 | 29.00 | -5.5% |
| p95FrameMs | 43.20 | 35.60 | -17.6% |
| p99FrameMs | 52.30 | 44.80 | -14.3% |
| compositeCallsPerFrame | 4.99 | 5.00 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 27.00 | 30.00 | +11.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 11.99 | 13.03 | +8.7% |
| avgRenderMs | 23.81 | 21.67 | -9.0% |
| p50FrameMs | 38.00 | 32.10 | -15.5% |
| p95FrameMs | 81.60 | 45.70 | -44.0% |
| p99FrameMs | 111.40 | 53.90 | -51.6% |
| compositeCallsPerFrame | 4.65 | 4.91 | +5.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 153.00 | 185.00 | +20.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
