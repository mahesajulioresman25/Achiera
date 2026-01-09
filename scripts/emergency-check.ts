import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function emergencyCheck() {
    console.log('\n🚨 EMERGENCY DIAGNOSTIC\n');
    console.log('='.repeat(70));

    try {
        // 1. Check database connection
        console.log('\n1. Testing database connection...');
        await prisma.$connect();
        console.log('   ✅ Database connected');

        // 2. Check brands
        console.log('\n2. Checking brands...');
        const brands = await prisma.brand.findMany({
            select: { id: true, name: true, slug: true }
        });
        console.log(`   ✅ Found ${brands.length} brands:`);
        brands.forEach(b => {
            console.log(`      - ${b.name} (slug: "${b.slug}")`);
        });

        // 3. Check if Rasa Ibu has data
        console.log('\n3. Checking Rasa Ibu data...');
        const rasaIbu = brands.find(b => b.slug === 'rasa-ibu');
        if (rasaIbu) {
            const orderCount = await prisma.order.count({ where: { brandId: rasaIbu.id } });
            console.log(`   ✅ Rasa Ibu has ${orderCount} orders`);
        } else {
            console.log('   ❌ Rasa Ibu brand not found!');
        }

        // 4. Check users
        console.log('\n4. Checking users...');
        const users = await prisma.user.findMany({
            select: { email: true, globalRole: true }
        });
        console.log(`   ✅ Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`      - ${u.email} (${u.globalRole})`);
        });

        console.log('\n' + '='.repeat(70));
        console.log('\n✅ DATABASE IS HEALTHY\n');
        console.log('If dashboard still not working, the problem is in:');
        console.log('1. Code/routing issue');
        console.log('2. Browser cache issue');
        console.log('3. Next.js build cache issue');
        console.log('\nRecommendation: Delete .next folder and restart dev server');

    } catch (error) {
        console.error('\n❌ DATABASE ERROR:', error);
        console.log('\nDatabase is NOT accessible!');
    } finally {
        await prisma.$disconnect();
    }
}

emergencyCheck();
