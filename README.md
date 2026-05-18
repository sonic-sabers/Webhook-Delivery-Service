# Webhook Delivery Service

Single-process webhook delivery service. At-least-once delivery, exponential backoff retries, HMAC-SHA256 signing, React dashboard.

## Project Structure

```
Fibr/
├── server/            # Express API + delivery worker (TypeScript)
│   ├── src/
│   ├── tests/
│   ├── tsconfig.json
│   ├── package.json
│   └── .env
├── client/            # React SPA (Vite)
│   ├── src/
│   ├── index.html
│   ├── vite.config.ts
│   └── .env
├── package.json       # Root — orchestration scripts only
├── DECISIONS.md
├── AI_LOG.md
└── README.md
```

## Setup

```bash
# Install all deps
npm install              # root (concurrently)
cd server && npm install # server deps
cd client && npm install # client deps
```

## Run

```bash
npm start        # builds client + server, starts on :3000
```

Open http://localhost:3000

## Dev (hot reload)

```bash
npm run dev      # server (tsx watch) + client (vite) concurrently
```

## Tests

```bash
npm test         # runs vitest in server/
```

## What works

- Subscription CRUD with event type filters — exact (`order.created`) and wildcard (`user.*`, `*`)
- Event ingest with transactional fan-out to matching subscriptions
- At-least-once delivery: attempt row written before HTTP call; sweeper resets stale `in_flight` rows using `claimed_at`
- Exponential backoff with full jitter (base 30s, cap 1hr, min 1s floor)
- HMAC-SHA256 signing with 5-min replay window; `x-webhook-delivery-id` header for consumer deduplication
- Bounded concurrency: max 5 simultaneous outbound HTTP calls per worker tick via `p-limit`
- Dashboard: subscriptions list + create, events list, delivery attempt drill-down, manual retry

## Screenshots

### Subscriptions Dashboard

![Subscriptions](./public/screenshots/Subscriptions.png)

### Create Subscription Form

![Create Subscription](./public/screenshots/Filled%20Subscriptions.png)

### Events List with Delivery Status

![Events](./public/screenshots/Events.png)

### Event Detail - Delivery Attempts

![Event Detail](./public/screenshots/EventDetails.png)

## What's incomplete / next steps

- No pagination on events list (capped at 50 rows)
- No e2e test with a real HTTP receiver — would add with `msw` or a local test server
- `IQueue` interface ready to swap to BullMQ + Redis/Postgres for horizontal scale — only `SqliteQueue.ts` changes
- Concurrency limit of 5 is a fixed constant — could be an env var

## Environment variables

Configure in `server/.env` (copy from `server/.env.example`).

| Var                   | Default              | Description                                    |
| --------------------- | -------------------- | ---------------------------------------------- |
| `PORT`                | `3000`               | HTTP port                                      |
| `ADMIN_KEY`           | `secret`             | `X-Admin-Key` header required on all API calls |
| `DB_PATH`             | `./data/webhooks.db` | SQLite file path                               |
| `MAX_ATTEMPTS`        | `5`                  | Max delivery attempts before dead              |
| `WORKER_INTERVAL_MS`  | `5000`               | Worker poll interval                           |
| `INFLIGHT_TIMEOUT_MS` | `600000`             | Stale in-flight reset threshold (10 min)       |

Client env in `client/.env` — set `VITE_ADMIN_KEY` to match `ADMIN_KEY`.
