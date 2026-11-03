# Priority Task List

Prioritized backlog for TaskCat. Checkboxes mark completion. Priorities: **P0** (critical), **P1** (high), **P2** (medium), **P3** (nice-to-have).

## P0 — Critical / Security

- [x] Fail fast when `JWT_SECRET` is missing in production
- [x] Verify GitHub OAuth `state` (CSRF protection)
- [x] Restrict Multer uploads to PDF/DOCX with field/file limits
- [x] Sync `package-lock.json` with `package.json` for Render deploys
- [ ] Migrate auth tokens from `localStorage` to httpOnly cookies
- [x] Persist import sessions in MongoDB with TTL (multi-instance safe)

## P1 — High / Reliability & Performance

- [x] Graceful shutdown (SIGTERM/SIGINT) closing Mongo client
- [x] Readiness probe `/ready` (DB ping)
- [x] Add missing MongoDB indexes (comments, links, history, audit logs, projects, members, tasks)
- [x] Virtualize large lists (comments list) — `@tanstack/react-virtual`
- [x] Re-add server tests to CI pipeline
- [ ] Add request rate limiting per route (stricter on auth/import)
- [ ] Add pagination/cap to kanban task list endpoint
- [ ] Text search via MongoDB `$text` or Atlas Search

## P2 — Medium / Maintainability & DX

- [x] Consolidate duplicate `ProjectAccess` interface
- [x] Add `parseObjectId` helper and adopt in services
- [x] Add lightweight request logging
- [x] Add `.gitignore` and untrack generated files
- [x] Align `@types/node` with CI Node version
- [x] Production env validation on boot
- [x] Add Prettier + format scripts (client/server)
- [ ] Move Zod schemas to shared package for client/server validation
- [x] Add API contract tests (auth)
- [x] Add React Query devtools in dev

## P3 — Nice-to-have / UX & Libraries

- [x] Error boundary around lazy routes
- [x] Skeleton loading states (projects list)
- [x] Form validation with `react-hook-form` + `zod` (login/register)
- [x] Command palette (`cmdk`) for quick navigation/actions
- [x] Markdown rendering for task descriptions
- [x] Drag-and-drop polish (drag overlay preview)
- [x] Dark mode: proper dark/light themes (dark default, .light class) + toggle
- [x] Monochrome neutral design system (black/white/grey tokens, no brand hues)
- [x] Project Excel export (Project, Members, Tasks sheets)
- [x] Responsive kanban list view (board/list toggle)
- [x] PWA / offline support (`vite-plugin-pwa`)
- [ ] Internationalization (`react-i18next`)
- [ ] Admin tables with sorting/filtering
- [x] File upload UX with `react-dropzone`
- [ ] Mobile bottom-sheet task detail (`vaul`)

## Backlog / Research

- [ ] Evaluate httpOnly cookie auth migration effort
- [ ] Evaluate Atlas Search for task search
- [ ] Evaluate tRPC or shared types for client/server contract
- [ ] Load/performance testing for import (Gemini) flow

---

Update this file as tasks are completed.