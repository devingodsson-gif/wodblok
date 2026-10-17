# WODBLOK UI Standard

The rulebook for how every part of the editor looks and behaves. Read it before adding or changing any UI. When a rule here and the code disagree, the rule wins and the code is a bug to fix (section 15 lists the known ones).

**Scope:** the editor (`src/shell.html`, `src/modules/`). The marketing site is separate.
**Status:** written Oct 16 2026. Sections 2–14 are the standard. Release 1.12.0 applied the tokens, the three radii, three font sizes, the sans-serif font and the heading levels to the page CSS; `npm run check:style` enforces sizes, radii and fonts. Section 15 is the measurement taken on 1.11.0, before that release; what 1.12.0 did not change is listed in section 16.
**Words:** MUST and MUST NOT are rules. SHOULD is a default you can break only with a stated reason in the pull request.

## 1. Principles

1. **One way to do each thing.** If a control, list, dialog or heading already exists, reuse it. A second version of the same thing is a bug, even if it looks nicer.
2. **Few values, used everywhere.** Every size, radius, colour and duration comes from a short scale (sections 3–8). New numbers are not allowed in a feature; if the scale is missing something, change the scale first, in this document.
3. **Quiet chrome, loud artwork.** Warm paper surfaces, one brass accent, thin lines. The pattern is the only thing allowed to be bold.
4. **Labels, not words.** No explanatory text, helper paragraphs or tooltips in panels. Clear grouping and short labels do the work.
5. **Nothing is hover-only.** Hover may add feedback, never the only way to find or use something.
6. **Speed is part of the look.** A style that slows drawing, dragging or sliders is rejected (`npm run perf`).

## 2. How to use this guide

- **Tokens, not numbers.** In CSS, write `var(--r-m)`, never `8px`; `var(--fs-m)`, never `12.5px`. The token names are defined in sections 3–8. Until the standardisation release lands (section 16), the table beside each token gives the literal value to use.
- **Roles, not look.** Choose a component by what it is for (section 9), not by which one looks closest.
- **No inline styles for chrome.** Colour, size, radius and font belong in CSS classes that use tokens. JavaScript may set only position and size that are computed (floating panel coordinates, the swatch colour variable `--c`).
- **Change the guide with the code.** A pull request that adds a reusable pattern updates this document in the same commit.
- **The user decides the standard.** Do not change a scale value, add a step or retire a component without asking.

## 3. Colour

The editor supports light and dark. Both must be correct for every screen. Theme is stored in `wb60_theme` and applied as `data-theme` on `:root`; the dark values are defined for the system preference and for the explicit setting. Keep both paths.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--stage` | `#eae4d8` | `#1b1a18` | Work stage behind the artwork |
| `--stage-dot` | `rgba(60,40,10,.07)` | `rgba(255,255,255,.04)` | Stage dots (off with `body.plain`) |
| `--panel` | `#f6f2e9` | `#242220` | Panels, docks, dialogs |
| `--raise` | `#ffffff` | `#2e2b28` | Raised surfaces, menus, hovered rows, buttons |
| `--field` | `#ffffff` | `#1e1c1a` | Input and dropdown backgrounds |
| `--line` | `#ddd5c6` | `#37332f` | Quiet dividers and card borders |
| `--line2` | `#cbc2b0` | `#4a453f` | Control edges, menu and dialog borders |
| `--fg` | `#26221d` | `#ede6da` | Primary text |
| `--mut` | `#706858` | `#a39b8e` | Secondary text, idle icons |
| `--faint` | `#766d60` | `#8f887c` | Group labels, counts, hints |
| `--acc` | `#b8914f` | `#c9a66b` | Accent: focus, selection edge, fills of key actions |
| `--acc-ink` | `#8a6528` | `#c9a66b` | Text and icons on a soft accent background |
| `--acc-fg` | `#1b1a18` | `#1b1a18` | Text on a solid accent fill |
| `--acc-soft` | `rgba(184,145,79,.16)` | `rgba(201,166,107,.16)` | Selected and active background, slider halo |
| `--warn` | `#c0532e` | `#e8895c` | Unsaved dot, warnings, destructive confirm |
| `--ok` | `#3f8f66` | `#7fb08a` | Success |
| `--shadow` | layered, warm | layered, dark | Floating surfaces only |
| `--paper-shadow` | broad, warm | broad, dark | The artwork sheet only |

