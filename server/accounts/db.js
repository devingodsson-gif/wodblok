// D1 tables for accounts. Created on first use, like the waitlist table (no migration step to forget).
// Emails and passwords are never stored here: they stay with Clerk. A row is tied to a Clerk user id.

let ready = false;

const TABLES = [
  // one row per user and day; the larger value wins, so a retried upload cannot double count
  'CREATE TABLE IF NOT EXISTS usage_daily (' +
    'user_id TEXT NOT NULL, day TEXT NOT NULL, active_seconds INTEGER NOT NULL DEFAULT 0, sessions INTEGER NOT NULL DEFAULT 0, ' +
    'app_version TEXT, browser TEXT, updated_at TEXT NOT NULL, PRIMARY KEY (user_id, day))',
  // (user_id, idem) is unique so the same feedback sent twice is stored and emailed once
  'CREATE TABLE IF NOT EXISTS feedback (' +
    'id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, created_at TEXT NOT NULL, category TEXT NOT NULL, message TEXT NOT NULL, ' +
    "app_version TEXT, browser TEXT, status TEXT NOT NULL DEFAULT 'new', idem TEXT NOT NULL, UNIQUE (user_id, idem))",
  // remembers that the "You're in" email went out, so changing the type later never sends it twice
  'CREATE TABLE IF NOT EXISTS approvals (user_id TEXT PRIMARY KEY, type TEXT NOT NULL, approved_at TEXT NOT NULL, notified_at TEXT)',
];

export async function ensureSchema(env) {
  if (ready) return;
  await env.DB.batch(TABLES.map((sql) => env.DB.prepare(sql)));
  ready = true;
}

// test hook: the table creation is skipped after the first call per process
export const resetSchemaFlag = () => {
  ready = false;
};
