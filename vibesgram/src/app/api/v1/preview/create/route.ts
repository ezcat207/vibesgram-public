import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createPreviewSchema } from '@/server/api/routers/artifact/schema';
import { z } from 'zod';
import { db } from '@/server/db';
import { getPreviewStoragePath, getPreviewUrl } from '@/lib/paths';
import { uploadToR2 } from '@/lib/storage';
import { randomUUID } from 'crypto';
import { PREVIEW_EXPIRES_MS } from '@/lib/const';
// 注意：utils.ts为前端代码，需将核心逻辑迁移/复制到API可用的utils/server下，暂时内联实现wrapHtmlContent和createPreviewFileFromHtml

function wrapHtmlContent(htmlContent: string): string {
  if (htmlContent.includes('<html')) return htmlContent;
  return `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Preview</title>\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`;
}
function createPreviewFileFromHtml(html: string): z.infer<typeof createPreviewSchema>["files"][number] {
  const finalHtml = wrapHtmlContent(html);
  const base64Content = Buffer.from(finalHtml, 'utf-8').toString('base64');
  return {
    path: 'index.html',
    content: base64Content,
    contentType: 'text/html',
  };
}

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[Preview API ${requestId}] Starting preview creation request`);
  
  try {
    const parseStart = Date.now();
    const body: unknown = await req.json();
    const parseDuration = Date.now() - parseStart;
    console.log(`[Preview API ${requestId}] Request body parsed in ${parseDuration}ms`);
    
    let parsedBody: z.infer<typeof createPreviewSchema>;
    // 兼容直接传html+options的用法
    if (typeof body === 'object' && body !== null && 'html' in body) {
      console.log(`[Preview API ${requestId}] Processing HTML input`);
      const html = (body as { html: string }).html;
      parsedBody = { files: [createPreviewFileFromHtml(html)] };
    } else {
      console.log(`[Preview API ${requestId}] Processing files input`);
      parsedBody = createPreviewSchema.parse(body);
    }
    
    const files = parsedBody.files;
    console.log(`[Preview API ${requestId}] Processing ${files.length} files`);
    
    // 计算总大小
    const totalSize = files.reduce((sum: number, file) => sum + Math.ceil(file.content.length * 0.75), 0);
    console.log(`[Preview API ${requestId}] Total size: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`);
    
    // 限制最大大小（如需更严格可用常量）
    if (totalSize > 10 * 1024 * 1024) {
      console.warn(`[Preview API ${requestId}] File size exceeds limit: ${totalSize} bytes`);
      return NextResponse.json({ success: false, message: '文件总大小超限' }, { status: 413 });
    }
    
    // 检查index.html
    if (!files.some((f) => f.path === 'index.html')) {
      console.warn(`[Preview API ${requestId}] Missing index.html file`);
      return NextResponse.json({ success: false, message: '缺少index.html' }, { status: 400 });
    }
    
    // 生成唯一ID
    const previewId = randomUUID().slice(0, 12);
    console.log(`[Preview API ${requestId}] Generated preview ID: ${previewId}`);
    
    // 检查ID冲突
    const dbCheckStart = Date.now();
    const exist = await db.preview.findUnique({ where: { id: previewId } });
    const dbCheckDuration = Date.now() - dbCheckStart;
    console.log(`[Preview API ${requestId}] DB ID check completed in ${dbCheckDuration}ms, exists: ${!!exist}`);
    
    if (exist) {
      console.warn(`[Preview API ${requestId}] Preview ID collision: ${previewId}`);
      return NextResponse.json({ success: false, message: 'ID冲突，请重试' }, { status: 400 });
    }
    
    // 上传到R2
    const uploadStart = Date.now();
    console.log(`[Preview API ${requestId}] Starting R2 uploads for ${files.length} files`);
    
    await Promise.all(files.map(async (file, index) => {
      const previewPath = `${getPreviewStoragePath(previewId)}/${file.path}`;
      const fileBuffer = Buffer.from(file.content, 'base64');
      console.log(`[Preview API ${requestId}] Uploading file ${index + 1}/${files.length}: ${file.path} (${fileBuffer.length} bytes)`);
      
      try {
        await uploadToR2(fileBuffer, file.contentType, previewPath);
        console.log(`[Preview API ${requestId}] Successfully uploaded: ${file.path}`);
      } catch (error) {
        console.error(`[Preview API ${requestId}] Failed to upload ${file.path}:`, error);
        throw error;
      }
    }));
    
    const uploadDuration = Date.now() - uploadStart;
    console.log(`[Preview API ${requestId}] All R2 uploads completed in ${uploadDuration}ms`);
    
    // 过期时间
    const expiresAt = new Date(Date.now() + PREVIEW_EXPIRES_MS);
    
    // 写入数据库
    const dbWriteStart = Date.now();
    await db.preview.create({
      data: {
        id: previewId,
        fileSize: totalSize,
        fileCount: files.length,
        expiresAt,
      },
    });
    const dbWriteDuration = Date.now() - dbWriteStart;
    console.log(`[Preview API ${requestId}] DB write completed in ${dbWriteDuration}ms`);
    
    const totalDuration = Date.now() - requestStart;
    console.log(`[Preview API ${requestId}] Preview creation completed successfully in ${totalDuration}ms`, {
      previewId,
      fileCount: files.length,
      totalSize,
      timings: {
        parse: parseDuration,
        dbCheck: dbCheckDuration,
        upload: uploadDuration,
        dbWrite: dbWriteDuration,
        total: totalDuration,
      }
    });
    
    // 返回响应
    return NextResponse.json({
      success: true,
      data: {
        previewId,
        previewUrl: getPreviewUrl(previewId),
        expiresAt: expiresAt.toISOString(),
        fileSize: totalSize,
        fileCount: files.length,
      },
    });
  } catch (err) {
    const totalDuration = Date.now() - requestStart;
    console.error(`[Preview API ${requestId}] Preview creation failed after ${totalDuration}ms:`, {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      type: err?.constructor?.name,
    });
    
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: '参数校验失败', errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: '服务器错误', error: String(err) }, { status: 500 });
  }
} 