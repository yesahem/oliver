# Oliver

An AI-powered app builder. Create a project, edit its files in a browser workspace, chat with an agent that generates code, and preview the app live in a WebContainer.

> System design: [`ARCHITECTURE.md`](./ARCHITECTURE.md)  
> Milestone plans: [`plans/`](./plans/) (start with [`plans/000-foundations.md`](./plans/000-foundations.md))

## Stack

| Piece | Tech |
|---|---|
| Monorepo | Turborepo + Bun workspaces |
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, Monaco, WebContainers |
| Backend | Express 5 + TypeScript on Bun |
| Database | PostgreSQL + Prisma (`packages/db`) |
| AI | Anthropic Claude (`ANTHROPIC_API_KEY` on the backend) |

**Use Bun for everything in this repo** — never npm, pnpm, or yarn.

## Prerequisites

- [Bun](https://bun.sh) `>= 1.3` (repo pins `1.3.14`)
- Node.js `>= 18` (needed by Next.js tooling)
- [Docker](https://docs.docker.com/get-docker/) (recommended for local Postgres), **or** any PostgreSQL 16+ instance
- An [Anthropic API key](https://console.anthropic.com/) if you want AI code generation

## Repository layout

```
apps/
  frontend/     Next.js UI — dashboard + workspace (port 3000)
  backend/      Express API — projects, files, AI (port 4000)
packages/
  db/           Prisma schema + shared PrismaClient (`import { prisma } from "db"`)
  ui/           Shared shadcn/ui components (`import { Button } from "ui/components/button"`)
  typescript-config/
  eslint-config/
```

## Local setup

### 1. Install dependencies

From the repo root:

```sh
bun install
```

### 2. Start PostgreSQL

Any Postgres works. The simplest local option:

```sh
docker run -d --name oliver-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=oliver \
  -p 5432:5432 \
  postgres:16-alpine
```

Default connection string used below:

```
postgresql://postgres:postgres@localhost:5432/oliver
```

### 3. Configure environment variables

Copy the example files and fill in values as needed:

```sh
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

| Variable | File | Required | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `packages/db/.env` | Yes | Prisma CLI (migrate / generate / studio) |
| `DATABASE_URL` | `apps/backend/.env` | Yes | Runtime DB connection for the API |
| `PORT` | `apps/backend/.env` | No | Backend port (default `4000`) |
| `FRONTEND_ORIGIN` | `apps/backend/.env` | No | CORS origin (default `http://localhost:3000`) |
| `ANTHROPIC_API_KEY` | `apps/backend/.env` | For AI | Powers `POST /ai/generate` |
| `NEXT_PUBLIC_API_URL` | `apps/frontend/.env.local` | No | Backend base URL (default `http://localhost:4000`) |

Both `DATABASE_URL` values should point at the same database.

### 4. Run database migrations

```sh
cd packages/db
bun run db:migrate
```

This applies migrations and generates the Prisma client into `packages/db/generated/prisma`.

If you only need to regenerate the client (no schema change):

```sh
bun run db:generate
```

### 5. Start the apps

From the repo root:

```sh
bun run dev
```

Turborepo starts:

- Frontend → [http://localhost:3000](http://localhost:3000)
- Backend → [http://localhost:4000](http://localhost:4000)
- Health check → [http://localhost:4000/health](http://localhost:4000/health)

## First run checklist

1. Open [http://localhost:3000](http://localhost:3000) — you should see the project dashboard.
2. Create a project — it is seeded with a minimal Vite + React + TypeScript template.
3. Open the project workspace — file explorer, Monaco editor, preview, and chat.
4. (Optional) Set `ANTHROPIC_API_KEY` in `apps/backend/.env`, restart the backend, and use chat to generate or edit files.

Without an Anthropic key, project CRUD, file editing, and the workspace UI still work; AI generation will fail until the key is set.

## Useful commands

```sh
# From repo root
bun run dev          # run frontend + backend
bun run build        # build all workspaces
bun run lint         # lint all workspaces
bun run check-types  # typecheck all workspaces
bun run format       # Prettier on ts/tsx/md

# Database (from packages/db)
bun run db:migrate   # create/apply migrations
bun run db:generate  # regenerate Prisma client
bun run db:push      # push schema without a migration (dev only)
bun run db:studio    # open Prisma Studio
```

Run a single workspace:

```sh
bun run dev --filter=frontend
bun run dev --filter=backend
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Frontend says it cannot reach the backend | Confirm `bun run dev` is running and `NEXT_PUBLIC_API_URL` points at `http://localhost:4000`. |
| Prisma / DB connection errors | Check Postgres is up (`docker ps`) and both `DATABASE_URL` values match. |
| `Cannot find module ... generated/prisma` | Run `cd packages/db && bun run db:generate` (or `db:migrate`). |
| AI generation returns a config error | Set `ANTHROPIC_API_KEY` in `apps/backend/.env` and restart the backend. |
| Port already in use | Stop the other process, or change `PORT` / Next’s port. |

## License

Private — all rights reserved.
