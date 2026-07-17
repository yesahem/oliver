# Plan 003 — Single AI Code Agent

> Implements: `specs/003-specs.md`
> Prerequisites: Plans 001–002 (workspace + running preview)
> Shared decisions: see `plans/000-foundations.md` — `@anthropic-ai/sdk`, model `claude-sonnet-5`, backend-only AI

## Objective

A user types a prompt in the chat panel; the backend sends the whole project + prompt to Claude, receives structured CREATE/UPDATE/DELETE file operations, applies them to the database, and the frontend syncs the changed files into the WebContainer so the preview updates. Single agent, no orchestration.

---

## Step 1 — Database: chat history (`packages/db`)

```prisma
model ChatMessage {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  role      String   // "user" | "assistant"
  content   String
  createdAt DateTime @default(now())

  @@index([projectId, createdAt])
}
```

Migration + regenerate client. Add `GET /projects/:id/messages` to the projects routes so the workspace can restore chat on reload.

## Step 2 — Backend AI module (`apps/backend/src/ai/`)

`bun add @anthropic-ai/sdk`; `ANTHROPIC_API_KEY` in `apps/backend/.env`.

```
src/ai/
  routes.ts        # POST /ai/generate
  context.ts       # MVP context: project name + full file tree + all file contents + last N chat messages
  prompt.ts        # system prompt + user message assembly
  generator.ts     # Anthropic client call (model constant, max_tokens, retry once on 5xx/timeout)
  parser.ts        # raw text -> FileOperation[]
  file-writer.ts   # apply operations to DB in a transaction
```

- **`POST /ai/generate`** body `{ projectId, prompt }`:
  1. Reject if a generation is already running for this project (in-memory `Set<projectId>` lock — spec: one active request per project).
  2. Persist the user `ChatMessage`.
  3. Build context (`context.ts`) — full project is acceptable for MVP; optimization is Spec 05.
  4. Call Claude (`generator.ts`), parse (`parser.ts`), apply (`file-writer.ts`).
  5. Persist an assistant `ChatMessage` (summary of operations, e.g. "Created 3 files, updated 2").
  6. Respond `{ success: true, operations: [...] }` with the applied operations **including new contents**, so the frontend can update without refetching the whole project.
  7. On any failure: release lock, no partial writes (transaction), respond `{ success: false, error }`.

- **System prompt** (`prompt.ts`) must demand machine-readable output — exact format:

  ```
  CREATE
  src/components/Navbar.tsx
  ---
  <full file contents>
  ===
  UPDATE
  src/App.tsx
  ---
  <full new contents>
  ===
  DELETE
  src/old.ts
  ===
  ```

  Rules stated in the prompt: full file contents (no diffs/ellipses), no markdown fences, no prose outside the blocks, paths relative to project root, only these three operations. The template's stack (Vite/React/TS) is stated so generated code fits.

- **Parser** (`parser.ts`): split on the `===` delimiter, then per block read op + path + content after `---`. Ignore unrecognized ops. Returns `FileOperation { type, path, content? }[]`. Empty result → "invalid response" error, **no file modifications** (spec).

- **File writer** (`file-writer.ts`), single Prisma transaction:
  - CREATE: insert `File` row; auto-create missing ancestor folder rows (`parentId` chain) — reuse path helpers from Plan 001's `projects.service`.
  - UPDATE: replace `content`, bump `updatedAt`; if the path doesn't exist, treat as CREATE (LLMs confuse the two).
  - DELETE: remove row (+ children if a folder path).

  This module is deliberately self-contained — Plan 004 extracts and hardens it into the File Diff Engine.

## Step 3 — Frontend chat wiring (`apps/frontend`)

1. `hooks/use-ai.ts`: `generate(prompt)` → POST `/ai/generate`; states `idle | generating | error`.
2. `components/chat/chat-panel.tsx` (upgrade Plan 001 shell):
   - Load history from `GET /projects/:id/messages`.
   - Multi-line Textarea; **Enter sends, Shift+Enter newline**; Send button; input disabled while generating.
   - Generating state: "Thinking… / Generating code… / Updating files…" placeholder in the pending assistant message.
   - Failure: "Generation failed." + Retry (re-sends same prompt).
3. On success, apply the returned operations client-side:
   - update the Zustand `fileTree` (insert/update/remove nodes),
   - update `openedFiles` contents if an updated file is open (refresh Monaco model), close tabs for deleted files,
   - `syncFile` each CREATE/UPDATE into the WebContainer and remove DELETEd files (`fs.rm`) → Vite HMR refreshes the preview automatically.

## Step 4 — Error handling (per spec)

| Failure | Behavior |
|---|---|
| Claude API failure/timeout | one retry for transient errors, then "Unable to generate code." + Retry |
| Unparseable response | "AI returned an invalid response." — nothing written |
| DB write failure | transaction rollback → "Unable to save generated files." |
| Timeout | request-level timeout (~120 s) → "Generation timed out." + Retry |

---

## Acceptance checklist (from spec)

- [ ] Prompt entry with Enter-to-send; input disabled during generation
- [ ] Backend builds full-project context and calls Claude
- [ ] Claude returns structured file operations; parser handles CREATE/UPDATE/DELETE
- [ ] Operations persisted to DB transactionally; chat history stored
- [ ] Frontend updates tree/editor and syncs files into WebContainer
- [ ] Preview hot-reloads with the generated app ("Build a beautiful SaaS landing page" works end-to-end)
- [ ] All four failure modes surface correctly

## Out of scope (per spec)

Planner/orchestrator/multi-agent, task queues, OpenAPI generation, verification/auto-fix (Spec 07), context retrieval (Spec 05), project memory (Spec 08), streaming UX (Spec 06 — this plan may return a single JSON response).
