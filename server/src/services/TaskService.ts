import { ObjectId } from 'mongodb';
import {
  getTaskCollection,
  getTaskCommentCollection,
  getTaskHistoryCollection,
  getTaskLinkCollection,
  Task,
  TaskComment,
  TaskLink,
  TaskPriority,
  TaskStatus,
} from '../models/Task';
import { getProjectCollection } from '../models/Project';
import { AuthError } from './AuthService';
import { logAudit } from './AuditService';
import { getMembership } from './ProjectService';

const TITLE_MIN = 3;
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;

export interface TaskCreateInput {
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: string;
  end_date?: string;
  estimated_hours?: number;
}

export function toPublicTask(task: Task) {
  return {
    id: (task._id as ObjectId).toHexString(),
    projectId: task.projectId.toHexString(),
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    priority: task.priority,
    assignedTo: task.assignedTo ? task.assignedTo.toHexString() : null,
    estimatedHours: task.estimatedHours ?? null,
    actualHours: task.actualHours ?? null,
    endDate: task.endDate ?? null,
    completedAt: task.completedAt ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const VALID_STATUSES: TaskStatus[] = ['pending', 'working', 'finished'];

export function isValidPriority(value: string): value is TaskPriority {
  return VALID_PRIORITIES.includes(value as TaskPriority);
}

export function isValidStatus(value: string): value is TaskStatus {
  return VALID_STATUSES.includes(value as TaskStatus);
}

export interface ProjectAccess {
  project: { _id?: ObjectId; status?: string; endDate?: Date };
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

  const membership = requester.role === 'admin' ? null : await getMembership(project._id as ObjectId, requester.userId);
  if (requester.role !== 'admin' && !membership) {
    throw new AuthError('Forbidden', 403);
  }

  return { project, membership };
}

export async function canManageProject(access: ProjectAccess, requester: { role: string }) {
  if (requester.role === 'admin') return true;
  return access.membership?.role === 'admin';
}

export async function getTaskDetail(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string }
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }

  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  return toPublicTask(task);
}

export interface TaskUpdateInput {
    title?: string;
    description?: string;
    assigned_to?: string | null;
    priority?: string;
    end_date?: string | null;
    estimated_hours?: number | null;
  }

export async function updateTask(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string },
  input: TaskUpdateInput
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const isAdmin = await canManageProject(access, requester);
  const isAssignee = task.assignedTo !== null && task.assignedTo.toHexString() === requester.userId;
  if (!isAdmin && !isAssignee) {
    throw new AuthError('Forbidden', 403);
  }

const update: Partial<Task> = {};
    const changes: Array<{ action: string; oldValue: string | null; newValue: string | null }> = [];

    const asText = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'object' && '_id' in value && value._id instanceof ObjectId) {
        return value._id.toHexString();
      }
      return String(value);
    };

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
        throw new AuthError(`Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`, 400);
      }
      update.title = title;
      if (title !== task.title) {
        changes.push({ action: 'title_changed', oldValue: task.title, newValue: title });
      }
    }

if (input.description !== undefined) {
      if (input.description.length > DESCRIPTION_MAX) {
        throw new AuthError(`Description must be at most ${DESCRIPTION_MAX} characters`, 400);
      }
      update.description = input.description;
      if (input.description !== task.description) {
        changes.push({
          action: 'description_changed',
          oldValue: task.description ?? null,
          newValue: input.description,
        });
      }
    }

if (input.priority !== undefined) {
      if (!isValidPriority(input.priority)) {
        throw new AuthError('Priority must be one of low, medium, high, urgent', 400);
      }
      update.priority = input.priority;
      if (input.priority !== task.priority) {
        changes.push({
          action: 'priority_changed',
          oldValue: task.priority,
          newValue: input.priority,
        });
      }
    }

