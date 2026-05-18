import express from 'express';
import path from 'node:path';
import { adminAuth } from './middleware/auth';
import { subscriptionsRouter } from './routes/subscriptions';
import { eventsRouter } from './routes/events';
import { IQueue } from '../queue/IQueue';

export function createApp(queue: IQueue, maxAttempts: number) {
  const app = express();
  app.use(express.json());

  app.use('/api', adminAuth);
  app.use('/api/subscriptions', subscriptionsRouter());
  app.use('/api/events', eventsRouter(queue, maxAttempts));

  const clientDist = path.join(__dirname, '..', '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}
