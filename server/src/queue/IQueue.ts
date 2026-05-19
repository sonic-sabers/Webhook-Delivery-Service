import { DeliveryAttempt } from '../db/queries/attempts';
import { DeliveryResult } from '../worker/delivery';

/**
 * Queue abstraction used by the worker.
 *
 * Decouples the worker logic from SQLite so tests can inject an in-memory
 * implementation without hitting the database.
 */
export interface IQueue {
  /** Atomically claims up to batchSize pending attempts due for delivery. */
  claim(batchSize: number): DeliveryAttempt[];
  markDelivered(id: string): void;
  markFailed(id: string, result: DeliveryResult): void;
  markDead(id: string, result: DeliveryResult): void;
  /** Reschedule a failed attempt; nextAt is a Unix ms timestamp. */
  scheduleRetry(id: string, nextAt: number, attemptNumber: number, result: DeliveryResult): void;
  /** Resets in_flight rows older than timeoutMs back to pending. Returns count reset. */
  resetStaleInflight(timeoutMs: number): number;
  /** Re-enqueues a dead attempt for immediate manual retry. */
  requeueDead(id: string): void;
}
