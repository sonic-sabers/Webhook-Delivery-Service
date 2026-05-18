import { describe, it, expect } from 'vitest';
import { matchesEventType } from '../src/matching/matcher';

describe('matchesEventType', () => {
  it('matches exact type', () => {
    expect(matchesEventType(['order.created'], 'order.created')).toBe(true);
  });

  it('does not match different exact type', () => {
    expect(matchesEventType(['order.created'], 'order.updated')).toBe(false);
  });

  it('matches wildcard *', () => {
    expect(matchesEventType(['*'], 'anything.here')).toBe(true);
  });

  it('matches prefix wildcard', () => {
    expect(matchesEventType(['user.*'], 'user.created')).toBe(true);
  });

  it('does not match prefix wildcard for different prefix', () => {
    expect(matchesEventType(['user.*'], 'order.created')).toBe(false);
  });

  it('matches one of multiple filters', () => {
    expect(matchesEventType(['order.created', 'user.*'], 'user.deleted')).toBe(true);
  });

  it('returns false for empty filters', () => {
    expect(matchesEventType([], 'order.created')).toBe(false);
  });
});
