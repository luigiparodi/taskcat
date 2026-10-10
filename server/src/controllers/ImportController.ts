import { Request, Response } from 'express';
import { AuthError } from '../services/AuthService';
import {
  assertCanImport,
  createTasksFromImport,
  importTasksFromDocument,
} from '../services/ImportService';
import { extractDocxText, extractPdfText } from '../utils/documentText';
import { logger } from '../config/logger';

function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

async function runImport(
  req: Request,
  res: Response,
  document: string
): Promise<void> {
  try {
    const result = await importTasksFromDocument(param(req, 'projectId'), req.user!, document);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('import error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleFileImport(
  req: Request,
  res: Response,
  extract: (buffer: Buffer) => Promise<string>,
  missingMessage: string
): Promise<void> {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: missingMessage });
    return;
  }

  try {
    await assertCanImport(param(req, 'projectId'), req.user!);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('import authorization error', err);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  let text: string;
  try {
    text = await extract(file.buffer);
  } catch (err) {
    logger.error('document extraction error', err);
    res.status(422).json({ error: 'Could not read any text from the document' });
    return;
  }

  if (text.trim().length === 0) {
    res.status(422).json({ error: 'No readable text found in the document' });
    return;
  }

  await runImport(req, res, text);
}

export async function importMarkdownHandler(req: Request, res: Response) {
  const { markdown } = req.body ?? {};

  if (typeof markdown !== 'string' || markdown.trim().length === 0) {
    res.status(400).json({ error: 'Markdown content is required' });
    return;
  }

  await runImport(req, res, markdown);
}

export async function importPdfHandler(req: Request, res: Response) {
  await handleFileImport(req, res, extractPdfText, 'A PDF file is required');
}

export async function importDocxHandler(req: Request, res: Response) {
  await handleFileImport(req, res, extractDocxText, 'A DOCX file is required');
}

export async function importCreateHandler(req: Request, res: Response) {
  const { sessionId, tasks } = req.body ?? {};

  if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    res.status(400).json({ error: 'A sessionId is required' });
    return;
  }

  try {
    const result = await createTasksFromImport(param(req, 'projectId'), req.user!, {
      sessionId,
      tasks,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('importCreate error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