Rules:
- Chrome MUST use these tokens. No literal hex or `rgb()` in chrome CSS or inline styles.
- Literal colours are allowed only for: the artwork and colours the user chose; the colour picker's own hue bar and handles; the swatch fallback `var(--c,#888)`; scrims (`rgba(10,11,14,.45)`).
- A swatch of the user's colour MUST have the swatch edge (`inset 0 0 0 1px rgba(0,0,0,.2)`) so pale colours stay visible. One value, everywhere.
- The accent colour is the person's choice (Settings > General). The values in the table are the default, Oak. The eight named accents are woods: Oak, Birch, Rosewood, Ironwood, Eucalyptus, Purpleheart, Walnut, Maple. Chrome uses the tokens, never the literal, so a changed accent reaches every control. The settings code derives the four accent tokens of both themes from the one colour picked and keeps the ink at 4.5:1 or better on the panel.
- The accent is for selection, focus and the one key action in a view. Never use it as decoration, and never for more than one primary action per view.
- `--warn` and `--ok` carry meaning only.
- Contrast: check muted and disabled text in both themes. State is never carried by colour alone (add the edge, weight or icon).
- Compare colours: `--ca` (blue) is A and `--cb` (amber) is B in Before/After; they mean nothing else.

## 4. Type

| Token | Size | Use |
|---|---|---|
| `--fs-s` | 11px | Labels, hints, counts, group labels, tab text, meta |
| `--fs-m` | 12.5px | Body, buttons, fields, list rows, menus. The base size |
| `--fs-l` | 14px | Panel, group and dialog titles (600) |

Brand sizes are separate and fixed: wordmark 15px, splash 20px. The "+" glyph of an empty slot is 18px (list) or 28px (large). Nothing else uses another size.

Font (one family, sans-serif only):
- **Hanken Grotesk** for every piece of text in the app: the wordmark and splash, titles, labels, buttons, fields, lists, menus, status messages and the print proof sheet. Fallback `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- No serif, display or second UI face. Hierarchy comes from size, weight and case, never from a different font.
- Exempt: the fonts the user picks for their own artwork in the Text tool (and imported fonts). They are content, not interface.
- The font is bundled; no remote fonts, no runtime network.

Weights: 400 body; 500 tabs and segmented buttons; 600 titles, emphasis, selected row text and the primary button. Nothing else (no 300, no 700).

Other type rules:
- Numbers users compare (sizes, counts, values, dimensions) MUST be tabular (`font-variant-numeric: tabular-nums`; already set on `body`).
- Group labels: `--fs-s`, uppercase, `letter-spacing: .06em`, `--faint`. One style (section 11.2).
- Line height 1.4 unless a control sets a fixed height.
- Text in a control or row that can be long MUST truncate with an ellipsis, never wrap or push neighbours.

## 5. Shape

Three radii and a circle. Nothing else.

| Token | Value | Use |
|---|---|---|
| `--r-s` | 4px | Elements 20px tall or less: chips, checkboxes, tags, small swatches, slider-like handles that are not round |
| `--r-m` | 8px | **Everything else you can click, type in or select:** buttons, icon buttons, fields, dropdown buttons, list rows, menu items, tab highlights, segmented buttons, swatch wells, thumbnails, tiles, cards, the segmented container |
| `--r-l` | 12px | Surfaces that float or contain: menus, popovers, dialogs, floating panels, the colour picker |
| `50%` | circle | Dots, radio marks, round handles |

- A shape nested inside a padded parent takes the next radius down: inside `--r-l` use `--r-m`; inside `--r-m` use `--r-s`. A swatch well (`--r-m`) holds a swatch at `--r-s`; the segmented container (`--r-m`) holds buttons at `--r-s`.
- Slider and progress tracks use half their height.
- Docked panels, panel headers, tab strips and dock edges are square (radius 0). Only floating panels use `--r-l`.
- Border: 1px, `--line` for dividers and card borders, `--line2` for the edge of anything you click or type in. No 2px outlines except focus and selection (section 10).
- There is no 5, 6, 7, 9, 10 or 14. If a shape seems to need one, it is one of the three above.
- Exemptions: tracks of 1–3px (sliders, scrollbars) and the picture buttons listed in section 9.1. `check:style` allows these and nothing else.

## 6. Size, spacing and layers

**Control heights** (anything you click or type in):

| Token | Height | Use |
|---|---|---|
| `--h-xs` | 22px | Compact buttons inside rows and chips that act |
| `--h-sm` | 26px | Toolbar and panel-header icon buttons, small inline buttons, segmented control buttons |
| `--h-md` | 30px | **Default.** Buttons, fields, dropdowns, icon buttons, swatch wells |
| `--h-row` | 32px | List rows and folder headers |
| `--h-touch` | 40px | Rail buttons and any new control that needs a touch target |

Elements under 22px are indicators (dots, chips that do not act, handles), not controls. Mixed heights in one row are not allowed: a row of controls shares one height.

**Spacing** (gap, margin and padding steps): 2, 4, 6, 8, 12, 16 px (`--sp-1` … `--sp-6`). 6 and 8 are the workhorses (control rows use gap 6; field groups gap 8).
- Between control rows in a group: 6.
- Between groups: 12.
- Panel and group inset: 12 on the left and right, matching the header; rows inside lists use 8. Spacing above 16 is a multiple of 4.
- A control's internal horizontal padding: 8 for fields, 12 for buttons with text.

**Elevation:** `--shadow` on menus, popovers, dialogs, floating panels and dragged ghosts. `--paper-shadow` on the artwork only. Docked panels, rows and cards have no shadow.

**Layers (z-index)** use these bands only; a new layer picks a band, never a new number:

| Band | Value | What |
|---|---|---|
| In a component | 1–9 | Overlap inside one control |
| Stage overlays | 40–45 | Bars, labels and handles over the stage |
| Menus and popovers | 50–60 | Anchored menus, dropdown lists, rail flyouts |
| Drag ghosts, modals | 70–80 | Dock ghosts, dialogs with scrim |
| Floating panels | 9000+ | Managed by script, raised on focus |
| Pickers | 9100 | Colour picker, always above floating panels |
| Command search | 9500 | Mod+K |
| Transient | 9999 | Messages that must be seen |
| Splash | 10000 | Launch only |

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--t-fast` | 120ms | Hover, press, selection, chevron turns, slider thumb |
| `--t-slow` | 200ms | Fades and the unsaved dot |

