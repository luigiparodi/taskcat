# Cat Task

A full-stack project and task management app. Teams are organised into **projects**; each project holds a kanban board of **tasks** with priorities, assignees, comments, links and history. Admins manage users and projects, get an analytics dashboard, and requirements documents can be converted into draft tasks with AI.

## Repository Structure

```
taskcat-app/
├── server/     Express + TypeScript + MongoDB API
├── client/     Vite + React + TypeScript SPA (Tailwind v4 + shadcn/ui)
├── docs/       Product and design documents
├── scripts/    Repo utilities
├── .github/    CI/CD workflows
└── render.yaml Render Blueprint for backend deploy
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express 5, TypeScript, native MongoDB driver |
| Auth | JWT (15m/7d), GitHub OAuth, bcryptjs |
| AI Import | Google Gemini (`@google/genai`) |
| Frontend | Vite, React, TypeScript, React Router, TanStack Query |
| Styling | Tailwind CSS v4, shadcn/ui, Apple-esque design tokens |

---

## ✅ Setup Checklist (Production)

- [x] **Deploy to Render (API) + Vercel (Frontend)**
  - Push to GitHub → connect Render Blueprint (`render.yaml`) + Vercel (`client/vercel.json`)
  - Set env vars in Render: `MONGODB_URI`, `GITHUB_CLIENT_ID/SECRET`, `GEMINI_API_KEY`
  - Set `VITE_API_BASE` in Vercel to Render API URL
  - Update `CORS_ORIGINS` in Render after Vercel URL is known

- [x] **GitHub OAuth Connection**
  - Create GitHub OAuth app → add callback URL to Render env
  - Verify login flow works end-to-end

- [ ] **Better System UI**
  - Refine dark mode, animations, loading states
  - Improve kanban drag UX, empty states

---

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

---

## Testing

```bash
# Backend
cd server && npm test

# Frontend
cd client && npm test
```

## Documentation

- `server/README.md` — architecture, env vars, API endpoints
- `client/README.md` — frontend architecture, design system, API layer
- `ENDPOINTS.md` — generated API reference
- Live API docs at `/api-docs` (dev only)

## CI/CD

GitHub Actions runs on every push: tests → lint → build for both server and client.