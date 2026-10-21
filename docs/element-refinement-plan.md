# Element refinement update (saved Oct 21 2026, not started)

The owner's notes, to be built when he says so (he calls it "the element refinement update"). Verbatim sense, grouped:

## Add bar behaviour
- Shape button: opens the Shape properties, which let the user create a shape (nothing is made by pressing the button alone).
- Motif button: opens the Motif properties but does not create a motif. The user picks a motif there; it follows the cursor, transparent, and can be placed many times on the canvas.
- Stamp button: the same as Motif: opens the Stamp properties, creates nothing yet; pick stamps there and place them on the canvas like motifs.
- Background is not an element, so it must not be a button on the element bar.
- Dragging motifs on the canvas renders them live while dragging, not only on release.

## Shape element
- A clearer button to import an image.
- The image shows in the same place and shape as the Shape; it is still a Shape that renders an image, never an image instance. The Image element is gone for good (all is Shape).

## Pattern element
- A new pattern has no stamps in it by default (empty).
- Each pattern position is drawn as an arrow pointing in that position's angle.
- The Sources section says "Add element" and lists all the stamps and motifs.
