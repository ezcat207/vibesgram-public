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
        
        console.log(`[tRPC createPreview ${requestId}] Starting with ${input.files.length} files`);
        
        try {
            // Validate total content size based on base64 decoded data
            const sizeCalcStart = Date.now();
            const totalSize = input.files.reduce((sum, file) => {
                // Get approximate decoded size of base64 string
                // base64 string length * 0.75 can approximate the decoded byte size
                const decodedSize = Math.ceil(file.content.length * 0.75);
                return sum + decodedSize;
            }, 0);
            const sizeCalcDuration = Date.now() - sizeCalcStart;
            
            console.log(`[tRPC createPreview ${requestId}] Size calculation completed in ${sizeCalcDuration}ms: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`);

            if (totalSize > MAX_ARTIFACT_FILE_TOTAL_SIZE) {
                console.warn(`[tRPC createPreview ${requestId}] Size limit exceeded: ${totalSize} > ${MAX_ARTIFACT_FILE_TOTAL_SIZE}`);
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
                console.warn(`[tRPC createPreview ${requestId}] Missing index.html file`);
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "An 'index.html' file is required for all previews",
                });
            }

            // Generate a unique preview ID using cuid and check for collisions
            const previewId = generateShortId();
            console.log(`[tRPC createPreview ${requestId}] Generated preview ID: ${previewId}`);
            
            const dbCheckStart = Date.now();
            const existing = await db.preview.findUnique({
                where: {
                    id: previewId,
                },
            });
            const dbCheckDuration = Date.now() - dbCheckStart;
            
            console.log(`[tRPC createPreview ${requestId}] DB collision check completed in ${dbCheckDuration}ms, exists: ${!!existing}`);

            if (existing) {
                console.warn(`[tRPC createPreview ${requestId}] Preview ID collision: ${previewId}`);
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Preview ID already exists",
                });
            }

            // Upload each file to R2 with the new preview ID
            const uploadStart = Date.now();
            console.log(`[tRPC createPreview ${requestId}] Starting R2 uploads for ${input.files.length} files`);
            
            const uploadPromises = input.files.map((file, index) => {
                const previewPath = `${getPreviewStoragePath(previewId)}/${file.path}`;
                // Decode base64 string to Buffer
                const fileBuffer = Buffer.from(file.content, "base64");
                
                console.log(`[tRPC createPreview ${requestId}] Queuing upload ${index + 1}/${input.files.length}: ${file.path} (${fileBuffer.length} bytes)`);
                
                return uploadToR2(fileBuffer, file.contentType, previewPath).catch(error => {
                    console.error(`[tRPC createPreview ${requestId}] Upload failed for ${file.path}:`, error);
                    throw error;
                });
            });

            await Promise.all(uploadPromises);
            const uploadDuration = Date.now() - uploadStart;
            console.log(`[tRPC createPreview ${requestId}] All R2 uploads completed in ${uploadDuration}ms`);

            // Calculate expiry time (3 hours from now)
            const previewExpiresAt = new Date();
            previewExpiresAt.setHours(previewExpiresAt.getHours() + 3);

            // Create a new preview record
            const dbWriteStart = Date.now();
            const preview = await db.preview.create({
                data: {
                    id: previewId,
                    fileSize: totalSize,
                    fileCount: input.files.length,
                    expiresAt: previewExpiresAt,
                },
            });
            const dbWriteDuration = Date.now() - dbWriteStart;
            
            const totalDuration = Date.now() - requestStart;
            console.log(`[tRPC createPreview ${requestId}] Preview creation completed successfully in ${totalDuration}ms`, {
                previewId,
                fileCount: input.files.length,
                totalSize,
                timings: {
                    sizeCalc: sizeCalcDuration,
                    dbCheck: dbCheckDuration,
                    upload: uploadDuration,
                    dbWrite: dbWriteDuration,
                    total: totalDuration,
                }
            });

            return {
                preview,
                previewExpiresAt,
            };
        } catch (error) {
            const totalDuration = Date.now() - requestStart;
            console.error(`[tRPC createPreview ${requestId}] Preview creation failed after ${totalDuration}ms:`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                type: error?.constructor?.name,
                isTRPCError: error instanceof TRPCError,
                code: error instanceof TRPCError ? error.code : undefined,
            });
            
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Failed to create preview: ${String(error)}`,
            });
        }
    });; 