// Makes the key pair for the 7-day offline pass (docs/accounts.md). Run: node tools/accounts/make-pass-key.mjs
// Prints two JSON lines. The PRIVATE one goes into Cloudflare as the secret PASS_PRIVATE_JWK and nowhere else
// (never in the repo, never in chat). The PUBLIC one is safe to commit: the app uses it to check the pass.
import { webcrypto as crypto } from 'node:crypto';

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
console.log('PASS_PRIVATE_JWK (secret, Cloudflare only):');
console.log(JSON.stringify(priv));
console.log('\nPASS_PUBLIC_JWK (public, goes into the app):');
console.log(JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }));
