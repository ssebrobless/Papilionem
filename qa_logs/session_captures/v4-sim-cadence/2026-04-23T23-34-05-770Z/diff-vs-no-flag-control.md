# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag\2026-04-23T23-33-14-034Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence\2026-04-23T23-34-05-770Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 42.77 | 41.02 | -4.1% |
| avgRenderMs | 31.56 | 31.62 | +0.2% |
| p50FrameMs | 74.30 | 75.90 | +2.2% |
| p95FrameMs | 94.80 | 84.80 | -10.5% |
| p99FrameMs | 112.00 | 115.30 | +2.9% |
| compositeCallsPerFrame | 4.15 | 4.18 | +0.9% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 109.00 | 109.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | simulation-dominant | simulation-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.78 | 11.23 | -58.1% |
| avgRenderMs | 28.54 | 28.16 | -1.3% |
| p50FrameMs | 52.90 | 37.30 | -29.5% |
| p95FrameMs | 73.80 | 58.40 | -20.9% |
| p99FrameMs | 78.70 | 64.60 | -17.9% |
| compositeCallsPerFrame | 5.32 | 5.24 | -1.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 119.00 | +30.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.65 | 9.96 | -59.6% |
| avgRenderMs | 32.22 | 33.18 | +3.0% |
| p50FrameMs | 55.40 | 41.40 | -25.3% |
| p95FrameMs | 78.20 | 61.30 | -21.6% |
| p99FrameMs | 87.90 | 67.50 | -23.2% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 73.00 | 94.00 | +28.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.73 | 10.83 | -56.2% |
| avgRenderMs | 28.83 | 28.02 | -2.8% |
| p50FrameMs | 52.60 | 37.50 | -28.7% |
| p95FrameMs | 70.40 | 56.30 | -20.0% |
| p99FrameMs | 76.70 | 62.20 | -18.9% |
| compositeCallsPerFrame | 5.25 | 5.00 | -4.7% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 122.00 | 161.00 | +32.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
