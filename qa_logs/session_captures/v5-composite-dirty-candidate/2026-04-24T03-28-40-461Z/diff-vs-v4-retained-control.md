# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-composite-dirty-control\2026-04-24T03-28-40-441Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-composite-dirty-candidate\2026-04-24T03-28-40-461Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 26.37 | 26.45 | +0.3% |
| avgRenderMs | 37.63 | 34.75 | -7.7% |
| p50FrameMs | 62.90 | 60.10 | -4.5% |
| p95FrameMs | 74.80 | 68.80 | -8.0% |
| p99FrameMs | 114.20 | 103.60 | -9.3% |
| compositeCallsPerFrame | 4.28 | 4.27 | -0.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 121.00 | 123.00 | +1.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.98 | 8.75 | -2.6% |
| avgRenderMs | 31.15 | 30.33 | -2.6% |
| p50FrameMs | 39.20 | 38.60 | -1.5% |
| p95FrameMs | 45.70 | 42.90 | -6.1% |
| p99FrameMs | 50.00 | 46.00 | -8.0% |
| compositeCallsPerFrame | 5.25 | 5.24 | -0.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 116.00 | 121.00 | +4.3% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.01 | 7.29 | +4.0% |
| avgRenderMs | 36.31 | 36.59 | +0.8% |
| p50FrameMs | 42.40 | 42.90 | +1.2% |
| p95FrameMs | 59.80 | 60.20 | +0.7% |
| p99FrameMs | 60.60 | 66.90 | +10.4% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 91.00 | 93.00 | +2.2% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 8.10 | 9.67 | +19.5% |
| avgRenderMs | 29.34 | 29.54 | +0.7% |
| p50FrameMs | 38.10 | 38.10 | 0.0% |
| p95FrameMs | 58.30 | 58.40 | +0.2% |
| p99FrameMs | 61.20 | 61.90 | +1.1% |
| compositeCallsPerFrame | 4.85 | 4.70 | -3.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 159.00 | 164.00 | +3.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
