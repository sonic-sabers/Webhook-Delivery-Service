import express from 'express';
import { adminAuth } from './middleware/auth';
import { subscriptionsRouter } from './routes/subscriptions';
import { eventsRouter } from './routes/events';
import { IQueue } from '../queue/IQueue';
import { requestLogger } from './middleware/requestLogger';

export function createApp(queue: IQueue, maxAttempts: number) {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);

  app.use('/api', adminAuth);
  app.use('/api/subscriptions', subscriptionsRouter());
  app.use('/api/events', eventsRouter(queue, maxAttempts));

  return app;
}
