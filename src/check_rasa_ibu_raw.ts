
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRasaIbu() {
    const b = await prisma.brand.findUnique({
        where: { slug: 'rasa-ibu' },
        select: { paymentSettings: true }
    });

    if (b) {
        console.log('START_SETTINGS');
        console.log(JSON.stringify(b.paymentSettings, null, 2));
        console.log('END_SETTINGS');
    }
    await prisma.$disconnect();
}

checkRasaIbu().catch(console.error);
