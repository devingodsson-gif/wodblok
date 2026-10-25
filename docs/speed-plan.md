# Speed plan: drawing with many elements and effects (written Oct 25 2026; finished as 2.45.0, see docs/perf-baseline.md; 2.44.5 not needed)

Owner, Oct 25 2026: "When there's many elements and effects it's very slow. Do an analysis, figure out what's taking up what percentage of the time, make a pie chart, and come up with a clean plan to speed up the drawing process."
Nothing here is built. The steps below wait for the owner's word.

## How it was measured
- Built app 2.44.0 (`dist/wodblok.html`), headless Chromium 1243, 1440 x 900, a 2-CPU cloud machine, software drawing (no GPU). Absolute times on a Mac will be lower; the shares are what matter.
- Scene: 40 shapes on the canvas, each with 4 effects (a fixed mix from texture, grain, noise, blur, halftone, rough, dust, bleed, jitter, grade, motion, lines, stipple, misreg, ripple), plus the Background. The canvas SVG is about 560 KB. A second scene had 80 shapes with 8 effects each (about 2.2 MB of SVG).
- Interactions: dragging an effect slider of the selected shape (30 moves), dragging a shape on the canvas (30 moves), and undo / redo (full redraws). Each was recorded with Chrome's tracing: the main thread by event, the browser's background threads, and the JavaScript by sampling, mapped back to the module each line of the built file came from.
- The work counted is all CPU work in the page's renderer, on every thread, for the whole interaction. Profiler start-up and idle time are left out. Parsing the SVG text is counted once (inside the `innerHTML` slice).

## Where the time goes (effect slider drag, 40 shapes x 4 effects)
About 195 ms of work per slider step; the picture updates about every 165 ms (6 frames a second).

| Share | ms (30 steps) | What it is |
|---|---|---|
| 48.5% | 2837 | **Effects turned into pixels.** The browser's raster threads redraw every effect filter of every shape on every change (about 10,500 full-area filter paints and 5,900 layers in 10 redraws). |
| 21.0% | 1229 | **Browser paint and frame assembly.** Pre-paint and paint on the main thread (13.1%) and the compositor thread (7.9%). |
| 12.7% | 744 | **The whole canvas rebuilt from scratch.** `bkShow` (03) replaces the entire canvas SVG through `innerHTML` (6.2%, about 150 KB of SVG re-parsed per step), then the browser restyles and lays it all out again (6.5%). |
| 12.1% | 705 | **Interface refreshed for nothing.** On every redraw: every range slider in the app is repainted (`nums` / `paint`, 34-desktop-shell, 5.7%), the Stamp panel is rebuilt (`stPanel`, 63-stamp-tool, 4.3%, even when it is not open), other panels (2.0%). |
| 3.8% | 223 | **Building the SVG text** (element and effect code: 83-filter-effects, 69-effect-stack, 74-motif-element, 25-art-layers...). |
| 1.9% | 111 | Garbage collection. |

The same picture in the other measurements: dragging a shape (170 ms of work per step, effects into pixels 54%), undo / redo (250 ms of work per redraw, 52%), 80 shapes x 8 effects (562 ms of work per redraw, 54%).
Control: the same shape drag with no effects costs 70 ms of work per step (64 ms between frames) instead of 170 ms (145 ms between frames), so the effects more than double the cost of every step.

**What this says:** the JavaScript that builds the picture is cheap (under 4%). The time goes to the browser redrawing every effect of every shape, and rebuilding the whole canvas, on every change, even when only one shape moved or one slider changed. The app already avoids this for stamps (a stamp is printed once into an image and reused, module 03), but not for elements with effects.

## The plan (one theme, small steps; each step is a patch, the minor is raised at the end)
Each step is measured before and after with the same scene and the shares above; a step that does not pay is reverted.

### 2.44.1 Measure it the same way every time
- Add the scene and the measurement as `npm run perf:draw` (a script under tools/, no new dependency): it prints work per step and the breakdown for the slider drag, the shape drag and undo. Baseline written into docs/perf-baseline.md.
- Fix the unbundled dev mode (`npm run dev`): it stops at start with "teD is not defined" (22-text-tool.js uses `teD` without importing it; the bundle hides it). Profiles of the unbundled modules point at real file names.

### 2.44.2 Stop refreshing what did not change (about 12%)
- `stPanel` runs only while the Stamp panel shows and its stamp changed.
- The slider fills (`nums` / `paint`) are repainted only for sliders in open panels, and only when their value changed.
- The layers and other panels refresh only when what they show changed.
- Low risk; no change to the picture.

### 2.44.3 Print each element's effects once (the 48%)
- Extend the stamp print cache (module 03, `bkOne`) to elements with effects: an element's look (its markup, its effects and the zoom) is printed once into an image, at the size it shows at, and the canvas places that image. Only the element being changed draws live.
- A slider drag on one shape then redraws one shape's effects instead of forty. Saving, copying and export keep using the vector picture, as stamps do today.
- Highest risk of the plan: the printed picture has to match the live one (pixel goldens; the same rule the stamp prints follow). Full suite advisable (drawing and rendering).

### 2.44.4 Update the canvas in place (about 13%, and less raster)
- Keep each element's node on the canvas and replace only the elements whose markup changed, instead of one `innerHTML` for the whole canvas.
- Saves the re-parse and the full restyle and layout, and lets the browser repaint only the area that changed.

### 2.44.5 Draft while dragging (only if still needed)
- While a slider or a shape is being dragged, the element being changed draws its effects at reduced resolution; full quality when it is let go (the rule stamps already follow with draft mode).

### 2.45.0 Done
- Measure again on the same scene and on the owner's Mac (`npm run perf:draw`), write the outcome in docs/plan.md and docs/perf-baseline.md.

## Expected result (an estimate, to be measured after each step)
- Steps 2.44.2 to 2.44.4 address about 70% of the work of a slider step. If they work as intended, a slider or shape drag on this scene should come down from about 165 ms between frames to well under 60 ms. This is an estimate, not a measurement.

## Open questions for the owner
1. Start with 2.44.1 and 2.44.2 (safe), then 2.44.3 (the big one)? Or go straight to 2.44.3?
2. OK to add `npm run perf:draw` as a tools script (no dependency)?
3. Can he run `npm run perf:draw` on his Mac once 2.44.1 exists, so the plan is checked against a real machine with a GPU?
