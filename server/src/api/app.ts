import express from 'express';
import { adminAuth } from './middleware/auth';
import { subscriptionsRouter } from './routes/subscriptions';
import { eventsRouter } from './routes/events';
import { IQueue } from '../queue/IQueue';
import { requestLogger } from './middleware/requestLogger';

/**
 * Creates and configures the Express application.
 *
 * All /api routes require the x-admin-key header (adminAuth middleware).
 * requestLogger runs before auth so every request — including rejected ones — is logged.
 *
 * @param queue      Queue adapter used by the events router to enqueue delivery attempts.
 * @param maxAttempts Maximum delivery attempts per event before an attempt is marked dead.
 */
export function createApp(queue: IQueue, maxAttempts: number) {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);

  app.use('/api', adminAuth);
  app.use('/api/subscriptions', subscriptionsRouter());
  app.use('/api/events', eventsRouter(queue, maxAttempts));

  return app;
}
