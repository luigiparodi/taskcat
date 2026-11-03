# TaskCat — Client

Vite + React + TypeScript SPA. Auth flow, projects list, kanban board with drag-and-drop, task detail dialog, AI-assisted task import, Excel export, and admin area (projects, members, users with role management).

## Architecture

```
src/
├── components/     shared UI (AppHeader, Footer, CommandPalette) and ui/ primitives
├── features/       feature folders: auth, projects, admin
├── lib/            api client, hooks, utilities
├── test/           vitest setup + render harness
├── App.tsx         routes + lazy-loaded pages
└── main.tsx        providers: Theme > QueryClient > Router > Auth > App
```

Conventions: **logic lives in hooks, presentational code in `*View.tsx`, pages orchestrate.** Feature code lives in `features/{feature}/`.

### Key Patterns

- **Routing** — `react-router-dom` v7. Routes: `/login`, `/register`, `/projects`, `/projects/:projectId` (board), `/admin/projects`, `/admin/users`. `BoardPage` is lazy-loaded; protected routes go through `RequireAuth` / `RequireAdmin` with loading states (no login flash).
- **Server State** — `@tanstack/react-query` v5. Kanban drag-and-drop (`@dnd-kit`); optimistic status updates via `onMutate`/`onError`/`onSettled`. Retries skip 401/403/404/422.
- **Auth** — `AuthProvider` reads stored token synchronously for instant loading state. Context + hook in separate files (`auth-context.ts` / `AuthProvider.tsx`) for `react-refresh/only-export-components`.
- **Theme** — `next-themes` with a class attribute; dark is the default and `.light` overrides the tokens in `src/index.css`.
- **Export** — `projectsApi.downloadExport()` fetches the generated `.xlsx` with the auth header and triggers a browser download.

---

## API Layer & Wire Format

**Base path** — `import.meta.env.VITE_API_BASE || '/api'` (proxied by Vite to `http://localhost:3000` in dev). Set absolute URL for production + add to server's `CORS_ORIGINS`.

**Casing trap** — backend uses **snake_case** requests (`assigned_to`, `end_date`) and **camelCase** responses (`assignedTo`, `endDate`). Client mirrors wire format exactly — do not "fix" to camelCase.

**Envelopes** — `GET /projects` → `{ projects, total, page, limit }`; `GET /projects/:id/tasks` → `{ pending, working, finished }`; comments/links/history are bare arrays.

**Errors** — `{ error: string }`. `ApiError` exposes `status`, `message`, `isUnauthorized`/`isForbidden`/`isNotFound`/`isValidation`.

**Token refresh** — single-flight promise collapses concurrent 401s into one refresh, retries once with new token.

**Token storage** — `localStorage` under `cat-task.tokens` as `{ token, refreshToken }` (XSS tradeoff; API returns JSON tokens).

---

## Design System & Styling

- **Tailwind CSS v4** via `@tailwindcss/vite`. All design tokens live in `src/index.css` — it is the single source of truth (there is no separate token JSON export).
- **Monochrome neutral palette** — black, white and greys only. Semantic states stay distinguishable through luminosity, borders and inverted chips rather than hue.
- **Theming** — dark is the default (`:root`); the light theme is the `.light` class on `<html>`, managed by `next-themes` and toggled from `AppHeader`.
- **Typography** — self-hosted **Geist Variable** (`@fontsource-variable/geist`) with a 9-level type scale.
- **Components** — `src/components/ui/` holds `button`, `field`, `input`, `textarea`, `badge`, `card`, `dialog`, `alert-dialog`, `select`, `dropdown-menu`, `table`, and more on Radix primitives with shared `cn` from `@/lib/utils`.
- **Accessibility** — WCAG 2.1 AA intent. Colour pairings validated; three border tiers (`--border`, `--border-strong`, `--input`). `StatusBadge`/`PriorityBadge` are typed against backend enums (duplicated in `badge.tsx` — update both).

---

## Testing

Vitest and Testing Library are installed, but the client has no test suites checked in
yet. Backend tests are the enforced safety net (`server/src/__tests__`).

> Run `npm run lint` and `npm run build` before pushing — class-merging and Tailwind
> tree-shaking faults are invisible to TypeScript alone.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` / `npm run test:watch` | Vitest |

---

## Production Deploy

1. **Vercel** → Import repo, root: `client/`
2. Add env var: `VITE_API_BASE=https://your-api.onrender.com`
3. Deploy → auto-builds on push