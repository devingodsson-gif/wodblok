// Email through Resend, the service the waitlist notification already uses.
//   RESEND_API_KEY  secret (Cloudflare)
//   MAIL_FROM       e.g. Wodblok <hello@wodblok.com>; the domain must be verified in Resend
//   NOTIFY_TO       where alerts to the site owner go (new accounts, feedback)
// Email must never undo the thing that triggered it, so this returns true or false and never throws.

export async function sendMail(env, { to, subject, text, replyTo }) {
  if (!env.RESEND_API_KEY || !to) {
    console.error('Email not sent: RESEND_API_KEY or the recipient is not configured.');
    return false;
  }
  try {
    const body = { from: env.MAIL_FROM || 'Wodblok <notification@wodblok.com>', to: [to], subject, text };
    if (replyTo) body.reply_to = replyTo;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error('Email failed:', res.status, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (e) {
    console.error('Email failed:', e instanceof Error ? e.message : String(e));
    return false;
  }
}
