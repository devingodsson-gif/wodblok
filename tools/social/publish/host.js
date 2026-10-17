// A short-lived public home for the approved pictures: Instagram only fetches images from a public web address.
// Cloudflare R2 through its S3-compatible API. Pictures are uploaded, posted, then deleted (see post.js), so nothing lingers.
// Settings come from environment variables / GitHub secrets, never from a file (the repo is public):
//   WB_R2_ACCOUNT_ID, WB_R2_ACCESS_KEY_ID, WB_R2_SECRET_ACCESS_KEY, WB_R2_BUCKET,
//   WB_R2_PUBLIC_BASE  (the bucket's public address, e.g. https://pub-xxxx.r2.dev, no trailing slash)
const { sign } = require('./sigv4');

const NEED = ['WB_R2_ACCOUNT_ID', 'WB_R2_ACCESS_KEY_ID', 'WB_R2_SECRET_ACCESS_KEY', 'WB_R2_BUCKET', 'WB_R2_PUBLIC_BASE'];

function missing(env) { return NEED.filter(k => !env[k]); }

function makeHost(env, fetchFn = fetch, now = () => new Date()) {
  const gone = missing(env);
  if (gone.length) throw new Error('media host: set ' + gone.join(', ') + ' (GitHub secrets)');
  const base = env.WB_R2_PUBLIC_BASE.replace(/\/+$/, '');
  if (!/^https:\/\//.test(base)) throw new Error('media host: WB_R2_PUBLIC_BASE must start with https://');
  const host = `${env.WB_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const creds = { accessKeyId: env.WB_R2_ACCESS_KEY_ID, secretAccessKey: env.WB_R2_SECRET_ACCESS_KEY };
  const call = async (method, key, body, type) => {
    const path = `/${env.WB_R2_BUCKET}/${key}`;
    const s = sign({ method, host, path, headers: type ? { 'content-type': type } : {}, body }, creds, { now: now() });
    const { host: _h, ...send } = s.headers;     // fetch sets Host itself
    const res = await fetchFn(`https://${host}${s.path}`, { method, headers: send, body });
    if (!res.ok) { const t = await res.text(); throw new Error(`media host: ${method} ${key} failed, HTTP ${res.status} ${t.slice(0, 200).replace(creds.secretAccessKey, '***')}`); }
  };
  return {
    // returns the public address of the uploaded picture
    async upload(buffer, key, contentType) { await call('PUT', key, buffer, contentType); return `${base}/${key.split('/').map(encodeURIComponent).join('/')}`; },
    async remove(key) { await call('DELETE', key); },
  };
}

module.exports = { makeHost, missing, NEED };
