import { Request, Response, NextFunction } from 'express';
import { httpLogger, c } from '../../logging/logger';

/**
 * HTTP request/response logger middleware.
 *
 * Logs an inbound request immediately (debug level), then logs the outbound
 * response on the 'finish' event with duration and status-based log level.
 *
 * Uses req.originalUrl (not req.path) to preserve the full path including the
 * Express router prefix — req.path is stripped by sub-routers to just "/".
 *
 * Honours an incoming x-request-id header for distributed tracing; generates
 * a UUID when absent and echoes it back in the response header.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const reqId = (req.headers['x-request-id'] as string) ?? crypto.randomUUID();
  res.setHeader('x-request-id', reqId);

  const url = req.originalUrl;
  const log = httpLogger.child({ reqId });

  log.debug(
    { method: req.method, url, query: req.query, body: sanitizeBody(req.body) },
    `${c.method(req.method)} ${c.path(url)} ${c.id(reqId)} ← req`
  );

  // Wrap res.json to capture the response body for structured logging on finish.
  let responseBody: unknown;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    log[level](
      { method: req.method, url, status: res.statusCode, ms, responseBody },
      `${c.method(req.method)} ${c.path(url)} ${c.status(res.statusCode)} ${c.ms(ms)} ${c.id(reqId)} → res`
    );
  });

  next();
}

/** Redacts sensitive fields from request bodies before they reach the log sink. */
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const safe = { ...(body as Record<string, unknown>) };
  for (const key of ['secret', 'password', 'token', 'key']) {
    if (key in safe) safe[key] = '[redacted]';
  }
  return safe;
}
