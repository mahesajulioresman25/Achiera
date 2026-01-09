import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixQrisPath() {
    console.log('Fixing Rasa Ibu QRIS Image Path...');

    const cleanSettings = {
        "qrisEnabled": true,
        "qrisImageUrl": "/uploads/qris/cmjp1yznb0000lhwqnivhwhvt-1767364757313.jpg",
        "whatsappCrm": "6285157134313",
        "whatsappOrderAdmin": "6285157134313",
        "mdrFees": {
            "SHOPEE": 1.5,
            "GO_FOOD": 0,
            "WHATSAPP": 0,
            "GRAB_FOOD": 0,
            "TIKTOK_SHOP": 0
        },
        "marketplaceFees": {
            "GO_FOOD": 8000,
            "GRAB_FOOD": 8000,
            "SHOPEE": 8000
        }
    };

    await prisma.brand.update({
        where: { slug: 'rasa-ibu' },
        data: {
            paymentSettings: cleanSettings as any
        }
    });

    console.log('Brand update complete!');

    const banks = await prisma.bankAccount.findMany({
        where: { isActive: true }
    });
    console.log('Active Banks:', JSON.stringify(banks, null, 2));

    await prisma.$disconnect();
}

fixQrisPath().catch(console.error);

