import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import userRoutes from './routes/user.routes';

export interface Mount {
  path: string;
  router: Router;
}

export const DEFAULT_MOUNTS: Mount[] = [
  { path: '/auth', router: authRoutes },
  { path: '/users', router: userRoutes },
  { path: '/projects', router: projectRoutes },
  { path: '/admin', router: adminRoutes },
];

export const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function allowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = env.CORS_ORIGINS?.trim();
  if (!configured) return [...DEV_ORIGINS];
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function createApp(mounts: Mount[] = DEFAULT_MOUNTS) {
  const app = express();
  const origins = allowedOrigins();

  app.use(helmet());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use(
    cors({
      origin: origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json());

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Liveness probe
   *     description: Unauthenticated. Returns ok when the process is serving requests.
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is up
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [status]
   *               properties:
   *                 status: { type: string, example: ok }
   */
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  for (const mount of mounts) {
    app.use(mount.path, mount.router);
  }

  return app;
}

