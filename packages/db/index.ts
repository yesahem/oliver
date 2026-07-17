import { PrismaClient } from "./generated/prisma/client";

// Cache the client on globalThis so hot reloads (bun --hot, next dev) reuse
// one connection pool instead of leaking a new client per reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { Prisma } from "./generated/prisma/client";
export type { Project, File } from "./generated/prisma/client";
