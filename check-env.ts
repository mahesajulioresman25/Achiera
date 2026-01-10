import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEnv() {
    console.log('🔍 Environment Variables Check\n');
    console.log('='.repeat(60));

    console.log('\n📋 Critical Environment Variables:');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING'}`);
    console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ SET' : '❌ MISSING'}`);
    console.log(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ NOT SET'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

    if (!process.env.NEXTAUTH_SECRET) {
        console.log('\n⚠️  WARNING: NEXTAUTH_SECRET is missing!');
        console.log('This will cause authentication to fail.');
        console.log('\nTo fix, add to .env:');
        console.log('NEXTAUTH_SECRET="your-secret-key-here"');
        console.log('\nGenerate a secret with:');
        console.log('openssl rand -base64 32');
    }

    // Test database connection
    console.log('\n🔗 Testing Database Connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ Database connected - ${userCount} users found`);
    } catch (error: any) {
        console.log(`❌ Database connection failed: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));

    await prisma.$disconnect();
}

checkEnv();
