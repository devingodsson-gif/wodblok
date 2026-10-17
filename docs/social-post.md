# Social post (tools/social/post.js)

Posts the pictures you approved from a batch email. Built for many accounts and platforms; Instagram is the first adapter.

## Use it
1. The batch email lists each picture with its **seed**.
2. GitHub > Actions > **social-post** > Run workflow. Fill in:
   - **seeds**: the seeds you approved, comma separated (1 to 10). More than one makes a carousel.
   - **caption**: one line; type `\n` for a new line. Instagram allows 2,200 characters and 30 hashtags.
   - **accounts**: names from `tools/social/accounts.js` (comma separated) or `all`.
   - **post_for_real**: OFF = test run. It re-makes your pictures and checks everything but uploads and posts nothing; the pictures are kept as a run artifact for 3 days so you can look. ON = really posts.
3. It re-makes exactly your picks from their seeds, uploads full-size JPEGs to the media host, posts to each account, then deletes the uploads. A report goes to the run summary and (if the Resend secrets exist) your email.
- Same from a terminal: `npm run social:post -- --seeds 1562344001,1562344004 --caption "Hello" --accounts all` (add `--real` to post).
- Re-making a pick needs the same `tools/social/config.js` (colours, features) as when the batch was made. If you change those, old seeds look different.

## Add an account later
One line in `tools/social/accounts.js` and two GitHub secrets under the names you write there. Many accounts per platform are fine. One account failing never stops the others.

## Add a platform later
One file in `tools/social/publish/` with `check(post)` and `publish(post, ctx)` (copy `instagram.js`), one line in `ADAPTERS` in `publish/index.js`, then accounts with that `platform`. Nothing else changes.

## One-time setup: media host (Cloudflare R2)
Instagram only fetches pictures from a public web address, so approved pictures sit in a bucket for a few seconds.
1. Cloudflare dashboard > R2 > create a bucket (any name).
2. Bucket > Settings > Public access: turn on the **r2.dev** address (or connect a custom domain). Copy the public address (`https://pub-....r2.dev`).
3. R2 > Manage API tokens > create a token with **Object Read & Write** on that bucket. Copy the Access Key ID and Secret Access Key (shown once).
4. GitHub secrets: `WB_R2_ACCOUNT_ID` (your Cloudflare account id), `WB_R2_ACCESS_KEY_ID`, `WB_R2_SECRET_ACCESS_KEY`, `WB_R2_BUCKET`, `WB_R2_PUBLIC_BASE` (the public address, no trailing slash).
Uploads are deleted right after posting, but while they exist anyone with the link can see them. They are random generated pictures you are about to publish anyway.

## One-time setup: Instagram
1. The Instagram account must be a **Business or Creator** account.
2. developers.facebook.com > create an app > add the product **Instagram API with Instagram Login**. Add your Instagram account as an Instagram tester / role and accept the invite in Instagram.
3. Generate an access token for the account with the permissions `instagram_business_basic` and `instagram_business_content_publish`, and exchange it for a long-lived token. Note the account's Instagram user id.
4. GitHub secrets: `WB_IG_TOKEN` and `WB_IG_USER_ID` (the names in `accounts.js`; change both places if you rename them).
5. Run social-post once as a **test run**, then once for real with one picture.
- **Tokens expire**: a long-lived token lasts about 60 days and must be refreshed before then (Meta's refresh call), then the secret replaced. Put a reminder in your calendar for about 50 days. Automating the refresh is a good next step.
- I could not confirm from Meta's docs whether your own account needs app review. In development mode with your own account as a tester it normally does not; the first real run will show.
- The Graph version lives in one constant at the top of `publish/instagram.js`.

## Safety
- The form has **post_for_real OFF** by default.
- Secrets are only given to the one step that posts (not `npm ci` or the build) and are never printed; errors hide tokens.
- Nothing is posted if any picture fails to re-make, or the caption breaks a platform rule; both checks run before anything is uploaded.
- Not built yet: a "posted" log so the same picture can't be posted twice by accident, per-platform captions, scheduling a post for later, and TikTok / X / Facebook adapters.
