import { Router } from 'express';
import { z } from 'zod';
import { listSubscriptions, createSubscription, disableSubscription } from '../../db/queries/subscriptions';

const CreateSubscriptionSchema = z.object({
  url: z.string().url('must be a valid URL'),
  /** Optional HMAC signing secret. When present, each delivery includes x-webhook-signature. */
  secret: z.string().min(1).optional(),
  /** Glob-style event type filters. Defaults to ['*'] (receive all events). */
  event_types: z.array(z.string().min(1)).min(1).default(['*']),
});

/**
 * Subscriptions router — CRUD for webhook subscriptions.
 *
 * GET    /     List all active subscriptions.
 * POST   /     Create a new subscription. event_types supports exact match,
 *              wildcard ('*'), and prefix globs ('order.*').
 * DELETE /:id  Soft-delete: sets active=0. Does not purge pending attempts.
 */
export function subscriptionsRouter(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.json(listSubscriptions());
  });

  router.post('/', (req, res): void => {
    const parsed = CreateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { url, secret, event_types } = parsed.data;
    const sub = createSubscription(url, secret ?? null, event_types);
    res.status(201).json(sub);
  });

  router.delete('/:id', (req, res) => {
    disableSubscription(req.params.id);
    res.status(204).send();
  });

  return router;
}
