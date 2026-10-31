# Small updates plan (owner, Oct 31 2026): one update, 2.80.0, in three steps

Owner: "please make a simple plan with as few releases as possible. make these updates very minimal and clean." Answers (Oct 31 2026): Alt + wheel resizes and Shift + wheel rotates what is on the cursor, and the same for a selected element under the pointer; tooltips after about 0.3 s.

## Step 1: 2.79.1, panels and selection (built Oct 31 2026; docs/plan.md)
1. Template picker: the size slider resizes only the cards; the window keeps its size.
2. While a shape, stamp, text or picture is on the cursor, the Element section shows Size and Rotate from the start (canvas and stamp tab).
3. Align is hidden when nothing is selected.
4. A rotate 90° button beside Flip, Duplicate and Delete in the Element section.
5. Split: only the split line and its handles show while splitting; after the split each half has its own selection box.
6. Panel sections start folded except the top one; which ones were opened is remembered per panel.
7. Stamp tab: clicking another stamp in the Stamp panel opens that stamp's tab.

## Step 2: 2.79.2, the wheel and tooltips (built Oct 31 2026; docs/plan.md)
1. Wheel scrolls up and down, Shift + wheel left and right, Ctrl/Cmd + wheel zooms (and pinch); Space or the middle button and drag pans.
2. Alt + wheel resizes and Shift + wheel rotates what is on the cursor or a selected element under the pointer (canvas and stamp tab); then the view does not move.
3. Every icon and button shows a short name (and its shortcut) about 0.3 s after hovering.

## Step 3: 2.79.3, side-by-side panels (built Oct 31 2026; docs/plan.md). Also: the Element panel removed (owner, Oct 31 2026)
1. A panel dropped on the inner edge of a dock sits beside it as a second column.
2. A stamp tab brings the Stamp panel out in a column to the right of the left panel while a stamp is open.

## 2.80.0 (LIVE Oct 31 2026)
The CI suite, then live on the owner's word.
