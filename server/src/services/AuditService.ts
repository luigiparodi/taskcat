import { ObjectId } from 'mongodb';
import { AuditEntityType, AuditLog, getAuditLogCollection } from '../models/AuditLog';
import { AuthError } from './AuthService';
import { logger } from '../config/logger';

const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 100;

const ENTITY_TYPES: AuditEntityType[] = ['user', 'project', 'task'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface AuditInput {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actorId: ObjectId | string | null;
  summary: string;
}

/**
 * Best-effort audit record. Never throws: an audit failure must not fail the
 * business operation that triggered it, so errors are logged to stderr only.
 */
export function logAudit(input: AuditInput): void {
  try {
    const actorId =
      input.actorId === null
        ? null
        : input.actorId instanceof ObjectId
          ? input.actorId
          : new ObjectId(input.actorId);

    void getAuditLogCollection()
      .insertOne({
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorId,
        summary: input.summary,
        createdAt: new Date(),
      })
      .catch((err) => logger.error('audit log write failed', err));
  } catch (err) {
    logger.error('audit log write failed', err);
  }
}

export function toPublicAuditLog(log: AuditLog) {
  return {
    id: log._id instanceof ObjectId ? log._id.toHexString() : String(log._id ?? ''),
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    actorId: log.actorId instanceof ObjectId ? log.actorId.toHexString() : null,
    summary: log.summary,
    createdAt: log.createdAt,
  };
}

export interface AuditLogFilters {
  entity_type?: string;
  action?: string;
  page?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
}

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  if (filters.page !== undefined && (!Number.isInteger(filters.page) || filters.page < 1)) {
    throw new AuthError('Page must be a positive integer', 400);
  }
  if (filters.limit !== undefined && (!Number.isInteger(filters.limit) || filters.limit < 1)) {
    throw new AuthError('Limit must be a positive integer', 400);
  }

  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX);

  const query: Record<string, unknown> = {};

  if (filters.entity_type !== undefined) {
    if (!ENTITY_TYPES.includes(filters.entity_type as AuditEntityType)) {
      throw new AuthError('Entity type must be one of user, project, task', 400);
    }
    query.entityType = filters.entity_type;
  }
  if (filters.action !== undefined) {
    if (filters.action.trim() === '') {
      throw new AuthError('A valid action is required', 400);
    }
    query.action = filters.action;
  }

  if (filters.from_date !== undefined) {
    if (!DATE_RE.test(filters.from_date)) {
      throw new AuthError('A valid from_date is required', 400);
    }
    const [y, m, d] = filters.from_date.split('-').map(Number);
    query.createdAt = { ...(query.createdAt as Record<string, unknown>), $gte: new Date(y, m - 1, d) };
  }
  if (filters.to_date !== undefined) {
    if (!DATE_RE.test(filters.to_date)) {
      throw new AuthError('A valid to_date is required', 400);
    }
    const [y, m, d] = filters.to_date.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { ...(query.createdAt as Record<string, unknown>), $lte: end };
  }

  const collection = getAuditLogCollection();
  const total = await collection.countDocuments(query);
  const docs = await collection
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return { logs: docs.map(toPublicAuditLog), total, page, limit };
}



