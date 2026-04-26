# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-control-no-flag-keycompact\2026-04-23T22-24-04-406Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-posebucket16\2026-04-23T22-35-53-145Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.65 | 39.51 | -0.4% |
| avgRenderMs | 41.20 | 39.94 | -3.1% |
| p50FrameMs | 86.40 | 83.80 | -3.0% |
| p95FrameMs | 93.40 | 101.60 | +8.8% |
| p99FrameMs | 124.20 | 125.30 | +0.9% |
| compositeCallsPerFrame | 4.17 | 4.17 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 103.00 | +4.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.58 | 25.10 | -1.9% |
| avgRenderMs | 27.23 | 26.56 | -2.4% |
| p50FrameMs | 50.10 | 48.60 | -3.0% |
| p95FrameMs | 71.20 | 68.00 | -4.5% |
| p99FrameMs | 78.60 | 79.70 | +1.4% |
| compositeCallsPerFrame | 5.30 | 5.30 | -0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 96.00 | 97.00 | +1.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.53 | 23.00 | -2.2% |
| avgRenderMs | 30.66 | 29.53 | -3.7% |
| p50FrameMs | 52.20 | 51.30 | -1.7% |
| p95FrameMs | 74.10 | 67.20 | -9.3% |
| p99FrameMs | 83.40 | 75.30 | -9.7% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 77.00 | 79.00 | +2.6% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.41 | 23.66 | -3.1% |
| avgRenderMs | 27.25 | 26.34 | -3.3% |
| p50FrameMs | 50.90 | 49.70 | -2.4% |
| p95FrameMs | 69.80 | 66.70 | -4.4% |
| p99FrameMs | 79.20 | 71.40 | -9.8% |
| compositeCallsPerFrame | 5.21 | 5.18 | -0.5% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 128.00 | 131.00 | +2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
