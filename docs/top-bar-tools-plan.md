# Plan: all toolbar items into the top bar (written Oct 24 2026)

**Outcome (Oct 25 2026):** the owner chose a smaller version, built as 2.44.0 (docs/plan.md): no tool strip; the rail's eight buttons went into the menus (a new Image menu holds Canvas and Grid) and two top bar buttons (History beside undo, a gear beside Randomize). The element bar and the view bar stay above the canvas. The rest of this file is the original plan, kept for reference if the strip is ever wanted.

Owner, Oct 24 2026: "Plan on getting all the toolbar items into this bar too. Make the plan, tell me and save it." Desktop only for now. Nothing here is built; the owner has not yet approved the open choices at the end.

## What exists today (the inventory)
| Where | Items | Code |
|---|---|---|
| Left rail (`nav.rail`) | Close all panels, Canvas, Colours, Elements (lyrs), Grid, History, Randomize, Export recipes, Pattern, Stamp, Shape, Text, Element list, Paint; a "more" tray to add or remove rail buttons; drag to reorder | shell.html, 34-desktop-shell.js (`railBtns`, `MODEP`, `RO`, `wsRender`) |
| Element bar (`#elb`, above the canvas) | Select, then one button per element kind (Pattern, Text, Paint, Stamp, Shape); arms the tool at once | 65-element-core.js `elBar`, 73-add-bar.js `AB`, `abSync` |
| View bar (above the canvas) | Repeat 3 x 3, Before / Split, Stamp texture, Canvas texture, Grading masks, dots, zoom (out, level, 100%, in, hand) | shell.html `#tpvg #bacmp #viewctl #zoomc` |
| Colour tray (`#tyd`) | the colour swatches of the pattern | shell.html |
| Task bar (`#tbar`) | context actions while a tool is armed | 48-task-bar.js |
| Top bar right (done in 2.43.0) | Undo, Redo, Search, Randomize, light/dark | stays |

The menu bar (2.42.0) already reaches every one of these by name (Elements > add, Window > panels, View > toggles), so the strip below is the quick, visible way to the same commands, not a second set of commands.

## The problem with one row
At 1280 to 1440 px the single row (WB mark and nine menus about 500 px, name centred about 200 px, right tools about 200 px) leaves roughly 300 px free on each side of the name. Seven element tools plus fourteen panel buttons plus zoom do not fit, and putting them beside the centred name makes the name collide below about 1500 px.

## Recommended layout (A): one header, two rows, like Photoshop's menu row plus options bar
- Row 1 (as 2.43.0): mark, menus, name in the middle, undo / redo / search / Randomize / light-dark.
- Row 2, the tool strip, same surface and colour as row 1, no divider line, `--h-sm` quiet icon buttons, 15 px icons (Part 9 toolbar size), grouped by thin separators:
  1. **Tools:** Select, Pattern, Text, Paint, Stamp, Shape (the element bar, moved as is).
  2. **Panels:** Canvas, Colours, Elements, Grid, History, Export recipes (the rail's panel openers; Randomize stays in row 1).
  3. **View (right end):** Repeat 3 x 3, Before / Split, texture and mask toggles, zoom.
- The rail goes away; the canvas gets the column back (about 52 px wider), the strip costs about 36 px of height.
- The colour tray stays where it is (it belongs to the canvas, not to tools); the task bar stays over the canvas (contextual).
- Icon-only buttons get a short name on hover (title = aria-label, the owner's Oct 22 rule); nothing else, no sentences.

## Alternative (B): one row only
Tools sit after the menus; the name is left-aligned after them (not centred); anything that does not fit goes into a "more" menu on the right. Cleaner at 1920 px, but the strip's contents hop in and out as the window changes size, and the owner's "centred name" from 2.43.0 is lost.

## Steps (each a patch; the minor is raised once, at the end)
- **2.43.1 Strip and element tools.** Add the second header row; move `#elb` into it with the same ids and classes (so `abSync`, the Add bar and every test keep working); the stage loses the element bar row. Check that the canvas fits and the stage resizes; run `npm run perf`.
- **2.43.2 View controls.** Move Repeat 3 x 3, Before / Split, the view toggles and zoom from the view bar into the strip's right end (same ids); the view bar row disappears. The colour tray moves up into the freed row.
- **2.43.3 Panels.** Move the rail's panel openers into the strip (same `data-pn` and `rail-*` ids); the rail, its "more" tray and drag-to-reorder go. Panel visibility still comes from the workspace code (`MODEP`, `RO`); the rail order setting becomes the strip order setting (no migration: older settings are ignored, per the no-backwards-compatibility rule). Active panel buttons show pressed (`--acc-soft`).
- **2.43.4 Tidy.** Window menu and strip stay in step (a test checks every strip button has a command); Part 9 gets the strip (13.2); remove dead rail CSS; keyboard: the strip is one `role="toolbar"` with arrow-key roving focus.
- **2.44.0 Done.** Version, docs/plan.md, PROJECT_STATUS.md; pixel goldens regenerated after a full suite run on the owner's word.

## Risks and tests
- The pixel goldens for the whole window change (expected, the layout changes on purpose); no state or SVG snapshot should change.
- Tests that click `#rail-*`, measure the rail or the stage size, or read the view bar need updating (kept ids make most unchanged). Targeted runs only: top bar, menu bar, workspaces, add bar, element bar, panels, zoom, the 3 x 3 preview.
- Drawing and dragging code is not touched, but the stage size changes, so `npm run perf` runs before the 2.43.1 commit (no regression over 10%).
- Full suite importance: about 45% (shared shell and workspace code, no drawing, rendering or file changes). Not run without the owner's word.
- Nothing here touches saving, opening or the file format; the rail order is a setting, not a project field.

## Open choices for the owner
1. Layout A (two rows, recommended) or B (one row with a "more" menu)?
2. Do the panel openers move into the strip (rail removed, recommended) or stay on a slim left rail?
3. Colour tray: stay above the canvas (recommended) or move into the strip?
4. Keep letting him reorder and hide panel buttons (the rail's "more" tray), or fixed order?
