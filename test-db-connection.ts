// Enhanced Database Connection Test with Better Error Handling
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

// Manually load .env file
const envPath = join(process.cwd(), '.env');
try {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        }
    }
    console.log('✅ Loaded .env file\n');
} catch (error) {
    console.error('❌ Failed to load .env file:', error);
}

console.log('📋 Environment Check:');
const dbUrl = process.env.DATABASE_URL;
console.log(`   DATABASE_URL: ${dbUrl ? '✅ Set' : '❌ Not set'}`);
if (dbUrl) {
    const isSupabase = dbUrl.includes('supabase') || dbUrl.includes('aws');
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    const masked = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
    console.log(`   Type: ${isSupabase ? '🌐 Supabase/Cloud' : isLocal ? '🏠 Local' : '❓ Unknown'}`);
    console.log(`   URL: ${masked}`);
}
console.log('');

const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function testConnection() {
    console.log('🔍 Testing Database Connection...\n');

    try {
        console.log('1️⃣ Attempting to connect...');
        const startTime = Date.now();

        await prisma.$connect();

        const connectTime = Date.now() - startTime;
        console.log(`✅ Connected successfully! (${connectTime}ms)\n`);

        console.log('2️⃣ Testing query execution...');
        const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()` as any[];
        console.log('✅ Query successful!');
        if (result && result.length > 0) {
            console.log(`   Database: ${result[0].current_database}`);
            console.log(`   User: ${result[0].current_user}`);
            const version = result[0].version.split(' ');
            console.log(`   PostgreSQL: ${version[1]}`);
        }
        console.log('');

        console.log('3️⃣ Checking tables...');
        const brandCount = await prisma.brand.count();
        const userCount = await prisma.user.count();
        console.log('✅ Tables accessible!');
        console.log(`   Brands: ${brandCount}`);
        console.log(`   Users: ${userCount}`);
        console.log('');

        console.log('═══════════════════════════════════════');
        console.log('🎉 DATABASE CONNECTION SUCCESSFUL!');
        console.log('═══════════════════════════════════════\n');

        return true;
    } catch (error: any) {
        console.error('\n❌ CONNECTION FAILED!\n');
        console.error('Full Error:', error);
        console.error('\nError Code:', error.code);
        console.error('Error Message:', error.message);

        if (error.code === 'P1001') {
            console.error('\n💡 Cannot reach database server:');
            console.error('   - Check if Supabase project is active/paused');
            console.error('   - Verify internet connection');
            console.error('   - Check if project URL is correct');
            console.error('   - Try accessing Supabase dashboard');
        } else if (error.code === 'P1000') {
            console.error('\n💡 Authentication failed:');
            console.error('   - Verify password is correct');
            console.error('   - Check if password encoding is correct');
            console.error('   - Verify username is "postgres"');
        } else if (error.code === 'P1003') {
            console.error('\n💡 Database does not exist:');
            console.error('   - Verify database name is "postgres"');
            console.error('   - Check Supabase project settings');
        }

        return false;
    } finally {
        await prisma.$disconnect();
        console.log('🔌 Disconnected\n');
    }
}

testConnection()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
