const BASE_MS  = 30_000;    // 30 seconds
const CAP_MS   = 3_600_000; // 1 hour
const FLOOR_MS = 1_000;     // Math.random() can return 0; ensure minimum 1 s delay

/**
 * Calculates the Unix ms timestamp for the next retry using full-jitter exponential backoff.
 *
 * Formula (AWS-style): delay = random(0, min(CAP_MS, BASE_MS * 2^attemptNumber))
 *
 * Full jitter fully decorrelates retries across concurrent failures — if 100 webhooks
 * fail at the same second they don't all hammer the subscriber again at the same time.
 * This differs from "equal jitter" which retains some correlated component.
 *
 * @param attemptNumber  1-based attempt count (pass attempt_number + 1 from the row).
 * @returns              Unix timestamp (ms) after which the attempt is eligible to run.
 */
export function calcNextRetryAt(attemptNumber: number): number {
  const ceiling = Math.min(CAP_MS, BASE_MS * Math.pow(2, attemptNumber));
  return Date.now() + Math.max(FLOOR_MS, Math.random() * ceiling);
}
