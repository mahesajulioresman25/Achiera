import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalVerification() {
    console.log('\n🔍 FINAL VERIFICATION\n');
    console.log('='.repeat(60));

    // 1. Check brands
    const brands = await prisma.brand.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' }
    });

    console.log('\n✅ Brands in Database:');
    brands.forEach((b, i) => {
        console.log(`${i + 1}. ${b.name}`);
        console.log(`   Slug: "${b.slug}"`);
        console.log(`   Expected URL: /dashboard/${b.slug}`);
        console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n📋 WHAT TO DO NOW:\n');
    console.log('1. CLEAR YOUR BROWSER SESSION:');
    console.log('   Option A (Easiest):');
    console.log('   - Open NEW Incognito/Private window (Ctrl+Shift+N)');
    console.log('   - Go to: http://localhost:3000/login');
    console.log('');
    console.log('   Option B (Manual):');
    console.log('   - Press F12 (DevTools)');
    console.log('   - Go to Application tab');
    console.log('   - Click Cookies → localhost:3000');
    console.log('   - Right-click → Clear all');
    console.log('   - Close DevTools');
    console.log('   - Refresh page (Ctrl+Shift+R)');
    console.log('');
    console.log('2. LOGIN AGAIN:');
    console.log('   - Enter your OWNER credentials');
    console.log('   - Click Sign In');
    console.log('');
    console.log('3. TEST NAVIGATION:');
    console.log('   - You should see 2 brands: Achiera & RASA IBU');
    console.log('   - Click "Achiera" → should go to /dashboard/achiera');
    console.log('   - Click "RASA IBU" → should go to /dashboard/rasa-ibu');
    console.log('');
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT:');
    console.log('If you are still in the SAME browser window/tab,');
    console.log('the OLD session is still active!');
    console.log('You MUST use Incognito or clear cookies manually.');
    console.log('\n');

    await prisma.$disconnect();
}

finalVerification();
