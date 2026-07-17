# Plan 001 — Project Workspace

> Implements: `specs/001-specs.md`
> Prerequisites: none (this is the foundation)
> Shared decisions: see `plans/000-foundations.md`

## Objective

A user can create a project, open it from a dashboard, and land in a 4-panel workspace (file explorer · Monaco editor · preview placeholder · chat shell) whose file tree and file contents are persisted in Postgres through the Express API.

---

## Step 1 — Database (`packages/db`)

1. Define models in `packages/db/prisma/schema.prisma`:

   ```prisma
   model Project {
     id        String   @id @default(uuid())
     name      String
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     files     File[]
   }

   model File {
     id        String   @id @default(uuid())
     projectId String
     project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
     name      String
     path      String   // full path from project root, e.g. "src/App.tsx"
     content   String   @default("")
     isFolder  Boolean  @default(false)
     parentId  String?  // null = project root
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt

     @@unique([projectId, path])
     @@index([projectId, parentId])
   }
   ```

   The tree is reconstructable from `parentId` alone; `path` is denormalized for cheap lookups and WebContainer mounting later.

2. `bun add -d prisma` / `bun add @prisma/client` in `packages/db`; add scripts `db:generate`, `db:migrate` (`prisma migrate dev`), `db:push`, `db:studio`.
3. Start local DB with `bunx prisma dev` (existing `DATABASE_URL` already targets it), run the first migration.
4. Replace `packages/db/index.ts` with a singleton export:
   - `export const prisma = new PrismaClient()` (global-cached to survive hot reload)
   - re-export generated types (`Project`, `File`).

## Step 2 — Shared UI library (`packages/ui`)

Restructure from Vite-app scaffold to a shadcn/ui library (foundations decision):

1. Delete Vite app files: `index.html`, `vite.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `src/App.tsx`, `src/App.css`, `src/main.tsx`, `src/index.css`, `src/assets/`, `public/`.
2. Rewrite `package.json`: name `ui`, `exports` map for `./components/*`, `./lib/*`, `./globals.css`; peer deps `react`/`react-dom`; deps `tailwindcss` v4, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, needed Radix packages. `tsconfig.json` extends `packages/typescript-config/react-library.json`.
3. Add `components.json` (style: default, CSS variables, paths into `src/`), `src/lib/utils.ts` (`cn`), `src/styles/globals.css` with Tailwind v4 `@theme` tokens — **dark theme as default**.
4. Install the Spec-01 component set via `bunx shadcn@latest add` into `src/components/ui/`: button, card, input, textarea, dialog, dropdown-menu, sheet, scroll-area, tabs, separator, tooltip, avatar, skeleton, badge, alert-dialog, context-menu, command, popover, resizable, sonner.
5. Frontend consumption: `transpilePackages: ["ui"]` in `apps/frontend/next.config.ts`; import globals.css from the root layout; components as `import { Button } from "ui/components/button"`.

## Step 3 — Backend API (`apps/backend`)

1. `bun add express cors` + `bun add -d @types/express @types/cors`; dev script `bun --hot src/index.ts`; update `apps/backend/CLAUDE.md` to record the Express decision (replacing the "don't use express" line).
2. Structure:

   ```
   src/
     index.ts            # express app, cors, json body limit ~10mb, error middleware
     routes/projects.ts
     controllers/projects.controller.ts
     services/projects.service.ts   # Prisma queries, tree assembly
     services/template.ts           # seeded Vite+React template (foundations)
     lib/file-tree.ts               # File[] -> nested tree
   ```

3. Endpoints (per spec):
   - `POST /projects` `{ name }` → creates project **and seeds template `File` rows** (folders + files, correct `parentId`/`path`). Returns `{ id, name }`.
   - `GET /projects` → all projects, newest first.
   - `GET /projects/:id` → `{ project, fileTree }` where `fileTree` is the nested structure from `lib/file-tree.ts` (folders first, then files, alphabetical).
   - `PUT /projects/:id/files/:fileId` `{ content }` → updates content + `updatedAt`; 404s for wrong project/file.
4. Validation with `zod` (name required/max length); errors return `{ error }` JSON with proper status codes.

## Step 4 — Frontend (`apps/frontend`)

Dependencies: `zustand`, `@monaco-editor/react`. Read `node_modules/next/dist/docs/` first (AGENTS.md warning).

1. **API client** `lib/api.ts` — typed fetch wrappers for the four endpoints, base URL from `NEXT_PUBLIC_API_URL`.
2. **Types** `lib/types.ts` — `Project`, `FileNode` (tree node with `children`).
3. **Store** `stores/workspace.ts` (Zustand): `project`, `fileTree`, `selectedFileId`, `openedFiles` (id → { file, content, dirty }), actions `openFile`, `closeFile`, `updateContent`, `markSaved`.
4. **Dashboard** `app/page.tsx`: server component fetching projects; grid of Cards (name, createdAt) linking to `/project/[id]`; "New Project" button opening a Dialog (name input → `POST /projects` → navigate). Empty state + skeletons.
5. **Workspace** `app/project/[id]/page.tsx`: fetches `GET /projects/:id`, hydrates the store, renders:

   ```
   components/workspace/workspace-layout.tsx   # navbar + ResizablePanelGroup (4 panels)
   components/workspace/navbar.tsx             # project name, back link
   components/sidebar/file-explorer.tsx        # recursive tree, chevrons, lucide icons
   components/editor/editor-panel.tsx          # tabs for openedFiles + Monaco
   components/editor/monaco.tsx                # @monaco-editor/react, ssr:false dynamic import, vs-dark
   components/preview/preview-panel.tsx        # "Preview coming soon..." placeholder
   components/chat/chat-panel.tsx              # message list + Textarea + send (local state only)
   ```

6. Editor behavior: clicking a file opens a tab and loads content into Monaco; edits update the store (`dirty` flag shown as a dot on the tab); **Cmd/Ctrl+S** and a Save button call `PUT /projects/:id/files/:fileId`, then `markSaved`. Language inferred from extension.
7. Chat panel is UI-only: appends the typed message locally, no backend call.

## Step 5 — Wiring & polish

- Root `turbo.json` already runs `dev` everywhere; confirm `bun run dev` boots Next (3000) + Express (4000) + requires `bunx prisma dev` running (document in README or a `predev` note).
- Dark theme applied on `<html>` in the root layout; responsive: panels stack/scroll reasonably at narrow widths (spec: responsive by default).

---

## Acceptance checklist (from spec)

- [ ] User can create a project (dialog → API → DB row + seeded template files)
- [ ] Projects listed on dashboard; clicking opens `/project/:id`
- [ ] Workspace renders navbar + 4 panels
- [ ] Sidebar shows nested file tree from DB
- [ ] Clicking a file opens it in Monaco; editing works; dirty state tracked
- [ ] Save persists via `PUT /projects/:id/files/:fileId`; reload returns same content
- [ ] Chat UI and preview placeholder visible

## Out of scope (per spec)

AI generation, WebContainers, live preview, file create/rename/delete/drag, auth, collaboration, deployment, terminal, git.
