# Plan: pro basics and print output (Nov 3 2026)

Owner, Nov 3 2026, from docs/pro-gap-review-2.86.md: "so lets do- real units of measurement. rulers. alt-drag. update help, colour output and print files. for now make a simple, clean plan for this but im gonna give you some more features in a minute."

Status: **plan, not started.** Steps 7 to 9 were added Nov 3 from the owner's second list; more may follow.
Numbering: each step is a patch release on the version that is live when work starts (after 2.87.0, if it is merged first: 2.87.1, 2.87.2 and so on). The minor version is raised once, when the plan is done.

## Step 1: real units of measurement
- One **Units** setting (Settings > General): px, in, mm, cm. It applies everywhere.
- The element panels show **X, Y, W, H** and Rotate in those units, in fields you can type into. They replace Position across, Position down, Size, Width and Height in %, which show the same values in real units now.
- A real size comes from the canvas's physical size and resolution (Canvas > Format, which already has inches, millimetres and DPI).
- Stamp items, pattern pieces and spacing show real units where it makes sense: a piece's size, spacing and margins.
- Typed values take units ("2in", "50mm") and simple arithmetic ("+10").
- Tests: a value typed in each unit lands at the right place; changing Units changes the display, not the document.

## Step 2: rulers and guides
- **Rulers** on the top and left of the stage in **every tab**, in the chosen units, following zoom and pan. View > Rulers (Ctrl+R) turns them on and off for all tabs.
  - On the Canvas they measure the canvas from its top-left corner.
  - In a stamp's tab they measure the stamp at its printed size (owner, Nov 3: "a ruler to the top and left side of the canvas tabs too").
- **Guides** are dragged out of a ruler, moved by dragging, and removed by dragging back onto the ruler. View > Guides shows or hides them (Ctrl+;), View > Lock guides locks them, View > Clear guides removes them.
- Elements **snap** to guides (with the smart guides, under the same switch; Alt skips snapping).
- **New guide…** places one at a typed position.
- Guides are saved with the project, and a stamp's tab keeps its own guides.
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
  - **Save layout** keeps the panels as they are now as that mode's default.
  - **Reset layout** puts them back.
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

## Order and testing
- Order:
  - Steps 1 to 3 first (small, everyday tools), with 7 and 8 alongside (panel work).
  - Then 4 (Help), then 5 and 6 (the largest).
  - Step 9 last, so the Export panel is arranged once the new print options exist.
- Each step: its own branch, one commit per behaviour change with its test, the related specs, `check:style` and `check:platform`. Run `npm run perf` where drawing or dragging changes (steps 2, 3 and 6).
- Run the CI suite at the end with the owner's word. Saving, opening files and the file format are touched in steps 2 (guides saved) and 5 (spot inks); this is said before going live.

## Questions for the owner
1. Units: which should be the default? Inches (US print) or mm?
2. Help: a panel docked like the others, or a separate window?
3. Colour output: which printing first? Screen print, block or relief, riso, or print-on-demand?
4. CMYK and profiles: is a standard conversion enough now, with ICC profiles later (that needs a library)?
5. Layouts: should Save layout and Reset layout be two icon buttons in the top bar (beside History and the gear), or one button opening a small menu?
