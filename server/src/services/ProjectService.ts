import { ObjectId } from 'mongodb';
import { getProjectCollection, getProjectMemberCollection } from '../models/Project';
import { getUserCollection } from '../models/User';
import {
  getTaskCollection,
  getTaskCommentCollection,
  getTaskHistoryCollection,
  getTaskLinkCollection,
} from '../models/Task';
import { AuthError } from './AuthService';
import { logAudit } from './AuditService';

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

export interface ProjectAccess {
  project: {
    _id: ObjectId;
    status?: string;
    endDate?: Date;
    reason?: string;
    startDate?: Date;
    title?: string;
    description?: string;
    clientName?: string;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: ObjectId;
  };
  membership: { role: string } | null;
}

export async function getProjectAccess(
  projectId: string,
  requester: { userId: string; role: string }
): Promise<ProjectAccess> {
  let project;
  try {
    project = await getProjectCollection().findOne({ _id: new ObjectId(projectId) });
  } catch {
    throw new AuthError('Project not found', 404);
  }

  if (!project) {
    throw new AuthError('Project not found', 404);
  }

  const membership = requester.role === 'admin' ? null : await getMembership(new ObjectId(projectId) as ObjectId, requester.userId);
  if (requester.role !== 'admin' && !membership) {
    throw new AuthError('Forbidden', 403);
  }

  return { project, membership };
}

export async function canManageProject(access: ProjectAccess, requester: { userId: string; role: string }) {
  if (requester.role === 'admin') return true;
  return access.membership?.role === 'admin';
}

export interface ProjectListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ProjectCreateInput {
  title: string;
  description?: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
}

