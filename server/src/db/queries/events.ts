import { getDb } from "../database";

export interface WebhookEvent {
  id: string;
  type: string;
  payload: string;
  ingested_at: number;
}

export interface EventSummary extends WebhookEvent {
  total_attempts: number;
  delivered: number;
  failed: number;
  pending: number;
  dead: number;
}

export function getEvent(id: string): WebhookEvent | undefined {
  return getDb().prepare("SELECT * FROM events WHERE id = ?").get(id) as
    | WebhookEvent
    | undefined;
}

export function listEvents(limit: number): WebhookEvent[] {
  return getDb()
    .prepare("SELECT * FROM events ORDER BY ingested_at DESC LIMIT ?")
    .all(limit) as WebhookEvent[];
}

export function listEventsWithSummary(limit: number): EventSummary[] {
  return getDb()
    .prepare(
      `
    SELECT 
      e.*,
      COUNT(a.id) as total_attempts,
      SUM(CASE WHEN a.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN a.status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN a.status = 'pending' OR a.status = 'in_flight' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN a.status = 'dead' THEN 1 ELSE 0 END) as dead
    FROM events e
    LEFT JOIN delivery_attempts a ON a.event_id = e.id
    GROUP BY e.id
    ORDER BY e.ingested_at DESC
    LIMIT ?
  `,
    )
    .all(limit) as EventSummary[];
}
