#!/usr/bin/env node

/**
 * Test to see if our database optimizations are actually deployed
 */

async function testBothAPIs() {
    const TEST_HTML = `<!DOCTYPE html>
<html><head><title>DB Timing Test</title></head>
<body><h1>DB Test ${Date.now()}</h1></body></html>`;

    const payload = {
        files: [{
            path: 'index.html',
            content: Buffer.from(TEST_HTML, 'utf-8').toString('base64'),
            contentType: 'text/html'
        }]
    };

    console.log('🔬 Testing Both APIs for Database Timing Comparison\n');

    // Test V1 API
    console.log('📊 Testing V1 API (should be fast ~900ms)...');
    const v1Start = Date.now();
    try {
        const v1Response = await fetch('https://www.binbody.com/api/v1/preview/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const v1Duration = Date.now() - v1Start;
        const v1Text = await v1Response.text();
        
        console.log(`✅ V1 API: ${v1Duration}ms - Status: ${v1Response.status}`);
        if (v1Response.ok) {
            const v1Data = JSON.parse(v1Text);
            console.log(`   Preview ID: ${v1Data.data?.previewId}`);
        }
    } catch (error) {
        const v1Duration = Date.now() - v1Start;
        console.log(`❌ V1 API failed after ${v1Duration}ms:`, error.message);
    }

    console.log('');

    // Test tRPC API with simple format to see basic timing
    console.log('📊 Testing tRPC API (might still be slow ~4500ms)...');
    const trpcStart = Date.now();
    try {
        // Use the simplest format that gives us server error (so we reach the backend)
        const trpcPayload = { json: payload };
        
        const trpcResponse = await fetch('https://www.binbody.com/api/trpc/artifact.createPreview', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-trpc-source': 'nextjs-react' 
            },
            body: JSON.stringify(trpcPayload)
        });
        
        const trpcDuration = Date.now() - trpcStart;
        const trpcText = await trpcResponse.text();
        
        console.log(`📊 tRPC API: ${trpcDuration}ms - Status: ${trpcResponse.status}`);
        console.log(`   Response preview: ${trpcText.substring(0, 100)}...`);
        
        // Analysis
        if (trpcDuration > 4000) {
            console.log('🚨 ANALYSIS: tRPC is still slow (>4s) - database optimization not applied to tRPC!');
        } else if (trpcDuration < 1500) {
            console.log('✅ ANALYSIS: tRPC is fast (<1.5s) - database optimization working!');
        } else {
            console.log('⚠️  ANALYSIS: tRPC is medium speed - partial improvement');
        }
        
    } catch (error) {
        const trpcDuration = Date.now() - trpcStart;
        console.log(`❌ tRPC API failed after ${trpcDuration}ms:`, error.message);
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('If V1 is fast but tRPC is slow, the database optimization only applies to V1.');
    console.log('The issue is likely that tRPC and V1 use different database connection paths.');
}

testBothAPIs().catch(console.error);