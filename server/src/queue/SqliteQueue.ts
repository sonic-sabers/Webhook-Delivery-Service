import { IQueue } from "./IQueue";
import {
  DeliveryAttempt,
  claimPendingBatch,
  markDelivered,
  markFailed,
  markDead,
  scheduleRetry,
  resetStaleInflight,
  requeueDeadAttempt,
} from "../db/queries/attempts";
import { DeliveryResult } from "../worker/delivery";

export class SqliteQueue implements IQueue {
  claim(batchSize: number): DeliveryAttempt[] {
    return claimPendingBatch(batchSize);
  }

  markDelivered(id: string): void {
    markDelivered(id);
  }

  markFailed(id: string, result: DeliveryResult): void {
    markFailed(id, result.statusCode, result.error);
  }

  markDead(id: string, result: DeliveryResult): void {
    markDead(id, result.statusCode, result.error);
  }

  scheduleRetry(
    id: string,
    nextAt: number,
    attemptNumber: number,
    result: DeliveryResult,
  ): void {
    scheduleRetry(id, nextAt, attemptNumber, result.statusCode, result.error);
  }

  resetStaleInflight(timeoutMs: number): number {
    return resetStaleInflight(timeoutMs);
  }

  requeueDead(id: string): void {
    requeueDeadAttempt(id);
  }
}