if (input.estimated_hours !== undefined) {
      if (input.estimated_hours === null) {
        update.estimatedHours = null;
        if (task.estimatedHours !== null && task.estimatedHours !== undefined) {
          changes.push({
            action: 'estimated_hours_changed',
            oldValue: asText(task.estimatedHours),
            newValue: null,
          });
        }
      } else {
        if (input.estimated_hours < 0) {
          throw new AuthError('Estimated hours cannot be negative', 400);
        }
        update.estimatedHours = input.estimated_hours;
        if (input.estimated_hours !== task.estimatedHours) {
          changes.push({
            action: 'estimated_hours_changed',
            oldValue: asText(task.estimatedHours),
            newValue: asText(input.estimated_hours),
          });
        }
      }
    }

if (input.end_date !== undefined) {
      if (input.end_date === null) {
        update.endDate = null;
        if (task.endDate) {
          changes.push({
            action: 'end_date_changed',
            oldValue: asText(task.endDate),
            newValue: null,
          });
        }
      } else {
        // Parse YYYY-MM-DD as local midnight (not UTC)
        const [year, month, day] = input.end_date.split('-').map(Number);
        const endDate = new Date(year, month - 1, day);
        if (Number.isNaN(endDate.getTime())) {
          throw new AuthError('A valid end date is required', 400);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (endDate < today) {
          throw new AuthError('End date cannot be in the past', 400);
        }
        update.endDate = endDate;
        if (task.endDate === null || task.endDate === undefined || task.endDate.getTime() !== endDate.getTime()) {
          changes.push({
            action: 'end_date_changed',
            oldValue: asText(task.endDate),
            newValue: asText(endDate),
          });
        }
      }
    }

  if (input.assigned_to !== undefined) {
    if (!isAdmin) {
      throw new AuthError('Only admins can reassign tasks', 403);
    }
    if (input.assigned_to === null) {
      update.assignedTo = null;
    } else {
      let assignedTo: ObjectId;
      try {
        assignedTo = new ObjectId(input.assigned_to);
      } catch {
        throw new AuthError('Invalid assignee', 400);
      }
      const membership = await getMembership(access.project._id as ObjectId, assignedTo.toHexString());
      if (!membership) {
        throw new AuthError('Assigned user must be a project member', 400);
      }
update.assignedTo = assignedTo;
    }

    const previousAssignee = task.assignedTo ? task.assignedTo.toHexString() : null;
    const nextAssignee = update.assignedTo ? update.assignedTo.toHexString() : null;
    if (previousAssignee !== nextAssignee) {
      changes.push({
        action: 'assigned_to_changed',
        oldValue: previousAssignee,
        newValue: nextAssignee,
      });
    }
  }

update.updatedAt = new Date();

  const taskObjectId = task._id as ObjectId;

  await getTaskCollection().updateOne({ _id: taskObjectId }, { $set: update });

  if (changes.length > 0) {
    const historyNow = update.updatedAt;
    await getTaskHistoryCollection().insertMany(
      changes.map((change) => ({
        taskId: taskObjectId,
        userId: new ObjectId(requester.userId),
        action: change.action,
        oldValue: change.oldValue,
        newValue: change.newValue,
        createdAt: historyNow,
      }))
    );
  }

  return toPublicTask({ ...task, ...update } as Task);
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string }
) {
  const access = await getProjectAccess(projectId, requester);

  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  await Promise.all([
    getTaskCommentCollection().deleteMany({ taskId: task._id }),
    getTaskLinkCollection().deleteMany({ taskId: task._id }),
    getTaskHistoryCollection().deleteMany({ taskId: task._id }),
  ]);
  await getTaskCollection().deleteOne({ _id: task._id });

  logAudit({
    entityType: 'task',
    entityId: taskId,
    action: 'deleted',
    actorId: new ObjectId(requester.userId),
    summary: `Task "${task.title}" deleted`,
  });
}

