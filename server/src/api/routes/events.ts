import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { getEvent, listEvents } from '../../db/queries/events';
import { listSubscriptions } from '../../db/queries/subscriptions';
import { getAttempt, getAttemptsByEvent, createEventWithAttempts } from '../../db/queries/attempts';
import { matchesEventType } from '../../matching/matcher';
import { IQueue } from '../../queue/IQueue';

const IngestSchema = z.object({
  type: z.string().min(1, 'event type required'),
  payload: z.unknown().default({}),
});

export function eventsRouter(queue: IQueue, maxAttempts: number): Router {
  const router = Router();

  router.post('/', (req, res): void => {
    const parsed = IngestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { type, payload } = parsed.data;
    const eventId = uuid();

    const subs = listSubscriptions();
    const matchingIds = subs
      .filter(sub => matchesEventType(JSON.parse(sub.event_types), type))
      .map(sub => sub.id);

    // Atomic: event + all delivery attempts inserted in one transaction
    createEventWithAttempts(eventId, type, JSON.stringify(payload), matchingIds, maxAttempts);

    res.status(202).json({ id: eventId, queued: matchingIds.length });
  });

  router.get('/', (_req, res) => {
    res.json(listEvents(50));
  });

  router.get('/:id', (req, res): void => {
    const event = getEvent(req.params.id);
    if (!event) { res.status(404).json({ error: 'not found' }); return; }
    const attempts = getAttemptsByEvent(event.id);
    res.json({ ...event, attempts });
  });

  router.post('/:id/retry', (req, res): void => {
    const parsed = z.object({ attemptId: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'attemptId required' });
      return;
    }
    const attempt = getAttempt(parsed.data.attemptId);
    if (!attempt || attempt.event_id !== req.params.id) {
      res.status(404).json({ error: 'attempt not found' });
      return;
    }
    queue.requeueDead(parsed.data.attemptId);
    res.json({ queued: true });
  });

  return router;
}
