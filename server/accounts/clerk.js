// Checks a Clerk session token (a signed JWT) and turns it into a small session object.
// Settings (Cloudflare environment variables, never in the repo):
//   CLERK_ISSUER              the Frontend API URL, e.g. https://clerk.wodblok.com (required)
//   CLERK_JWT_KEY             optional PEM public key from the Clerk dashboard; when set, no network call is needed
//   CLERK_AUTHORIZED_PARTIES  optional comma list of allowed token origins (the "azp" claim)
// Clerk must be set up to put three extra values in the session token (docs/accounts.md):
//   { "type": "{{user.public_metadata.type}}", "fn": "{{user.first_name}}", "em": "{{user.primary_email_address}}" }

import { APPROVED, b64uToBytes, b64uToText } from './util.js';

const SKEW = 5; // seconds of clock difference tolerated
let jwks = { at: 0, keys: [] };

const rsa = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };

async function importPem(pem) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('spki', der, rsa, false, ['verify']);
}

async function keysFor(env, kid, force) {
  if (env.CLERK_JWT_KEY) return [await importPem(env.CLERK_JWT_KEY)];
  const fresh = Date.now() - jwks.at < 3600_000;
  if (!force && fresh && jwks.keys.some((k) => !kid || k.kid === kid)) return jwks.keys.filter((k) => !kid || k.kid === kid).map((k) => k.key);
  const res = await fetch(String(env.CLERK_ISSUER).replace(/\/+$/, '') + '/.well-known/jwks.json');
  if (!res.ok) return [];
  const list = (await res.json()).keys || [];
  const keys = [];
  for (const jwk of list) {
    if (jwk.kty !== 'RSA') continue;
    try {
      keys.push({ kid: jwk.kid, key: await crypto.subtle.importKey('jwk', jwk, rsa, false, ['verify']) });
    } catch {
      /* skip a key we cannot read */
    }
  }
  jwks = { at: Date.now(), keys };
  return keys.filter((k) => !kid || k.kid === kid).map((k) => k.key);
}

// Returns the token's claims, or null for anything that is not a valid, current token from our Clerk instance.
export async function verifyToken(token, env, nowMs = Date.now()) {
  if (!env.CLERK_ISSUER || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  let header, claims;
  try {
    header = JSON.parse(b64uToText(parts[0]));
    claims = JSON.parse(b64uToText(parts[1]));
  } catch {
    return null;
  }
  if (header.alg !== 'RS256') return null;
  const signed = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  const sig = b64uToBytes(parts[2]);
  let ok = false;
  try {
    for (const force of [false, true]) {
      for (const key of await keysFor(env, header.kid, force)) {
        if (await crypto.subtle.verify(rsa, key, sig, signed)) {
          ok = true;
          break;
        }
      }
      if (ok || env.CLERK_JWT_KEY) break; // a second, forced key fetch only helps after a key rotation
    }
  } catch {
    return null;
  }
  if (!ok) return null;
  const now = nowMs / 1000;
  if (typeof claims.exp !== 'number' || claims.exp < now - SKEW) return null;
  if (typeof claims.nbf === 'number' && claims.nbf > now + SKEW) return null;
  if (String(claims.iss || '').replace(/\/+$/, '') !== String(env.CLERK_ISSUER).replace(/\/+$/, '')) return null;
  const parties = String(env.CLERK_AUTHORIZED_PARTIES || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (parties.length && claims.azp && !parties.includes(claims.azp)) return null;
  if (typeof claims.sub !== 'string' || !claims.sub) return null;
  return claims;
}

function tokenFrom(request) {
  const auth = request.headers.get('authorization') || '';
  if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)__session=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

// { userId, type, firstName, email } for a valid token, or null.
// type is one of early_access | tester | subscriber | none | waitlist (no value set yet).
export async function getSession(request, env, nowMs) {
  const claims = await verifyToken(tokenFrom(request), env, nowMs);
  if (!claims) return null;
  const raw = String(claims.type || '').toLowerCase();
  const type = APPROVED.includes(raw) ? raw : raw === 'none' ? 'none' : 'waitlist';
  return { userId: claims.sub, type, firstName: String(claims.fn || '').slice(0, 80), email: String(claims.em || '').slice(0, 254) };
}

export const isApproved = (s) => !!s && APPROVED.includes(s.type);
