# Plan 009 — Incremental Editing

> Implements: `specs/009-specs.md`
> Prerequisites: Plans 003–008 (this is the integration milestone — nearly everything it needs already exists)
> Shared decisions: see `plans/000-foundations.md`

## Objective

Turn the generator into an *editor*: follow-up prompts ("make the navbar blue") modify only the relevant files of the existing app, preserving structure and style. This plan is mostly a unification + prompt-engineering pass over the pipeline built in Plans 003–008, plus a regression checklist proving small edits stay small.

---

## Step 1 — One unified pipeline

Consolidate the generation flow (whether first prompt or 50th) into a single explicit sequence in `apps/backend/src/ai/generator.ts` (or an `ai/edit/edit.ts` orchestrator if generator.ts has grown messy):

```
lock project → save user message → load memory (008) → build context (005)
→ Claude (003) → parse/validate/apply diff (004) → auto build & repair (007)
→ update memory (008) → COMPLETE with operations (006) → unlock
```

There must be no separate "initial generation" vs "edit" code path — the context builder + memory make every request incremental by construction. Delete any remaining full-project context fallback.

## Step 2 — System prompt: editing principles

Extend `ai/prompt.ts` with an explicit editing contract (the spec's principles, stated imperatively):

- Modify **only** the files required by the request; smallest possible change.
- Never rewrite working code, reorganize folders, or rename things unless explicitly asked.
- Match the project's existing components, naming conventions, styling approach, and architecture (memory + included files show these).
- Prefer UPDATE over CREATE-replacements; never regenerate the whole app.
- Full file contents still required for changed files (diff-engine contract unchanged).

## Step 3 — Frontend edit ergonomics

Already largely in place from Plans 004/006; verify and close gaps:

- UPDATE on an open file refreshes the Monaco model **without stealing focus or losing scroll** if the user is viewing another tab.
- DELETE closes tabs; CREATE reveals the new file in the explorer (expand parents, brief highlight).
- Conversational feel: timeline messages already cover "Understanding request… / Updating layout… / Preview Ready 🚀".

## Step 4 — Regression checklist (the actual acceptance work)

Run against a freshly generated landing page project; record file-op counts per prompt:

| Prompt | Expectation |
|---|---|
| "Make the navbar blue" | 1 file (Navbar component) |
| "Add dark mode" | few files (theme/config/entry), no page rewrites |
| "Add a settings page" | new page + route wiring only |
| "Fix the TypeScript error" (seed one) | only the offending file(s) |
| "Rename Hero to Banner" | the component + its importers only |
| "Improve the landing page" | edits existing sections, doesn't regenerate the app |

Failures here are fixed by iterating on the Step 2 prompt and on Plan 005 context relevance (e.g. ensuring the Navbar file lands in context for prompt 1) — not by new machinery. Keep this table in the repo (e.g. `plans/009-regression.md` or a checklist in the PR) since it's re-run whenever prompts change.

## Step 5 — Auto-build tie-in

Every incremental edit already flows through Plan 007 (install-if-needed → build → repair ≤3). Verify `bun install` is actually skipped when `package.json` didn't change (the operation list tells us) so small edits stay fast — spec goal: edits feel *faster* than initial generation.

---

## Acceptance checklist (from spec)

- [ ] Natural-language modifications work on an existing project across the spec's example prompts
- [ ] Only relevant files change; existing code/structure/style preserved
- [ ] Memory + context builder + diff engine + auto-build are all in the single pipeline
- [ ] Open Monaco tabs refresh correctly on UPDATE; preview hot-reloads after each edit
- [ ] Regression table passes with expected file-op counts

## Out of scope (per spec)

AST/semantic patching, planner/multi-agent editing, git patches, undo history, branching, framework migration.
