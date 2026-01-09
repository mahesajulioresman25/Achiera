import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBrandSlugs() {
    const brands = await prisma.brand.findMany({
        select: {
            id: true,
            name: true,
            slug: true
        }
    });

    console.log('Brands in database:');
    console.log(JSON.stringify(brands, null, 2));

    await prisma.$disconnect();
}

checkBrandSlugs();
