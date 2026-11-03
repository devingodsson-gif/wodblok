// ===== Help pages (2.87.4, docs/pro-basics-plan.md step 4). Plain writing kept in the repo and bundled, so Help works offline.
// Each page is [id, title, blocks]; a block is ['h', heading], ['p', text] or ['ul', [items]]. Keep it short, in the app's own words (the menu and panel names),
// and describe only what the app does today. Keyboard shortcuts and About are drawn from the app itself (47-help.js); What's new is HELP_NEWS below:
// add one entry at the top for each release a user would notice.
const HELP_PAGES=[
 ['start','Getting started',[
  ['p','WODBLOK makes stamped patterns: you draw stamps from shapes, print them on the canvas, repeat them as patterns, colour them from a small tray of inks and finish them with print effects.'],
  ['h','The window'],
  ['ul',['The menu bar is at the top left. Undo, redo, History, search, Randomize and light or dark are at the top right.','The element bar above the canvas adds a Shape, Image, Text, Stamp, Pattern or Sheet. Beside it is the colour tray.','The Elements list is docked on the right. Every other panel opens from the menus and can be docked, tabbed or left floating.']],
  ['h','A first pattern'],
  ['ul',['Elements > New stamp opens the stamp in its own tab. Add shapes to it from the Shape panel.','Go back to the Canvas tab and add a Pattern from the element bar. It repeats your stamps over the canvas.','Pick inks in the colour tray, then add print effects from the Effects menu.','Export > Export… opens the Export panel.']],
  ['h','Saving'],
  ['p','File > Save project keeps the whole project in one file. Unsaved work is kept on this device and offered again if the app closes unexpectedly.']]],
 ['elements','Elements',[
  ['p','Everything on the canvas is an element, listed in the Elements panel from front to back. The project starts with the Background, a Sheet in the paper colour.'],
  ['h','Kinds'],
  ['ul',['Shape: one shape from the shape library.','Image: a picture you bring in.','Text: words in a box, in any of the bundled or your own fonts.','Stamp: one print of a stamp.','Pattern: a repeat of stamps or shapes over the canvas or an area.','Sheet: a fill of colour, a gradient or a picture.']],
  ['h','Working with them'],
  ['ul',['Click to select; Shift, Ctrl or Cmd adds to the selection; drag on empty canvas to select with a box.','Drag to move. Hold Alt as you start a drag to leave the element and drag a copy.','The handles size and turn the selection. Alt sizes from the middle; Shift keeps the proportions.','The Element group shows X, Y, W and H in the units chosen in Settings > General > Units. Type a value, a unit such as 2in or 50mm, or a sum such as +10.','Group, lock, hide, rename and arrange elements from the Elements list or the Edit menu.']],
  ['h','Lining things up'],
  ['ul',['Smart guides snap a dragged element to the canvas and to the other elements.','View > Rulers shows rulers on the Canvas tab. Drag a guide out of a ruler, and drag it back to remove it. Elements snap to guides.','View > Show grid and the Grid panel set a grid to snap to.']]]],
 ['stamps','Stamps',[
  ['p','A stamp is a small block made of shapes and text. Each stamp opens in its own tab, where you build it; on the canvas it is printed like a real stamp, with ink, pressure and worn edges.'],
  ['h','Making a stamp'],
  ['ul',['Elements > New stamp, or New stamp in the Stamp panel.','In the stamp’s tab, pick a shape in the Shape panel and click to put it in. Text goes in from the Text panel.','The Stamp panel sets the stamp’s shape and size, its ink, its block edge and its symmetry.','Split (S) cuts a shape along a line; Knock out (K) cuts one shape out of another.']],
  ['h','Using it'],
  ['ul',['Add a Stamp from the element bar to print it once, or use it in a Pattern.','Save stamp to library keeps it for other projects; Import stamp file brings one in.']]]],
 ['patterns','Patterns',[
  ['p','A Pattern repeats its sources (stamps or shapes) over the canvas or over an area of it.'],
  ['h','Arrangements'],
  ['ul',['Tiling, Radial, Scatter, Spiral and Frame, each with its own settings: size, spacing, columns and rows, rotation and shifts.','Edges decides what happens at the border: cut at the edge or whole pieces only.','Cycle, Random or Weighted picks which source goes where; Reroll draws again.']],
  ['h','Pieces and colour'],
  ['ul',['Add source puts another stamp or shape into the pattern.','Accent places a different source at chosen places.','Colour of each piece can follow the source or the place; ink variation and overprint make it look printed.','Edit pieces lets you pick one piece to recolour, turn, delete or make an element of its own.']],
  ['h','Repeats'],
  ['p','Canvas > Format > Repeat tile makes the canvas one tile of a seamless repeat (grid, brick or half drop). View > Repeat tile shows it 3 × 3.']]],
 ['effects','Effects',[
  ['p','Effects make a print look printed. Add them from the Effects menu or the element’s Effects group; each has its own settings and can be switched off or removed.'],
  ['h','The effects'],
  ['ul',['Texture, Pressure offset, Jitter and Colour grade.','Noise: Add Noise, Film Grain, Dust & Scratches.','Blur: Gaussian Blur, Motion Blur.','Print: Halftone, Line Screen, Stipple, Ink Bleed, Misregistration, Threshold.','Distort: Roughen, Ripple, Wobble, Warp, Slip.']],
  ['p','The Canvas panel’s Texture sets the paper’s texture under everything.']]],
 ['colours','Colours',[
  ['p','The colour tray beside the element bar holds the project’s inks. Elements take their colour from a place in the tray, so changing a tray colour changes everything that uses it.'],
  ['ul',['Click a tray place to pick its colour; the Colours panel finds, saves and folders colours.','Save tray keeps a set of tray colours to use again.','A colourway is another set of colours for the same tray. Colour > New colourway adds one; Export all colourways exports one file for each.']]]],
 ['randomize','Randomize',[
  ['p','Randomize builds a new design in one click, using your tray colours and your stamps where it can.'],
  ['ul',['Randomize in the top bar rolls a new design.','The gear beside it opens the Randomize panel: pick a Look (Any, Repeat, Textile, Tilework, Halftone, Random and more) and what may change: background, pattern, focal point, text, frame, colours, effects, finish and canvas size.','Every roll is one History step, so Undo takes it back.']]]],
 ['export','Export and print',[
  ['p','Export > Export… opens the Export panel. Quick export saves at once; a custom export picks the format and size.'],
  ['ul',['Formats: PNG, JPG, SVG, TIFF and PDF. Set the long side in pixels or a print size and resolution.','Recipes keep export settings to use again; Export all recipes exports each in one zip.','Export repeat unit saves one seamless tile of a repeat (PNG or TIFF).','Print proof makes a proof sheet on Letter or A4.','Colourways can be exported all at once.']],
  ['p','Canvas > Format sets the canvas’s real size (pixels, inches or millimetres) and resolution, which the rulers and the Element group’s units use too.']]]];
