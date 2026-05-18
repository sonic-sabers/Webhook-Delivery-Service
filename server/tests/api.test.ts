import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { initDb } from '../src/db/database';
import { SqliteQueue } from '../src/queue/SqliteQueue';
import { createApp } from '../src/api/app';

const ADMIN_KEY = 'test-key';

function setup() {
  initDb(':memory:');
  const queue = new SqliteQueue();
  const app = createApp(ADMIN_KEY, queue, 3);
  return { app, queue };
}

describe('auth', () => {
  it('rejects missing admin key with 401', async () => {
    const { app } = setup();
    const res = await request(app).get('/api/subscriptions');
    expect(res.status).toBe(401);
  });
});

describe('subscriptions', () => {
  it('creates subscription and lists it', async () => {
    const { app } = setup();
    const create = await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook', event_types: ['order.*'] });
    expect(create.status).toBe(201);
    expect(create.body.id).toBeTruthy();

    const list = await request(app)
      .get('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it('rejects invalid URL', async () => {
    const { app } = setup();
    const res = await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'not-a-url' });
    expect(res.status).toBe(400);
  });
});

describe('events', () => {
  it('ingest fans out to matching subscription only', async () => {
    const { app, queue } = setup();

    await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook1', event_types: ['order.*'] });

    await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook2', event_types: ['user.*'] });

    const res = await request(app)
      .post('/api/events')
      .set('x-admin-key', ADMIN_KEY)
      .send({ type: 'order.created', payload: { id: 42 } });

    expect(res.status).toBe(202);
    expect(res.body.queued).toBe(1);

    const attempts = queue.claim(10);
    expect(attempts).toHaveLength(1);
  });

  it('returns event with attempts on GET /:id', async () => {
    const { app } = setup();

    await request(app)
      .post('/api/subscriptions')
      .set('x-admin-key', ADMIN_KEY)
      .send({ url: 'https://example.com/hook', event_types: ['*'] });

    const ingest = await request(app)
      .post('/api/events')
      .set('x-admin-key', ADMIN_KEY)
      .send({ type: 'order.created', payload: {} });

    const detail = await request(app)
      .get(`/api/events/${ingest.body.id}`)
      .set('x-admin-key', ADMIN_KEY);

    expect(detail.status).toBe(200);
    expect(detail.body.attempts).toHaveLength(1);
    expect(detail.body.attempts[0].status).toBe('pending');
  });
});
