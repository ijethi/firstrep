/**
 * Base64 → bytes (B-28) — PURE, dependency-free (node-testable). Used by the
 * progress-photo upload adapter: the Supabase-RN-recommended path is
 * expo-file-system readAsStringAsync(base64) → Uint8Array → storage.upload,
 * which avoids the flaky `fetch(uri).blob()/arrayBuffer()` on React Native.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i += 1) LOOKUP[CHARS.charCodeAt(i)] = i;

/** Decode a standard base64 string to a Uint8Array. Ignores whitespace. */
export function base64ToUint8Array(base64: string): Uint8Array {
  const s = base64.replace(/\s/g, '');
  let len = Math.floor((s.length * 3) / 4);
  if (s.length > 0 && s[s.length - 1] === '=') len -= 1;
  if (s.length > 1 && s[s.length - 2] === '=') len -= 1;

  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < s.length; i += 4) {
    const e1 = LOOKUP[s.charCodeAt(i)];
    const e2 = LOOKUP[s.charCodeAt(i + 1)];
    const e3 = LOOKUP[s.charCodeAt(i + 2)];
    const e4 = LOOKUP[s.charCodeAt(i + 3)];
    if (p < len) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < len) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < len) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}
