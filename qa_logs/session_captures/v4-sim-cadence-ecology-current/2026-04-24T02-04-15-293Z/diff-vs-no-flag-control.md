# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag-ecology-current\2026-04-24T02-04-15-704Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence-ecology-current\2026-04-24T02-04-15-293Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 59.47 | 32.19 | -45.9% |
| avgRenderMs | 51.81 | 54.08 | +4.4% |
| p50FrameMs | 121.80 | 88.40 | -27.4% |
| p95FrameMs | 158.90 | 123.70 | -22.2% |
| p99FrameMs | 167.50 | 153.30 | -8.5% |
| compositeCallsPerFrame | 4.17 | 4.16 | -0.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 66.00 | 82.00 | +24.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | simulation-dominant | render-dominant | simulation-dominant -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 46.59 | 21.90 | -53.0% |
| avgRenderMs | 46.00 | 44.62 | -3.0% |
| p50FrameMs | 91.00 | 63.00 | -30.8% |
| p95FrameMs | 116.50 | 86.30 | -25.9% |
| p99FrameMs | 117.30 | 102.00 | -13.0% |
| compositeCallsPerFrame | 5.52 | 5.40 | -2.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 56.00 | 73.00 | +30.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 44.42 | 18.63 | -58.1% |
| avgRenderMs | 50.63 | 50.47 | -0.3% |
| p50FrameMs | 97.00 | 71.20 | -26.6% |
| p95FrameMs | 121.50 | 104.70 | -13.8% |
| p99FrameMs | 135.90 | 111.40 | -18.0% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 45.00 | 59.00 | +31.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 43.58 | 22.81 | -47.6% |
| avgRenderMs | 42.72 | 45.41 | +6.3% |
| p50FrameMs | 82.20 | 65.20 | -20.7% |
| p95FrameMs | 120.60 | 96.70 | -19.8% |
| p99FrameMs | 129.90 | 109.50 | -15.7% |
| compositeCallsPerFrame | 5.00 | 5.19 | +3.8% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 80.00 | 98.00 | +22.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |
