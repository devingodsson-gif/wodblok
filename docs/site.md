# The website (wodblok.com)

`site/` is the public landing page: plain static files (one `index.html`, the two interface fonts, the icons and a few
pattern images made in Wodblok). It has no build step and shares nothing with the app, so changing it cannot break the app.
Its buttons go to the app at `https://app.wodblok.com`.

The pattern images in `site/img/` are real Randomize rolls of the 1.6 build (seeds 140, 3, 117, 113 and 55), taken as
screenshots of the canvas. Swap them for any pieces you like; keep the 2:3 shape or change `aspect-ratio` in the page.
The page shows no colour names (the Wada names are not cleared for commercial use, see `src/data/wada.js`).

## Cloudflare set-up (done once, in the dashboard)

Do these in this order so wodblok.com always shows something.

1. **Move the app to app.wodblok.com.** Workers & Pages > the existing app project > Custom domains > Set up a custom
   domain > `app.wodblok.com`. Wait until it says Active and check the app opens there.
2. **Create the site project.** Workers & Pages > Create > Pages > Connect to Git > this repository. Production branch
   `main`, build command empty, build output directory `site`. Every other branch gets a preview address.
3. **Hand wodblok.com to the site.** In the app project, remove the custom domain `wodblok.com` (and `www.wodblok.com` if
   it is there). In the site project, add `wodblok.com` (and `www.wodblok.com`). There is a gap of a few minutes between
   the two.

Both projects build from the same `main`. A merge that only touches `site/` rebuilds the app too; that is harmless.
To skip it, set Build watch paths in each project (app: exclude `site/*`; site: include `site/*`).

## Saved work in the browser

Browsers keep a site's stored data per address. Work, settings and the stamp library saved in the app at wodblok.com do
not appear at app.wodblok.com. Save anything worth keeping to a file (projects as .wodblok files, the stamp library as an export) before step 3.
