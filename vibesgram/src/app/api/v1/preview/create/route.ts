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
  try {
    const body: unknown = await req.json();
    let parsedBody: z.infer<typeof createPreviewSchema>;
    // 兼容直接传html+options的用法
    if (typeof body === 'object' && body !== null && 'html' in body) {
      const html = (body as { html: string }).html;
      parsedBody = { files: [createPreviewFileFromHtml(html)] };
    } else {
      parsedBody = createPreviewSchema.parse(body);
    }
    const files = parsedBody.files;
    // 计算总大小
    const totalSize = files.reduce((sum: number, file) => sum + Math.ceil(file.content.length * 0.75), 0);
    // 限制最大大小（如需更严格可用常量）
    if (totalSize > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, message: '文件总大小超限' }, { status: 413 });
    }
    // 检查index.html
    if (!files.some((f) => f.path === 'index.html')) {
      return NextResponse.json({ success: false, message: '缺少index.html' }, { status: 400 });
    }
    // 生成唯一ID
    const previewId = randomUUID().slice(0, 12);
    // 检查ID冲突
    const exist = await db.preview.findUnique({ where: { id: previewId } });
    if (exist) {
      return NextResponse.json({ success: false, message: 'ID冲突，请重试' }, { status: 400 });
    }
    // 上传到R2
    await Promise.all(files.map(async (file) => {
      const previewPath = `${getPreviewStoragePath(previewId)}/${file.path}`;
      const fileBuffer = Buffer.from(file.content, 'base64');
      await uploadToR2(fileBuffer, file.contentType, previewPath);
    }));
    // 过期时间
    const expiresAt = new Date(Date.now() + PREVIEW_EXPIRES_MS);
    // 写入数据库
    await db.preview.create({
      data: {
        id: previewId,
        fileSize: totalSize,
        fileCount: files.length,
        expiresAt,
      },
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
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: '参数校验失败', errors: err.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: '服务器错误', error: String(err) }, { status: 500 });
  }
} 