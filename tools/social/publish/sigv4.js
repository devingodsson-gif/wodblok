// AWS Signature V4 for S3-style requests (Cloudflare R2 speaks this). Pure functions on node's crypto: no library.
const crypto = require('crypto');

const hmac = (key, s) => crypto.createHmac('sha256', key).update(s).digest();
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());

// req: { method, host, path ('/bucket/key', not yet encoded), query ({}), headers ({} extra, lowercase names), body (string|Buffer) }
// creds: { accessKeyId, secretAccessKey }. Returns { headers (all to send), url path (encoded) }
function sign(req, creds, { region = 'auto', service = 's3', now = new Date(), payloadHash } = {}) {
  const amz = now.toISOString().replace(/[:-]|\.\d{3}/g, '');   // 20150830T123600Z
  const day = amz.slice(0, 8);
  const body = req.body === undefined ? '' : req.body;
  const ph = payloadHash || sha(body);
  const headers = { host: req.host, 'x-amz-date': amz, ...(service === 's3' ? { 'x-amz-content-sha256': ph } : {}), ...(req.headers || {}) };
  const names = Object.keys(headers).map(h => h.toLowerCase()).sort();
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()]));
  const canonPath = req.path.split('/').map(enc).join('/');     // '/bucket/key' -> each part encoded
  const q = Object.entries(req.query || {}).map(([k, v]) => [enc(k), enc(v)]).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).map(([k, v]) => `${k}=${v}`).join('&');
  const canonical = [req.method, canonPath, q, names.map(n => `${n}:${lower[n]}\n`).join(''), names.join(';'), ph].join('\n');
  const scope = `${day}/${region}/${service}/aws4_request`;
  const toSign = ['AWS4-HMAC-SHA256', amz, scope, sha(canonical)].join('\n');
  const key = hmac(hmac(hmac(hmac('AWS4' + creds.secretAccessKey, day), region), service), 'aws4_request');
  const signature = crypto.createHmac('sha256', key).update(toSign).digest('hex');
  lower.authorization = `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}`;
  return { headers: lower, path: canonPath, query: q, signature };
}

module.exports = { sign };
