// The account seam: the one place in the app that talks to the network (the CLAUDE.md "no runtime network" rule allows this file only).
// It asks the server who is signed in, keeps the signed 7-day pass for working offline, counts active time and sends feedback.
// No work on import; no alert/confirm/prompt; callers keep their own try/catch. Nothing here ever reads or sends a project or a file.
// The server side is docs/accounts.md: GET /api/me, POST /api/usage, POST /api/feedback, DELETE /api/gate-cookie.
import {kv} from './index.js';

// The public half of the pass key (made by tools/accounts/make-pass-key.mjs). It can only check a pass, never make one.
const acPASS_PUBLIC_JWK = {kty: 'EC', crv: 'P-256', x: 'coDfq-RVJxMxT8FK_fCqQUsL96m3u4GybQxojU1cotA', y: 'qsu31uigSzcfJG3jUi6I44e2HPIVGTzexvb2Nu7qeAQ'};
let acKey = acPASS_PUBLIC_JWK;   // tests swap in a key of their own with setKey; the app never does
const acK_PASS = 'wb300_acct_pass', acK_SEEN = 'wb300_acct_seen', acK_USE = 'wb300_acct_use';
const acTRACKED = ['early_access', 'tester'];
const acTYPE_NAMES = {early_access: 'Early access', tester: 'Tester', subscriber: 'Subscriber'};
const acCLOCK_SLACK = 3600_000;   // the clock may be this far behind the last time it was seen before it counts as wound back

const acB64uBytes = s => { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
const acKget = k => { try { return kv.get(k); } catch (e) { return null; } };
const acKset = (k, v) => { try { kv.set(k, v); } catch (e) { /* storage unavailable: the session still works */ } };
const acKdel = k => { try { kv.remove(k); } catch (e) { /* ignore */ } };

// The pass's payload when its signature is ours, else null. Expiry is checked by the caller.
async function acPassPayload(pass) {
  try {
    const [head, sig, extra] = String(pass || '').split('.');
    if (!head || !sig || extra !== undefined) return null;
    const key = await crypto.subtle.importKey('jwk', acKey, {name: 'ECDSA', namedCurve: 'P-256'}, false, ['verify']);
    if (!(await crypto.subtle.verify({name: 'ECDSA', hash: 'SHA-256'}, key, acB64uBytes(sig), new TextEncoder().encode(head)))) return null;
    const p = JSON.parse(new TextDecoder().decode(acB64uBytes(head)));
    return p && p.v === 1 && !p.gate && typeof p.exp === 'number' && typeof p.sub === 'string' ? p : null;
  } catch (e) { return null; }
}

async function acCall(path, init = {}, ms = 8000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(path, {credentials: 'same-origin', cache: 'no-store', signal: ctl.signal, ...init});
    let body = null;
    try { body = await r.json(); } catch (e) { /* not JSON */ }
    return {status: r.status, body};
  } finally { clearTimeout(t); }
}

