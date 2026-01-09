
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const brand = await prisma.brand.findUnique({ where: { slug: 'rasa-ibu' } });
    if (!brand) {
        console.log('Brand rasa-ibu not found');
        return;
    }

    const config = await prisma.flashSaleConfig.findFirst({
        where: { brandId: brand.id }
    });

    if (config) {
        console.log('--- Flash Sale Config Verification ---');
        console.log('ID:', config.id);
        console.log('Has startDate:', 'startDate' in config);
        console.log('Has endDate:', 'endDate' in config);
        console.log('Full config object keys:', Object.keys(config));
    } else {
        console.log('No Flash Sale Config found to verify');
    }

    await prisma.$disconnect();
}
main();
