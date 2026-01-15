
import { prisma } from './src/lib/prisma';

async function debug() {
    const brandId = 'cmk5kbexl0000q34bzq02mknj';

    const accounts = await prisma.ledgerAccount.findMany({
        where: { brandId, code: { startsWith: '1-' } },
        select: { code: true, name: true, type: true }
    });
    console.log(JSON.stringify(accounts, null, 2));
}

debug();
