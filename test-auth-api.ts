// Test script to directly call the NextAuth credentials endpoint
async function testAuthAPI() {
    console.log('🔐 Testing NextAuth API Directly\n');
    console.log('='.repeat(60));

    const email = 'mahesajulioresman25@achiera.com';
    const password = 'Mahesa2005@';

    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n🚀 Calling /api/auth/callback/credentials...\n');

    try {
        const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email,
                password,
                redirect: 'false',
                json: 'true',
            }),
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log(`📄 Response Body:\n${text}\n`);

        try {
            const json = JSON.parse(text);
            console.log('📋 Parsed JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('⚠️  Response is not JSON');
        }

    } catch (error: any) {
        console.error('\n❌ EXCEPTION:', error.message);
    }

    console.log('\n' + '='.repeat(60));
}

testAuthAPI();
