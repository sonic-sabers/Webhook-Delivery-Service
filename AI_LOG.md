# AI Log

## Entry 1 — Architecture: worker model

**Asked:** In-process setInterval vs separate worker process for single-process webhook delivery?
**Got:** Both options. Separate process = better fault isolation; in-process = simpler, no IPC.
**Kept/modified/rejected:** Kept in-process. Spec explicitly says single process. Added IQueue interface as a scale seam — AI didn't suggest this, I added it so DECISIONS.md can describe the swap path clearly.

## Entry 2 — Claim atomicity

**Asked:** How do I prevent double-claiming delivery attempts in an async Node.js worker?
**Got:** Two suggestions: (1) UPDATE...RETURNING with a WHERE clause, (2) transaction wrapping SELECT+UPDATE.
**Kept/modified/rejected:** Used transaction approach (better-sqlite3 `.transaction()`) — clearer intent and works with SQLite. Rejected UPDATE...RETURNING as SQLite support is version-dependent.

## Entry 3 — Stale in-flight detection

**Asked:** How should I detect and reset delivery attempts that got stuck in_flight after a crash?
**Got:** Suggested using `created_at < cutoff` as the staleness check.
**Kept/modified/rejected:** Rejected. `created_at` is when the attempt was born, not when delivery started. Added `claimed_at` column set at claim time — sweeper uses `claimed_at < cutoff`. This is the correct field.

## Entry 4 — Retry policy

**Asked:** Full jitter vs equal jitter vs decorrelated jitter for backoff?
**Got:** All three explained with the AWS blog as reference. Decorrelated jitter recommended for fleets.
**Kept/modified/rejected:** Chose full jitter. Decorrelated adds complexity (needs previous delay state) for marginal gain at this scale. Full jitter is simpler and still fully decorrelates across simultaneous failures.

## Entry 5 — HMAC signing

**Asked:** How to prevent replay attacks on webhook HMAC signatures?
**Got:** Timestamp-in-signature pattern with window check. Used `===` for comparison.
**Kept/modified/rejected:** Kept pattern, rejected `===`. Replaced with `timingSafeEqual` from `node:crypto` to prevent timing side-channels. AI also didn't include the `x-webhook-delivery-id` header — added that independently for consumer deduplication.

## Entry 6 — IQueue abstraction

**Asked:** How should I structure the queue so it's swappable later?
**Got:** Full BullMQ + Redis implementation.
**Kept/modified/rejected:** Rejected Redis entirely (spec says single process, no external deps). Kept the interface pattern, wrote `SqliteQueue` as the impl. The interface is the value — it means the scale story in DECISIONS.md is credible and testable: a `BullMQQueue` class would satisfy the same interface.

## Entry 7 — Delivery semantics

**Asked:** As a tech lead with 5+ years of backend/distributed systems experience, how should webhook retries and delivery guarantees be designed so the system remains operationally correct under failures, use skills @gstack @cto-persona @senior-engineer /brainstorming-skill /gstack /fullstack-developer

**Got:** Suggested retry handling and consumer-side idempotency patterns.

**Kept/modified/rejected:** Rejected “exactly-once delivery” semantics entirely because they are misleading without distributed transactional guarantees. Defined the system explicitly as at-least-once delivery, added stable `x-webhook-delivery-id` headers for deterministic deduplication, and documented the contract clearly in DECISIONS.md. This keeps retry behavior honest, testable, and production-safe.

## Entry 8 — SQLite concurrency strategy

**Asked:** From a senior engineer / tech lead perspective, how should concurrency be designed for a single-process SQLite-backed webhook worker without creating lock contention or unstable latency?

**Got:** Recommended configurable high-concurrency workers for throughput scaling.

**Kept/modified/rejected:** Partially rejected. Identified that SQLite’s single-writer model makes aggressive parallelism counterproductive in this architecture. Kept concurrency intentionally bounded and separated DB claim/update phases from network I/O to minimize lock duration. This preserves predictable latency and stability while still allowing concurrent delivery execution.
