# Spec 01 — Project Workspace

> **Phase:** Day 1
> **Priority:** P0 (Highest)
> **Estimated Time:** 1 Day
> **Status:** Not Started

---

# Development Rules

These rules apply to every feature built in this project.

## Package Manager

- Use **Bun** exclusively.
- Never use `npm`.
- Never use `pnpm`.
- Never use `yarn`.

All dependencies should be installed using:

```bash
bun add <package>
```

Development dependencies:

```bash
bun add -d <package>
```

Running scripts:

```bash
bun run <script>
```

---

## UI Library

Use **shadcn/ui** as the primary component library.

Requirements:

- Prefer shadcn/ui components over building custom ones.
- Shared components should live inside `packages/ui`.
- The frontend should consume components from `packages/ui`.
- Extend shadcn components when necessary instead of rewriting them.
- Maintain a consistent design system across the application.

Use components such as:

- Button
- Card
- Input
- Textarea
- Dialog
- Dropdown Menu
- Sheet
- Scroll Area
- Tabs
- Separator
- Tooltip
- Avatar
- Skeleton
- Badge
- Alert Dialog
- Context Menu
- Command
- Popover

---



## Styling

- Tailwind CSS
- shadcn/ui
- CSS Variables for theming
- Responsive by default
- Dark mode first

---



## Icons

Use **lucide-react** for all icons.

Avoid mixing multiple icon libraries.

---



## Code Quality

- TypeScript only
- Strict mode enabled
- Functional React components
- Prefer Server Components where applicable
- Keep components small and composable
- Reusable logic belongs in hooks or shared utilities
- Avoid duplicated UI

---



## Project Structure

- `apps/frontend` → Application UI
- `apps/backend` → API Server
- `packages/db` → Prisma schema & database client
- `packages/ui` → Shared shadcn/ui components

---



## General Principle

When multiple implementation options exist:

1. Prefer the simplest solution.
2. Prefer existing shadcn/ui components.
3. Keep code modular and reusable.
4. Optimize for shipping quickly over premature optimization.



# Goal

Build the foundation of the application.

This workspace will become the central place where every AI generated project lives.

By the end of this milestone, a user should be able to:

- Create a new project
- Open an existing project
- View the project layout
- See the file explorer
- Open files in an editor
- See a live preview placeholder
- Open the AI chat panel

No AI generation is required yet.

---



# Existing Repository Structure

The project already exists as an empty Turborepo.

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

---



# Responsibilities



## apps/frontend

Responsible for:

- Dashboard
- Project Workspace
- Routing
- Monaco Editor
- File Explorer
- Chat UI
- Preview Panel
- API Communication

---



## apps/backend

Responsible for:

- Project CRUD APIs
- File APIs
- Workspace APIs
- Database communication

---



## packages/db

Responsible for:

- Prisma schema
- Database models
- Prisma Client

---



## packages/ui

Responsible for:

- Shared UI Components
- Design System
- Buttons
- Inputs
- Dialogs
- Layout Components

---



# Workspace Layout

The application should resemble modern AI IDEs like Cursor, Bolt or Emergent.

Suggested layout:

```text
---------------------------------------------------------
| Top Navbar                                            |
---------------------------------------------------------
| Sidebar | Monaco Editor | Live Preview | AI Chat       |
|         |               |              |               |
|         |               |              |               |
|         |               |              |               |
---------------------------------------------------------
```

---



# Features



## 1. Create Project

User should be able to create a brand new project.

Minimum fields:

- Project Name

Future fields (not required now)

- Template
- Visibility
- Framework

---



## 2. Project Dashboard

A simple page showing

- Existing projects
- Create Project button

Clicking a project opens the workspace.

---



## 3. Workspace

After opening a project, render the workspace layout.

Sections:

- Navbar
- File Explorer
- Editor
- Preview
- Chat

No functionality required beyond rendering.

---



## 4. Sidebar (File Explorer)

Display a project file tree.

For now support

- folders
- files
- nested folders

Clicking a file should open it inside the editor.

Future support:

- rename
- drag/drop
- delete
- create file

Not required now.

---



## 5. Monaco Editor

Integrate Monaco Editor.

Requirements

- Open file
- Edit file
- Detect changes
- Save locally in state

No syntax intelligence required yet.

---



## 6. Chat Panel

Create the UI only.

Components

- Chat history
- Input
- Send button

No backend integration yet.

---



## 7. Preview Panel

Render an iframe (or placeholder component).

For now simply display

```text
Preview coming soon...
```

WebContainer integration will be added later.

---



# Database Models



## Project

```prisma
Project

id
name
createdAt
updatedAt
```

---



## File

```prisma
File

id
projectId
name
path
content
isFolder
parentId
createdAt
updatedAt
```

A file tree should be reconstructable entirely from this table.

---



# Backend APIs



## Create Project

```
POST /projects
```

Creates a blank project.

Returns

```json
{
  "id": "...",
  "name": "My Project"
}
```

---



## Get Projects

```
GET /projects
```

Returns all projects.

---



## Get Project

```
GET /projects/:id
```

Returns

- Project metadata
- File tree

---



## Save File

```
PUT /projects/:id/files/:fileId
```

Updates file content.

---



# Frontend Pages



## Dashboard

Route

```
/
```

Contains

- Project list
- Create project button

---



## Workspace

Route

```
/project/:id
```

Contains

- Sidebar
- Editor
- Preview
- Chat

---



# State Management

For this phase, local state is sufficient.

Suggested state

```text
Workspace

selectedProject

selectedFile

openedFiles

fileTree

editorContent
```

Realtime sync is not required.

---



# UI Components (packages/ui)

Create reusable components where appropriate.

Suggested components

- Button
- Input
- Modal
- Card
- Sidebar
- Navbar
- Panel
- Tabs

These should be consumed inside `apps/frontend`.

---



# Folder Structure (Suggested)

```text
apps/

frontend/

    app/

    components/

        workspace/

        sidebar/

        editor/

        preview/

        chat/

    hooks/

    lib/

backend/

    src/

        routes/

        controllers/

        services/

        prisma/

packages/

    db/

        prisma/

    ui/

        button/

        card/

        modal/

        sidebar/
```

---



# Out of Scope

Do **NOT** build any of the following in this phase.

- AI generation
- WebContainers
- Live preview
- File diffing
- Authentication
- Collaboration
- Deployment
- Agent orchestration
- Prompt handling
- File syncing
- Terminal
- Git integration

---



# Acceptance Criteria

The feature is considered complete when:

- User can create a project
- Project is stored in the database
- User can view all projects
- User can open an existing project
- Workspace loads correctly
- Sidebar displays the project file tree
- Clicking a file opens it in Monaco
- Editing works inside Monaco
- Chat UI is visible
- Preview panel is visible
- Changes can be saved to the backend

---



# Definition of Done

A user can:

1. Create a new blank project.
2. Open an existing project.
3. View the workspace.
4. Browse project files.
5. Open files in Monaco.
6. Edit file contents.
7. Save changes.
8. Return later and reload the same project.

This milestone creates the foundation upon which every future AI feature will be built.