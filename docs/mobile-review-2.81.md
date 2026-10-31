# Mobile review, 2.81.1 (Oct 31 2026)

Owner, Oct 31 2026: "When I select a shape then I go to adjust the size/rotation on the element drop down on the panel it deselects the shape. Please run a full mobile usage of the app and make a plan to fix UI issues."

Tested: the live app, 2.81.1, on a 390 × 844 touch screen in Chromium (phone emulation), with real touch events (CDP) and throwaway scripts (not committed). Covered:
- every panel opened one by one;
- the File and "…" menus;
- the colour picker from the tray;
- an Elements row menu;
- placing shapes and text;
- the selection bar;
- a stamp's tab;
- Export and History.

Each panel was checked for anything past the screen's edge and for small tap targets. Not covered: a real phone's keyboard, iOS Safari. The owner's phone is the last check.

## The owner's bug, found
**M1 (high): a swipe on the canvas deselects, and does not scroll.** On a phone the canvas fills the top half of the screen, so the natural way down to the panels is a swipe up that starts on the canvas. Since 2.80.2 the canvas takes every touch (`touch-action:none`), so the page does not scroll. A one-finger drag on the empty canvas is a selection rectangle, which starts by dropping the selection. Reproduced: shape selected, a swipe up from the empty canvas, selection gone, page not scrolled.

## Other findings
- **M2 (high): placing never ends on a phone.** After a shape, text or stamp is placed it stays on the finger, as on a desktop, where Esc or a right click puts it away. A phone has neither. Pressing the Shape button again does not put it away. Every later tap on the canvas places another copy instead of selecting: two taps gave two shapes, still armed. This also looks like the owner's report: tapping a shape to select it adds a new one on top.
- **M3 (high): the canvas leaves the screen while a panel is in use.** Panels stack under the canvas in one long page: about 2,600 px in a stamp's tab. A slider far down a panel changes the picture while the picture is off-screen.
- **M4 (medium): opened panels pile up.** Each panel opened joins the column and stays, so Randomize, Pattern, Stamp, Shape and Export end up one under another and the page grows.
- **M5 (medium): small tap targets.** Top-bar and panel icon buttons are 24 px; a finger needs about 36 to 44 px.
- **M6 (low): the top bar is wider than the screen.** Randomize is cut in half and the theme switch is off-screen; they are reached only by scrolling the bar sideways.

## Seen and fine
- Nothing reaches past the screen's right edge in any panel, menu or dialog.
- The colour picker fits (252 × 402).
- The File menu fits.
- The selection bar sits above the selection.
- A stamp's tab shows its Stamp panel.
- Typing a text opens the field.

## Fix plan (phone only; one update, 2.82.0)

| Step | Version | What | Suite importance |
| --- | --- | --- | --- |
| 1 | 2.81.2 | **M1:** on a phone a one-finger swipe that starts on the empty canvas scrolls the page; a tap there still deselects. The selection rectangle stays a desktop tool. **M2:** after a placement on a phone the new element is selected and placing stops (owner to choose, below). | about 30% |
| 2 | 2.81.3 | **M3:** the canvas stays at the top of the screen (sticky) while the panels scroll under it. **M4:** a phone shows one tool panel at a time under the Elements list; opening another replaces it, as a tab. | about 30% |
| 3 | 2.81.4 | **M5:** icon buttons at touch size on a phone (`--h-touch`, 36 px). **M6:** the top bar folds what does not fit into its "…" menu, as a narrow desktop window does (2.78.5). | about 20% |
| 4 | 2.82.0 | Live on the owner's word (Oct 31 2026, without the CI suite). | |

Owner's answers (Oct 31 2026): "Yes to all your questions do whatever you think is best": placing stops after one on a phone; the canvas pinned at the top now, the bottom sheet as its own update later; one tool panel at a time on a phone.

Questions for the owner (answered above):
1. M2: on a phone, should placing stop after one (recommended: tap the button again for another), or should the armed element-bar button put it away when tapped?
2. M3: keep the canvas pinned at the top now (recommended, small), or go straight to the bottom-sheet layout?
3. M4: one tool panel at a time on a phone (recommended)?
