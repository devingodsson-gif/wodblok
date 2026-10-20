# WODBLOK element update: elements and effects

Written Oct 19 2026. Status: **started Oct 19 2026** (the owner said to start: step 1 after the CI change). Work is done one complete step at a time; after each step this document gets the outcome (see "Progress log" at the end), and anything learned goes into docs/agent-memory.md. The finished update is **version 3.0.0**; its steps are patches 2.1.1, 2.1.2 and so on (owner, Oct 19 2026).

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
| Morph | new: wave, bulge, twist, roughen with amount, scale, seed |
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
| 9 | 2.1.9 | **Morph** | medium |
| 10 | 2.1.10 | **Paint element**: strokes, shape brushes, eraser; speed test with many strokes | high (speed) |
| 11 | 2.1.11 | **Everything that builds documents**: Randomize tool, Presets, Variations, Colourways, export, print proof, book cover. Seeded Randomize snapshots change once (owner's OK first) | high |
| 12 | 3.0.0 | Tests, perf, docs, old code removed, release | |

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
