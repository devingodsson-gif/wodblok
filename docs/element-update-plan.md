# WODBLOK element update: elements and effects

Written Oct 19 2026. Status: **started Oct 19 2026** (the owner said to start: step 1 after the CI change). Work is done one complete step at a time; after each step this document gets the outcome (see "Progress log" at the end), and anything learned goes into docs/agent-memory.md. Its steps are patches 2.1.1, 2.1.2 and so on (owner, Oct 19 2026); the version keeps advancing in 2.x, there is no 3.0.0 (owner, Oct 20 2026).

## What the owner asked for (repeated back)

1. **The canvas is transparent by default.** A background is something you add (a Sheet element), not a property of the canvas.
2. **An Element is anything you can create on a layer.** Kinds: Sheet, Paint, Shape, Image, Text, Stamp, Pattern. More kinds will be added later.
3. **An element bar** at the top, left of centre, mirroring the colour tray at the top right of centre. One icon per kind.
4. **Each kind has its own panel** with everything to create and edit it, working in the panel system as it is (dock, tab, float, workspaces). Opened from the element bar it creates; opened from an element it edits. What Create and Edit look like exactly will be tuned later.
5. **A layer holds any number of elements**, listed in an **Element list** for the selected layer (the Shape list, but for every element).
6. **Every element is editable after it is created.**
7. **Effects** (the owner first called them features): an ordered list on each element. "Add effect" at the bottom of an element's panel opens a menu of the effects; the same effect can be added more than once; each added effect shows in the panel with its own settings. Effects replace the scattered controls that do the same jobs today.
8. **Stamp** is a collection of shapes, images, text and paint: a little snapshot. **Pattern** is a list of points (what the arrangement is today) with sources assigned to it (stamps, shapes, images, text...), which it places at those points. Pattern does the repeating; Stamp does not.

## Owner's answers (Oct 19 2026)

