import { Router } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { getEvent, listEventsWithSummary } from "../../db/queries/events";
import { listSubscriptions } from "../../db/queries/subscriptions";
import {
  getAttempt,
  getAttemptsByEvent,
  createEventWithAttempts,
} from "../../db/queries/attempts";
import { matchesEventType } from "../../matching/matcher";
import { IQueue } from "../../queue/IQueue";

const IngestSchema = z.object({
  type: z.string().min(1, "event type required"),
  payload: z.unknown().default({}),
});

/**
 * Events router — handles event ingestion, inspection, and manual retry.
 *
 * POST /           Ingest a new event. Fans out delivery attempts to every
 *                  active subscription whose event_types pattern matches.
 *                  Returns 202 immediately; delivery is async via the worker.
 *
 * GET  /           List the 50 most recent events with aggregated attempt counts.
 *
 * GET  /:id        Fetch a single event with its full delivery attempt history.
 *
 * POST /:id/retry  Re-enqueue a dead attempt for immediate retry. The event_id
 *                  check prevents cross-event attempt manipulation.
 *
 * @param queue       Queue adapter used to re-enqueue dead attempts.
 * @param maxAttempts Stored on each attempt row; worker reads it to decide
 *                    when to stop retrying and mark the attempt dead.
 */
export function eventsRouter(queue: IQueue, maxAttempts: number): Router {
  const router = Router();

  router.post("/", (req, res): void => {
    const parsed = IngestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    const { type, payload } = parsed.data;
    const eventId = uuid();

    // Fan-out: find all active subscriptions that match this event type,
    // then atomically insert the event + one pending attempt per subscription.
    const subs = listSubscriptions();
    const matchingIds = subs
      .filter((sub) => matchesEventType(JSON.parse(sub.event_types), type))
      .map((sub) => sub.id);

    createEventWithAttempts(
      eventId,
      type,
      JSON.stringify(payload),
      matchingIds,
      maxAttempts,
    );

    res.status(202).json({ id: eventId, queued: matchingIds.length });
  });

  router.get("/", (_req, res) => {
    res.json(listEventsWithSummary(50));
  });

  router.get("/:id", (req, res): void => {
    const event = getEvent(req.params.id);
    if (!event) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const attempts = getAttemptsByEvent(event.id);
    res.json({ ...event, attempts });
  });

  router.post("/:id/retry", (req, res): void => {
    const parsed = z
      .object({ attemptId: z.string().min(1) })
      .safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "attemptId required" });
      return;
    }
    const attempt = getAttempt(parsed.data.attemptId);
    // Guard: ensure the attempt belongs to the event in the URL.
    if (!attempt || attempt.event_id !== req.params.id) {
      res.status(404).json({ error: "attempt not found" });
      return;
    }
    queue.requeueDead(parsed.data.attemptId);
    res.json({ queued: true });
  });

  return router;
}
