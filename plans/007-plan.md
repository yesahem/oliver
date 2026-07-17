# Plan 007 — Auto Build & Error Fix

> Implements: `specs/007-specs.md`
> Prerequisites: Plans 003–006 (generation, diff engine, context builder, streaming)
> Shared decisions: see `plans/000-foundations.md` — especially correction #3 (build runs **server-side** in a scratch dir with allowlisted commands)

## Objective

After every AI generation, the backend builds the generated project; on failure it sends only the errors + modified files back to Claude, applies the fixes via the diff engine, and rebuilds — up to 3 attempts — before the user ever sees the result. Progress streams through the Plan 006 timeline.

---

## Where the build runs (decision)

The generated app lives in the browser's WebContainer, but the spec makes the **backend** own the build pipeline. Resolution (foundations correction #3): the backend materializes the project's `File` rows into a scratch directory and runs the build there with real Bun. This keeps repair server-side (where Claude access lives), works headlessly, and honors ARCHITECTURE.md §11: **only allowlisted commands** (`bun install`, `bun run build`), no arbitrary shell, per-command timeouts, scratch dir deleted afterwards.

## Step 1 — Repair module (`apps/backend/src/ai/repair/`)

```
src/ai/repair/
  workspace.ts      # materialize File rows -> temp dir (os.tmpdir()/oliver-build-<id>); cleanup
  build.ts          # run allowlisted commands via Bun.spawn with timeout (~120s) + captured stdout/stderr
  error-parser.ts   # extract actionable errors from tsc/vite output
  repair-prompt.ts  # build the fix request (errors + modified files + relevant files + memory)
  retry.ts          # the verify->fix->verify loop, max 3 attempts
  logs.ts           # persist per-generation build/repair logs
```

- `workspace.ts` caches `node_modules` per project between attempts (keyed by `package.json` hash) so retries don't reinstall — attempt 2/3 skip `bun install` when the hash is unchanged.
- `error-parser.ts`: parse TypeScript diagnostics (`file(line,col): error TSxxxx: message`) and Vite/rollup build errors (missing import/export, unresolved module, syntax). **Errors only** — warnings and lint output are discarded (spec). Dedupe, cap at ~30, group by file.
- `repair-prompt.ts` includes only: parsed errors, files modified in this generation (from the Plan 004 operation list), files named in the errors, project memory (Plan 008 once it exists; summary until then), and the instruction *"Fix the project without changing unrelated code."* Never the full repository. Response format = the same CREATE/UPDATE/DELETE contract; **reuse `ai/diff/` end-to-end, no new parser** (spec).

## Step 2 — The loop (`retry.ts`)

```
applyOperations (from generation)
└─ for attempt in 1..3:
     materialize -> [bun install if needed] -> bun run build
     ├─ exit 0  -> success: emit events, cleanup, return
     └─ exit ≠0 -> parse errors
                   emit STEP "Build failed — fixing errors (attempt N)..."
                   Claude repair call -> diff engine apply (DB) -> continue
after 3 failures -> stop hard, mark generation failed, keep logs
```

- Hook into the generation pipeline right after diff-apply (Plan 004) and before COMPLETE: COMPLETE is only emitted once the build passes (or with a `buildFailed` flag after escalation so the frontend can still show the code).
- Fix operations flow through the normal apply path, so the frontend receives them on COMPLETE and syncs the WebContainer identically to normal edits.
- The in-memory per-project generation lock (Plan 003) covers the whole loop.

## Step 3 — Streaming & UI integration

New timeline steps via Plan 006 events: "Installing dependencies..." → "Building project..." → (on failure) "⚠ Build failed" → "Fixing errors..." → "Rebuilding..." → "🚀 Build successful".

After 3 failed attempts the chat shows the spec's escalation message ("The AI attempted 3 fixes but the project still does not compile.") with **Retry** and **View build logs** (a Dialog/Sheet rendering the stored logs).

## Step 4 — Log persistence (`logs.ts`)

Add a `BuildLog` model (projectId, attempt, command, stdout/stderr excerpt, errorSummary, success, createdAt) or a JSON column on ChatMessage — prefer the dedicated model; migration in `packages/db`. Exposed via `GET /projects/:id/build-logs?latest=1` for the logs dialog.

---

## Acceptance checklist (from spec)

- [ ] Every generation automatically triggers install + build (Bun, server-side)
- [ ] Build errors are captured and parsed (errors only, no warnings)
- [ ] Repair prompt contains only errors + modified/relevant files + memory — never the full repo
- [ ] Fixes come back as CREATE/UPDATE/DELETE and reuse the diff engine unchanged
- [ ] Loop stops after 3 attempts with a clear escalation message + logs + retry
- [ ] Successful builds update the preview automatically; retries skip reinstall when deps unchanged

## Out of scope (per spec)

Unit/E2E tests, Playwright, visual regression, multi-agent verification, runtime-exception repair, parallel repair strategies.
