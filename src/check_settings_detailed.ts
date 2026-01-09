
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBrandSettings() {
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true, name: true, paymentSettings: true }
    });

    if (brand) {
        const settings = brand.paymentSettings as any;
        console.log(`Brand: ${brand.name}`);
        console.log(`qrisEnabled: ${settings?.qrisEnabled}`);
        console.log(`qrisImageUrl: ${settings?.qrisImageUrl}`);
        console.log(`whatsappCrm: ${settings?.whatsappCrm}`);
        console.log(`whatsappOrderAdmin: ${settings?.whatsappOrderAdmin}`);
        console.log('Full Settings:', JSON.stringify(settings, null, 2));
    } else {
        console.log('Brand not found');
    }

    await prisma.$disconnect();
}

checkBrandSettings().catch(console.error);
