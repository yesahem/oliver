# Spec 10 — One-Click Deployment

> **Phase:** Day 11-15
> **Priority:** P1 (Product Delight)
> **Estimated Time:** 3-4 Days
> **Status:** Not Started

---

# Goal

Allow users to deploy their generated application with a single click.

Users should not have to clone repositories, configure build settings, or manually connect deployment providers.

The entire deployment experience should feel as simple as

```text
Click Deploy

↓

Wait

↓

Live URL
```

A deployed application is the final step that transforms generated code into a real product.

---

# Why This Exists

Generating code is satisfying.

Seeing a live URL is magical.

Most users judge an AI builder by one question:

> **"Can I use this app immediately?"**

One-click deployment removes the final barrier between building and shipping.

---

# MVP Scope

For the initial release, deployment will support **Vercel only**.

Since both the frontend (React/Vite) and backend (Node.js) are designed to be deployed on Vercel, supporting a single deployment platform keeps the implementation simple while providing a complete end-to-end experience.

Future providers (Railway, Fly.io, Cloudflare, Netlify, etc.) can be added later.

---

# High Level Flow

```text
User Clicks Deploy

↓

Validate Project

↓

Build Project

↓

Push Project to Vercel

↓

Wait for Deployment

↓

Deployment Successful

↓

Show Live URL
```

---

# Responsibilities

## apps/frontend

Responsible for

- Deploy button
- Deployment progress
- Deployment status
- Success screen
- Error screen
- Copy URL button
- Open Site button

---

## apps/backend

Responsible for

- Preparing deployment
- Packaging project
- Calling Vercel APIs
- Tracking deployment status
- Saving deployment metadata

---

# User Experience

Inside the workspace

```text
------------------------------------

Preview

------------------------------------

          [ Deploy ]

------------------------------------
```

Clicking Deploy immediately starts the deployment pipeline.

No additional configuration should be required for MVP.

---

# Deployment Flow

```text
Deploy

↓

Validate Project

↓

Ensure Build Passes

↓

Package Project

↓

Upload to Vercel

↓

Deployment Started

↓

Deployment Ready

↓

Live URL
```

---

# Build Validation

Before deploying

Automatically run

```bash
bun install
```

↓

```bash
bun run build
```

If the build fails

Do **not** deploy.

Instead trigger the existing

**Auto Build & Error Fix**

pipeline.

Only deploy once the project builds successfully.

---

# Deployment Progress

Display live deployment progress.

Example

```text
✓ Preparing Project

✓ Installing Dependencies

✓ Building Application

✓ Uploading to Vercel

● Waiting for Deployment

○ Live URL
```

---

# Successful Deployment

Display

```text
🚀 Deployment Successful

https://my-project.vercel.app

[ Open Site ]

[ Copy URL ]
```

The deployment URL should also be stored with the project.

---

# Failed Deployment

Example

```text
Deployment Failed

Reason

Build failed on Vercel.

[ Retry ]
```

Users should always receive a meaningful error.

---

# Deployment Metadata

Each project should store

```json
{
  "provider": "vercel",
  "status": "READY",
  "deploymentUrl": "https://my-project.vercel.app",
  "createdAt": "...",
  "lastDeployedAt": "..."
}
```

---

# Database

Suggested model

```text
Deployment

id

projectId

provider

status

deploymentUrl

createdAt

updatedAt
```

A project can have multiple deployments over time.

---

# Vercel Integration

Deployment should leverage the Vercel platform for both frontend and backend.

Supported project structure

```text
apps/

    frontend/

    backend/

packages/

    db/

    ui/
```

The deployment pipeline should correctly configure

- Frontend deployment
- Backend deployment
- Environment variables
- Monorepo support
- Build settings

The implementation details may evolve, but the user experience should remain a single-click deployment.

---

# Environment Variables

Before deployment

Ensure required environment variables exist.

Examples

```text
DATABASE_URL

OPENAI_API_KEY

CLERK_SECRET_KEY

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

If required variables are missing

Display

```text
Missing Environment Variables

Please configure

DATABASE_URL

before deploying.
```

Do not start deployment until validation passes.

---

# Deployment History

Future feature.

Each deployment should eventually be visible.

Example

```text
Deployment History

Production

Today

Ready

----------------

Production

Yesterday

Ready
```

Not required for MVP.

---

# Suggested Folder Structure

```text
apps/backend/

src/

    deployment/

        deploy.ts

        vercel.ts

        validator.ts

        status.ts

        logs.ts

apps/frontend/

components/

    deployment/

        deploy-button.tsx

        deployment-status.tsx

        deployment-success.tsx

        deployment-error.tsx
```

---

# Performance Goals

- Deployment should start immediately after clicking the button.
- Deployment progress should update continuously.
- Users should receive a live URL as soon as deployment completes.
- Build validation should happen automatically.
- Deployment should require no manual configuration for supported projects.

---

# Future Improvements (Not Part of MVP)

Do **NOT** build

- Railway deployment
- Fly.io deployment
- Netlify deployment
- Cloudflare deployment
- Docker deployment
- Kubernetes deployment
- Self-hosted deployment
- Preview deployments
- Branch deployments
- Custom domains
- Rollbacks
- Deployment analytics
- GitHub synchronization

The MVP focuses solely on Vercel.

---

# Out of Scope

- Multi-provider deployments
- CI/CD pipelines
- Automatic redeployments
- Git integration
- Team deployments
- Secrets management UI
- Infrastructure provisioning
- Database migration management

---

# Acceptance Criteria

The feature is considered complete when

- Every project has a visible Deploy button.
- Clicking Deploy starts the deployment process immediately.
- The project is validated before deployment.
- The project automatically builds using Bun.
- Failed builds trigger the Auto Build & Error Fix pipeline.
- Successful builds are deployed to Vercel.
- Users receive a live deployment URL.
- Deployment metadata is stored with the project.
- Deployment failures show meaningful error messages.

---

# Definition of Done

A user builds an application and clicks

```text
Deploy
```

The platform automatically

1. Validates the project.
2. Runs `bun install`.
3. Runs `bun run build`.
4. Repairs build errors if necessary.
5. Deploys the application to Vercel.
6. Waits for deployment completion.
7. Displays a live production URL.

From the user's perspective, shipping an application is reduced to a single click, making the journey from idea to production feel seamless and effortless.