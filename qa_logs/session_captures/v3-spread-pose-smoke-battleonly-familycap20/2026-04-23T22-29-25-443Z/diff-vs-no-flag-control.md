# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-control-no-flag-keycompact\2026-04-23T22-24-04-406Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly-familycap20\2026-04-23T22-29-25-443Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 39.65 | 39.11 | -1.4% |
| avgRenderMs | 41.20 | 46.20 | +12.1% |
| p50FrameMs | 86.40 | 96.60 | +11.8% |
| p95FrameMs | 93.40 | 104.20 | +11.6% |
| p99FrameMs | 124.20 | 137.40 | +10.6% |
| compositeCallsPerFrame | 4.17 | 4.18 | +0.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 99.00 | 90.00 | -9.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.58 | 25.42 | -0.6% |
| avgRenderMs | 27.23 | 26.88 | -1.3% |
| p50FrameMs | 50.10 | 49.80 | -0.6% |
| p95FrameMs | 71.20 | 68.00 | -4.5% |
| p99FrameMs | 78.60 | 76.10 | -3.2% |
| compositeCallsPerFrame | 5.30 | 5.30 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 96.00 | 96.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.53 | 23.74 | +0.9% |
| avgRenderMs | 30.66 | 30.16 | -1.7% |
| p50FrameMs | 52.20 | 53.20 | +1.9% |
| p95FrameMs | 74.10 | 73.50 | -0.8% |
| p99FrameMs | 83.40 | 88.20 | +5.8% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 77.00 | 77.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.41 | 25.42 | +4.2% |
| avgRenderMs | 27.25 | 27.59 | +1.2% |
| p50FrameMs | 50.90 | 52.50 | +3.1% |
| p95FrameMs | 69.80 | 67.80 | -2.9% |
| p99FrameMs | 79.20 | 76.20 | -3.8% |
| compositeCallsPerFrame | 5.21 | 5.26 | +1.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 128.00 | 125.00 | -2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |
