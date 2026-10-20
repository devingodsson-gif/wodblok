# Element UI plan (one way to make, select and edit every element)

Written Oct 20 2026 at the owner's request, after 2.2.4 (Sheet as an element). Status: **proposal, nothing built.** Open questions at the end need the owner's answer before step 1. Every new size, colour, radius or component below must be added to docs/developing-wodblok.md Part 9 first (Never break list); the look follows the Photoshop direction in docs/agent-memory.md (dark, dense, flat).

## What the owner asked for (Oct 20 2026)
- Click a button on the element bar and it **creates a new element** in the Elements list, like a new layer.
- Sheet: an **add** button, not an on/off switch.
- Paint: the button **starts painting**; no Off / Brush / Eraser switch.
- Shapes: **put shapes freely on the canvas**.
- Stamps: **easier to edit**.
- Effects: a **clear list**; adding effects is confusing today.
- Pattern and Stamp panels: the **ugly list at the top** goes.

## What is wrong today (2.2.4, from screenshots of the built app)
1. **The element bar opens panels; it creates nothing.** Each button opens its own tab (Sheet, Paint, Shape, Image, Text, Stamp, Pattern, Elements), so after a few clicks the window has eight tabs, all cut off. The element-list plan already said the buttons should create elements; 2.2.2 to 2.2.4 built the data for it but not this.
2. **Sheet** has a "Sheet" on/off switch, as if there could only be one.
3. **Paint** has Off / Brush / Eraser. You open Paint and nothing happens until you switch it from Off.
4. **Shape** opens the shape library with an Edit group (jitter, Randomize, a row of unlabelled icon buttons). Shapes can only go onto stamps.
5. **Stamp** panel is about eight groups long: a list of stamps, Contents, a second strip of the same stamps (Place), Block, Block edge, Stamp texture, Symmetry, Outlines. Its texture is a separate control from the Effects texture.
6. **Pattern** panel starts with an unstyled list ("Frame *1 source* ×", "Layer 1 *2 sources* ×"), the same patterns that are already rows in the Elements list. Its sources are a heading, a bare number box and a lone × each.
7. **Effects**: rows of "On | Jitter | ↑ | ↓ | ×" with no clear selected row, the settings of the chosen effect show somewhere below, and "Add effect" is a plain button under the list.
8. **Elements list**: Blend and Opacity at the top act on the selected rows (as in Photoshop) and stay. But in a rolled project a group's members show **above** the group's own row, so the list reads upside down (seen in a Randomize roll; to be checked against the code, which means the group row to sit above its members).

## The idea in one paragraph
Two panels on the right, like Photoshop's Layers and Properties: **Elements** (the only list) on top, **Properties** under it, showing the selected element. The element bar is the **Add** bar: a button either makes the element at once (Sheet, Pattern) or arms a tool whose first click on the canvas makes it (Paint, Shape, Image, Text, Stamp). Libraries (shapes, stamps, pictures, fonts) open as a pop-over from the button, not as panels. Every element's Properties has the same five sections in the same order; effects are a real list in the Elements rows and in Properties. Editing a stamp is a mode, like a Photoshop smart object: the stamp opens on its own, its contents become the list, Done goes back.

## Layout
```
┌ menu bar ─────────────────────────────────────────────────────────────┐
│ ▸ Select  ▢ Sheet  ✎ Paint  △ Shape  ▣ Image  T Text  ◩ Stamp  ▦ Pattern │  ← element bar (Add bar) + tool options strip under it while a tool is armed
├──┬───────────────────────────────────────────────┬────────────────────┤
│  │                                               │ ELEMENTS        + ⋯ │
│r │                                               │ 👁 ▦ Frame      fx  │
│a │                canvas                         │ 👁 ▸ Group 1        │
│i │                                               │ 👁 ▦ Pattern 1  fx  │  ← selected (muted blue)
│l │                                               │      ├ Texture   👁  │  ← effect rows, folded by default
│  │                                               │      └ Jitter    👁  │
│  │                                               │ 👁 ◻ Sheet          │
│  │                                               ├────────────────────┤
│  │                                               │ PROPERTIES  Pattern │
│  │                                               │ ▾ Arrange …         │
│  │                                               │ ▾ Sources …         │
│  │                                               │ ▾ Transform …       │
│  │                                               │ ▾ Look …            │
│  │                                               │ ▾ Effects        +  │
└──┴───────────────────────────────────────────────┴────────────────────┘
```
- **Elements and Properties are one docked column, always in this order.** The per-kind panels (Sheet, Paint, Shape, Image, Text, Stamp, Pattern) stop being tabs; their controls move into Properties. The rail keeps the tool windows that are not about one element (Colours, Randomize, History, Export, Grid…).
- **Tool options strip**: while a tool is armed (Paint, Shape, Image, Text, Stamp), a one-line strip under the element bar holds that tool's few settings (brush size, colour, Round/Stamp tip, eraser; snap; font). Photoshop's options bar. Nothing else lives there.
- **Nothing selected**: Properties shows the canvas (size, format, repeat tile), which today is a rail panel.

