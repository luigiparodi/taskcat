import { GoogleGenAI, Type } from '@google/genai';
import { logger } from './logger';

const DEFAULT_MODEL = 'gemini-flash-latest';

// Google retires concrete model ids (gemini-2.5-flash now 404s for new keys) and
// individual models hit transient 503 "high demand" spikes. We therefore try an
// ordered list of model aliases and retry the retryable statuses with backoff.
const DEFAULT_FALLBACK_MODELS = 'gemini-flash-lite-latest,gemini-3.6-flash';

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS_PER_MODEL = 3;

function candidateModels(): string[] {
  const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? DEFAULT_FALLBACK_MODELS)
    .split(',')
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
  return [...new Set([primary, ...fallbacks])];
}

function statusOf(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RequirementMember {
  id: string;
  name: string;
}

export interface AnalyzeContext {
  projectTitle: string;
  projectDescription: string | null;
  projectEndDate: string | null;
  members: RequirementMember[];
}

export interface ExtractedTaskDraft {
  title: string;
  description: string | null;
  priority: string;
  assigneeName: string | null;
  endDate: string | null;
  estimatedHours: number | null;
}

const RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'Concise task title between 3 and 150 characters',
      },
      description: {
        type: Type.STRING,
        description: 'What needs to be done, drawn from the requirements document',
      },
      priority: {
        type: Type.STRING,
        enum: ['low', 'medium', 'high', 'urgent'],
        description: 'Urgency inferred from the document; default medium',
      },
      assigneeName: {
        type: Type.STRING,
        description:
          'Exact name copied from the provided team list, or an empty string when no member fits',
      },
      endDate: {
        type: Type.STRING,
        description: 'Due date as YYYY-MM-DD, or an empty string when the document gives none',
      },
      estimatedHours: {
        type: Type.NUMBER,
        description: 'Estimated effort in hours, or 0 when unknown',
      },
    },
    required: ['title'],
  },
};

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export function buildPrompt(context: AnalyzeContext): string {
  const memberLines = context.members.length
    ? context.members.map((member) => `- ${member.name}`).join('\n')
    : '- (no team members have been added to this project)';

  const lines = [
    'You extract actionable tasks from a software project requirements document.',
    'Return ONLY a JSON array of tasks. Never invent work that the document does not imply.',
    'For each task pick a priority from: low, medium, high, urgent.',
    'For assigneeName, copy EXACTLY one name from the team list below, or use an empty string',
    'when no member clearly fits. Never invent a name that is not in the list.',
    'For endDate use YYYY-MM-DD. It must not be in the past.',
    'For estimatedHours give a realistic number; use 0 when the document does not say.',
    '',
    `Project: ${context.projectTitle}`,
  ];

  if (context.projectDescription) {
    lines.push(`Project description: ${context.projectDescription}`);
  }
  if (context.projectEndDate) {
    lines.push(`Project deadline: ${context.projectEndDate} (task dates must not exceed it)`);
  }

  lines.push('', 'Team members:', memberLines);

  return lines.join('\n');
}

function coerceDraft(value: unknown): ExtractedTaskDraft | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    title: typeof record.title === 'string' ? record.title.trim() : '',
    description: typeof record.description === 'string' ? record.description : null,
    priority: typeof record.priority === 'string' ? record.priority : 'medium',
    assigneeName:
      typeof record.assigneeName === 'string' && record.assigneeName.trim().length > 0
        ? record.assigneeName.trim()
        : null,
    endDate:
      typeof record.endDate === 'string' && record.endDate.trim().length > 0
        ? record.endDate.trim()
        : null,
    estimatedHours: typeof record.estimatedHours === 'number' ? record.estimatedHours : null,
  };
}

async function generateRawText(ai: GoogleGenAI, prompt: string): Promise<string> {
  const models = candidateModels();
  let lastError: unknown;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });

        const raw = response.text;
        if (raw) {
          return raw;
        }

        lastError = new Error(`Gemini model ${model} returned an empty response`);
        break;
      } catch (err) {
        lastError = err;
        const status = statusOf(err);
        const retryable = status !== undefined && RETRYABLE_STATUSES.has(status);
        if (!retryable || attempt === MAX_ATTEMPTS_PER_MODEL) {
          break;
        }
        await wait(300 * attempt);
      }
    }

    if (index < models.length - 1) {
      logger.warn(`Gemini model ${model} unavailable, falling back to ${models[index + 1]}`);
    }
  }

  throw lastError ?? new Error('Gemini request failed');
}

export async function analyzeRequirements(
  document: string,
  context: AnalyzeContext
): Promise<ExtractedTaskDraft[]> {
  const ai = getClient();
  const prompt = `${buildPrompt(context)}\n\n--- REQUIREMENTS DOCUMENT ---\n${document}`;
  const raw = await generateRawText(ai, prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Gemini returned malformed JSON');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini returned an unexpected shape');
  }

  return parsed
    .map(coerceDraft)
    .filter((draft): draft is ExtractedTaskDraft => draft !== null);
}

