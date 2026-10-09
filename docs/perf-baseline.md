# Phase 6 baseline (v0.119, Chromium headless, 1440x900, in this sandbox)

Run with `WB_TARGET=build npm run perf-baseline` (five-layer 4:3 fixture; sliders driven in the page, time = input event until two frames later).
Times are for orientation only: machines differ, so nothing here is a pass/fail number. Compare the same machine before and after a change.

| Work | Result |
|---|---|
| Layer pattern slider, per input | median 32 ms (two frames, nothing extra), slowest 194 ms |
| Grade exposure slider | median 32 ms, slowest 32 ms |
| Texture amount slider | median 32 ms, slowest 144 ms |
| Randomize roll until the picture settles | 2.9 s |
| PNG export of the current piece | 4.6 s |
| Slider drag, build vs the v100 file (`npm run perf`) | build 14% faster (ratio 0.855) |

Reading it: dragging is already smooth (drafting while you drag); the occasional spike is the full redraw when a drag lands. The heavy work is Randomize (2.9 s) and PNG export (4.6 s).
Not measured: Safari/WebKit (no WebKit browser in this sandbox; run `npm run test:webkit` and `npm run perf-baseline` on a Mac), motif dragging on the canvas.

## Step 2 finding: workers (v0.119, same machine)
- **PNG export:** the main thread is blocked for about 6.8 s in one piece (headless, software drawing), and almost all of it is the browser drawing the piece's SVG (with its filters) onto the export canvas. PNG encoding itself takes about 0.1 s and the browser already does it off the main thread. A Worker cannot draw an SVG with filters (no DOM), so a worker would not shorten the freeze. Only a canvas/WebGL version of the filters (step 4) can.
- **Tracing an imported picture:** 1400 px of a busy picture holds the main thread for about 0.12 s. Not worth the cost and risk of moving it.
- **Stamp printing** also draws SVG, so it has the same limit as PNG export.
- Decision: no workers for now. Revisit only if a measurement on a real machine or Safari shows tracing or encoding is slow.

## Step 3 finding: dragged-motif shortcut (v0.119, same machine)
- Dragging a free-placed motif on the five-layer fixture (40 moves): 0.66 s in total, every frame 16 ms (60 per second), no long tasks. The drag handler already moves only that motif's transform (and its selection box) and redraws nothing else, so the parked idea is already how it works.
- Pattern-layer sliders (a different case) are covered by the slider numbers above. Decision: nothing to build for step 3.
