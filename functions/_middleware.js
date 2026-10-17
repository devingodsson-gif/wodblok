// Sign-in gate for the hosted app. OFF unless GATE_HOSTS is set in Cloudflare, so merging this changes nothing by itself.
//   GATE_HOSTS  comma list of hosts to protect, e.g. app.wodblok.com (a leading "*." matches subdomains, e.g. *.pages.dev)
//   SITE_URL    where signed-out visitors are sent (default https://wodblok.com)
// Signed in and approved (early_access, tester, subscriber): the page is served as usual.
// Signed in but not approved: a short "on the list" page. Signed out: sent to the site to sign in.
// Anything that is not a page (service worker, manifest, scripts) gets a plain 401, so nothing half-loads.
// /api/* always passes through; each function there checks the session itself.

import { getSession, isApproved } from '../server/accounts/clerk.js';
import { escapeHtml, gatedHost } from '../server/accounts/util.js';

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  if (!gatedHost(env, url.hostname) || url.pathname.startsWith('/api/')) return next();

  const session = await getSession(request, env);
  if (isApproved(session)) return next();

  const isPage = request.headers.get('sec-fetch-dest') === 'document' || (request.headers.get('accept') || '').includes('text/html');
  const headers = { 'cache-control': 'no-store' };
  if (!isPage) return new Response('Sign in required', { status: 401, headers });

  const site = String(env.SITE_URL || 'https://wodblok.com').replace(/\/+$/, '');
  if (!session) return new Response(null, { status: 302, headers: { ...headers, location: site + '/?signin=1' } });
  return new Response(waitlistPage(session, site), { status: 403, headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } });
}

function waitlistPage(session, site) {
  const name = escapeHtml(session.firstName || 'there');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wodblok</title><meta name="robots" content="noindex">
<style>
:root{color-scheme:dark light;--bg:#1b1a18;--fg:#efe9dc;--mut:#a39a89;--acc:#c9a66b;--line:#37332f}
@media (prefers-color-scheme:light){:root{--bg:#f6f2e9;--fg:#1d1a15;--mut:#6c6454;--acc:#8a6528;--line:#ddd5c6}}
html,body{height:100%;margin:0}body{display:grid;place-items:center;background:var(--bg);color:var(--fg);font:400 17px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:30rem;padding:32px 24px}h1{margin:0 0 12px;font-size:28px;font-weight:600}p{margin:0 0 20px;color:var(--mut)}
a{color:var(--acc)}
</style></head><body><main>
<h1>Hi ${name}, you&rsquo;re on the list.</h1>
<p>Wodblok is open to early-access testers for now. We&rsquo;ll email you when your account is approved.</p>
<p><a href="${escapeHtml(site)}">Back to wodblok.com</a></p>
</main></body></html>`;
}
