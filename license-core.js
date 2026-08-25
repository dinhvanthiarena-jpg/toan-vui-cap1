// Shared license-key algorithm used by both the app (main.js) and the
// offline keygen tool (tools/generate-license-key.js). Keeping this in one
// file means the app and the keygen can never drift out of sync.
const crypto = require('crypto');

// Change this to any fixed secret string you like before shipping — anyone
// who obtains this exact string could forge valid keys, so keep the app
// package private the same way you would any other software.
const SECRET = 'ToanVuiCap1-DinhThiAi-K3y-S3cr3t-2026';

// No 0/1/O/I/U to avoid confusion when a customer types the key by hand.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTVWXYZ';

function randomBodyChars(n) {
  const bytes = crypto.randomBytes(n);
  let s = '';
  for (let i = 0; i < n; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

function checksumFor(body) {
  const hash = crypto.createHmac('sha256', SECRET).update(body).digest();
  let s = '';
  for (let i = 0; i < 4; i++) s += ALPHABET[hash[i] % ALPHABET.length];
  return s;
}

function generateKey() {
  const body = randomBodyChars(8);
  const check = checksumFor(body);
  const full = body + check;
  return `TVC1-${full.slice(0, 4)}-${full.slice(4, 8)}-${full.slice(8, 12)}`;
}

function normalizeKey(input) {
  return String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function validateKey(input) {
  let payload = normalizeKey(input);
  if (payload.startsWith('TVC1')) payload = payload.slice(4);
  if (payload.length !== 12) return false;
  const body = payload.slice(0, 8);
  const check = payload.slice(8, 12);
  return checksumFor(body) === check;
}

module.exports = { generateKey, normalizeKey, validateKey };
