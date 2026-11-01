import { randomUUID } from 'crypto';
import { getDb } from '../config/database';

export interface ImportPreviewTask {
  title: string;
  description: string | null;
  priority: string;
  assignedTo: string | null;
  suggestedAssignee: string | null;
  endDate: string | null;
  estimatedHours: number | null;
}

export interface ImportSession {
  projectId: string;
  requesterId: string;
  tasks: ImportPreviewTask[];
  expiresAt: number;
}

export const IMPORT_SESSION_TTL_MS = 30 * 60 * 1000;

const COLLECTION = 'import_sessions';

function collection() {
  return getDb().collection<ImportSession & { _id: string }>(COLLECTION);
}

export async function createImportSession(
  data: Omit<ImportSession, 'expiresAt'>
): Promise<{ sessionId: string; session: ImportSession }> {
  const sessionId = randomUUID();
  const session: ImportSession = { ...data, expiresAt: Date.now() + IMPORT_SESSION_TTL_MS };
  await collection().insertOne({ _id: sessionId, ...session });
  return { sessionId, session };
}

export async function getImportSession(sessionId: string): Promise<ImportSession | null> {
  const doc = await collection().findOne({ _id: sessionId });
  if (!doc) return null;
  if (doc.expiresAt <= Date.now()) {
    await collection().deleteOne({ _id: sessionId });
    return null;
  }
  const { _id, ...session } = doc;
  return session;
}

export async function deleteImportSession(sessionId: string): Promise<void> {
  await collection().deleteOne({ _id: sessionId });
}

export async function clearImportSessions(): Promise<void> {
  await collection().deleteMany({});
}