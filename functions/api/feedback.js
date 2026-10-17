// Feedback from the app. Stored in D1 and emailed to the site owner (NOTIFY_TO).
// Body: { key, category: bug|idea|other, message, version?, browser? }. "key" is made by the app per message,
// so a retry after a bad connection is stored and emailed once.

import { getSession, isApproved } from '../../server/accounts/clerk.js';
import { ensureSchema } from '../../server/accounts/db.js';
import { sendMail } from '../../server/accounts/mail.js';
import { clean, json, readJson, sameSite } from '../../server/accounts/util.js';

const CATEGORIES = ['bug', 'idea', 'other'];
const KEY = /^[A-Za-z0-9_-]{8,64}$/;
const DAILY_LIMIT = 30;

export async function onRequestPost({ request, env }) {
  if (!sameSite(request)) return json({ ok: false, error: 'Not allowed.' }, 403);
  const s = await getSession(request, env);
  if (!s) return json({ ok: false, error: 'Not signed in.' }, 401);
  if (!isApproved(s)) return json({ ok: false, error: 'Not approved.' }, 403);
  if (!env.DB) return json({ ok: false, error: 'Not set up yet.' }, 503);

  const b = await readJson(request, 12288);
  if (!b) return json({ ok: false, error: 'That did not look right.' }, 400);
  const key = String(b.key || '');
  const category = CATEGORIES.includes(b.category) ? b.category : 'other';
  const message = String(b.message ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, ' ').trim().slice(0, 4000);
  if (!KEY.test(key) || !message) return json({ ok: false, error: 'Please write a message.' }, 400);
  const version = clean(b.version, 40);
  const browser = clean(b.browser, 80);

  let stored;
  try {
    await ensureSchema(env);
    const since = new Date(Date.now() - 86400_000).toISOString();
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM feedback WHERE user_id = ?1 AND created_at > ?2').bind(s.userId, since).first();
    if (recent && recent.n >= DAILY_LIMIT) return json({ ok: false, error: 'Too much feedback today. Please try again tomorrow.' }, 429);
    const r = await env.DB.prepare(
      'INSERT OR IGNORE INTO feedback (user_id, created_at, category, message, app_version, browser, idem) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
    )
      .bind(s.userId, new Date().toISOString(), category, message, version, browser, key)
      .run();
    stored = (r && r.meta && r.meta.changes) > 0;
  } catch {
    return json({ ok: false, error: 'Something went wrong. Please try again.' }, 500);
  }

  // Email only the first time this message arrives; a failed email never loses the feedback.
  if (stored) {
    const lines = [
      message,
      '',
      '---',
      'From: ' + (s.firstName || 'Unknown') + (s.email ? ' <' + s.email + '>' : ''),
      'Account type: ' + s.type,
      'Category: ' + category,
      'App version: ' + (version || 'not sent'),
      'Browser: ' + (browser || 'not sent'),
    ];
    await sendMail(env, {
      to: env.NOTIFY_TO,
      subject: 'Wodblok feedback (' + category + '): ' + message.replace(/\s+/g, ' ').slice(0, 60),
      text: lines.join('\n'),
      replyTo: s.email || undefined,
    });
  }
  return json({ ok: true });
}
