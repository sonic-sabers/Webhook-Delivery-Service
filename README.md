# Webhook Delivery Service

Single-process webhook delivery service. At-least-once delivery, exponential backoff retries, HMAC-SHA256 signing, React dashboard.

## Run

```bash
cp .env.example .env
npm install
npm start        # builds SPA then starts server on :3000
```

Open http://localhost:3000

## Dev (hot reload)

```bash
npm run dev      # runs vite dev server + tsx   watch concurrently
```

## Tests

```bash
npm test
```

## What works
- Subscription CRUD with event type filters — exact (`order.created`) and wildcard (`user.*`, `*`)
- Event ingest with transactional fan-out to matching subscriptions
- At-least-once delivery: attempt row written before HTTP call; sweeper resets stale `in_flight` rows on restart using `claimed_at`
- Exponential backoff with full jitter (base 30s, cap 1hr, configurable max attempts)
- HMAC-SHA256 signing with 5-min replay window; `x-webhook-delivery-id` header for consumer deduplication
- Bounded concurrency: max 5 simultaneous outbound HTTP calls per worker tick via `p-limit`
- Dashboard: subscriptions list + create, events list, delivery attempt drill-down, manual retry

## What's incomplete / next steps
- No pagination on events list (capped at 50 rows)
- No e2e test with a real HTTP receiver — would add with `msw` or a local test server
- `IQueue` interface ready to swap to BullMQ + Redis/Postgres for horizontal scale — only `SqliteQueue.ts` changes
- Concurrency limit of 5 is a fixed constant — could be an env var

## Environment variables

| Var | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `ADMIN_KEY` | `secret` | `X-Admin-Key` header value |
| `DB_PATH` | `./data/webhooks.db` | SQLite file path |
| `MAX_ATTEMPTS` | `5` | Max delivery attempts before dead |
| `WORKER_INTERVAL_MS` | `5000` | Worker poll interval |
| `INFLIGHT_TIMEOUT_MS` | `600000` | Stale in-flight reset threshold (10 min) |
