# The element list (layers become one list of elements)

Written Oct 20 2026, after 2.2.0 (the element update) went live. Status: **2.2.1 live-ready, 2.2.2 built (Oct 20 2026; engine clean-up moved to 2.2.3), 2.2.3 not started.** The owner wants it done in one big step or two (Oct 20 2026); this plan makes it two, after a small fix release. Versions keep advancing in 2.x (2.2.1, 2.2.2, 2.2.3); the next minor (2.3.0) is the owner's call.

## The idea (owner, Oct 20 2026)
There are no layers. The document is **one ordered list of elements**, drawn in list order (first = bottom). Every row has what a layer row has today: eye, name, opacity, blend, drag to reorder, delete. Pressing an element button on the element bar **creates an instance at the top of the list** and opens that kind's menu:

| Button | What it creates |
|---|---|
| Sheet | a Sheet instance (paper colour, effects) |
| Paint | a Paint instance; the first stroke creates it, so there is no "new paint" |
| Shape | opens Shapes; picking one creates a Shape instance |
| Image | opens the picture import menu as now; picking one creates an Image instance |
| Text | as now (type, click, text instance) |
| Stamp | opens the Stamp menu (select, modify, make); placing creates Stamp instances |
| Pattern | creates a Pattern instance (the arrangement) |

Selecting a row opens that element's menu: move, size, rotate, align, effects. **That menu no longer holds a list**; the list is the layers panel's replacement. A Pattern stays one element (its sources are stamps by reference); the copies it prints are not rows.

## What this fixes from the first notes
- Sheet is created like everything else, not switched on and off.
- Paint: no "Paint strokes" in Randomize, no "new paint"/"remove paint" controls; first stroke creates the element.
- One list instead of a layer list plus an Elements panel (the duplicate the owner disliked).

## Decisions made here (change them if wrong)
1. New element goes **to the top of the list** (not above the selection).
2. **Opacity and blend on every element kind**, including Sheet and Paint.
3. **Groups (owner, Oct 20 2026):** select several rows (or elements on the canvas) and press Group (button or Shift+G); a Group is an element holding other elements, with its own opacity, blend and eye, expandable in the list, and Ungroup undoes it. The data model (`k:'group'`, children `ch`) is built in step 1; the Group button, shortcut and list indent come with the list UI in step 1 too, since a list without groups would have to be reworked.
4. Layer features without a clear owner are **dropped**, not carried (list below).
5. File format **23**: `proj.els` replaces `proj.layers`. Old files are refused with the usual message; no migration (owner, Oct 18 and 19 2026).

## What happens to each layer feature
| Layer feature today | Fate |
|---|---|
| name, visible, opacity `op`, blend `bl` | become element fields (every kind) |
| ink override `ink` | element field `ink` on Pattern, Stamp, Text (Paint keeps a colour per stroke) |
| `pl` (the elements) | the list itself: `proj.els` |
| Texture, Pressure offset, Jitter, Colour grade | already effects on elements; layer-level texture `tu`, `pst`/`pfl`, layer grade and wear masks go |
| Frame, Repeat, None arrangements, `ak`, `ov`, `man`, `fit`, `gap`, `rot`, `rsz`, `gl`, `lead` | all old arrangement engine: deleted (Pattern already covers them) |
| `st` (stamps a layer uses) | gone; a Pattern's `src` and placed stamps say what is used |
| `rz` (Randomize leaves this alone) | element field `rz` |
| Repeat tile wrapping (`tileWrap` per layer) | per element: each row is wrapped the same way |
| Presets and Variations (hidden since the element update) | their dead code is deleted; the shelved features return later on elements |