export interface TaskStatusInput {
  status: string;
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string },
  input: TaskStatusInput
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const isAdmin = await canManageProject(access, requester);
  const isAssignee = task.assignedTo !== null && task.assignedTo.toHexString() === requester.userId;
  if (!isAdmin && !isAssignee) {
    throw new AuthError('Forbidden', 403);
  }

  if (!isValidStatus(input.status)) {
    throw new AuthError('Status must be one of pending, working, finished', 400);
  }

  const completedAt = input.status === 'finished' ? task.completedAt ?? new Date() : null;
  const update = { status: input.status, completedAt, updatedAt: new Date() };
  const taskObjectId = task._id as ObjectId;

  await getTaskCollection().updateOne({ _id: taskObjectId }, { $set: update });

  await getTaskHistoryCollection().insertOne({
    taskId: taskObjectId,
    userId: new ObjectId(requester.userId),
    action: 'status_changed',
    oldValue: task.status,
    newValue: input.status,
    createdAt: update.updatedAt,
  });

  logAudit({
    entityType: 'task',
    entityId: taskId,
    action: 'status_changed',
    actorId: new ObjectId(requester.userId),
    summary: `Task "${task.title}" status changed from ${task.status} to ${input.status}`,
  });

  return toPublicTask({ ...task, ...update } as Task);
}

export interface TaskBulkInput {
  tasks: TaskCreateInput[];
}

const BULK_MAX = 100;

export async function bulkCreateTasks(
  projectId: string,
  requester: { userId: string; role: string },
  input: TaskBulkInput
) {
  const access = await getProjectAccess(projectId, requester);

  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  const tasks = input.tasks;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new AuthError('At least one task is required', 400);
  }
  if (tasks.length > BULK_MAX) {
    throw new AuthError(`Cannot create more than ${BULK_MAX} tasks at once`, 400);
  }

  // Validate and build EVERY document before writing anything, so an invalid
  // task mid-batch can no longer leave earlier tasks behind (partial creates).
  const prepared: Task[] = [];
  for (const task of tasks) {
    prepared.push(await prepareTaskDocument(access, requester, task));
  }

  const now = new Date();
  const docs = prepared.map((doc) => ({ ...doc, _id: new ObjectId(), createdAt: now, updatedAt: now }));
  await getTaskCollection().insertMany(docs);

  for (const doc of docs) {
    logAudit({
      entityType: 'task',
      entityId: (doc._id as ObjectId).toHexString(),
      action: 'created',
      actorId: new ObjectId(requester.userId),
      summary: `Task "${doc.title}" created`,
    });
  }

  return docs.map((doc) => toPublicTask(doc));
}

const COMMENT_MAX = 2000;

export async function getTaskComments(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string }
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const comments = await getTaskCommentCollection()
    .find({ taskId: task._id as ObjectId })
    .sort({ createdAt: 1 })
    .toArray();

  return comments.map((comment) => ({
    id: (comment._id as ObjectId).toHexString(),
    taskId: comment.taskId.toHexString(),
    userId: comment.userId.toHexString(),
    content: comment.content,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt ?? null,
  }));
}

export interface TaskCommentCreateInput {
  content: string;
}

export async function createTaskComment(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string },
  input: TaskCommentCreateInput
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const content = input.content.trim();
  if (content.length === 0) {
    throw new AuthError('Comment content is required', 400);
  }
  if (content.length > COMMENT_MAX) {
    throw new AuthError(`Comment must be at most ${COMMENT_MAX} characters`, 400);
  }

  const now = new Date();
  const comment = {
    taskId: task._id as ObjectId,
    userId: new ObjectId(requester.userId),
    content,
    createdAt: now,
    editedAt: null,
  };

  const { insertedId } = await getTaskCommentCollection().insertOne(comment);
  return {
    id: insertedId.toHexString(),
    taskId: (task._id as ObjectId).toHexString(),
    userId: requester.userId,
    content,
    createdAt: now,
    editedAt: null,
  };
}

export async function deleteTaskComment(
  projectId: string,
  taskId: string,
  commentId: string,
  requester: { userId: string; role: string }
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const isAdmin = await canManageProject(access, requester);

  let comment: TaskComment | null;
  try {
    comment = await getTaskCommentCollection().findOne({
      _id: new ObjectId(commentId),
      taskId: task._id as ObjectId,
    });
  } catch {
    throw new AuthError('Comment not found', 404);
  }
  if (!comment) {
    throw new AuthError('Comment not found', 404);
  }

  if (!isAdmin && comment.userId.toHexString() !== requester.userId) {
    throw new AuthError('Forbidden', 403);
  }

  await getTaskCommentCollection().deleteOne({ _id: comment._id });
}