- Menus, dropdown lists and popovers enter with `popin` (fade, 4px rise, scale .98→1) at `--t-fast`, ease-out. Nothing else animates on entry.
- Panels do not animate open, close or dock (deferred; see the roadmap).
- Animate only `opacity`, `transform` and colour properties. Never animate `width`, `height`, `top` or `left` of anything over the artwork.
- `prefers-reduced-motion: reduce` MUST remove every animation and transition.
- Nothing may block or delay input for the sake of motion.

## 8. Icons

- One icon family: line icons, `stroke="currentColor"`, round caps and joins, no fill, no emoji, no text glyphs as icons.
- Sizes: 13px in dense rows, 15px in panel headers and toolbars, 18px in the rail. Nothing else.
- Stroke weight is set once, by icon size, in the `.ic` rules; a new icon takes the class and the size and sets no stroke width of its own.
- Idle icons `--mut`; hover `--fg`; selected `--acc-ink`.
- Every icon-only control has an `aria-label` and a keyboard route. The label is not shown as a tooltip.
- Texture, brand and drawn shapes are artwork, not icons, and are exempt.

## 9. Components

Each component has one definition. If a screen needs a variant, it uses the closest one; it does not invent a look.

### 9.1 Buttons

| Role | Looks | Use |
|---|---|---|
| **Primary** | `--acc` fill, `--acc-fg` text, 600, `--h-md`, `--r-m` | The one key action of a view or dialog (Save, Open, Replace). At most one per view |
| **Secondary** | `--raise` fill, `--line2` border, 400, `--h-md`, `--r-m` | Every other text button |
| **Quiet** | Transparent, no border, `--mut` text | Rows, headers and toolbars where a bordered button would be noisy |
| **Icon** | Transparent until hover, `--h-md` square (`--h-sm` in a panel header, `--h-xs` in a row), `--r-m` | One action, no text |
| **Toggle** | Secondary that stays selected: `--acc-soft` fill, `--acc` edge, `--acc-ink` text, `aria-pressed` | On/off settings |
| **Destructive confirm** | Secondary whose label turns to the verb with `--warn` text on the first tap | Second tap does it (sections 12.6 and 12.7) |

- Button text: sentence case, a verb or a short noun ("Save", "Add colour"). A trailing `…` means it opens a dialog or asks for more input, and only then.
- Buttons in a row sit 8px apart; icon buttons 4px apart.
- Buttons do not change size when their state changes.

### 9.2 Sliders (the value row)

One row layout for every slider: **label | track | value**, in a grid of `104px  1fr  52px`, gap 8, rows 6px apart.
- Label: `--fs-s`, `--mut`. Dragging the label scrubs the value (`ew-resize`).
- Track: 3px tall, `--line2`, filled part `--acc`. Thumb: 13px circle, `--raise` fill with an accent edge.
- Thumb grows to 1.15× on hover; while pressed it gets a 5px `--acc-soft` halo. These two effects are the only slider motion.
- Value: right-aligned, tabular, `--fs-s`; it is editable by clicking. Units appear in the value (`12 px`, `45%`), never in the label.
- Slider steps and ranges are chosen so a drag feels continuous; never fewer than about 100 positions across the track unless the setting is discrete.
- A slider MUST NOT rebuild the whole picture when only an overlay opacity changed (see the speed audit).

### 9.3 Fields

- Text and number fields: `--h-md`, `--r-m`, `--field` fill, `--line2` border, `--fs-m`, padding 5 / 8. Number fields are tabular and right-aligned.
- Focus shows the standard outline (section 10); no glow.
- An invalid value shows `--warn` edge and keeps the typed text. It does not clear the field.
- Colour fields (hex, RGB, HSB) are uppercase and tabular.
- Search fields are fields with a leading icon; they appear when a list can pass about 20 items.

### 9.4 Dropdowns

