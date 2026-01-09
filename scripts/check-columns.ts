import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('--- DB COLUMN CHECK ---');
    try {
        const dbName: any[] = await prisma.$queryRawUnsafe('SELECT DATABASE() as db');
        console.log('Database:', dbName[0].db);

        const columns: any[] = await prisma.$queryRawUnsafe('DESCRIBE orders');
        console.log('Columns in "orders":');
        columns.forEach(c => {
            console.log(` - ${c.Field} (${c.Type})`);
        });

        const hasBrandId = columns.some(c => c.Field === 'brand_id');
        console.log('\nHas brand_id:', hasBrandId);

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
