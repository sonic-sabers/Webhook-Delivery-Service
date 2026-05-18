import { DeliveryAttempt } from '../db/queries/attempts';
import { DeliveryResult } from '../worker/delivery';

export interface IQueue {
  claim(batchSize: number): DeliveryAttempt[];
  markDelivered(id: string): void;
  markFailed(id: string, result: DeliveryResult): void;
  markDead(id: string, result: DeliveryResult): void;
  scheduleRetry(id: string, nextAt: number, attemptNumber: number, result: DeliveryResult): void;
  resetStaleInflight(timeoutMs: number): number;
  requeueDead(id: string): void;
}
