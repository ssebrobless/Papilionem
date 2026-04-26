# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-tight-bounds-control\2026-04-25T00-01-59-563Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-battle-only-on-v5-candidate\2026-04-25T00-08-35-332Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 31.46 | 30.03 | -4.5% |
| avgRenderMs | 38.16 | 39.83 | +4.4% |
| p50FrameMs | 72.10 | 76.50 | +6.1% |
| p95FrameMs | 114.40 | 106.20 | -7.2% |
| p99FrameMs | 125.60 | 138.00 | +9.9% |
| compositeCallsPerFrame | 4.26 | 4.25 | -0.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 87.00 | -4.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.37 | 13.63 | +45.5% |
| avgRenderMs | 21.03 | 26.20 | +24.6% |
| p50FrameMs | 28.80 | 37.90 | +31.6% |
| p95FrameMs | 43.00 | 55.90 | +30.0% |
| p99FrameMs | 48.20 | 64.20 | +33.2% |
| compositeCallsPerFrame | 5.21 | 5.26 | +1.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 18.00 | 13.00 | -27.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.79 | 9.40 | +6.9% |
| avgRenderMs | 22.47 | 25.07 | +11.5% |
| p50FrameMs | 30.70 | 30.90 | +0.7% |
| p95FrameMs | 43.20 | 54.40 | +25.9% |
| p99FrameMs | 52.30 | 64.80 | +23.9% |
| compositeCallsPerFrame | 4.99 | 5.00 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 27.00 | 26.00 | -3.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 11.99 | 11.15 | -7.0% |
| avgRenderMs | 23.81 | 24.90 | +4.6% |
| p50FrameMs | 38.00 | 33.60 | -11.6% |
| p95FrameMs | 81.60 | 58.40 | -28.4% |
| p99FrameMs | 111.40 | 89.40 | -19.7% |
| compositeCallsPerFrame | 4.65 | 4.96 | +6.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 153.00 | 165.00 | +7.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
