import { env } from "@/env";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// Initialize S3 client for R2 with optimized settings
const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  maxAttempts: 1,              // No retries for speed
});

export async function uploadToR2(
  file: Uint8Array | Buffer,
  contentType: string,
  key: string,
): Promise<string> {
  const maxRetries = 3;
  let lastError: Error;
  const startTime = Date.now();

  console.error(`🌐 [R2] STARTING UPLOAD: ${key}, size: ${file.length} bytes, type: ${contentType}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStart = Date.now();
    try {
      console.error(`🔄 [R2] Upload attempt ${attempt}/${maxRetries} for ${key}`);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: contentType,
        }),
      );

      const attemptDuration = Date.now() - attemptStart;
      const totalDuration = Date.now() - startTime;
      console.error(`✅ [R2] UPLOAD SUCCESS: ${key} in ${attemptDuration}ms (total: ${totalDuration}ms, attempt: ${attempt}/${maxRetries})`);

      return key;
    } catch (error) {
      lastError = error as Error;
      const s3Error = error as { code?: string; $metadata?: { httpStatusCode?: number; requestId?: string } };
      const attemptDuration = Date.now() - attemptStart;
      
      console.error(`❌ [R2] Upload attempt ${attempt}/${maxRetries} FAILED for ${key} after ${attemptDuration}ms:`, {
        error: lastError.message,
        code: s3Error.code,
        statusCode: s3Error.$metadata?.httpStatusCode,
        requestId: s3Error.$metadata?.requestId,
      });
      
      if (attempt === maxRetries) {
        const totalDuration = Date.now() - startTime;
        console.error(`💥 [R2] UPLOAD COMPLETELY FAILED for ${key} after ${totalDuration}ms and ${maxRetries} attempts:`, lastError.message);
        throw new Error(`Failed to upload to R2 after ${maxRetries} attempts: ${lastError.message}`);
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.error(`⏳ [R2] Retrying ${key} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Copy an object from one location to another in R2
 * @param sourceKey Source key path
 * @param destinationKey Destination key path
 * @returns Key path of the destination object
 */
export async function copyObjectInR2(
  sourceKey: string,
  destinationKey: string,
): Promise<string> {
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      CopySource: `${env.R2_BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
    }),
  );

  return destinationKey;
}

/**
 * Retrieve the content of an object from R2
 * @param key Object key path
 * @returns Object data as Buffer
 */
export async function getObjectFromR2(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("Failed to retrieve object body");
  }

  return Buffer.from(await response.Body.transformToByteArray());
}

/**
 * List objects in a directory in R2
 * @param prefix Directory prefix to list
 * @returns Array of object keys
 */
export async function listObjectsInR2(prefix: string): Promise<string[]> {
  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      Prefix: prefix,
    }),
  );

  if (!response.Contents) {
    return [];
  }

  return response.Contents.map((item) => item.Key!);
}

/**
 * Copy all objects from one directory to another in R2
 * @param sourcePrefix Source directory prefix
 * @param targetPrefix Target directory prefix
 * @returns Array of destination key paths
 */
export async function copyDirectoryInR2(
  sourcePrefix: string,
  targetPrefix: string,
): Promise<string[]> {
  // List all objects in the source directory
  const objectKeys = await listObjectsInR2(sourcePrefix);

  if (objectKeys.length === 0) {
    throw new Error(
      `No objects found in the source directory: ${sourcePrefix}`,
    );
  }

  // Copy each object to the target directory
  const copyPromises = objectKeys.map((sourceKey) => {
    // Remove the source prefix and add the target prefix
    const relativePath = sourceKey.slice(sourcePrefix.length);
    const targetKey = `${targetPrefix}${relativePath}`;

    return copyObjectInR2(sourceKey, targetKey);
  });

  return await Promise.all(copyPromises);
}

/**
 * Upload a file to the assets R2 bucket
 * @param file File data to upload
 * @param contentType MIME type of the file
 * @param key Object key path
 * @returns Key path of the uploaded file
 */
export async function uploadToAssetsR2(
  file: Uint8Array | Buffer,
  contentType: string,
  key: string,
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.R2_ASSETS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  return key;
}

/**
 * Delete all objects with a given prefix from R2
 * @param prefix Prefix of objects to delete
 */
export async function deleteFromR2(prefix: string): Promise<void> {
  // List all objects with the prefix
  const objects = await listObjectsInR2(prefix);

  // Delete each object
  for (const key of objects) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
  }
}
