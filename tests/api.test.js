"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const database_1 = require("../src/db/database");
const SqliteQueue_1 = require("../src/queue/SqliteQueue");
const app_1 = require("../src/api/app");
const ADMIN_KEY = 'test-key';
function setup() {
    (0, database_1.initDb)(':memory:');
    const queue = new SqliteQueue_1.SqliteQueue();
    const app = (0, app_1.createApp)(ADMIN_KEY, queue, 3);
    return { app, queue };
}
(0, vitest_1.describe)('auth', () => {
    (0, vitest_1.it)('rejects missing admin key with 401', async () => {
        const { app } = setup();
        const res = await (0, supertest_1.default)(app).get('/api/subscriptions');
        (0, vitest_1.expect)(res.status).toBe(401);
    });
});
(0, vitest_1.describe)('subscriptions', () => {
    (0, vitest_1.it)('creates subscription and lists it', async () => {
        const { app } = setup();
        const create = await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook', event_types: ['order.*'] });
        (0, vitest_1.expect)(create.status).toBe(201);
        (0, vitest_1.expect)(create.body.id).toBeTruthy();
        const list = await (0, supertest_1.default)(app)
            .get('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY);
        (0, vitest_1.expect)(list.status).toBe(200);
        (0, vitest_1.expect)(list.body).toHaveLength(1);
    });
    (0, vitest_1.it)('rejects invalid URL', async () => {
        const { app } = setup();
        const res = await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'not-a-url' });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
(0, vitest_1.describe)('events', () => {
    (0, vitest_1.it)('ingest fans out to matching subscription only', async () => {
        const { app, queue } = setup();
        await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook1', event_types: ['order.*'] });
        await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook2', event_types: ['user.*'] });
        const res = await (0, supertest_1.default)(app)
            .post('/api/events')
            .set('x-admin-key', ADMIN_KEY)
            .send({ type: 'order.created', payload: { id: 42 } });
        (0, vitest_1.expect)(res.status).toBe(202);
        (0, vitest_1.expect)(res.body.queued).toBe(1);
        const attempts = queue.claim(10);
        (0, vitest_1.expect)(attempts).toHaveLength(1);
    });
    (0, vitest_1.it)('returns event with attempts on GET /:id', async () => {
        const { app } = setup();
        await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook', event_types: ['*'] });
        const ingest = await (0, supertest_1.default)(app)
            .post('/api/events')
            .set('x-admin-key', ADMIN_KEY)
            .send({ type: 'order.created', payload: {} });
        const detail = await (0, supertest_1.default)(app)
            .get(`/api/events/${ingest.body.id}`)
            .set('x-admin-key', ADMIN_KEY);
        (0, vitest_1.expect)(detail.status).toBe(200);
        (0, vitest_1.expect)(detail.body.attempts).toHaveLength(1);
        (0, vitest_1.expect)(detail.body.attempts[0].status).toBe('pending');
    });
});
