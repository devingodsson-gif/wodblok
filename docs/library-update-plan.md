# Library update plan (owner, Oct 26 2026)

Owner: "update all the libraries so they are the same, as the document details and requires" (docs/developing-wodblok.md Part 9 section 12, and the gap table in section 15). Decisions (Oct 26 2026): one shared folder-tree component first, then one release per library; rename and button changes included; build the saved Colourways library.

The steps are patches of one plan (CLAUDE.md): 2.51.1 to 2.51.7; the minor is raised once, to 2.52.0, when the plan is done. Each step is one branch off the one before (stacked, unmerged until the owner says), has its own tests, and rewrites its row of the gap table.

| Step | Library | What changes |
|---|---|---|
| 2.51.1 | Shared component | `87-library-tree.js`: the folder tree of section 12 as one component (rows, sets, hidden sets, folder menu and form, select mode, drag, messages, saving of folders and open state, Export list). A library gives it its items, its built-in sets, its words, how an item is drawn (tiles, rows or cards) and what Export writes. Textures move onto it first (their tests stay the same). The Shapes library's folder "…" button becomes always visible. |
| 2.51.2 | Saved stamps | Tiles, folders (a stamp record gets a folder path), select mode, drag, Export, search; the Stamp panel's Library section uses the tree. |
| 2.51.3 | Saved trays (colours) | Rows with a swatch strip; folders nest, no Back button, select mode, Move to, drag; Wada sets become sets in the list. |
| 2.51.4 | Templates | Cards in the tree; "Starting points" is a set; your templates get folders. |
| 2.51.5 | Workspaces | Rows in the tree; built-in layouts as a set. |
| 2.51.6 | Export recipes | Rows in the tree; built-in recipes as a set. |
| 2.51.7 | Saved colourways | A new library (cards): save a project colourway to it, add one back. This project's colourways stay as they are. |
| 2.52.0 | Close | Version only; docs; gap table. |

## Where the Shapes library stands
The Shapes library already follows the standard (home folder named Yours, hidden sets, nesting, select mode, drag). About forty specs depend on its markup (`#lib`, `data-f`, `#fsel` and so on), so it keeps its own code; the component is written from the texture library (the same logic, made generic) and from the Shapes library's behaviour. Moving the Shapes library onto the component is a later, optional step: it would change no behaviour and risks all those specs.

## Rules for every step
- Same words, rows, menus, messages and order of things as section 12; no new design. If the guide lacks something, ask and change the guide first.
- Folder, item paths and open state are saved through `src/platform` under a per-library key. Nothing is lost when a library has no folders yet.
- A project file keeps an item's folder as a plain path string; no format bump unless a step says so.
- Tests: one spec per library (folders, select mode, drag, hide, export), plus the specs of the library it replaces. Quick targeted runs only; the full suite only when the owner says.
