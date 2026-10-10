import { Request, Response } from 'express';
import { AuthError } from '../services/AuthService';
import { listAuditLogs, AuditLogFilters } from '../services/AuditService';
import { getAdminAnalytics, getAdminStatistics } from '../services/StatisticsService';
import { logger } from '../config/logger';

function parseDateParam(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new AuthError(`A valid ${name} is required`, 400);
  }
  return value;
}

export async function listAuditLogsHandler(req: Request, res: Response) {
  try {
    const filters: AuditLogFilters = {
      entity_type: typeof req.query.entity_type === 'string' ? req.query.entity_type : undefined,
      action: typeof req.query.action === 'string' ? req.query.action : undefined,
      page: req.query.page !== undefined ? Number(req.query.page) : undefined,
      limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
      from_date: parseDateParam(req.query.from_date, 'from_date'),
      to_date: parseDateParam(req.query.to_date, 'to_date'),
    };

    const result = await listAuditLogs(filters);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    logger.error('listAuditLogs error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminStatisticsHandler(_req: Request, res: Response) {
  try {
    const result = await getAdminStatistics();
    res.status(200).json(result);
  } catch (err) {
    logger.error('getAdminStatistics error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAdminAnalyticsHandler(_req: Request, res: Response) {
  try {
    const result = await getAdminAnalytics();
    res.status(200).json(result);
  } catch (err) {
    logger.error('getAdminAnalytics error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}



