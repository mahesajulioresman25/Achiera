
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findFirst({ where: { name: 'Rasa Ibu' } });
    if (!brand) return;

    const account = await prisma.ledgerAccount.findUnique({
        where: { brandId_code: { brandId: brand.id, code: '5-2000' } }
    });

    if (!account) {
        console.log('Account 5-2000 not found');
        return;
    }

    const entries = await prisma.journalEntry.findMany({
        where: { accountId: account.id },
        include: { transaction: true },
        take: 10
    });

    console.log(`Entries for [${account.code}] ${account.name}: ${entries.length}`);
    entries.forEach(e => {
        console.log(`${e.transaction.date.toISOString()} | Debit: ${e.debit} | Credit: ${e.credit} | ${e.description}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