- Native `<select>` is never shown. Use the custom dropdown (`.dd2`, which hides the native select).
- Button: `--h-md` minimum, `--r-m`, `--field` fill, text left, chevron right that turns 180° when open.
- List: `--r-l`, `--raise`, `--line2` border, `--shadow`, padding 5, enters with `popin`.
- Item: padding 6 / 9, `--r-m`; current item `--acc-soft`, `--acc-ink`, 600; disabled item opacity .4.
- Opens below the button; flips above when there is no room. Esc closes; arrow keys move; Enter picks.

### 9.5 Segmented control

A row of two to four mutually exclusive options. Container `--r-m`, `--panel` fill, `--line` border, padding 2, gap 2; buttons `--r-s`, 500; selected = `--raise` fill with `--line2` edge (or `--acc-soft` when it shows a mode of the whole app). Use it instead of a dropdown when there are four options or fewer and the choice should be visible.

### 9.6 Colour wells and the picker

- Well (`.ccb`): 38 × 30, `--r-m`, padding 3, the swatch inside fills it and has the swatch edge. It opens the picker directly.
- Linked or locked state: the lock icon sits beside the well, `--h-md` square icon button; open lock = linked to a tray slot, closed lock = fixed. Same place on every colour control.
- Picker (`.cpop`): 224px wide, `--r-l`, padding 10, gap 10, `--shadow`. Saturation square 132px tall `--r-m`; hue bar 12px tall; fields below; recent colours last.
- Dropper is part of the picker, never a separate window.
- Never write a one-off colour input; every colour in the app is chosen through the picker.

### 9.7 Tabs and rail

- Rail buttons: `--h-touch`, icon only, `--r-m` selected highlight with `--acc-soft`.
- Panel tabs (`.wtab`): `--fs-s`, 500, `--mut`, 11px side padding, square; the active tab `--fg` with a 2px `--acc` bar on top.
- A tool opens a panel; a panel never opens by itself at launch, except through the launch workspace (the one called Default, else the first workspace).

### 9.8 Swatches, thumbnails and cards

- Swatch: 18–30px square, `--r-s` (≤20px) or `--r-m`, with the swatch edge.
- Thumbnail: keeps the picture's aspect, `--r-m`, `--line` border. Lazy-loaded; never rendered on open.
- Card (a thumbnail with a name): `--r-m`, `--line` border, name `--fs-m` truncated below the picture; hover `--raise`; selected `--acc` edge + `--acc-soft`.

### 9.9 Status

- One status line at the bottom of the window. Messages are short past-tense sentences with the name in curly quotes: `Saved template “Rose”`, `Started from “Brick”`, `Could not read that file`. Library messages are in section 12.9.
- The unsaved state is an 8px dot (`--warn`) beside the name; no text.
- No toasts, no `alert`, `confirm` or `prompt`.

## 10. States

| State | Rule |
|---|---|
| Rest | Token colours, no shadow |
| Hover | Fill `--raise` (on `--panel`) or edge `--line2`; icons to `--fg`. `--t-fast` |
| Pressed | One step darker/lighter fill; never a size change |
| Selected / on | `--acc-soft` fill, `--acc` edge or 2px accent bar, `--acc-ink` text. Plus a non-colour cue (edge or weight 600) |
| Focus | `:focus-visible { outline: 2px solid var(--acc); outline-offset: 1px }`. Never removed. On a coloured fill use `0 0 0 2px var(--panel), 0 0 0 4px var(--acc)` |
| Disabled | Opacity .4, not clickable, still readable. No tooltip explaining why |
| Dirty / unsaved | 8px `--warn` dot |
| Error | `--warn` edge and a status-line message; content is kept |
| Loading | Keep the old picture; show the busy state in the status line. No spinners over the artwork |

## 11. Panels, headings and groups

### 11.1 Panel structure

- **Panel header:** min-height 40, padding 6 / 12 / 6 / 12, bottom border `--line`; title `--fs-l` 600; header actions on the right are `--h-sm` icon buttons or one `--h-sm` quiet text button, gap 8.
- **Body:** scrolls; inset 12 left and right.
- **Group (`details.g`):** summary padding 8 / 12, `--fs-l` 600, chevron left, bottom border `--line`; hover tints with `--raise`. Group content aligns to the same 12px inset.
- **Group label** (a sub-heading inside a group): section 11.2.
- **Panel bar** (the compact bar under a header with a setting, e.g. Auto-open): padding 7 / 10, `--fs-s`, `--mut`, bottom border `--line`.
- Panels MUST work at narrow widths: no fixed widths that overflow; labels truncate; the slider grid keeps its columns.
- A panel works docked left, right, top or bottom, tabbed and floating. Test all three before shipping.

### 11.2 Headings (the complete list)

| Level | Style | Use |
|---|---|---|
| Panel / dialog title | `--fs-l`, 600 | Once per panel or dialog |
| Group title | `--fs-l`, 600, in a `details.g` summary | Collapsible groups |
| Group label | `--fs-s`, uppercase, `.06em`, `--faint`, padding 8 / 10 / 2 | Dividing a group inside a panel ("Showing", "All"). Libraries do not use it; their folders are rows (section 12) |

