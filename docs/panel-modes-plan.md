# Creating and editing, and the effect pop-out (plan, Oct 26 2026)

Two owner requests from Oct 26 2026, planned together because both change what an element panel shows. Status: **plan only, nothing built.** The owner reads it before any step starts.

## 1. Creating is not editing

Owner, Oct 26 2026: "I want a difference between creating a new element vs editing an existing one. If I click the motif button on the element bar it opens the panel and I see some options plus the motif library, great. But when I create a motif and then click on that motif to edit it, I also see the motif library. There should be a difference between creating a new motif and editing one by clicking it or selecting it in the Elements list."

His answers (Oct 26 2026): **every element kind**; swapping what an element is made from stays possible ("swapping is fine"); the settings made while creating **stay as they are** for the next one of that kind (they do not reset).

The model is Photoshop's: with a tool in hand and nothing selected, the options set up the next thing you make; with a layer selected, the panel describes that layer.

- **Create mode:** the element bar's button (or Add in the panel, or the Elements menu) arms the kind with nothing selected. The panel shows the library (or picker) and the starting settings. What is set here is kept for the next element of that kind.
- **Edit mode:** an element is selected (on the canvas, in the Elements list, or right after it was placed). The panel shows that element's own groups (Element, Fill, Outline, Effects and so on) and **no library**. In place of the library, one row shows what the element is made from (its thumbnail and name) with a **Replace** button; Replace opens the same library as a dropdown, and a pick swaps it (one history step). Changes reach only that element.
- **The panel title** says which mode it is ("New motif" / the element's name), so the mode is visible without explanatory text (the no-text rule).
- **Placing:** after a click places a new element, it is selected and the panel turns to edit mode.

Per kind (to be checked against the code in step 1; the list below is the plan, not yet verified):
- **Shape (motif):** create shows the Shapes library; edit shows Element, Fill, Outline, Effects and the Replace row.
- **Stamp:** create shows the Stamp library; edit shows the stamp instance's groups and a Replace row (another stamp).
- **Pattern:** create shows the starting settings and the sources picker; edit shows the pattern's own settings and its sources list (the sources list is the pattern itself, so it stays, with its Add source).
- **Text:** create shows the typing settings and text styles; edit shows the selected text's settings; a style library, if shown, becomes a Replace row ("Style").
- **Sheet:** has no library; create is Add sheet; edit shows Fill (the picture's library row becomes Replace when the fill is a picture) and Effects.
- **Paint:** create is the brush; edit is the painted element's own settings.
- **Effects' own libraries** (the texture library inside a Texture effect) follow the same rule: inside an element's effect, a Replace row with the texture's thumbnail opens the texture library as a dropdown.

UI: no new component. The Replace row is a list row (Part 9.10: `--h-row`, 20px thumbnail, name, action last); Replace is a Secondary button; the dropdown is the existing popover (`--r-l`, `--shadow`, z 50–60, `popin`) holding the library's existing tree (`ltMake`), so search, folders and sets behave as in the docked library. The guide (Part 9.10) gets one rule: element panels have a create mode and an edit mode, libraries only in create mode.

## 2. The effect pop-out

Owner, Oct 26 2026: "If we apply an effect from the top bar (Effects > Noise > Add noise) it should pop up a little detached effect editing window, like the one in the motif panel at the bottom, just to edit that effect. We could add an Apply button." And: "It's important that the options in that window are **identical** to the options in the in-panel effects options."

His answers (Oct 26 2026):
1. The menu items are only enabled while an element is selected; with nothing selected they are greyed out, so the pop-out never opens without a target.
2. With several elements selected the effect goes on **all of them**.
3. **Every** item of the Effects menu (Texture, Colour grade, Jitter, Pressure, all the filter effects), not only the filter effects.

How it works:
- **Opening:** Effects > a menu item, with one or more elements selected whose kinds all take that effect (otherwise the item is greyed). A new effect with its default settings is added to each selected element at once, so the canvas shows it live.
- **The window:** a floating panel (Part 9: `--r-l`, `--shadow`, raised above docked panels, draggable by its title bar), titled with the effect's name ("Add noise"). Its body is the effect's settings pane. Footer: Cancel (Secondary) and **Apply** (Primary, the one key action).
- **Identical options, by construction:** the window does not hold a copy of the controls. It shows the very same settings pane the Effects group uses (the `.fxs[data-e=…]` pane from `fxGroup`, moved into the window while it is open and put back after, as the Fill group already moves between panels in 82-motif-look.js). One pane means one set of controls, one sync, one place to add an option; a test checks the window's controls equal the panel's.
- **Several elements:** the window edits the first selected element's new effect; each change is copied to the matching new effect on the others (same settings, own seed where the effect has one, so Reroll still differs per element). One history step for the whole Apply.
- **Apply** keeps the effects (one history step, named after the effect) and closes the window; the effect is then in each element's Effects list, edited there afterwards. **Cancel**, Esc or closing the window removes the new effects and leaves no history step.
- **While it is open:** the canvas stays live (zoom and pan work). Proposed: another Effects menu item, a change of selection or Undo **cancels** the open one, so nothing half-applied stays behind (to confirm with the owner).
- Speed: the preview is the normal effect drawing; `npm run perf` before committing, as for any drawing change.

## Steps

The plan raises the minor once at the end (CLAUDE.md, release workflow).
1. **2.54.2: create and edit, the core and Shape.** The mode in one place (which mode a panel is in, from the armed tool and the selection), the panel title, the Replace row and dropdown, for the Shape (motif) panel. Tests: the bar button shows the library; selecting a placed shape hides it and shows Replace; Replace swaps in one history step; settings made while creating stay for the next shape.
2. **2.54.3: create and edit for Stamp, Pattern, Text, Sheet, Paint** and the texture row inside the Texture effect. Tests per kind.
3. **2.54.4: the effect pop-out**, every Effects menu item, one or several elements, Apply and Cancel, the shared pane. Tests: greyed with nothing selected or a kind that does not take the effect; the window's controls equal the panel's; Apply is one history step on all selected; Cancel leaves nothing.
4. **2.55.0:** guide (Part 9.10) and docs, closes the plan.

Risk: shared panel code and the Effects group (30–50% for the suite at the end of step 4); step 3 touches drawing only through the live preview.

## Open questions for the owner
- While the pop-out is open, should picking another Effects item or another element **cancel** the open effect (proposed), or apply it?
- Pattern: its sources list is part of the pattern, so it stays in edit mode with its Add source. Agreed?
- Should the pop-out remember where it was dragged to (per session), or always open by the canvas?
