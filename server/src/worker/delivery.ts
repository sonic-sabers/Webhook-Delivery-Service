import { signPayload } from '../signing/hmac';
import { deliveryLogger, c } from '../logging/logger';

export interface DeliveryResult {
  /** HTTP status code from the subscriber, or null on network/timeout error. */
  statusCode: number | null;
  /** Error message string on failure, null on success. */
  error: string | null;
  success: boolean;
  shouldRetry: boolean;
}

/**
 * Maps an HTTP status code to delivery outcome.
 *
 * Retry policy:
 *   null (timeout/network) → retry — transient infrastructure failure
 *   2xx                    → success
 *   408, 429               → retry — timeout and rate-limit are transient
 *   4xx (other)            → no retry — caller error, retrying won't help
 *   5xx / unexpected       → retry — server error, may recover
 */
export function classifyResponse(statusCode: number | null): { success: boolean; shouldRetry: boolean } {
  if (statusCode === null) return { success: false, shouldRetry: true };
  if (statusCode >= 200 && statusCode < 300) return { success: true, shouldRetry: false };
  if (statusCode === 408 || statusCode === 429) return { success: false, shouldRetry: true };
  if (statusCode >= 400 && statusCode < 500) return { success: false, shouldRetry: false };
  return { success: false, shouldRetry: true }; // 5xx and anything unexpected
}

/**
 * Makes a single HTTP POST delivery attempt to a subscriber endpoint.
 *
 * Outbound headers:
 *   x-webhook-id          — stable event ID (same across all retries)
 *   x-webhook-delivery-id — unique per attempt (useful for idempotency on subscriber side)
 *   x-webhook-signature   — HMAC-SHA256 signature (only when subscription has a secret)
 *
 * Network errors and AbortController timeouts are caught and returned as
 * shouldRetry=true results so the worker can schedule a retry.
 *
 * @param timeoutMs  Max ms to wait for a response before aborting. Default 5 s.
 */
export async function deliverPayload(
  url: string,
  secret: string | null,
  attemptId: string,
  eventId: string,
  eventType: string,
  payload: unknown,
  timeoutMs = 5000
): Promise<DeliveryResult> {
  const body = JSON.stringify({ id: eventId, type: eventType, payload });
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-webhook-id': eventId,
    'x-webhook-delivery-id': attemptId,
  };

  if (secret) {
    headers['x-webhook-signature'] = signPayload(secret, body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  const log = deliveryLogger.child({ attemptId: c.id(attemptId), eventId: c.id(eventId), eventType });

  log.debug({ url }, `→ POST ${c.url(url)} [${eventType}]`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    const ms = Date.now() - start;
    const { success, shouldRetry } = classifyResponse(res.status);
    const level = success ? 'info' : shouldRetry ? 'warn' : 'error';
    log[level](
      { url, status: res.status, ms },
      `← ${c.status(res.status)} ${c.url(url)} ${c.ms(ms)}`
    );
    return { statusCode: res.status, error: null, success, shouldRetry };
  } catch (err: unknown) {
    const ms = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    log.error({ url, error, ms }, `✗ delivery failed ${c.url(url)} — ${error} ${c.ms(ms)}`);
    return { statusCode: null, error, success: false, shouldRetry: true };
  } finally {
    clearTimeout(timer);
  }
}
