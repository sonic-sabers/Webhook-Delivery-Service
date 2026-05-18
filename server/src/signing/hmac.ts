import { createHmac, timingSafeEqual } from 'node:crypto';

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function signPayload(secret: string, body: string, ts = Date.now()): string {
  const hmac = createHmac('sha256', secret)
    .update(`${ts}.${body}`)
    .digest('hex');
  return `t=${ts},v1=${hmac}`;
}

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
    // timingSafeEqual prevents timing attacks; buffers must be same length
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}
