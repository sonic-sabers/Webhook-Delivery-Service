import { Request, Response, NextFunction } from "express";

/**
 * Simple shared-secret authentication for all /api routes.
 *
 * Clients must send `x-admin-key: <value>` matching the ADMIN_KEY env var.
 * Defaults to "secret" in development; always set a strong value in production.
 */
export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.headers["x-admin-key"];
  const expected = process.env.ADMIN_KEY ?? "secret";
  if (key !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
}
