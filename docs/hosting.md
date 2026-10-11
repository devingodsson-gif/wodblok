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
- **Opening files:** the installed app in Chrome and Edge on a computer can be chosen as the opener for `.wodblok` files.
