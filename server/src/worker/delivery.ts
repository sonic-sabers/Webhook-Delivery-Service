import { signPayload } from '../signing/hmac';

export interface DeliveryResult {
  statusCode: number | null;
  error: string | null;
  success: boolean;
  shouldRetry: boolean;
}

export function classifyResponse(statusCode: number | null): { success: boolean; shouldRetry: boolean } {
  if (statusCode === null) return { success: false, shouldRetry: true };
  if (statusCode >= 200 && statusCode < 300) return { success: true, shouldRetry: false };
  if (statusCode === 408 || statusCode === 429) return { success: false, shouldRetry: true };
  if (statusCode >= 400 && statusCode < 500) return { success: false, shouldRetry: false };
  return { success: false, shouldRetry: true }; // 5xx and anything unexpected
}

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

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    const { success, shouldRetry } = classifyResponse(res.status);
    return { statusCode: res.status, error: null, success, shouldRetry };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return { statusCode: null, error, success: false, shouldRetry: true };
  } finally {
    clearTimeout(timer);
  }
}
