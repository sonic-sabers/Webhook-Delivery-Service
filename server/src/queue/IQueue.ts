import { DeliveryAttempt } from '../db/queries/attempts';

export interface AttemptResult {
  statusCode: number | null;
  error: string | null;
  success: boolean;
  shouldRetry: boolean;
}

export interface IQueue {
  // Atomically claims up to batchSize pending attempts due for delivery
  claim(batchSize: number): DeliveryAttempt[];
  markDelivered(id: string): void;
  markFailed(id: string, result: AttemptResult): void;
  markDead(id: string, result: AttemptResult): void;
  scheduleRetry(id: string, nextAt: number, attemptNumber: number, result: AttemptResult): void;
  // Resets in_flight rows older than timeoutMs back to pending (crash recovery)
  resetStaleInflight(timeoutMs: number): number;
  requeueDead(id: string): void;
}
