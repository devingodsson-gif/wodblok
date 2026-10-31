# Mobile touch plan (owner, Oct 31 2026): one update, 2.81.0, in three steps

Owner: "I want to optimize the mobile version of the app. When I scroll up and down between panels I often accidentally change slider and other values. And it's very difficult to resize, move, rotate and place elements." Answers (Oct 31 2026): a slider moves only after the finger has gone sideways (yes); a small toolbar over the selection (yes); the bottom-sheet panel layout maybe later. Also: "the color tray doesn't show on mobile". "Do these updates very targeted and clean. It should ONLY AFFECT MOBILE and not the desktop version at all."

## What "mobile" means here
- Layout and looks: the narrow layout the app already has (`max-width:860px`, `wsNarrow()` in 34-desktop-shell.js). Desktop windows are supported from 1,024 px, so nothing here reaches them.
- Gestures: touch input only (`pointerType == 'touch'`) inside the narrow layout, marked by the `wbtouch` class on `<html>` (narrow and a touch screen). A mouse or pen, and any desktop window, keep today's behaviour exactly.

## Step 1: 2.80.1, sliders and the colour tray
1. A slider on a phone moves only once the finger has gone sideways (about 8 px); a finger that goes up or down first scrolls the panels and leaves the value alone. A tap on its track does not jump the value; a drag changes it from where it is. The number box beside it still takes a typed value.
2. The colour tray shows on a phone, under the element bar, scrolling sideways when it does not fit.

## Step 2: 2.80.2, the canvas with fingers
1. Two fingers on the canvas pinch to zoom and drag to pan; one finger edits.
2. Two fingers that start on a selected element resize and turn it (one History step).
3. A shape or stamp on the finger shows where it will go while the finger is down and is placed where the finger lifts.
4. Resize and turn handles take a touch from about 22 px around them (they look the same).
5. Moving an element keeps the offset from where it was touched (it does not jump under the finger).

## Step 3: 2.80.3, the selection toolbar
A small bar over the selection on a phone: Rotate 90°, Flip, Duplicate, Delete.

## 2.81.0
The CI suite, then live on the owner's word. Later, if wanted: the bottom-sheet panel layout.
