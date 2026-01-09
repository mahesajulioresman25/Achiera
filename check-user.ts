// Check User Script
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    const email = 'mahesajulioresman25@achiera.com';
    console.log(`🔍 Checking database for user: ${email}...\n`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                globalRole: true,
                createdAt: true
            }
        });

        if (user) {
            console.log('✅ User FOUND!');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.globalRole}`);
            console.log(`   Created At: ${user.createdAt}`);
        } else {
            console.log('❌ User NOT FOUND in database.');
        }

        const totalUsers = await prisma.user.count();
        console.log(`\n📊 Total users in database: ${totalUsers}`);

    } catch (error) {
        console.error('❌ Error checking user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
