import { describe, it, expect } from 'vitest';
import { calcNextRetryAt } from '../src/worker/backoff';

describe('calcNextRetryAt', () => {
  it('returns a future timestamp', () => {
    const before = Date.now();
    const next = calcNextRetryAt(0);
    expect(next).toBeGreaterThanOrEqual(before);
  });

  it('attempt 0 max delay is 30s', () => {
    const before = Date.now();
    const next = calcNextRetryAt(0);
    expect(next - before).toBeLessThanOrEqual(30_000 + 50);
  });

  it('caps at 1 hour regardless of attempt number', () => {
    const before = Date.now();
    const next = calcNextRetryAt(100);
    expect(next - before).toBeLessThanOrEqual(3_600_000 + 50);
  });

  it('attempt 1 max delay is 60s', () => {
    const before = Date.now();
    const next = calcNextRetryAt(1);
    expect(next - before).toBeLessThanOrEqual(60_000 + 50);
  });
});
