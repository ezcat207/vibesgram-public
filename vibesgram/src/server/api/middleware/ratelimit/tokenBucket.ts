import { env } from "@/env";
import { TRPCError } from "@trpc/server";
import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { redis } from "../../../redis";
import { middleware } from "../../trpc";

export type GlobalConcurrencyConfig =
  | {
      key: string;
      concurrency: number; // Maximum number of concurrent requests
      refillRate: Duration; // Refill one token every N seconds
    }
  | false;

const DEFAULT_CONFIG: GlobalConcurrencyConfig = {
  key: "default",
  concurrency: 5,
  refillRate: "2 s",
};

// Cache for ratelimiter instances
const rateLimiters = new Map<string, Ratelimit>();

const getTokenBucket = (config: GlobalConcurrencyConfig) => {
  if (config === false) return null;

  if (!rateLimiters.has(config.key)) {
    rateLimiters.set(
      config.key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.tokenBucket(
          config.concurrency, // max concurrent requests
          config.refillRate, // refill rate
          config.concurrency, // bucket size = max concurrency
        ),
      }),
    );
  }
  return rateLimiters.get(config.key)!;
};

export const rateLimitGlobalConcurrency = (
  config: GlobalConcurrencyConfig = DEFAULT_CONFIG,
) => {
  return middleware(async ({ ctx, next, path }) => {
    // Skip in development
    if (config === false || env.NODE_ENV === "development") {
      if (env.NODE_ENV === "development") {
        console.log(
          `[Global Concurrency] DEV MODE - Would limit: Path: ${path}, Config:`,
          config,
        );
      }
      return next({ ctx });
    }

    const ratelimiter = getTokenBucket({
      ...config,
      key: `global-${config.key}`,
    });
    if (!ratelimiter) {
      return next({ ctx });
    }

    const { success, limit, remaining, reset } = await ratelimiter.limit(
      `global:${path}`,
    );

    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Server is busy. Please try again in ${Math.ceil(
          (reset - Date.now()) / 1000,
        )} seconds.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        globalRateLimit: { limit, remaining, reset },
      },
    });
  });
};
