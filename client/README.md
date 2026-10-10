# Cat Task — Client

Vite + React + TypeScript SPA. Auth flow, projects list, kanban board with drag-and-drop, task detail dialog, AI-assisted task import, and admin area (projects, members, users with role management).

## Architecture

```
src/
├── components/     shared UI (AppHeader) and ui/ primitives
├── features/       feature folders: auth, projects, admin
├── lib/            api client, hooks, utilities
├── test/           vitest setup + render harness
├── App.tsx         routes + lazy-loaded pages
└── main.tsx        providers: QueryClient > Router > Auth > App
```

Conventions: **logic lives in hooks, presentational code in `*View.tsx`, pages orchestrate.** Feature code lives in `features/{feature}/`.

### Key Patterns

- **Routing** — `react-router-dom` v7. Routes: `/login`, `/register`, `/projects`, `/projects/:projectId` (board), `/admin/projects`, `/admin/users`. `BoardPage` is lazy-loaded; protected routes go through `RequireAuth` / `RequireAdmin` with loading states (no login flash).
- **Server State** — `@tanstack/react-query` v5. Kanban drag-and-drop (`@dnd-kit`); optimistic status updates via `onMutate`/`onError`/`onSettled`. Retries skip 401/403/404/422.
- **Auth** — `AuthProvider` reads stored token synchronously for instant loading state. Context + hook in separate files (`auth-context.ts` / `AuthProvider.tsx`) for `react-refresh/only-export-components`.

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

- **Tailwind CSS v4** via `@tailwindcss/vite`; tokens in `src/index.css` → `design-tokens.json`. Dark mode supported.
- **Apple-esque direction**, self-hosted **Geist Variable** font (`@fontsource-variable/geist`).
- **Components** — `src/components/ui/` holds `button`, `field`, `input`, `textarea`, `badge`, `card`, `dialog`, `alert-dialog`, `select`, `dropdown-menu` on Radix primitives with shared `cn` from `@/lib/utils`.
- **Accessibility** — WCAG 2.1 AA. Colour pairings validated; three border tiers (`--border`, `--border-strong`, `--input`). `StatusBadge`/`PriorityBadge` typed against backend enums (duplicated in `badge.tsx` — update both).

---

## Testing

Vitest + jsdom + Testing Library. Config in `vitest.config.ts` (separate from `vite.config.ts` for React plugin).

- `npm test` — run once; `npm run test:watch` — watch mode.
- `src/test/setup.ts` registers jest-dom matchers, RTL cleanup, pointer-capture/scrollIntoView polyfills for Radix Select, `afterEach` sweep.
- `src/test/harness.tsx` exports `renderWithProviders` + `ADMIN_USER`/`WORKER_USER` for components using `useAuth()`/`useNavigate()`.

> Run `npm test`, `npm run lint`, and `tsc -b` together — class-merging and Tailwind tree-shaking faults are invisible to any one alone.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Vitest |

---

## Production Deploy

1. **Vercel** → Import repo, root: `client/`
2. Add env var: `VITE_API_BASE=https://your-api.onrender.com`
3. Deploy → auto-builds on push