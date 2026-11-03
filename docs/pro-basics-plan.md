# Plan: pro basics and print output (Nov 3 2026)

Owner, Nov 3 2026, from docs/pro-gap-review-2.86.md: "so lets do- real units of measurement. rulers. alt-drag. update help, colour output and print files. for now make a simple, clean plan for this but im gonna give you some more features in a minute."

Status: **steps 1 to 3 live (2.87.3); steps 1 to 7 live (2.87.7); step 8 done (2.87.8, not live).** Order: by step number (owner, Nov 3 2026: "Do it in numerical order"). Steps 7 to 10 were added Nov 3 from the owner's second list, step 11 (undo and redo) on Nov 3 as well.
Numbering: each step is a patch release on the version that is live when work starts (after 2.87.0, if it is merged first: 2.87.1, 2.87.2 and so on). The minor version is raised once, when the plan is done.

## Step 1: real units of measurement
- One **Units** setting (Settings > General): px, in, **mm (the default)**, cm. It applies everywhere.
- The element panels show **X, Y, W, H** and Rotate in those units, in fields you can type into. They replace Position across, Position down, Size, Width and Height in %, which show the same values in real units now.
- A real size comes from the canvas's physical size and resolution (Canvas > Format, which already has inches, millimetres and DPI).
- Pattern pieces and spacing on the Canvas show real units where it makes sense: a piece's size, spacing and margins. A stamp's own shapes, in its tab, keep %.
- Typed values take units ("2in", "50mm") and simple arithmetic ("+10").
- Tests: a value typed in each unit lands at the right place; changing Units changes the display, not the document.
- **Done in 2.87.1:** the Units setting, and X, Y, W and H in the Element group (they replace Position across and down). W and H show for elements with a box (shapes, images, patterns, text). Typed values take px, in, mm, cm or ", sums with + - * / and brackets, and a leading + or - moves from the current value; bad input is marked and changes nothing; Esc puts the shown value back.
- **Not yet (later, with the owner's word):** Size and Rotate stay as sliders (Rotate is in degrees already); pattern pieces, spacing and margins on the Canvas still show %.

## Step 2: rulers and guides
- **Rulers** on the top and left of the **Canvas** tab, in the chosen units, measuring the canvas from its top-left corner and following zoom and pan. View > Rulers (Ctrl+R) turns them on and off.
- **No rulers in a stamp's tab** (owner, Nov 3: "lets maybe not measure the stamp size, remove it from the stamp tab"): the stamp is not measured, and its shapes keep their sizes in % as now.
- **Guides** are dragged out of a ruler, moved by dragging, and removed by dragging back onto the ruler. View > Guides shows or hides them (Ctrl+;), View > Lock guides locks them, View > Clear guides removes them.
- Elements **snap** to guides (with the smart guides, under the same switch; Alt skips snapping).
- **New guide…** places one at a typed position.
- Guides are saved with the project. They belong to the Canvas only, since a stamp's tab has no rulers.
- Tests: rulers follow zoom and pan; guides drag, snap, lock, save and reopen.
- **Done in 2.87.2:** all of the above. Guides are kept in the project as `proj.gd` (`{x, y}` in canvas units; optional, so the format stays 30) and every add, move, removal or clear is one History step. The Guides shortcut is **Mod+'** (Mod+; was already Smart guides). Shift while dragging a guide steps it to the ruler's small ticks. Rulers start off; Guides start shown.

## Step 3: Alt-drag to duplicate
- Holding Alt while dragging an element (or a selection, or a stamp's shape in its tab) leaves the original and drags a copy.
- One History step ("Duplicated").
- Shift still constrains to the axis, and the smart guides work as in a move.
- Tests: Alt-drag on the canvas and in a stamp's tab; Undo removes only the copy.
- **Done in 2.87.3:** the copy is made on the first move (an Alt-click alone changes nothing), goes just above its original and is selected; Esc during the drag takes it away. Alt held during the drag no longer skips snapping, since it is the duplicate key; Shift still turns the smart guides off (there is no axis lock on a move today, so none was added). In a stamp's tab, Alt on a letter of a text still picks and moves that one letter (1.40.0) instead of copying it.

## Step 4: Help
- **The Help menu:**
  - Getting started.
  - The manual: a short page per area (Elements, Stamps, Patterns, Effects, Colours, Randomize, Export and print).
  - Keyboard shortcuts.
  - What's new, filled from the releases.
  - Send feedback, for signed-in users, as now.
  - About.
- **Where it lives:** a **Help undocked panel**, with search, styled to the UI standard. It opens floating in the middle the first time, like Export, and can be docked. It is kept out of the tool panels so the no-tooltips rule stands.
- **Content:** plain writing kept in the repo and bundled into the app, so it works offline with no network.
- Tests: every menu item opens its page; search finds a topic; the page fits a phone.
- **Done in 2.87.4:** the Help panel (`help`, 46-help-pages.js for the writing, 47-help.js for the panel) and the Help menu: Getting started, Manual, Keyboard shortcuts, What's new, Search commands, Send feedback (signed in), About Wodblok. Home lists the pages; search matches every word typed and shows the line it is in; Keyboard shortcuts come from the command registry and About from the app's version, so neither goes stale. What's new is a short list kept in 46-help-pages.js: each release a user would notice adds a line at the top. Export and Help are the **undocked panels** (`WS_UNDOCK` in 34-desktop-shell.js). Settings keeps its own Shortcuts and About pages.

## Step 5: colour output
- **Ink separations.**
  - Each tray colour used in a design is one ink.
  - Export > Separations gives one greyscale file per ink (PNG or TIFF, at the chosen DPI), named after the ink, with registration marks.
  - This is for screen printing, block and relief printing, and riso.
- **Spot colours.** A tray colour can be marked as a spot ink (with a name), carried into the separations and into PDF output.
- **CMYK.** A CMYK export for print shops (TIFF and PDF), using a standard conversion, with a soft-proof view (View > Proof colours) that shows how the colours will print.
- **Colour profiles** (ICC: embedding and choosing one) are left for later unless the owner wants them now: proper profile conversion needs a library, which needs the owner's approval.
- Tests: one separation per ink with the right pixels; a spot ink keeps its name; a CMYK export opens with the right channel count.
- **Done in 2.87.5** (`42-colour-output.js`):
  - Export > Separations…: the inks used (ticked, with the count), PNG or TIFF (greyscale), 150 / 300 / 600 DPI, Tints Solid / Tones / Halftone (35 to 65 lines per inch at 22.5°), registration marks. Each plate is drawn by the app with that ink black and every other tray colour and the paper white (a colourway made for the moment), so overprint, knock-out, opacity and print effects come out right. One zip, plates named `NN-ink-name`.
  - Spot inks: the tray colour's … menu, Mark as spot ink (`proj.spot`, optional; format 30); the row says Spot; its plate is named `spot-…`.
  - Export CMYK TIFF and Export CMYK PDF at the canvas's print size (its DPI, else 300), a standard conversion with full black generation; View > Proof colours lays a picture of the canvas as process inks print it under the selection (not exported).
  - Help (Export and print, Colours, What's new) updated.
- **Not yet:** spot inks in a PDF (Separation colour spaces) and the textile layered TIFF with spot channels go with step 6's print PDF writer and layered TIFF; ICC profiles later (owner). Fixed colours and pictures are on no plate (a picture would need its own separation).

## Step 6: print files
- **Bleed and marks on any canvas:**
  - Canvas > Format gets Bleed (in the chosen units). Background and full-bleed elements extend into it.
  - Export adds Crop marks and Registration marks as options. This works for every canvas; only the book cover had bleed so far.
- **PDF for print shops:**
  - A print PDF with the trim and bleed boxes set, at the chosen DPI, in RGB or CMYK (step 5), with spot inks as separate plates where used.
  - It is written by WODBLOK's own PDF code (as the cover and proof PDFs are now), so no new library.
- **Layered export:**
  - A layered TIFF or PSD with one layer per element, so a print shop or Photoshop user can adjust it.
  - It is also written without a new library if that proves feasible; otherwise the owner is asked first.
- Tests: a PDF has its trim and bleed boxes and marks; a layered file opens with one layer per element.
- **Done in 2.87.6** (`36-print-files.js`):
  - Canvas > Canvas size > **Bleed**, typed in the units (`dim.bl` in inches, optional; format 30; hidden for the book cover, which has its own). The app draws only inside the canvas, so the bleed is made at export: a grid repeat tile carries on into it as it repeats, any other canvas is mirrored outwards at its edges (the background and anything at the edge run on without a seam). Say if the engine should draw the bleed for real instead; that is a larger rendering change.
  - **Export > Print file…** (one dialog): PDF, TIFF or PSD; RGB or CMYK (PDF and TIFF); 150 / 300 / 600 DPI; the bleed shown; Crop marks; Registration marks; Spot inks as plates (PDF, when the design has spot inks); Ink channels (PSD).
  - The PDF: MediaBox, BleedBox and TrimBox; the picture (Flate) over the bleed box; each spot ink a Separation image printed over it (overprint on); the marks as lines in the Registration colour (`/All`). Checked with qpdf and pdfinfo.
  - The TIFF: the sheet with bleed and marks, RGB or CMYK (the marks on every plate).
  - The PSD: one layer per visible element, bottom to top, each drawn alone without the canvas texture and cropped to what it covers, with its name (also in Unicode); the merged picture; with Ink channels, one spot channel per tray ink (textile and screen printing). Opened with Pillow: 7 layers for a 7-element design.
  - The marks and options were not added to the Export panel's own exports: step 9 rearranges that panel and can carry them.
- **Not yet:** a layered TIFF (the PSD covers layers and spot channels); a PSD at CMYK; the bleed drawn by the engine (see above).

## Step 7: panel layouts for the Canvas and a stamp's tab (owner, Nov 3)
- A stamp's tab opens with the Stamp panel on the left, the Elements list docked on the far right, and the Shape panel just to the left of the Elements list (the inner right column).
- **Two default layouts**, one for the Canvas and one for a stamp's tab. Each is saved and restored on its own.
- **In the top bar:**
  - One button opens a small **Layout** undocked panel (floating by default, dockable).
  - It holds **Save layout**, which keeps the panels as they are now as that mode's default, and **Reset layout**, which puts them back.
  - Both act on the mode you are in (the Canvas, or a stamp's tab).
- Each default is kept in the settings, not in the project. Switching between the Canvas and a stamp's tab shows each one's own layout.
- This is a default per mode, not named workspaces, which were removed in 2.9.0. Nothing else from workspaces comes back.
- Tests: a stamp's tab opens in that arrangement; a saved layout comes back after a reload and after Reset; the Canvas and a stamp's tab keep their own layouts.
- **Done in 2.87.7** (34-desktop-shell.js, `laySwitch`): each mode's layout as you left it; the stamp default Stamp `l`, Shape `ri`, Elements `r` (locked); Save layout and Reset layout in a small **Layout** undocked panel (top bar button `#layb`, also Window > Open Layout, Save layout, Reset layout); defaults in settings (`wb2877_lay_c`, `wb2877_lay_s`); the Canvas's saved default is what the app opens with (otherwise Elements alone, as before). Reset goes to the saved default, or the built-in one when none was saved. The Layout panel moves with you and is never saved in a layout. A stamp's layout does not change where Canvas panels open next, and in a stamp's tab the stamp is fitted to the stage between the columns (the Canvas's left-column compensation is not used there).
- Also fixed: the Proof colours group (2.87.5) was an empty `<g>` in every drawing, which moved the launch SVG summary; it is now made only while the proof is on.

## Step 8: the Pattern panel's sources (owner, Nov 3)
- The Add source button is hard to see; a first-time user would not find it.
- **A Sources group near the top** of the Pattern panel, right under the panel's own controls, so a new pattern's empty sources are the first thing seen.
- **Add source** becomes the standard Add button: full width at the top of the group, opening the usual Add menu. The menu lists the project's stamps, then its texts and patterns, then Shape from the library…, as the Add effect menu does.
- Tests: a new pattern shows Sources near the top with Add source; each menu entry adds that source.
- **Done in 2.87.8:** a **Sources** group (`#pesg`) first among the Pattern panel's groups, under the panel's own Add pattern and the Element group; **Add source** is the standard full-width Add button (`.row.fxar`, as Add effect) at its top, then the source rows. The menu was already in the asked order (stamps, texts, other patterns, Shape from the library…). The group shows only while a pattern is being edited.

## Step 9: the Export panel, rearranged (owner, Nov 3; done last, after steps 5 and 6)
- **Top: Quick export.** The format, size and Export now. One click for the common case.
- **Middle: Print and colour output.**
  - The new options from steps 5 and 6: separations, spot inks, CMYK, bleed, crop and registration marks, and the print PDF.
  - The print proof joins this section.
- **Bottom: Export recipes.** The saved recipes and Export all, moved down from the top.
- Tests: the groups are in that order; Quick export works from the top with one click; the print options produce the files from steps 5 and 6.

## Step 10: blend modes, with a live preview (owner, Nov 3: "add around 20 of the top blend modes too, and when you hover over them it previews on the canvas")
- **About 20 modes, grouped as in Photoshop**, with a thin line between the groups:
  - Normal.
  - Darken, Multiply, Colour burn, Linear burn.
  - Lighten, Screen, Colour dodge, Linear dodge (Add).
  - Overlay, Soft light, Hard light, Vivid light, Linear light.
  - Difference, Exclusion, Subtract, Divide.
  - Hue, Saturation, Colour, Luminosity.
  - WODBLOK's own Replace stays at the end.
- **How they are drawn:**
  - 13 of the new ones are the browser's own blend modes, so they are fast.
  - Linear burn, Linear dodge, Vivid light, Linear light, Subtract and Divide are drawn with a filter. They are checked with `npm run perf`, and any that is too slow is left out and said.
- **Live preview:**
  - Moving the pointer over a mode in the Blend list shows it on the selected elements right away.
  - Moving down the list with the arrow keys does the same, so it is not hover-only.
  - Leaving the list or pressing Esc puts the old mode back.
  - Clicking (or Enter) keeps the new mode, as one History step. Nothing is saved or added to History while previewing.
- Tests: each mode is applied and drawn; hovering or arrowing previews it with no History step; leaving restores; clicking keeps it.

## Step 11: undo and redo that work (owner, Nov 3: "undo/redo dont work")
- First find which cases fail: Ctrl+Z / Ctrl+Shift+Z and the top-bar buttons, on the Canvas and in a stamp's tab, after drawing, dragging, typing in a field, sliders, text, panels and Randomize. A quick check earlier found Ctrl+Z works after Delete, so the fault is in some of these, not all.
- Every change that alters the document is one History step; undo puts back exactly what was there, selection included; redo replays it. Nothing that only changes the view (zoom, pan, panels) is a step.
- Tests: one per case found broken, each doing the change, undo and redo, and comparing the document.

## Order and testing
- Order:
  - By step number, 1 to 11 (owner, Nov 3 2026: "Do it in numerical order"). Step 9 (the Export panel) still comes after 5 and 6, so it is arranged once the new print options exist.
- Each step: its own branch, one commit per behaviour change with its test, the related specs, `check:style` and `check:platform`. Run `npm run perf` where drawing or dragging changes (steps 2, 3 and 6).
- Run the CI suite at the end with the owner's word. Saving, opening files and the file format are touched in steps 2 (guides saved) and 5 (spot inks); this is said before going live.

## Owner's answers (Nov 3 2026)
1. **Units:** the default is **mm**.
2. **Help:** an **undocked panel**: it opens floating in the middle of the window the first time, as Export does, and can be docked like any panel. "Undocked panel" is the name for panels that open this way.
3. **Printing first:** "whatever you think is best; we need textile printing and screen printing at least".
   - Screen printing: one separation per ink (black on white, at the print resolution), with registration marks, a halftone option for tints, and the ink's name on each plate.
   - Textile printing: the repeat unit exported with its inks as spot channels (a layered TIFF), the colour count of the repeat shown, and a CMYK or RGB file for digital textile printing.
4. **CMYK:** a standard conversion now; ICC profiles later.
5. **Layouts:** a small **Layout** undocked panel (floating by default, dockable), opened from one top-bar button. It holds Save layout and Reset layout for the mode you are in.
