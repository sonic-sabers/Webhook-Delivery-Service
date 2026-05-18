import { Router } from 'express';
import { z } from 'zod';
import { listSubscriptions, createSubscription, disableSubscription } from '../../db/queries/subscriptions';

const CreateSubscriptionSchema = z.object({
  url: z.string().url('must be a valid URL'),
  secret: z.string().min(1).optional(),
  event_types: z.array(z.string().min(1)).min(1).default(['*']),
});

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
