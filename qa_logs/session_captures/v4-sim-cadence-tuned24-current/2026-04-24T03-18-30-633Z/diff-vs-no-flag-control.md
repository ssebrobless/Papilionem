# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag-tuned24-current\2026-04-24T03-17-38-230Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence-tuned24-current\2026-04-24T03-18-30-633Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 45.96 | 26.25 | -42.9% |
| avgRenderMs | 35.36 | 34.13 | -3.5% |
| p50FrameMs | 83.40 | 58.40 | -30.0% |
| p95FrameMs | 99.60 | 68.20 | -31.5% |
| p99FrameMs | 131.80 | 117.80 | -10.6% |
| compositeCallsPerFrame | 4.15 | 4.25 | +2.6% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 94.00 | 125.00 | +33.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | simulation-dominant | render-dominant | simulation-dominant -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 31.56 | 8.89 | -71.8% |
| avgRenderMs | 32.34 | 30.54 | -5.6% |
| p50FrameMs | 61.20 | 38.40 | -37.3% |
| p95FrameMs | 76.50 | 44.00 | -42.5% |
| p99FrameMs | 82.10 | 46.70 | -43.1% |
| compositeCallsPerFrame | 5.36 | 5.25 | -2.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 80.00 | 117.00 | +46.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 28.13 | 6.97 | -75.2% |
| avgRenderMs | 35.79 | 35.05 | -2.1% |
| p50FrameMs | 64.70 | 40.50 | -37.4% |
| p95FrameMs | 80.50 | 56.20 | -30.2% |
| p99FrameMs | 93.90 | 62.00 | -34.0% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 66.00 | 94.00 | +42.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 28.59 | 8.78 | -69.3% |
| avgRenderMs | 32.18 | 28.31 | -12.0% |
| p50FrameMs | 57.70 | 37.20 | -35.5% |
| p95FrameMs | 74.60 | 57.20 | -23.3% |
| p99FrameMs | 82.50 | 61.10 | -25.9% |
| compositeCallsPerFrame | 5.05 | 4.62 | -8.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 115.00 | 165.00 | +43.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
