
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBrandSettings() {
    const brandSlug = 'rasa-ibu';
    const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true, name: true, paymentSettings: true }
    });

    if (brand) {
        console.log(`Brand: ${brand.name} (${brand.id})`);
        console.log('Payment Settings:', JSON.stringify(brand.paymentSettings, null, 2));
    } else {
        console.log('Brand not found');
    }

    await prisma.$disconnect();
}

checkBrandSettings().catch(console.error);
