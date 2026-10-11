# Fix plan for the UX review

> **Closed in 1.1.0.** The releases 1.0.1 to 1.0.20 were built, tested and went live; 1.0.20 was renamed 1.1.0 on your say-so. What was left open when this plan was closed (not scheduled, to be re-decided in the next plan, [`docs/plan.md`](plan.md)): N3 two groups of export buttons, N4 History thumbnails only on rolls, N5 unlabelled left rail, P2 stacked panels instead of tabs, a per-slot hex field in the colour dropdown, selection handles outside the Stamp editor, the "Opened…" message timing. See [`ux-review-2.md`](ux-review-2.md).

Source: [`docs/ux-review.md`](ux-review.md) (49 findings: B1–B4, C1–C20, P1–P6, D1–D19). Starting point: `main` at 1.0.0.
Every finding is assigned to one step below; the [coverage table](#coverage-every-finding-has-a-step) at the end checks that none is missed.

## How every step is run (from CLAUDE.md)

1. **One release per step**, on its own branch (`fix/1.0.1-…`), merged into `main` when done. Version: **1.0.X**, patch +1 per release (1.0.1, 1.0.2, … 1.0.7), as you asked. A hotfix between steps takes the next patch number too.
2. **One finding per commit**, so any single fix can be reverted.
3. **A test for each fix** that drives the real UI: the bug fails first, then passes. For example, B1's test clicks New stamp and expects one more stamp and no page error.
4. **Snapshots and golden screenshots are never updated just to pass.** When a fix changes them on purpose, I list which ones changed and why, and ask before updating.
5. **⚡ = touches drawing, dragging or sliders.** These run `npm run perf` before commit. A slowdown over 10% blocks the release.
6. **Quick tests** for the touched area before publishing. After publishing, I say what ran and what didn't, and ask about the full suite (about 13 minutes) with a risk percentage.
7. **After each pushed release**, rebuild from the clean commit and publish `dist/wodblok.html` to the preview artifact (same address). Then a short status update with a task list and % complete.
8. **Bugs found along the way** are logged in `docs/known-issues.md`, not fixed silently.
9. **The rules stay in force throughout:** no tool windows at launch, launch fully cleared in Pattern mode, no brush masks, no network, nothing hover-only in new code, commands in the registry, old files always open.

## Step 0: your decisions (they unblock later steps)

Each question is from the review's section 5. Steps that need an answer say so; everything else can start now.

| Question | Decides | Needed by | My suggested default |
|---|---|---|---|
| Q2: explanatory text already in panels | C10 | 1.0.2 | Remove it. Move the storage facts into the Save flow (C1). |
| Q3 + Q13: built-in motifs, "Draw with Claude", "Drawn by Claude" folder, ChatGPT prompt | C11, D14 | 1.0.2 | Hide Draw with Claude and the folder. Hide the built-in sets until you supply your own. |
| Q4 + Q10: one-word labels under rail icons; native hover tooltips | C4 | 1.0.2 | Labels yes. Keep native tooltips as a fallback. |
| Q5: what Save means | C1 | 1.0.4 | Save writes the real file where the browser allows it. Projects becomes "recent". |
| Q6: lighter Randomize defaults | C8 | 1.0.7 | Yes, effects off by default. |
| Q7: UK or US spelling | P1 | 1.0.2 | UK ("colour", matching Wada and the print proof). |
| Q8: new stamps go onto the current layer | B2 | 1.0.2 | Yes. |
| Q9: "+" slot on the empty stamp at launch | B4 | 1.0.2 | Yes. |
| Q11: choose the layer type when adding a layer | D1 | 1.0.3 | Yes. |
| Q12: Save a copy behaviour | D9 | 1.0.4 | Stay on the original. |
| Q14: exports and the Save dialog | D10 | 1.0.6 | Every export asks where to save where the browser can. |
| Q15: text and symmetry | D6 | 1.0.3 | Text stays readable, with mirroring as an option. |

---

## 1.0.1: Bugs and dead ends (no decisions needed) — DONE, see the outcome table below

Small fixes that remove "it looks broken" moments.

| # | Fix | Where | Test / check |
|---|---|---|---|
| B1 | New stamp works: define what the `is:` field should hold (or drop it). | `13-preview-and-stamp-tool.js` (`$('addT').onclick`) | Click `#addT`; stamp count +1; no page error. |
| B3 | File > New project: make the confirm visible (see the outcome table; the first plan, "drop it and rely on Undo", was wrong). | `18-projects-and-cover-overlay.js` (`confirm2` on `pnw`) | New with unsaved work → new project in one click; Undo restores. |
| D2 | Free place starts with the current stamp picked. A faint copy follows the pointer. The picked tile stays picked when clicked again. | `24-free-place-layers.js`, `shell.html` (`#lfpst`) | Open Free place, click the canvas → one stamp placed. |
| D3 | Wording in Art and Text modes ("Pictures you place…", "Text you place…"). The Size slider follows the selected item. | `25-art-layers.js`, `26-text-boxes.js` | Text check, plus a state test for the slider value. |
| D5 (part) | The Text-layer Ink control shows its value ("Stamp colours"), not blank. | `26-text-boxes.js` | Screenshot check. |
| D17 + C19 (part) | Undo and Redo replace the status message ("Undid: Look 'Strong ink'"). Messages clear after a few seconds. | `34-desktop-shell.js` (undo/redo), `pmsg` helper | Apply a look, Undo → message changes. |
| C3 (part) | The "Exit compare" pill stays inside the stage. Before gets the same pressed style as Split. | `20-before-after-and-randomizer.js`, `shell.html` (`.baX`, `#bab`) | Screenshot at 1440 and 1280 with a panel open. |
| C5 | Show the existing progress bar (`.fzbar`) while stamp prints are still drawing after opening a file or changing shape. "Opened…" appears only when drawing has finished. | `19-randomize-and-hold.js`, `18-projects-…` (open) | Open the v18 fixture; the bar shows, then the message. ⚡ check that nothing is slower. |
| C12 | Ctrl/Cmd+= / − / 0 / 1 zoom the canvas, not the page. Every shortcut label uses `cmdFormatShortcut` (Cmd on Mac). | `34-desktop-shell.js`, `41-navigator.js`, `shell.html` titles, panel text | Commands test, plus a Mac user-agent label check. |
| C13 | Focus ring on sliders and number fields. `--faint` raised to about 4.5:1 in both themes. Labels at least 11 px. Slider hit area at least 24 px. | `shell.html` CSS | Contrast check in a test; tab-order screenshot. Pixel goldens change (ask). |
| C15 (part) | Zoom controls also in the Stamp editor. Before and Split hidden there. | `shell.html`, `34-desktop-shell.js` | Screenshot. |
| D8 | Add **Send to back** next to Bring to front. | `09-stamp-editor-grid-and-motif-ops.js`, `shell.html` | Motif order test. |
| D11 | Repeat 3 × 3: faint tile-edge lines, a pressed state on the button, and a "Preview only. Esc to edit" chip. | `44-repeat-tile.js` | Screenshot + state unchanged. |
| P6 | Add `favicon.ico` to the web build. | `src/web/`, `tools/build.js` | No 404 in console. |

Risk for the full-suite question: about 30% (shared shell and history messages).

### 1.0.1 outcome (what was actually done)

| # | Result | Notes |
|---|---|---|
| B1 | Done | New stamp starts like the launch stamp. Test fails without the fix. |
| B3 | **Done differently** | The plan said "rely on Undo", but New project resets History, so Undo cannot bring the project back. The confirm stays and is now visible: the File menu stays open showing "Click again to discard changes", the status bar explains, and the Projects dialog's New button gets the same cue. |
| D2 | Done | Free place opens with the current stamp picked. Clicking the picked tile still toggles it off (Esc also stops placing). |
| D3 | Part | The explanatory empty-state sentence is gone. The "Size 10% vs 40%" part was not a fault (two settings). |
| D5 (part) | Not done | The blank Ink dropdown could not be reproduced. |
| D17 + C19 (part) | Done | Undo/Redo say "Undid: …" / "Redid: …". Status messages fade after 12 s; progress notes ending in "…" stay. |
| C3 (part) | Done | The pill no longer gets cut off in Before. Before already showed as pressed. |
| C5 | Part | A thin progress bar runs over the stage while stamps print after opening a file or changing the canvas shape. Not done: delaying the "Opened…" message until drawing ends. |
| C12 | Done | Ctrl/Cmd + = − 0 zoom the canvas (1 is left to the browser, which keeps Ctrl+1 for tabs). Cmd shows on a Mac in titles, panel text and status messages. |
| C13 | Done (most) | Strong slider and number-field focus rings; faint text now 4.5:1 or better on the panel in both themes; slider rows 24 px; shape labels 10.5 px. **Not done:** other text at 9–10.5 px (moved to 1.0.7). In the light theme faint text is now close to the normal grey; the contrast gain costs some hierarchy. |
| C15 (part) | **Not done** | Before/Split work in the Stamp editor, so they stay. Zoom in the Stamp editor is a feature; moved to 1.0.7. |
| D8 | Done | Send to back added. |
| D11 | Done | Edge lines, pressed button, "Exit 3 × 3 preview · Esc" pill, and Esc exits. |
| P6 | Done | `favicon.ico` shipped and precached. |

Also added to **1.0.4**: starting a new project resets History, so it cannot be undone. Decide whether New project should be a history step (undoable) once Save writes real files.

## 1.0.2: The first minute (needs Q2, Q3, Q4, Q7, Q8, Q9) — DONE; see the outcome table below

Goal: someone new can make a pattern without help.

| # | Fix | Where | Test / check |
|---|---|---|---|
| B4 | **Randomize button in the top bar.** A "+" motif slot on the empty stamp that opens Stamp editor + Motifs. A faint dashed outline of the empty stamp in the Pattern view. No panels open at launch. | `shell.html` (top bar; the `.rnd` style already exists), `13-…`, `34-desktop-shell.js` | Launch guardrail test still passes (no panels, cleared). Launch goldens change (ask). |
| B2 | New and duplicated stamps are added to the current layer automatically (`addSt` already exists). | `13-preview-and-stamp-tool.js` | Duplicate → the new stamp prints. Undo removes it. |
| C4 | Rail: shared tools in fixed slots in both views; mode-only tools in a separated group; distinct icons for Canvas, Pattern grid and Presets; one name per tool in rail, tab and command search; one-word labels if Q4 = yes. | `shell.html` (rail), `34-desktop-shell.js`, `37-command-list.js` | Rail order test in both modes. Goldens change (ask). |
| C2 (labels) | History rows read "Randomize 1, 2…" or what changed ("Colours", "Grade: Exposure"). Fix "1 steps". | `34-desktop-shell.js` (`Several changes`) | History label test. |
| C17 | Command search empty list: recent first, then what applies in this view. Disabled commands hidden or greyed. | `40-command-search.js` | Order test in Pattern view. |
| D19 | Pre-pin Randomize on the task bar, only if B4's top-bar button is not taken. | `48-task-bar.js` | — |
| P1 | One spelling everywhere (Q7). | `shell.html`, modules with UI strings | Text grep in a test (no "Color" if UK is chosen). |
| C10 | Apply Q2: remove or restyle explanatory sentences in panels. | `shell.html`, `20-…`, `27-stamp-library.js`, `32-layers-panel.js`, `31-colour-grading.js`, `29-grid-tool.js` | Text check. |
| C11 + D14 | Apply Q3/Q13: hide "Draw with Claude", the "Drawn by Claude" folder and the ChatGPT prompt buttons, and the built-in sets if chosen. **Old files that use built-in motifs must still open and print.** | `shell.html`, `21-motif-library-ui.js`, `14-presets-…`, `05-motif-data.js` | Fixtures still open identically (state snapshots unchanged). |

Risk: about 40% (launch state, rail and text across many panels).

### 1.0.2 outcome (what was actually done)

The Step 0 questions were not answered, so my suggested defaults were used, except where noted.

| # | Result | Notes |
|---|---|---|
| B4 | Done | Randomize button in the top bar (both views). An empty project shows "Add a motif" on the canvas (Pattern view only): it opens the Stamp editor and Motifs. An empty stamp in the tray shows a "+". **Not done:** the dashed outline of the empty stamp on the canvas (the cue above replaces it; drawing into the artwork would risk exports and snapshots). Launch is still Pattern, cleared, no panel open (the launch test covers it). |
| B2 | Done | New and duplicated stamps are added to the current layer; the status line says which. A new blank stamp therefore prints as blank cells in a repeat until it has a motif. |
| C4 | Done | Shared tools (Randomize, Colours, Presets, Stamp library, Colour grading, Textures, History, Workspaces) are the first eight buttons in both views; the view's own tools follow. Pattern grid and Presets have new icons. One name per tool in rail, tab and command search (a test checks all three agree). **Changed on your instruction:** the first build showed tool names beside the icons in wide windows; that was removed, and names show only when the pointer rests on an icon or when it has keyboard focus. **Not done:** renaming Arrangement and Pattern grid (that is C18, in 1.0.3). |
| C2 | Done | History rows say "Randomize 1, 2, …" and "Look “…”"; "1 step". Other steps still say what changed, or "Several changes". |
| C17 | Done | Command search with nothing typed: recent commands first, then ones that apply in this view. |
| P1 | Done | British spelling in the interface (colour, centre). Colour *names* in the library ("Slate Color", "Neutral Gray") and Wada's book title are left as printed. Prompts sent to other AI tools are not changed. |
| C10 | Done | 11 explanatory sentences removed from panels (Randomize, Colours, Stamp library, Layers, Pattern grid, Motifs, Motif list, grade masks, symmetry). A test scans every tool in both views and in the layout modes, grade masks, repeat tile and book cover. **Kept as a short label (your call, kept):** the Stamp library says "Saved in this browser", the only statement of where the library lives. **Not touched:** dialogs (Import artwork's hint, the Projects footer) and the Import artwork prompt buttons. |
| C11 + D14 | **Part** | Done: "Draw with Claude" is hidden; the "Drawn by Claude" folder only shows when it holds an old project's drawings. **Not done, by decision:** the built-in motif sets (Plants, Animals, Medieval weapons, Misc, Dots) stay while you upload your own motifs; revisit when yours are in. |
| D19 | Skipped | Randomize now has its own top-bar button, so pre-pinning it is not needed. |

**Tests for 1.0.2:** the full suite was run twice. First run (with the wide rail): 122 passed, 31 failed, of which 2 were tests of mine asserting text I changed on purpose (fixed) and 29 were screenshot or SVG differences. After the tool-name column was removed, only 10 screenshots still differed (launch, before-view and 8 panels) plus 2 SVG snapshots that are the known timing flake (they pass 3 of 3 on their own). With your approval, the 10 screenshots were regenerated (no state snapshot changed, nothing else touched). Final run on the release commit: 152 passed, 0 failed, 5 skipped (18.6 minutes).

## 1.0.3: Layers and placing things (needs Q11, Q15)

| # | Fix | Where | Test / check |
|---|---|---|---|
| D1 | Layers "+" opens a menu: Repeat pattern / Frame / Free place / Picture / Text. Each adds a layer of that type above the current one. The Layout tabs become "This layer is a", and the type shows in the Layers list. | `32-layers-panel.js`, `23-frame-layers.js`, `shell.html` (`#lmode`) | Add each type → the existing layer is unchanged. |
| C18 | Rename to **Layers** and **Layout**, show the selected layer's name in both headers, and rename Pattern grid to **Guides**. | `shell.html`, `37-command-list.js` | Labels test. |
| D6 | Text on a stamp stays readable under symmetry, with a "Mirror with symmetry" toggle. | `22-text-tool.js`, `07-symmetry.js` | State test with 4-way symmetry. Snapshot changes for text-plus-symmetry (ask). |
| D7 ⚡ | Drag-to-select box on empty block space, with Shift to add. | `12-selection-and-split.js` | Drag a box → motifs selected. Perf: drag. |
| C7 ⚡ | Drag a motif from the library onto the block (as well as click-to-stamp). The selection is drawn in the accent colour with corner handles and a rotate handle. | `21-motif-library-ui.js`, `12-…`, `09-…` | Drag-and-drop test. Perf: handles move only the selected motif's transform. |
| D5 (rest) | In a Text layer, typing edits the selected text box; **Add text** (renamed from Stamp text) adds a new one. | `26-text-boxes.js` | Type → one box changes; Add text → a second box. |
| D16 + C14 (rows) | Each row gets a "⋯" menu (rename, duplicate, delete). Buttons always visible on the selected row, never hover-only. Two-colour swatch for "Stamp colours". Applies to the Layers, History, Motif list, motif library and texture list. | `32-layers-panel.js`, `34-…` (history), `21-…`, `17-texture-panel-…`, `shell.html` CSS | Every row action can be reached without hovering. |

Risk: about 60% (selection and drawing). Perf required.

### 1.0.3 outcome (what was actually done)

Defaults were used for Q11 (the "+" asks for the layer type) and Q15 (text stays readable under symmetry, mirroring optional).

| # | Result | Notes |
|---|---|---|
| D1 | Done | Layers "+" opens a type menu; the list shows each layer's type; the Layout section says "Layer type" and names the layer. |
| C18 | Done | Arrangement is "Layout", Pattern grid is "Guides" (rail, tab, command search). Guides is pattern-wide, so it gets no layer name. |
| D5 (rest) | Done | The button reads "Add text". Typing already edited the selected box; a test now pins it. |
| D6 | Done | Text stays out of symmetry unless "Mirror text with symmetry" is ticked (stored as `sym.tx`). Old files show their letters once, not mirrored. |
| D7 | Done | Drag a box on empty block space to select; Shift adds. |
| C7 | Part | Drag from the library onto the stamp works; click-to-stamp unchanged; selection is accent coloured. **Not done:** corner and rotate handles. |
| D16 + C14 | Part | History, Motif list and texture row buttons are always visible (hidden buttons could not take keyboard focus). **Not done:** the "⋯" row menu and the two-colour "Stamp colours" swatch. |

Perf ratio 0.818. Full suite (Chromium): 164 passed, 0 failed, 5 skipped. No snapshots or goldens changed.

## 1.0.4: Saving you can trust (needs Q5, Q12; highest risk, platform code)

| # | Fix | Where | Test / check |
|---|---|---|---|
| C1 | **Save** writes the real file in Chrome and Edge (the handle code already exists) and keeps a browser copy. In Safari and Firefox it is called **Download**. Menu renamed ("Save as file…", "Save to this browser" under Projects only). Tab title shows the name and "•" when unsaved. No unsaved dot on an untouched new document. | `src/platform/web.js`, `39-web-app.js`, `18-projects-…`, `33-clear.js`, `shell.html` | Round-trip and recovery tests. Launch test for no dot. Old v18 files open and are never overwritten. |
| D9 | Save a copy keeps you on the original (or is renamed "Duplicate and open", per Q12). | `18-projects-…` | State test. |
| N1 (new, from 1.0.1) | Starting a new project resets History, so it cannot be undone, and a blank untouched document already counts as unsaved. Decide whether New project becomes an undoable history step, and stop counting a pristine document as unsaved. | `33-clear.js`, `34-desktop-shell.js` (`wbResetHist`), `18-projects-…` (`dirty()`) | New → Undo restores the previous project. A fresh launch shows no unsaved dot. |
| C19 (restore) + P5 | "Restore unsaved work / Dismiss" also shown in the empty canvas area after a crash. The Projects footer text moves into the Save flow. | `38-crash-recovery.js`, `shell.html` | Recovery test. |

Risk: 60–90% (saving, opening, `src/platform`). Run the full suite before merging.

### 1.0.4 outcome (what was actually done)

Decisions (Q5, Q12, N1) came from the user and replaced the plan's defaults:

| # | Result | Notes |
|---|---|---|
| C1 (Q5) | **Done differently** | **Save project** writes the `.wodblok` file only (in place after the first save in Chrome and Edge; a download elsewhere). **Open project** opens a file. **Open projects folder** (Chrome and Edge) becomes **Projects** once a folder is chosen and lists that folder's `.wodblok` and `.wodblok.json` files; **Close folder** forgets it. The folder is remembered between visits when the browser allows. The top-bar Export button is gone: PNG, SVG, Copy SVG code and the cover PDF/PNG moved into the Export tool. The browser project store, "Save a copy" and "Download project file" were removed (no existing users, so no migration). Export/Import everything are now **Back up everything** / **Restore from backup** and no longer include projects. |
| D9 (Q12) | Not needed | "Save a copy" no longer exists. |
| N1 | Done | New project says "Click again: can't be undone" (button and status line). A blank document no longer counts as unsaved, so a fresh launch shows no dot. |
| C19 (restore) + P5 | Not done | Left for a later release. |
| Side effect | Art from a saved project | The live-linked "Use a project" art (it read the browser store) was removed. "Use a project…" now picks a `.wodblok` file and uses its picture as a fixed image. |

Not tested in a real browser: the folder picker and in-place saving (tested with stand-ins). Perf not run (no drawing, dragging or sliders touched). Full suite (Chromium): 153 passed, 15 failed, 6 skipped before approval. All 15 were snapshots: 3 panel goldens (text only: top-bar labels, status line, Layout/Guides names, version) and 12 SVG hashes (the order of `class` and `style` on the art `<svg>`). Approved by the user and regenerated.

## 1.0.20: Tabs and the top bar (UX review 2: N1, N6)

- **N1:** when a panel group has more tabs than fit, the chosen tab is scrolled fully into view and the edge that hides more tabs fades (the strip was already scrollable, but "Colours" showed as "Colou" with nothing saying there was more). Chosen over stacking panels (the bigger P2 change).
- **N6:** "Open projects folder" and "File" have an outline like Save project, so they read as buttons.
- Not done, on purpose: **N4** more History thumbnails. Only rolls get a picture by design (a picture per hand edit costs speed; `history-thumbs.spec.js` pins this). **N5** left-rail labels: the rail is 15 icons by design; names show on hover and in the panel's tab.
- Tests: `tests/tabs-1020.spec.js`.

## 1.0.19: Text and panels (UX review 2: N2, N4 label, N7)

- Randomize no longer prints the "Last roll: …" paragraph (the status line already says what the roll did). Import artwork's labels lose their "1." / "2." numbers. History's "+" is a labelled **Save snapshot** button. Canvas shape names ("Rectangle") fit their buttons.
- Left as they are, on purpose: "Clicking a colour sets" is a control label (it names a dropdown), not explanation. **N3** (two groups of export buttons) is not merged: the fixed-size PNG / SVG buttons are one-click and are used by commands and the perf test; "Export now" with the format tabs is the sized version. Needs a decision before removing either.
- Tests: `tests/panels-1019.spec.js`.

## 1.0.18: Textures library and "Paper shows through" (D13, D4)

- **D13:** the Textures tool is now only the library: create, rename, edit, duplicate, delete. The "Apply to" block is gone; a texture is applied where you work (Canvas, Layers, Stamp and Text panels, "Add texture", which already lists the library). Nothing in files changes; old files open.
- **D4:** Pictures layers have a "Paper shows through" switch. It drops the light colour of every picture on that layer and keeps the dark, so line art and scans print like a stamp. One SVG filter per layer (only when switched on), saved in the layer as `akk`; off by default, so existing files and exports are unchanged.
- Tests: `tests/art-textures.spec.js`.

## 1.0.17: Layout (D12, P3, P4, part of P2)

- **D12:** applying a workspace sets exactly that arrangement and the Workspaces tool closes with the rest (it used to stay open as an extra group). A saved workspace no longer remembers the Workspaces tool, so applying one never reopens the list. The starting workspaces have at most two groups (a test checks it).
- **P2 (part):** a panel floated out of the dock lands below the zoom controls, not on them. **Not done:** opening a second tool as a stacked group instead of a tab. Stacking squeezes every panel (the very problem D12 was about) and many tests and habits rely on tabs; say if you still want it.
- **P3:** the book cover guide labels (BACK, FRONT, SPINE, BARCODE) sit on small solid white chips with a magenta outline. They were not moved outside the bleed: the bleed is only 0.125 in, too thin for a label.
- **P4:** the stamp tray has a small arrow button that collapses it to a thin strip (about 32 px instead of 79 px); the choice is remembered. The floating motif bar follows the tray's height.
- Files: `shell.html`, `18-…` (cover guides), `34-desktop-shell.js`, `42-workspaces.js`. Tests: `layout-1017.spec.js`; `workspaces.spec.js` reads the new behaviour.

## 1.0.16: Easy wins (C9, C16, C20, D15; D18 and C6 already covered)

- **C9:** the colour slots are Paper, Ink, Accent and Accent 2 (the print proof already said Paper and Ink; its 3rd and 4th colour are now Accent and Accent 2), also in "Clicking a colour sets". The Add colour tile is first in the library. The hex field and the colour picker (with Chromium's eyedropper) are in the Add colour form, as before; a per-slot hex field in each dropdown was not built.
- **C16:** each starting Look has a small picture made from its own settings (a sample in the project's paper and ink with the look's contrast, saturation, warmth, fade and texture), so it costs nothing to draw. Looks you save keep their own picture.
- **C20:** the Display menu has a "Show while editing" heading and a check mark on whatever is switched on.
- **D15:** the stamp library's name field says what an empty name will become ("Stamp 3"), and saves are confirmed in the status line like every other save.
- **D18:** already true: the Variations tiles appear at once with a shimmer and fill in one by one as each is ready. **C6:** moot, since the top-bar Export button was removed in 1.0.4 and the image exports live in the Export tool.
- Files: `shell.html`, `04-…`, `27-stamp-library.js`, `45-print-proof.js`, `46-presets.js`. Tests: `easy-wins.spec.js`; `palette.spec.js` reads the new labels.

## 1.0.15: The "⋯" row menu (rest of D16)

Layers rows and snapshot rows now have one "⋯" button. Layers: Rename, Duplicate, Move up, Move down (an alternative to dragging) and Delete (not on the last layer). Snapshots: Rename and Delete. The menu opens beside the button, its items are real buttons (Tab, Arrow keys and Enter work), and it closes on choosing, Esc or a click elsewhere. Rename used to be a double-click nobody could discover. The row buttons of History, the Motif list and the texture list stay as they were: they are already visible (1.0.3) and have no hidden actions. The old Duplicate and Delete icons on Layers rows are replaced by the menu. Files: `04-canvas-and-stamp-outlines.js` (`rowMenu`), `32-layers-panel.js`, `34-desktop-shell.js`, `shell.html`. Tests: `row-menu.spec.js`.

## 1.0.14: Selection handles (rest of C7)

A single selected motif in the Stamp editor now shows four corner handles (drag outward or inward to scale it) and a round handle above it (drag to turn it; Shift snaps to 15 degrees). With several motifs selected there are none. A drag is one undo step (the history waits until the drag ends); the handles follow the editor's zoom. Files: `09-stamp-editor-grid-and-motif-ops.js`, `11-pressure-flooding-block-edges.js`, `34-desktop-shell.js`. Tests: `selection-handles.spec.js`. Not done: handles in the Pattern view's Free place layers (those already have their own handles).

## 1.0.13: No text under 11 px (rest of C13)

All text that was 8 to 10.5 px (29 rules: small labels, units, captions, group headings, hints, the version badge) is now 11 px. A test opens every tool panel in both views and fails on any visible text under 11 px (it fails on 1.0.12). Layouts were checked by eye on the Canvas, Layout and Randomize panels; the pixel goldens that include affected text change. Files: `shell.html`. Tests: `text-size.spec.js`.

## 1.0.12: Three small ones (C15 rest, C14 swatch, C19 recovery)

- **Empty band (C15):** the Stamp editor no longer keeps a blank band for the motif bar. The bar floats over the bottom of the editor, above the stamp tray, only while a motif is selected, so the editor is about 80 px taller. The pixel golden for the Stamp editor view changes.
- **Swatch (C14):** the default ink in Layers ("Stamp colours") shows a swatch split between the project's ink and background, instead of an empty dashed box.
- **Recovery cue (C19):** after a crash the "Restore unsaved work / Dismiss" offer also shows as a pill on the empty canvas in the Pattern view (the status-bar buttons stay).
- Files: `shell.html`, `32-layers-panel.js`, `38-crash-recovery.js`. Tests: `small-ones.spec.js`, `recovery.spec.js`.

## 1.0.11: Zoom in the Stamp editor and History thumbnails (C15 zoom, C2 thumbnails)

- **Stamp editor zoom (C15):** the zoom controls (− / Fit / +) now show in the Stamp editor, with Ctrl/Cmd + wheel and Ctrl/Cmd + = − 0. 1x (Fit) to 8x; zoomed in, the editor scrolls inside its box; picking and dragging motifs work at any zoom. **Not done:** the empty band under the block (C15 rest).
- **History thumbnails (C2):** a step named by whoever made it (a Randomize roll, a look, a palette) gets a 40x30 picture, taken once from the finished piece 1.5 s after the step when nothing is happening (never during a drag, a roll or other busy work; waits and retries). Snapshots get one when they are made. Steps made by hand have none. Pictures are kept in memory (steps) and with the snapshots in this browser; they are not written into project files. Speed: perf ratio 0.843 against v100 (was 0.818); roll time unchanged.
- Files: `34-desktop-shell.js`, `41-navigator.js`, `shell.html`. Tests: `stamp-zoom.spec.js`, `history-thumbs.spec.js`.

## 1.0.10: Exports ask where to save first (rest of Q14)

Every export (Export now, Export all as one zip, the 3x PNG, the print proofs, the cover PNG/PDF, Save project) now opens the Save dialog first and renders afterwards, so the browser still counts the click as recent. Before, a long export (the zip took 23 s) lost the dialog and silently downloaded. Cancelling the dialog stops the export. Browsers without a Save dialog download as before; the Claude artifact runtime is unchanged. Files: `src/platform/web.js` (`files.pick`), `index.js`, `14-…`, `30-…`, `33-…`, `43-…`, `45-…`. Tests: `tests/export-dialog.spec.js`.

## 1.0.9: Compare and history (plan items C3, C14 rest; C2 thumbnails left out)

| # | Result | Notes |
|---|---|---|
| C3 | Part | Before and Split now compare with the step before the current one (the Start when there is none) until another step or snapshot is chosen in History; the A label and the History "Compared to" row say which. **Not done:** folding Grade's "Hold to compare" into Before. It shows the ungraded colours, which Before cannot, so it stays. |
| C14 (rest) | Done | A test scans the page's CSS: every rule that reveals something on `:hover` has a keyboard or selected-row twin. |
| C2 (thumbnails) | Not done | Left for its own release: it needs a speed check (roll time and drags must not change). |

Files: `20-before-after-and-randomizer.js`, `34-desktop-shell.js` (`wbHistIdx`, `wbHistLabel`). Tests: `compare.spec.js`, `row-actions.spec.js`; `undo.spec.js` now reads the history rows from `#hhl` (the "Compared to" row also names a step).

## 1.0.8: Randomize amounts (Q6, answered by the user)

Each main switch in the Randomize panel is now a slider from 0 (off) to 100 (fully on); Colours keeps its plain switch. Today's choices are the starting values (on is 100, off is 0), so a default roll comes out exactly as before and no Randomize snapshot changed. Below 100, a feature with several kinds of change (the arrows) lets only some of them happen on a roll (at least one), and a feature without kinds happens on some rolls; Colour grade values and the Print effects edges are also scaled down. Old saved on/off choices load as 100/0. "Layer opacity and blend" is now "Opacity and blend". Files: `src/shell.html`, `34-desktop-shell.js` (panel), `20-before-after-and-randomizer.js` (roll). Tests: `tests/randomize-amounts.spec.js`; `repeat-tile.spec.js` sets the sliders instead of ticking boxes.

## 1.0.7: Back up / Restore removed (Q14 answered by the user)

Back up everything and Restore from backup (the old Export/Import everything) are gone, along with their commands and tests: the app saves and opens projects, and exports images and proofs. The other half of Q14 (one Save-dialog rule for every export) is not done: "Export all as one zip" takes long enough that the browser drops its Save dialog and downloads instead. The releases planned below as 1.0.6 to 1.0.8 are now 1.0.8 (Randomize amounts, Q6), then compare/history, export and colour, and feel and speed.

## 1.0.6: A renamed project is a new file (bug found by the user in 1.0.5)

A project opened from a file was written back into that file even after it was renamed, so saving overwrote the original. Now a project is written back into its file only while its name is unchanged; rename it, even with nothing else changed, and Save makes a new file (into the projects folder when one is chosen, else the Save dialog) and leaves the original alone. The releases planned below as 1.0.6 to 1.0.8 become 1.0.7 to 1.0.9. Files: `src/modules/33-clear.js`. Tests: `tests/save-rename.spec.js`.

## 1.0.5: Save into the projects folder (added on the user's request)

Because of this release, the releases planned below as 1.0.5, 1.0.6 and 1.0.7 move to 1.0.6, 1.0.7 and 1.0.8.

When a projects folder is chosen, Save project writes a project that is not tied to a file yet straight into that folder, as `<name>.wodblok`, without opening the Save dialog. It never replaces a file that is already there (`name-2.wodblok`, `name-3.wodblok`, …). A project opened from the folder, or saved before, is written back to its own file. The folder is now picked with write access; the browser asks for it once (and again after a reload). If the folder cannot be written, Save falls back to the normal Save dialog or download. Files: `src/platform/web.js` (`folderWritable`, `saveToFolder`), `src/modules/33-clear.js`. Tests: `tests/projects-folder.spec.js`.

## 1.0.5: Compare and history

| # | Fix | Where | Test / check |
|---|---|---|---|
| C3 | One compare. Before/Split defaults to "the step before this one"; History A/B pickers choose anything else; Grade "Hold to compare" folds into Before. | `20-before-after-and-randomizer.js`, `31-colour-grading.js` | Before after a roll shows the previous roll. |
| C2 (thumbnails) ⚡ | A small thumbnail on Randomize rows and snapshots, taken from the picture the roll has already finished, or drawn lazily when History is open. Never during a drag. | `34-desktop-shell.js`, `19-randomize-and-hold.js` | Perf: roll time and slider drag unchanged. |
| C14 (rest) | Whatever hover-only controls remain after 1.0.3 (History Compare button, rail labels if Q4 was no). | `shell.html` CSS | No `:hover`-only reveal rules left (grep test). |

Risk: about 50% (history).

## 1.0.6: Export and colour (needs Q14)

| # | Fix | Where | Test / check |
|---|---|---|---|
| C6 | The **Export** button opens one sheet: format (PNG/JPG/SVG), long side, Export, then saved recipes and Print proof. The Export recipes rail tool goes or becomes recipes only. | `36-export-everything.js`, `43-export-recipes.js`, `45-print-proof.js`, `shell.html` | Each format downloads. Recipes still work. |
| D10 | One rule for the Save dialog across all exports (Q14). | `src/platform/web.js`, `43-…`, `45-…`, `36-…` | Export tests on both paths (dialog on and off). |
| C9 | Colour slots named **Paper / Ink / Accent / Accent 2** (as the print proof already does). Hex field and eyedropper in each slot's dropdown. The add-colour tile moves to the top of the library. | `14-presets-and-layer-grid-ui.js`, `shell.html` | Labels; a hex entry changes the colour. |
| C16 ⚡ | Built-in Looks get a preview: a static image made once, or rendered lazily like Variations. | `46-presets.js` | Perf: opening the Presets panel. |
| D18 | Variations tiles fill in as each is ready, with a shimmer while waiting. | `47-variations.js` | Screenshot during "More". |
| D15 | Stamp library: the default name is the stamp's own; confirm in the same place as other saves. | `27-stamp-library.js` | Save with no name → a sensible name. |
| C20 | Display menu uses check marks, with a "Show while editing" heading. | `shell.html`, `34-…` | Screenshot. |

Risk: about 40%.

## 1.0.7: Feel and speed (needs Q6)

| # | Fix | Where | Test / check |
|---|---|---|---|
| C8 ⚡ | Lighter Randomize defaults (stamps, layout, colours, frame; effects opt-in). Hold the stamp tray with the picture during a roll. **Measure on your Mac before deciding.** | `19-randomize-and-hold.js`, `20-…` | Randomize snapshots change (ask). Perf: drag on a default roll. |
| D4 ⚡ | Art layer "Paper shows through" toggle (drop the light colour). | `25-art-layers.js` | Perf with several pictures. |
| D12 | Starting workspaces open at most two groups, and Workspaces closes after applying one. | `42-workspaces.js` | Screenshot. |
| D13 | Textures tool is the library (edit, rename, delete). Applying happens where you are working (Canvas, Layer, Stamp). | `17-texture-panel-and-previews.js`, `shell.html` | Textures still apply everywhere. Old files open. |
| P2 | New panels stack in the side dock by default. Floating panels open at the stage edge, not over the canvas. | `34-desktop-shell.js` | Screenshot. |
| P3 | Book cover guide labels on solid chips, outside the bleed. | `30-print-cover.js` | Screenshot. |
| P4 | The stamp tray can collapse to a thin strip. | `shell.html`, `34-…` | Screenshot at 1280×720. |
| C15 (rest) | The empty band under the block in the Stamp editor goes, or is used for the motif toolbar. | `shell.html` | Screenshot. |

Risk: about 70% (Randomize and drawing). Perf required. Full suite before merging.

## After 1.0.7: checks I can't do here

- Safari/WebKit run (`npm run test:webkit`) and the speed check on your Mac (`npm run perf-baseline`).
- Chrome's real Save and Open dialogs; the installed app (double-click a `.wodblok`, offline, update dot).
- A second UX pass on the finished 1.0.7 build, with the same scripts as the review, comparing screenshots before and after.

---

## Coverage: every finding has a step

| Finding | Step | Finding | Step | Finding | Step |
|---|---|---|---|---|---|
| B1 | 1.0.1 | C11 | 1.0.2 | D1 | 1.0.3 |
| B2 | 1.0.2 | C12 | 1.0.1 | D2 | 1.0.1 |
| B3 | 1.0.1 | C13 | 1.0.1 | D3 | 1.0.1 |
| B4 | 1.0.2 | C14 | 1.0.3 + 1.0.5 | D4 | 1.0.7 |
| C1 | 1.0.4 | C15 | 1.0.1 + 1.0.7 | D5 | 1.0.1 |
| C2 | 1.0.2 + 1.0.5 | C16 | 1.0.6 | D6 | 1.0.3 |
| C3 | 1.0.1 + 1.0.5 | C17 | 1.0.2 | D7 | 1.0.3 |
| C4 | 1.0.2 | C18 | 1.0.3 | D8 | 1.0.1 |
| C5 | 1.0.1 | C19 | 1.0.1 + 1.0.4 | D9 | 1.0.4 |
| C6 | 1.0.6 | C20 | 1.0.6 | D10 | 1.0.6 |
| C7 | 1.0.3 | P1 | 1.0.2 | D11 | 1.0.1 |
| C8 | 1.0.7 | P2 | 1.0.7 | D12 | 1.0.7 |
| C9 | 1.0.6 | P3 | 1.0.7 | D13 | 1.0.7 |
| C10 | 1.0.2 | P4 | 1.0.7 | D14 | 1.0.2 |
| | | P5 | 1.0.4 | D15 | 1.0.6 |
| | | P6 | 1.0.1 | D16 | 1.0.3 |
| | | | | D17 | 1.0.1 |
| | | | | D18 | 1.0.6 |
| | | | | D19 | 1.0.2 |

49 of 49 findings assigned. Seen once and not reproduced: the stamps that briefly vanished after a shape change (C5) get logged in `docs/known-issues.md` in 1.0.1, and the C5 progress bar covers the visible symptom.
