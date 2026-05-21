import 'dotenv/config';
import { initDb } from './db/database';
import { SqliteQueue } from './queue/SqliteQueue';
import { createApp } from './api/app';
import { startWorker } from './worker/worker';
import { logger } from './logging/logger';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const DB_PATH = process.env.DB_PATH ?? './data/webhooks.db';
const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS ?? '5', 10);
const WORKER_INTERVAL_MS = parseInt(process.env.WORKER_INTERVAL_MS ?? '5000', 10);
const INFLIGHT_TIMEOUT_MS = parseInt(process.env.INFLIGHT_TIMEOUT_MS ?? '600000', 10);

initDb(DB_PATH);

const queue = new SqliteQueue();
const app = createApp(queue, MAX_ATTEMPTS);
const stopWorker = startWorker(queue, WORKER_INTERVAL_MS, INFLIGHT_TIMEOUT_MS);

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, `server listening on :${PORT}`);
});

const shutdown = () => {
  logger.info('server shutting down');
  stopWorker();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