export function toPublicProject(project: Record<string, unknown>) {
  return {
    id: (project._id as ObjectId).toHexString(),
    title: project.title,
    description: project.description,
    clientName: project.clientName,
    status: project.status,
    reason: project.reason,
    startDate: project.startDate ?? null,
    endDate: project.endDate ?? null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function isProjectAdmin(memberRole?: string) {
  return memberRole === 'admin';
}

export async function getMembership(projectId: ObjectId, userId: string) {
  return getProjectMemberCollection().findOne({ projectId, userId: new ObjectId(userId) });
}

export async function createProject(requester: { userId: string; role: string }, input: ProjectCreateInput) {
  if (requester.role !== 'admin') {
    throw new AuthError('Forbidden', 403);
  }

  const title = input.title.trim();
  if (title.length < 3 || title.length > 100) {
    throw new AuthError('Title must be between 3 and 100 characters', 400);
  }
  if (input.description !== undefined && input.description.length > 2000) {
    throw new AuthError('Description must be at most 2000 characters', 400);
  }

  const startDate = input.startDate ? new Date(input.startDate) : undefined;
  const endDate = input.endDate ? new Date(input.endDate) : undefined;
  if (startDate && Number.isNaN(startDate.getTime())) {
    throw new AuthError('A valid start date is required', 400);
  }
  if (endDate && Number.isNaN(endDate.getTime())) {
    throw new AuthError('A valid end date is required', 400);
  }
  if (startDate && endDate && endDate < startDate) {
    throw new AuthError('End date cannot be before start date', 400);
  }

  const now = new Date();
  const projects = getProjectCollection();
  const result = await projects.insertOne({
    title,
    description: input.description,
    clientName: input.clientName,
    status: 'active',
    startDate,
    endDate,
    createdBy: new ObjectId(requester.userId),
    createdAt: now,
    updatedAt: now,
  });

  await getProjectMemberCollection().insertOne({
    projectId: result.insertedId,
    userId: new ObjectId(requester.userId),
    role: 'admin',
    joinedAt: now,
  });

  const created = await projects.findOne({ _id: result.insertedId });
  const publicProject = toPublicProject(created!);
  logAudit({
    entityType: 'project',
    entityId: publicProject.id,
    action: 'created',
    actorId: new ObjectId(requester.userId),
    summary: `Project "${title}" created`,
  });
  return publicProject;
}

export interface ProjectUpdateInput {
  title?: string;
  description?: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
}

export async function removeProjectMember(
  projectId: string,
  requester: { userId: string; role: string },
  userId: string
) {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  let project;
  try {
    project = await getProjectCollection().findOne({ _id: new ObjectId(projectId) });
  } catch {
    throw new AuthError('Project not found', 404);
  }

  if (!project) {
    throw new AuthError('Project not found', 404);
  }

  const membership = await getProjectMemberCollection().findOne({
    projectId: new ObjectId(projectId),
    userId: new ObjectId(userId),
  });
  if (!membership) {
    throw new AuthError('Member not found', 404);
  }

  if (membership.role === 'admin') {
    throw new AuthError('The project admin cannot be removed', 400);
  }

  await getProjectMemberCollection().deleteOne({ _id: membership._id });

  return { success: true };
}

export async function addProjectMembers(
  projectId: string,
  requester: { userId: string; role: string },
  userIds: (string | ObjectId)[]
) {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  let project;
  try {
    project = await getProjectCollection().findOne({ _id: new ObjectId(projectId) });
  } catch {
    throw new AuthError('Project not found', 404);
  }

  if (!project) {
    throw new AuthError('Project not found', 404);
  }

  const ids = [...new Set(userIds.map((id) => (typeof id === 'string' ? new ObjectId(id) : id)))];
  if (ids.length === 0) {
    throw new AuthError('At least one user is required', 400);
  }

  const existingUsers = await getUserCollection().find({ _id: { $in: ids } }).toArray();
  const existingUserIds = new Set(existingUsers.map((u) => (u._id as ObjectId).toHexString()));
  const validIds = ids.filter((id) => existingUserIds.has(id.toHexString()));

  const memberships = await getProjectMemberCollection()
    .find({ projectId: new ObjectId(projectId), userId: { $in: validIds } })
    .toArray();
  const existingMemberIds = new Set(memberships.map((m) => m.userId.toHexString()));
  const toAdd = validIds.filter((id) => !existingMemberIds.has(id.toHexString()));

  const now = new Date();
  if (toAdd.length > 0) {
    await getProjectMemberCollection().insertMany(
      toAdd.map((userId) => ({ projectId: new ObjectId(projectId) as ObjectId, userId, role: 'member' as const, joinedAt: now }))
    );
  }

  return { added: toAdd.length, message: `${toAdd.length} user(s) added` };
}

export async function listProjectMembers(projectId: string, requester: { userId: string; role: string }) {
  const access = await getProjectAccess(projectId, requester);
  // getProjectAccess already throws if not a member/admin

  const memberships = await getProjectMemberCollection()
    .find({ projectId: new ObjectId(projectId) })
    .sort({ joinedAt: 1 })
    .toArray();

  const userIds = memberships.map((m) => m.userId);
  const users = userIds.length
    ? await getUserCollection().find({ _id: { $in: userIds } }).toArray()
    : [];

  const userMap = new Map(users.map((u) => [(u._id as ObjectId).toHexString(), u]));

  return {
    total: memberships.length,
    members: memberships.map((m) => {
      const user = userMap.get((m.userId as ObjectId).toHexString());
      return {
        id: (m.userId as ObjectId).toHexString(),
        name: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        avatar: user?.avatarUrl ?? null,
        role: m.role,
        joinedAt: m.joinedAt,
      };
    }),
  };
}

export interface AvailableUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AvailableUsersResult {
  users: Array<{ id: string; name: string; email: string; avatarUrl?: string | null }>;
  total: number;
  page: number;
  limit: number;
}

export async function listAvailableUsers(
  projectId: string,
  requester: { userId: string; role: string },
  options: AvailableUsersOptions = {}
): Promise<AvailableUsersResult> {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));

  const memberships = await getProjectMemberCollection()
    .find({ projectId: new ObjectId(projectId) })
    .toArray();
  const memberIds = memberships.map((m) => m.userId);

  const query: Record<string, unknown> = {
    status: { $ne: 'deleted' },
    _id: { $nin: memberIds },
  };
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
    users: docs.map((u) => ({
      id: (u._id as ObjectId).toHexString(),
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl ?? null,
    })),
    total,
    page,
    limit,
  };
}

export async function activateProject(projectId: string, requester: { userId: string; role: string }) {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  const project = access.project;

  await getProjectCollection().updateOne(
    { _id: project._id },
    { $set: { status: 'active', updatedAt: new Date() } }
  );

  const updated = await getProjectCollection().findOne({ _id: project._id });
  const publicProject = toPublicProject(updated!);
  logAudit({
    entityType: 'project',
    entityId: publicProject.id,
    action: 'activated',
    actorId: new ObjectId(requester.userId),
    summary: `Project "${publicProject.title}" activated`,
  });
  return publicProject;
}

export async function deactivateProject(projectId: string, requester: { userId: string; role: string }, reason?: string) {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  const project = access.project;

  await getProjectCollection().updateOne(
    { _id: project._id },
    { $set: { status: 'inactive', reason: reason ?? project.reason, updatedAt: new Date() } }
  );

  const updated = await getProjectCollection().findOne({ _id: project._id });
  const publicProject = toPublicProject(updated!);
  logAudit({
    entityType: 'project',
    entityId: publicProject.id,
    action: 'deactivated',
    actorId: new ObjectId(requester.userId),
    summary: `Project "${publicProject.title}" deactivated${reason ? `: ${reason}` : ''}`,
  });
  return publicProject;
}

