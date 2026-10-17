// Who is signed in, and what they may use. The app and the site both call this.
// Returns the first name, email, account type and, for approved accounts, a signed 7-day pass for offline use.

import { getSession, isApproved } from '../../server/accounts/clerk.js';
import { signPass } from '../../server/accounts/pass.js';
import { gatedHost, json } from '../../server/accounts/util.js';

export async function onRequestGet({ request, env }) {
  const s = await getSession(request, env);
  // "gated" tells the app whether this host is behind the sign-in gate, so it only insists on an account where one is required
  const gated = gatedHost(env, new URL(request.url).hostname);
  if (!s) return json({ ok: false, error: 'Not signed in.', gated }, 401);
  const out = { ok: true, gated, firstName: s.firstName, email: s.email, type: s.type, approved: isApproved(s), pass: null };
  if (out.approved) out.pass = await signPass(env, { sub: s.userId, type: s.type, fn: s.firstName });
  return json(out);
}
