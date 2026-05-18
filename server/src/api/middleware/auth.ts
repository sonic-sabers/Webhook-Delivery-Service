import { Request, Response, NextFunction } from "express";

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
