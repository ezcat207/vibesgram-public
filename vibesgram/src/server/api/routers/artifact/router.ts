import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { createPreview } from "./createPreview";
import { deleteArtifact } from "./deleteArtifact";
import { likeRouter } from "./like/router";
import { publishArtifact } from "./publishArtifact";
import {
  getArtifactByConversationIdSchema,
  getArtifactByIdSchema,
  getArtifactsSchema,
  getUserArtifactsSchema,
  updateArtifactSchema,
} from "./schema";
import { z } from "zod"; // Import Zod

// Define the schema for the new procedure's input
const handleStripeDonationSchema = z.object({
  artifactId: z.string(),
  amount: z.number().positive("Amount must be a positive number"),
});

export const artifactRouter = createTRPCRouter({
  createPreview,
  publishArtifact,
  deleteArtifact,
  like: likeRouter,

  // Get all published artifacts with pagination
  getArtifacts: publicProcedure
    .input(getArtifactsSchema)
    .query(async ({ input }) => {
      const artifacts = await db.artifact.findMany({
        where: {
          deletedAt: null,
        },
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: {
            id: input.cursor,
          },
        }),
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
              username: true,
              id: true,
            },
          },
        },
      });

      // Check if there are more results
      let nextCursor: string | undefined;
      if (artifacts.length > input.limit) {
        const nextItem = artifacts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: artifacts,
        nextCursor,
      };
    }),

  // Update artifact metadata
  updateArtifact: protectedProcedure
    .input(updateArtifactSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify artifact exists and belongs to the user
      const artifact = await db.artifact.findUnique({
        where: { id: input.artifactId, deletedAt: null },
      });

      if (!artifact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artifact not found",
        });
      }

      if (artifact.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this artifact",
        });
      }

      // Update the artifact
      try {
        const updatedArtifact = await db.artifact.update({
          where: { id: input.artifactId },
          data: {
            ...(input.title && { title: input.title }),
            ...(input.description !== undefined && {
              description: input.description,
            }),
          },
        });

        return updatedArtifact;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update artifact: ${String(error)}`,
        });
      }
    }),

  // Get user's artifacts with pagination
  getUserArtifacts: publicProcedure
    .input(getUserArtifactsSchema)
    .query(async ({ input }) => {
      const userId = input.userId;

      // Get one more than limit for cursor-based pagination
      const artifacts = await db.artifact.findMany({
        where: { userId, deletedAt: null },
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: {
            id: input.cursor,
          },
        }),
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
              username: true,
              id: true,
            },
          },
        },
      });

      // Check if there are more results
      let nextCursor: string | undefined;
      if (artifacts.length > input.limit) {
        const nextItem = artifacts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        artifacts,
        nextCursor,
      };
    }),

  // Get artifact by ID
  getArtifactById: publicProcedure
    .input(getArtifactByIdSchema)
    .query(async ({ input }) => {
      const artifact = await db.artifact.findUnique({
        where: {
          id: input.artifactId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
              username: true,
              id: true,
            },
          },
          previews: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (!artifact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Artifact with id ${input.artifactId} not found`,
        });
      }

      return artifact;
    }),

  // Get artifact by conversation ID
  getArtifactByConversationId: protectedProcedure
    .input(getArtifactByConversationIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const artifact = await db.artifact.findFirst({
        where: {
          conversationId: input.conversationId,
          userId, // Ensure the user owns the artifact
        },
        include: {
          previews: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      // Return null if no artifact found, client will handle this case
      return artifact;
    }),

  // Handle Stripe Donation
  handleStripeDonation: protectedProcedure
    .input(handleStripeDonationSchema)
    .mutation(async ({ ctx, input }) => {
      const { artifactId, amount } = input;

      // Verify artifact exists
      const existingArtifact = await db.artifact.findUnique({
        where: { id: artifactId, deletedAt: null },
      });

      if (!existingArtifact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artifact not found",
        });
      }

      // Update the current crowdfunding amount
      try {
        const updatedArtifact = await db.artifact.update({
          where: { id: artifactId },
          data: {
            currentCrowdfundingAmount: {
              increment: amount,
            },
          },
        });
        return updatedArtifact;
      } catch (error) {
        console.error("Failed to update crowdfunding amount:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process donation.",
        });
      }
    }),
});
