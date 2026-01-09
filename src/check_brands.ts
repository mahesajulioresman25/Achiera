import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBrands() {
    console.log('🔍 Checking Brands...');
    const brands = await prisma.brand.findMany();
    brands.forEach(b => {
        console.log(`Brand: "${b.name}" | Slug: "${b.slug}" | ID: ${b.id}`);
    });

    const rasaIbu = await prisma.brand.findFirst({ where: { name: { contains: 'Rasa Ibu' } } });
    const merch = await prisma.brand.findFirst({ where: { name: { contains: 'Merch' } } });

    console.log('\n--- TARGETS ---');
    console.log('Rasa Ibu Found:', rasaIbu ? `YES (${rasaIbu.id})` : 'NO');
    console.log('Merch Found:', merch ? `YES (${merch.id})` : 'NO');

    await prisma.$disconnect();
}

checkBrands();
