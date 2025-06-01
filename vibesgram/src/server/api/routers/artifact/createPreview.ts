import { MAX_ARTIFACT_FILE_TOTAL_SIZE } from "@/lib/const";
import { getPreviewStoragePath } from "@/lib/paths";
import { uploadToR2 } from "@/lib/storage";
import { generateShortId } from "@/lib/utils";
import { publicProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { TRPCError } from "@trpc/server";
import { rateLimitByIP } from "../../middleware/ratelimit/slidingWindow";
import { rateLimitGlobalConcurrency } from "../../middleware/ratelimit/tokenBucket";
import { createPreviewSchema } from "./schema";

export const createPreview = publicProcedure
    .input(createPreviewSchema)
    .use(rateLimitByIP({
        key: "artifact.createPreview",
        requests: 5,
        duration: "60 m",
    }))
    .use(rateLimitGlobalConcurrency({
        key: "artifact.createPreview",
        concurrency: 10,
        refillRate: "30 s",
    }))
    .mutation(async ({ input }) => {
        try {
            // Validate total content size based on base64 decoded data
            const totalSize = input.files.reduce((sum, file) => {
                // Get approximate decoded size of base64 string
                // base64 string length * 0.75 can approximate the decoded byte size
                const decodedSize = Math.ceil(file.content.length * 0.75);
                return sum + decodedSize;
            }, 0);

            if (totalSize > MAX_ARTIFACT_FILE_TOTAL_SIZE) {
                throw new TRPCError({
                    code: "PAYLOAD_TOO_LARGE",
                    message: `Total content exceeds the ${MAX_ARTIFACT_FILE_TOTAL_SIZE / (1024 * 1024)}MB size limit`,
                });
            }

            // Check if index.html exists in files
            const indexFileExists = input.files.some(
                (file) => file.path === "index.html",
            );
            if (!indexFileExists) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "An 'index.html' file is required for all previews",
                });
            }

            // Generate a unique preview ID using cuid and check for collisions
            const previewId = generateShortId();
            const existing = await db.preview.findUnique({
                where: {
                    id: previewId,
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Preview ID already exists",
                });
            }

            // Upload each file to R2 with the new preview ID
            const uploadPromises = input.files.map((file) => {
                const previewPath = `${getPreviewStoragePath(previewId)}/${file.path}`;
                // Decode base64 string to Buffer
                const fileBuffer = Buffer.from(file.content, "base64");
                return uploadToR2(fileBuffer, file.contentType, previewPath);
            });

            await Promise.all(uploadPromises);

            // Calculate expiry time (3 hours from now)
            const previewExpiresAt = new Date();
            previewExpiresAt.setHours(previewExpiresAt.getHours() + 3);

            // Create a new preview record
            const preview = await db.preview.create({
                data: {
                    id: previewId,
                    fileSize: totalSize,
                    fileCount: input.files.length,
                    expiresAt: previewExpiresAt,
                },
            });

            return {
                preview,
                previewExpiresAt,
            };
        } catch (error) {
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to create preview: ${String(error)}`,
            });
        }
    }); 