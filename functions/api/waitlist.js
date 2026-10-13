// Waitlist sign-ups for wodblok.com. Cloudflare Pages Function, stored in a D1 database bound as DB.
// No secrets live in this file: the database is attached in the Cloudflare dashboard (docs/site.md).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
let ready = false;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

// "other" in a dropdown means: use what the person typed
const pick = (v, other) => {
  const a = clean(v, 80);
  if (a !== 'other') return a;
  const b = clean(other, 80);
  return b ? 'Other: ' + b : 'Other';
};

export async function onRequestPost({ request, env }) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const fail = (error, status) =>
    wantsJson ? json({ ok: false, error }, status) : new Response(error, { status, headers: { 'content-type': 'text/plain' } });

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return fail('Not allowed.', 403);
  if (!env.DB) return fail('The waitlist is not set up yet.', 503);

  let data;
  try {
    const type = request.headers.get('content-type') || '';
    data = type.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return fail('That did not look right. Please try again.', 400);
  }
  if (!data || typeof data !== 'object') return fail('That did not look right. Please try again.', 400);

  const ok = () =>
    wantsJson ? json({ ok: true }) : new Response(null, { status: 303, headers: { location: '/?joined=1#waitlist' } });

  // hidden field that only bots fill in: pretend it worked
  if (clean(data.company, 200)) return ok();

  const email = clean(data.email, 254).toLowerCase();
  if (!EMAIL.test(email)) return fail('Please enter a valid email address.', 400);
  const role = pick(data.role, data.role_other);
  if (!role) return fail('Please choose what you will use it for.', 400);
  const heard = pick(data.heard, data.heard_other);
  const why = clean(data.why, 1000);

  try {
    if (!ready) {
      await env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS waitlist (' +
          'id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, role TEXT, heard TEXT, why TEXT, ' +
          'created_at TEXT NOT NULL, updated_at TEXT NOT NULL)'
      ).run();
      ready = true;
    }
    const now = new Date().toISOString();
    // signing up again with the same email updates the answers instead of adding a second row
    await env.DB.prepare(
      'INSERT INTO waitlist (email, role, heard, why, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5) ' +
        'ON CONFLICT(email) DO UPDATE SET role = excluded.role, heard = excluded.heard, why = excluded.why, updated_at = excluded.updated_at'
    )
      .bind(email, role, heard, why, now)
      .run();
  } catch {
    return fail('Something went wrong. Please try again.', 500);
  }
  return ok();
}
