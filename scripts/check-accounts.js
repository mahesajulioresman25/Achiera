
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
    if (!brand) {
        console.log('Brand not found');
        return;
    }

    const accounts = await prisma.ledgerAccount.findMany({
        where: { brandId: brand.id },
        orderBy: { code: 'asc' }
    });

    console.log('Accounts for Rasa Ibu:');
    accounts.forEach(acc => {
        console.log(`[${acc.code}] ${acc.name} (${acc.type}) - Balance: ${acc.balance}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
