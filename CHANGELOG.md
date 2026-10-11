# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.1.0]: https://github.com/luigiparodi/taskcat/releases/tag/v1.1.0
[1.0.0]: https://github.com/luigiparodi/taskcat/releases/tag/v1.0.0