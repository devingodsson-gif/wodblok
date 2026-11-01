# Patch to-do, from a tester's pass on 2.84.1 (Nov 1 2026)

The owner's rough list from a testing session, formatted. The owner's words are kept in quotes; the grouping into patches is a proposal (nothing here is built or approved yet). Each patch is a small release (one theme, a few items), numbered as patches of the 2.85.0 update, as the earlier plans were (docs/pattern-plan.md, docs/mobile-review-2.81.md).

Status: **proposed, not started.** Mark each item when it ships. Items marked **?** need the owner's answer before building.

## Patch 1, 2.84.2: things that are wrong now (bugs)
- [ ] **T1. Text caret is in the wrong place.** "When typing text the flashing position indicator line is not accurate in where it is."
- [ ] **T2. Effects section has no way to add an effect.** "Effects section on element panels has no arrow or way to add effects." Every element panel's Effects section needs the open/close arrow and the Add effect button.
- [ ] **T3. The Shape button makes a rectangle.** "When you first click the shape icon it creates a rectangle, don't do that just open the menu." The button only opens the Shape panel; nothing is created by it (docs/element-refinement-plan.md).
- [ ] **T4. Add pattern needs no click on the canvas.** "Clicking add pattern should just add it, no click on the canvas."
- [ ] **T5. Save as PNG defaults to the wrong file type.** "Files need to save as their stated format or .png, by default when you press save as PNG the default file format selected is 'file'." The file type in the save dialog must follow the chosen format (PNG saves as .png, and so on).

## Patch 2, 2.84.3: moving around the canvas
- [ ] **T6. Middle mouse button drags the view.** "Middle click should drag the view."
- [ ] **T7. Scroll the view when not zoomed in.** "I should be able to scroll if I'm not zoomed in."

## Patch 3, 2.84.4: the stamp tab
- [ ] **T8. The alignment grid works in a stamp's tab.** "Alignment grid needs to work on stamp tab."
- [ ] **T9. Add a Sheet to a stamp.** "Should be able to add sheet to stamp."
- [ ] **T10. A stamp gets a background fill colour option.** "Stamps should have background fill color option." **?** A fill of the whole stamp square, or a Sheet inside the stamp (T9)? They may be the same item.
- [ ] **T11. Drag elements in a stamp's element list to reorder by depth.**
- [ ] **T12. Click any symmetry copy to select the element.** "When a shape is being repeated by a symmetry selection. You must click the original stamp to select it, I'd like to be able to click on any, the original or the copies."
- [ ] **T13. Symmetry wrap toggle.** "Have symmetry in stamp mode have a toggle switch to wrap at the edges of the symmetry zones or be cut off."
- [ ] **T14. Accent stamp can be any stamp.** "Accent stamp should be any possible option, not only stamps already in use." The Accent picker lists the whole Stamps library, not just stamps already used in the pattern.

## Patch 4, 2.84.5: panels and inputs
- [ ] **T15. Only one element panel open at a time.** **?** Since 2.79.3 panels can sit side by side and a stamp's tab keeps the Stamp panel beside the left panel. Does "one at a time" mean opening an element panel closes the other element panels, while the Elements list, Colours and other non-element panels stay? Phone panels already pile up (docs/mobile-review-2.81.md, M4).
- [ ] **T16. Font size bar.** "Font size bar." **?** Only the two words were written. Is it a slider beside the size number in the Text panel, or something on the canvas? Please say.
- [ ] **T17. Gradients with more than two colours.** "Triple and quadruple gradient. Keep being able to add colors." Gradient stops can be added without a limit of two (the owner suggests at least three and four, and "keep being able to add").
- [ ] **T18. Paste a copied picture into the shape importer.** "Ability to paste copied images into shape importer." Ctrl/Cmd+V with a picture on the clipboard, as well as choosing a file.

## Order and testing
- Patches 1 and 2 first (bugs and quick wins). Patch 3 is the largest and touches the stamp tab's drawing and selection, so it gets the broader regression and `npm run perf`. Patch 4 touches panels and the colour/gradient code.
- Each patch: a branch `fix/<version>-<name>`, one commit per behaviour change with its test, quick specs and `check:style`/`check:platform`; the full suite only on the owner's word.
- The 2.85.0 minor is raised once, when the four patches are done.

## Questions for the owner
1. T10: fill the stamp square, or the same as adding a Sheet (T9)?
2. T15: what should "one element panel at a time" close, and what stays?
3. T16: where is the font size bar?
4. Order: bugs first (as above), or the stamp tab first?
