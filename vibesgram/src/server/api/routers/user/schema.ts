import { z } from "zod";

const RESERVED_USERNAMES = [
  // System and admin related
  "admin",
  "administrator",
  "system",
  "root",
  "superuser",
  "sysadmin",
  "webmaster",
  "postmaster",

  // Special values
  "null",
  "nil",
  "undefined",
  "none",
  "empty",
  "void",

  // Error and system states
  "error",
  "err",
  "failed",
  "failure",
  "success",
  "pending",
  "loading",
  "processing",
  "unknown",
  "invalid",
  "forbidden",
  "unauthorized",
  "notfound",
  "404",
  "500",
  "503",

  // Moderation related
  "moderator",
  "mod",
  "staff",
  "team",
  "official",
  "support",
  "help",
  "info",

  // Security related
  "security",
  "secure",
  "auth",
  "authentication",
  "login",
  "register",
  "signup",

  // Service related
  "service",
  "bot",
  "robot",
  "system",
  "daemon",
  "api",
  "webhook",

  // Platform related
  "vibesgram",
  "instagram",
  "facebook",
  "twitter",
  "tiktok",

  // Common spam/abuse related
  "spam",
  "abuse",
  "report",
  "delete",
  "banned",
  "suspended",

  // Payment related
  "payment",
  "billing",
  "account",
  "subscription",

  // Generic important terms
  "everyone",
  "anyone",
  "somebody",
  "nobody",
  "all",
  "public",
  "private",
  "default",
  "example",
  "test",
  "testing",
];

export const createUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, dashes and underscores",
    )
    .refine(
      (username) => !RESERVED_USERNAMES.includes(username.toLowerCase()),
      "This username is reserved and cannot be used"
    ),
});
