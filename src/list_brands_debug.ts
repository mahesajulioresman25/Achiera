import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listBrands() {
    const brands = await prisma.brand.findMany({ select: { id: true, name: true, slug: true } });
    console.log(JSON.stringify(brands, null, 2));
    await prisma.$disconnect();
}

listBrands();
