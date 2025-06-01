import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  clearMessageForUser,
  deleteConversationForUser,
  getConversationsForUser,
} from "@/lib/conversation";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";

export const conversationRouter = createTRPCRouter({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return getConversationsForUser(userId);
  }),

  deleteConversation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      try {
        await deleteConversationForUser(input.id, userId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete conversation, ${String(error)}`,
        });
      }
    }),

  clearMessage: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      try {
        await clearMessageForUser(input.id, userId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to clear message, ${String(error)}`,
          cause: error,
        });
      }
    }),

  changeTitle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }
      try {
        await db.conversation.update({
          where: { id: input.id, userId },
          data: {
            title: input.title,
          },
        });
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to change title, ${String(error)}`,
        });
      }
    }),
});
