import { getDb } from '../database';
import { v4 as uuid } from 'uuid';

export interface Event {
  id: string;
  type: string;
  payload: string;  // JSON string
  ingested_at: number;
}

export function createEvent(type: string, payload: unknown): Event {
  const id = uuid();
  const now = Date.now();
  getDb().prepare(
    'INSERT INTO events (id, type, payload, ingested_at) VALUES (?, ?, ?, ?)'
  ).run(id, type, JSON.stringify(payload), now);
  return getEvent(id)!;
}

export function getEvent(id: string): Event | undefined {
  return getDb().prepare('SELECT * FROM events WHERE id = ?').get(id) as Event | undefined;
}

export function listEvents(limit = 50): Event[] {
  return getDb().prepare(
    'SELECT * FROM events ORDER BY ingested_at DESC LIMIT ?'
  ).all(limit) as Event[];
}
