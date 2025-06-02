import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client"; // For SortOrder

// Enum for Developer Application Status (consistent with Prisma schema comment)
export const DeveloperApplicationStatus = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);

export const developerApplicationRouter = createTRPCRouter({
  apply: protectedProcedure
    .input(
      z.object({
        projectIdeaId: z.string().cuid("Invalid Project Idea ID"),
        coverLetter: z.string().min(50, "Cover letter must be at least 50 characters long.").max(5000, "Cover letter must be 5000 characters or less."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;
      const { projectIdeaId, coverLetter } = input;

      const projectIdea = await ctx.db.projectIdea.findUnique({
        where: { id: projectIdeaId },
      });

      if (!projectIdea) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project idea not found." });
      }
      if (projectIdea.userId === developerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot apply to your own project idea." });
      }
      if (projectIdea.status !== "FUNDED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This project is not currently accepting applications. It must be funded." });
      }

      // Check if already applied
      const existingApplication = await ctx.db.developerApplication.findUnique({
        where: { developerId_projectIdeaId: { developerId, projectIdeaId } },
      });
      if (existingApplication) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have already applied to this project." });
      }

      // Check if project already has an accepted developer (assuming one developer per project for now)
      const acceptedApplications = await ctx.db.developerApplication.count({
        where: {
          projectIdeaId: projectIdeaId,
          status: "ACCEPTED",
        }
      });
      if (acceptedApplications > 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This project has already accepted a developer." });
      }


      const application = await ctx.db.developerApplication.create({
        data: {
          developerId,
          projectIdeaId,
          coverLetter,
          status: DeveloperApplicationStatus.enum.PENDING, // Explicitly set
        },
      });
      return application;
    }),

  getForProject: protectedProcedure
    .input(z.object({ projectIdeaId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const projectIdea = await ctx.db.projectIdea.findUnique({
        where: { id: input.projectIdeaId },
      });

      if (!projectIdea) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project idea not found." });
      }
      if (projectIdea.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to view applications for this project." });
      }

      return ctx.db.developerApplication.findMany({
        where: { projectIdeaId: input.projectIdeaId },
        include: {
          developer: { // Include developer's public info
            select: { id: true, name: true, email: true, image: true, username: true },
          },
        },
        orderBy: { createdAt: Prisma.SortOrder.desc },
      });
    }),

  getForDeveloper: protectedProcedure
    .query(async ({ ctx }) => {
      const developerId = ctx.session.user.id;
      return ctx.db.developerApplication.findMany({
        where: { developerId },
        include: {
          projectIdea: { // Include project idea details
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: Prisma.SortOrder.desc },
      });
    }),

  accept: protectedProcedure
    .input(z.object({ applicationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const application = await ctx.db.developerApplication.findUnique({
        where: { id: input.applicationId },
        include: { projectIdea: true },
      });

      if (!application) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      }
      if (application.projectIdea.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to accept this application." });
      }
      if (application.projectIdea.status !== "FUNDED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Project must be in 'FUNDED' status to accept applications." });
      }
      if (application.status !== "PENDING") {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Application is already in '${application.status}' status.` });
      }

      // Transaction to update application and project status
      return ctx.db.$transaction(async (prisma) => {
        const updatedApplication = await prisma.developerApplication.update({
          where: { id: input.applicationId },
          data: { status: DeveloperApplicationStatus.enum.ACCEPTED },
        });

        await prisma.projectIdea.update({
          where: { id: application.projectIdeaId },
          data: { status: "IN_PROGRESS" },
        });

        // Optionally, reject other pending applications for this project
        // This assumes one developer per project. If multiple, this logic would change.
        await prisma.developerApplication.updateMany({
            where: {
                projectIdeaId: application.projectIdeaId,
                id: { not: input.applicationId }, // Don't reject the one we just accepted
                status: "PENDING",
            },
            data: { status: DeveloperApplicationStatus.enum.REJECTED },
        });

        return updatedApplication;
      });
    }),

  reject: protectedProcedure
    .input(z.object({ applicationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const application = await ctx.db.developerApplication.findUnique({
        where: { id: input.applicationId },
        include: { projectIdea: true },
      });

      if (!application) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });
      }
      if (application.projectIdea.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to reject this application." });
      }
       if (application.status !== "PENDING") {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Application is already in '${application.status}' status. Cannot reject.` });
      }

      return ctx.db.developerApplication.update({
        where: { id: input.applicationId },
        data: { status: DeveloperApplicationStatus.enum.REJECTED },
      });
    }),
});
