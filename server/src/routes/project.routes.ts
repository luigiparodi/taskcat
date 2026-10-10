import { Router } from 'express';
import {
  activateProjectHandler,
  addMembersHandler,
  createProjectHandler,
  deactivateProjectHandler,
  deleteProjectHandler,
  getProjectHandler,
  getProjectStatisticsHandler,
  listAvailableUsersHandler,
  listMembersHandler,
  listProjectsHandler,
  removeMemberHandler,
  updateProjectHandler,
} from '../controllers/ProjectController';
import {
  importCreateHandler,
  importDocxHandler,
  importMarkdownHandler,
  importPdfHandler,
} from '../controllers/ImportController';
import { uploadImportFile } from '../middleware/upload';
import {
  bulkCreateTasksHandler,
  createTaskCommentHandler,
  createTaskHandler,
  createTaskLinkHandler,
  deleteTaskCommentHandler,
  deleteTaskHandler,
  deleteTaskLinkHandler,
  getTaskCommentsHandler,
  getTaskHandler,
  getTaskHistoryHandler,
  getTaskLinksHandler,
  listTasksHandler,
  searchTasksHandler,
  filterTasksHandler,
  updateTaskHandler,
  updateTaskStatusHandler,
} from '../controllers/TaskController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: 'List projects (admin: all, worker: assigned)'
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *         description: Page size (default 20)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Partial match on title (admin only)
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Paginated project list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [projects, total, page, limit]
 *               properties:
 *                 projects:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Project' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', requireAuth, listProjectsHandler);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     summary: Get project details (admin or project member)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', requireAuth, getProjectHandler);

