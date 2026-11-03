# Plan: pro basics and print output (Nov 3 2026)

Owner, Nov 3 2026, from docs/pro-gap-review-2.86.md: "so lets do- real units of measurement. rulers. alt-drag. update help, colour output and print files. for now make a simple, clean plan for this but im gonna give you some more features in a minute."

Status: **plan, not started.** Steps 7 to 9 were added Nov 3 from the owner's second list; more may follow.
Numbering: each step is a patch release on the version that is live when work starts (after 2.87.0, if it is merged first: 2.87.1, 2.87.2 and so on). The minor version is raised once, when the plan is done.

## Step 1: real units of measurement
- One **Units** setting (Settings > General): px, in, **mm (the default)**, cm. It applies everywhere.
- The element panels show **X, Y, W, H** and Rotate in those units, in fields you can type into. They replace Position across, Position down, Size, Width and Height in %, which show the same values in real units now.
- A real size comes from the canvas's physical size and resolution (Canvas > Format, which already has inches, millimetres and DPI).
- Pattern pieces and spacing on the Canvas show real units where it makes sense: a piece's size, spacing and margins. A stamp's own shapes, in its tab, keep %.
- Typed values take units ("2in", "50mm") and simple arithmetic ("+10").
- Tests: a value typed in each unit lands at the right place; changing Units changes the display, not the document.

## Step 2: rulers and guides
- **Rulers** on the top and left of the **Canvas** tab, in the chosen units, measuring the canvas from its top-left corner and following zoom and pan. View > Rulers (Ctrl+R) turns them on and off.
- **No rulers in a stamp's tab** (owner, Nov 3: "lets maybe not measure the stamp size, remove it from the stamp tab"): the stamp is not measured, and its shapes keep their sizes in % as now.
- **Guides** are dragged out of a ruler, moved by dragging, and removed by dragging back onto the ruler. View > Guides shows or hides them (Ctrl+;), View > Lock guides locks them, View > Clear guides removes them.
- Elements **snap** to guides (with the smart guides, under the same switch; Alt skips snapping).
- **New guide…** places one at a typed position.
- Guides are saved with the project. They belong to the Canvas only, since a stamp's tab has no rulers.
- Tests: rulers follow zoom and pan; guides drag, snap, lock, save and reopen.

## Step 3: Alt-drag to duplicate
- Holding Alt while dragging an element (or a selection, or a stamp's shape in its tab) leaves the original and drags a copy.
- One History step ("Duplicated").
- Shift still constrains to the axis, and the smart guides work as in a move.
- Tests: Alt-drag on the canvas and in a stamp's tab; Undo removes only the copy.

## Step 4: Help
- **The Help menu:**
  - Getting started.
  - The manual: a short page per area (Elements, Stamps, Patterns, Effects, Colours, Randomize, Export and print).
  - Keyboard shortcuts.
  - What's new, filled from the releases.
  - Send feedback, for signed-in users, as now.
  - About.
- **Where it lives:** a Help panel or window with search, styled to the UI standard, kept out of the tool panels so the no-tooltips rule stands.
- **Content:** plain writing kept in the repo and bundled into the app, so it works offline with no network.
- Tests: every menu item opens its page; search finds a topic; the page fits a phone.

## Step 5: colour output
- **Ink separations.**
  - Each tray colour used in a design is one ink.
  - Export > Separations gives one greyscale file per ink (PNG or TIFF, at the chosen DPI), named after the ink, with registration marks.
  - This is for screen printing, block and relief printing, and riso.
- **Spot colours.** A tray colour can be marked as a spot ink (with a name), carried into the separations and into PDF output.
- **CMYK.** A CMYK export for print shops (TIFF and PDF), using a standard conversion, with a soft-proof view (View > Proof colours) that shows how the colours will print.
- **Colour profiles** (ICC: embedding and choosing one) are left for later unless the owner wants them now: proper profile conversion needs a library, which needs the owner's approval.
- Tests: one separation per ink with the right pixels; a spot ink keeps its name; a CMYK export opens with the right channel count.

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

## Step 8: the Pattern panel's sources (owner, Nov 3)
- The Add source button is hard to see; a first-time user would not find it.
- **A Sources group near the top** of the Pattern panel, right under the panel's own controls, so a new pattern's empty sources are the first thing seen.
- **Add source** becomes the standard Add button: full width at the top of the group, opening the usual Add menu. The menu lists the project's stamps, then its texts and patterns, then Shape from the library…, as the Add effect menu does.
- Tests: a new pattern shows Sources near the top with Add source; each menu entry adds that source.

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

## Order and testing
- Order:
  - Steps 1 to 3 first (small, everyday tools), with 7, 8 and 10 alongside.
  - Then 4 (Help), then 5 and 6 (the largest).
  - Step 9 last, so the Export panel is arranged once the new print options exist.
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