export async function deleteProject(projectId: string, requester: { userId: string; role: string }) {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  let project;
  try {
    project = await getProjectCollection().findOne({ _id: new ObjectId(projectId) });
  } catch {
    throw new AuthError('Project not found', 404);
  }

  if (!project) {
    throw new AuthError('Project not found', 404);
  }

  await getProjectMemberCollection().deleteMany({ projectId: new ObjectId(projectId) });

  const tasks = await getTaskCollection().find({ projectId: new ObjectId(projectId) }).toArray();
  if (tasks.length > 0) {
    const taskIds = tasks.map((task) => task._id as ObjectId);
    await Promise.all([
      getTaskCommentCollection().deleteMany({ taskId: { $in: taskIds } }),
      getTaskLinkCollection().deleteMany({ taskId: { $in: taskIds } }),
      getTaskHistoryCollection().deleteMany({ taskId: { $in: taskIds } }),
    ]);
    await getTaskCollection().deleteMany({ projectId: new ObjectId(projectId) });
  }

  await getProjectCollection().deleteOne({ _id: new ObjectId(projectId) });

  logAudit({
    entityType: 'project',
    entityId: projectId,
    action: 'deleted',
    actorId: new ObjectId(requester.userId),
    summary: `Project "${project.title}" deleted`,
  });

  return { success: true };
}

export async function updateProject(projectId: string, requester: { userId: string; role: string }, input: ProjectUpdateInput) {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  const project = access.project;

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 3 || title.length > 100) {
      throw new AuthError('Title must be between 3 and 100 characters', 400);
    }
    updates.title = title;
  }
  if (input.description !== undefined) {
    if (input.description.length > 2000) {
      throw new AuthError('Description must be at most 2000 characters', 400);
    }
    updates.description = input.description;
  }
  if (input.clientName !== undefined) {
    updates.clientName = input.clientName;
  }

  let startDate = project.startDate;
  let endDate = project.endDate;
  if (input.startDate !== undefined) {
    // Parse YYYY-MM-DD as local midnight (not UTC)
    const [startYear, startMonth, startDay] = input.startDate.split('-').map(Number);
    startDate = new Date(startYear, startMonth - 1, startDay);
    if (Number.isNaN(startDate.getTime())) {
      throw new AuthError('A valid start date is required', 400);
    }
    updates.startDate = startDate;
  }
  if (input.endDate !== undefined) {
    // Parse YYYY-MM-DD as local midnight (not UTC)
    const [endYear, endMonth, endDay] = input.endDate.split('-').map(Number);
    endDate = new Date(endYear, endMonth - 1, endDay);
    if (Number.isNaN(endDate.getTime())) {
      throw new AuthError('A valid end date is required', 400);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate < today) {
      throw new AuthError('End date cannot be in the past', 400);
    }
    updates.endDate = endDate;
  }
  if (startDate && endDate && endDate < startDate) {
    throw new AuthError('End date cannot be before start date', 400);
  }

  await getProjectCollection().updateOne({ _id: project._id }, { $set: updates });

  const updated = await getProjectCollection().findOne({ _id: project._id });
  const publicProject = toPublicProject(updated!);
  const changedFields = Object.keys(updates).filter((key) => key !== 'updatedAt');
  logAudit({
    entityType: 'project',
    entityId: publicProject.id,
    action: 'updated',
    actorId: new ObjectId(requester.userId),
    summary: `Project "${publicProject.title}" updated (${changedFields.join(', ') || 'metadata'})`,
  });
  return publicProject;
}

export async function getProjectDetail(projectId: string, requester: { userId: string; role: string }) {
  let project;
  try {
    project = await getProjectCollection().findOne({ _id: new ObjectId(projectId) });
  } catch {
    throw new AuthError('Project not found', 404);
  }

  if (!project) {
    throw new AuthError('Project not found', 404);
  }

  if (requester.role !== 'admin') {
    const membership = await getMembership(new ObjectId(projectId) as ObjectId, requester.userId);
    if (!membership) {
      throw new AuthError('Forbidden', 403);
    }
  }

  return toPublicProject(project);
}

export async function listProjects(requester: { userId: string; role: string }, options: ProjectListOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, options.limit ?? PAGE_SIZE_DEFAULT));

  const projects = getProjectCollection();

  if (requester.role !== 'admin') {
    const memberships = await getProjectMemberCollection().find({ userId: new ObjectId(requester.userId) }).toArray();
    if (memberships.length === 0) {
      return { projects: [], total: 0, page, limit };
    }
    const projectIds = memberships.map((m) => m.projectId);
    const query: Record<string, unknown> = { _id: { $in: projectIds } };
    if (options.status) {
      query.status = options.status;
    }
    if (options.search) {
      const regex = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.title = regex;
    }
    const total = await projects.countDocuments(query);
    const docs = await projects
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    return { projects: docs.map(toPublicProject), total, page, limit };
  }

  const query: Record<string, unknown> = {};
  if (options.status) {
    query.status = options.status;
  }
  if (options.search) {
    const regex = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.title = regex;
  }

  const total = await projects.countDocuments(query);
  const docs = await projects
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { projects: docs.map(toPublicProject), total, page, limit };
}


