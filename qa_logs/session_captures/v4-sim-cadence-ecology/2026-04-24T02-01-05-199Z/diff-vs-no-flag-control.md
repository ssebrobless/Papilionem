# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag-ml-cadence\2026-04-24T00-50-38-073Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence-ecology\2026-04-24T02-01-05-199Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 59.75 | 38.41 | -35.7% |
| avgRenderMs | 55.33 | 75.14 | +35.8% |
| p50FrameMs | 125.40 | 122.90 | -2.0% |
| p95FrameMs | 178.60 | 192.80 | +8.0% |
| p99FrameMs | 190.90 | 212.60 | +11.4% |
| compositeCallsPerFrame | 4.17 | 4.17 | +0.1% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 60.00 | 60.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 51.28 | 31.33 | -38.9% |
| avgRenderMs | 48.20 | 63.80 | +32.4% |
| p50FrameMs | 90.40 | 86.20 | -4.6% |
| p95FrameMs | 131.80 | 114.40 | -13.2% |
| p99FrameMs | 152.50 | 151.40 | -0.7% |
| compositeCallsPerFrame | 5.56 | 5.52 | -0.7% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 52.00 | 54.00 | +3.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 47.25 | 27.20 | -42.4% |
| avgRenderMs | 52.49 | 69.66 | +32.7% |
| p50FrameMs | 95.90 | 97.60 | +1.8% |
| p95FrameMs | 126.40 | 125.90 | -0.4% |
| p99FrameMs | 134.70 | 152.70 | +13.4% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 46.00 | 46.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 40.92 | 24.95 | -39.0% |
| avgRenderMs | 38.58 | 53.80 | +39.4% |
| p50FrameMs | 76.50 | 79.10 | +3.4% |
| p95FrameMs | 113.80 | 137.30 | +20.7% |
| p99FrameMs | 127.40 | 149.10 | +17.0% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 87.00 | 79.00 | -9.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |
