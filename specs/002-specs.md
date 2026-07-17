# Spec 02 — WebContainer & Live Preview

> **Phase:** Day 1-2
> **Priority:** P0 (Highest)
> **Estimated Time:** 1-2 Days
> **Status:** Not Started

---

# Goal

Build the runtime environment for every generated project.

The WebContainer will be responsible for running the generated application entirely inside the browser, allowing users to instantly preview changes without requiring local setup.

By the end of this milestone, the platform should be capable of:

- Booting a WebContainer
- Mounting the project files
- Installing project dependencies
- Running the development server
- Displaying the application inside the preview panel
- Automatically reflecting file changes in real-time

No AI generation is required in this phase.

---

# Existing Architecture

```text
apps/
│
├── frontend/
│
└── backend/

packages/
│
├── db/
│
└── ui/
```

The WebContainer integration will live inside **apps/frontend**.

The backend is **not** responsible for running the preview.

The preview should run completely inside the user's browser.

---

# Responsibilities

## apps/frontend

Responsible for

- WebContainer initialization
- File mounting
- Dependency installation
- Running the dev server
- Preview iframe
- File synchronization
- Hot Reload

---

## apps/backend

No runtime responsibility in this phase.

Backend is only responsible for storing projects.

---

# Runtime Flow

```text
Open Project

↓

Boot WebContainer

↓

Mount Project Files

↓

Install Dependencies

↓

Run Dev Server

↓

Capture Preview URL

↓

Load Preview iframe

↓

Watch File Changes

↓

Sync Updated File

↓

Hot Reload
```

---

# Features

## 1. Boot WebContainer

Initialize a new WebContainer instance whenever a workspace is opened.

Requirements

- Boot only once per project
- Store WebContainer instance
- Prevent duplicate boots
- Handle initialization errors gracefully

---

## 2. Mount Project Files

Mount the complete project file tree into the WebContainer filesystem.

Requirements

- Preserve folder hierarchy
- Preserve filenames
- Preserve file contents
- Support nested folders

Every file stored in the database should exist inside the WebContainer.

---

## 3. Install Dependencies

Automatically install project dependencies after mounting.

Requirements

- Execute using Bun
- Stream installation logs
- Display installation progress
- Handle installation failures

Example

```bash
bun install
```

---

## 4. Run Development Server

Start the frontend development server automatically.

Requirements

- Execute

```bash
bun run dev
```

- Detect server ready event
- Capture generated localhost URL
- Expose preview URL

---

## 5. Live Preview

Display the running application inside the Preview Panel.

Requirements

- Use iframe
- Automatically load generated preview URL
- Display loading state while booting
- Display error state if startup fails

---

## 6. File Synchronization

Whenever a file changes inside Monaco,

the updated file should immediately be written into the WebContainer filesystem.

Requirements

- Detect editor changes
- Write updated file
- Preserve folder structure
- Avoid remounting the entire project

Only the modified file should be updated.

---

## 7. Hot Reload

After syncing a file,

the running Vite server should automatically reload.

No manual refresh should ever be required.

Requirements

- Instant updates
- No restart
- No dependency reinstall

---

# UI Components

## Preview Panel

States

### Booting

```text
Starting Runtime...
```

---

### Installing

```text
Installing Dependencies...
```

---

### Starting

```text
Starting Development Server...
```

---

### Ready

Render iframe.

---

### Error

Display

- Error message
- Retry button

---

## Runtime Status Indicator

Display current runtime state.

Examples

```text
🟡 Booting

🟡 Installing

🟢 Running

🔴 Failed
```

---

## Console Panel (Optional)

Display runtime logs.

Examples

```text
Booting...

Installing...

Server Started

Compiled Successfully

Hot Reload
```

This can be a simple scrollable log window.

---

# Suggested Folder Structure

```text
apps/frontend/

components/

    preview/

    runtime/

hooks/

    use-webcontainer.ts

lib/

    webcontainer/

        boot.ts

        install.ts

        mount.ts

        run.ts

        sync.ts

        preview.ts

types/
```

---

# Runtime State

Suggested state

```text
webcontainer

runtimeStatus

previewUrl

installLogs

serverLogs

isInstalling

isRunning

isBooted
```

---

# Runtime Lifecycle

```text
Workspace Opens

↓

Boot Container

↓

Mount Files

↓

bun install

↓

bun run dev

↓

Server Ready

↓

Load iframe

↓

Watch File Changes

↓

Write Updated File

↓

Vite HMR

↓

Preview Updated
```

---

# Error Handling

Handle the following scenarios gracefully.

## WebContainer Boot Failure

Display

```text
Unable to start runtime.
```

Allow retry.

---

## Dependency Installation Failure

Display

```text
Dependency installation failed.
```

Show installation logs.

---

## Dev Server Failure

Display

```text
Unable to start development server.
```

Provide restart button.

---

## Preview Failure

Display

```text
Preview unavailable.
```

Allow refresh.

---

# Performance Goals

- Boot WebContainer only once.
- Never reinstall dependencies unless required.
- Never remount the full filesystem after initial load.
- Sync only changed files.
- Keep preview responsive.

---

# Out of Scope

Do **NOT** build any of the following in this phase.

- AI code generation
- Chat integration
- Multi-project runtime management
- Terminal emulator
- Database runtime
- PGlite
- Docker
- Deployment
- Background workers
- Multiple WebContainers
- Runtime snapshots
- File diff engine

---

# Acceptance Criteria

The feature is considered complete when:

- Opening a project boots a WebContainer.
- The project files are mounted correctly.
- Dependencies install successfully.
- The Vite development server starts automatically.
- The preview iframe loads successfully.
- Editing a file updates the WebContainer filesystem.
- Vite Hot Module Reload refreshes automatically.
- Runtime errors are surfaced to the user.

---

# Definition of Done

A user can:

1. Open a project.
2. Watch the runtime boot automatically.
3. See the application running inside the preview panel.
4. Edit `App.tsx` inside Monaco.
5. Watch the preview update instantly without manually refreshing.

This milestone establishes the live development environment that all future AI-generated applications will run inside.