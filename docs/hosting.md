# Hosting the web app (Phase 4)

`npm run build:web` writes the whole app to `dist/web/`: `index.html` (one file, fonts inside), `manifest.webmanifest`, `sw.js` (offline
and updates), the icons and `_headers`. It is plain static files, so any static host works. It is hosted on Cloudflare Pages (status
below); the selling model (plan 7b) decides how public it should be.

## Private first: Cloudflare Pages behind Cloudflare Access
1. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > this repository.
2. Build command `npm ci && npm run build:web`, output directory `dist/web`, production branch `main`.
   Every other branch gets its own preview address.
3. Zero Trust > Access > Applications: add a self-hosted application for the Pages domain (and `*.<project>.pages.dev` for the previews)
   with a policy that lists the people allowed in. The free plan covers up to 50 users (confirm at set-up).
4. Open the address in Chrome, Edge or Safari. Chrome and Edge offer Install in the address bar; Safari: File > Add to Dock.

**Build settings (checked Nov 4 2026):** until Nov 4 the Cloudflare project built `npm run build` (the single file), not the web app; it is now `npm ci && npm run build:web`, output `dist/web` (see docs/plan.md 2.102.1). Cloudflare answers `/index.html` with a redirect to `/`: the service worker must never answer a page load with a redirected reply.

**Status (Oct 11 2026):** wodblok.com is live on Cloudflare Pages and updates a few moments after each merge into `main`. It is currently open to anyone who visits (steps 1-2 are done; step 3, Access, is not set up), and the hosted app sends the whole code to every visitor. Search engines are not blocked yet. Whether to add Access or a `noindex` header is the owner's decision (docs/public-repo.md).

GitHub Pages is not an option: Pages sites are public (private ones need GitHub Enterprise Cloud).

## What the browser does with it
- **Offline:** the first visit stores the app on the device; after that it opens with no network.
- **Updates:** each build has its own cache name (version + build time). A new version downloads in the background and waits; it is used the
  next time the app is opened, or when the person presses the small "Update ready" dot in the status bar (it asks to save first when there is unsaved work).
  The page is never reloaded by itself.
- **Saving:** Chrome and Edge write back to the file that was opened or last saved (Download becomes Save for that file). Safari and Firefox have no
  save-to-file picker, so Download saves a copy and Open is the file picker.
- **Storage:** the app asks the browser to keep its data and shows "Stored N MB" in the status bar. Safari clears a site's data after 7 days without
  a visit unless the app is added to the Dock or Home Screen, so treat browser storage as a cache and files as the truth.
- **The app's own files (2.98.1, docs/asset-split-plan.md):** `npm run build:web` puts built-in content (mockup photos, textures, lettering fonts; the shapes and templates as two data files
  the app waits for at start) in `assets/` beside index.html, each name carrying its content's hash. The app fetches a file only when it is used; `/assets/*` is cached for ever
  (_headers), and the service worker keeps every file it has fetched in its own cache for offline use. The single file (`npm run build`) keeps them inside.
- **AI selection (2.100.1, docs/ai-select-plan.md):** `assets/ai/` holds the model and its runtime (about 100 MB; any file over 24 MiB in pieces, `.1`, `.2`,
  so none is over Cloudflare's 25 MiB). Fetched only when someone first uses Find with AI, then kept. It runs on one processor thread unless the page is
  cross-origin isolated (COOP and COEP headers), which wodblok.com is not today: turning that on is faster but must not break sign-in; it is the owner's decision.
- **Opening files:** the installed app in Chrome and Edge on a computer can be chosen as the opener for `.wodblok` files.
