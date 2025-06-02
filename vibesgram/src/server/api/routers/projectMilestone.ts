import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

// Helper function to check if user is project owner or accepted developer
async function isOwnerOrAcceptedDeveloper(
  ctx: { session: { user: { id: string } }; db: Prisma.TransactionClient | typeof import("~/server/db").db },
  projectIdeaId: string
): Promise<{ authorized: boolean; isOwner: boolean; acceptedDeveloperId?: string } > {
  const userId = ctx.session.user.id;

  const projectIdea = await ctx.db.projectIdea.findUnique({
    where: { id: projectIdeaId },
    include: {
      developerApplications: {
        where: { status: "ACCEPTED" },
        select: { developerId: true },
      },
    },
  });

  if (!projectIdea) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Project idea not found." });
  }

  const isOwner = projectIdea.userId === userId;
  const acceptedDeveloper = projectIdea.developerApplications.find(app => app.status === "ACCEPTED");
  const acceptedDeveloperId = acceptedDeveloper?.developerId;
  const isAcceptedDeveloper = acceptedDeveloperId === userId;

  // Only allow actions if project is IN_PROGRESS (or other relevant statuses for viewing)
  if (projectIdea.status !== "IN_PROGRESS") {
      // Allow viewing for more statuses, but modification only for IN_PROGRESS
      // This check might be nuanced per procedure. For CUD, definitely IN_PROGRESS.
      // For now, strict on IN_PROGRESS for any CUD ops.
      // throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be IN_PROGRESS to manage milestones." });
  }


  return { authorized: isOwner || isAcceptedDeveloper, isOwner, acceptedDeveloperId };
}


const milestoneInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().max(5000, "Description too long").optional(),
  dueDate: z.date().nullable().optional(),
});

export const projectMilestoneRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        projectIdeaId: z.string().cuid(),
      }).merge(milestoneInputSchema)
    )
    .mutation(async ({ ctx, input }) => {
      const { projectIdeaId, title, description, dueDate } = input;
      const auth = await isOwnerOrAcceptedDeveloper(ctx, projectIdeaId);
      if (!auth.authorized) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to create milestones for this project." });
      }

      const project = await ctx.db.projectIdea.findUnique({ where: { id: projectIdeaId } });
      if (project?.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be IN_PROGRESS to add milestones." });
      }

      return ctx.db.projectMilestone.create({
        data: { projectIdeaId, title, description: description ?? "", dueDate },
      });
    }),

  getForProject: publicProcedure // Publicly viewable, or protected if preferred
    .input(z.object({ projectIdeaId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.projectMilestone.findMany({
        where: { projectIdeaId: input.projectIdeaId },
        orderBy: { createdAt: Prisma.SortOrder.asc },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        projectIdeaId: z.string().cuid(), // Passed to check auth against project
      }).merge(milestoneInputSchema.partial()) // All fields optional for update
    )
    .mutation(async ({ ctx, input }) => {
      const { id, projectIdeaId, ...data } = input;
      const auth = await isOwnerOrAcceptedDeveloper(ctx, projectIdeaId);
      if (!auth.authorized) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update milestones for this project." });
      }
      const project = await ctx.db.projectIdea.findUnique({ where: { id: projectIdeaId } });
      if (project?.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be IN_PROGRESS to update milestones." });
      }

      return ctx.db.projectMilestone.update({
        where: { id },
        data,
      });
    }),

  toggleComplete: protectedProcedure
    .input(z.object({ id: z.string().cuid(), projectIdeaId: z.string().cuid(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { id, projectIdeaId, completed } = input;
      const auth = await isOwnerOrAcceptedDeveloper(ctx, projectIdeaId);
      if (!auth.authorized) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update milestone status." });
      }
      const project = await ctx.db.projectIdea.findUnique({ where: { id: projectIdeaId } });
      if (project?.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be IN_PROGRESS to update milestones." });
      }

      return ctx.db.projectMilestone.update({
        where: { id },
        data: { completed },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid(), projectIdeaId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, projectIdeaId } = input;
      const auth = await isOwnerOrAcceptedDeveloper(ctx, projectIdeaId);
      if (!auth.authorized) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete milestones for this project." });
      }
      const project = await ctx.db.projectIdea.findUnique({ where: { id: projectIdeaId } });
      if (project?.status !== "IN_PROGRESS") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be IN_PROGRESS to delete milestones." });
      }

      return ctx.db.projectMilestone.delete({
        where: { id },
      });
    }),
});
