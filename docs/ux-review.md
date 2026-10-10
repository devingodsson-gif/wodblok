# WODBLOK 1.0: UX review

**Reviewed:** tag `v1.0.0`, commit `617a33d0b03a3ed3235f09b880372c745899357b` ("Release 1.0.0"), app version **1.0.0** (badge "v1.0").
Note: `main` on GitHub is still at v104 (`7b924df`). 1.0.0 exists only on branch `claude/wodblok-9lo9c7` and its tag, and has not been merged into `main` (see Questions).

**How:** I built the web app (`npm run build:web`), served `dist/web/` on localhost, and drove it with Playwright on Chromium 141 (headless, 1440×900 unless stated). I walked each task as a first-time user. Screenshots are in [`docs/ux-review/`](ux-review/) and named in the tables.
Window sizes tested: 1920×1080, 1440×900, 1440×600, 1366×768, 1280×720, 1280×640, 1024×700 and 820×700. Both themes were tested, as was a Mac user agent.

**What I could not test (plainly):**
- **WebKit/Safari.** No WebKit browser is installed here, and I was told not to run `playwright install`. Every finding below is Chromium only.
- **The native Save and Open dialogs (Chrome's file pickers).** Headless Chromium can't show them. I tested the Safari/Firefox path instead (download, then the file picker) by hiding those APIs.
- **The installed app.** Not tested: opening a `.wodblok` by double-click, offline use, or the update dot.
- **Real touch, a real Mac, a GPU, or a screen reader.** All timings come from a 4-core Xeon with software rendering, so they will be slower than a Mac. Treat them as relative, not absolute.
- **Copy SVG.** The clipboard is blocked in headless mode. I saw no confirmation message, but I can't say what a real browser does.
- **"Draw with Claude".** It needs the claude.ai runtime.
- **Lightly covered:** the Text, Free place, Art, Crop and Frame layout modes. I opened them but did not complete a real task in each.

---

## 1. Summary: the five things that most hurt a first-time user

1. **The first screen gives nothing to do and no visible way in.** WODBLOK opens on a plain yellow page. There is a stamp, and it is already repeated in a checkerboard, but it is a paper-coloured block printed on paper of the same colour, so nothing shows. There are 16 unlabelled icons on the left (names appear only on hover) and no visible first action. The quickest route to a finished pattern is Randomize (one click gives a full piece; [10](ux-review/10-randomize-result.png)), but it is the 10th icon down. The other route, putting a motif on a stamp, needs three steps you have to guess: Stamp editor → Motifs → click a motif, then click the block. ([01](ux-review/01-launch-blank.png), [03](ux-review/03-arrangement-invisible-stamp.png), [04](ux-review/04-stamp-editor-empty.png))
2. **Making a second stamp is broken or hidden.** The **New stamp (+)** button under the stamp tray does nothing: it throws `isDef is not defined`, and v100 has the same bug. **Duplicate** works, but the copy doesn't print anywhere until you find it under Arrangement → "Stamps in the pattern" and tick it. The only hint is a status-bar line. So "add another stamp to my pattern" dead-ends twice. ([29](ux-review/29-new-stamp-does-nothing.png))
3. **Saving doesn't mean what people expect, and that risks losing work.**
   - **Save** keeps the project in browser storage only.
   - **Download project file** is the real file. In Chrome it is a Save dialog; in Safari and Firefox it is a download that still leaves the "unsaved" dot on.
   - The tab title never shows the project name or whether it's saved.
   - A blank, untouched document shows the orange "Not saved yet" dot from the first second.
   
   A newcomer will press Save, believe they have a file, and lose it if the browser clears site data (Safari does that after 7 days). ([20](ux-review/20-file-menu.png), [23](ux-review/23-projects-empty.png))
4. **Going back to a result you liked is guesswork.** Every Randomize roll shows in History as "Several changes" with the time "now", and there are no thumbnails. Before/After compares against **Start** (the blank page), not your previous roll. The History panel's own Compare button only appears on hover. So "roll, roll, roll, go back to the second one" means clicking rows blind. ([11](ux-review/11-history-several-changes.png), [12](ux-review/12-before-exit-pill-clipped.png))
5. **Tools move and change names, so you can't learn the layout.**
   - The rail is a different set in Pattern and Stamp editor. Shared tools jump slots: Randomize is 10th in one mode and 12th in the other.
   - Two pairs of icons are near twins: Canvas and Pattern grid both look like grids, and Arrangement and Presets are both four squares.
   - The rail name and the panel tab name differ: Pattern grid → "Grid", Color grading → "Grade", Pattern preview → "Preview".
   - Spelling switches between "Colors" and "colour" inside one panel.
   ([02](ux-review/02-rail-hover-label.png), [43](ux-review/43-colors-panel-spelling.png), [48](ux-review/48-grade-panel.png), [50](ux-review/50-pattern-grid-panel.png))

**What is good, and should be protected:**
- **Randomize** produces a complete, attractive piece in one click. It holds the old picture until the new one is ready, with a progress bar.
- **The motif and import flows** are solid once found. The flow from motif to stamp to pattern ([07](ux-review/07-first-pattern.png)) works. The Import artwork dialog (original beside the traced result, plain sliders, "2 shapes, 447 points, 9 KB") is the clearest screen in the app ([31](ux-review/31-import-artwork.png)).
- **History** behaves like Photoshop's: jumping to a row keeps the redo steps. Undo brings back the project after New project and a deleted stamp (both tested); Clear canvas promises the same.
- **Crash recovery works.** After a simulated crash, the relaunch offered "Restore unsaved work", and the restore was exact ([24](ux-review/24-recovery-offer.png)).
- **A damaged file** gives a plain sentence: "That file looks damaged: it could not be unpacked." ([27](ux-review/27-damaged-file-message.png))
- **Old v18 files open.**
- **The radial grade mask** has real on-canvas handles, as in Lightroom ([18](ux-review/18-grade-radial-mask.png)).
- **Variations** is immediately understandable ([33](ux-review/33-variations.png)).
- **Command search** (Ctrl/Cmd+K) finds things by plain words.
- **The layout copes with small windows.** The rail squeezes its buttons instead of clipping them ([40](ux-review/40-short-1440x600.png)), and below 860 px it switches cleanly to a top rail with a bottom panel ([39](ux-review/39-narrow-820.png)).
- **Light and dark themes** are both clean ([38](ux-review/38-light-1366x768.png)).
- **No console errors** in any flow except the New stamp one.

---

## 2. Findings, ranked by severity

Effort: S = under a day, M = a few days, L = a week or more.
"Speed" is the risk to speed or to existing behaviour. Every fix that changes behaviour will also change some snapshots (CLAUDE.md: ask first).

### 2a. Blocks a task

| # | Area | What happens | Screenshot | Why it matters | Recommended fix | Effort | Speed / behaviour risk |
|---|---|---|---|---|---|---|---|
| B1 | Stamps | **New stamp (+)** in the stamp tray throws `ReferenceError: isDef is not defined` (module 13, line 99). No stamp is added. In Pattern view it still switches to the Stamp editor, so it looks as though something happened. The same call is in `legacy/wodblok-v100.html`, so this predates the repo. | [29](ux-review/29-new-stamp-does-nothing.png) | You cannot start a second stamp from scratch. The only workaround is Duplicate, then clearing the copy. | Define what `is:` should hold for a new stamp (it looks like the stamp-texture default) or drop the field. Add a test that clicks `#addT` and expects the stamp count to go up and no page error. | S | None for speed. One new snapshot. |
| B2 | Stamps / layers | A duplicated stamp (and a new one, once B1 is fixed) **does not print** until you tick it in Arrangement → "Stamps in the pattern". The only hint is a status-bar sentence. | [03](ux-review/03-arrangement-invisible-stamp.png) | People make a stamp and never see it in the pattern. In Figma, Procreate and Photoshop, a new object appears where you are working. | Add the new or duplicated stamp to the selected layer automatically. The helper `addSt()` already exists next to the click handler. Undo removes it. | S | Changes existing behaviour (snapshot). No speed cost. |
| B3 | File > New project | With unsaved changes, the first click changes the menu item's text to "Click again to discard changes", **but the menu has already closed**, so nothing visible happens. The second click works. | [28](ux-review/28-new-project-first-click-nothing.png) | It looks broken. People try again later, or give up. | Drop the two-click confirm. Undo already restores the old project (I tested it). Make the status line read "Started a new project. Ctrl+Z brings back the last one", as Clear canvas already does. If a guard is wanted, keep the menu open on the first click. | S | Behaviour change (snapshot). None for speed. |
| B4 | First run | Launch shows a blank page: the paper-coloured block prints on same-coloured paper in a checkerboard nobody can see. No action is visible on the canvas or in the top bar, and the rail labels are hover-only. | [01](ux-review/01-launch-blank.png), [03](ux-review/03-arrangement-invisible-stamp.png) | This is the main reason a newcomer can't "make a finished pattern without help". | Within your rules (no panels open, no explanatory text):<br>(a) Put **Randomize** in the top bar next to Undo as a labelled button (the stylesheet still has a top-bar `.rnd` button style).<br>(b) Make the empty stamp in the tray show a "+" motif slot. Clicking it opens Stamp editor + Motifs.<br>(c) Optionally, give the empty stamp a faint dashed outline in the Pattern view so the checkerboard is visible.<br>All are on-canvas or chrome cues, not panel text. | S–M | None for speed. Launch golden screenshots change (ask). |

### 2b. Confuses

| # | Area | What happens | Screenshot | Why it matters | Recommended fix | Effort | Speed / behaviour risk |
|---|---|---|---|---|---|---|---|
| C1 | Saving | Four ways to keep work, with overlapping names:<br>• **Save**: browser storage, shown in Projects.<br>• **Save a copy**: browser storage.<br>• **Download project file**: a file. Chrome shows a Save dialog; Safari and Firefox download it, and the unsaved dot stays on.<br>• **Export everything**: the library.<br>The tab title is always "Wodblok v1.0". A blank document shows "Not saved yet" from launch. | [20](ux-review/20-file-menu.png), [23](ux-review/23-projects-empty.png) | People think Save made a file. Browser storage can be evicted (Safari's 7-day rule), and the plan itself says "files are the truth". | Make **Save** write the file on Chrome and Edge (the handle logic already exists) and keep a browser copy. On Safari, call it what it is ("Download"). Rename the menu items:<br>• "Save to this browser" → only under Projects.<br>• "Download project file…" → "Save as file…".<br>Put the project name and a "•" in the tab title. Show no unsaved dot until the first change. | M | Touches the platform seam (60–90% risk tier in CLAUDE.md). No drawing cost. |
| C2 | History / Randomize | Every roll is "Several changes" at "now". There are no thumbnails, and the count reads "1 steps". The Compare button, rename and delete on each row are **hover-only**. | [11](ux-review/11-history-several-changes.png) | This is the "go back to the one I liked" task, and right now it is blind clicking. | Label rolls "Randomize 1, 2, 3…", and others by what changed ("Colours", "Grade: Exposure"). Add a small thumbnail to each roll row and to snapshots. Keep the row buttons visible on the current row, so nothing is hover-only. | M | **Speed:** a thumbnail per roll costs a render. Take it from the picture Randomize has already finished (hold layer), or render it lazily when History is open, never during a drag. |
| C3 | Before / After | "Before" compares with **Start** (the blank page), not the previous state. In Before mode the "Exit compare" pill is pushed under the right-hand panel and clipped. The Before button shows no pressed state, though Split does. There are three separate compare tools: Before/Split, History A/B, and Grade "Hold to compare". | [12](ux-review/12-before-exit-pill-clipped.png), [13](ux-review/13-split-view.png) | After a roll or an edit, people expect Before to mean "before my last change" (Lightroom `\`). Comparing with a blank page says nothing. | Default A to "the step before this one" and keep the History A/B pickers for anything else. Keep the pill inside the stage area. Give Before the same pressed style as Split. Fold "Hold to compare" into Before. | S–M | Compare rendering is unchanged. A behaviour change (snapshot). |
| C4 | Rail | 16 icon-only buttons in Pattern view and 15 in the Stamp editor, with only 6 in common. Shared ones change position between modes. Lookalike pairs: Canvas ⌗ vs Pattern grid #; Arrangement ⊞ vs Presets ⊞+; Export recipes uses a download arrow that reads as "Export". Rail names don't match tab names. | [02](ux-review/02-rail-hover-label.png), [04](ux-review/04-stamp-editor-empty.png) | You can't build muscle memory, and nothing can be found without hovering. Hover does not exist on touch later. | Give shared tools (Colors, Stamp library, Grade, Textures, Randomize, History, Workspaces, Presets) **fixed slots at the same height in both modes**, and put mode-only tools in a separated group below. Make the icons for Canvas, Pattern grid and Presets distinct. The Canvas panel itself is good: shape tiles with names, ratio, size ([46](ux-review/46-canvas-panel.png), [15](ux-review/15-canvas-arch.png)). Use one name per tool everywhere (rail, tab, command search). See Q4 on short labels. | S–M | None. |
| C5 | Opening a file / shape change | "Opened … and added it to your projects" appears **before** the pattern is drawn. For several seconds the canvas shows only the paper texture, with no busy sign. Once, the second open in a session still showed only texture after 4 s. Once, after changing the canvas shape to Arch, the stamps disappeared until the next edit; a second attempt did not reproduce it. | [25](ux-review/25-open-file-not-drawn-yet.png) vs [26](ux-review/26-open-file-drawn.png), [16](ux-review/16-shape-change-stamps-missing-once.png) | It looks like the file opened empty, which is alarming. | Show Randomize's existing progress bar (`.fzbar`) while stamp prints are still being built after open and after shape changes. Send the "Opened" message only when drawing settles. Log the Arch case in known-issues as "seen once". | S | Bar only. No drawing cost. |
| C6 | Export | The top-bar Export menu offers PNG at a fixed "3× size", SVG, and Copy SVG: no JPG and no size. A separate **Export recipes** tool on the rail has PNG, JPG and SVG with a pixel size, saved recipes, and Print proof. A PNG export took 7.1 s here, with a "Making the PNG…" message. | [21](ux-review/21-export-menu.png), [22](ux-review/22-export-recipes.png) | There are two places to export, and the obvious one is the weaker. People look for size and JPG under Export. | Make **Export** open a small sheet: format, long side, then **Export**, with the recipes listed below it and Print proof at the bottom. The rail item can go, or become "Export recipes" only. | M | None. |
| C7 | Motifs on a stamp | Motifs follow a "loaded brush" model: click a motif, click the block (as many times as you like), then Esc or right-click to stop. The hint for this is hidden (`#lhint` is `display:none`). Dragging from the library onto the block is the convention in Figma, Procreate and Canva. A selected motif gets a **red** dashed circle (red reads as error or delete), not a box with handles. Size, rotation and jitter live on two slider rows under the canvas, and the row of 7 icon buttons there has no visible names. | [05](ux-review/05-motif-picked-up.png), [06](ux-review/06-motif-selected-toolbar.png) | It works once found, but first attempts try dragging, and the red circle looks like a warning. | Keep click-to-stamp, and **also** support drag-and-drop from the library. Draw the selection in the accent colour with corner handles (scale) and a rotate handle on canvas. | M | **Speed:** handles must move only the selected motif's transform (as dragging already does; perf-baseline step 3). |
| C8 | Randomize defaults | Rolls turn on nearly everything (frame, grade, grade masks, canvas texture, print effects, lettering), but Layout is off. Results are busy, and the documents are heavy:<br>• Plain piece (stamps + colours): stamp-size drag median 74 ms, grade drag 50 ms.<br>• Default roll: median 413 ms and 173 ms, with spikes to 1.8 s and 1.0 s (software rendering).<br>• Roll time 2.7–6.5 s.<br>While a roll is held, the **stamp tray already shows the new stamps** over the old picture. | [08](ux-review/08-randomize-panel.png), [09](ux-review/09-randomize-hold-tray-mismatch.png), [51](ux-review/51-heavy-random-piece.png) | The first piece most people get is also the slowest to edit, so the app feels laggy exactly when they start touching sliders. | Offer a lighter default set: stamps, layout, colours, frame. Make effects (grade masks, textures, print effects) opt-in, or a second "Finish" roll. Hold the tray with the picture. Measure on the Mac before deciding. | S | **Speed:** improves it. A behaviour change in what rolls contain (snapshots). |
| C9 | Colours | Colours are chosen by name from long lists of Wada colours, or from a 159-swatch grid whose "Clicking a color sets: [1st colour]" picker is an indirect mode switch. A free colour (hex) **exists** (an add tile, `#addC`), but the code places it after all 159 swatches. The roles are "1st/2nd/3rd/4th colour", though the 1st is always the paper. | [14](ux-review/14-colour-dropdown.png), [43](ux-review/43-colors-panel-spelling.png) | "Change the paper colour" is the most common colour task, and the panel doesn't say which slot that is. Typing a brand hex is hard to find. | Name the slots **Paper / Ink / Accent / Accent 2**. The Stamp panel's "Ink: Project default" ([52](ux-review/52-stamp-panel.png)) would then read naturally. Put a hex field and an eyedropper inside each slot's dropdown. Move the add tile to the top of the library. | S | None. |
| C10 | Panel text vs your rule | Several panels contain explanatory sentences, which contradicts "no explanatory text in panels":<br>• Randomize: "Rolls a whole new piece. Ctrl+Z…"<br>• Stamp library: "Your library is saved in this browser only…"<br>• Layers: "Top of the list prints last. Drag to reorder, double-click to rename."<br>• Grade mask: "Drag the centre to move it…"<br>• Pattern grid: "8 columns × 12 rows. Each cell is 13%…"<br>• Projects footer; Import artwork "1. Subject for the prompt…"; the mask menu's sub-lines ([19](ux-review/19-grade-add-mask-menu.png)). | [08](ux-review/08-randomize-panel.png), [44](ux-review/44-stamp-library-panel-text.png), [03](ux-review/03-arrangement-invisible-stamp.png), [18](ux-review/18-grade-radial-mask.png) | Inconsistent with the rule. Some of it (the storage warnings) is also the only place an important fact is stated. | Your decision (Q2). If the rule stands: move the storage facts into the Save/Projects flow (C1) and drop the rest. If they stay, keep them as the one allowed form and style them the same way. | S | None. |
| C11 | Built-in motifs / AI | The Motifs panel ships a "Plants (12)" library, an **Import artwork** flow that writes "Copy prompt for ChatGPT", and a **Draw with Claude** section. | [30](ux-review/30-motifs-draw-with-claude.png) | This conflicts with "no Claude-generated motifs". Plan 7b.2 says the built-in sets are Claude-drawn. On the web app, Draw with Claude also depends on the claude.ai runtime (untested here). | Your decision (Q3). For the commercial web build, the likely answer is: hide Draw with Claude, and ship either no built-in set or your own. | S | None. |
| C12 | Keyboard | `+` `-` `0` `1` zoom the canvas, but **Ctrl/Cmd+= / − / 0 do not**: they zoom the whole browser page, the Photoshop/Figma habit. Randomize, Export, Open, New and Before (other than `\`) have no shortcut. On a Mac, command search shows "Cmd+…", but button titles and panel text still say "Ctrl+Z" and "Ctrl+S". | [42](ux-review/42-mac-command-search.png) | Designers zoom with Cmd+= without thinking. "Ctrl" on a Mac reads as a port that was never finished. | Catch Mod+=, Mod+−, Mod+0 and Mod+1 on the stage (preventDefault). Add R = Randomize, Mod+E = Export, Mod+O = Open. Build every shortcut string with `cmdFormatShortcut`. | S | None. |
| C13 | Accessibility | **No focus ring** on sliders or their number boxes (`outline: none`, even when `:focus-visible`). The faint text colour is **2.9:1** on dark and **2.3:1** on light, below WCAG AA's 4.5:1; it is used for times, sub-labels and section headings. A lot of text is 9.5–11 px. Slider tracks are 18 px tall. Good: every slider and icon button has an accessible name, and reduced motion is honoured. | [41](ux-review/41-slider-no-focus-ring.png) | Keyboard users lose their place in the long Grade and Arrangement panels. Small faint text is hard on laptops. | Accent ring on sliders and number fields. Raise `--faint` to about 4.5:1 (for example `#8f877b` on dark, `#857c6c` on light). A 11 px minimum for labels. Make the slider hit area at least 24 px. | S | None. |
| C14 | Hover-only controls | These appear only on hover:<br>• rail names<br>• History row buttons (Compare, rename, delete)<br>• Motif list row buttons<br>• delete on a library motif (`.dx`)<br>• texture list buttons<br>Layer row buttons sit at 55% opacity. | [11](ux-review/11-history-several-changes.png) | They are invisible to new users and impossible on touch later (the plan already flags this). | Show them on the selected row. Use a "⋯" menu per row otherwise. | S–M | None. |
| C15 | Stamp editor view | The zoom controls disappear. A dead 80 px band sits between the block and the tray. Before, Split and Display stay visible, though Before and Split do little here. | [04](ux-review/04-stamp-editor-empty.png) | Small, but it makes the editor feel unfinished, and you can't zoom in to place small motifs precisely. | Keep zoom in both views. Give the band to the motif toolbar (it appears there only when a motif is selected) or remove it. Hide Before and Split here. | S | None. |
| C16 | Presets | Built-in **Looks** show empty dark squares where a preview should be, so you can't tell Soft cotton from Worn block without applying them. | [32](ux-review/32-presets-blank-look-thumbs.png) | Presets are meant to be fast picks. Unlabelled grey squares make you try each one. | Ship a fixed small preview per built-in look (a static image made once), or render the current piece with that look when the panel opens, as Variations does. | S–M | **Speed:** live previews cost renders. Use static images or render lazily. |
| C17 | Command search | It opens with Duplicate motif, Delete motif, Split motif and Knock out at the top, even in the Pattern view where they don't apply. There are no recent commands. | [34](ux-review/34-command-search-default.png) | The empty state is the first thing people see. Irrelevant top items make the list look random. | Order the empty list by: recent, then things you can do now in this view. Hide disabled commands or grey them out. | S | None. |
| C18 | Layers vs Arrangement | One layer is split across two rail tools: **Layers** (blend, opacity, ink, texture, order) and **Arrangement** (which stamps, layout type, grid, size, pressure, randomness). There are also three grids: Pattern grid (a snap guide), the layer "Grid: Its own grid", and the Stamp editor Grid. | [03](ux-review/03-arrangement-invisible-stamp.png), [50](ux-review/50-pattern-grid-panel.png) | "Where do I change this layer?" has two answers. "Grid" means three different things. | Rename to **Layers** and **Layout**, and show the selected layer's name in both headers. Rename Pattern grid to **Guides**, since it's a snap guide. | S | None. |
| C19 | Status bar as the only feedback | Most confirmations (Saved, Duplicated, Cleared, Opened) appear only as text at the bottom left. That text goes stale ("Closed all panels. Open any tool from the bar on the left." stays up long after). The crash-recovery offer is a small pair of buttons at the bottom right. | [24](ux-review/24-recovery-offer.png) | People look where they clicked. A stale message is mistaken for the result of the last action. | Clear messages after a few seconds. On launch with recovered work, also show Restore and Dismiss in the empty canvas area: it's an action, not an explanation. | S | None. |
| C20 | Display menu | Four toggles (stamp texture, canvas texture, grading masks, stage dots) are all on and drawn alike, so the "off" look isn't shown until you click. The button's title says "(view only)". | [35](ux-review/35-display-menu.png) | It's unclear whether these change the export (they don't). | Use check marks rather than outlined pills. Put the menu title "Show while editing" as a heading inside the menu, not in hover text. | S | None. |

### 2c. Polish

| # | Area | What happens | Screenshot | Why it matters | Recommended fix | Effort | Speed / behaviour risk |
|---|---|---|---|---|---|---|---|
| P1 | Naming | US and UK spellings are mixed: Colors / Colour grade / Color grading / Color library / "1st colour" / Centre. Also "1 steps". | [43](ux-review/43-colors-panel-spelling.png) | It reads unfinished. | Pick one spelling (Q7). Pluralise properly. | S | None (labels only; text snapshots may change). |
| P2 | Panels | Opening a second tool adds it as a **tab** in the same dock group, hiding the first (Randomize + Grade). A floated panel lands over the canvas and the zoom controls. | [37](ux-review/37-laptop-1280x720.png), [36](ux-review/36-floating-panel.png) | Fine for experts, but surprising: Lightroom stacks panels and Photoshop opens them stacked in the dock. | Stack in the side dock by default. Tab only when the user drops onto a tab. Float at the right edge of the stage, not over the canvas centre. | S–M | None. |
| P3 | Book cover | The BACK / FRONT / SPINE / BARCODE guide labels are thin magenta text drawn over the pattern, and become hard to read on busy pieces. The cover set-up itself is clear: trim, pages, paper, then the spine is computed. | [17](ux-review/17-book-cover.png) | It's easy to place art over the barcode area by mistake. | Put the labels on a small solid chip, and keep them outside the bleed. | S | None. |
| P4 | Small windows | At 1280×720 with one panel open, the canvas is 306×459 px (57%). The stamp tray (80 px) and status bar (26 px) are always shown. | [37](ux-review/37-laptop-1280x720.png) | Laptops are the main browser target. | Allow the tray to collapse to a 32 px strip (as Lightroom's filmstrip does). | S | None. |
| P5 | Projects | The empty Projects dialog relies on its footer for the key fact ("saved in this browser only"). | [23](ux-review/23-projects-empty.png) | See C1. | Folds into C1. | — | — |
| P6 | Favicon | The browser asks for `/favicon.ico` and gets a 404. The app uses `icon-192.png`, so this is harmless. | — | It's console noise in hosting logs. | Add a `favicon.ico` to `dist/web`. | S | None. |

---

## 3. Uncommon structures (keep or change)

| Structure | How WODBLOK does it | Common practice | Verdict |
|---|---|---|---|
| Two views: Pattern and Stamp editor | The whole UI switches with a segmented control | Figma's "edit component", Procreate's canvas vs brush studio | **Keep.** It fits the craft (carve a block, then print it). Make the shared tools stay put (C4). |
| Paper = 1st palette colour; the block takes the paper colour; motifs print in ink | Implicit | Explicit "Background / Foreground" slots | **Keep the model, name it** (C9): Paper / Ink / Accents. |
| Click-to-stamp motif placement ("loaded brush") | Click a motif, click the block repeatedly, Esc to stop | Drag and drop | **Keep, and add drag** (C7). Click-to-stamp suits repeated placement well. |
| Randomize holds the old picture until the new one is ready | Overlay with a progress bar | Usually a spinner | **Keep.** It's good. Hold the tray too (C8). |
| A/B compare inside History, plus Before/Split, plus Grade hold-to-compare | Three systems | Lightroom: one Before/After (`\`, Y) | **Change**: one compare, with A defaulting to the previous step (C3). |
| Confirm by "click again" on the same item | Used on File > New project | A dialog, or no confirm plus Undo | **Change**: rely on Undo (B3). It already works. |
| Save = browser storage; the file is a separate "Download" | Two concepts | Save = file (Photoshop, Figma desktop); autosave to the cloud (Figma web) | **Change** (C1). The plan already says files are the truth. |
| Panels dock to four edges, float, tab, workspaces | Pro-grade window manager | Photoshop | **Keep.** Nothing opens at launch, so newcomers don't pay for it. Change only the default open behaviour (P2). |
| Stamp tray (filmstrip) along the bottom | Always visible | Lightroom filmstrip | **Keep.** Make it collapsible (P4). |
| Status bar as the main feedback channel | Bottom-left text | A toast near the action, or inline state | **Change slightly** (C19): clear stale messages; put actions such as Restore near the canvas. |
| Command search with pinnable task bar | Ctrl/Cmd+K | Figma, VS Code | **Keep.** Fix the empty-state order (C17). |
| Rail-only tool access, no top menus for tools | Icons on the left | Lightroom modules, Figma panels | **Keep**, with stable slots and distinct icons (C4). |
| One layer edited in two tools (Layers + Arrangement) | Split by kind of setting | One layer inspector | **Change the names** (C18). Merging can wait. |
| Repeat tile as a canvas format, not an export | Canvas > Format | Usually an export option | **Keep.** Seeing the seams while working is better. |
| Grade "Hold to compare" (press and hold) | Hold the button | A toggle key | **Change**: merge into Before (C3). Press-and-hold won't map well to touch either. |

---

## 4. Suggested order of work (small releases)

Each item is listed with its finding number. Every release needs the perf check before commit where marked ⚡.

**1.1 Unblock (all small, no design decisions needed)**
- B1: New stamp works.
- B2: New and duplicated stamps print on the current layer.
- B3: New project without the dead click.
- C3 part: keep the Exit compare pill inside the stage; give Before a pressed state.
- C13: focus rings and faint-text contrast.
- C12: Mod+= / − / 0 zoom the canvas; Mac shortcut labels everywhere.
- P6: favicon.

**1.2 The first minute**
- B4: Randomize in the top bar; a "+" motif slot on the empty stamp.
- C4: fixed rail slots, distinct icons, one name per tool.
- C2: Randomize rows labelled "Randomize N".
- C17: command search empty-state order.
- P1: one spelling.

**1.3 Saving you can trust ⚡ (platform code: highest test risk)**
- C1: Save writes the file where possible; title shows the name and saved state; no dirty dot on a pristine document.
- C5: drawing progress after open and after shape changes.
- C19: recovery offer near the canvas.

**1.4 Compare and history**
- C3: one compare, A = previous step.
- C2: thumbnails ⚡.
- C14: no hover-only row buttons.

**1.5 Export and colour**
- C6: one export sheet.
- C9: named colour roles, hex field, add tile first.
- C16: look previews ⚡.

**1.6 Feel ⚡**
- C8: lighter Randomize defaults, measured on the Mac.
- C7: drag-and-drop motifs and on-canvas handles.
- P2, P4, C15, C18, C20, P3.

---

## 5. Questions for you

1. **Which build is 1.0?** I reviewed tag `v1.0.0` (617a33d) on `claude/wodblok-9lo9c7`, because `main` is still at v104. Should that branch be merged into `main`? Until it is, anyone who pulls `main` gets v104.
2. **Explanatory text already in panels** (C10): remove it to match the rule, or allow a few one-line facts, such as "saved in this browser only"?
3. **Built-in "Plants" motifs, "Draw with Claude", and "Copy prompt for ChatGPT"** (C11): these conflict with "no Claude-generated motifs". Hide them in the commercial build, replace them with your own set, or keep them?
4. **Rail names:** would a one-word label under each rail icon count as "explanatory text"? I treat it as naming, not explanation. It is the single biggest discoverability gain, and it works on touch. The cost is a wider rail (about 64 px instead of 52).
5. **Save model** (C1): should Save always write a real file where the browser allows it, with Projects becoming "recent files"? Or do you want browser-stored projects to stay the main idea?
6. **Randomize defaults** (C8): may the default roll be lighter (no grade masks, textures or print effects unless switched on)? It makes the first piece faster to edit. It changes what a roll produces.
7. **Spelling:** UK ("colour", "centre") or US ("color")? The UI currently has both.
8. **New stamps on the current layer automatically** (B2): OK to change this behaviour?
9. **On-canvas first-run cue** (B4b): is a "+" slot on the empty stamp acceptable under "launch fully cleared"? It adds no content and opens nothing.
10. **The native hover tooltips** (plan 7b.3) are still undecided. The rail's custom hover labels are the only way to learn the icons today, so this links to Q4.
