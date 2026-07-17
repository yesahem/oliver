# Plan 005 — Prompt Context Builder

> Implements: `specs/005-specs.md`
> Prerequisites: Plans 003–004 (generation pipeline + chat history)
> Shared decisions: see `plans/000-foundations.md`

## Objective

Replace Plan 003's "send the whole project" context with a scoped builder that assembles only: current file, its direct imports (1 level), last 5 edited files, last 5 chat messages, `package.json`, and a project summary — in a fixed order. Never the full repository.

---

## Step 1 — Frontend sends editor state

Extend `POST /ai/generate` body: `{ projectId, prompt, currentFilePath? }`. The chat panel reads `selectedFile` from the Zustand store and includes its path. No other AI logic in the frontend.

## Step 2 — Context module (`apps/backend/src/ai/context/`)

Replace `ai/context.ts` with:

```
src/ai/context/
  build-context.ts     # orchestrates sources -> PromptContext
  current-file.ts      # load File row by path
  imports.ts           # parse import statements from current file, resolve 1 level
  edited-files.ts      # top 5 by updatedAt desc (excluding folders + already-included files)
  recent-chat.ts       # last 5 ChatMessages, chronological
  package-json.ts      # project's package.json File row
  project-summary.ts   # summary string (placeholder until Spec 08; empty is fine)
```

`PromptContext` interface exactly as the spec suggests (`projectSummary`, `packageJson`, `currentFile`, `importedFiles`, `editedFiles`, `recentChat`, `userPrompt`).

### Import resolution (`imports.ts`) — deliberately simple, no AST

- Regex over the current file: `import … from "<specifier>"` and `export … from "<specifier>"`.
- Resolve only project-relative specifiers: `./`, `../` (relative to the current file's dir) and the template's `@/` alias → `src/`. Bare package imports are skipped.
- Try extensions in order: exact, `.tsx`, `.ts`, `/index.tsx`, `/index.ts`.
- **One level deep only** — do not recurse into imports of imports.
- Missing resolution → skip silently (spec: never fail the request).

### Assembly rules (`build-context.ts`)

- **Dedupe**: a file appears once, priority order current > imported > edited.
- **Every source is optional**: missing current file / imports / chat / summary → continue with what exists (spec's error-handling table).
- Prompt assembly order is fixed (spec): system → project summary → package.json → current file → imported files → recently edited files → recent chat → user prompt. Update `ai/prompt.ts` to render `PromptContext` in exactly this order, each file as `path` + fenced contents.

## Step 3 — Pipeline integration

- `generator.ts` consumes the new builder; the full-project path is deleted (spec: *never* send the full repository).
- Keep a `MAX_CONTEXT_FILES`-style guard and per-file size cap (truncate enormous files with a marker) so pathological projects can't blow the prompt.
- Log per-request context stats (files included, approx tokens) via the existing request logging — this is the metric this spec exists to improve.

## Step 4 — Tests

- `imports.ts`: relative/alias resolution, extension fallbacks, bare-import skipping, missing-file skip.
- `build-context.ts`: dedupe priority, limits (≤5 edited, ≤5 chat), graceful behavior with no current file (chat-only prompt still works — e.g. "add a pricing page" with nothing open must still generate sensibly).

---

## Acceptance checklist (from spec)

- [ ] Every prompt builds a `PromptContext` object
- [ ] Current open file included when provided
- [ ] Direct imports (1 level) resolved and included
- [ ] Last 5 edited files included
- [ ] Last 5 chat messages included
- [ ] `package.json` + project summary always included
- [ ] Final Claude prompt contains only these pieces, in the fixed order
- [ ] Context builds fast (<200 ms target — simple DB queries, no AI calls)

## Out of scope (per spec)

AST parsing, embeddings/pgvector/RAG, recursive dependency graphs, relevance scoring, file summaries. (These are the ARCHITECTURE.md Context/Retrieval Agent's future territory.)