export interface TaskLinkCreateInput {
  url: string;
  title: string;
  description?: string;
}

const LINK_TITLE_MAX = 150;
const LINK_DESCRIPTION_MAX = 1000;

export async function getTaskLinks(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string }
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const links = await getTaskLinkCollection()
    .find({ taskId: task._id as ObjectId })
    .sort({ createdAt: -1 })
    .toArray();

  return links.map((link) => ({
    id: (link._id as ObjectId).toHexString(),
    taskId: link.taskId.toHexString(),
    userId: link.userId.toHexString(),
    url: link.url,
    title: link.title,
    description: link.description ?? null,
    createdAt: link.createdAt,
  }));
}

export async function createTaskLink(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string },
  input: TaskLinkCreateInput
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const title = input.title.trim();
  if (title.length === 0) {
    throw new AuthError('Title is required', 400);
  }
  if (title.length > LINK_TITLE_MAX) {
    throw new AuthError(`Title must be at most ${LINK_TITLE_MAX} characters`, 400);
  }
  if (input.description !== undefined && input.description.length > LINK_DESCRIPTION_MAX) {
    throw new AuthError(`Description must be at most ${LINK_DESCRIPTION_MAX} characters`, 400);
  }

  let url: URL;
  try {
    url = new URL(input.url.trim());
  } catch {
    throw new AuthError('A valid url is required', 400);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AuthError('URL must use http or https', 400);
  }

  const now = new Date();
  const link = {
    taskId: task._id as ObjectId,
    userId: new ObjectId(requester.userId),
    url: url.toString(),
    title,
    description: input.description,
    createdAt: now,
  };

  const { insertedId } = await getTaskLinkCollection().insertOne(link);
  return {
    id: insertedId.toHexString(),
    taskId: (task._id as ObjectId).toHexString(),
    userId: requester.userId,
    url: url.toString(),
    title,
    description: input.description ?? null,
    createdAt: now,
  };
}

export async function deleteTaskLink(
  projectId: string,
  taskId: string,
  linkId: string,
  requester: { userId: string; role: string }
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const isAdmin = await canManageProject(access, requester);

  let link: TaskLink | null;
  try {
    link = await getTaskLinkCollection().findOne({
      _id: new ObjectId(linkId),
      taskId: task._id as ObjectId,
    });
  } catch {
    throw new AuthError('Link not found', 404);
  }
  if (!link) {
    throw new AuthError('Link not found', 404);
  }

  if (!isAdmin && link.userId.toHexString() !== requester.userId) {
    throw new AuthError('Forbidden', 403);
  }

  await getTaskLinkCollection().deleteOne({ _id: link._id });
}

export interface TaskHistoryFilters {
  limit?: number;
}

const HISTORY_DEFAULT_LIMIT = 50;
const HISTORY_MAX_LIMIT = 200;

export async function getTaskHistory(
  projectId: string,
  taskId: string,
  requester: { userId: string; role: string },
  filters: TaskHistoryFilters = {}
) {
  const access = await getProjectAccess(projectId, requester);

  let task: Task | null;
  try {
    task = await getTaskCollection().findOne({
      _id: new ObjectId(taskId),
      projectId: access.project._id,
    });
  } catch {
    throw new AuthError('Task not found', 404);
  }
  if (!task) {
    throw new AuthError('Task not found', 404);
  }

  const rawLimit = filters.limit ?? HISTORY_DEFAULT_LIMIT;
  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    throw new AuthError('Limit must be a positive integer', 400);
  }
  const limit = Math.min(rawLimit, HISTORY_MAX_LIMIT);

  const entries = await getTaskHistoryCollection()
    .find({ taskId: task._id as ObjectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return entries.map((entry) => ({
    id: (entry._id as ObjectId).toHexString(),
    taskId: entry.taskId.toHexString(),
    userId: entry.userId.toHexString(),
    action: entry.action,
    oldValue: entry.oldValue ?? null,
    newValue: entry.newValue ?? null,
    createdAt: entry.createdAt,
  }));
}

export interface TaskListFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  search?: string;
}

