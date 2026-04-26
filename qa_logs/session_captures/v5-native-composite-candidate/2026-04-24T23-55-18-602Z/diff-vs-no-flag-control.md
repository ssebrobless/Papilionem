# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-native-composite-control\2026-04-24T23-55-18-611Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-native-composite-candidate\2026-04-24T23-55-18-602Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 31.64 | 30.22 | -4.5% |
| avgRenderMs | 40.08 | 40.41 | +0.8% |
| p50FrameMs | 74.00 | 73.00 | -1.4% |
| p95FrameMs | 108.80 | 97.30 | -10.6% |
| p99FrameMs | 156.30 | 139.40 | -10.8% |
| compositeCallsPerFrame | 4.24 | 4.33 | +2.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 92.00 | 92.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 10.56 | 10.69 | +1.3% |
| avgRenderMs | 23.12 | 22.97 | -0.7% |
| p50FrameMs | 32.30 | 30.90 | -4.3% |
| p95FrameMs | 46.30 | 47.50 | +2.6% |
| p99FrameMs | 61.00 | 63.10 | +3.4% |
| compositeCallsPerFrame | 5.23 | 5.22 | -0.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 16.00 | 16.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 9.61 | 9.86 | +2.6% |
| avgRenderMs | 25.36 | 25.26 | -0.4% |
| p50FrameMs | 33.80 | 33.40 | -1.2% |
| p95FrameMs | 47.50 | 51.30 | +8.0% |
| p99FrameMs | 67.10 | 73.80 | +10.0% |
| compositeCallsPerFrame | 5.00 | 5.00 | 0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 25.00 | 0.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 11.85 | 13.69 | +15.5% |
| avgRenderMs | 25.39 | 25.43 | +0.2% |
| p50FrameMs | 36.60 | 36.40 | -0.5% |
| p95FrameMs | 57.00 | 61.90 | +8.6% |
| p99FrameMs | 76.40 | 81.80 | +7.1% |
| compositeCallsPerFrame | 4.78 | 4.85 | +1.4% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 159.00 | 164.00 | +3.1% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
