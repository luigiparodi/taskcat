import { ObjectId } from 'mongodb';
import { getUserCollection, User } from '../models/User';
import { AuthError, getUserById as getAuthUserById, revokeAllRefreshTokens, toPublicUser } from './AuthService';
import { logAudit } from './AuditService';

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

export interface UserListOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export async function listUsers(options: UserListOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, options.limit ?? PAGE_SIZE_DEFAULT));

  const query: Record<string, unknown> = { status: { $ne: 'deleted' } };
  if (options.role) {
    query.role = options.role;
  }
  if (options.search) {
    const regex = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: regex }, { email: regex }];
  }

  const users = getUserCollection();
  const total = await users.countDocuments(query);
  const docs = await users
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return {
    users: docs.map(toPublicUser),
    total,
    page,
    limit,
  };
}

export async function getUserProfile(id: string, requester: { userId: string; role: string }) {
  let user: User | null;
  try {
    user = await getAuthUserById(new ObjectId(id));
  } catch {
    throw new AuthError('User not found', 404);
  }

  if (!user || user.status === 'deleted') {
    throw new AuthError('User not found', 404);
  }

  const isSelf = user._id?.toHexString() === requester.userId;
  if (!isSelf && requester.role !== 'admin') {
    throw new AuthError('Forbidden', 403);
  }

  return toPublicUser(user);
}

export async function updateUserPreferences(
  id: string,
  requester: { userId: string },
  input: { theme?: string; notifications?: boolean; timezone?: string }
) {
  let user: User | null;
  try {
    user = await getAuthUserById(new ObjectId(id));
  } catch {
    throw new AuthError('User not found', 404);
  }

  if (!user || user.status === 'deleted') {
    throw new AuthError('User not found', 404);
  }

  if (user._id?.toHexString() !== requester.userId) {
    throw new AuthError('Forbidden', 403);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (input.theme !== undefined) {
    if (input.theme !== 'light' && input.theme !== 'dark') {
      throw new AuthError('Theme must be "light" or "dark"', 400);
    }
    updates['preferences.theme'] = input.theme;
  }
  if (input.notifications !== undefined) {
    if (typeof input.notifications !== 'boolean') {
      throw new AuthError('Notifications must be a boolean', 400);
    }
    updates['preferences.notifications'] = input.notifications;
  }
  if (input.timezone !== undefined) {
    if (typeof input.timezone !== 'string' || input.timezone.length === 0) {
      throw new AuthError('A valid timezone is required', 400);
    }
    updates['preferences.timezone'] = input.timezone;
  }

  const users = getUserCollection();
  await users.updateOne({ _id: user._id }, { $set: updates });

  const updated = await getAuthUserById(user._id as ObjectId);
  return updated ? toPublicUser(updated) : toPublicUser(user);
}

export async function deleteUser(id: string, requester: { userId: string; role: string }) {
  let user: User | null;
  try {
    user = await getAuthUserById(new ObjectId(id));
  } catch {
    throw new AuthError('User not found', 404);
  }

  if (!user || user.status === 'deleted') {
    throw new AuthError('User not found', 404);
  }

  if (requester.role !== 'admin') {
    throw new AuthError('Forbidden', 403);
  }

  if (user._id?.toHexString() === requester.userId) {
    throw new AuthError('You cannot delete your own account', 403);
  }

  const users = getUserCollection();
  await users.updateOne(
    { _id: user._id },
    { $set: { status: 'deleted', deletedAt: new Date(), updatedAt: new Date() } }
  );
  await revokeAllRefreshTokens(user._id as ObjectId);

  logAudit({
    entityType: 'user',
    entityId: id,
    action: 'deleted',
    actorId: new ObjectId(requester.userId),
    summary: `User "${user.email}" deleted`,
  });

  return { success: true };
}

export const ASSIGNABLE_ROLES = ['admin', 'worker'] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

function isAssignableRole(value: unknown): value is AssignableRole {
  return value === 'admin' || value === 'worker';
}

/**
 * Change a user's role. Admin-only (enforced by the route's requireRole('admin')).
 *
 * The role lives on the user document, not in the access token, and requireAuth re-reads it
 * on every request. A demotion therefore takes effect on the target's next request rather
 * than lingering until their token expires, so no session revocation is needed here.
 */
export async function updateUserRole(
  id: string,
  requester: { userId: string; role: string },
  input: { role?: unknown }
) {
  if (requester.role !== 'admin') {
    throw new AuthError('Forbidden', 403);
  }

  if (!isAssignableRole(input.role)) {
    throw new AuthError('Role must be "admin" or "worker"', 400);
  }
  const nextRole = input.role;

  let user: User | null;
  try {
    user = await getAuthUserById(new ObjectId(id));
  } catch {
    throw new AuthError('User not found', 404);
  }

  if (!user || user.status === 'deleted') {
    throw new AuthError('User not found', 404);
  }

  if (user.role === nextRole) {
    return toPublicUser(user);
  }

  // Guard the last administrator: demoting them would leave nobody able to manage projects,
  // users, or roles, and there is no recovery path short of direct database access.
  if (user.role === 'admin' && nextRole === 'worker') {
    const users = getUserCollection();
    const remainingAdmins = await users.countDocuments({
      role: 'admin',
      status: { $ne: 'deleted' },
      _id: { $ne: user._id },
    });
    if (remainingAdmins === 0) {
      throw new AuthError('Cannot demote the last remaining administrator', 409);
    }
  }

  const users = getUserCollection();
  await users.updateOne({ _id: user._id }, { $set: { role: nextRole, updatedAt: new Date() } });

  logAudit({
    entityType: 'user',
    entityId: id,
    action: 'role_changed',
    actorId: new ObjectId(requester.userId),
    summary: `Role of "${user.email}" changed from ${user.role} to ${nextRole}`,
  });

  const updated = await getAuthUserById(user._id as ObjectId);
  return updated ? toPublicUser(updated) : toPublicUser(user);
}

export async function updateUserProfile(
  id: string,
  requester: { userId: string; role: string },
  input: { name?: string; avatar_url?: string; timezone?: string }
) {
  let user: User | null;
  try {
    user = await getAuthUserById(new ObjectId(id));
  } catch {
    throw new AuthError('User not found', 404);
  }

  if (!user || user.status === 'deleted') {
    throw new AuthError('User not found', 404);
  }

  const isSelf = user._id?.toHexString() === requester.userId;
  if (!isSelf && requester.role !== 'admin') {
    throw new AuthError('Forbidden', 403);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 50) {
      throw new AuthError('Name must be between 2 and 50 characters', 400);
    }
    updates.name = name;
  }
  if (input.avatar_url !== undefined) {
    if (typeof input.avatar_url !== 'string' || input.avatar_url.length > 2048) {
      throw new AuthError('A valid avatar URL is required', 400);
    }
    updates.avatarUrl = input.avatar_url;
  }
  if (input.timezone !== undefined) {
    if (typeof input.timezone !== 'string' || input.timezone.length === 0) {
      throw new AuthError('A valid timezone is required', 400);
    }
    updates['preferences.timezone'] = input.timezone;
  }

  const users = getUserCollection();
  await users.updateOne({ _id: user._id }, { $set: updates });

  const updated = await getAuthUserById(user._id as ObjectId);
  return updated ? toPublicUser(updated) : toPublicUser(user);
}


