#!/usr/bin/env node

/**
 * Test tRPC endpoint with correct format to match frontend
 */

async function testTRPCFormat() {
    const TEST_HTML = `<!DOCTYPE html>
<html><head><title>tRPC Test</title></head>
<body><h1>tRPC Test ${Date.now()}</h1></body></html>`;

    // This matches what the frontend sends to tRPC
    const payload = {
        files: [{
            path: 'index.html',
            content: Buffer.from(TEST_HTML, 'utf-8').toString('base64'),
            contentType: 'text/html'
        }]
    };

    console.log('🧪 Testing tRPC Endpoint with Correct Format...\n');

    for (let i = 1; i <= 3; i++) {
        const startTime = Date.now();
        
        try {
            console.log(`🚀 tRPC Test ${i}/3 - Sending request...`);
            
            // Try different tRPC formats
            const formats = [
                // Format 1: Standard tRPC batch format
                { "0": { "json": payload } },
                // Format 2: Single request format  
                payload,
                // Format 3: Direct input format
                { json: payload }
            ];
            
            for (let formatIndex = 0; formatIndex < formats.length; formatIndex++) {
                const testStartTime = Date.now();
                const currentFormat = formats[formatIndex];
                
                console.log(`  📦 Format ${formatIndex + 1}: ${JSON.stringify(currentFormat).substring(0, 100)}...`);
                
                try {
                    const response = await fetch('https://www.binbody.com/api/trpc/artifact.createPreview', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            // Add headers that frontend might send
                            'x-trpc-source': 'nextjs-react',
                        },
                        body: JSON.stringify(currentFormat)
                    });
                    
                    const duration = Date.now() - testStartTime;
                    const responseText = await response.text();
                    
                    console.log(`    ⏱️  Format ${formatIndex + 1}: ${duration}ms - Status: ${response.status}`);
                    
                    if (response.ok) {
                        const data = JSON.parse(responseText);
                        console.log(`    ✅ SUCCESS with Format ${formatIndex + 1}!`);
                        console.log(`    📄 Response:`, JSON.stringify(data).substring(0, 200));
                        return; // Success! Stop testing other formats
                    } else {
                        console.log(`    ❌ Format ${formatIndex + 1} failed: ${responseText.substring(0, 150)}`);
                    }
                    
                } catch (formatError) {
                    const duration = Date.now() - testStartTime;
                    console.log(`    💥 Format ${formatIndex + 1} ERROR after ${duration}ms:`, formatError.message);
                }
            }
            
            console.log('');
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`💥 Test ${i} OUTER ERROR after ${duration}ms:`, error.message);
        }
        
        // Wait between tests
        if (i < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

// Also test the exact tRPC batch format that Next.js uses
async function testTRPCBatch() {
    console.log('\n🔬 Testing tRPC Batch Format (like Next.js)...\n');
    
    const TEST_HTML = `<!DOCTYPE html>
<html><head><title>Batch Test</title></head>
<body><h1>Batch ${Date.now()}</h1></body></html>`;

    // Exact format that tRPC batch requests use
    const batchPayload = {
        "0": {
            "json": {
                "files": [{
                    "path": "index.html", 
                    "content": Buffer.from(TEST_HTML, 'utf-8').toString('base64'),
                    "contentType": "text/html"
                }]
            }
        }
    };

    const startTime = Date.now();
    
    try {
        const response = await fetch('https://www.binbody.com/api/trpc/artifact.createPreview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-trpc-source': 'nextjs-react',
            },
            body: JSON.stringify(batchPayload)
        });
        
        const duration = Date.now() - startTime;
        const responseText = await response.text();
        
        console.log(`⏱️  Batch request: ${duration}ms - Status: ${response.status}`);
        console.log(`📄 Response preview: ${responseText.substring(0, 300)}`);
        
        if (response.ok) {
            console.log('✅ tRPC Batch format works!');
        } else {
            console.log('❌ tRPC Batch format failed');
        }
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`💥 Batch test ERROR after ${duration}ms:`, error.message);
    }
}

async function main() {
    await testTRPCFormat();
    await testTRPCBatch();
    
    console.log('\n✨ tRPC format tests completed!');
    console.log('💡 This will help identify the correct request format for the frontend.');
}

main().catch(console.error);