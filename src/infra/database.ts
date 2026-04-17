import { PrismaClient } from "@/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import PG from "pg";
import { env } from "../env.js";

const globalForPrisma = globalThis as unknown as{
    prisma : PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new PG.Pool({
    connectionString: env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if( env.NODE_ENV !== 'production'){
    globalForPrisma.prisma = prisma;
}
