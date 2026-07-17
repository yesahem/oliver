import type { WebContainer } from "@webcontainer/api";

// Booting twice in one tab throws, so the instance is cached module-wide.
// The API package is imported dynamically: it is browser-only and must never
// be evaluated during SSR.
let bootPromise: Promise<WebContainer> | null = null;
let instance: WebContainer | null = null;

export function bootWebContainer(): Promise<WebContainer> {
  if (!bootPromise) {
    bootPromise = import("@webcontainer/api")
      .then(({ WebContainer }) => WebContainer.boot())
      .then((container) => {
        instance = container;
        return container;
      })
      .catch((error) => {
        // Allow a later retry to attempt a fresh boot.
        bootPromise = null;
        throw error;
      });
  }
  return bootPromise;
}

export function getBootedContainer(): WebContainer | null {
  return instance;
}

export async function teardownWebContainer(): Promise<void> {
  const container = instance;
  bootPromise = null;
  instance = null;
  container?.teardown();
}
