import { getDb } from '../database';
import { v4 as uuid } from 'uuid';

export interface Subscription {
  id: string;
  url: string;
  /** HMAC signing secret, or null if this subscription has no signature verification. */
  secret: string | null;
  /** JSON-encoded string[]. Use JSON.parse before passing to matchesEventType. */
  event_types: string;
  created_at: number;
  /** SQLite stores booleans as 0/1 integers. active=0 means soft-deleted. */
  active: number;
}

export function listSubscriptions(): Subscription[] {
  return getDb().prepare('SELECT * FROM subscriptions WHERE active = 1').all() as Subscription[];
}

export function getSubscription(id: string): Subscription | undefined {
  return getDb().prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as Subscription | undefined;
}

export function createSubscription(url: string, secret: string | null, eventTypes: string[]): Subscription {
  const id = uuid();
  const now = Date.now();
  getDb().prepare(`
    INSERT INTO subscriptions (id, url, secret, event_types, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, url, secret, JSON.stringify(eventTypes), now);
  return getSubscription(id)!;
}

export function disableSubscription(id: string): void {
  getDb().prepare('UPDATE subscriptions SET active = 0 WHERE id = ?').run(id);
}
