# Whole-application bug test, 2.78.1 (Oct 30 2026)

Owner, Oct 30 2026: "Do a full application bug test. Check every button and function. Try to break it, document what you find, make a clean targeted plan to fix it."

Tested: the live app, 2.78.1, built from `main`, in Chromium (the sandbox), driven through its real UI by throwaway sweep scripts (not committed). A finding counts only when it was checked again by hand. Each was re-run on its own; the false alarms are listed at the end so nobody chases them again.

## What was exercised

| Area | How | Result |
| --- | --- | --- |
| Every command (135: menus, shortcuts, command search) | run in three states (empty project, after a roll, a shape selected), then Undo; page errors and non-finite numbers in the document checked after each | no error, no broken document |
| Every visible panel control (about 1,450 actions) | 16 panels, with each kind of element selected in turn (pattern, shape, text, sheet, stamp, picture, nothing): buttons clicked, sliders to both ends and the middle, number fields given -999999, 999999, empty and letters, tick boxes twice, every option of every list, odd text (markup, control characters, 300 letters) | no error, no broken document |
| Controls that change nothing | the same controls again, comparing the document, the drawing and the whole page before and after | 27 flagged, every one checked by hand: one real (B1 below), the rest expected (a segment already on, a download, a file picker) |
| Every panel by eye | a picture of each panel with its kind of element selected | B5 |
| Shortcuts (26), conflicts | pressed in a rolled piece | no error, no conflict |
| Undo and Redo | five rolls, four Undos, four Redos, then ten quick presses each way | exact, no error |
| Save and open | six Looks (Pattern type, Mandala, Tilework, Poster, Repeat, Badge) saved and opened again | the document comes back exactly |
| Crash recovery | three Looks, reload, Restore | exact |
| Exports | PNG, SVG, PDF, print proofs, repeat unit (disabled off a repeat tile, as meant), shapes library; long side 200,000 / 0 / -5 | right files; the long side is held to 256 to 8,192 |
| Damaged files | empty, random bytes, cut in half, wrong JSON, no version, a PNG renamed | refused with "That file is not a WODBLOK project.", the open project kept |
| Canvas formats | each format, a roll on each | nothing off the canvas, no error |
| Delete, group, lock | Select all and Delete, a roll, two Undos; Select all with Group, the turns, Flip, Ungroup, Lock, Hide, order; a roll over locked elements | as meant; locked elements kept |
| Copy and paste | 30 duplicates, 10 pastes | as meant |
| Text | empty, a space, 2,000 letters, emoji and right-to-left script, blank lines | no error; B4 |
| Randomize pressed six times at once | | settles, no error |
| Zoom | 25 steps in, 40 out | stops at 10% |
| Small windows | 1024 x 640, 800 x 600, 640 x 480 | B3 |
| Pattern sliders at their densest | each layout with Size, Spacing and Distance at the minimum and the counts at the maximum | B2 |
| Settings | every page (General, Colour, Guides, Speed, Files, Keys, About) | no error |

The app is sturdy: no page error anywhere in about 2,000 actions. What it found are mistakes in behaviour, not crashes.

## Findings

### B1 (high): selecting an element changes it, and adds History steps
Selecting a pattern in the Elements list (or on the canvas) rounded its Size and Spacing to the sliders' steps (15.27 became 15.5, 39.87 became 40) and saved them, two "Changed Shapes" steps in History for a click. The Shape panel did the same with a stroke width (1.6 became 2) and the shape's scale, and the effect controls (Texture, Jitter, Grade, Pressure) and Map to shape with theirs. Randomize makes such values all the time, so selecting almost any rolled pattern or outlined shape changed it a little, put two steps in History and marked the project unsaved. Cause: a panel showing an element's values fires each slider's input event (so the number beside it updates), and the slider's own handler then writes the slider's rounded value into the element.
**Fixed on `fix/2.78.2-selection-keeps-values`** (not merged): one helper, `uiFire` (01-launch-and-version.js), fires the event while `WBS.uiLoad` is held, and the handlers that write into an element (67 pattern, 82 shape, 77 map to shape, 69 effects) leave it alone meanwhile. Test: tests/bug-test-2-79.spec.js selects every element of eight Looks and checks the document and History do not change.

