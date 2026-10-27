# Artist test, Oct 27 2026: what was seen and what to fix

Source: the owner's rough notes from watching one artist use the app. Raw notes grouped; the order is a suggestion until the owner approves it. Features he has defined are marked Defined; the rest wait for his word.

## What she did (observations, not tasks)
- Opened Shapes first (the first button on the element bar). Opened Text styles expecting fonts (mistook one for the other).
- Collected many shapes for an overall theme and placed them as a list on the canvas, to reference later while building the image.
- Tilted the waves on the top row by hand, one by one.
- Used only text and shapes. No stamps, patterns or sheets (besides the default Background).
- The only frustration, and the number one cause of it, was element selection mistakes.

## 1. Selection (the one frustration; do first)
- [x] A click on two overlapping elements sometimes selects both: a very short drag starts a selection box. Make the drag distance before a box starts larger.
- [x] Overlapping elements: the one higher in the Elements list wins the click.
- [x] A text element is selected only when the text itself is touched (not its box).
- [x] With an element selected, a click on the empty space around the canvas deselects it.
- [x] Lock an element so a click on the canvas cannot select or move it (on the bar; check what the Elements list lock already does).
- [x] Hold Shift while dragging an element to switch smart guides off.

## 2. Placing and copying
- [x] Paste near the bottom of the canvas lands off the canvas: clamp pasted elements to the canvas.
- [x] Placing many times from a selected element. Defined (owner, Oct 27 2026): picking a shape in the library already lets you click to place it many times; the same is wanted for an element you have selected: a button on its panel makes a copy that ghosts on the pointer, and each click places one (like 2.54.3).
- [x] A Pattern cannot get smaller than one piece of its smallest source.
- [ ] Idea from her reference list: a way to keep reference shapes off the final image (hidden layer, or a scratch area). Not asked for; discuss.
- [ ] Idea from tilting the waves by hand: rotating many selected elements at once, or by a typed angle. Not asked for; discuss.

## 3. Text
- [ ] Bold, italic and the other style options for text.
- [ ] Text styles was mistaken for fonts: look at the name and where fonts are chosen.

## 4. Colour
- [x] A Done button on the colour maker or selector: after a custom colour is made the panel stays open.
- [x] A Highlight colour in Settings, next to Accent. Defined (owner, Oct 27 2026): used for the smart alignment guides and for the selection box drawn by dragging.

## 5. Shapes
- [x] Import button on the Shapes list: its words overlap once pressed.
- [x] Crop in the shape import window. Defined (owner, Oct 27 2026): Shapes > Import turns a picture into a one-colour shape and the window has a Threshold control; a crop selection is active there, beside the threshold. No erase.
- [ ] Shape menus are a little confusing: look at what she hesitated on.
- [x] Choosing a stamp shape: the transparency squares are tiny for the rectangle and much larger for all other shapes. Make them one size.

## 6. Panels
- [x] Each panel tab can be closed.

## 7. Look
- [x] Film grain looks bad: redo it.
- [x] Gradients. Owner, Oct 27 2026: a system like the Sheet, which is a solid fill that takes effects: linear and radial gradients that effects can be applied to. His question: add gradient settings to the Sheet? Proposal, to confirm when we reach it: the Sheet gets a Fill choice (Solid, Linear, Radial) with its colours and angle or centre, so every effect already works on it; a separate Gradient element only if a gradient must sit above other elements.

## Text overhaul (release 3)
The owner wants to overhaul text and will give more for release 3 when we get there: ask him then. Bold, italic and the Text styles naming (section 3) wait for that.
- [x] Style parts of a text: Letter colour (2.62.0). Fonts, bold and italic: waiting (owner, Oct 27 2026).

## Unfinished note
The last note stops mid-sentence: "Say there are 100 elements in the element list, so the list is super full and". Ask the owner how it ends (probably a full Elements list being hard to use).

## Suggested order
1. Selection (section 1), one release: it is the only thing that frustrated her.
2. Paste clamp, Pattern minimum, Done button, Import overlap, transparency squares, tab close (small fixes), one release.
3. Highlight colour, copy-and-place and import crop (all defined now).
4. Film grain, then gradients (confirm the Sheet fill idea first).
5. Release 3: the text overhaul (ask the owner).

## Release plan (three releases, each raises the minor once; steps inside are patches)
**Release 1, 2.60.0: Selection and control.** The only frustration, so it goes first.
- 2.59.2 Overlap and drag: a larger drag before a box starts; higher in the Elements list wins; text selected only on the text itself; a click outside the canvas deselects.
- 2.59.3 Control: lock from the bar; Shift while dragging turns smart guides off; Highlight colour in Settings (smart guides and the selection box).
- Tests: selection and guide specs; perf (touches dragging).

**Release 2, 2.61.0: Smaller fixes, new tools and the look.**
- 2.60.1 Fixes: paste clamped to the canvas; Pattern minimum size; Done button on the colour maker; Import button overlap; transparency squares one size; close each panel tab; shape menus.
- 2.60.2 Place copies: a button on a selected element copies it to the pointer and each click places one.
- 2.60.3 Import crop: a crop selection beside the Threshold in the shape import window.
- 2.60.4 Gradients: the Sheet Fill (Solid, Linear, Radial) once confirmed; touches drawing and the file format (v30), so perf and the broader checks.
- 2.60.5 Film grain: redone.

**Release 3, 2.62.0: Text overhaul.** Bold, italic and the other options, the Text styles naming and whatever the owner adds; ask him when we start.