// What's new: newest first, [version, date, [lines]]
const HELP_NEWS=[
 ['2.87.4','Nov 3 2026',['Help is a panel of its own, with a manual, search, keyboard shortcuts and this list.']],
 ['2.87.3','Nov 3 2026',['Hold Alt as you start a drag to leave the element and drag a copy, on the canvas and in a stamp’s tab.']],
 ['2.87.2','Nov 3 2026',['Rulers and guides on the Canvas tab (View > Rulers, Ctrl+R). Drag guides out of the rulers; elements snap to them.']],
 ['2.87.1','Nov 3 2026',['Real units: Settings > General > Units. The Element group shows X, Y, W and H in millimetres, inches, centimetres or pixels, and takes typed units and sums.']],
 ['2.87.0','Nov 2 2026',['Randomize’s Random look makes printed repeats of stamp blocks in the tray’s colours.']],
 ['2.86.0','Nov 2 2026',['A new Randomize look, Random.']],
 ['2.84.5','Nov 2 2026',['One element panel at a time; a Size slider for text; gradients with more colours; paste a picture into the shape importer.']],
 ['2.84.4','Nov 2 2026',['In a stamp’s tab: Snap all to grid, a Sheet in the stamp, reordering shapes in the Elements list, and Wrap at the zone edges for symmetry.']],
 ['2.84.3','Nov 1 2026',['Move the view with the middle mouse button or the wheel, even while the canvas is fitted to the screen.']]];
export {HELP_NEWS,HELP_PAGES};
