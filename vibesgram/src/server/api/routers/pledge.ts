import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";

export const pledgeRouter = createTRPCRouter({
  getMine: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return ctx.db.pledge.findMany({
        where: { userId },
        include: {
          projectIdea: { // Include details of the project idea for each pledge
            select: {
              id: true,
              title: true,
              status: true,
              // Add any other projectIdea fields needed for display
              // e.g., user: { select: { name: true, username: true }}
            }
          }
        },
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
      });
    }),

  // Potentially add more pledge-related procedures here if needed in the future
  // e.g., getPledgesForProject (public), updatePledge, cancelPledge (if allowed)
});
