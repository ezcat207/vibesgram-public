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
            // Validate total content size based on base64 decoded data
            const sizeCalcStart = Date.now();
            const totalSize = input.files.reduce((sum, file) => {
                const decodedSize = Math.ceil(file.content.length * 0.75);
                return sum + decodedSize;
            }, 0);
            const sizeCalcDuration = Date.now() - sizeCalcStart;
            
            console.error(`📏 [tRPC createPreview ${requestId}] Size calculation: ${(totalSize / (1024 * 1024)).toFixed(2)}MB in ${sizeCalcDuration}ms`);

            if (totalSize > MAX_ARTIFACT_FILE_TOTAL_SIZE) {
                console.error(`❌ [tRPC createPreview ${requestId}] SIZE LIMIT EXCEEDED: ${totalSize} > ${MAX_ARTIFACT_FILE_TOTAL_SIZE}`);
                throw new TRPCError({
                    code: "PAYLOAD_TOO_LARGE",
                    message: `Total content exceeds the ${MAX_ARTIFACT_FILE_TOTAL_SIZE / (1024 * 1024)}MB size limit`,
                });
            }

            const indexFileExists = input.files.some(file => file.path === "index.html");
            if (!indexFileExists) {
                console.error(`❌ [tRPC createPreview ${requestId}] MISSING INDEX.HTML`);
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "An 'index.html' file is required for all previews",
                });
            }

            const previewId = generateShortId();
            console.error(`🔑 [tRPC createPreview ${requestId}] Generated preview ID: ${previewId}`);
            
            // DB collision check
            const dbCheckStart = Date.now();
            console.error(`🔍 [tRPC createPreview ${requestId}] CHECKING DB COLLISION...`);
            const existing = await db.preview.findUnique({ where: { id: previewId } });
            const dbCheckDuration = Date.now() - dbCheckStart;
            
            console.error(`✅ [tRPC createPreview ${requestId}] DB check complete in ${dbCheckDuration}ms, collision: ${!!existing}`);

            if (existing) {
                console.error(`💥 [tRPC createPreview ${requestId}] ID COLLISION DETECTED: ${previewId}`);
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Preview ID already exists",
                });
            }

            // R2 Upload Phase
            const uploadStart = Date.now();
            console.error(`📤 [tRPC createPreview ${requestId}] STARTING R2 UPLOADS for ${input.files.length} files - THIS IS WHERE THE DELAY MIGHT BE`);
            
            const uploadPromises = input.files.map((file, index) => {
                const previewPath = `${getPreviewStoragePath(previewId)}/${file.path}`;
                const fileBuffer = Buffer.from(file.content, "base64");
                
                console.error(`📄 [tRPC createPreview ${requestId}] Queuing upload ${index + 1}/${input.files.length}: ${file.path} (${fileBuffer.length} bytes)`);
                
                return uploadToR2(fileBuffer, file.contentType, previewPath).catch(error => {
                    console.error(`💥 [tRPC createPreview ${requestId}] R2 UPLOAD FAILED for ${file.path}:`, error);
                    throw error;
                });
            });

            console.error(`⏱️  [tRPC createPreview ${requestId}] WAITING for Promise.all on ${uploadPromises.length} uploads...`);
            await Promise.all(uploadPromises);
            const uploadDuration = Date.now() - uploadStart;
            console.error(`✅ [tRPC createPreview ${requestId}] ALL R2 UPLOADS COMPLETED in ${uploadDuration}ms`);

            // Calculate expiry time
            const previewExpiresAt = new Date();
            previewExpiresAt.setHours(previewExpiresAt.getHours() + 3);

            // DB Write Phase
            const dbWriteStart = Date.now();
            console.error(`💾 [tRPC createPreview ${requestId}] WRITING TO DATABASE...`);
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
            console.error(`🎉 [tRPC createPreview ${requestId}] SUCCESS! Total time: ${totalDuration}ms`, {
                timings: {
                    sizeCalc: sizeCalcDuration,
                    dbCheck: dbCheckDuration,
                    upload: uploadDuration,
                    dbWrite: dbWriteDuration,
                    total: totalDuration,
                },
                breakdown: `Size:${sizeCalcDuration}ms + DB:${dbCheckDuration}ms + Upload:${uploadDuration}ms + Write:${dbWriteDuration}ms = ${totalDuration}ms`
            });

            return {
                preview,
                previewExpiresAt,
            };
        } catch (error) {
            const totalDuration = Date.now() - requestStart;
            console.error(`💥 [tRPC createPreview ${requestId}] FAILED after ${totalDuration}ms:`, {
                error: error instanceof Error ? error.message : String(error),
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
    });