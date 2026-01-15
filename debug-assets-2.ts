
import { prisma } from './src/lib/prisma';

async function debug() {
    const brandId = 'cmk5kbexl0000q34bzq02mknj';

    console.log('--- ASSET ACCOUNT ENTRIES ---');
    const entries = await prisma.journalEntry.findMany({
        where: {
            account: {
                brandId,
                code: { startsWith: '1-2' }
            }
        },
        include: {
            transaction: true,
            account: true
        }
    });
    console.log(JSON.stringify(entries, null, 2));

    console.log('--- EQUIPMENT ACCOUNT ENTRIES ---');
    const ent2 = await prisma.journalEntry.findMany({
        where: {
            account: {
                brandId,
                code: { contains: 'EQUIPMENT' }
            }
        },
        include: {
            transaction: true,
            account: true
        }
    });
    console.log(JSON.stringify(ent2, null, 2));
}

debug();
