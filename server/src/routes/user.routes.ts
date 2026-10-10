import { Router } from 'express';
import {
  deleteUserHandler,
  getUserHandler,
  listUsersHandler,
  updatePreferencesHandler,
  updateUserHandler,
  updateUserRoleHandler,
} from '../controllers/UserController';
import { getUserTaskHistoryHandler } from '../controllers/TaskController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /users:
 *   get:
 *     summary: List users (admin only)
 *     tags: [Users]
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
 *         description: Partial match on name or email
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, worker] }
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [users, total, page, limit]
 *               properties:
 *                 users: { type: array, items: { $ref: '#/components/schemas/PublicUser' } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', requireAuth, requireRole('admin'), listUsersHandler);

/**
 * @openapi
 * /users/{id}/tasks/history:
 *   get:
 *     summary: Get a user's task history (assigned tasks) (self or admin)
 *     description: |
 *       Returns tasks assigned to the user across all projects. The result is
 *       paginated and may be filtered by status, priority and createdAt range
 *       (from_date/to_date are inclusive in local calendar days).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, working, finished] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
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
 *         description: Paginated list of tasks assigned to the user
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
router.get('/:id/tasks/history', requireAuth, getUserTaskHistoryHandler);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get user profile (self or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public user profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   */
router.get('/:id', requireAuth, getUserHandler);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Update user profile (self or admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 50 }
 *               avatar_url: { type: string, maxLength: 2048 }
 *               timezone: { type: string }
 *     responses:
 *       200:
 *         description: Updated public user profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
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
router.put('/:id', requireAuth, updateUserHandler);

/**
 * @openapi
 * /users/{id}/preferences:
 *   put:
 *     summary: Update user preferences (self only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme: { type: string, enum: [light, dark] }
 *               notifications: { type: boolean }
 *               timezone: { type: string }
 *     responses:
 *       200:
 *         description: Updated public user profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
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
router.put('/:id/preferences', requireAuth, updatePreferencesHandler);

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     summary: Change a user's role (admin only)
 *     description: >
 *       Assigns the role on the user document. Authorization is re-read from the database on
 *       every request, so a demotion applies to the target's next request without waiting for
 *       their access token to expire. Demoting the last remaining administrator is rejected.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, worker] }
 *     responses:
 *       200:
 *         description: Updated public user profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Cannot demote the last remaining administrator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties: { error: { type: string } }
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/role', requireAuth, requireRole('admin'), updateUserRoleHandler);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     summary: Soft-delete a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: User ID
 *     responses:
 *       200:
 *         description: User soft-deleted and sessions revoked
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
router.delete('/:id', requireAuth, requireRole('admin'), deleteUserHandler);

export default router;


