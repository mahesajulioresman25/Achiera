const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BRAND_ID = 'cmjx3qor60000jp954nkba43d';

async function main() {
    const products = await prisma.frozenProduct.findMany({
        where: {
            category: {
                brandId: BRAND_ID
            }
        },
        include: {
            category: true,
            variants: true
        }
    });

    console.log('Total Products found:', products.length);
    products.forEach(p => {
        console.log(`- [${p.inventoryType}] ${p.name} (Slug: ${p.slug}) | Category: ${p.category?.name}`);
    });
}

main().finally(() => prisma.$disconnect());
