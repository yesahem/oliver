# Oliver

An AI-powered app builder: create a project, edit its files in a browser
workspace, and (in later milestones) chat with an agent that generates and
previews the app live.

See `ARCHITECTURE.md` for the system design and `plans/` for the milestone
plans (`plans/000-foundations.md` records the shared decisions).

## Repository layout

- `apps/frontend` — Next.js 16 App Router UI (dashboard + 4-panel workspace: file explorer, Monaco editor, preview, chat), port 3000
- `apps/backend` — Express 5 + TypeScript on the Bun runtime (project/file APIs), port 4000
- `packages/db` — Prisma schema and the shared singleton `PrismaClient` (`import { prisma } from "db"`)
- `packages/ui` — shared shadcn/ui component library (`import { Button } from "ui/components/button"`)
- `packages/typescript-config`, `packages/eslint-config` — shared configs

Everything runs with **Bun** — never npm/pnpm/yarn.

## Getting started

1. **Install dependencies**

   ```sh
   bun install
   ```

2. **Start a local Postgres** (any Postgres works; `DATABASE_URL` lives in
   `packages/db/.env` for the Prisma CLI and `apps/backend/.env` for runtime):

   ```sh
   docker run -d --name oliver-postgres \
     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=oliver \
     -p 5432:5432 postgres:16-alpine
   ```

3. **Run migrations** (from `packages/db`):

   ```sh
   cd packages/db && bun run db:migrate
   ```

4. **Start the apps** (from the repo root):

   ```sh
   bun run dev
   ```

   Turborepo boots the frontend on <http://localhost:3000> and the backend on
   <http://localhost:4000>.

## Environment variables

| Variable | Location | Purpose |
|---|---|---|
| `DATABASE_URL` | `packages/db/.env` | Prisma CLI (migrate/generate/studio) |
| `DATABASE_URL` | `apps/backend/.env` | runtime connection for the API |
| `PORT` | `apps/backend/.env` | backend port (default 4000) |
| `FRONTEND_ORIGIN` | `apps/backend/.env` | CORS origin (default `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | `apps/frontend/.env.local` | backend base URL for the frontend |

## Useful commands

```sh
bun run dev          # run everything (turbo run dev)
bun run build        # build all workspaces
bun run lint         # lint all workspaces
bun run check-types  # typecheck all workspaces
cd packages/db && bun run db:studio   # browse the database
```
