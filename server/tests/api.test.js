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
const ADMIN_KEY = 'test-secret';
function makeApp() {
    process.env.ADMIN_KEY = ADMIN_KEY;
    (0, database_1.initDb)(':memory:');
    const queue = new SqliteQueue_1.SqliteQueue();
    return (0, app_1.createApp)(queue, 5);
}
(0, vitest_1.describe)('API', () => {
    (0, vitest_1.it)('rejects missing admin key', async () => {
        const app = makeApp();
        const res = await (0, supertest_1.default)(app).get('/api/subscriptions');
        (0, vitest_1.expect)(res.status).toBe(401);
    });
    (0, vitest_1.it)('creates and lists subscriptions', async () => {
        const app = makeApp();
        const create = await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook', event_types: ['order.created'] });
        (0, vitest_1.expect)(create.status).toBe(201);
        (0, vitest_1.expect)(create.body.url).toBe('https://example.com/hook');
        const list = await (0, supertest_1.default)(app)
            .get('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY);
        (0, vitest_1.expect)(list.status).toBe(200);
        (0, vitest_1.expect)(list.body).toHaveLength(1);
    });
    (0, vitest_1.it)('ingests event and fans out to matching subscriptions', async () => {
        const app = makeApp();
        await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook', event_types: ['order.*'] });
        const ingest = await (0, supertest_1.default)(app)
            .post('/api/events')
            .set('x-admin-key', ADMIN_KEY)
            .send({ type: 'order.created', payload: { orderId: 123 } });
        (0, vitest_1.expect)(ingest.status).toBe(202);
        (0, vitest_1.expect)(ingest.body.queued).toBe(1);
    });
    (0, vitest_1.it)('returns event with attempts', async () => {
        const app = makeApp();
        await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook', event_types: ['*'] });
        const ingest = await (0, supertest_1.default)(app)
            .post('/api/events')
            .set('x-admin-key', ADMIN_KEY)
            .send({ type: 'test.event', payload: {} });
        const detail = await (0, supertest_1.default)(app)
            .get(`/api/events/${ingest.body.id}`)
            .set('x-admin-key', ADMIN_KEY);
        (0, vitest_1.expect)(detail.status).toBe(200);
        (0, vitest_1.expect)(detail.body.attempts).toHaveLength(1);
        (0, vitest_1.expect)(detail.body.attempts[0].status).toBe('pending');
    });
    (0, vitest_1.it)('does not fan out to non-matching subscriptions', async () => {
        const app = makeApp();
        await (0, supertest_1.default)(app)
            .post('/api/subscriptions')
            .set('x-admin-key', ADMIN_KEY)
            .send({ url: 'https://example.com/hook', event_types: ['user.*'] });
        const ingest = await (0, supertest_1.default)(app)
            .post('/api/events')
            .set('x-admin-key', ADMIN_KEY)
            .send({ type: 'order.created', payload: {} });
        (0, vitest_1.expect)(ingest.body.queued).toBe(0);
    });
});
