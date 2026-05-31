import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    // Production / Vercel: use libsql adapter against Turso (or any libSQL)
    // Lazily require to avoid bundling for the SQLite-only local path.
    const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
    const { PrismaLibSQL } =
      require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
