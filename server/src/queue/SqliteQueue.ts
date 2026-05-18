import { IQueue, AttemptResult } from './IQueue';
import {
  DeliveryAttempt,
  claimPendingBatch,
  markDelivered,
  markFailed,
  markDead,
  scheduleRetry,
  resetStaleInflight,
  requeueDeadAttempt,
} from '../db/queries/attempts';

export class SqliteQueue implements IQueue {
  claim(batchSize: number): DeliveryAttempt[] {
    return claimPendingBatch(batchSize);
  }

  markDelivered(id: string): void {
    markDelivered(id);
  }

  markFailed(id: string, result: AttemptResult): void {
    markFailed(id, result.statusCode, result.error);
  }

  markDead(id: string, result: AttemptResult): void {
    markDead(id, result.statusCode, result.error);
  }

  scheduleRetry(id: string, nextAt: number, attemptNumber: number, result: AttemptResult): void {
    scheduleRetry(id, nextAt, attemptNumber, result.statusCode, result.error);
  }

  resetStaleInflight(timeoutMs: number): number {
    return resetStaleInflight(timeoutMs);
  }

  requeueDead(id: string): void {
    requeueDeadAttempt(id);
  }
}
