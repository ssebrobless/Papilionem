# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v0-baseline\2026-04-22T21-29-05-105Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v3-sprite-baking-smoke-current\2026-04-23T08-02-25-046Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 38.85 | 38.84 | -0.0% |
| avgRenderMs | 44.91 | 39.94 | -11.1% |
| p50FrameMs | 91.20 | 83.00 | -9.0% |
| p95FrameMs | 101.00 | 89.80 | -11.1% |
| p99FrameMs | 148.70 | 121.50 | -18.3% |
| compositeCallsPerFrame | 4.19 | 4.00 | -4.6% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 91.00 | 104.00 | +14.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | mixed | render-dominant -> mixed |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 25.20 | 24.54 | -2.6% |
| avgRenderMs | 25.35 | 24.65 | -2.8% |
| p50FrameMs | 48.50 | 47.20 | -2.7% |
| p95FrameMs | 68.60 | 65.50 | -4.5% |
| p99FrameMs | 71.90 | 72.10 | +0.3% |
| compositeCallsPerFrame | 4.00 | 4.00 | 0.0% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 106.00 | 108.00 | +1.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | mixed | mixed | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.06 | 22.78 | -5.3% |
| avgRenderMs | 30.82 | 29.94 | -2.8% |
| p50FrameMs | 54.60 | 52.20 | -4.4% |
| p95FrameMs | 73.80 | 68.80 | -6.8% |
| p99FrameMs | 82.90 | 76.40 | -7.8% |
| compositeCallsPerFrame | 4.97 | 5.00 | +0.7% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 76.00 | 79.00 | +3.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 24.46 | 23.72 | -3.0% |
| avgRenderMs | 27.76 | 28.25 | +1.8% |
| p50FrameMs | 50.70 | 50.60 | -0.2% |
| p95FrameMs | 70.10 | 66.20 | -5.6% |
| p99FrameMs | 85.00 | 75.50 | -11.2% |
| compositeCallsPerFrame | 5.08 | 5.29 | +4.2% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 128.00 | 129.00 | +0.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## travel

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 23.94 | 23.86 | -0.3% |
| avgRenderMs | 33.94 | 33.07 | -2.6% |
| p50FrameMs | 55.50 | 59.40 | +7.0% |
| p95FrameMs | 83.30 | 68.80 | -17.4% |
| p99FrameMs | 89.10 | 83.90 | -5.8% |
| compositeCallsPerFrame | 4.95 | 5.06 | +2.1% |
| peakHeapUsedMB | 124.93 | 159.26 | +27.5% |
| uiRedrawCount | 83.00 | 88.00 | +6.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