const acTypeName = t => acTYPE_NAMES[t] || '';
const acBrowserName = () => { const u = navigator.userAgent || ''; return /Edg\//.test(u) ? 'Edge' : /Firefox\//.test(u) ? 'Firefox' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'Other'; };
// The site the app was opened from: app.example.com -> example.com. null when the app is not on an "app." host (local, previews).
const acSiteUrl = () => { const m = /^app\.(.+)$/.exec(location.hostname); return m ? location.protocol + '//' + m[1] : null; };

// The account server can only be there when the app is served over http(s) from a real host: never from a file, and not from a local dev server.
const acHosted = () => /^https?:$/.test(location.protocol) && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(location.hostname);

// Who is signed in and may the app run?  state: 'off' (no account system here, or no way to tell: nothing is asked of the person),
// 'ok' (signed in and approved, online or on a valid pass), 'locked' (reason: signedout | notapproved | expired | clock).
async function acCheck(now = Date.now()) {
  if (!acHosted()) return {state: 'off'};   // nothing is asked, and no request is made, so local copies and tests stay silent
  let res = null;
  try { res = await acCall('/api/me'); } catch (e) { res = null; }
  if (res && res.body && typeof res.body === 'object' && 'ok' in res.body) {
    const b = res.body;
    if (res.status === 200 && b.ok && b.approved) {
      if (typeof b.pass === 'string' && (await acPassPayload(b.pass))) { acKset(acK_PASS, b.pass); acKset(acK_SEEN, String(now)); }
      return {state: 'ok', name: String(b.firstName || ''), email: String(b.email || ''), type: String(b.type || ''), until: null, online: true};
    }
    if (!b.gated) return {state: 'off'};
    return {state: 'locked', reason: res.status === 401 ? 'signedout' : 'notapproved'};
  }
  if (res) return {state: 'off'};   // something answered that is not the account server (a dev server, a preview): nothing to enforce
  // no connection: the stored pass decides
  const pass = acKget(acK_PASS);
  if (!pass) return {state: 'off'};
  const p = await acPassPayload(pass);
  if (!p) return {state: 'locked', reason: 'expired'};
  const seen = Number(acKget(acK_SEEN)) || 0;
  if (now < seen - acCLOCK_SLACK) return {state: 'locked', reason: 'clock'};
  acKset(acK_SEEN, String(Math.max(seen, now)));
  if (p.exp * 1000 < now) return {state: 'locked', reason: 'expired'};
  return {state: 'ok', name: String(p.fn || ''), email: '', type: String(p.type || ''), until: p.exp * 1000, online: false};
}

// ---------------------------------------------------------------- active time
// One record for today: seconds the app was really in use and how many times it was opened. Sent as running totals, so a retry is harmless.
const acUtcDay = now => new Date(now).toISOString().slice(0, 10);
function acUseGet(now) {
  try { const r = JSON.parse(acKget(acK_USE) || 'null'); if (r && r.day === acUtcDay(now) && r.seconds >= 0 && r.sessions >= 0) return r; } catch (e) { /* start a new day */ }
  return {day: acUtcDay(now), seconds: 0, sessions: 0};
}
let acLastSent = '';
const acUsage = {
  tracked: type => acTRACKED.includes(type),
  open(now = Date.now()) { const r = acUseGet(now); r.sessions++; acKset(acK_USE, JSON.stringify(r)); return r; },
  add(seconds, now = Date.now()) { const r = acUseGet(now); r.seconds = Math.min(86400, r.seconds + seconds); acKset(acK_USE, JSON.stringify(r)); return r; },
  get: (now = Date.now()) => acUseGet(now),
  // Sends today's totals when they changed since the last send. Resolves true when the server has them.
  async send(version, {keepalive = false, now = Date.now()} = {}) {
    const r = acUseGet(now), body = JSON.stringify({day: r.day, seconds: Math.floor(r.seconds), sessions: r.sessions, version, browser: acBrowserName()});
    if (body === acLastSent) return true;
    try {
      const res = await acCall('/api/usage', {method: 'POST', headers: {'content-type': 'application/json'}, body, keepalive});
      if (res.status === 200 && res.body && res.body.ok) { acLastSent = body; return true; }
    } catch (e) { /* offline: the totals stay stored and go with the next send */ }
    return false;
  },
};

// ---------------------------------------------------------------- feedback
const acNewKey = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, b => b.toString(16).padStart(2, '0')).join(''); };
// { ok: true } or { ok: false, error: signedout | notapproved | limit | invalid | failed | offline }. The same `key` twice is stored once.
async function acSendFeedback({key, category, message, version}) {
  try {
    const res = await acCall('/api/feedback', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({key, category, message, version, browser: acBrowserName()})});
    if (res.status === 200 && res.body && res.body.ok) return {ok: true};
    const e = res.status === 401 ? 'signedout' : res.status === 403 ? 'notapproved' : res.status === 429 ? 'limit' : res.status === 400 ? 'invalid' : 'failed';
    return {ok: false, error: e};
  } catch (e) { return {ok: false, error: 'offline'}; }
}

// Clears the app's cookie and what was kept on this device, and says where to go to finish signing out.
async function acSignOut() {
  try { await acCall('/api/gate-cookie', {method: 'DELETE'}); } catch (e) { /* the cookie ends by itself within a day */ }
  acKdel(acK_PASS); acKdel(acK_SEEN); acKdel(acK_USE); acLastSent = '';
  const s = acSiteUrl();
  return s ? s + '/?signout=1' : null;
}

// The accent colour the person picked, handed to the website so it can use the same colour. A plain cookie for the whole domain
// (wodblok.com and app.wodblok.com): six hex digits and nothing else, no id and no project data. No colour (the built-in Oak) clears it.
// Only on the hosted app; local copies, tests and previews set nothing.
let acLastAccent = null;
function acShareAccent(hex) {
  if (!acHosted() || !acSiteUrl()) return;
  const ok = /^#[0-9a-f]{6}$/i.test(hex || '');
  if (acLastAccent === (ok ? hex.toLowerCase() : '')) return;   // the colour picker calls this on every move
  acLastAccent = ok ? hex.toLowerCase() : '';
  try {
    document.cookie = 'wb_accent=' + (ok ? hex.slice(1).toLowerCase() : '') + '; Domain=.' + location.hostname.replace(/^app\./, '') +
      '; Path=/; Max-Age=' + (ok ? 31536000 : 0) + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  } catch (e) { /* cookies blocked: the website keeps its own colour */ }
}

const acAccount = {shareAccent: acShareAccent, check: acCheck, usage: acUsage, sendFeedback: acSendFeedback, newKey: acNewKey, signOut: acSignOut, typeName: acTypeName, siteUrl: acSiteUrl, passPayload: acPassPayload, setKey: j => { acKey = j || acPASS_PUBLIC_JWK; }};
export {acAccount};
