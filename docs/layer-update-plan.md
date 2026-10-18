# WODBLOK layer update: one continuous editing environment

Written Oct 18, 2026 (updated through the day). Status: **started Oct 18 2026** (the owner said to start). The text update (1.46.0) is finished and live. The update is called the **layer update**. Work is done one complete step at a time; after each step this document gets the outcome (see "Progress log" at the end), and anything learned goes into docs/agent-memory.md.

## What you asked for (repeated back)

1. **No Stamp editor and no Pattern/Stamp switch.** Everything happens on the canvas, in one continuous editing environment.
2. **No layer types.** Any layer can hold anything: stamps, shapes, images, text.
3. **A stamp is a saved object you design on the canvas.** It has an outline (square, circle, triangle...) and contents: shapes, images, text, several colours. You can create, save and load stamps.
4. **Stamps are global.** Edit one instance and every instance of that stamp, on every layer, shows the edit.
5. **The Stamp tool on a layer shows the arrangement.** It draws the chosen stamps in a layout (the grid, brick offset, checker and so on we have now) with their outlines visible, even when empty. A slider fades the outlines. You pick which stamps are active in the arrangement.
6. **Placing something over a stamp edits that stamp.** A shape placed over a triangle outline goes into the triangle stamp, and every displayed triangle gets it. Another layer can use the triangle stamp again and shows the same thing.
7. **Stamps, shapes, images and text can also be free placed.**

## What I think

It is the right direction. It is the model that Illustrator symbols, Figma components and Affinity symbols use: one master, many linked instances, edited in place. It removes the single biggest source of confusion in the app (which mode am I in, and which layer type do I need). Your existing data already fits it: stamps are project-wide objects that layers refer to, so "edit one, all change" is how the document works today. What is new is editing them from the pattern canvas instead of a separate editor.

The risks, in order:

1. **Size.** The Stamp editor is not one screen, it is about 20 tools: motif library, shape editor, selection and handles, marquee, symmetry, wrap at the edges, carved edges, uneven pressure, stamp textures, the grid tool, the pattern preview. All of it has to move onto the main canvas before the old editor can go. This is the largest change since the repo started.
2. **Clicking is ambiguous.** On one canvas, a click on a shape could mean "select this free shape", "select this shape inside the triangle stamp" or "start a new shape". The owner's answer solves it: each stamp has a lock. Only an unlocked stamp can be edited; anything placed over a locked stamp is just placed on the layer.
3. **Instances are transformed.** Brick offset, random rotation, position jitter, flips and size variation mean an instance on the canvas is not the stamp as designed. Drawing on an instance has to be mapped back into the stamp's own space. That is solvable (invert the instance's transform), but every tool that draws needs it.
4. **Testing.** About 98 test files, many tied to the two modes, to the layer types and to panel names. Most will need rewriting, not just updating.
5. **Saved files.** The file format changes (layers and placed pieces are restructured). Old files are not converted (decision 10), so there is no migration to get wrong, but the new format still needs a round-trip test (save, open, identical) and the newer-file read-only rule.

None of this is a reason not to do it. It is a reason to build it in small steps on a branch.

## The model

**Document**
- **Stamps** (project-wide, as today): outline shape, size, and contents. Contents are an ordered list of items, each a shape, image or text, with its own colour, in the stamp's own coordinates. Stamp-level settings stay on the stamp: symmetry, wrap at the edges, carved edges, texture, ink colours.
- **Layers**: an ordered list. Each layer has the settings every layer has now (name, visible, opacity, blend, ink, textures, impression) and:
  - **Items**: any mix of free-placed stamps, shapes, images and text, each with its own position, size, rotation and flip.
  - **Arrangement** (optional, at most one per layer): the stamps it repeats and how: grid kind (square, brick, half-drop, honeycomb, random), spacing, offsets, angle, variation, stamp size, which area it fills, or a frame. A frame is just another kind of arrangement, so there is no separate Frame layer.
- A layer's arrangement is drawn first, then its free items on top.

**Stamp instances** are never stored. They are computed from the arrangement (as now) or are free items that point at a stamp. So editing a stamp is one change to one list and every instance follows. Undo is one step.

**Layer types disappear.** What was a Pictures layer is a layer with image items. A Text layer is a layer with text items. A Repeat layer is a layer with an arrangement. A layer can have all three.

## How it works on the canvas

