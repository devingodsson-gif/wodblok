// The entitlement pass: a small signed note the app keeps so it can work offline for a week.
//   PASS_PRIVATE_JWK  secret (Cloudflare): an ECDSA P-256 private key as JWK JSON, made with tools/accounts/make-pass-key.mjs
// The app holds only the matching public key and checks the signature and the expiry on the device.
// Format: base64url(JSON payload) + "." + base64url(signature). Payload: { v, sub, type, fn, iat, exp }.

import { bytesToB64u, textToB64u } from './util.js';

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
