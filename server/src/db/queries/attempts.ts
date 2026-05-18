import { getDb } from '../database';
import { v4 as uuid } from 'uuid';

export interface DeliveryAttempt {
  id: string;
  event_id: string;
  subscription_id: string;
  status: 'pending' | 'in_flight' | 'delivered' | 'failed' | 'dead';
  attempt_number: number;
  max_attempts: number;
  next_attempt_at: number;
  claimed_at: number | null;
  last_status_code: number | null;
  last_error: string | null;
  delivered_at: number | null;
  created_at: number;
}

export function getAttempt(id: string): DeliveryAttempt | undefined {
  return getDb().prepare('SELECT * FROM delivery_attempts WHERE id = ?').get(id) as DeliveryAttempt | undefined;
}

export function getAttemptsByEvent(eventId: string): DeliveryAttempt[] {
  return getDb().prepare(
    'SELECT * FROM delivery_attempts WHERE event_id = ? ORDER BY created_at ASC'
  ).all(eventId) as DeliveryAttempt[];
}

// Atomic claim: transaction ensures no two concurrent calls claim the same rows.
export function claimPendingBatch(batchSize: number): DeliveryAttempt[] {
  const now = Date.now();

  const claim = getDb().transaction(() => {
    const rows = getDb().prepare(`
      SELECT * FROM delivery_attempts
      WHERE status = 'pending' AND next_attempt_at <= ?
      LIMIT ?
    `).all(now, batchSize) as DeliveryAttempt[];

    if (rows.length === 0) return rows;

    const ids = rows.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    getDb().prepare(`
      UPDATE delivery_attempts
      SET status = 'in_flight', claimed_at = ?
      WHERE id IN (${placeholders})
    `).run(now, ...ids);

    return rows;
  });

  return claim();
}

export function markDelivered(id: string): void {
  getDb().prepare(`
    UPDATE delivery_attempts
    SET status = 'delivered', delivered_at = ?, claimed_at = NULL
    WHERE id = ?
  `).run(Date.now(), id);
}

export function markFailed(id: string, statusCode: number | null, error: string | null): void {
  getDb().prepare(`
    UPDATE delivery_attempts
    SET status = 'failed', last_status_code = ?, last_error = ?, claimed_at = NULL
    WHERE id = ?
  `).run(statusCode, error, id);
}

export function markDead(id: string, statusCode: number | null, error: string | null): void {
  getDb().prepare(`
    UPDATE delivery_attempts
    SET status = 'dead', last_status_code = ?, last_error = ?, claimed_at = NULL
    WHERE id = ?
  `).run(statusCode, error, id);
}

export function scheduleRetry(
  id: string,
  nextAt: number,
  attemptNumber: number,
  statusCode: number | null,
  error: string | null
): void {
  getDb().prepare(`
    UPDATE delivery_attempts
    SET status = 'pending', next_attempt_at = ?, attempt_number = ?,
        last_status_code = ?, last_error = ?, claimed_at = NULL
    WHERE id = ?
  `).run(nextAt, attemptNumber, statusCode, error, id);
}

// Sweeper: resets rows stuck in_flight using claimed_at (not created_at).
export function resetStaleInflight(timeoutMs: number): number {
  const cutoff = Date.now() - timeoutMs;
  const result = getDb().prepare(`
    UPDATE delivery_attempts
    SET status = 'pending', next_attempt_at = ?, claimed_at = NULL
    WHERE status = 'in_flight' AND claimed_at IS NOT NULL AND claimed_at < ?
  `).run(Date.now(), cutoff);
  return result.changes;
}

export function requeueDeadAttempt(id: string): void {
  getDb().prepare(`
    UPDATE delivery_attempts
    SET status = 'pending', next_attempt_at = ?, attempt_number = 0,
        last_status_code = NULL, last_error = NULL,
        delivered_at = NULL, claimed_at = NULL
    WHERE id = ?
  `).run(Date.now(), id);
}

// Transactional fanout: insert event + all delivery attempts atomically.
export function createEventWithAttempts(
  eventId: string,
  eventType: string,
  payload: string,
  subscriptionIds: string[],
  maxAttempts: number
): void {
  const now = Date.now();
  const insertAttempt = getDb().prepare(`
    INSERT INTO delivery_attempts
      (id, event_id, subscription_id, status, attempt_number, max_attempts, next_attempt_at, created_at)
    VALUES (?, ?, ?, 'pending', 0, ?, ?, ?)
  `);

  const fanout = getDb().transaction(() => {
    getDb().prepare(
      'INSERT INTO events (id, type, payload, ingested_at) VALUES (?, ?, ?, ?)'
    ).run(eventId, eventType, payload, now);

    for (const subId of subscriptionIds) {
      insertAttempt.run(uuid(), eventId, subId, maxAttempts, now, now);
    }
  });

  fanout();
}
