# Plan 002 — WebContainer & Live Preview

> Implements: `specs/002-specs.md`
> Prerequisites: Plan 001 (workspace, file tree, Monaco, preview panel shell)
> Shared decisions: see `plans/000-foundations.md` — especially correction #1 (npm inside the container, not Bun) and #2 (COOP/COEP)

## Objective

Opening a project boots a WebContainer in the browser, mounts the DB file tree, installs dependencies, starts the Vite dev server, and shows the running app in the preview iframe. Edits in Monaco sync the single changed file into the container and hot-reload the preview.

---

## Step 1 — Enable cross-origin isolation

WebContainers require `crossOriginIsolated === true`:

- In `apps/frontend/next.config.ts`, add headers for the workspace route (or globally):
  - `Cross-Origin-Embedder-Policy: require-corp`
  - `Cross-Origin-Opener-Policy: same-origin`
- Verify `window.crossOriginIsolated` in dev; the preview iframe itself is served from WebContainer's own origin and needs no extra headers, but any third-party assets loaded by the *platform* pages must be CORP-compatible.

## Step 2 — WebContainer library (`apps/frontend/lib/webcontainer/`)

`bun add @webcontainer/api` (platform repo installs with Bun; **inside** the container we run npm — spec correction #1).

```
lib/webcontainer/
  boot.ts      # module-level singleton: boot once per tab, reuse across project opens; teardown on project switch
  mount.ts     # FileNode tree (Plan 001 types) -> FileSystemTree; folders -> directory, files -> file.contents
  install.ts   # spawn("npm", ["install"]) — stream output via process.output reader
  run.ts       # spawn("npm", ["run", "dev"]) — stream output; resolve on "server-ready"
  preview.ts   # webcontainer.on("server-ready", (port, url) => ...) -> preview URL
  sync.ts      # writeFile(path, content) for a single changed file; mkdir -p parents if needed
```

Key behaviors:
- **Boot once**: `boot.ts` keeps a promise-cached instance; concurrent callers await the same boot. Booting twice in one tab throws in the API — guard it.
- **Mount**: build the `FileSystemTree` from the store's `fileTree` (Plan 001 already loads full contents with `GET /projects/:id`).
- **Logs**: both `install.ts` and `run.ts` pipe process output lines to a callback so the UI can render them.
- Exit-code checks: nonzero `npm install` exit → Installing failed state.

## Step 3 — Runtime state & hook

1. Extend the Zustand store (or add `stores/runtime.ts`):
   `runtimeStatus: "idle" | "booting" | "installing" | "starting" | "ready" | "error"`, `previewUrl`, `logs: string[]`, `error`.
2. `hooks/use-webcontainer.ts` orchestrates the lifecycle on workspace mount:
   `boot → mount → install → run dev → capture URL`, advancing `runtimeStatus` at each stage, appending logs, catching failures into `error` with the failing stage. Exposes `retry()` (full restart) and `syncFile(path, content)`.

## Step 4 — Preview panel UI (`components/preview/`)

Replace the Plan 001 placeholder:

- `preview-panel.tsx` renders by `runtimeStatus`:
  - booting → "Starting Runtime…", installing → "Installing Dependencies…", starting → "Starting Development Server…" (skeleton/spinner)
  - ready → `<iframe src={previewUrl}>` (sandbox/allow attributes for scripts, forms)
  - error → message per failing stage ("Unable to start runtime." / "Dependency installation failed." / "Unable to start development server." / "Preview unavailable.") + **Retry** button + logs
- `runtime-status.tsx` — small indicator in the navbar: 🟡 Booting / 🟡 Installing / 🟢 Running / 🔴 Failed.
- Optional `console-panel.tsx` — collapsible ScrollArea tailing `logs` (auto-scroll to bottom).

## Step 5 — File sync from Monaco

- On editor change, debounce (~300 ms) then call `syncFile(file.path, content)` → `webcontainer.fs.writeFile`. Vite HMR picks it up; no remount, no reinstall.
- Sync on **change**, not on save — the spec requires instant preview updates while the DB save (Plan 001 Cmd+S) stays explicit.
- Only the modified file is written; never re-mount the tree after initial load.

## Step 6 — Performance guards (spec goals)

- Singleton boot; ignore duplicate workspace mounts (React strict-mode double-effect guard).
- `npm install` runs only after first mount or on retry — file syncs never trigger reinstall.
- Full remount only on explicit retry.

---

## Acceptance checklist (from spec)

- [ ] Opening a project boots a WebContainer (once)
- [ ] DB file tree mounted with correct hierarchy/contents
- [ ] Dependencies install with streamed logs
- [ ] Vite dev server starts automatically; `server-ready` URL captured
- [ ] Preview iframe shows the running seeded app
- [ ] Editing `src/App.tsx` in Monaco updates the container FS and HMR refreshes the preview without manual reload
- [ ] Boot/install/server/preview failures each show their message + retry

## Out of scope (per spec)

AI generation, chat integration, terminal emulator, PGlite/database runtime, multiple containers, runtime snapshots, diff engine.
