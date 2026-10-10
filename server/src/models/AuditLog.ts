import { ObjectId } from 'mongodb';
import { getDb } from '../config/database';

export type AuditEntityType = 'user' | 'project' | 'task';

export interface AuditLog {
  _id?: ObjectId;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actorId: ObjectId | null;
  summary: string;
  createdAt: Date;
}

const AUDIT_LOGS_COLLECTION = 'audit_logs';

export function getAuditLogCollection() {
  return getDb().collection<AuditLog>(AUDIT_LOGS_COLLECTION);
}