## Fix release first: 2.2.1 (small, before the big steps)
- **Shapes cannot be placed** (owner's first test). Reproduce on 2.2.0, fix, add a test that places a shape from each entry point (Shapes panel, canvas click into an unlocked stamp).
- **Jitter on text works per character** (and the same for any effect that should act on letters), seeded per character.
- **Paint:** remove "Paint strokes" from Randomize, remove "new paint" and "remove paint"; the first stroke creates the Paint element.
- Quick tests for each; perf if text drawing is touched. No format change.

## Step 1 (2.2.2): the flat list, engine and format (risk: high)
- **Document:** `proj.els: [element]` replaces `proj.layers`; `validate.js`, `container.js` (format 23), `make-fixtures.js`; the three fixtures and the templates are regenerated; one selected element `WBS.sel` replaces `selL` + `fpSel`.
- **Drawing:** `10-layer-grids.js` draws the list in order (`elDraw`), each element wrapped for opacity and blend and, in a Repeat tile, copied round the tile as now. Ids that used the layer index (`tw0`, `fm0_`, bitmap cache keys) use the element id. The old arrangement engine (lattice, frame layers, layer masks, layer grade) is deleted.
- **Groups:** `k:'group'` with children `ch`; draws its children in order inside one wrapper carrying its opacity and blend; select several rows, Group / Ungroup (button, Shift+G); expand and collapse in the list; effects on a group apply to the whole group; nesting allowed.
- **Creation:** the element bar creates instances at the top; the Layers panel becomes the element list (rows, eye, name, opacity, blend, reorder, delete), the old layers UI trimmed down, not redone.
- **Everything that builds documents:** Randomize (rolls build a flat list: Sheet, Patterns, Paint, stamps), templates, Clear, New project, export, print proof, book cover, Repeat tile, Colourways, undo.
- **Tests:** state and SVG snapshots change a lot (owner's approval first); about 20 specs read `layers[0]` directly and about 100 go through layers panels; perf must stay within 10% of `main`.
- Runs: targeted specs only, then CI when the owner says.

## Step 2 is cut into small releases (Oct 20 2026)
- **2.2.3:** placing (owner, Oct 20 2026): a shape, a stamp, a picture and text work the same way. The armed item is a ghost on the pointer (a picked shape had none); using anything in the interface puts it away so a click on the canvas cannot place it by accident; a button that arms an item arms it again; a right click puts it away. One module, `72-placing.js`. And the element menu loses its list: the old placed-items list and Clear all are gone from the Element panel, the Elements list is the only list.
- **2.2.4:** Sheet as an element (a row in the list, `k:'sheet'`, replaces `proj.sh`; format 24).
- **2.2.5:** the rest of the clean-up: the old arrangement engine (`GRAD`, `gArrAll`, `arrOpts`, `fitTs`, layer-level controls), Randomize and templates built directly on the flat list, docs.

## Step 2 (2.2.3): menus and flows (risk: medium)
- **Element menu without the list:** move, size, rotate, align (the Align grid and Position fields), then the effect stack; opens from a row or a click on the canvas.
- **Per-kind creation flows** as in the table above (Sheet instance, brush, Shapes, Image import, Text, Stamp, Pattern), including the Stamp menu with select, modify and make.
- **Sheet as an element:** transparent canvas stays the default for a blank project; templates and Randomize add a Sheet row. Exports that cannot be transparent still fill white.
- **Clean-up:** the old Layers-only controls, commands and rail entries, the UI standard check (`panel-style`), docs (`docs/developing-wodblok.md`, the coupling map, `CLAUDE.md`), and this plan's outcome.

## How step 1 is built (found while starting 2.2.2, Oct 20 2026)
A fresh document is already one `free` layer whose `pl` holds a Pattern. Layers are containers, not an arrangement engine, so step 1 goes in working stages on one branch, each ending with a running app:
- **A.** Opacity, blend and eye (`op`, `bl`, `v`) become fields of every element kind, drawn per element by `elDraw`.
- **B.** The file stores `proj.els` (format 23). At run time `WBS.layers` is always exactly one free layer whose `pl` is the list, so the ~100 code sites that read `layers[selL]` / `fpL()` keep working while they are removed one by one.
- **C.** The Layers panel becomes the element list; element buttons create at the top; reorder and delete.
- **D.** Groups.
- **E.** Randomize, templates and export build the flat list; the old arrangement engine and layer-only features are deleted; snapshots (owner's approval), perf against `main`, docs, version 2.2.2.

## Why two steps and not one
One step is possible, but it would change the file format, drawing, Randomize, every fixture and most snapshots at once, with the panel redesign on top; if something drew wrongly nobody could tell whether the engine or the menu caused it. Step 1 ends with a working app (a list that looks like the old layers panel, with the new model underneath). Step 2 only reshapes menus.

## Risks to watch
- Randomize quality: it was built around layers (accent layers that follow another layer's grid); the roll must still look as good. The seeded snapshots will change.
- Speed: flattening should help (fewer wrappers) but `perf` runs before step 1 is committed.
- Repeat tile seams: the seamless specs (11 rolls) are the check that the per-element wrapping is right.
- Speed-guard markup budgets sit close to their limits (docs/known-issues.md).

## Open questions
- Should a Sheet always stay at the bottom, or move like any other element? (Default here: moves like any other.)
