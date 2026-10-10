import { randomUUID } from 'crypto';

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

const sessions = new Map<string, ImportSession>();

export function createImportSession(
  data: Omit<ImportSession, 'expiresAt'>
): { sessionId: string; session: ImportSession } {
  const sessionId = randomUUID();
  const session: ImportSession = { ...data, expiresAt: Date.now() + IMPORT_SESSION_TTL_MS };
  sessions.set(sessionId, session);
  return { sessionId, session };
}

export function getImportSession(sessionId: string): ImportSession | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

export function deleteImportSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function clearImportSessions(): void {
  sessions.clear();
}