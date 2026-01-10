import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
    const email = 'mahesajulioresman25@achiera.com';
    const password = 'Mahesa2005@';

    console.log('🔐 Testing Login Credentials\n');
    console.log('='.repeat(60));

    try {
        // Find user
        console.log(`\n📧 Looking up user: ${email}`);
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                passwordHash: true,
                globalRole: true,
            }
        });

        if (!user) {
            console.log('❌ USER NOT FOUND');
            return;
        }

        console.log('✅ User found:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.globalRole}`);
        console.log(`   Password Hash: ${user.passwordHash ? 'EXISTS' : 'MISSING'}`);

        if (!user.passwordHash) {
            console.log('\n❌ No password hash in database!');
            return;
        }

        // Test password
        console.log(`\n🔑 Testing password: "${password}"`);
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (isValid) {
            console.log('✅ PASSWORD CORRECT - Login should work!');
        } else {
            console.log('❌ PASSWORD INCORRECT - Hash does not match');
            console.log('\nPossible causes:');
            console.log('1. Password was changed and hash not updated');
            console.log('2. Hash was created with different bcrypt rounds');
            console.log('3. Password in database is for a different password');

            // Generate new hash for comparison
            console.log('\n🔧 Generating new hash for this password...');
            const newHash = await bcrypt.hash(password, 10);
            console.log('New hash generated. To fix, run:');
            console.log(`\nUPDATE "users" SET "passwordHash" = '${newHash}' WHERE email = '${email}';`);
        }

        console.log('\n' + '='.repeat(60));

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
