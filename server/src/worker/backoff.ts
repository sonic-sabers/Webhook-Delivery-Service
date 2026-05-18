const BASE_MS = 30_000;    // 30 seconds
const CAP_MS  = 3_600_000; // 1 hour
const FLOOR_MS = 1_000;    // never retry in less than 1s (Math.random() can return 0)

// Full jitter (AWS-style): delay = random(0, min(cap, base * 2^n))
// Fully decorrelates retries — 100 simultaneous failures don't all retry at the same second.
export function calcNextRetryAt(attemptNumber: number): number {
  const ceiling = Math.min(CAP_MS, BASE_MS * Math.pow(2, attemptNumber));
  return Date.now() + Math.max(FLOOR_MS, Math.random() * ceiling);
}
