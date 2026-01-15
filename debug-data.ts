
import { prisma } from './src/lib/prisma';

async function debug() {
    const brandId = 'cmk5kbexl0000q34bzq02mknj'; // ID I saw earlier

    console.log('--- LEDGER ACCOUNTS ---');
    const accounts = await prisma.ledgerAccount.findMany({
        where: { brandId },
        select: { code: true, name: true, type: true }
    });
    console.log(JSON.stringify(accounts, null, 2));

    console.log('--- RECENT TRANSACTIONS ---');
    const txs = await prisma.journalTransaction.findMany({
        where: { brandId },
        take: 10,
        orderBy: { date: 'desc' },
        include: {
            entries: {
                include: { account: true }
            }
        }
    });
    console.log(JSON.stringify(txs, null, 2));
}

debug();
