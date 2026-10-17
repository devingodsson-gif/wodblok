// Small helpers shared by the account functions (Cloudflare Pages Functions, WebCrypto only).
// No secrets live in this file: keys and tokens come from Cloudflare environment variables (docs/accounts.md).

export const APPROVED = ['early_access', 'tester', 'subscriber'];
// Usage time is recorded only for these (subscribers are not tracked).
export const TRACKED = ['early_access', 'tester'];

const enc = new TextEncoder();
const dec = new TextDecoder();

export const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export function bytesToB64u(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function b64uToBytes(str) {
  let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
export const textToB64u = (t) => bytesToB64u(enc.encode(t));
export const b64uToText = (s) => dec.decode(b64uToBytes(s));

// Read a JSON request body with a size cap. Returns null when it is too big or not an object.
export async function readJson(request, maxBytes = 8192) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > maxBytes) return null;
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

// Same-site check used by every POST, as the waitlist function does.
export function sameSite(request) {
  const origin = request.headers.get('origin');
  return !origin || new URL(origin).host === new URL(request.url).host;
}

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Is this host behind the sign-in gate? GATE_HOSTS is a comma list; a leading "*." matches subdomains.
export function gatedHost(env, host) {
  const list = String(env.GATE_HOSTS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  const h = String(host || '').toLowerCase();
  return list.some((g) => (g.startsWith('*.') ? h.endsWith(g.slice(1)) : h === g));
}
