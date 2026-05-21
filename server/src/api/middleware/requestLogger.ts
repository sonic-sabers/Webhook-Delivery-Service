import { Request, Response, NextFunction } from 'express';
import { httpLogger, c } from '../../logging/logger';

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

  // Capture response body by wrapping res.json
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

// Strip secret/key fields from logged bodies
function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const safe = { ...(body as Record<string, unknown>) };
  for (const key of ['secret', 'password', 'token', 'key']) {
    if (key in safe) safe[key] = '[redacted]';
  }
  return safe;
}
