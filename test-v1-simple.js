#!/usr/bin/env node

/**
 * Simple test of the V1 API to measure detailed timing
 */

async function testV1Multiple() {
    const TEST_HTML = `<!DOCTYPE html>
<html><head><title>Test</title></head>
<body><h1>Test ${Date.now()}</h1></body></html>`;

    const payload = {
        files: [{
            path: 'index.html',
            content: Buffer.from(TEST_HTML, 'utf-8').toString('base64'),
            contentType: 'text/html'
        }]
    };

    console.log('🧪 Testing V1 API Multiple Times...\n');

    for (let i = 1; i <= 3; i++) {
        const startTime = Date.now();
        
        try {
            console.log(`🚀 Test ${i}/3 - Sending request...`);
            
            const response = await fetch('https://www.binbody.com/api/v1/preview/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            const duration = Date.now() - startTime;
            const responseText = await response.text();
            
            console.log(`⏱️  Test ${i}: ${duration}ms - Status: ${response.status}`);
            
            if (response.ok) {
                const data = JSON.parse(responseText);
                console.log(`✅ Success: Preview ID ${data.data?.previewId}`);
            } else {
                console.log(`❌ Failed: ${responseText.substring(0, 100)}`);
            }
            
            console.log('');
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`💥 Test ${i} ERROR after ${duration}ms:`, error.message);
            console.log('');
        }
        
        // Wait 1 second between tests
        if (i < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('🏁 All tests completed!');
}

testV1Multiple().catch(console.error);