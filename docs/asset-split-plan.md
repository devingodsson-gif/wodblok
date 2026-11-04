# Asset split plan: a small core, the app's own files loaded when needed (2.98.1 to 2.99.0)

Owner, Nov 4 2026: "Can you please analyze the project and suggest how to split it up. I've been wanting to implement AI to select features in an image like the subject like Photoshop, and also do these pixel perfect masks", then "Yeah let's start on phase 1 of this update. It's important to me that everything is scaleable..so please build it modular, easy and clean to expand".

## Why
The built app is one file of about 18.5 MB, and every visitor downloads all of it before anything shows: textures (about 5.8 MB), text fonts (about 5.2 MB), built-in shapes (4.1 MB), templates (0.5 MB) and mockup photos (0.5 MB), against about 2 MB of code. AI selection (phase 2) would add tens of MB of model on top. Phase 1 keeps the code in the page and moves each kind of built-in content into files the hosted app fetches only when it is used.

## Decisions
- **The hosted app (`npm run build:web`) is split; the single file is not.** `npm run build` (dist/wodblok.html: the tests, the preview artifact, a file opened from disk) keeps every file inside the page as before. One build option decides, in one place (tools/assets.js).
- **The app may load its own files from its own host.** This is a second exception to "no runtime network" (the first is src/platform/account.js): src/platform/assets.js fetches only addresses the build made, `assets/<kind>/<name>.<hash>.<ext>`, relative to the page; anything else is refused. Nothing is fetched from another host, and nothing from a project or a file is ever sent.
- **File names carry the content's hash**, so a changed file has a new name; assets/ is cached for ever (src/web/_headers) and kept by the service worker for offline use (its own cache, `wodblok-assets-1`, kept across app updates).
- **No file format change.** Projects keep their own pictures inside them; only the app's built-in content moves.

## How it is built (for every kind of content)
- Build side: tools/assets.js, `assetWriter('inline')` or `assetWriter('split', outDir)`. A content step calls `out.ref(kind, name, bytes, ext)` and stores what it returns: a `data:` address (single file) or `assets/<kind>/<name>.<hash>.<ext>` (hosted).
- App side: src/platform/assets.js. `assetUrl(ref)` for anything the browser loads by address (an `<img>`, an Image, CSS, a FontFace); `assetBytes(ref)` and `assetText(ref)` for code that reads the file (an export, opentype.js, JSON data), each fetched once.
- Data the app needs from its first moment (shapes, templates): the build's `dataFile(writer, name, CONST, src)` turns `const CONST=[...]` into a reference; src/main.js lists it in `assetPreload([...])` and the module reads it with `assetData(CONST)`.
- Adding a kind of content: give its build step the writer, read the reference through src/platform/assets.js, and load it lazily where it is shown (`loading="lazy"` on thumbnails in hidden panels).

## Steps (each a patch; the minor rises when the plan is done)
1. **2.98.1: the asset system, mockups first.** tools/assets.js, src/platform/assets.js, the service worker's asset cache, the cache header; the six mockup photos and masks are files in assets/mockups/, fetched when the Mockup tab shows them. Hosted page 17.8 MB (from 18.5).
2. **2.98.2: textures.** The texture library's pictures as files, fetched when the Texture panel shows them or a project uses one.
3. **2.98.3: fonts.** The text fonts' @font-face as file addresses (the browser loads a font when text uses it); the Text tool's outlines read the bytes through assetBytes.
4. **2.98.4: shapes and templates.** Owner, Nov 4 2026, chose "cached file at start" (over loading each shape set when used, or leaving them in the page): two JSON data files fetched alongside the page and waited for before start-up, so everything after start stays synchronous.
5. **2.99.0: the plan is done.** Version and docs.

## Later (not started; decisions needed first)
- **Phase 2: AI Select subject** (Mockup and the Image panel), a model loaded as an asset pack only when first used. Needs the owner's choice of model, after checking its licence (MIT, BSD, ISC, Apache only) and size.
- **Phase 3: pixel-perfect masks** from that selection (edge refinement).

## Outcome
- 2.98.1 (Nov 4 2026): live. The single file is unchanged in size (18,463,080 bytes); the hosted page is 17,833,934 bytes plus 12 files in assets/mockups (472,320 bytes), none fetched at start.
- 2.98.2 (Nov 4 2026): live. The 30 texture pictures are files in assets/textures/ (4,358,810 bytes); the hosted page is 12,023,567 bytes. None is fetched at start; adding a Texture effect fetches the first set the library shows (7 files), the other sets wait until they are shown. The library's Export reads a built-in's bytes through assetBytes. Test set-up shared in tests/helpers/web-build.js.
- 2.98.3 (Nov 4 2026): live. 174 lettering fonts are files in assets/fonts/ (3,767,124 bytes); the hosted page is 7,004,384 bytes. The interface font and the wordmark font (IM Fell English: splash, watermark) stay inside the page. The browser fetches a font when text is set in it; the Text tool's teLoad (awaited before any layout) also fetches its bytes for opentype.js, and a font whose bytes have not arrived is not remembered as unreadable. At start only the Text tool's default font (Cinzel, 18 KB) is fetched. The single file's font CSS is byte for byte what it was.
- 2.98.4 (Nov 4 2026): live. assets/data/shapes.<hash>.json (4,144,720 bytes) and templates.<hash>.json (695,957 bytes); the hosted page is 2,165,572 bytes. Start-up (src/main.js, now `wbStart`) runs at once when the data is inside (the single file) and once both files are here otherwise; if one cannot be fetched the loading screen says "Could not load Wodblok. Check the connection, then reload." An app update no longer downloads the shapes or templates again unless they changed.
- 2.98.5 (Nov 4 2026): built, after the full suite on 2.98.4 (run 41889099948: web-app.spec failed on the new asset cache). The build writes its asset list into the service worker: a version stores its start-up data files as it installs (applying an update with no network still opens) and, when it takes over, deletes the asset files it does not use (the cache no longer grows with every release). web-app.spec expects the asset cache.
