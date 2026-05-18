import 'dotenv/config';
import { initDb } from './db/database';
import { SqliteQueue } from './queue/SqliteQueue';
import { startWorker } from './worker/worker';
import { createApp } from './api/app';

const PORT            = parseInt(process.env.PORT ?? '3000', 10);
const ADMIN_KEY       = process.env.ADMIN_KEY ?? 'secret';
const DB_PATH         = process.env.DB_PATH ?? './data/webhooks.db';
const MAX_ATTEMPTS    = parseInt(process.env.MAX_ATTEMPTS ?? '5', 10);
const WORKER_INTERVAL = parseInt(process.env.WORKER_INTERVAL_MS ?? '5000', 10);
const INFLIGHT_TMO    = parseInt(process.env.INFLIGHT_TIMEOUT_MS ?? '600000', 10);

initDb(DB_PATH);

const queue = new SqliteQueue();
const stopWorker = startWorker(queue, WORKER_INTERVAL, INFLIGHT_TMO);

const app = createApp(ADMIN_KEY, queue, MAX_ATTEMPTS);
const server = app.listen(PORT, () => {
  console.log(`Webhook service listening on :${PORT}`);
});

process.on('SIGTERM', () => { stopWorker(); server.close(); });
process.on('SIGINT',  () => { stopWorker(); server.close(); });
