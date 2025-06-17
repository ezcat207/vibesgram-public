import { type NextRequest, NextResponse } from 'next/server';
import { z } from "zod";

// 定义请求数据和Browserless响应的Schema
const screenshotRequestSchema = z.object({
  url: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const browserlessResponseSchema = z.object({
  data: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // 安全地解析请求数据
    const requestData = screenshotRequestSchema.parse(await request.json());

    // 调用外部浏览器服务
    const browserlessResponse = await fetch('https://chrome.browserless.io/screenshot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BROWSERLESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: requestData.url,
        options: {
          viewport: { width: requestData.width, height: requestData.height },
          encoding: 'base64' // 请求 base64 编码的图片数据
        }
      })
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error(`Browserless API error: ${browserlessResponse.status} - ${errorText}`);
      return new NextResponse(`Screenshot service error: ${errorText}`, { status: browserlessResponse.status });
    }

    // 安全地解析Browserless响应
    const browserlessResult = browserlessResponseSchema.parse(await browserlessResponse.json());

    // 将数据封装成当前系统期望的格式并返回
    return NextResponse.json({ success: true, data: browserlessResult.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error in screenshot API:', error.errors);
      return new NextResponse(`Invalid request data: ${error.errors.map(e => e.message).join(', ')}`, { status: 400 });
    }
    console.error('Error in screenshot API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 