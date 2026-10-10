import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getAdminAnalyticsHandler,
  getAdminStatisticsHandler,
  listAuditLogsHandler,
} from '../controllers/AdminController';

const router = Router();

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     summary: List audit logs (admin only)
 *     description: |
 *       Returns audit records for user, project and task lifecycle events
 *       (creates, updates, deletes, role changes, status changes), newest
 *       first, paginated and filterable by entity type, action and createdAt
 *       range (from_date/to_date are inclusive in local calendar days).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         schema: { type: string, enum: [user, project, task] }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Exact action name (e.g. created, deleted, role_changed)
 *       - in: query
 *         name: from_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *         description: Page size (default 20)
 *     responses:
 *       200:
 *         description: Paginated audit log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [logs, total, page, limit]
 *               properties:
 *                 logs:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AuditLog' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/audit-logs', requireAuth, requireRole('admin'), listAuditLogsHandler);

/**
 * @openapi
 * /admin/statistics:
 *   get:
 *     summary: Get system-wide dashboard statistics (admin only)
 *     description: |
 *       Aggregated counts for users, projects, tasks and audit logs.
 *       Deleted users are excluded from user counts; task counts include
 *       all statuses; project counts are split by active/inactive.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [users, projects, tasks, auditLogs]
 *               properties:
 *                 users:
 *                   type: object
 *                   required: [total, active, admins, workers]
 *                   properties:
 *                     total: { type: integer }
 *                     active: { type: integer }
 *                     admins: { type: integer }
 *                     workers: { type: integer }
 *                 projects:
 *                   type: object
 *                   required: [total, active, inactive, members]
 *                   properties:
 *                     total: { type: integer }
 *                     active: { type: integer }
 *                     inactive: { type: integer }
 *                     members: { type: integer }
 *                 tasks:
 *                   type: object
 *                   required: [total, pending, working, finished, unassigned]
 *                   properties:
 *                     total: { type: integer }
 *                     pending: { type: integer }
 *                     working: { type: integer }
 *                     finished: { type: integer }
 *                     unassigned: { type: integer }
 *                 auditLogs: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics', requireAuth, requireRole('admin'), getAdminStatisticsHandler);

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     summary: Get task analytics for the admin dashboard (admin only)
 *     description: |
 *       Task-focused analytics: overview counters, status breakdown, per-worker
 *       workload, per-project breakdown and task creation volume bucketed by
 *       local calendar day (last 14 days). A task is overdue when it is not
 *       finished and its endDate is before now. Workload includes every active
 *       worker with their assigned-task counters (zeros included). Creation
 *       volume is bucketed from the tasks collection because task creation is
 *       not recorded in task_history.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [overview, taskStatus, workload, projects, activity]
 *               properties:
 *                 overview:
 *                   type: object
 *                   required: [totalProjects, activeProjects, totalTasks, openTasks, overdueTasks, activeMembers]
 *                   properties:
 *                     totalProjects: { type: integer }
 *                     activeProjects: { type: integer }
 *                     totalTasks: { type: integer }
 *                     openTasks: { type: integer }
 *                     overdueTasks: { type: integer }
 *                     activeMembers: { type: integer }
 *                 taskStatus:
 *                   type: object
 *                   required: [pending, working, finished]
 *                   properties:
 *                     pending: { type: integer }
 *                     working: { type: integer }
 *                     finished: { type: integer }
 *                 workload:
 *                   type: array
 *                   description: Active workers with their task load
 *                   items:
 *                     type: object
 *                     required: [userId, name, email, assignedTasks, openTasks, completedTasks, estimatedHours]
 *                     properties:
 *                       userId: { type: string }
 *                       name: { type: string }
 *                       email: { type: string }
 *                       assignedTasks: { type: integer }
 *                       openTasks: { type: integer }
 *                       completedTasks: { type: integer }
 *                       estimatedHours: { type: number }
 *                 projects:
 *                   type: array
 *                   description: Per-project task breakdown
 *                   items:
 *                     type: object
 *                     required: [projectId, title, status, totalTasks, pending, working, finished, progress]
 *                     properties:
 *                       projectId: { type: string }
 *                       title: { type: string }
 *                       status: { type: string, enum: [active, inactive] }
 *                       totalTasks: { type: integer }
 *                       pending: { type: integer }
 *                       working: { type: integer }
 *                       finished: { type: integer }
 *                       progress: { type: integer }
 *                 activity:
 *                   type: array
 *                   description: Tasks created per local calendar day, last 14 days
 *                   items:
 *                     type: object
 *                     required: [date, created]
 *                     properties:
 *                       date: { type: string, format: date }
 *                       created: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/analytics', requireAuth, requireRole('admin'), getAdminAnalyticsHandler);

export default router;



