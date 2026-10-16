# Development plan

No open plan. The UX fix plan ([`fix-plan.md`](fix-plan.md), 1.0.1 to 1.0.20) closed with 1.1.0.

Next: test 1.1.0 by hand (Monday), then write the polish plan here. Candidates from the closed plan are listed at the top of `fix-plan.md`.

## 1.6.0: Randomize shape folders
Randomize has a "Shape folders" row with a dropdown of every library folder (built-in sets, My imports, your own folders, folders inside folders). A roll takes its shapes only from the ticked folders; the Dots set stays the accents when ticked, otherwise accents come from the chosen folder. All ticked behaves exactly as before. Ticking a folder ticks the folders inside it, at least one folder holding shapes always stays ticked, new folders start ticked, and the choice is remembered in the browser like the other Randomize options (not in the project file). Test: tests/randomize-folders.spec.js.

## 1.7.0: Lighter redraws (speed, pass 3)
Speed work from the Oct 15 audit (`docs/known-issues.md` lists the two old quirks found on the way). Nothing changes on screen.
- Every stamp's outline (clip, mask, shape) now lives once in a hidden block (`#stdefs`) that is rewritten only when a stamp changes. The pattern itself carries the ready-made prints, so it no longer repeats those outlines on every redraw (busy test project: 2.7 MB of markup on screen down to about 38 KB).
- The pattern build numbers its mask ids from a fixed start, so the same stamps give the same text every time; a stamp's fingerprint is only worked out again when its text changed.
- New tests: `tests/speed-guard.spec.js` (counts the markup on screen and checks that nothing points at a missing id, after slider moves, zoom, the Stamp editor and Randomize) and `tests/picture-compare.spec.js` (CI draws the same projects with `main` and with the branch and compares the pictures pixel by pixel, including a PNG export).
- Measured on the busy test project (Chromium, 1x, sandbox): stamp size slider step 154 → 89 ms, texture Amount 248 → 163 ms, undo 219 → 149 ms, Randomize first frame 785 → 587 ms. Freezes of 0.3–0.7 s and the 8 s export are for passes 4 and 5.

## 1.9.0: no long freezes (speed, pass 5)
- Stamp prints are made in small sheets (about 1 megapixel at most, instead of up to 4096 x 4096) with the app free to react between them; the pattern is redrawn when the queue is empty, or every half second while it is long. During a Randomize hold the overlay position is read at most every 250 ms instead of every frame.
- Busy test project (Chromium, 1x, sandbox), longest freeze: opening a file 1375 → 554-626 ms; stamp size drag 1180 → 272-317 ms; undo x3 382 → 89-96 ms; zoom back to Fit about 100 ms (one earlier run showed 1.8-2 s, not reproduced alone); Randomize x3 1332 → 872-1010 ms. Perf ratio unchanged.
- The printed stamps' grain moves a little (the grain depends on where a stamp sits in its sheet): mean difference under 0.5 of 255 and about 250 pixels off by more than 48 on the diamond project; exports are identical. CI's picture comparison uses a tolerance of 0.6 for this release only (remove in 1.10).
- Not done from the pass 5 plan: C3 (history thumbnail from the on-screen prints; it is made when the page is idle, not during editing).
- New test: `tests/print-batches.spec.js`; `speed-guard` now waits for the prints before it checks.

## 1.8.0: Texture Amount without a pattern rebuild (speed, pass 4)
- Textures tool, Amount slider on a relief or stain texture that only the canvas uses: while it moves, the picture is made once at full strength and Amount is its opacity; when it is let go, the exact picture is drawn as before. Nothing rebuilds the pattern (it does not depend on a relief or stain texture). Wear textures, and textures that stamps or layers also use, still rebuild it. Scale, angle and type changes on a canvas-only texture skip the pattern rebuild too.
- Busy test project (Chromium, 1x, sandbox), per slider step: 163 → 17 ms; freezes over 50 ms during the drag 39 → 5; pattern redraws 34 → 2. The picture after letting go is pixel-identical to 1.7.0 (`picture-compare` has a texture step now).
- New test: `tests/texture-amount-fast.spec.js`. Not done from the pass 4 plan: texture pictures as blob URLs (B3); it only matters at the moment of letting go.

## 1.9.1 (test follow-ups to 1.9)
- Test hook `__wbTest.printsBusy()`; `settle` waits for the stamp prints, so the quiet-25 workarounds in speed-guard and repeat-tile are gone.
- The temporary picture-compare tolerance (`WB_PICTURE_TOLERANCE` in the workflow) is removed; main is now the 1.9 baseline.
- Seamless-tile right/down limit is 0.12*half+0.25 (was +0.15): 1.9's smaller print sheets move grain by about 1 of 255 on the CI renderer.