/**
 * @openapi
 * /projects/{id}/members:
 *   get:
 *     summary: List project team members (admin or project member)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [members, total]
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, name, email, role, joinedAt]
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       email: { type: string, format: email }
 *                       avatar: { type: string, nullable: true }
 *                       role: { type: string, enum: [admin, member] }
 *                       joinedAt: { type: string, format: date-time }
 *                 total: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/members', requireAuth, listMembersHandler);

/**
 * @openapi
 * /projects/{id}/available-users:
 *   get:
 *     summary: List users available to add to a project (project admin or global admin)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *         description: Page size (default 20)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Partial match on name or email
 *     responses:
 *       200:
 *         description: Paginated list of available users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [users, total, page, limit]
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, name, email]
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       email: { type: string, format: email }
 *                       avatarUrl: { type: string, nullable: true }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/available-users', requireAuth, listAvailableUsersHandler);

/**
 * @openapi
 * /projects/{id}/statistics:
 *   get:
 *     summary: Get project statistics (admin or project member)
 *     description: |
 *       Task counts by status, completion progress (0-100), and team size
 *       for a single project. Follows the same access rules as project
 *       detail: global admins pass, everyone else must be a member.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [projectId, title, status, tasks, team]
 *               properties:
 *                 projectId: { type: string }
 *                 title: { type: string }
 *                 status: { type: string, enum: [active, inactive] }
 *                 tasks:
 *                   type: object
 *                   required: [total, pending, working, finished, unassigned, progress]
 *                   properties:
 *                     total: { type: integer }
 *                     pending: { type: integer }
 *                     working: { type: integer }
 *                     finished: { type: integer }
 *                     unassigned: { type: integer }
 *                     progress:
 *                       type: integer
 *                       description: Percentage of finished tasks (0-100)
 *                 team:
 *                   type: object
 *                   required: [size, admins]
 *                   properties:
 *                     size: { type: integer }
 *                     admins: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/statistics', requireAuth, getProjectStatisticsHandler);

/**
 * @openapi
 * /projects/{id}/members:
 *   post:
 *     summary: Add users to a project (admin only, bulk)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Members added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [added, message]
 *               properties:
 *                 added: { type: integer }
 *                 message: { type: string }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/members', requireAuth, addMembersHandler);

/**
 * @openapi
 * /projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a user from a project (admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Member removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success]
 *               properties: { success: { type: boolean } }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id/members/:userId', requireAuth, removeMemberHandler);

/**
 * @openapi
 * /projects/{id}:
 *   put:
 *     summary: Update a project (admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 100 }
 *               description: { type: string, maxLength: 2000 }
 *               clientName: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date, description: Cannot be in the past }
 *     responses:
 *       200:
 *         description: Updated project
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', requireAuth, requireRole('admin'), updateProjectHandler);

/**
 * @openapi
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project (admin only)
 *     description: Deletes project members and the project. Task cascade is applied in the Tasks chunk.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success]
 *               properties: { success: { type: boolean } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', requireAuth, requireRole('admin'), deleteProjectHandler);

/**
 * @openapi
 * /projects/{id}/deactivate:
 *   post:
 *     summary: Deactivate a project (admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Project deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/deactivate', requireAuth, requireRole('admin'), deactivateProjectHandler);

/**
 * @openapi
 * /projects/{id}/activate:
 *   post:
 *     summary: Reactivate a project (admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project reactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/activate', requireAuth, requireRole('admin'), activateProjectHandler);

/**
 * @openapi
 * /projects:
 *   post:
 *     summary: Create a new project (admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 100 }
 *               description: { type: string, maxLength: 2000 }
 *               clientName: { type: string }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Project' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', requireAuth, requireRole('admin'), createProjectHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Create a task (global or project admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, maxLength: 5000 }
 *               assigned_to: { type: string, description: Must be a project member }
 *               priority: { type: string, enum: [low, medium, high, urgent], default: medium }
 *               end_date: { type: string, format: date, description: Cannot be in the past }
 *               estimated_hours: { type: number }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:projectId/tasks', requireAuth, createTaskHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: List project tasks grouped by status (kanban)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, working, finished] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: assigned_to
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Partial match on title
 *     responses:
 *       200:
 *         description: Tasks grouped by status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [pending, working, finished]
 *               properties:
 *                 pending:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *                 working:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *                 finished:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:projectId/tasks', requireAuth, listTasksHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/search:
 *   get:
 *     summary: Search project tasks by title or description (project member)
 *     description: |
 *       Returns a flat, paginated list rather than the kanban grouping used by
 *       GET /projects/{projectId}/tasks. The term is matched case-insensitively
 *       against title OR description; user input is regex-escaped before matching.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: query
 *         name: search
 *         required: true
 *         schema: { type: string }
 *         description: Term to match against title or description
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
 *         description: Matching tasks, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [tasks, total, page, limit]
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:projectId/tasks/search', requireAuth, searchTasksHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/filter:
 *   get:
 *     summary: Filter project tasks (status, priority, assigned_to) (project member)
 *     description: |
 *       Returns a flat, paginated list rather than the kanban grouping used by
 *       GET /projects/{projectId}/tasks. Any combination of filters may be supplied.
 *       Invalid status, priority or assigned_to yields a 400.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, working, finished] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: assigned_to
 *         schema: { type: string }
 *         description: User ID
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
 *         description: Filtered tasks, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [tasks, total, page, limit]
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Task' }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:projectId/tasks/filter', requireAuth, filterTasksHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}:
 *   get:
 *     summary: Get task details (project member)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:projectId/tasks/:taskId', requireAuth, getTaskHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}:
 *   put:
 *     summary: Update task fields (admin, project admin or assignee)
 *     description: Status is not editable here; use PATCH .../status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 3, maxLength: 150 }
 *               description: { type: string, maxLength: 5000 }
 *               assigned_to:
 *                 type: string
 *                 nullable: true
 *                 description: Admin only; must be a project member
 *               priority: { type: string, enum: [low, medium, high, urgent] }
 *               end_date: { type: string, format: date, nullable: true }
 *               estimated_hours: { type: number, minimum: 0 }
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:projectId/tasks/:taskId', requireAuth, updateTaskHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}:
 *   delete:
 *     summary: Delete a task (global or project admin)
 *     description: Cascades to task comments, links and history
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:projectId/tasks/:taskId', requireAuth, deleteTaskHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}/status:
 *   patch:
 *     summary: Change task status (drag and drop on the kanban board)
 *     description: Allowed for global admin, project admin or the assignee
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, working, finished] }
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Task' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:projectId/tasks/:taskId/status', requireAuth, updateTaskStatusHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/bulk:
 *   post:
 *     summary: Create multiple tasks at once (global or project admin)
 *     description: Tasks are created sequentially; the first invalid task aborts the request
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tasks]
 *             properties:
 *               tasks:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required: [title]
 *                   properties:
 *                     title: { type: string, minLength: 3, maxLength: 150 }
 *                     description: { type: string, maxLength: 5000 }
 *                     assigned_to: { type: string }
 *                     priority: { type: string, enum: [low, medium, high, urgent] }
 *                     end_date: { type: string, format: date }
 *                     estimated_hours: { type: number }
 *     responses:
 *       201:
 *         description: Tasks created
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Task' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:projectId/tasks/bulk', requireAuth, bulkCreateTasksHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/import/markdown:
 *   post:
 *     summary: Extract a task preview from markdown requirements (global or project admin)
 *     description: |
 *       Sends the markdown to the AI model, which returns candidate tasks.
 *       The response is a preview only - nothing is persisted until the client
 *       accepts it via POST /projects/{projectId}/tasks/import/create.
 *       The suggested assignee is matched against real project members; an
 *       unknown name leaves assignedTo null and is echoed as suggestedAssignee.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [markdown]
 *             properties:
 *               markdown: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         description: Extracted task preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [preview, sessionId]
 *               properties:
 *                 sessionId: { type: string }
 *                 preview:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [title, description, priority, assignedTo, suggestedAssignee, endDate, estimatedHours]
 *                     properties:
 *                       title: { type: string }
 *                       description: { type: string, nullable: true }
 *                       priority: { type: string, enum: [low, medium, high, urgent] }
 *                       assignedTo: { type: string, nullable: true }
 *                       suggestedAssignee: { type: string, nullable: true }
 *                       endDate: { type: string, format: date, nullable: true }
 *                       estimatedHours: { type: number, nullable: true }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         description: The document produced no usable tasks
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       502:
 *         description: The AI provider could not analyze the document
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:projectId/tasks/import/markdown', requireAuth, importMarkdownHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/import/pdf:
 *   post:
 *     summary: Extract tasks from a PDF requirements document (project admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: A normalized preview plus a sessionId
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         description: The document contained no readable text or no tasks
 *       502:
 *         description: The AI provider failed
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:projectId/tasks/import/pdf',
  requireAuth,
  uploadImportFile.single('file'),
  importPdfHandler
);

/**
 * @openapi
 * /projects/{projectId}/tasks/import/docx:
 *   post:
 *     summary: Extract tasks from a DOCX requirements document (project admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: A normalized preview plus a sessionId
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         description: The document contained no readable text or no tasks
 *       502:
 *         description: The AI provider failed
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:projectId/tasks/import/docx',
  requireAuth,
  uploadImportFile.single('file'),
  importDocxHandler
);

/**
 * @openapi
 * /projects/{projectId}/tasks/import/create:
 *   post:
 *     summary: Create tasks from a reviewed import preview (project admin)
 *     description: |
 *       Finalizes an import session. The session must belong to the caller and the
 *       project. Callers may send edited tasks; otherwise the stored preview is used.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId: { type: string }
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string }
 *                     description: { type: string, nullable: true }
 *                     priority: { type: string, enum: [low, medium, high, urgent] }
 *                     assignedTo: { type: string, nullable: true }
 *                     endDate: { type: string, format: date, nullable: true }
 *                     estimatedHours: { type: number, nullable: true }
 *     responses:
 *       201:
 *         description: Tasks created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created: { type: integer }
 *                 tasks: { type: array, items: { $ref: '#/components/schemas/Task' } }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Import session not found or expired
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:projectId/tasks/import/create', requireAuth, importCreateHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}/history:
 *   get:
 *     summary: List task history entries (project member)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, default: 50 }
 *     responses:
 *       200:
 *         description: History entries, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TaskHistoryEntry' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:projectId/tasks/:taskId/history', requireAuth, getTaskHistoryHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}/comments:
 *   get:
 *     summary: List task comments (project member)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Comments, oldest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TaskComment' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Add a comment to a task (project member)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, minLength: 1, maxLength: 2000 }
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TaskComment' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:projectId/tasks/:taskId/comments', requireAuth, getTaskCommentsHandler);
router.post('/:projectId/tasks/:taskId/comments', requireAuth, createTaskCommentHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (author or project admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *         description: Comment ID
 *     responses:
 *       204:
 *         description: Comment deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:projectId/tasks/:taskId/comments/:commentId', requireAuth, deleteTaskCommentHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}/links:
 *   get:
 *     summary: List task links (project member)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Links, newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/TaskLink' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Attach a link to a task (project member)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url, title]
 *             properties:
 *               url: { type: string, format: uri, description: Must be http or https }
 *               title: { type: string, maxLength: 150 }
 *               description: { type: string, maxLength: 1000 }
 *     responses:
 *       201:
 *         description: Link created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/TaskLink' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:projectId/tasks/:taskId/links', requireAuth, getTaskLinksHandler);
router.post('/:projectId/tasks/:taskId/links', requireAuth, createTaskLinkHandler);

/**
 * @openapi
 * /projects/{projectId}/tasks/{taskId}/links/{linkId}:
 *   delete:
 *     summary: Remove a link (creator or project admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string }
 *         description: Task ID
 *       - in: path
 *         name: linkId
 *         required: true
 *         schema: { type: string }
 *         description: Link ID
 *     responses:
 *       204:
 *         description: Link deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:projectId/tasks/:taskId/links/:linkId', requireAuth, deleteTaskLinkHandler);

export default router;


