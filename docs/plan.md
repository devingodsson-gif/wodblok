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
- picture-compare: the temporary 0.6 tolerance became a permanent 0.05 (mean of 255): print sheets are made up by timing, so grain moves ~0.01 between runs (measured main vs this branch). A build without the hook is given 2.5 s extra.
- Seamless-tile right/down limit is 0.12*half+0.25 (was +0.15): 1.9's smaller print sheets move grain by about 1 of 255 on the CI renderer.

## 1.10.0: Colour tray and Colourways
- **The tray** (`src/modules/50-tray-core.js`): the project's colours, up to 16 (`TRAY_MAX`), each a place with a stable id (`proj.ts`). Everything that has a colour holds a colour reference: `@k3` follows tray place k3; `#rrggbb[aa]` is a fixed colour of its own (locked); `#rrggbb[aa]|k3` is fixed and remembers the place it was locked from. Colours carry their own opacity (the `aa`). `col()` in module 04 resolves references, so drawing code is unchanged.
- **Colourways**: `proj.cw` is a list of colour sets for the same places (`{id, n, c:{place: colour}, m:{place: name}}`), `proj.cwa` the one showing. Every colourway has every place, so links stay valid; switching only changes colours. History, saving, crash recovery and compare carry it all because it lives in the document.
- **On screen** (`52-tray-ui.js`): the dock above the canvas in both views (7 places, "+" to add, up to 16; click to edit, drag to move; a colourway switcher when there are two or more); colour wells with a lock for Paper, Ink, stamp ink, layer ink, the Replace colour and text colour; the Colours tool rebuilt (the tray as a list with what uses each colour, paper and ink, saved trays in folders with Wada's 348 sets built in, search, your own trays and folders). The palette list left Presets (it is in Saved trays); old custom palettes become saved trays.
- **Picker and dropper** (`51-colour-picker.js`): one picker for every colour: saturation/brightness square, hue, opacity, hex/RGB/HSB fields, recent colours. Our own dropper renders the finished picture (the export vector) at screen size and reads the pixel under the pointer with a magnifier; Alt+click keeps the opacity. Colour fields in other tools (grade colour mask) open the same picker.
- **Colourways tool** (`53-colourways.js`): cards with a picture of the piece in each colourway, switch, new, rename, duplicate, move, delete; export every colourway as one zip (PNG/JPG/SVG, long side), each file named after its colourway.
- **File format 20**. Older files open and keep their colours: their colour names become tray colours (paper, ink, accents and any stamp/layer inks, up to 16; more stay fixed) linked where they were used. Older files' layer inks show again: since the Wada colours came in, layer inks with an old colour name were silently left out; the tray brings back the file's own colour (see known issues).
- Randomize, Looks, Variations, the print proof, the stamp library and the grade colour mask work with the tray (a new palette fills the tray's first places; locked colours are never changed by Randomize).
- Not in this release: making a colourway switch instant (stamps are re-printed in the new colours, about the same time as a big slider change); the dropper sampling one layer only; drag a tray colour onto the canvas.
- New tests: `tests/colour-tray.spec.js`; palette, palette-names, presets, print-proof, easy-wins, small-ones, rail and format tests updated for the tray.

### 1.10.0 follow-up: Export recipes regrouped
Export recipes now has four groups (Recipes, Custom export, Quick, Print proof) and a Colourways switch at the top (Showing / All, only when there is more than one colourway). "All" makes every export once per colourway in one zip, each file named after its colourway. The export block left the Colourways tool; its Export… button opens Export recipes with All chosen.

## 1.11.0: Templates
- **A template is a saved project** (.wodblok, format 20; no format change). Its kind comes from the project: book cover on → Book, repeat tile (`dim.rt`) → Repeating pattern, else Normal canvas.
- **File menu**: New project, New from template…, Clear, Open…, Save as template… (commands `template.new`, `template.save`). Launch is unchanged.
- **Picker** (`54-templates.js`): three kinds (remembered), Starting points (Blank first, then 3 built-ins per kind) and Yours. Opening works like New project (two-tap when there is unsaved work), goes through `openData`, leaves no file link, no name, the unsaved dot off, history reset.
- **Yours**: stored in the browser through the platform (`collection('templates')` for the bytes, kv `wb111_templates` for the list with a small thumbnail). Rename, Download, Delete (two-tap), Replace on the same name, Add from file (newer formats refused).
- **Built-ins** are made by `npm run templates` from `tools/templates/recipes.js` (drives the built app, built-in shapes and plain colours only) into `src/templates/<kind>/*.wodblok` and `src/data/templates.js`. The stored files drop their own thumbnail (the list holds it). Files total about 1.5 MB (art image per file), which the build carries as base64 (about 2.2 MB).
- Tests: `tests/templates.spec.js`; `save-project.spec.js` File menu list updated.

## 1.11.1: Template picker close button id (hotfix)
- The picker's close button reused the id `tpx` of the repeat tile's "Exit 3 × 3 preview" pill, so it took on the pill's styling and its click handler was attached to the wrong element. It is now `tpclose`; nothing else changed.
- Test: `tests/templates.spec.js` checks that no id appears twice on the page and that the picker's X closes it. `repeat-tile.spec.js` (UX review D11) passes again.
