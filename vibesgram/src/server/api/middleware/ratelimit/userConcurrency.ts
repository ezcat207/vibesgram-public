import { env } from "@/env";
import { TRPCError } from "@trpc/server";
import { redis } from "../../../redis";
import { middleware } from "../../trpc";

// Key expiry time in seconds (safety cleanup in case process crashes)
const LOCK_EXPIRY = 30;

export const singleConcurrentRequestPerUser = () => {
  return middleware(async ({ ctx, next, path }) => {
    // Skip in development
    if (env.NODE_ENV === "development") {
      console.log(
        `[User Concurrency] DEV MODE - Would limit: Path: ${path}, User: ${ctx.session?.user.id}`,
      );
      return next({ ctx });
    }

    // Require authentication
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in",
      });
    }

    const userId = ctx.session.user.id;
    const lockKey = `user-concurrent:${userId}:${path}`;

    // Try to acquire lock
    const acquired = await redis.set(lockKey, "1", {
      nx: true, // Only set if not exists
      ex: LOCK_EXPIRY, // Auto expire as safety
    });

    if (!acquired) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message:
          "You already have a request in progress. Please wait for it to complete.",
      });
    }

    try {
      // Execute the request
      return await next({ ctx });
    } finally {
      // Always clean up the lock when done
      await redis.del(lockKey);
    }
  });
};
