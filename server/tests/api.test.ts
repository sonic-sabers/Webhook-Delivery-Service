import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { initDb } from '../src/db/database';
import { SqliteQueue } from '../src/queue/SqliteQueue';
import { createApp } from '../src/api/app';

const ADMIN_KEY = 'test-secret';

function makeApp() {
  process.env.ADMIN_KEY = ADMIN_KEY;
  initDb(':memory:');
  const queue = new SqliteQueue();
  return createApp(queue, 5);
}

describe('API', () => {
  it('rejects missing admin key', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/subscriptions');
    expect(res.status).toBe(401);
  });

  it('creates and lists subscriptions', async () => {
    const app = makeApp();
    const create = await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook', event_types: ['order.created'] });
    expect(create.status).toBe(201);
    expect(create.body.url).toBe('https://example.com/hook');

    const list = await request(app)
      .get('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it('ingests event and fans out to matching subscriptions', async () => {
    const app = makeApp();
    await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook', event_types: ['order.*'] });

    const ingest = await request(app)
      .post('/api/events')
      .set('x-admin-key', ADMIN_KEY)
      .send({ type: 'order.created', payload: { orderId: 123 } });
    expect(ingest.status).toBe(202);
    expect(ingest.body.queued).toBe(1);
  });

  it('returns event with attempts', async () => {
    const app = makeApp();
    await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook', event_types: ['*'] });

    const ingest = await request(app)
      .post('/api/events')
      .set('x-admin-key', ADMIN_KEY)
      .send({ type: 'test.event', payload: {} });

    const detail = await request(app)
      .get(`/api/events/${ingest.body.id}`)
      .set('x-admin-key', ADMIN_KEY);
    expect(detail.status).toBe(200);
    expect(detail.body.attempts).toHaveLength(1);
    expect(detail.body.attempts[0].status).toBe('pending');
  });

  it('does not fan out to non-matching subscriptions', async () => {
    const app = makeApp();
    await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook', event_types: ['user.*'] });

    const ingest = await request(app)
      .post('/api/events')
      .set('x-admin-key', ADMIN_KEY)
      .send({ type: 'order.created', payload: {} });
    expect(ingest.body.queued).toBe(0);
  });
});
