import express from 'express';
import path from 'node:path';
import { adminAuth } from './middleware/auth';
import { subscriptionsRouter } from './routes/subscriptions';
import { eventsRouter } from './routes/events';
import { IQueue } from '../queue/IQueue';

export function createApp(adminKey: string, queue: IQueue, maxAttempts: number) {
  const app = express();
  app.use(express.json());

  const auth = adminAuth(adminKey);
  app.use('/api/subscriptions', auth, subscriptionsRouter());
  app.use('/api/events', auth, eventsRouter(queue, maxAttempts));

  // Serve React SPA — Vite builds to client/dist/
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  return app;
}
