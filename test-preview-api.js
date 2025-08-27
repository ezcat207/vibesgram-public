#!/usr/bin/env node

/**
 * Direct test of the createPreview API to isolate the root cause
 * Run: node test-preview-api.js
 */

const TEST_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Preview</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a test preview created at ${new Date().toISOString()}</p>
</body>
</html>`;

async function testCreatePreview() {
    console.log('🧪 Testing createPreview API...\n');
    
    const startTime = Date.now();
    
    // Create test payload
    const payload = {
        files: [{
            path: 'index.html',
            content: Buffer.from(TEST_HTML, 'utf-8').toString('base64'),
            contentType: 'text/html'
        }]
    };
    
    console.log('📦 Test payload created:', {
        fileCount: payload.files.length,
        fileName: payload.files[0].path,
        contentSize: payload.files[0].content.length,
        actualHtmlSize: TEST_HTML.length
    });
    
    try {
        console.log('🚀 Sending request to API...');
        console.log('⏰ Start time:', new Date().toISOString());
        
        const response = await fetch('https://www.binbody.com/api/trpc/artifact.createPreview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "0": {
                    "json": payload
                }
            })
        });
        
        const duration = Date.now() - startTime;
        console.log(`⏱️  Response received after ${duration}ms`);
        console.log('📊 Response status:', response.status, response.statusText);
        
        const responseText = await response.text();
        console.log('📄 Response body:', responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ SUCCESS!', {
                duration: `${duration}ms`,
                previewId: data[0]?.result?.data?.json?.preview?.id,
                timing: duration > 4000 ? '🐌 SLOW (>4s)' : duration > 1000 ? '⚠️ MEDIUM' : '⚡ FAST'
            });
            
            if (duration > 4000) {
                console.log('🔍 ANALYSIS: Request took >4s, this confirms the timing issue');
                console.log('💡 Check server logs for database connection timing');
            }
        } else {
            console.log('❌ FAILED:', {
                status: response.status,
                duration: `${duration}ms`,
                body: responseText.substring(0, 500)
            });
        }
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log('💥 ERROR after', duration, 'ms:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 Fix: Make sure the server is running with "pnpm run dev" or "pnpm run start"');
        }
    }
}

// Alternative test using the v1 API endpoint
async function testV1API() {
    console.log('\n🧪 Testing v1 preview API...\n');
    
    const startTime = Date.now();
    
    const payload = {
        files: [{
            path: 'index.html',
            content: Buffer.from(TEST_HTML, 'utf-8').toString('base64'),
            contentType: 'text/html'
        }]
    };
    
    try {
        console.log('🚀 Sending request to v1 API...');
        
        const response = await fetch('https://www.binbody.com/api/v1/preview/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const duration = Date.now() - startTime;
        console.log(`⏱️  V1 API response after ${duration}ms`);
        
        const responseText = await response.text();
        console.log('📊 V1 Response:', response.status, responseText.substring(0, 200));
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log('💥 V1 API ERROR after', duration, 'ms:', error.message);
    }
}

async function main() {
    console.log('🔬 Preview API Test Suite\n');
    console.log('🎯 This will help identify the root cause of the 4.3s delay\n');
    
    // Test tRPC endpoint
    await testCreatePreview();
    
    // Test v1 endpoint  
    await testV1API();
    
    console.log('\n✨ Test completed. Check the timing results above.');
    console.log('💡 If both APIs show >4s, the issue is in the backend logic.');
    console.log('🔍 Check server console for detailed timing logs.');
}

main().catch(console.error);