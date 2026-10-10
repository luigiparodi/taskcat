import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/database';
import { getUserCollection, User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

const REFRESH_COLLECTION = 'refresh_tokens';

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  preferences: User['preferences'];
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: (user._id as ObjectId).toHexString(),
    email: user.email,
    name: user.name,
    role: user.role,
    preferences: user.preferences,
  };
}

export function signAccessToken(user: User): string {
  return jwt.sign({ userId: (user._id as ObjectId).toHexString(), role: user.role }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

export function signRefreshToken(user: User): string {
  return jwt.sign({ userId: (user._id as ObjectId).toHexString() }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

export async function persistRefreshToken(userId: ObjectId, token: string) {
  await getDb().collection(REFRESH_COLLECTION).insertOne({
    userId,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  });
}

export async function revokeAllRefreshTokens(userId: ObjectId) {
  await getDb().collection(REFRESH_COLLECTION).deleteMany({ userId });
}

export async function register(input: { email: string; password: string; name: string }) {
  const email = input.email.trim().toLowerCase();
  const users = getUserCollection();

  const existing = await users.findOne({ email });
  if (existing) {
    throw new AuthError('Email already exists', 400);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const now = new Date();
  const user: User = {
    email,
    name: input.name.trim(),
    passwordHash,
    provider: 'email',
    role: 'worker',
    status: 'active',
    preferences: { theme: 'light', notifications: true, timezone: 'UTC' },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const { insertedId } = await users.insertOne(user);
  user._id = insertedId;

  const token = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefreshToken(insertedId, refreshToken);

  return { id: insertedId.toHexString(), email: user.email, token, refreshToken, user: toPublicUser(user) };
}

export async function login(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const users = getUserCollection();

  const existing = await users.findOne({ email });
  if (!existing || !existing.passwordHash) {
    throw new AuthError('Invalid credentials', 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, existing.passwordHash);
  if (!passwordMatches) {
    throw new AuthError('Invalid credentials', 401);
  }

  if (existing.status !== 'active') {
    throw new AuthError('Account is not active', 403);
  }

  const token = signAccessToken(existing);
  const refreshToken = signRefreshToken(existing);
  await persistRefreshToken(existing._id as ObjectId, refreshToken);

  return {
    id: (existing._id as ObjectId).toHexString(),
    email: existing.email,
    token,
    refreshToken,
    user: toPublicUser(existing),
  };
}

export async function logout(userId: ObjectId, refreshToken?: string) {
  if (refreshToken) {
    await getDb().collection(REFRESH_COLLECTION).deleteOne({ userId, token: refreshToken });
  }
  return { success: true };
}

export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
  const user = await getUserById(new ObjectId(userId));
  if (!user || user.status !== 'active') {
    throw new AuthError('User not found', 404);
  }

  if (!user.passwordHash) {
    throw new AuthError('Password change is not available for GitHub accounts', 400);
  }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new AuthError('Current password is incorrect', 400);
  }

  if (input.newPassword.length < 8) {
    throw new AuthError('New password must be at least 8 characters', 400);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await getUserCollection().updateOne(
    { _id: user._id },
    { $set: { passwordHash, updatedAt: new Date() } }
  );
  await revokeAllRefreshTokens(user._id as ObjectId);

  return { success: true };
}

export async function getUserById(id: ObjectId): Promise<User | null> {
  return getUserCollection().findOne({ _id: id });
}

export async function getMe(userId: string) {
  const user = await getUserById(new ObjectId(userId));
  if (!user || user.status !== 'active') {
    throw new AuthError('User not found', 404);
  }
  return toPublicUser(user);
}

export async function refresh(token: string) {
  let payload: { userId: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    throw new AuthError('Invalid or expired refresh token', 401);
  }

  const userId = new ObjectId(payload.userId);
  const refreshTokens = getDb().collection(REFRESH_COLLECTION);

  const stored = await refreshTokens.findOne({ userId, token });
  if (!stored || stored.expiresAt.getTime() < Date.now()) {
    throw new AuthError('Invalid or expired refresh token', 401);
  }

  const user = await getUserById(userId);
  if (!user || user.status !== 'active') {
    throw new AuthError('Invalid or expired refresh token', 401);
  }

  const accessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  await refreshTokens.deleteOne({ userId, token });
  await persistRefreshToken(userId, newRefreshToken);

  return { token: accessToken, refreshToken: newRefreshToken };
}

interface GitHubProfile {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export async function githubAuth(code: string) {
  const token = await exchangeGitHubCode(code);
  const profile = await fetchGitHubProfile(token);
  const users = getUserCollection();

  const email = profile.email?.toLowerCase();

  let user = await users.findOne({
    $or: [{ provider: 'github', providerId: String(profile.id) }, ...(email ? [{ email }] : [])],
  });

  if (!user) {
    const now = new Date();
    const newUser: User = {
      email: email ?? `github-${profile.id}@users.noreply.github.com`,
      name: profile.name?.trim() || 'GitHub User',
      avatarUrl: profile.avatar_url,
      provider: 'github',
      providerId: String(profile.id),
      role: 'worker',
      status: 'active',
      preferences: { theme: 'light', notifications: true, timezone: 'UTC' },
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const { insertedId } = await users.insertOne(newUser);
    user = { ...newUser, _id: insertedId };
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefreshToken(user._id as ObjectId, refreshToken);

  return {
    id: (user._id as ObjectId).toHexString(),
    email: user.email,
    token: accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

async function exchangeGitHubCode(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new AuthError('GitHub OAuth is not configured', 500);
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  if (!res.ok) {
    throw new AuthError('Failed to exchange GitHub code', 400);
  }

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new AuthError('Failed to exchange GitHub code', 400);
  }
  return data.access_token;
}

async function fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'taskcat-app' },
  });

  if (!res.ok) {
    throw new AuthError('Failed to fetch GitHub profile', 400);
  }

  const profile = (await res.json()) as GitHubProfile;
  return profile;
}

