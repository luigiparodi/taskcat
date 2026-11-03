# TaskCat

A full-stack project and task management app. Teams are organised into **projects**; each project holds a kanban board of **tasks** with priorities, assignees, comments, links and history. Admins manage users and projects, get an analytics dashboard, and requirements documents can be converted into draft tasks with AI. Projects can also be exported to a formatted Excel workbook.

## Repository Structure

```
taskcat-app/
├── server/            Express + TypeScript + MongoDB API
├── client/            Vite + React + TypeScript SPA (Tailwind v4 + shadcn/ui)
├── .github/           CI workflow
├── render.yaml        Render Blueprint for the API
├── CHANGELOG.md       Release history
├── PRIORITY_TASKS.md  Prioritized backlog
└── README.md
```

## Tech Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Backend   | Node.js, Express 5, TypeScript, native MongoDB driver |
| Auth      | JWT (15m/7d), GitHub OAuth, bcryptjs                  |
| AI Import | Google Gemini (`@google/genai`)                       |
| Export    | ExcelJS (formatted `.xlsx` workbooks)                 |
| Frontend  | Vite, React, TypeScript, React Router, TanStack Query |
| Forms     | React Hook Form + Zod                                 |
| UX        | Excel export, command palette, virtualized comments, Markdown, PWA |
| Styling   | Tailwind CSS v4, shadcn/ui, monochrome neutral tokens |

## Features

- Kanban board with drag-and-drop, drag preview, and board/list toggle
- Task priorities, assignees, comments, links, and full change history
- AI-assisted task import from PDF, DOCX, and Markdown
- Project export to Excel (Project, Members, and Tasks sheets)
- Admin area for users, projects, members, roles, and analytics
- GitHub OAuth and email/password authentication
- Dark-first monochrome UI with a light theme toggle
- Command palette (`Ctrl`/`Cmd` + `K`), Markdown rendering, PWA install support

## Deployment

### Backend — Render

1. Push to GitHub and connect the Blueprint (`render.yaml`).
2. Set the required environment variables in Render:
   `DATABASE_URL`, `DATABASE_NAME`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
   `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GEMINI_API_KEY`.
3. Set `CORS_ORIGINS` and `FRONTEND_URL` to the deployed frontend origin.
4. Add the frontend `/auth/github/callback` URL to the GitHub OAuth App.

### Frontend — Vercel

1. Import the repository and set the root directory to `client/`.
2. Set `VITE_API_BASE` to the Render API URL.
3. Deploy; every push to `main` rebuilds automatically.

## Quick Start (Local Dev)

```bash
# 1. Backend
cd server
npm install
cp .env.example .env   # fill values
npm run dev            # http://localhost:3000, API docs at /api-docs

# 2. Frontend
cd client
npm install
npm run dev            # http://localhost:5173 (proxies /api to server)
```

## Testing & Formatting

```bash
# Backend (Jest): health smoke test + auth API contract tests
cd server && npm test

# Static checks
cd server && npm run build
cd client && npm run lint && npm run build

# Format either workspace
cd client && npm run format
cd server && npm run format
```

> Backend tests live in `server/src/__tests__` and run in CI alongside the server
> build and the client lint/build. Prettier configuration is shared at the repository root.

## Documentation

- `server/README.md` — architecture, environment variables, API endpoints
- `client/README.md` — frontend architecture, design tokens, API layer
- `client/SECURITY.md` — dependency advisory notes
- Live API docs at `/api-docs` (dev only)

## CI/CD

GitHub Actions runs on every push to `main` and on pull requests:

- **Server:** install → test → build
- **Client:** install → lint → build
