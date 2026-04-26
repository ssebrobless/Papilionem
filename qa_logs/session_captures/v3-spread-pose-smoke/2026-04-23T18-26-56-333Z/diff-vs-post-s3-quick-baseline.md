# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-spread-pose-smoke\2026-04-23T18-26-56-333Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 39.54 | +1.8% |
| avgRenderMs | 44.91 | 41.74 | -7.1% |
| p50FrameMs | 91.20 | 87.60 | -3.9% |
| p95FrameMs | 101.00 | 99.20 | -1.8% |
| p99FrameMs | 148.70 | 127.70 | -14.1% |
| compositeCallsPerFrame | 4.19 | 4.17 | -0.4% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 91.00 | 95.00 | +4.4% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 25.28 | +0.3% |
| avgRenderMs | 25.35 | 28.70 | +13.2% |
| p50FrameMs | 48.50 | 51.70 | +6.6% |
| p95FrameMs | 68.60 | 69.70 | +1.6% |
| p99FrameMs | 71.90 | 78.70 | +9.5% |
| compositeCallsPerFrame | 4.00 | 5.31 | +32.7% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 106.00 | 94.00 | -11.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | render-dominant | mixed -> render-dominant |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 23.47 | -2.4% |
| avgRenderMs | 30.82 | 31.71 | +2.9% |
| p50FrameMs | 54.60 | 54.40 | -0.4% |
| p95FrameMs | 73.80 | 71.50 | -3.1% |
| p99FrameMs | 82.90 | 77.20 | -6.9% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 76.00 | 76.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 24.28 | -0.7% |
| avgRenderMs | 27.76 | 29.79 | +7.3% |
| p50FrameMs | 50.70 | 53.20 | +4.9% |
| p95FrameMs | 70.10 | 68.10 | -2.9% |
| p99FrameMs | 85.00 | 78.60 | -7.5% |
| compositeCallsPerFrame | 5.08 | 5.27 | +3.8% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 128.00 | 125.00 | -2.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

- missing baseline file: no
- missing candidate file: yes
