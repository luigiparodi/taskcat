import { ObjectId } from 'mongodb';
import { AuthError } from './AuthService';
import { canManageProject, getProjectAccess } from './ProjectService';
import { getProjectMemberCollection } from '../models/Project';
import { getUserCollection } from '../models/User';
import {
  analyzeRequirements,
  type AnalyzeContext,
  type ExtractedTaskDraft,
  type RequirementMember,
} from '../config/gemini';
import {
  createImportSession,
  deleteImportSession,
  getImportSession,
  type ImportPreviewTask,
} from '../utils/importSession';
import { logger } from '../config/logger';
import {
  bulkCreateTasks,
  type TaskCreateInput,
} from './TaskService';

const TITLE_MIN = 3;
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
const PREVIEW_MAX = 100;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function loadRoster(projectId: ObjectId): Promise<RequirementMember[]> {
  const memberships = await getProjectMemberCollection().find({ projectId }).toArray();
  const userIds = memberships.map((membership) => membership.userId);
  if (userIds.length === 0) {
    return [];
  }

  const users = await getUserCollection().find({ _id: { $in: userIds } }).toArray();
  const userMap = new Map(users.map((user) => [(user._id as ObjectId).toHexString(), user]));

  return memberships.map((membership) => {
    const hex = (membership.userId as ObjectId).toHexString();
    return { id: hex, name: userMap.get(hex)?.name ?? 'Unknown' };
  });
}

function toPreviewTask(
  draft: ExtractedTaskDraft,
  roster: RequirementMember[]
): ImportPreviewTask | null {
  const title = draft.title.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return null;
  }

  const priority = VALID_PRIORITIES.includes(draft.priority) ? draft.priority : 'medium';

  const suggestedAssignee = draft.assigneeName ? draft.assigneeName.trim() : null;
  const matchedMember = suggestedAssignee
    ? roster.find(
        (member) => member.name.toLowerCase() === suggestedAssignee.toLowerCase()
      )
    : undefined;

  let endDate: string | null = null;
  const parsed = parseDateOnly(draft.endDate);
  if (parsed) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed >= today) {
      endDate = toDateOnly(parsed);
    }
  }

  let estimatedHours = draft.estimatedHours;
  if (estimatedHours !== null && (Number.isNaN(estimatedHours) || estimatedHours < 0)) {
    estimatedHours = null;
  }

  const rawDescription = draft.description?.trim() ?? '';
  const description =
    rawDescription.length === 0
      ? null
      : rawDescription.slice(0, DESCRIPTION_MAX);

  return {
    title,
    description,
    priority,
    assignedTo: matchedMember ? matchedMember.id : null,
    suggestedAssignee,
    endDate,
    estimatedHours,
  };
}

/**
 * Cheap authorization gate used by the file-import handlers so an unauthorized
 * caller cannot force us to parse an uploaded document. Mirrors the gate applied
 * inside importTasksFromDocument.
 */
export async function assertCanImport(
  projectId: string,
  requester: { userId: string; role: string }
): Promise<void> {
  const access = await getProjectAccess(projectId, requester);
  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }
}

/**
 * Shared extraction pipeline for every import source. The caller supplies the
 * already-extracted plain text (markdown body, PDF text, DOCX text); this function
 * owns authorization, the Gemini call, normalization and session storage so the
 * per-format handlers stay thin.
 */
export async function importTasksFromDocument(
  projectId: string,
  requester: { userId: string; role: string },
  document: string
): Promise<{ preview: ImportPreviewTask[]; sessionId: string }> {
  const access = await getProjectAccess(projectId, requester);

  if (!(await canManageProject(access, requester))) {
    throw new AuthError('Forbidden', 403);
  }

  if (typeof document !== 'string' || document.trim().length === 0) {
    throw new AuthError('A requirements document is required', 400);
  }

  const roster = await loadRoster(access.project._id);

  const context: AnalyzeContext = {
    projectTitle: access.project.title ?? 'Untitled project',
    projectDescription: access.project.description ?? null,
    projectEndDate: access.project.endDate ? toDateOnly(access.project.endDate) : null,
    members: roster,
  };

  let drafts: ExtractedTaskDraft[];
  try {
    drafts = await analyzeRequirements(document, context);
  } catch (err) {
    logger.error('Gemini analyzeRequirements failed', err);
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? (err as { status?: unknown }).status
        : undefined;
    if (status === 503 || status === 429) {
      throw new AuthError(
        'The AI service is busy right now. Please try again in a moment.',
        503
      );
    }
    throw new AuthError('Failed to analyze the requirements document', 502);
  }

  const preview = drafts
    .slice(0, PREVIEW_MAX)
    .map((draft) => toPreviewTask(draft, roster))
    .filter((task): task is ImportPreviewTask => task !== null);

  if (preview.length === 0) {
    throw new AuthError('No tasks could be extracted from the document', 422);
  }

  const { sessionId } = createImportSession({
    projectId,
    requesterId: requester.userId,
    tasks: preview,
  });

  return { preview, sessionId };
}

function toTaskCreateInput(task: ImportPreviewTask): TaskCreateInput {
  return {
    title: task.title,
    description: task.description ?? undefined,
    assigned_to: task.assignedTo ?? undefined,
    priority: task.priority,
    end_date: task.endDate ?? undefined,
    estimated_hours: task.estimatedHours ?? undefined,
  };
}

/**
 * Persists the (optionally edited) tasks from an import preview. The session ties
 * the request back to the actor and project that produced the preview, so a leaked
 * sessionId cannot be used to write into another project.
 */
export async function createTasksFromImport(
  projectId: string,
  requester: { userId: string; role: string },
  input: { sessionId: string; tasks?: ImportPreviewTask[] }
) {
  await assertCanImport(projectId, requester);

  const session = getImportSession(input.sessionId);
  if (!session) {
    throw new AuthError('Import session not found or expired', 404);
  }

  if (session.projectId !== projectId || session.requesterId !== requester.userId) {
    throw new AuthError('Forbidden', 403);
  }

  const source = input.tasks ?? session.tasks;
  if (!Array.isArray(source) || source.length === 0) {
    throw new AuthError('At least one task is required', 400);
  }

  const created = await bulkCreateTasks(projectId, requester, {
    tasks: source.map(toTaskCreateInput),
  });

  deleteImportSession(input.sessionId);

  return { created: created.length, tasks: created };
}


