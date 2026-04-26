# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-04-05-161Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke-battleonly-fastgate\2026-04-23T20-23-21-866Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 37.98 | 38.30 | +0.8% |
| avgRenderMs | 53.73 | 39.60 | -26.3% |
| p50FrameMs | 112.50 | 82.90 | -26.3% |
| p95FrameMs | 131.20 | 91.40 | -30.3% |
| p99FrameMs | 151.40 | 121.00 | -20.1% |
| compositeCallsPerFrame | 4.22 | 4.17 | -1.0% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 80.00 | 99.00 | +23.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.50 | 24.50 | -3.9% |
| avgRenderMs | 25.40 | 25.83 | +1.7% |
| p50FrameMs | 48.70 | 47.30 | -2.9% |
| p95FrameMs | 67.40 | 67.50 | +0.1% |
| p99FrameMs | 75.40 | 72.60 | -3.7% |
| compositeCallsPerFrame | 4.98 | 5.29 | +6.2% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 99.00 | 100.00 | +1.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.00 | 22.42 | -6.6% |
| avgRenderMs | 30.34 | 29.62 | -2.3% |
| p50FrameMs | 54.00 | 50.60 | -6.3% |
| p95FrameMs | 71.50 | 71.00 | -0.7% |
| p99FrameMs | 77.60 | 81.40 | +4.9% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 76.00 | 82.00 | +7.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.19 | 24.37 | -3.3% |
| avgRenderMs | 27.19 | 26.06 | -4.2% |
| p50FrameMs | 51.40 | 49.20 | -4.3% |
| p95FrameMs | 69.30 | 67.70 | -2.3% |
| p99FrameMs | 83.00 | 75.20 | -9.4% |
| compositeCallsPerFrame | 5.07 | 5.14 | +1.5% |
| peakHeapUsedMB | 159.26 | 168.80 | +6.0% |
| uiRedrawCount | 127.00 | 132.00 | +3.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## travel

- missing baseline file: no
- missing candidate file: yes
