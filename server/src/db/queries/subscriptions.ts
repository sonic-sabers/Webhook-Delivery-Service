import { getDb } from '../database';
import { v4 as uuid } from 'uuid';

export interface Subscription {
  id: string;
  url: string;
  secret: string | null;
  event_types: string;
  created_at: number;
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