There is no fourth heading. `h1`–`h6` tags are used for structure, then styled as one of these three.

### 11.3 Mode and launch

- Launch: Pattern mode, fully cleared, no tool window open.
- Pattern and Stamp editor each have their own set of panels; a new tool says which mode it belongs to.
- Workspaces save the layout. They are applied on demand, and the launch workspace (the one called Default, else the first) is applied once at launch. Every workspace, including the starting ones, can be changed, replaced or deleted.

## 12. Libraries and the folder system

**The motif (shapes) library is the model.** Its folder system is the one way to organise anything a person picks from a saved collection. Every other library works exactly like it: the same tree, the same rows, the same menus, the same words. Only the item (tile, card or row) differs.

### 12.1 What is a library

A library is any collection a person saves things into and later chooses from. Today and planned:

| Library | Items | Item shown as |
|---|---|---|
| Shapes (motifs) | Imported and built-in shapes | Tiles |
| Stamps (saved stamps) | Stamps | Tiles |
| Textures | Imported and built-in textures | Tiles |
| Colours (saved trays) | Trays of colours | Rows with a swatch strip |
| Colourways (saved colourways) | Named colour sets | Cards |
| Templates | Template projects | Cards |
| Workspaces | Panel layouts | Rows |
| Export recipes | Export presets | Rows |

Rule: if someone chooses one of many saved things from a list or a menu, it is a library and it uses this tree. No library gets its own list design, its own folder design or its own words. A short list is still the tree, just with no folders made yet.
Not libraries: the layers list, the tray's 16 colour places, history, and **this project's colourways** (a handful of cards that belong to the document, so no folders). A colourway becomes a library item only when it is saved to the Colourways library.

### 12.2 One tree

