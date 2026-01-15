
import { prisma } from './src/lib/prisma';

async function debug() {
    const brandId = 'cmk5kbexl0000q34bzq02mknj';

    console.log('--- INVESTMENT TRANSACTIONS ---');
    const txs = await prisma.journalTransaction.findMany({
        where: {
            brandId,
            description: { contains: 'Aset' }
        },
        include: {
            entries: {
                include: { account: true }
            }
        }
    });
    console.log(JSON.stringify(txs, null, 2));
}

debug();
