// Clerk webhooks (set up in the Clerk dashboard to POST here). Signature checked on every call.
//   user.created  email the site owner (NOTIFY_TO) with the new account and any waitlist answers
//   user.updated  when the account type becomes early_access / tester / subscriber for the first time, email the user "You're in"
//   user.deleted  delete that user's usage, feedback, approval and preference rows
// Replies 2xx when the event is handled so Clerk stops retrying; replies 500 only when a retry is worth it.

import { ensureSchema } from '../../../server/accounts/db.js';
import { sendMail } from '../../../server/accounts/mail.js';
import { verifyWebhook } from '../../../server/accounts/svix.js';
import { APPROVED, clean, json } from '../../../server/accounts/util.js';

const primaryEmail = (d) => {
  const list = Array.isArray(d.email_addresses) ? d.email_addresses : [];
  const p = list.find((e) => e && e.id === d.primary_email_address_id) || list[0];
  return clean(p && p.email_address, 254).toLowerCase();
};

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (raw.length > 200_000 || !(await verifyWebhook(raw, request.headers, env.CLERK_WEBHOOK_SECRET))) {
    return json({ ok: false, error: 'Bad signature.' }, 400);
  }
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'Bad body.' }, 400);
  }
  const d = (event && event.data) || {};
  const userId = clean(d.id, 100);
  if (!userId) return json({ ok: true });
  if (!env.DB) return json({ ok: false, error: 'Not set up yet.' }, 503);

  try {
    await ensureSchema(env);

    if (event.type === 'user.deleted') {
      await env.DB.batch([
        env.DB.prepare('DELETE FROM usage_daily WHERE user_id = ?1').bind(userId),
        env.DB.prepare('DELETE FROM feedback WHERE user_id = ?1').bind(userId),
        env.DB.prepare('DELETE FROM approvals WHERE user_id = ?1').bind(userId),
        env.DB.prepare('DELETE FROM prefs WHERE user_id = ?1').bind(userId),
      ]);
      return json({ ok: true });
    }

    if (event.type === 'user.created') {
      const email = primaryEmail(d);
      const first = clean(d.first_name, 80);
      let answers = 'No waitlist answers found for this email.';
      try {
        const w = await env.DB.prepare('SELECT role, heard, why FROM waitlist WHERE email = ?1').bind(email).first();
        if (w) answers = ['Waitlist answers:', 'Use: ' + (w.role || '-'), 'Heard about it: ' + (w.heard || '-'), 'Why: ' + (w.why || '-')].join('\n');
      } catch {
        /* the waitlist table may not exist yet */
      }
      await sendMail(env, {
        to: env.NOTIFY_TO,
        subject: 'New Wodblok account: ' + (first || email),
        text: ['A new Wodblok account was created.', '', 'Name: ' + (first || '-'), 'Email: ' + email, '', answers, '', 'To approve: set the user\'s public metadata type to early_access or tester in the Clerk dashboard.'].join('\n'),
      });
      return json({ ok: true });
    }

    if (event.type === 'user.updated') {
      const type = clean(d.public_metadata && d.public_metadata.type, 40).toLowerCase();
      if (!APPROVED.includes(type)) return json({ ok: true });
      const now = new Date().toISOString();
      await env.DB.prepare(
        'INSERT INTO approvals (user_id, type, approved_at) VALUES (?1, ?2, ?3) ON CONFLICT(user_id) DO UPDATE SET type = excluded.type'
      ).bind(userId, type, now).run();
      const row = await env.DB.prepare('SELECT notified_at FROM approvals WHERE user_id = ?1').bind(userId).first();
      if (row && !row.notified_at) {
        const to = primaryEmail(d);
        const first = clean(d.first_name, 80);
        const app = String(env.APP_URL || 'https://app.wodblok.com');
        const sent = await sendMail(env, {
          to,
          subject: 'You’re in: Wodblok early access',
          text: ['Hi ' + (first || 'there') + ',', '', 'Your Wodblok account now has early access. Open it here:', app, '', 'Sign in with the email and password you used to create your account.', '', 'Reply to this email any time with questions or problems.', '', 'Wodblok'].join('\n'),
          replyTo: env.MAIL_REPLY_TO || undefined,
        });
        // when the email did not go out, ask Clerk to retry; the row stays unmarked so the retry sends it
        if (!sent) return json({ ok: false, error: 'Email not sent.' }, 500);
        await env.DB.prepare('UPDATE approvals SET notified_at = ?2 WHERE user_id = ?1').bind(userId, now).run();
      }
      return json({ ok: true });
    }
  } catch {
    return json({ ok: false, error: 'Something went wrong.' }, 500);
  }
  return json({ ok: true });
}
