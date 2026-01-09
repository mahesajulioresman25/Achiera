
import { prisma } from './lib/prisma';

async function listBrands() {
    const brands = await prisma.brand.findMany({
        select: { id: true, name: true, slug: true, paymentSettings: true }
    });

    console.log('--- ALL BRANDS ---');
    brands.forEach(b => {
        console.log(`Name: ${b.name}`);
        console.log(`Slug: ${b.slug}`);
        console.log(`ID: ${b.id}`);
        console.log(`Settings: ${JSON.stringify(b.paymentSettings, null, 2)}`);
        console.log('------------------');
    });

    await prisma.$disconnect();
}

listBrands().catch(console.error);
