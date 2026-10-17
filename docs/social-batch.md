# Social batch (tools/social)

Makes a batch of random square designs with the built app, makes one numbered contact sheet, and emails it. Stage 1 only: single canvases, no repeat tiles or book covers, no watermark, no posting.

## Change how it behaves
Everything is in `tools/social/config.js` (checked on every run; a wrong value stops with a message):
- `count`, `size`: how many images, and the square size in pixels.
- `schedule`: `every` (`day`, `week`, `fortnight`), `days`, `hour`, `tz`.
- `roll.features`: which Randomize switches are on, 0 to 100 (stamps, layout, frame, shape, free, gr, masks, tx, pr, look, text, size). Off unless listed.
- `roll.colours`: `app` (default) uses the app's own Randomize colours, Wada sets included (fine while this is only for your own review; rights are not cleared, so check before posting publicly). `plain` uses one of `roll.palettes` instead (paper first, then ink), which never contains Wada colours.
- `seedBase`: `random` (default) is new on every run, so every batch differs; the seeds are saved in `manifest.json` (and `seedBase` too), so any pick can be re-made with `--seeds`. `date` repeats within a day; a fixed number always repeats.
- `roll.layouts`, `roll.layers`, `roll.maxAttempts`: a roll is kept only if its layers and layouts are allowed; otherwise the next seed is tried.
- `email.subjectPrefix`, `email.maxAttachmentMB`.

## Addresses and keys (never in a file; the repo is public)
GitHub > Settings > Secrets and variables > Actions > New repository secret:
- `RESEND_API_KEY`: a sending-only key from Resend (make a separate one, not the signup alerts key).
- `WB_SOCIAL_TO`: where the batch goes.
- `WB_SOCIAL_FROM`: a sender on a domain verified in Resend, for example `WODBLOK <batch@wodblok.com>`.

## Run it
- By hand on GitHub: Actions > social-batch > Run workflow (the optional count overrides the config). It sends at once and keeps the images as a run artifact for 3 days.
- Automatically: the workflow wakes every hour; `tools/social/due.js` checks `schedule` and the batch only runs in the configured hour. Scheduled runs start a few minutes late at times, and GitHub pauses schedules in a repo with no activity for 60 days.
- On a computer: `npm run build`, then
  - `npm run social -- --dry` renders into `out/<date>/` and sends nothing (the schedule is ignored),
  - `npm run social -- --dry --count 2` is a small test,
  - `npm run social -- --force` renders and sends now (needs the three values above in the environment).

## Re-render a pick
`manifest.json` in `out/<date>/` lists each image's seed. `npm run social -- --dry --seeds 20261019101,20261019105 --size 2048` renders exactly those again, at any size.

## Notes
- Each image takes about 5 to 8 seconds; 12 images about 80 seconds on a 2-core machine, plus install and build in the workflow.
- The hourly gate is about 24 short runs a day: free while the repo is public. If the repo goes private, narrow the cron in `.github/workflows/social-batch.yml` to the hours that matter.
- The inline contact sheet uses a `cid:` image and is also attached as a file, so it shows either way.

## After approving
Posting the pictures you pick is a separate tool: see docs/social-post.md.
