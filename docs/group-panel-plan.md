# Group panel plan (2.104.1 to 2.105.0)

Owner, Nov 5 2026: "What do you think about adding effects and moving groups? Of elements like if I have a group I can click the group and there's a group panel that has rotation, adjust hor/ver and add effects?" His answers to the design questions: "No group selection by the canvas only the elements list"; "Yes one combined effect"; and yes to the suggested controls (X, Y, W, H, Rotate, Shift across and Shift down, Effects).

## Decisions
- A group is picked in the Elements list only; a click on the canvas still picks the single element under it. A picked group opens the Group panel (an element panel: no rail button) and shows its box on the canvas.
- Group is registered as an element kind (`group`, hidden from the element bar, 100-group-panel.js) so the selection opens its panel the way every kind's does.
- Opacity and blend stay in the Elements panel, where every row's are (one control per role).
- The Group panel has its own Group section, built from the same components as the Element group (unit fields, sliders), not the Element group itself: that one's handlers work on one element's own size and angle.
- Every control changes the members themselves (destructive), so Ungroup leaves everything where it is and every other part of the app (alignment, smart guides, the book spine, repeat tiles, export) keeps working on single elements. The group keeps only what its sliders show: `gr` (Rotate), `gox`, `goy` (Shift).
- Effects on a group (step 2) are one combined effect over the group's drawing, kept on the group; Ungroup drops them, the members keep their own.

## Steps
1. **2.104.1: the Group panel, moving and turning.** X, Y (the box's top-left), W, H (scales evenly from the top-left), Rotate (-180 to 180 degrees, about the middle of the members' places, a point that stays still as they turn), Shift across and Shift down (-100 to 100%, of the canvas's width and height). One History step per change. Per kind: shapes, pictures, text and stamps move, turn and scale by their place, angle and size; a Paint element's strokes turn and scale point by point (widths too); a Pattern's area moves and sizes but does not turn (an area is upright); a Sheet, the Background and a Pattern that fills the canvas stay where they are.
2. **2.104.2: group effects.** An Effects section in the Group panel with the elements' Add effect list (Texture, Colour grade and the 16 filter effects; not Pressure offset or Jitter, which act on single stamps), drawn over the group's combined drawing; each checked on a group, on the canvas and in exports.
3. **2.105.0: the plan is done.**

Not in this plan: a stamp's tab (checked in step 2: it lists the stamp's shapes on their own and has no groups).

## Outcome
- 2.104.1 (Nov 5 2026): live. tests/group-panel-2-104-1.spec.js.
- 2.104.2 (Nov 5 2026): live. The Group panel's Effects (KIND_PANEL group, the `group` kind in Texture's, Colour grade's and the filter effects' lists); drawn over the members drawn together by a hook in the group's wrapper (WBX.wbGpFx, 100-group-panel.js; gWrap, 65-element-core.js), between the group's ink and its opacity and blend. All 18 effects draw on a group (a new Colour grade draws nothing until a slider moves, as on an element). tests/group-effects-2-104-2.spec.js.
- **2.105.0 (Nov 5 2026): the plan is done.** A group picked in the Elements list moves, sizes, turns and shifts as one, and takes effects over its whole drawing.
