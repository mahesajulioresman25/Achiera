
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetRasaIbu() {
    console.log('Resetting Rasa Ibu Payment Settings to Minimal...');

    const minimalSettings = {
        "qrisEnabled": true,
        "whatsappCrm": "6285157134313"
    };

    await prisma.brand.update({
        where: { slug: 'rasa-ibu' },
        data: {
            paymentSettings: minimalSettings as any
        }
    });

    console.log('Reset complete!');
    await prisma.$disconnect();
}

resetRasaIbu().catch(console.error);
