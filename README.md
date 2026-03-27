# Ray Board

Ray Board is a production-minded mini Kanban board built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, Zustand, dnd-kit, Socket.IO, and Playwright.

It delivers:

- 3 fixed lanes: `To Do`, `In Progress`, `Done`
- task creation and editing
- drag-and-drop lane moves
- drag-and-drop same-lane reordering
- realtime multi-session sync
- SQLite persistence through Prisma
- simulated user switching without full authentication
- automated unit, integration, and end-to-end coverage

## Stack

- Next.js 16 App Router
- TypeScript with strict mode
- Tailwind CSS 4
- Material UI 7 for the task dialog only
- Prisma + SQLite
- Zustand
- dnd-kit
- Socket.IO
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

3. Apply the Prisma migration:

```bash
npm run prisma:migrate
```

4. Seed the simulated collaborators:

```bash
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

The local app runs at [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Environment Variables

`.env.example`

```env
DATABASE_URL="file:./dev.db"
```

Notes:

- Prisma reads `DATABASE_URL` for all runtime queries and migrations.
- Test and E2E scripts override `DATABASE_URL` so they use isolated SQLite files.

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

Core checks:

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
- `Activity`: task mutation history used for the realtime activity feed

Persistence rules:

- all reads and writes go through Prisma
- task ordering is stored explicitly with an `order` field
- users are seeded idempotently
- there is no frontend-only board data source

Migration files live in `prisma/migrations/`.

## Architecture

The app uses a custom Node server because Socket.IO needs a shared HTTP server.

- `server.ts`
  - boots Next.js
  - attaches Socket.IO on `/socket.io`
  - hydrates new socket clients with the board snapshot
  - broadcasts presence updates for simulated users
- `app/`
  - App Router entrypoint and route handlers
  - server-rendered initial board fetch
- `src/components/board/`
  - Kanban UI, task cards, dialog, activity feed, and user switcher
- `src/features/tasks/`
  - domain types, API clients, DnD/reorder helpers, hooks, and Zustand stores
- `src/lib/db/`
  - Prisma client, board queries, user queries, and task mutation transactions
- `src/lib/realtime/`
  - typed socket events, client connection, and server registry
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
  - online user presence
  - localStorage persistence for the current user

Server communication stays in hooks and API helpers, not in presentational components.

## Realtime Flow

1. The client applies an optimistic update through the board store.
2. A route handler validates the request with Zod.
3. Prisma writes the change inside a transaction.
4. The server emits a typed Socket.IO event after persistence succeeds.
5. All clients reconcile from the server-confirmed payload.

Socket events:

- `board:hydrated`
- `task:created`
- `task:updated`
- `task:moved`
- `task:reordered`
- `user:changed`
- `presence:updated`

## Drag and Drop

dnd-kit powers the board interactions.

- cross-column movement is handled through pointer-based collision detection with a `closestCorners` fallback
- same-column reorder persists the updated order to SQLite
- keyboard-friendly directional move controls are also exposed on each task card as an accessibility and testing fallback

## Testing

Automated coverage includes:

- unit tests for reorder logic, task utilities, and validation
- integration tests for board routes, task routes, and persistence behavior
- Playwright E2E for create, edit, drag between columns, reorder within a column, persistence after reload, and realtime propagation across two browser contexts

The E2E suite runs against the real custom Socket.IO server and SQLite-backed API.

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
src/
  components/
  features/
  lib/
tests/
  e2e/
  integration/
  setup/
  unit/
server.ts
```

## Trade-offs and Assumptions

- The board uses simulated users instead of authentication because the assignment only requires clear multi-user behavior.
- Material UI is intentionally limited to the task dialog where it improves form UX and accessibility.
- The runtime App Router lives in root `app/` because this Next.js 16 project was initialized with that entrypoint already in place.
- The Prisma reset scripts for test databases include `RUST_LOG=debug` because the schema engine was unstable without it in this local environment.
- The app is designed for a single shared board with fixed statuses, which keeps the domain aligned with the assignment and the persistence model simpler.

## Deployment Notes

This project is not a static deployment.

Because realtime depends on Socket.IO attached to `server.ts`, deploy it to a Node-capable host that supports long-running processes and WebSocket connections.

Recommended deployment shape:

1. Set `DATABASE_URL`.
2. Run `npm install`.
3. Run `npm run prisma:migrate`.
4. Run `npm run build`.
5. Run `npm run start`.

If you deploy on a platform that does not support a custom Node server, the realtime architecture would need to be redesigned.
