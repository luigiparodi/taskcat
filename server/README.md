# Cat Task — Server

Express 5 + TypeScript API backed by MongoDB (native driver). Built in chunks (Authentication → Users → Projects → Tasks → AI/Import → Admin), each with tests.

## Architecture

```
src/
├── config/       database, Gemini, swagger, Winston logger
├── controllers/  parse request, call service, map errors to HTTP
├── middleware/   auth (requireAuth/requireRole), file upload (multer)
├── models/       collection accessors + interfaces (no ODM)
├── routes/       Express routers + JSDoc @openapi annotations
├── services/     business logic + authorization gates (throw AuthError)
├── types/        ambient types
├── utils/        import sessions, document text extraction
└── __tests__/    unit/integration + contracts/ + factories/ + helpers/
```

### Conventions

- **MVC + service layer** — routes thin; controllers validate/translate; services own rules + authorization (`getProjectAccess` + `canManageProject` for relationship gates, `requireRole` for role gates, re-checked in service as defence in depth).
- **Errors** — services throw `AuthError(message, statusCode)`; controllers map to `{ error }` with matching status. Unknown IDs → 404, never bare 500.
- **No ODM** — `models/*.ts` export `getXCollection()` accessors + interfaces.
- **Wire casing** — requests/filters **snake_case** (`assigned_to`, `end_date`); responses **camelCase** (`assignedTo`, `endDate`).
- **Logging** — Winston (`src/config/logger.ts`). Level from `LOG_LEVEL` (default `info`, `error` in test). Log as `logger.error(message, err)` for stack.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_URL` | MongoDB connection string (Atlas `mongodb+srv://…`) |
| `DATABASE_NAME` | DB name (e.g. `taskcat`) |
| `JWT_SECRET` | Signs access tokens (15m) |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (7d) |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `GITHUB_CALLBACK_URL` | OAuth redirect (e.g. `https://api.onrender.com/auth/github/callback`) |
| `CORS_ORIGINS` | Comma-separated origins. Blank → Vite dev origins only |
| `LOG_LEVEL` | Winston level (`error` `warn` `info`…). Default `info`, `error` in test |
| `GEMINI_API_KEY` | Google Gemini key for AI import |
| `GEMINI_MODEL` | Model id (default `gemini-flash-latest`) |
| `GEMINI_FALLBACK_MODELS` | Fallback models (comma-separated) |

---

## API Endpoints

Mounted at `/auth`, `/users`, `/projects`, `/admin` — **no `/api` prefix**.  
Swagger UI at `/api-docs` (dev only). `ENDPOINTS.md` in repo root.

### Authentication — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | public | Register user |
| POST | `/auth/login` | public | Log in |
| POST | `/auth/refresh` | public | Exchange refresh token |
| POST | `/auth/github/callback` | public | GitHub OAuth exchange |
| POST | `/auth/logout` | user | Revoke refresh token |
| GET | `/auth/me` | user | Current profile |
| POST | `/auth/change-password` | user | Change password (requires current) |

### Users — `/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | admin | List (search, role, pagination) |
| GET | `/users/:id` | self or admin | Get profile |
| PUT | `/users/:id` | self or admin | Update name/avatar/timezone |
| PUT | `/users/:id/preferences` | self | Update theme/notifications/timezone |
| PATCH | `/users/:id/role` | admin | Change role (`admin`/`worker`) |
| DELETE | `/users/:id` | admin | Soft-delete + revoke tokens |
| GET | `/users/:id/tasks/history` | self/admin | Flat task history (paginated) |

### Projects — `/projects`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/projects` | admin | Create (creator = project admin) |
| GET | `/projects` | user | List (admin: all; worker: assigned) |
| GET | `/projects/:id` | member/admin | Details |
| PUT | `/projects/:id` | admin | Update |
| DELETE | `/projects/:id` | admin | Delete (cascades) |
| POST | `/projects/:id/activate` | admin | Reactivate |
| POST | `/projects/:id/deactivate` | admin | Deactivate |
| GET | `/projects/:id/members` | member/admin | List members |
| POST | `/projects/:id/members` | admin | Add members (bulk) |
| DELETE | `/projects/:id/members/:userId` | admin | Remove member |
| GET | `/projects/:id/available-users` | project/global admin | Eligible users to add |
| GET | `/projects/:id/statistics` | member/admin | Task/status stats |

