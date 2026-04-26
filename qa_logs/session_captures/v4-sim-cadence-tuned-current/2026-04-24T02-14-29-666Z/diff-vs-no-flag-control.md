# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag-tuned-current\2026-04-24T02-13-33-544Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence-tuned-current\2026-04-24T02-14-29-666Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 57.02 | 29.63 | -48.0% |
| avgRenderMs | 46.69 | 49.41 | +5.8% |
| p50FrameMs | 112.20 | 76.40 | -31.9% |
| p95FrameMs | 139.80 | 107.20 | -23.3% |
| p99FrameMs | 173.60 | 152.40 | -12.2% |
| compositeCallsPerFrame | 4.15 | 4.16 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 73.00 | 92.00 | +26.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | simulation-dominant | render-dominant | simulation-dominant -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 40.82 | 15.76 | -61.4% |
| avgRenderMs | 41.87 | 41.23 | -1.5% |
| p50FrameMs | 75.90 | 51.30 | -32.4% |
| p95FrameMs | 104.10 | 81.10 | -22.1% |
| p99FrameMs | 120.20 | 99.80 | -17.0% |
| compositeCallsPerFrame | 5.46 | 5.34 | -2.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 63.00 | 85.00 | +34.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.30 | 12.62 | -67.1% |
| avgRenderMs | 45.42 | 47.29 | +4.1% |
| p50FrameMs | 84.70 | 62.50 | -26.2% |
| p95FrameMs | 119.40 | 98.40 | -17.6% |
| p99FrameMs | 130.40 | 108.20 | -17.0% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 50.00 | 63.00 | +26.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.39 | 15.34 | -61.0% |
| avgRenderMs | 38.85 | 40.36 | +3.9% |
| p50FrameMs | 77.00 | 55.20 | -28.3% |
| p95FrameMs | 113.90 | 85.10 | -25.3% |
| p99FrameMs | 145.40 | 100.20 | -31.1% |
| compositeCallsPerFrame | 4.91 | 5.18 | +5.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 86.00 | 111.00 | +29.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |
