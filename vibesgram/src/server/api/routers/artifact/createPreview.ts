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
        const requestStart = Date.now();
        const requestId = Math.random().toString(36).substring(7);
        
        console.error(`🚀 [tRPC createPreview ${requestId}] STARTING with ${input.files.length} files`);
        
        try {
            // Size calculation
            const sizeCalcStart = Date.now();
            const totalSize = input.files.reduce((sum, file) => {
                const decodedSize = Math.ceil(file.content.length * 0.75);
                return sum + decodedSize;
            }, 0);
            const sizeCalcDuration = Date.now() - sizeCalcStart;
            console.error(`📏 [tRPC createPreview ${requestId}] Size calculation: ${(totalSize / (1024 * 1024)).toFixed(2)}MB in ${sizeCalcDuration}ms`);

            if (totalSize > MAX_ARTIFACT_FILE_TOTAL_SIZE) {
                throw new TRPCError({
                    code: "PAYLOAD_TOO_LARGE",
                    message: `Total content exceeds the ${MAX_ARTIFACT_FILE_TOTAL_SIZE / (1024 * 1024)}MB size limit`,
                });
            }

            const indexFileExists = input.files.some(file => file.path === "index.html");
            if (!indexFileExists) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "An 'index.html' file is required for all previews",
                });
            }

            // Generate unique ID and parallelize operations for performance
            const previewId = generateShortId();
            const previewExpiresAt = new Date();
            previewExpiresAt.setHours(previewExpiresAt.getHours() + 3);

            // Execute R2 uploads and database operations in parallel
            const [, preview] = await Promise.all([
                // Upload files to R2
                Promise.all(input.files.map((file) => {
                    const previewPath = `${getPreviewStoragePath(previewId)}/${file.path}`;
                    const fileBuffer = Buffer.from(file.content, "base64");
                    return uploadToR2(fileBuffer, file.contentType, previewPath);
                })),
                
                // Create database record (skip collision check for performance)
                db.preview.create({
                    data: {
                        id: previewId,
                        fileSize: totalSize,
                        fileCount: input.files.length,
                        expiresAt: previewExpiresAt,
                    },
                }),
            ]);

            return {
                preview,
                previewExpiresAt,
            };
        } catch (error) {
            const totalDuration = Date.now() - requestStart;
            console.error(`💥 [tRPC createPreview ${requestId}] FAILED after ${totalDuration}ms:`, String(error));
            
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to create preview: ${String(error)}`,
            });
        }
    });