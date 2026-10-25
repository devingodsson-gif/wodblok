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

## Step 4 finding: where the export time really goes (v0.119, same machine, software drawing)
Corrected reading of the PNG export numbers above: the browser draws the SVG lazily, so the 6.6 s shows up inside `toBlob`; the PNG encoding itself is only about 0.25 s.
The five-layer fixture serialises to a 13 MB SVG at 3x (2400 x 1800 px). Taking things out of that same SVG and timing the drawing:

| What was taken out | Drawing time at 3x |
|---|---|
| nothing | 6.5 s |
| all feTurbulence noise filters (77 of them) | 5.7 s |
| every filter | 3.2 s |
| the 1339 knockout masks (`ks#`, 9.7 MB of the 13 MB) | 5.2 s |
| every mask | 1.6 s |

So masks cost about 4.8 s, filters about 3.3 s, and they overlap (many filters sit inside masks). Textures alone (turbulence) are not the main cost, so a canvas/WebGL version of the textures and grade would not by itself fix the freeze, and it would risk every existing look.
Decision: do not build the canvas/WebGL renderer for 1.0. If a Mac with a GPU (or Safari) still feels slow, the targets in order are: the mask-heavy layers (pressure, flood, wear, per-stamp knockout masks), reuse of identical knockout shapes instead of copying them 1339 times (13 MB down to about 3 MB), and a progress bar for large exports.

## Phase 6 result (v0.120)
- Saved, copied and exported pictures keep one copy of each identical knockout mask: the busy fixture's SVG went from 12.9 MB to 2.85 MB, with identical pixels (0 of 480,000 pixels differ). The stage itself is unchanged. Drawing time barely moves (about 4%), because the browser's cost is in compositing the masks, not reading them.
- PNG export now shows "Making the PNG…" in the status bar before the page becomes busy, and clears it when saved.
- Not done, on purpose: workers, canvas/WebGL renderer (measured, would not fix the cost). Open for a Mac/Safari check: `npm run perf-baseline`, `npm run test:webkit`.

## Oct 18 2026 (layer update, step 3): the slider drag test works again
`tests/perf.spec.js` drags `#lrp`; the Layout panel had grown until that slider was below the 900 px window, so for a while the drag missed it and the test measured an idle page (ratio 0.149). The test now scrolls the slider into view and fails if it is off screen. Same machine, side by side: `main` ratio 0.906, layer update step 3 ratio 0.853; Randomize settle 1.26 s and 1.31 s.

## Oct 25 2026 (2.44.1): drawing with many elements and effects (`npm run perf:draw`)
Scene: 40 shapes, 4 effects each (a fixed mix of the 15 shape effects), plus the pattern and Background; canvas SVG about 610 KB. Cloud sandbox, headless Chromium, 1440 x 900, 2 CPUs, software drawing (no GPU). Three runs, medians; run to run the numbers moved by about 5%. Compare the same machine before and after a change, never across machines.

| Interaction | Time between frames (median / 90th) | Work per step (all threads) | Pixels | Paint and frames | SVG parse, style, layout | App JavaScript |
|---|---|---|---|---|---|---|
| Effect slider drag | 95 ms / 134 ms | 115 ms | 44% | 22% | 10% | 20% |
| Shape drag | 36 ms / 49 ms | 36 ms | 53% | 29% | 4% | 11% |
| Undo / redo (full redraw) | 66 ms / 77 ms | 150 ms | 42% | 17% | 9% | 26% |

"Pixels" is the browser turning effects into pixels on its drawing threads; it is about half of all work in every case. The first analysis (docs/speed-plan.md) was made with heavier tracing switched on and measured longer times (slider drag 165 ms between frames); the shares agree within a few points, the absolute numbers here are the ones `npm run perf:draw` reproduces.
`WB_DRAW_N` and `WB_DRAW_K` change the shapes and effects per shape. `WB_PROFILER=1` adds the JavaScript sampler to the trace.
