# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-11-02

### Added
- Excel export for projects (`GET /projects/:id/export`) with **Project**, **Members** and **Tasks** sheets, styled headers, status/priority fills, frozen header rows and auto-filters
- "Export Excel" action on every project board, available to all project members
- Drag overlay preview while moving tasks on the kanban board
- Auth API contract tests covering `/auth/me`, `/auth/refresh` and unknown routes

### Changed
- Replaced the brand palette with a monochrome neutral token system (black, white and greys) for both themes; primary actions now invert (white on dark, black on light)
- Rebuilt the login and register shell on shadcn surface tokens instead of hardcoded dark gradients
- Flattened the footer and removed the animated Apple-style glow layers
- Links now use underline affordances and the GitHub OAuth button uses neutral tokens instead of blue/grey brand colors
- Added `exceljs` to the server for spreadsheet generation
- Client version aligned with the server at `1.4.0`

### Removed
- `client/DESIGN_SYSTEM.md` and `client/design-tokens.json`; `client/src/index.css` is the single source of truth for design tokens
- Unused `@tanstack/react-table` dependency

## [1.3.0] - 2026-11-02

### Added
- Global command palette (`Ctrl`/`Cmd` + `K`) for quick navigation
- React Hook Form + Zod validation for login and registration, with inline field errors
- Drag-and-drop PDF/DOCX upload for AI task import, with clearer busy, retry and error states
- Markdown rendering for task descriptions and comments
- Virtualized comment list for long task threads (`@tanstack/react-virtual`)
- Board/list view toggle on project boards
- PWA support with an installable manifest and auto-updating service worker
- TanStack Query devtools in development
- Mobile sheet component and responsive member-management improvements
- Prettier configuration plus `npm run format` scripts for client and server
- Backend Jest suite with a `/health` test, now executed in CI
- `PRIORITY_TASKS.md` prioritized backlog

### Changed
- Applied Prettier formatting across the client and server codebases
- Project and admin views now surface clearer errors, empty states and retry actions
- Server devDependencies reorganized and aligned with the Node.js 20 CI runtime
- README testing and formatting documentation updated

## [1.2.0] - 2026-11-01

### Added
- Readiness probe at `GET /ready`, including a MongoDB ping
- Graceful shutdown on `SIGTERM`/`SIGINT` (closes the HTTP server and MongoDB client)
- Request logging middleware with method, path, status and duration
- React `ErrorBoundary` around the app shell with a reload action
- Skeleton loading state for the projects list

### Changed
- Import preview sessions are now stored in MongoDB (`import_sessions`) instead of in-process memory, so they survive restarts and work across instances
- Added MongoDB indexes for project status, project membership lookups, task assignees, task comments/links/history and audit logs
- `POST /auth/github/callback` now requires the `state` value issued by `GET /auth/github`
- Uploads are restricted to one PDF/DOCX file (max 10 MB)
- JSON request bodies are limited to 1 MB
- CORS runs before the rate limiter, and `/ready` is available for platform health checks
- AI document extraction prompt treats document text as untrusted data
- TanStack Query keeps inactive cache entries for 5 minutes
- Runtime dependencies no longer include Jest, Supertest or `@types/*` packages; they live in `devDependencies`
- `@types/node` aligned with the Node.js 20 CI runtime
- README structure, deployment variables and CI description updated to match the repo

### Fixed
- Invalid project IDs now return `404` instead of throwing a MongoDB `ObjectId` error
- `JWT_SECRET` is validated in production instead of silently falling back to `dev-secret`
- GitHub OAuth `state` cookie is cleared after use and validated against the callback payload
- Removed committed TypeScript build artifacts and added a `.gitignore` for build output, env files and dependencies

### CI
- Server job runs the Jest suite (`--passWithNoTests` until tests are added)

## [1.1.0] - 2026-10-10

### Added
- **GitHub OAuth Authentication**
  - `GET /auth/github` — initiates OAuth flow, redirects to GitHub with CSRF-protected state cookie (httponly, secure, sameSite=lax, 10 min TTL)
  - `POST /auth/github/callback` — exchanges authorization code for JWT access/refresh tokens
  - Frontend "Continue with GitHub" button on Login & Register pages
  - Callback page at `/auth/github/callback` handles GitHub redirect, exchanges code for tokens, stores session
  - Works in dev (`http://localhost:5173/auth/github/callback`) and prod (`https://lp-taskcat.vercel.app/auth/github/callback`)
  - Links GitHub account to existing email/password account if email matches

### Changed
- Auth context: added `loginWithTokens(token, refreshToken, user)` for OAuth flows
- Server version bumped to 1.1.0
- Render.yaml: fixed `GITHUB_CALLBACK_URL` to point to frontend domain
- Server `.env.example`: clarified GitHub callback URL is set in GitHub OAuth App, not used by server directly

### Fixed
- Auth context interface now uses `loginWithTokens` consistently

### Configuration
- **Dev:** Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `FRONTEND_URL=http://localhost:5173` in server `.env`
- **Prod (Render):** Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `FRONTEND_URL=https://lp-taskcat.vercel.app`
- **GitHub OAuth Apps:**
  - Dev: callback URL `http://localhost:5173/auth/github/callback`
  - Prod: callback URL `https://lp-taskcat.vercel.app/auth/github/callback`

## [1.0.0] - 2026-10-10

### Added
- Project & task management (kanban board, priorities, assignees, comments, links, history)
- User authentication (JWT 15m/7d, bcrypt, register/login/refresh/logout/change-password)
- GitHub OAuth callback handler (server-side, client integration in v1.1.0)
- Admin dashboard (users, projects, analytics)
- AI-powered document import (Gemini) for PDF/DOCX/CSV/text → draft tasks
- Swagger API docs at `/api-docs` (dev only)
- Health check at `/health`
- CI/CD: GitHub Actions builds server & client on push to `main`

### Tech Stack
- **Backend:** Node.js, Express 5, TypeScript, native MongoDB driver
- **Auth:** JWT (15m/7d), GitHub OAuth, bcryptjs
- **AI Import:** Google Gemini (`@google/genai`)
- **Frontend:** Vite, React 19, TypeScript, React Router, TanStack Query
- **Styling:** Tailwind CSS v4, shadcn/ui, Apple-esque design tokens
- **Database:** MongoDB Atlas

### Deployment
- **Backend:** Render — https://taskcat-jos6.onrender.com
- **Frontend:** Vercel — https://lp-taskcat.vercel.app
- **Database:** MongoDB Atlas
- **CI:** GitHub Actions builds server and client on each push to `main`

---

[1.4.0]: https://github.com/luigiparodi/taskcat/releases/tag/v1.4.0
[1.3.0]: https://github.com/luigiparodi/taskcat/releases/tag/v1.3.0
[1.2.0]: https://github.com/luigiparodi/taskcat/releases/tag/v1.2.0
[1.1.0]: https://github.com/luigiparodi/taskcat/releases/tag/v1.1.0
[1.0.0]: https://github.com/luigiparodi/taskcat/releases/tag/v1.0.0