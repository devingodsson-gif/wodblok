# Development plan

No open plan. The UX fix plan ([`fix-plan.md`](fix-plan.md), 1.0.1 to 1.0.20) closed with 1.1.0.

Next: test 1.1.0 by hand (Monday), then write the polish plan here. Candidates from the closed plan are listed at the top of `fix-plan.md`.

## 1.6.0: Randomize shape folders
Randomize has a "Shape folders" row with a dropdown of every library folder (built-in sets, My imports, your own folders, folders inside folders). A roll takes its shapes only from the ticked folders; the Dots set stays the accents when ticked, otherwise accents come from the chosen folder. All ticked behaves exactly as before. Ticking a folder ticks the folders inside it, at least one folder holding shapes always stays ticked, new folders start ticked, and the choice is remembered in the browser like the other Randomize options (not in the project file). Test: tests/randomize-folders.spec.js.
