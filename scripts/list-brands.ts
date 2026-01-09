import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listBrands() {
    console.log('--- All Brands ---');
    const brands = await prisma.brand.findMany({
        select: { id: true, name: true, slug: true }
    });

    brands.forEach(b => {
        console.log(`- Name: ${b.name}, Slug: ${b.slug}, ID: ${b.id}`);
    });

    await prisma.$disconnect();
}

listBrands().catch(console.error);
