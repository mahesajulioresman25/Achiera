import { signIn } from 'next-auth/react';

// This simulates what the signin page does
async function testSignIn() {
    console.log('🔐 Testing SignIn Flow\n');
    console.log('='.repeat(60));

    const email = 'mahesajulioresman25@achiera.com';
    const password = 'Mahesa2005@';

    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n🚀 Calling signIn...\n');

    try {
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        console.log('📊 Result:', JSON.stringify(result, null, 2));

        if (result?.error) {
            console.log('\n❌ LOGIN FAILED');
            console.log(`Error: ${result.error}`);
            console.log(`Status: ${result.status}`);
        } else if (result?.ok) {
            console.log('\n✅ LOGIN SUCCESSFUL');
            console.log(`URL: ${result.url}`);
        }

    } catch (error: any) {
        console.error('\n❌ EXCEPTION:', error.message);
        console.error('Stack:', error.stack);
    }

    console.log('\n' + '='.repeat(60));
}

testSignIn();