## The rule for every button
| Button | Click | Then |
|---|---|---|
| **Select** (new, V) | puts any armed tool away | click selects, drag moves; double-click a stamp edits it |
| **Sheet** | adds a Sheet **now**, just above the selected element (first one goes to the bottom), selected | Properties: colour, effects. The eye replaces the on/off switch |
| **Pattern** | adds a Pattern **now**, using the current stamp as its source, selected | Properties: arrange, sources |
| **Paint** | arms the brush (cursor shows the brush size) | the first stroke makes a Paint element, or adds to the selected Paint element; hold Alt (or the eraser in the options strip) to erase |
| **Shape** | opens the shape pop-over; picking a shape arms it (ghost on the cursor, as 2.2.3) | click on the canvas: a free **Shape element** is made. Inside stamp editing, the click puts the shape in the stamp instead |
| **Image** | opens the picture pop-over (recent, import, use a project) | click places an Image element |
| **Text** | arms text | click (or drag a box) makes a Text element and starts typing |
| **Stamp** | opens the stamp pop-over (this project's stamps, library, New stamp) | click places a Stamp element; the stamp stays armed |

Shared with 2.2.3: Esc, a right click or the Select button puts an armed tool away; using a panel does too; pressing the button again re-arms. A new element is selected straight away, so Properties is always showing what you just made.

## Properties: the same five sections for every kind
1. **Header**: kind icon, name (click to rename), eye. No separate "Editing …" line.
2. **Kind**: the settings only this kind has (Pattern: Arrange and Sources; Text: the text box and type; Sheet: colour; Paint: strokes count, Clear; Image: crop; Stamp: which stamp, Edit stamp).
3. **Transform**: position, size, rotate, flip, and the 3 x 3 Align grid. Not shown for Sheet.
4. **Look**: ink colour, and the kind's colour settings. Opacity and blend stay at the top of the Elements list, as in Photoshop, and are not repeated here.
5. **Effects** (below).

## Effects: one list, two places
- **In the Elements list**, a row with effects shows a small `fx` mark; its arrow unfolds one sub-row per effect (eye, name). Clicking a sub-row selects that effect.
- **In Properties**, the Effects section is a list of rows: eye, name, a drag handle to reorder, and ⋯ (Duplicate, Delete). One row is open at a time and shows its settings under it (an accordion), so it is always clear which effect you are changing. The **+** in the section header opens the menu of effects for this kind.
- The Stamp panel's own **Stamp texture** becomes a Texture effect on the stamp, so there is one way to add texture.
- Up/down arrow buttons go (drag replaces them; Move up/down stay in ⋯ for keyboard users).

## Stamps: editing as a mode
- **Edit stamp**: double-click a stamp on the canvas, or Edit stamp in Properties. The canvas shows that stamp alone, large, with everything else dimmed; a bar on top reads `Pattern 1 › Stamp 2   Done`.
- While editing, **the Elements list shows the stamp's contents** (its shapes, text, pictures) as rows, with the same eye, order, group and effects as any element. Properties of the stamp itself (nothing selected inside) is the Block: shape, size, corner, ink, invert, wrap, edge, symmetry, outline.
- Shape, Text and Image buttons put things **into the stamp** while editing, and onto the canvas otherwise. One way to add, two destinations.
- The list of stamps and the second "Place" strip go: choosing a stamp is the Stamp pop-over (with New, Duplicate, Delete, Library), and "Make stamp from selection" moves to the ⋯ menu of a selection in the list.
- A Stamp element's Properties has a stamp picker (thumbnail + name) to swap which stamp it prints.

## Pattern panel
- The list of patterns at the top goes: patterns are rows in the Elements list.
- **Sources** become a proper list: thumbnail, name, weight (when Weighted is on), ⋯ to remove; **+** opens the stamp pop-over to add one.
- Arrange stays: the six layouts, then the sliders, then Cycle/Random/Weighted and Reroll.

## What goes away
Per-kind tabs; the Sheet on/off switch; Paint's Off/Brush/Eraser switch and its stroke list; the Pattern list; the stamp list and Place strip in the Stamp panel; Stamp texture as a separate control; effect up/down buttons; "Use this shape on every stamp" moves to the Block section's ⋯.

## Data changes
- **Free shapes** need a `shape` element kind (a motif drawn on its own, with ink, size, turn, effects). Today shapes live only inside stamps. File format 25; old files refused as usual, no migration.
- Stamp texture as an effect: the stamp's texture field becomes a `fx` Texture entry on the stamp (same format bump).
- Everything else is UI over the data that 2.2.2 to 2.2.4 already built.

## Steps (each a small release; numbering is the owner's call, see below)
1. **Properties panel and the Add bar**: Elements + Properties column; tabs go; Select button; Sheet and Pattern create at once; group row order fixed. (Risk: medium. Panels and tests that open panels by name change.)
2. **Tools that arm**: Paint arms on click (eraser by Alt or the options strip), options strip, Image and Text through the same arm rule, pop-overs for shapes, stamps and pictures. (Medium.)
3. **Free shapes**: `shape` element kind, format 25, drawing, Randomize aware. (High: drawing and file format; full suite suggested.)
4. **Effects list**: Properties accordion, `fx` rows in the Elements list, drag reorder, stamp texture becomes an effect. (Medium; format change rides with step 3.)
5. **Stamp editing mode**: isolation view, contents as the list, Block as the stamp's Properties, buttons add into the stamp. (High: canvas and stamp drawing.)
6. **Pattern sources list** and the last clean-up (docs, coupling map, UI standard check). (Low.)

2.2.5 (engine clean-up) still comes first: it removes the old arrangement engine and layer-level controls, and step 1 is simpler without them.

## Open questions for the owner
1. **Make on click, or on first use?** This plan makes Sheet and Pattern at once and the rest on the first click on the canvas, so a stray button press never leaves an empty element. Or should every button add a row at once?
2. **Where does a new element go:** just above the selected element (Photoshop) or always at the top (the element-list plan's decision 1)?
3. **Element bar**: keep it floating over the canvas, or move it into the slim left strip like Photoshop's toolbar (the rail would then hold only tool windows)?
4. **Version numbers**: this is a new plan; 2.3.0 when it is done, with steps 2.2.6, 2.2.7…, or something else?
5. **Restyle**: do the Photoshop-style look at the same time (each step restyles what it touches), or as its own pass afterwards?
