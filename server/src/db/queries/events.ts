import { getDb } from '../database';

export interface WebhookEvent {
  id: string;
  type: string;
  payload: string;
  ingested_at: number;
}

export function getEvent(id: string): WebhookEvent | undefined {
  return getDb().prepare('SELECT * FROM events WHERE id = ?').get(id) as WebhookEvent | undefined;
}

export function listEvents(limit: number): WebhookEvent[] {
  return getDb().prepare('SELECT * FROM events ORDER BY ingested_at DESC LIMIT ?').all(limit) as WebhookEvent[];
}