- Canvas: transparent by default; a Sheet on a layer is the background. No separate Canvas element.
- Paint: one Paint element is a container of strokes; you keep drawing into the selected one until you start a new one. The eraser only affects strokes in that Paint element. The old "No brush masks" rule is **removed** (owner: "remove that rule and do whatever").
- Shape is one motif, as today. Stamp is the snapshot of several elements. Pattern repeats.
- Several Patterns on one layer are fine (replaces the layer update's "one arrangement per layer").
- Effects are an ordered stack: drag to reorder, an on/off switch each, several of the same kind allowed.
- The per-element random effect is called **Jitter** (the Randomize tool on the rail, which makes whole designs, keeps its name). Jitter has a seed and a **Reroll** button.
- Not every effect has to work on every element: each effect lists the kinds it supports, and the Add effect menu shows only those.
- Carved edges, symmetry, wrap at the edges, invert and the per-stamp colour grade **become effects** too.
- Exports that cannot be transparent (JPG, TIFF, print proof, book cover PDF) are filled with **white** where nothing is drawn.
- No backwards compatibility: old project files and templates are refused, as now. Templates made for 2.0 will not open once the format changes.
- No mock-up; build directly.
- **Never run the full suite or CI unless the owner says so.** CI was changed (before step 1) so the editor suite runs only by hand or on a pull request labelled `run-suite`.
- After each step, publish the build to the preview artifact.

## The model

**Element**: one record in the layer's element list (`layer.pl`, kept under that name). Common fields: `u` (stable id), `k` (kind), `x`, `y`, `s` (long side), `r` (degrees), `f` (flip), `fx` (effects); then the kind's own settings. Elements draw in list order (the old renderer drew them grouped by kind: stamps, then pictures, then text).

| Element | What it is | Replaces |
|---|---|---|
| Sheet | colour and texture filling the canvas shape | Paper colour, the canvas texture |
| Paint | strokes made with a brush (round, or any shape as the brush tip), colour, size; eraser inside the element | new |
| Shape | one motif | shapes placed on a layer |
| Image | an imported picture or a linked project, with crop | picture items |
| Text | one text box with every Text option | text items |
| Stamp | a placed copy of a stamp definition; a definition holds child elements (shape, image, text, paint) and is edited by unlocking it | free stamps; the stamp definitions stay project-wide |
| Pattern | points (grid, brick, half-drop, radial, frame...) plus sources placed at them by cycle, random or weighted random; sources are references, so editing a stamp changes every placement | the layer's arrangement (`st`, `lay`, `size`...) and Frame (`fr`) |

**Effect**: `{u, k, on, sd (seed), ...settings}` in an element's `fx` list, applied in order. On a Pattern an effect applies to each placement.

| Effect | Replaces |
|---|---|
| Texture | the Textures panel's Apply, per-stamp and per-layer texture lists |
| Pressure offset | uneven pressure and flooding (`pst`, `pfl`) |
| Jitter | Variation (position, rotation, size, gaps, flips: `rpos rrot rsz rgp rfh rfv rtn rsd`) |
| ~~Morph~~ | removed from the plan (owner, Oct 20 2026) |
| Carved edges | stamp edges (`et er es`) |
| Symmetry | stamp symmetry (`sym`) |
| Wrap | wrap at the edges |
| Invert | inverted stamp (`neg`) |
| Colour grade | per-stamp grade |

**Code**: `src/modules/65-element-core.js` holds two registries: element kinds (`elKind`, `elRegister`, `elDraw`) and effects (`fxRegister`, `fxFor`, `fxOf`). Each element kind and each effect registers its label, icon, defaults, the kinds it supports (effects), its panel and how it draws. Adding a kind or an effect is one new module that registers itself; nothing else needs to list it.

**UI**: the element bar sits in the view bar, its right edge just left of the centre line; the colour tray starts just right of it. Each kind's panel is a normal panel (`PNAME`); picking a kind on the bar opens it in Create; selecting an element opens it in Edit with the effect stack at the bottom. The Element list replaces the Shape list. The Element editor, Layout, Shape list and Stamp settings panels are folded into the element panels as the steps reach them.

## The steps

| Step | Version | What | Risk |
|---|---|---|---|
| 0 | 2.1.1 | CI: the editor suite runs only when asked | none |
| 1 | 2.1.1 | **Element core.** Registries for element kinds and effects; a layer's elements draw in list order; stamp, image and text items registered as the first three kinds; this plan in the docs; "No brush masks" removed. No stored data changes yet, so no format change | medium (rendering) |
| 2 | 2.1.2 | **Element bar and element panels.** Bar left of centre, tray right of centre; Stamp, Image and Text panels create and edit; the Elements panel (the layer's list and the selected element's controls) replaces the Shape list | medium (panels) |
| 3 | 2.1.3 | **Transparent canvas and Sheet.** Checkerboard on screen; PNG and SVG keep transparency; JPG, TIFF, proof and book cover fill white | medium |
| 4 | 2.1.4 | **Shape element** with the Shapes library in its panel; the Element editor folds into it | medium |
| 5 | 2.1.5 | **Pattern element.** Arrangement and Frame become Pattern elements with sources and distribution; several per layer. **Format 22**: every element stores `k`; new fixtures; state snapshots regenerated once (owner's OK first) | high (format) |
| 6 | 2.1.6 | **Stamp as composite.** Images, text and paint inside a stamp definition | high |
| 7 | 2.1.7 | **Effect stack, Texture and Pressure offset.** Add, reorder, switch off, delete; old texture and pressure controls removed | high |
| 8 | 2.1.8 | **Jitter**, then Carved edges, Symmetry, Wrap, Invert and Colour grade as effects; Stamp settings panel retired | high |
| 9 | - | ~~**Morph**~~ removed (owner, Oct 20 2026) | - |
| 10 | 2.1.10 | **Paint element**: strokes, shape brushes, eraser; speed test with many strokes | high (speed) |
| 11 | 2.1.11 | **Everything that builds documents**: Randomize tool, Presets, Variations, Colourways, export, print proof, book cover. Seeded Randomize snapshots change once (owner's OK first) | high |
| 12 | 2.1.12 | Tests, perf, docs, old code removed, release | |

## Tests and safety

- Each step: quick specs for what changed and for the areas it must not touch, `npm run perf` where drawing or dragging changes. **No full suite and no CI unless the owner says so.**
- State and SVG snapshots: only with the owner's approval; a step that changes them on purpose lists them and asks.
- New made-up fixtures when the format changes (step 5).

## Progress log
### Step 0 outcome: CI only when asked (2.1.1, Oct 19 2026)
`.github/workflows/test.yml`: the Chromium shards, the picture comparison and WebKit run only by hand (Actions > tests > Run workflow) or on a pull request labelled `run-suite`. Opening, pushing to or marking a pull request ready does not start them; skipped jobs still satisfy the required `chromium` and `webkit` checks. The site checks still run on site changes. CLAUDE.md, the developer guide, going-live.md and ci-budget-rules.md say the same.

### Step 1 outcome: element core (2.1.1, Oct 19 2026)
- `src/modules/65-element-core.js`: the element-kind registry (`elRegister`, `elKind`, `elKinds`, `elDef`, `elDraw`) and the effect registry (`fxRegister`, `fxFor`, `fxOf`, `fxDef`; no effects registered yet). `init65` runs first in `src/main.js` and registers the three kinds that exist: stamp (`q.t`), image (`q.a`), text (`q.tx`). A kind is read from `k` when an element stores it (from step 2), otherwise from the kind's test.
- A layer's elements now draw **in list order** (`itemsLayer` in 10 calls `elDraw`). Each kind still draws all its elements once (`freeLayer`, `artLayer`, `txtLayer` now also return their wrapper tags and each element's markup by id); neighbouring elements of one kind share that kind's wrapper. A layer whose elements were already grouped by kind draws the same markup as before. Fixes the known issue "items draw by kind, not as one ordered list".
- No stored data changed, so the file format stays 21 (it becomes 22 in step 2, when every element stores `k`).
- Tests: new `tests/element-core.spec.js` (text then stamp draws text under the stamp; it fails on 2.0.4). Ran: element-core, any-layer-items, layer-items, free-place, text-place, text-box, art-textures, roundtrip, scenarios, speed-guard, launch, randomize-new, text-randomize, undo. 67 passed; 7 failed, and the same 7 fail on a build of `main` in this container (the Randomize seed 1-3, before/after and split state snapshots differ by fractions of a letter's position, which the guide notes for local fonts; `open project-3` and speed-guard time out with three workers). speed-guard passes alone. `npm run perf` against `main`: ratio 0.98. Not run: the full suite / CI (owner's rule).

### Step 2 outcome: element bar and element panels (2.1.2, Oct 20 2026)
- **Element bar** (`#elb`, drawn from the registry in `65-element-core.js`): Sheet, Paint, Shape, Image, Text, Stamp, Pattern, in that order. The view bar is two equal halves: the element bar ends at the centre line (left half), the colour tray starts there (right half). A button opens its kind's panel and shows pressed while that panel is in front (it follows the rail button's state, `WBX.wbElSync`, called from the panel layout and from `fpSync`). Sheet and Paint are switched off until steps 3 and 10. Buttons are 26 px like the tray swatches, so the view bar keeps its height (a 30 px bar made the canvas 4 px smaller and changed the launch SVG snapshot).
- **Panels**: Layout is renamed **Pattern** and holds the arrangement only; the stamp strip moved to the **Stamp** panel (was Stamps) as a Place group; pictures, Paper shows through and Crop moved to a new **Image** panel (`elimg`, on the rail and as the command `panel.elimg`); the layer's list, the selected element's size/rotate/position/flip/order controls and Align moved to the **Elements** panel (was the Shape list; panel id still `mlist`), with the unlocked stamp's shapes in a Stamp group below. Shapes is renamed **Shape**. All ids are unchanged.
- **Create and Edit**: the Stamp and Image panels show "Editing <name>" when an element of their kind is selected and nothing when creating (Text already did this). The Crop group shows only with a picture selected.
- **Not done here (moved)**: format 22 (`k` stored on every element) moves to step 5 so the fixtures and state snapshots change once, with the Pattern element; the Element editor folds into the Shape panel in step 4; show/hide and lock per element in the list come with the effect stack (step 7).
- Tests: new `tests/element-bar.spec.js`. Updated for the moved controls and names: align, any-layer-items (its Layout-order test now checks the Pattern panel and where the moved controls live), art-textures, element-core, layout-settings, rail, stamp-library-tool, stamps-tool. Ran 33 + 26 spec files (UI, panels, rail, commands, workspaces, text, stamps, shapes) and scenarios/roundtrip: all pass except the 5 scenario state snapshots that also fail on `main` in this container (letter positions, local fonts). `npm run perf` not run: nothing on the drawing or dragging path changed. Not run: the full suite / CI.

### Step 3 outcome: transparent canvas and the Sheet element (2.1.3, Oct 20 2026)
- **Transparent by default**: `build()` (10-layer-grids.js) paints no paper. A project has a Sheet only when `proj.sh` exists; without it nothing is drawn behind the layers, so PNG and SVG exports keep their transparency. On screen the canvas shows a checkerboard (`#art.chk` in CSS; a pattern in `#artsh` for shaped canvases and the repeat-tile preview).
- **Sheet element** (`66-sheet-element.js`, `init66`): one Sheet per project, stored as `proj.sh = {c, o}` (colour reference, default the Paper slot; opacity in percent, default 100). Its panel (`elsheet`, rail button and command `panel.elsheet` "Open Sheet") has an on/off check box, a colour well and Opacity. The Sheet button on the element bar is now on. Undo, redo, open and clear restore it with the rest of `proj`.
- **White fill where transparency is impossible**: JPG and TIFF export (`43`), book cover (`30`, PNG and PDF), and the JPEG thumbnails (project thumb `18`, variations `47`, colourways `53`, templates `54`). The print proof was already white.
- **Not done here (moved)**: Sheet texture arrives with the Texture effect in step 7; the Sheet is a project-level setting for now, not an entry in a layer's element list (the element list gets per-element show, hide and lock in step 7). Projects saved by 2.0.4 or 2.1.2 (format 21) open with a transparent canvas until the format changes in step 5 (no migration, by the owner's rule).
- **Snapshots that change (waiting for the owner's approval, not regenerated)**: SVG summaries `launch`, `open-project-1-diamond`, `open-project-3-rect-16x9`, `open-project-4-rect-4x3`, `canvas-shape-*` (nine) and `theme-light`: one `rect` fewer, the paper. No state snapshot changes (`proj.sh` is absent). `randomize-seed-1..3`, `before-view` and `split-view` state snapshots also fail on 2.1.2 here (already failing before this step).
- Tests: new `tests/element-sheet.spec.js`; `element-bar` (Sheet button is on) and `repeat-tile` (the Sheet goes on first, since the pieces measured are artwork on paper) updated. `repeat-tile` roll 6 sits close to its limit and passed and failed on identical markup, so it is noisy on this machine.

### Step 4 outcome: the Shape panel takes the Element editor (2.1.4, Oct 20 2026)
- The **Element editor** panel (`sedit`, docked along the bottom) is gone: its controls (Size, Rotate, Width, Height, Thickness, Colour, Jitter, Reset, Flip, Knockout, Split, Duplicate, Bring to front, Send to back, Delete) are the **Edit** group at the top of the **Shape** panel, above the Library, laid out as a normal vertical panel. No rail button and no `panel.sedit` command remain.
- The Auto-open switch stays in the Edit group: when a shape is added and the Shape panel is not open, it comes forward.
- A shape still lives inside a stamp (`tile.items`), as before; placing a shape straight onto a layer as its own element is not part of this step. The Pattern element (step 5) and the composite Stamp (step 6) decide how shapes reach a layer. Say if a free Shape element on a layer is wanted sooner.
- Tests: `shape-editor` rewritten for the Edit group; `small-ones`, `stamp-canvas-edit`, `stamp-settings`, `rail`, `dock-default` updated. No snapshot or golden changes.

### Step 5 outcome: the Pattern element and format 22 (2.1.5, Oct 20 2026)
- **Format 22**: every element in a layer's list stores its kind `k` (`stamp`, `image`, `text`, `pattern`). New elements get it when they are made; a file without it (format 21 or older) is refused, no conversion. The three sample projects in `tests/fixtures/` were rewritten by a one-off script (format 22, `k` added, nothing else changed), not re-rolled, so their content is the same.
- **Pattern element** (`67-pattern-element.js`): `{u, k:'pattern', n, lay, cn, rn, sz, rt, ds, sd, src:[...], x, y, s, r, f}`. Layouts: Grid, Brick, Half-drop, Radial, Scatter (columns, rows, size in % of a cell, rotation). Sources are references: a stamp (`t`), an image (`a`) or a copy of a text element; a stamp or picture that is deleted drops out. Distribution: Cycle, Random, Weighted (a weight per source); Reroll changes the seed. Several patterns per layer are fine.
- **How it draws**: `elDraw` replaces each pattern, in place, by the stamp, image and text elements it stands for (kind registry key `expand`), then the kinds draw as always. Nothing extra is stored or drawn twice, and a layer without a pattern takes the same path as before.
- **Panel**: the Pattern panel (`layers`) has a new first group, Patterns: list, New pattern (starts with the current stamp), layout, columns, rows, size, rotate, distribution, Reroll, a source list with weights, Add current stamp, Add selected element. Patterns are not rows in the Elements list yet.
- **Not done here (moved)**: the layer's old Arrangement (`st`, `lay`, `size`…) and Frame are still there and still draw; turning them into Pattern elements, and moving effects onto patterns, is left for the document-builder step (11) so Randomize and presets change once. Per-pattern jitter and effects arrive with the effect stack (steps 7 to 10).
- **A 2.1.3 bug found and fixed**: the checkerboard class was called `chk`, which the check-box rule also uses, and it added 8 px to the canvas area. Renamed `cvck`. The 5 SVG snapshots that had picked this up (`launch`, `open-project-3`, `open-project-4`, `canvas-shape-rect`, `theme-light`) were regenerated again; each now differs from the 2.1.2 version by exactly one `rect`, as approved.
- **Perf**: slider drag ratio 0.97 against main. `npm run perf` builds `main` as its baseline and main cannot open the format 22 samples, so the baseline here was main with its format number set to 22. After going live this is no longer needed.
- **Waiting for the owner's OK (not regenerated)**: the state snapshots that list elements, which now carry `"k"`: `open-project-1/3/4`, `canvas-shape-*` (nine), `theme-light`, and the ones that also hold items (`before-view`, `split-view`, `randomize-seed-1..3`, the `panel-*` ones). Only the added `"k"` lines differ. `randomize-seed-1..3`, `before-view` and `split-view` already failed on 2.1.2 here.
- Tests: new `tests/element-pattern.spec.js`; `format` and `roundtrip` updated for 22.

### Step 6 outcome: the stamp as a composite (2.1.6, Oct 20 2026)
- A stamp definition can hold pictures and text as well as shapes: `tile.el`, a list of the same records the layer uses (`{k:'image', a, ...}`, `{k:'text', tx, G, Lt, ...}`) in the stamp's own units. They draw inside the stamp's symbol, over the shapes and inside its outline, with the layer's picture and text code (`68-stamp-contents.js`, `stContents`), so every use of the stamp (placed copies, patterns, the arrangement, thumbnails, export) shows them. A stamp without them is written exactly as before. No format change: `el` is optional.
- **Stamp panel, Contents group**: **Make stamp from selection** turns the selected pictures and text on the layer into a new stamp (sized to fit about 90% of the frame) and puts one copy of it where they were; the group lists what the current stamp holds, each with a button to take it out.
- Pictures held by a stamp, or used as a pattern's source, count as in use: they are saved with the project and cannot be removed from the Image panel (`artRefd`, `artUsed`).
- **Not done here (moved)**: paint inside a stamp comes with the Paint element (step 10); stamps inside a selection are left out of Make stamp (no stamps in stamps yet); the stamp library's "Save to library" does not carry a stamp's pictures and text yet, nor are they in `.wodblok` stamp exports other than the project file; shape-style effects (ink, Carved edges) treat pictures as they treat the rest of the symbol; a stamp's contents are not edited on the canvas, only made and taken out.
- Perf: slider drag ratio 0.96 against main (format-patched, as in step 5). No snapshots or goldens changed.
- Tests: new `tests/stamp-contents.spec.js` (picture, text, take out).

### Step 7 outcome: the effect stack with Texture and Pressure offset (2.1.7, Oct 20 2026)
- Every element (stamp, picture, text, pattern, Sheet) has an ordered `fx` list `[{u,k,on,...}]`, shown as an Effects group at the bottom of its panel: add, switch on/off, move up/down, delete. Registry in `src/modules/69-effect-stack.js` (`fxRegister`, `fxFor`, `fxDef`, `fxOf`); a pattern's effects are copied onto each of its placements.
- Texture works on all five kinds (the Sheet's paper too); Pressure offset (uneven pressure 0 to 10, ink flooding 0 to 10) works on stamps and patterns and gives that stamp its own pressure variants, so the layer's own setting is not needed. `freeLayer` now builds pressure per element (one set per distinct setting).
- Kept for now (they move in step 11): the Textures panel Apply and the layer-wide pressure/flooding sliders, because Arrangement layers and the canvas still use them. Text keeps its own `tu` texture list as well as Texture effects.
- Tests: new `element-effects` spec (Sheet, stamp, pattern, texture on the Sheet, pressure variants). Quick specs run: roundtrip, launch, effects, sheet, pattern, stamp-contents, element-bar, repeat-tile. Perf vs main: ratio 1.01. No snapshot or golden changed. The full suite and CI were not run.

### Step 8 outcome: Jitter (2.1.8, Oct 20 2026) — partly done
- **Jitter** is an effect (position %, rotate degrees, size %, flip across, flip down, seed, Reroll) on stamps, pictures, text and patterns; a pattern's placements each get their own nudge from the same settings. It changes only how the element is drawn, never its stored place. Code: `fxJit` in `69-effect-stack.js`, applied in `freeLayer` (24), `artLayer` (25) and `txtLayer` (26).
- **Not done, needs a decision:** Carved edges, Symmetry, Invert and Colour grade (and Wrap) are properties of the stamp *definition* (`et er es`, `sym`, `neg`, grade): they shape the symbol that every placement shares, are rebuilt for the pressure bitmaps and the outline editor, and the Randomize tool and Presets write them. Turning them into per-element effects means per-placement symbols, which is a different and much heavier design. The proposal is to make them **stamp-definition effects** (an Effects stack on the stamp definition in the Stamp panel, `tile.fx`) in a step of their own (2.1.8b), after Morph; the layer-wide Variation sliders stay until step 11.
- Tests: new `element-jitter` spec (two tests); the pattern add-effect menu test now lists Jitter. Perf vs main: ratio 0.985. No snapshot or golden changed. The full suite and CI were not run.

### Step 8b outcome: Colour grade effect, stamp-only settings in the Stamp panel (2.1.9, Oct 20 2026)
- **Owner's rule (Oct 20 2026):** a setting that can apply to several element types is an effect; a setting that only makes sense for one type lives in that type's own panel. This replaces the step 8 idea of turning Carved edges, Symmetry, Invert and Wrap into effects.
- **Colour grade** is an effect on stamp, picture, text, pattern and the Sheet (12 adjustments as in the Grade panel, one filter per grade effect, drawn round the element; a pattern's grade applies to every placement). The Grade panel's per-stamp grade (`tile.gr`) and the layer and area masks stay until step 11, because Randomize and Presets write them.
- **Stamp panel:** the Stamp settings panel is retired. Block (shape, size, corner radius, ink, Invert), Block edge (Carved edges), Stamp texture and Symmetry now sit in the Stamp panel, with a new **Wrap at the edges** checkbox (`tile.wr`; off = `false`, on = absent; rect and hex stamps always wrapped before, circles never). The rail button, the `panel.stamp` command and the dock entry are gone.
- Still open for step 11: the per-stamp Stamp texture group duplicates the Texture effect; it stays because Randomize and Presets write `tile.tu`.
- Tests: new `element-grade` spec (3 tests); the Wrap checkbox is covered in `stamp-settings`; tests that opened the old panel now open the Stamp panel; two `colour-tray` tests switch the Sheet on first (the canvas is transparent), and one scrolls the colour well into view (a scroll closes its popup). Perf vs main: ratio 0.985. No snapshot or golden changed. The full suite and CI were not run.

### Step 10 outcome: the Paint element (2.1.10, Oct 20 2026)
- **Morph removed** from the plan (owner, Oct 20 2026). **Presets and Variations shelved** (owner is redoing them): rail buttons hidden, dock list and commands commented out, code and styles kept, their specs skipped. Step 11 leaves them alone.
- **Paint** is an element `{u, k:'paint', n, x, y, st:[stroke]}`; a stroke is `{u, w, pts, c?, t?, er?}` in canvas units (`src/modules/70-paint-element.js`). The Paint panel (rail button and element bar) has the element list, New paint, a mode (Off, Brush, Eraser), the brush (Round or Stamp tip, size, colour) and Undo stroke / Clear. With a mode on, a drag on the canvas draws into the selected Paint element (one is made if none); New paint starts another. A stamp tip is the current stamp, laid along the stroke.
- **Eraser** strokes are stored in the same list and cut out of what was drawn before them in the same element (one mask per eraser stroke), never other elements.
- **Effects** on Paint: Texture and Colour grade (Jitter and Pressure offset are not offered). The live stroke is a temporary path that is removed when the pointer comes up, so nothing of it stays in the picture markup.
- **Not in this step:** moving, scaling or rotating a Paint element on the canvas (its x, y are 0), selecting it by clicking on the canvas, snapping, and drawing across the repeat tile's edge.
- Tests: new `element-paint` spec (6 tests, including save and reopen) and `paint-speed` (400 strokes in one element: a new stroke still settles as fast as on an empty one, about 0.6 s either way, and the commit itself takes under 10 ms). Perf vs main: ratio 0.992. The Presets and Variations specs are skipped; the rail spec lists Paint and no Presets or Variations. No snapshot or golden changed. The full suite and CI were not run.

### Step 11 outcome: Randomize and the Pattern element (2.1.11, Oct 20 2026)
- **Pattern** gains a **Frame** layout (a row of points along each edge, the side rows turned 90°; Inset sets the distance from the edge), and **Shift across / Shift down** (`ox`, `oy`, in percent of a cell; brick, half-drop and grid cover the canvas after a shift).
- **Randomize builds elements** (`src/modules/71-randomize-elements.js`; the roll itself is still in `20-before-after-and-randomizer.js`). A rolled layer is an element layer (`free`, with `pl`), not an arrangement layer:
  - the main and accent layers are Patterns (the old arrangement picks Grid, Brick, Half-drop, Scatter or Radial; a linked accent layer is a second Pattern shifted half a cell); frames are Patterns on the Frame layout;
  - the Sheet is created if the project has none, and the Sheet texture roll is a Texture effect on it (`tex.u` stays empty); a Colour grade effect sometimes joins it;
  - old Impression and Variation rolls are now Pressure offset and Jitter effects on the patterns; Texture and Colour grade effects land on some patterns, free stamps and Paint;
  - **Paint strokes** are a new feature: one or two Paint elements with a few strokes (round or stamp tip, sometimes an eraser stroke), on their own layer; **Jitter** is a new feature (effect on rolled patterns);
  - the Layout feature changes Pattern layout, size (columns and rows), spacing, shift and rotation of the existing patterns, and turns scatter, rotation spread and size variation into a Jitter effect; Impression sets Pressure offset on patterns; the stamp library mixes saved stamps into the first pattern's sources.
- Randomize panel: Paint strokes and Jitter rows added; "Canvas texture" is now "Sheet texture"; "Layers" under Print effects textures is now "Patterns".
- **Not done in this step (moved to step 12, with the old-code removal):** retiring the old Arrangement, Stamps in the pattern, Manual arrangement, Variation and Impression groups from the Pattern panel, and making a new layer or project start as an element layer. Doing it needs the default project, many specs and the state snapshots to change at once, so it goes with 3.0.0. Lettering rolls still make lettered stamps (not Text elements).
- Tests: new `randomize-elements` spec (3 tests); `randomize-new` and `randomize-amounts` now check Patterns, Jitter and Sheet effects; new Randomize rows are in the amounts test. **Five state snapshots changed (`randomize-seed-1..3`, `before-view`, `split-view`) and wait for the owner's approval.** The full suite and CI were not run.

### After step 11 (Oct 20 2026, same branch)
- **Element panels leave the tool bar** (owner): the Pattern, Stamp, Shape, Text, Image, Sheet and Paint rail buttons are hidden and left out of the tool repository (`EL_ONLY` in `34-desktop-shell.js`); the element bar opens them. Their `Open …` commands still work. The harness `openPanel` opens these panels from the element bar.
- **Fixes found while updating specs** (all were broken before this change, since 2.1.4 or 2.1.7): the Shape panel that opens by itself when a shape is added now opens as its own group along the bottom (as the old Element editor did) instead of taking over the Text tab, which broke about 20 Text specs; the bitmap cache dropped the block-edge and pressure definitions of stamps that sit inside an effect wrapper (Texture or Colour grade), leaving `use` elements pointing at nothing (`bkNeed` in `03-stamp-prints-and-drawing.js`); the `element-bar` and `panel-text` specs were stale (Paint is enabled; the Stamp settings panel is gone).
- **State and SVG snapshots regenerated with the owner's approval:** `randomize-seed-1`, `-2`, `-3`, `before-view`, `split-view` (a roll now makes elements).

### Step 12 outcome: new layers are element layers (2.1.12, Oct 20 2026)
- **A new project, a new layer and Clear make an element layer:** a free layer holding one Pattern (`mkEL` in `71-randomize-elements.js`: grid of the current stamp, about 180 units a cell). Nothing makes an old arrangement layer any more.
- **Retired from the Pattern panel (hidden, code kept for now):** Arrangement (`#lmode`), Stamps in the pattern, Manual arrangement, Variation, Impression. The old arrangement engine (lattice, Repeat, Frame layers) is still in the code and still draws any layer that has one; it can be deleted in a later clean-up once nothing needs it.
- **Stamp editing on the canvas works on Pattern placements:** the printed stamps of the selected layer's Pattern go to the stamp-edit overlay (`stOlAdd` from `24-free-place-layers.js`), so Shapes can be put into a stamp by pointing at any printed copy, as before. The overlay is hidden in the Repeat 3 x 3 view (it showed in the middle tile only).
- **Repeat tile and element layers (found by the seamless specs):** the 3 x 3 view draws each layer's copies two tiles out (was one), so the outer tiles get the spill from the tile beyond them; a Sheet with effects is drawn as one tile-sized textured rectangle copied round the tile, and its Texture bitmap is made seamless (`fxTex` `tl` flag), because the stitched filter left a faint seam across the tile; Pattern grids no longer pick up a column or row that sits exactly on the edge by floating point luck.
- **Tests:** about 70 specs of the retired Arrangement UI were rewritten for element layers or removed (`any-layer-items`, `free-place`, `grid-tool`, `layout-settings` Variation and Brick tests, `layout-cleanup` Impression test); new harness helper `noPattern(page)` takes a new layer's Pattern away so a test places only what it means to; `layer-items` builds elements with `k` (format 22).
- **State and SVG snapshots regenerated with the owner's approval (Oct 20 2026):** `launch` (state and svg: the default layer is now an element layer with Pattern 1), `scenarios` (`randomize-seed-1..3`, `before-view`, `split-view`, the eight `canvas-shape-*` svg summaries) and `roundtrip` `open-project-1-diamond` (svg: the class order on the picture, `fpm shp`). Pixel goldens were not run here (the editor suite and the picture comparison are only run on the owner's word).
- **Not run:** the full suite and CI (owner's rule). Targeted runs covered about 66 specs.
- **No 3.0.0:** the owner said the version keeps advancing in 2.x.
- **Release number:** the element update goes out as **2.2.0** (owner, Oct 20 2026): the minor is raised once, when the plan is done. Steps 2.1.7 to 2.1.12 are in it.
