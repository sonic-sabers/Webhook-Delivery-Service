import pLimit from 'p-limit';
import { IQueue } from '../queue/IQueue';
import { getSubscription } from '../db/queries/subscriptions';
import { getEvent } from '../db/queries/events';
import { DeliveryAttempt } from '../db/queries/attempts';
import { deliverPayload } from './delivery';
import { calcNextRetryAt } from './backoff';

const BATCH_SIZE = 10;
const CONCURRENCY_LIMIT = 5; // max simultaneous outbound HTTP calls per tick

export function startWorker(
  queue: IQueue,
  intervalMs: number,
  inflightTimeoutMs: number
): () => void {
  const tick = async () => {
    // Reset rows stuck in_flight (claimed_at < cutoff) — covers process crashes mid-delivery
    queue.resetStaleInflight(inflightTimeoutMs);

    const attempts = queue.claim(BATCH_SIZE);
    if (attempts.length === 0) return;

    const limit = pLimit(CONCURRENCY_LIMIT);
    await Promise.allSettled(
      attempts.map(attempt =>
        limit(() => processAttempt(queue, attempt))
      )
    );
  };

  const handle = setInterval(() => {
    tick().catch(err => console.error('[worker] tick error:', err));
  }, intervalMs);

  return () => clearInterval(handle);
}

async function processAttempt(queue: IQueue, attempt: DeliveryAttempt): Promise<void> {
  const event = getEvent(attempt.event_id);
  const sub = getSubscription(attempt.subscription_id);

  if (!event || !sub) {
    queue.markFailed(attempt.id, {
      statusCode: null,
      error: 'event or subscription not found',
      success: false,
      shouldRetry: false,
    });
    return;
  }

  const result = await deliverPayload(
    sub.url,
    sub.secret,
    attempt.id,           // x-webhook-delivery-id
    event.id,
    event.type,
    JSON.parse(event.payload)
  );

  if (result.success) {
    queue.markDelivered(attempt.id);
    return;
  }

  const nextAttemptNumber = attempt.attempt_number + 1;

  if (!result.shouldRetry || nextAttemptNumber > attempt.max_attempts) {
    queue.markDead(attempt.id, result);
    return;
  }

  queue.scheduleRetry(
    attempt.id,
    calcNextRetryAt(nextAttemptNumber),
    nextAttemptNumber,
    result
  );
}
