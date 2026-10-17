// Fans one approved post out to many accounts. Adapters are looked up by platform name, so a new platform is one new file here plus a line in ADAPTERS.
// One account failing never stops the others; every account gets its own result line.
const instagram = require('./instagram');

const ADAPTERS = { instagram };     // add facebook, x, tiktok here later

function validateAccounts(list) {
  if (!Array.isArray(list) || !list.length) throw new Error('accounts: the list is empty');
  const seen = new Set();
  for (const a of list) {
    if (!a || !/^[a-z0-9-]+$/.test(a.id || '')) throw new Error(`accounts: id "${a && a.id}" must be lowercase letters, numbers and dashes`);
    if (seen.has(a.id)) throw new Error(`accounts: "${a.id}" appears twice`);
    seen.add(a.id);
    if (!ADAPTERS[a.platform]) throw new Error(`accounts: "${a.id}" has platform "${a.platform}"; supported: ${Object.keys(ADAPTERS).join(', ')}`);
    for (const k of ['tokenEnv', 'userIdEnv']) if (!/^[A-Z][A-Z0-9_]*$/.test(a[k] || '')) throw new Error(`accounts: "${a.id}" needs ${k} to be a secret name like WB_IG_TOKEN`);
  }
  return list;
}

// "all" or "id,id" -> the enabled accounts chosen
function pickAccounts(list, text) {
  const on = list.filter(a => a.enabled !== false);
  const want = String(text || 'all').split(/[\s,]+/).filter(Boolean);
  if (!want.length || want.includes('all')) { if (!on.length) throw new Error('accounts: none are enabled'); return on; }
  const out = want.map(id => {
    const a = list.find(x => x.id === id);
    if (!a) throw new Error(`accounts: "${id}" is not in accounts.js. Names: ${list.map(x => x.id).join(', ')}`);
    if (a.enabled === false) throw new Error(`accounts: "${id}" is switched off (enabled: false) in accounts.js`);
    return a;
  });
  return [...new Set(out)];
}

// Which secrets are missing for these accounts (names only, never values)
const missingSecrets = (accounts, env) => accounts.flatMap(a => [a.tokenEnv, a.userIdEnv].filter(k => !env[k]).map(k => `${k} (for ${a.id})`));

// post: { caption, images: [{ url }] }. real=false only checks and reports; nothing is called.
async function publishAll(post, accounts, { env, real, fetchFn, wait, log = () => {} }) {
  const results = [];
  for (const a of accounts) {
    const ad = ADAPTERS[a.platform];
    const bad = ad.check(post);
    if (bad.length) { results.push({ account: a.id, ok: false, error: bad.join('; ') }); continue; }
    if (!real) { results.push({ account: a.id, ok: true, test: true }); continue; }
    try {
      const r = await ad.publish(post, { token: env[a.tokenEnv], userId: env[a.userIdEnv], fetchFn, wait, log });
      results.push({ account: a.id, ok: true, ...r });
    } catch (e) {
      results.push({ account: a.id, ok: false, error: String(e.message || e) });
    }
  }
  return results;
}

module.exports = { ADAPTERS, validateAccounts, pickAccounts, missingSecrets, publishAll };
