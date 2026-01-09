
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const brandSlug = 'rasa-ibu';
    console.log(`Searching for brand: ${brandSlug}`);

    const brand = await prisma.brand.findFirst({
        where: {
            OR: [{ slug: brandSlug }, { id: brandSlug }]
        }
    });

    if (!brand) return;

    console.log(`Found Brand: ${brand.name} (${brand.id})`);

    console.log(`\n--- CHECK FILTER: category.brandId = ${brand.id} ---`);
    const filtered = await prisma.frozenProduct.findMany({
        where: {
            category: {
                brandId: brand.id
            }
        },
        include: { category: true },
        take: 5
    });
    console.log(`Found ${filtered.length} products linked to brand.`);
    filtered.forEach(p => console.log(` - ${p.name} (Cat: ${p.category?.name})`));

    console.log(`\n--- CHECK SAMPLE PRODUCTS ---`);
    const samples = await prisma.frozenProduct.findMany({
        where: {
            name: { contains: 'sample' }
        },
        include: { category: true }
    });

    console.log(`Found ${samples.length} 'sample' products.`);
    samples.forEach(p => {
        console.log(` - ${p.name} | ID: ${p.id} | CategoryID: ${p.categoryId}`);
        if (p.category) {
            console.log(`   -> Category: ${p.category.name} | BrandID: ${p.category.brandId}`);
            console.log(`   -> Match? ${p.category.brandId === brand.id ? 'YES' : 'NO'}`);
        } else {
            console.log(`   -> ORPHAN (No Category)`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
