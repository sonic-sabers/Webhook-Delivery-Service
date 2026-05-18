# Webhook Delivery Service

Single-process webhook delivery service. At-least-once delivery, exponential backoff retries, HMAC-SHA256 signing, React dashboard.

## Project Structure

```
Fibr/
├── server/        # Express API + worker (TypeScript)
├── client/        # React SPA (Vite)
├── DECISIONS.md   # Architecture decisions
├── AI_LOG.md      # AI usage log
└── README.md
```

## Setup

```bash
# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

## Run

```bash
# Production (builds client then starts server on :3000)
npm start

# Dev (hot reload — server + client concurrently)
npm run dev
```

Open http://localhost:3000

## Tests

```bash
npm test
```

All tests run from `server/` — 30 tests across 5 files.

## What it does

- Subscription CRUD with event type filters — exact (`order.created`), prefix (`user.*`), wildcard (`*`)
- Event ingest with transactional fan-out to matching subscriptions
- At-least-once delivery — attempt row written before HTTP call; sweeper resets stale `in_flight` rows using `claimed_at`
- Exponential backoff with full jitter (base 30s, cap 1hr, min 1s floor)
- HMAC-SHA256 signing with 5-min replay window; `x-webhook-delivery-id` for consumer deduplication
- Bounded concurrency — max 5 outbound HTTP calls per worker tick
- Dashboard — subscriptions, events list, attempt drill-down, manual retry for dead/failed attempts

## Known gaps

- Events list capped at 50 rows (no pagination)
- No e2e test with real HTTP receiver
- `IQueue` interface is ready to swap to BullMQ + Redis — only `SqliteQueue.ts` changes

## Environment variables

Configure in `server/.env` (copy from `server/.env.example`).

| Var | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `ADMIN_KEY` | `secret` | `X-Admin-Key` header required on all API calls |
| `DB_PATH` | `./data/webhooks.db` | SQLite file path |
| `MAX_ATTEMPTS` | `5` | Max delivery attempts before marking dead |
| `WORKER_INTERVAL_MS` | `5000` | Worker poll interval (ms) |
| `INFLIGHT_TIMEOUT_MS` | `600000` | Stale in-flight reset threshold (10 min) |

Client env in `client/.env` — only `VITE_ADMIN_KEY` (must match `ADMIN_KEY` above).
