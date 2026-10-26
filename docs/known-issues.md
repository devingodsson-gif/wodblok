# Known issues

Things found by tests, audits or by hand that are not fixed. Each is either pinned by a test (a fix then shows up as a deliberate
snapshot change) or listed here with what is known. Closed items stay, marked, so the history is readable.

**Closed in 2.0.3 (Oct 19 2026):** the stamp-zoom test (the file went with the Stamp editor), the TIFF export test (it passes), "Switching a layer
between Free place, Art and Text clears its placed items" (there are no layer kinds now), the `tx_sc` duplicate id (renamed), "Before did not turn
on after Ctrl+S" (never reproduced; not seen since), and the list of unused top-level names (deleted).

Fixed in v107: Undo after Clear leaving the colour grade blank (the grade was reset before the step was saved), and
opening a file nudging a frame inset from 9.6 to 9.5 (the panel wrote the slider's rounded value back). Also fixed in
v107: Undo stalling after several Randomize rolls in a row (loading a step added a stray history step).


## Whole-app bug test, Oct 26 2026 (2.50.1 to 2.50.2)
Owner, Oct 26 2026: "do a bug test on the whole application, document it, and implement fixes".
**How:** the full Chromium suite on the 2.50.1 build (617 tests, 3 at a time); a crawl that ran every command in the registry on a rolled project (101 run, 20 skipped: file pickers, network, reload, print), opened every panel and recorded page errors, console errors and dialogs; screenshots of every panel and of every stamp shape with every symmetry type; three seeded rolls compared side by side with `main`.
**Result:** 593 passed, 12 failed, 12 skipped (perf and WebKit-only specs). The crawl found no error, console error or dialog in any command or panel.

Fixed:
- **Double-click on a text that lies over a pattern opened the pattern's stamp instead of typing** (live since 2.48.0, found by text-paragraph "a double-click starts typing"): since a new Pattern is 5 x 7, a stamp sits under the middle of the canvas, and the stamp tab's double-click came first. A text or shape drawn over every pattern now takes the double-click (75-stamp-edit-mode.js). Fixed in 2.50.2.
- **A roll named its patterns like yours** (two "Pattern 1" in the Elements list when you had made one): a roll's element named like one of yours takes the next free number, after the roll is built, so seeded rolls are unchanged otherwise (20-before-after-and-randomizer.js). Fixed in 2.50.2.
- **Broad picture textures repeated as a visible grid on the canvas** (2.50.0; Blotchy Wash on a whole canvas): a picture now says how many repeats at Scale 100% it holds (`textures/span.json`); the placeholders were baked again with 2 or 3 for the broad ones. Fixed in 2.50.2.
- **Hexagon and triangle stamps were misaligned in their tab** (stage size, stamp at 87%, triangle centre): fixed in 2.50.1.

Not fixed (all also on `main`):
- scenarios randomize seed 1, 2, 3, before / after compare and split view: state snapshots differ from what a roll makes now (stamp b434 instead of b435 in seed 2, seed 1 without its Bleed and Motion blur effects, seed 3 positions a little different). The differences are exactly the same on `main`; they came from an earlier release whose snapshots were not regenerated. Needs the owner to decide: regenerate (if the rolls are right) or find the change.
- recovery.spec.js (3 tests) and randomize-effects-2-39 "on a repeat tile a roll...": `settle` times out, the page keeps redrawing for over 15 s after a roll. Fails on `main` too when several tests run at once (randomize-effects 4 of 4 with four at once, recovery 1 of 6); passes alone. A roll on a repeat tile or after opening the 16 x 9 sample is slow to finish drawing.
- commands.spec "documented shortcuts really work" (Before stayed on) and text-randomize (the Randomize cover did not go away within 120 s): failed once under load, passed 2 of 2 alone. Known CI flakes.
- roundtrip "round trip project-1-diamond": the saved file had no thumbnail.png once under load; passed 3 of 3 after.
- Texture library: no select mode, drag to folder, hidden sets, Export or Import from file yet. A stamp saved to the stamp library with an imported texture carries the texture's settings but not its picture, so in another browser that texture is missing.

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
Not fixed. The speed-guard test leaves both out by name (`tests/helpers/speed.js`) so it only flags new ones.

## The TIFF export test fails (found in the 1.8 work, in 1.6.0 and later)
`tests/export-recipes.spec.js` "TIFF export is a real RGBA TIFF…" times out in `page.selectOption('#xrdpi', …)`: the DPI select is not visible when the test tries to use it. Fails on the 1.6.0 build too, so it is not from a speed release. Not fixed.

## While the stamps are printed after opening a file, a few stamps point at outlines that are not on the page yet (found in 1.9, also in 1.8.0)
For about half a second after opening the busy test project (`project-4`), 18 `<use href="#s…">` in the pattern point at ids that do not exist yet, so those stamps draw nothing until the next redraw. Seen in 1.8.0 too (about 0.4 s). The test helper `settle` now also waits until the print queue is empty (test hook `printsBusy`), so no test measures a half-drawn piece. Not fixed.

## The stamp-zoom test "a motif can still be picked and Ctrl + wheel zooms…" fails (found in 1.9, also in 1.8.0)
`tests/stamp-zoom.spec.js:33` fails on `toBeVisible` ("element(s) not found") on both the 1.8.0 and 1.9.0 builds. Not caused by a speed release as far as checked; not investigated or fixed.

## Old files' layer inks (fixed in 1.10.0 by the tray)
Since the colour library became Wada's colours, a layer ink saved with an older colour name (for example "Moon Ivory" on layers 2-4 of `project-4-rect-4x3`) was left out when the file opened, so those layers printed in their stamps' own colours. 1.10.0 turns the file's colour names into tray colours (a name from the first 100-colour palette becomes the nearest palette colour, as it always did for paper, ink and stamps), so these layers print in their ink again, as they did when the file was made. Only files with layer inks differ from 1.9 (`project-4-rect-4x3` of the test files: picture-compare compares it loosely, the other two exactly), and the slider-drag perf ratio on that file moves from about 0.8 to about 1.0 of legacy: the layer ink filters are drawn again, as legacy draws them.

## Two controls share the id `tx_sc` (found in the layer update step 2; on `main` since the text update, 1.43.0)
The Stamp editor's text Scatter control (`<div class="seg" id="tx_sc">`) and the text Scale slider (`<input id="tx_sc">`) have the same id. `tests/templates.spec.js` "no id appears twice on the page" fails on it. Not caused by the layer update; not fixed in it.

**Fixed (Oct 19 2026, layer update):** the text Scatter control is now `tx_scat`. The Textures panel's Scale slider (`tx_sc`) had been reading the Scatter control since 1.43.0, because the Text panel comes first on the page, so the slider's own events were never wired; they are now.

## Test flake: speed-guard "busy" dangling references (seen again, layer update step 5)
`tests/speed-guard.spec.js` "busy: the pattern on screen stays light and every reference resolves" now and then reports `use -> #s#` (18) and `g[filter] -> #lk#` (3): stamp prints and layer ink filters that are not on the page yet when the check runs. It passes alone on re-run (4 of 4 on the step 5 build; one failure in three runs of the step 3 build too), so it is not from the layer update. Same family as the "stamps point at outlines that are not on the page yet" note above. Snapshots untouched.

## Test flakes under load (seen at 2.1.12, element update step 12)
When the targeted specs run with three or more workers on a busy machine, a few specs that passed alone fail once: `repeat-tile` "seamless: roll 1, 3, 6, 7, 21" (the 3 x 3 view is photographed while a Texture is still being drawn; alone and one worker at a time they pass with the same numbers every run), `speed-guard` "wide" and "busy" markup budgets (a slider redraw counted while stamps are still being printed; the "after Randomize" count sits at about 148,000 against a budget of 150,000, so a change that adds markup to a rolled picture will fail it), `print-batches` and `roundtrip` "open project-3 / project-4". Rerun the failing spec alone before treating it as a bug.
