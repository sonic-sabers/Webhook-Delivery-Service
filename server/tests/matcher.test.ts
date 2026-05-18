import { describe, it, expect } from 'vitest';
import { matchesEventType } from '../src/matching/matcher';

describe('matchesEventType', () => {
  it('exact match', () => {
    expect(matchesEventType(['order.created'], 'order.created')).toBe(true);
  });

  it('wildcard star matches all', () => {
    expect(matchesEventType(['*'], 'order.created')).toBe(true);
  });

  it('prefix wildcard matches', () => {
    expect(matchesEventType(['user.*'], 'user.created')).toBe(true);
    expect(matchesEventType(['user.*'], 'user.deleted')).toBe(true);
  });

  it('prefix wildcard does not match different namespace', () => {
    expect(matchesEventType(['user.*'], 'order.created')).toBe(false);
  });

  it('no match returns false', () => {
    expect(matchesEventType(['order.created'], 'user.created')).toBe(false);
  });

  it('multiple filters, one matches', () => {
    expect(matchesEventType(['order.created', 'user.*'], 'user.deleted')).toBe(true);
  });

  it('empty filter list returns false', () => {
    expect(matchesEventType([], 'order.created')).toBe(false);
  });
});
