import { Request, Response } from 'express';
import { AuthError } from '../services/AuthService';
import { deleteUser, getUserProfile, listUsers, updateUserPreferences, updateUserProfile, updateUserRole } from '../services/UserService';
import { logger } from '../config/logger';

export async function listUsersHandler(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;

    const result = await listUsers({ page, limit, search, role });
    res.status(200).json(result);
  } catch (err) {
    logger.error('listUsers error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getUserProfile(id, req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('getUser error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, avatar_url, timezone } = req.body ?? {};
    const result = await updateUserProfile(id, req.user!, { name, avatar_url, timezone });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('updateUser error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePreferencesHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { theme, notifications, timezone } = req.body ?? {};
    const result = await updateUserPreferences(id, req.user!, { theme, notifications, timezone });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('updatePreferences error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserRoleHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const role = typeof req.body === 'object' && req.body !== null ? req.body.role : undefined;
    const result = await updateUserRole(id, req.user!, { role });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('updateUserRole error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUserHandler(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteUser(id, req.user!);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('deleteUser error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