**Tools** (left rail), one for everything a layer type used to be (owner's note, Oct 18): **Select**, **Arrange** (was the Repeat layer: choose the stamps and the layout, one arrangement per layer), **Frame** (was the Frame layer: a border arrangement; the same arrangement data with the frame kind chosen), **Stamp** (the stamp library: pick, New, Save, Load, Duplicate, locks, Zoom to stamp; also free placing a stamp), **Shape** (was part of Free place), **Image** (was the Art/Pictures layer: import, crop, saved-project links), **Text**, **Grid** (snapping). Panels stay as now (Layers, Colours, Textures, Navigator...). Every tool works on the current layer whatever else the layer holds. Arrange and Frame edit the layer's one arrangement, so choosing Frame on a layer that already has a Repeat arrangement replaces it (undoable). The stamp outlines with the opacity slider show whenever the layer has an arrangement, whichever tool is active.

**Arrange and Stamp tools, on a layer** (the Arrange tool holds the layout; the Stamp tool holds the stamps; both draw the same outlines)
- Stamp panel: the stamps in the project, **New stamp** (choose the outline), **Save** and **Load** stamps (the stamp library as today), locks, Zoom to stamp. Arrange panel: pick which stamps are active (several) and the arrangement controls we have now.
- On the canvas it draws the arrangement of the chosen stamps with their **outlines visible even when empty**, so a triangle and a square with nothing in them still show as shapes laid out in a brick pattern. **Outline opacity** slider.
- **Lock icon on every stamp** (in the Stamp tool's stamp list, and on the stamp's outline on the canvas). **Unlocked = editable.** Stamps start locked, so nothing changes a stamp by accident.
- **Place a shape over an unlocked stamp's outline:** it lands in that stamp, in the stamp's own coordinates (mapped back through the instance you placed it over), and every instance in the arrangement shows it, live. On another layer, picking the same stamp again shows the same contents.
- **Place a shape over a locked stamp:** it is an ordinary item on the layer. The stamp does not change.
- Moving, resizing, rotating or deleting a shape that is inside an unlocked stamp edits the stamp; the same on a free item edits only that item.

**Select tool:** works on free items of the current layer, as now (handles, rotate, resize with the 1.37 handles, align, marquee), and on the contents of unlocked stamps.

**Free placing a stamp:** pick it, click the canvas. It is a free item pointing at the stamp, so edits to the stamp show in it too.

**Zoom to stamp** (owner's idea, Oct 18, replaces the separate Stamp view): a button on each stamp (in the Stamp tool's list and on its canvas outline) zooms and pans the normal canvas to fit one instance of that stamp. Nothing is hidden and there is no second view: the layers and the arrangement stay on screen around it, and you edit it the usual way (placing over an unlocked stamp edits the stamp, mapped through that instance). While zoomed on a stamp, a **Solo layer** button appears: it shows only the current layer and hides all the others (a temporary view, not a change to the layers' visibility; it turns off when you press it again, leave the zoom, or switch layer). Zooming back out is the normal zoom or Fit. This is only a camera move, so it is cheap and needs no new mode. Built in step 4.

**No "Make unique"** (owner's decision). A separate variant is made from the stamp list with Duplicate stamp (decision 7).

## What happens to what exists

| Today | In the unified editor |
|---|---|
| Stamp editor mode | Gone. The owner's view: most of its tools duplicate the Canvas-mode tools, so only the few unique ones need a new home (step 0 lists them). They work on unlocked stamps |
| Shapes panel (motif library) | Stays, as the source for placing shapes |
| Shape editor | Renamed the **Element editor** (owner, Oct 18). It edits whatever is selected, the same way the old Shape editor did: a shape, an image, a text or a stamp, free on the layer or inside an unlocked stamp. Its controls follow the kind of element (a shape's colour and flips, an image's crop, a text's size and rotation, a stamp's size and flip). It floats, opens when an element is placed, and has the same small toggle to turn the automatic opening off |
| Stamp panel (outline, size, symmetry, carve, textures) | Becomes the Stamp settings panel for the unlocked stamp |
| Pattern preview panel | Gone (decided): the canvas is the preview. Navigator stays |
| Grid tool | Stays (snapping), works the same inside an unlocked stamp |
| Layer types (Repeat, Frame, Free place, Pictures, Text) | Gone. A layer has an arrangement and/or items |
| Layout panel | Becomes the Stamp tool panel's arrangement section |
| Text panel (1.39 to 1.46) | Stays as the Text tool; text goes on a layer or into an unlocked stamp |
| Frame layer, book cover areas | Frame arrangement kind, same options |
| Randomize | Same moves, rewritten to build layers with arrangements and items |
| Templates, presets, variations, colourways, workspaces | Updated to the new model; workspaces lose the per-mode panel lists |
| Old `.wodblok.json` (v18 to v20) and old templates | Not converted (decision 10); new templates made by the owner |

## Decisions

**Decided (owner, Oct 18):**
1. **Editing:** each stamp has a lock icon. Unlocked, it can be edited; locked, things placed over it are just placed on the layer and the stamp does not change. (This replaces my "enter a stamp" idea.)
2. **Clipping:** a stamp's contents are cut off at its outline.
3. **One arrangement per layer.** Several arrangements means several layers.
4. **No "Make unique".**
5. **The Pattern preview panel goes.**
6. **Wrap at the edges** stays as a stamp option.
7. **Duplicate stamp** stays (a copy that edits separately).
8. **New stamps start locked.**
9. **No Labs switch and no old editor kept.** The new editor replaces the Stamp editor as it is built. The app on the work branch is allowed to be incomplete between steps; nothing goes live (`main`) until the owner says so.
10. **No backwards compatibility.** Old templates do not need to load; the owner will make new ones. The old file migration (v18 to v20) is not carried into the new format.
11. **Decision 10 covers everything**, including the owner's own saved project files (confirmed Oct 18). When step 1 starts, the CLAUDE.md "Never break" rule about old files opening is removed, along with the v18 fixtures in `tests/fixtures/` and the migration chain. Until then (the whole text update) the rule stays in force.

**Nothing is open.** The behaviours below are my proposed defaults, to be confirmed in the step 0 mock-up.

## Behaviours to settle (proposed defaults, to make the editing feel clear)

The lock model is simple, but it has one risk: a shape placed over a stamp does one of two very different things (changes a shared stamp, or just sits on the layer) and the person must always be able to tell which. Proposed:

1. **Always show what a placement will do.** An unlocked stamp's outline is drawn in the accent colour with an open-lock icon, and the Stamp tool panel shows a line "Editing: Triangle (used on 3 layers)". Locked outlines are plain and dim. Nothing is hover-only.
2. **Only one stamp unlocked at a time.** Unlocking another locks the previous one. It makes "which stamp does this go into?" a single answer and keeps hit-testing simple. (A second owner decision if you want several at once.)
3. **The unlocked state is not saved.** A file always opens with every stamp locked, and switching layer locks again. Nobody opens a project and accidentally edits a shared stamp.
4. **Where a new item lands:** in the unlocked stamp whose instance is under the point where the placement or drag starts. If it starts outside any unlocked stamp, it is a free item on the layer. An item that crosses the outline is cut off by the clip (decision 2); the part outside is not lost, it is just not drawn, and moving the item brings it back.
5. **The same Select tool for both.** Selecting something inside an unlocked stamp shows its handles on the instance you clicked, and a small tag "in Triangle" in the panel so you know it is not a free item. A "Move out of stamp" and "Move into stamp" command lets you change your mind without redrawing.
6. **Stamp list shows live thumbnails and use.** Each stamp shows a thumbnail that updates as you edit, its lock, Zoom, and how many layers use it. Deleting a stamp that is in use removes it from those arrangements and free items in one undo step (no confirm dialog; the app has none).
7. **New layer, empty Stamp tool.** The first time the Stamp tool opens on a layer it offers the project's stamps (or New stamp) and starts with a plain grid, so the outlines appear straight away, which is the point of the feature.
8. **Resizing a stamp scales its contents.** Contents are stored in stamp units, so a bigger or smaller stamp keeps its design. Changing the outline shape (square to circle) keeps the contents and clips them to the new outline.
9. **Zoom to stamp also unlocks nothing.** It is only a camera move; unlock is a separate click. Solo layer and Zoom state are never saved.
10. **Speed.** Each stamp is drawn once to a cached picture, and instances reuse it. Editing an unlocked stamp redraws only that picture, so many instances stay fast. This is already the model the pattern renderer uses and must stay so.

## How the text update fits (checked Oct 18 against 1.43.0)

Findings from reading the text code, and what to do in the rest of the text update so none of it is thrown away:

- **Good:** the text engine (`60-text-engine.js`) is a pure function of one options object, with no panels and no document. It is exactly what a text item in the new model needs. It stays as is. The Text panel's options (box, padding, fit, overflow, effects, align, curve...) stay as the text item's settings.
- **Not future-proof:** text in the Stamp editor is stored as *exploded letters*: one shape item per letter, tagged `tg`, plus a group record `tgm` on the stamp. Text on a layer is stored as one record with the options object. These are two forms of the same thing, and the layer update wants only the second (a text item with options, drawn by the engine, on a layer or inside a stamp, clipped).
- **Duplicated glue:** `22-text-tool.js` (Stamp editor) and `26-text-boxes.js` (layer) each read and write the same panel controls (`fromUI` and `tbRead`, `toUI0` and `tbSync`) and are switched by `WBS.curView` guards. Every new option today has to be added in both places.
- **Hand-moved letters** (`adj`) are only implemented for exploded stamp letters (`adjOf`), not for text on a layer.

So for 1.44.0 to 1.46.0: (a) first make one shared reader/writer for the text options (no behaviour change), so each new option is added once; (b) build every new feature (styling selected letters, paragraph options, path and warp, saved Text styles) as options on the text item and in the engine, never as something that exists only on exploded letters; (c) give layer text the hand-moved letters (`adj`) too, stored on the text item, so both forms behave the same; (d) keep Convert to shapes as the one-way step to plain shapes. Then the layer update only has to move text items into stamps and delete the exploded-letters form, with no feature lost.

## The steps

**Numbering** (your rule): each step is a patch on the last finished minor, 1.46.1, 1.46.2 and so on. When the whole layer update is done it becomes **2.0.0** (owner, Oct 18: this update is the new major version).

| Step | What | Risk |
|---|---|---|
| 0 | **Design review.** A clickable mock-up of the unified screen (tools, layers, the Stamp tool panel, the lock icons, outlines) for you to approve before any code. Plus a written audit of every Stamp-editor tool: which are duplicates of the Canvas-mode tools (to be dropped) and which are unique (to be moved) | none |
| 1 | **Layers hold anything (data).** New layer model: items of any type plus an optional arrangement. New file format 22. Old files and templates are not converted (decisions 10 and 11). Old screens keep working on top of it until step 9 | high: file format |
| 2 | **Any item on any layer (UI).** Place stamps, images and text on any layer; the layer type buttons and the Type dropdown go. The Layers panel shows items | high: layers, rendering |
| 3 | **Arrangement on any layer.** The Layout panel becomes the arrangement section of a Stamp tool; frame becomes a kind of arrangement | high |
| 4 | **Stamp instances on the canvas.** Outlines (with the opacity slider), picking several stamps, hit-testing an instance, the transform from the canvas into a stamp's own space, the lock icons and what an unlocked stamp accepts | high |
| 5 | **Drawing into a stamp:** placing shapes, images and text into an unlocked stamp from the canvas, clipped to its outline; select, move, handles, rotate, delete; live update of every instance | high |
| 6 | **The unique Stamp-editor tools on the canvas** (from the step 0 audit): for example symmetry, wrap, the Element editor, grid snapping inside a stamp. Tools that duplicate Canvas mode are dropped | medium |
| 7 | **Stamp settings:** outline shape and size, carved edges, pressure, textures, stamp ink colours, multiple colours per stamp | medium |
| 8 | **Stamp library:** New stamp, Save, Load, Duplicate, delete (see "Behaviours to settle") | medium |
| 9 | **Retire the Stamp editor.** One panel list for the whole app, workspaces migrated, commands, shortcuts, rail, Pattern preview removed | high |
| 10 | **Rewrite what depends on it:** Randomize, templates, presets, variations, colourways, export recipes, print proof, book covers | high |
| 11 | **Tests and speed:** rewrite the mode and layer-type tests, new tests for every step above, `npm run perf` against the baseline | |
| 12 | **Final check and release 2.0.0.** Delete leftover old-editor code, full suite, going live when the owner says | |

Steps 1 to 3 give you something real early: no layer types, anything on any layer. Steps 4 and 5 are the core of what you described. Steps 9 and 10 are the long tail.

My honest estimate is that this is about 12 to 16 patch steps and several times the size of the whole text update. I would not put a date on it until step 0 is approved and step 1 is done, because step 1 will show how much of the code depends on the layer types.

## Tests and safety

- Every step: the quick tests for what changed. When a step is risky enough that the whole suite should run (likely steps 1, 3, 4, 5, 9 and 10: file format, rendering, shared code), I **suggest it with an importance percentage and one sentence of why**, and the run is the **CI shard suite** (the pull request's four Chromium shards, WebKit and the picture comparison), never the slow local full run. It runs only when the owner says so.
- Old fixtures: no compatibility test (decision 10). New made-up sample projects in the new format replace them.
- Perf: `npm run perf` at every step that touches drawing or dragging; no regression over 10%. Editing an unlocked stamp with many instances on screen gets its own perf test.
- A file saved in the new format opens read-only in an older app (existing newer-file rule).
- Public repo rules unchanged.

## Progress log
One entry per finished step: version, what changed, what was tested, anything the next step must know. Newest last.

| Step | Version | State |
|---|---|---|
| 0 Design review | none | audit done (below); the clickable mock-up was skipped by the owner on Oct 18 |
| 1 Layers hold anything (data) | 1.46.1 | done on branch `feat/1.46.1-layers-hold-anything`, not merged |
| 2 to 12 | | not started |

### Step 0 audit: Stamp editor panels against Canvas mode (Oct 18 2026, read from `MODEP` in `34-desktop-shell.js`)
- **Shared today** (same panel in both modes, no work): Workspaces, Presets, Text, Colours, Colourways, Grade, Textures, Randomize, History, Stamp library.
- **Stamp editor only:** Shapes library (`motifs`) stays as the source for placing shapes; the shape list of a stamp (`mlist`) becomes the layer's item list (the Layers panel shows items); Shape editor (`sedit`) becomes the **Element editor** and opens on any selected element (shape, image, text or stamp); Stamp settings (`stamp`: outline, size, symmetry, wrap, carve, pressure, textures) becomes the settings of the unlocked stamp; Stamp grid (`grid`) is dropped in favour of the one grid tool (`pgrid`); **Pattern preview (`preview`) is dropped** (decided).
- **Canvas mode only:** Layers, Layout (becomes the Stamp tool's arrangement section), Canvas, Navigator, Export recipes, Variations stay.
- **Unique tools to move onto the canvas (step 6):** symmetry, wrap at the edges, carved edges, uneven pressure, marquee on stamp contents, snapping inside a stamp. Everything else the Stamp editor does is already a Canvas-mode tool.
- Still to do in step 0: the clickable mock-up of the unified screen, for the owner to approve before any code.

### Step 1 outcome: layers hold anything (1.46.1, Oct 18 2026)
- **Model, as built.** A layer's items are `layer.pl`: free stamps (`t`), pictures (`a`) and text boxes (`tx`), in any mix. A layer has an arrangement (repeat or frame) unless it has `free: true`; so every layer may now hold items, with or without an arrangement. The three item drawers (`freeLayer`, `artLayer`, `txtLayer`) already picked their own kind of item, so a new `itemsLayer` in `10-layer-grids.js` calls all three; items are drawn after the layer's arrangement (and for a frame layer, after the frame), wrapped like a free layer (grade, texture mask, opacity, blend, ink).
- **Pictures** are collected for saving from items on any layer (`artUsed`), not only on layers in Pictures mode; the art list and its delete check also look at every layer.
- **File format 21.** `FMT_LATEST` is 21 (the plan said 22; 21 was never used, because the text update needed no format change). Step 20 to 21 changes only the number, so an older app opens such a file read-only. `validate.js` refuses a layer whose `pl` is not a list of pieces with numeric x and y ("A layer in that project has damaged pieces on it.").
- **Old files.** The "old files must open" rule is removed (CLAUDE.md, developing-wodblok.md). I kept the 18 to 21 migration and the v18 fixtures for now: they cost nothing, the built-in templates are still v20 files, and they are the safety net for the later steps. They go at step 12 or once the owner's new templates exist.
- **Not changed (on purpose, later steps):** the screens still make one kind of layer at a time (the layer type buttons, `fpL()` only returns free layers, so items on an arrangement layer cannot be selected or moved on the canvas yet: step 2); `L.free`, `L.art`, `L.txt` still pick the screen. Items are drawn by kind (stamps, then pictures, then text), not in one mixed order, and each kind is wrapped on its own, so a layer with opacity under 100 and overlapping items of different kinds blends each kind separately. Step 2 should merge these into one ordered list and one wrapper.
- **Tests:** new `tests/layer-items.spec.js` (items drawn on an arrangement layer and on a free layer; saved file keeps pictures used by items on any layer and reopens identical; damaged pieces refused). `format.spec.js` now expects v21.

### How tests run between steps (owner, Oct 18 2026)
The editor is being rewritten, so steps 2 to 5 are not run through the CI shard suite and need not match the old program. Each step runs only the quick specs for what it changes, plus specs for areas it should not touch (text engine, colour tray, saving and opening, export, libraries), and `npm run perf` where drawing is touched. A test that fails because the step replaced the thing it tests is rewritten or deleted in that same step, and the step report lists it. State and SVG snapshots that change still need the owner's approval; they are batched at milestones. The CI shard suite runs at the milestones: after step 5 (drawing into a stamp from the canvas), after step 9 (old editor gone) and at step 12 (before 2.0.0), when the owner says so.
