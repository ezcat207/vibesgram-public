import { PrismaClient } from "@prisma/client";

import { env } from "@/env";

const createPrismaClient = () => {
  // Production-grade connection pooling for tRPC performance
  const connectionUrl = new URL(env.DATABASE_URL);
  
  // Aggressive connection pooling settings
  connectionUrl.searchParams.set('connection_limit', '10');
  connectionUrl.searchParams.set('pool_timeout', '20');
  connectionUrl.searchParams.set('connect_timeout', '10');
  connectionUrl.searchParams.set('socket_timeout', '20');
  
  return new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error"] : ["error"],
    datasources: {
      db: {
        url: connectionUrl.toString(),
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Pre-warm database connection for optimal tRPC performance
const warmUpConnection = async () => {
  try {
    // Test basic connectivity
    await db.$queryRaw`SELECT 1`;
    console.log("✅ Database connection warmed up successfully");
    
    // Pre-warm preview table queries for tRPC
    await db.preview.findFirst().catch(() => {
      // Ignore errors, just warm the connection
    });
  } catch (error) {
    console.error("❌ Database connection warmup failed:", error);
  }
};

// Warm up immediately and periodically
void warmUpConnection();
if (env.NODE_ENV !== "test") {
  setInterval(() => {
    void warmUpConnection();
  }, 60000); // Re-warm every minute
}