# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-control-no-flag-ml-cadence\2026-04-24T00-50-38-073Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v4-sim-cadence-ml\2026-04-24T00-52-24-449Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 59.75 | 30.00 | -49.8% |
| avgRenderMs | 55.33 | 39.12 | -29.3% |
| p50FrameMs | 125.40 | 67.70 | -46.0% |
| p95FrameMs | 178.60 | 80.10 | -55.2% |
| p99FrameMs | 190.90 | 120.90 | -36.7% |
| compositeCallsPerFrame | 4.17 | 4.14 | -0.7% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 60.00 | 109.00 | +81.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 51.28 | 15.22 | -70.3% |
| avgRenderMs | 48.20 | 33.82 | -29.8% |
| p50FrameMs | 90.40 | 48.10 | -46.8% |
| p95FrameMs | 131.80 | 55.30 | -58.0% |
| p99FrameMs | 152.50 | 57.00 | -62.6% |
| compositeCallsPerFrame | 5.56 | 5.30 | -4.7% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 52.00 | 98.00 | +88.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 47.25 | 13.04 | -72.4% |
| avgRenderMs | 52.49 | 39.33 | -25.1% |
| p50FrameMs | 95.90 | 52.90 | -44.8% |
| p95FrameMs | 126.40 | 72.00 | -43.0% |
| p99FrameMs | 134.70 | 80.10 | -40.5% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 46.00 | 74.00 | +60.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 40.92 | 16.15 | -60.5% |
| avgRenderMs | 38.58 | 36.42 | -5.6% |
| p50FrameMs | 76.50 | 54.00 | -29.4% |
| p95FrameMs | 113.80 | 75.00 | -34.1% |
| p99FrameMs | 127.40 | 80.50 | -36.8% |
| compositeCallsPerFrame | 5.00 | 5.35 | +7.0% |
| peakHeapUsedMB | 168.80 | 159.26 | -5.6% |
| uiRedrawCount | 87.00 | 117.00 | +34.5% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |
