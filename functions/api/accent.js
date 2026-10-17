// The accent colour a person picked in the app, kept with their account so it follows them to other devices.
// Body: { accent: "#rrggbb" } or { accent: "" } for the built-in Oak. Approved accounts only. Nothing else is stored.

import { getSession, isApproved } from '../../server/accounts/clerk.js';
import { ensureSchema } from '../../server/accounts/db.js';
import { json, readJson, sameSite } from '../../server/accounts/util.js';

const HEX = /^#[0-9a-f]{6}$/i;

export async function onRequestPost({ request, env }) {
  if (!sameSite(request)) return json({ ok: false, error: 'Not allowed.' }, 403);
  const s = await getSession(request, env);
  if (!s) return json({ ok: false, error: 'Not signed in.' }, 401);
  if (!isApproved(s)) return json({ ok: false, error: 'Not approved.' }, 403);
  if (!env.DB) return json({ ok: false, error: 'Not set up yet.' }, 503);

  const b = await readJson(request, 512);
  if (!b || typeof b.accent !== 'string' || !(b.accent === '' || HEX.test(b.accent))) return json({ ok: false, error: 'That did not look right.' }, 400);

  try {
    await ensureSchema(env);
    await env.DB.prepare(
      'INSERT INTO prefs (user_id, accent, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(user_id) DO UPDATE SET accent = excluded.accent, updated_at = excluded.updated_at'
    )
      .bind(s.userId, b.accent.toLowerCase(), new Date().toISOString())
      .run();
  } catch {
    return json({ ok: false, error: 'Something went wrong.' }, 500);
  }
  return json({ ok: true });
}
