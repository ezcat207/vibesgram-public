import { MAX_COVER_IMAGE_SIZE_KB, MAX_USER_ARTIFACTS } from "@/lib/const";
import { getArtifactStoragePath, getPreviewStoragePath } from "@/lib/paths";
import { copyDirectoryInR2, uploadToAssetsR2 } from "@/lib/storage";
import { generateShortId } from "@/lib/utils";
import { protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { publishFromPreviewSchema } from "./schema";

export const publishArtifact = protectedProcedure
    .input(publishFromPreviewSchema)
    .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;

        try {
            // Check if the preview exists
            const preview = await db.preview.findUnique({
                where: { id: input.previewId },
            });

            if (!preview) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Preview not found",
                });
            }

            // Check if user has reached the artifact limit
            const artifactCount = await db.artifact.count({
                where: { userId },
            });

            if (artifactCount >= MAX_USER_ARTIFACTS) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: `You have reached the maximum limit of ${MAX_USER_ARTIFACTS} artifacts. Please delete some existing artifacts to create new ones.`,
                });
            }

            const artifactId = generateShortId();
            const existing = await db.artifact.findUnique({
                where: {
                    id: artifactId,
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Artifact ID already exists",
                });
            }

            // Upload cover image if provided
            let coverImagePath: string | undefined;
            try {
                const coverImageBuffer = Buffer.from(input.coverImage.data, 'base64');
                // Check cover image size (convert KB to bytes for comparison)
                if (coverImageBuffer.length > MAX_COVER_IMAGE_SIZE_KB * 1024) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Cover image size exceeds the maximum limit of ${MAX_COVER_IMAGE_SIZE_KB}KB`,
                    });
                }
                const coverPath = `covers/${artifactId}.${input.coverImage.contentType.split('/')[1]}`; // e.g., covers/abc123.png
                await uploadToAssetsR2(
                    coverImageBuffer,
                    input.coverImage.contentType,
                    coverPath
                );
                coverImagePath = coverPath;
            } catch (error) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Failed to upload cover image: ${String(error)}`,
                });
            }

            // Create the artifact with metadata
            const artifact = await db.artifact.create({
                data: {
                    id: artifactId,
                    userId,
                    title: input.title,
                    description: input.description,
                    fileSize: preview.fileSize,
                    fileCount: preview.fileCount,
                    coverImagePath, // Add the cover image path
                },
            });

            // Update the preview to link it to the artifact
            await db.preview.update({
                where: { id: input.previewId },
                data: { artifactId: artifactId },
            });

            // Copy files from preview to published path
            const sourceBasePath = getPreviewStoragePath(input.previewId);
            const targetBasePath = getArtifactStoragePath(artifactId);
            await copyDirectoryInR2(sourceBasePath, targetBasePath);

            return {
                artifact,
            };
        } catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to publish from preview: ${String(error)}`,
            });
        }
    }); 