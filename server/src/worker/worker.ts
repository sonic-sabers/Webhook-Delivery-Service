import pLimit from 'p-limit';
import { IQueue } from '../queue/IQueue';
import { getSubscription } from '../db/queries/subscriptions';
import { getEvent } from '../db/queries/events';
import { DeliveryAttempt } from '../db/queries/attempts';
import { deliverPayload } from './delivery';
import { calcNextRetryAt } from './backoff';
import { workerLogger } from '../logging/logger';

const BATCH_SIZE = 10;
const CONCURRENCY_LIMIT = 5;

export function startWorker(
  queue: IQueue,
  intervalMs: number,
  inflightTimeoutMs: number
): () => void {
  const tick = async () => {
    queue.resetStaleInflight(inflightTimeoutMs);

    const attempts = queue.claim(BATCH_SIZE);
    if (attempts.length === 0) return;

    workerLogger.debug(`claimed ${attempts.length} attempt(s)`);

    const limit = pLimit(CONCURRENCY_LIMIT);
    await Promise.allSettled(
      attempts.map(attempt =>
        limit(() => processAttempt(queue, attempt))
      )
    );
  };

  const handle = setInterval(() => {
    tick().catch(err => workerLogger.error({ err }, '[worker] tick error'));
  }, intervalMs);

  return () => clearInterval(handle);
}

async function processAttempt(queue: IQueue, attempt: DeliveryAttempt): Promise<void> {
  const event = getEvent(attempt.event_id);
  const sub = getSubscription(attempt.subscription_id);

  const log = workerLogger.child({ attemptId: attempt.id.slice(0, 8), eventId: attempt.event_id.slice(0, 8) });

  if (!event || !sub) {
    log.error('event or subscription not found — marking failed');
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
    attempt.id,
    event.id,
    event.type,
    JSON.parse(event.payload)
  );

  if (result.success) {
    log.info({ url: sub.url }, 'delivered ✓');
    queue.markDelivered(attempt.id);
    return;
  }

  const nextAttemptNumber = attempt.attempt_number + 1;

  if (!result.shouldRetry || nextAttemptNumber > attempt.max_attempts) {
    log.error({ url: sub.url, status: result.statusCode }, `dead — no retry (attempt ${attempt.attempt_number}/${attempt.max_attempts})`);
    queue.markDead(attempt.id, result);
    return;
  }

  const retryAt = calcNextRetryAt(nextAttemptNumber);
  log.warn({ url: sub.url, nextAttempt: nextAttemptNumber, retryAt }, `retry scheduled (attempt ${nextAttemptNumber}/${attempt.max_attempts})`);
  queue.scheduleRetry(
    attempt.id,
    retryAt,
    nextAttemptNumber,
    result
  );
}
