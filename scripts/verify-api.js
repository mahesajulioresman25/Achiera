
// Native fetch is supported in Node 18+

const BASE_URL = 'http://localhost:3000';

async function main() {
    console.log('🔍 Verifying Public API Endpoints...');

    // 1. List Templates
    try {
        console.log('\n--- GET /api/public/mockup-templates ---');
        const res = await fetch(`${BASE_URL}/api/public/mockup-templates?brandSlug=merch`);
        const data = await res.json();

        if (data.templates && data.templates.length > 0) {
            console.log('✅ Success! Found', data.templates.length, 'templates.');
            console.log('   First Template:', data.templates[0].displayName);

            // 2. Get Detail
            const firstId = data.templates[0].id;
            console.log(`\n--- GET /api/public/mockup-template?templateId=${firstId} ---`);
            const resDetail = await fetch(`${BASE_URL}/api/public/mockup-template?templateId=${firstId}`);
            const detail = await resDetail.json();

            if (detail.variants && detail.variants.length > 0) {
                console.log('✅ Success! Template Detail loaded.');
                console.log('   Variants:', detail.variants.length);
                console.log('   First Variant:', detail.variants[0].name);
                console.log('   Safe Zone:', detail.variants[0].safeZoneX, detail.variants[0].safeZoneY);
            } else {
                console.error('❌ Failed: No variants found in detail.', detail);
            }

        } else {
            console.error('❌ Failed: No templates found.', data);
        }

    } catch (error) {
        console.error('❌ API Request Failed:', error.message);
        console.log('   (Make sure npm run dev is running on port 3000)');
    }
}

main();
