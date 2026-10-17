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

## Waitlist

The sign-up form at the bottom of the page posts to `/api/waitlist`, a Cloudflare Pages Function in `functions/api/waitlist.js`.
It stores each sign-up in a D1 database: email, what they will use it for, how they heard, why they want it, and the dates.
Signing up again with the same email updates that row. It creates its own table on first use. No keys are stored in the repo.

One-off set-up in the Cloudflare dashboard (the form shows "not set up yet" until it is done):
1. Storage & databases > D1 > Create database, name it `wodblok-waitlist`.
2. Workers & Pages > the **site** project > Settings > Bindings > Add > D1 database, variable name `DB` (capital letters), pick `wodblok-waitlist`. Save and redeploy (a new merge into `main`, or Deployments > Retry).

Reading the list: D1 > `wodblok-waitlist` > Console > `SELECT * FROM waitlist ORDER BY created_at DESC;`
or from a terminal `npx wrangler d1 execute wodblok-waitlist --remote --json --command "SELECT * FROM waitlist"`.
Roles and sources picked as "Other" are stored as `Other: <what they typed>`.

`functions/` sits at the repo root because that is where Pages looks; the app project picks it up too, but without a `DB`
binding it only answers "not set up" and nothing else changes. Tests: `npm run test:site` (plain Node, no browser).
The page has a hidden trap field and checks the sign-up comes from the same site; add Cloudflare Turnstile if spam shows up.

## Features section

"Coming next" lists the first four items of the future-features list (colourways, print size, separations, mockups) and the
smaller ones as chips. Keep the wording to what is actually planned; edit the list in `site/index.html`.

## Adding pictures to the gallery

Put new images in `site/img/` named `work-5.jpg`, `work-6.jpg` and so on (`.png` or `.webp` also work). The page adds them to the
grid in number order. It stops at the first number that is missing, so do not skip one. Use 2:3 portrait pictures like the
first four (they are cropped to that shape). Work 1 to 4 are written into the page so they show even without scripts.

## Accounts

Sign-in, the approval gate and the header buttons are described in [accounts.md](accounts.md). They stay off until a Clerk key is set in `site/account-config.js`.
