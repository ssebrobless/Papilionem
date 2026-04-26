# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag-tuned18-current\2026-04-24T02-18-40-638Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence-tuned18-current\2026-04-24T02-19-53-801Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 54.06 | 26.29 | -51.4% |
| avgRenderMs | 48.73 | 38.70 | -20.6% |
| p50FrameMs | 104.60 | 65.00 | -37.9% |
| p95FrameMs | 138.60 | 88.50 | -36.1% |
| p99FrameMs | 167.70 | 111.70 | -33.4% |
| compositeCallsPerFrame | 4.16 | 4.17 | +0.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 74.00 | 114.00 | +54.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 43.74 | 13.08 | -70.1% |
| avgRenderMs | 43.60 | 40.51 | -7.1% |
| p50FrameMs | 84.60 | 50.70 | -40.1% |
| p95FrameMs | 113.40 | 69.90 | -38.4% |
| p99FrameMs | 117.40 | 76.90 | -34.5% |
| compositeCallsPerFrame | 5.48 | 5.33 | -2.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 60.00 | 88.00 | +46.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 41.44 | 10.49 | -74.7% |
| avgRenderMs | 47.43 | 47.18 | -0.5% |
| p50FrameMs | 92.10 | 57.60 | -37.5% |
| p95FrameMs | 126.20 | 89.70 | -28.9% |
| p99FrameMs | 132.30 | 103.40 | -21.8% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 48.00 | 66.00 | +37.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 37.67 | 10.08 | -73.2% |
| avgRenderMs | 39.00 | 32.09 | -17.7% |
| p50FrameMs | 74.20 | 43.60 | -41.2% |
| p95FrameMs | 108.10 | 62.10 | -42.6% |
| p99FrameMs | 122.00 | 64.60 | -47.0% |
| compositeCallsPerFrame | 4.91 | 5.16 | +5.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 89.00 | 140.00 | +57.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |
