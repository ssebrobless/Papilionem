# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-tight-bounds-control\2026-04-25T00-01-59-563Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-tight-bounds-candidate\2026-04-25T00-02-57-381Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 31.46 | 30.24 | -3.9% |
| avgRenderMs | 38.16 | 39.25 | +2.9% |
| p50FrameMs | 72.10 | 76.40 | +6.0% |
| p95FrameMs | 114.40 | 99.00 | -13.5% |
| p99FrameMs | 125.60 | 151.70 | +20.8% |
| compositeCallsPerFrame | 4.26 | 4.40 | +3.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 90.00 | -1.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.37 | 10.90 | +16.4% |
| avgRenderMs | 21.03 | 23.22 | +10.4% |
| p50FrameMs | 28.80 | 33.50 | +16.3% |
| p95FrameMs | 43.00 | 43.50 | +1.2% |
| p99FrameMs | 48.20 | 47.10 | -2.3% |
| compositeCallsPerFrame | 5.21 | 5.23 | +0.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 18.00 | 15.00 | -16.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.79 | 9.25 | +5.2% |
| avgRenderMs | 22.47 | 25.14 | +11.9% |
| p50FrameMs | 30.70 | 33.90 | +10.4% |
| p95FrameMs | 43.20 | 49.30 | +14.1% |
| p99FrameMs | 52.30 | 55.80 | +6.7% |
| compositeCallsPerFrame | 4.99 | 5.00 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 27.00 | 25.00 | -7.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 11.99 | 12.08 | +0.8% |
| avgRenderMs | 23.81 | 21.85 | -8.2% |
| p50FrameMs | 38.00 | 33.20 | -12.6% |
| p95FrameMs | 81.60 | 51.10 | -37.4% |
| p99FrameMs | 111.40 | 66.30 | -40.5% |
| compositeCallsPerFrame | 4.65 | 4.84 | +3.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 153.00 | 172.00 | +12.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
