# Backend (`apps/backend`)

**Express 5 + TypeScript running on the Bun runtime.** This is a deliberate
architecture decision (see `plans/000-foundations.md`); it supersedes the
auto-generated Bun advice that previously lived here ("use `Bun.serve()`,
don't use `express`").

- Entry point: `src/index.ts`, run with `bun --hot src/index.ts` (`bun run dev`).
- Port 4000 (`PORT` env, default 4000). CORS allows the frontend origin
  (`http://localhost:3000`, `FRONTEND_ORIGIN` env).
- Structure: `src/routes/` → `src/controllers/` → `src/services/`, plus
  `src/lib/` helpers. Feature modules (`src/ai/`, `src/deployment/`) are added
  by later plans.
- Database access goes through the `db` workspace package (singleton
  PrismaClient) — never instantiate PrismaClient here.
- Validation with `zod`; error responses are `{ error }` JSON with proper
  status codes.

## Bun conventions (still apply)

- Use `bun <file>`, `bun install`, `bun add`, `bun run <script>`, `bunx` —
  never npm/pnpm/yarn/node.
- Bun automatically loads `.env` — don't use the `dotenv` package.
- Use `bun test` for tests.
- Prefer `Bun.file` over `node:fs` readFile/writeFile where convenient.
