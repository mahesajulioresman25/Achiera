
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
    if (!brand) return;

    const salaryAccounts = await prisma.ledgerAccount.findMany({
        where: {
            brandId: brand.id,
            name: { contains: 'Gaji' }
        }
    });

    console.log('Salary Accounts:');
    salaryAccounts.forEach(acc => {
        console.log(`[${acc.code}] ${acc.name} (${acc.type})`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
