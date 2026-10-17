// The entitlement pass: a small signed note the app keeps so it can work offline for a week.
//   PASS_PRIVATE_JWK  secret (Cloudflare): an ECDSA P-256 private key as JWK JSON, made with tools/accounts/make-pass-key.mjs
// The app holds only the matching public key and checks the signature and the expiry on the device.
// Format: base64url(JSON payload) + "." + base64url(signature). Payload: { v, sub, type, fn, iat, exp }.

import { b64uToBytes, b64uToText, bytesToB64u, textToB64u } from './util.js';

export const PASS_SECONDS = 7 * 24 * 3600;
const alg = { name: 'ECDSA', hash: 'SHA-256' };

export async function signPass(env, { sub, type, fn }, nowMs = Date.now()) {
  if (!env.PASS_PRIVATE_JWK) return null;
  try {
    const key = await crypto.subtle.importKey('jwk', JSON.parse(env.PASS_PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const iat = Math.floor(nowMs / 1000);
    const head = textToB64u(JSON.stringify({ v: 1, sub, type, fn: fn || '', iat, exp: iat + PASS_SECONDS }));
    const sig = new Uint8Array(await crypto.subtle.sign(alg, key, new TextEncoder().encode(head)));
    return head + '.' + bytesToB64u(sig);
  } catch (e) {
    console.error('Pass not signed:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

// The gate cookie: Clerk's own session cookie only exists on the host that ran Clerk's script (wodblok.com), so the app host
// never sees it. The site trades a valid Clerk session for this signed note, set for the whole domain.
// Same key as the pass, but marked gate:1, so a pass can never be used as a gate cookie. One day; the site renews it each time it is opened.
export const GATE_SECONDS = 24 * 3600;
export const GATE_COOKIE = 'wb_gate';

export async function signGate(env, { sub, type, fn, em }, nowMs = Date.now()) {
  if (!env.PASS_PRIVATE_JWK) return null;
  try {
    const key = await crypto.subtle.importKey('jwk', JSON.parse(env.PASS_PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const iat = Math.floor(nowMs / 1000);
    const head = textToB64u(JSON.stringify({ v: 1, gate: 1, sub, type, fn: fn || '', em: em || '', iat, exp: iat + GATE_SECONDS }));
    const sig = new Uint8Array(await crypto.subtle.sign(alg, key, new TextEncoder().encode(head)));
    return head + '.' + bytesToB64u(sig);
  } catch (e) {
    console.error('Gate cookie not signed:', e instanceof Error ? e.message : String(e));
    return null;
  }
}

// The payload of a valid, unexpired gate cookie, or null. The public key is the private JWK without its secret part.
export async function verifyGate(env, token, nowMs = Date.now()) {
  if (!env.PASS_PRIVATE_JWK || !token) return null;
  try {
    const [head, sig, extra] = String(token).split('.');
    if (!head || !sig || extra !== undefined) return null;
    const { kty, crv, x, y } = JSON.parse(env.PASS_PRIVATE_JWK);
    const key = await crypto.subtle.importKey('jwk', { kty, crv, x, y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    if (!(await crypto.subtle.verify(alg, key, b64uToBytes(sig), new TextEncoder().encode(head)))) return null;
    const p = JSON.parse(b64uToText(head));
    if (p.v !== 1 || p.gate !== 1 || typeof p.sub !== 'string' || !p.sub) return null;
    if (typeof p.exp !== 'number' || p.exp * 1000 < nowMs) return null;
    return p;
  } catch {
    return null;
  }
}
