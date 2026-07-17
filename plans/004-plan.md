# Plan 004 — File Diff Engine

> Implements: `specs/004-specs.md`
> Prerequisites: Plan 003 (first working parser/writer to extract from)
> Shared decisions: see `plans/000-foundations.md`

## Objective

Harden Plan 003's inline parse/apply logic into a standalone, validated, transactional File Diff Engine that every AI feature (generation, repair, incremental edits) reuses. Only changed files are ever written or synced; the frontend applies operation lists incrementally instead of refetching.

---

## Step 1 — Extract the engine (`apps/backend/src/ai/diff/`)

```
src/ai/diff/
  types.ts       # FileOperation = { type: "CREATE" | "UPDATE" | "DELETE", path: string, content?: string }
  parser.ts      # moved from ai/parser.ts — raw Claude text -> FileOperation[]
  validator.ts   # operation-level validation against the project's current files
  apply.ts       # moved/hardened from ai/file-writer.ts — transactional DB apply
  index.ts       # applyAiResponse(projectId, rawText) -> AppliedOperation[]
```

Delete `ai/parser.ts` / `ai/file-writer.ts`; `generator` pipeline now calls `diff/index.ts`.

## Step 2 — Validation rules (`validator.ts`)

Run before any write; reject the *operation* (and surface it) rather than silently corrupting state:

- **Path safety**: relative paths only; normalize and reject `..` traversal, absolute paths, empty segments, `\` separators.
- **CREATE**: content required. If path already exists → downgrade to UPDATE (log it).
- **UPDATE**: content required. If path missing → upgrade to CREATE (log it). (LLMs routinely confuse these; auto-correcting beats failing the whole generation.)
- **DELETE**: if path missing → skip as no-op.
- **Unknown operation types**: ignore (per spec).
- **Duplicate paths in one response**: last operation wins; earlier ones dropped with a log.
- Batch-level sanity cap (e.g. >200 operations → reject response as invalid).

## Step 3 — Transactional apply (`apply.ts`)

Single `prisma.$transaction` for the whole batch (spec: rollback partial writes):

- CREATE: insert with auto-creation of missing ancestor folders (walk the path, reuse Plan 001 tree helpers); set `name`, `path`, `parentId`.
- UPDATE: replace content, bump `updatedAt` (this timestamp powers Spec 05's "recently edited files").
- DELETE: delete row; if it's a folder, delete the subtree.
- Return `AppliedOperation[]` — the final op list *after* validation adjustments, with contents — for the API response.

## Step 4 — API contract & frontend incremental apply

`POST /ai/generate` response becomes:

```json
{ "success": true, "operations": [ { "type": "UPDATE", "path": "src/App.tsx", "fileId": "…", "content": "…" } ] }
```

Frontend (extends Plan 003 Step 3 into a reusable helper `lib/apply-operations.ts`):

- **CREATE** → insert node into the Zustand tree (creating folder nodes as needed), sync into WebContainer.
- **UPDATE** → update tree node + refresh Monaco model if the file is open, `syncFile` to container.
- **DELETE** → remove node, **close the editor tab if open** (spec), `fs.rm` in container.

The frontend never diffs or decides what changed — it only replays the backend's operation list (spec: "the frontend should never determine what changed").

## Step 5 — Tests

`bun test` in `apps/backend` for the pure parts:

- `parser`: happy path (all three ops), missing delimiters, prose contamination, empty response, markdown-fenced response.
- `validator`: traversal rejection, CREATE↔UPDATE auto-correction, duplicate paths, unknown ops.
- `apply`: folder auto-creation chain, subtree delete (against a test DB or mocked prisma).

---

## Acceptance checklist (from spec)

- [ ] CREATE creates files (with folder auto-creation), persists, mounts to WebContainer, refreshes sidebar
- [ ] UPDATE replaces contents, bumps timestamps, refreshes Monaco if open, syncs container
- [ ] DELETE removes from DB/tree/container and closes open editor tabs
- [ ] Invalid paths and malformed responses never mutate state
- [ ] All apply operations are atomic (single transaction)
- [ ] Only changed files are written/synced — no full-project replacement anywhere

## Out of scope

Line-level/AST diffs, git patches, merge conflict handling, undo history (future specs), context optimization (Spec 05).
