import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { Prisma } from "@prisma/client";

// Zod schema for ProjectIdea creation
const createProjectIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().min(1, "Description is required").max(5000, "Description must be 5000 characters or less"),
  expectedFeatures: z.array(z.string().min(1, "Feature cannot be empty").max(100, "Feature must be 100 characters or less")).min(1, "At least one feature is required").max(20, "No more than 20 features allowed"),
  targetPrice: z.number().int().min(100, "Target price must be at least $1.00 (100 cents)").max(900, "Target price cannot exceed $9.00 (900 cents)"),
  projectType: z.string().min(1, "Project type is required").max(50, "Project type must be 50 characters or less"),
  contactInfo: z.string().min(1, "Contact info is required").email("Invalid email address"),
  crowdfundingEndDate: z.coerce.date().refine((date) => date > new Date(), { // Using coerce.date for flexibility from client
    message: "Crowdfunding end date must be in the future",
  }),
  // NOTE: markAsCompleted was moved out of the schema object and into the router definition below.
});

export const projectIdeaRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createProjectIdeaSchema) // createProjectIdeaSchema should NOT contain markAsCompleted
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const projectIdea = await ctx.db.projectIdea.create({
        data: {
          ...input,
          userId,
        },
      });
      return projectIdea;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().cuid("Invalid CUID") }))
    .query(async ({ ctx, input }) => {
      const projectIdea = await ctx.db.projectIdea.findUnique({
        where: { id: input.id },
        include: {
          user: true, // Include user details
          pledges: true, // Include pledges to calculate total funding later
          // milestones: true, // Optionally include milestones
        },
      });
      return projectIdea;
    }),

  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(), // CUID for cursor-based pagination
        userId: z.string().cuid().optional(), // Optional: Filter by user ID
        status: z.nativeEnum(Prisma.ProjectStatus).optional(), // Optional: Filter by status
      })
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 10;
      const { cursor, userId, status } = input;

      const whereClause: Prisma.ProjectIdeaWhereInput = {};
      if (userId) {
        whereClause.userId = userId;
      }
      if (status) {
        whereClause.status = status;
      }

      const items = await ctx.db.projectIdea.findMany({
        where: whereClause,
        take: limit + 1, // get an extra item to see if there's a next page
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: Prisma.SortOrder.desc,
        },
        include: {
          user: true,
          pledges: { select: { amount: true } },
          developerApplications: { select: { status: true, developerId: true } },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // remove the extra item
        nextCursor = nextItem!.id;
      }
      return {
        items,
        nextCursor,
      };
    }),

  markAsCompleted: protectedProcedure
    .input(z.object({ projectIdeaId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { projectIdeaId } = input;

      const projectIdea = await ctx.db.projectIdea.findUnique({
        where: { id: projectIdeaId },
      });

      if (!projectIdea) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project idea not found." });
      }

      if (projectIdea.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can mark this project as completed." });
      }

      if (projectIdea.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Project must be IN_PROGRESS to be marked as completed. Current status: ${projectIdea.status}` });
      }

      return ctx.db.projectIdea.update({
        where: { id: projectIdeaId },
        data: { status: "COMPLETED" },
      });
    }),
});

// Helper to ensure Prisma types are available for nativeEnum in Zod
const Prisma = globalThis.Prisma || {} as any;
if (!Prisma.ProjectStatus) {
  Prisma.ProjectStatus = {
    CROWDFUNDING: 'CROWDFUNDING',
    FUNDED: 'FUNDED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  } as const;
}
