import { createHmac, timingSafeEqual } from 'node:crypto';

/** Replay protection: reject signatures older than 5 minutes. */
const REPLAY_WINDOW_MS = 5 * 60 * 1000;

/**
 * Signs a request body with HMAC-SHA256.
 *
 * The signed string is `${timestamp}.${body}`, which binds the signature to
 * a specific moment — prevents replaying a valid signature from an older request.
 *
 * Signature format: `t=<unix_ms>,v1=<hex_hmac>`
 * (Stripe-compatible; consumers can split on ',' then '=' to parse.)
 *
 * @param ts  Unix timestamp in ms. Defaults to now; injectable for testing.
 */
export function signPayload(secret: string, body: string, ts = Date.now()): string {
  const hmac = createHmac('sha256', secret)
    .update(`${ts}.${body}`)
    .digest('hex');
  return `t=${ts},v1=${hmac}`;
}

/**
 * Verifies an incoming webhook signature header.
 *
 * Rejects if:
 *   - Header is missing or malformed
 *   - Timestamp is outside REPLAY_WINDOW_MS (prevents replay attacks)
 *   - HMAC does not match
 *
 * Uses timingSafeEqual to prevent timing-based side-channel attacks.
 * Both buffers must be the same length — a length mismatch means the
 * comparison always returns false without leaking timing info (caught by try/catch).
 */
export function verifySignature(secret: string, body: string, header: string): boolean {
  if (!header || typeof header !== 'string') return false;

  const parts = Object.fromEntries(
    header.split(',').map(p => {
      const eq = p.indexOf('=');
      return [p.slice(0, eq), p.slice(eq + 1)];
    })
  );

  const rawTs = parts['t'];
  const rawV1 = parts['v1'];
  if (!rawTs || !rawV1) return false;

  const ts = parseInt(rawTs, 10);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  if (Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) return false;

  const expected = signPayload(secret, body, ts);
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}
