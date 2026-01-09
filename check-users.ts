
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    console.log('🔍 Checking Users in Database...');
    try {
        const users = await prisma.user.findMany({
            take: 5,
            select: { id: true, email: true, name: true, role: true }
        });

        if (users.length === 0) {
            console.log('⚠️ No users found in this database.');
        } else {
            console.log('✅ Users FOUND:', users);
        }
    } catch (e) {
        console.error('❌ Connection Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
