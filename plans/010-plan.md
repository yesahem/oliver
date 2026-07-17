# Plan 010 — One-Click Deployment

> Implements: `specs/010-specs.md`
> Prerequisites: Plan 007 (build validation reuse); Plans 001–004 for project/file plumbing
> Shared decisions: see `plans/000-foundations.md`

## Objective

A Deploy button in the workspace ships the generated app to Vercel and returns a live URL, with streamed progress, stored deployment metadata, and no user configuration. Vercel only for MVP.

---

## Deployment approach (decision)

Use the **Vercel REST API with inline files** (`POST /v13/deployments` with the `files` array): the backend already holds every project file in Postgres, so no git repo, no CLI, no packaging step — serialize `File` rows into the request. The generated app is a Vite SPA (single Vercel project, static build output via Vercel's `vite` framework preset). Auth via a platform-level `VERCEL_TOKEN` in `apps/backend/.env`. (Spec's env-var and monorepo language is honored at the validation layer; generated apps are single-package Vite projects for MVP.)

## Step 1 — Schema (`packages/db`)

```prisma
model Deployment {
  id            String   @id @default(uuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  provider      String   @default("vercel")
  status        String   // QUEUED | BUILDING | READY | ERROR
  deploymentUrl String?
  error         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([projectId, createdAt])
}
```

A project keeps its history (multiple rows); latest row drives the UI.

## Step 2 — Backend module (`apps/backend/src/deployment/`)

```
src/deployment/
  routes.ts      # POST /projects/:id/deploy  |  GET /projects/:id/deployments/latest
  validator.ts   # pre-flight: required env vars present, project non-empty, package.json exists
  deploy.ts      # orchestrator: validate -> build check -> create deployment -> poll -> persist
  vercel.ts      # Vercel API client: createDeployment(files, name), getDeployment(id)
  status.ts      # poll loop (2s interval, ~5min cap) mapping Vercel states -> our status enum
  logs.ts        # persist failure reasons / Vercel build log excerpt
```

Flow for `POST /projects/:id/deploy` (SSE stream, reusing Plan 006's `sse.ts` helpers and event shape):

1. **Validate** (`validator.ts`): required env vars for the project's stack — derived from project memory (e.g. `auth: "Clerk"` → Clerk keys). Missing → emit ERROR "Missing Environment Variables: …" and stop before anything else. (MVP: platform-configured values; a per-project env UI is out of scope.)
2. **Build check**: reuse Plan 007's `workspace.ts` + `build.ts` + repair loop — a red build triggers auto-repair; only a green build proceeds (spec: never deploy a failing build).
3. **Create deployment** (`vercel.ts`): inline files (path + content, sha/size per API), project name derived from the oliver project name (slugified, stable across redeploys so the Vercel project is reused), framework preset `vite`.
4. **Poll** (`status.ts`) until `READY`/`ERROR`; emit STEP events along the way ("Uploading to Vercel…", "Waiting for deployment…").
5. **Persist** the `Deployment` row (status, URL, error) and emit COMPLETE with `{ deploymentUrl }`.

Concurrency: one active deployment per project (same lock pattern as generation).

## Step 3 — Frontend (`apps/frontend/components/deployment/`)

```
deploy-button.tsx       # navbar/preview-area button; disabled while deploying or generating
deployment-status.tsx   # Plan 006 progress timeline reused with deploy steps
deployment-success.tsx  # "🚀 Deployment Successful" + URL + [Open Site] [Copy URL]
deployment-error.tsx    # reason + [Retry]
use-deploy.ts (hooks/)  # stream consumption, mirrors use-generation-stream
```

- Success state shown in a Dialog (and the URL badge persists in the navbar via `GET /projects/:id/deployments/latest`).
- Timeline steps per spec: Preparing Project → Installing Dependencies → Building Application → Uploading to Vercel → Waiting for Deployment → Live URL.
- Failure shows the meaningful reason ("Build failed on Vercel.") + Retry.

---

## Acceptance checklist (from spec)

- [ ] Deploy button visible in every project workspace; click starts immediately, zero config
- [ ] Pre-deploy validation (env vars, project sanity) blocks bad deploys with a clear message
- [ ] Build validation runs via Bun and routes failures through the Plan 007 repair loop first
- [ ] Successful builds deploy to Vercel; live URL displayed with Open/Copy
- [ ] Deployment metadata (provider/status/url/timestamps) stored per project
- [ ] Failures show meaningful errors with retry

## Out of scope (per spec)

Other providers, custom domains, rollbacks, preview/branch deployments, GitHub sync, CI/CD, secrets-management UI, DB migration management.
