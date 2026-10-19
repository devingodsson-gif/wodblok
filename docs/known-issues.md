# Known issues in v100 (kept as-is through Phases 1-3)

Phases 1-3 move code and add the capabilities each phase lists; they do not fix bugs, so the tests can
prove nothing else changed. Each item here is pinned by a test, so a fix shows up as a deliberate snapshot
change. Fix them after Phase 3 as normal releases.

Fixed in v107: Undo after Clear leaving the colour grade blank (the grade was reset before the step was saved), and
opening a file nudging a frame inset from 9.6 to 9.5 (the panel wrote the slider's rounded value back). Also fixed in
v107: Undo stalling after several Randomize rolls in a row (loading a step added a stray history step).

## Test flake: canvas shape "hex" SVG summary (seen once, Phase 2d run)
One full-suite run produced a different SVG summary for `canvas shape: hex` (clipPath 11→9, polygon 6→4, use 38→39); the same test passed 6 of 6 repeats on both the build and the untouched v100 file straight afterwards. So it is rare timing in the app (something drawn after the settle check), not a change from the build. Snapshot not touched. If it recurs, make `settle` also wait for pending frames before the summary is taken.

## Observation: Before (\) did not turn on right after Ctrl+S on a fresh document (not investigated)
In a test that pressed Ctrl+S on a new document, then rolled Randomize, the `\` key did not switch Before on; with the order reversed it did. Probably the Save flow (name prompt or the reference picture) interferes. Not reproduced by hand; logged only.

## Test flake: "open project-3" round trip on the raw-module target (seen once, Phase 2e run)
Failed once in a full run on `WB_TARGET=esm`; passed 3 of 3 repeats straight afterwards and on every bundle run. Same family as the hex-shape flake above (something drawn after the settle check). Not changed.

## v103 note: tests no longer match the v100 baseline
v103 replaced the colour library (Wada colours, src/data/wada.js) and the default ink/paper (Dark Tyrian Blue on Pale Lemon Yellow, was Marian Blue on Lily White). Snapshots and screenshots were regenerated from the build with the owner's OK, so `WB_TARGET=legacy` runs now differ by design. Run the tests on the build (or esm) from here on.

## Test flake: canvas shape "arch" SVG summary (seen once, v106 full run)
One full-suite run gave a different hash for `canvas shape: arch` (same length and tag counts); 4 of 4 repeats passed straight afterwards. Same family as the hex-shape flake above: something drawn after the settle check. Snapshot not touched.

## Test flake: "open project-1-diamond" (state or SVG snapshot, seen once, v0.115.1 run)
Failed once in a run of the scenarios, round-trip and repeat-tile specs; passed alone, and 5 of 5 repeats straight afterwards. Same family as the hex, arch and project-3 flakes above (something drawn after the settle check). Snapshot not touched.

## Seen once, not reproduced: stamps vanish after a canvas shape change (UX review, 1.0)
After switching the canvas shape to Arch on a rolled piece, the stamps were missing from the canvas (the 4 stamps were still in the tray) until the next edit. Two later attempts, including the same steps, did not reproduce it. Same family as the flakes above (something drawn after a settle point). 1.0.1 adds a progress bar after shape changes, which should make a late draw visible.

## Switching a layer between Free place, Art and Text clears its placed items
Found by reading `23-frame-layers.js` (`if(was&&was!=m)L.pl=[]`), not by a test. Undo should bring them back. Not fixed.

## Text layer Ink dropdown looked blank once (UX review D5)
Could not be reproduced in later runs; no change made.

## Test flake again: roundtrip "open project-…" SVG summary (seen twice, 1.0.1 and 1.0.2 runs)
`open-project-4-rect-4x3.svg.json` failed once on the 1.0.1 build and `open-project-1-diamond.svg.json` once on the 1.0.2 build (with the rail collapsed); each passed on an immediate re-run on the same build. Same family as the flakes above. Snapshots not touched.

## CI flake: SVG summary counts differ on a slow machine (seen once, 1.0.4 CI run)
On the first CI run that tested the built app, `roundtrip open-project-4-rect-4x3` and `canvas shape: tri` took their SVG summary a moment too early (image and symbol counts a few short; same family as the flakes above). Both passed locally. The checkpoint now waits for 10 quiet checks instead of 4 before taking a snapshot; the assertions are unchanged.

## After Randomize, two things point at ids that no longer exist (found in the 1.7 speed work, in 1.6.0 and earlier)
- The free-stamps strip and list in the Layers panel (`#lfpst`, `#lfpl`) keep buttons for stamps that Randomize removed (busy test project: `#s7`, `#s8`), so those thumbnails are blank.
- A texture overlay asks for a texture image that is not there (`#txi12_800` on the busy test project, Randomize with seed 21), so that overlay draws nothing.
Not fixed (no bug fixes in this phase). The speed-guard test leaves both out by name (`tests/helpers/speed.js`) so it only flags new ones.

## The TIFF export test fails (found in the 1.8 work, in 1.6.0 and later)
`tests/export-recipes.spec.js` "TIFF export is a real RGBA TIFF…" times out in `page.selectOption('#xrdpi', …)`: the DPI select is not visible when the test tries to use it. Fails on the 1.6.0 build too, so it is not from a speed release. Not fixed here.

## While the stamps are printed after opening a file, a few stamps point at outlines that are not on the page yet (found in 1.9, also in 1.8.0)
For about half a second after opening the busy test project (`project-4`), 18 `<use href="#s…">` in the pattern point at ids that do not exist yet, so those stamps draw nothing until the next redraw. Seen in 1.8.0 too (about 0.4 s). The test helper `settle` now also waits until the print queue is empty (test hook `printsBusy`), so no test measures a half-drawn piece. Not fixed (no bug fixes in this phase).

## The stamp-zoom test "a motif can still be picked and Ctrl + wheel zooms…" fails (found in 1.9, also in 1.8.0)
`tests/stamp-zoom.spec.js:33` fails on `toBeVisible` ("element(s) not found") on both the 1.8.0 and 1.9.0 builds. Not caused by a speed release as far as checked; not investigated or fixed.

## Old files' layer inks (fixed in 1.10.0 by the tray)
Since the colour library became Wada's colours, a layer ink saved with an older colour name (for example "Moon Ivory" on layers 2-4 of `project-4-rect-4x3`) was left out when the file opened, so those layers printed in their stamps' own colours. 1.10.0 turns the file's colour names into tray colours (a name from the first 100-colour palette becomes the nearest palette colour, as it always did for paper, ink and stamps), so these layers print in their ink again, as they did when the file was made. Only files with layer inks differ from 1.9 (`project-4-rect-4x3` of the test files: picture-compare compares it loosely, the other two exactly), and the slider-drag perf ratio on that file moves from about 0.8 to about 1.0 of legacy: the layer ink filters are drawn again, as legacy draws them.

## Two controls share the id `tx_sc` (found in the layer update step 2; on `main` since the text update, 1.43.0)
The Stamp editor's text Scatter control (`<div class="seg" id="tx_sc">`) and the text Scale slider (`<input id="tx_sc">`) have the same id. `tests/templates.spec.js` "no id appears twice on the page" fails on it. Not caused by the layer update; not fixed in it.

**Fixed (Oct 19 2026, layer update):** the text Scatter control is now `tx_scat`. The Textures panel's Scale slider (`tx_sc`) had been reading the Scatter control since 1.43.0, because the Text panel comes first on the page, so the slider's own events were never wired; they are now.

## Test flake: speed-guard "busy" dangling references (seen again, layer update step 5)
`tests/speed-guard.spec.js` "busy: the pattern on screen stays light and every reference resolves" now and then reports `use -> #s#` (18) and `g[filter] -> #lk#` (3): stamp prints and layer ink filters that are not on the page yet when the check runs. It passes alone on re-run (4 of 4 on the step 5 build; one failure in three runs of the step 3 build too), so it is not from the layer update. Same family as the "stamps point at outlines that are not on the page yet" note above. Snapshots untouched.