export async function listProjectTasks(
  projectId: string,
  requester: { userId: string; role: string },
  filters: TaskListFilters = {}
) {
  const access = await getProjectAccess(projectId, requester);

  const query: Record<string, unknown> = { projectId: access.project._id };
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.priority) {
    query.priority = filters.priority;
  }
  if (filters.assigned_to) {
    query.assignedTo = new ObjectId(filters.assigned_to);
  }
  if (filters.search) {
    const regex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.title = regex;
  }

  const docs = await getTaskCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  const tasks = docs.map(toPublicTask);
  return {
    pending: tasks.filter((t) => t.status === 'pending'),
    working: tasks.filter((t) => t.status === 'working'),
    finished: tasks.filter((t) => t.status === 'finished'),
  };
}

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

export interface ProjectTaskQuery {
  search?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  page?: number;
  limit?: number;
}

interface ProjectTaskQueryOptions {
  match?: Record<string, unknown>;
  page?: number;
  limit?: number;
}

/**
 * Shared by the search and filter endpoints: a flat, paginated task list for a project.
 * The kanban list above returns grouped columns; these two return `{ tasks, total, page, limit }`
 * instead, because a search result has no column to belong to.
 */
async function queryProjectTasks(
  projectId: string,
  requester: { userId: string; role: string },
  options: ProjectTaskQueryOptions = {}
) {
  const access = await getProjectAccess(projectId, requester);

  if (options.page !== undefined && (!Number.isInteger(options.page) || options.page < 1)) {
    throw new AuthError('Page must be a positive integer', 400);
  }
  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new AuthError('Limit must be a positive integer', 400);
  }

  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX);

  const query: Record<string, unknown> = { projectId: access.project._id };
  if (options.match) {
    Object.assign(query, options.match);
  }

  const total = await getTaskCollection().countDocuments(query);
  const docs = await getTaskCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { tasks: docs.map(toPublicTask), total, page, limit };
}

export async function searchProjectTasks(
  projectId: string,
  requester: { userId: string; role: string },
  query: ProjectTaskQuery = {}
) {
  const term = query.search?.trim() ?? '';
  if (term.length === 0) {
    throw new AuthError('A search term is required', 400);
  }

  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  return queryProjectTasks(projectId, requester, {
    match: { $or: [{ title: regex }, { description: regex }] },
    page: query.page,
    limit: query.limit,
  });
}

export async function filterProjectTasks(
  projectId: string,
  requester: { userId: string; role: string },
  query: ProjectTaskQuery = {}
) {
  const match: Record<string, unknown> = {};

  if (query.status !== undefined) {
    if (!isValidStatus(query.status)) {
      throw new AuthError('Status must be one of pending, working, finished', 400);
    }
    match.status = query.status;
  }

  if (query.priority !== undefined) {
    if (!isValidPriority(query.priority)) {
      throw new AuthError('Priority must be one of low, medium, high, urgent', 400);
    }
    match.priority = query.priority;
  }

  if (query.assigned_to !== undefined) {
    let assignedTo: ObjectId;
    try {
      assignedTo = new ObjectId(query.assigned_to);
    } catch {
      throw new AuthError('Invalid assignee', 400);
    }
    match.assignedTo = assignedTo;
  }

  return queryProjectTasks(projectId, requester, {
    match,
    page: query.page,
    limit: query.limit,
  });
}

