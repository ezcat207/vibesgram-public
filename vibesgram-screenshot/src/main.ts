import * as dotenv from 'dotenv';
import * as http from 'http';
import { chromium } from 'playwright';
import {
    ErrorResponseSchema,
    ScreenshotRequestSchema,
    ScreenshotResponseSchema,
    type ScreenshotRequest
} from './types';

// Load environment variables from .env file
dotenv.config();

const DEFAULT_PORT = 3000;
const PORT = parseInt(process.env.PORT || `${DEFAULT_PORT}`, 10);
const CLIENT_PORT = parseInt(process.env.CLIENT_PORT || `${PORT}`, 10);

async function serve(port: number = PORT) {
    console.log('Starting screenshot service...');
    const server = http.createServer(async (req, res) => {
        const requestId = Math.random().toString(36).substring(7);
        console.log(`[${requestId}] Incoming ${req.method} request to ${req.url}`);

        if (req.method === 'POST' && req.url === '/screenshot') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const parsedRequest = ScreenshotRequestSchema.safeParse(JSON.parse(body));

                    if (!parsedRequest.success) {
                        console.warn(`[${requestId}] Request validation failed:`, parsedRequest.error);
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(ErrorResponseSchema.parse({
                            error: 'Invalid request',
                            details: parsedRequest.error.message
                        })));
                        return;
                    }

                    const { url, width, height } = parsedRequest.data;
                    console.log(`[${requestId}] 🎯 Target URL: ${url} (${width}x${height})`);
                    console.log(`[${requestId}] Launching browser for ${url}...`);
                    const browser = await chromium.launch({
                        headless: true
                    });

                    try {
                        console.log(`[${requestId}] Creating new page for ${url}...`);
                        const page = await browser.newPage();
                        await page.setViewportSize({ width, height });

                        console.log(`[${requestId}] Navigating to ${url}...`);
                        await page.goto(url, {
                            waitUntil: "networkidle"
                        });

                        await page.waitForLoadState('domcontentloaded');
                        await page.waitForTimeout(1000);

                        console.log(`[${requestId}] Taking screenshot of ${url}...`);
                        const screenshot = await page.screenshot({
                            type: 'png',
                            fullPage: false
                        });

                        console.log(`[${requestId}] Screenshot of ${url} captured successfully`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(ScreenshotResponseSchema.parse({
                            success: true,
                            data: screenshot.toString('base64')
                        })));

                    } finally {
                        console.log(`[${requestId}] Closing browser for ${url}`);
                        await browser.close();
                    }
                } catch (error) {
                    console.error(`[${requestId}] Screenshot failed:`, error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(ErrorResponseSchema.parse({
                        error: 'Screenshot failed',
                        details: error instanceof Error ? error.message : String(error)
                    })));
                }
            });
        } else {
            console.warn(`[${requestId}] Invalid endpoint requested: ${req.method} ${req.url}`);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(ErrorResponseSchema.parse({ error: 'Not found' })));
        }
    });

    server.listen(port, () => {
        console.log(`✨ Screenshot service running at http://localhost:${port}`);
    });
}

async function client() {
    const url = process.argv[3];
    const width = parseInt(process.argv[4] || '900', 10);
    const height = parseInt(process.argv[5] || '1200', 10);

    if (!url) {
        console.log('Usage: npm start client <url> [width] [height]');
        console.log('Example: npm start client https://example.com 1024 768');
        return;
    }

    const request: ScreenshotRequest = { url, width, height };
    console.log(`🎯 Requesting screenshot for URL: ${url} (${width}x${height})`);

    try {
        const response = await fetch(`http://localhost:${CLIENT_PORT}/screenshot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ Error for ${url}:`, data.error);
            if (data.details) {
                console.error('Details:', data.details);
            }
            return;
        }

        // Create data directory if it doesn't exist
        const fs = require('fs');
        const path = require('path');
        const dataDir = path.join(__dirname, '../data');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Generate timestamp-based filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = path.join(dataDir, `screenshot-${width}x${height}-${timestamp}.png`);

        // Convert base64 to buffer and save
        const buffer = Buffer.from(data.data, 'base64');
        fs.writeFileSync(filename, buffer);

        console.log(`✨ Screenshot of ${url} successful!`);
        console.log(`📸 Screenshot saved to: ${filename}`);
        console.log('Size:', buffer.length, 'bytes');
    } catch (error) {
        console.error(`❌ Failed to connect to screenshot service for ${url}:`, error);
    }
}

async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'serve':
            await serve();
            break;
        case 'client':
            await client();
            break;
        default:
            console.log('invalid command');
            console.log('Available commands: serve, client');
    }
}

main();