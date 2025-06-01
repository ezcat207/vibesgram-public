import { env } from "@/env";
import { TRPCError } from "@trpc/server";
import { type Duration, Ratelimit } from "@upstash/ratelimit";
import { redis } from "../../../redis";
import { middleware } from "../../trpc";

// Define rate limit configurations
export type RateLimitConfig =
  | {
      key: string;
      requests: number; // Number of requests allowed
      duration: Duration; // Duration like "1 m", "1 h", etc.
      guestOnly?: boolean; // Whether to only apply rate limit to guest users
      skipIf?: (
        ctx: Record<string, unknown>,
        input: unknown,
      ) => boolean | Promise<boolean>; // Function to determine if rate limit should be skipped
    }
  | false; // false means no rate limiting

// Default rate limit: 100 requests per minute
const DEFAULT_LIMIT: RateLimitConfig = {
  key: "default",
  requests: 10,
  duration: "1 m",
  guestOnly: false,
};

// Cache for ratelimiter instances
const rateLimiters = new Map<string, Ratelimit>();

// Get or create ratelimiter for specific config
const getSlidingWindow = (config: RateLimitConfig) => {
  if (config === false) return null;

  if (!rateLimiters.has(config.key)) {
    rateLimiters.set(
      config.key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.requests, config.duration),
      }),
    );
  }
  return rateLimiters.get(config.key)!;
};

export const rateLimitByIP = (config: RateLimitConfig = DEFAULT_LIMIT) => {
  return middleware(async ({ ctx, next, path, input }) => {
    // If rate limiting is disabled for this route or in dev environment
    if (config === false || env.NODE_ENV === "development") {
      // In dev, just log the request
      if (env.NODE_ENV === "development") {
        const ip = ctx.headers.get("x-forwarded-for") ?? "127.0.0.1";
        console.log(
          `[Rate Limit] DEV MODE - Would limit: IP: ${ip}, Path: ${path}`,
        );
      }
      return next({ ctx });
    }

    // Skip if guestOnly is true and user is logged in
    if (config.guestOnly && ctx.session?.user) {
      return next({ ctx });
    }

    // Skip if skipIf function returns true
    if (config.skipIf && (await config.skipIf(ctx, input))) {
      return next({ ctx });
    }

    const ip = ctx.headers.get("x-forwarded-for");
    if (!ip) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing IP address",
      });
    }

    const ratelimiter = getSlidingWindow({
      ...config,
      key: `byIp-${config.key}`,
    });
    if (!ratelimiter) {
      // This shouldn't happen due to the earlier check, but TypeScript doesn't know that
      return next({ ctx });
    }

    const { success, limit, remaining, reset } = await ratelimiter.limit(
      `${ip}:${path}`,
    );

    if (!success) {
      const remainingSeconds = Math.ceil((reset - Date.now()) / 1000);

      // Format time message
      let timeMessage;
      if (remainingSeconds >= 3600) {
        const hours = Math.floor(remainingSeconds / 3600);
        timeMessage = `${hours} hours`;
      } else if (remainingSeconds >= 60) {
        const minutes = Math.floor(remainingSeconds / 60);
        timeMessage = `${minutes} minutes`;
      } else {
        timeMessage = `${remainingSeconds} seconds`;
      }

      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Please try again in ${timeMessage}.`,
        cause: { remainingSeconds },
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: { limit, remaining, reset },
      },
    });
  });
};