Words (use these and no others):
- **Item:** one saved thing (a shape, a stamp, a texture, a tray, a colourway, a template).
- **Folder:** a container the user makes. It holds folders and items, to any depth.
- **Set:** a built-in folder that ships with the app (for example a shape set, Wada's tray sets, Starting points). Sets sit in the same list as your folders.
- **Home:** the folder that holds your own items that are not in a folder. It is the first row of every library and is always shown. Its name is **Yours** in every library. (Shapes still say "My imports" until the standardisation release renames it.)
- **Active folder:** the last folder opened, or the last one whose menu was used. New items, imports and new folders go there; with none active they go to Home.

Structure:
- The top level is one list: **Home first, then your folders and the sets together, A to Z** (case-insensitive, numbers sorted as numbers). Inside a folder: its folders first (A to Z), then its items.
- A folder is known by its **path** (`Florals/Roses`); an item stores that one path string, so nesting needs no file-format change. A set is known by its original name, so renaming the set changes nothing underneath.
- Folder names: up to 30 characters; no `\ " < > & | /`; unique among siblings, case-insensitive. Making a name that exists opens the existing folder; renaming onto an existing name merges the two ("Merged “A” into “B”").
- Sets can hold your folders and items you file into them; an item filed into a set also stays in its own set. Sets can be renamed (**Reset name** puts it back) or hidden, **never deleted**. Hidden sets collect in a **Hidden sets** row at the bottom of the list, closed by default, with a count.
- Items you made can be deleted. Built-in items and items in use in the project cannot (a status message says so).

### 12.3 The folder row

One row design for every folder, set, Home and the Hidden sets row (`.lfr`, `.lfh`):
- Height `--h-row` (32), `--r-m`, gap 6, padding 0 4, indented 12px per level of depth (`--d`).
- In order: **chevron** (13px, turns 90° open, `--t-fast`) · **icon** (closed folder, open folder, or the Home icon; hidden sets are dimmed) · **name** (truncates) · **count** (`--fs-s`, `--faint`, tabular: items inside it and every folder inside it, each counted once) · **"…" button** (always visible, `--h-xs`).
- Hover fills the row `--raise`. The **active folder** has the `--raise` fill and a 2px `--acc` bar on its left edge; this is the selected state for every row in a tree.
- The whole row is the target: **click opens or closes in place**; Right arrow opens, Left arrow closes (rows are focusable); right-click opens the same menu as "…".
- **Many folders can be open at once.** Which are open is remembered between sessions (a per-library key). Opening makes a folder active; closing the active one hands "active" to the folder above it.
- Under an open folder: its folders, then its items in the item style of the library, then nothing else. An open folder with nothing in it shows one line, `Empty folder` (Home: `No <items> yet`), in `--faint`.
- Drilling into a folder with a Back button is not allowed; the tree opens in place.

### 12.4 Items

- **Tiles** (shapes, stamps, textures): square (`aspect-ratio: 1`), `--r-m`, `--field` fill, `--line` border, padding 5, gap 6, in a grid indented under the folder (12px per level plus 8). The size slider sets items per row (remembered per library). The tile in use has the accent edge; select mode shows a check.
- **Cards** (templates, colourways): section 9.8.
- **Rows** (saved trays, workspaces, recipes): `--h-row`, the same anatomy as a folder row but with a swatch strip, thumbnail or name instead of the chevron.
- Items always have an `aria-label` with their name. A tile or card never shows its name as a tooltip.
- The remove (×) button on your own items is always visible (never hover-only).

### 12.5 The toolbar (top of every library)

Same order, same icons, in the library's header row: **Expand/Collapse all** (one toggle; its label says which) · **Select** (toggle, `aria-pressed`) · **New folder** · **size slider** (tiles and cards only) · **Import / Add** (a menu: Image…, Sheet…, From file… as the library allows). Search appears when a library can pass about 20 items and is a normal field (9.3) under the toolbar.

### 12.6 Folder menu and the folder form

The "…" menu (Export… is disabled for an empty folder). Items in this order, leaving out what does not apply:

| Row | Menu |
|---|---|
| Your folder | New folder inside · Rename · Move to… · Export… · Delete folder |
| Set | New folder inside · Rename · Reset name (disabled until renamed) · Hide from the list / Show in the list · Export… |
| Home | Export… |

Choosing New folder inside, Rename, Move to… or Delete folder opens the **folder form inline, directly under the active folder** (not a dialog, not a prompt):
- **New / rename:** a name field and a button (Create, Rename). Enter confirms, Esc cancels. The new folder opens and becomes active. When items are selected, New folder offers **Create and move**.
- **Move to…:** a destination dropdown (Top level, then every folder by full path `A / B`, excluding itself and its own children) and **Move**. Moving a folder moves everything inside it and everything filed in it.
- **Delete folder:** one line, `Delete “Name” and 2 folders inside?` and a `--warn` **Delete** button. Items are not deleted: they return to Home and the status line says so.
- Cancel is always there; the form never covers other rows.

### 12.7 Select mode (many items at once)

- **Select** toggles select mode. Clicking items toggles them; **Shift-click** selects the range from the last click; **Select all / Select none** works on the items visible (only open folders count). Esc leaves select mode.
- A bar shows `N selected` or `None selected` with: **Move to…** (a dropdown of every folder by full path, and `＋ New folder…` to make one and move into it) · **Take out of folder** · **Delete N**.
- **Delete N is two-tap in place:** the first tap changes the label to `Click to confirm` for 3 seconds; the second tap deletes. Built-in items and items in use are skipped, and the status line says how many.
- **Drag an item onto a folder row** moves it (the whole selection if the dragged item is selected). The row highlights while you hover over it. A drop never copies.

### 12.8 Where things are saved

- Folder list, each item's path, set renames and hidden sets, open folders and tile size are saved with the library, through `src/platform` (never `localStorage` directly in new code). Open and active state are per-person settings, not part of a project.
- A project file keeps each item's folder as a plain path string.
- Export, Randomize and every "Save to" or "Move to" picker use the same flat list of folders by full path (`A / B / C`), in tree order, indented by depth.
- A library always supports **Export** (a folder, with its folders) and **Import from file**, so people can move data between browsers and back it up. Until Export everything exists, this is the backup route.

### 12.9 Messages

Short past-tense sentences, names in curly quotes, paths with ` / `, in the status line:
`Made the folder “A / B”.` · `Renamed the folder to “Name”.` · `Moved “Name” to “A / B”.` · `Moved 3 shapes to “A / B”.` · `Deleted the folder “Name”. Its items went back to Yours.` · `Merged “A” into “B”.` · `“Name” is back in the list.` · `Those shapes are used on your stamps. Remove them from the stamps first.`
Replace “shapes” with the library's own word (stamps, textures, trays, colourways, templates).

### 12.10 Starting points

Starting points (built-in templates, workspaces, recipes, shape sets, Wada tray sets) are **sets**: they appear in the same list as your folders, can be hidden, can hold your folders, and have no delete. A library with only a few built-ins can show them as one set called **Starting points**; it is still a set, with the set menu, not a separate heading style.

## 13. Dialogs and menus

### 13.1 Dialogs

- Backdrop: `rgba(10,11,14,.45)` scrim, `--z` 80, padding 30 (8 on a phone). Clicking the scrim or pressing Esc closes (unless a destructive step is mid-way).
- Surface: `--panel`, `--line2` border, `--r-l`, `--shadow`; width `min(<design width>, 100%)`.
- Header: title (`--fs-l`, 600) left; a `--h-sm` close icon button right.
- Body: scrolls; inset 12.
- Footer: actions right-aligned, gap 8; **Cancel** (secondary) then the **primary** on the far right. Enter triggers the primary; Esc cancels.
- Focus moves into the dialog on open and returns to the opener on close.
- A dialog asks for input or shows a library. It does not show instructions, and it does not ask yes/no questions; use two-tap instead.

### 13.2 Menus

- Anchored to the control that opened them. `--raise`, `--line2`, `--r-l`, padding 5, `--shadow`, `popin`.
- Item: `--fs-m`, about 30px tall (padding 6 / 9), `--r-m`; icon (optional) 15px at the left; shortcut right, `--fs-s` `--faint`.
- Divider: 1px `--line`, 4px above and below.
- A menu item that opens a dialog ends with `…`. Disabled items stay visible at opacity .4.
- Keyboard: arrows move, Enter picks, Esc closes and returns focus.
- The File menu order is fixed: New project, New from template…, Clear, divider, Open…, Save as template…, then the rest. Add to a menu at the end of its logical group, and ask before reordering.

### 13.3 Commands and shortcuts

- Every action is a named command in the registry (id, label, shortcut, enabled check, run). Menus, shortcuts and command search all read it.
- Shortcuts use Mod (Cmd on Mac, Ctrl elsewhere). Single-key tools stay single keys. Do not use a key a browser tab keeps for itself (Mod+N, Mod+W, Mod+T).
- Command labels are the same words as the menu items.

### 13.4 Settings

- One dialog (`File > Settings…`, command `settings.open`), width 640, a page list on the left (`--h-row` items, the current page `--acc-soft`, `--acc-ink`, 600) and one page at a time on the right. On a phone the list becomes a row across the top.
- A setting is one row: label left, control right, `--h-row` tall, a `--line` rule between rows. Controls are the standard ones: toggle (`.pvc`, On / Off), segmented control, slider row, button, swatch row. No explanatory text; the label says what it does.
- A setting changes the app at once, is kept in the settings record (kv, keys `wb114_…`), and has no Apply or Save button.
- A page lists only what the app can really do today. Do not add a control whose effect is not built.

## 14. Words

- **British spelling:** Colours, Colourways, Colour grading, Grey.
- **Sentence case** for every label, button, menu item and title. Uppercase only for group labels (done by CSS, so the source text stays in sentence case).
- **Vocabulary:** Tray (the working colours), Saved trays, Colourways, Folder, Set, Yours (the home folder), Hidden sets, Starting points (a set), Untitled pattern, Stamp, Layer, Canvas, Project, Template. Use these words and no synonyms (not "palette", "category", "collection", "preset pack", "my items").
- Verbs on buttons: Save, Open, Add, Rename, Duplicate, Download, Delete, Replace, Clear, Import, Export. Not "OK", "Yes", "Submit".
- Units: a space between number and unit (`12 px`, `300 dpi`), `%` without a space, `×` for sizes (`6 × 9 in`).
- No exclamation marks, no emoji, no first person in the UI.
- Accessible names (`aria-label`) say the same words as the visible label; icon-only controls use the command name.

## 15. Where the code does not follow this yet (measured on 1.11.0)

Counts are occurrences of a declared value in `src/shell.html` and `src/modules/`.

| Area | Standard | Today |
|---|---|---|
| Font sizes | 3 (11, 12.5, 14) | 11 (11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 18, 20, 28). 11px ×58, 11.5px ×26, 12px ×27, 12.5px ×24 |
| Font weights | 400, 500, 600 | also 300, 700, and `inherit` |
| Radii | 4, 8, 12, 50% (three, plus a circle) | 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 20 plus tracks (1, 2, 3). 5px ×20, 7px ×19, 9px ×13, 10px ×7 |
| Control heights | 22, 26, 30, 32, 40 | 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 44, 46, 54. 28px ×13, 24px ×8, 34px ×4 |
| Same-size controls with different radii | one radius per size | 30px tall controls use 6, 7, 8 and 15 |
| Gaps | 2, 4, 6, 8, 12, 16 | also 1, 3, 5, 7, 9, 10, 14. 9px ×8, 5px ×8 |
| Group labels | one style | duplicated as `.wxh` (workspaces), `.xrh` (export recipes), `h3` uppercase, with different paddings |
| Shapes library | the model (section 12) | Complete: nested tree, many open, select mode, drag to folder, hidden sets. Home is called "My imports" and an old "Drawn by Claude" folder shows only for old projects (do not copy it) |
| Saved trays (colours) | the tree | One level of folders only; you drill in and use a Back button; its own rows (`.stf`), search and rename; no nesting, no select mode, no Move to…, no drag; Wada sets sit in three fixed folders instead of being sets in the list |
| Saved stamps | the tree | No folders |
| Textures | the tree | No library yet (imports are planned) |
| Colourways | the tree for saved colourways | Only this project's colourways exist (flat cards); no saved colourways library |
| Templates, workspaces, export recipes | the tree | Flat list under two headings ("Starting points", "Yours"), three separate heading classes, no folders, no select mode |
| Folder "…" button | always visible (rule 5) | Shapes library shows it only on hover, on the active row or on focus (`.lmo`); right-click is the other way in. Fix in the standardisation release |
| Deleting | items two-tap in place; folders by the inline form | Folder delete is a form; item delete is two-tap; trays and templates use their own confirm styles |
| Heading styles | 3 | panel title (Fraunces 14/500), group title (Fraunces 14/500), `h3` 12px/600 with a border, `h3` uppercase 11px, dialog `h2` 14/600 |
| Fonts | 1 (Hanken Grotesk) | Fraunces (serif) in the wordmark, splash, panel and group titles and the print proof sheet; 67 KB of font file |
| Icon stroke | one weight per size | five widths (1.7, 2.1, 2.25, 2.4, 2.6) assigned per control class |
| Motion | 120 ms and 200 ms | .1, .12, .13, .15, .16, .2, .25, .28 s |
| Layers | bands in section 6 | 30 distinct values, from 2 to 99999 (`.tdl` 9999, a one-off 99999) |
| Literal colours in chrome | none | `#fff` ×69, `#000` ×33, plus one-off `#e33`, `#215`, `#176` |
| Swatch edge | one value | `rgba(0,0,0,.18)` ×8 and `rgba(0,0,0,.2)` ×4 |
| Disabled opacity | .4 | .4 and .5 (`.hr.fut`) |
| Tokens | `--r-*`, `--fs-*`, `--h-*`, `--sp-*`, `--t-*`, `--z-*` | None of these exist yet; only colour, shadow and `--tl` do |

## 16. Closing the gap

**Done in 1.12.0** (appearance only, no behaviour): tokens in `:root`; font sizes, radii, spacing, durations and the group label moved onto the scales; Fraunces removed (titles, wordmark, splash and the print proof sheet are sans-serif); `.wxh` and `.xrh` merged into `.glb`; one title style; segmented buttons fixed at `--h-sm` (26); `npm run check:style` fails on a font size, radius or serif font outside the scales.

**Exemptions the checker allows:** brand text 15 and 20px; "+" glyphs 18 and 28px; tracks of 1–3px.

**Still to do, each its own release:**
1. **Extract the folder tree** from `06-motif-library-folders.js` and `21-motif-library-ui.js` into one shared component. A library supplies only: its items, its built-in sets, its Home name ("Yours"), how an item is drawn (tile, card or row), what "Export" writes, and the key it saves under. Then move each library onto it: saved trays first, then stamps, templates, workspaces and recipes; textures and saved colourways are born on it. Rename the shapes home folder "My imports" to "Yours", and make the folder "…" button always visible.
2. Icon stroke weights to the set in section 8.
3. Remove the `#fff` and `#000` literals from chrome (section 3).
4. Extend `check:style` to heights, z-index bands and literal colours once those are clean.

Side effects of 1.12.0: controls moved by one or two pixels (for example the type-dock bar is 32 high, so the stage is about 2px smaller at 1440×900). Pixel goldens that changed for this reason were listed in the release report.

## 17. New UI checklist

- [ ] Uses tokens for colour, size, radius, spacing, motion and layer; no new numbers.
- [ ] Reuses a component from section 9; anything chosen from a saved collection is a library on the shared folder tree (section 12), not a new list.
- [ ] Looks right in light and dark.
- [ ] Heights in a row match; radii follow section 5.
- [ ] Headings are one of the three levels.
- [ ] Hover, focus-visible, selected, disabled and error states exist; nothing depends on hover.
- [ ] No explanatory text, no tooltips, no `alert`/`confirm`/`prompt`; destructive actions use two-tap.
- [ ] Every action is a registry command; icon-only controls have `aria-label`.
- [ ] Works docked, tabbed and floating, at narrow width, and on touch (pointer events).
- [ ] Wording follows section 14 (British, sentence case, standard words).
- [ ] Respects reduced motion; no animation of layout properties over the artwork.
- [ ] Does not change artwork rendering or export.
- [ ] Tests pass; screenshot changes are explained, not regenerated to go green.
- [ ] This guide updated if a new reusable pattern was added.

## 18. Source-of-truth map

| Concern | Source |
|---|---|
| Tokens, global type, focus, controls, motion | `src/shell.html` |
| Docking, panel groups, workspaces | `src/modules/34-desktop-shell.js`, `src/modules/42-workspaces.js` |
| Menus and commands | `src/modules/37-command-list.js`, `src/modules/40-command-search.js` |
| Colour tray, picker, wells | `src/modules/50-tray-core.js`, `51-colour-picker.js`, `52-tray-ui.js` |
| Library folder tree (the model) | `06-motif-library-folders.js` (data, paths, sets), `21-motif-library-ui.js` (rows, menu, form, select mode) |
| Other libraries (to move onto the tree) | `27-stamp-library.js`, `52-tray-ui.js` (saved trays), `53-colourways.js`, `42-workspaces.js`, `43-export-recipes.js`, `54-templates.js` |
| Engineering constraints | `CLAUDE.md` |
| UI audit and screenshots | `docs/ux-review.md`, `docs/ux-review/` |
