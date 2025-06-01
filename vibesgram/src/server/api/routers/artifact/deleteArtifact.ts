import { getArtifactStoragePath } from "@/lib/paths";
import { deleteFromR2 } from "@/lib/storage";
import { protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const deleteArtifact = protectedProcedure
    .input(z.object({
        artifactId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        try {
            // Find the artifact and ensure it belongs to the user
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
                    message: "You do not have permission to delete this artifact",
                });
            }

            // Soft delete the artifact in the database
            await db.artifact.update({
                where: { id: input.artifactId },
                data: { deletedAt: new Date() },
            });

            // Delete the files from R2
            // Delete both the content directory and the cover image if it exists
            const contentPath = getArtifactStoragePath(input.artifactId);
            await deleteFromR2(contentPath);

            if (artifact.coverImagePath) {
                await deleteFromR2(artifact.coverImagePath);
            }

            return { success: true };
        } catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to delete artifact: ${String(error)}`,
            });
        }
    });
