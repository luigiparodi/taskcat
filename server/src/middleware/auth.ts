import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getUserCollection } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthUser {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const token = header.slice(7);
  let payload: { userId: string; role: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  // A JWT cannot be revoked, so a soft-deleted account would otherwise keep working
  // until its access token expired. Re-read the account and reject anything not active.
  // Authority comes from that read too, NOT from the token's role claim: otherwise a
  // demoted admin would keep admin access until their token expired (15m).
  loadActiveAccount(payload.userId).then(
    (account) => {
      if (!account) {
        res.status(401).json({ error: 'Unauthenticated' });
        return;
      }
      req.user = { userId: payload.userId, role: account.role };
      next();
    },
    () => {
      // Never fail open: an unreadable account is treated as not authenticated.
      res.status(401).json({ error: 'Unauthenticated' });
    }
  );
}

async function loadActiveAccount(userId: string): Promise<{ role: string } | null> {
  let user;
  try {
    // Keep the ObjectId construction inside the try: a malformed id throws and must
    // fail closed as 401 rather than escaping as a 500.
    user = await getUserCollection().findOne(
      { _id: new ObjectId(userId) },
      { projection: { status: 1, role: 1 } }
    );
  } catch {
    return null;
  }
  if (user === null || user.status !== 'active') return null;
  return { role: user.role };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

