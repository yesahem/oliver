// Every new project is seeded with this minimal Vite + React + TypeScript app
// (foundations decision: gives Spec 01 a file tree and Spec 02 a runnable app).
// Scripts are plain `vite` commands so both npm (inside WebContainers) and bun work.

export interface TemplateFile {
  path: string;
  content: string;
}

export const TEMPLATE_FILES: TemplateFile[] = [
  {
    path: "package.json",
    content: `{
  "name": "my-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "typescript": "^5.8.0",
    "vite": "^6.3.5"
  }
}
`,
  },
  {
    path: "vite.config.ts",
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
`,
  },
  {
    path: "index.html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  },
  {
    path: "src/main.tsx",
    content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`,
  },
  {
    path: "src/App.tsx",
    content: `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="app">
      <h1>Hello, world!</h1>
      <p>Your app is running. Start chatting to build something.</p>
      <button onClick={() => setCount((c) => c + 1)}>Count is {count}</button>
    </main>
  );
}
`,
  },
  {
    path: "src/index.css",
    content: `:root {
  color-scheme: dark;
  font-family: system-ui, -apple-system, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0a0a0a;
  color: #fafafa;
}

.app {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

button {
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid #333;
  background: #1a1a1a;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
}

button:hover {
  border-color: #666;
}
`,
  },
];
