# Accounts (1.20.0: server side and website; the app side is 1.21)

People create an account on wodblok.com, the owner approves them, and only approved accounts can open the hosted app.
Sign-in itself is **Clerk** (email, password, verification, reset, account page, account deletion). Everything else is in
this repo: Cloudflare Pages Functions in `functions/`, shared code in `server/accounts/`, the header buttons in `site/account*.js|css`.

**Nothing changes until it is switched on.** With no Clerk key in `site/account-config.js` the header is unchanged, and
with no `GATE_HOSTS` variable the app is served exactly as before. Both are set in the steps below.

## What each person sees
1. **Create account** (top right of wodblok.com): first name, email, password; Clerk emails a verification code.
2. Until approved, opening the app shows a short "you're on the list" page.
3. The owner sets their type in the Clerk dashboard. They get an automatic "You're in" email.
4. The header then reads **Hi <name>**, with a menu: Open Wodblok, Account (Clerk's page: password, email, delete account), Sign out.
5. Signed-out visitors who open the app are sent to `wodblok.com/?signin=1`, which opens the sign-in box.

## What the owner does
- **Approve someone:** Clerk dashboard > Users > the person > Metadata > Public: `{"type": "early_access"}` (or `tester`, `subscriber`).
  A first approval sends the "You're in" email once. Changing the type later never sends it again.
- **Remove access:** set the type to `none`, or delete the user.
- **New account alert:** each new account emails `NOTIFY_TO`, with their waitlist answers if the same email is on the waitlist.
- Types: `early_access`, `tester`, `subscriber` can use the app; no type or `none` cannot. Usage time is recorded for `early_access` and `tester` only.

## What is stored (D1, same database as the waitlist; tables are created on first use)
| Table | Holds |
|---|---|
| `usage_daily` | user id, day, active seconds, sessions, app version, browser. Running totals; the larger value wins, so a retry cannot double count. Two devices on the same day undercount (the larger one is kept). Days are UTC. |
| `feedback` | user id, time, category (bug / idea / other), message, app version, browser, status. A per-message key makes a retry store and email once. At most 30 a day per person. |
| `approvals` | user id, type, time, and when the "You're in" email went out. |
Emails and passwords are only in Clerk. Nothing from a person's projects or files is ever sent or stored.
Deleting an account in Clerk fires `user.deleted`, which removes that person's rows from all three tables.

## Routes
- `functions/_middleware.js`: the gate. Off unless `GATE_HOSTS` is set. Approved (Clerk cookie or `wb_gate`): served. Signed out: 302 to the site. Not approved: 403 page. Non-page requests (service worker, manifest, scripts) get 401. `/api/*` always passes.
- `GET /api/me`: first name, email, type, `approved`, and a signed 7-day pass for offline use (needs `PASS_PRIVATE_JWK`).
- `POST /api/gate-cookie` (sets `wb_gate` for approved Clerk sessions), `DELETE /api/gate-cookie` (clears it). Needs `PASS_PRIVATE_JWK`, the same key that signs the pass.
- `POST /api/usage`, `POST /api/feedback`: used by the app from 1.21. Same-site only, size capped, approved accounts only.
- `POST /api/webhooks/clerk`: signature-checked; `user.created`, `user.updated`, `user.deleted`.
Tests: `npm run test:site` (real SQLite and generated keys, no network) and `tests/site-account.spec.js` (header, with Clerk stubbed).

## One-time set-up (your dashboards)
Do these in order. Nothing goes live until step 6.

**1. Resend.** Already used by the waitlist. Check that wodblok.com is a verified domain there, so any address on it can send.

**2. Clerk.** Create a Clerk application, then a Production instance for wodblok.com.
- User & Authentication: email address and password; require **first name**; require email verification; sign-up open to everyone.
- Allow people to delete their own account (setting name may differ; look under account settings).
- Domains: Clerk asks you to add DNS records (for `clerk.wodblok.com` and `accounts.wodblok.com`) in Cloudflare DNS. Wait until Clerk shows them verified.
- Sessions > Customize session token, add exactly:
  `{ "type": "{{user.public_metadata.type}}", "fn": "{{user.first_name}}", "em": "{{user.primary_email_address}}" }`
- Webhooks > Add endpoint: `https://wodblok.com/api/webhooks/clerk`, events `user.created`, `user.updated`, `user.deleted`. Copy its signing secret (`whsec_...`).
- API keys: copy the **publishable key** (`pk_live_...`, public) and the **JWT public key** (PEM).
  Never copy the Clerk *secret* key anywhere: nothing in this repo needs it.

**3. Make the pass key.** On your computer: `node tools/accounts/make-pass-key.mjs`. The PRIVATE line becomes `PASS_PRIVATE_JWK`
(Cloudflare only). Keep the PUBLIC line; the app uses it in 1.21.

**4. Cloudflare variables.** Workers & Pages > each of the two projects (site and app) > Settings > Variables and Secrets.
Add as **Secrets** where marked. Both projects get the same set unless a row says otherwise.

| Name | Value | Secret | Where |
|---|---|---|---|
| `CLERK_ISSUER` | the Clerk Frontend API URL, e.g. `https://clerk.wodblok.com` | no | both |
| `CLERK_JWT_KEY` | the PEM from step 2 (saves a network call per request) | no | both |
| `CLERK_AUTHORIZED_PARTIES` | `https://wodblok.com,https://app.wodblok.com` | no | both |
| `PASS_PRIVATE_JWK` | from step 3 | **yes** | both |
| `CLERK_WEBHOOK_SECRET` | `whsec_...` from step 2 | **yes** | site |
| `RESEND_API_KEY` | the key the waitlist already uses | **yes** | both |
| `NOTIFY_TO` | where alerts go (your own address) | no | both |
| `MAIL_FROM` | e.g. `Wodblok <hello@wodblok.com>` (your choice; must be on the verified domain) | no | both |
| `MAIL_REPLY_TO` | optional: where replies to "You're in" go | no | site |
| `APP_URL` | optional, default `https://app.wodblok.com` | no | site |
| `SITE_URL` | optional, default `https://wodblok.com` | no | app |
Also bind the same D1 database as `DB` in the **app** project (the site project already has it). Redeploy after saving.

**5. Website key.** Put the `pk_live_...` publishable key into `site/account-config.js`, merge to `main`. The header buttons appear.
Create your own account, then set your type to `early_access` in Clerk. Check that you get the "You're in" email and that
`https://wodblok.com/api/me` (open it in the same browser) shows `"approved": true`.

**6. Turn the gate on.** Only after step 5 works: app project > Variables > `GATE_HOSTS` = `app.wodblok.com`. Redeploy.
Test in a private window (should land on the sign-in box), then signed in as yourself.
To switch it off again: delete `GATE_HOSTS` and redeploy. Branch previews (`*.pages.dev`) are not gated unless you list `*.pages.dev`.

**7. Optional but advised:** a Cloudflare rate-limiting rule on `/api/*` (Security > WAF > Rate limiting rules).

## Things to know
- **The gate protects the hosted copy, not the code.** While the repo is public anyone can read and build the source. The gate decides who can use app.wodblok.com.
- **Clerk's cookie does not reach the app host (found in testing, fixed in 1.26.2).** Clerk only creates its `__session` cookie on the host that runs its script (wodblok.com), so app.wodblok.com always looked signed out. The site now calls `POST /api/gate-cookie` once signed in and approved, and gets back `wb_gate`: a one-hour, signed, HttpOnly cookie for `.wodblok.com` that the gate and the other `/api` routes accept on the app host. It is renewed every 20 minutes while the site is open, and a visitor sent to the site by the app is sent straight back once the cookie is set (at most once a minute, so a fault cannot loop). Sign-out clears it. Only a real Clerk session can renew it, so removing someone's approval stops their access within an hour.
- **Clerk details to verify while setting up** (written from Clerk's documented behaviour, not tested against a live instance): the session-token template syntax, the browser script address built in `site/account.js`, and the exact name of the account-deletion setting.
- **Offline.** Once the app is installed and cached, the browser can open it without asking the server, so the 7-day pass check is done in the app itself (1.21). Until then a cached copy keeps opening.
- **Free plan limit.** `functions/_middleware.js` makes every request to both Pages projects run a Function. Cloudflare's free plan allows 100,000 Function requests a day across the account, plenty for a beta.
- **Email.** Clerk sends its own verification and reset emails (from its address until its custom email domain is set up). This repo's emails go through Resend.

## Next: 1.21 (the app)
Name chip in the status bar; File > Account…; File > Send feedback…; the offline pass; the usage counter; the CLAUDE.md "no runtime network" rule changed to allow only `src/platform/account.js`.
