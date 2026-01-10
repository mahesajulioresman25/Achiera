import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
    console.log('🔍 Comprehensive Database Verification\n');
    console.log('='.repeat(60));

    try {
        // Test 1: Check Brand
        console.log('\n📦 Checking Brand "rasa-ibu"...');
        const brand = await prisma.brand.findUnique({
            where: { slug: 'rasa-ibu' },
            include: { brandConfig: true }
        });

        if (!brand) {
            console.log('❌ Brand NOT FOUND');
        } else {
            console.log('✅ Brand FOUND');
            console.log(`   ID: ${brand.id}`);
            console.log(`   Name: ${brand.name}`);
            console.log(`   Config: ${brand.brandConfig ? '✅ EXISTS' : '❌ MISSING'}`);
            if (brand.brandConfig) {
                console.log(`   Title: ${brand.brandConfig.publicTitle || 'N/A'}`);
            }
        }

        // Test 2: Check Users
        console.log('\n👤 Checking Users...');
        const userCount = await prisma.user.count();
        console.log(`   Total Users: ${userCount}`);

        if (userCount > 0) {
            const sampleUsers = await prisma.user.findMany({
                take: 3,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    globalRole: true,
                    passwordHash: true
                }
            });
            console.log('   Sample Users:');
            sampleUsers.forEach(u => {
                console.log(`   - ${u.email} (${u.globalRole}) [Password: ${u.passwordHash ? 'SET' : 'MISSING'}]`);
            });
        }

        // Test 3: Check Products
        console.log('\n🛒 Checking Products...');
        const productCount = await prisma.frozenProduct.count({
            where: { category: { brandId: brand?.id } }
        });
        console.log(`   Products for Rasa Ibu: ${productCount}`);

        // Test 4: Connection Info
        console.log('\n🔗 Database Connection Info:');
        const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
        try {
            const url = new URL(dbUrl);
            console.log(`   Host: ${url.hostname}`);
            console.log(`   Port: ${url.port}`);
            console.log(`   Database: ${url.pathname.substring(1)}`);
        } catch (e) {
            console.log(`   URL: ${dbUrl.substring(0, 30)}...`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Verification Complete\n');

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDatabase();
