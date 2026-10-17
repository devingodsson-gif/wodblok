// Lets the app host know who is signed in. Clerk's session cookie is only on wodblok.com, so the site calls this
// (with that cookie) and gets back a one-day signed cookie for the whole domain, which the gate on app.wodblok.com reads.
//   POST  approved Clerk session -> sets the cookie.   DELETE  -> clears it (sign out).
// Only a real Clerk session can renew it, never the gate cookie itself, so access ends within a day of an account losing approval.
//   GATE_COOKIE_DOMAIN  optional, default .wodblok.com on wodblok.com hosts (no Domain attribute elsewhere, e.g. previews and tests)

import { getClerkSession, isApproved } from '../../server/accounts/clerk.js';
import { GATE_COOKIE, GATE_SECONDS, signGate } from '../../server/accounts/pass.js';
import { json, sameSite } from '../../server/accounts/util.js';

function cookie(request, env, value, maxAge) {
  const host = new URL(request.url).hostname.toLowerCase();
  const domain = env.GATE_COOKIE_DOMAIN || (host === 'wodblok.com' || host.endsWith('.wodblok.com') ? '.wodblok.com' : '');
  return `${GATE_COOKIE}=${value}; ${domain ? `Domain=${domain}; ` : ''}Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;
}

export async function onRequestPost({ request, env }) {
  if (!sameSite(request)) return json({ ok: false, error: 'Not allowed.' }, 403);
  const s = await getClerkSession(request, env);
  if (!s) return json({ ok: false, error: 'Not signed in.' }, 401);
  if (!isApproved(s)) return json({ ok: true, approved: false });
  const value = await signGate(env, { sub: s.userId, type: s.type, fn: s.firstName, em: s.email });
  if (!value) return json({ ok: false, error: 'Not set up yet.' }, 503);
  const res = json({ ok: true, approved: true });
  res.headers.append('set-cookie', cookie(request, env, value, GATE_SECONDS));
  return res;
}

export async function onRequestDelete({ request, env }) {
  if (!sameSite(request)) return json({ ok: false, error: 'Not allowed.' }, 403);
  const res = json({ ok: true });
  res.headers.append('set-cookie', cookie(request, env, '', 0));
  return res;
}
