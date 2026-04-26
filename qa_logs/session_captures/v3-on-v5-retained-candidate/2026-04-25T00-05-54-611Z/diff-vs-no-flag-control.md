# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-tight-bounds-control\2026-04-25T00-01-59-563Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-on-v5-retained-candidate\2026-04-25T00-05-54-611Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 31.46 | 31.79 | +1.0% |
| avgRenderMs | 38.16 | 34.27 | -10.2% |
| p50FrameMs | 72.10 | 65.20 | -9.6% |
| p95FrameMs | 114.40 | 95.50 | -16.5% |
| p99FrameMs | 125.60 | 115.70 | -7.9% |
| compositeCallsPerFrame | 4.26 | 4.21 | -1.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 100.00 | +9.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.37 | 10.76 | +14.9% |
| avgRenderMs | 21.03 | 21.19 | +0.7% |
| p50FrameMs | 28.80 | 31.00 | +7.6% |
| p95FrameMs | 43.00 | 46.60 | +8.4% |
| p99FrameMs | 48.20 | 63.00 | +30.7% |
| compositeCallsPerFrame | 5.21 | 5.22 | +0.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 18.00 | 16.00 | -11.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.79 | 9.36 | +6.5% |
| avgRenderMs | 22.47 | 22.99 | +2.3% |
| p50FrameMs | 30.70 | 30.90 | +0.7% |
| p95FrameMs | 43.20 | 45.60 | +5.6% |
| p99FrameMs | 52.30 | 57.50 | +9.9% |
| compositeCallsPerFrame | 4.99 | 5.00 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 27.00 | 26.00 | -3.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 11.99 | 14.17 | +18.2% |
| avgRenderMs | 23.81 | 22.50 | -5.5% |
| p50FrameMs | 38.00 | 34.10 | -10.3% |
| p95FrameMs | 81.60 | 54.90 | -32.7% |
| p99FrameMs | 111.40 | 67.90 | -39.0% |
| compositeCallsPerFrame | 4.65 | 4.80 | +3.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 153.00 | 170.00 | +11.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
