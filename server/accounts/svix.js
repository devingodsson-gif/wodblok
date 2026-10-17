// Checks the signature on a Clerk webhook (Clerk sends them through Svix).
//   CLERK_WEBHOOK_SECRET  secret (Cloudflare), starts with "whsec_"
// The signed text is "<svix-id>.<svix-timestamp>.<raw body>", signed with HMAC-SHA256 using the base64 part of the secret.

import { b64uToBytes, bytesToB64u } from './util.js';

const TOLERANCE = 300; // seconds

function equal(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function verifyWebhook(rawBody, headers, secret, nowMs = Date.now()) {
  const id = headers.get('svix-id');
  const ts = headers.get('svix-timestamp');
  const sigs = headers.get('svix-signature');
  if (!secret || !id || !ts || !sigs) return false;
  if (Math.abs(nowMs / 1000 - Number(ts)) > TOLERANCE) return false;
  try {
    const raw = b64uToBytes(String(secret).replace(/^whsec_/, ''));
    const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${rawBody}`)));
    // standard base64 in the header; compare after normalising to the url-safe form
    const want = bytesToB64u(mac);
    return sigs.split(' ').some((part) => {
      const [version, value] = part.split(',');
      return version === 'v1' && value && equal(want, value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
    });
  } catch {
    return false;
  }
}
