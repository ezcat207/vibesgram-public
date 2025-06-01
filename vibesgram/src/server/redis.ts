import { env } from "@/env";
import { Redis } from "@upstash/redis";

const createRedisClient = () =>
  new Redis({
    url: env.UPSTASH_REDIS_REST_URL || "http://localhost:8079/",
    token: env.UPSTASH_REDIS_REST_TOKEN || "dummy_token",
  });

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createRedisClient> | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
