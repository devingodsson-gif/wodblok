// Daily active time for early-access and tester accounts. Nothing from projects or files, ever.
// Body: { day: "YYYY-MM-DD", seconds, sessions, version, browser }. The numbers are the day's running totals,
// so sending them twice is harmless: the larger value wins.

import { getSession, isApproved } from '../../server/accounts/clerk.js';
import { ensureSchema } from '../../server/accounts/db.js';
import { TRACKED, clean, json, readJson, sameSite } from '../../server/accounts/util.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestPost({ request, env }) {
  if (!sameSite(request)) return json({ ok: false, error: 'Not allowed.' }, 403);
  const s = await getSession(request, env);
  if (!s) return json({ ok: false, error: 'Not signed in.' }, 401);
  if (!isApproved(s)) return json({ ok: false, error: 'Not approved.' }, 403);
  if (!TRACKED.includes(s.type)) return json({ ok: true, stored: false }); // subscribers are not tracked
  if (!env.DB) return json({ ok: false, error: 'Not set up yet.' }, 503);

  const b = await readJson(request, 2048);
  if (!b) return json({ ok: false, error: 'That did not look right.' }, 400);

  const day = clean(b.day, 10);
  const seconds = Math.floor(Number(b.seconds));
  const sessions = Math.floor(Number(b.sessions));
  if (!DAY.test(day) || !(seconds >= 0 && seconds <= 86400) || !(sessions >= 0 && sessions <= 1000)) {
    return json({ ok: false, error: 'That did not look right.' }, 400);
  }
  // accept today and the last week (the app may send a day it was offline for), never the future
  const t = Date.parse(day + 'T00:00:00Z');
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  if (!(t <= today + 86400_000 && t >= today - 8 * 86400_000)) return json({ ok: false, error: 'That day is out of range.' }, 400);

  try {
    await ensureSchema(env);
    await env.DB.prepare(
      'INSERT INTO usage_daily (user_id, day, active_seconds, sessions, app_version, browser, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ' +
        'ON CONFLICT(user_id, day) DO UPDATE SET active_seconds = MAX(active_seconds, excluded.active_seconds), ' +
        'sessions = MAX(sessions, excluded.sessions), app_version = excluded.app_version, browser = excluded.browser, updated_at = excluded.updated_at'
    )
      .bind(s.userId, day, seconds, sessions, clean(b.version, 40), clean(b.browser, 40), new Date().toISOString())
      .run();
  } catch {
    return json({ ok: false, error: 'Something went wrong.' }, 500);
  }
  return json({ ok: true, stored: true });
}
