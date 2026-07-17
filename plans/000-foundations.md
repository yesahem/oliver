# Plan 000 — Foundations (shared decisions for all plans)

> Applies to: `plans/001-plan.md` … `plans/010-plan.md`
> Sources: `ARCHITECTURE.md`, `specs/001-specs.md` (Development Rules), current repo state

Every per-spec plan assumes the decisions below. They are recorded once here so individual plans stay focused on their milestone.

---

## Tooling & package management

- **Bun exclusively** in the platform repo: `bun add`, `bun add -d`, `bun run`, `bunx`. Never `npm`, `pnpm`, or `yarn`.
- Turborepo drives builds: `bun run dev` at the root runs `turbo run dev` for all workspaces.
- TypeScript strict mode everywhere; shared configs come from `packages/typescript-config` and `packages/eslint-config` (already present, reuse as-is).

## Backend (`apps/backend`)

- **Express 5 + TypeScript running on the Bun runtime** (decided explicitly; supersedes the auto-generated advice in `apps/backend/CLAUDE.md` — update that file during Plan 001 to record this decision).
- Port **4000** (`PORT` env, default 4000). CORS allows the frontend origin (`http://localhost:3000`).
- Structure: `apps/backend/src/{routes,controllers,services}` plus feature modules added by later plans (`src/ai/`, `src/deployment/`).
- Entry point: `apps/backend/src/index.ts`, run with `bun --hot src/index.ts` as the `dev` script.
- Bun auto-loads `.env` — no `dotenv` dependency.

## Frontend (`apps/frontend`)

- **Next.js 16 App Router** (already scaffolded, version 16.2.10) + Tailwind CSS v4.
- ⚠️ `apps/frontend/AGENTS.md` warns this Next.js version has breaking changes vs. training data. **Read the relevant guides in `node_modules/next/dist/docs/` before writing frontend code.**
- **shadcn/ui** for all components, **lucide-react** for all icons, **dark mode first** (root layout defaults to the dark theme).
- **Zustand** for workspace state — the file explorer, Monaco tabs, chat, and preview panels all share `selectedFile` / `openedFiles` / `fileTree` state; a store avoids prop-drilling and Monaco re-render churn. Local state remains fine for isolated component concerns.
- Backend base URL via `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`), wrapped in a small typed fetch helper at `apps/frontend/lib/api.ts`.

## Shared UI (`packages/ui`)

- `packages/ui` is currently a **standalone Vite app scaffold — wrong shape**. Plan 001 restructures it into a shadcn/ui **library package**:
  - `src/components/ui/*` (shadcn components), `src/lib/utils.ts` (`cn` helper), `src/styles/globals.css` (theme tokens).
  - `components.json` configured for the monorepo; package `exports` map (`"./components/*"`, `"./lib/*"`, `"./globals.css"`).
  - Consumed by the frontend through `transpilePackages: ["ui"]` in `next.config.ts`.
  - The Vite app files (`index.html`, `vite.config.ts`, `src/App.tsx`, `src/main.tsx`, assets) are deleted.

## Database (`packages/db`)

- Prisma with the existing scaffold: `prisma-client` generator outputting to `packages/db/generated/prisma`, datasource `postgresql`.
- Local development database: **Prisma Postgres** via `bunx prisma dev` (the existing `DATABASE_URL` in `packages/db/.env` already points at it). Any real Postgres works by swapping `DATABASE_URL`.
- `packages/db/index.ts` exports a **singleton PrismaClient** plus generated model types; both apps import from the `db` workspace package.
- Schema grows across plans — one migration per plan that touches it:
  - Plan 001: `Project`, `File`
  - Plan 003: `ChatMessage`
  - Plan 007: `BuildLog`
  - Plan 008: `Project.memory Json`
  - Plan 010: `Deployment`
- Scripts in `packages/db/package.json`: `db:generate`, `db:migrate`, `db:push`, `db:studio`.

## AI

- `@anthropic-ai/sdk`, **backend only** — no AI logic or API keys in the frontend.
- Model: **`claude-sonnet-5`** (capable + cost-effective for codegen). Centralize the model id in one config constant so it can be swapped.
- `ANTHROPIC_API_KEY` lives in `apps/backend/.env` (gitignored).

## The generated-app template

Specs 01 and 02 conflict slightly: 01 says projects start "blank", 02 requires something runnable in the WebContainer. Resolution: **every new project is seeded with a minimal Vite + React + TypeScript template** stored as `File` rows (`package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`). This gives Spec 01 a file tree to render and Spec 02 an app to boot. The template lives in the backend as a constant (`apps/backend/src/services/template.ts`).

Note the two distinct stacks:

| | Platform repo | Generated apps (inside WebContainer) |
|---|---|---|
| Framework | Next.js 16 (frontend), Express (backend) | Vite + React |
| Package manager | Bun, always | **npm** (see correction #1) |
| Database | Postgres via Prisma | none for MVP |

## Spec corrections (resolved deliberately, referenced by later plans)

1. **Bun does not run inside WebContainers.** Specs 02/07 say to run `bun install` / `bun run dev` inside the container, but WebContainers only provide Node.js with npm/pnpm/yarn. **Inside the WebContainer we use `npm`.** Bun remains mandatory for the platform repo itself. The seeded template's scripts are plain `vite` commands so either runner works.
2. **WebContainers require cross-origin isolation.** `next.config.ts` must send `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers on workspace routes (Plan 002).
3. **Spec 07's build/repair loop runs server-side**, not in the browser: the backend materializes project files into a scratch directory and runs **allowlisted commands only** (`bun install`, `bun run build` — never arbitrary shell, per ARCHITECTURE.md §11), parses errors, and repair-loops with Claude (max 3 attempts). The WebContainer stays a pure preview surface.
4. **"Blank project" vs. runnable preview** — resolved by the seeded template above.

## Environment variables (accumulated across plans)

| Variable | Location | Introduced |
|---|---|---|
| `DATABASE_URL` | `packages/db/.env` | exists |
| `PORT` | `apps/backend/.env` | Plan 001 |
| `NEXT_PUBLIC_API_URL` | `apps/frontend/.env.local` | Plan 001 |
| `ANTHROPIC_API_KEY` | `apps/backend/.env` | Plan 003 |
| `VERCEL_TOKEN` | `apps/backend/.env` | Plan 010 |

## Plan dependency order

```
001 Workspace ──► 002 WebContainer ──► 003 Single Agent ──► 004 Diff Engine ──► 005 Context Builder
                                                                                      │
                       009 Incremental Editing ◄── 008 Project Memory ◄── 007 Auto Build ◄── 006 Streaming
                                │
                                └──► 010 Deployment
```

Each plan lists its hard prerequisites; the order above is the intended build order (matches the specs' Day 1 → Day 15 phasing).
