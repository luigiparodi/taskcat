import { Router } from 'express';
import {
  changePasswordHandler,
  githubCallbackHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from '../controllers/AuthController';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates an email/password account and returns an access token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string, minLength: 2, maxLength: 50 }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterSuccess'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register', registerHandler);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     description: Validates credentials and issues access and refresh tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionSuccess'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login', loginHandler);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     description: Optionally revokes the given refresh token. Requires a valid bearer access token.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutSuccess'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/logout', requireAuth, logoutHandler);

/**
 * @openapi
 * /auth/github/callback:
 *   post:
 *     summary: Complete GitHub OAuth flow
 *     description: Exchanges a GitHub authorization code for a session (creates the user on first login).
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, description: GitHub authorization code }
 *     responses:
 *       200:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionSuccess'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/github/callback', githubCallbackHandler);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh the access token
 *     description: Rotates the refresh token and returns a new access/refresh token pair.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Tokens rotated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshSuccess'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh', refreshHandler);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the current user
 *     description: >-
 *       Returns the authenticated user's public profile. requireAuth re-reads the
 *       account before this handler runs, so a soft-deleted or deactivated user gets
 *       401 rather than 404 even though the profile no longer exists.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicUser'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/me', requireAuth, meHandler);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change the current user's password
 *     description: Verifies the current password, updates it, and revokes all refresh tokens.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutSuccess'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/change-password', requireAuth, changePasswordHandler);

export default router;


