import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc";
import { createUsernameSchema } from "./schema";

export const userRouter = createTRPCRouter({
  createUsername: protectedProcedure
    .input(createUsernameSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to set a username",
        });
      }

      // Check if user has already set a username
      if (ctx.session.user.username) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already set a username",
        });
      }

      // Check if username is already taken
      const existing = await ctx.db.user.findFirst({
        where: {
          username: {
            equals: input.username,
            mode: 'insensitive'
          }
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This username is already taken",
        });
      }

      // Update user's username
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { username: input.username },
      });
    }),

  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    });
  }),

  getByUsername: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findFirst({
        where: {
          username: {
            equals: input,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),
});