export async function getUserTaskHistory(
  userId: string,
  requester: { userId: string; role: string },
  filters: {
    status?: string;
    priority?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  // Enforce self-or-admin (reuse the existing authorization logic by checking the target)
  // We don't need the full user object back, just to ensure access is allowed.
  const { getUserProfile } = await import('./UserService');
  await getUserProfile(userId, requester);

  if (filters.page !== undefined && (!Number.isInteger(filters.page) || filters.page < 1)) {
    throw new AuthError('Page must be a positive integer', 400);
  }
  if (filters.limit !== undefined && (!Number.isInteger(filters.limit) || filters.limit < 1)) {
    throw new AuthError('Limit must be a positive integer', 400);
  }

  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX);

  let targetId: ObjectId;
  try {
    targetId = new ObjectId(userId);
  } catch {
    throw new AuthError('User not found', 404);
  }

  const query: Record<string, unknown> = { assignedTo: targetId };

  if (filters.status !== undefined) {
    if (!isValidStatus(filters.status)) {
      throw new AuthError('Status must be one of pending, working, finished', 400);
    }
    query.status = filters.status;
  }
  if (filters.priority !== undefined) {
    if (!isValidPriority(filters.priority)) {
      throw new AuthError('Priority must be one of low, medium, high, urgent', 400);
    }
    query.priority = filters.priority;
  }

  if (filters.from_date !== undefined) {
    const [y, m, d] = filters.from_date.split('-').map(Number);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
      throw new AuthError('A valid from_date is required', 400);
    }
    query.createdAt = { ...(query.createdAt as Record<string, unknown>), $gte: new Date(y, m - 1, d) };
  }
  if (filters.to_date !== undefined) {
    const [y, m, d] = filters.to_date.split('-').map(Number);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) {
      throw new AuthError('A valid to_date is required', 400);
    }
    const end = new Date(y, m - 1, d);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { ...(query.createdAt as Record<string, unknown>), $lte: end };
  }

  const total = await getTaskCollection().countDocuments(query);
  const docs = await getTaskCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { tasks: docs.map(toPublicTask), total, page, limit };
}

/**
 * Validates a single task input and builds its document WITHOUT writing.
 * Shared by createTask and bulkCreateTasks so both apply identical rules and
 * bulk can validate every item before inserting any (all-or-nothing).
 * Access and manage-permission must already be checked by the caller.
 */
async function prepareTaskDocument(
  access: ProjectAccess,
  requester: { userId: string; role: string },
  input: TaskCreateInput
): Promise<Omit<Task, '_id'>> {
  const title = input.title.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    throw new AuthError(`Title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`, 400);
  }
  if (input.description !== undefined && input.description.length > DESCRIPTION_MAX) {
    throw new AuthError(`Description must be at most ${DESCRIPTION_MAX} characters`, 400);
  }

  const priority = (input.priority ?? 'medium') as TaskPriority;
  if (!isValidPriority(priority)) {
    throw new AuthError('Priority must be one of low, medium, high, urgent', 400);
  }

  let endDate: Date | undefined;
  if (input.end_date !== undefined) {
    // Parse YYYY-MM-DD as local midnight (not UTC)
    const [year, month, day] = input.end_date.split('-').map(Number);
    endDate = new Date(year, month - 1, day);
    if (Number.isNaN(endDate.getTime())) {
      throw new AuthError('A valid end date is required', 400);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDate < today) {
      throw new AuthError('End date cannot be in the past', 400);
    }
  }

  let assignedTo: ObjectId | null = null;
  if (input.assigned_to) {
    assignedTo = new ObjectId(input.assigned_to);
    const membership = await getMembership(access.project._id as ObjectId, assignedTo.toHexString());
    if (!membership) {
      throw new AuthError('Assigned user must be a project member', 400);
    }
  }

  const now = new Date();
  return {
    projectId: access.project._id as ObjectId,
    title,
    description: input.description,
    status: 'pending',
    priority,
    assignedTo,
    estimatedHours: input.estimated_hours,
    endDate,
    completedAt: null,
    createdBy: new ObjectId(requester.userId),
    createdAt: now,
    updatedAt: now,
  };
}

export async function createTask(
  projectId: string,
  requester: { userId: string; role: string },
  input: TaskCreateInput
) {
  const access = await getProjectAccess(projectId, requester);

  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  const task = await prepareTaskDocument(access, requester, input);

  const { insertedId } = await getTaskCollection().insertOne(task);

  logAudit({
    entityType: 'task',
    entityId: insertedId.toHexString(),
    action: 'created',
    actorId: new ObjectId(requester.userId),
    summary: `Task "${task.title}" created`,
  });

  return toPublicTask({ ...task, _id: insertedId });
}


