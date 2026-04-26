# Capture Comparison

- baseline: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-flower-head-candidate\2026-04-24T05-24-48-513Z`
- candidate: `C:\Users\fishe\Documents\projects\ephemera\qa_logs\session_captures\v5-entity-region-candidate\2026-04-24T17-55-57-955Z`

## battle

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 18.82 | 19.23 | +2.2% |
| avgRenderMs | 24.24 | 26.94 | +11.1% |
| p50FrameMs | 49.70 | 54.70 | +10.1% |
| p95FrameMs | 56.10 | 60.30 | +7.5% |
| p99FrameMs | 93.10 | 94.90 | +1.9% |
| compositeCallsPerFrame | 3.91 | 3.92 | +0.2% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 132.00 | 137.00 | +3.8% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## calm

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 6.21 | 6.22 | +0.2% |
| avgRenderMs | 14.09 | 14.34 | +1.8% |
| p50FrameMs | 20.70 | 20.90 | +1.0% |
| p95FrameMs | 24.00 | 24.60 | +2.5% |
| p99FrameMs | 25.80 | 26.00 | +0.8% |
| compositeCallsPerFrame | 5.15 | 5.15 | +0.0% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 25.00 | 24.00 | -4.0% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## shell

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 10.30 | 10.59 | +2.8% |
| avgRenderMs | 15.09 | 15.26 | +1.1% |
| p50FrameMs | 24.70 | 25.00 | +1.2% |
| p95FrameMs | 28.80 | 30.20 | +4.9% |
| p99FrameMs | 31.20 | 37.20 | +19.2% |
| compositeCallsPerFrame | 5.14 | 5.14 | +0.1% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 34.00 | 33.00 | -2.9% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |

## soak40

| metric | baseline | candidate | delta |
| --- | ---: | ---: | --- |
| avgUpdateMs | 7.84 | 8.09 | +3.3% |
| avgRenderMs | 15.85 | 16.20 | +2.2% |
| p50FrameMs | 24.70 | 25.30 | +2.4% |
| p95FrameMs | 31.50 | 32.60 | +3.5% |
| p99FrameMs | 41.50 | 42.00 | +1.2% |
| compositeCallsPerFrame | 4.97 | 4.90 | -1.3% |
| peakHeapUsedMB | 159.26 | 159.26 | 0.0% |
| uiRedrawCount | 235.00 | 231.00 | -1.7% |
| debugRedrawCount | 0.00 | 0.00 | 0.0% |
| pressureTier | critical | critical | same |
| lagCategory | render-dominant | render-dominant | same |
