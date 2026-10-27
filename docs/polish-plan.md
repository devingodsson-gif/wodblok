# Polish plan (Oct 26 2026)

Owner, Oct 26 2026: "Make a plan for this. It should be as few updates as possible, super clean and effective to present a polished product." Status: **done** (2.55.0 Panels, 2.55.1 its follow-up, 2.56.0 Transform, 2.57.0 Patterns; see docs/plan.md). The owner reads it and answers the questions at the end before any release starts.

His list, in his words (shortened only where marked):
1. Dragging a corner of a selected element should allow dragging in both axes, not locked to one axis.
2. Dragging from left to right through the element should flip the x scale into negative so it is mirrored; the same with the vertical axis.
3. Dragging elements: sometimes they disappear when you leave their previous box area.
4. I should be able to select a pattern and drag its corners to resize it.
5. Panels should open on the left side by default (changeable in Settings).
6. The program should start with the Elements list panel on the right side and locked (owner's answer, Oct 26 2026).
7. The Effects group in an element panel should not have the arrow to expand if the element has no effects.
8. Patterns should place stamps/elements right next to each other, not by rows and columns: square stamps edge to edge in a checkerboard or a descending diagonal, hex stamps in a hex arrangement, triangles flipping to fit. A setting for which shape the pattern tiles by, so stamps of other shapes can still tile by a preset shape. "Give a bunch of different options for patterns."

Still open from earlier today: docs/panel-modes-plan.md steps 2 and 3 (create and edit for Stamp, Pattern, Text, Sheet and Paint; the effect pop-out). They are folded into release 1 below, so the polish work is **three releases**.

## Release 1 — 2.55.0: Panels
Items 5, 6, 7, and the rest of the panel-modes plan. One theme: what panels show and where they open. Closes docs/panel-modes-plan.md.
- **Panels open on the left (5).** A panel that is not open yet opens docked in the left dock (today: the right, 34-desktop-shell.js "a tool that is not open yet opens docked on the right"); every panel, the element panels too; the Elements list is the exception (6). Panels remember where they were: a panel closed and opened again comes back where it was (its dock, group or floating place). Settings > General > "Open panels on" Left / Right, default Left, for a panel that has no remembered place.
- **Launch layout (6).** The app starts with the Elements list docked on the right and locked (today: no panel open). This changes the Never-break rule "At launch no panel is open" in CLAUDE.md and the guide; the rule is rewritten with the owner's words.
- **Effects group (7).** With no effects on the element, the Effects group has no fold arrow and no empty body: only its title and the `+`. It folds again once it has an effect.
- **Create and edit for every kind** (panel-modes step 2): Stamp, Pattern (keeps its sources list), Text, Sheet, Paint, and the texture row in a Texture effect, through the one registry in 90-panel-modes.js.
- **The effect pop-out** (panel-modes step 3): every Effects menu item; greyed with nothing selected; on all selected elements; the window borrows the panel's own settings pane (identical options); Apply / Cancel; cancelled by another effect, a new selection or Undo; remembers where it was dragged.
- Tests: launch layout, panel side setting, effects group with and without effects, create/edit per kind, pop-out (greyed, same controls as the panel, Apply one step on all, Cancel leaves nothing). The workspace tests and any that assume an empty launch are updated.
- Risk: panels and shared panel code, 30–50% for the suite (suggested at the end of the release).

## Release 2 — 2.56.0: Transform
Items 1, 2, 3. One theme: how a selection box behaves under the pointer. All in 28-canvas-select.js and the drag drawing path.
- **Corners pull both ways (1).** A corner moves with the pointer in both directions (width and height change freely), replacing the 2.15.0 rule (the first clear pull picked width or height). Keys, as in Photoshop (owner, Oct 26 2026: yes): Shift keeps the proportions; Alt (Option) grows from the middle (today Shift does that). Sides still pull one way.
- **Pulling through mirrors (2).** Pulling a corner or side past the opposite one turns the element over on that axis, live, and the box keeps following the pointer (Photoshop's free transform). Across: the element's flip (`f`) turns. Down: the same flip plus a half turn (a vertical mirror is a horizontal flip turned 180°), so no new field is needed and the file format stays 28. Works for every kind that has a box (shapes, stamps, text, pictures, groups of them).
- **Elements no longer vanish while dragged (3).** First find the cause (likely the cached print of an element with effects, or a clip from its old box, while the draft drawing is on); then fix it at the cause, with a test that drags an element of each kind, with and without effects, out of its old box and checks it is drawn at every step.
- Tests: corner pull both ways, Shift keeps proportions, Alt from the middle, pull through across and down (flip and turn in the document, drawn mirrored), the vanishing case. `npm run perf` (drawing and dragging path; no more than 10% slower).
- Risk: drawing and dragging, 60–80% for the suite.

## Release 3 — 2.57.0: Patterns
Items 4 and 8. One theme: a Pattern tiles its area edge to edge.
- **Tiling, not rows and columns (8).** A Pattern places its pieces edge to edge by a **tile shape**, sized by one **Size** (how big one piece is) and a **Spacing** slider (owner: "a spacing slider which makes everything more or less spaced out"; 0 = touching). The canvas is filled from a centre point outward, so the arrangement is the same at every canvas size. Columns and rows go from the panel.
- **Tile shape** (the setting the owner asked for): **From stamp** (the shape of the first stamp source, default), Square, Hexagon, Triangle, Diamond, Circle, Octagon. A stamp of another shape still tiles by the chosen one, as he asked. The tile model reuses the grid shapes of 08-grid-shapes.js (`gModel`, which already lays square, hex, triangle and diamond cells for the Grid), so the canvas grid and pattern tiling share one geometry.
- **Arrangements** (the "bunch of options"), offered per tile shape:
  - Square: Grid, Checkerboard (sources alternate like squares of a board), Brick (rows offset by half), Half drop (columns offset by half), Diagonal (each row steps by a set amount: descending diagonals), Basketweave (pairs turned 90°), Herringbone, Pinwheel (four turns in each 2×2), Mirror (neighbours flipped).
  - Hexagon: Honeycomb (pointed top), Honeycomb (flat top), Three-colour (sources in the three-colour hex order).
  - Triangle: Alternating (every other triangle flipped to fit, as he described), Star of six (six turns round each point).
  - Diamond: Harlequin, Diamond grid.
  - Circle: Packed (hex packing, touching), Square packed.
  - Octagon: Octagon and square (the small gap squares stay empty or take the second source).
  - Free layouts stay as they are: Radial, Scatter, Frame, and Map to shape.
- **Which source goes where:** Cycle, Checkerboard / alternate, Random, By weight (as today, plus the board order the arrangements above need).
- **Pattern area and corners (4).** A Pattern gets an area (its box, by default the whole canvas). Selecting a Pattern shows its box with corners and sides like any element; pulling them changes the area, and the pieces keep their size, so more or fewer fit (pieces are clipped at the area's edge). Moving the box moves the area.
- **File format 29:** a Pattern's fields change (tile shape, arrangement, size, gap, area replace cn/rn/lay for the tiling layouts). Patterns made before are refused with the usual message (no conversion, owner's rule); the built-in templates are made again.
- Tests: each tile shape and arrangement places pieces that touch (no gaps, no overlaps, by geometry), From stamp follows the first stamp's shape, area corners resize without scaling pieces, save/open at format 29, older file refused, Randomize still builds patterns. `npm run perf`.
- Risk: drawing, Randomize, the file format, 80–90% for the suite.

## Order and size
Releases 1, 2, 3 in that order: 1 is low risk and finishes work already started; 2 is contained to one module; 3 is the largest and changes the file format, so it goes last and gets the full suite. Each release is one branch, one tag, and a few commits (one per behaviour change, each with its test).

## Answered (owner, Oct 26 2026)
1. Item 6: the Elements list starts on the right and **locked**.
2. Corners: free both ways; Shift keeps proportions; Alt grows from the middle: yes.
3. Every panel opens on the left by default (the Elements list on the right), and panels remember where they were opened.
4. Pattern corners change the area; the pieces do not scale.
5. Tiling replaces columns and rows; a Spacing slider spaces the pieces out.
