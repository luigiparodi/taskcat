import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { AuthError, changePassword, getMe, githubAuth, login, logout, refresh, register } from '../services/AuthService';
import { logger } from '../config/logger';
import crypto from 'crypto';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerHandler(req: Request, res: Response) {
  const { email, password, name } = req.body ?? {};

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
    res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    return;
  }

  try {
    const result = await register({ email, password, name });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('register error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function githubLoginHandler(req: Request, res: Response) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!clientId || !frontendUrl) {
    logger.error('GitHub OAuth not configured');
    res.status(500).json({ error: 'GitHub OAuth is not configured' });
    return;
  }

  const state = crypto.randomUUID();
  const redirectUri = `${frontendUrl}/auth/github/callback`;

  res.cookie('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
    allow_signup: 'true',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = req.body ?? {};

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({ error: 'A valid email is required' });
    return;
  }
  if (typeof password !== 'string' || password.length === 0) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  try {
    const result = await login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('login error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined;
    const result = await logout(new ObjectId(req.user!.userId), refreshToken);
    res.status(200).json(result);
  } catch (err) {
    logger.error('logout error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function githubCallbackHandler(req: Request, res: Response) {
  const { code } = req.body ?? {};

  if (typeof code !== 'string' || code.length === 0) {
    res.status(400).json({ error: 'GitHub code is required' });
    return;
  }

  try {
    const result = await githubAuth(code);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('github callback error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const { refreshToken } = req.body ?? {};

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  try {
    const result = await refresh(refreshToken);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('refresh error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function meHandler(req: Request, res: Response) {
  try {
    const result = await getMe(req.user!.userId);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('me error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePasswordHandler(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body ?? {};

  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    res.status(400).json({ error: 'Current password is required' });
    return;
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters' });
    return;
  }

  try {
    const result = await changePassword(req.user!.userId, { currentPassword, newPassword });
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('changePassword error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


