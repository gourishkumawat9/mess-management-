import { PrismaClient } from "@prisma/client";

/**
 * Neon's pooled endpoint ("-pooler" in the host) runs PgBouncer in transaction
 * mode, where Prisma must not cache prepared statements.
 */
function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.includes("-pooler.") || /[?&]pgbouncer=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`;
}

// Reuse one client across hot reloads in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

