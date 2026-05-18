import { Request, Response, NextFunction } from 'express';

export function adminAuth(adminKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.headers['x-admin-key'];
    if (key !== adminKey) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  };
}