### Tasks — `/projects/:projectId/tasks`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | member | List grouped by status (kanban) |
| GET | `/search` | member | Full-text search (paginated) |
| GET | `/filter` | member | Filter by field/value (paginated) |
| POST | `/` | project/global admin | Create task |
| POST | `/bulk` | project/global admin | Create up to 100 (all-or-nothing) |
| GET | `/:taskId` | member | Details |
| PUT | `/:taskId` | admin, project admin, assignee | Update fields |
| PATCH | `/:taskId/status` | admin, project admin, assignee | Move task (drag-drop) |
| DELETE | `/:taskId` | project/global admin | Delete |
| GET | `/:taskId/comments` | member | List comments |
| POST | `/:taskId/comments` | member | Add comment |
| DELETE | `/:taskId/comments/:commentId` | author/project admin | Delete comment |
| GET | `/:taskId/links` | member | List links |
| POST | `/:taskId/links` | member | Attach link |
| DELETE | `/:taskId/links/:linkId` | creator/project admin | Remove link |
| GET | `/:taskId/history` | member | History entries |

### AI / Import — `/projects/:projectId/tasks/import`

Converts requirements docs → draft tasks (preview only, persisted via `import/create`). Backed by Google Gemini.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/import/markdown` | project/global admin | Extract from markdown |
| POST | `/import/pdf` | project/global admin | Extract from PDF (multipart `file`) |
| POST | `/import/docx` | project/global admin | Extract from DOCX (multipart `file`) |
| POST | `/import/create` | project/global admin | Persist preview: `{ sessionId, tasks }` |

---

### Admin — `/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/statistics` | admin | Global counts |
| GET | `/admin/analytics` | admin | Overview, status breakdown, per-worker workload, per-project progress, 14-day chart |
| GET | `/admin/audit-logs` | admin | Paginated, filter by entity/action/date |

### Health

`GET /health` → `{ "status": "ok" }` (unauthenticated, liveness probe)

---

## Testing

- `npm test` — unit/integration with mocked DB (`jest.mock('../config/database')`). Authenticated routes must serve `requireAuth`'s account-status lookup (see `src/__tests__/helpers/index.ts`).
- `npm run test:contracts` — cross-chunk tests against real in-memory MongoDB (`mongodb-memory-server`), no mocks. 5 suites: project-delete cascade, user-delete session revocation, member-add validation, member-removal vs assigned tasks, user-delete vs assigned tasks/comments/history.
- `npm run test:coverage` — thresholds 70% lines/branches/functions (~85% actual).
- Factories in `src/__tests__/factories/` — reuse for new endpoint tests.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | `ts-node-dev` hot reload |
| `npm run build` | Type-check + emit to `dist/` |
| `npm start` | Run built server |
| `npm test` / `npm run test:watch` | Jest |
| `npm run test:contracts` | Contract tests |
| `npm run lint` | ESLint (not currently a dependency) |

> Note: `lint` script defined but `eslint` not installed. `npm run build` / `tsc` is the effective static check.

---

## Production Deploy (Render)

1. **Blueprint** — `render.yaml` defines service, build/start commands, env vars
2. **Env vars required** — `MONGODB_URI`, `GITHUB_CLIENT_ID/SECRET`, `GEMINI_API_KEY`
3. **Auto-generated** — `JWT_SECRET`, `JWT_REFRESH_SECRET`
4. **CORS** — Set `CORS_ORIGINS=https://your-vercel-app.vercel.app` after Vercel deploy

```yaml
# render.yaml (already in repo root)
services:
  - type: web
    name: taskcat-api
    env: node
    buildCommand: cd server && npm ci && npm run build
    startCommand: cd server && npm start
```