### B2 (medium): the densest pattern settings make the app crawl
A Tiling at Size 1% with no spacing places about 15,000 pieces: 5.9 MB of drawing markup and more than 4 seconds for each change after that; Radial with its counts at the maximum, 2.7 MB. Nothing breaks, but the app crawls and a slider dragged there by accident feels like a hang. (Randomize keeps its own patterns under about 450 pieces since 2.78.0; hand settings have no such limit.)

### B3 (medium): a narrow window cuts off the top bar
Below about 1,000 px wide the right end of the top bar is cut off and cannot be reached: at 800 px Randomize, the theme switch and the element buttons' labels; at 640 px also Undo, Redo, History and command search. The page itself also starts to scroll up and down, with the panels below the canvas.

### B4 (low): emptying a text's field leaves the old words on the canvas
Clear the Text field of a text on the canvas: the field shows nothing while the canvas keeps the last words, and nothing says so. (In a stamp's tab, emptying a text typed in place removes it, 2.25.0; the two disagree.)

### B5 (low): the Element panel is blank with a stamp selected
With a stamp element selected (its stamp not open for editing) the Element panel shows an empty panel. It lists a stamp's shapes only once the stamp is open in its tab.

### B6 (low): a command's availability lags one redraw behind the selection
Right after Select all, Group still reads as unavailable until the screen redraws, because it asks the Elements panel's Group button, which updates on the redraw. Not visible by hand (the menu opens later); it would trip a shortcut pressed in the same instant or a script.

### Seen and not a bug (so nobody chases them)
- After a reload the app starts blank and offers Restore (by design, 38-crash-recovery.js); Restore brings the work back exactly.
- Export all colourways opens the Export panel set to all colourways (its button reads "Export…"); Copy SVG reports in its own line, not the status line.
- Group and Ungroup "disabled with everything selected": only before the redraw (B6).
- Text Bottom, Spread, Left; Pattern Spiral, Weighted, Linear, Remove this source; Hide in the Elements list: they work (the sweep pressed Escape before the edit landed, or the segment was already on).
- The damaged-file message: shown; the sweep read the status line after it had cleared.

## Fix plan (one update: each step a patch, 2.79.0 when done)

| Step | Version | What | Tests | Suite importance |
| --- | --- | --- | --- | --- |
| 1 | 2.78.2 | **B1** (built, on its branch): selecting keeps the element's values; no History step for a click | bug-test-2-79 (eight Looks); the pattern, shape, effect, map-to-shape and arrangement specs (59 pass) | about 50%: shared panel code and History |
| 2 | 2.78.3 | **B6** and **B4**: Group and Ungroup read the selection, not the button; an emptied text field removes the text when it is committed (one Undo brings it back), as in a stamp's tab | Select all then Ctrl+G at once groups; emptying the field removes the text, Undo restores it | about 20% |
| 3 | 2.78.4 | **B2**: a pattern placed by hand is held to a piece limit the way a roll is (pieces grow past it, the Size slider shows the real size), or the sliders' lowest values are raised. **Owner to choose.** `npm run perf`. | the densest settings stay under about 600,000 characters and a second | about 60%: drawing |
| 4 | 2.78.5 | **B3** and **B5**: the top bar folds what does not fit into a "more" menu (Part 9 style; **owner to say the narrowest width to support**, suggestion 1,024 px); the Element panel's tab is offered only while a stamp is open, or it shows the stamp's shapes read-only (**owner to choose**) | the top bar at 1,024 and 800 px reaches every button; no blank Element panel | about 30%: panels |
| 5 | 2.79.0 | close the plan: the CI suite, the owner's word to go live | | |

Questions for the owner (in docs/PROJECT_STATUS.md too):
1. B2: hold hand-made patterns to a piece limit automatically, or raise the sliders' lowest values?
2. B3: the narrowest window to support (suggestion: 1,024 px), and a "more" menu for what does not fit?
3. B5: hide the Element tab until a stamp is open, or show the stamp's shapes read-only?
