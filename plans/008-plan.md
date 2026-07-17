# Plan 008 — Project Memory

> Implements: `specs/008-specs.md`
> Prerequisites: Plans 003–005 (generation + context builder); integrates with Plan 007's repair prompt
> Shared decisions: see `plans/000-foundations.md`

## Objective

Each project carries a small JSON memory (stack facts + 50–150-word summary) that is injected into every AI prompt in place of long chat history, and is refreshed after every successful generation.

---

## Step 1 — Schema (`packages/db`)

```prisma
model Project {
  // ...existing fields
  memory Json @default("{}")
}
```

Migration + regenerate. Memory shape (typed in `apps/backend/src/ai/memory/types.ts`, not enforced by the DB):

```ts
interface ProjectMemory {
  framework: string; runtime: string; language: string; packageManager: string;
  ui: string; styling: string; database: string; orm: string; auth: string;
  theme: string; summary: string;
}
```

## Step 2 — Memory module (`apps/backend/src/ai/memory/`)

```
src/ai/memory/
  types.ts           # ProjectMemory + defaults
  create-memory.ts   # initial memory derived from the seeded template
  read-memory.ts     # load + merge with defaults (missing fields -> "")
  update-memory.ts   # post-generation refresh via a small Claude call
  prompt-memory.ts   # render memory as a compact prompt block
```

- **Creation**: `POST /projects` (Plan 001 service) now initializes memory from the template's known facts: `{ framework: "React", runtime: "Vite", language: "TypeScript", packageManager: "npm", styling: "Tailwind CSS", theme: "Dark", summary: "" }` (values must match whatever the template actually ships).
- **Update** (`update-memory.ts`): after a *successful* generation (and, when Plan 007 is active, a passing/escalated-but-applied build), make one small Claude call (same model, low max_tokens) with: current memory + the user prompt + the applied operation list (paths + op types only, not full contents). It returns the updated JSON; validate/parse (zod), clamp `summary` to ~150 words, then persist. On any failure of this call: log and keep the old memory — memory updates must never fail the generation.
- **Never update** when generation, parsing, or DB writes failed (spec): call sites are only on the success path of the pipeline.

## Step 3 — Prompt integration

- `context/project-summary.ts` (Plan 005 placeholder) is replaced by memory: `build-context.ts` loads `ProjectMemory` and the prompt renders it **before the files**, in the spec's order: system → **project memory** → recent chat → relevant files → user prompt (the Plan 005 ordering keeps package.json/current-file placement; memory takes the "project summary" slot).
- Plan 007's `repair-prompt.ts` includes the same rendered memory block.
- With memory in place, chat context stays at the last 5 messages permanently — memory is the long-term carrier (spec's core point).

## Step 4 — Performance guards (spec goals)

- Memory read is part of the normal project query (no extra round trip) — well under 20 ms.
- Enforce ≤2 KB serialized: if the update pushes past it, re-clamp the summary.
- The memory-update Claude call runs after the response stream COMPLETE (fire-and-forget with logging) so it never adds user-visible latency.

---

## Acceptance checklist (from spec)

- [ ] Every project gets a memory object at creation, stored as JSON in the DB
- [ ] Memory updates after successful generations only ("Add Clerk auth" → `auth: "Clerk"`; "Switch to Supabase" → replaced)
- [ ] Every AI request (generate + repair) includes memory before the project files
- [ ] Full chat history is no longer needed for long-term context (last 5 messages remain the only chat sent)
- [ ] Memory stays ≤2 KB, summary 50–150 words

## Out of scope (per spec)

Embedding/vector memory, file-level summaries, knowledge graphs, coding-style memory, frontend memory editing (display-only UI is a future item).
