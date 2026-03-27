# Ray Board

Ray Board is a production-minded Kanban board built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, Supabase Postgres, Supabase Realtime, Zustand, dnd-kit, and Playwright.

It includes:

- 3 fixed lanes: `To Do`, `In Progress`, `Done`
- task creation, editing, deletion, and drag-and-drop ordering
- basic role-based access for the simulated collaborators
- realtime multi-session sync through Supabase Realtime
- persistent data in Supabase Postgres through Prisma
- simulated user switching without full authentication
- unit, integration, and end-to-end coverage
- a Vercel-friendly runtime with no custom server

## Stack

- Next.js 16 App Router
- TypeScript with strict mode
- Tailwind CSS 4
- Material UI 7 for the task dialog
- Prisma + Supabase Postgres
- Supabase Realtime
- Zustand
- dnd-kit
- Vitest
- Playwright

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the environment file:

```bash
copy .env.example .env
```

3. Fill in the Supabase database and public realtime values in `.env`.

4. Apply the Prisma migrations:

```bash
npm run prisma:migrate
```

5. Seed the collaborators and starter board:

```bash
npm run prisma:seed
```

6. Start the app:

```bash
npm run dev
```

The local app runs at [http://localhost:3000](http://localhost:3000).

## Environment Variables

`.env.example`

```env
DATABASE_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&schema=public"
DIRECT_URL="postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-<region>.pooler.supabase.com:5432/postgres?sslmode=require&schema=public"
SUPABASE_DB_SCHEMA="public"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="<your-supabase-publishable-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-supabase-service-role-key>"
```

Notes:

- `DATABASE_URL` is the pooled runtime connection used by Prisma in the app.
- `DIRECT_URL` is used by Prisma migrations.
- `SUPABASE_DB_SCHEMA` controls the schema name used for realtime subscriptions. The app defaults to `public`.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are used by the browser realtime client.
- `SUPABASE_SERVICE_ROLE_KEY` is used server-side to broadcast task mutation payloads through Supabase Realtime without waiting on a database change feed.
- Integration tests use an isolated schema inside the same Supabase database, and Playwright reseeds the configured app schema before browser validation. No local SQLite files are used anywhere.

## Runbook

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm run start
```

Database:

```bash
npm run prisma:migrate
npm run prisma:reset
npm run prisma:seed
```

Validation:

```bash
npm run lint
npm run type-check
npm test
npm run build
npm run test:e2e
```

## Database

Prisma models:

- `User`: simulated collaborators with name, role, color, and initials
- `Task`: title, description, status, stable order, timestamps, and user references
- `Activity`: task mutation history used by the activity feed

Persistence rules:

- all reads and writes go through Prisma
- task ordering is stored explicitly with an `order` field
- database setup is managed with Prisma migrations
- seeded collaborators and starter tasks are inserted idempotently
- there is no frontend-only board data source

## Architecture

- `app/`
  - App Router entrypoint and route handlers
  - server-rendered initial board fetch
- `src/components/board/`
  - Kanban UI, task cards, dialog, activity feed, and user switcher
- `src/features/tasks/`
  - domain types, API clients, hooks, drag helpers, and Zustand stores
- `src/lib/db/`
  - Prisma client, board queries, user queries, and task mutation transactions
- `src/lib/supabase/`
  - browser Supabase client for realtime subscriptions and presence
- `scripts/with-db-schema-env.ts`
  - isolated schema wrapper for tests and local E2E runs
- `tests/`
  - `unit/` pure utilities and validation
  - `integration/` route handler and persistence behavior
  - `e2e/` full browser flows with realtime coverage

## State Management

Zustand is split by concern:

- `board-store`
  - board columns
  - activity feed
  - optimistic mutation state
  - realtime connection state
  - rollback support
- `user-store`
  - simulated user identity
  - presence indicators
  - localStorage persistence for the current user

Server communication stays in hooks and API helpers, not in presentational components.

## Realtime

Realtime is driven by Supabase.

Flow:

1. The client applies an optimistic update in the board store.
2. A Next.js route handler validates the request with Zod.
3. Prisma writes the change to Supabase Postgres inside a transaction.
4. The route handler broadcasts the exact mutation payload through Supabase Realtime Broadcast.
5. Connected clients apply that payload directly to the board store.
6. Presence is tracked through a Supabase Realtime channel and mapped to the simulated user list.

This keeps cross-session updates fast and preserves the optimistic feel for the initiating client.

## Trade-offs and Assumptions

- I kept the board to the three required lanes only: `To Do`, `In Progress`, and `Done`.
- I used simulated collaborators instead of full authentication because the assignment only required multi-user simulation.
- I used optimistic UI updates with rollback so task movement feels immediate while the server still remains the source of truth.
- I stored explicit task order values in the database so reordering stays deterministic across reloads and realtime updates.
- I kept role-based access intentionally small and easy to review: `Product Lead` has full access, `Frontend Engineer` cannot delete tasks, and `QA Analyst` is limited to move and reorder actions.

## Testing

Automated coverage includes:

- unit tests for reorder logic, task utilities, and validation
- unit tests for role-based access rules
- integration tests for board routes, task routes, persistence behavior, and forbidden role paths
- Playwright E2E for core browser flows including permission-aware UI, create, edit, status changes, persistence after reload, delete flows, and multi-session realtime sync

Integration tests use an isolated Supabase schema. The Playwright run reseeds the configured app schema to validate the same realtime wiring used by the app runtime.

## AI-Assisted Development

I used AI during development to speed up implementation, debugging, and iteration, but I reviewed everything manually, corrected weak outputs, and kept steering it back to the assignment requirements whenever needed. I made the final decisions myself and validated the finished implementation against the required stack, architecture, and behavior.

## Folder Structure

```txt
app/
  api/
    board/
    tasks/
    users/
  error.tsx
  globals.css
  layout.tsx
  loading.tsx
  page.tsx
prisma/
  migrations/
  schema.prisma
  seed.ts
scripts/
  with-db-schema-env.ts
src/
  components/
  features/
  lib/
tests/
  e2e/
  integration/
  setup/
  unit/
```
