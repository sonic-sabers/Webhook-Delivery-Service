# Design Decisions

## Storage — SQLite

No external dependencies, no connection pool, no separate process. `better-sqlite3` is synchronous which keeps the worker simple. If this needs to scale out, the `IQueue` interface is the swap point — only `SqliteQueue.ts` changes, the worker doesn't.

## Worker

A `setInterval` loop runs every 5s and claims a batch of 10 pending attempts. At most 5 run in parallel (via `p-limit`) to keep outbound connections bounded.

At-least-once delivery works like this: before any HTTP call, the attempt is marked `in_flight` with a `claimed_at` timestamp. If the process crashes mid-delivery, a sweeper on the next tick finds rows where `claimed_at` is older than 10 minutes and resets them to `pending`. Receivers should use the `x-webhook-delivery-id` header to dedupe if they get the same delivery twice.

## Retries

Failed attempts retry with exponential backoff: `delay = random(0, min(1hr, 30s × 2^n))`. The randomness (full jitter) prevents a bunch of failed subscriptions from all retrying at the same time.

- **4xx** (except 408/429): permanent failure — no retry. The subscriber rejected the payload.
- **408, 429, 5xx, network errors**: retry.
- After `MAX_ATTEMPTS` (default 5), the attempt becomes `dead` and shows up in the dashboard for manual replay.

## Signing

Subscribers can set a secret on their subscription. When set, each delivery gets an `X-Webhook-Signature` header: `t=<timestamp>,v1=<hmac-sha256>`. The timestamp is part of the signed payload so replayed requests (older than 5 minutes) get rejected. No secret = unsigned delivery, which is an explicit opt-out.

## Dashboard

Plain React SPA, no CSS framework. Four pages: subscriptions (list + create), events list, event detail with per-attempt drill-down, and a retry button for dead/failed attempts. React was picked over server-rendered HTML because the retry button needs to refresh just the attempt table without a full page reload.
