import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function detailedCheck() {
    console.log('='.repeat(60));
    console.log('DETAILED BRAND CHECK');
    console.log('='.repeat(60));

    const brands = await prisma.brand.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true
        },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`\nTotal brands: ${brands.length}\n`);

    brands.forEach((brand, i) => {
        console.log(`${i + 1}. Name: "${brand.name}"`);
        console.log(`   Slug: "${brand.slug}"`);
        console.log(`   ID: ${brand.id}`);
        console.log(`   Created: ${brand.createdAt.toISOString()}`);
        console.log(`   Dashboard URL: /dashboard/${brand.slug}`);
        console.log('');
    });

    // Check for any brand with slug "all"
    const allBrand = brands.find(b => b.slug === 'all');
    if (allBrand) {
        console.log('⚠️  WARNING: Found brand with slug "all"!');
        console.log(`   This will conflict with routing.`);
        console.log(`   Brand: ${allBrand.name}`);
    }

    await prisma.$disconnect();
}

detailedCheck();
