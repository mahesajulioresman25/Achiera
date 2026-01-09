import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyBanks() {
    console.log('Verifying Bank Accounts...\n');
    const banks = await prisma.bankAccount.findMany({
        include: {
            brand: {
                select: { name: true, slug: true }
            }
        }
    });

    console.log(JSON.stringify(banks, null, 2));
    await prisma.$disconnect();
}

verifyBanks();
