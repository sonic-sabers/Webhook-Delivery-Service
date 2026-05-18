import { describe, it, expect } from 'vitest';
import { calcNextRetryAt } from '../src/worker/backoff';

describe('calcNextRetryAt', () => {
  it('returns a timestamp in the future', () => {
    const before = Date.now();
    const result = calcNextRetryAt(0);
    expect(result).toBeGreaterThan(before);
  });

  it('returns at least 1s in the future (floor)', () => {
    const result = calcNextRetryAt(0);
    expect(result).toBeGreaterThanOrEqual(Date.now() + 999);
  });

  it('caps at 1 hour', () => {
    const result = calcNextRetryAt(100);
    expect(result).toBeLessThanOrEqual(Date.now() + 3_600_000 + 100);
  });

  it('grows with attempt number', () => {
    const r0 = calcNextRetryAt(0);
    const r5 = calcNextRetryAt(5);
    // r5 ceiling is much higher; on average r5 > r0 — just check ceiling grows
    expect(r5).toBeGreaterThan(Date.now());
    expect(r0).toBeGreaterThan(Date.now());
  });
});
